"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { bookingApi } from "./api";

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
