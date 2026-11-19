import { beforeEach, describe, expect, it } from "vitest";
import type { ShowtimeSeat } from "@/types/api";
import { MAX_SEATS, useSeatSelection } from "./seat-selection-store";
import { coupleGroup, groupByRow, seatLabels, unitStatus } from "./seat-utils";

let id = 1;
const seat = (row: string, n: number, over: Partial<ShowtimeSeat> = {}): ShowtimeSeat => ({
  seatId: id++,
  seatRow: row,
  seatNumber: n,
  seatType: "STANDARD",
  status: "AVAILABLE",
  price: 80000,
  ...over,
});

function buildMap() {
  id = 1;
  const std = Array.from({ length: 8 }, (_, i) => seat("A", i + 1));
  const couple = Array.from({ length: 6 }, (_, i) => seat("J", i + 1, { seatType: "COUPLE", price: 150000 }));
  return [...std, ...couple];
}

describe("seat selection store", () => {
  let seats: ShowtimeSeat[];
  beforeEach(() => {
    seats = buildMap();
    useSeatSelection.setState({ showtimeId: null, selected: [] });
    useSeatSelection.getState().init(1);
  });
  const st = () => useSeatSelection.getState();

  it("selects and deselects a single seat", () => {
    expect(st().toggle(seats[0], seats)).toBe("selected");
    expect(st().selected).toHaveLength(1);
    expect(st().toggle(seats[0], seats)).toBe("deselected");
    expect(st().selected).toHaveLength(0);
  });

  it(`caps at ${MAX_SEATS} seats`, () => {
    for (let i = 0; i < MAX_SEATS; i++) expect(st().toggle(seats[i], seats)).toBe("selected");
    expect(st().toggle(seats[4], seats)).toBe("limit");
    expect(st().selected).toHaveLength(MAX_SEATS);
  });

  it("couple seats are selected as a pair and count as 2", () => {
    const j2 = seats.find((s) => s.seatRow === "J" && s.seatNumber === 2)!;
    expect(st().toggle(j2, seats)).toBe("selected");
    expect(st().selected.map((s) => s.seatNumber).sort()).toEqual([1, 2]);
    // Bỏ chọn bằng ghế còn lại của cặp -> bỏ cả cặp
    const j1 = seats.find((s) => s.seatRow === "J" && s.seatNumber === 1)!;
    expect(st().toggle(j1, seats)).toBe("deselected");
    expect(st().selected).toHaveLength(0);
  });

  it("cannot select a couple pair when only 1 slot is left", () => {
    for (let i = 0; i < 3; i++) st().toggle(seats[i], seats);
    const j1 = seats.find((s) => s.seatRow === "J" && s.seatNumber === 1)!;
    expect(st().toggle(j1, seats)).toBe("limit");
    expect(st().selected).toHaveLength(3);
  });

  it("two couple pairs fill the limit exactly", () => {
    const j = (n: number) => seats.find((s) => s.seatRow === "J" && s.seatNumber === n)!;
    expect(st().toggle(j(1), seats)).toBe("selected");
    expect(st().toggle(j(3), seats)).toBe("selected");
    expect(st().selected).toHaveLength(4);
    expect(st().toggle(j(5), seats)).toBe("limit");
  });

  it("rejects unavailable seats and pairs with an unavailable half", () => {
    const held = seats.map((s) => (s.seatRow === "J" && s.seatNumber === 2 ? { ...s, status: "HELD" as const } : s));
    expect(st().toggle(held[0], held)).toBe("selected");
    const j1 = held.find((s) => s.seatRow === "J" && s.seatNumber === 1)!;
    expect(st().toggle(j1, held)).toBe("unavailable");
    expect(st().selected).toHaveLength(1);
  });

  it("sync drops seats that are no longer available (and their couple partner)", () => {
    const j1 = seats.find((s) => s.seatRow === "J" && s.seatNumber === 1)!;
    st().toggle(seats[0], seats);
    st().toggle(j1, seats);
    expect(st().selected).toHaveLength(3);
    const next = seats.map((s) =>
      s.seatId === seats[0].seatId || (s.seatRow === "J" && s.seatNumber === 2) ? { ...s, status: "HELD" as const } : s,
    );
    const removed = st().sync(next);
    expect(removed).toHaveLength(3);
    expect(st().selected).toHaveLength(0);
  });

  it("sync keeps still-available seats and returns [] when nothing changed", () => {
    st().toggle(seats[0], seats);
    expect(st().sync(seats)).toEqual([]);
    expect(st().selected).toHaveLength(1);
  });

  it("init with a different showtime resets, the same keeps", () => {
    st().toggle(seats[0], seats);
    st().init(1);
    expect(st().selected).toHaveLength(1);
    st().init(2);
    expect(st().selected).toHaveLength(0);
  });
});

describe("seat-utils", () => {
  it("coupleGroup pairs 1-2, 3-4 and returns single for non-couple", () => {
    const seats = buildMap();
    const j3 = seats.find((s) => s.seatRow === "J" && s.seatNumber === 3)!;
    expect(coupleGroup(j3, seats).map((s) => s.seatNumber)).toEqual([3, 4]);
    expect(coupleGroup(seats[0], seats)).toEqual([seats[0]]);
  });

  it("unitStatus prioritises SOLD > HELD > AVAILABLE", () => {
    const [a, b] = [seat("J", 1), seat("J", 2)];
    expect(unitStatus([a, b])).toBe("AVAILABLE");
    expect(unitStatus([a, { ...b, status: "HELD" }])).toBe("HELD");
    expect(unitStatus([{ ...a, status: "SOLD" }, { ...b, status: "HELD" }])).toBe("SOLD");
  });

  it("seatLabels sorts and groupByRow groups", () => {
    const seats = [seat("B", 2), seat("A", 10), seat("A", 2)];
    expect(seatLabels(seats)).toBe("A2, A10, B2");
    expect(groupByRow(seats).map(([r, l]) => [r, l.length])).toEqual([["A", 2], ["B", 1]]);
  });
});
