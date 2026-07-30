import { expect, test } from "@playwright/test";

test("filters the four-column board by area and project", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Work", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Work", exact: true }),
  ).toBeVisible();
  await expect(page.getByText("AppleScript 연동")).toBeVisible();

  await page
    .getByRole("button", { name: "Things Kanban", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Things Kanban", exact: true }),
  ).toBeVisible();
  await expect(page.getByText("완료된 릴리스 점검")).toBeVisible();
  await expect(page.getByText("AppleScript 연동")).not.toBeVisible();
});
