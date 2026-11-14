import { expect, test } from "@playwright/test";

const viewports = [320, 360, 375, 390, 414, 430, 540, 760, 820, 1024];
const routes = ["/", "/sign-in", "/sign-up", "/mailbox"];

test("core routes fit phone, tablet, and desktop widths without horizontal scrolling", async ({ page }) => {
  for (const width of viewports) {
    await page.setViewportSize({ width, height: 900 });
    for (const route of routes) {
      await page.goto(route);
      await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), {
        message: `${route} should not overflow at ${width}px`,
      }).toBe(true);
    }
  }
});

test("toast feedback stays inside the screen and can be dismissed on a narrow phone", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 720 });
  await page.goto("/");
  await expect(page.getByLabel("Notifications")).toHaveAttribute("data-ready", "true");
  await page.evaluate(() => window.dispatchEvent(new CustomEvent("dear-letter:toast", { detail: { message: "A little hello is on its way.", kind: "success" } })));
  const toast = page.locator(".toast-success");
  await expect(toast).toBeVisible();
  const box = await toast.boundingBox();
  expect(box).not.toBeNull();
  expect(box!.x).toBeGreaterThanOrEqual(0);
  expect(box!.x + box!.width).toBeLessThanOrEqual(320);
  await page.getByRole("button", { name: "Dismiss notification" }).click();
  await expect(toast).toHaveCount(0);
});
