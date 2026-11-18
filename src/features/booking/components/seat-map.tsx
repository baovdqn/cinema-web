"use client";

import type { Seat } from "@/types/api";

/**
 * TODO (Phase 3): render lưới ghế theo row/number, màu theo type & status,
 * click để toggle vào useSeatSelection, chú thích (legend), màn hình chiếu.
 */
export function SeatMap({ seats }: { seats: Seat[] }) {
  return (
    <div className="rounded-lg border border-dashed border-neutral-700 p-8 text-center text-neutral-400">
      SeatMap placeholder — {seats.length} ghế
    </div>
  );
}
