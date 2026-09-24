# 👑 Virat Kohli — The Analytics Story

> Not just stats. A data-driven story of the greatest batter of his generation — told through original metrics, ball-by-ball situational pressure analysis, and verified multi-format datasets.

[![CI Pipeline](https://github.com/rakeshkumar0804/kohli-analytics/actions/workflows/ci.yml/badge.svg)](https://github.com/rakeshkumar0804/kohli-analytics/actions/workflows/ci.yml)
[![Auto-Sync Stats](https://github.com/rakeshkumar0804/kohli-analytics/actions/workflows/auto-sync-stats.yml/badge.svg)](https://github.com/rakeshkumar0804/kohli-analytics/actions/workflows/auto-sync-stats.yml)
![React](https://img.shields.io/badge/React-19-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue)
![D3.js](https://img.shields.io/badge/D3.js-7-orange)
![GSAP](https://img.shields.io/badge/GSAP-3.15-green)
![Vercel](https://img.shields.io/badge/Deployed-Vercel-black)

**[🌐 Live Interactive Site → https://kohli-analytics.vercel.app](https://kohli-analytics.vercel.app)**

---

## 📸 Screenshots & Interactive Views

| Hero & Format Scope | Test Situational Analysis |
| :---: | :---: |
| <img width="900" alt="Hero Section" src="https://github.com/user-attachments/assets/2ead27fc-38e9-4412-a076-a4be1e684eb1" /> | <img width="900" alt="Captaincy Myth & Test Analysis" src="https://github.com/user-attachments/assets/de291317-5f7b-4f26-98e3-0f7ec7934585" /> |

| Legends Radar Showdown | Pressure Map (15 Situational Cells) |
| :---: | :---: |
| <img width="900" alt="Legends Showdown" src="https://github.com/user-attachments/assets/5bda4dc8-97c2-484f-bd7a-15ad008c28bf" /> | <img width="900" alt="Pressure Map Grid" src="https://github.com/user-attachments/assets/de291317-5f7b-4f26-98e3-0f7ec7934585" /> |

---

## ⚡ What Makes This Different

Most cricket dashboards display static, pre-computed career tables copied from statistics portals. This application **engineers and computes original metrics** directly from ball-by-ball delivery archives and scorecard populations. 

Every view features format-specific switches (**ODI / Test / T20I / All**) that dynamically recompute underlying populations, comparison baselines, and statistical distributions.

| Feature | Engineering & Analytical Highlight |
|---|---|
| **Live Fixture & Countdown** | Serverless proxy integration with CricAPI resolving upcoming bilateral series, GMT-synchronized countdowns, rate limiting, and 15-min in-memory caching. |
| **Pressure Performance Dashboard** | Format-separated situational analysis: 4 high-leverage chase cards for ODI/T20I, and 8 sourced situational splits for Test cricket. |
| **15-Cell Pressure Map** | D3.js situational heatmap (Match Phase × Required Run Rate) across 6,889 ODI and 1,525 T20I chase deliveries with zero-dismissal null handling. |
| **Clutch Index Calibration** | Formal non-linear descriptive model using Bounded Hyperbolic Tangent ($\tanh$) normalization protected by 4 strict statistical trust gates. |
| **Test Performance Hub** | Scorecard-verified situational splits across Home/Away/Neutral venues, 1st vs 2nd innings, 4th innings chases, and match outcomes (123 Tests / 9,230 runs). |
| **Captaincy Myth Buster** | Confronts the narrative with verified Test captaincy win % (58.82%), 42 months at World No. 1, and overseas series records. |
| **Era Engine** | Interactive scrollytelling comparison across 5 distinct career eras (Youth, Rise, Peak, Drought, Renaissance) with dynamic chart morphing. |
| **Chase Master** | Deep analysis of 165 ODI chases ($N=161$ completed results, 88.29 winning chase average) and a horizontal defining chase gallery. |
| **Legends Showdown** | Normalized 6-dimension radar matrix comparing Kohli against Sachin, Ponting, Rohit, Smith, Root, and Williamson. |
| **Global Dominance** | D3-geo SVG world map with country-by-country career records against every Test nation. |

---

## 🏏 Live Fixture Feed Architecture

The application includes a serverless fixture proxy architecture built with zero browser secret exposure:

```
Browser Client (Vite SPA) ──► Serverless Proxy (/api/fixtures) ──► CricAPI Gateway
                                │
                                ├── In-Memory Rate Limiter (30 req/min per IP)
                                ├── Bounded Cache (15-min TTL)
                                ├── Strategy A: Series Schedule Discovery (/v1/series?search=India)
                                ├── Strategy B: Live / Current Matches (/v1/currentMatches)
                                └── Strategy C: Standalone Matches Fallback (/v1/matches)
```

- **Server-Only Credentials**: Provider API keys (`CRICKETDATA_API_KEY`) reside exclusively in server process environments and are never bundled into client JavaScript.
- **Multi-Source Schedule Discovery**: Automatically scans active international series to discover upcoming bilateral fixtures (such as the *India vs West Indies ODI Series*), resolving venues, opponents, and exact GMT timestamps.
- **Honest State Modeling**: Distinguishes `available` (confirmed upcoming fixture with live ticking countdown), `confirmed-empty` (calendar verified with no fixtures scheduled), `missing-credentials` (unconfigured server environment), and `rate-limited` states without throwing misleading UI errors.

---

## 🤖 Automated CI/CD & Data Synchronization

The repository features an automated GitHub Actions pipeline that ensures statistical datasets stay continuously up-to-date without manual intervention:

- **Automated Sync Workflow (`.github/workflows/auto-sync-stats.yml`)**:
  - Runs on a **twice-daily cron** (08:30 IST and 20:30 IST) and supports **1-click manual dispatch**.
  - Automatically fetches fresh open ball-by-ball archives from [Cricsheet](https://cricsheet.org/).
  - Executes the data ingestion and analytics derivation pipeline whenever new matches are published.
  - Runs the full 158-test verification suite and mathematical invariant checks.
  - Automatically commits and pushes verified data to `main`, triggering **instant Vercel redeployment**.

- **Continuous Integration (`.github/workflows/ci.yml`)**:
  - Runs on every push and pull request.
  - Verifies data integrity, runs unit tests, executes independent oracle checks, lints code, and audits production build security.

---

## 📊 Data Provenance & Verified Invariants

### 1. Locked Senior Career Totals (Phase 1 Baseline)
Permanent single source of truth sourced and reconciled with [ESPNcricinfo Statsguru](https://stats.espncricinfo.com/ci/engine/player/253802.html) and [Cricbuzz](https://www.cricbuzz.com/profiles/1413/virat-kohli):

$$\text{Combined Senior International: } 562\text{ matches} \mid 629\text{ innings} \mid 91\text{ not-outs} \mid 28{,}359\text{ runs} \mid 52.71\text{ avg} \mid 85\text{ centuries}$$

- **Test Cricket**: 123 matches · 210 innings · 13 not outs · 9,230 runs · 46.85 avg · 30 centuries (including 7 double centuries)
- **ODI Cricket**: 314 matches · 302 innings · 47 not outs · 14,941 runs · 58.59 avg · 54 centuries · 93.34 strike rate
- **T20I Cricket**: 125 matches · 117 innings · 31 not outs · 4,188 runs · 48.70 avg · 1 century · 137.04 strike rate
- **IPL**: 283 matches · 274 innings · 43 not outs · 9,336 runs · 40.42 avg · 9 centuries · 132.37 strike rate

### 2. Verified Test Situational Splits
Reconciled across all 123 matches and 210 innings:
- **Home / Away / Neutral Invariant**:
  - Home: 54 matches · 89 innings · 4,497 runs · 55.52 avg · 14 100s
  - Away: 67 matches · 117 innings · 4,613 runs · 41.56 avg · 16 100s
  - Neutral: 2 matches · 4 innings · 120 runs · 30.00 avg · 0 100s (2021 & 2023 WTC Finals in England)
  - $\sum = 123\text{ matches} \mid 210\text{ innings} \mid 9{,}230\text{ runs} \mid 13\text{ not-outs}$
- **Innings & Match Results**:
  - 1st Team Innings: 118 innings · 5,618 runs · 50.61 avg
  - 2nd Team Innings: 92 innings · 3,612 runs · 41.99 avg
  - 4th Innings (Chases/Survival): 34 innings · 1,123 runs · 41.59 avg (batted in 34 of India's 38 4th innings)
  - Wins: 61 matches · 97 innings · 5,091 runs · 56.57 avg · 18 100s

---

## 🧮 Custom Metric Methodologies

### 1. Clutch Index Model Specification (`1.0.0-model-spec`)
- **Formula (Policy A Bounded Tanh Normalization)**:
  $$\text{Score} = 50 + 50 \times \tanh\left(\frac{\text{Component Average} - \text{Career Baseline Average}}{\text{Career Baseline Average}}\right)$$
- **Mathematical Anchors**: $0.0\times \to 11.92$, $0.5\times \to 26.89$, $1.0\times \to 50.00$, $1.5\times \to 73.11$, $2.0\times \to 88.08$ on codomain $[11.92, 100)$.
- **Trust Gate (Calibration Pending)**:
  - The public Clutch Index displays `score: null` (`CALIBRATION PENDING`) protected by 4 statistical gates:
    1. *Sample Threshold Gate*: Minimum sample size qualifiers ($N \ge 10$).
    2. *Peer Distribution Gate*: Single-player sample cannot fabricate multi-player percentile rankings.
    3. *Inter-Component Multicollinearity Gate*: Finals are 100% contained within tournament knockouts.
    4. *Uncertainty Bound Gate*: Bootstrap confidence interval spread limits.

### 2. 15-Cell Situational Pressure Matrix
- **5 Required Run Rate (RRR) Bands**: `<6.0` (Comfortable), `6.0–8.0` (Moderate), `8.0–10.0` (High), `10.0–12.0` (Extreme), `>12.0` (Mountain).
- **3 Match Phases**: Powerplay (ODI ov 0–9, T20I ov 0–5), Middle (ODI ov 10–39, T20I ov 6–14), Death (ODI ov 40–49, T20I ov 15–19).
- **Core Findings**: Kohli's ODI Middle/Moderate cell averages **89.4** (his peak golden zone), while maintaining a **52.1** average during Death Overs under mountain pressure ($>10$ RRR).

---

## 🏗️ Repository Architecture

```
virat-kohli-analytics/
├── .github/
│   └── workflows/
│       ├── ci.yml                     # Continuous integration, testing & build gate
│       └── auto-sync-stats.yml        # Scheduled cron for automatic scorecard sync & deployment
├── api/
│   └── fixtures.ts                    # Self-contained Vercel serverless fixture proxy
├── data/
│   ├── manifests/                     # Manifests with SHA-256 archive checksums
│   ├── derived/                       # Derived production artifacts (chase, pressure, coverage)
│   └── overrides/                     # Deterministic ICC tournament stage classification maps
├── scripts/
│   ├── download-cricsheet.mjs         # Open archive downloader with hash validation
│   ├── ingest-cricsheet.mjs           # Match filtering & legal delivery normalizer
│   ├── derive-kohli-analytics.mjs     # 15-cell pressure grids & chase analytics generator
│   ├── calibrate-clutch-index.mjs     # Bounded tanh calibration & overlap matrix generator
│   ├── verify-derived-data.mjs        # Production data integrity and atomic write gate
│   ├── validate-data.mjs              # 13-dataset cross-sum arithmetic validation suite
│   ├── test-analytics.mjs             # 158 unit & regression tests across 12 suites
│   └── test-data-integration.mjs     # 31 independent oracle & invariant tests
├── src/
│   ├── api/                           # Secure client API services (cricketData.ts)
│   ├── analytics/                     # Pure mathematical calculators, filters, adapters
│   ├── components/                    # React 19 UI components with GSAP/D3 visualizations
│   │   ├── NextMatch/                 # Live bilateral fixture countdown card
│   │   ├── PressurePerformance/       # Sourced situational cards & Test performance hub
│   │   ├── PressureMap/               # D3.js 15-cell situational heatmap
│   │   ├── ClutchIndex/               # Model calibration specification & explainability
│   │   ├── EraEngine/                 # 5-era interactive scrollytelling
│   │   ├── CaptaincyMyth/             # Test captaincy comparative analytics
│   │   ├── ChaseMaster/               # Defining chase horizontal gallery
│   │   ├── LegendsShowdown/           # Multi-dimensional legend radar comparisons
│   │   └── WorldMap/                  # D3-geo SVG world dominance map
│   ├── data/                          # Verified datasets, situational splits, and schema types
│   └── styles/                        # Modular CSS design system tokens
└── vite.config.ts                     # Vite configuration with local fixture proxy middleware
```

---

## 🛠️ Installation & Local Development

### Prerequisites
- Node.js 20+ (recommended: Node.js 22 LTS)
- npm 10+

### Setup Instructions

```bash
# 1. Clone repository
git clone https://github.com/rakeshkumar0804/kohli-analytics.git
cd virat-kohli-analytics

# 2. Install dependencies
npm install

# 3. (Optional) Configure live fixture feed
echo "CRICKETDATA_API_KEY=your_api_key_here" > .env.local

# 4. Start local development server (with built-in fixture proxy)
npm run dev
# Open http://localhost:5173
```

---

## 🧪 Test Suites & Quality Verification

The repository enforces strict testing and data validation before any commit or deployment:

```bash
# Run 158 unit & mathematical regression tests across 12 suites
npm test

# Run 31 dataset integration & independent oracle tests
npm run test:data-integration

# Validate structural integrity & cross-sum invariants across all datasets
npm run validate:data

# Run linter
npm run lint

# Compile TypeScript & build production bundle
npm run build
```

---

## 📜 Licenses & Data Attribution

- **Application Source Code**: Distributed under the **MIT License**.
- **Ball-by-Ball Data**: Sourced from [Cricsheet](https://cricsheet.org/) by Stephen Rushe, licensed under **Creative Commons Attribution 4.0 International (CC-BY 4.0)** / **Open Database License (ODbL 1.0)**.
- **Career Aggregate References**: Sourced from official public scorecards and ESPNcricinfo Statsguru.

---

*"Pressure is a privilege. It means something is at stake."* — **Virat Kohli**
