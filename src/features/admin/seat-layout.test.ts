import { describe, expect, it } from "vitest";
import { generateSeats, MAX_ROWS, rowLabels, validateLayout } from "./seat-layout";

describe("admin seat-layout", () => {
  it("generates rows x seats with VIP and COUPLE rows", () => {
    const seats = generateSeats({ rows: 5, seatsPerRow: 6, vipRows: ["C", "D"], lastRowCouple: true });
    expect(seats).toHaveLength(30);
    const type = (row: string) => new Set(seats.filter((s) => s.seatRow === row).map((s) => s.seatType));
    expect(type("A")).toEqual(new Set(["STANDARD"]));
    expect(type("C")).toEqual(new Set(["VIP"]));
    expect(type("E")).toEqual(new Set(["COUPLE"]));
    expect(seats.filter((s) => s.seatRow === "A").map((s) => s.seatNumber)).toEqual([1, 2, 3, 4, 5, 6]);
  });

  it("no couple row when disabled; couple wins over VIP on the last row", () => {
    const a = generateSeats({ rows: 3, seatsPerRow: 2, vipRows: [], lastRowCouple: false });
    expect(a.every((s) => s.seatType === "STANDARD")).toBe(true);
    const b = generateSeats({ rows: 3, seatsPerRow: 2, vipRows: ["C"], lastRowCouple: true });
    expect(b.filter((s) => s.seatRow === "C").every((s) => s.seatType === "COUPLE")).toBe(true);
  });

  it("rowLabels", () => {
    expect(rowLabels(3)).toEqual(["A", "B", "C"]);
    expect(rowLabels(-1)).toEqual([]);
  });

  it("validateLayout", () => {
    expect(validateLayout({ rows: 10, seatsPerRow: 12, vipRows: [], lastRowCouple: true })).toBeNull();
    expect(validateLayout({ rows: 0, seatsPerRow: 12, vipRows: [], lastRowCouple: false })).toMatch(/số hàng/i);
    expect(validateLayout({ rows: MAX_ROWS + 1, seatsPerRow: 12, vipRows: [], lastRowCouple: false })).not.toBeNull();
    expect(validateLayout({ rows: 5, seatsPerRow: 0, vipRows: [], lastRowCouple: false })).toMatch(/ghế mỗi hàng/i);
    expect(validateLayout({ rows: 5, seatsPerRow: 7, vipRows: [], lastRowCouple: true })).toMatch(/số chẵn/);
  });
});
