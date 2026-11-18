"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { bookingApi } from "./api";

export const bookingKeys = {
  mine: ["bookings", "mine"] as const,
  detail: (id: string) => ["bookings", "detail", id] as const,
};

export function useCreateBooking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: bookingApi.create,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["showtimes", "seats"] }),
  });
}

export function useBooking(id: string) {
  return useQuery({ queryKey: bookingKeys.detail(id), queryFn: () => bookingApi.detail(id) });
}

export function useMyBookings() {
  return useQuery({ queryKey: bookingKeys.mine, queryFn: bookingApi.mine });
}
