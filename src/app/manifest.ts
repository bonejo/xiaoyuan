import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "小圆 · AI 成长伙伴",
    short_name: "小圆",
    description: "陪伴多多的 AI 成长伙伴",
    start_url: "/",
    display: "standalone", // 从主屏图标进入：全屏、无 Safari 地址栏
    orientation: "portrait",
    background_color: "#fdf3ff",
    theme_color: "#fdf3ff",
    icons: [
      { src: "/icon", sizes: "512x512", type: "image/png" },
      { src: "/apple-icon", sizes: "180x180", type: "image/png" },
    ],
  };
}
