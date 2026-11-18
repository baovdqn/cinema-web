import { http, HttpResponse } from "msw";
import { env } from "@/lib/env";
import type { AuthResponse } from "@/types/api";
import { db } from "../db";
import { authUser, errorResponse, publicUser, readDelay, tokenOf, unauthorized } from "../utils";

const base = env.apiBaseUrl;

export const authHandlers = [
  http.post(`${base}/auth/register`, async ({ request }) => {
    await readDelay();
    const body = (await request.json().catch(() => null)) as
      | { email?: string; password?: string; fullName?: string }
      | null;
    if (!body?.email || !body.password || !body.fullName) {
      return errorResponse(400, "Thiếu email, mật khẩu hoặc họ tên");
    }
    const email = body.email.trim().toLowerCase();
    if (db.users.some((u) => u.email === email)) return errorResponse(409, "Email đã được sử dụng");
    const user = { id: db.nextUserId++, email, password: body.password, fullName: body.fullName, role: "CUSTOMER" as const };
    db.users.push(user);
    const res: AuthResponse = { accessToken: tokenOf(user), user: publicUser(user) };
    return HttpResponse.json(res, { status: 201 });
  }),

  http.post(`${base}/auth/login`, async ({ request }) => {
    await readDelay();
    const body = (await request.json().catch(() => null)) as { email?: string; password?: string } | null;
    const user = db.users.find((u) => u.email === body?.email?.trim().toLowerCase() && u.password === body?.password);
    if (!user) return errorResponse(401, "Email hoặc mật khẩu không đúng");
    const res: AuthResponse = { accessToken: tokenOf(user), user: publicUser(user) };
    return HttpResponse.json(res);
  }),

  http.get(`${base}/auth/me`, async ({ request }) => {
    await readDelay();
    const user = authUser(request);
    if (!user) return unauthorized();
    return HttpResponse.json(publicUser(user));
  }),
];
