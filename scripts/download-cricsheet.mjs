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

const MAX_RETRIES = 3;
const BASE_RETRY_DELAY_MS = 3000;
const DOWNLOAD_TIMEOUT_MS = 90000;
const MIN_ARCHIVE_BYTES = 100 * 1024; // 100 KB sanity floor (real Cricsheet archives are 10-20 MB)

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isValidZipBuffer(buf) {
  if (!buf || buf.length < MIN_ARCHIVE_BYTES) {
    return { valid: false, reason: `size too small (${buf ? buf.length : 0} bytes)` };
  }
  // Check local file header signature: PK\x03\x04
  if (buf[0] !== 0x50 || buf[1] !== 0x4b || buf[2] !== 0x03 || buf[3] !== 0x04) {
    const preview = buf.subarray(0, 64).toString('utf8').replace(/\s+/g, ' ').trim();
    return { valid: false, reason: `missing ZIP magic bytes (starts with: "${preview.slice(0, 48)}")` };
  }
  // Check End of Central Directory (EOCD) signature PK\x05\x06 in the last 65KB
  const searchStart = Math.max(0, buf.length - 65557);
  const eocdSig = Buffer.from([0x50, 0x4b, 0x05, 0x06]);
  if (buf.indexOf(eocdSig, searchStart) === -1) {
    return { valid: false, reason: 'missing ZIP end-of-central-directory signature (truncated download)' };
  }
  return { valid: true };
}

function isValidZipFile(filePath) {
  if (!fs.existsSync(filePath)) return false;
  try {
    const stat = fs.statSync(filePath);
    if (stat.size < MIN_ARCHIVE_BYTES) return false;
    const fd = fs.openSync(filePath, 'r');
    try {
      const header = Buffer.alloc(4);
      fs.readSync(fd, header, 0, 4, 0);
      if (header[0] !== 0x50 || header[1] !== 0x4b || header[2] !== 0x03 || header[3] !== 0x04) {
        return false;
      }
      const tailLen = Math.min(stat.size, 65557);
      const tail = Buffer.alloc(tailLen);
      fs.readSync(fd, tail, 0, tailLen, stat.size - tailLen);
      const eocdSig = Buffer.from([0x50, 0x4b, 0x05, 0x06]);
      return tail.indexOf(eocdSig) !== -1;
    } finally {
      fs.closeSync(fd);
    }
  } catch {
    return false;
  }
}

function computeSha256(filePath) {
  const fileBuffer = fs.readFileSync(filePath);
  const hashSum = crypto.createHash('sha256');
  hashSum.update(fileBuffer);
  return hashSum.digest('hex');
}

async function downloadFile(url, destPath, maxRetries = MAX_RETRIES) {
  let lastError;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), DOWNLOAD_TIMEOUT_MS);
    try {
      console.log(`Downloading ${url} (attempt ${attempt}/${maxRetries}) ...`);
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          'Accept': 'application/zip, application/octet-stream, */*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
          'Referer': 'https://cricsheet.org/downloads/',
        },
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status} ${response.statusText}`);
      }
      const contentType = (response.headers.get('content-type') || '').toLowerCase();
      if (contentType.includes('text/html') || contentType.includes('text/plain')) {
        throw new Error(`Unexpected Content-Type "${contentType}" (likely upstream challenge/error page)`);
      }
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const zipCheck = isValidZipBuffer(buffer);
      if (!zipCheck.valid) {
        throw new Error(`Invalid ZIP archive received: ${zipCheck.reason}`);
      }
      const tempPath = `${destPath}.tmp`;
      fs.writeFileSync(tempPath, buffer);
      fs.renameSync(tempPath, destPath);
      console.log(`Saved to ${destPath} (${(buffer.byteLength / 1024 / 1024).toFixed(2)} MB)`);
      return;
    } catch (err) {
      lastError = err;
      const isAbort = err.name === 'AbortError';
      const errMsg = isAbort ? `Request timed out after ${DOWNLOAD_TIMEOUT_MS / 1000}s` : err.message;
      console.warn(`Attempt ${attempt}/${maxRetries} failed: ${errMsg}`);
      if (attempt < maxRetries) {
        const delay = BASE_RETRY_DELAY_MS * Math.pow(2, attempt - 1);
        console.log(`Retrying in ${delay / 1000}s...`);
        await sleep(delay);
      }
    } finally {
      clearTimeout(timeoutId);
    }
  }
  throw new Error(`Failed to download ${url} after ${maxRetries} attempts: ${lastError?.message}`);
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
    if (!forceDownload && isValidZipFile(destPath)) {
      console.log(`Archive ${item.filename} already exists locally and passed ZIP integrity check.`);
    } else {
      try {
        await downloadFile(item.url, destPath);
      } catch (err) {
        const tempPath = `${destPath}.tmp`;
        if (fs.existsSync(tempPath)) {
          try { fs.unlinkSync(tempPath); } catch { /* ignore */ }
        }
        if (isValidZipFile(destPath)) {
          console.warn(`[FALLBACK] Download failed for ${item.filename} (${err.message}), but existing cached archive passed ZIP integrity check (${(fs.statSync(destPath).size / 1024 / 1024).toFixed(2)} MB). Continuing with cached data.`);
        } else {
          if (fs.existsSync(destPath)) {
            console.warn(`Removing corrupted local archive ${destPath}`);
            try { fs.unlinkSync(destPath); } catch { /* ignore */ }
          }
          console.error(`Error downloading ${item.filename}:`, err.message);
          throw err;
        }
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
