import { expect, test } from "@playwright/test";
import { holdSeats, login, openTomorrowShowtime, pickSeats, selectOutcome } from "./helpers";

test("đặt vé trọn vẹn: đăng nhập -> chọn ghế -> giữ -> thanh toán -> vé QR -> Vé của tôi", async ({ page }) => {
  await login(page);
  await expect(page).toHaveURL("/");

  await openTomorrowShowtime(page);
  await pickSeats(page, 2);
  await expect(page.getByRole("heading", { name: "Ghế đã chọn (2/4)" })).toBeVisible();
  await holdSeats(page);

  await expect(page).toHaveURL(/\/checkout\/\d+/);
  await expect(page.getByRole("timer")).toHaveText(/0[0-7]:\d\d/);

  await selectOutcome(page, "success");
  await page.getByRole("button", { name: "Thanh toán", exact: true }).click();

  // Vé QR cho từng ghế
  await expect(page.locator("li svg")).toHaveCount(2);
  await expect(page.getByText("Vé xem phim").first()).toBeVisible();

  // Vào "Vé của tôi" bằng click (state MSW nằm trong bộ nhớ của trang)
  await page.getByRole("button", { name: /^N/ }).click();
  await page.getByRole("menuitem", { name: "Vé của tôi" }).click();
  await expect(page).toHaveURL(/\/my-bookings/);
  await page.getByRole("tab", { name: "Sắp chiếu" }).click();
  await expect(page.getByRole("listitem").filter({ hasText: "Đã xác nhận" })).toHaveCount(1);
  await expect(page.getByRole("link", { name: "Xem vé" })).toBeVisible();
});

test("thanh toán bị từ chối rồi thử lại thành công", async ({ page }) => {
  await login(page);
  await openTomorrowShowtime(page);
  await pickSeats(page, 1);
  await holdSeats(page);
  await expect(page).toHaveURL(/\/checkout\/\d+/);

  await selectOutcome(page, "declined");
  await page.getByRole("button", { name: "Thanh toán", exact: true }).click();
  await expect(page.getByRole("alert").filter({ hasText: "Thẻ bị từ chối" })).toBeVisible();

  await selectOutcome(page, "success");
  await page.getByRole("button", { name: "Thanh toán lại" }).click();
  await expect(page.locator("li svg")).toHaveCount(1);
});

test("đã giữ ghế suất này: dialog booking đang hoạt động -> Đổi ghế", async ({ page }) => {
  await login(page);
  await openTomorrowShowtime(page);
  await pickSeats(page, 2);
  await holdSeats(page);
  await expect(page).toHaveURL(/\/checkout\/\d+/);

  // Quay lại sơ đồ ghế (SPA history giữ nguyên state mock) và thử giữ thêm
  await page.goBack();
  await expect(page.getByText("Màn hình")).toBeVisible();
  await pickSeats(page, 1);
  await holdSeats(page);

  const dialog = page.getByRole("dialog");
  await expect(dialog.getByRole("heading", { name: /Bạn đang giữ/ })).toBeVisible();
  await dialog.getByRole("button", { name: "Đổi ghế" }).click();
  await dialog.getByRole("button", { name: "Xác nhận đổi ghế" }).click();
  await expect(dialog).toBeHidden();
  await expect(page.getByText(/Đã nhả ghế/)).toBeVisible();

  // Sau khi nhả có thể giữ lại bình thường
  await holdSeats(page);
  await expect(page).toHaveURL(/\/checkout\/\d+/);
});
