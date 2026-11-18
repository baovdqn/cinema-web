"use client";

import Link from "next/link";
import { QRCodeSVG } from "qrcode.react";
import { ErrorState } from "@/components/ui/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate, formatShowtime } from "@/lib/date";
import type { Booking, Ticket } from "@/types/api";
import { useTickets } from "../hooks";
import { seatLabel } from "../seat-utils";

/** Một vé (1 ghế) dạng vé rạp: thông tin phim ở trên, đường xé, QR lớn + mã vé ở dưới. */
export function TicketCard({ ticket, booking }: { ticket: Ticket; booking: Booking }) {
  const seat = booking.seats.find((s) => s.seatId === ticket.seatId);
  const { movie, showtime } = booking;
  return (
    <li className="overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-900">
      <div className="p-4 sm:p-5">
        <p className="text-xs uppercase tracking-wider text-red-400">Vé xem phim</p>
        <h3 className="mt-1 text-lg font-bold leading-snug">{movie?.title ?? `Đơn #${booking.id}`}</h3>
        {showtime && (
          <p className="mt-1 text-sm text-neutral-300">
            {showtime.cinema.name} · {showtime.room.name}
          </p>
        )}
        <div className="mt-3 flex items-end justify-between gap-3">
          {showtime && (
            <p className="text-sm text-neutral-400">
              {formatShowtime(showtime.startTime)}
              <br />
              {formatDate(showtime.startTime)}
            </p>
          )}
          <p className="text-right">
            <span className="block text-xs text-neutral-400">Ghế</span>
            <span className="text-3xl font-bold">{seat ? seatLabel(seat) : `#${ticket.seatId}`}</span>
          </p>
        </div>
      </div>

      {/* Đường xé vé */}
      <div className="relative" aria-hidden="true">
        <div className="border-t-2 border-dashed border-neutral-700" />
        <span className="absolute -left-3 -top-3 h-6 w-6 rounded-full bg-neutral-950" />
        <span className="absolute -right-3 -top-3 h-6 w-6 rounded-full bg-neutral-950" />
      </div>

      <div className="flex flex-col items-center p-4 sm:p-5">
        <div className="rounded-lg bg-white p-2.5">
          <QRCodeSVG value={ticket.ticketCode} size={168} />
        </div>
        <p className="mt-3 break-all text-center font-mono text-xs text-neutral-400">{ticket.ticketCode}</p>
      </div>
    </li>
  );
}

/** Danh sách vé của booking CONFIRMED (loading/error tự xử lý). */
export function TicketList({ booking }: { booking: Booking }) {
  const { data: tickets, isLoading, error, refetch } = useTickets(String(booking.id), true);
  if (isLoading) return <Skeleton className="h-72 w-full" />;
  if (error) return <ErrorState error={error} onRetry={() => refetch()} />;
  return (
    <ul className="grid gap-4 sm:grid-cols-2">
      {(tickets ?? []).map((t) => (
        <TicketCard key={t.id} ticket={t} booking={booking} />
      ))}
    </ul>
  );
}

/** Màn thành công (CONFIRMED) ở trang thanh toán. */
export function ConfirmedView({ booking }: { booking: Booking }) {
  return (
    <section className="rounded-xl border border-green-800 bg-green-950/20 p-4 sm:p-6">
      <h2 className="text-xl font-bold text-green-400">Đặt vé thành công</h2>
      <p className="mt-1 text-sm text-neutral-300">Đưa mã QR bên dưới cho nhân viên soát vé khi vào rạp.</p>

      <div className="mt-4">
        <TicketList booking={booking} />
      </div>

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
