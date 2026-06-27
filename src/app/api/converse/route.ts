import { getAIProvider, type ChatMessage } from "@/lib/ai/provider";

export async function POST(request: Request) {
  let payload: { messages?: ChatMessage[] };
  try {
    payload = await request.json();
  } catch {
    return Response.json({ error: "请求格式不对" }, { status: 400 });
  }

  const messages = payload.messages;
  if (!Array.isArray(messages) || messages.length === 0) {
    return Response.json({ error: "缺少对话内容" }, { status: 400 });
  }

  try {
    const provider = getAIProvider();
    const reply = await provider.converse(messages);
    return Response.json({ reply, provider: provider.name });
  } catch (err) {
    console.error("converse failed:", err);
    return Response.json(
      { error: "小圆暂时联系不上啦，待会儿再试试～" },
      { status: 502 }
    );
  }
}
