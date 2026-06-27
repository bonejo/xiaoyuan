# 小圆 · AI 成长伙伴 (Duoduo AI Companion)

陪伴 7 岁小朋友"多多"的墙上 iPad AI 成长伙伴 —— 伙伴叫"小圆"。
语音优先、对话即学习、星星 + 徽章激励。

## 当前进度（详见 [PLAN.md](PLAN.md)）

- ✅ **M1 骨架** — 全屏 OpenMoji 圆脸（口型/表情/头部动作）+ 文字对话跑通，AI 大脑抽象层（Gemini，可替换）
- ⬜ **M2 语音** — 唤醒词"Hey 小圆" + VAD 自然断句 + Gemini Live 实时语音 + 选中文童声 + 口型由音频驱动
- ⬜ **M3 对话即学习 + 视觉化 + 星星/徽章** — 穿插出题判题、程序自绘学习图示（如 3×5 苹果）、徽章段位、Supabase 落库
- ⬜ **M4 兴趣引擎 + 生成图 + 主动唤醒** — 动态兴趣权重、AI 生成图示（如蜥蜴）、主动发起、奖励解锁与庆祝

## 本地运行

```bash
npm install
npm run dev        # http://localhost:3000
```

没有密钥时会进入"演示模式"（假回复），UI 照常可用。

## 接入真实 Gemini

1. 在 [Google AI Studio](https://aistudio.google.com/apikey) 申请密钥
2. 复制 `.env.local.example` 为 `.env.local`，填入 `GEMINI_API_KEY`
3. 重启 `npm run dev`

## 关键设计约定

- **穿插问题"看孩子意愿、偶尔加入"**，绝不每句都塞 —— 见 `src/lib/ai/duoduoPrompt.ts`
- **AI 大脑可替换** —— `src/lib/ai/provider.ts` 的 `AIProvider` 接口，现为 Gemini，可换 Claude/OpenAI
- **掌握度对孩子只显示徽章**（青铜/白银/黄金/钻石），内部用 0–100 计算（M3 实现）
- 墙上 iPad 锁定靠系统的"引导式访问"，不是代码功能

## 素材署名

角色表情使用 [OpenMoji](https://openmoji.org/) 的 smileys-emotion 圆脸，
许可 **CC BY-SA 4.0**。SVG 文件位于 `public/openmoji/`。

## 目录

```
src/
  app/
    page.tsx              全屏主界面（角色 + 气泡 + 输入）
    layout.tsx            全屏 viewport 设置
    globals.css           舞台/角色/说话闪烁样式
    api/converse/route.ts 对话 API
  components/
    Character.tsx         卡通角色（内联 SVG）
  lib/ai/
    duoduoPrompt.ts       小圆人格 system prompt（含孩子名"多多"）
    provider.ts           AI 大脑抽象 + Gemini + 演示回退
```
