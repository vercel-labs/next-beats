import { COVER_ASSET_VERSION } from './generated-cover-version';

// Every seeded track has an art-directed composition. Keyword matching is only the
// fallback for tracks added after the bundled catalog.
const trackMotifs: Record<string, number> = {
  'async await': 0,
  'websocket sunset': 1,
  'server sent vibes': 2,
  hydration: 3,
  'hot module reload': 4,
  'localhost morning': 5,
  'readme love letter': 6,
  'open source crush': 7,
  'sunday deploy': 8,
  'npm install feelings': 9,
  'ship it': 10,
  'stack overflow flow': 11,
  '3 am push': 12,
  'merge conflict': 13,
  'git push --force': 14,
  'pixel perfect': 15,
  'tailwind hearts': 16,
  'component chemistry': 17,
  'type safe love': 18,
  'first contentful paint': 19,
  'slow build': 20,
  'console calm': 21,
  'soft reset': 22,
  'idle thread': 23,
  'npm install sleep': 24,
  'neon terminal': 25,
  'retro compiler': 26,
  'cyber monday': 27,
  'chrome dreams': 28,
  'midnight deploy': 29,
  'race condition': 30,
  deadlock: 31,
  backpressure: 32,
  'commit message': 33,
  'force push': 34,
  'cache hit': 35,
  'null pointer': 36,
  'vibe coding': 37,
  'pr approved': 38,
  'localhost lullaby': 39,
  'stack trace': 40,
  'crt glow': 41,
  'modem handshake': 42,
  'bios boot': 43,
};

const motifs = [
  { index: 46, test: /love|crush|heart|feeling|romance|kiss|\bpop\b/ },
  { index: 45, test: /sunset|sunrise|synth|morning|midnight|dawn|dusk|night|dream|lullaby|sunday/ },
  { index: 51, test: /sleep|calm|idle|slow|soft|quiet|rest|dark|lo-?fi/ },
  { index: 47, test: /pixel|crt|terminal|bios|compil|console|retro|neon|paint|chrome|glow|render/ },
  { index: 50, test: /merge|conflict|stack|trace|overflow|deadlock|pointer|commit|cache|approv|reset|branch|diff/ },
  { index: 49, test: /async|await|chemistr|component|thread|race|condition|atom|orbit|cycle|promise|indie/ },
  { index: 48, test: /energ|electro|push|force|ship|deploy|boot|monday|vibe|beat|drop|bass|fast/ },
  {
    index: 44,
    test: /hydrat|water|ripple|backpressure|socket|stream|wave|flow|handshake|reload|hot|echo|pulse|hip-?hop/,
  },
] as const;

const GENERIC_TRACK_MOTIF_COUNT = 8;
export const PLAYLIST_VARIANT_COUNT = 4;

export type ArtworkKind = 'track' | 'album' | 'playlist' | 'genre';

/** Every movement is constructed to return to its origin over this live loop. */
export const COVER_LOOP_SECONDS = 12;

const genreMotifs: Record<string, number> = {
  electronic: 0,
  synthwave: 1,
  'hip-hop': 2,
  indie: 3,
  pop: 4,
  'lo-fi': 5,
};

const playlistMotifs: Record<string, number> = {
  myplaylist: 0,
  'high energy': 1,
  'morning vibes': 2,
  'late night coding': 3,
};

// `kind` matches the shader: 0 is a square cover, 3 a genre banner. Thumbnails sample a
// slightly wider field than the large art so the complete title-specific silhouette has
// breathing room instead of turning into one cropped edge at 40px.
export const COVER_SHAPES = [
  { detail: 1, height: 512, name: 'square', width: 512 },
  { detail: 1.08, height: 80, name: 'thumb', width: 80 },
  { detail: 1, height: 288, name: 'banner', width: 960 },
  { detail: 1.08, height: 96, name: 'banner-thumb', width: 320 },
] as const;

export type CoverShape = (typeof COVER_SHAPES)[number]['name'];

export function seedVector(value: string): [number, number, number, number] {
  let a = 0x9e3779b9;
  let b = 0x243f6a88;
  let c = 0xb7e15162;
  let d = 0xdeadbeef;

  for (let index = 0; index < value.length; index += 1) {
    const code = value.charCodeAt(index);
    a = Math.imul(a ^ code, 2654435761);
    b = Math.imul(b ^ code, 1597334677);
    c = Math.imul(c ^ code, 2246822519);
    d = Math.imul(d ^ code, 3266489917);
  }

  return [a, b, c, d].map(number => (number >>> 0) / 4294967295) as [number, number, number, number];
}

export function artworkVariant(label: string, kind: ArtworkKind, fallback: number) {
  if (kind === 'genre') return genreMotifs[label.toLowerCase()] ?? Math.floor(fallback * 6);
  if (kind === 'playlist') {
    return (
      playlistMotifs[label.toLowerCase()] ??
      Math.min(PLAYLIST_VARIANT_COUNT - 1, Math.floor(fallback * PLAYLIST_VARIANT_COUNT))
    );
  }
  return motifForTitle(label, fallback);
}

function assetKey(value: string) {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9-]+/g, '-')
      .replace(/^-|-$/g, '') || 'cover'
  );
}

export function coverAssetPath(seed: string, label: string, kind: ArtworkKind, shape: CoverShape) {
  if (kind === 'genre') return `/covers/genres/${assetKey(label)}-${shape}.static.webp`;
  if (kind === 'playlist') {
    const variant = artworkVariant(label, kind, seedVector(seed)[3]);
    return `/covers/playlists/${variant}-${shape}.static.webp`;
  }
  return `/covers/tracks/${assetKey(seed)}-${shape}.static.webp`;
}

export function coverAsset(seed: string, label: string, kind: ArtworkKind, shape: CoverShape) {
  const dimensions = COVER_SHAPES.find(candidate => candidate.name === shape)!;
  const sizes = shape === 'square' ? '512px' : shape === 'thumb' ? '80px' : `${dimensions.width}px`;
  const path = coverAssetPath(seed, label, kind, shape);
  return {
    height: dimensions.height,
    sizes,
    src: `${path}?v=${COVER_ASSET_VERSION}`,
    width: dimensions.width,
  };
}

export function motifForTitle(title: string, fallback: number) {
  const value = title.toLowerCase();
  const directed = trackMotifs[value];
  if (directed !== undefined) return directed;
  for (const motif of motifs) {
    if (motif.test.test(value)) return motif.index;
  }
  return 44 + Math.min(GENERIC_TRACK_MOTIF_COUNT - 1, Math.floor(fallback * GENERIC_TRACK_MOTIF_COUNT));
}
