"use client";

import type { ShowtimeSeat } from "@/types/api";

/**
 * TODO (Phase 3): render lưới ghế theo row/number, màu theo seatType & status (AVAILABLE/HELD/SOLD),
 * click để toggle vào useSeatSelection, chú thích (legend), màn hình chiếu.
 */
export function SeatMap({ seats }: { seats: ShowtimeSeat[] }) {
  return (
    <div className="rounded-lg border border-dashed border-neutral-700 p-8 text-center text-neutral-400">
      SeatMap placeholder — {seats.length} ghế
    </div>
  );
}
