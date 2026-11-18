"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/components/ui/toast";
import { getErrorData, getErrorMessage, getErrorStatus } from "@/lib/api-client";
import { formatDate, formatShowtime, isSalesClosed } from "@/lib/date";
import { useMovie } from "@/features/movies/hooks";
import { useSeats, useShowtime } from "@/features/showtimes/hooks";
import type { HoldConflict, ShowtimeSeat } from "@/types/api";
import { useCancelBooking, useHoldSeats } from "../hooks";
import { MAX_SEATS, useSeatSelection } from "../seat-selection-store";
import { seatLabels, sortSeats } from "../seat-utils";
import { ActiveBookingDialog } from "./active-booking-dialog";
import { SeatMap } from "./seat-map";
import { SeatSummary, SeatSummaryBar } from "./seat-summary";

export function SeatSelection({ showtimeId }: { showtimeId: string }) {
  const router = useRouter();
  const numericId = Number(showtimeId);
  const showtimeQ = useShowtime(showtimeId);
  const showtime = showtimeQ.data;
  const movieQ = useMovie(showtime ? String(showtime.movieId) : "");
  const seatsQ = useSeats(showtimeId);
  const seats = seatsQ.data;

  const store = useSeatSelection();
  const selected = useMemo(
    () => (store.showtimeId === numericId ? sortSeats(store.selected) : []),
    [store.showtimeId, store.selected, numericId],
  );
  const selectedIds = useMemo(() => new Set(selected.map((s) => s.seatId)), [selected]);

  const hold = useHoldSeats();
  const cancel = useCancelBooking();
  const [hint, setHint] = useState<string | null>(null);
  const [holdError, setHoldError] = useState<string | null>(null);
  const [highlight, setHighlight] = useState<number[]>([]);
  const [activeBooking, setActiveBooking] = useState<HoldConflict["activeBooking"] | null>(null);
  const highlightTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const { init, sync, drop, toggle, clear } = store;
  useEffect(() => init(numericId), [init, numericId]);

  // Sơ đồ poll mới: ghế đang chọn mà không còn trống thì bỏ + báo.
  useEffect(() => {
    if (!seats || useSeatSelection.getState().showtimeId !== numericId) return;
    const removed = sync(seats);
    if (removed.length > 0) toast.warning(`Ghế ${seatLabels(removed)} không còn trống nên đã được bỏ khỏi lựa chọn.`);
  }, [seats, sync, numericId]);

  useEffect(() => () => clearTimeout(highlightTimer.current), []);

  const closed = showtime ? isSalesClosed(showtime.startTime) : false;

  const onToggle = useCallback(
    (seat: ShowtimeSeat) => {
      if (!seats) return;
      setHoldError(null);
      const result = toggle(seat, seats);
      if (result === "limit") {
        const pair = seat.seatType === "COUPLE";
        setHint(
          pair && useSeatSelection.getState().selected.length < MAX_SEATS
            ? `Ghế đôi tính 2 ghế, bạn chỉ còn ${MAX_SEATS - useSeatSelection.getState().selected.length} chỗ.`
            : `Chỉ được chọn tối đa ${MAX_SEATS} ghế mỗi lần đặt.`,
        );
      } else setHint(null);
    },
    [seats, toggle],
  );

  function flash(ids: number[]) {
    setHighlight(ids);
    clearTimeout(highlightTimer.current);
    highlightTimer.current = setTimeout(() => setHighlight([]), 3000);
  }

  function handleConflict(error: unknown) {
    const data = getErrorData<HoldConflict>(error);
    if (data?.conflictedSeatIds?.length) {
      const ids = data.conflictedSeatIds;
      const labelSource = seats ?? [];
      const labels = seatLabels(labelSource.filter((s) => ids.includes(s.seatId)));
      drop(ids, labelSource);
      flash(ids);
      seatsQ.refetch();
      const text = `Ghế ${labels || ids.join(", ")} vừa có người giữ, vui lòng chọn ghế khác`;
      setHoldError(text);
      toast.error(text);
    } else if (data?.activeBooking) {
      setActiveBooking(data.activeBooking);
    } else {
      const text = data?.message ?? "Không thể giữ ghế lúc này";
      setHoldError(text);
      toast.error(text);
    }
  }

  function onHold() {
    if (selected.length === 0 || hold.isPending) return;
    setHoldError(null);
    hold.mutate(
      { showtimeId: numericId, seatIds: selected.map((s) => s.seatId) },
      {
        onSuccess: (booking) => {
          clear();
          router.push(`/checkout/${booking.id}`);
        },
        onError: (error) => {
          if (getErrorStatus(error) === 409) handleConflict(error);
          else {
            const text = getErrorMessage(error);
            setHoldError(text);
            toast.error(text);
          }
        },
      },
    );
  }

  function onReplace() {
    if (!activeBooking) return;
    cancel.mutate(String(activeBooking.id), {
      onSuccess: () => {
        const labels = seatLabels(activeBooking.seats);
        setActiveBooking(null);
        seatsQ.refetch();
        toast.success(`Đã nhả ghế ${labels}. Bạn có thể chọn ghế khác.`);
      },
      onError: (e) => {
        setActiveBooking(null);
        seatsQ.refetch();
        toast.error(getErrorMessage(e));
      },
    });
  }

  if (showtimeQ.isLoading || seatsQ.isLoading)
    return (
      <div aria-busy="true" className="space-y-4">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  if (getErrorStatus(showtimeQ.error) === 404)
    return (
      <EmptyState
        title="Không tìm thấy suất chiếu"
        action={
          <Link href="/movies" className="text-red-400 hover:underline">
            Quay lại danh sách phim
          </Link>
        }
      />
    );
  if (showtimeQ.error || !showtime)
    return <ErrorState error={showtimeQ.error} onRetry={() => showtimeQ.refetch()} />;
  if (seatsQ.error || !seats) return <ErrorState error={seatsQ.error} onRetry={() => seatsQ.refetch()} />;

  const summaryProps = {
    selected,
    hint,
    error: holdError,
    disabled: closed,
    disabledReason: closed ? "Suất chiếu đã đóng bán vé." : undefined,
    loading: hold.isPending,
    onHold,
  };

  return (
    <div className="pb-28 lg:pb-0">
      <header className="mb-6">
        <h1 className="text-2xl font-bold">{movieQ.data?.title ?? "Chọn ghế"}</h1>
        <p className="mt-1 text-sm text-neutral-400">
          {showtime.cinema.name} · {showtime.room.name} · {formatShowtime(showtime.startTime)},{" "}
          {formatDate(showtime.startTime)}
        </p>
      </header>

      {closed && (
        <div role="alert" className="mb-4 rounded-lg border border-amber-700 bg-amber-950/40 px-4 py-3 text-sm text-amber-200">
          Suất chiếu này đã đóng bán vé (đóng trước giờ chiếu 15 phút), không thể giữ ghế.
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <section className="min-w-0 rounded-xl border border-neutral-800 bg-neutral-900/50 p-4 sm:p-6">
          <SeatMap
            seats={seats}
            selectedIds={selectedIds}
            highlightIds={highlight}
            disabled={closed}
            onToggle={onToggle}
          />
        </section>
        <SeatSummary {...summaryProps} />
      </div>
      <SeatSummaryBar {...summaryProps} />

      <ActiveBookingDialog
        key={activeBooking?.id ?? "none"}
        booking={activeBooking ?? null}
        busy={cancel.isPending}
        onContinue={() => activeBooking && router.push(`/checkout/${activeBooking.id}`)}
        onReplace={onReplace}
        onClose={() => setActiveBooking(null)}
      />
    </div>
  );
}
