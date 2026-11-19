import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthGuard } from "@/components/auth-guard";
import { MyBookings, MyBookingsSkeleton } from "@/features/booking/components/my-bookings";

export const metadata: Metadata = { title: "Vé của tôi" };

export default function MyBookingsPage() {
  return (
    <AuthGuard>
      <Suspense fallback={<MyBookingsSkeleton />}>
        <MyBookings />
      </Suspense>
    </AuthGuard>
  );
}
