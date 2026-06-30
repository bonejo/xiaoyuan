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
export async function POST(request: Request) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return Response.json(
      { error: "未配置 GEMINI_API_KEY" },
      { status: 500 }
    );
  }

  // 客户端把多多最近的喜好摘要传进来，注入人格，让小圆"记得"
  let interests = "";
  try {
    const body = await request.json();
    if (typeof body?.interests === "string") interests = body.interests.slice(0, 500);
  } catch {
    // 没有 body 也可以
  }

  const systemText =
    COMPANION_SYSTEM_PROMPT +
    "\n\n" +
    VOICE_TOOL_INSTRUCTION +
    (interests
      ? `\n\n# 多多的喜好（记住并主动融入对话，把学习藏进他喜欢的话题）\n${interests}`
      : "");

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
              parts: [{ text: systemText }],
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
