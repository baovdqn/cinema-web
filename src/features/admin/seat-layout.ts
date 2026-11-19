import type { AdminSeat, SeatLayout } from "@/types/api";

export const MAX_ROWS = 20;
export const MAX_SEATS_PER_ROW = 30;

/** Tên hàng theo thứ tự: A, B, C... */
export const rowLabel = (index: number) => String.fromCharCode(65 + index);
export const rowLabels = (rows: number) => Array.from({ length: Math.max(0, rows) }, (_, i) => rowLabel(i));

/** Lỗi cấu hình layout (tiếng Việt) hoặc null nếu hợp lệ. Dùng chung FE + mock. */
export function validateLayout(l: SeatLayout): string | null {
  if (!Number.isInteger(l.rows) || l.rows < 1 || l.rows > MAX_ROWS) return `Số hàng phải từ 1 đến ${MAX_ROWS}`;
  if (!Number.isInteger(l.seatsPerRow) || l.seatsPerRow < 1 || l.seatsPerRow > MAX_SEATS_PER_ROW)
    return `Số ghế mỗi hàng phải từ 1 đến ${MAX_SEATS_PER_ROW}`;
  if (l.lastRowCouple && l.seatsPerRow % 2 !== 0) return "Hàng ghế đôi cần số ghế mỗi hàng là số chẵn";
  return null;
}

/** Sinh danh sách ghế: hàng cuối COUPLE (nếu bật), hàng trong vipRows là VIP, còn lại STANDARD. */
export function generateSeats(l: SeatLayout): AdminSeat[] {
  const seats: AdminSeat[] = [];
  for (let r = 0; r < l.rows; r++) {
    const seatRow = rowLabel(r);
    const seatType = l.lastRowCouple && r === l.rows - 1 ? "COUPLE" : l.vipRows.includes(seatRow) ? "VIP" : "STANDARD";
    for (let n = 1; n <= l.seatsPerRow; n++) seats.push({ seatRow, seatNumber: n, seatType });
  }
  return seats;
}
