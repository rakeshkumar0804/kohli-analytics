# Virat Kohli Analytics — Ball-by-Ball Data Pipeline & Coverage Documentation

## 1. Source and Licensing Audit

- **Dataset Publisher**: Cricsheet (curated by Stephen Rushe)
- **Publisher Classification**: Open ball-by-ball cricket data publisher (Not an official ICC or BCCI source).
- **Download Portal**: [https://cricsheet.org/downloads/](https://cricsheet.org/downloads/)
- **Archive URLs**:
  - ODI: `https://cricsheet.org/downloads/odis_male_json.zip`
  - T20I: `https://cricsheet.org/downloads/t20s_male_json.zip`
- **License**: Creative Commons Attribution 4.0 International (CC-BY 4.0) / Open Data Commons Open Database License (ODbL) 1.0.
- **License URL**: [https://cricsheet.org/license/](https://cricsheet.org/license/)
- **Redistribution & Git Boundary Policy**:
  - Raw zip archives (`data/raw/**`) and multi-megabyte normalized match files (`data/normalized/**`) are strictly ignored in `.gitignore`.
  - Only machine-readable manifests (`data/manifests/cricsheet-manifest.json`), tournament stage overrides (`data/overrides/stage-overrides.json`), and compact derived artifacts (`data/derived/*.json`) are committed to source control.

---

## 2. Manifest & Checksum Verification

The pipeline records verified SHA-256 archive checksums and schema metadata upon download in `data/manifests/cricsheet-manifest.json`:

| Archive File | Match Format | File Size | SHA-256 Checksum (Prefix) | Status |
|---|---|---|---|---|
| `odis_male_json.zip` | ODI (Men) | 16.65 MB | `b6a1d6b683f19110...` | Verified |
| `t20s_male_json.zip` | T20I (Men) | 13.56 MB | `e098ad15622ac9e3...` | Verified |

- **Schema Version**: `1.1.0` (Cricsheet JSON)
- **Total Scorecards Scanned**: 6,134 match files
- **Virat Kohli Matches Ingested**: 429 matches (300 ODIs, 112 T20Is, and other matched formats)
- **Parsing Rejections**: 0 errors

---

## 3. Reproduction Pipeline Commands

To reproduce the entire ball-by-ball ingestion, normalization, derivation, and verification pipeline offline from scratch:

```bash
# 1. Download official Cricsheet archives and verify SHA-256 checksums
npm run data:download

# 2. Extract, filter for Virat Kohli, and normalize into typed analytical models
npm run data:ingest

# 3. Derive 5-band Pressure Maps, Chase Metrics, Stage Splits, and Coverage Reconciliation
npm run data:derive

# 4. Verify artifact schemas and data-quality gates
npm run data:verify

# --- Or run the full pipeline in one command ---
npm run data:refresh

# 5. Run end-to-end data integration tests
npm run test:data-integration
```

---

## 4. Player Identity Resolution Policy

Player references are resolved deterministically using a prioritized resolution strategy:
1. **Registry Identifier**: Matches against Cricsheet `registry.people` dictionary for Cricinfo ID `253802`.
2. **Explicit Alias Mapping**: Matches against canonical aliases (`"V Kohli"`, `"Virat Kohli"`, `"VK Kohli"`).
3. **Exact Normalized Name**: Strict alphanumeric comparison (`"viratkohli"`, `"vkohli"`).
4. **Non-Target / Ambiguous Rejection**: Non-matching player names are marked `unresolved` and excluded from Kohli-specific batting analytics.

---

## 5. Match-Stage Classification Policy

Tournament stages are determined hierarchically:
1. **Match ID Override Manifest** (`data/overrides/stage-overrides.json`): 18 verified ICC tournament knockout fixtures (World Cup, Champions Trophy, T20 World Cup knockouts & finals).
2. **Structured Metadata** (`info.event.stage`): e.g. `'final'`, `'semi-final'`, `'quarter-final'`, `'super-8'`, `'group'`.
3. **Tournament Rule Classifier**: Competition-specific stage cues.
4. **Bilateral Default**: Non-tournament bilateral series default to `'bilateral'`.

---

## 6. Target & Chase Policy

- **Target Source**: Authoritative target metadata provided by the source (`innings.target.runs`).
- **DLS Revised Targets**: Preserved directly from `innings.target` when DLS method applies; no manual reconstruction from 1st innings scores.
- **Super Overs**: Isolated from regular innings analytics to prevent distortion of standard limited-overs statistics.
- **Incomplete Innings**: Identified with explicit reason codes (`abandoned`, `rain`, `target-reached`).

---

## 7. Coverage Reconciliation vs Phase 1 Career Reference Aggregates

Phase 1 career statistics represent verified historical aggregates from official scorecards (ESPN Cricinfo Statsguru). Cricsheet represents the open public ball-by-ball dataset.

| Format | Phase 1 Reference Matches | Phase 1 Reference Runs | Cricsheet Ingested Matches | Cricsheet Ingested Runs | Run Difference | Reconciliation Status |
|---|---|---|---|---|---|---|
| **ODI** | 314 | 14,941 | 300 | 14,819 | -122 | `partial-coverage` (14 scorecards not in open repository) |
| **T20I** | 125 | 4,188 | 112 | 3,963 | -225 | `partial-coverage` (13 scorecards not in open repository) |

### Non-Negotiable Data Integrity Policy
- **No Adjustment Constants**: Coverage differences are NEVER resolved by injecting synthetic numbers or artificial padding.
- **UI Separation**: Phase 1 verified aggregates remain the official displayed career totals. Situational models (Pressure Map, Chase Metrics) explicitly state their underlying dataset sample sizes.
- **Clutch Index Gate**: Remains in `CALIBRATION PENDING — PRODUCTION DATA INGESTED` state until complete historical ball coverage is achieved and empirical model weights are calibrated.

---

## 8. Data Quality Gates

The dataset validation suite (`scripts/verify-derived-data.mjs` and `validateCricsheetDataset`) enforces:
- Unique match identifiers (0 duplicates).
- Strict non-negative constraints on runs and extras.
- Arithmetic reconciliation between individual delivery sums and innings scorecard totals.
- Proper separation of super overs.
- Complete 15-cell 5-band Pressure Map models for limited-overs formats.
- Unsupported-format flagging for Test match Pressure Maps.
