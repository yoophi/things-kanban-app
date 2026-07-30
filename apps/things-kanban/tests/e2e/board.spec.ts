import { expect, test } from "@playwright/test";

test("loads, filters, and moves a card with the keyboard equivalent", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Backlog" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "To Do" })).toBeVisible();
  await page.getByPlaceholder("할 일 검색").fill("구조");
  await expect(
    page.getByRole("heading", { name: "앱 구조 검토" }),
  ).toBeVisible();
  await page
    .getByRole("combobox", { name: "상태 이동" })
    .first()
    .selectOption("inProgress");
  await expect(
    page.getByRole("heading", { name: "앱 구조 검토" }),
  ).toBeVisible();
  await page
    .getByRole("combobox", { name: "상태 이동" })
    .first()
    .selectOption("done");
  await expect(
    page.getByRole("heading", { name: "앱 구조 검토" }),
  ).toBeVisible();
});
