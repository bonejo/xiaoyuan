/**
 * 小圆在语音对话里可调用的工具（Gemini Live function calling）。
 * 让小圆能在聊天中真正地：给星星、在屏幕上画图帮多多理解。
 */
import { Type, type FunctionDeclaration } from "@google/genai";

const declarations: FunctionDeclaration[] = [
  {
    name: "award_stars",
    description:
      "当多多答对问题、完成一个小挑战、或表现很棒时，给他奖励星星。这会更新屏幕上的星星、等级和该科目的奖牌。",
    parameters: {
      type: Type.OBJECT,
      properties: {
        subject: {
          type: Type.STRING,
          enum: ["math", "english", "chinese", "french", "social"],
          description:
            "属于哪个能力：数学math/英文english/中文chinese/法语french/社交social",
        },
        stars: {
          type: Type.NUMBER,
          description: "奖励几颗星：简单 1~2，中等 3，挑战 4~5",
        },
        correct: {
          type: Type.BOOLEAN,
          description: "多多这次是否答对/做到了（用于累加该科答对数、解锁奖牌）",
        },
      },
      required: ["subject", "stars"],
    },
  },
  {
    name: "show_picture",
    description:
      "在屏幕上用 emoji 物品把数量画出来帮多多看懂。讲乘法用 groups+perGroup（几组、每组几个）；讲加法用 parts（几堆）；讲减法用 total+leaving（一共几个、飞走几个）。",
    parameters: {
      type: Type.OBJECT,
      properties: {
        item: {
          type: Type.STRING,
          description: "用来画的 emoji，如 🍎 🐦 ⭐ 🐟 🎈",
        },
        total: { type: Type.NUMBER, description: "一共画几个（计数/减法）" },
        leaving: {
          type: Type.NUMBER,
          description: "末尾几个要飞走/消失（减法）",
        },
        parts: {
          type: Type.ARRAY,
          items: { type: Type.NUMBER },
          description: "分几堆，如 [5,3]（加法）",
        },
        groups: { type: Type.NUMBER, description: "分几组（乘法）" },
        perGroup: { type: Type.NUMBER, description: "每组几个（乘法）" },
      },
      required: ["item"],
    },
  },
  {
    name: "set_language",
    description:
      "当和孩子对话的语言切换时调用（比如他开始一直说英文或法语）。屏幕上的文字会跟着切换。",
    parameters: {
      type: Type.OBJECT,
      properties: {
        lang: {
          type: Type.STRING,
          enum: ["zh", "en", "fr"],
          description: "zh=中文 / en=英文 / fr=法语",
        },
      },
      required: ["lang"],
    },
  },
  {
    name: "show_thing",
    description:
      "聊到某个具体事物时，把它显示在屏幕上给孩子看，而不只是用嘴描述。普通事物用 emoji（动物 🦎、地标 🗼、物品 🎈）。**显示国旗时不要用 emoji，而是把 flag 设为该国 ISO 两位代码**（法国 fr、日本 jp、中国 cn、美国 us…），这样屏幕能显示真实国旗。",
    parameters: {
      type: Type.OBJECT,
      properties: {
        emoji: {
          type: Type.STRING,
          description: "代表该事物的 emoji，如 🦎 🗼 🐘（显示国旗时填 🏳️ 占位即可）",
        },
        flag: {
          type: Type.STRING,
          description: "国旗的国家 ISO 两位代码（如 fr、jp、cn、us）。只在显示国旗时填。",
        },
        label: {
          type: Type.STRING,
          description: "事物的名称（用当前对话的语言）",
        },
      },
      required: ["emoji"],
    },
  },
  {
    name: "note_interest",
    description:
      "当你发现多多对某个话题特别感兴趣、很喜欢（liked=true），或明确表示不想要/不喜欢（liked=false）时，调用它记下来。以后开新对话你会更懂他、主动聊他喜欢的。话题用简短词，如 足球、恐龙、数学题、画画。",
    parameters: {
      type: Type.OBJECT,
      properties: {
        topic: { type: Type.STRING, description: "话题简短词，如 足球、恐龙、数学题" },
        liked: {
          type: Type.BOOLEAN,
          description: "true=喜欢/感兴趣，false=不想要/不喜欢",
        },
      },
      required: ["topic", "liked"],
    },
  },
];

export const VOICE_TOOLS = [{ functionDeclarations: declarations }];
