import { expect, test } from "@playwright/test";

test("duyệt phim: trang chủ -> chi tiết phim -> thấy suất chiếu", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/CinemaX/);
  await expect(page.getByRole("tab", { name: "Đang chiếu" })).toBeVisible();

  const card = page.getByRole("link", { name: /Dune: Part Two/ }).first();
  await expect(card).toBeVisible();
  await card.click();

  await expect(page).toHaveURL(/\/movies\/3/);
  await expect(page.getByRole("heading", { level: 1, name: "Dune: Part Two" })).toBeVisible();
  await expect(page.getByText("166 phút")).toBeVisible();

  await page.getByRole("tablist", { name: "Chọn ngày" }).getByRole("tab").nth(1).click();
  await expect(page.locator('a[href$="/seats"]').first()).toBeVisible();
});

test("tab Sắp chiếu hiển thị phim sắp chiếu", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("tab", { name: "Sắp chiếu" }).click();
  await expect(page.getByRole("link", { name: /Mưa Đỏ/ })).toBeVisible();
});
