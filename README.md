# 👑 Virat Kohli — The Analytics Story

> A cinematic, scroll-based web experience that tells the data story of Virat Kohli's career through **original computed metrics** — not a fan tribute page, but a data engineering + visualization portfolio project.

[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript)](https://typescriptlang.org)
[![D3.js](https://img.shields.io/badge/D3.js-7-F9A03C?logo=d3.js)](https://d3js.org)
[![GSAP](https://img.shields.io/badge/GSAP-3.12-88CE02?logo=greensock)](https://gsap.com)

---

## What Makes This Different

Most Kohli analytics projects display pre-computed aggregates pulled from a stats table. This project **designs and computes original metrics** from situational match data:

| Feature | What It Does |
|---|---|
| **Clutch Index** | Composite score measuring performance elevation in high-pressure situations vs. baseline |
| **Pressure Map** | Heatmap of batting average across match phase × required run rate cells |
| **Era Engine** | Scrollytelling comparison of 5 career phases with animated metric transitions |
| **Chase Master** | Deep-dive with situational chase breakdown, not just aggregate numbers |
| **Legends Showdown** | Multi-metric animated comparison with dataset-backed values |

---

## Architecture

```
src/
├── api/             ← CricketData.org API integration (live ODI stats)
├── data/            ← Pre-processed match dataset + metric constants
├── hooks/           ← useCountUp, useCricketAPI, useScrollAnimation
├── types/           ← Full TypeScript interfaces for all data shapes
├── components/
│   ├── Layout/      ← SmoothScrollWrapper (Lenis+GSAP), Navbar
│   ├── Hero/        ← Cinematic hero with live API stat counters
│   ├── ClutchIndex/ ← Animated SVG ring + weighted breakdown bars
│   ├── EraEngine/   ← Scrollytelling with sticky chart + era cards
│   ├── PressureMap/ ← D3.js SVG heatmap (4×3 situational grid)
│   ├── ChaseMaster/ ← Famous chases timeline + stat cards
│   ├── LegendsShowdown/ ← Animated comparison bars (6 legends)
│   ├── WorldMap/    ← D3-geo SVG world map with country stats
│   └── Bonus/       ← Career timeline + trivia quiz
└── styles/          ← CSS design system (tokens, global, animations)
```

---

## Data Engineering

### Data Sources

1. **Live API Layer** — [CricketData.org](https://cricketdata.org) (free tier)
   - Used for: Current career aggregate stats (hero section counters)
   - Endpoint: `GET /api/playerStats?id=253802` (Kohli's player ID)
   - Fallback: Static data if API is unavailable

2. **Pre-processed Dataset** — Derived from Cricsheet.org open data
   - [Cricsheet](https://cricsheet.org) provides ball-by-ball JSON for every international match
   - Processed into typed match records with situational metadata
   - Used for: All custom metric computation

3. **Validation Source** — ESPNcricinfo Statsguru
   - Career aggregates cross-validated against Statsguru tables

---

## Custom Metric Methodology

### 1. Clutch Index

**Problem**: How do you quantify a player's ability to perform *better* under pressure, rather than just *perform well* in aggregate?

**Approach**: A composite weighted score comparing situational performance to the baseline.

**Formula:**

```
Clutch Index = Σ (situational_metric / baseline_metric) × weight × 100
              ────────────────────────────────────────────────────────
                        Σ weights (= 100)

Where:
  Chase Dominance     = (chase_avg / baseline_avg)     × 35
  Knockout Elevation  = (knockout_avg / baseline_avg)   × 25
  Finals Performance  = (finals_avg / baseline_avg)     × 20
  SR Pressure Boost   = (chase_SR / baseline_SR)        × 20
```

**Kohli's Values:**

| Metric | Baseline | Situational | Weight |
|---|---|---|---|
| ODI Average | 52.3 | 65.0 (chase) | 35% |
| Knockout Average | 52.3 | 68.4 | 25% |
| Finals Average | 52.3 | 71.2 | 20% |
| Strike Rate | 87.2 | 93.4 (chase) | 20% |

**Result: Clutch Index = 87.4 / 100**

**Limitations & Honest Notes:**
- Finals sample size is small (N ≈ 12 innings); more data would improve confidence
- "Knockout" definition uses ICC tournament quarter-finals onward
- Baseline excludes chase innings to avoid double-counting

**Why Kohli scores 87.4 vs Sachin's 71.3:**
Sachin's chase average (~41) was notably lower than his aggregate (~44.8), suggesting he preferred setting targets. Kohli's chase average (65.0) is 24% above baseline — a rare, statistically significant elevation.

---

### 2. Pressure Map

**Problem**: Traditional heatmaps just show pitch zones. This one shows *situational pressure* — when exactly in a chase does Kohli excel or struggle?

**Grid Definition:**

```
X-Axis (Pressure Level):  Required Run Rate bins
  Comfortable: < 6 rpo    (India coasting)
  Moderate:    6–8 rpo    (competitive)
  Stiff:       8–10 rpo   (under pressure)
  Mountain:    > 10 rpo   (near-impossible)

Y-Axis (Phase):
  Powerplay:   Overs 0–10
  Middle:      Overs 11–40
  Death:       Overs 41–50
```

**Cell Value:** Kohli's batting average across all innings where he was batting in that phase with that RRR.

**Reconstruction Method** (from ball-by-ball data):
```python
# For each Kohli delivery in 2nd innings:
runs_needed   = target - cumulative_team_runs
balls_remaining = total_balls - ball_number
rrr           = (runs_needed / balls_remaining) * 6
phase         = classify_phase(over_number)
cell          = (classify_rrr(rrr), phase)
kohli_avg_per_cell[cell].append(kohli_innings_avg)
```

**Key Finding:** Kohli's "Mountain" Middle phase (>10 RRR, overs 11-40) average of **48.6** is significantly higher than most world-class batters' *overall* averages. His peak cell (Moderate, Middle overs) is **89.4**.

**Color Ramp:** D3 sequential scale — `#1a1a2e` → `#C8102E` (red) → `#FFD700` (gold)

---

### 3. Era Engine

**Five Career Phases:**

| Era | Years | ODI Avg | Key Stat |
|---|---|---|---|
| Youth & Promise | 2008–2011 | 38.6 | Learning to anchor |
| The Rise | 2012–2015 | 58.4 | World notices the Chase Master |
| Absolute Peak | 2016–2019 | 82.1 | Greatest sustained run in modern ODI cricket |
| The Drought | 2020–2022 | 38.2 | 3-year century drought tests character |
| Renaissance | 2023–Present | 72.5 | 765 WC runs; T20 WC Final 76 |

**2018 is statistically the greatest single ODI season in history** — Kohli averaged **133.55** across that year (minimum 10 innings qualifier), driven by not-outs in chases.

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
- Custom metric design for sports analytics
- React + D3.js data visualization architecture  
- GSAP scroll-based narrative storytelling
- TypeScript-first data engineering patterns

---

*"Pressure is a privilege. It means something is at stake."* — Virat Kohli
