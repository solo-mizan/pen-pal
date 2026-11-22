import { expect, test } from "@playwright/test";

const viewports = [320, 360, 375, 390, 414, 430, 540, 760, 820, 1024];
const routes = ["/", "/sign-in", "/sign-up", "/mailbox"];

test("letter handwriting fonts load from the app's bundled font files", async ({ page }) => {
  await page.goto("/");
  const fonts = await page.evaluate(async () => {
    const results: Record<string, { family: string; loaded: boolean }> = {};
    for (const [className, weight] of [["caveat-font", 500], ["atma-font", 400]] as const) {
      const sample = document.createElement("span");
      sample.className = className;
      sample.textContent = "With love, dear friend";
      document.body.append(sample);
      const family = getComputedStyle(sample).fontFamily.split(",")[0].replace(/[\"']/g, "").trim();
      const loaded = await document.fonts.load(`${weight} 24px "${family}"`);
      results[className] = { family, loaded: loaded.length > 0 };
      sample.remove();
    }
    return results;
  });

  expect(fonts["caveat-font"].family).toContain("Caveat");
  expect(fonts["caveat-font"].loaded).toBe(true);
  expect(fonts["atma-font"].family).toContain("Atma");
  expect(fonts["atma-font"].loaded).toBe(true);
});

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

test("the small-screen menu opens accessibly and closes with Escape", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto("/");
  const trigger = page.getByRole("button", { name: "Open site menu" });
  await trigger.click();
  const dialog = page.getByRole("dialog", { name: "Site menu" });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole("link", { name: "How it works" })).toBeVisible();
  await expect(dialog.getByRole("link", { name: /Your mailbox/ })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.locator("#site-menu")).toHaveAttribute("aria-hidden", "true");
  await expect(trigger).toHaveAttribute("aria-expanded", "false");
});

test("core routes remain within a phone viewport with browser text enlarged", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  for (const route of routes) {
    await page.goto(route);
    await page.evaluate(() => { document.documentElement.style.fontSize = "200%"; });
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), {
      message: `${route} should not overflow at 200% root text size`,
    }).toBe(true);
  }
});
