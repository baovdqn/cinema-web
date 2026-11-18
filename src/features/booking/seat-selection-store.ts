import { create } from "zustand";
import type { ShowtimeSeat } from "@/types/api";

/** Quy tắc nghiệp vụ backend: tối đa 4 ghế mỗi lần đặt. */
export const MAX_SEATS = 4;

interface SeatSelectionState {
  showtimeId: number | null;
  selected: ShowtimeSeat[];
  init: (showtimeId: number) => void;
  toggle: (seat: ShowtimeSeat) => void;
  clear: () => void;
}

export const useSeatSelection = create<SeatSelectionState>((set, get) => ({
  showtimeId: null,
  selected: [],
  init: (showtimeId) => {
    if (get().showtimeId !== showtimeId) set({ showtimeId, selected: [] });
  },
  toggle: (seat) =>
    set((s) => {
      if (seat.status !== "AVAILABLE") return s;
      const exists = s.selected.some((x) => x.seatId === seat.seatId);
      if (exists) return { selected: s.selected.filter((x) => x.seatId !== seat.seatId) };
      if (s.selected.length >= MAX_SEATS) return s;
      return { selected: [...s.selected, seat] };
    }),
  clear: () => set({ selected: [] }),
}));
