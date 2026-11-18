import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4">
      <h1 className="text-4xl font-bold">404</h1>
      <Link href="/" className="text-red-500 underline">Về trang chủ</Link>
    </div>
  );
}
