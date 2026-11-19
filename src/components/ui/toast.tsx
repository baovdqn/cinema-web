"use client";

import { create } from "zustand";
import { cn } from "@/lib/utils";

type ToastKind = "info" | "success" | "warning" | "error";
interface ToastItem {
  id: number;
  kind: ToastKind;
  message: string;
}

interface ToastState {
  items: ToastItem[];
  push: (message: string, kind?: ToastKind, durationMs?: number) => void;
  dismiss: (id: number) => void;
}

let nextId = 1;

export const useToastStore = create<ToastState>((set, get) => ({
  items: [],
  push: (message, kind = "info", durationMs = 5000) => {
    const id = nextId++;
    set((s) => ({ items: [...s.items.slice(-3), { id, kind, message }] }));
    setTimeout(() => get().dismiss(id), durationMs);
  },
  dismiss: (id) => set((s) => ({ items: s.items.filter((t) => t.id !== id) })),
}));

/** Gọi được ở bất cứ đâu: `toast.error("...")`. */
export const toast = {
  info: (m: string) => useToastStore.getState().push(m, "info"),
  success: (m: string) => useToastStore.getState().push(m, "success"),
  warning: (m: string) => useToastStore.getState().push(m, "warning", 8000),
  error: (m: string) => useToastStore.getState().push(m, "error", 7000),
};

const KIND_CLASS: Record<ToastKind, string> = {
  info: "border-neutral-700 bg-neutral-900",
  success: "border-green-700 bg-green-950",
  warning: "border-amber-600 bg-amber-950",
  error: "border-red-700 bg-red-950",
};

export function Toaster() {
  const items = useToastStore((s) => s.items);
  const dismiss = useToastStore((s) => s.dismiss);
  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-24 z-[60] flex flex-col items-stretch gap-2 px-4 sm:inset-x-auto sm:right-4 sm:w-96 sm:px-0 lg:bottom-4"
    >
      {items.map((t) => (
        <div
          key={t.id}
          role="status"
          className={cn(
            "pointer-events-auto flex w-full items-start gap-3 rounded-lg border px-4 py-3 text-sm shadow-lg",
            KIND_CLASS[t.kind],
          )}
        >
          <p className="flex-1">{t.message}</p>
          <button
            type="button"
            aria-label="Đóng thông báo"
            onClick={() => dismiss(t.id)}
            className="text-neutral-400 hover:text-white"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}
