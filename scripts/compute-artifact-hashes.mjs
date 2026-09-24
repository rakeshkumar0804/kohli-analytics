import fs from 'node:fs';
import crypto from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

const phase5Files = [
  'data/derived/clutch-model-spec.json',
  'data/derived/clutch-calibration-report.json',
  'data/derived/clutch-calibration-report.md',
  'src/data/derived/clutchCalibrationArtifact.json'
];

const generalAnalyticsFiles = [
  'data/derived/kohli-analytics.json',
  'data/derived/match-level-reconciliation.json',
  'data/derived/reconciliation-report.json',
  'data/derived/coverage-report.json'
];

console.log('=== PHASE 5 CALIBRATION ARTIFACT HASH AUDIT ===');
for (const f of phase5Files) {
  const fullPath = path.join(ROOT_DIR, f);
  if (!fs.existsSync(fullPath)) {
    console.log(`File: ${f} -> NOT FOUND`);
    continue;
  }
  const rawBytes = fs.readFileSync(fullPath);
  const rawHash = crypto.createHash('sha256').update(rawBytes).digest('hex');
  const content = rawBytes.toString('utf8');
  const stripped = content
    .replace(/"generatedAt":\s*"[^"]+"/g, '"generatedAt":"FIXED"')
    .replace(/"decisionTimestamp":\s*"[^"]+"/g, '"decisionTimestamp":"FIXED"')
    .replace(/- \*\*Generated At\*\*:\s*`[^`]+`/g, '- **Generated At**: `FIXED`');
  const normHash = crypto.createHash('sha256').update(stripped).digest('hex');
  console.log(`File: ${f}`);
  console.log(`  Path:                 ${fullPath}`);
  console.log(`  Byte Length:          ${rawBytes.length}`);
  console.log(`  Raw SHA-256:          ${rawHash}`);
  console.log(`  Normalized SHA-256:   ${normHash}`);
  console.log(`  Removed Fields:       ["generatedAt", "decisionTimestamp"] (strictly non-semantic timestamps)`);
}

// Byte synchronization check
const calReportData = fs.readFileSync(path.join(ROOT_DIR, 'data/derived/clutch-calibration-report.json'));
const calReportSrc = fs.readFileSync(path.join(ROOT_DIR, 'src/data/derived/clutchCalibrationArtifact.json'));
const isSynced = calReportData.equals(calReportSrc);
console.log(`\nByte-for-byte synchronization between data/derived/clutch-calibration-report.json and src/data/derived/clutchCalibrationArtifact.json: ${isSynced ? 'SYNCHRONIZED (Byte identical)' : 'MISMATCH'}`);

console.log('\n=== GENERAL KOHLI ANALYTICS ARTIFACT HASH AUDIT ===');
for (const f of generalAnalyticsFiles) {
  const fullPath = path.join(ROOT_DIR, f);
  if (!fs.existsSync(fullPath)) {
    console.log(`File: ${f} -> NOT FOUND`);
    continue;
  }
  const rawBytes = fs.readFileSync(fullPath);
  const rawHash = crypto.createHash('sha256').update(rawBytes).digest('hex');
  const content = rawBytes.toString('utf8');
  const stripped = content
    .replace(/"generatedAt":\s*"[^"]+"/g, '"generatedAt":"FIXED"')
    .replace(/"decisionTimestamp":\s*"[^"]+"/g, '"decisionTimestamp":"FIXED"');
  const normHash = crypto.createHash('sha256').update(stripped).digest('hex');
  console.log(`File: ${f}`);
  console.log(`  Path:                 ${fullPath}`);
  console.log(`  Byte Length:          ${rawBytes.length}`);
  console.log(`  Raw SHA-256:          ${rawHash}`);
  console.log(`  Normalized SHA-256:   ${normHash}`);
  console.log(`  Removed Fields:       ["generatedAt", "decisionTimestamp"] (strictly non-semantic timestamps)`);
}
