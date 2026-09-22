import fs from 'node:fs';
import crypto from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

const files = [
  'data/derived/kohli-analytics.json',
  'data/derived/match-level-reconciliation.json',
  'data/derived/reconciliation-report.json',
  'data/derived/coverage-report.json'
];

console.log('=== ARTIFACT HASH AUDIT ===');
for (const f of files) {
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
