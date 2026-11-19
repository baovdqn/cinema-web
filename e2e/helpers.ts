import { expect, type Page } from "@playwright/test";

export const USER = { email: "user@cinema.vn", password: "123456" };
export const ADMIN = { email: "admin@cinema.vn", password: "123456" };

/** Đăng nhập qua form /login (MSW chạy trong trang nên phải đi qua UI). */
export async function login(page: Page, account = USER, { expectSuccess = true } = {}) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(account.email);
  await page.getByLabel("Mật khẩu").fill(account.password);
  await page.getByRole("button", { name: "Đăng nhập" }).click();
  // Chờ token được lưu (rời khỏi /login) trước khi điều hướng tiếp.
  if (expectSuccess) await expect(page).not.toHaveURL(/\/login/);
}

/** Từ trang chủ: mở phim đầu tiên (đang chiếu) rồi chọn suất đầu tiên của ngày mai. Trả về khi đã ở trang chọn ghế. */
export async function openTomorrowShowtime(page: Page) {
  await page.goto("/");
  await page.getByRole("link", { name: /Mai/ }).first().click();
  await expect(page).toHaveURL(/\/movies\/\d+/);
  await page.getByRole("tablist", { name: "Chọn ngày" }).getByRole("tab").nth(1).click();
  const first = page.locator('a[href$="/seats"]').first();
  await first.click();
  await expect(page).toHaveURL(/\/showtimes\/\d+\/seats/);
  await expect(page.getByText("Màn hình")).toBeVisible();
}

/** Chọn n ghế thường còn trống (chưa được chọn). */
export async function pickSeats(page: Page, n: number) {
  const free = page.locator('button[aria-pressed="false"]:not([disabled])[aria-label*=", Thường,"]');
  for (let i = 0; i < n; i++) {
    await free.first().click();
    await expect(page.locator('button[aria-pressed="true"]')).toHaveCount(i + 1);
  }
}

export async function holdSeats(page: Page) {
  await page.getByRole("button", { name: "Giữ ghế" }).click();
}

export async function selectOutcome(page: Page, outcome: "success" | "declined" | "pending") {
  await page.getByLabel("Kết quả giả lập:").selectOption(outcome);
}
