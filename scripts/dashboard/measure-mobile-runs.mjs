import { preview } from "vite";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const exec = promisify(execFile);
const root = fileURLToPath(new URL("../../", import.meta.url));
const previewDir = path.join(root, "preview");
await fs.mkdir(previewDir, { recursive: true });

// Start preview server
const previewServer = await preview({
  root,
  preview: { port: 4174, host: "127.0.0.1", strictPort: true },
});
console.log("Preview server listening on http://127.0.0.1:4174");

async function runMobileAudit(runNumber) {
  const outputPath = `preview/local-mobile-run${runNumber}.json`;
  const chromePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
  const args = [
    "lighthouse",
    "http://127.0.0.1:4174",
    "--output=json",
    `--output-path=${outputPath}`,
    `--chrome-flags="--headless=new --no-sandbox"`,
    "--form-factor=mobile",
    "--quiet",
    "--only-categories=performance,accessibility,best-practices,seo",
  ];

  console.log(`Running Mobile Lighthouse run ${runNumber}/3...`);
  await exec("npx.cmd", args, {
    shell: true,
    env: { ...process.env, CHROME_PATH: chromePath },
    timeout: 120000,
  });

  const data = JSON.parse(await fs.readFile(path.join(root, outputPath), "utf8"));
  const cats = data.categories;
  const a = data.audits;
  return {
    run: runNumber,
    performance: Math.round(cats.performance.score * 100),
    accessibility: Math.round(cats.accessibility.score * 100),
    bestPractices: Math.round(cats["best-practices"].score * 100),
    seo: Math.round(cats.seo.score * 100),
    fcpValue: a["first-contentful-paint"]?.numericValue,
    fcpDisplay: a["first-contentful-paint"]?.displayValue,
    lcpValue: a["largest-contentful-paint"]?.numericValue,
    lcpDisplay: a["largest-contentful-paint"]?.displayValue,
    tbtValue: a["total-blocking-time"]?.numericValue,
    tbtDisplay: a["total-blocking-time"]?.displayValue,
    clsValue: a["cumulative-layout-shift"]?.numericValue,
    clsDisplay: a["cumulative-layout-shift"]?.displayValue,
    siValue: a["speed-index"]?.numericValue,
    siDisplay: a["speed-index"]?.displayValue,
  };
}

try {
  const runs = [];
  for (let i = 1; i <= 3; i++) {
    const res = await runMobileAudit(i);
    runs.push(res);
    console.log(`Run ${i}: Perf=${res.performance}, A11y=${res.accessibility}, TBT=${res.tbtDisplay}, CLS=${res.clsDisplay}, LCP=${res.lcpDisplay}`);
  }

  function median(arr, key) {
    const sorted = [...arr].map((r) => r[key]).sort((a, b) => a - b);
    return sorted[Math.floor(sorted.length / 2)];
  }

  const medianResult = {
    performance: median(runs, "performance"),
    accessibility: median(runs, "accessibility"),
    bestPractices: median(runs, "bestPractices"),
    seo: median(runs, "seo"),
    tbtDisplay: `${Math.round(median(runs, "tbtValue"))} ms`,
    clsDisplay: `${Math.round(median(runs, "clsValue") * 1000) / 1000}`,
    lcpDisplay: `${Math.round(median(runs, "lcpValue") / 100) / 10} s`,
    fcpDisplay: `${Math.round(median(runs, "fcpValue") / 100) / 10} s`,
    siDisplay: `${Math.round(median(runs, "siValue") / 100) / 10} s`,
  };

  const output = {
    timestamp: new Date().toISOString(),
    runs,
    median: medianResult,
  };

  await fs.writeFile(path.join(previewDir, "mobile-3runs-summary.json"), JSON.stringify(output, null, 2));
  console.log("\nMedian of 3 Runs Summary:\n", JSON.stringify(output, null, 2));
} finally {
  await previewServer.close();
  console.log("Preview server closed.");
}
