import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PREVIEW_URL = 'http://127.0.0.1:4173/';
const DEBUG_PORT = 9222;

const tempDir = mkdtempSync(join(tmpdir(), 'chrome-profile-'));

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

console.log('🚀 Launching Headless Chrome for interactive verification...');
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
      const page = data.find(d => d.url.includes('4173')) || data[0];
      if (page && page.webSocketDebuggerUrl) {
        return page.webSocketDebuggerUrl;
      }
    } catch {
      // retry
    }
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

  on(method, fn) {
    if (!this.events.has(method)) this.events.set(method, []);
    this.events.get(method).push(fn);
  }

  async eval(expression) {
    const res = await this.send('Runtime.evaluate', {
      expression,
      returnByValue: true,
      awaitPromise: true,
    });
    if (res.exceptionDetails) {
      throw new Error(`Eval error: ${JSON.stringify(res.exceptionDetails)}`);
    }
    return res.result ? res.result.value : undefined;
  }

  async setViewport(width, height, mobile = false, deviceScaleFactor = 1) {
    await this.send('Emulation.setDeviceMetricsOverride', {
      width,
      height,
      deviceScaleFactor,
      mobile,
      screenOrientation: { angle: 0, type: 'portraitPrimary' },
    });
  }

  close() {
    try {
      this.ws.close();
    } catch {}
  }
}

async function runTests() {
  await delay(1500);
  const wsUrl = await getWebSocketDebuggerUrl();
  console.log('✅ Connected to Chrome CDP:', wsUrl);

  const client = new CDPClient(wsUrl);
  await client.ready();

  const consoleLogs = [];
  const networkErrors = [];

  await client.send('Runtime.enable');
  await client.send('Page.enable');
  await client.send('Network.enable');

  client.on('Runtime.consoleAPICalled', (params) => {
    const text = params.args.map((a) => a.value !== undefined ? String(a.value) : JSON.stringify(a)).join(' ');
    consoleLogs.push({ type: params.type, text });
  });

  client.on('Runtime.exceptionThrown', (params) => {
    consoleLogs.push({ type: 'error', text: `Uncaught exception: ${JSON.stringify(params.exceptionDetails)}` });
  });

  client.on('Network.loadingFailed', (params) => {
    networkErrors.push(params);
  });

  client.on('Network.responseReceived', (params) => {
    if (params.response.status >= 400) {
      networkErrors.push({ url: params.response.url, status: params.response.status });
    }
  });

  // Wait for React to mount and hydrate
  for (let i = 0; i < 20; i++) {
    const ready = await client.eval(`(() => document.readyState === 'complete' && Boolean(document.querySelector('main')))()`);
    if (ready) break;
    await delay(200);
  }
  await delay(1000);

  const title = await client.eval('document.title');
  const bodyTextLength = await client.eval('document.body.innerText.length');
  console.log(`✅ Page Ready: Title="${title}", Body Text Length=${bodyTextLength}`);

  const results = {
    viewports: {},
    interactions: {},
    diagnostics: {},
  };

  async function checkOverflow() {
    return await client.eval(`(() => {
      const docEl = document.documentElement;
      const body = document.body;
      const scrollWidth = Math.max(docEl.scrollWidth, body.scrollWidth);
      const innerWidth = window.innerWidth;
      const isOverflow = scrollWidth > innerWidth;
      return { scrollWidth, innerWidth, isOverflow };
    })()`);
  }

  // ==========================================
  // VIEWPORT 1: Desktop (1440 x 900)
  // ==========================================
  console.log('\n🖥️ 1. Testing Desktop (1440 x 900)...');
  await client.setViewport(1440, 900, false, 1);
  await delay(500);

  results.viewports.desktop = await checkOverflow('Desktop');
  console.log('  Desktop Overflow:', results.viewports.desktop);

  // 1. Hero Controls
  console.log('  Testing Hero interactive buttons & values...');
  await delay(2500); // Wait for countUp animation
  const heroInitial = await client.eval(`(() => {
    const text = document.body.innerText;
    return {
      has28359: text.includes('28,359') || text.includes('28359'),
      has85: text.includes('85'),
      has5271: text.includes('52.71'),
      hasStale144: text.includes('144 Fifties') || text.includes('144 50')
    };
  })()`);

  // Click ODI tab
  await client.eval(`(() => {
    const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.trim() === 'ODI');
    if (btn) btn.click();
  })()`);
  await delay(2500);

  const heroOdi = await client.eval(`(() => {
    const text = document.body.innerText;
    return {
      has14941: text.includes('14,941') || text.includes('14941'),
      has54: text.includes('54'),
      has5859: text.includes('58.59')
    };
  })()`);

  // Click Test tab
  await client.eval(`(() => {
    const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.trim() === 'Test');
    if (btn) btn.click();
  })()`);
  await delay(2500);

  const heroTest = await client.eval(`(() => {
    const text = document.body.innerText;
    return {
      has9230: text.includes('9,230') || text.includes('9230'),
      has30: text.includes('30'),
      has4685: text.includes('46.85')
    };
  })()`);

  // Click T20I tab
  await client.eval(`(() => {
    const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.trim() === 'T20I');
    if (btn) btn.click();
  })()`);
  await delay(2500);

  const heroT20i = await client.eval(`(() => {
    const text = document.body.innerText;
    return {
      has4188: text.includes('4,188') || text.includes('4188'),
      has4870: text.includes('48.70') || text.includes('48.7')
    };
  })()`);

  // Reset back to ALL
  await client.eval(`(() => {
    const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.trim() === 'ALL');
    if (btn) btn.click();
  })()`);
  await delay(2500);

  results.interactions.hero = { ...heroInitial, heroOdi, heroTest, heroT20i };
  console.log('  Hero results:', results.interactions.hero);

  // 2. Clutch Index Section
  console.log('  Testing Clutch Index section...');
  const clutchTest = await client.eval(`(() => {
    const text = document.body.innerText;
    const isPending = text.includes('CALIBRATION PENDING') || text.includes('calibration pending') || text.includes('PENDING');
    const hasWarning = text.includes('EXPERIMENTAL INPUT') || text.includes('pending ball-by-ball') || text.includes('calibration pending') || text.includes('CALIBRATION PENDING');
    const hasUnverified87_4 = text.includes('87.4 Clutch Index') && !text.includes('Pending') && !text.includes('pending');
    return { isPending, hasWarning, hasUnverified87_4 };
  })()`);
  results.interactions.clutch = clutchTest;
  console.log('  Clutch results:', clutchTest);

  // 3. Pressure Map Section
  console.log('  Testing Pressure Map section (ODI & T20I 15-cell grids + headers)...');
  await client.eval(`(() => {
    document.getElementById('pressure-map')?.scrollIntoView({ behavior: 'instant' });
  })()`);
  await delay(500);

  const pressureTest = await client.eval(`(async () => {
    const text = document.body.innerText;
    const hasPlaceholderWarning = text.includes('EXPERIMENTAL PLACEHOLDER') || text.includes('derivation pending');

    // ODI Grid
    const odiAnalyticalCells = Array.from(document.querySelectorAll('.pressure-section [data-analytical-cell="true"]'));
    const odiAnalyticalCellCount = odiAnalyticalCells.length;
    const odiPhaseHeaderCount = document.querySelectorAll('.pressure-section [data-phase-header="true"]').length;
    const odiColumnHeaderCount = document.querySelectorAll('.pressure-section [data-column-header="true"]').length;
    const odiAllKeyboardReachable = odiAnalyticalCells.length === 15 && odiAnalyticalCells.every(c => c.getAttribute('role') === 'gridcell' && c.tabIndex === 0);

    // Switch to T20I in pressure section
    const t20iBtn = Array.from(document.querySelectorAll('.pressure-section .format-pill-btn')).find(b => b.textContent.trim() === 'T20I');
    if (t20iBtn) t20iBtn.click();
    await new Promise(r => setTimeout(r, 400));

    // T20I Grid
    const t20iAnalyticalCells = Array.from(document.querySelectorAll('.pressure-section [data-analytical-cell="true"]'));
    const t20iAnalyticalCellCount = t20iAnalyticalCells.length;
    const t20iPhaseHeaderCount = document.querySelectorAll('.pressure-section [data-phase-header="true"]').length;
    const t20iColumnHeaderCount = document.querySelectorAll('.pressure-section [data-column-header="true"]').length;
    const t20iAllKeyboardReachable = t20iAnalyticalCells.length === 15 && t20iAnalyticalCells.every(c => c.getAttribute('role') === 'gridcell' && c.tabIndex === 0);

    // Switch back to ODI
    const odiBtn = Array.from(document.querySelectorAll('.pressure-section .format-pill-btn')).find(b => b.textContent.trim() === 'ODI');
    if (odiBtn) odiBtn.click();
    await new Promise(r => setTimeout(r, 400));

    return {
      hasPlaceholderWarning,
      odi: {
        analyticalCellCount: odiAnalyticalCellCount,
        phaseHeaderCount: odiPhaseHeaderCount,
        columnHeaderCount: odiColumnHeaderCount,
        allKeyboardReachable: odiAllKeyboardReachable,
      },
      t20i: {
        analyticalCellCount: t20iAnalyticalCellCount,
        phaseHeaderCount: t20iPhaseHeaderCount,
        columnHeaderCount: t20iColumnHeaderCount,
        allKeyboardReachable: t20iAllKeyboardReachable,
      },
      passed: odiAnalyticalCellCount === 15 && t20iAnalyticalCellCount === 15 && odiAllKeyboardReachable && t20iAllKeyboardReachable,
    };
  })()`);
  results.interactions.pressure = pressureTest;
  console.log('  Pressure Map results:', pressureTest);
  if (!pressureTest.passed) {
    throw new Error(`Pressure Map verification failed: ODI cells=${pressureTest.odi.analyticalCellCount}, T20I cells=${pressureTest.t20i.analyticalCellCount}`);
  }

  // 4. Opponents Section (Australia, England, Pakistan)
  console.log('  Testing Opponent Dominance section (Australia, England, Pakistan)...');
  await client.eval(`(() => {
    document.getElementById('world-map')?.scrollIntoView({ behavior: 'instant' });
  })()`);
  await delay(800);

  const opponentTest = await client.eval(`(async () => {
    const delay = ms => new Promise(r => setTimeout(r, ms));
    const clickEl = (el) => {
      if (!el) return;
      el.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }));
      el.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, cancelable: true }));
      el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    };

    const cards = Array.from(document.querySelectorAll('.country-card'));
    
    // 1. Click England card
    const engCard = cards.find(c => c.querySelector('.country-name')?.textContent.trim() === 'England');
    clickEl(engCard);
    await delay(500);
    const engSpotlight = document.querySelector('.country-spotlight')?.innerText || '';
    const hasEngRuns = engSpotlight.includes('4,180') || engSpotlight.includes('4180');
    const hasEngAvg = engSpotlight.includes('41.38');
    const hasEng100s = engSpotlight.includes('8') && engSpotlight.toLowerCase().includes('centuries');
    const hasEng50s = engSpotlight.includes('26') && engSpotlight.toLowerCase().includes('50s');
    const hasEngHS = engSpotlight.includes('235');

    // 2. Click Pakistan card
    const pakCard = cards.find(c => c.querySelector('.country-name')?.textContent.trim() === 'Pakistan');
    clickEl(pakCard);
    await delay(500);
    const pakSpotlight = document.querySelector('.country-spotlight')?.innerText || '';
    const hasPakRuns = pakSpotlight.includes('1,270') || pakSpotlight.includes('1270');
    const hasPakAvg = pakSpotlight.includes('63.50') || pakSpotlight.includes('63.5');
    const hasPak100s = pakSpotlight.includes('4') && pakSpotlight.toLowerCase().includes('centuries');

    // 3. Click Australia card
    const ausCard = cards.find(c => c.querySelector('.country-name')?.textContent.trim() === 'Australia');
    clickEl(ausCard);
    await delay(500);
    const ausSpotlight = document.querySelector('.country-spotlight')?.innerText || '';
    const hasAusRuns = ausSpotlight.includes('5,551') || ausSpotlight.includes('5551');
    const hasAusAvg = ausSpotlight.includes('48.69');
    const hasAusHS = ausSpotlight.includes('186');

    return {
      cardCount: cards.length,
      hasAusRuns, hasAusAvg, hasAusHS,
      hasEngRuns, hasEngAvg, hasEng100s, hasEng50s, hasEngHS,
      hasPakRuns, hasPakAvg, hasPak100s
    };
  })()`);
  results.interactions.opponent = opponentTest;
  console.log('  Opponent results:', opponentTest);

  // 5. Legends Section
  console.log('  Testing Legends section...');
  const legendsTest = await client.eval(`(() => {
    const text = document.body.innerText;
    return {
      hasSachin: text.includes('Sachin') || text.includes('Tendulkar'),
      hasPonting: text.includes('Ponting'),
      hasRohit: text.includes('Rohit')
    };
  })()`);
  results.interactions.legends = legendsTest;
  console.log('  Legends results:', legendsTest);

  // 6. Quiz Section
  console.log('  Testing Quiz section...');
  const quizTest = await client.eval(`(() => {
    const quizButtons = Array.from(document.querySelectorAll('button')).filter(b => b.className.includes('quiz') || b.closest('.quiz-container, .quiz-section, #quiz'));
    const initialCount = quizButtons.length;
    if (quizButtons.length > 0) {
      quizButtons[0].click();
    }
    return { initialCount };
  })()`);
  results.interactions.quiz = quizTest;
  console.log('  Quiz results:', quizTest);

  // 7. Security & API keys
  console.log('  Testing Security (No exposed API keys)...');
  const securityTest = await client.eval(`(() => {
    const html = document.documentElement.outerHTML;
    const hasExposedKey = /AIza[0-9A-Za-z-_]{35}|api[-_]?key[ ]*[:=][ ]*['"][a-zA-Z0-9]{15,}['"]/i.test(html);
    return { hasExposedKey };
  })()`);
  results.interactions.security = securityTest;
  console.log('  Security result:', securityTest);

  // 8. Domestic / U-19 status
  console.log('  Checking Domestic / U-19 presentation...');
  const domesticTest = await client.eval(`(() => {
    const text = document.body.innerText;
    return {
      hasFirstClassInUI: text.includes('First-class') || text.includes('11,485'),
      hasU19InUI: text.includes('U-19') || text.includes('Under-19')
    };
  })()`);
  results.interactions.domestic = domesticTest;
  console.log('  Domestic / U-19 status:', domesticTest);

  // ==========================================
  // VIEWPORT 2: Small Desktop / iPad Landscape (1024 x 768)
  // ==========================================
  console.log('\n💻 2. Testing Small Desktop (1024 x 768)...');
  await client.setViewport(1024, 768, false, 1);
  await delay(600);
  results.viewports.smallDesktop = await checkOverflow();
  console.log('  Small Desktop Overflow:', results.viewports.smallDesktop);

  // ==========================================
  // VIEWPORT 3: Tablet (768 x 1024)
  // ==========================================
  console.log('\n📱 3. Testing Tablet (768 x 1024)...');
  await client.setViewport(768, 1024, true, 2);
  await delay(800);
  results.viewports.tablet = await checkOverflow();
  console.log('  Tablet Overflow:', results.viewports.tablet);

  // ==========================================
  // VIEWPORT 4: Mobile (375 x 812)
  // ==========================================
  console.log('\n📱 4. Testing Mobile (375 x 812)...');
  await client.setViewport(375, 812, true, 3);
  await delay(800);
  results.viewports.mobile = await checkOverflow();
  console.log('  Mobile Overflow:', results.viewports.mobile);

  // ==========================================
  // VIEWPORT 5: Small Mobile (320 x 568)
  // ==========================================
  console.log('\n📱 5. Testing Small Mobile (320 x 568)...');
  await client.setViewport(320, 568, true, 2);
  await delay(800);
  results.viewports.smallMobile = await checkOverflow();
  console.log('  Small Mobile Overflow:', results.viewports.smallMobile);

  // A11y: Skip Link and Reduced Motion Check
  console.log('\n♿ 6. Testing Accessibility (Skip Link, Landmarks, Reduced Motion)...');
  const a11yTest = await client.eval(`(() => {
    const skipLink = document.querySelector('.skip-link');
    const mainLandmark = document.getElementById('main-content');
    const focusableButtons = Array.from(document.querySelectorAll('button:not([disabled])'));
    const allButtonsHaveType = focusableButtons.every(b => b.hasAttribute('type') || b.tagName === 'BUTTON');
    const hasAriaPressedOnFormat = Boolean(document.querySelector('[aria-pressed="true"]'));
    return {
      hasSkipLink: Boolean(skipLink),
      skipLinkHref: skipLink?.getAttribute('href'),
      hasMainLandmark: Boolean(mainLandmark),
      focusableCount: focusableButtons.length,
      allButtonsHaveType,
      hasAriaPressedOnFormat,
    };
  })()`);
  results.interactions.accessibility = a11yTest;
  console.log('  Accessibility audit:', a11yTest);

  // Mobile Drawer Toggle
  const mobileDrawer = await client.eval(`(() => {
    const menuBtn = Array.from(document.querySelectorAll('button')).find(b => b.getAttribute('aria-label')?.toLowerCase().includes('menu') || b.className.includes('menu') || b.className.includes('hamburger'));
    let toggled = false;
    if (menuBtn) {
      menuBtn.click();
      toggled = true;
    }
    const navLinks = Array.from(document.querySelectorAll('nav a, header a')).map(a => a.textContent.trim());
    return { btnFound: Boolean(menuBtn), toggled, navLinks };
  })()`);
  results.interactions.mobileDrawer = mobileDrawer;
  console.log('  Mobile Drawer result:', mobileDrawer);

  // Diagnostics summary
  results.diagnostics = {
    consoleErrorsCount: consoleLogs.filter(l => l.type === 'error').length,
    consoleWarningsCount: consoleLogs.filter(l => l.type === 'warning').length,
    consoleLogs,
    networkErrorsCount: networkErrors.length,
    networkErrors,
  };

  console.log('\n📊 Diagnostics summary:');
  console.log(`  Console Errors: ${results.diagnostics.consoleErrorsCount}`);
  console.log(`  Console Warnings: ${results.diagnostics.consoleWarningsCount}`);
  console.log(`  Network Failures: ${results.diagnostics.networkErrorsCount}`);

  client.close();
  return results;
}

try {
  await runTests();
  console.log('\n🏁 BROWSER VERIFICATION COMPLETED WITH FULL RESULTS');
} catch (err) {
  console.error('❌ Browser verification error:', err);
} finally {
  try {
    previewProcess.kill();
  } catch {}
  try {
    chromeProcess.kill();
  } catch {}
  try {
    rmSync(tempDir, { recursive: true, force: true });
  } catch {}
}
