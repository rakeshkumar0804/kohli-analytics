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

// Start local preview server on 4174
const previewServer = await preview({
  root,
  preview: { port: 4174, host: "127.0.0.1", strictPort: true },
});

console.log("Vite preview server listening on http://127.0.0.1:4174");

async function runLighthouse(url, name, isDesktop = false) {
  const outputPath = path.join(previewDir, `${name}.json`);
  const chromePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
  const args = [
    "lighthouse",
    url,
    "--output=json",
    `--output-path=preview/${name}.json`,
    `--chrome-flags="--headless=new --no-sandbox"`,
    isDesktop ? "--preset=desktop" : "--form-factor=mobile",
    "--quiet",
    "--only-categories=performance,accessibility,best-practices,seo",
  ];

  console.log(`Running Lighthouse for ${name} (${url})...`);
  try {
    // On windows npx is npx.cmd
    await exec("npx.cmd", args, {
      shell: true,
      env: { ...process.env, CHROME_PATH: chromePath },
      timeout: 120000,
    });
    const data = JSON.parse(await fs.readFile(outputPath, "utf8"));
    const cats = data.categories;
    const audits = data.audits;
    return {
      name,
      url,
      scores: {
        performance: Math.round((cats.performance?.score || 0) * 100),
        accessibility: Math.round((cats.accessibility?.score || 0) * 100),
        bestPractices: Math.round((cats["best-practices"]?.score || 0) * 100),
        seo: Math.round((cats.seo?.score || 0) * 100),
      },
      metrics: {
        fcp: audits["first-contentful-paint"]?.displayValue,
        lcp: audits["largest-contentful-paint"]?.displayValue,
        tbt: audits["total-blocking-time"]?.displayValue,
        cls: audits["cumulative-layout-shift"]?.displayValue,
        si: audits["speed-index"]?.displayValue,
      },
    };
  } catch (err) {
    console.error(`Error running lighthouse for ${name}:`, err.message);
    return null;
  }
}

try {
  // 1. Local preview mobile
  const localMobile = await runLighthouse("http://127.0.0.1:4174", "local-mobile", false);
  // 2. Local preview desktop
  const localDesktop = await runLighthouse("http://127.0.0.1:4174", "local-desktop", true);
  // 3. Remote production mobile
  const remoteMobile = await runLighthouse("https://kohli-analytics.vercel.app", "remote-mobile", false);
  // 4. Remote production desktop
  const remoteDesktop = await runLighthouse("https://kohli-analytics.vercel.app", "remote-desktop", true);

  const results = {
    timestamp: new Date().toISOString(),
    environment: {
      os: process.platform,
      node: process.version,
      chrome: "Google Chrome 144+ / Windows x64",
    },
    localMobile,
    localDesktop,
    remoteMobile,
    remoteDesktop,
  };

  await fs.writeFile(path.join(previewDir, "lighthouse-summary.json"), JSON.stringify(results, null, 2));
  console.log("\nLighthouse Run Results Summary:\n", JSON.stringify(results, null, 2));
} finally {
  await previewServer.close();
  console.log("Vite preview server closed.");
}
