// Browser fixtures only: no live orders, emails, approvals or bookmark writes.
import { chromium, expect as baseExpect } from "@playwright/test";
import { readFile, mkdir } from "node:fs/promises";
const expect = baseExpect.configure({ timeout: 30000 });
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
page.setDefaultTimeout(30000);
const errors = [], saves = [], marks = new Map(), requests = [];
const acceptedFormats = [];
let lastPage = 1, fail = false, denied = false, pendingRelease;
const images = await Promise.all([1, 20, 21].map(n => readFile(`private-ebooks/manal-web/${String(n).padStart(4, "0")}.webp`)));
page.on("pageerror", e => { errors.push(e.message); console.error(e.message); });
await page.route("**/api/ebooks/**", async route => {
  const req = route.request(), url = new URL(req.url());
  const json = (body, status = 200) => route.fulfill({ status, contentType: "application/json", body: JSON.stringify(body) });
  if (!url.pathname.endsWith("/read/reader-fixture")) return json({ error: "Unexpected request" }, 500);
  if (denied) return json({ error: "Reading access is no longer active." }, 403);
  if (req.method() === "PATCH") {
    const data = req.postDataJSON();
    if (data.action === "remove") marks.delete(data.page); else marks.set(data.page, data.label);
    return json({ success: true });
  }
  if (req.method() === "PUT") { lastPage = req.postDataJSON().page; saves.push(lastPage); return json({ success: true }); }
  if (url.searchParams.has("page")) {
    const n = Number(url.searchParams.get("page"));
    requests.push(n);
    acceptedFormats.push(req.headers().accept);
    if (fail) return json({ error: "Connection interrupted. Please retry." }, 503);
    if (pendingRelease) await pendingRelease.promise;
    return route.fulfill({ contentType: "image/webp", body: images[n === 1 ? 0 : n % 2 === 0 ? 1 : 2] });
  }
  return json({ titleEn: "366 Mistakes That Lead to Business Failure", titleAr: "٣٦٦ خطأ تقود إلى فشل الأعمال", author: "Dr. Manal Hassoun", direction: "rtl", pageCount: 385, versionId: "reader-v1", lastPage, bookmarks: [...marks].map(([page, label]) => ({ page, label })) });
});
const image = n => page.getByRole("img", { name: `Page ${n}`, exact: true });
async function close() { await page.getByRole("button", { name: "Close panel", exact: true }).click(); }
try {
  await mkdir("private-ebooks/screenshots", { recursive: true });
  await page.goto("http://localhost:3107/en/ebooks/read/reader-fixture", { waitUntil: "domcontentloaded", timeout: 90000 });
  await expect(image(1)).toBeVisible();
  async function checkPageSaveActions(target) {
    expect(await target.evaluate(el => {
      const context = new MouseEvent("contextmenu", { bubbles: true, cancelable: true });
      const drag = new Event("dragstart", { bubbles: true, cancelable: true });
      el.dispatchEvent(context); el.dispatchEvent(drag);
      return { context: context.defaultPrevented, drag: drag.defaultPrevented, draggable: el.draggable };
    })).toEqual({ context: true, drag: true, draggable: false });
  }
  await checkPageSaveActions(image(1));
  await page.screenshot({ path: "private-ebooks/screenshots/reader-cover.png" });
  await page.getByRole("button", { name: "Next page", exact: true }).click();
  await expect(image(2)).toBeVisible(); await expect(image(3)).toBeVisible();
  await page.locator('[data-reader-dock]').hover();
  await expect(page.getByRole("button", { name: "Bookmark this page", exact: true })).toBeEnabled();
  await page.getByRole("button", { name: "Bookmark this page", exact: true }).click();
  await expect(page.getByRole("button", { name: "Remove bookmark", exact: true })).toBeVisible();
  await page.getByRole("img", { name: "Page 3", exact: true }).hover();
  await page.getByRole("button", { name: "Bookmark page 3", exact: true }).click();
  await expect(page.getByRole("button", { name: "Unbookmark page 3", exact: true })).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "Unbookmark page 3", exact: true }).click();
  await expect(page.getByRole("button", { name: "Bookmark page 3", exact: true })).toHaveAttribute("aria-pressed", "false");
  await page.getByRole("button", { name: "Bookmarks", exact: true }).click();
  await page.getByPlaceholder("Add a short label (optional)").fill("Return to this idea");
  await page.getByRole("button", { name: "Save bookmark", exact: true }).click();
  await expect(page.getByRole("button", { name: "2 Return to this idea Return to this page", exact: true })).toBeVisible();
  await page.screenshot({ path: "private-ebooks/screenshots/reader-bookmarks.png" });
  await page.keyboard.press("Escape");
  await expect(page.getByRole("button", { name: "Bookmarks", exact: true })).toBeFocused();
  await page.reload({ waitUntil: "domcontentloaded" });
  await expect(image(2)).toBeVisible();
  await page.locator('[data-reader-dock]').hover();
  await expect(page.getByRole("button", { name: "Remove bookmark", exact: true })).toBeVisible();
  await page.screenshot({ path: "private-ebooks/screenshots/reader-spread.png" });
  // The next spread has already decoded: navigation must not fetch it again.
  await expect(page.locator('[data-reader-flipbook] img[alt="Page 4"]')).toHaveCount(1);
  const before = requests.filter(n => n === 4).length;
  const started = performance.now();
  await page.getByRole("button", { name: "Next page", exact: true }).click();
  await expect(image(4)).toBeVisible();
  await expect(page.locator('[data-reader-flipbook]')).toHaveAttribute("data-turn-state", "read");
  expect(requests.filter(n => n === 4).length).toBe(before);
  console.log(`Buffered page turn including animation: ${Math.round(performance.now() - started)} ms; no repeat page request.`);
  // Hold a real pointer drag mid-turn: this must be a paper fold, not a CSS slide.
  const dragPage = await image(5).boundingBox();
  await page.mouse.move(dragPage.x + 12, dragPage.y + dragPage.height - 16);
  await page.mouse.down();
  await page.mouse.move(dragPage.x + dragPage.width * .85, dragPage.y + dragPage.height * .7, { steps: 12 });
  await expect(page.locator('[data-reader-flipbook]')).toHaveAttribute("data-turn-state", "user_fold");
  await page.screenshot({ path: "private-ebooks/screenshots/reader-paper-curl.png" });
  await page.mouse.move(dragPage.x + dragPage.width * 1.8, dragPage.y + dragPage.height * .8, { steps: 8 });
  await page.mouse.up();
  await expect(image(6)).toBeVisible();
  await expect(page.locator('[data-reader-flipbook]')).toHaveAttribute("data-turn-state", "read");
  await page.getByRole("button", { name: "Previous page", exact: true }).click();
  await expect(image(4)).toBeVisible();
  await expect(page.locator('[data-reader-flipbook]')).toHaveAttribute("data-turn-state", "read");
  // A distant uncached jump retains the current spread while downloading.
  let release; pendingRelease = { promise: new Promise(resolve => { release = resolve; }) };
  await page.locator('[data-reader-dock]').hover();
  await page.getByRole("button", { name: "Go to page", exact: true }).click();
  await page.getByLabel("Page number", { exact: true }).fill("50");
  await page.getByRole("dialog").getByRole("button", { name: "Go to page", exact: true }).click();
  await expect(page.getByText("Turning the page…", { exact: true })).toBeVisible();
  await expect(image(4)).toBeVisible();
  release(); pendingRelease = null;
  await expect(image(50)).toBeVisible();
  fail = true;
  await page.locator('[data-reader-dock]').hover();
  await page.getByRole("button", { name: "Go to page", exact: true }).click();
  await page.getByLabel("Page number", { exact: true }).fill("100");
  await page.getByRole("dialog").getByRole("button", { name: "Go to page", exact: true }).click();
  await expect(page.getByRole("alert").filter({ hasText: "Connection interrupted" })).toBeVisible(); await expect(image(50)).toBeVisible();
  fail = false; await page.getByRole("button", { name: "Try again", exact: true }).click();
  await expect(image(100)).toBeVisible();
  await page.locator('[data-reader-dock]').hover();
  await page.getByRole("button", { name: "Go to page", exact: true }).click();
  await page.getByLabel("Page number", { exact: true }).fill("385");
  await page.getByRole("dialog").getByRole("button", { name: "Go to page", exact: true }).click();
  await expect(image(385)).toBeVisible(); await expect(page.getByRole("button", { name: "Next page", exact: true })).toBeDisabled();
  await page.getByRole("button", { name: "Reading settings", exact: true }).click();
  await page.getByRole("button", { name: "Dark", exact: true }).click();
  await page.getByRole("button", { name: "Single page", exact: true }).click();
  await page.getByRole("checkbox", { name: "Animate page turns" }).uncheck();
  await close(); await expect(image(385)).toBeVisible();
  await page.locator('[data-reader-dock]').hover();
  await page.getByRole("button", { name: "Focus mode", exact: true }).click();
  await expect(page.getByRole("button", { name: "Exit focus", exact: true })).toBeVisible();
  await page.screenshot({ path: "private-ebooks/screenshots/reader-dark-focus.png" });
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Fullscreen", exact: true }).click();
  await expect(page.getByRole("button", { name: "Exit fullscreen", exact: true })).toBeVisible();
  const footer = page.locator('footer[aria-label="Reading controls"]');
  await page.mouse.move(30, 100);
  await expect(footer).toHaveCSS("opacity", "0");
  await page.mouse.move(720, 990);
  await expect(footer).toHaveCSS("opacity", "1");
  await page.getByRole("button", { name: "Go to page", exact: true }).focus();
  await page.mouse.move(30, 100);
  await expect(footer).toHaveCSS("opacity", "1");
  await page.getByRole("button", { name: "Exit fullscreen", exact: true }).focus();
  await expect(footer).toHaveCSS("opacity", "0");
  await page.getByRole("button", { name: "Exit fullscreen", exact: true }).click();
  await page.locator('[data-reader-dock]').hover();
  await page.getByRole("button", { name: "Zoom in", exact: true }).click();
  await expect(page.getByRole("button", { name: "Zoom 125%", exact: true })).toBeVisible();
  await checkPageSaveActions(image(385));
  await page.getByRole("button", { name: "Zoom out", exact: true }).click();
  await page.keyboard.press("ArrowRight");
  await expect(image(384)).toBeVisible();
  // Mobile single-page layout, Arabic swipe direction, and reduced motion.
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  lastPage = 20;
  await page.goto("http://localhost:3107/ar/ebooks/read/reader-fixture", { waitUntil: "domcontentloaded", timeout: 90000 });
  await expect(page.getByRole("img", { name: "صفحة 20", exact: true })).toBeVisible();
  const img = page.getByRole("img", { name: "صفحة 20", exact: true });
  const box = await img.boundingBox();
  await page.mouse.move(box.x + 12, box.y + box.height * .65);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width - 12, box.y + box.height * .55, { steps: 18 });
  await page.mouse.up();
  await expect(page.getByRole("img", { name: "صفحة 21", exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy();
  await page.screenshot({ path: "private-ebooks/screenshots/reader-mobile-ar.png" });
  denied = true;
  await page.evaluate(() => document.dispatchEvent(new Event("visibilitychange")));
  await expect(page.getByRole("alert").filter({ hasText: "Reading access is no longer active" })).toBeVisible();
  await expect(page.getByRole("img", { name: /^صفحة / })).toHaveCount(0);
  expect(errors).toEqual([]); expect(marks.get(2)).toBe("Return to this idea"); expect(saves.length).toBeGreaterThan(3);
  expect(acceptedFormats.length).toBeGreaterThan(0);
  expect(acceptedFormats.every(value => value === "image/avif,image/webp")).toBe(true);
  console.log("Passed: spreads, RTL navigation/swipe, bookmark save/rename/reload, position restore, slow-page continuity, failure retry, last page, themes, focus/fullscreen, mobile, reduced motion, revoked access. No live writes.");
} finally { await browser.close(); }
