import axios, { AxiosError } from "axios";
import { env } from "./env";
import { useAuthStore } from "@/stores/auth-store";
import type { ApiError } from "@/types/api";

/** Axios instance dùng chung. Tự gắn JWT và logout khi 401. */
export const api = axios.create({
  baseURL: env.apiBaseUrl,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
    }
    return Promise.reject(error);
  },
);

export function getErrorStatus(error: unknown): number | undefined {
  return axios.isAxiosError(error) ? error.response?.status : undefined;
}

export function getErrorData<T = ApiError>(error: unknown): T | undefined {
  return axios.isAxiosError(error) ? (error.response?.data as T) : undefined;
}

/** Lấy message lỗi thân thiện từ response backend. */
export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    return getErrorData(error)?.message ?? error.message;
  }
  return "Đã có lỗi xảy ra";
}
