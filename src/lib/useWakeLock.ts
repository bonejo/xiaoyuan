"use client";

import { useEffect } from "react";

/**
 * 防息屏：申请屏幕 Wake Lock（iOS 16.4+ 支持）。
 * 系统会在切到后台时自动释放，回到前台再重新申请。
 * 兜底仍建议在 iPhone 设置里把"自动锁定"设为"永不"。
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
        // 不支持或被拒，忽略
      }
    };

    const onVisible = () => {
      if (document.visibilityState === "visible") void request();
    };

    void request();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      void lock?.release().catch(() => {});
    };
  }, []);
}
