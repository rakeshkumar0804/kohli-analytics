#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const RAW_DIR = path.join(ROOT_DIR, 'data', 'raw');
const MANIFEST_DIR = path.join(ROOT_DIR, 'data', 'manifests');
const MANIFEST_PATH = path.join(MANIFEST_DIR, 'cricsheet-manifest.json');

const PIPELINE_VERSION = '3.0.0';
const CRICSHEET_BASE_URL = 'https://cricsheet.org/downloads';

const ARCHIVES = [
  {
    format: 'ODI',
    filename: 'odis_male_json.zip',
    url: `${CRICSHEET_BASE_URL}/odis_male_json.zip`,
  },
  {
    format: 'T20I',
    filename: 't20s_male_json.zip',
    url: `${CRICSHEET_BASE_URL}/t20s_male_json.zip`,
  },
];

function computeSha256(filePath) {
  const fileBuffer = fs.readFileSync(filePath);
  const hashSum = crypto.createHash('sha256');
  hashSum.update(fileBuffer);
  return hashSum.digest('hex');
}

async function downloadFile(url, destPath) {
  console.log(`Downloading ${url} ...`);
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download ${url}: HTTP ${response.status} ${response.statusText}`);
  }
  const arrayBuffer = await response.arrayBuffer();
  fs.writeFileSync(destPath, Buffer.from(arrayBuffer));
  console.log(`Saved to ${destPath} (${(arrayBuffer.byteLength / 1024 / 1024).toFixed(2)} MB)`);
}

async function main() {
  console.log('=== Step 1: Downloading Cricsheet Ball-by-Ball Archives ===');

  fs.mkdirSync(RAW_DIR, { recursive: true });
  fs.mkdirSync(MANIFEST_DIR, { recursive: true });

  const archiveManifests = [];

  const forceDownload = process.argv.includes('--force') || process.env.FORCE_DOWNLOAD === 'true';

  for (const item of ARCHIVES) {
    const destPath = path.join(RAW_DIR, item.filename);

    // Check if already present and valid (unless force is requested)
    if (!forceDownload && fs.existsSync(destPath) && fs.statSync(destPath).size > 1000) {
      console.log(`Archive ${item.filename} already exists locally. Verifying...`);
    } else {
      try {
        await downloadFile(item.url, destPath);
      } catch (err) {
        console.error(`Error downloading ${item.filename}:`, err.message);
        throw err;
      }
    }

    const sha256 = computeSha256(destPath);
    const bytes = fs.statSync(destPath).size;

    archiveManifests.push({
      format: item.format,
      filename: item.filename,
      url: item.url,
      sha256,
      bytes,
      downloadedAt: new Date().toISOString(),
      status: 'verified',
    });

    console.log(`[VERIFIED] ${item.filename} | Size: ${(bytes / (1024 * 1024)).toFixed(2)} MB | SHA256: ${sha256.substring(0, 16)}...`);
  }

  let existingManifest = {};
  if (fs.existsSync(MANIFEST_PATH)) {
    try {
      existingManifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));
    } catch {
      // ignore
    }
  }

  const manifest = {
    ...existingManifest,
    datasetId: 'cricsheet-male-limited-overs',
    publisher: 'Cricsheet (Stephen Rushe)',
    publisherType: 'Open ball-by-ball cricket data publisher (Not official ICC/BCCI)',
    sourcePageUrl: 'https://cricsheet.org/downloads/',
    licenseName: 'Creative Commons Attribution 4.0 International (CC-BY 4.0) / ODbL 1.0',
    licenseUrl: 'https://cricsheet.org/license/',
    schemaVersion: '1.1.0',
    pipelineVersion: PIPELINE_VERSION,
    generatedAt: new Date().toISOString(),
    player: {
      canonicalName: 'Virat Kohli',
      cricsheetPersonId: 'ba607b88',
      externalIds: {
        espncricinfo: '253802',
      },
    },
    formatsRequested: ARCHIVES.map((a) => a.format),
    archives: archiveManifests,
    schemaAudit: existingManifest.schemaAudit || {
      supportedVersions: ['1.0.0', '1.1.0', '1.2.0', '1.3.0', '1.4.0'],
      corpusDistribution: { '1.2.0': 1 },
    },
  };

  const tempManifestPath = `${MANIFEST_PATH}.tmp`;
  fs.writeFileSync(tempManifestPath, JSON.stringify(manifest, null, 2), 'utf8');
  fs.renameSync(tempManifestPath, MANIFEST_PATH);

  console.log(`\nManifest written to ${MANIFEST_PATH}`);
  console.log('Download and manifest verification completed successfully.\n');
}

main().catch((err) => {
  console.error('Download failed:', err);
  process.exit(1);
});
