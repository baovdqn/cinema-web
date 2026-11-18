import type { SeatStatus, SeatType, ShowtimeSeat } from "@/types/api";

export const SEAT_TYPE_LABEL: Record<SeatType, string> = {
  STANDARD: "Thường",
  VIP: "VIP",
  COUPLE: "Ghế đôi",
};

export const seatLabel = (s: Pick<ShowtimeSeat, "seatRow" | "seatNumber">) => `${s.seatRow}${s.seatNumber}`;

type SeatRef = Pick<ShowtimeSeat, "seatRow" | "seatNumber">;

/** Sắp xếp theo hàng rồi số ghế (không đổi mảng gốc). */
export const sortSeats = <T extends SeatRef>(seats: T[]): T[] =>
  [...seats].sort((a, b) => a.seatRow.localeCompare(b.seatRow) || a.seatNumber - b.seatNumber);

export const seatLabels = (seats: SeatRef[]) => sortSeats(seats).map(seatLabel).join(", ");

/** Ghế đôi ghép theo cặp (1-2, 3-4, ...): số lẻ đi với số kế tiếp, số chẵn đi với số liền trước. */
export function coupleGroup(seat: ShowtimeSeat, seats: ShowtimeSeat[]): ShowtimeSeat[] {
  if (seat.seatType !== "COUPLE") return [seat];
  const partnerNumber = seat.seatNumber % 2 === 1 ? seat.seatNumber + 1 : seat.seatNumber - 1;
  const partner = seats.find(
    (s) => s.seatType === "COUPLE" && s.seatRow === seat.seatRow && s.seatNumber === partnerNumber,
  );
  if (!partner) return [seat];
  return seat.seatNumber < partner.seatNumber ? [seat, partner] : [partner, seat];
}

/** Gom ghế trong 1 hàng thành các "đơn vị" bấm được: ghế thường/VIP đứng riêng, ghế đôi đi theo cặp. */
export function groupRowUnits(rowSeats: ShowtimeSeat[]): ShowtimeSeat[][] {
  const units: ShowtimeSeat[][] = [];
  const used = new Set<number>();
  for (const seat of rowSeats) {
    if (used.has(seat.seatId)) continue;
    const unit = coupleGroup(seat, rowSeats);
    unit.forEach((s) => used.add(s.seatId));
    units.push(unit);
  }
  return units;
}

/** Trạng thái của 1 đơn vị: chỉ AVAILABLE khi mọi ghế đều trống. */
export function unitStatus(unit: ShowtimeSeat[]): SeatStatus {
  if (unit.some((s) => s.status === "SOLD")) return "SOLD";
  if (unit.some((s) => s.status === "HELD")) return "HELD";
  return "AVAILABLE";
}

/** Nhóm ghế theo hàng, hàng và ghế đã sắp xếp. */
export function groupByRow(seats: ShowtimeSeat[]): [string, ShowtimeSeat[]][] {
  const map = new Map<string, ShowtimeSeat[]>();
  for (const s of seats) map.set(s.seatRow, [...(map.get(s.seatRow) ?? []), s]);
  return [...map.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([row, list]) => [row, [...list].sort((a, b) => a.seatNumber - b.seatNumber)]);
}
