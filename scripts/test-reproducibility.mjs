#!/usr/bin/env node
import crypto from 'node:crypto';
import fs from 'node:fs';
import { execSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

function getHash(filePath) {
  const content = fs.readFileSync(path.join(ROOT_DIR, filePath), 'utf8');
  // strip timestamp for deterministic hash comparison
  const stripped = content
    .replace(/"generatedAt":\s*"[^"]+"/g, '"generatedAt":"FIXED"')
    .replace(/"decisionTimestamp":\s*"[^"]+"/g, '"decisionTimestamp":"FIXED"');
  return crypto.createHash('sha256').update(stripped).digest('hex');
}

console.log('--- RUN 1 HASHES ---');
const h1_kohli = getHash('data/derived/kohli-analytics.json');
const h1_rec = getHash('data/derived/match-level-reconciliation.json');
const h1_rep = getHash('data/derived/reconciliation-report.json');
console.log('kohli-analytics.json:          ', h1_kohli);
console.log('match-level-reconciliation.json:', h1_rec);
console.log('reconciliation-report.json:    ', h1_rep);

console.log('\n--- EXECUTING RE-INGESTION & RE-DERIVATION ---');
execSync('node scripts/ingest-cricsheet.mjs', { cwd: ROOT_DIR, stdio: 'inherit' });
execSync('node scripts/derive-kohli-analytics.mjs', { cwd: ROOT_DIR, stdio: 'inherit' });

console.log('\n--- RUN 2 HASHES ---');
const h2_kohli = getHash('data/derived/kohli-analytics.json');
const h2_rec = getHash('data/derived/match-level-reconciliation.json');
const h2_rep = getHash('data/derived/reconciliation-report.json');
console.log('kohli-analytics.json:          ', h2_kohli);
console.log('match-level-reconciliation.json:', h2_rec);
console.log('reconciliation-report.json:    ', h2_rep);

console.log('\n--- REPRODUCIBILITY VERIFICATION ---');
console.log('kohli-analytics.json match:          ', h1_kohli === h2_kohli ? '✅ IDENTICAL' : '❌ MISMATCH');
console.log('match-level-reconciliation.json match:', h1_rec === h2_rec ? '✅ IDENTICAL' : '❌ MISMATCH');
console.log('reconciliation-report.json match:    ', h1_rep === h2_rep ? '✅ IDENTICAL' : '❌ MISMATCH');

if (h1_kohli !== h2_kohli || h1_rec !== h2_rec || h1_rep !== h2_rep) {
  process.exit(1);
}
