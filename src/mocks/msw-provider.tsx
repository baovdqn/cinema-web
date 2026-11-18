"use client";

import { useEffect, useState } from "react";

const mockingEnabled = process.env.NEXT_PUBLIC_API_MOCKING === "enabled";

let starting: Promise<unknown> | null = null;
function startMocking() {
  // Dynamic import: khi tắt mock, nhánh này bị loại khỏi bundle production.
  starting ??= import("./browser").then(({ worker }) =>
    worker.start({ onUnhandledRequest: "bypass" }),
  );
  return starting;
}

/** Khởi động MSW worker trước khi render children, để không request nào lọt ra ngoài. */
export function MswProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(!mockingEnabled);

  useEffect(() => {
    if (!mockingEnabled) return;
    let cancelled = false;
    startMocking()
      .catch((e) => console.error("[MSW] không khởi động được worker", e))
      .finally(() => {
        if (!cancelled) setReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return ready ? <>{children}</> : null;
}
