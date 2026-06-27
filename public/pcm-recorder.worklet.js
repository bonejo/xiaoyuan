// 麦克风采集 worklet：把输入音频转成 16-bit PCM 分块发回主线程。
// 采集用的 AudioContext 已设为 16kHz，所以这里只做 Float32 -> Int16，无需重采样。
class PCMRecorderProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this._buf = [];
    this._target = 2048; // 每攒够约 2048 个采样点发一块
  }

  process(inputs) {
    const input = inputs[0];
    if (input && input[0]) {
      const ch = input[0];
      for (let i = 0; i < ch.length; i++) this._buf.push(ch[i]);

      if (this._buf.length >= this._target) {
        const frames = this._buf;
        this._buf = [];
        const pcm = new Int16Array(frames.length);
        for (let i = 0; i < frames.length; i++) {
          const s = Math.max(-1, Math.min(1, frames[i]));
          pcm[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
        }
        // 转移 ArrayBuffer 所有权，避免拷贝
        this.port.postMessage(pcm.buffer, [pcm.buffer]);
      }
    }
    return true; // 保持存活
  }
}

registerProcessor("pcm-recorder", PCMRecorderProcessor);
