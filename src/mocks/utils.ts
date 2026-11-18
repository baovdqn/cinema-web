import { delay, HttpResponse } from "msw";
import type { ApiError, User } from "@/types/api";
import { db } from "./db";

export function errorResponse(status: number, message: string, extra: Record<string, unknown> = {}) {
  const body: ApiError & Record<string, unknown> = { status, message, ...extra };
  return HttpResponse.json(body, { status });
}

/** Giả lập độ trễ mạng cho các request đọc (200–500 ms). */
export const readDelay = () => delay(200 + Math.random() * 300);

export const TOKEN_PREFIX = "mock-token-";
export const tokenOf = (user: User) => `${TOKEN_PREFIX}${user.id}`;

/** Trả user nếu header Authorization hợp lệ (`Bearer mock-token-<id>`), ngược lại null. */
export function authUser(request: Request) {
  const header = request.headers.get("Authorization") ?? "";
  const m = /^Bearer mock-token-(\d+)$/.exec(header);
  if (!m) return null;
  return db.users.find((u) => u.id === Number(m[1])) ?? null;
}

export const unauthorized = () => errorResponse(401, "Chưa đăng nhập hoặc phiên đã hết hạn");

export function publicUser({ id, email, fullName, role }: User): User {
  return { id, email, fullName, role };
}
