import { create } from "zustand";
import type { ShowtimeSeat } from "@/types/api";
import { coupleGroup } from "./seat-utils";

/** Quy tắc nghiệp vụ backend: tối đa 4 ghế mỗi lần đặt. */
export const MAX_SEATS = 4;

export type ToggleResult = "selected" | "deselected" | "limit" | "unavailable";

interface SeatSelectionState {
  showtimeId: number | null;
  selected: ShowtimeSeat[];
  init: (showtimeId: number) => void;
  /** Chọn/bỏ ghế. Ghế đôi được chọn/bỏ cả cặp (cặp tính 2 ghế). `seats` là toàn bộ sơ đồ để tìm ghế cặp. */
  toggle: (seat: ShowtimeSeat, seats: ShowtimeSeat[]) => ToggleResult;
  /** Bỏ các ghế (kèm ghế cặp) khỏi lựa chọn, trả về những ghế đã bỏ. */
  drop: (seatIds: number[], seats: ShowtimeSeat[]) => ShowtimeSeat[];
  /** Đồng bộ với sơ đồ mới: bỏ ghế không còn AVAILABLE, trả về những ghế đã bỏ. */
  sync: (seats: ShowtimeSeat[]) => ShowtimeSeat[];
  clear: () => void;
}

export const useSeatSelection = create<SeatSelectionState>((set, get) => ({
  showtimeId: null,
  selected: [],
  init: (showtimeId) => {
    if (get().showtimeId !== showtimeId) set({ showtimeId, selected: [] });
  },
  toggle: (seat, seats) => {
    const { selected } = get();
    const group = coupleGroup(seat, seats);
    const ids = new Set(group.map((s) => s.seatId));
    if (group.some((s) => selected.some((x) => x.seatId === s.seatId))) {
      set({ selected: selected.filter((x) => !ids.has(x.seatId)) });
      return "deselected";
    }
    if (group.some((s) => s.status !== "AVAILABLE")) return "unavailable";
    if (selected.length + group.length > MAX_SEATS) return "limit";
    set({ selected: [...selected, ...group] });
    return "selected";
  },
  drop: (seatIds, seats) => {
    const { selected } = get();
    const ids = new Set<number>();
    for (const id of seatIds) {
      const seat = selected.find((s) => s.seatId === id);
      if (seat) coupleGroup(seat, seats).forEach((s) => ids.add(s.seatId));
    }
    const removed = selected.filter((s) => ids.has(s.seatId));
    if (removed.length > 0) set({ selected: selected.filter((s) => !ids.has(s.seatId)) });
    return removed;
  },
  sync: (seats) => {
    const status = new Map(seats.map((s) => [s.seatId, s.status]));
    const gone = get()
      .selected.filter((s) => status.get(s.seatId) !== "AVAILABLE")
      .map((s) => s.seatId);
    return gone.length > 0 ? get().drop(gone, seats) : [];
  },
  clear: () => set({ selected: [] }),
}));
