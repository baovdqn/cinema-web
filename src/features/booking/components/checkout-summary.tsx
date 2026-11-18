import { Poster } from "@/components/ui/poster";
import { formatDate, formatShowtime } from "@/lib/date";
import { formatVnd } from "@/lib/utils";
import type { Booking } from "@/types/api";
import { seatLabels } from "../seat-utils";

/** Tóm tắt đơn: poster, phim, rạp/phòng, giờ chiếu, ghế, tổng tiền. */
export function CheckoutSummary({ booking }: { booking: Booking }) {
  // TODO: khớp endpoint với backend — booking.movie/showtime có thể chưa được trả kèm
  const { movie, showtime } = booking;
  return (
    <section className="flex gap-4 rounded-xl border border-neutral-800 bg-neutral-900 p-4">
      <Poster posterKey={movie?.posterKey} alt={movie?.title ?? "Poster"} className="h-36 w-24 shrink-0 rounded-md" />
      <div className="min-w-0 flex-1 text-sm">
        <h2 className="text-lg font-semibold">{movie?.title ?? `Đơn #${booking.id}`}</h2>
        {showtime && (
          <>
            <p className="mt-1 text-neutral-300">
              {showtime.cinema.name} · {showtime.room.name}
            </p>
            <p className="text-neutral-400">
              {formatShowtime(showtime.startTime)}, {formatDate(showtime.startTime)}
            </p>
          </>
        )}
        <p className="mt-2">
          <span className="text-neutral-400">Ghế: </span>
          {seatLabels(booking.seats)}
        </p>
        <p className="mt-2 font-semibold">
          Tổng tiền: <span className="text-red-400">{formatVnd(booking.totalAmount)}</span>
        </p>
      </div>
    </section>
  );
}
