"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { toast } from "@/components/ui/toast";
import { getErrorMessage } from "@/lib/api-client";
import { formatCountdown, useCountdown } from "@/lib/use-countdown";
import { cn } from "@/lib/utils";
import type { Booking } from "@/types/api";
import type { PayOutcome } from "../api";
import { bookingKeys, useCancelBooking } from "../hooks";
import { usePayFlow } from "../use-pay-flow";

const MIN_PAY_MS = 30_000;
const WARN_AT_SECONDS = [120, 60];
const METHODS = ["Thẻ ATM/Visa (giả lập)", "Ví điện tử (giả lập)"];
const MOCKING = process.env.NEXT_PUBLIC_API_MOCKING === "enabled";

export function seatsPath(showtimeId: number) {
  return `/showtimes/${showtimeId}/seats`;
}

/** Cảnh báo 1 lần ở mốc 2' và 1' (vào trang khi đã qua mốc thì chỉ báo mốc gần nhất). */
function useExpiryWarnings(remaining: number | null) {
  const fired = useRef(new Set<number>());
  useEffect(() => {
    if (remaining == null || remaining <= 0) return;
    const crossed = WARN_AT_SECONDS.filter((s) => remaining <= s * 1000 && !fired.current.has(s));
    if (crossed.length === 0) return;
    crossed.forEach((s) => fired.current.add(s));
    const mins = Math.min(...crossed) / 60;
    toast.warning(`Ghế của bạn sẽ được nhả sau ${mins === 1 ? "1 phút" : "2 phút"}, hãy thanh toán sớm.`);
  }, [remaining]);
}

export function ExpiredNotice({ showtimeId, text }: { showtimeId: number; text: string }) {
  return (
    <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-6 text-center">
      <p className="text-lg font-semibold">{text}</p>
      <Link
        href={seatsPath(showtimeId)}
        className="mt-4 inline-flex rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-500"
      >
        Chọn lại ghế
      </Link>
    </div>
  );
}

/** Màn thanh toán cho booking HELD: đếm ngược, chọn phương thức, thanh toán, huỷ giữ ghế. */
export function PaymentPanel({ booking }: { booking: Booking }) {
  const id = String(booking.id);
  const router = useRouter();
  const qc = useQueryClient();
  const remaining = useCountdown(booking.expiresAt);
  const flow = usePayFlow(id);
  const cancel = useCancelBooking();
  const [method, setMethod] = useState(METHODS[0]);
  const [outcome, setOutcome] = useState<PayOutcome | "">("");
  const [confirmCancel, setConfirmCancel] = useState(false);

  useExpiryWarnings(remaining);

  const expired = remaining != null && remaining <= 0;
  useEffect(() => {
    if (expired) qc.invalidateQueries({ queryKey: bookingKeys.detail(id) });
  }, [expired, qc, id]);

  if (expired) return <ExpiredNotice showtimeId={booking.showtimeId} text="Hết thời gian giữ ghế" />;

  const tooLate = remaining != null && remaining < MIN_PAY_MS;
  const urgent = remaining != null && remaining <= 120_000;

  function onCancel() {
    cancel.mutate(id, {
      onSuccess: () => {
        toast.success("Đã huỷ giữ ghế.");
        router.push(seatsPath(booking.showtimeId));
      },
      onError: (e) => {
        setConfirmCancel(false);
        toast.error(getErrorMessage(e));
        qc.invalidateQueries({ queryKey: bookingKeys.detail(id) });
      },
    });
  }

  return (
    <section className="rounded-xl border border-neutral-800 bg-neutral-900 p-4 sm:p-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-neutral-400">Thời gian giữ ghế còn lại</p>
        <p
          role="timer"
          aria-label="Thời gian giữ ghế còn lại"
          className={cn("text-3xl font-bold tabular-nums", urgent ? "text-red-400" : "text-neutral-100")}
        >
          {remaining == null ? "--:--" : formatCountdown(remaining)}
        </p>
      </div>

      <fieldset className="mt-6 space-y-2" disabled={flow.isPending}>
        <legend className="mb-2 text-sm font-medium">Phương thức thanh toán</legend>
        {METHODS.map((m) => (
          <label
            key={m}
            className={cn(
              "flex cursor-pointer items-center gap-3 rounded-lg border px-4 py-3 text-sm",
              method === m ? "border-red-500 bg-red-950/30" : "border-neutral-700 hover:border-neutral-500",
            )}
          >
            <input type="radio" name="method" checked={method === m} onChange={() => setMethod(m)} className="accent-red-600" />
            {m}
          </label>
        ))}
      </fieldset>

      {MOCKING && (
        <label className="mt-4 flex items-center gap-2 text-xs text-neutral-400">
          Kết quả giả lập:
          <select
            value={outcome}
            onChange={(e) => setOutcome(e.target.value as PayOutcome | "")}
            className="rounded border border-neutral-700 bg-neutral-950 px-2 py-1 text-neutral-200"
          >
            <option value="">Ngẫu nhiên</option>
            <option value="success">Thành công</option>
            <option value="declined">Từ chối</option>
            <option value="pending">Đang xử lý</option>
          </select>
        </label>
      )}

      {flow.isPending && (
        <p role="status" className="mt-4 rounded-lg border border-neutral-700 bg-neutral-950 px-4 py-3 text-sm text-neutral-200">
          Đang xác nhận thanh toán. Vui lòng không thanh toán lại, bạn sẽ không bị trừ tiền hai lần.
        </p>
      )}
      {flow.declined && !flow.isPending && (
        <p role="alert" className="mt-4 rounded-lg border border-red-800 bg-red-950/40 px-4 py-3 text-sm text-red-300">
          {flow.declined}
          {tooLate ? "" : ". Bạn có thể thử lại hoặc chọn phương thức khác."}
        </p>
      )}
      {flow.error && !flow.isPending && (
        <p role="alert" className="mt-4 rounded-lg border border-red-800 bg-red-950/40 px-4 py-3 text-sm text-red-300">
          {flow.error.network
            ? "Không kết nối được máy chủ nên chưa rõ kết quả thanh toán. Bấm Thử lại, bạn sẽ không bị trừ tiền hai lần."
            : flow.error.message}
        </p>
      )}

      {tooLate && (
        <p role="alert" className="mt-4 text-sm text-amber-400">
          Không đủ thời gian thanh toán, vui lòng chọn lại ghế
        </p>
      )}

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <Button
          className="flex-1 py-2.5"
          disabled={tooLate || flow.isPending}
          onClick={() => flow.submit(outcome || undefined)}
        >
          {flow.isPending
            ? "Đang xử lý..."
            : flow.retrying
              ? "Thử lại"
              : flow.declined
                ? "Thanh toán lại"
                : "Thanh toán"}
        </Button>
        {tooLate ? (
          <Link
            href={seatsPath(booking.showtimeId)}
            className="inline-flex items-center justify-center rounded-md bg-neutral-800 px-4 py-2 text-sm font-medium hover:bg-neutral-700"
          >
            Chọn lại ghế
          </Link>
        ) : null}
        <Button variant="secondary" disabled={flow.isPending} onClick={() => setConfirmCancel(true)}>
          Huỷ giữ ghế
        </Button>
      </div>

      <Dialog
        open={confirmCancel}
        onClose={() => !cancel.isPending && setConfirmCancel(false)}
        title="Huỷ giữ ghế?"
        footer={
          <>
            <Button variant="secondary" disabled={cancel.isPending} onClick={() => setConfirmCancel(false)}>
              Không, giữ lại
            </Button>
            <Button disabled={cancel.isPending} onClick={onCancel}>
              {cancel.isPending ? "Đang huỷ..." : "Huỷ giữ ghế"}
            </Button>
          </>
        }
      >
        Ghế sẽ được nhả ngay và người khác có thể chọn. Bạn sẽ quay lại trang chọn ghế.
      </Dialog>
    </section>
  );
}
