import dayjs from "dayjs";
import { expect, test, type Page } from "@playwright/test";
import { ADMIN, login } from "./helpers";

async function openAdmin(page: Page) {
  await login(page, ADMIN);
  await expect(page).toHaveURL("/");
  await page.getByRole("button", { name: /^Q/ }).click();
  await page.getByRole("menuitem", { name: "Quản trị" }).click();
  await expect(page).toHaveURL("/admin");
}

async function createCinema(page: Page, name: string) {
  await page.getByRole("link", { name: "Rạp & phòng" }).click();
  await page.getByRole("button", { name: "Thêm rạp" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Tên rạp").fill(name);
  await dialog.getByLabel("Địa chỉ").fill("1 Nguyễn Huệ");
  await dialog.getByLabel("Thành phố").fill("TP.HCM");
  await dialog.getByRole("button", { name: "Thêm rạp" }).click();
  await expect(page.getByRole("link", { name })).toBeVisible();
}

test("admin: tạo rạp rồi vô hiệu hoá bằng switch", async ({ page }) => {
  await openAdmin(page);
  await createCinema(page, "Rạp E2E");

  const sw = page.getByRole("switch", { name: "Vô hiệu hoá rạp Rạp E2E" });
  await expect(sw).toHaveAttribute("aria-checked", "true");
  await sw.click();
  await page.getByRole("dialog").getByRole("button", { name: "Vô hiệu hoá" }).click();

  await expect(page.getByRole("switch", { name: "Bật rạp Rạp E2E" })).toHaveAttribute("aria-checked", "false");
});

test("admin: tạo phòng, vô hiệu hoá rồi bật lại", async ({ page }) => {
  await openAdmin(page);
  await createCinema(page, "Rạp Phòng E2E");
  await page.getByRole("link", { name: "Rạp Phòng E2E" }).click();
  await expect(page.getByRole("heading", { name: "Rạp Phòng E2E" })).toBeVisible();

  await page.getByRole("button", { name: "Thêm phòng" }).first().click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Tên phòng").fill("Phòng E2E");
  await dialog.getByRole("button", { name: "Thêm phòng" }).click();
  await expect(page.getByText("Phòng E2E", { exact: true })).toBeVisible();

  await page.getByRole("button", { name: "Vô hiệu hoá" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Vô hiệu hoá" }).click();
  await expect(page.getByText("Ngừng hoạt động")).toBeVisible();

  await page.getByRole("button", { name: "Bật lại" }).click();
  await expect(page.getByText("Ngừng hoạt động")).toBeHidden();
  await expect(page.getByRole("button", { name: "Vô hiệu hoá" })).toBeVisible();
});

test("admin: tạo suất chiếu và thấy trong danh sách", async ({ page }) => {
  await openAdmin(page);
  await page.getByRole("link", { name: "Suất chiếu" }).click();
  await page.getByRole("button", { name: "Mọi ngày" }).click();
  await page.getByRole("button", { name: "Thêm suất chiếu" }).first().click();

  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Phim").selectOption({ index: 1 });
  await dialog.getByLabel("Rạp", { exact: true }).selectOption({ index: 1 });
  await expect(dialog.getByLabel("Phòng")).toBeEnabled();
  await expect.poll(() => dialog.getByLabel("Phòng").locator("option").count()).toBeGreaterThan(1);
  await dialog.getByLabel("Phòng").selectOption({ index: 1 });
  await dialog.getByLabel("Ngày chiếu").fill(dayjs().add(3, "day").format("YYYY-MM-DD"));
  await dialog.getByLabel("Giờ bắt đầu").fill("03:07");
  await dialog.getByRole("button", { name: "Thêm suất chiếu" }).click();

  await expect(dialog).toBeHidden();
  await expect(page.getByRole("cell", { name: /^03:07 – / })).toBeVisible();
});
