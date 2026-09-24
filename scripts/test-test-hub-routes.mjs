import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PREVIEW_URL = 'http://127.0.0.1:4173/';
const DEBUG_PORT = 9223;

const tempDir = mkdtempSync(join(tmpdir(), 'chrome-test-hub-'));

async function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

console.log('🚀 Starting Vite preview server...');
const viteBin = join(process.cwd(), 'node_modules', 'vite', 'bin', 'vite.js');
const previewProcess = spawn(process.execPath, [viteBin, 'preview', '--port', '4173', '--host', '127.0.0.1'], {
  stdio: 'ignore',
});

// Wait for preview server to be available
for (let i = 0; i < 30; i++) {
  try {
    const res = await fetch(PREVIEW_URL);
    if (res.ok) break;
  } catch {}
  await delay(200);
}

console.log('🚀 Launching Headless Chrome to verify Test Hub routes...');
const chromeProcess = spawn(CHROME_PATH, [
  `--remote-debugging-port=${DEBUG_PORT}`,
  `--user-data-dir=${tempDir}`,
  '--headless=new',
  '--disable-gpu',
  '--no-first-run',
  '--no-default-browser-check',
  PREVIEW_URL,
], { stdio: 'ignore' });

async function getWebSocketDebuggerUrl() {
  for (let i = 0; i < 30; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${DEBUG_PORT}/json/list`);
      const data = await res.json();
      const page = data.find(d => d.type === 'page' && d.url.includes('4173')) || data.find(d => d.type === 'page');
      if (page && page.webSocketDebuggerUrl) {
        return page.webSocketDebuggerUrl;
      }
    } catch {}
    await delay(300);
  }
  throw new Error('Failed to connect to Chrome DevTools Protocol');
}

class CDPClient {
  constructor(wsUrl) {
    this.ws = new WebSocket(wsUrl);
    this.id = 1;
    this.callbacks = new Map();
    this.events = new Map();

    this.ws.onmessage = (evt) => {
      const msg = JSON.parse(evt.data);
      if (msg.id && this.callbacks.has(msg.id)) {
        const { resolve, reject } = this.callbacks.get(msg.id);
        this.callbacks.delete(msg.id);
        if (msg.error) {
          reject(new Error(msg.error.message || JSON.stringify(msg.error)));
        } else {
          resolve(msg.result);
        }
      } else if (msg.method) {
        const listeners = this.events.get(msg.method) || [];
        for (const fn of listeners) fn(msg.params);
      }
    };
  }

  async ready() {
    if (this.ws.readyState === WebSocket.OPEN) return;
    return new Promise((resolve, reject) => {
      this.ws.onopen = () => resolve();
      this.ws.onerror = (err) => reject(err);
    });
  }

  send(method, params = {}) {
    const id = this.id++;
    return new Promise((resolve, reject) => {
      this.callbacks.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  async eval(expression) {
    const res = await this.send('Runtime.evaluate', {
      expression,
      returnByValue: true,
      awaitPromise: true,
    });
    return res.result ? res.result.value : undefined;
  }
}

async function run() {
  try {
    const wsUrl = await getWebSocketDebuggerUrl();
    const cdp = new CDPClient(wsUrl);
    await cdp.ready();
    await cdp.send('Runtime.enable');
    await cdp.send('Page.enable');

    // Wait for page to load
    await delay(3000);
    const pageInfo = await cdp.eval(`({ url: window.location.href, title: document.title, bodyLength: document.body.innerHTML.length })`);
    console.log('Page loaded info:', pageInfo);

    console.log('--- Step 1: Switch Clutch section to Test format ---');
    const switchTestResult = await cdp.eval(`(() => {
      const buttons = Array.from(document.querySelectorAll('#clutch-index .format-pill-btn'));
      const testBtn = buttons.find(b => b.textContent.trim() === 'Test');
      if (!testBtn) return { error: 'Test button not found in format toggle', found: buttons.map(b => b.textContent.trim()) };
      testBtn.click();
      return { success: true };
    })()`);
    console.log('Switch to Test format:', switchTestResult);
    await delay(500);

    console.log('--- Step 2: Click Test Hub Card: Defining Test Innings ---');
    const clickDefiningResult = await cdp.eval(`(() => {
      const links = Array.from(document.querySelectorAll('#clutch-index .test-routes-grid a'));
      const definingLink = links.find(a => a.getAttribute('href') === '#defining-innings');
      if (!definingLink) return { error: 'Defining Innings link not found', found: links.map(l => l.getAttribute('href')) };
      definingLink.click();
      return { success: true };
    })()`);
    console.log('Click Defining Innings link:', clickDefiningResult);
    await delay(1000);

    const definingState = await cdp.eval(`(() => {
      const activeTab = document.querySelector('.defining-filter-btn.active');
      const cards = Array.from(document.querySelectorAll('.defining-card .format-pill')).map(p => p.textContent.trim());
      const section = document.getElementById('defining-innings');
      const rect = section.getBoundingClientRect();
      return {
        activeTab: activeTab ? activeTab.textContent.trim() : null,
        visibleCardsFormat: cards,
        sectionVisible: rect.top < window.innerHeight && rect.bottom > 0,
        rectTop: rect.top
      };
    })()`);
    console.log('Defining Innings State after click:', definingState);

    console.log('--- Step 3: Switch back to Clutch Test and Click Test Hub Card: Era Engine ---');
    await cdp.eval(`(() => {
      const clutch = document.getElementById('clutch-index');
      if (clutch) clutch.scrollIntoView();
    })()`);
    await delay(500);

    const clickEraResult = await cdp.eval(`(() => {
      const links = Array.from(document.querySelectorAll('#clutch-index .test-routes-grid a'));
      const eraLink = links.find(a => a.getAttribute('href') === '#era-engine');
      if (!eraLink) return { error: 'Era Engine link not found' };
      eraLink.click();
      return { success: true };
    })()`);
    console.log('Click Era Engine link:', clickEraResult);
    await delay(1000);

    const eraState = await cdp.eval(`(() => {
      const activeBtn = document.querySelector('#era-engine .era-metric-tab--active');
      const section = document.getElementById('era-engine');
      const rect = section.getBoundingClientRect();
      return {
        activeMetric: activeBtn ? activeBtn.textContent.trim() : null,
        sectionVisible: rect.top < window.innerHeight && rect.bottom > 0,
        rectTop: rect.top
      };
    })()`);
    console.log('Era Engine State after click:', eraState);

    console.log('--- Step 4: Test Hub Card: Captaincy Legacy ---');
    await cdp.eval(`(() => {
      const clutch = document.getElementById('clutch-index');
      if (clutch) clutch.scrollIntoView();
    })()`);
    await delay(500);

    const clickCaptResult = await cdp.eval(`(() => {
      const links = Array.from(document.querySelectorAll('#clutch-index .test-routes-grid a'));
      const captLink = links.find(a => a.getAttribute('href') === '#captaincy-myth');
      if (!captLink) return { error: 'Captaincy link not found' };
      captLink.click();
      return { success: true };
    })()`);
    console.log('Click Captaincy link:', clickCaptResult);
    await delay(1000);

    const captState = await cdp.eval(`(() => {
      const section = document.getElementById('captaincy-myth');
      const rect = section.getBoundingClientRect();
      const text = section.innerText;
      return {
        hasWinRate: text.includes('58.82%'),
        hasWins: text.includes('40'),
        hasMatches: text.includes('68'),
        sectionVisible: rect.top < window.innerHeight && rect.bottom > 0,
        rectTop: rect.top
      };
    })()`);
    console.log('Captaincy State after click:', captState);

    console.log('--- Step 5: Test Hub Card: Career Milestones ---');
    await cdp.eval(`(() => {
      const clutch = document.getElementById('clutch-index');
      if (clutch) clutch.scrollIntoView();
    })()`);
    await delay(500);

    const clickTimelineResult = await cdp.eval(`(() => {
      const links = Array.from(document.querySelectorAll('#clutch-index .test-routes-grid a'));
      const timeLink = links.find(a => a.getAttribute('href') === '#career-timeline');
      if (!timeLink) return { error: 'Timeline link not found' };
      timeLink.click();
      return { success: true };
    })()`);
    console.log('Click Timeline link:', clickTimelineResult);
    await delay(1000);

    const timeState = await cdp.eval(`(() => {
      const section = document.getElementById('career-timeline');
      const rect = section.getBoundingClientRect();
      return {
        sectionVisible: rect.top < window.innerHeight && rect.bottom > 0,
        rectTop: rect.top
      };
    })()`);
    console.log('Timeline State after click:', timeState);
    console.log('Timeline State after click:', timeState);

  } catch (err) {
    console.error('Error during test:', err);
    process.exitCode = 1;
  } finally {
    try {
      chromeProcess.kill();
      previewProcess.kill();
      rmSync(tempDir, { recursive: true, force: true });
    } catch {}
  }
}

run();
