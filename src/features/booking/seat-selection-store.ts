import { create } from "zustand";
import type { Seat } from "@/types/api";

const MAX_SEATS = 8;

interface SeatSelectionState {
  showtimeId: string | null;
  selected: Seat[];
  init: (showtimeId: string) => void;
  toggle: (seat: Seat) => void;
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
      const exists = s.selected.some((x) => x.id === seat.id);
      if (exists) return { selected: s.selected.filter((x) => x.id !== seat.id) };
      if (s.selected.length >= MAX_SEATS) return s;
      return { selected: [...s.selected, seat] };
    }),
  clear: () => set({ selected: [] }),
}));
