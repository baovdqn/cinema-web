"use client";

import Link from "next/link";
import { useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Poster } from "@/components/ui/poster";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate, formatShowtime } from "@/lib/date";
import { formatCountdown, useCountdown } from "@/lib/use-countdown";
import { cn, formatVnd } from "@/lib/utils";
import type { Booking } from "@/types/api";
import { bookingKeys, useMyBookings } from "../hooks";
import { seatLabels } from "../seat-utils";
import { BookingStatusBadge } from "./booking-status-badge";

type TabValue = "all" | "upcoming" | "holding" | "watched" | "closed";

const TABS: { value: TabValue; label: string; empty: string }[] = [
  { value: "all", label: "Tất cả", empty: "Bạn chưa có đơn đặt vé nào" },
  { value: "upcoming", label: "Sắp chiếu", empty: "Bạn chưa có vé cho suất chiếu sắp tới" },
  { value: "holding", label: "Đang giữ", empty: "Bạn không có đơn nào đang giữ ghế" },
  { value: "watched", label: "Đã xem", empty: "Bạn chưa có vé của suất chiếu đã qua" },
  { value: "closed", label: "Đã huỷ/hết hạn", empty: "Không có đơn nào bị huỷ hoặc hết hạn" },
];

function isTab(v: string | null): v is TabValue {
  return TABS.some((t) => t.value === v);
}

function startedAt(b: Booking) {
  return b.showtime ? new Date(b.showtime.startTime).getTime() : null;
}

function matches(b: Booking, tab: TabValue, now: number) {
  const start = startedAt(b);
  switch (tab) {
    case "all":
      return true;
    case "upcoming":
      return b.status === "CONFIRMED" && (start == null || start > now);
    case "holding":
      return b.status === "HELD" || b.status === "PAYING";
    case "watched":
      return b.status === "CONFIRMED" && start != null && start <= now;
    case "closed":
      return b.status === "CANCELLED" || b.status === "EXPIRED" || b.status === "FAILED";
  }
}

const linkBtn =
  "inline-flex items-center justify-center rounded-md bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-500";

function HeldAction({ booking }: { booking: Booking }) {
  const qc = useQueryClient();
  const remaining = useCountdown(booking.expiresAt);
  const expired = remaining === 0;

  useEffect(() => {
    if (expired) qc.invalidateQueries({ queryKey: bookingKeys.mine });
  }, [expired, qc]);

  if (expired) return <p className="text-sm font-medium text-neutral-400">Hết hạn</p>;
  return (
    <div className="flex flex-wrap items-center gap-3">
      <p className="text-sm text-amber-400">
        Còn lại{" "}
        <span className="font-mono font-semibold tabular-nums">{remaining == null ? "--:--" : formatCountdown(remaining)}</span>
      </p>
      <Link href={`/checkout/${booking.id}`} className={linkBtn}>
        Tiếp tục thanh toán
      </Link>
    </div>
  );
}

function CardAction({ booking }: { booking: Booking }) {
  switch (booking.status) {
    case "HELD":
      return <HeldAction booking={booking} />;
    case "PAYING":
      return (
        <p role="status" className="text-sm text-sky-400">
          Đang xử lý thanh toán
        </p>
      );
    case "CONFIRMED":
      return (
        <Link href={`/my-bookings/${booking.id}`} className={linkBtn}>
          Xem vé
        </Link>
      );
    case "FAILED":
      return <p className="text-sm text-neutral-400">Giao dịch đã được hủy, bạn sẽ không bị mất tiền</p>;
    default:
      return null;
  }
}

function BookingCard({ booking }: { booking: Booking }) {
  const { movie, showtime } = booking;
  return (
    <li className="flex gap-3 rounded-xl border border-neutral-800 bg-neutral-900 p-3 sm:gap-4 sm:p-4">
      <Poster posterKey={movie?.posterKey} alt={movie?.title ?? "Poster"} className="h-28 w-20 shrink-0 rounded-md sm:h-32 sm:w-24" />
      <div className="flex min-w-0 flex-1 flex-col gap-1 text-sm">
        <div className="flex items-start justify-between gap-2">
          <h2 className="min-w-0 text-base font-semibold leading-snug">{movie?.title ?? `Đơn #${booking.id}`}</h2>
          <BookingStatusBadge status={booking.status} />
        </div>
        {showtime && (
          <>
            <p className="text-neutral-300">
              {showtime.cinema.name} · {showtime.room.name}
            </p>
            <p className="text-neutral-400">
              {formatShowtime(showtime.startTime)}, {formatDate(showtime.startTime)}
            </p>
          </>
        )}
        <p>
          <span className="text-neutral-400">Ghế: </span>
          {seatLabels(booking.seats)}
        </p>
        <p className="font-semibold text-red-400">{formatVnd(booking.totalAmount)}</p>
        <div className="mt-auto pt-2">
          <CardAction booking={booking} />
        </div>
      </div>
    </li>
  );
}

export function MyBookingsSkeleton() {
  return (
    <div aria-busy="true" className="grid gap-3">
      {Array.from({ length: 3 }, (_, i) => (
        <Skeleton key={i} className="h-36" />
      ))}
    </div>
  );
}

export function MyBookings() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const raw = params.get("tab");
  const tab: TabValue = isTab(raw) ? raw : "all";
  const { data, isLoading, error, refetch } = useMyBookings();

  function setTab(value: TabValue) {
    const next = new URLSearchParams(params.toString());
    if (value === "all") next.delete("tab");
    else next.set("tab", value);
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

  const now = Date.now();
  const list = (data ?? []).filter((b) => matches(b, tab, now));
  const current = TABS.find((t) => t.value === tab)!;

  return (
    <section>
      <h1 className="mb-4 text-2xl font-bold">Vé của tôi</h1>
      <div role="tablist" aria-label="Lọc đơn đặt vé" className="-mx-4 mb-5 flex gap-2 overflow-x-auto px-4 pb-1">
        {TABS.map((t) => (
          <button
            key={t.value}
            role="tab"
            aria-selected={tab === t.value}
            onClick={() => setTab(t.value)}
            className={cn(
              "shrink-0 rounded-full px-4 py-1.5 text-sm transition",
              tab === t.value ? "bg-red-600 text-white" : "bg-neutral-800 text-neutral-300 hover:bg-neutral-700",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <MyBookingsSkeleton />
      ) : error ? (
        <ErrorState error={error} onRetry={() => refetch()} />
      ) : list.length === 0 ? (
        <EmptyState
          title={current.empty}
          action={
            <Link href="/movies" className={linkBtn}>
              Đặt vé ngay
            </Link>
          }
        />
      ) : (
        <ul className="grid gap-3">
          {list.map((b) => (
            <BookingCard key={b.id} booking={b} />
          ))}
        </ul>
      )}
    </section>
  );
}
