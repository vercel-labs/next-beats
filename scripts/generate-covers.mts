 
// Pre-generates deterministic WebP fallback cover overlays through vGPU in Chrome.
// Chrome is the render backend on macOS because vGPU's Node software renderer is
// Linux-only. Large artwork animates live; these stills cover loading, reduced motion,
// small thumbnails, and browsers without WebGPU.
import { execFileSync, spawn } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { PrismaPg } from '@prisma/adapter-pg';
import { chromium } from '@playwright/test';
import { config } from 'dotenv';
import { PrismaClient } from '../generated/prisma/client.ts';
import { normalizeDatabaseUrl } from '../lib/database-url.ts';
import {
  artworkVariant,
  COVER_SHAPES,
  coverAssetPath,
  PLAYLIST_VARIANT_COUNT,
  seedVector,
} from '../lib/cover-motif.ts';
import type { ArtworkKind, CoverShape } from '../lib/cover-motif.ts';
import type { ChildProcess } from 'node:child_process';

config({ path: '.env.local' });

type CoverItem = { kind: ArtworkKind; label: string; seed: string };
type StudioOptions = {
  detail: number;
  height: number;
  kind: ArtworkKind;
  label: string;
  mode?: 'final' | 'normal' | 'sdf';
  seed: string;
  turn: number;
  width: number;
};

const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const STUDIO_PORT = Number(process.env.COVER_STUDIO_PORT ?? 3217);
const STUDIO_FALLBACK_URL = `http://127.0.0.1:${STUDIO_PORT}/cover-studio`;

async function isReachable(url: string) {
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(1_500) });
    return response.ok;
  } catch {
    return false;
  }
}

async function studioServer() {
  const configured = process.env.COVER_STUDIO_URL;
  if (configured) return { child: undefined, url: configured };

  const child = spawn('pnpm', ['dev', '--hostname', '127.0.0.1', '--port', String(STUDIO_PORT)], {
    env: { ...process.env, COVER_STUDIO: '1', NEXT_DIST_DIR: '.next-cover-studio' },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let logs = '';
  child.stdout?.on('data', chunk => (logs += String(chunk)));
  child.stderr?.on('data', chunk => (logs += String(chunk)));

  for (let attempt = 0; attempt < 90; attempt += 1) {
    if (child.exitCode !== null) throw new Error(`Cover studio exited early.\n${logs}`);
    if (await isReachable(STUDIO_FALLBACK_URL)) return { child, url: STUDIO_FALLBACK_URL };
    await delay(1_000);
  }

  child.kill('SIGTERM');
  throw new Error(`Timed out starting the cover studio.\n${logs}`);
}

function stopServer(child: ChildProcess | undefined) {
  if (child?.exitCode === null) child.kill('SIGTERM');
}

async function coverCatalog(): Promise<CoverItem[]> {
  const connectionString = normalizeDatabaseUrl(process.env.DATABASE_URL!);
  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
  try {
    const tracks = await prisma.track.findMany({ orderBy: { id: 'asc' }, select: { id: true, title: true } });
    if (tracks.length === 0) throw new Error('No tracks found. Seed the database before running pnpm covers.');

    const trackItems: CoverItem[] = tracks.map(track => ({ kind: 'track', label: track.title, seed: track.id }));
    const genreItems: CoverItem[] = ['electronic', 'synthwave', 'hip-hop', 'indie', 'pop', 'lo-fi'].map(genre => ({
      kind: 'genre',
      label: genre,
      seed: genre,
    }));
    const playlistItems: CoverItem[] = [];
    for (let variant = 0; variant < PLAYLIST_VARIANT_COUNT; variant += 1) {
      for (let candidate = 0; candidate < 10_000; candidate += 1) {
        const seed = `playlist-variant-${variant}-${candidate}`;
        if (artworkVariant(seed, 'playlist', seedVector(seed)[3]) !== variant) continue;
        playlistItems.push({ kind: 'playlist', label: seed, seed });
        break;
      }
    }
    return [...trackItems, ...playlistItems, ...genreItems];
  } finally {
    await prisma.$disconnect();
  }
}

function shapesFor(kind: ArtworkKind) {
  const names: CoverShape[] = kind === 'genre' ? ['banner'] : kind === 'playlist' ? ['square'] : ['square', 'thumb'];
  return COVER_SHAPES.filter(shape => names.includes(shape.name));
}

function outputPath(item: CoverItem, shape: CoverShape) {
  return join('public', coverAssetPath(item.seed, item.label, item.kind, shape, true).slice(1));
}

function pngBytes(dataUrl: string) {
  return Buffer.from(dataUrl.slice(dataUrl.indexOf(',') + 1), 'base64');
}

async function main() {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required. Add it to .env.local first.');
  const catalog = await coverCatalog();
  const sampleIds = new Set(['t11', 't16', 't17', 't18']);
  const items = process.argv.includes('--sample')
    ? catalog.filter(item => item.kind !== 'track' || sampleIds.has(item.seed))
    : catalog;
  const { child, url } = await studioServer();
  const browser = await chromium.launch({
    args: ['--disable-gpu-sandbox', '--enable-unsafe-webgpu'],
    executablePath: existsSync(CHROME_PATH) ? CHROME_PATH : undefined,
    headless: process.env.COVER_HEADLESS === '1',
  });

  try {
    const page = await browser.newPage();
    page.on('console', message => console.log(`[cover-studio:${message.type()}] ${message.text()}`));
    page.on('pageerror', error => console.error(`[cover-studio:error] ${error.message}`));
    await page.context().addCookies([{ name: 'beats-user', value: 'cover-studio', url: new URL(url).origin }]);
    await page.goto(url, { waitUntil: 'networkidle' });
    await page.waitForTimeout(3_000);
    console.log(`[cover-studio:status] ${await page.locator('[data-cover-studio-status]').innerText()}`);
    await page.waitForFunction(
      () => window.__coverStudioReady === true || typeof window.__coverStudioError === 'string',
      undefined,
      { timeout: 60_000 },
    );
    const studioError = await page.evaluate(() => window.__coverStudioError);
    if (studioError) throw new Error(`Cover studio failed: ${studioError}`);

    const report: string[] = [];
    for (const item of items) {
      for (const shape of shapesFor(item.kind)) {
        console.log(`[cover] ${item.kind.padEnd(8)} ${item.label.padEnd(28)} ${shape.name}`);
        const scratch = mkdtempSync(join(tmpdir(), 'next-beats-covers-'));
        try {
          const options: StudioOptions = {
            detail: shape.detail,
            height: shape.height,
            kind: item.kind,
            label: item.label,
            seed: item.seed,
            turn: seedVector(item.seed)[3],
            width: shape.width,
          };
          const dataUrl = await page.evaluate(async value => {
            if (!window.__renderCoverFrame) throw new Error('Cover studio renderer is unavailable.');
            return window.__renderCoverFrame(value);
          }, options);
          const framePath = join(scratch, 'cover.png');
          writeFileSync(framePath, pngBytes(dataUrl));

          const still = outputPath(item, shape.name);
          mkdirSync(dirname(still), { recursive: true });
          execFileSync('img2webp', ['-lossy', '-q', '78', '-m', '3', framePath, '-o', still], { stdio: 'pipe' });
          report.push(`${still.padEnd(62)} ${(readFileSync(still).length / 1024).toFixed(0)} KB`);
        } finally {
          rmSync(scratch, { force: true, recursive: true });
        }
      }
    }

    console.log(report.join('\n'));
    console.log(`\n${report.length} static fallback assets.`);
  } finally {
    await browser.close();
    stopServer(child);
  }
}

await main();
