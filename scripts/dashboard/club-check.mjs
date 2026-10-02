// Optional real-browser QA: requires Playwright and a locally installed Chromium.
// PLAYWRIGHT_MODULE may point to an external Playwright installation; no production dependency is added.
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { createServer } from "vite";
const { chromium } = await import(
  process.env.PLAYWRIGHT_MODULE || "playwright"
);
const root = fileURLToPath(new URL("../../", import.meta.url));
const output = process.env.QA_OUTPUT || "/tmp/kohli-browser-check";
await fs.mkdir(output, { recursive: true });
const server = await createServer({
  root,
  server: { host: "127.0.0.1", port: 4185, strictPort: true },
});
await server.listen();
const browser = await chromium.launch({
  headless: true,
  ...(process.env.CHROMIUM_EXECUTABLE_PATH
    ? { executablePath: process.env.CHROMIUM_EXECUTABLE_PATH }
    : {}),
  args: JSON.parse(process.env.CHROMIUM_ARGS || "[]"),
});
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
let checks = 0;
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
await page.route("**/api/fixtures", (route) =>
  route.fulfill({
    json: {
      status: "unavailable",
      match: null,
      message: "Offline QA fixture",
      reason: "missing-credentials",
      fetchedAt: new Date().toISOString(),
    },
  }),
);
const check = (condition, label) => {
  assert.ok(condition, label);
  checks++;
  console.log("PASS", label);
};
async function go(route, selector = ".panel") {
  await page.goto("http://127.0.0.1:4185/#/" + route);
  await page.locator(selector).first().waitFor();
  await page.waitForTimeout(100);
}
async function noOverflow(label) {
  check(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
    label,
  );
}
const bank = JSON.parse(
  await fs.readFile(root + "/src/dashboard/cricketQuestions.json", "utf8"),
);
try {
  await go("club", ".cricket-quiz");
  check(
    (await page.locator(".quiz-modes button").count()) === 3,
    "three difficulty lengths are available",
  );
  await page
    .locator(".quiz-modes button")
    .filter({ hasText: "Full gauntlet" })
    .click();
  await page.getByRole("button", { name: "Enter the gauntlet" }).click();
  for (let i = 0; i < 40; i++) {
    const prompt = await page.locator(".gauntlet-play h3").innerText();
    const q = bank.find((q) => q.prompt === prompt);
    assert.ok(q);
    await page
      .locator(".gauntlet-options button")
      .filter({ hasText: q.options[q.answer] })
      .click();
    if (i === 2) {
      const before = await page.locator(".gauntlet-options").innerText();
      await page.reload();
      await page.locator(".gauntlet-play").waitFor();
      check(
        (await page.locator(".gauntlet-options button:disabled").count()) === 4,
        "resume preserves locked answer",
      );
      check(
        (await page.locator(".gauntlet-options").innerText()) === before,
        "resume preserves shuffled answer order",
      );
    }
    await page
      .getByRole("button", {
        name: i === 39 ? "Reveal result" : "Next question",
        exact: true,
      })
      .click();
  }
  await page.locator(".winner-arena[open]").waitFor();
  const winningSave = await page.evaluate(() => localStorage.getItem("cricket-gauntlet-v1"));
  check(
    (await page.locator(".winner-medal").innerText()).includes("40"),
    "perfect full gauntlet unlocks full-screen reward",
  );
  check(
    (await page.locator(".winner-confetti i").count()) === 100,
    "winner reveal renders bounded celebration particles",
  );
  const d = page.waitForEvent("download");
  await page.getByRole("button", { name: "Claim your digital trophy" }).click();
  const file = await d;
  const svg = await fs.readFile(await file.path(), "utf8");
  check(
    svg.includes("40/40") && svg.includes("THE PERFECT INNINGS"),
    "trophy download uses earned score",
  );
  await page.screenshot({ path: output + "/winner-desktop.png" });
  await page.keyboard.press("Escape");
  check(
    (await page.locator(".winner-arena[open]").count()) === 0,
    "Escape dismisses celebration",
  );
  await page.locator(".answer-review summary").click();
  check(
    (await page.locator(".answer-review article").count()) === 40,
    "full answer review includes all 40 questions",
  );
  await page.reload();
  await page.locator(".gauntlet-result").waitFor();
  check(
    (await page.locator(".result-heading").innerText()).includes("40"),
    "completed round survives reload",
  );
  await page.getByRole("button", { name: "New challenge" }).click();
  await page
    .locator(".quiz-modes button")
    .filter({ hasText: "Expert sprint" })
    .click();
  await page.getByRole("button", { name: "Enter the gauntlet" }).click();
  for (let i = 0; i < 12; i++) {
    const prompt = await page.locator(".gauntlet-play h3").innerText();
    const q = bank.find((q) => q.prompt === prompt);
    await page
      .locator(".gauntlet-options button")
      .filter({ hasText: q.options[1] })
      .click();
    await page
      .getByRole("button", {
        name: i === 11 ? "Reveal result" : "Next question",
        exact: true,
      })
      .click();
  }
  check(
    (await page.locator(".winner-arena[open]").count()) === 0,
    "losing round does not unlock celebration",
  );
  check(
    (await page.getByRole("button", { name: "Reveal your reward" }).count()) ===
      0,
    "losing round does not offer trophy",
  );
  await page.getByRole("button", { name: "New challenge" }).click();
  await go(
    "compare?format=Test&players=root,smith,williamson&focusA=root&focusB=smith",
    ".comparison-scatter",
  );
  check(
    (await page.getByLabel("Comparison focus A").inputValue()) === "root",
    "comparison can focus on a player other than Kohli",
  );
  await page.getByLabel("Comparison focus B").selectOption("williamson");
  await page.reload();
  await page.locator(".comparison-scatter").waitFor();
  check(
    (await page.getByLabel("Comparison focus B").inputValue()) === "williamson",
    "selected pair survives sharing and reload",
  );
  await page
    .getByRole("button", { name: "ODI across eras", exact: true })
    .click();
  check(
    (await page.getByLabel("Comparison focus A").inputValue()) === "sachin" &&
      (await page.getByLabel("Comparison focus B").inputValue()) === "ponting",
    "comparison preset sets deliberate pair without Kohli",
  );
  for (const width of [1440, 390, 320]) {
    await page.setViewportSize({ width, height: 1000 });
    for (const [route, selector, name] of [
      ["club", ".cricket-quiz", "club"],
      [
        "compare?format=Test&players=root,smith,williamson&focusA=root&focusB=smith",
        ".comparison-scatter",
        "comparison-focus",
      ],
    ]) {
      await go(route, selector);
      await noOverflow(width + "px " + name);
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.screenshot({
        path: output + "/" + name + "-" + width + ".png",
        fullPage: true,
      });
    }
    await go("club", ".cricket-quiz");
    await page.getByRole("button", { name: "Enter the gauntlet" }).click();
    await noOverflow(width + "px active quiz");
    await page
      .locator(".cricket-quiz")
      .screenshot({ path: output + "/quiz-" + width + ".png" });
    await page.getByRole("button", { name: "End round", exact: true }).click();
  }
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.evaluate((save) => localStorage.setItem("cricket-gauntlet-v1", save), winningSave);
  await page.reload();
  await page.getByRole("button", { name: "Reveal your reward" }).click();
  await page.locator(".winner-arena[open]").waitFor();
  check(await page.locator(".winner-confetti").evaluate(el => getComputedStyle(el).display === "none"), "reduced motion hides celebration particles");
  check(await page.locator(".winner-arena").evaluate(el => el.scrollWidth <= el.clientWidth), "320px winner dialog has no horizontal overflow");
  await page.screenshot({ path: output + "/winner-mobile.png" });
  check(errors.length === 0, "no quiz/comparison browser runtime errors");
  console.log(JSON.stringify({ checks, errors, output }));
} finally {
  await browser.close();
  await server.close();
}
