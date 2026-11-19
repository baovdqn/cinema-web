"use client";

import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";

/** Hộp thoại xác nhận cho thao tác xoá / vô hiệu hoá. Lỗi (vd 409) hiện ngay trong hộp. */
export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel,
  pending,
  error,
  onConfirm,
  onClose,
}: {
  open: boolean;
  title: string;
  message: React.ReactNode;
  confirmLabel: string;
  pending?: boolean;
  error?: string | null;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <Dialog
      open={open}
      onClose={pending ? () => {} : onClose}
      title={title}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={pending}>
            Huỷ
          </Button>
          <Button onClick={onConfirm} disabled={pending}>
            {pending && <Spinner className="mr-2 h-4 w-4" />}
            {confirmLabel}
          </Button>
        </>
      }
    >
      <p>{message}</p>
      {error && (
        <p role="alert" className="mt-3 rounded-md bg-red-950/40 px-3 py-2 text-red-300">
          {error}
        </p>
      )}
    </Dialog>
  );
}
