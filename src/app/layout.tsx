import type { Metadata } from "next";
import { Be_Vietnam_Pro } from "next/font/google";
import { Toaster } from "@/components/ui/toast";
import { MswProvider } from "@/mocks/msw-provider";
import { QueryProvider } from "@/providers/query-provider";
import "./globals.css";

const font = Be_Vietnam_Pro({ subsets: ["latin", "vietnamese"], weight: ["400", "500", "600", "700"] });

export const metadata: Metadata = {
  title: "CinemaX — Đặt vé xem phim",
  description: "Đặt vé xem phim online",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="vi">
      <body className={`${font.className} min-h-screen bg-neutral-950 text-neutral-100 antialiased`}>
        <MswProvider>
          <QueryProvider>{children}</QueryProvider>
          <Toaster />
        </MswProvider>
      </body>
    </html>
  );
}
