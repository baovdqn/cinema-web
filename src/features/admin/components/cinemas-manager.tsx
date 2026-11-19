"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/components/ui/toast";
import { getErrorMessage } from "@/lib/api-client";
import type { AdminCinema } from "@/types/api";
import { useAdminCinemas, useDeactivateCinema, useUpdateCinema } from "../hooks";
import { ActiveSwitch } from "./active-switch";
import { CinemaFormDialog } from "./cinema-form-dialog";
import { ConfirmDialog } from "./confirm-dialog";
import { PageHeader } from "./page-header";

export function CinemasManager() {
  const { data, isLoading, error, refetch } = useAdminCinemas();
  const update = useUpdateCinema();
  const deactivate = useDeactivateCinema();
  const [editing, setEditing] = useState<AdminCinema | null | undefined>(undefined);
  const [deactivating, setDeactivating] = useState<AdminCinema | null>(null);
  const [deactivateError, setDeactivateError] = useState<string | null>(null);

  function toggle(c: AdminCinema, next: boolean) {
    if (!next) {
      setDeactivateError(null);
      setDeactivating(c);
      return;
    }
    update.mutate(
      { id: c.id, input: { name: c.name, address: c.address, city: c.city, isActive: true } },
      {
        onSuccess: () => toast.success(`Đã bật lại rạp “${c.name}”`),
        onError: (e) => toast.error(getErrorMessage(e)),
      },
    );
  }

  function confirmDeactivate() {
    if (!deactivating) return;
    setDeactivateError(null);
    deactivate.mutate(deactivating.id, {
      onSuccess: () => {
        toast.success(`Đã vô hiệu hoá rạp “${deactivating.name}”`);
        setDeactivating(null);
      },
      onError: (e) => setDeactivateError(getErrorMessage(e)),
    });
  }

  return (
    <>
      <PageHeader
        title="Rạp & phòng"
        description="Bấm vào tên rạp để quản lý phòng chiếu."
        action={<Button onClick={() => setEditing(null)}>Thêm rạp</Button>}
      />

      {isLoading ? (
        <div className="space-y-2" aria-busy="true">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
      ) : error ? (
        <ErrorState error={error} onRetry={() => refetch()} />
      ) : !data || data.length === 0 ? (
        <EmptyState title="Chưa có rạp nào" />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-neutral-800">
          <table className="w-full min-w-[680px] text-left text-sm">
            <thead className="bg-neutral-900 text-xs uppercase text-neutral-400">
              <tr>
                <th className="px-4 py-3 font-medium">Tên rạp</th>
                <th className="px-4 py-3 font-medium">Thành phố</th>
                <th className="px-4 py-3 font-medium">Địa chỉ</th>
                <th className="px-4 py-3 font-medium">Phòng</th>
                <th className="px-4 py-3 font-medium">Hoạt động</th>
                <th className="px-4 py-3 text-right font-medium">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800">
              {data.map((c) => (
                <tr key={c.id} className={c.isActive ? "hover:bg-neutral-900/50" : "opacity-60"}>
                  <td className="px-4 py-3 font-medium">
                    <Link href={`/admin/cinemas/${c.id}`} className="text-red-400 hover:underline">
                      {c.name}
                    </Link>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-neutral-300">{c.city}</td>
                  <td className="px-4 py-3 text-neutral-300">{c.address}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-neutral-300">{c.roomCount} phòng</td>
                  <td className="px-4 py-3">
                    <ActiveSwitch
                      checked={c.isActive}
                      label={`${c.isActive ? "Vô hiệu hoá" : "Bật"} rạp ${c.name}`}
                      disabled={update.isPending}
                      onChange={(next) => toggle(c, next)}
                    />
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right">
                    <Button variant="ghost" className="px-2 py-1" onClick={() => setEditing(c)}>
                      Sửa
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editing !== undefined && <CinemaFormDialog key={editing?.id ?? "new"} cinema={editing} onClose={() => setEditing(undefined)} />}
      <ConfirmDialog
        open={!!deactivating}
        title="Vô hiệu hoá rạp"
        message={`Rạp “${deactivating?.name}” sẽ ngừng hoạt động và ẩn khỏi trang khách. Bạn có thể bật lại sau.`}
        confirmLabel="Vô hiệu hoá"
        pending={deactivate.isPending}
        error={deactivateError}
        onConfirm={confirmDeactivate}
        onClose={() => setDeactivating(null)}
      />
    </>
  );
}
