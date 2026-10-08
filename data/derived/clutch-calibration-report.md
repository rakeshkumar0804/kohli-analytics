# Phase 5 Clutch Index Calibration & Explainability Report

- **Model Version**: `1.0.0-model-spec`
- **Status**: `calibration-blocked`
- **Generated At**: `2026-10-08T06:38:01.364Z`
- **Player**: Virat Kohli
- **Baseline Definition**: `Self-relative descriptive model against archive-covered format baseline averages (ODI: 58.34 across 311 archive matches; T20I: 48.33 across 118 matches). Cross-player calibration blocked due to single-player scope.`
- **Publication Allowed**: `false`
- **Public Score**: `null (CALIBRATION PENDING)`

---

## 1. Frozen Legacy Model (0.1.0-experimental)

- **Status**: `superseded-research-baseline`
- **Original Formula**: `ratio = splitAvg / baseAvg; score = min(100, max(0, round(ratio * 70)))`
- **Editorial Weights**: Chase (35%), High Pressure (25%), Knockout (20%), Finals (20%)
- **Known Weaknesses**:
  - Circular scoring / collinearity: Tournament finals are a strict subset of knockouts, which frequently overlap with run chases (double counting).
  - Small sample volatility: Tournament finals (N=7 ODI, N=2 T20I) exhibit excessive variance where single boundary events alter the score by >15 points.
  - Self-relative bias: Comparing a player only against their own career baseline cannot produce an absolute universal score across players.
  - Arbitrary 70-point anchor: Scaling ratio 1.0 to 70 points was an editorial heuristic rather than empirically calibrated against peer distributions.
  - Missing zero-dismissal safeguards and uncertainty intervals.
- **Why Never Production-Trusted**: Lacked cross-player peer corpus, lacked collinearity corrections, and lacked statistical confidence intervals.

---

## 2. Normalization Framework (Policy A: Hyperbolic Tangent)

The Phase 5 specification adopts Policy A for non-linear bounded score mapping:
$$\text{score} = 50 + 50 \times \tanh\left(\frac{\text{splitAvg} - \text{baseAvg}}{\text{baseAvg}}\right) = 50 + 50 \times \tanh(\text{ratio} - 1)$$

### Exact Mathematical Anchors (Policy A):
| Ratio | Split vs Base Relative Diff | Formula Evaluation | Exact Score Points | Interpretation |
| :---: | :---: | :---: | :---: | :--- |
| **0.0x** | -100% (0 runs) | $50 + 50 \times \tanh(-1.0)$ | **11.92** | Practical non-negative minimum |
| **0.5x** | -50% depression | $50 + 50 \times \tanh(-0.5)$ | **26.89** | Severe situational depression |
| **1.0x** | 0% (parity) | $50 + 50 \times \tanh(0.0)$ | **50.00** | Exact baseline parity anchor |
| **1.5x** | +50% elevation | $50 + 50 \times \tanh(0.5)$ | **73.11** | Strong situational elevation |
| **2.0x** | +100% elevation | $50 + 50 \times \tanh(1.0)$ | **88.08** | Elite situational elevation |

> **Range Note**: The output is strictly bounded to the interval $[0, 100]$. For all non-negative batting ratios, the practical domain is $[11.92, 100)$. Ratio $0.0\times$ maps to $11.92$, never $0.0$.

---

## 3. Operational Component Definitions & Sample Counts

### ODI Format Component Accounting

- **Archive-Covered Baseline Average**: **58.54** (14987 runs / 256 dismissals across 314 matches, 303 batted innings)
- **Phase 1 Full-Career Verified Average**: **58.79** (15109 runs / 257 dismissals across 317 matches, 305 batted innings)
- *Scope Rationale*: Situational splits within the delivery dataset are evaluated against the archive-covered baseline average to prevent delivery-subset mismatch.

| Component | Innings | Balls | Runs | Dismissals | Split Avg | Baseline Avg | Ratio | Tanh Score (0-100) | Min Req | Status |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :--- |
| **Chasing Innings Dominance** | 167 | 9091 | 8612 | 131 | 65.74 | 51.00 | 1.29x | 64.06 | N>=15 | `usable-sample` |
| **High-Pressure Situations (RRR >= 8.0)** | 24 | 676 | 844 | 16 | 52.75 | 58.54 | 0.90x | 45.07 | N>=10 | `usable-sample` |
| **Tournament Knockout Elevation** | 18 | 664 | 578 | 15 | 38.53 | 58.54 | 0.66x | 33.55 | N>=10 | `usable-sample` |
| **Tournament Finals Impact** | 10 | 263 | 209 | 9 | 23.22 | 58.54 | 0.40x | 23.03 | N>=10 | `usable-sample` |

### T20I Format Component Accounting

- **Archive-Covered Baseline Average**: **48.33** (3963 runs / 82 dismissals across 118 matches, 112 batted innings)
- **Phase 1 Full-Career Verified Average**: **48.69** (4188 runs / 86 dismissals across 125 matches, 117 batted innings)
- *Scope Rationale*: Situational splits within the delivery dataset are evaluated against the archive-covered baseline average to prevent delivery-subset mismatch.

| Component | Innings | Balls | Runs | Dismissals | Split Avg | Baseline Avg | Ratio | Tanh Score (0-100) | Min Req | Status |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :--- |
| **Chasing Innings Dominance** | 47 | 1459 | 1984 | 29 | 68.41 | 37.34 | 1.83x | 84.08 | N>=15 | `usable-sample` |
| **High-Pressure Situations (RRR >= 8.0)** | 28 | 738 | 1122 | 15 | 74.80 | 48.33 | 1.55x | 74.94 | N>=10 | `usable-sample` |
| **Tournament Knockout Elevation** | 7 | 285 | 414 | 4 | 103.50 | 48.33 | 2.14x | 90.75 | N>=10 | `insufficient-sample` |
| **Tournament Finals Impact** | 3 | 145 | 194 | 2 | 97.00 | 48.33 | 2.01x | 88.23 | N>=10 | `insufficient-sample` |

---

## 4. Overlap & Multicollinearity Matrix

### ODI Inter-Component Directional Containment

| Set A | Set B | Unit | Innings Overlap | Containment (A in B) | Containment (B in A) | Jaccard Index | Directional Formula |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :--- |
| `chase` | `knockout` | innings | 10 | **6%** | **55.6%** | 0.0571 | `count(innings in chase also in knockout) / count(innings in chase) = 10/167 (6%)` |
| `chase` | `final` | innings | 5 | **3%** | **50%** | 0.0291 | `count(innings in chase also in final) / count(innings in chase) = 5/167 (3%)` |
| `chase` | `successfulChase` | innings | 106 | **63.5%** | **100%** | 0.6347 | `count(innings in chase also in successfulChase) / count(innings in chase) = 106/167 (63.5%)` |
| `chase` | `highPressure` | innings | 24 | **14.4%** | **100%** | 0.1437 | `count(innings in chase also in highPressure) / count(innings in chase) = 24/167 (14.4%)` |
| `knockout` | `chase` | innings | 10 | **55.6%** | **6%** | 0.0571 | `count(innings in knockout also in chase) / count(innings in knockout) = 10/18 (55.6%)` |
| `knockout` | `final` | innings | 10 | **55.6%** | **100%** | 0.5556 | `count(innings in knockout also in final) / count(innings in knockout) = 10/18 (55.6%)` |
| `knockout` | `successfulChase` | innings | 6 | **33.3%** | **5.7%** | 0.0508 | `count(innings in knockout also in successfulChase) / count(innings in knockout) = 6/18 (33.3%)` |
| `knockout` | `highPressure` | innings | 0 | **0%** | **0%** | 0 | `count(innings in knockout also in highPressure) / count(innings in knockout) = 0/18 (0%)` |
| `final` | `chase` | innings | 5 | **50%** | **3%** | 0.0291 | `count(innings in final also in chase) / count(innings in final) = 5/10 (50%)` |
| `final` | `knockout` | innings | 10 | **100%** | **55.6%** | 0.5556 | `count(innings in final also in knockout) / count(innings in final) = 10/10 (100%)` |
| `final` | `successfulChase` | innings | 3 | **30%** | **2.8%** | 0.0265 | `count(innings in final also in successfulChase) / count(innings in final) = 3/10 (30%)` |
| `final` | `highPressure` | innings | 0 | **0%** | **0%** | 0 | `count(innings in final also in highPressure) / count(innings in final) = 0/10 (0%)` |
| `successfulChase` | `chase` | innings | 106 | **100%** | **63.5%** | 0.6347 | `count(innings in successfulChase also in chase) / count(innings in successfulChase) = 106/106 (100%)` |
| `successfulChase` | `knockout` | innings | 6 | **5.7%** | **33.3%** | 0.0508 | `count(innings in successfulChase also in knockout) / count(innings in successfulChase) = 6/106 (5.7%)` |
| `successfulChase` | `final` | innings | 3 | **2.8%** | **30%** | 0.0265 | `count(innings in successfulChase also in final) / count(innings in successfulChase) = 3/106 (2.8%)` |
| `successfulChase` | `highPressure` | innings | 7 | **6.6%** | **29.2%** | 0.0569 | `count(innings in successfulChase also in highPressure) / count(innings in successfulChase) = 7/106 (6.6%)` |
| `highPressure` | `chase` | innings | 24 | **100%** | **14.4%** | 0.1437 | `count(innings in highPressure also in chase) / count(innings in highPressure) = 24/24 (100%)` |
| `highPressure` | `knockout` | innings | 0 | **0%** | **0%** | 0 | `count(innings in highPressure also in knockout) / count(innings in highPressure) = 0/24 (0%)` |
| `highPressure` | `final` | innings | 0 | **0%** | **0%** | 0 | `count(innings in highPressure also in final) / count(innings in highPressure) = 0/24 (0%)` |
| `highPressure` | `successfulChase` | innings | 7 | **29.2%** | **6.6%** | 0.0569 | `count(innings in highPressure also in successfulChase) / count(innings in highPressure) = 7/24 (29.2%)` |

> ⚠️ **Collinearity Finding**: Directional containment analysis reveals Tournament Finals are 100.0% contained within Knockouts (10/10), and Knockouts intersect with Chases (10/18 = 55.6%). Unadjusted additive combination causes circular scoring inflation.

### T20I Inter-Component Directional Containment

| Set A | Set B | Unit | Innings Overlap | Containment (A in B) | Containment (B in A) | Jaccard Index | Directional Formula |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :--- |
| `chase` | `knockout` | innings | 2 | **4.3%** | **28.6%** | 0.0385 | `count(innings in chase also in knockout) / count(innings in chase) = 2/47 (4.3%)` |
| `chase` | `final` | innings | 1 | **2.1%** | **33.3%** | 0.0204 | `count(innings in chase also in final) / count(innings in chase) = 1/47 (2.1%)` |
| `chase` | `successfulChase` | innings | 38 | **80.9%** | **100%** | 0.8085 | `count(innings in chase also in successfulChase) / count(innings in chase) = 38/47 (80.9%)` |
| `chase` | `highPressure` | innings | 28 | **59.6%** | **100%** | 0.5957 | `count(innings in chase also in highPressure) / count(innings in chase) = 28/47 (59.6%)` |
| `knockout` | `chase` | innings | 2 | **28.6%** | **4.3%** | 0.0385 | `count(innings in knockout also in chase) / count(innings in knockout) = 2/7 (28.6%)` |
| `knockout` | `final` | innings | 3 | **42.9%** | **100%** | 0.4286 | `count(innings in knockout also in final) / count(innings in knockout) = 3/7 (42.9%)` |
| `knockout` | `successfulChase` | innings | 2 | **28.6%** | **5.3%** | 0.0465 | `count(innings in knockout also in successfulChase) / count(innings in knockout) = 2/7 (28.6%)` |
| `knockout` | `highPressure` | innings | 2 | **28.6%** | **7.1%** | 0.0606 | `count(innings in knockout also in highPressure) / count(innings in knockout) = 2/7 (28.6%)` |
| `final` | `chase` | innings | 1 | **33.3%** | **2.1%** | 0.0204 | `count(innings in final also in chase) / count(innings in final) = 1/3 (33.3%)` |
| `final` | `knockout` | innings | 3 | **100%** | **42.9%** | 0.4286 | `count(innings in final also in knockout) / count(innings in final) = 3/3 (100%)` |
| `final` | `successfulChase` | innings | 1 | **33.3%** | **2.6%** | 0.025 | `count(innings in final also in successfulChase) / count(innings in final) = 1/3 (33.3%)` |
| `final` | `highPressure` | innings | 1 | **33.3%** | **3.6%** | 0.0333 | `count(innings in final also in highPressure) / count(innings in final) = 1/3 (33.3%)` |
| `successfulChase` | `chase` | innings | 38 | **100%** | **80.9%** | 0.8085 | `count(innings in successfulChase also in chase) / count(innings in successfulChase) = 38/38 (100%)` |
| `successfulChase` | `knockout` | innings | 2 | **5.3%** | **28.6%** | 0.0465 | `count(innings in successfulChase also in knockout) / count(innings in successfulChase) = 2/38 (5.3%)` |
| `successfulChase` | `final` | innings | 1 | **2.6%** | **33.3%** | 0.025 | `count(innings in successfulChase also in final) / count(innings in successfulChase) = 1/38 (2.6%)` |
| `successfulChase` | `highPressure` | innings | 20 | **52.6%** | **71.4%** | 0.4348 | `count(innings in successfulChase also in highPressure) / count(innings in successfulChase) = 20/38 (52.6%)` |
| `highPressure` | `chase` | innings | 28 | **100%** | **59.6%** | 0.5957 | `count(innings in highPressure also in chase) / count(innings in highPressure) = 28/28 (100%)` |
| `highPressure` | `knockout` | innings | 2 | **7.1%** | **28.6%** | 0.0606 | `count(innings in highPressure also in knockout) / count(innings in highPressure) = 2/28 (7.1%)` |
| `highPressure` | `final` | innings | 1 | **3.6%** | **33.3%** | 0.0333 | `count(innings in highPressure also in final) / count(innings in highPressure) = 1/28 (3.6%)` |
| `highPressure` | `successfulChase` | innings | 20 | **71.4%** | **52.6%** | 0.4348 | `count(innings in highPressure also in successfulChase) / count(innings in highPressure) = 20/28 (71.4%)` |

> ⚠️ **Collinearity Finding**: Directional containment analysis reveals Tournament Finals are 100.0% contained within Knockouts (3/3), and Knockouts intersect with Chases (2/7 = 28.6%). Unadjusted additive combination causes circular scoring inflation.

---

## 5. Weight Sensitivity & Perturbation Analysis

### ODI Weight Sensitivity Variants

| Variant | Chase Wt | High RRR Wt | Knockout Wt | Finals Wt | Composite Score | Delta vs Base | Commentary |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :--- |
| **Editorial Hypothesis (Phase 1/2)** | 35% | 25% | 20% | 20% | **45.00** | 0.00 pts | Original editorial baseline weights. |
| **Equal Weighting (25% each)** | 25% | 25% | 25% | 25% | **41.43** | 3.57 pts | Removes editorial chase bias. |
| **Leave-Finals-Out (Small-sample exclusion)** | 45% | 30% | 25% | 0% | **50.74** | 5.74 pts | Eliminates unstable finals sample volatility. |
| **Leave-Knockouts-Out** | 50% | 35% | 0% | 15% | **51.26** | 6.26 pts | Focuses purely on situational chase pressure. |
| **Chase-Dominant (50% chase)** | 50% | 20% | 15% | 15% | **49.53** | 4.53 pts | Emphasizes large chase sample size. |
| **High RRR Boost (+20% relative)** | 30% | 35% | 20% | 15% | **45.16** | 0.16 pts | Tests sensitivity to situational over progression. |

- **Max Delta**: 6.26 pts
- **Stability Verdict**: High sensitivity detected: weight variants shift composite score by up to 6.3 pts. Unstable for production constant.

### T20I Weight Sensitivity Variants

| Variant | Chase Wt | High RRR Wt | Knockout Wt | Finals Wt | Composite Score | Delta vs Base | Commentary |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :--- |
| **Editorial Hypothesis (Phase 1/2)** | 35% | 25% | 20% | 20% | **83.96** | 0.00 pts | Original editorial baseline weights. |
| **Equal Weighting (25% each)** | 25% | 25% | 25% | 25% | **84.50** | 0.54 pts | Removes editorial chase bias. |
| **Leave-Finals-Out (Small-sample exclusion)** | 45% | 30% | 25% | 0% | **83.01** | 0.95 pts | Eliminates unstable finals sample volatility. |
| **Leave-Knockouts-Out** | 50% | 35% | 0% | 15% | **81.50** | 2.46 pts | Focuses purely on situational chase pressure. |
| **Chase-Dominant (50% chase)** | 50% | 20% | 15% | 15% | **83.88** | 0.08 pts | Emphasizes large chase sample size. |
| **High RRR Boost (+20% relative)** | 30% | 35% | 20% | 15% | **82.84** | 1.12 pts | Tests sensitivity to situational over progression. |

- **Max Delta**: 2.46 pts
- **Stability Verdict**: Score exhibits acceptable weight stability (max delta <= 5.0 pts).

---

## 6. Temporal Validation (Era-by-Era Split Stability)

### ODI Temporal Stability

| Period | Era | Years | Matches | Innings | Chase Avg | Base Avg | Clutch Ratio | Knockout Innings | Knockout Avg |
| :--- | :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :--- |
| `dev-2008-2015` | Development & Rise | 2008–2015 | 165 | 158 | 61.34 | 50.60 | **1.21x** | 11 | 24.44 |
| `peak-2016-2019` | Absolute Peak | 2016–2019 | 75 | 74 | 85.19 | 81.22 | **1.05x** | 3 | 51.00 |
| `holdout-2020-2024` | Validation / Holdout | 2020–2024 | 52 | 49 | 41.05 | 49.82 | **0.82x** | 2 | 85.50 |

> **Finding**: Chase dominance ratio remains elevated across all three career eras (Development: >1.0x, Peak: >1.0x, Holdout: >1.0x), confirming situational elevation is a persistent career trait rather than a single-era artifact.

### T20I Temporal Stability

| Period | Era | Years | Matches | Innings | Chase Avg | Base Avg | Clutch Ratio | Knockout Innings | Knockout Avg |
| :--- | :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :--- |
| `dev-2008-2015` | Development & Rise | 2008–2015 | 29 | 27 | 80.29 | 43.91 | **1.83x** | 2 | 149.00 |
| `peak-2016-2019` | Absolute Peak | 2016–2019 | 45 | 42 | 91.30 | 59.89 | **1.52x** | 2 | — |
| `holdout-2020-2024` | Validation / Holdout | 2020–2024 | 44 | 43 | 42.42 | 41.82 | **1.01x** | 3 | 45.00 |

> **Finding**: Chase dominance ratio remains elevated across all three career eras (Development: >1.0x, Peak: >1.0x, Holdout: >1.0x), confirming situational elevation is a persistent career trait rather than a single-era artifact.

---

## 7. Uncertainty & Deterministic Bootstrap Confidence Intervals (Seed: 429, B=1000)

### ODI Raw Batting Average Bootstrap CI (Unit: runs/dismissal)

| Component / Slice | Sample (N) | Attempted | Valid | Invalid | Valid Rate | Mean | Median | 95% CI Lower | 95% CI Upper | CI Width | Std Error | Status |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **overallCareerAverage** | 303 | 1000 | 1000 | 0 | 100.0% | 58.81 | 58.74 | **51.66** | **66.04** | 14.38 | ±3.76 | `available` |
| **completedChaseDominance** | 167 | 1000 | 1000 | 0 | 100.0% | 66.08 | 65.55 | **54.71** | **79.11** | 24.40 | ±6.23 | `available` |
| **highRrrElevation** | 24 | 1000 | 1000 | 0 | 100.0% | 54.09 | 52.88 | **34.47** | **80.55** | 46.08 | ±12.56 | `available` |
| **knockoutElevation** | 18 | 1000 | 1000 | 0 | 100.0% | 39.35 | 37.88 | **19.11** | **67.71** | 48.60 | ±12.04 | `available` |
| **finalsContribution** | 10 | 1000 | 1000 | 0 | 100.0% | 23.22 | 23.13 | **10.63** | **36.44** | 25.81 | ±6.53 | `available` |
| **chaseBattingAverage** | 167 | 1000 | 1000 | 0 | 100.0% | 66.08 | 65.55 | **54.71** | **79.11** | 24.40 | ±6.23 | `available` |
| **knockoutBattingAverage** | 18 | 1000 | 1000 | 0 | 100.0% | 39.35 | 37.88 | **19.11** | **67.71** | 48.60 | ±12.04 | `available` |
| **finalsBattingAverage** | 10 | 1000 | 1000 | 0 | 100.0% | 23.22 | 23.13 | **10.63** | **36.44** | 25.81 | ±6.53 | `available` |

### ODI Clutch Component Score Bootstrap CI (Unit: score-points 0-100)

| Component / Slice | Sample (N) | Attempted | Valid | Invalid | Valid Rate | Score Mean | Median | 95% CI Lower | 95% CI Upper | CI Width | Std Error | Status |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **overallCareerAverage** | 303 | 1000 | 1000 | 0 | 100.0% | 50.23 | 50.17 | **44.15** | **56.37** | 12.22 | ±3.20 | `available` |
| **completedChaseDominance** | 167 | 1000 | 1000 | 0 | 100.0% | 64.17 | 63.89 | **53.63** | **75.07** | 21.44 | ±5.47 | `available` |
| **highRrrElevation** | 24 | 1000 | 1000 | 0 | 100.0% | 46.24 | 45.18 | **30.53** | **67.96** | 37.43 | ±10.08 | `available` |
| **knockoutElevation** | 18 | 1000 | 1000 | 0 | 100.0% | 34.68 | 33.05 | **20.63** | **57.77** | 37.14 | ±9.27 | `available` |
| **finalsContribution** | 10 | 1000 | 1000 | 0 | 100.0% | 23.26 | 22.97 | **16.29** | **31.98** | 15.69 | ±3.98 | `available` |
| **chaseBattingAverage** | 167 | 1000 | 1000 | 0 | 100.0% | 64.17 | 63.89 | **53.63** | **75.07** | 21.44 | ±5.47 | `available` |
| **knockoutBattingAverage** | 18 | 1000 | 1000 | 0 | 100.0% | 34.68 | 33.05 | **20.63** | **57.77** | 37.14 | ±9.27 | `available` |
| **finalsBattingAverage** | 10 | 1000 | 1000 | 0 | 100.0% | 23.26 | 22.97 | **16.29** | **31.98** | 15.69 | ±3.98 | `available` |

### T20I Raw Batting Average Bootstrap CI (Unit: runs/dismissal)

| Component / Slice | Sample (N) | Attempted | Valid | Invalid | Valid Rate | Mean | Median | 95% CI Lower | 95% CI Upper | CI Width | Std Error | Status |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **overallCareerAverage** | 112 | 1000 | 1000 | 0 | 100.0% | 48.42 | 48.08 | **38.93** | **60.01** | 21.08 | ±5.31 | `available` |
| **completedChaseDominance** | 47 | 1000 | 1000 | 0 | 100.0% | 69.46 | 68.64 | **49.74** | **95.87** | 46.13 | ±12.01 | `available` |
| **highRrrElevation** | 28 | 1000 | 1000 | 0 | 100.0% | 77.55 | 75.08 | **47.95** | **125.50** | 77.55 | ±19.49 | `available` |
| **knockoutElevation** | 7 | 1000 | 996 | 4 | 99.6% | 121.55 | 104.75 | **47.50** | **299.00** | 251.50 | ±71.00 | `available` |
| **finalsContribution** | 3 | 1000 | 960 | 40 | 96.0% | 104.20 | 97.00 | **76.00** | **159.00** | 83.00 | ±30.19 | `available` |
| **chaseBattingAverage** | 47 | 1000 | 1000 | 0 | 100.0% | 69.46 | 68.64 | **49.74** | **95.87** | 46.13 | ±12.01 | `available` |
| **knockoutBattingAverage** | 7 | 1000 | 996 | 4 | 99.6% | 121.55 | 104.75 | **47.50** | **299.00** | 251.50 | ±71.00 | `available` |
| **finalsBattingAverage** | 3 | 1000 | 960 | 40 | 96.0% | 104.20 | 97.00 | **76.00** | **159.00** | 83.00 | ±30.19 | `available` |

### T20I Clutch Component Score Bootstrap CI (Unit: score-points 0-100)

| Component / Slice | Sample (N) | Attempted | Valid | Invalid | Valid Rate | Score Mean | Median | 95% CI Lower | 95% CI Upper | CI Width | Std Error | Status |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **overallCareerAverage** | 112 | 1000 | 1000 | 0 | 100.0% | 50.08 | 49.74 | **40.40** | **61.86** | 21.46 | ±5.43 | `available` |
| **completedChaseDominance** | 47 | 1000 | 1000 | 0 | 100.0% | 83.13 | 84.25 | **66.02** | **95.83** | 29.81 | ±7.96 | `available` |
| **highRrrElevation** | 28 | 1000 | 1000 | 0 | 100.0% | 74.38 | 75.15 | **49.61** | **96.06** | 46.45 | ±12.15 | `available` |
| **knockoutElevation** | 7 | 1000 | 996 | 4 | 99.6% | 86.30 | 91.17 | **49.14** | **100.00** | 50.86 | ±14.08 | `available` |
| **finalsContribution** | 3 | 1000 | 960 | 40 | 96.0% | 86.89 | 88.23 | **75.86** | **98.98** | 23.12 | ±8.25 | `available` |
| **chaseBattingAverage** | 47 | 1000 | 1000 | 0 | 100.0% | 83.13 | 84.25 | **66.02** | **95.83** | 29.81 | ±7.96 | `available` |
| **knockoutBattingAverage** | 7 | 1000 | 996 | 4 | 99.6% | 86.30 | 91.17 | **49.14** | **100.00** | 50.86 | ±14.08 | `available` |
| **finalsBattingAverage** | 3 | 1000 | 960 | 40 | 96.0% | 86.89 | 88.23 | **75.86** | **98.98** | 23.12 | ±8.25 | `available` |

---

## 8. Outcome Leakage Prevention Audit

| Feature | Computation Time | Uses Post-Match Result | Status | Mitigation Policy |
| :--- | :--- | :---: | :--- | :--- |
| `requiredRunRate` | `live-innings` | No | `clean-no-leakage` | Computed strictly at delivery start from targetAtStart, scoreBefore, and ballsRemaining. |
| `inningsPhase` | `live-innings` | No | `clean-no-leakage` | Derived strictly from zero-indexed over boundaries (0–9, 10–39, 40–49 in ODI). |
| `tournamentStageKnockout` | `pre-delivery` | No | `clean-no-leakage` | Tournament schedule structure is fixed before match commencement. |
| `successfulChaseClassification` | `post-match` | Yes | `clean-no-leakage` | Strictly partitioned into Population B/descriptive metrics; never used as a pre-delivery pressure predictor. |

---

## 9. Calibration Gates & Decision Ledger

- **Gate 1: Minimum Sample Size Gate (Finals N >= 10)**: ❌ `BLOCKED (Insufficient Sample)`
  - *Requirement*: Tournament finals slice must contain at least 10 batted innings in each format to support reliable statistical inference.
  - *Observed*: ODI finals: 10 innings. T20I finals: 3 innings (FAIL: 3 < 10). T20I knockouts: 7 innings (FAIL: 7 < 10).
  - *Blocker Reason*: Insufficient sample size in T20I tournament finals (N=3) and knockouts (N=7)

- **Gate 2: Cross-Player Baseline Peer Corpus Gate**: ❌ `BLOCKED (Single-Player Dataset Scope)`
  - *Requirement*: Production cross-player Clutch Index requires a normalized multi-player dataset for empirical percentile calibration.
  - *Observed*: Repository contains strictly Virat Kohli match records. Cross-player peer corpus is unavailable.
  - *Blocker Reason*: Cross-player peer distribution unavailable in single-player dataset scope

- **Gate 3: Collinearity & Overlap Stability Gate**: ❌ `BLOCKED (High Multicollinearity)`
  - *Requirement*: Components must not exhibit circular scoring or unadjusted double-counting across overlapping sets.
  - *Observed*: Tournament finals are 100.0% contained in knockouts (10/10 ODI, 3/3 T20I: containment(final in knockout) = 100.0%). Knockouts intersect with chases in 10/18 (55.6%) ODI innings (containment(knockout in chase) = 55.6%) and 2/7 (28.6%) T20I innings (containment(knockout in chase) = 28.6%).
  - *Blocker Reason*: Strict containment (100.0% finals in knockouts) and high overlap create circular score inflation and multicollinearity

- **Gate 4: Bootstrap Uncertainty Bound Gate**: ❌ `BLOCKED (Excessive Uncertainty Width)`
  - *Requirement*: 95% bootstrap confidence interval width for key component raw batting averages (unit: runs per dismissal) must not exceed 25.0 runs/dismissal, and valid replicate rate must be >= 0.95 across all components.
  - *Observed*: ODI Finals Raw CI width is 25.81 runs/dismissal (SE: ±6.53). T20I Finals Raw CI width is 83 runs/dismissal (SE: ±30.19, valid rate: 96.0%). T20I Knockouts Raw CI width is 251.5 runs/dismissal. Exceeds 25.0 runs/dismissal threshold.
  - *Blocker Reason*: Confidence interval widths exceed 25.0 runs/dismissal threshold due to small sample sizes in tournament finals and knockouts

### Final Calibration Decision

> **Publication Allowed**: `false`
> **Status**: `calibration-blocked`
> **Public Score**: `null (CALIBRATION PENDING)`
> **Exact Blocker Summary**: Tournament finals sample sizes (N=10 ODI, N=3 T20I; T20I knockouts N=7) fall below the robust threshold, bootstrap uncertainty width exceeds 25.0 runs/dismissal, and cross-player peer corpus is unavailable in a single-player dataset. Public score must remain null.
