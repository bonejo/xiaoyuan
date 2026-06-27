import { OUTPUT_SAMPLE_RATE } from "./config";

/**
 * 播放 Gemini Live 返回的 24kHz PCM16 音频。
 * - 分块顺序排队播放（保持连续不卡顿）
 * - 通过 AnalyserNode 暴露实时音量，用来驱动小圆口型
 * - 被打断（interrupted）时可立刻停止所有已排队音频
 */
export class AudioPlayer {
  private ctx: AudioContext;
  private analyser: AnalyserNode;
  private nextStart = 0;
  private sources = new Set<AudioBufferSourceNode>();
  private timeData: Uint8Array<ArrayBuffer>;
  // 缓冲垫：每块音频至少提前这么多排队，吸收网络抖动，避免块间缝隙产生"嗡嗡"杂音
  private static readonly SCHEDULE_AHEAD = 0.12;

  constructor() {
    this.ctx = new AudioContext({ sampleRate: OUTPUT_SAMPLE_RATE });
    this.analyser = this.ctx.createAnalyser();
    this.analyser.fftSize = 256;
    this.analyser.connect(this.ctx.destination);
    this.timeData = new Uint8Array(new ArrayBuffer(this.analyser.frequencyBinCount));
  }

  /** iOS 需要用户手势后才能出声 */
  async resume() {
    if (this.ctx.state !== "running") await this.ctx.resume();
  }

  enqueuePCM16(int16: Int16Array) {
    const f32 = new Float32Array(int16.length);
    for (let i = 0; i < int16.length; i++) f32[i] = int16[i] / 0x8000;

    const buf = this.ctx.createBuffer(1, f32.length, OUTPUT_SAMPLE_RATE);
    buf.copyToChannel(f32, 0);

    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    src.connect(this.analyser);

    const now = this.ctx.currentTime;
    // 若是首块或发生了断流（排队时间已落后于当前），用缓冲垫重新起一个连续时间线，
    // 而不是紧贴 now 起播（那样会在块边界产生爆音/嗡嗡）。
    if (this.nextStart < now + 0.02) {
      this.nextStart = now + AudioPlayer.SCHEDULE_AHEAD;
    }
    src.start(this.nextStart);
    this.nextStart += buf.duration;

    this.sources.add(src);
    src.onended = () => this.sources.delete(src);
  }

  /** 当前输出音量 RMS（0~1），给口型用 */
  getLevel(): number {
    this.analyser.getByteTimeDomainData(this.timeData);
    let sum = 0;
    for (let i = 0; i < this.timeData.length; i++) {
      const x = (this.timeData[i] - 128) / 128;
      sum += x * x;
    }
    return Math.sqrt(sum / this.timeData.length);
  }

  /** 是否还有音频在播（用来判断小圆是否"在说话"） */
  get isPlaying(): boolean {
    return this.sources.size > 0 || this.nextStart > this.ctx.currentTime;
  }

  /** 打断：立刻停掉所有排队音频 */
  stopAll() {
    for (const s of this.sources) {
      try {
        s.stop();
      } catch {
        // 已结束的源忽略
      }
    }
    this.sources.clear();
    this.nextStart = 0;
  }

  close() {
    this.stopAll();
    void this.ctx.close();
  }
}
