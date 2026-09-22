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

### 🏏 Live Next Match Countdown

A dynamic, real-time countdown to Virat Kohli's next scheduled ODI match — built with client-side data fetching (no hardcoded dates, no build-time pre-rendering).

- **Live API integration**: Fetches match schedule from CricAPI in real-time via `useEffect`, directly in the browser on every page load
- **Zero maintenance**: When a new match is scheduled, the countdown automatically appears — no code changes, no redeployment needed
- **Graceful fallback handling**: When no match is within the next 7-10 days (CricAPI's fixture population window), displays a clean fallback message instead of breaking or showing stale data
- **Context-aware**: Includes a status badge noting Kohli's current format focus (ODI-only, having retired from Test and T20I)

This demonstrates handling of a real external API's limitations (delayed fixture population) with proper fallback UX, rather than assuming ideal API behavior.

---

## Format Scope

Almost every section carries its own **FORMAT: ODI / Test / T20I** (or **ALL**) toggle, so metrics recompute per format instead of blending everything into one number:

- **Hero section** — combined career snapshot (28,359 international runs, 85 centuries across 54 ODI + 30 Test + 1 T20I, 52.71 combined average, 562 matches) with an ALL/ODI/Test/T20I quick filter
- **Clutch Index** — format-specific weighted score (e.g. ODI Clutch Index: 87.4/100)
- **Pressure Map** — format-specific heatmap grid
- **Legends Showdown** — format-specific radar chart and stat comparisons
- **Chase Master** — ALL/ODI/Test/T20I chase gallery
- **Captaincy Myth** — Test-specific (68 Tests captained, 58.82% win rate, India's most successful Test captain by win %)

---

## Architecture

```
src/
├── api/              ← CricketData.org API integration (live stats)
├── data/             ← Pre-processed match dataset + metric constants
├── hooks/            ← useCountUp, useCricketAPI, useScrollAnimation
├── types/            ← Full TypeScript interfaces for all data shapes
├── components/
│   ├── Layout/            ← SmoothScrollWrapper (Lenis+GSAP), Navbar
│   ├── Hero/              ← Cinematic hero with live API stat counters + format scope
│   ├── ClutchIndex/       ← Animated SVG ring + weighted breakdown bars, per format
│   ├── CaptaincyMyth/     ← Test captaincy record vs Dravid, Dhoni, Ganguly
│   ├── EraEngine/         ← Scrollytelling with sticky chart + era cards
│   ├── PressureMap/       ← D3.js SVG heatmap (4×3 situational grid), per format
│   ├── ChaseMaster/       ← Famous chases horizontal gallery + stat cards
│   ├── LegendsShowdown/   ← Radar chart + animated comparison bars, per format
│   ├── GlobalDominance/   ← Country-by-country record cards
│   ├── TimelineQuiz/      ← Career timeline + trivia quiz
│   └── WorldMap/          ← D3-geo SVG world map with country stats
└── styles/                ← CSS design system (tokens, global, animations)
```

---

## Data Engineering & Integrity

### Data Sources

**1. Live API Layer** — [CricketData.org](https://cricketdata.org) (free tier)
- Used for: Current career aggregate stats (hero section counters), all formats
- Fallback: Static data if API is unavailable

**2. Curated Benchmark Datasets** — Sourced & cross-validated against ESPNcricinfo Statsguru & Official ICC/BCCI/IPL Scorecards
- Processed into typed match records and situational benchmark data, per format
- Used for: Career aggregates, format breakdown, and custom situational metrics

**3. Validation Source** — ESPNcricinfo Statsguru
- Career aggregates cross-validated against Statsguru tables, format by format

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
│   ├── test-analytics.mjs             # 80 unit & regression tests across 7 suites
│   └── test-data-integration.mjs     # End-to-end dataset integration test runner
└── src/analytics/
    ├── types.ts                       # Normalized match, innings, delivery, and analytical schemas
    ├── normalizeMatch.ts              # Match validator and legal delivery normalizer
    ├── filters.ts                     # Composable match, innings, delivery, and situational filters
    ├── aggregateBatting.ts            # Pure batting calculations (runs, dismissals, average, SR)
    ├── chaseMetrics.ts                # Chase engine (target bands, RRR progression, success rates)
    ├── pressureMetrics.ts             # Pressure grid derivation (3 Phases × 5 RRR bands)
    ├── clutchMetrics.ts               # Versioned Clutch Index model with trust gate
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
  *(Dismissals = Innings - Not Outs. Never calculated as Runs / Innings).*
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

# Run unit tests (80/80 tests passing across 7 suites)
npm test

# Run dataset integration tests
npm run test:data-integration
```

#### Coverage Reconciliation Summary (vs Phase 1 Locked References):
- **ODI**: 300 / 314 matches ingested (14,819 runs vs 14,941 reference runs; diff: -122 runs; classified: `partial-coverage`).
- **T20I**: 112 / 125 matches ingested (3,963 runs vs 4,188 reference runs; diff: -225 runs; classified: `partial-coverage`).
- **Data Integrity Policy**: Phase 1 verified career aggregates remain the permanent displayed career totals. Coverage differences are transparently surfaced as dataset sample limits without artificial adjustment constants.
- **Clutch Index Status**: Displays `CALIBRATION PENDING — PRODUCTION DATA INGESTED` with zero hardcoded fallbacks.

---

## Data Integrity and Provenance

- **Data Last Verified**: `21 September 2026` (`verifiedOnDate: 2026-09-21`) — Coverage varies by dataset format.
- **Official Aggregates**: Career totals across Test (123 Tests / 9,230 runs / 46.85 avg), ODI (314 ODIs / 14,941 runs / 58.59 avg), T20I (125 T20Is / 4,188 runs / 48.70 avg), and IPL (283 matches / 9,336 runs / 40.42 avg) are strictly matched against [Cricbuzz Official Profile](https://www.cricbuzz.com/profiles/1413/virat-kohli) and [ESPNcricinfo Statsguru](https://stats.espncricinfo.com/ci/engine/player/253802.html).
- **Combined International Totals**: `28,359 runs`, `562 matches`, `629 innings`, `91 not-outs`, `538 dismissals`, `52.71 average`. Test + ODI + T20I only (IPL is strictly excluded).
- **Opponent Dominance Data**: Base inputs (runs, innings, dismissals, average, centuries, fifties, high scores across 9 Test-playing nations) are verified reference aggregates from Statsguru. The `dominanceScore` is an experimental map-intensity heuristic derived from verified opponent aggregates; weighting is not an official cricket statistic.
- **Experimental Metrics**: Clutch Index and Pressure Map are experimental models built on static situational benchmark datasets.
- **Validation Suite**: Run `npm run validate:data` locally to verify arithmetic integrity, non-negative integer counts, chase metadata, manifest evidence URLs, and dataset invariants across all 13 project datasets in `src/data/dataSources.ts`.
- **Validation Scope Disclaimer**: The automated validation script (`npm run validate:data`) proves structural and arithmetic self-consistency of project data files (e.g., averages matching `runs / dismissals`), not live historical scorecard querying against external databases.
- **Confirmed Phase 4 Security Remediation Item**: The fallback API key in `src/api/cricketData.ts` (`bc512d1a-7972-40db-b609-caf7132476a5`) is hardcoded on the client side for demo reliability. Confirmed for Phase 4 security remediation (serverless API proxy / environment variable enforcement). No changes permitted during Phase 1 Data Freeze.

---

## Custom Metric Methodology

### 1. Clutch Index (per format)

**Status:** `Experimental — Calibration Pending`

**Problem:** How do you quantify a player's ability to perform *better* under pressure, rather than just *perform well* in aggregate?

**Approach:** An experimental composite weighted model comparing situational performance to the career baseline, computed independently for ODI, Test, and T20I.

**Calibration Status Note:** In Phase 1, Clutch Index scores are set to `Calibration Pending`. Phase 2 will derive and calibrate the score from reproducible ball-by-ball Cricsheet data rather than displaying raw uncalibrated weighted outputs.

**Situational Input Components (ODI format):**

| Metric | Baseline | Situational | Weight |
|---|---|---|---|
| ODI Average | 58.59 | 65.0 (chase) | 35% |
| Knockout Average | 58.59 | 68.4 | 25% |
| Finals Average | 58.59 | 71.2 | 20% |
| Strike Rate | 94.0 | 93.4 (chase) | 20% |

**Limitations & Honest Notes:**
- Experimental metric undergoing ball-by-ball calibration in Phase 2
- Sample sizes in tournament finals (N ≈ 12 innings) require confidence interval modeling
- Baseline represents Kohli's full format career average

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

**X-Axis (Required Run Rate):** Comfortable (<6 rpo) · Moderate (6–8 rpo) · Stiff (8–10 rpo) · Mountain (>10 rpo)

**Y-Axis (Phase):** Powerplay (0–10 ov) · Middle (11–40 ov) · Death (41–50 ov)

**Cell Value:** Kohli's batting average across all innings where he was batting in that phase with that RRR, based on curated situational data.

**Key Finding (ODI):** Kohli's Middle/Moderate cell (avg **89.4**) is his golden zone — higher than most world-class batters' *overall* career averages. Even in Mountain situations (>10 RRR) during death overs, he still averages **52.1** — when most batters panic, he accelerates.

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
| Scroll Engine | Lenis + GSAP ScrollTrigger | Lenis provides inertia physics; GSAP handles pinning and D3 interpolation. Framer Motion alone can't pin elements cleanly. |
| Charts | D3.js (heatmap) + Recharts (bars) | D3 for non-standard heatmap with custom color ramps; Recharts for standard bar charts (less boilerplate) |
| World Map | D3-geo + TopoJSON | No library dependency issues; SVG paths targetable by GSAP for animations |
| API | CricketData.org + static fallback | 100 calls/day free tier sufficient for demo; static fallback ensures reliability |
| State | useState + context | No Redux needed; metric computation is pure functions, no async state management required |

---

## Installation

```bash
git clone <repo>
cd virat-kohli-analytics
npm install
```

Create `.env.local`:

```
VITE_CRICKET_API_KEY=your_cricketdata_org_key
```

```bash
npm run dev
```

Visit `http://localhost:5173`

---

## What I'd Do Differently With More Time

1. **Real ball-by-ball processing** — Download Cricsheet JSON dumps and run a Python/DuckDB pipeline to compute cells from raw data rather than pre-aggregated values
2. **Confidence intervals** — Show error bars on small-sample cells (Finals: N≈12 is too small for high confidence)
3. **Bowling-dependent breakdown** — Kohli vs pace vs spin in pressure situations
4. **IPL Clutch data** — Extend Clutch Index to include IPL playoff performances
5. **Animation on data update** — Hook the Era Engine to actually re-compute from a date range slider

---

## Author

Built as a portfolio project demonstrating:

- Custom metric design for sports analytics, computed independently across three formats
- React + D3.js data visualization architecture
- GSAP scroll-based narrative storytelling
- TypeScript-first data engineering patterns

---

*"Pressure is a privilege. It means something is at stake."* — Virat Kohli
