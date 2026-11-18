"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRegister } from "@/features/auth/hooks";
import { registerSchema, type RegisterInput } from "@/features/auth/schemas";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Spinner } from "@/components/ui/spinner";
import { getErrorMessage } from "@/lib/api-client";
import { safeRedirect } from "@/lib/redirect";
import { useHydrated } from "@/lib/use-hydrated";
import { useAuthStore } from "@/stores/auth-store";

export function RegisterForm() {
  const params = useSearchParams();
  const rawRedirect = params.get("redirect");
  const redirect = safeRedirect(rawRedirect);
  const router = useRouter();
  const hydrated = useHydrated();
  const token = useAuthStore((s) => s.accessToken);
  const reg = useRegister(redirect);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterInput>({ resolver: zodResolver(registerSchema) });

  useEffect(() => {
    if (hydrated && token && !reg.isPending && !reg.isSuccess) router.replace(redirect);
  }, [hydrated, token, reg.isPending, reg.isSuccess, router, redirect]);

  const loginHref = rawRedirect ? `/login?redirect=${encodeURIComponent(redirect)}` : "/login";

  return (
    <>
      <h1 className="mb-5 text-xl font-bold">Đăng ký</h1>
      <form
        onSubmit={handleSubmit(({ email, password, fullName }) => reg.mutate({ email, password, fullName }))}
        className="space-y-4"
        noValidate
      >
        <FormField label="Họ tên" autoComplete="name" error={errors.fullName?.message} {...register("fullName")} />
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
          autoComplete="new-password"
          error={errors.password?.message}
          {...register("password")}
        />
        <FormField
          label="Nhập lại mật khẩu"
          type="password"
          autoComplete="new-password"
          error={errors.confirmPassword?.message}
          {...register("confirmPassword")}
        />
        {reg.isError && (
          <p role="alert" className="rounded-md bg-red-950/40 px-3 py-2 text-sm text-red-300">
            {getErrorMessage(reg.error)}
          </p>
        )}
        <Button type="submit" className="w-full gap-2" disabled={reg.isPending}>
          {reg.isPending && <Spinner />}
          Đăng ký
        </Button>
      </form>
      <p className="mt-4 text-center text-sm text-neutral-400">
        Đã có tài khoản?{" "}
        <Link href={loginHref} className="text-red-400 hover:underline">
          Đăng nhập
        </Link>
      </p>
    </>
  );
}
