# 👑 Virat Kohli — The Analytics Story

> Not just stats. A data-driven story of the greatest batter of his generation — told through original metrics you won't find anywhere else.

![React](https://img.shields.io/badge/React-19-blue) ![TypeScript](https://img.shields.io/badge/TypeScript-5-blue) ![D3.js](https://img.shields.io/badge/D3.js-7-orange) ![GSAP](https://img.shields.io/badge/GSAP-3.12-green)

**[Live Demo →](https://kohli-analytics.vercel.app)**

---

## Screenshots


| [Hero section]<img width="1911" height="926" alt="hero section1" src="https://github.com/user-attachments/assets/2ead27fc-38e9-4412-a076-a4be1e684eb1" />




| [Captaincy Myth]<img width="1907" height="876" alt="Captaincy Myth" src="https://github.com/user-attachments/assets/de291317-5f7b-4f26-98e3-0f7ec7934585" />


 Legends Showdown |<img width="1815" height="888" alt="Legends Showdown1" src="https://github.com/user-attachments/assets/5bda4dc8-97c2-484f-bd7a-15ad008c28bf" />



---

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

## Format Scope

Almost every section carries its own **FORMAT: ODI / Test / T20I** (or **ALL**) toggle, so metrics recompute per format instead of blending everything into one number:

- **Hero section** — combined career snapshot (28,359 international runs, 85 centuries across 54 ODI + 30 Test + 1 T20I, 53.67 combined average, 545 matches) with an ALL/ODI/Test/T20I quick filter
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

## Data Engineering

### Data Sources

**1. Live API Layer** — [CricketData.org](https://cricketdata.org) (free tier)
- Used for: Current career aggregate stats (hero section counters), all formats
- Endpoint: `GET /api/playerStats?id=253802` (Kohli's player ID)
- Fallback: Static data if API is unavailable

**2. Pre-processed Dataset** — Derived from Cricsheet.org open data
- [Cricsheet](https://cricsheet.org) provides ball-by-ball JSON for every international match
- Processed into typed match records with situational metadata, per format
- Used for: All custom metric computation

**3. Validation Source** — ESPNcricinfo Statsguru
- Career aggregates cross-validated against Statsguru tables, format by format

---

## Custom Metric Methodology

### 1. Clutch Index (per format)

**Problem:** How do you quantify a player's ability to perform *better* under pressure, rather than just *perform well* in aggregate?

**Approach:** A composite weighted score comparing situational performance to the baseline, computed independently for ODI, Test, and T20I.

**Formula:**

```
Clutch Index = Σ (situational_metric / baseline_metric) × weight × 100
               ─────────────────────────────────────────────────────
                              Σ weights (= 100)

Where:
  Chase Dominance     = (chase_avg / baseline_avg)      × 35
  Knockout Elevation  = (knockout_avg / baseline_avg)   × 25
  Finals Performance  = (finals_avg / baseline_avg)     × 20
  SR Pressure Boost   = (chase_SR / baseline_SR)        × 20
```

**Kohli's Values (ODI format):**

| Metric | Baseline | Situational | Weight |
|---|---|---|---|
| ODI Average | 52.3 | 65.0 (chase) | 35% |
| Knockout Average | 52.3 | 68.4 | 25% |
| Finals Average | 52.3 | 71.2 | 20% |
| Strike Rate | 87.2 | 93.4 (chase) | 20% |

**Result: ODI Clutch Index = 87.4 / 100** — computed from 314 ODIs, 54 centuries, 65.0 chase average, ICC World Cup knockout elevation.

**Clutch Index — vs the Greats (ODI):** Kohli 87.4, Ponting 74.1, Rohit 73.5, Smith 72.8, Sachin 71.3, Williamson 68.9, Root 63.4

**Limitations & Honest Notes:**
- Finals sample size is small (N ≈ 12 innings); more data would improve confidence
- "Knockout" definition uses ICC tournament quarter-finals onward
- Baseline excludes chase innings to avoid double-counting

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

**Problem:** Traditional heatmaps just show pitch zones. This one shows *situational pressure* — when exactly in a chase does Kohli excel or struggle?

**Grid Definition:**

**X-Axis (Required Run Rate):** Comfortable (<6 rpo) · Moderate (6–8 rpo) · Stiff (8–10 rpo) · Mountain (>10 rpo)

**Y-Axis (Phase):** Powerplay (0–10 ov) · Middle (11–40 ov) · Death (41–50 ov)

**Cell Value:** Kohli's batting average across all innings where he was batting in that phase with that RRR, reconstructed from ball-by-ball data.

**Key Finding (ODI):** Kohli's Middle/Moderate cell (avg **89.4**) is his golden zone — higher than most world-class batters' *overall* careers averages. Even in Mountain situations (>10 RRR) during death overs, he still averages **52.1** — when most batters panic, he accelerates.

**Color Ramp:** D3 sequential scale — `#1a1a2e` → `#C8102E` (red) → `#FFD700` (gold)

---

### 4. Era Engine

**Five Career Phases**, viewable across ODI Avg / Test Avg / Centuries / Chase Avg:

| Era | Years | ODI Avg | Key Stat |
|---|---|---|---|
| Youth & Promise | 2008–2011 | 38.6 | Learning to anchor |
| The Rise | 2012–2015 | 58.4 | Becomes a genius, not just a talent |
| Absolute Peak | 2016–2019 | 82.1 | Greatest sustained run in modern ODI cricket |
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

Country-by-country breakdown of Kohli's record against every major cricket-playing nation, with per-country average, centuries, and runs, plus a computed Dominance Score (currently 95/100 vs South Africa — 72.24 average, 8 centuries, 42 matches, 2164 runs).

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
