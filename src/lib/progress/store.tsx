"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  emptyState,
  type ProgressState,
  type Subject,
} from "./types";

/**
 * 进度存储。
 * 当前用 localStorage 持久化（单台 iPad、单个孩子已够用）。
 * 读写都走 persistence 接口，以后换 Supabase 只改这一层、不动游戏逻辑。
 */
interface Persistence {
  load(): ProgressState | null;
  save(s: ProgressState): void;
}

const STORAGE_KEY = "duoduo.progress.v1";

const localPersistence: Persistence = {
  load() {
    if (typeof window === "undefined") return null;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      return { ...emptyState(), ...JSON.parse(raw) } as ProgressState;
    } catch {
      return null;
    }
  },
  save(s) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
    } catch {
      // 忽略写入失败（隐私模式等）
    }
  },
};

export interface AwardResult {
  leveledUp: boolean;
  fromLevel: number;
  toLevel: number;
}

interface ProgressContextValue {
  state: ProgressState;
  /** 直接加星（如纯陪聊的鼓励），返回是否升级 */
  awardStars(n: number): void;
  /** 记录一次答题：答对则加星并累加该科答对数 */
  recordAnswer(subject: Subject, correct: boolean, stars: number): void;
  /** 记录多多对某话题的喜好（liked=true 加权重，false 减权重） */
  noteInterest(topic: string, liked: boolean): void;
  reset(): void;
}

const ProgressContext = createContext<ProgressContextValue | null>(null);

export function ProgressProvider({ children }: { children: React.ReactNode }) {
  // 服务端与首屏都从空状态开始，避免 hydration 不一致；挂载后再读本地存储
  const [state, setState] = useState<ProgressState>(emptyState);
  const loaded = useRef(false);

  useEffect(() => {
    // 挂载后再从 localStorage 读取：保持 SSR/首屏与服务端一致，避免 hydration 不匹配。
    // 这里的 setState 是刻意的（一次性恢复持久化进度）。
    const saved = localPersistence.load();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (saved) setState(saved);
    loaded.current = true;
  }, []);

  // 状态变化后持久化（首帧空状态不要覆盖已存数据）
  useEffect(() => {
    if (loaded.current) localPersistence.save(state);
  }, [state]);

  const awardStars = useCallback((n: number) => {
    setState((s) => ({ ...s, totalStars: s.totalStars + n }));
  }, []);

  const recordAnswer = useCallback(
    (subject: Subject, correct: boolean, stars: number) => {
      setState((s) => {
        const prev = s.subjects[subject];
        return {
          ...s,
          totalStars: s.totalStars + (correct ? stars : 0),
          subjects: {
            ...s.subjects,
            [subject]: {
              correct: prev.correct + (correct ? 1 : 0),
              attempts: prev.attempts + 1,
            },
          },
        };
      });
    },
    []
  );

  const noteInterest = useCallback((topic: string, liked: boolean) => {
    const t = topic.trim();
    if (!t) return;
    setState((s) => {
      const cur = s.interests[t] ?? 0;
      const next = Math.max(-3, Math.min(5, cur + (liked ? 1 : -1)));
      return { ...s, interests: { ...s.interests, [t]: next } };
    });
  }, []);

  const reset = useCallback(() => setState(emptyState()), []);

  // 开发期：挂个测试钩子，方便没接语音前先验证
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") {
      (window as unknown as Record<string, unknown>).__duoduo = {
        awardStars,
        recordAnswer,
        noteInterest,
        reset,
        getState: () => state,
      };
    }
  }, [awardStars, recordAnswer, noteInterest, reset, state]);

  return (
    <ProgressContext.Provider
      value={{ state, awardStars, recordAnswer, noteInterest, reset }}
    >
      {children}
    </ProgressContext.Provider>
  );
}

export function useProgress(): ProgressContextValue {
  const ctx = useContext(ProgressContext);
  if (!ctx) throw new Error("useProgress 必须在 ProgressProvider 内使用");
  return ctx;
}
