// Picks which form a cover takes from its title, so the artwork is about the song. First
// match wins, so ordering matters: "WebSocket Sunset" should be a limb, not a swell, and
// "Console Calm" should be dunes, not panels.
const motifs = [
  { index: 2, test: /love|crush|heart|feeling|romance|kiss|\bpop\b/ }, // satin
  { index: 1, test: /sunset|sunrise|synth|morning|midnight|dawn|dusk|night|dream|lullaby|sunday/ }, // limb
  { index: 7, test: /sleep|calm|idle|slow|soft|quiet|rest|dark|lo-?fi/ }, // dunes
  { index: 3, test: /pixel|crt|terminal|bios|compil|console|retro|neon|paint|chrome|glow|render/ }, // panels
  { index: 6, test: /merge|conflict|stack|trace|overflow|deadlock|pointer|commit|cache|approv|reset|branch|diff/ }, // tunnel
  { index: 5, test: /async|await|chemistr|component|thread|race|condition|atom|orbit|cycle|promise|indie/ }, // cluster
  { index: 4, test: /energ|electro|push|force|ship|deploy|boot|monday|vibe|beat|drop|bass|fast/ }, // strata
  {
    index: 0,
    test: /hydrat|water|ripple|backpressure|socket|stream|wave|flow|handshake|reload|hot|echo|pulse|hip-?hop/,
  }, // swell
] as const;

const referenceMotifs = [
  { index: 13, test: /^pixel perfect$/ },
  { index: 8, test: /^ship it$/ },
  { index: 9, test: /^tailwind hearts$/ },
  { index: 15, test: /^type safe love$/ },
  { index: 10, test: /^stack overflow flow$/ },
  { index: 14, test: /^component chemistry$/ },
  { index: 11, test: /^hot module reload$/ },
  { index: 12, test: /^3 am push$/ },
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
  { detail: 1.08, height: 80, name: 'thumb', width: 80 },
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

export function coverAssetPath(seed: string, label: string, kind: ArtworkKind, shape: CoverShape, still = false) {
  const suffix = still ? '.static.webp' : '.webp';
  if (kind === 'genre') return `/covers/genres/${assetKey(label)}-${shape}${suffix}`;
  if (kind === 'playlist') {
    const variant = artworkVariant(label, kind, seedVector(seed)[3]);
    return `/covers/playlists/${variant}-${shape}${suffix}`;
  }
  return `/covers/tracks/${assetKey(seed)}-${shape}${suffix}`;
}

export function motifForTitle(title: string, fallback: number) {
  const value = title.toLowerCase();
  for (const motif of referenceMotifs) {
    if (motif.test.test(value)) return motif.index;
  }
  for (const motif of motifs) {
    if (motif.test.test(value)) return motif.index;
  }
  return Math.min(GENERIC_TRACK_MOTIF_COUNT - 1, Math.floor(fallback * GENERIC_TRACK_MOTIF_COUNT));
}
