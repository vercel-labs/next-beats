// Bakes the cover shader into looping WebP overlays, so the app ships artwork as image
// assets instead of running WebGPU on every page.
//
// The shader emits a transparent luminance overlay, so one asset works for every item
// that shares a motif -- the colour still comes from each element's own CSS gradient.
// That means the output is 8 motifs x 2 shapes, not one file per track.
//
//   pnpm covers
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { deflateSync } from 'node:zlib';
import { effect, init, target } from 'vgpu/node';
import { COVER_FRAME_MS, COVER_FRAMES, COVER_SHAPES, MOTIF_COUNT, coverAssetName } from '../lib/cover-motif.ts';

const SHADER = readFileSync('components/ui/album-art.wgsl', 'utf8');
const OUT_DIR = 'public/covers';

function crc32(buffer: Buffer) {
  let crc = ~0;
  for (const byte of buffer) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
  }
  return ~crc >>> 0;
}

function pngChunk(type: string, data: Buffer) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([length, body, crc]);
}

/** Straight-alpha RGBA to PNG. Avoids pulling an encoder dependency into the project. */
function writePng(path: string, width: number, height: number, rgba: Uint8Array) {
  const stride = width * 4;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y += 1) {
    raw[y * (stride + 1)] = 0;
    Buffer.from(rgba.buffer, rgba.byteOffset + y * stride, stride).copy(raw, y * (stride + 1) + 1);
  }
  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header[8] = 8;
  header[9] = 6;
  writeFileSync(
    path,
    Buffer.concat([
      Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
      pngChunk('IHDR', header),
      pngChunk('IDAT', deflateSync(raw, { level: 6 })),
      pngChunk('IEND', Buffer.alloc(0)),
    ]),
  );
}

/**
 * The shader writes premultiplied alpha because that is what the browser composites a
 * canvas with. PNG and WebP store straight alpha, so undo the premultiplication.
 */
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

// A fixed seed: assets are shared per motif, so the light has to be identical for every
// item that uses one.
const SEED: [number, number, number, number] = [0.31, 0.62, 0.0, 0.17];

const gpu = await init();
const cover = effect(gpu, SHADER);
mkdirSync(OUT_DIR, { recursive: true });

const report: string[] = [];

for (const shape of COVER_SHAPES) {
  const canvas = target(gpu, { size: [shape.width, shape.height] });
  const frames = target(gpu, { size: [shape.width, shape.height] });
  void frames;

  for (let motif = 0; motif < MOTIF_COUNT; motif += 1) {
    const scratch = mkdtempSync(join(tmpdir(), 'covers-'));
    const framePaths: string[] = [];

    for (let index = 0; index < COVER_FRAMES; index += 1) {
      cover.set({
        cover: {
          params: [index / COVER_FRAMES, shape.kind, motif, 2 / shape.height],
          seed: SEED,
          shape: [shape.width / shape.height, 0, 0, 0],
        },
      });
      cover.draw(canvas);
      const pixels = unpremultiply(await canvas.read());
      const framePath = join(scratch, `${String(index).padStart(3, '0')}.png`);
      writePng(framePath, shape.width, shape.height, pixels);
      framePaths.push(framePath);
    }

    const out = join(OUT_DIR, `${coverAssetName(motif, shape.name)}.webp`);
    execFileSync(
      'img2webp',
      ['-loop', '0', '-lossy', '-q', '72', '-m', '6', '-d', String(COVER_FRAME_MS), ...framePaths, '-o', out],
      { stdio: 'pipe' },
    );
    rmSync(scratch, { recursive: true, force: true });

    const bytes = readFileSync(out).length;
    report.push(`${out.padEnd(42)} ${(bytes / 1024).toFixed(0)} KB`);
  }
}

console.log(report.join('\n'));
console.log(`\n${report.length} assets, ${COVER_FRAMES} frames each, ${COVER_FRAME_MS}ms/frame`);
gpu.dispose();
