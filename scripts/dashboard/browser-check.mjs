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
  server: { host: "127.0.0.1", port: 4173, strictPort: true },
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
  await page.goto("http://127.0.0.1:4173/#/" + route);
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
  for (const route of [
    "overview?format=ALL",
    "career?format=ODI",
    "innings?format=ODI",
    "compare?format=ODI",
    "pressure?format=ODI",
    "sources",
  ]) {
    await go(
      route,
      route.startsWith("innings")
        ? ".archive-results"
        : route.startsWith("overview")
          ? ".recent-panel"
          : ".panel",
    );
    await noOverflow("desktop " + route);
    await page.screenshot({
      path: output + "/" + route.split("?")[0] + "-desktop.png",
      fullPage: true,
    });
  }
  await go("career?format=T20I", ".group-chart");
  check(
    (await page.locator(".explorer-summary").innerText()).includes("3,963"),
    "T20I explorer uses T20I archive",
  );
  await page.getByLabel("Career opponent").selectOption("Australia");
  check(
    (await page.locator(".archive-table tbody tr").count()) > 0,
    "opponent filter retains matching innings",
  );
  await page.getByLabel("Career situation").selectOption("chase");
  check(
    (await page.locator(".archive-table tbody").innerText()).includes(
      "Chasing",
    ),
    "career situation filters",
  );
  await page.getByRole("button", { name: "opponent", exact: true }).click();
  check(
    !(await page.locator(".group-chart").getAttribute("class")).includes(
      "vertical",
    ),
    "grouping switches chart layout",
  );
  for (const f of ["Test", "IPL"]) {
    await go("career?format=" + f);
    check(
      (await page
        .locator(f === "Test" ? ".test-splits article" : ".group-chart")
        .count()) > 0,
      f + " has a populated career view",
    );
  }
  await go("innings?format=ODI", ".archive-results");
  check(
    (await page.locator(".archive-summary").innerText()).startsWith("300"),
    "ODI archive contains 300 innings",
  );
  const first = await page
    .locator(".archive-table tbody tr")
    .first()
    .innerText();
  await page.getByLabel("Next innings page").click();
  check(
    (await page.locator(".archive-table tbody tr").first().innerText()) !==
      first,
    "pagination changes records",
  );
  await page.getByLabel("Search batting archive").fill("Australia");
  await page.waitForTimeout(100);
  check(
    (await page.locator(".archive-summary").innerText()).startsWith("55"),
    "opponent search finds 55 ODI innings",
  );
  await page.getByRole("button", { name: "Filters", exact: true }).click();
  await page
    .locator(".advanced-filters label")
    .filter({ hasText: "Score" })
    .locator("select")
    .selectOption("100");
  check(
    (await page.locator(".archive-summary").innerText()).startsWith("8"),
    "century filter finds 8 against Australia",
  );
  await page.reload();
  await page.locator(".archive-results").waitFor();
  check(
    (await page.locator(".archive-summary").innerText()).startsWith("8"),
    "filters survive reload",
  );
  const download = page.waitForEvent("download");
  await page.getByLabel("Export batting archive as CSV").click();
  const file = await download;
  const csv = await fs.readFile(await file.path(), "utf8");
  check(csv.split("\r\n").length === 9, "CSV exports exactly filtered innings");
  await page.locator(".archive-table .icon-button").first().click();
  await page.getByRole("button", { name: "Saved", exact: true }).click();
  check(
    (await page.locator(".archive-summary").innerText()).startsWith("1"),
    "saved view has bookmarked innings",
  );
  await page.reload();
  await page.locator(".archive-results").waitFor();
  check(
    (await page.locator(".archive-summary").innerText()).startsWith("1"),
    "bookmarks persist locally",
  );
  await page.locator(".score-button").first().click();
  await page.locator(".detail-progression").waitFor();
  check(
    (await page.locator("dialog[open]").count()) === 1,
    "native scorecard modal opens",
  );
  await page
    .getByRole("button", { name: "Bowler matchups", exact: true })
    .click();
  check(
    (await page.locator(".archive-dialog tbody tr").count()) > 0,
    "per-innings bowlers load",
  );
  await page.screenshot({ path: output + "/scorecard-desktop.png" });
  await page.keyboard.press("Escape");
  check(
    (await page.locator("dialog[open]").count()) === 0,
    "Escape closes scorecard",
  );
  await page.getByLabel("Search batting archive").fill("zzzznotanopponent");
  check(
    await page.getByText("No innings match these filters").isVisible(),
    "empty state is actionable",
  );
  await page.getByRole("button", { name: "Reset archive filters" }).click();
  check(
    (await page.locator(".archive-summary").innerText()).startsWith("687"),
    "reset restores covered archive",
  );
  await page.getByRole("button", { name: "Test", exact: true }).click();
  check(
    await page.locator(".innings-grid").isVisible(),
    "Test scope switches to curated highlights",
  );
  await go("compare?format=ODI");
  await page.getByRole("button", { name: /Steve Smith/ }).click();
  await page.getByRole("button", { name: /Joe Root/ }).click();
  check(
    (await page
      .locator('.player-picker button[aria-pressed="true"]')
      .count()) === 4,
    "comparison supports four players",
  );
  check(
    await page.getByRole("button", { name: /Rohit Sharma/ }).isDisabled(),
    "fifth player is prevented",
  );
  await page.getByLabel("Comparison metric").selectOption("strikeRate");
  await page.reload();
  await page.locator(".comparison-scatter").waitFor();
  check(
    (await page
      .locator('.player-picker button[aria-pressed="true"]')
      .count()) === 4,
    "comparison selections survive reload",
  );
  check(
    (await page.getByLabel("Comparison metric").inputValue()) === "strikeRate",
    "comparison metric survives reload",
  );
  await go("pressure?format=ODI");
  await page.locator(".heat-cell").first().click();
  check(
    (await page.locator(".heat-cell").first().getAttribute("aria-pressed")) ===
      "true",
    "pressure sample selection works",
  );
  await page.getByLabel("Find a bowler").fill("Anderson");
  check(
    (await page.locator(".bowler-lab tbody").innerText()).includes("Anderson"),
    "bowler lookup works",
  );
  await page.setViewportSize({ width: 390, height: 844 });
  for (const route of [
    "overview?format=ALL",
    "career?format=T20I",
    "innings?format=ODI",
    "compare?format=Test",
    "pressure?format=T20I",
    "sources",
  ]) {
    await go(
      route,
      route.startsWith("innings")
        ? ".archive-results"
        : route.startsWith("overview")
          ? ".recent-panel"
          : ".panel",
    );
    await noOverflow("mobile " + route);
    await page.screenshot({
      path: output + "/" + route.split("?")[0] + "-mobile.png",
      fullPage: true,
    });
  }
  await go("overview?format=ALL", ".recent-panel");
  await page.locator(".recent-form button").first().click();
  await page.locator(".detail-progression").waitFor();
  await noOverflow("mobile scorecard");
  await page.keyboard.press("Escape");
  await page.getByLabel("Open navigation").click();
  check(
    (await page.locator(".sidebar").getAttribute("class")) === "sidebar open",
    "mobile navigation opens",
  );
  await page.getByLabel("Close navigation").click();
  await page.setViewportSize({ width: 320, height: 740 });
  await go("overview?format=T20I", ".recent-panel");
  await noOverflow("320px overview");
  await go("innings?format=ALL", ".archive-results");
  await noOverflow("320px archive");

  await page.setViewportSize({ width: 1440, height: 1000 });
  await go("overview?format=ALL", ".identity-hero");
  await page
    .getByRole("button", { name: "Explore the story", exact: true })
    .click();
  await page.locator(".era-stage").waitFor();
  check(
    (await page.locator(".era-main-number").innerText()).includes("81.22"),
    "peak era is archive-derived",
  );
  await page.getByRole("button", { name: /2008–2011/ }).click();
  check(
    (await page.locator(".era-narrative").innerText()).includes(
      "Before the records",
    ),
    "era selection changes narrative",
  );
  await page
    .getByRole("group", { name: "Era format" })
    .getByRole("button", { name: "T20I", exact: true })
    .click();
  await page.reload();
  await page.locator(".era-stage").waitFor();
  check(
    (await page
      .getByRole("group", { name: "Era format" })
      .getByRole("button", { name: "T20I", exact: true })
      .getAttribute("aria-pressed")) === "true",
    "era format survives reload",
  );
  await page.locator(".era-year-chart button").first().click();
  await page.locator(".explorer-summary").waitFor();
  check(
    new URL(page.url()).hash.includes("year="),
    "era year opens filtered career explorer",
  );
  for (const [id, final] of [
    ["1298150", "82"],
    ["951363", "82"],
    ["518966", "133"],
    ["535798", "183"],
  ]) {
    await go("story?chapter=replay&match=" + id, ".replay-console");
    const slider = page.getByRole("slider", { name: "Replay over" });
    await slider.focus();
    await slider.press("End");
    check(
      (
        await page.locator(".replay-scoreboard>span").nth(1).innerText()
      ).includes(final),
      "replay ends at true final score " + id,
    );
    check(
      await page.getByLabel("Next replay over").isDisabled(),
      "replay bounds " + id,
    );
  }
  await page.getByLabel("Restart innings replay").click();
  const before = await page.getByRole("slider").inputValue();
  await page.getByLabel("Play innings replay").click();
  await page.waitForTimeout(1100);
  await page.getByLabel("Pause innings replay").click();
  check(
    (await page.getByRole("slider").inputValue()) !== before,
    "replay playback advances checkpoints",
  );
  const paused = await page.getByRole("slider").inputValue();
  await page.waitForTimeout(1100);
  check(
    (await page.getByRole("slider").inputValue()) === paused,
    "pause freezes replay",
  );
  check(
    (await page
      .locator(".play-replay svg")
      .evaluate((e) => e.getBoundingClientRect().height)) < 30,
    "play icon has correct size",
  );
  await page.getByRole("button", { name: /The captain/, exact: false }).click();
  await page.locator(".captain-story").waitFor();
  check(
    (await page.locator(".captain-forty").innerText()).includes("40"),
    "captain chapter opens",
  );
  await page.getByRole("button", { name: /Rivalries/ }).click();
  await page
    .getByRole("group", { name: "Choose a rivalry" })
    .getByRole("button", { name: /Pakistan/ })
    .click();
  check(
    (await page.locator(".rivalry-headline").innerText()).includes("1,270"),
    "rivalry selection updates records",
  );
  await page.reload();
  await page.locator(".rivalry-stage").waitFor();
  check(
    (await page.locator(".rivalry-stage h3").innerText()) === "Pakistan",
    "rivalry survives reload",
  );
  await page
    .getByRole("button", { name: "Explore covered innings", exact: true })
    .click();
  await page.locator(".archive-results").waitFor();
  check(
    await page
      .locator(".archive-table tbody")
      .innerText()
      .then((t) => t.includes("Pakistan")),
    "rivalry opens real archive filter",
  );
  await go("story?chapter=eras", ".era-stage");
  await page.getByRole("button", { name: "Enter the gauntlet" }).click();
  check(
    (await page.locator(".quiz-progress-label").innerText()).includes(
      "Question 1 of 12",
    ),
    "expert quiz replaces the three-question widget",
  );
  await page.locator(".gauntlet-options button").first().click();
  check(
    (await page.locator(".gauntlet-options button:disabled").count()) === 4,
    "quiz locks all choices after answering",
  );
  await page.getByRole("button", { name: "End round", exact: true }).click();
  for (const width of [390, 320]) {
    await page.setViewportSize({ width, height: 844 });
    for (const chapter of ["eras", "replay", "captaincy", "rivalries"]) {
      await go(
        "story?chapter=" + chapter,
        chapter === "eras"
          ? ".era-stage"
          : chapter === "replay"
            ? ".replay-console"
            : chapter === "captaincy"
              ? ".captain-story"
              : ".rivalry-stage",
      );
      await noOverflow(width + "px story " + chapter);
    }
  }
  await page.setViewportSize({ width: 1440, height: 1000 });
  await go("story?chapter=compare-innings", ".pair-chart");
  check(
    (await page.getByLabel("Select innings A").inputValue()) === "1298150",
    "comparison defaults to Melbourne",
  );
  check(
    (await page.getByLabel("Select innings B").inputValue()) === "951363",
    "comparison defaults to Mohali",
  );
  await page.getByLabel("Comparison balls faced").fill("0");
  check(
    (await page.locator(".pair-checkpoints").innerText()).includes(
      "No recorded checkpoint",
    ),
    "comparison does not invent opening data",
  );
  await page
    .getByRole("button", { name: "Hobart vs Mirpur", exact: true })
    .click();
  await page.locator(".pair-chart").waitFor();
  check(
    (await page.locator(".pair-scorecards").innerText()).includes("183"),
    "preset loads Mirpur score",
  );
  await page.reload();
  await page.locator(".pair-chart").waitFor();
  check(
    (await page.getByLabel("Select innings A").inputValue()) === "518966",
    "pair survives reload",
  );
  await page.getByLabel("Swap compared innings").click();
  check(
    (await page.getByLabel("Select innings A").inputValue()) === "535798",
    "swap exchanges innings",
  );
  await page.getByLabel("Search innings A").fill("no matching ground anywhere");
  check(
    (await page.getByLabel("Select innings A").locator("option").count()) === 1,
    "empty search retains current innings",
  );
  await page.getByLabel("Select innings B").selectOption("951363");
  await page.locator(".pair-chart").waitFor();
  check(
    await page.locator(".pair-scope").isVisible(),
    "mixed format comparison explains scope",
  );
  await page.locator(".compare-bowlers summary").first().click();
  check(
    await page.locator(".compare-bowlers table").first().isVisible(),
    "bowler breakdown expands",
  );
  for (const width of [1440, 390, 320]) {
    await page.setViewportSize({ width, height: 1000 });
    await noOverflow(width + "px innings comparison");
    await page.screenshot({
      path: output + "/innings-comparison-" + width + ".png",
      fullPage: true,
    });
  }
  await go("story?chapter=replay&match=1298150", ".replay-context");
  check(
    await page.locator(".replay-context").isVisible(),
    "replay shows pace, contribution and checkpoint change",
  );
  await page
    .getByRole("button", { name: "Compare this innings", exact: true })
    .click();
  await page.locator(".pair-chart").waitFor();
  check(
    (await page.getByLabel("Select innings A").inputValue()) === "1298150",
    "replay opens its own innings in comparison",
  );
  await go("innings?format=ODI", ".archive-results");
  await page.locator(".score-button").first().click();
  await page.locator(".detail-progression").waitFor();
  await page
    .getByRole("link", { name: "Compare innings", exact: false })
    .click();
  await page.locator(".pair-chart").waitFor();
  check(
    (await page.locator("dialog[open]").count()) === 0,
    "archive scorecard opens comparison and closes dialog",
  );
  await go(
    "story?chapter=compare-innings&left=1298150&right=951363",
    ".pair-chart",
  );
  for (const width of [1440, 390, 320]) {
    await page.setViewportSize({ width, height: 1000 });
    check(
      await page
        .locator(".pair-metrics")
        .evaluate((el) => el.scrollWidth <= el.parentElement.clientWidth),
      width + "px scorecard fits both innings",
    );
    await page.screenshot({
      path: output + "/comparison-final-" + width + ".png",
      fullPage: true,
    });
  }
  check(errors.length === 0, "no browser runtime errors");
  console.log(JSON.stringify({ checks, errors, output }));
} finally {
  await browser.close();
  await server.close();
}
