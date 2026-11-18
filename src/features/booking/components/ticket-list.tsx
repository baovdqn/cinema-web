"use client";

import Link from "next/link";
import { QRCodeSVG } from "qrcode.react";
import { ErrorState } from "@/components/ui/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import type { Booking } from "@/types/api";
import { useTickets } from "../hooks";
import { seatLabel } from "../seat-utils";

/** Màn thành công (CONFIRMED): danh sách vé kèm QR. */
export function ConfirmedView({ booking }: { booking: Booking }) {
  const { data: tickets, isLoading, error, refetch } = useTickets(String(booking.id), true);
  const seatById = new Map(booking.seats.map((s) => [s.seatId, s]));

  return (
    <section className="rounded-xl border border-green-800 bg-green-950/20 p-4 sm:p-6">
      <h2 className="text-xl font-bold text-green-400">Đặt vé thành công</h2>
      <p className="mt-1 text-sm text-neutral-300">Đưa mã QR bên dưới cho nhân viên soát vé khi vào rạp.</p>

      {isLoading && <Skeleton className="mt-4 h-40 w-full" />}
      {error && <ErrorState className="mt-4" error={error} onRetry={() => refetch()} />}
      {tickets && (
        <ul className="mt-4 grid gap-3 sm:grid-cols-2">
          {tickets.map((t) => {
            const seat = seatById.get(t.seatId);
            return (
              <li key={t.id} className="flex items-center gap-4 rounded-lg border border-neutral-800 bg-neutral-900 p-3">
                <div className="shrink-0 rounded bg-white p-1.5">
                  <QRCodeSVG value={t.ticketCode} size={88} />
                </div>
                <div className="min-w-0 text-sm">
                  <p className="text-lg font-semibold">Ghế {seat ? seatLabel(seat) : `#${t.seatId}`}</p>
                  <p className="break-all font-mono text-xs text-neutral-400">{t.ticketCode}</p>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <Link
          href="/my-bookings"
          className="inline-flex items-center justify-center rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-500"
        >
          Xem vé của tôi
        </Link>
        <Link
          href="/"
          className="inline-flex items-center justify-center rounded-md bg-neutral-800 px-4 py-2 text-sm font-medium hover:bg-neutral-700"
        >
          Về trang chủ
        </Link>
      </div>
    </section>
  );
}
