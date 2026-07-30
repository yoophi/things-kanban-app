import { expect, test } from "@playwright/test";

test("core controls are keyboard reachable and states have text", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "새로고침" }).focus();
  await page.keyboard.press("Tab");
  await expect(page.getByPlaceholder("할 일 검색")).toBeFocused();
  await expect(page.getByRole("heading", { name: "To Do" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "In Progress" })).toBeVisible();
});
