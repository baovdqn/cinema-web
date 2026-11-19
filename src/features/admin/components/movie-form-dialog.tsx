"use client";

import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { FormField } from "@/components/ui/form-field";
import { Poster } from "@/components/ui/poster";
import { Select } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "@/components/ui/toast";
import { getErrorMessage } from "@/lib/api-client";
import type { Movie } from "@/types/api";
import { useCreateMovie, useUpdateMovie, useUploadPoster } from "../hooks";
import { movieSchema, type MovieFormValues } from "../schemas";

const MAX_POSTER_BYTES = 5 * 1024 * 1024;

export function MovieFormDialog({ movie, onClose }: { movie: Movie | null; onClose: () => void }) {
  const isEdit = !!movie;
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<MovieFormValues>({
    resolver: zodResolver(movieSchema),
    defaultValues: {
      title: movie?.title ?? "",
      durationMinutes: movie?.durationMinutes ?? (undefined as unknown as number),
      releaseDate: movie?.releaseDate ?? "",
      status: movie?.status ?? "COMING_SOON",
    },
  });

  const upload = useUploadPoster();
  const create = useCreateMovie();
  const update = useUpdateMovie();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const previewRef = useRef<string | null>(null);
  const pending = upload.isPending || create.isPending || update.isPending;

  useEffect(
    () => () => {
      if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    },
    [],
  );

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.type.startsWith("image/")) return setFileError("Poster phải là file ảnh (PNG, JPG, WebP...)");
    if (f.size > MAX_POSTER_BYTES) return setFileError("Ảnh quá lớn (tối đa 5MB)");
    setFileError(null);
    if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    previewRef.current = URL.createObjectURL(f);
    setPreview(previewRef.current);
    setFile(f);
  }

  async function onSubmit(values: MovieFormValues) {
    setSubmitError(null);
    try {
      // Upload poster trước, lấy posterKey rồi mới lưu phim.
      const posterKey = file ? (await upload.mutateAsync(file)).posterKey : (movie?.posterKey ?? null);
      const input = { ...values, posterKey };
      if (movie) await update.mutateAsync({ id: movie.id, input });
      else await create.mutateAsync(input);
      toast.success(isEdit ? "Đã cập nhật phim" : "Đã thêm phim");
      onClose();
    } catch (e) {
      setSubmitError(getErrorMessage(e));
    }
  }

  return (
    <Dialog
      open
      onClose={pending ? () => {} : onClose}
      title={isEdit ? "Sửa phim" : "Thêm phim"}
      className="max-w-lg"
      footer={
        <>
          <Button type="button" variant="secondary" onClick={onClose} disabled={pending}>
            Huỷ
          </Button>
          <Button type="submit" form="movie-form" disabled={pending}>
            {pending && <Spinner className="mr-2 h-4 w-4" />}
            {isEdit ? "Lưu thay đổi" : "Thêm phim"}
          </Button>
        </>
      }
    >
      <form id="movie-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <FormField label="Tên phim" error={errors.title?.message} {...register("title")} />
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            label="Thời lượng (phút)"
            type="number"
            inputMode="numeric"
            error={errors.durationMinutes?.message}
            {...register("durationMinutes", { valueAsNumber: true })}
          />
          <FormField label="Ngày khởi chiếu" type="date" error={errors.releaseDate?.message} {...register("releaseDate")} />
        </div>
        <Select label="Trạng thái" error={errors.status?.message} {...register("status")}>
          <option value="COMING_SOON">Sắp chiếu</option>
          <option value="NOW_SHOWING">Đang chiếu</option>
          <option value="ENDED">Đã kết thúc</option>
        </Select>

        <div>
          <label htmlFor="poster-file" className="mb-1 block text-sm text-neutral-300">
            Poster
          </label>
          <div className="flex items-start gap-4">
            <div className="h-36 w-24 shrink-0 overflow-hidden rounded-md border border-neutral-700 bg-neutral-800">
              <Poster posterKey={preview ?? movie?.posterKey} alt="Xem trước poster" className="h-full w-full" />
            </div>
            <div className="min-w-0 flex-1">
              <input
                id="poster-file"
                type="file"
                accept="image/*"
                onChange={onFile}
                className="block w-full text-xs text-neutral-300 file:mr-3 file:rounded-md file:border-0 file:bg-neutral-800 file:px-3 file:py-2 file:text-sm file:text-white hover:file:bg-neutral-700"
              />
              <p className="mt-2 text-xs text-neutral-500">
                {file ? `Sẽ tải lên khi lưu: ${file.name}` : "Ảnh PNG/JPG/WebP, tối đa 5MB. Để trống để giữ poster hiện tại."}
              </p>
              {fileError && <p className="mt-1 text-xs text-red-400">{fileError}</p>}
            </div>
          </div>
        </div>

        {submitError && (
          <p role="alert" className="rounded-md bg-red-950/40 px-3 py-2 text-sm text-red-300">
            {submitError}
          </p>
        )}
      </form>
    </Dialog>
  );
}
