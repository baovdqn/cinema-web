"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLogin } from "@/features/auth/hooks";
import { loginSchema, type LoginInput } from "@/features/auth/schemas";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Spinner } from "@/components/ui/spinner";
import { getErrorMessage } from "@/lib/api-client";
import { safeRedirect } from "@/lib/redirect";
import { useHydrated } from "@/lib/use-hydrated";
import { useAuthStore } from "@/stores/auth-store";

export function LoginForm() {
  const params = useSearchParams();
  const rawRedirect = params.get("redirect");
  const redirect = safeRedirect(rawRedirect);
  const router = useRouter();
  const hydrated = useHydrated();
  const token = useAuthStore((s) => s.accessToken);
  const login = useLogin(redirect);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });

  useEffect(() => {
    if (hydrated && token && !login.isPending && !login.isSuccess) router.replace(redirect);
  }, [hydrated, token, login.isPending, login.isSuccess, router, redirect]);

  const registerHref = rawRedirect ? `/register?redirect=${encodeURIComponent(redirect)}` : "/register";

  return (
    <>
      <h1 className="mb-5 text-xl font-bold">Đăng nhập</h1>
      <form onSubmit={handleSubmit((v) => login.mutate(v))} className="space-y-4" noValidate>
        <FormField
          label="Email"
          type="email"
          autoComplete="email"
          error={errors.email?.message}
          {...register("email")}
        />
        <FormField
          label="Mật khẩu"
          type="password"
          autoComplete="current-password"
          error={errors.password?.message}
          {...register("password")}
        />
        {login.isError && (
          <p role="alert" className="rounded-md bg-red-950/40 px-3 py-2 text-sm text-red-300">
            {getErrorMessage(login.error)}
          </p>
        )}
        <Button type="submit" className="w-full gap-2" disabled={login.isPending}>
          {login.isPending && <Spinner />}
          Đăng nhập
        </Button>
      </form>
      <p className="mt-4 text-center text-sm text-neutral-400">
        Chưa có tài khoản?{" "}
        <Link href={registerHref} className="text-red-400 hover:underline">
          Đăng ký
        </Link>
      </p>
    </>
  );
}
