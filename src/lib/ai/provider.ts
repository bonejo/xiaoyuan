/**
 * AI 大脑抽象层。
 * MVP 用 Gemini（符合 Jon 选定的方案），但接口做成可替换，
 * 以后想换 Claude / OpenAI 只需新增一个实现。
 *
 * 没有配置 GEMINI_API_KEY 时自动回退到 MockProvider，
 * 让骨架在没有密钥时也能跑起来、便于先验证 UI。
 */
import { COMPANION_SYSTEM_PROMPT } from "./duoduoPrompt";

export type ChatRole = "user" | "assistant";
export interface ChatMessage {
  role: ChatRole;
  content: string;
}

export interface AIProvider {
  readonly name: string;
  converse(history: ChatMessage[]): Promise<string>;
}

const GEMINI_MODEL = process.env.GEMINI_MODEL ?? "gemini-2.5-flash";

class GeminiProvider implements AIProvider {
  readonly name = "gemini";
  constructor(private readonly apiKey: string) {}

  async converse(history: ChatMessage[]): Promise<string> {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;
    const body = {
      systemInstruction: { parts: [{ text: COMPANION_SYSTEM_PROMPT }] },
      contents: history.map((m) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
      })),
      // 联网搜索：让小圆能答今天的比赛/新闻等实时问题
      tools: [{ googleSearch: {} }],
      generationConfig: {
        temperature: 0.9,
        maxOutputTokens: 400, // 联网答案略长，放宽一点
        // 关闭 2.5-flash 的内部"思考":儿童短对话不需要推理，
        // 否则思考会吃掉 token 配额导致回复被截断（且更慢更贵）。
        thinkingConfig: { thinkingBudget: 0 },
      },
    };

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": this.apiKey,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const detail = await res.text();
      throw new Error(`Gemini API ${res.status}: ${detail}`);
    }

    const data = await res.json();
    const text: string | undefined =
      data?.candidates?.[0]?.content?.parts
        ?.map((p: { text?: string }) => p.text ?? "")
        .join("")
        .trim();

    return text && text.length > 0
      ? text
      : "嗯……我刚刚走神啦，你能再说一次吗？";
  }
}

/** 没有密钥时用：让 UI 能跑通的友好假回复。 */
class MockProvider implements AIProvider {
  readonly name = "mock";
  async converse(history: ChatMessage[]): Promise<string> {
    const last = history.filter((m) => m.role === "user").at(-1)?.content ?? "";
    return `（演示模式）你刚才说："${last}"。我是小圆！等 Jon 配好 Gemini 密钥，我就能真正和你聊天啦～`;
  }
}

let cached: AIProvider | null = null;

export function getAIProvider(): AIProvider {
  if (cached) return cached;
  const key = process.env.GEMINI_API_KEY;
  cached = key ? new GeminiProvider(key) : new MockProvider();
  return cached;
}
