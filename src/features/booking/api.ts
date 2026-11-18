import { api } from "@/lib/api-client";
import { newIdempotencyKey } from "@/lib/utils";
import type { Booking, Ticket } from "@/types/api";

export type PayOutcome = "success" | "declined" | "pending";

// Backend Phase 4 (Booking core) — chưa có. Thiết kế theo docs/03-data-model.md mục 5.
// TODO: khớp endpoint với backend cho toàn bộ file này.
function safeDecode(v: string) {
  try {
    return decodeURIComponent(v);
  } catch {
    return v;
  }
}

export const bookingApi = {
  /** Giữ ghế (1–4 ghế, all-or-nothing, 8 phút). 409 -> HoldConflict. */
  hold: (body: { showtimeId: number; seatIds: number[] }, idempotencyKey = newIdempotencyKey()) =>
    api
      .post<Booking>("/bookings", body, { headers: { "Idempotency-Key": idempotencyKey } })
      .then((r) => r.data),
  detail: (id: string) => api.get<Booking>(`/bookings/${id}`).then((r) => r.data),
  mine: () => api.get<Booking[]>("/bookings/me").then((r) => r.data),
  /** UC8: huỷ giữ ghế khi chưa thanh toán */
  cancel: (id: string) => api.post<Booking>(`/bookings/${id}/cancel`).then((r) => r.data),
  /** UC6: thanh toán giả lập. 200 -> CONFIRMED/HELD(bị từ chối), 202 -> PAYING (poll lại), 409 -> còn < 30s */
  pay: (id: string, idempotencyKey: string, outcome?: PayOutcome) =>
    api
      .post<Booking>(`/bookings/${id}/pay`, null, {
        headers: { "Idempotency-Key": idempotencyKey },
        // Chỉ mock (MSW) đọc `outcome`; backend thật bỏ qua.
        params: outcome ? { outcome } : undefined,
      })
      .then((r) => {
        const header = r.headers["x-payment-message"] as string | undefined;
        return { status: r.status, booking: r.data, message: header ? safeDecode(header) : undefined };
      }),
  tickets: (id: string) => api.get<Ticket[]>(`/bookings/${id}/tickets`).then((r) => r.data),
};
