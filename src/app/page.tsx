"use client";

import { useEffect, useRef, useState } from "react";
import Character, { type Mood } from "@/components/Character";
import Hud from "@/components/Hud";
import CountingVisual, { type VisualSpec } from "@/components/CountingVisual";
import { LiveSession, type LiveStatus } from "@/lib/voice/liveSession";
import { useProgress } from "@/lib/progress/store";
import { useWakeLock } from "@/lib/useWakeLock";
import { UI, isLang, type Lang } from "@/lib/i18n";
import type { Subject } from "@/lib/progress/types";

type Msg = { role: "user" | "assistant"; content: string };

const SUBJECT_KEYS: Subject[] = ["math", "english", "chinese", "french", "social"];

// 校验/规整国家两位代码（白名单：只允许两位字母，渲染国旗库）
function normalizeFlag(code?: string): string | null {
  if (typeof code !== "string") return null;
  const c = code.trim().toLowerCase();
  return /^[a-z]{2}$/.test(c) ? c : null;
}

// 从旗帜 emoji（两个 Regional Indicator）解码出国家代码，如 🇫🇷 → "fr"
function flagCodeFromEmoji(s: string): string | null {
  const cps = [...s].map((ch) => ch.codePointAt(0) ?? 0);
  if (cps.length === 2 && cps.every((cp) => cp >= 0x1f1e6 && cp <= 0x1f1ff)) {
    return cps.map((cp) => String.fromCharCode(cp - 0x1f1e6 + 97)).join("");
  }
  return null;
}

export default function Home() {
  // 文字后备通道（M1 保留）
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);

  // 语音（M2）
  const [voice, setVoice] = useState<LiveStatus | "idle">("idle");
  const [speaking, setSpeaking] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [mood, setMood] = useState<Mood>("warm");
  const [voiceVisual, setVoiceVisual] = useState<VisualSpec | null>(null);
  const [thing, setThing] = useState<{ emoji: string; label?: string; flag?: string } | null>(null);
  const [lang, setLang] = useState<Lang>("zh");
  const sessionRef = useRef<LiveSession | null>(null);
  const speakTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const moodTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const visualTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const thingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { recordAnswer, awardStars } = useProgress();
  useWakeLock();
  const s = UI[lang]; // 当前语言的界面文案

  function celebrate() {
    if (moodTimer.current) clearTimeout(moodTimer.current);
    setMood("celebrate");
    moodTimer.current = setTimeout(() => setMood("warm"), 2500);
  }

  // 小圆在语音里给星星（M3C 工具调用）
  function handleAward(args: { subject?: string; stars?: number; correct?: boolean }) {
    const n = Math.max(1, Math.min(5, Math.round(args.stars ?? 1)));
    const subject = SUBJECT_KEYS.find((s) => s === args.subject);
    if (subject) recordAnswer(subject, args.correct !== false, n);
    else awardStars(n);
    celebrate();
  }

  // 小圆在语音里让屏幕画图（M3C 工具调用）
  function handleVisual(args: Record<string, unknown>) {
    const spec: VisualSpec = {
      item: typeof args.item === "string" ? args.item : "⭐",
      total: typeof args.total === "number" ? args.total : undefined,
      leaving: typeof args.leaving === "number" ? args.leaving : undefined,
      parts: Array.isArray(args.parts)
        ? (args.parts as unknown[]).filter((x): x is number => typeof x === "number")
        : undefined,
      groups: typeof args.groups === "number" ? args.groups : undefined,
      perGroup: typeof args.perGroup === "number" ? args.perGroup : undefined,
    };
    setVoiceVisual(spec);
    if (visualTimer.current) clearTimeout(visualTimer.current);
    visualTimer.current = setTimeout(() => setVoiceVisual(null), 8000);
  }

  // 小圆切换对话语言 → 屏幕文字也切（M3C 工具调用）
  function handleSetLanguage(l: string) {
    if (isLang(l)) setLang(l);
  }

  // 小圆把聊到的事物显示在屏幕上（M3C 工具调用）
  function handleShowThing(args: { emoji?: string; label?: string; flag?: string }) {
    const emoji = typeof args.emoji === "string" && args.emoji ? args.emoji : "✨";
    // 国旗：优先用传入的国家代码，否则从旗帜 emoji 解码 → 用国旗库渲染真旗子（跨平台都准）
    const flag = normalizeFlag(args.flag) ?? flagCodeFromEmoji(emoji);
    setThing({ emoji, label: args.label, flag: flag ?? undefined });
    if (thingTimer.current) clearTimeout(thingTimer.current);
    thingTimer.current = setTimeout(() => setThing(null), 9000);
  }

  // 开发期：暴露工具回调，便于没接语音时验证语言切换/显示事物
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") {
      (window as unknown as Record<string, unknown>).__duoduoUI = {
        setLanguage: handleSetLanguage,
        showThing: handleShowThing,
      };
    }
  }, []);

  const lastReply = messages.filter((m) => m.role === "assistant").at(-1)?.content;
  const voiceActive = voice !== "idle" && voice !== "closed" && voice !== "error";

  async function toggleVoice() {
    if (voiceActive) {
      sessionRef.current?.stop();
      sessionRef.current = null;
      return;
    }
    setErrorMsg(null);
    const session = new LiveSession({
      onStatus: (s) => {
        setVoice(s);
        if (s === "closed" || s === "error") {
          setSpeaking(false);
          sessionRef.current = null;
        }
      },
      onError: (msg) => {
        setErrorMsg(msg);
        setVoice("error");
      },
      // 用小圆输出音量驱动口型：有声音才张嘴
      onLevel: (level) => setSpeaking(level > 0.02),
      onAward: handleAward,
      onVisual: handleVisual,
      onSetLanguage: handleSetLanguage,
      onShowThing: handleShowThing,
    });
    sessionRef.current = session;
    try {
      await session.start();
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : "语音启动失败");
      setVoice("error");
      sessionRef.current = null;
    }
  }

  async function send() {
    const text = input.trim();
    if (!text || thinking) return;
    const next: Msg[] = [...messages, { role: "user", content: text }];
    setMessages(next);
    setInput("");
    setThinking(true);
    try {
      const res = await fetch("/api/converse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next }),
      });
      const data = await res.json();
      const reply: string = data.reply ?? data.error ?? "小圆没听清楚～";
      setMessages([...next, { role: "assistant", content: reply }]);
      flashSpeaking(reply);
    } catch {
      setMessages([...next, { role: "assistant", content: "哎呀，小圆走丢了一下，再说一次好吗？" }]);
    } finally {
      setThinking(false);
    }
  }

  // 文字通道用回复长度模拟说话时长（语音通道由真实音量驱动）
  function flashSpeaking(reply: string) {
    if (speakTimer.current) clearTimeout(speakTimer.current);
    setSpeaking(true);
    const ms = Math.min(6000, 1200 + reply.length * 70);
    speakTimer.current = setTimeout(() => setSpeaking(false), ms);
  }

  const bubbleText = errorMsg
    ? errorMsg
    : voice === "connecting"
    ? s.connecting
    : voice === "listening"
    ? s.listening
    : voice === "speaking"
    ? s.speaking
    : thinking
    ? s.thinking
    : lastReply ?? s.greeting;

  return (
    <main className="stage">
      <Hud />

      <section className="center">
        <Character speaking={speaking} thinking={thinking} mood={mood} />

        {voiceVisual && (
          <div className="voice-visual">
            <button
              className="voice-visual-close"
              onClick={() => setVoiceVisual(null)}
              aria-label="收起"
            >
              ✕
            </button>
            <CountingVisual spec={voiceVisual} />
          </div>
        )}

        {thing && (
          <div className="thing-card">
            <button
              className="voice-visual-close"
              onClick={() => setThing(null)}
              aria-label="收起"
            >
              ✕
            </button>
            {thing.flag ? (
              // 真实国旗（来自只供国旗的安全图库，跨平台都正确）
              // eslint-disable-next-line @next/next/no-img-element
              <img
                className="thing-flag"
                src={`https://flagcdn.com/${thing.flag}.svg`}
                alt={thing.label ?? thing.flag}
              />
            ) : (
              <div className="thing-emoji">{thing.emoji}</div>
            )}
            {thing.label && <div className="thing-label">{thing.label}</div>}
          </div>
        )}

        <p className="bubble">{bubbleText}</p>

        {/* 语音主按钮（挑战在交谈中由小圆发起） */}
        <button
          className={`voice-btn ${voiceActive ? "is-on" : ""}`}
          onClick={toggleVoice}
          disabled={voice === "connecting"}
        >
          {voiceActive ? s.stop : s.talk}
        </button>
      </section>

      {/* 文字后备通道（M1 保留，便于无麦克风时测试） */}
      <footer className="composer">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder={s.placeholder}
          aria-label="对小圆说话"
        />
        <button onClick={send} disabled={thinking || !input.trim()}>
          {s.send}
        </button>
      </footer>
    </main>
  );
}
