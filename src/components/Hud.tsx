"use client";

import { useEffect, useRef, useState } from "react";
import { useProgress } from "@/lib/progress/store";
import { levelInfo } from "@/lib/progress/levels";

export default function Hud() {
  const { state } = useProgress();
  const lvl = levelInfo(state.totalStars);

  // 升级瞬间给个高亮
  const [justLeveled, setJustLeveled] = useState(false);
  const prevLevel = useRef(lvl.level);
  useEffect(() => {
    if (lvl.level > prevLevel.current) {
      setJustLeveled(true);
      const t = setTimeout(() => setJustLeveled(false), 1800);
      return () => clearTimeout(t);
    }
    prevLevel.current = lvl.level;
  }, [lvl.level]);

  return (
    <header className="hud">
      <div className="hud-top">
        <div className="stars">⭐ <span>{state.totalStars}</span></div>

        <div className={`level ${justLeveled ? "level-up" : ""}`}>
          <div className="level-label">
            Lv.{lvl.level}
            <span className="level-sub">
              {lvl.starsIntoLevel}/{lvl.starsForLevel}
            </span>
          </div>
          <div className="level-bar">
            <div
              className="level-bar-fill"
              style={{ width: `${Math.round(lvl.progress * 100)}%` }}
            />
          </div>
        </div>
      </div>
    </header>
  );
}
