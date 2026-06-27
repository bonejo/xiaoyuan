/**
 * Live 语音相关配置（服务端 + 客户端共用常量）。
 */

// 原生音频模型：中文自动识别、音质自然、内置 VAD/打断。
// 可用 .env.local 的 GEMINI_LIVE_MODEL 覆盖。
export const LIVE_MODEL =
  process.env.GEMINI_LIVE_MODEL ??
  process.env.NEXT_PUBLIC_GEMINI_LIVE_MODEL ??
  "gemini-2.5-flash-native-audio-preview-12-2025";

// 小圆的嗓音。可在 AI Studio 试听后改这里 / 用 .env 覆盖。
// 常见预设：Aoede / Kore / Leda / Puck / Charon / Fenrir / Orus / Zephyr ...
export const LIVE_VOICE =
  process.env.GEMINI_LIVE_VOICE ??
  process.env.NEXT_PUBLIC_GEMINI_LIVE_VOICE ??
  "Aoede";

// 音频采样率（Gemini Live 规定）
export const INPUT_SAMPLE_RATE = 16000; // 发送给模型：16kHz PCM16
export const OUTPUT_SAMPLE_RATE = 24000; // 模型返回：24kHz PCM16

// 闲置多久自动挂断 Live 会话（控制计费）
export const IDLE_HANGUP_MS = 45_000;

// 是否开启麦克风回声消除。
// ⚠️ Windows 上开启 echoCancellation 会把 Chrome 音频强制路由到"通信设备"，
// 常导致通话期间整体没声音。所以默认关闭，先保证能听到声音。
// （将来墙上 iPad 同时开麦克风+外放时，可能需要重新开启以防小圆听到自己。）
export const ECHO_CANCEL =
  process.env.NEXT_PUBLIC_VOICE_ECHO_CANCEL === "true";
