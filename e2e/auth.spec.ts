import { expect, test } from "@playwright/test";
import { login, USER } from "./helpers";

test("/my-bookings chưa đăng nhập -> /login?redirect, đăng nhập xong quay lại", async ({ page }) => {
  await page.goto("/my-bookings");
  await expect(page).toHaveURL(/\/login\?redirect=%2Fmy-bookings/);
  await page.getByLabel("Email").fill(USER.email);
  await page.getByLabel("Mật khẩu").fill(USER.password);
  await page.getByRole("button", { name: "Đăng nhập" }).click();
  await expect(page).toHaveURL(/\/my-bookings$/);
  await expect(page.getByRole("heading", { name: "Vé của tôi" })).toBeVisible();
});

test("khách hàng vào /admin bị 403", async ({ page }) => {
  await login(page, USER);
  await expect(page).toHaveURL("/");
  await page.goto("/admin");
  await expect(page.getByRole("heading", { name: "Bạn không có quyền truy cập" })).toBeVisible();
});

test("admin chưa đăng nhập bị chuyển về /login", async ({ page }) => {
  await page.goto("/admin/cinemas");
  await expect(page).toHaveURL(/\/login\?redirect=%2Fadmin%2Fcinemas/);
});

test("đăng nhập sai mật khẩu hiện lỗi", async ({ page }) => {
  await login(page, { email: USER.email, password: "sai-mat-khau" }, { expectSuccess: false });
  await expect(page.getByRole("alert")).toBeVisible();
  await expect(page).toHaveURL(/\/login/);
});
