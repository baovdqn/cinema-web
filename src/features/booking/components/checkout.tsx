"use client";

import Link from "next/link";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { getErrorStatus } from "@/lib/api-client";
import type { Booking } from "@/types/api";
import { useBooking } from "../hooks";
import { CheckoutSummary } from "./checkout-summary";
import { ExpiredNotice, PaymentPanel } from "./payment-panel";
import { ConfirmedView } from "./ticket-list";

function StatusView({ booking }: { booking: Booking }) {
  switch (booking.status) {
    case "HELD":
      return <PaymentPanel booking={booking} />;
    case "PAYING":
      return (
        <section role="status" className="rounded-xl border border-neutral-800 bg-neutral-900 p-6">
          <h2 className="text-lg font-semibold">Đang xác nhận thanh toán</h2>
          <p className="mt-2 text-sm text-neutral-300">
            Đang xác nhận thanh toán. Vui lòng không thanh toán lại, bạn sẽ không bị trừ tiền hai lần.
          </p>
          <p className="mt-2 text-sm text-neutral-400">
            Kết quả sẽ hiện trong Lịch sử đặt vé. Trang này tự cập nhật mỗi vài giây.
          </p>
          <Link href="/my-bookings" className="mt-4 inline-block text-sm text-red-400 hover:underline">
            Xem Lịch sử đặt vé
          </Link>
        </section>
      );
    case "CONFIRMED":
      return <ConfirmedView booking={booking} />;
    case "EXPIRED":
      return <ExpiredNotice showtimeId={booking.showtimeId} text="Hết thời gian giữ ghế" />;
    case "CANCELLED":
      return <ExpiredNotice showtimeId={booking.showtimeId} text="Đơn đặt vé đã được huỷ" />;
    case "FAILED":
      return (
        <ExpiredNotice
          showtimeId={booking.showtimeId}
          text="Không thể giữ ghế cho bạn. Giao dịch đã được hủy, bạn sẽ không bị mất tiền"
        />
      );
  }
}

export function Checkout({ bookingId }: { bookingId: string }) {
  const { data: booking, isLoading, error, refetch } = useBooking(bookingId);

  if (isLoading)
    return (
      <div aria-busy="true" className="grid gap-6 md:grid-cols-2">
        <Skeleton className="h-48" />
        <Skeleton className="h-72" />
      </div>
    );
  const status = getErrorStatus(error);
  if (status === 403 || status === 404)
    return (
      <EmptyState
        title="Không tìm thấy đơn đặt vé"
        description="Đơn không tồn tại hoặc bạn không có quyền xem."
        action={
          <Link href="/" className="text-red-400 hover:underline">
            Về trang chủ
          </Link>
        }
      />
    );
  if (error || !booking) return <ErrorState error={error} onRetry={() => refetch()} />;

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Thanh toán</h1>
      <div className="grid items-start gap-6 md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <CheckoutSummary booking={booking} />
        <StatusView booking={booking} />
      </div>
    </div>
  );
}
