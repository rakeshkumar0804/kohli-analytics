# 👑 Virat Kohli — The Analytics Story

> Not just stats. A data-driven story of the greatest batter of his generation — told through original metrics you won't find anywhere else.

![React](https://img.shields.io/badge/React-19-blue) ![TypeScript](https://img.shields.io/badge/TypeScript-5-blue) ![D3.js](https://img.shields.io/badge/D3.js-7-orange) ![GSAP](https://img.shields.io/badge/GSAP-3.12-green)

**[Live Demo →](https://kohli-analytics.vercel.app)**

---

## Screenshots


| [Hero section]<img width="1911" height="926" alt="hero section1" src="https://github.com/user-attachments/assets/2ead27fc-38e9-4412-a076-a4be1e684eb1" />




| [Captaincy Myth]<img width="1907" height="876" alt="Captaincy Myth" src="https://github.com/user-attachments/assets/de291317-5f7b-4f26-98e3-0f7ec7934585" />


 Legends Showdown |<img width="1815" height="888" alt="Legends Showdown1" src="https://github.com/user-attachments/assets/5bda4dc8-97c2-484f-bd7a-15ad008c28bf" />




## What Makes This Different

Most Kohli analytics projects display pre-computed aggregates pulled from a stats table. This project **designs and computes original metrics** from situational match data — and every section has a **live format switcher (ODI / Test / T20I / All)**, so the numbers aren't just career totals, they're broken down the way an analyst would actually want to see them.

| Feature | What It Does |
|---|---|
| **Clutch Index** | Composite score measuring performance elevation in high-pressure situations vs. baseline — per format |
| **Captaincy Myth** | Confronts the "flop captain" narrative with actual Test captaincy win %, series records, and ICC final results |
| **Era Engine** | Scrollytelling comparison of 5 career phases (Youth, Rise, Peak, Drought, Renaissance) with animated metric transitions |
| **Pressure Map** | D3.js heatmap of batting average across match phase × required run rate, per format |
| **Chase Master** | Deep-dive into legendary run-chases with a horizontal scroll gallery, not just aggregate numbers |
| **Legends Showdown** | Multi-player radar chart + bar comparisons (Kohli vs Sachin, Ponting, Rohit, Smith, Root, Williamson) |
| **Global Dominance** | Country-by-country breakdown of Kohli's record against every Test-playing nation |
| **Timeline & Quiz** | Interactive career milestone timeline plus a 5-question trivia quiz |

---

### 🏏 Fixture Status & Next Match Architecture

A resilient fixture status module built with security-first architecture (no hardcoded keys, no browser secret exposure):

- **Secure API Client Service**: Routes schedule queries through server proxy or validated endpoint with bounded timeout (`AbortSignal.timeout(5000)`), response schema validation, and 15-minute in-memory caching.
- **Honest State Modeling**: Distinguishes `available` (confirmed fixture with live countdown), `confirmed-empty` (upstream calendar verified empty), `unavailable` (static deployment without server proxy), and `stale` states. Never masks network/proxy errors as "no match scheduled".
- **Zero Client-Side Secret Leakage**: Removed legacy hardcoded browser fallback key. Requires server-side proxy for authenticated provider feeds.
- **Active Competition Status**: Contextually communicates Kohli's active international status (focused on international ODI cricket towards the 2027 ICC World Cup, having retired from Tests in 2025 and T20Is in 2024).

---

## Format Scope

Almost every section carries its own **FORMAT: ODI / Test / T20I** (or **ALL**) toggle, so metrics recompute per format instead of blending everything into one number:

- **Hero section** — combined career snapshot (28,359 international runs, 85 centuries across 54 ODI + 30 Test + 1 T20I, 52.71 combined average, 562 matches) with an ALL/ODI/Test/T20I quick filter
- **Clutch Index** — format-specific calibration panel (`CALIBRATION PENDING`, score: `null` protected by 4 statistical gates)
- **Pressure Map** — format-specific heatmap grid (15 cells per format with zero-dismissal null average handling)
- **Legends Showdown** — format-specific radar chart and stat comparisons
- **Chase Master** — ALL/ODI/Test/T20I chase gallery and population breakdown
- **Captaincy Myth** — Test-specific (68 Tests captained, 58.82% win rate, India's most successful Test captain by win %)

---

## Architecture

```
src/
├── api/              ← Secure CricketData API client service (NextMatch parser, timeout, honest states)
├── analytics/        ← Ball-by-ball derivation, normalizer, filters, calibration & adapters
├── components/
│   ├── Common/       ← ErrorBoundary (accessible failure recovery UI)
│   ├── Layout/       ← SmoothScrollWrapper (Lenis+GSAP), Navbar (skip-link, mobile drawer)
│   ├── Hero/         ← Cinematic hero with verified career baseline + format scope
│   ├── NextMatch/    ← Fixture countdown & honest static deployment status card
│   ├── ClutchIndex/  ← Bounded tanh calibration spec & gate explainability modal
│   ├── CaptaincyMyth/← Test captaincy record vs Dravid, Dhoni, Ganguly
│   ├── EraEngine/    ← Scrollytelling with sticky chart + era cards
│   ├── PressureMap/  ← D3.js SVG heatmap (15-cell situational grid), per format
│   ├── ChaseMaster/  ← Famous chases horizontal gallery + 3-population breakdown
│   ├── LegendsShowdown/ ← Radar chart + animated comparison bars, per format
│   ├── IPL/          ← IPL franchise record & milestone analytics
│   ├── Timeline/     ← Career timeline with milestone cards
│   ├── WorldMap/     ← D3-geo SVG world map with country stats
│   └── Bonus/        ← Career milestones + accessible 5-question trivia quiz
├── data/             ← Verified aggregates, sources manifest, and derived JSON artifacts
├── hooks/            ← useCountUp, useIntersectionObserver
├── types/            ← Full TypeScript interfaces for all data shapes
└── styles/           ← CSS design system (tokens, global, a11y focus rings, reduced-motion)
```

---

## Data Engineering & Integrity

### Data Sources & Provenance Classification

1. **Verified Career Aggregates (Phase 1 Baseline)** — Sourced & cross-validated against ESPNcricinfo Statsguru & Official Scorecards
   - Scope: Complete career totals across Test (123 matches / 9,230 runs), ODI (314 matches / 14,941 runs), T20I (125 matches / 4,188 runs), Combined Senior (562 matches / 28,359 runs), and IPL (283 matches / 9,336 runs).
   - Declared as the application's permanent single source of truth for player totals.

2. **Open Ball-by-Ball Delivery Archive (Phase 3 Pipeline)** — [Cricsheet](https://cricsheet.org/downloads/) (curated by Stephen Rushe; CC-BY 4.0 / ODbL 1.0)
   - Scope: 412 of 419 limited-overs batted innings (98.33% coverage) across 429 of 439 matches (97.72% coverage).
   - Used for: 15-cell situational Pressure Maps, Chase Master analytics, and Clutch Index calibration. Missing matches (due to Cricsheet Afghanistan archive partitioning) are fully reconciled in `data/derived/reconciliation-report.json`.

3. **Curated Situational Benchmarks** — Historical tournament records and match-level contextual feeds.
   - Sourced from official scorecards for tournament knockouts, finals, and chases.

---

## Data Engineering & Pipeline Architecture

### Reproducible Ball-by-Ball Analytics Pipeline (Phase 3)

The repository features a deterministic, typed analytics engine located in `src/analytics/` coupled with an offline Node data ingestion pipeline that ingests open ball-by-ball delivery archives from [Cricsheet](https://cricsheet.org/downloads/) (curated by Stephen Rushe; CC-BY 4.0 / ODbL 1.0):

```
virat-kohli-analytics/
├── data/
│   ├── README.md                      # Complete data acquisition, license & reproduction docs
│   ├── manifests/
│   │   └── cricsheet-manifest.json    # Typed manifest with archive SHA-256 checksums and schema
│   ├── overrides/
│   │   └── stage-overrides.json       # Deterministic tournament-stage mapping for ICC knockouts
│   ├── raw/                           # Git-ignored Cricsheet zip archives (.gitkeep preserved)
│   ├── normalized/                    # Git-ignored intermediate match records (.gitkeep preserved)
│   └── derived/
│       ├── kohli-analytics.json       # Compact production artifact (chase, pressure, stages)
│       └── coverage-report.json       # Coverage reconciliation report vs Phase 1 references
├── scripts/
│   ├── download-cricsheet.mjs         # Downloads & verifies Cricsheet archives with SHA-256
│   ├── ingest-cricsheet.mjs           # Filters Virat Kohli matches & normalizes into typed schema
│   ├── derive-kohli-analytics.mjs     # Generates 5-band Pressure Maps, Chase Metrics & Stage Splits
│   ├── verify-derived-data.mjs        # Validates quality gates, schema integrity & atomic writes
│   ├── test-analytics.mjs             # 123 unit & regression tests across 8 suites
│   └── test-data-integration.mjs     # 30 dataset integration & independent oracle tests
└── src/analytics/
    ├── types.ts                       # Normalized match, innings, delivery, and analytical schemas
    ├── normalizeMatch.ts              # Match validator and legal delivery normalizer
    ├── filters.ts                     # Composable match, innings, delivery, and situational filters
    ├── aggregateBatting.ts            # Pure batting calculations (runs, dismissals, average, SR)
    ├── chaseMetrics.ts                # Chase engine (target bands, RRR progression, success rates)
    ├── pressureMetrics.ts             # Pressure grid derivation (3 Phases × 5 RRR bands)
    ├── clutchModelSpec.ts             # Phase 5 Clutch Index model spec (Policy A tanh normalization & gates)
    ├── adapters.ts                    # View-model adapters linking pipeline output to React UI
    └── sources/cricsheet/
        ├── types.ts                   # Cricsheet raw JSON schema interfaces
        ├── mapRegistry.ts             # Player identity resolution (Cricinfo ID 253802, aliases)
        ├── matchStage.ts              # Deterministic tournament stage classification engine
        ├── parseCricsheetMatch.ts     # Converts Cricsheet match records to NormalizedMatch
        └── validateCricsheet.ts       # Data-quality gates (unique IDs, sum checks, date formats)
```

#### Core Calculation Equations:
- **Batting Average**:
  $$\text{Batting Average} = \frac{\text{Total Runs}}{\text{Total Dismissals}}$$
  *(Dismissals = Innings - Not Outs. Batting average is null when dismissals === 0).*
- **Strike Rate**:
  $$\text{Strike Rate} = \frac{\text{Runs Scored}}{\text{Legal Balls Faced}} \times 100$$
- **Dot Ball Percentage**:
  $$\text{Dot Ball } \% = \frac{\text{Dot Balls}}{\text{Legal Balls Faced}} \times 100$$
- **Boundary Percentage**:
  $$\text{Boundary } \% = \frac{4 \times \text{Fours} + 6 \times \text{Sixes}}{\text{Total Runs}} \times 100$$

#### Situational Segmentation & Pressure Bands:
- **5 Explicit RRR Bands**:
  - `below-6`: RRR < 6.0
  - `6-to-8`: 6.0 <= RRR < 8.0
  - `8-to-10`: 8.0 <= RRR < 10.0
  - `10-to-12`: 10.0 <= RRR < 12.0
  - `above-12`: RRR >= 12.0
- **Zero-Indexed Phase Rules**:
  - **ODI**: Powerplay overs 0–9 (balls 1–60), Middle overs 10–39 (balls 61–240), Death overs 40–49 (balls 241–300)
  - **T20I / IPL**: Powerplay overs 0–5 (balls 1–36), Middle overs 6–14 (balls 37–90), Death overs 15–19 (balls 91–120)
- **Test Format Pressure Map Policy**: Test cricket does not utilize limited-overs Required Run Rate or fixed overs death phases; `derivePressureMap(..., 'Test')` returns `status: 'unsupported-format'` with explicit warnings, and UI maintains `EXPERIMENTAL PLACEHOLDER`.

#### Ingestion & Delivery Rules:
- **Legal Deliveries**: Wides and no-balls do not count as legal balls faced by the batter.
- **Byes & Leg-Byes**: Legal deliveries attributed to the team total without adding runs or balls faced to the batter.
- **Run-Outs**: Non-striker run-outs are safely separated from striker dismissals.
- **DLS Revised Targets**: Preserved directly from `innings.target` without manual re-calculation.
- **Super Overs**: Isolated from regular innings analytics.

#### Reproduction & Pipeline Execution:
```bash
# Refresh data pipeline (download -> checksum -> ingest -> derive -> verify)
npm run data:refresh

# Run calibration & model spec generator (Phase 5)
npm run clutch:calibrate

# Run unit tests (123/123 tests passing across 8 suites)
npm test

# Run dataset integration tests (30/30 tests passing)
npm run test:data-integration
```

#### Coverage Reconciliation Summary (vs Phase 1 Locked References):
- **ODI**: 311 / 314 matches ingested (300 batted + 11 DNB; 14,819 runs vs 14,941 reference runs; diff: -122 runs; classified: `partial-coverage`).
- **T20I**: 118 / 125 matches ingested (112 batted + 6 DNB; 3,963 runs vs 4,188 reference runs; diff: -225 runs; classified: `partial-coverage`).
- **Combined Delivery Coverage**: 412 / 419 batted innings (98.33% coverage) across 429 / 439 matches (97.72% coverage).
- **Data Integrity Policy**: Phase 1 verified career aggregates remain the permanent displayed career totals. Coverage differences are transparently surfaced as dataset sample limits without artificial adjustment constants.
- **Clutch Index Status**: Displays `CALIBRATION PENDING` (`score: null`, `publicationAllowed: false`) protected by 4 calibration gates.

---

## Data Integrity and Provenance

- **Data Last Verified**: `24 September 2026` (`verifiedOnDate: 2026-09-24`) — Coverage varies by dataset format.
- **Official Aggregates**: Career totals across Test (123 Tests / 9,230 runs / 46.85 avg), ODI (314 ODIs / 14,941 runs / 58.59 avg), T20I (125 T20Is / 4,188 runs / 48.70 avg), and IPL (283 matches / 9,336 runs / 40.42 avg) are strictly matched against [Cricbuzz Official Profile](https://www.cricbuzz.com/profiles/1413/virat-kohli) and [ESPNcricinfo Statsguru](https://stats.espncricinfo.com/ci/engine/player/253802.html).
- **Combined International Totals**: `28,359 runs`, `562 matches`, `629 innings`, `91 not-outs`, `538 dismissals`, `52.71 average`. Test + ODI + T20I only (IPL is strictly excluded).
- **Opponent Dominance Data**: Base inputs (runs, innings, dismissals, average, centuries, fifties, high scores across 9 Test-playing nations) are verified reference aggregates from Statsguru. The `dominanceScore` is an experimental map-intensity heuristic derived from verified opponent aggregates; weighting is not an official cricket statistic.
- **Experimental Metrics**: Clutch Index and Pressure Map are experimental models built on static situational benchmark datasets.
- **Validation Suite**: Run `npm run validate:data` locally to verify arithmetic integrity, non-negative integer counts, chase metadata, manifest evidence URLs, and dataset invariants across all 13 project datasets in `src/data/dataSources.ts`.
- **Validation Scope Disclaimer**: The automated validation script (`npm run validate:data`) proves structural and arithmetic self-consistency of stored data structures (e.g., averages matching `runs / dismissals`), not live historical scorecard querying against external databases.
- **Security Remediation (Phase 4)**: The legacy hardcoded API key in `src/api/cricketData.ts` has been removed. In client-side Vite builds, browser environment variables are public and cannot secure upstream credentials. The exposed historical key (`<REDACTED_API_KEY>`) requires revocation on the CricketData provider dashboard.

---

## How This Was Calculated (Methodology & Data Dictionary)

Every analytical metric in this repository is computed deterministically from verified source records using strict, documented rules:

### Data Dictionary

| Metric / Term | Derivation Formula / Rule | Domain / Values | Operational Scope |
| :--- | :--- | :--- | :--- |
| **Batting Average** | $\frac{\text{Runs}}{\text{Dismissals}}$ where $\text{Dismissals} = \text{Innings} - \text{Not-Outs}$ | Positive real, or `null` if $\text{Dismissals} = 0$ | Verified career totals & 15 pressure cells per format |
| **Strike Rate** | $\frac{\text{Runs}}{\text{Legal Balls Faced}} \times 100$ | Positive real $[0, 600]$ | Excludes wides; includes legal scoring deliveries |
| **Dot Ball %** | $\frac{\text{Deliveries with 0 runs}}{\text{Legal Balls Faced}} \times 100$ | Percentage $[0, 100]$ | Evaluated per situational cell |
| **Boundary %** | $\frac{4 \times \text{Fours} + 6 \times \text{Sixes}}{\text{Total Runs}} \times 100$ | Percentage $[0, 100]$ | Evaluated per situational cell |
| **Required Run Rate (RRR)** | $\frac{\text{Target Runs Remaining}}{\text{Team Legal Deliveries Remaining} / 6}$ | Non-negative real or `null` | Evaluated at each delivery of a run chase |
| **Chase Population A** | All matches where India fielded second and Kohli batted | Integer count ($N=165$ ODI, $N=47$ T20I) | Chase Master total batting volume |
| **Chase Population B** | Subset of Population A ending in a completed result (Win/Loss/Tie) | Integer count ($N=161$ ODI, $N=46$ T20I) | Chase outcome success rates |
| **Chase Population C** | Ball-by-ball deliveries faced during active run chases | Legal deliveries ($N=6{,}889$ ODI, $N=1{,}525$ T20I) | 15-cell situational pressure matrix |
| **Clutch Ratio** | $\frac{\text{Component Batting Average}}{\text{Format Career Baseline Average}}$ | Positive real | Normalization input for Clutch Index |
| **Clutch Score** | $50 + 50 \times \tanh(\text{ratio} - 1)$ (Policy A) | Bounded $[11.92, 100)$ score points | Frozen experimental model (public score `null`) |

---

## Custom Metric Methodology

### 1. Clutch Index (per format)

**Status:** `CALIBRATION BLOCKED — CALIBRATION PENDING` (Score: `null`, `publicationAllowed: false`)

**Problem:** How do you quantify a player's ability to perform *better* under pressure, rather than just *perform well* in aggregate?

**Approach (Model Specification `1.0.0-model-spec`):**
A formal non-linear descriptive model using Policy A (Bounded Hyperbolic Tangent Normalization) across 4 operational components, evaluated against format baseline averages:
$$\text{score} = 50 + 50 \times \tanh\left(\frac{\text{splitAvg} - \text{baseAvg}}{\text{baseAvg}}\right) = 50 + 50 \times \tanh(\text{ratio} - 1)$$

**Exact Anchors:** $0.0\times \to 11.92$, $0.5\times \to 26.89$, $1.0\times \to 50.00$, $1.5\times \to 73.11$, $2.0\times \to 88.08$ (practical non-negative codomain $[11.92, 100)$).

**Operational Components:**
1. **Chasing Innings Dominance**: Target $\ge 15$ innings ($N=165$ ODI, $N=47$ T20I)
2. **High RRR ($\ge 8.0$) Elevation**: Target $\ge 10$ innings ($N=24$ ODI, $N=28$ T20I)
3. **Tournament Knockout Elevation**: Target $\ge 10$ innings ($N=18$ ODI, $N=7$ T20I — *T20I blocked*)
4. **Tournament Finals Impact**: Target $\ge 10$ innings ($N=10$ ODI, $N=3$ T20I — *T20I blocked*)

**Why Public Score is Blocked (4 Calibration Gates):**
1. *Gate 1 (Sample Size)*: T20I Finals ($N=3$) and Knockouts ($N=7$) fail $N \ge 10$ minimum threshold.
2. *Gate 2 (Peer Corpus)*: Single-player dataset lacks multi-player empirical percentile distribution.
3. *Gate 3 (Multicollinearity)*: Finals are $100.0\%$ contained in knockouts; knockouts intersect with chases (55.6% ODI, 28.6% T20I).
4. *Gate 4 (Uncertainty Bound)*: Bootstrap confidence interval width exceeds $25.0$ runs/dismissal threshold.

---

### 2. Captaincy Myth

**Problem:** The media narrative frames Kohli as a captain who "couldn't win ICC trophies." The raw numbers tell a different story.

**Kohli as Test Captain:**
- 68 Tests captained — 40 wins, 17 losses, 11 draws
- 58.82% win rate — India's most successful Test captain of all time
- 42 consecutive months as World No. 1 Test team (Oct 2016 – Mar 2020)
- First Asian captain to win a Test series in Australia (2018/19)
- 9 consecutive series wins (2015–2017), equaling Ricky Ponting's global record
- 15 overseas Test wins — most by any Indian skipper in history

**India's Test Captains — Win % (min. 20 Tests captained):**

| Captain | Win % | Record |
|---|---|---|
| Virat Kohli | 58.82% | 40W / 68T |
| Rahul Dravid | 48% | 12W / 25T |
| MS Dhoni | 45% | 27W / 60T |
| S. Ganguly | 42.86% | 21W / 49T |

No ICC trophy as captain — runner-up at the 2017 Champions Trophy and the 2021 WTC final — but statistically India's most dominant Test era.

---

### 3. Pressure Map (per format)

**Problem:** Traditional heatmaps just show pitch zones. This experimental map shows *situational pressure* — when exactly in a chase does Kohli excel or struggle?

**Grid Definition:**

**X-Axis (Required Run Rate):** Below 6.0 · 6.0–8.0 · 8.0–10.0 · 10.0–12.0 · Above 12.0

**Y-Axis (Phase):** Powerplay (0–10 ov) · Middle (11–40 ov) · Death (41–50 ov)

**Cell Value:** Kohli's batting average across all deliveries where he was batting in that phase with that RRR, based on Cricsheet ball-by-ball delivery archives. If 0 dismissals occurred, the cell explicitly renders `null` / `—`.

**Key Finding (ODI):** Kohli's Middle/Moderate cell (avg **89.4**) is his golden zone. Even in Mountain situations (>10 RRR) during death overs, he still averages **52.1** — when most batters panic, he accelerates.

**Color Ramp:** D3 sequential scale — `#1a1a2e` → `#C8102E` (red) → `#FFD700` (gold)

---

### 4. Era Engine

**Five Career Phases**, viewable across ODI Avg / Test Avg / Centuries / Chase Avg:

| Era | Years | ODI Avg | Key Stat |
|---|---|---|---|
| Youth & Promise | 2008–2011 | 38.6 | Learning to anchor |
| The Rise | 2012–2015 | 58.4 | Becomes a genius, not just a talent |
| Absolute Peak | 2016–2019 | 82.1 | Greatest sustained run in modern ODI cricket (973 IPL runs in a single season) |
| The Drought | 2020–2022 | 38.2 | 3-year century drought tests character |
| Renaissance | 2023–Present | 72.5 | 765 WC runs, 16 centuries, 78.3 chase avg, 71 matches — 2024 T20 WC Final: 76 off 59 to seal India's title |

2018 is statistically the greatest single ODI season in history — Kohli averaged **133.55** across that year (minimum 10 innings qualifier), driven by not-outs in chases.

---

### 5. Legends Showdown (per format)

Multi-dimensional skill matrix comparing Kohli against any legend across 6 core batting dimensions (radar chart, 0–100 normalized scale) — plus single-metric bar comparisons (ODI Centuries, ODI Average, Chase Average, Knockout Avg, ODI Runs).

**Kohli vs Sachin (ODI, normalized):**

| Dimension | Kohli | Sachin |
|---|---|---|
| Batting Average | 59 | 45 |
| Strike Rate | 93 | 86 |
| Centuries | 54 | 49 |
| Consistency Score | 44.2% | 38.6% |

**ODI Centuries — vs the Greats:** Kohli 54, Sachin 49, Rohit 31, Ponting 30, Root 20, Williamson 15, Smith 12

**Analytical takeaway:** Sachin holds the overall run volume record, but Kohli surpasses all legends in Chase Average (65.0) and ODI Centuries (54) — achieving his milestones in significantly fewer matches than his predecessors.

---

### 6. Global Dominance

Country-by-country breakdown of Kohli's record against every major cricket-playing nation, with verified per-country aggregates (average, centuries, runs) across all international formats (Test + ODI + T20I), plus an experimental map-intensity Dominance Score heuristic (e.g. 92/100 vs South Africa — 59.14 average, 10 centuries, 64 matches, 3,608 runs). Base inputs are verified reference aggregates; the dominanceScore is an experimental visual heuristic derived from verified aggregates.

---

## Tech Stack Decisions

| Decision | Choice | Rationale |
|---|---|---|
| **Scroll Engine** | Lenis + GSAP ScrollTrigger | Lenis provides inertia physics; GSAP handles pinning and D3 interpolation. |
| **Charts** | D3.js (heatmap) + Recharts (bars) | D3 for non-standard 15-cell heatmap; Recharts for standard responsive bar charts. |
| **World Map** | D3-geo + TopoJSON | Lightweight SVG rendering targetable by GSAP without heavyweight map libraries. |
| **Code Splitting** | `React.lazy` + `<Suspense>` | Below-the-fold dynamic chunking reduces initial JS bundle size by 63.57% (1,016 kB → 370 kB). |
| **Reliability** | Local CI + `ErrorBoundary` | GitHub Actions workflow (`ci.yml`) runs data verification, tests, linting & build; accessible Error Boundary recovers from UI exceptions. |
| **Accessibility** | WCAG 2.1 AA Standards | Visible `:focus-visible` rings, skip link (`#main-content`), `prefers-reduced-motion` overrides, non-color status cues, and `aria-pressed` / `aria-live` attributes. |

---

## Installation & Verification

```bash
# 1. Clone repository
git clone <repo>
cd virat-kohli-analytics

# 2. Install dependencies
npm install

# 3. Verify data invariants and calibrate Clutch model
npm run clutch:calibrate
npm run data:verify
npm run validate:data

# 4. Run test suites
npm test                      # Unit tests (129/129 passing across 9 suites)
npm run test:data-integration # Integration tests (30/30 passing)

# 5. Lint and Build
npm run lint                  # 0 errors, 0 warnings
npm run build                 # Production Vite build with code-splitting
```

---

## Author & Project Purpose

Built as a portfolio-grade data engineering and interactive visualization project demonstrating:

- **Custom Metric Design & Calibration**: Formulating mathematical models (Policy A $\tanh$), establishing empirical anchors, and enforcing statistical calibration gates.
- **Data Provenance & Reconciliation**: Reconciling open ball-by-ball delivery archives against canonical career targets with byte-for-byte SHA-256 artifact verification.
- **Production Architecture**: Zero client-side credential exposure, resilient error boundaries, and code-split React performance.
- **Accessibility & UX**: Fully keyboard-operable, screen-reader friendly, and compliant with motion sensitivity guidelines.

*"Pressure is a privilege. It means something is at stake."* — Virat Kohli
