/**
 * 成长进度数据模型。
 * - 星星(star)：全局累计，跨所有内容
 * - 奖牌(badge)：分科目，各自从 青铜→白银→黄金→钻石 进阶
 * - 等级(level)：由累计星星决定，阶梯拉长，越往后越难（见 levels.ts）
 */

export type Subject =
  | "math"
  | "english"
  | "chinese"
  | "french"
  | "social";

export const SUBJECTS: { key: Subject; label: string; icon: string }[] = [
  { key: "math", label: "数学", icon: "🔢" },
  { key: "english", label: "英文", icon: "🔤" },
  { key: "chinese", label: "中文", icon: "📖" },
  { key: "french", label: "法语", icon: "🇫🇷" },
  { key: "social", label: "社交", icon: "💬" },
];

/** 奖牌段位：0=未解锁，1=青铜，2=白银，3=黄金，4=钻石 */
export type BadgeTier = 0 | 1 | 2 | 3 | 4;

export const TIER_META: { medal: string; name: string }[] = [
  { medal: "⚪", name: "未解锁" },
  { medal: "🥉", name: "青铜" },
  { medal: "🥈", name: "白银" },
  { medal: "🥇", name: "黄金" },
  { medal: "💎", name: "钻石" },
];

/** 某科目答对多少次升到对应段位（青铜/白银/黄金/钻石的最低答对数） */
export const TIER_THRESHOLDS = [0, 3, 8, 16, 30];

export function tierForCorrect(correct: number): BadgeTier {
  let tier: BadgeTier = 0;
  for (let i = 1; i < TIER_THRESHOLDS.length; i++) {
    if (correct >= TIER_THRESHOLDS[i]) tier = i as BadgeTier;
  }
  return tier;
}

/** 到下一段位还差多少次答对（已是钻石则返回 null） */
export function correctToNextTier(correct: number): number | null {
  const tier = tierForCorrect(correct);
  if (tier >= 4) return null;
  return TIER_THRESHOLDS[tier + 1] - correct;
}

export interface SubjectProgress {
  correct: number;
  attempts: number;
}

export interface ProgressState {
  totalStars: number;
  subjects: Record<Subject, SubjectProgress>;
}

export function emptyState(): ProgressState {
  return {
    totalStars: 0,
    subjects: {
      math: { correct: 0, attempts: 0 },
      english: { correct: 0, attempts: 0 },
      chinese: { correct: 0, attempts: 0 },
      french: { correct: 0, attempts: 0 },
      social: { correct: 0, attempts: 0 },
    },
  };
}
