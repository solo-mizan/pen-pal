import { expect, test } from "@playwright/test";

test("the home page introduces the delayed letter exchange", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/dear, letter/);
  await expect(page.getByRole("heading", { name: /Some things are worth waiting for/i })).toBeVisible();
  await expect(page.getByText("Letters travel in 3–7 days")).toBeVisible();
  await expect(page.getByRole("link", { name: /Write your first letter/i })).toHaveAttribute("href", "/sign-up");
});

test("sign-in route renders the Clerk entry point or local setup guidance", async ({ page }) => {
  await page.goto("/sign-in");
  await expect(page.locator("body")).toContainText(/Sign in to visit your mailbox|Your mailbox is almost ready/i);
});

test("mailbox handles a signed-out visitor", async ({ page }) => {
  await page.goto("/mailbox");
  await expect(page.locator("body")).toContainText(/Your mailbox is just around the corner|Your mailbox is almost ready/i);
});
