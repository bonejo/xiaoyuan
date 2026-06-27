import type { ReactElement } from "react";

/**
 * 小圆的 App 图标：品牌紫底 + 黄色笑脸（用 div 画，避免 OG 渲染缺中文字体/emoji 字体的问题）。
 * 供 app/icon.tsx 与 app/apple-icon.tsx 复用。
 */
export function brandFace(size: number): ReactElement {
  const F = Math.round(size * 0.7); // 脸直径
  const eye = Math.round(F * 0.13);
  const eyeTop = Math.round(F * 0.36);
  const eyeSide = Math.round(F * 0.24);
  const smileW = Math.round(F * 0.42);
  const smileH = Math.round(F * 0.24);
  const smileTop = Math.round(F * 0.46);
  const smileBorder = Math.max(3, Math.round(F * 0.08));

  return (
    <div
      style={{
        display: "flex",
        width: "100%",
        height: "100%",
        background: "#7c5cff",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          position: "relative",
          display: "flex",
          width: F,
          height: F,
          borderRadius: F,
          background: "#FFE600",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: eyeTop,
            left: eyeSide,
            width: eye,
            height: eye,
            borderRadius: eye,
            background: "#2b2b3a",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: eyeTop,
            right: eyeSide,
            width: eye,
            height: eye,
            borderRadius: eye,
            background: "#2b2b3a",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: smileTop,
            left: (F - smileW) / 2,
            width: smileW,
            height: smileH,
            borderBottom: `${smileBorder}px solid #2b2b3a`,
            borderRadius: `0 0 ${smileW}px ${smileW}px`,
          }}
        />
      </div>
    </div>
  );
}
