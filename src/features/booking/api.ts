import { api } from "@/lib/api-client";
import { newIdempotencyKey } from "@/lib/utils";
import type { Booking, Ticket } from "@/types/api";

// Backend Phase 4 (Booking core) — chưa có. Thiết kế theo docs/03-data-model.md mục 5.
// TODO: khớp endpoint với backend cho toàn bộ file này.
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
  pay: (id: string, idempotencyKey: string) =>
    api
      .post<Booking>(`/bookings/${id}/pay`, null, { headers: { "Idempotency-Key": idempotencyKey } })
      .then((r) => ({ status: r.status, booking: r.data })),
  tickets: (id: string) => api.get<Ticket[]>(`/bookings/${id}/tickets`).then((r) => r.data),
};
