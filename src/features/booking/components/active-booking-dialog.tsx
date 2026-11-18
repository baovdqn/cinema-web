"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { seatLabels } from "../seat-utils";
import type { HoldConflict } from "@/types/api";

/** Dialog khi đã có booking HELD/PAYING cho suất này (409 activeBooking). */
export function ActiveBookingDialog({
  booking,
  busy,
  onContinue,
  onReplace,
  onClose,
}: {
  booking: NonNullable<HoldConflict["activeBooking"]> | null;
  busy: boolean;
  onContinue: () => void;
  onReplace: () => void;
  onClose: () => void;
}) {
  const [confirming, setConfirming] = useState(false);
  if (!booking) return null;
  const labels = seatLabels(booking.seats);

  function close() {
    setConfirming(false);
    onClose();
  }

  return (
    <Dialog
      open
      onClose={busy ? () => {} : close}
      title={confirming ? "Đổi ghế?" : `Bạn đang giữ ${labels} cho suất này`}
      footer={
        confirming ? (
          <>
            <Button variant="secondary" disabled={busy} onClick={() => setConfirming(false)}>
              Quay lại
            </Button>
            <Button disabled={busy} onClick={onReplace}>
              {busy ? "Đang nhả ghế..." : "Xác nhận đổi ghế"}
            </Button>
          </>
        ) : (
          <>
            <Button variant="secondary" onClick={() => setConfirming(true)}>
              Đổi ghế
            </Button>
            <Button onClick={onContinue}>Tiếp tục thanh toán</Button>
          </>
        )
      }
    >
      {confirming
        ? `Ghế ${labels} sẽ được nhả, người khác có thể chọn.`
        : "Mỗi suất chiếu chỉ được giữ một đơn tại một thời điểm. Bạn có thể tiếp tục thanh toán hoặc đổi ghế."}
    </Dialog>
  );
}
