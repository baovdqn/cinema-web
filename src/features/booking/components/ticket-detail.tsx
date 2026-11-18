"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { getErrorStatus } from "@/lib/api-client";
import { useBooking } from "../hooks";
import { BookingStatusBadge } from "./booking-status-badge";
import { CheckoutSummary } from "./checkout-summary";
import { TicketList } from "./ticket-list";

const backLink = (
  <Link href="/my-bookings" className="text-sm text-red-400 hover:underline">
    ← Vé của tôi
  </Link>
);

/** Chi tiết vé: tóm tắt đơn + QR từng ghế. Chưa CONFIRMED thì chuyển về trang thanh toán / báo trạng thái. */
export function TicketDetail({ bookingId }: { bookingId: string }) {
  const router = useRouter();
  const { data: booking, isLoading, error, refetch } = useBooking(bookingId);
  const status = booking?.status;
  const toCheckout = status === "HELD" || status === "PAYING";

  useEffect(() => {
    if (toCheckout) router.replace(`/checkout/${bookingId}`);
  }, [toCheckout, router, bookingId]);

  if (isLoading || toCheckout)
    return (
      <div aria-busy="true" className="grid gap-4">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-44" />
        <Skeleton className="h-72" />
      </div>
    );
  const code = getErrorStatus(error);
  if (code === 403 || code === 404)
    return (
      <EmptyState
        title="Không tìm thấy vé"
        description="Đơn không tồn tại hoặc bạn không có quyền xem."
        action={backLink}
      />
    );
  if (error || !booking) return <ErrorState error={error} onRetry={() => refetch()} />;

  return (
    <div className="grid gap-5">
      <div>{backLink}</div>
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Vé xem phim</h1>
        <BookingStatusBadge status={booking.status} />
      </div>
      <CheckoutSummary booking={booking} />
      {booking.status === "CONFIRMED" ? (
        <TicketList booking={booking} />
      ) : (
        <EmptyState
          title={
            booking.status === "EXPIRED"
              ? "Đơn đã hết hạn giữ ghế"
              : booking.status === "CANCELLED"
                ? "Đơn đặt vé đã được huỷ"
                : "Giao dịch đã được hủy, bạn sẽ không bị mất tiền"
          }
          description="Đơn này không có vé."
          action={
            <Link href={`/showtimes/${booking.showtimeId}/seats`} className="text-red-400 hover:underline">
              Chọn lại ghế
            </Link>
          }
        />
      )}
    </div>
  );
}
