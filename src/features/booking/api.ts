import { api } from "@/lib/api-client";
import type { Booking } from "@/types/api";

// TODO: khớp endpoint với backend
export const bookingApi = {
  create: (body: { showtimeId: string; seatIds: string[] }) =>
    api.post<Booking>("/bookings", body).then((r) => r.data),
  detail: (id: string) => api.get<Booking>(`/bookings/${id}`).then((r) => r.data),
  mine: () => api.get<Booking[]>("/bookings/me").then((r) => r.data),
  cancel: (id: string) => api.post<Booking>(`/bookings/${id}/cancel`).then((r) => r.data),
  pay: (id: string, method: string) =>
    api.post<{ paymentUrl?: string; booking: Booking }>(`/bookings/${id}/pay`, { method }).then((r) => r.data),
};
