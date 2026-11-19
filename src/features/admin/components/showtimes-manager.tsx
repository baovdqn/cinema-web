"use client";

import { useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { FormField } from "@/components/ui/form-field";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/components/ui/toast";
import { getErrorMessage } from "@/lib/api-client";
import { formatDate, formatShowtime, todayVn } from "@/lib/date";
import { formatVnd } from "@/lib/utils";
import type { AdminShowtime } from "@/types/api";
import { useAdminCinemas, useAdminMovies, useAdminShowtimes, useDeleteShowtime } from "../hooks";
import { ConfirmDialog } from "./confirm-dialog";
import { PageHeader } from "./page-header";
import { ShowtimeFormDialog } from "./showtime-form-dialog";

const ALL_DATES = "all";

interface RoomGroup {
  key: number;
  title: string;
  items: AdminShowtime[];
}

function groupByRoom(list: AdminShowtime[]): RoomGroup[] {
  const map = new Map<number, RoomGroup>();
  for (const s of list) {
    let g = map.get(s.room.id);
    if (!g) map.set(s.room.id, (g = { key: s.room.id, title: `${s.cinema.name} · ${s.room.name}`, items: [] }));
    g.items.push(s);
  }
  return [...map.values()].sort((a, b) => a.title.localeCompare(b.title, "vi"));
}

export function ShowtimesManager() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const cinemaId = params.get("cinemaId") ?? "";
  const movieId = params.get("movieId") ?? "";
  const dateParam = params.get("date");
  // Không có ?date= -> mặc định hôm nay; ?date=all -> mọi ngày.
  const date = dateParam === null ? todayVn() : dateParam === ALL_DATES ? "" : dateParam;

  const cinemas = useAdminCinemas();
  const movies = useAdminMovies();
  const query = useMemo(
    () => ({
      cinemaId: cinemaId ? Number(cinemaId) : undefined,
      movieId: movieId ? Number(movieId) : undefined,
      date: date || undefined,
    }),
    [cinemaId, movieId, date],
  );
  const { data, isLoading, error, refetch } = useAdminShowtimes(query);
  const del = useDeleteShowtime();
  const groups = useMemo(() => groupByRoom(data ?? []), [data]);

  const [adding, setAdding] = useState(false);
  const [deleting, setDeleting] = useState<AdminShowtime | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  function setParam(key: string, value: string | null) {
    const next = new URLSearchParams(params.toString());
    if (value === null || value === "") next.delete(key);
    else next.set(key, value);
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

  function confirmDelete() {
    if (!deleting) return;
    setDeleteError(null);
    del.mutate(deleting.id, {
      onSuccess: () => {
        toast.success("Đã xoá suất chiếu");
        setDeleting(null);
      },
      onError: (e) => setDeleteError(getErrorMessage(e)),
    });
  }

  return (
    <>
      <PageHeader
        title="Suất chiếu"
        description={data ? `${data.length} suất chiếu` : undefined}
        action={<Button onClick={() => setAdding(true)}>Thêm suất chiếu</Button>}
      />

      <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_auto]">
        <Select label="Rạp" value={cinemaId} onChange={(e) => setParam("cinemaId", e.target.value)}>
          <option value="">Tất cả rạp</option>
          {(cinemas.data ?? []).map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>
        <Select label="Phim" value={movieId} onChange={(e) => setParam("movieId", e.target.value)}>
          <option value="">Tất cả phim</option>
          {(movies.data ?? []).map((m) => (
            <option key={m.id} value={m.id}>
              {m.title}
            </option>
          ))}
        </Select>
        <div className="flex items-end gap-2 sm:col-span-2 lg:col-span-1">
          <div className="min-w-0 flex-1">
            <FormField
              label="Ngày"
              type="date"
              value={date}
              onChange={(e) => setParam("date", e.target.value || ALL_DATES)}
            />
          </div>
          <Button variant="secondary" onClick={() => setParam("date", null)} className="h-[38px]">
            Hôm nay
          </Button>
          <Button variant="secondary" onClick={() => setParam("date", ALL_DATES)} className="h-[38px] whitespace-nowrap">
            Mọi ngày
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3" aria-busy="true">
          {[0, 1].map((i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      ) : error ? (
        <ErrorState error={error} onRetry={() => refetch()} />
      ) : groups.length === 0 ? (
        <EmptyState
          title="Không có suất chiếu nào"
          description="Thử đổi bộ lọc hoặc thêm suất chiếu mới."
          action={<Button onClick={() => setAdding(true)}>Thêm suất chiếu</Button>}
        />
      ) : (
        <div className="space-y-5">
          {groups.map((g) => (
            <section key={g.key}>
              <h2 className="mb-2 font-semibold">{g.title}</h2>
              <div className="overflow-x-auto rounded-xl border border-neutral-800">
                <table className="w-full min-w-[640px] text-left text-sm">
                  <thead className="bg-neutral-900 text-xs uppercase text-neutral-400">
                    <tr>
                      <th className="px-4 py-2.5 font-medium">Ngày</th>
                      <th className="px-4 py-2.5 font-medium">Giờ chiếu</th>
                      <th className="px-4 py-2.5 font-medium">Phim</th>
                      <th className="px-4 py-2.5 font-medium">Đã bán</th>
                      <th className="px-4 py-2.5 font-medium">Giá (Thường / VIP / Đôi)</th>
                      <th className="px-4 py-2.5 text-right font-medium">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-800">
                    {g.items.map((s) => (
                      <tr key={s.id} className="hover:bg-neutral-900/50">
                        <td className="whitespace-nowrap px-4 py-2.5 text-neutral-300">{formatDate(s.startTime)}</td>
                        <td className="whitespace-nowrap px-4 py-2.5 font-medium">
                          {formatShowtime(s.startTime)} – {formatShowtime(s.endTime)}
                        </td>
                        <td className="px-4 py-2.5">{s.movieTitle}</td>
                        <td className="whitespace-nowrap px-4 py-2.5 text-neutral-300">
                          {s.soldSeats}/{s.totalSeats}
                        </td>
                        <td className="whitespace-nowrap px-4 py-2.5 text-neutral-300">
                          {[s.prices.STANDARD, s.prices.VIP, s.prices.COUPLE].map((p) => formatVnd(p)).join(" / ")}
                        </td>
                        <td className="whitespace-nowrap px-4 py-2.5 text-right">
                          <Button
                            variant="ghost"
                            className="px-2 py-1 text-red-400"
                            onClick={() => {
                              setDeleteError(null);
                              setDeleting(s);
                            }}
                          >
                            Xoá
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          ))}
        </div>
      )}

      {adding && (
        <ShowtimeFormDialog
          defaults={{ cinemaId, movieId, date: date || undefined }}
          onClose={() => setAdding(false)}
        />
      )}
      <ConfirmDialog
        open={!!deleting}
        title="Xoá suất chiếu"
        message={
          deleting
            ? `Xoá suất ${formatShowtime(deleting.startTime)} ngày ${formatDate(deleting.startTime)} của “${deleting.movieTitle}” (${deleting.room.name})? Chỉ xoá được khi chưa bán ghế nào.`
            : ""
        }
        confirmLabel="Xoá suất chiếu"
        pending={del.isPending}
        error={deleteError}
        onConfirm={confirmDelete}
        onClose={() => setDeleting(null)}
      />
    </>
  );
}
