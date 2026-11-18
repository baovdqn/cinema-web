import { api } from "@/lib/api-client";
import type { AuthResponse, User } from "@/types/api";

// TODO: khớp endpoint với backend
export const authApi = {
  login: (body: { email: string; password: string }) =>
    api.post<AuthResponse>("/auth/login", body).then((r) => r.data),
  register: (body: { email: string; password: string; fullName: string }) =>
    api.post<AuthResponse>("/auth/register", body).then((r) => r.data),
  me: () => api.get<User>("/auth/me").then((r) => r.data),
};
