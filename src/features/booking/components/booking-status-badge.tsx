import { cn } from "@/lib/utils";
import type { BookingStatus } from "@/types/api";

export const BOOKING_STATUS: Record<BookingStatus, { label: string; cls: string }> = {
  HELD: { label: "Đang giữ ghế", cls: "bg-amber-500/15 text-amber-400 ring-amber-500/40" },
  PAYING: { label: "Đang thanh toán", cls: "bg-sky-500/15 text-sky-400 ring-sky-500/40" },
  CONFIRMED: { label: "Đã xác nhận", cls: "bg-green-500/15 text-green-400 ring-green-500/40" },
  CANCELLED: { label: "Đã huỷ", cls: "bg-neutral-700/40 text-neutral-400 ring-neutral-600" },
  EXPIRED: { label: "Hết hạn", cls: "bg-neutral-700/40 text-neutral-400 ring-neutral-600" },
  FAILED: { label: "Thất bại", cls: "bg-red-600/20 text-red-400 ring-red-600/40" },
};

export function BookingStatusBadge({ status, className }: { status: BookingStatus; className?: string }) {
  const s = BOOKING_STATUS[status];
  return (
    <span
      className={cn("inline-block shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1", s.cls, className)}
    >
      {s.label}
    </span>
  );
}
