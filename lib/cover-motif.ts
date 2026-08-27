// Picks the artwork motif from an item's title so a cover is about its song. First
// match wins, so the ordering matters: "WebSocket Sunset" should be a horizon, not a
// ripple, and "Console Calm" should be a moon, not a terminal grid.
const motifs = [
  { index: 2, test: /love|crush|heart|feeling|romance|kiss|\bpop\b/ }, // heart
  { index: 1, test: /sunset|sunrise|synth|morning|midnight|dawn|dusk|night|dream|lullaby|sunday/ }, // horizon
  { index: 7, test: /sleep|calm|idle|slow|soft|quiet|rest|dark|lo-?fi/ }, // crescent
  { index: 3, test: /pixel|crt|terminal|bios|compil|console|retro|neon|paint|chrome|glow|render/ }, // grid
  { index: 6, test: /merge|conflict|stack|trace|overflow|deadlock|pointer|commit|cache|approv|reset|branch|diff/ }, // paths
  { index: 5, test: /async|await|chemistr|component|thread|race|condition|atom|orbit|cycle|promise|indie/ }, // orbit
  { index: 4, test: /energ|electro|push|force|ship|deploy|boot|monday|vibe|beat|drop|bass|fast/ }, // spectrum
  { index: 0, test: /hydrat|water|ripple|backpressure|socket|stream|wave|flow|handshake|reload|hot|echo|pulse|hip-?hop/ }, // ripple
] as const;

export const MOTIF_COUNT = 8;

/** Frames and cadence of the baked loop. 48 frames at 250ms is a 12s cycle. */
export const COVER_FRAMES = 48;
export const COVER_FRAME_MS = 250;
export const COVER_LOOP_SECONDS = (COVER_FRAMES * COVER_FRAME_MS) / 1000;

const motifNames = ['ripple', 'horizon', 'heart', 'grid', 'spectrum', 'orbit', 'paths', 'crescent'] as const;

// `kind` matches the shader: square covers print the motif bare, banners set it beside
// the label. Sizes are the largest the artwork is displayed at, times a little headroom.
export const COVER_SHAPES = [
  { height: 384, kind: 0, name: 'square', width: 384 },
  { height: 224, kind: 3, name: 'banner', width: 768 },
] as const;

export type CoverShape = (typeof COVER_SHAPES)[number]['name'];

export function coverAssetName(motif: number, shape: CoverShape) {
  return `${motifNames[motif] ?? motifNames[0]}-${shape}`;
}

/** Public URL of the baked overlay for a title. */
export function coverAssetUrl(title: string, fallback: number, shape: CoverShape) {
  return `/covers/${coverAssetName(motifForTitle(title, fallback), shape)}.webp`;
}

export function motifForTitle(title: string, fallback: number) {
  const value = title.toLowerCase();
  for (const motif of motifs) {
    if (motif.test.test(value)) return motif.index;
  }
  return Math.min(MOTIF_COUNT - 1, Math.floor(fallback * MOTIF_COUNT));
}
