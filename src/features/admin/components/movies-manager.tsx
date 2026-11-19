"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Input } from "@/components/ui/input";
import { Poster } from "@/components/ui/poster";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/components/ui/toast";
import { StatusBadge } from "@/features/movies/components/status-badge";
import { getErrorMessage } from "@/lib/api-client";
import { formatDate } from "@/lib/date";
import type { Movie } from "@/types/api";
import { useAdminMovies, useDeleteMovie } from "../hooks";
import { ConfirmDialog } from "./confirm-dialog";
import { MovieFormDialog } from "./movie-form-dialog";
import { PageHeader } from "./page-header";

function normalize(s: string) {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/g, "d").toLowerCase().trim();
}

export function MoviesManager() {
  const { data, isLoading, error, refetch } = useAdminMovies();
  const del = useDeleteMovie();
  const [q, setQ] = useState("");
  // undefined = đóng, null = thêm mới, Movie = sửa
  const [editing, setEditing] = useState<Movie | null | undefined>(undefined);
  const [deleting, setDeleting] = useState<Movie | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const list = (data ?? []).filter((m) => !q.trim() || normalize(m.title).includes(normalize(q)));

  function confirmDelete() {
    if (!deleting) return;
    setDeleteError(null);
    del.mutate(deleting.id, {
      onSuccess: () => {
        toast.success(`Đã xoá phim “${deleting.title}”`);
        setDeleting(null);
      },
      onError: (e) => setDeleteError(getErrorMessage(e)),
    });
  }

  return (
    <>
      <PageHeader
        title="Phim"
        description={data ? `${data.length} phim` : undefined}
        action={<Button onClick={() => setEditing(null)}>Thêm phim</Button>}
      />
      <Input
        type="search"
        placeholder="Tìm theo tên phim..."
        aria-label="Tìm phim"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        className="mb-4 max-w-sm"
      />

      {isLoading ? (
        <div className="space-y-2" aria-busy="true">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : error ? (
        <ErrorState error={error} onRetry={() => refetch()} />
      ) : list.length === 0 ? (
        <EmptyState title={q ? "Không tìm thấy phim phù hợp" : "Chưa có phim nào"} />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-neutral-800">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="bg-neutral-900 text-xs uppercase text-neutral-400">
              <tr>
                <th className="px-4 py-3 font-medium">Poster</th>
                <th className="px-4 py-3 font-medium">Tên phim</th>
                <th className="px-4 py-3 font-medium">Thời lượng</th>
                <th className="px-4 py-3 font-medium">Khởi chiếu</th>
                <th className="px-4 py-3 font-medium">Trạng thái</th>
                <th className="px-4 py-3 text-right font-medium">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800">
              {list.map((m) => (
                <tr key={m.id} className="hover:bg-neutral-900/50">
                  <td className="px-4 py-2">
                    <Poster posterKey={m.posterKey} alt={m.title} className="h-14 w-10 rounded" />
                  </td>
                  <td className="px-4 py-2 font-medium">{m.title}</td>
                  <td className="whitespace-nowrap px-4 py-2 text-neutral-300">{m.durationMinutes} phút</td>
                  <td className="whitespace-nowrap px-4 py-2 text-neutral-300">{formatDate(m.releaseDate)}</td>
                  <td className="px-4 py-2">
                    <StatusBadge status={m.status} />
                  </td>
                  <td className="whitespace-nowrap px-4 py-2 text-right">
                    <Button variant="ghost" className="px-2 py-1" onClick={() => setEditing(m)}>
                      Sửa
                    </Button>
                    <Button
                      variant="ghost"
                      className="px-2 py-1 text-red-400"
                      onClick={() => {
                        setDeleteError(null);
                        setDeleting(m);
                      }}
                    >
                      Xoá
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editing !== undefined && <MovieFormDialog key={editing?.id ?? "new"} movie={editing} onClose={() => setEditing(undefined)} />}
      <ConfirmDialog
        open={!!deleting}
        title="Xoá phim"
        message={`Bạn chắc chắn muốn xoá phim “${deleting?.title}”?`}
        confirmLabel="Xoá phim"
        pending={del.isPending}
        error={deleteError}
        onConfirm={confirmDelete}
        onClose={() => setDeleting(null)}
      />
    </>
  );
}
