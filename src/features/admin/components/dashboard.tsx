"use client";

import { ErrorState } from "@/components/ui/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { formatVnd } from "@/lib/utils";
import { useAdminStats } from "../hooks";
import { PageHeader } from "./page-header";

export function Dashboard() {
  const { data, isLoading, error, refetch } = useAdminStats();

  const cards = data
    ? [
        { label: "Phim đang chiếu", value: String(data.nowShowingMovies) },
        { label: "Rạp đang hoạt động", value: String(data.activeCinemas) },
        { label: "Suất chiếu hôm nay", value: String(data.showtimesToday) },
        { label: "Booking đã xác nhận", value: String(data.confirmedBookings) },
        { label: "Doanh thu", value: formatVnd(data.revenue), wide: true },
      ]
    : [];

  return (
    <>
      <PageHeader title="Tổng quan" description="Số liệu nhanh của hệ thống rạp." />
      {error ? (
        <ErrorState error={error} onRetry={() => refetch()} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {isLoading
            ? Array.from({ length: 5 }, (_, i) => <Skeleton key={i} className="h-28" />)
            : cards.map((c) => (
                <div
                  key={c.label}
                  className={`rounded-xl border border-neutral-800 bg-neutral-900 p-5 ${c.wide ? "sm:col-span-2 lg:col-span-1" : ""}`}
                >
                  <p className="text-sm text-neutral-400">{c.label}</p>
                  <p className="mt-2 break-words text-3xl font-bold text-white">{c.value}</p>
                </div>
              ))}
        </div>
      )}
    </>
  );
}
