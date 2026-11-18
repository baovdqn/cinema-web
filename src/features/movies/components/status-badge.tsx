import type { MovieStatus } from "@/types/api";
import { cn } from "@/lib/utils";

const MAP: Record<MovieStatus, { label: string; cls: string }> = {
  NOW_SHOWING: { label: "Đang chiếu", cls: "bg-red-600/20 text-red-400 ring-red-600/40" },
  COMING_SOON: { label: "Sắp chiếu", cls: "bg-amber-500/15 text-amber-400 ring-amber-500/40" },
  ENDED: { label: "Đã kết thúc", cls: "bg-neutral-700/40 text-neutral-400 ring-neutral-600" },
};

export function StatusBadge({ status }: { status: MovieStatus }) {
  const s = MAP[status];
  return (
    <span className={cn("inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ring-1", s.cls)}>
      {s.label}
    </span>
  );
}
