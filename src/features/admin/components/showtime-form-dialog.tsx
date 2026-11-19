"use client";

import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { FormField } from "@/components/ui/form-field";
import { Select } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "@/components/ui/toast";
import { getErrorMessage } from "@/lib/api-client";
import { formatDate, formatEndTime, todayVn, vnLocalToIso } from "@/lib/date";
import { useAdminCinemas, useAdminMovies, useAdminRooms, useCreateShowtime } from "../hooks";
import { showtimeSchema, type ShowtimeFormValues } from "../schemas";

export function ShowtimeFormDialog({
  defaults,
  onClose,
}: {
  defaults: { cinemaId?: string; movieId?: string; date?: string };
  onClose: () => void;
}) {
  const movies = useAdminMovies();
  const cinemas = useAdminCinemas();
  const create = useCreateShowtime();
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ShowtimeFormValues>({
    resolver: zodResolver(showtimeSchema),
    defaultValues: {
      movieId: defaults.movieId ?? "",
      cinemaId: defaults.cinemaId ?? "",
      roomId: "",
      date: defaults.date ?? todayVn(),
      time: "",
      priceStandard: 75000,
      priceVip: 95000,
      priceCouple: 180000,
    },
  });

  const movieId = watch("movieId");
  const cinemaId = watch("cinemaId");
  const date = watch("date");
  const time = watch("time");
  const rooms = useAdminRooms(Number(cinemaId) || 0);

  const sellable = useMemo(() => (movies.data ?? []).filter((m) => m.status !== "ENDED"), [movies.data]);
  const movie = sellable.find((m) => m.id === Number(movieId));
  const startIso = vnLocalToIso(date, time);
  const endText = movie && startIso ? formatEndTime(startIso, movie.durationMinutes) : null;

  async function onSubmit(v: ShowtimeFormValues) {
    setError(null);
    const iso = vnLocalToIso(v.date, v.time);
    if (!iso) return setError("Ngày hoặc giờ chiếu không hợp lệ");
    try {
      await create.mutateAsync({
        movieId: Number(v.movieId),
        roomId: Number(v.roomId),
        startTime: iso,
        prices: { STANDARD: v.priceStandard, VIP: v.priceVip, COUPLE: v.priceCouple },
      });
      toast.success(`Đã thêm suất chiếu ${v.time} ngày ${formatDate(v.date)}`);
      onClose();
    } catch (e) {
      setError(getErrorMessage(e));
    }
  }

  const activeCinemas = (cinemas.data ?? []).filter((c) => c.isActive);
  const activeRooms = (rooms.data ?? []).filter((r) => r.isActive);

  return (
    <Dialog
      open
      onClose={create.isPending ? () => {} : onClose}
      title="Thêm suất chiếu"
      className="max-w-lg"
      footer={
        <>
          <Button type="button" variant="secondary" onClick={onClose} disabled={create.isPending}>
            Huỷ
          </Button>
          <Button type="submit" form="showtime-form" disabled={create.isPending}>
            {create.isPending && <Spinner className="mr-2 h-4 w-4" />}
            Thêm suất chiếu
          </Button>
        </>
      }
    >
      <form id="showtime-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <Select label="Phim" error={errors.movieId?.message} {...register("movieId")}>
          <option value="">— Chọn phim —</option>
          {sellable.map((m) => (
            <option key={m.id} value={m.id}>
              {m.title} ({m.durationMinutes}′ · {m.status === "NOW_SHOWING" ? "Đang chiếu" : "Sắp chiếu"})
            </option>
          ))}
        </Select>

        <div className="grid gap-4 sm:grid-cols-2">
          <Select
            label="Rạp"
            error={errors.cinemaId?.message}
            {...register("cinemaId", { onChange: () => setValue("roomId", "") })}
          >
            <option value="">— Chọn rạp —</option>
            {activeCinemas.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
          <Select label="Phòng" disabled={!cinemaId || rooms.isLoading} error={errors.roomId?.message} {...register("roomId")}>
            <option value="">{cinemaId ? "— Chọn phòng —" : "Chọn rạp trước"}</option>
            {activeRooms.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name} ({r.seatCount} ghế)
              </option>
            ))}
          </Select>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Ngày chiếu" type="date" min={todayVn()} error={errors.date?.message} {...register("date")} />
          <FormField label="Giờ bắt đầu" type="time" error={errors.time?.message} {...register("time")} />
        </div>
        <p className="-mt-2 text-xs text-neutral-400">
          Giờ theo múi giờ Việt Nam (UTC+7).{" "}
          {endText ? (
            <span className="text-neutral-200">
              Kết thúc lúc <strong>{endText}</strong> ({movie?.durationMinutes} phút).
            </span>
          ) : (
            "Chọn phim, ngày và giờ để xem giờ kết thúc."
          )}
        </p>

        <fieldset>
          <legend className="mb-1 text-sm text-neutral-300">Giá vé (VND)</legend>
          <div className="grid gap-3 sm:grid-cols-3">
            <FormField
              label="Thường"
              type="number"
              inputMode="numeric"
              step={1000}
              error={errors.priceStandard?.message}
              {...register("priceStandard", { valueAsNumber: true })}
            />
            <FormField
              label="VIP"
              type="number"
              inputMode="numeric"
              step={1000}
              error={errors.priceVip?.message}
              {...register("priceVip", { valueAsNumber: true })}
            />
            <FormField
              label="Ghế đôi"
              type="number"
              inputMode="numeric"
              step={1000}
              error={errors.priceCouple?.message}
              {...register("priceCouple", { valueAsNumber: true })}
            />
          </div>
        </fieldset>

        {error && (
          <p role="alert" className="rounded-md bg-red-950/40 px-3 py-2 text-sm text-red-300">
            {error}
          </p>
        )}
      </form>
    </Dialog>
  );
}
