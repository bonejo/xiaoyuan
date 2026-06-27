"use client";

import { useState } from "react";
import { useProgress } from "@/lib/progress/store";
import { generateMathProblem, type MathProblem } from "@/lib/challenges/math";
import CountingVisual from "./CountingVisual";

type Status = "asking" | "right" | "wrong";

export default function Challenge({
  onClose,
  onCorrect,
}: {
  onClose: () => void;
  onCorrect?: () => void;
}) {
  const { recordAnswer } = useProgress();
  const [p, setP] = useState<MathProblem>(() => generateMathProblem());
  const [status, setStatus] = useState<Status>("asking");
  const [picked, setPicked] = useState<number | null>(null);

  function choose(c: number) {
    if (status === "right") return;
    setPicked(c);
    if (c === p.answer) {
      recordAnswer("math", true, p.stars); // 加星 + 数学答对数+1（驱动奖牌）
      setStatus("right");
      onCorrect?.();
    } else {
      setStatus("wrong");
    }
  }

  function next() {
    setP(generateMathProblem());
    setStatus("asking");
    setPicked(null);
  }

  return (
    <div className="challenge-overlay" role="dialog" aria-modal="true">
      <div className="challenge-card">
        <button className="challenge-close" onClick={onClose} aria-label="关闭">
          ✕
        </button>
        <div className="challenge-title">🎯 数学挑战</div>

        <div className="challenge-story">{p.story}</div>

        <CountingVisual spec={p.visual} />

        <div className="challenge-choices">
          {p.choices.map((c) => (
            <button
              key={c}
              className={`choice ${
                picked === c ? (c === p.answer ? "is-right" : "is-wrong") : ""
              }`}
              onClick={() => choose(c)}
              disabled={status === "right"}
            >
              {c}
            </button>
          ))}
        </div>

        {status === "wrong" && (
          <div className="challenge-feedback">差一点点啦，再试一次！</div>
        )}
        {status === "right" && (
          <div className="challenge-feedback ok">
            <div>🎉 答对啦！+{p.stars}⭐</div>
            <div className="challenge-actions">
              <button onClick={next}>再来一题</button>
              <button onClick={onClose} className="secondary">
                完成
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
