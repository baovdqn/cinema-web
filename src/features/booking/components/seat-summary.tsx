"use client";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { cn, formatVnd } from "@/lib/utils";
import type { ShowtimeSeat } from "@/types/api";
import { MAX_SEATS } from "../seat-selection-store";
import { SEAT_TYPE_LABEL, seatLabel, seatLabels } from "../seat-utils";

interface Props {
  selected: ShowtimeSeat[];
  hint?: string | null;
  error?: string | null;
  disabled: boolean;
  disabledReason?: string;
  loading: boolean;
  onHold: () => void;
}

function HoldButton({ selected, disabled, loading, onHold, className }: Props & { className?: string }) {
  return (
    <Button className={cn("w-full py-2.5", className)} disabled={disabled || loading || selected.length === 0} onClick={onHold}>
      {loading ? <Spinner /> : "Giữ ghế"}
    </Button>
  );
}

/** Sidebar (desktop) — danh sách ghế, tổng tiền, nút giữ ghế. */
export function SeatSummary(props: Props) {
  const { selected, hint, error, disabledReason } = props;
  const total = selected.reduce((sum, s) => sum + s.price, 0);
  return (
    <aside className="hidden rounded-xl border border-neutral-800 bg-neutral-900 p-4 lg:sticky lg:top-20 lg:block">
      <h2 className="font-semibold">Ghế đã chọn ({selected.length}/{MAX_SEATS})</h2>
      {selected.length === 0 ? (
        <p className="mt-3 text-sm text-neutral-400">Chọn ghế trên sơ đồ để tiếp tục.</p>
      ) : (
        <ul className="mt-3 space-y-1.5 text-sm">
          {selected.map((s) => (
            <li key={s.seatId} className="flex justify-between">
              <span>
                {seatLabel(s)} <span className="text-neutral-400">· {SEAT_TYPE_LABEL[s.seatType]}</span>
              </span>
              <span>{formatVnd(s.price)}</span>
            </li>
          ))}
        </ul>
      )}
      <div className="mt-4 flex justify-between border-t border-neutral-800 pt-3 font-semibold">
        <span>Tổng tiền</span>
        <span className="text-red-400">{formatVnd(total)}</span>
      </div>
      {hint && <p className="mt-3 text-xs text-amber-400">{hint}</p>}
      {error && (
        <p role="alert" className="mt-3 text-xs text-red-400">
          {error}
        </p>
      )}
      {disabledReason && <p className="mt-3 text-xs text-neutral-400">{disabledReason}</p>}
      <HoldButton {...props} className="mt-4" />
      <p className="mt-2 text-center text-xs text-neutral-500">Ghế được giữ trong 8 phút để thanh toán.</p>
    </aside>
  );
}

/** Thanh cố định đáy màn hình (mobile). */
export function SeatSummaryBar(props: Props) {
  const { selected, hint, error } = props;
  const total = selected.reduce((sum, s) => sum + s.price, 0);
  const msg = error ?? hint;
  return (
    <div className="fixed inset-x-0 bottom-0 z-30 border-t border-neutral-800 bg-neutral-950/95 px-4 py-3 backdrop-blur lg:hidden">
      {msg && (
        <p role={error ? "alert" : undefined} className={cn("mb-2 text-xs", error ? "text-red-400" : "text-amber-400")}>
          {msg}
        </p>
      )}
      <div className="flex items-center gap-3">
        <div className="min-w-0 flex-1 text-sm">
          <p className="truncate">
            {selected.length === 0 ? "Chưa chọn ghế" : seatLabels(selected)}
          </p>
          <p className="font-semibold text-red-400">{formatVnd(total)}</p>
        </div>
        <HoldButton {...props} className="w-auto shrink-0 px-5" />
      </div>
    </div>
  );
}
