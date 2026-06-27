import { GoogleGenAI, Modality } from "@google/genai";
import { AudioPlayer } from "./audioPlayer";
import { INPUT_SAMPLE_RATE, IDLE_HANGUP_MS, ECHO_CANCEL } from "./config";

export type LiveStatus =
  | "connecting"
  | "listening" // 在听多多说
  | "speaking" // 小圆在说
  | "closed"
  | "error";

export interface LiveCallbacks {
  onStatus?: (s: LiveStatus) => void;
  onError?: (msg: string) => void;
  onLevel?: (level: number) => void; // 小圆输出音量 0~1，驱动口型
  // 工具调用（M3C）：小圆在对话里给星星 / 屏幕画图
  onAward?: (args: {
    subject?: string;
    stars?: number;
    correct?: boolean;
  }) => void;
  onVisual?: (args: Record<string, unknown>) => void;
  onSetLanguage?: (lang: string) => void;
  onShowThing?: (args: { emoji?: string; label?: string }) => void;
}

// 只取我们用到的字段，避免被 SDK 预览版类型变动影响
type LiveMessage = {
  data?: string;
  serverContent?: {
    interrupted?: boolean;
    turnComplete?: boolean;
    modelTurn?: {
      parts?: Array<{ inlineData?: { data?: string; mimeType?: string } }>;
    };
  };
  toolCall?: {
    functionCalls?: Array<{
      id?: string;
      name?: string;
      args?: Record<string, unknown>;
    }>;
  };
};
type LiveSessionHandle = {
  sendRealtimeInput: (input: {
    audio: { data: string; mimeType: string };
  }) => void;
  sendToolResponse: (r: {
    functionResponses: Array<{ id?: string; name?: string; response: unknown }>;
  }) => void;
  close: () => void;
};

export class LiveSession {
  private session?: LiveSessionHandle;
  private player?: AudioPlayer;
  private micCtx?: AudioContext;
  private micStream?: MediaStream;
  private workletNode?: AudioWorkletNode;
  private idleTimer?: ReturnType<typeof setTimeout>;
  private levelRaf?: number;
  private closed = false;

  constructor(private cb: LiveCallbacks) {}

  /** 必须在用户手势（点击）里调用，否则 iOS 不让出声/采音 */
  async start() {
    this.cb.onStatus?.("connecting");

    // 1) 取临时令牌
    const res = await fetch("/api/live-token", { method: "POST" });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      throw new Error(d.detail || d.error || "无法获取语音令牌");
    }
    const { token, model } = (await res.json()) as {
      token: string;
      model: string;
    };

    // 2) 播放器（手势内创建并 resume）
    this.player = new AudioPlayer();
    await this.player.resume();

    // 3) 连接 Live（令牌已锁定嗓音 + 人格）
    const ai = new GoogleGenAI({
      apiKey: token,
      httpOptions: { apiVersion: "v1alpha" },
    });
    const session = await ai.live.connect({
      model,
      config: { responseModalities: [Modality.AUDIO] },
      callbacks: {
        onopen: () => {},
        onmessage: (m) => this.handleMessage(m as unknown as LiveMessage),
        onerror: (e: { message?: string }) =>
          this.cb.onError?.(e?.message ?? "语音连接出错"),
        onclose: () => {
          if (!this.closed) this.stop();
        },
      },
    });
    this.session = session as unknown as LiveSessionHandle;

    // 4) 麦克风
    await this.startMic();

    // 5) 口型音量循环
    this.startLevelLoop();

    this.cb.onStatus?.("listening");
    this.resetIdle();
  }

  private async startMic() {
    this.micStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        channelCount: 1,
        // 默认关闭：避免 Windows 把 Chrome 音频路由到"通信设备"导致没声音
        echoCancellation: ECHO_CANCEL,
        noiseSuppression: ECHO_CANCEL,
        autoGainControl: ECHO_CANCEL,
      },
    });
    this.micCtx = new AudioContext({ sampleRate: INPUT_SAMPLE_RATE });
    await this.micCtx.audioWorklet.addModule("/pcm-recorder.worklet.js");

    const src = this.micCtx.createMediaStreamSource(this.micStream);
    this.workletNode = new AudioWorkletNode(this.micCtx, "pcm-recorder");
    this.workletNode.port.onmessage = (ev: MessageEvent) => {
      const b64 = this.toBase64(ev.data as ArrayBuffer);
      try {
        this.session?.sendRealtimeInput({
          audio: { data: b64, mimeType: `audio/pcm;rate=${INPUT_SAMPLE_RATE}` },
        });
      } catch {
        // 连接已关则忽略
      }
    };

    src.connect(this.workletNode);
    // 接一个静音 gain 到输出，保证 worklet 在各浏览器里持续运行（不会真的听到自己）
    const sink = this.micCtx.createGain();
    sink.gain.value = 0;
    this.workletNode.connect(sink).connect(this.micCtx.destination);
  }

  private handleMessage(m: LiveMessage) {
    // 工具调用：小圆给星星 / 屏幕画图
    if (m.toolCall?.functionCalls?.length) {
      const functionResponses = m.toolCall.functionCalls.map((fc) => {
        try {
          if (fc.name === "award_stars") this.cb.onAward?.(fc.args ?? {});
          else if (fc.name === "show_picture") this.cb.onVisual?.(fc.args ?? {});
          else if (fc.name === "set_language")
            this.cb.onSetLanguage?.(String((fc.args ?? {}).lang ?? ""));
          else if (fc.name === "show_thing")
            this.cb.onShowThing?.(fc.args ?? {});
        } catch {
          // 回调出错不应中断会话
        }
        return { id: fc.id, name: fc.name, response: { result: "ok" } };
      });
      try {
        this.session?.sendToolResponse({ functionResponses });
      } catch {
        // 连接已关则忽略
      }
      return;
    }

    const sc = m.serverContent;

    if (sc?.interrupted) {
      this.player?.stopAll(); // 多多插话 → 立刻停下小圆
    }

    // 优先用 parts 里的 inlineData；没有再用便捷字段 m.data，避免重复播放
    const chunks: string[] = [];
    const parts = sc?.modelTurn?.parts ?? [];
    for (const p of parts) {
      const d = p?.inlineData?.data;
      if (typeof d === "string" && p.inlineData?.mimeType?.startsWith("audio")) {
        chunks.push(d);
      }
    }
    if (chunks.length === 0 && typeof m.data === "string") {
      chunks.push(m.data);
    }

    for (const c of chunks) {
      const buf = this.fromBase64(c);
      this.player?.enqueuePCM16(new Int16Array(buf));
    }

    if (chunks.length) {
      this.cb.onStatus?.("speaking");
      this.resetIdle();
    }
    if (sc?.turnComplete) {
      this.cb.onStatus?.("listening");
    }
  }

  private startLevelLoop() {
    const tick = () => {
      if (this.closed) return;
      const level = this.player?.getLevel() ?? 0;
      this.cb.onLevel?.(level);
      this.levelRaf = requestAnimationFrame(tick);
    };
    this.levelRaf = requestAnimationFrame(tick);
  }

  private resetIdle() {
    if (this.idleTimer) clearTimeout(this.idleTimer);
    this.idleTimer = setTimeout(() => this.stop(), IDLE_HANGUP_MS);
  }

  stop() {
    if (this.closed) return;
    this.closed = true;
    if (this.idleTimer) clearTimeout(this.idleTimer);
    if (this.levelRaf) cancelAnimationFrame(this.levelRaf);
    this.micStream?.getTracks().forEach((t) => t.stop());
    void this.micCtx?.close();
    this.player?.close();
    try {
      this.session?.close();
    } catch {
      // 忽略
    }
    this.cb.onStatus?.("closed");
  }

  // --- base64 helpers ---
  private toBase64(buf: ArrayBuffer): string {
    const bytes = new Uint8Array(buf);
    let bin = "";
    const chunk = 0x8000;
    for (let i = 0; i < bytes.length; i += chunk) {
      bin += String.fromCharCode(...bytes.subarray(i, i + chunk));
    }
    return btoa(bin);
  }
  private fromBase64(b64: string): ArrayBuffer {
    const bin = atob(b64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return bytes.buffer;
  }
}
