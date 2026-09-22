#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const RAW_DIR = path.join(ROOT_DIR, 'data', 'raw');
const NORMALIZED_DIR = path.join(ROOT_DIR, 'data', 'normalized');
const DERIVED_DIR = path.join(ROOT_DIR, 'data', 'derived');
const MANIFEST_PATH = path.join(ROOT_DIR, 'data', 'manifests', 'cricsheet-manifest.json');
const STAGE_OVERRIDES_PATH = path.join(ROOT_DIR, 'data', 'overrides', 'stage-overrides.json');

// Import analytics modules from src/
import { parseCricsheetMatch } from '../src/analytics/sources/cricsheet/parseCricsheetMatch.ts';
import { matchContainsPlayer, KOHLI_CRICSHEET_ID, KOHLI_EXTERNAL_IDS } from '../src/analytics/sources/cricsheet/mapRegistry.ts';
import { validateCricsheetDataset } from '../src/analytics/sources/cricsheet/validateCricsheet.ts';
import { SUPPORTED_CRICSHEET_SCHEMA_VERSIONS } from '../src/analytics/sources/cricsheet/types.ts';

function extractArchive(zipPath, destDir) {
  fs.mkdirSync(destDir, { recursive: true });
  console.log(`Extracting ${path.basename(zipPath)} to ${destDir}...`);

  try {
    // Try tar -xf (works on Windows 10/11 and Unix)
    execSync(`tar -xf "${zipPath}" -C "${destDir}"`, { stdio: 'pipe' });
  } catch {
    // Fallback to PowerShell Expand-Archive on Windows
    execSync(`powershell.exe -NoProfile -Command "Expand-Archive -Force -Path '${zipPath}' -DestinationPath '${destDir}'"`, { stdio: 'inherit' });
  }
}

async function main() {
  console.log('=== Step 2: Ingesting & Normalizing Cricsheet Ball-by-Ball Data ===\n');

  if (!fs.existsSync(MANIFEST_PATH)) {
    throw new Error(`Manifest not found at ${MANIFEST_PATH}. Run 'npm run data:download' first.`);
  }

  const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));
  fs.mkdirSync(NORMALIZED_DIR, { recursive: true });
  fs.mkdirSync(DERIVED_DIR, { recursive: true });

  // Load stage overrides
  let stageOverridesMap = new Map();
  if (fs.existsSync(STAGE_OVERRIDES_PATH)) {
    const overridesData = JSON.parse(fs.readFileSync(STAGE_OVERRIDES_PATH, 'utf8'));
    for (const ov of overridesData.overrides || []) {
      stageOverridesMap.set(String(ov.matchId), ov);
    }
    console.log(`Loaded ${stageOverridesMap.size} deterministic stage overrides from ${STAGE_OVERRIDES_PATH}`);
  }

  const tempExtractDir = path.join(RAW_DIR, '.extracted_temp');
  fs.mkdirSync(tempExtractDir, { recursive: true });

  let totalFilesDiscovered = 0;
  const schemaCounts = {};
  const kohliMatchesAccepted = [];
  const matchLevelReconciliation = [];
  let matchFilesRejected = 0;
  const rejectionReasons = {};

  const resolutionStats = {
    registryIdMatches: 0,
    aliasFallbackMatches: 0,
    normalizedNameMatches: 0,
    unresolvedCount: 0,
  };

  try {
    for (const archiveInfo of manifest.archives || []) {
      const zipPath = path.join(RAW_DIR, archiveInfo.filename);
      if (!fs.existsSync(zipPath)) {
        console.warn(`Archive file ${zipPath} not found! Skipping.`);
        continue;
      }

      const archiveExtractDir = path.join(tempExtractDir, archiveInfo.format);
      extractArchive(zipPath, archiveExtractDir);

      const files = fs.readdirSync(archiveExtractDir).filter((f) => f.endsWith('.json') && !f.endsWith('.info.json') && f !== 'README.txt');
      console.log(`Discovered ${files.length} match JSON files in ${archiveInfo.filename}`);
      totalFilesDiscovered += files.length;

      for (const file of files) {
        const filePath = path.join(archiveExtractDir, file);
        const matchId = path.basename(file, '.json');

        try {
          const rawMatch = JSON.parse(fs.readFileSync(filePath, 'utf8'));
          const schemaVer = rawMatch.meta?.data_version || 'unknown';
          schemaCounts[schemaVer] = (schemaCounts[schemaVer] || 0) + 1;

          // Check if match involved Virat Kohli using Cricsheet identifier ba607b88
          const check = matchContainsPlayer(rawMatch.info || {});
          if (!check.involved) {
            // Not a Kohli match, skip
            continue;
          }

          const resMethod = check.resolution?.resolutionMethod || 'unknown';
          if (resMethod === 'registry-id') resolutionStats.registryIdMatches += 1;
          else if (resMethod === 'alias-map') resolutionStats.aliasFallbackMatches += 1;
          else if (resMethod === 'normalized-name') resolutionStats.normalizedNameMatches += 1;
          else resolutionStats.unresolvedCount += 1;

          // Parse into normalized format
          const parseResult = parseCricsheetMatch(matchId, rawMatch, { stageOverridesMap, strictSchema: false });

          // Extract match-level candidate batting stats
          let runs = 0;
          let ballsFaced = 0;
          let fours = 0;
          let sixes = 0;
          let dismissed = false;
          let dismissalKind = 'not out';
          let didBat = false;
          let inningsNumber = null;

          let innIdx = 0;
          for (const inn of rawMatch.innings || []) {
            innIdx += 1;
            if (inn.super_over) continue;
            for (const ov of inn.overs || []) {
              for (const del of ov.deliveries || []) {
                if (del.batter === 'V Kohli' || del.batter === 'Virat Kohli') {
                  didBat = true;
                  inningsNumber = innIdx;
                  const isNonBoundary = Boolean(del.runs?.non_boundary || del.non_boundary);
                  if (del.runs?.batter === 4 && !isNonBoundary) fours += 1;
                  if (del.runs?.batter === 6 && !isNonBoundary) sixes += 1;
                  if (!del.extras?.wides) ballsFaced += 1;
                }
                if (del.non_striker === 'V Kohli' || del.non_striker === 'Virat Kohli') {
                  didBat = true;
                  inningsNumber = innIdx;
                }
                if (del.wickets) {
                  for (const w of del.wickets) {
                    if (w.player_out === 'V Kohli' || w.player_out === 'Virat Kohli') {
                      didBat = true;
                      inningsNumber = innIdx;
                      dismissed = true;
                      dismissalKind = w.kind;
                    }
                  }
                }
              }
            }
          }

          const opponent = rawMatch.info?.teams ? (rawMatch.info.teams[0] === 'India' ? rawMatch.info.teams[1] : rawMatch.info.teams[0]) : 'Unknown';
          const matchDate = rawMatch.info?.dates?.[0] || 'unknown-date';
          const competition = rawMatch.info?.event?.name || `${rawMatch.info?.teams?.[0]} vs ${rawMatch.info?.teams?.[1]} Series`;

          // Determine cutoff eligibility
          const isCutoffEligible = archiveInfo.format === 'ODI' ? matchDate <= '2026-07-19' : matchDate <= '2024-06-29';
          const matchCompletionState = parseResult.match?.innings
            ? (inningsNumber && parseResult.match.innings[inningsNumber - 1]?.completionStatus) || parseResult.match.innings[parseResult.match.innings.length - 1]?.completionStatus || 'unknown'
            : 'unknown';

          matchLevelReconciliation.push({
            matchId,
            sourceMatchId: matchId,
            filename: file,
            sourceFilename: file,
            date: matchDate,
            format: archiveInfo.format,
            opponent,
            event: competition,
            competition,
            stage: parseResult.match?.stage || 'bilateral',
            stageClassification: parseResult.match?.stage || 'bilateral',
            schemaVersion: schemaVer,
            participationStatus: 'participated',
            battingStatus: didBat ? 'batted' : 'dnb',
            batted: didBat,
            dnb: !didBat,
            inningsNumber: didBat ? inningsNumber : null,
            inningsCount: didBat ? 1 : 0,
            runs: didBat ? runs : 0,
            ballsFaced: didBat ? ballsFaced : 0,
            dismissalStatus: didBat ? (dismissed ? 'dismissed' : 'not-out') : 'dnb',
            dismissalCount: didBat && dismissed ? 1 : 0,
            dismissalKind: didBat ? (dismissed ? dismissalKind : 'not out') : 'dnb',
            fours: didBat ? fours : 0,
            sixes: didBat ? sixes : 0,
            inclusionStatus: parseResult.match ? 'included' : 'excluded',
            exclusionReason: parseResult.skippedReason || null,
            identityResolutionMethod: resMethod === 'registry-id' ? 'cricsheet-registry-id' : resMethod,
            completionState: matchCompletionState,
            referenceCutoffEligibility: isCutoffEligible ? 'eligible' : 'post-cutoff',
            stageOverrideReason: stageOverridesMap.get(matchId)?.reason || null,
          });

          if (parseResult.match) {
            kohliMatchesAccepted.push(parseResult.match);
          } else {
            matchFilesRejected += 1;
            const reason = parseResult.skippedReason || 'parse-rejection';
            rejectionReasons[reason] = (rejectionReasons[reason] || 0) + 1;
            if (parseResult.warnings.length > 0) {
              console.warn(`[WARN] Match ${matchId}: ${parseResult.warnings.join('; ')}`);
            }
          }
        } catch {
          matchFilesRejected += 1;
          const reason = 'file-read-or-json-error';
          rejectionReasons[reason] = (rejectionReasons[reason] || 0) + 1;
        }
      }
    }
  } finally {
    // Cleanup temporary extracted files to keep data/raw clean
    console.log('\nCleaning up temporary raw extracted directories...');
    try {
      fs.rmSync(tempExtractDir, { recursive: true, force: true });
    } catch {
      // ignore
    }
  }

  console.log(`\nTotal Match Files Scanned: ${totalFilesDiscovered}`);
  console.log('Schema Version Audit across corpus:', schemaCounts);
  console.log(`Virat Kohli Candidate Matches: ${matchLevelReconciliation.length}`);
  console.log(`- Batted Innings: ${matchLevelReconciliation.filter((m) => m.batted).length}`);
  console.log(`- Did Not Bat (DNB): ${matchLevelReconciliation.filter((m) => m.dnb).length}`);
  console.log(`- Matches Accepted: ${kohliMatchesAccepted.length}`);
  console.log(`- Matches Rejected: ${matchFilesRejected}`);
  console.log('Player Identity Resolution Stats:', resolutionStats);

  // Sort accepted matches chronologically
  kohliMatchesAccepted.sort((a, b) => a.date.localeCompare(b.date));
  matchLevelReconciliation.sort((a, b) => a.date.localeCompare(b.date));

  // Run Quality Gate Validation
  const quality = validateCricsheetDataset(kohliMatchesAccepted);
  console.log(`Quality Gates Passed: ${quality.isTrusted ? 'YES' : 'NO'}`);

  // Calculate Coverage Dates
  const coverageStart = kohliMatchesAccepted.length > 0 ? kohliMatchesAccepted[0].date : null;
  const coverageEnd = kohliMatchesAccepted.length > 0 ? kohliMatchesAccepted[kohliMatchesAccepted.length - 1].date : null;

  // Save Normalized Matches atomically
  const normalizedOutPath = path.join(NORMALIZED_DIR, 'kohli-matches.json');
  const tempNormPath = `${normalizedOutPath}.tmp`;
  fs.writeFileSync(tempNormPath, JSON.stringify(kohliMatchesAccepted, null, 2), 'utf8');
  fs.renameSync(tempNormPath, normalizedOutPath);
  console.log(`Saved ${kohliMatchesAccepted.length} normalized matches to ${normalizedOutPath}`);

  // Save Match-Level Reconciliation atomically
  const matchRecOutPath = path.join(DERIVED_DIR, 'match-level-reconciliation.json');
  const tempRecPath = `${matchRecOutPath}.tmp`;
  fs.writeFileSync(tempRecPath, JSON.stringify(matchLevelReconciliation, null, 2), 'utf8');
  fs.renameSync(tempRecPath, matchRecOutPath);
  console.log(`Saved ${matchLevelReconciliation.length} match-level rows to ${matchRecOutPath}`);

  // Update Manifest with Ingestion Statistics
  manifest.player = {
    canonicalName: 'Virat Kohli',
    cricsheetPersonId: KOHLI_CRICSHEET_ID,
    externalIds: KOHLI_EXTERNAL_IDS,
  };
  manifest.schemaAudit = {
    supportedVersions: SUPPORTED_CRICSHEET_SCHEMA_VERSIONS,
    corpusDistribution: schemaCounts,
  };
  manifest.matchFilesDiscovered = totalFilesDiscovered;
  manifest.matchesParticipated = matchLevelReconciliation.length;
  manifest.inningsBatted = matchLevelReconciliation.filter((m) => m.batted).length;
  manifest.dnbAppearances = matchLevelReconciliation.filter((m) => m.dnb).length;
  manifest.matchFilesAccepted = kohliMatchesAccepted.length;
  manifest.matchFilesRejected = matchFilesRejected;
  manifest.rejectionReasons = rejectionReasons;
  manifest.identityResolutionStats = resolutionStats;
  manifest.coverageStart = coverageStart;
  manifest.coverageEnd = coverageEnd;
  manifest.formatCounts = quality.formatCounts;
  manifest.stageCounts = quality.stageCounts;
  manifest.qualityTrusted = quality.isTrusted;
  manifest.ingestedAt = new Date().toISOString();

  const tempManifestPath = `${MANIFEST_PATH}.tmp`;
  fs.writeFileSync(tempManifestPath, JSON.stringify(manifest, null, 2), 'utf8');
  fs.renameSync(tempManifestPath, MANIFEST_PATH);

  console.log(`Updated manifest written to ${MANIFEST_PATH}`);
  console.log('Ingestion completed successfully.\n');
}

main().catch((err) => {
  console.error('Ingestion failed:', err);
  process.exit(1);
});
