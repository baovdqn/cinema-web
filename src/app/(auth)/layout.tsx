import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      <Link href="/" className="mb-8 text-2xl font-bold text-red-500">CinemaX</Link>
      <div className="w-full max-w-sm rounded-xl border border-neutral-800 bg-neutral-900 p-6">{children}</div>
    </div>
  );
}
