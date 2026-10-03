# Revision 7 local verification

Verified 3 October 2026. Not committed, pushed or deployed.

- Production build and lint: pass.
- `npm run test:experience`: 79 tests pass, 0 failures.
- Dashboard browser regression: 90 checks pass.
- Quiz/comparison browser checks: 26 checks pass.
- Daily challenge, World Cup chapters and source disclosures: 21 checks pass.
- Total browser checks: 137; no recorded runtime errors.
- Layout widths: 1440, 390 and 320 pixels. Reviewed desktop Club, mobile comparison and active quiz screenshots.
- Browser fixtures simulate the schedule provider being unavailable; live-provider reliability is not claimed.
- Full accessibility and performance audits remain outside this verification scope.

Run browser scripts under `scripts/dashboard` with `PLAYWRIGHT_MODULE`, `CHROMIUM_EXECUTABLE_PATH`, optional `CHROMIUM_ARGS` and `QA_OUTPUT`. Scripts launch a local Vite server and clean up afterward. Daily QA simulates blocked browser storage and confirms session progress remains usable.

All 21 comparison snapshots carry a source URL, check date and last-match date; average and strike-rate arithmetic are checked. Snapshot dates differ from the overview and delivery archive as disclosed in the interface.
