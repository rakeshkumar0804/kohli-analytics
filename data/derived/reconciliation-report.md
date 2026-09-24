# Virat Kohli Analytics — Match-Level Data Reconciliation Report

- **Report Version**: `4.0.0`
- **Dataset ID**: `cricsheet-male-limited-overs`
- **Generated At**: `2026-09-24T12:19:03.820Z`
- **Player**: Virat Kohli (Cricsheet: `ba607b88`, ESPNcricinfo: `253802`)
- **Trust Status**: `CAREER AGGREGATES VERIFIED; DELIVERY COVERAGE PARTIAL`

---

## Scoped Trust Architecture

| Analytics Scope | Status | isTrusted | Basis / Detail |
| :--- | :--- | :---: | :--- |
| **Career Aggregates** | `verified` | ✅ true | cricsheet-plus-scorecard-reconciliation |
| **Archive Deliveries** | `verified-partial-coverage` | ✅ true | completeness: `partial` |
| **Pressure Analytics** | `production-data-partial-coverage` | ✅ true | Delivery situational results exclude unavailable matches |
| **Clutch Index** | `calibration-pending` | ❌ false | Model weights under active calibration |

## Explicit Coverage Summary

- **Overall Matches**: 429 of 439 reference matches (97.72% coverage, 10 unavailable matches)
- **Overall Batting Innings**: 412 of 419 reference innings (98.33% coverage, 7 unavailable batting innings)
- **ODI Coverage**: 311 of 314 matches (99.04%), 300 of 302 innings (99.34%)
- **T20I Coverage**: 118 of 125 matches (94.4%), 112 of 117 innings (95.73%)

---

## ODI Format Reconciliation Ledger

### Aggregate Comparison & Direct Reconciliation Equations

| Metric | Canonical Reference (Target) | Ingested Archive | Unavailable Matches | Verified Corrections | Reconciled Sum | Equation Balance | Status |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **matches** | 314 | 311 | 3 | 0 | 314 | `311 + 3 + 0 = 314` | resolved-reconciled |
| **innings** | 302 | 300 | 2 | 0 | 302 | `300 + 2 + 0 = 302` | resolved-reconciled |
| **runs** | 14941 | 14819 | 122 | 0 | 14941 | `14819 + 122 + 0 = 14941` | resolved-reconciled |
| **ballsFaced** | 15903 | 15784 | 119 | 0 | 15903 | `15784 + 119 + 0 = 15903` | resolved-reconciled |
| **centuries** | 54 | 54 | 0 | 0 | 54 | `54 + 0 + 0 = 54` | resolved-reconciled |
| **fifties** | 79 | 77 | 2 | 0 | 79 | `77 + 2 + 0 = 79` | resolved-reconciled |
| **ducks** | 18 | 18 | 0 | 0 | 18 | `18 + 0 + 0 = 18` | resolved-reconciled |
| **fours** | 1389 | 1378 | 11 | 0 | 1389 | `1378 + 11 + 0 = 1389` | resolved-reconciled |
| **sixes** | 171 | 171 | 0 | 0 | 171 | `171 + 0 + 0 = 171` | resolved-reconciled |
| **notOuts** | 47 | 46 | 1 | 0 | 47 | `46 + 1 + 0 = 47` | resolved-reconciled |
| **dismissals** | 255 | 254 | 1 | 0 | 255 | `254 + 1 + 0 = 255` | resolved-reconciled |

### Missing Reference Matches for ODI

| Match ID | Date | Opponent | Event | Appearance | Batted/DNB | R (B) | 4s | 6s | 50/100 | Dismissal | Reason |
| :--- | :--- | :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :--- | :--- |
| [1144510](https://www.espncricinfo.com/series/icc-cricket-world-cup-2019-1144415/afghanistan-vs-india-28th-match-1144510/full-scorecard) | 2019-06-22 | Afghanistan | ICC Cricket World Cup 2019 (28th Match) | Yes | Batted | 67 (63) | 5 | 0 | 50 | c Rahmat Shah b Mohammad Nabi | Excluded from odis_male_json.zip due to Cricsheet archive partitioning of Afghanistan ODI matches |
| [1384390](https://www.espncricinfo.com/series/icc-cricket-world-cup-2023-24-1384392/india-vs-afghanistan-9th-match-1384390/full-scorecard) | 2023-10-11 | Afghanistan | ICC Cricket World Cup 2023/24 (9th Match) | Yes | Batted | 55 (56) | 6 | 0 | 50 | not out | Excluded from odis_male_json.zip due to Cricsheet archive partitioning of Afghanistan ODI matches |
| [710305](https://www.espncricinfo.com/series/asia-cup-2013-14-656463/afghanistan-vs-india-9th-match-710305/full-scorecard) | 2014-03-05 | Afghanistan | Asia Cup 2013/14 (9th Match) | Yes | DNB | DNB | 0 | 0 | - | Did Not Bat (India 160/2 in 32.2 ov) | Excluded from odis_male_json.zip due to Cricsheet archive partitioning of Afghanistan ODI matches |

### Verified Delivery Evidence Records for ODI

| Match ID | Date | Opponent | Metric | Delivery | Runs | Classification | Evidence URL |
| :--- | :--- | :--- | :--- | :--- | :---: | :--- | :--- |
| [643667](https://www.espncricinfo.com/series/india-tour-of-zimbabwe-2013-643663/zimbabwe-vs-india-2nd-odi-643667/full-scorecard) | 2013-07-26 | Zimbabwe | fours | `6.1 (Over 6 Ball 1)` | 4 | All-run 4 (non_boundary: true in Cricsheet schema). Excluded from boundary fours per official ICC/Statsguru scoring rules. | [Scorecard](https://www.espncricinfo.com/series/india-tour-of-zimbabwe-2013-643663/zimbabwe-vs-india-2nd-odi-643667/full-scorecard) |
| [535798](https://www.espncricinfo.com/series/asia-cup-2011-12-535797/india-vs-pakistan-5th-match-535798/full-scorecard) | 2012-03-18 | Pakistan | sixes | `18.1 (Over 18 Ball 1)` | 6 | All-run/overthrows 6 (non_boundary: true in Cricsheet schema). Excluded from boundary sixes per official ICC/Statsguru scoring rules. | [Scorecard](https://www.espncricinfo.com/series/asia-cup-2011-12-535797/india-vs-pakistan-5th-match-535798/full-scorecard) |
| [564784](https://www.espncricinfo.com/series/india-tour-of-sri-lanka-2012-564778/sri-lanka-vs-india-4th-odi-564784/full-scorecard) | 2012-07-31 | Sri Lanka | sixes | `18.2 (Over 18 Ball 2)` | 6 | All-run/overthrows 6 (non_boundary: true in Cricsheet schema). Excluded from boundary sixes per official ICC/Statsguru scoring rules. | [Scorecard](https://www.espncricinfo.com/series/india-tour-of-sri-lanka-2012-564778/sri-lanka-vs-india-4th-odi-564784/full-scorecard) |

**Dismissal Invariant Verification for ODI**:
- Ingested Archive: $\text{innings} (300) - \text{notOuts} (46) = 254 \equiv \text{dismissals} (254)$
- Unavailable Matches: $\text{innings} (2) - \text{notOuts} (1) = 1 \equiv \text{dismissals} (1)$
- Reconstructed Career: $\text{innings} (302) - \text{notOuts} (47) = 255 \equiv \text{dismissals} (255)$
- Canonical Reference: $\text{innings} (302) - \text{notOuts} (47) = 255 \equiv \text{dismissals} (255)$

## T20I Format Reconciliation Ledger

### Aggregate Comparison & Direct Reconciliation Equations

| Metric | Canonical Reference (Target) | Ingested Archive | Unavailable Matches | Verified Corrections | Reconciled Sum | Equation Balance | Status |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **matches** | 125 | 118 | 7 | 0 | 125 | `118 + 7 + 0 = 125` | resolved-reconciled |
| **innings** | 117 | 112 | 5 | 0 | 117 | `112 + 5 + 0 = 117` | resolved-reconciled |
| **runs** | 4188 | 3963 | 225 | 0 | 4188 | `3963 + 225 + 0 = 4188` | resolved-reconciled |
| **ballsFaced** | 3056 | 2915 | 141 | 0 | 3056 | `2915 + 141 + 0 = 3056` | resolved-reconciled |
| **centuries** | 1 | 0 | 1 | 0 | 1 | `0 + 1 + 0 = 1` | resolved-reconciled |
| **fifties** | 38 | 37 | 1 | 0 | 38 | `37 + 1 + 0 = 38` | resolved-reconciled |
| **ducks** | 7 | 6 | 1 | 0 | 7 | `6 + 1 + 0 = 7` | resolved-reconciled |
| **fours** | 369 | 348 | 21 | 0 | 369 | `348 + 21 + 0 = 369` | resolved-reconciled |
| **sixes** | 124 | 115 | 9 | 0 | 124 | `115 + 9 + 0 = 124` | resolved-reconciled |
| **notOuts** | 31 | 30 | 1 | 0 | 31 | `30 + 1 + 0 = 31` | resolved-reconciled |
| **dismissals** | 86 | 82 | 4 | 0 | 86 | `82 + 4 + 0 = 86` | resolved-reconciled |

### Missing Reference Matches for T20I

| Match ID | Date | Opponent | Event | Appearance | Batted/DNB | R (B) | 4s | 6s | 50/100 | Dismissal | Reason |
| :--- | :--- | :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :--- | :--- |
| [533275](https://www.espncricinfo.com/series/icc-world-twenty20-2012-13-533272/afghanistan-vs-india-3rd-match-group-a-533275/full-scorecard) | 2012-09-19 | Afghanistan | ICC World Twenty20 2012/13 (Group A) | Yes | Batted | 50 (39) | 4 | 2 | 50 | c Mohammad Nabi b Shapoor Zadran | Excluded from t20s_male_json.zip due to Cricsheet archive partitioning of Afghanistan T20I matches |
| [1273744](https://www.espncricinfo.com/series/icc-men-s-t20-world-cup-2021-22-1267897/afghanistan-vs-india-33rd-match-group-2-1273744/full-scorecard) | 2021-11-03 | Afghanistan | ICC Men's T20 World Cup 2021/22 (Group 2) | Yes | DNB | DNB | 0 | 0 | - | Did Not Bat (India 210/2 in 20 ov) | Excluded from t20s_male_json.zip due to Cricsheet archive partitioning of Afghanistan T20I matches |
| [1327278](https://www.espncricinfo.com/series/asia-cup-2022-1327268/afghanistan-vs-india-10th-match-super-four-1327278/full-scorecard) | 2022-09-08 | Afghanistan | Asia Cup 2022 (Super Four 10th Match) | Yes | Batted | 122 (61) | 12 | 6 | 100 | not out (122* career high score) | Excluded from t20s_male_json.zip due to Cricsheet archive partitioning of Afghanistan T20I matches |
| [1389397](https://www.espncricinfo.com/series/afghanistan-in-india-2023-24-1389386/india-vs-afghanistan-2nd-t20i-1389397/full-scorecard) | 2024-01-14 | Afghanistan | Afghanistan in India T20I Series (2nd T20I) | Yes | Batted | 29 (16) | 5 | 0 | - | c Ibrahim Zadran b Naveen-ul-Haq | Excluded from t20s_male_json.zip due to Cricsheet archive partitioning of Afghanistan T20I matches |
| [1389398](https://www.espncricinfo.com/series/afghanistan-in-india-2023-24-1389386/india-vs-afghanistan-3rd-t20i-1389398/full-scorecard) | 2024-01-17 | Afghanistan | Afghanistan in India T20I Series (3rd T20I) | Yes | Batted | 0 (1) | 0 | 0 | Duck | c Ibrahim Zadran b Fareed Ahmad | Excluded from t20s_male_json.zip due to Cricsheet archive partitioning of Afghanistan T20I matches |
| [1415743](https://www.espncricinfo.com/series/icc-men-s-t20-world-cup-2024-1411166/afghanistan-vs-india-43rd-match-super-eights-group-1-1415743/full-scorecard) | 2024-06-20 | Afghanistan | ICC Men's T20 World Cup 2024 (Super 8 Group 1) | Yes | Batted | 24 (24) | 0 | 1 | - | c Mohammad Nabi b Rashid Khan | Excluded from t20s_male_json.zip due to Cricsheet archive partitioning of Afghanistan T20I matches |
| [1202242](https://www.espncricinfo.com/series/sri-lanka-tour-of-india-2019-20-1198472/india-vs-sri-lanka-1st-t20i-1202242/full-scorecard) | 2020-01-05 | Sri Lanka | Sri Lanka in India T20I Series 2019/20 (1st T20I) | Yes | DNB | DNB | 0 | 0 | - | Match abandoned after toss due to wet pitch (India elected to field) | Excluded from t20s_male_json.zip because match was abandoned after toss without play |
| [1415733](https://www.espncricinfo.com/series/icc-men-s-t20-world-cup-2024-1411166/canada-vs-india-33rd-match-group-a-1415733/full-scorecard) | 2024-06-15 | Canada | ICC Men's T20 World Cup 2024 (Group A) | No (No-toss fixture: 0 appearances) | DNB | DNB | 0 | 0 | - | Match abandoned without toss or ball bowled (wet outfield) | Excluded from t20s_male_json.zip because match was abandoned without toss or play |

**Dismissal Invariant Verification for T20I**:
- Ingested Archive: $\text{innings} (112) - \text{notOuts} (30) = 82 \equiv \text{dismissals} (82)$
- Unavailable Matches: $\text{innings} (5) - \text{notOuts} (1) = 4 \equiv \text{dismissals} (4)$
- Reconstructed Career: $\text{innings} (117) - \text{notOuts} (31) = 86 \equiv \text{dismissals} (86)$
- Canonical Reference: $\text{innings} (117) - \text{notOuts} (31) = 86 \equiv \text{dismissals} (86)$

## Distinct Analytical Populations & Delivery Bridge Accounting

### ODI Analytical Populations

| Population | Description | Innings | Official Balls | Legal Deliveries | Runs | Dismissals | Batting Avg | Batting SR |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Population A (Batting Chases)** | All innings Kohli batted in chases | 165 | 8984 | 8966 | 8444 | 130 | 64.95 | 93.99 |
| **Population B (Completed Outcomes)** | Completed match outcomes (W/L/T) | 165 | — | — | — | — | — | 63.03% win rate (104W / 165 matches) |
| **Population C (Pressure Deliveries)** | Valid finite target, balls remaining > 0 | 165 | 8982 | 8964 | 8442 | 130 | 64.94 | 93.99 |

**Delivery Count Bridges for ODI**:
1. $\text{rawStrikerDeliveries} (9165) - \text{wides} (181) = \mathbf{8984\text{ official balls faced}}$
2. $\text{officialBallsFaced} (8984) - \text{noBalls} (18) - \text{invalidContext} (2) = \mathbf{8964\text{ pressure legal deliveries}}$
3. $\text{pressureDeliveries} (9163) = \mathbf{8964\text{ legal}} + \mathbf{18\text{ no-balls}} + \mathbf{181\text{ wides}}$

### T20I Analytical Populations

| Population | Description | Innings | Official Balls | Legal Deliveries | Runs | Dismissals | Batting Avg | Batting SR |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Population A (Batting Chases)** | All innings Kohli batted in chases | 47 | 1459 | 1448 | 1984 | 29 | 68.41 | 135.98 |
| **Population B (Completed Outcomes)** | Completed match outcomes (W/L/T) | 47 | — | — | — | — | — | 80.85% win rate (38W / 47 matches) |
| **Population C (Pressure Deliveries)** | Valid finite target, balls remaining > 0 | 47 | 1459 | 1448 | 1984 | 29 | 68.41 | 135.98 |

**Delivery Count Bridges for T20I**:
1. $\text{rawStrikerDeliveries} (1502) - \text{wides} (43) = \mathbf{1459\text{ official balls faced}}$
2. $\text{officialBallsFaced} (1459) - \text{noBalls} (11) - \text{invalidContext} (0) = \mathbf{1448\text{ pressure legal deliveries}}$
3. $\text{pressureDeliveries} (1502) = \mathbf{1448\text{ legal}} + \mathbf{11\text{ no-balls}} + \mathbf{43\text{ wides}}$

## Target Derivation & Reprocessed T20I Matches

| Match ID | Date | Opponent | First Inn Total | Target | Source | Overs | DLS Status | Kohli R (B) | Pressure Legal Balls | Result | Decision |
| :--- | :--- | :--- | :---: | :---: | :--- | :---: | :--- | :---: | :---: | :--- | :--- |
| [682921](https://cricsheet.org/matches/682921/) | 2014-03-21 | Pakistan | 130 | 131 | `derived-first-innings-plus-one` | 20 | Normal / Unrevised | 36 (32) | 32 | India won | **Included in Population C (Pressure Population)** |
| [682929](https://cricsheet.org/matches/682929/) | 2014-03-23 | West Indies | 129 | 130 | `derived-first-innings-plus-one` | 20 | Normal / Unrevised | 54 (41) | 40 | India won | **Included in Population C (Pressure Population)** |
| [682943](https://cricsheet.org/matches/682943/) | 2014-03-28 | Bangladesh | 138 | 139 | `derived-first-innings-plus-one` | 20 | Normal / Unrevised | 57 (50) | 50 | India won | **Included in Population C (Pressure Population)** |

## Outcome Classifications & Deterministic Set Hashes

| Format | Wins | Losses | Ties | No-Results | Abandoned | Total Batting Chases | Population Hash (SHA-256) |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :--- |
| **ODI** | 104 | 58 | 3 | 0 | 0 | **165** | `e4f66410cdb63a3d...` |
| **T20I** | 38 | 9 | 0 | 0 | 0 | **47** | `b4a0c772c576e77f...` |

## Production Pressure Maps (15-Cell Complete Tables)

### ODI 15-Cell Production Pressure Table

| Phase (UI Label) | RRR Band | Official Balls Faced | Team Legal Deliveries | Runs | Dismissals | Batting Avg | Batting SR | Scoring Rate (Legal) | Dot % | Bnd % | 4s | 6s | Sample Band | Trust Level |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Powerplay (Overs 1–10)** | `below-6` | 1230 | 1226 | 844 | 19 | 44.42 | 68.62 | 68.84 | 67.64% | 57.35% | 115 | 4 | `strong` | High |
| **Middle (Overs 11–40)** | `below-6` | 4049 | 4036 | 3779 | 51 | 74.10 | 93.33 | 93.63 | 44.13% | 42.76% | 347 | 38 | `strong` | High |
| **Death (Overs 41–50)** | `below-6` | 190 | 190 | 264 | 11 | 24.00 | 138.95 | 138.95 | 36.32% | 62.12% | 26 | 10 | `strong` | High |
| **Powerplay (Overs 1–10)** | `6-to-8` | 526 | 526 | 441 | 6 | 73.50 | 83.84 | 83.84 | 62.74% | 62.59% | 63 | 4 | `strong` | High |
| **Middle (Overs 11–40)** | `6-to-8` | 2191 | 2190 | 2097 | 24 | 87.38 | 95.71 | 95.75 | 39.34% | 38.72% | 179 | 16 | `strong` | High |
| **Death (Overs 41–50)** | `6-to-8` | 120 | 120 | 173 | 3 | 57.67 | 144.17 | 144.17 | 22.50% | 49.71% | 20 | 1 | `strong` | High |
| **Powerplay (Overs 1–10)** | `8-to-10` | 21 | 21 | 28 | 1 | 28.00 | 133.33 | 133.33 | 57.14% | 78.57% | 4 | 1 | `limited` | High |
| **Middle (Overs 11–40)** | `8-to-10` | 436 | 436 | 497 | 7 | 71.00 | 113.99 | 113.99 | 36.47% | 48.29% | 45 | 10 | `strong` | High |
| **Death (Overs 41–50)** | `8-to-10` | 61 | 61 | 84 | 2 | 42.00 | 137.70 | 137.70 | 29.51% | 54.76% | 7 | 3 | `strong` | High |
| **Powerplay (Overs 1–10)** | `10-to-12` | 0 | 0 | 0 | 0 | — | — | — | — | — | 0 | 0 | `insufficient` | High |
| **Middle (Overs 11–40)** | `10-to-12` | 80 | 80 | 100 | 3 | 33.33 | 125.00 | 125.00 | 33.75% | 50.00% | 8 | 3 | `strong` | High |
| **Death (Overs 41–50)** | `10-to-12` | 37 | 37 | 67 | 2 | 33.50 | 181.08 | 181.08 | 27.03% | 68.66% | 10 | 1 | `usable` | High |
| **Powerplay (Overs 1–10)** | `above-12` | 0 | 0 | 0 | 0 | — | — | — | — | — | 0 | 0 | `insufficient` | High |
| **Middle (Overs 11–40)** | `above-12` | 28 | 28 | 41 | 0 | — | 146.43 | 146.43 | 28.57% | 58.54% | 3 | 2 | `limited` | High |
| **Death (Overs 41–50)** | `above-12` | 13 | 13 | 27 | 1 | 27.00 | 207.69 | 207.69 | 23.08% | 66.67% | 0 | 3 | `limited` | High |
| **TOTAL (Sum 15 Cells)** | — | **8982** | **8964** | **8442** | **130** | **64.94** | **93.99** | **94.18** | — | — | **827** | **96** | `strong` | High |

### T20I 15-Cell Production Pressure Table

| Phase (UI Label) | RRR Band | Official Balls Faced | Team Legal Deliveries | Runs | Dismissals | Batting Avg | Batting SR | Scoring Rate (Legal) | Dot % | Bnd % | 4s | 6s | Sample Band | Trust Level |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Powerplay (Overs 1–6)** | `below-6` | 37 | 37 | 21 | 2 | 10.50 | 56.76 | 56.76 | 59.46% | 19.05% | 1 | 0 | `usable` | High |
| **Middle (Overs 7–15)** | `below-6` | 174 | 172 | 189 | 4 | 47.25 | 108.62 | 109.88 | 35.63% | 47.62% | 18 | 3 | `strong` | High |
| **Death (Overs 16–20)** | `below-6` | 76 | 75 | 122 | 1 | 122.00 | 160.53 | 162.67 | 28.95% | 63.93% | 12 | 5 | `strong` | High |
| **Powerplay (Overs 1–6)** | `6-to-8` | 141 | 140 | 143 | 1 | 143.00 | 101.42 | 102.14 | 44.68% | 50.35% | 15 | 2 | `strong` | High |
| **Middle (Overs 7–15)** | `6-to-8` | 236 | 235 | 293 | 4 | 73.25 | 124.15 | 124.68 | 21.19% | 37.54% | 20 | 5 | `strong` | High |
| **Death (Overs 16–20)** | `6-to-8` | 57 | 57 | 94 | 2 | 47.00 | 164.91 | 164.91 | 22.81% | 65.96% | 11 | 3 | `usable` | High |
| **Powerplay (Overs 1–6)** | `8-to-10` | 168 | 168 | 235 | 1 | 235.00 | 139.88 | 139.88 | 29.17% | 55.32% | 28 | 3 | `strong` | High |
| **Middle (Overs 7–15)** | `8-to-10` | 262 | 260 | 367 | 7 | 52.43 | 140.08 | 141.15 | 15.65% | 37.60% | 24 | 7 | `strong` | High |
| **Death (Overs 16–20)** | `8-to-10` | 23 | 22 | 31 | 0 | — | 134.78 | 140.91 | 30.43% | 45.16% | 2 | 1 | `limited` | High |
| **Powerplay (Overs 1–6)** | `10-to-12` | 45 | 45 | 69 | 1 | 69.00 | 153.33 | 153.33 | 33.33% | 66.67% | 7 | 3 | `usable` | High |
| **Middle (Overs 7–15)** | `10-to-12` | 126 | 125 | 181 | 1 | 181.00 | 143.65 | 144.80 | 16.67% | 45.30% | 10 | 7 | `strong` | High |
| **Death (Overs 16–20)** | `10-to-12` | 28 | 28 | 69 | 1 | 69.00 | 246.43 | 246.43 | 17.86% | 69.57% | 3 | 6 | `limited` | High |
| **Powerplay (Overs 1–6)** | `above-12` | 9 | 9 | 16 | 1 | 16.00 | 177.78 | 177.78 | 33.33% | 75.00% | 3 | 0 | `insufficient` | High |
| **Middle (Overs 7–15)** | `above-12` | 43 | 42 | 75 | 1 | 75.00 | 174.42 | 178.57 | 23.26% | 66.67% | 8 | 3 | `usable` | High |
| **Death (Overs 16–20)** | `above-12` | 34 | 33 | 79 | 2 | 39.50 | 232.35 | 239.39 | 17.65% | 73.42% | 7 | 5 | `usable` | High |
| **TOTAL (Sum 15 Cells)** | — | **1459** | **1448** | **1984** | **29** | **68.41** | **135.98** | **137.02** | — | — | **169** | **53** | `strong` | High |

## Independent Scorecard Oracle Checks

| Check ID | Match ID | Innings | Match Type | Expected Score | Actual Parsed | Oracle URL | Status |
| :--- | :--- | :---: | :--- | :--- | :--- | :--- | :---: |
| `SC-01` | 535798 | 2 | undefined | 183r 148b (22x4, 1x6) | 183r 148b (22x4, 1x6) | [Scorecard](https://www.espncricinfo.com/series/asia-cup-2011-12-524504/india-vs-pakistan-5th-match-535798/full-scorecard) | PASSED |
| `SC-02` | 518966 | 2 | undefined | 133r 86b (16x4, 2x6) | 133r 86b (16x4, 2x6) | [Scorecard](https://www.espncricinfo.com/series/commonwealth-bank-series-2011-12-518940/india-vs-sri-lanka-11th-match-518966/full-scorecard) | PASSED |
| `SC-03` | 518966 | 2 | undefined | -r -b (-x4, -x6) | 133r 86b (16x4, 2x6) | [Scorecard](https://www.espncricinfo.com/series/commonwealth-bank-series-2011-12-518940/india-vs-sri-lanka-11th-match-518966/full-scorecard) | PASSED |
| `SC-04` | 1298150 | 2 | undefined | 82r 53b (6x4, 4x6) | 82r 53b (6x4, 4x6) | [Scorecard](https://www.espncricinfo.com/series/icc-men-s-t20-world-cup-2022-23-1298134/india-vs-pakistan-16th-match-group-2-1298150/full-scorecard) | PASSED |
| `SC-05` | 1298150 | 2 | undefined | -r -b (-x4, -x6) | 82r 53b (6x4, 4x6) | [Scorecard](https://www.espncricinfo.com/series/icc-men-s-t20-world-cup-2022-23-1298134/india-vs-pakistan-16th-match-group-2-1298150/full-scorecard) | PASSED |
| `SC-06` | 1298150 | 2 | undefined | -r -b (-x4, -x6) | 82r 53b (6x4, 4x6) | [Scorecard](https://www.espncricinfo.com/series/icc-men-s-t20-world-cup-2022-23-1298134/india-vs-pakistan-16th-match-group-2-1298150/full-scorecard) | PASSED |
| `SC-07` | 1384437 | 1 | undefined | 117r 113b (9x4, 2x6) | 117r 113b (9x4, 2x6) | [Scorecard](https://www.espncricinfo.com/series/icc-cricket-world-cup-2023-24-1384392/india-vs-new-zealand-1st-semi-final-1384437/full-scorecard) | PASSED |
| `SC-08` | 1122284 | 2 | undefined | 129r 96b (19x4, 2x6) | 129r 96b (19x4, 2x6) | [Scorecard](https://www.espncricinfo.com/series/india-in-south-africa-2017-18-1122723/south-africa-vs-india-6th-odi-1122284/full-scorecard) | PASSED |
| `SC-09` | 1188626 | 2 | undefined | 114r 99b (14x4, 0x6) | 114r 99b (14x4, 0x6) | [Scorecard](https://www.espncricinfo.com/series/india-in-west-indies-2019-1188613/west-indies-vs-india-3rd-odi-1188626/full-scorecard) | PASSED |
| `SC-10` | 1388394 | 1 | undefined | 4r 7b (1x4, 0x6) | 4r 7b (1x4, 0x6) | [Scorecard](https://www.espncricinfo.com/series/asia-cup-2023-1388374/india-vs-pakistan-3rd-match-group-a-1388394/full-scorecard) | PASSED |

## Categorized Match Accounting

- **Present & Included**: 429 matches
- **Present but DNB**: 17 matches
- **Unavailable in Cricsheet**: 11 matches (ODI: 3, T20I: 8)
- **Abandoned / No-Result Matches**: 8 matches
- **Duplicates Detected**: 0
- **Unresolved Discrepancies**: 0

## Scoped Trust Justification

> Every included delivery is deterministically parsed; all aggregate discrepancies are explained at match level; zero unexplained match IDs remain; zero anonymous balancing constants; all 10 independent scorecard checks passed; archive hashes match manifest; repeated ingestion produces identical artifact hashes.
