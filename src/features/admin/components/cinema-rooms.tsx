"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/components/ui/toast";
import { getErrorMessage } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import type { AdminRoom } from "@/types/api";
import { useAdminCinemas, useAdminRooms, useDeactivateRoom, useUpdateRoom } from "../hooks";
import { ConfirmDialog } from "./confirm-dialog";
import { PageHeader } from "./page-header";
import { RoomFormDialog } from "./room-form-dialog";
import { SeatLayoutPreview } from "./seat-layout-preview";

function seatSummary(r: AdminRoom) {
  const count = (t: string) => r.seats.filter((s) => s.seatType === t).length;
  const rows = new Set(r.seats.map((s) => s.seatRow)).size;
  return `${rows} hàng · Thường ${count("STANDARD")} · VIP ${count("VIP")} · Ghế đôi ${count("COUPLE")}`;
}

export function CinemaRooms({ cinemaId }: { cinemaId: number }) {
  const cinemas = useAdminCinemas();
  const rooms = useAdminRooms(cinemaId);
  const update = useUpdateRoom();
  const deactivate = useDeactivateRoom();
  const [adding, setAdding] = useState(false);
  const [viewing, setViewing] = useState<AdminRoom | null>(null);
  const [deactivating, setDeactivating] = useState<AdminRoom | null>(null);
  const [deactivateError, setDeactivateError] = useState<string | null>(null);

  const cinema = cinemas.data?.find((c) => c.id === cinemaId);

  function confirmDeactivate() {
    if (!deactivating) return;
    setDeactivateError(null);
    deactivate.mutate(deactivating.id, {
      onSuccess: () => {
        toast.success(`Đã vô hiệu hoá ${deactivating.name}`);
        setDeactivating(null);
      },
      onError: (e) => setDeactivateError(getErrorMessage(e)),
    });
  }

  function reactivate(r: AdminRoom) {
    update.mutate(
      { id: r.id, input: { isActive: true } },
      {
        onSuccess: () => toast.success(`Đã bật lại ${r.name}`),
        onError: (e) => toast.error(getErrorMessage(e)),
      },
    );
  }

  return (
    <>
      <Link href="/admin/cinemas" className="mb-3 inline-block text-sm text-neutral-400 hover:text-white">
        ← Danh sách rạp
      </Link>
      <PageHeader
        title={cinema?.name ?? "Phòng chiếu"}
        description={cinema ? `${cinema.address}, ${cinema.city}${cinema.isActive ? "" : " · Đã vô hiệu hoá"}` : undefined}
        action={<Button onClick={() => setAdding(true)}>Thêm phòng</Button>}
      />

      {rooms.isLoading ? (
        <div className="space-y-2" aria-busy="true">
          {[0, 1].map((i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : rooms.error ? (
        <ErrorState error={rooms.error} onRetry={() => rooms.refetch()} />
      ) : !rooms.data || rooms.data.length === 0 ? (
        <EmptyState title="Rạp chưa có phòng nào" action={<Button onClick={() => setAdding(true)}>Thêm phòng</Button>} />
      ) : (
        <ul className="space-y-3">
          {rooms.data.map((r) => (
            <li
              key={r.id}
              className={cn(
                "flex flex-wrap items-center justify-between gap-3 rounded-xl border border-neutral-800 bg-neutral-900 p-4",
                !r.isActive && "opacity-60",
              )}
            >
              <div className="min-w-0">
                <p className="font-semibold">
                  {r.name}
                  {!r.isActive && (
                    <span className="ml-2 rounded-full bg-neutral-700/60 px-2 py-0.5 text-xs font-normal text-neutral-300">
                      Ngừng hoạt động
                    </span>
                  )}
                </p>
                <p className="mt-0.5 text-sm text-neutral-400">
                  {r.seatCount} ghế · {seatSummary(r)}
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="secondary" className="px-3 py-1.5" onClick={() => setViewing(r)}>
                  Xem sơ đồ
                </Button>
                {r.isActive ? (
                  <Button
                    variant="ghost"
                    className="px-3 py-1.5 text-red-400"
                    onClick={() => {
                      setDeactivateError(null);
                      setDeactivating(r);
                    }}
                  >
                    Vô hiệu hoá
                  </Button>
                ) : (
                  <Button variant="ghost" className="px-3 py-1.5" disabled={update.isPending} onClick={() => reactivate(r)}>
                    Bật lại
                  </Button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {adding && <RoomFormDialog cinemaId={cinemaId} onClose={() => setAdding(false)} />}
      <Dialog
        open={!!viewing}
        onClose={() => setViewing(null)}
        title={viewing ? `Sơ đồ ghế — ${viewing.name}` : ""}
        className="max-w-2xl"
        footer={<Button variant="secondary" onClick={() => setViewing(null)}>Đóng</Button>}
      >
        {viewing && <SeatLayoutPreview seats={viewing.seats} />}
      </Dialog>
      <ConfirmDialog
        open={!!deactivating}
        title="Vô hiệu hoá phòng"
        message={`${deactivating?.name} sẽ ngừng hoạt động và không thể thêm suất chiếu mới. Bạn có thể bật lại sau.`}
        confirmLabel="Vô hiệu hoá"
        pending={deactivate.isPending}
        error={deactivateError}
        onConfirm={confirmDeactivate}
        onClose={() => setDeactivating(null)}
      />
    </>
  );
}
