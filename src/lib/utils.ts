import { env } from "./env";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatVnd(amount: number) {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);
}

export function getPosterUrl(posterKey: string | null | undefined) {
  if (!posterKey) return "/poster-placeholder.svg";
  if (/^(https?:|data:|blob:)/.test(posterKey)) return posterKey;
  return `${env.assetBaseUrl}/${posterKey}`;
}

/** Idempotency-Key cho request giữ ghế / thanh toán (backend yêu cầu). */
export function newIdempotencyKey() {
  return crypto.randomUUID();
}
