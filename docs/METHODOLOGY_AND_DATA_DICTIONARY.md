# Virat Kohli Analytics — Methodology & Data Dictionary

This document serves as the formal specification and reference guide for the analytics pipeline, mathematical definitions, data provenance, and calibration constraints implemented in the **Virat Kohli Analytics** repository.

---

## 1. Verified Career Aggregates (Phase 1 Ground Truth)

All career-level summary statistics displayed in the Hero, Career Totals, and Record Comparison views reflect canonical international records verified against primary official scorecards.

| Format | Matches | Innings | Runs | Dismissals | Not Outs | Batting Average | 100s | 50s | High Score |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **ODI** | **314** | **302** | **14,941** | **255** | **47** | **58.59** | 54 | 74 | 183 |
| **Test** | **113** | **191** | **9,230** | **197** | **14** | **46.85** | 30 | 31 | 254* |
| **T20I** | **125** | **117** | **4,188** | **86** | **31** | **48.70** | 1 | 38 | 122* |
| **Combined** | **552** | **610** | **28,359** | **538** | **92** | **52.71** | 85 | 143 | 254* |

---

## 2. Data Provenance & Boundary Constraints

### Primary Ball-by-Ball Source
- **Publisher**: Cricsheet (Stephen Rushe)
- **License**: Creative Commons Attribution 4.0 International (CC-BY 4.0) / Open Database License (ODbL 1.0)
- **Coverage**: 429 total matches (311 ODI, 118 T20I), 412 batted innings (300 ODI, 112 T20I).

### Reconciliation & Missing Fixtures
- **Missing Matches Scope**: 10 official international matches (3 ODI, 7 T20I) and 1 abandoned/no-toss match are not currently covered with ball-by-ball deliveries in Cricsheet.
- **Delivery Isolation Rule**: Missing matches are reconciled at match and innings level via verified scorecard fixtures (`data/fixtures/missing-reference-matches.json`). **Under no circumstances do missing scorecards contribute virtual or fabricated ball-by-ball deliveries to situational models.**

---

## 3. Mathematical Formulas & Definitions

### Batting Average
$$\text{Average} = \frac{\text{Runs}}{\text{Dismissals}}$$
- **Zero-Dismissal Policy**: If $\text{Dismissals} = 0$, average is strictly evaluated as `null` (not $\text{Runs}$, and not substituted with a virtual dismissal). UI displays a contextual note (e.g. `12 runs / 0 out (undefeated)`).
- **Rounding**: Standard 2-decimal half-up rounding. For T20I: $4{,}188 / 86 = 48.69767\dots \rightarrow \mathbf{48.70}$.

### Batting Strike Rate
$$\text{Strike Rate} = \left(\frac{\text{Runs}}{\text{Official Balls Faced}}\right) \times 100$$
- Official balls faced excludes wides; no-balls count as legal balls faced for the batter per official ICC scoring rules.

### Required Run Rate (RRR)
$$\text{RRR} = \left(\frac{\text{Runs Remaining}}{\text{Legal Balls Remaining}}\right) \times 6$$

### 5-Band Pressure System
1. **Low / Comfortable**: $\text{RRR} < 6.00$
2. **Moderate**: $6.00 \le \text{RRR} < 8.00$
3. **Stiff**: $8.00 \le \text{RRR} < 10.00$
4. **Severe**: $10.00 \le \text{RRR} < 12.00$
5. **Extreme**: $\text{RRR} \ge 12.00$

### Match Phases
- **ODI**: Powerplay (Overs 1–10), Middle (Overs 11–40), Death (Overs 41–50)
- **T20I**: Powerplay (Overs 1–6), Middle (Overs 7–15), Death (Overs 16–20)

---

## 4. Clutch Index Calibration Governance (Phase 5)

The Clutch Index research model is defined under the hyperbolic tangent normalization framework:
$$\text{Score} = 50 + 50 \times \tanh\left(\frac{\text{Split Average} - \text{Baseline Average}}{\text{Baseline Average}}\right)$$

### Calibration Gates & Blocker Status
All 4 statistical quality gates currently fail, requiring the public score to remain **`null`** (`CALIBRATION PENDING`):
1. **Gate 1 (Sample Size)**: Tournament finals ($N=10$ ODI, $N=3$ T20I) and knockouts ($N=7$ T20I) fall below the required sample threshold ($N \ge 10$).
2. **Gate 2 (Peer Corpus)**: Repository contains strictly single-player data; empirical multi-player percentile calibration is unavailable.
3. **Gate 3 (Multicollinearity)**: Tournament finals are 100.0% contained within knockouts, producing severe collinearity.
4. **Gate 4 (Uncertainty Bounds)**: 95% bootstrap confidence interval width for finals exceeds the 25.0 runs/dismissal tolerance.
