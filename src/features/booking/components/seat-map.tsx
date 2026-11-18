"use client";

import { useMemo } from "react";
import { cn, formatVnd } from "@/lib/utils";
import type { ShowtimeSeat } from "@/types/api";
import { groupByRow, groupRowUnits, SEAT_TYPE_LABEL, seatLabels, unitStatus } from "../seat-utils";

const STRIPES =
  "bg-[repeating-linear-gradient(135deg,#404040_0,#404040_4px,#262626_4px,#262626_8px)]";

function SeatButton({
  unit,
  selected,
  highlighted,
  disabled,
  onToggle,
}: {
  unit: ShowtimeSeat[];
  selected: boolean;
  highlighted: boolean;
  disabled: boolean;
  onToggle: (seat: ShowtimeSeat) => void;
}) {
  const first = unit[0];
  const status = unitStatus(unit);
  const price = unit.reduce((sum, s) => sum + s.price, 0);
  const statusText = status === "HELD" ? ", đang được giữ" : status === "SOLD" ? ", đã bán" : "";
  const text = unit.length > 1 ? `${first.seatNumber}-${unit[1].seatNumber}` : String(first.seatNumber);
  const blocked = status !== "AVAILABLE";

  return (
    <button
      type="button"
      disabled={blocked || disabled}
      aria-pressed={selected}
      aria-label={`Ghế ${seatLabels(unit)}, ${SEAT_TYPE_LABEL[first.seatType]}, ${formatVnd(price)}${statusText}`}
      title={`${seatLabels(unit)} · ${SEAT_TYPE_LABEL[first.seatType]} · ${formatVnd(price)}`}
      onClick={() => onToggle(first)}
      className={cn(
        "flex h-8 shrink-0 items-center justify-center rounded-t-lg rounded-b-sm border text-[11px] font-medium transition",
        unit.length > 1 ? "w-[70px]" : "w-8",
        status === "AVAILABLE" && "cursor-pointer",
        status === "AVAILABLE" && first.seatType === "STANDARD" && "border-neutral-600 bg-neutral-800 hover:border-neutral-400",
        status === "AVAILABLE" && first.seatType === "VIP" && "border-amber-500/80 bg-amber-950/60 text-amber-200 hover:bg-amber-900/70",
        status === "AVAILABLE" && first.seatType === "COUPLE" && "border-fuchsia-500/80 bg-fuchsia-950/60 text-fuchsia-200 hover:bg-fuchsia-900/70",
        selected && "border-red-500 bg-red-600 text-white hover:bg-red-500",
        status === "HELD" && cn("cursor-not-allowed border-neutral-600 text-neutral-500", STRIPES),
        status === "SOLD" && "cursor-not-allowed border-neutral-900 bg-neutral-900 text-neutral-600",
        highlighted && "animate-pulse ring-2 ring-red-400 ring-offset-1 ring-offset-neutral-950",
      )}
    >
      {status === "SOLD" ? "✕" : text}
    </button>
  );
}

const LEGEND: { label: string; className: string }[] = [
  { label: "Thường", className: "border-neutral-600 bg-neutral-800" },
  { label: "VIP", className: "border-amber-500/80 bg-amber-950/60" },
  { label: "Ghế đôi", className: "border-fuchsia-500/80 bg-fuchsia-950/60" },
  { label: "Đang chọn", className: "border-red-500 bg-red-600" },
  { label: "Đang được giữ", className: cn("border-neutral-600", STRIPES) },
  { label: "Đã bán", className: "border-neutral-900 bg-neutral-900" },
];

export function SeatMap({
  seats,
  selectedIds,
  highlightIds = [],
  disabled = false,
  onToggle,
}: {
  seats: ShowtimeSeat[];
  selectedIds: Set<number>;
  highlightIds?: number[];
  disabled?: boolean;
  onToggle: (seat: ShowtimeSeat) => void;
}) {
  const rows = useMemo(() => groupByRow(seats), [seats]);

  return (
    <div>
      <div className="overflow-x-auto pb-2">
        <div className="mx-auto w-max min-w-[420px] px-2">
          <div className="mx-auto mb-8 w-4/5">
            <div className="h-1.5 rounded-full bg-gradient-to-r from-transparent via-neutral-300 to-transparent shadow-[0_8px_24px_rgba(255,255,255,0.15)]" />
            <p className="mt-2 text-center text-xs uppercase tracking-[0.3em] text-neutral-400">Màn hình</p>
          </div>
          <div className="flex flex-col gap-2">
            {rows.map(([row, rowSeats]) => (
              <div key={row} className="flex items-center justify-center gap-2" role="group" aria-label={`Hàng ${row}`}>
                <span className="w-5 text-center text-xs font-medium text-neutral-400" aria-hidden>
                  {row}
                </span>
                <div className="flex gap-1.5">
                  {groupRowUnits(rowSeats).map((unit) => (
                    <SeatButton
                      key={unit[0].seatId}
                      unit={unit}
                      selected={unit.every((s) => selectedIds.has(s.seatId))}
                      highlighted={unit.some((s) => highlightIds.includes(s.seatId))}
                      disabled={disabled}
                      onToggle={onToggle}
                    />
                  ))}
                </div>
                <span className="w-5 text-center text-xs font-medium text-neutral-400" aria-hidden>
                  {row}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <p className="mt-2 text-center text-xs text-neutral-500 sm:hidden">Vuốt ngang để xem toàn bộ sơ đồ ghế</p>
      <ul className="mt-4 flex flex-wrap justify-center gap-x-5 gap-y-2 text-xs text-neutral-300">
        {LEGEND.map((l) => (
          <li key={l.label} className="flex items-center gap-1.5">
            <span className={cn("inline-block h-4 w-4 rounded-t-md rounded-b-sm border", l.className)} />
            {l.label}
          </li>
        ))}
      </ul>
    </div>
  );
}
