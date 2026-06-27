/**
 * 界面多语言。对话语言切换时（小圆调用 set_language），屏幕文案也跟着切。
 * 孩子的名字：中文叫"多多"，英文/法语叫"Nathan"。
 */
export type Lang = "zh" | "en" | "fr";

export const LANGS: Lang[] = ["zh", "en", "fr"];

export const CHILD_NAME_BY_LANG: Record<Lang, string> = {
  zh: "多多",
  en: "Nathan",
  fr: "Nathan",
};

export interface UIStrings {
  greeting: string;
  connecting: string;
  listening: string;
  speaking: string;
  thinking: string;
  talk: string;
  stop: string;
  placeholder: string;
  send: string;
}

export const UI: Record<Lang, UIStrings> = {
  zh: {
    greeting: "你好呀多多，我是小圆！点下面的按钮，我们用声音聊天吧～",
    connecting: "正在连接小圆…",
    listening: "我在听，多多说吧～",
    speaking: "（小圆正在说话）",
    thinking: "小圆在想…",
    talk: "🎤 和小圆说话",
    stop: "⏹ 结束",
    placeholder: "（文字后备）打字和小圆说话…",
    send: "说",
  },
  en: {
    greeting: "Hi Nathan, I'm Xiaoyuan! Tap the button and let's talk!",
    connecting: "Connecting to Xiaoyuan…",
    listening: "I'm listening, go ahead Nathan~",
    speaking: "(Xiaoyuan is talking)",
    thinking: "Xiaoyuan is thinking…",
    talk: "🎤 Talk to Xiaoyuan",
    stop: "⏹ Stop",
    placeholder: "(backup) type to Xiaoyuan…",
    send: "Send",
  },
  fr: {
    greeting: "Bonjour Nathan, je suis Xiaoyuan ! Touche le bouton et parlons !",
    connecting: "Connexion à Xiaoyuan…",
    listening: "Je t'écoute, vas-y Nathan~",
    speaking: "(Xiaoyuan parle)",
    thinking: "Xiaoyuan réfléchit…",
    talk: "🎤 Parle à Xiaoyuan",
    stop: "⏹ Stop",
    placeholder: "(secours) écris à Xiaoyuan…",
    send: "Envoi",
  },
};

export function isLang(x: unknown): x is Lang {
  return x === "zh" || x === "en" || x === "fr";
}
