"use client";

import { useEffect, useState } from "react";

/** Số ms còn lại tới `expiresAt` (ISO), cập nhật mỗi giây. `null` khi chưa có mốc. Không bao giờ âm. */
export function useCountdown(expiresAt: string | undefined): number | null {
  const target = expiresAt ? new Date(expiresAt).getTime() : null;
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (target == null) return;
    setNow(Date.now());
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [target]);

  return target == null ? null : Math.max(0, target - now);
}

/** "mm:ss" */
export function formatCountdown(ms: number) {
  const total = Math.ceil(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}
