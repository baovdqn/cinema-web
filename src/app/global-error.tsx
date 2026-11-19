"use client";

import "./globals.css";

/** Bắt lỗi ở chính root layout — phải tự render <html>/<body>, không dùng được provider. */
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="vi">
      <body className="flex min-h-screen flex-col items-center justify-center gap-3 bg-neutral-950 px-4 text-center text-neutral-100">
        <h1 className="text-2xl font-bold">Đã có lỗi nghiêm trọng</h1>
        <p className="max-w-md text-sm text-neutral-400">Ứng dụng gặp sự cố. Vui lòng thử lại hoặc tải lại trang.</p>
        <div className="mt-2 flex items-center gap-4">
          <button type="button" onClick={reset} className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium hover:bg-red-500">
            Thử lại
          </button>
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <a href="/" className="text-sm text-red-500 underline">
            Về trang chủ
          </a>
        </div>
      </body>
    </html>
  );
}
