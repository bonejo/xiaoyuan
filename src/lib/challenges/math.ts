/**
 * 趣味数学题（7 岁）：加法 / 减法故事题 / 小乘法。
 * 每题自带口语化题面 + 可视化参数（用不同物品，不只是苹果）。
 */
import type { VisualSpec } from "@/components/CountingVisual";

export type MathKind = "add" | "sub" | "mul";

export interface MathProblem {
  kind: MathKind;
  story: string; // 口语化题面，如 "树上有 5 只小鸟，飞走了 2 只，还剩几只？"
  answer: number;
  choices: number[];
  stars: number;
  visual: VisualSpec;
}

type Scene = {
  item: string;
  tmpl: (a: number, b: number) => string;
};

// 减法：总共 a，走掉 b
const SUB_SCENES: Scene[] = [
  { item: "🐦", tmpl: (a, b) => `树上有 ${a} 只小鸟，飞走了 ${b} 只，还剩几只？` },
  { item: "🍎", tmpl: (a, b) => `盘子里有 ${a} 个苹果，吃掉了 ${b} 个，还剩几个？` },
  { item: "🎈", tmpl: (a, b) => `多多有 ${a} 个气球，飞走了 ${b} 个，还剩几个？` },
  { item: "🐟", tmpl: (a, b) => `鱼缸里有 ${a} 条小鱼，捞走了 ${b} 条，还剩几条？` },
  { item: "🍪", tmpl: (a, b) => `桌上有 ${a} 块饼干，吃掉了 ${b} 块，还剩几块？` },
];

// 加法：a 和 b 合起来
const ADD_SCENES: Scene[] = [
  { item: "🐱", tmpl: (a, b) => `草地上有 ${a} 只小猫，又来了 ${b} 只，一共几只？` },
  { item: "🍓", tmpl: (a, b) => `篮子里有 ${a} 个草莓，又放进 ${b} 个，一共几个？` },
  { item: "⭐", tmpl: (a, b) => `天上有 ${a} 颗星星，又亮了 ${b} 颗，一共几颗？` },
  { item: "🚗", tmpl: (a, b) => `停车场有 ${a} 辆车，又开来 ${b} 辆，一共几辆？` },
];

// 乘法：a 组，每组 b 个
const MUL_SCENES: Scene[] = [
  { item: "🍎", tmpl: (a, b) => `${a} 个篮子，每个篮子 ${b} 个苹果，一共几个？` },
  { item: "🐰", tmpl: (a, b) => `${a} 个笼子，每个笼子 ${b} 只兔子，一共几只？` },
  { item: "🌸", tmpl: (a, b) => `${a} 排小花，每排 ${b} 朵，一共几朵？` },
  { item: "🍬", tmpl: (a, b) => `${a} 个袋子，每袋 ${b} 颗糖，一共几颗？` },
];

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}
function shuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function makeChoices(answer: number, spread: number): number[] {
  const set = new Set<number>([answer]);
  while (set.size < 4) {
    const delta = randInt(1, spread) * (Math.random() < 0.5 ? -1 : 1);
    const c = answer + delta;
    if (c >= 0) set.add(c);
  }
  return shuffle([...set]);
}

export function generateMathProblem(): MathProblem {
  const kind: MathKind = pick(["add", "sub", "mul"]);

  if (kind === "sub") {
    const a = randInt(3, 10);
    const b = randInt(1, a - 1);
    const scene = pick(SUB_SCENES);
    return {
      kind,
      story: scene.tmpl(a, b),
      answer: a - b,
      choices: makeChoices(a - b, 3),
      stars: a <= 10 ? 1 : 2,
      visual: { item: scene.item, total: a, leaving: b },
    };
  }

  if (kind === "add") {
    const a = randInt(1, 9);
    const b = randInt(1, Math.min(9, 20 - a));
    const scene = pick(ADD_SCENES);
    return {
      kind,
      story: scene.tmpl(a, b),
      answer: a + b,
      choices: makeChoices(a + b, 3),
      stars: a + b <= 10 ? 1 : 2,
      visual: { item: scene.item, parts: [a, b] },
    };
  }

  // mul
  const a = randInt(2, 5);
  const b = randInt(2, 5);
  const scene = pick(MUL_SCENES);
  return {
    kind,
    story: scene.tmpl(a, b),
    answer: a * b,
    choices: makeChoices(a * b, 6),
    stars: a <= 3 && b <= 3 ? 2 : 3,
    visual: { item: scene.item, groups: a, perGroup: b },
  };
}
