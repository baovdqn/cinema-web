"use client";

import { Button } from "@/components/ui/button";
import { getErrorMessage } from "@/lib/api-client";
import { cn } from "@/lib/utils";

export function ErrorState({
  error,
  onRetry,
  className,
}: {
  error?: unknown;
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <div
      role="alert"
      className={cn(
        "flex flex-col items-center rounded-xl border border-red-900/50 bg-red-950/20 px-4 py-10 text-center",
        className,
      )}
    >
      <p className="font-medium text-red-300">Không tải được dữ liệu</p>
      {error != null && <p className="mt-1 text-sm text-neutral-400">{getErrorMessage(error)}</p>}
      {onRetry && (
        <Button variant="secondary" className="mt-4" onClick={onRetry}>
          Thử lại
        </Button>
      )}
    </div>
  );
}
