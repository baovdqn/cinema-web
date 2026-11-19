"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { FormField } from "@/components/ui/form-field";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "@/components/ui/toast";
import { getErrorMessage } from "@/lib/api-client";
import type { AdminCinema } from "@/types/api";
import { useCreateCinema, useUpdateCinema } from "../hooks";
import { cinemaSchema, type CinemaFormValues } from "../schemas";

export function CinemaFormDialog({ cinema, onClose }: { cinema: AdminCinema | null; onClose: () => void }) {
  const isEdit = !!cinema;
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CinemaFormValues>({
    resolver: zodResolver(cinemaSchema),
    defaultValues: { name: cinema?.name ?? "", address: cinema?.address ?? "", city: cinema?.city ?? "" },
  });
  const create = useCreateCinema();
  const update = useUpdateCinema();
  const [error, setError] = useState<string | null>(null);
  const pending = create.isPending || update.isPending;

  async function onSubmit(values: CinemaFormValues) {
    setError(null);
    try {
      if (cinema) await update.mutateAsync({ id: cinema.id, input: { ...values, isActive: cinema.isActive } });
      else await create.mutateAsync(values);
      toast.success(isEdit ? "Đã cập nhật rạp" : "Đã thêm rạp");
      onClose();
    } catch (e) {
      setError(getErrorMessage(e));
    }
  }

  return (
    <Dialog
      open
      onClose={pending ? () => {} : onClose}
      title={isEdit ? "Sửa rạp" : "Thêm rạp"}
      footer={
        <>
          <Button type="button" variant="secondary" onClick={onClose} disabled={pending}>
            Huỷ
          </Button>
          <Button type="submit" form="cinema-form" disabled={pending}>
            {pending && <Spinner className="mr-2 h-4 w-4" />}
            {isEdit ? "Lưu thay đổi" : "Thêm rạp"}
          </Button>
        </>
      }
    >
      <form id="cinema-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <FormField label="Tên rạp" error={errors.name?.message} {...register("name")} />
        <FormField label="Địa chỉ" error={errors.address?.message} {...register("address")} />
        <FormField label="Thành phố" error={errors.city?.message} {...register("city")} />
        {error && (
          <p role="alert" className="rounded-md bg-red-950/40 px-3 py-2 text-sm text-red-300">
            {error}
          </p>
        )}
      </form>
    </Dialog>
  );
}
