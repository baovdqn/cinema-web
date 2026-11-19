"use client";

import Link from "next/link";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

/** Giao diện lỗi dùng chung cho các `error.tsx`. */
export function ErrorFallback({ error, reset, fullScreen }: { error: Error & { digest?: string }; reset: () => void; fullScreen?: boolean }) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <div
      role="alert"
      className={`flex flex-col items-center justify-center gap-3 px-4 text-center ${fullScreen ? "min-h-screen" : "min-h-[50vh]"}`}
    >
      <h1 className="text-2xl font-bold">Đã có lỗi xảy ra</h1>
      <p className="max-w-md text-sm text-neutral-400">
        Rất tiếc, trang gặp sự cố ngoài ý muốn. Bạn có thể thử lại hoặc quay về trang chủ.
      </p>
      <div className="mt-2 flex items-center gap-4">
        <Button onClick={reset}>Thử lại</Button>
        <Link href="/" className="text-sm text-red-500 underline">
          Về trang chủ
        </Link>
      </div>
    </div>
  );
}
