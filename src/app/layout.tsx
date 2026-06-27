import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ProgressProvider } from "@/lib/progress/store";

export const metadata: Metadata = {
  title: "小圆 · AI 成长伙伴",
  description: "陪伴多多的 AI 成长伙伴小圆",
  // 加到主屏后全屏运行（隐藏 Safari 地址栏），像独立 App
  appleWebApp: {
    capable: true,
    title: "小圆",
    statusBarStyle: "black-translucent",
  },
};

// 墙上 iPad 全屏运行：禁止缩放，铺满刘海区
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#fdf3ff",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body>
        <ProgressProvider>{children}</ProgressProvider>
      </body>
    </html>
  );
}
