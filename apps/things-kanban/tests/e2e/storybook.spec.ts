import { expect, test } from "@playwright/test";

const storybookUrl =
  "http://127.0.0.1:6006/iframe.html?id=templates-boardtemplate--populated&viewMode=story";

test("renders the isolated Atomic template with keyboard move controls", async ({
  page,
}) => {
  await page.goto(storybookUrl);

  for (const name of ["Backlog", "To Do", "In Progress", "Done · 최근 30일"]) {
    await expect(page.getByRole("heading", { name })).toBeVisible();
  }

  const moveControl = page.getByRole("combobox", { name: "상태 이동" }).first();
  await moveControl.focus();
  await expect(moveControl).toBeFocused();
  await moveControl.selectOption("inProgress");
  await expect(
    moveControl.getByRole("option", { name: "In Progress" }),
  ).toBeAttached();

  await expect(page.locator("body")).not.toContainText(
    /Things에 연결할 수 없습니다|Unhandled/,
  );
});
