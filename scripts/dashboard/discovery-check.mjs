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
  server: { host: "127.0.0.1", port: 4183, strictPort: true },
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
  await page.goto("http://127.0.0.1:4183/#/" + route);
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
try {
  await go("ipl?year=2016", ".rcb-hero");
  check(
    (await page.locator(".season-run-total").innerText()).includes("973"),
    "RCB hub shows real 2016 total",
  );
  check(
    (await page.locator(".season-matches button").count()) === 16,
    "all 16 batting innings in 2016 are playable",
  );
  check(
    (await page.locator(".season-selector button").count()) === 19,
    "19 IPL seasons available",
  );
  const dl = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download season card" }).click();
  const download = await dl;
  const svg = await fs.readFile(await download.path(), "utf8");
  check(
    svg.includes("973") &&
      svg.includes("2016 SEASON") &&
      svg.includes("Cricsheet"),
    "downloaded season card uses actual selected data and attribution",
  );
  await page.locator(".season-matches button").first().click();
  await page.locator(".detail-progression").waitFor();
  check(
    (await page.locator("#archive-detail-title").innerText()).startsWith("RCB"),
    "IPL scorecard labels the correct team",
  );
  await page
    .getByRole("button", { name: "Bowler matchups", exact: true })
    .click();
  check(
    (await page.locator(".archive-dialog tbody tr").count()) > 0,
    "IPL bowler matchups load",
  );
  await page.keyboard.press("Escape");
  await page
    .getByRole("group", { name: "IPL seasons" })
    .getByRole("button", { name: /2024/ })
    .click();
  check(
    (await page.locator(".season-run-total").innerText()).includes("741"),
    "season switch updates data",
  );
  await page.reload();
  await page.locator(".rcb-hero").waitFor();
  check(
    (await page.locator(".season-command h2").innerText()).includes("2024"),
    "season persists in URL",
  );
  await page.locator(".ipl-opponents button").first().click();
  await page.locator(".archive-results").waitFor();
  check(
    (await page
      .getByRole("group", { name: "Format scope" })
      .getByRole("button", { name: "IPL", exact: true })
      .getAttribute("aria-pressed")) === "true",
    "opposition link preserves IPL archive scope",
  );
  check(
    (await page.locator(".archive-table tbody").innerText()).includes("2024"),
    "opposition link preserves season",
  );
  await go("innings?format=IPL", ".archive-results");
  check(
    (await page.locator(".archive-summary").innerText()).startsWith("275"),
    "IPL library opens 275 innings rather than one highlight",
  );
  await page
    .getByRole("group", { name: "Format scope" })
    .getByRole("button", { name: "Test", exact: true })
    .click();
  await page
    .getByRole("group", { name: "Format scope" })
    .getByRole("button", { name: "IPL", exact: true })
    .click();
  check(
    await page.locator(".archive-results").isVisible(),
    "switching from Test restores IPL archive",
  );
  await go("career?format=IPL", ".group-chart");
  check(
    (await page.locator(".explorer-summary").innerText()).includes("9,336"),
    "IPL career explorer uses full sourced archive",
  );
  await go("discover?format=IPL", ".innings-atlas");
  check(
    (await page.locator(".atlas-cell").count()) === 275,
    "IPL atlas contains one square per innings",
  );
  await page
    .getByRole("group", { name: "Discovery lenses" })
    .getByRole("button", { name: /Hundred club/ })
    .click();
  check(
    (await page.locator(".atlas-cell").count()) === 9,
    "hundred lens finds all nine covered IPL centuries",
  );
  await page.locator(".atlas-cell").first().click();
  await page.locator(".detail-progression").waitFor();
  check(
    (await page.locator("dialog[open]").count()) === 1,
    "atlas square opens scorecard",
  );
  await page.keyboard.press("Escape");
  await page.getByLabel("Explore 2016 innings").click();
  check(
    (await page.locator(".discovery-card").count()) === 4,
    "year focus shows four 2016 centuries",
  );
  await page.reload();
  await page.locator(".innings-atlas").waitFor();
  check(
    (await page.locator(".discovery-card").count()) === 4,
    "discovery lens and year survive reload",
  );
  await page.locator(".discovery-card-kicker button").first().click();
  await page
    .getByRole("group", { name: "Discovery lenses" })
    .getByRole("button", { name: /Your collection/ })
    .click();
  check(
    (await page.locator(".discovery-card").count()) === 1,
    "collection shows bookmarked IPL innings",
  );
  await page.reload();
  await page.locator(".innings-atlas").waitFor();
  check(
    (await page.locator(".discovery-card").count()) === 1,
    "collection persists on device",
  );
  await page.getByRole("button", { name: "Surprise me" }).click();
  await page.locator(".detail-progression").waitFor();
  check(
    (await page.locator("dialog[open]").count()) === 1,
    "surprise opens an innings within selected lens",
  );
  await page.keyboard.press("Escape");
  await go("discover?format=Test", ".innings-atlas");
  check(
    (await page.locator(".lab-empty").innerText()).includes("Test"),
    "unsupported Test scope has an honest actionable state",
  );
  await page.getByRole("button", { name: "Open Test highlights" }).click();
  check(
    page.url().includes("collection=highlights"),
    "Test empty state links to real highlights",
  );
  await go("ipl?year=2016", ".rcb-hero");
  await page
    .getByRole("button", { name: "Compare innings", exact: true })
    .click();
  await page.locator(".pair-chart").waitFor();
  check(
    (await page.locator(".pair-scorecards").innerText()).includes("IPL"),
    "IPL season high opens comparison",
  );
  check(
    (await page.locator(".pair-checkpoints").innerText()).includes("RCB"),
    "IPL comparison checkpoint uses RCB team label",
  );
  await go(
    "career?format=IPL&year=2016&opponent=Gujarat%20Lions",
    ".group-chart",
  );
  await page
    .getByRole("group", { name: "Format scope" })
    .getByRole("button", { name: "ODI", exact: true })
    .click();
  check(
    (await page.getByLabel("Career opponent").inputValue()) === "" &&
      (await page.getByLabel("Career year").inputValue()) === "",
    "switching formats clears incompatible filters",
  );
  for (const width of [1440, 390, 320]) {
    await page.setViewportSize({ width, height: 1000 });
    for (const [route, selector, name] of [
      ["ipl?year=2016", ".rcb-hero", "rcb"],
      ["discover?format=IPL&metric=all", ".innings-atlas", "discovery"],
      ["overview?format=ALL", ".explore-entrances", "home"],
      ["career?format=IPL", ".group-chart", "ipl-career"],
      ["sources", ".ipl-provenance-panel", "sources"],
    ]) {
      await go(route, selector);
      await noOverflow(width + "px " + name);
      if (name === "rcb")
        check(
          await page.locator(".season-selector").evaluate((rail) => {
            const active = rail.querySelector('[aria-pressed="true"]');
            const a = active.getBoundingClientRect(),
              r = rail.getBoundingClientRect();
            return a.left >= r.left - 1 && a.right <= r.right + 1;
          }),
          width + "px selected season is visible in timeline",
        );
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.screenshot({
        path: output + "/" + name + "-" + width + ".png",
        fullPage: true,
      });
      if (name === "rcb" || name === "discovery")
        await page.screenshot({
          path: output + "/" + name + "-first-" + width + ".png",
        });
    }
  }
  await page.getByLabel("More navigation").click();
  check(
    await page.locator(".sidebar.open").isVisible(),
    "mobile More exposes complete navigation",
  );
  check(errors.length === 0, "no discovery browser runtime errors");
  console.log(JSON.stringify({ checks, errors, output }));
} finally {
  await browser.close();
  await server.close();
}
