"use client";

import { useRef, useState } from "react";
import { getErrorMessage, getErrorStatus } from "@/lib/api-client";
import { newIdempotencyKey } from "@/lib/utils";
import type { PayOutcome } from "./api";
import { usePayBooking } from "./hooks";

export interface PayError {
  /** Không có response (mất mạng/timeout): kết quả chưa rõ -> retry với CÙNG Idempotency-Key. */
  network: boolean;
  message: string;
}

/**
 * Quản lý 1 Idempotency-Key cho mỗi lần bấm thanh toán:
 * - key giữ nguyên khi request lỗi mạng (retry an toàn, không trừ tiền 2 lần);
 * - key bị bỏ khi đã có kết quả dứt khoát (200/202/lỗi có response) -> lần bấm sau dùng key mới.
 */
export function usePayFlow(bookingId: string) {
  const pay = usePayBooking(bookingId);
  const keyRef = useRef<string | null>(null);
  const [declined, setDeclined] = useState<string | null>(null);
  const [error, setError] = useState<PayError | null>(null);

  function submit(outcome?: PayOutcome) {
    if (pay.isPending) return;
    keyRef.current ??= newIdempotencyKey();
    setDeclined(null);
    setError(null);
    pay.mutate(
      { idempotencyKey: keyRef.current, outcome },
      {
        onSuccess: (r) => {
          keyRef.current = null;
          if (r.status === 200 && r.booking.status === "HELD") setDeclined(r.message ?? "Thẻ bị từ chối");
        },
        onError: (e) => {
          const network = getErrorStatus(e) === undefined;
          if (!network) keyRef.current = null;
          setError({ network, message: getErrorMessage(e) });
        },
      },
    );
  }

  return { submit, isPending: pay.isPending, declined, error, retrying: error?.network === true };
}
