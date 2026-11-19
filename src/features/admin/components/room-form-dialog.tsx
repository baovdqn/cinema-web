"use client";

import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { FormField } from "@/components/ui/form-field";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "@/components/ui/toast";
import { getErrorMessage } from "@/lib/api-client";
import type { Id, SeatLayout } from "@/types/api";
import { useCreateRoom } from "../hooks";
import { roomSchema, type RoomFormValues } from "../schemas";
import { generateSeats, rowLabels, validateLayout } from "../seat-layout";
import { SeatLayoutPreview } from "./seat-layout-preview";

export function RoomFormDialog({ cinemaId, onClose }: { cinemaId: Id; onClose: () => void }) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<RoomFormValues>({
    resolver: zodResolver(roomSchema),
    defaultValues: { name: "", rows: 8, seatsPerRow: 10, vipRows: ["D", "E", "F"], lastRowCouple: true },
  });
  const create = useCreateRoom(cinemaId);
  const [error, setError] = useState<string | null>(null);

  const rows = watch("rows");
  const seatsPerRow = watch("seatsPerRow");
  const vipRowsRaw = watch("vipRows");
  const lastRowCouple = watch("lastRowCouple");

  const layout: SeatLayout = useMemo(() => {
    const labels = rowLabels(Number.isFinite(rows) ? rows : 0);
    return { rows, seatsPerRow, vipRows: vipRowsRaw.filter((r) => labels.includes(r)), lastRowCouple };
  }, [rows, seatsPerRow, vipRowsRaw, lastRowCouple]);
  const layoutError = validateLayout(layout);
  const seats = useMemo(() => (layoutError ? [] : generateSeats(layout)), [layout, layoutError]);
  const labels = rowLabels(Number.isFinite(rows) ? Math.min(rows, 20) : 0);

  function toggleVip(row: string) {
    setValue("vipRows", vipRowsRaw.includes(row) ? vipRowsRaw.filter((r) => r !== row) : [...vipRowsRaw, row]);
  }

  async function onSubmit(values: RoomFormValues) {
    setError(null);
    try {
      await create.mutateAsync({ name: values.name, layout });
      toast.success(`Đã thêm phòng “${values.name}”`);
      onClose();
    } catch (e) {
      setError(getErrorMessage(e));
    }
  }

  return (
    <Dialog
      open
      onClose={create.isPending ? () => {} : onClose}
      title="Thêm phòng"
      className="max-w-2xl"
      footer={
        <>
          <Button type="button" variant="secondary" onClick={onClose} disabled={create.isPending}>
            Huỷ
          </Button>
          <Button type="submit" form="room-form" disabled={create.isPending}>
            {create.isPending && <Spinner className="mr-2 h-4 w-4" />}
            Thêm phòng
          </Button>
        </>
      }
    >
      <form id="room-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <FormField label="Tên phòng" placeholder="VD: Phòng 3" error={errors.name?.message} {...register("name")} />
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            label="Số hàng (A, B, C...)"
            type="number"
            inputMode="numeric"
            error={errors.rows?.message}
            {...register("rows", { valueAsNumber: true })}
          />
          <FormField
            label="Số ghế mỗi hàng"
            type="number"
            inputMode="numeric"
            error={errors.seatsPerRow?.message}
            {...register("seatsPerRow", { valueAsNumber: true })}
          />
        </div>

        <fieldset>
          <legend className="mb-1 text-sm text-neutral-300">Hàng ghế VIP</legend>
          {labels.length === 0 ? (
            <p className="text-xs text-neutral-500">Nhập số hàng để chọn.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {labels.map((row) => {
                const isCouple = lastRowCouple && row === labels[labels.length - 1] && labels.length === rows;
                const checked = !isCouple && vipRowsRaw.includes(row);
                return (
                  <label
                    key={row}
                    className={`flex h-9 w-9 cursor-pointer items-center justify-center rounded-md border text-sm font-medium transition ${
                      isCouple
                        ? "cursor-not-allowed border-fuchsia-500/50 bg-fuchsia-950/40 text-fuchsia-300"
                        : checked
                          ? "border-amber-500 bg-amber-950/60 text-amber-200"
                          : "border-neutral-700 bg-neutral-900 text-neutral-300 hover:border-neutral-500"
                    }`}
                  >
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={checked}
                      disabled={isCouple}
                      onChange={() => toggleVip(row)}
                      aria-label={`Hàng ${row} là VIP`}
                    />
                    {row}
                  </label>
                );
              })}
            </div>
          )}
        </fieldset>

        <div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" className="h-4 w-4 accent-red-600" {...register("lastRowCouple")} />
            Hàng cuối là ghế đôi
          </label>
          {errors.seatsPerRow && lastRowCouple && <p className="mt-1 text-xs text-red-400">{errors.seatsPerRow.message}</p>}
        </div>

        <div>
          <p className="mb-2 text-sm text-neutral-300">
            Xem trước {seats.length > 0 && <span className="text-neutral-500">· {seats.length} ghế</span>}
          </p>
          {layoutError ? (
            <p className="rounded-md border border-dashed border-neutral-700 px-3 py-4 text-center text-xs text-neutral-500">
              {Number.isNaN(rows) || Number.isNaN(seatsPerRow) ? "Nhập số hàng và số ghế để xem trước." : layoutError}
            </p>
          ) : (
            <SeatLayoutPreview seats={seats} />
          )}
        </div>

        {error && (
          <p role="alert" className="rounded-md bg-red-950/40 px-3 py-2 text-sm text-red-300">
            {error}
          </p>
        )}
      </form>
    </Dialog>
  );
}
