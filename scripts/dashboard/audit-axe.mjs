import { fileURLToPath } from "node:url";
import fs from "node:fs/promises";
import path from "node:path";
import { createServer } from "vite";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || "playwright-core");
const root = fileURLToPath(new URL("../../", import.meta.url));
const axePath = require.resolve("axe-core/axe.min.js");
const axeSource = await fs.readFile(axePath, "utf8");
const previewDir = path.join(root, "preview");
await fs.mkdir(previewDir, { recursive: true });

const server = await createServer({
  root,
  server: { host: "127.0.0.1", port: 4175, strictPort: true },
});
await server.listen();

const browser = await chromium.launch({
  headless: true,
  executablePath: process.env.CHROMIUM_EXECUTABLE_PATH || "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
});

const routes = [
  { path: "overview?format=ALL", expectedSelector: ".identity-hero, .stats-grid", name: "Overview (All formats)" },
  { path: "club", expectedSelector: ".cricket-club, .club-hero", name: "Cricket Club" },
  { path: "compare?format=ODI", expectedSelector: ".compare-dashboard, .compare-visual", name: "Player Comparison (ODI)" },
  { path: "innings?format=ODI", expectedSelector: ".archive-table, .archive-library", name: "Innings Library (ODI)" },
  { path: "discover?format=IPL", expectedSelector: ".discovery-lab, .discovery-header", name: "Discovery Lab (IPL)" },
  { path: "ipl", expectedSelector: ".ipl-hub, .ipl-timeline", name: "IPL / RCB Chapter" },
  { path: "story", expectedSelector: ".story-experience, .story-hero", name: "The Kohli Story" },
  { path: "pressure?format=ODI", expectedSelector: ".pressure-map, .pressure-dashboard", name: "Pressure Performance (ODI)" },
  { path: "career?format=Test", expectedSelector: ".career-lab, .stat-card", name: "Career Explorer (Test)" },
  { path: "sources", expectedSelector: ".sources-container, .sources-page, main dl", name: "Data Sources & Methodology" },
];

const viewports = [
  { name: "desktop", width: 1440, height: 900 },
  { name: "mobile", width: 375, height: 812 },
];

const fullReport = {
  timestamp: new Date().toISOString(),
  environment: {
    browser: "Google Chrome (Headless)",
    axeVersion: "4.13.0",
    tags: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"],
  },
  routesScanned: [],
  modalStates: [],
  summary: {
    totalScans: 0,
    totalViolations: 0,
    passes: 0,
  },
};

for (const vp of viewports) {
  const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height } });
  await page.route("**/api/fixtures", (route) =>
    route.fulfill({
      json: {
        status: "unavailable",
        match: null,
        message: "Offline QA fixture",
        reason: "missing-credentials",
        fetchedAt: new Date().toISOString(),
      },
    })
  );

  console.log(`\n=== Scanning in ${vp.name.toUpperCase()} viewport (${vp.width}x${vp.height}) ===`);

  for (const r of routes) {
    const targetUrl = `http://127.0.0.1:4175/#${r.path}`;
    await page.goto(targetUrl);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(400);

    // Verify distinct route content rendered
    const hasContent = await page.locator("main#dashboard-main").count();
    const heading = await page.locator(".page-heading h1").textContent().catch(() => "N/A");

    // Inject axe
    await page.evaluate(axeSource);
    const axeResult = await page.evaluate(async () => {
      return await window.axe.run(document, {
        runOnly: {
          type: "tag",
          values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"],
        },
      });
    });

    const violations = axeResult.violations.map((v) => ({
      id: v.id,
      impact: v.impact,
      description: v.description,
      helpUrl: v.helpUrl,
      nodes: v.nodes.length,
      targets: v.nodes.map((n) => n.target.join(" ")).slice(0, 3),
      snippet: v.nodes[0]?.html,
    }));

    fullReport.summary.totalScans++;
    fullReport.summary.totalViolations += violations.length;
    if (violations.length === 0) fullReport.summary.passes++;

    fullReport.routesScanned.push({
      route: r.path,
      routeName: r.name,
      viewport: vp.name,
      url: targetUrl,
      headingRendered: heading,
      hasMainContent: hasContent > 0,
      violationsCount: violations.length,
      violations,
    });

    console.log(`[${vp.name}] #${r.path} ("${heading?.trim()}") -> ${violations.length} violations`);
    if (violations.length > 0) {
      console.log(JSON.stringify(violations, null, 2));
    }
  }

  // Scan modal dialog state in both desktop and mobile
  await page.goto("http://127.0.0.1:4175/#innings?format=ODI");
  await page.waitForTimeout(500);
  const rowBtn = page.locator(".archive-table tbody tr button.score-button").first();
  if (await rowBtn.count()) {
    await rowBtn.click();
    await page.waitForTimeout(300);
    const dialogVisible = await page.locator("dialog.innings-dialog[open]").count();
    if (dialogVisible > 0) {
      await page.evaluate(axeSource);
      const dialogAxe = await page.evaluate(async () => {
        return await window.axe.run("dialog.innings-dialog", {
          runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"] },
        });
      });
      const dViolations = dialogAxe.violations.map((v) => ({
        id: v.id,
        impact: v.impact,
        description: v.description,
        nodes: v.nodes.length,
      }));
      fullReport.modalStates.push({
        modal: "InningsDialog",
        viewport: vp.name,
        violationsCount: dViolations.length,
        violations: dViolations,
      });
      console.log(`[${vp.name}] Modal: InningsDialog -> ${dViolations.length} violations`);
    }
  }

  await page.close();
}

await browser.close();
await server.close();

await fs.writeFile(path.join(previewDir, "axe-report.json"), JSON.stringify(fullReport, null, 2));
console.log(`\nFull axe report written to preview/axe-report.json (${fullReport.summary.passes}/${fullReport.summary.totalScans} clean scans).`);
