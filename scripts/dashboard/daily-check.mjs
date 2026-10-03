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
  for (const year of ['1983','1996','1999','2015']) {
    await page.getByRole('button', { name: year, exact: true }).click();
    check(await page.locator('.chapter-moments article').count() === 3, year + ' has three in-app turning points');
  }
  await page.getByRole('button', {name: 'Play daily challenge', exact: true}).click();
  const initial = JSON.parse(await page.evaluate(() => localStorage.getItem('cricket-gauntlet-v1')));
  check(initial.deck.length === 8 && !!initial.daily, 'daily mode stores its date and eight questions');
  for(let i=0;i<8;i++) {
    const prompt = await page.locator('.gauntlet-play h3').innerText();
    const q = bank.find(q => q.prompt === prompt);
    await page.locator('.gauntlet-options button').filter({hasText:q.options[q.answer]}).click();
    if(i===0) {
      await page.reload();
      await page.locator('.gauntlet-play').waitFor();
      check(await page.locator('.gauntlet-options button:disabled').count() === 4, 'daily reload preserves answer lock');
      await page.getByRole('button',{name:'End round',exact:true}).click();
      await page.getByRole('button',{name:'Resume daily challenge',exact:true}).click();
      check(await page.locator('.gauntlet-options button:disabled').count() === 4, 'daily can resume from lobby');
    }
    await page.getByRole('button',{name:i===7?'Reveal result':'Next question',exact:true}).click();
  }
  await page.locator('.winner-arena[open]').waitFor();
  check((await page.locator('.winner-medal').innerText()).includes('8'), 'daily perfection earns celebration');
  await page.keyboard.press('Escape');
  await page.getByRole('button',{name:'New challenge',exact:true}).click();
  await page.getByRole('button',{name:'Review today’s result',exact:true}).click();
  check(await page.locator('.gauntlet-result').count() === 1, 'completed daily opens result instead of replay');
  await page.getByRole('button',{name:'New challenge',exact:true}).click();
  check((await page.locator('.quiz-discovery-progress').innerText()).includes('8 / 64'), 'answered questions count towards exploration');
  await page.getByRole('button',{name:'Enter the gauntlet',exact:true}).click();
  const practice = JSON.parse(await page.evaluate(() => localStorage.getItem('cricket-gauntlet-v1')));
  check(practice.deck.every(d=> !initial.deck.some(x=>x.id===d.id)), 'practice offers unseen questions after daily');
  await page.getByRole('button',{name:'End round',exact:true}).click();
  await page.evaluate(() => localStorage.setItem('cricket-daily-v1', JSON.stringify({...JSON.parse(localStorage.getItem('cricket-daily-v1')), daily:'2020-01-01'})));
  await page.reload();
  await page.getByRole('button',{name:'Play daily challenge',exact:true}).click();
  const fresh = JSON.parse(await page.evaluate(() => localStorage.getItem('cricket-gauntlet-v1')));
  check(JSON.stringify(initial.deck) === JSON.stringify(fresh.deck), 'same UTC date recreates identical question and answer order');
  check(Object.keys(fresh.answers).length === 0, 'expired daily save does not leak previous answers');
  await page.getByRole('button',{name:'End round',exact:true}).click();
  await go('compare?format=T20I&players=sachin,kohli&focusA=sachin&focusB=kohli','.comparison-scatter');
  await page.locator('.comparison-provenance summary').click();
  check(await page.locator('.comparison-provenance article a').count() === 2,'each player has a direct source');
  check((await page.locator('.scatter-legend').innerText()).includes('small sample'),'one-innings sample is clearly flagged');
  await page.getByRole('button',{name:'Show axes from zero',exact:true}).click();
  check(await page.getByRole('button',{name:'Focus on selected players',exact:true}).getAttribute('aria-pressed') === 'true','chart scale toggle responds');
  for(const width of [1440,390,320]) {
    await page.setViewportSize({width,height:1000});
    await noOverflow(width+'px expanded comparison metadata');
    await page.screenshot({path:output+'/sources-'+width+'.png',fullPage:true});
  }
  await page.addInitScript(() => {
    Storage.prototype.setItem = function() { throw new DOMException('Storage unavailable', 'QuotaExceededError'); };
    Storage.prototype.getItem = function() { throw new DOMException('Storage unavailable', 'SecurityError'); };
  });
  await go('club','.cricket-quiz');
  await page.reload();
  await page.locator('.cricket-quiz').waitFor();
  await page.getByRole('button',{name:'Play daily challenge',exact:true}).click();
  await page.locator('.gauntlet-options button').first().click();
  await page.getByRole('button',{name:'End round',exact:true}).click();
  await page.getByRole('button',{name:'Resume daily challenge',exact:true}).click();
  check(await page.locator('.gauntlet-options button:disabled').count()===4,'blocked storage retains daily progress in memory');
  check(errors.length===0,'no daily challenge runtime errors');
  console.log(JSON.stringify({checks,errors,output}));
} finally { await browser.close(); await server.close(); }
