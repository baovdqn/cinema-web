"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { groupByRow, groupRowUnits } from "@/features/booking/seat-utils";
import type { AdminSeat, ShowtimeSeat } from "@/types/api";

const CELL: Record<AdminSeat["seatType"], string> = {
  STANDARD: "border-neutral-600 bg-neutral-800",
  VIP: "border-amber-500/80 bg-amber-950/60",
  COUPLE: "border-fuchsia-500/80 bg-fuchsia-950/60",
};

const LEGEND = [
  { label: "Thường", type: "STANDARD" },
  { label: "VIP", type: "VIP" },
  { label: "Ghế đôi", type: "COUPLE" },
] as const;

/** Sơ đồ ghế chỉ đọc, thu nhỏ — cùng màu với SeatMap của trang khách. */
export function SeatLayoutPreview({ seats, className }: { seats: AdminSeat[]; className?: string }) {
  const rows = useMemo(() => {
    const asShowtimeSeats: ShowtimeSeat[] = seats.map((s, i) => ({ ...s, seatId: i, status: "AVAILABLE", price: 0 }));
    return groupByRow(asShowtimeSeats);
  }, [seats]);

  if (seats.length === 0) return <p className="text-sm text-neutral-500">Chưa có ghế nào.</p>;

  return (
    <div className={className}>
      <div className="overflow-x-auto rounded-lg bg-neutral-950 p-3">
        <div className="mx-auto w-max">
          <div className="mx-auto mb-4 w-3/4">
            <div className="h-1 rounded-full bg-gradient-to-r from-transparent via-neutral-400 to-transparent" />
            <p className="mt-1 text-center text-[10px] uppercase tracking-[0.3em] text-neutral-500">Màn hình</p>
          </div>
          <div className="flex flex-col gap-1" role="img" aria-label={`Sơ đồ ${rows.length} hàng, ${seats.length} ghế`}>
            {rows.map(([row, rowSeats]) => (
              <div key={row} className="flex items-center gap-1.5">
                <span className="w-4 text-center text-[10px] text-neutral-500">{row}</span>
                <div className="flex gap-1">
                  {groupRowUnits(rowSeats).map((unit) => (
                    <span
                      key={unit[0].seatId}
                      className={cn(
                        "inline-block h-4 shrink-0 rounded-t-md rounded-b-sm border",
                        unit.length > 1 ? "w-9" : "w-4",
                        CELL[unit[0].seatType],
                      )}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-neutral-300">
        {LEGEND.map((l) => (
          <li key={l.type} className="flex items-center gap-1.5">
            <span className={cn("inline-block h-3 w-3 rounded-t-md rounded-b-sm border", CELL[l.type])} />
            {l.label}
          </li>
        ))}
      </ul>
    </div>
  );
}
