import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 px-4 text-center">
      <h1 className="text-5xl font-bold text-red-500">404</h1>
      <p className="text-neutral-400">Không tìm thấy trang bạn yêu cầu.</p>
      <Link href="/" className="mt-2 rounded-md bg-red-600 px-4 py-2 text-sm font-medium hover:bg-red-500">
        Về trang chủ
      </Link>
    </div>
  );
}
