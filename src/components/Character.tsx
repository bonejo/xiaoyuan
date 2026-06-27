/**
 * 小圆角色：OpenMoji 圆脸 emoji（smileys-emotion）。
 * 整脸切换实现"会说话"的效果：
 *  - 说话时在 闭嘴/半开/张嘴 之间循环 → 模拟口型
 *  - 不同情绪用不同的圆脸
 *  - 头部动作由 CSS 在外层做（待机轻浮动 / 说话点头 / 思考歪头）
 *
 * M1：说话口型用定时器驱动（假节奏）。
 * M2：接入 TTS 后改成由音频音量实时驱动 frame。
 *
 * 素材：OpenMoji (https://openmoji.org) — CC BY-SA 4.0
 */
"use client";

import { useEffect, useState } from "react";

export type Mood =
  | "neutral"
  | "warm"
  | "happy"
  | "thinking"
  | "surprised"
  | "celebrate";

// key → OpenMoji 码点文件
const FACES: Record<string, string> = {
  closed: "1F642", // 🙂 闭嘴微笑（待机/说话基础帧）
  half: "1F62F", // 😯 半开口
  open: "1F62E", // 😮 张嘴
  warm: "1F60A", // 😊 温暖微笑
  happy: "1F604", // 😄 开心
  thinking: "1F914", // 🤔 思考
  surprised: "1F632", // 😲 惊讶
  celebrate: "1F929", // 🤩 升级/庆祝
};

const MOOD_FACE: Record<Mood, keyof typeof FACES> = {
  neutral: "closed",
  warm: "warm",
  happy: "happy",
  thinking: "thinking",
  surprised: "surprised",
  celebrate: "celebrate",
};

// 说话口型循环帧
const TALK_FRAMES: (keyof typeof FACES)[] = ["open", "half", "closed", "half"];

type Props = {
  speaking: boolean;
  thinking: boolean;
  mood?: Mood;
};

export default function Character({ speaking, thinking, mood = "warm" }: Props) {
  const [frame, setFrame] = useState(0);

  useEffect(() => {
    if (!speaking) return; // 不说话时 frame 不参与渲染，无需重置
    const id = setInterval(() => {
      setFrame((f) => (f + 1) % TALK_FRAMES.length);
    }, 150);
    return () => clearInterval(id);
  }, [speaking]);

  let activeKey: keyof typeof FACES;
  if (thinking) activeKey = "thinking";
  else if (speaking) activeKey = TALK_FRAMES[frame];
  else activeKey = MOOD_FACE[mood];

  const state = thinking ? "is-thinking" : speaking ? "is-speaking" : "";

  return (
    <div className={`character ${state}`}>
      {/* 全部图层叠放、用透明度切换，避免换图闪烁 */}
      {Object.entries(FACES).map(([key, code]) => (
        // 小尺寸本地 SVG 高频切换，next/image 反而不合适，故用原生 img
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={key}
          src={`/openmoji/${code}.svg`}
          alt="小圆"
          className="face-layer"
          draggable={false}
          style={{ opacity: key === activeKey ? 1 : 0 }}
        />
      ))}
    </div>
  );
}
