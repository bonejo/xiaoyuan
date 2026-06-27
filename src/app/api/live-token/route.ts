import { GoogleGenAI, Modality } from "@google/genai";
import {
  COMPANION_SYSTEM_PROMPT,
  VOICE_TOOL_INSTRUCTION,
} from "@/lib/ai/duoduoPrompt";
import { LIVE_MODEL, LIVE_VOICE } from "@/lib/voice/config";
import { VOICE_TOOLS } from "@/lib/voice/tools";

/**
 * 发放 Gemini Live 的临时令牌（ephemeral token）。
 * 密钥只在服务端使用；浏览器拿到的是短期、单次、受限的令牌。
 * 会话配置（嗓音 + 小圆人格）锁在令牌里，前端无法篡改。
 */
export async function POST() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return Response.json(
      { error: "未配置 GEMINI_API_KEY" },
      { status: 500 }
    );
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const now = Date.now();

    const token = await ai.authTokens.create({
      config: {
        uses: 1,
        // 30 分钟内可在该连接上发消息；1 分钟内必须发起会话
        expireTime: new Date(now + 30 * 60 * 1000).toISOString(),
        newSessionExpireTime: new Date(now + 60 * 1000).toISOString(),
        liveConnectConstraints: {
          model: LIVE_MODEL,
          config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: { voiceName: LIVE_VOICE },
              },
            },
            systemInstruction: {
              parts: [
                { text: COMPANION_SYSTEM_PROMPT + "\n\n" + VOICE_TOOL_INSTRUCTION },
              ],
            },
            // 联网搜索 + 自定义函数工具共存
            tools: [{ googleSearch: {} }, ...VOICE_TOOLS],
          },
        },
        httpOptions: { apiVersion: "v1alpha" },
      },
    });

    return Response.json({ token: token.name, model: LIVE_MODEL });
  } catch (err) {
    console.error("live-token failed:", err);
    const message = err instanceof Error ? err.message : String(err);
    return Response.json(
      { error: "无法创建语音令牌", detail: message },
      { status: 502 }
    );
  }
}
