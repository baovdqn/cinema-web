"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getErrorStatus } from "@/lib/api-client";
import { bookingApi, type PayOutcome } from "./api";

export const bookingKeys = {
  mine: ["bookings", "mine"] as const,
  detail: (id: string) => ["bookings", "detail", id] as const,
  tickets: (id: string) => ["bookings", "tickets", id] as const,
};

export function useHoldSeats() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { showtimeId: number; seatIds: number[] }) => bookingApi.hold(body),
    onSettled: () => qc.invalidateQueries({ queryKey: ["showtimes", "seats"] }),
  });
}

/** Booking PAYING thì poll 3s cho tới khi có kết quả. */
export function useBooking(id: string) {
  return useQuery({
    queryKey: bookingKeys.detail(id),
    queryFn: () => bookingApi.detail(id),
    refetchInterval: (q) => (q.state.data?.status === "PAYING" ? 3_000 : false),
  });
}

export function useMyBookings() {
  return useQuery({ queryKey: bookingKeys.mine, queryFn: bookingApi.mine });
}

export function useCancelBooking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: bookingApi.cancel,
    onSuccess: (b) => {
      qc.setQueryData(bookingKeys.detail(String(b.id)), b);
      qc.invalidateQueries({ queryKey: ["showtimes", "seats"] });
    },
  });
}

/** Thanh toán giả lập. Idempotency-Key do caller giữ (1 key / lần bấm, giữ nguyên khi retry do mạng). */
export function usePayBooking(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { idempotencyKey: string; outcome?: PayOutcome }) =>
      bookingApi.pay(id, v.idempotencyKey, v.outcome),
    onSuccess: (r) => qc.setQueryData(bookingKeys.detail(id), r.booking),
    onError: (e) => {
      // Có response (vd 409) thì booking có thể đã đổi -> đọc lại.
      if (getErrorStatus(e) !== undefined) qc.invalidateQueries({ queryKey: bookingKeys.detail(id) });
    },
  });
}

/** Vé của booking — chỉ gọi khi CONFIRMED. */
export function useTickets(id: string, enabled: boolean) {
  return useQuery({ queryKey: bookingKeys.tickets(id), queryFn: () => bookingApi.tickets(id), enabled });
}
