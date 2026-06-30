"use client";

import { useEffect } from "react";

/**
 * 防息屏：申请屏幕 Wake Lock（iOS 16.4+ 支持）。
 * iOS 通常要求在用户手势后才允许申请，所以这里：
 *  - 页面加载先试一次
 *  - 用户每次点屏幕（pointerdown）再尝试一次
 *  - 切回前台自动重新申请（系统会在后台时释放）
 * 兜底（墙上专用机最可靠）：iPhone 设置 → 显示与亮度 → 自动锁定 → 永不；并用引导式访问。
 */
export function useWakeLock() {
  useEffect(() => {
    if (!("wakeLock" in navigator)) return;
    let lock: WakeLockSentinel | null = null;

    const request = async () => {
      try {
        if (document.visibilityState === "visible" && !lock) {
          lock = await navigator.wakeLock.request("screen");
          lock.addEventListener("release", () => {
            lock = null;
          });
        }
      } catch {
        // 不支持或被拒，忽略（会在下次手势/可见时再试）
      }
    };

    const onVisible = () => {
      if (document.visibilityState === "visible") void request();
    };

    void request();
    document.addEventListener("visibilitychange", onVisible);
    document.addEventListener("pointerdown", request);

    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      document.removeEventListener("pointerdown", request);
      void lock?.release().catch(() => {});
    };
  }, []);
}
