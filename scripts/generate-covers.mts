// Pre-generates WebP first frames through vGPU. Large artwork animates live after
// hydration; these stills make its first paint and compact thumbnails immediate.
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PrismaPg } from '@prisma/adapter-pg';
import { resolveShader } from '@vgpu/wgsl/runtime';
import { config } from 'dotenv';
import { PNG } from 'pngjs';
import { draw, init, target } from 'vgpu/node';
import { PrismaClient } from '../generated/prisma/client.ts';
import { normalizeDatabaseUrl } from '../lib/database-url.ts';
import { COVER_SHAPES, coverAssetPath } from '../features/artwork/cover-assets.ts';
import type { CoverShape } from '../features/artwork/cover-assets.ts';
import { artworkVariant, PLAYLIST_VARIANT_COUNT, seedVector } from '../features/artwork/artwork-motif.ts';
import type { ArtworkKind } from '../features/artwork/artwork-motif.ts';
import type { Draw, Gpu } from 'vgpu';

config({ path: '.env.local' });

type CoverItem = { kind: ArtworkKind; label: string; seed: string };
const COVER_VERSION_PATH = 'features/artwork/generated-cover-version.ts';
const kindIndex: Record<ArtworkKind, number> = { album: 1, genre: 3, playlist: 2, track: 0 };

async function coverCatalog(): Promise<CoverItem[]> {
  const connectionString = normalizeDatabaseUrl(process.env.DATABASE_URL!);
  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
  try {
    const tracks = await prisma.track.findMany({ orderBy: { id: 'asc' }, select: { id: true, title: true } });
    if (tracks.length === 0) throw new Error('No tracks found. Seed the database before running pnpm covers:icons.');

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
  const names: CoverShape[] = kind === 'genre' ? ['banner', 'banner-thumb'] : ['square', 'thumb'];
  return COVER_SHAPES.filter(shape => names.includes(shape.name));
}

function outputPath(item: CoverItem, shape: CoverShape) {
  return join('public', coverAssetPath(item.seed, item.label, item.kind, shape).slice(1));
}

function updateCoverVersion(paths: readonly string[]) {
  const hash = createHash('sha256');
  for (const path of [...paths].sort()) hash.update(path).update(readFileSync(path));
  const version = hash.digest('hex').slice(0, 12);
  const source = `// Updated by \`pnpm covers:icons\` whenever the generated WebPs change.\nexport const COVER_ASSET_VERSION = '${version}';\n`;
  if (!existsSync(COVER_VERSION_PATH) || readFileSync(COVER_VERSION_PATH, 'utf8') !== source) {
    writeFileSync(COVER_VERSION_PATH, source);
  }
}

function unpremultiply(pixels: Uint8Array) {
  for (let index = 0; index < pixels.length; index += 4) {
    const alpha = pixels[index + 3];
    if (alpha === 0 || alpha === 255) continue;
    const scale = 255 / alpha;
    pixels[index] = Math.min(255, Math.round(pixels[index] * scale));
    pixels[index + 1] = Math.min(255, Math.round(pixels[index + 1] * scale));
    pixels[index + 2] = Math.min(255, Math.round(pixels[index + 2] * scale));
  }
  return pixels;
}

async function writeCoverFrame(
  gpu: Gpu,
  cover: Draw,
  item: CoverItem,
  shape: (typeof COVER_SHAPES)[number],
  path: string,
) {
  const output = target(gpu, {
    label: `cover-${item.kind}-${item.seed}-${shape.name}`,
    size: [shape.width, shape.height],
  });
  const values = seedVector(item.seed);
  const variant = artworkVariant(item.label, item.kind, values[3]);
  cover.set({
    cover: {
      params: [0, kindIndex[item.kind], variant, 0],
      seed: values,
      shape: [shape.width / shape.height, shape.detail, 0, 0],
    },
  });
  cover.draw(output);

  const png = new PNG({ height: shape.height, width: shape.width });
  png.data.set(unpremultiply(await output.read()));
  writeFileSync(path, PNG.sync.write(png));
  output.color.destroy();
}

async function main() {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required. Add it to .env.local first.');
  const catalog = await coverCatalog();
  const resolved = await resolveShader({
    entry: fileURLToPath(new URL('../features/artwork/artwork.wgsl', import.meta.url)),
  });
  const gpu = await init({ powerPreference: 'low-power' });

  try {
    const cover = draw(gpu, {
      entry: { fragment: 'fs_main' },
      label: 'cover-generator',
      shader: resolved.wgsl,
    });

    const generatedPaths: string[] = [];
    const report: string[] = [];
    for (const item of catalog) {
      for (const shape of shapesFor(item.kind)) {
        console.log(`[cover] ${item.kind.padEnd(8)} ${item.label.padEnd(28)} ${shape.name}`);
        const scratch = mkdtempSync(join(tmpdir(), 'next-beats-covers-'));
        try {
          const framePath = join(scratch, 'cover.png');
          await writeCoverFrame(gpu, cover, item, shape, framePath);

          const still = outputPath(item, shape.name);
          mkdirSync(dirname(still), { recursive: true });
          execFileSync('img2webp', ['-lossy', '-q', '78', '-m', '3', framePath, '-o', still], { stdio: 'pipe' });
          generatedPaths.push(still);
          report.push(`${still.padEnd(62)} ${(readFileSync(still).length / 1024).toFixed(0)} KB`);
        } finally {
          rmSync(scratch, { force: true, recursive: true });
        }
      }
    }

    updateCoverVersion(generatedPaths);
    console.log(report.join('\n'));
    console.log(`\n${report.length} static fallback assets.`);
  } finally {
    await gpu.settled();
    gpu.dispose();
  }
}

await main();
