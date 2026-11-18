"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { authApi } from "./api";
import { useAuthStore } from "@/stores/auth-store";

export function useLogin(redirectTo = "/") {
  const setAuth = useAuthStore((s) => s.setAuth);
  const router = useRouter();
  return useMutation({
    mutationFn: authApi.login,
    onSuccess: (data) => {
      setAuth(data.accessToken, data.user);
      router.push(redirectTo);
    },
  });
}

export function useRegister(redirectTo = "/") {
  const setAuth = useAuthStore((s) => s.setAuth);
  const router = useRouter();
  return useMutation({
    mutationFn: authApi.register,
    onSuccess: (data) => {
      setAuth(data.accessToken, data.user);
      router.push(redirectTo);
    },
  });
}
