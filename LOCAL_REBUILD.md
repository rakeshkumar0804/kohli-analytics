# Kohli Analytics — revision 6

Local working copy based on `a9651a81419b750e598f160403f5d25c3d72d406`. No commits, pushes, pull requests or deployments.

## Run locally

Extract `Kohli-Analytics-v6.zip` into a new folder and open a terminal inside `kohli-analytics`:

```sh
npm ci
npm run dev
```

Open the localhost URL printed by Vite, normally http://localhost:5173. Use Node 22.12+ or Node 24. Copy your existing `.env.local` only if you want the optional fixture provider; credentials are excluded from this download. Analytics work without that service.

## What changed in revision 6

- **Cricket Club** opens the app beyond Kohli: four World Cup chapters with ICC retrospectives and comparison routes across countries and generations.
- **The Cricket Gauntlet** replaces the three-question quiz with 40 sourced questions across World cricket, Umpire’s call, Deep archive and Scorekeeper. Choose 12, 24 or all 40 questions. Shorter rounds balance categories; questions and options shuffle, answers lock, and progress resumes after reload.
- Each answer includes an explanation and source. Results include category scores and a full answer review. History and laws use ICC/MCC references; archive questions reference the delivered data; arithmetic scenarios are explicitly hypothetical.
- Win with 11/12, 22/24 or 36/40 to unlock a full-screen celebration and downloadable SVG trophy. A perfect round earns a special title. The celebration supports Escape, mobile screens and reduced motion. Best scores and progress stay on the current device; the prize is digital.
- **Player comparison** now lets you choose either focus player, including pairs without Kohli. The pair survives reload and sharing. Test, ODI and T20I presets replace the permanent Kohli–Sachin emphasis.
- Added a homepage Cricket Club entrance and clearer fixture-provider failure messages. Provider errors no longer log raw request details.

### Fixture configuration

The supplied CricAPI key is configured only in the working copy’s server-side `.env.local`. It is excluded from this ZIP. Preserve your existing `.env.local`, or set `CRICKETDATA_API_KEY` there and restart Vite. Do not use a `VITE_` prefix for this credential.

A direct provider check accepted the key, but the app’s upcoming-fixture lookup timed out in this environment. A working live schedule is **not** claimed. Browser checks mock fixture unavailability; the app explains the specific failure and supports retry.

### Revision 6 verification

Production build and lint pass. **45 focused tests, 31 data-integration tests, and 162 Chromium browser checks** pass: 90 dashboard regression, 46 discovery and 26 Cricket Club checks. Quiz checks cover a complete perfect 40-question round, a losing round, shuffled-answer persistence, answer locking, review, trophy download, Escape, reduced motion and mobile celebration. Layouts are checked at 1440px, 390px and 320px.

Start at **Cricket club → Full gauntlet**. Answer a question, reload, and continue. Try the World Cup tabs and comparison cards, change both focus players, and reload the shared view. The new browser harness is `scripts/dashboard/club-check.mjs`; it accepts the same Playwright/Chromium environment overrides as the existing harnesses.

```sh
node --test scripts/test-dashboard.mjs scripts/test-dashboard-archive.mjs scripts/test-dashboard-story.mjs scripts/test-innings-comparison.mjs scripts/test-discovery.mjs scripts/test-fixture-retry.mjs scripts/test-cricket-quiz.mjs
npm run test:data-integration
npm run lint
npm run build
```

## What changed in revision 5

### IPL is now an explorable archive

Imported **275 IPL batting innings across 282 covered appearances and 19 seasons (2008–2026)** from a checksum-recorded Cricsheet JSON source. The archive totals reconcile to the stored IPL batting record: **9,336 runs, 6,926 balls, 231 dismissals, 844 fours, 316 sixes, nine centuries and 68 fifties**. The stored career match count is 283; the covered appearance count is 282. These are explicitly different scopes.

IPL now opens the batting archive by default, with search, filters, pagination, CSV, bookmarks, scorecard progression and bowler matchups. It also works in the career explorer and innings comparison. IPL scorecards and checkpoints correctly label RCB rather than India. The combined library has **687 batting innings**; international totals and exploration still exclude IPL unless the user selects it.

### Two new destinations

- **The RCB chapter**: a red-and-gold season hub with a selectable 19-season run timeline, 2016 editorial spotlight, innings-by-innings score ribbon, actual powerplay/middle/death scoring phases, opposition breakdown, season-high scorecard and comparison entrance.
- **Download season card** exports an SVG with the selected season's real totals and source attribution, suitable for opening in a browser or design tool.
- **Discovery lab**: an interactive year-by-year innings mosaic, score-band legend, recent-20-innings chart, detailed cards, surprise discovery, and lenses for successful chases, centuries, 50+ scores at 150+ SR, winning 50+ scores without Player of the Match, and saved innings.
- Bookmarks use the existing device-local collection. Discovery lenses, format and year survive reload/sharing. A Test discovery view leads to existing curated highlights instead of inventing delivery data.
- Homepage entrances, streamlined five-item mobile navigation with More, an active season that stays visible in the mobile rail, clearer score contrast, and incompatible-filter resets when changing formats.

### Revision 5 verification

**38 focused tests and 139 Chromium browser checks passed** (93 regression checks + 46 new experience checks). Production build and lint pass with no oversized-chunk warning. No browser runtime errors were recorded. Screens at 1440px, 390px and 320px were checked for overflow, and desktop/mobile renders were inspected. The selected season stays visible on mobile; both IPL scorecard and comparison labels use RCB. Source hash validation, all-innings phase/bowler/progression reconciliation, international exclusion, collection persistence and season-card downloads are covered.

### Verify locally

Start at **The RCB chapter → 2016**. Open any score, switch to 2024, download its season card, and follow an opposition bar into the filtered archive. Then try **Discovery lab → IPL → Hundred club → 2016**. Bookmark a card and open Your collection. Try the same flows on a narrow mobile viewport.

The optional browser harnesses are `scripts/dashboard/browser-check.mjs` and `scripts/dashboard/discovery-check.mjs`. Fixtures are mocked unavailable in deterministic checks; live provider success is not claimed.

```sh
node --test scripts/test-dashboard.mjs scripts/test-dashboard-archive.mjs scripts/test-dashboard-story.mjs scripts/test-innings-comparison.mjs scripts/test-discovery.mjs scripts/test-fixture-retry.mjs
npm run lint
npm run build
```

Rebuild the IPL archive with the exact ZIP matching `src/dashboard/iplProvenance.json`:

```sh
python scripts/dashboard/build_ipl_archive.py /path/to/ipl_json.zip
```

The builder rejects a different source hash. Source archive: https://cricsheet.org/downloads/ipl_json.zip ; source/attribution: https://cricsheet.org/downloads/ ; license: https://cricsheet.org/license/ . The source SHA-256, dates and coverage are bundled and exposed in Data & sources. Original international data and career snapshots were not changed.

## What changed in revision 4

- **Story → Compare innings**: choose any two of the 412 covered ODI/T20I innings. Search by opponent, ground, date or score; swap sides; start with Melbourne/Mohali or Hobart/Mirpur presets.
- Gold/teal scorecards, cumulative scoring paths, a shared balls-faced slider, side-by-side metrics and expandable bowler matchups.
- Chart readouts use the last recorded over checkpoint at or before the selected ball count. They do not fabricate delivery-level scores. Different-format comparisons explain their limits.
- Pair selections survive reload and sharing. Open comparisons directly from an archive scorecard or a featured replay.
- Replays now include strike rate, Kohli's share of the current team score and runs/balls added since the previous checkpoint.
- Responsive comparison controls and scorecards, including 320px screens. Both metric columns fit without horizontal scrolling.

### Revision 4 verification

Production build, lint and 30 focused dashboard/archive/story/comparison/retry tests passed. All **93 Chromium browser checks passed**, with no runtime errors. Browser verification covers desktop and mobile comparison, presets, swapping, search, shared URL restoration, bowler expansion, replay-to-comparison and archive-to-comparison navigation, alongside prior regression checks. Actual local screenshots are included in `preview/`.

No source datasets were changed. No commits, pushes or deployments were made.

## What changed in revision 3

The live app had a sporting identity and a narrative journey that the first dashboard redesign flattened. This revision combines that character with the ordered archive.

- Red-and-gold Kohli opening, the number 18 ring, locally served Barlow Condensed typography and an integrated career scoreboard. The font and its OFL license are bundled.
- **The Kohli story**: a dedicated navigation destination with four chapters, directly accessible from the homepage.
- **Career eras**: five selectable periods, ODI/T20I switching, narrative context, archive-derived averages/runs/hundreds and year bars that open the filtered career explorer. The static legacy era averages are not reused.
- **Innings replay**: Melbourne 2022, Mohali 2016, Hobart 2012 and Mirpur 2012. Play, pause, restart, step and scrub through actual over checkpoints; Kohli's runs/balls, India's score and remaining target update together. This is a data replay, not video or per-ball commentary.
- **The captain**: a dedicated Test leadership chapter and selected historical captain comparisons.
- **Rivalries**: select opposition, inspect combined career snapshots and jump into covered innings or curated moments.
- Restored milestone storytelling and a three-question fan quiz, with duplicate-answer prevention and restart.
- Story chapter, era, match and rivalry selections persist in shareable URLs. Existing filters, bookmarks, exports and analytics remain available.

### Revision 3 verification

Production build and lint passed. All **25 dashboard/archive/story/retry tests** passed. **75 real Chromium checks on localhost** passed, including the previous archive workflows, every story chapter at 390px and 320px, replay play/pause/bounds, exact final scores, chapter-to-archive navigation, URL restoration and quiz scoring/reset. No browser runtime errors were recorded. Desktop and mobile renders were inspected; a replay label collision and oversized control icons were corrected. Deterministic browser tests mock the optional fixture service.

The original 158 analytics and 31 integration tests passed during revision 2; the underlying analytics/source datasets have not changed in revision 3. No historical scorecard re-audit or live fixture success is claimed.

Start at the homepage, choose **Explore the story**, then try **Innings replay**. The preview folder contains actual local browser screenshots.

## What changed in revision 2

- A compact overview with visible career totals, five recent covered scores, clickable innings, boundary scoring profile, chase statistics and a mixed-format highlights collection.
- A real archive of **412 batting innings: 300 ODI and 112 T20I**, rebuilt from the exact checksum-matched Cricsheet files in the existing project manifest. Runs, balls, dismissals and boundaries reconcile to the existing artifact for each format.
- Archive search, opponent/venue/year/result/chase/score filters, pagination, score sorting, local bookmarks and filtered CSV export. All archive filters survive reload and can be shared in the URL.
- Native scorecard dialogs with cumulative innings progression, exact over-by-over values, individual bowler matchups and source identifiers. Detailed delivery summaries load only when an innings opens.
- Career charts recalculate for selected innings. Explore years, opponents, venues, results or batting situation; switch between runs, average and strike rate. Includes score distribution and the actual innings behind the selection.
- Test home/away/neutral and innings splits, IPL career context, and preserved career reference tables and milestones.
- Player comparison adds average-versus-strike-rate plotting and explicit metric differences. Up to four players; player choices and metric now survive reload/share.
- Searchable ODI/T20I bowler matchup tables with sample thresholds, strike rate, dots, dismissals and boundaries.
- Denser desktop layout and corrected mobile table containment. Recent scores fit on narrow screens; larger ledgers scroll within their own table.
- Fixture Retry now bypasses the client cache and requests a refresh from the existing server proxy.

## Data scope

Career snapshots and the delivery archive are separate datasets. The international archive ends 19 July 2026, and the separate IPL archive ends 31 May 2026. Neither includes DNB appearances or unsourced additions. All international means ODI + T20I in delivery exploration, without Test or IPL. The innings library's All formats scope includes ODI, T20I and IPL. Test retains its existing snapshots/splits/highlights without a delivery archive. Peer records retain their original differing cutoffs. The app is not a live score service.

The source ZIP SHA-256 checksums are checked by `scripts/dashboard/build_innings_archive.py`. To reproduce the UI data, supply the exact ODI and T20I source ZIPs specified in `src/data/derived/kohliAnalyticsArtifact.json`:

```sh
python scripts/dashboard/build_innings_archive.py /path/to/odi.zip /path/to/t20i.zip
```

This regenerates the compact index and separate format detail files in `src/dashboard/`. It does not modify career baselines. Reconciliation proves agreement with the existing source snapshot; it is not a new external scorecard audit.

## Revision 2 verification record

- TypeScript and production build passed, without oversized-chunk warnings.
- Lint and data integrity validation passed.
- 158 existing analytics tests, 31 integration tests, 18 dashboard/archive tests and one fixture retry regression test passed.
- **43 real Chromium browser checks on localhost passed**, covering all six screens, desktop/mobile layouts, 320px width, filters, reload/share state, CSV, pagination, bookmarks, scorecards, Escape dismissal, comparison selections, pressure controls and mobile navigation. No browser runtime errors were recorded.
- Desktop and mobile screenshots were captured; overview, career, comparison, archive and scorecard renders were visually inspected. Fixtures were mocked as unavailable during the deterministic browser checks; live provider success is not claimed.

```sh
npm test
npm run test:data-integration
node --test scripts/test-dashboard.mjs scripts/test-dashboard-archive.mjs scripts/test-dashboard-story.mjs scripts/test-fixture-retry.mjs
npm run validate:data
npm run lint
npm run build
```

Optional browser QA lives in `scripts/dashboard/browser-check.mjs`. It needs Playwright and a local Chromium installation; these are not added to production dependencies. `PLAYWRIGHT_MODULE`, `CHROMIUM_EXECUTABLE_PATH`, `CHROMIUM_ARGS` and `QA_OUTPUT` can configure an external browser setup.

Review starting with Overview, then open a recent score; try Career → T20I → Australia → Chasing; filter the archive to centuries; save an innings; compare four players and reload the shared URL.
