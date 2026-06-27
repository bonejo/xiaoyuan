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
// 默认开启：目标设备是 iPhone（外放+麦克风），不开的话麦克风会录到小圆自己的声音，
// 被 Gemini 当成"孩子插话"而打断，导致小圆说一秒就停。iPhone 的回声消除很好，开启即可。
// ⚠️ 仅在 Windows/Chrome 桌面调试时，开启可能把音频路由到"通信设备"导致没声音；
// 那种情况下用环境变量 NEXT_PUBLIC_VOICE_ECHO_CANCEL=false 临时关闭。
export const ECHO_CANCEL =
  process.env.NEXT_PUBLIC_VOICE_ECHO_CANCEL !== "false";
