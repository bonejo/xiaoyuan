/**
 * 机器人等级阶梯。
 * 设计目标（Jon）：多设几级、越往后越难，不要一下子封顶。
 *
 * 到达等级 L 所需的累计星星：thresh(L) = 5 * L * (L - 1)
 *   L1=0, L2=10, L3=30, L4=60, L5=100, L6=150, L7=210, L8=280, L9=360, L10=450 ...
 * 从 L 升到 L+1 需要 10*L 颗星（越高越多），开放式无上限。
 */

export function levelThreshold(level: number): number {
  return 5 * level * (level - 1);
}

export interface LevelInfo {
  level: number; // 当前等级（从 1 起）
  starsIntoLevel: number; // 当前等级内已得星
  starsForLevel: number; // 升下一级需要的总星（本级跨度）
  nextLevelAt: number; // 到达下一级的累计星阈值
  progress: number; // 0~1，本级进度
}

export function levelInfo(totalStars: number): LevelInfo {
  let level = 1;
  while (levelThreshold(level + 1) <= totalStars) level++;

  const base = levelThreshold(level);
  const next = levelThreshold(level + 1);
  const span = next - base; // = 10 * level
  const into = totalStars - base;

  return {
    level,
    starsIntoLevel: into,
    starsForLevel: span,
    nextLevelAt: next,
    progress: span > 0 ? into / span : 0,
  };
}
