// Album artwork drawn over the item's own Tailwind gradient: the base is the exact
// `coverColor` gradient, and everything added on top is light, ink and grain so the
// covers stay inside the app's palette. Kind picks the composition -- tracks get a
// sound print, albums a record, playlists a stack of sleeves.
struct Cover {
  stopA: vec4f,
  stopB: vec4f,
  seed: vec4f,
  // x: seconds, y: kind (0 track, 1 album, 2 playlist), z: variant, w: point units per CSS pixel
  params: vec4f,
}

@group(0) @binding(0) var<uniform> cover: Cover;

const TAU = 6.28318530718;

fn hash21(point: vec2f) -> f32 {
  return fract(sin(dot(point, vec2f(127.1, 311.7))) * 43758.5453);
}

fn rotate(point: vec2f, angle: f32) -> vec2f {
  let sine = sin(angle);
  let cosine = cos(angle);
  return vec2f(point.x * cosine - point.y * sine, point.x * sine + point.y * cosine);
}

// Bounded so highlights lift the gradient instead of blowing out to white.
fn screenBlend(base: vec3f, top: vec3f, amount: f32) -> vec3f {
  return mix(base, vec3f(1.0) - (vec3f(1.0) - base) * (vec3f(1.0) - top), clamp(amount, 0.0, 1.0));
}

fn sdBox(point: vec2f, halfSize: vec2f) -> f32 {
  let corner = abs(point) - halfSize;
  return min(max(corner.x, corner.y), 0.0) + length(max(corner, vec2f(0.0)));
}

// Stroke width in CSS pixels, so a motif reads the same at 40px and at 240px.
fn strokeWidth(pixels: f32) -> f32 {
  return max(pixels * cover.params.w, 0.016);
}

fn stroke(distance: f32, pixels: f32) -> f32 {
  let width = strokeWidth(pixels);
  let softness = max(fwidth(distance), 0.0001);
  return 1.0 - smoothstep(width - softness, width + softness, abs(distance));
}

fn fillMask(distance: f32) -> f32 {
  let softness = max(fwidth(distance), 0.0001);
  return 1.0 - smoothstep(-softness, softness, distance);
}

struct Artwork {
  ink: f32,
  shade: f32,
  sheen: f32,
}

fn soundPrint(point: vec2f, phase: f32, variant: f32) -> Artwork {
  var art = Artwork(0.0, 0.0, 0.0);
  let breathe = 1.0 + sin(phase * 1.6) * 0.02;

  if (variant < 1.0) {
    // Ripple: concentric rings, the outer ones fading like a decaying signal.
    let radius = length(point) / breathe;
    for (var ring = 0; ring < 4; ring += 1) {
      let ringRadius = 0.16 + f32(ring) * 0.14;
      art.ink += stroke(radius - ringRadius, 1.5 - f32(ring) * 0.18) * (1.0 - f32(ring) * 0.18);
    }
    art.ink += fillMask(length(point) - 0.055) * 0.85;
  } else if (variant < 2.0) {
    // Spectrum: bars mirrored around the centre line, each with its own drift.
    let columns = 9.0;
    let column = floor((point.x * 0.5 + 0.5) * columns);
    let inside = step(0.0, column) * step(column, columns - 1.0);
    let center = (column + 0.5) / columns * 2.0 - 1.0;
    let noise = hash21(vec2f(column, 3.0));
    let height = 0.16 + noise * 0.32 + sin(phase * 1.4 + noise * TAU) * 0.06;
    let bar = sdBox(vec2f(point.x - center, point.y), vec2f(0.038, height * 0.62));
    art.ink += stroke(bar, 1.4) * inside;
    art.ink += fillMask(bar) * inside * 0.22;
  } else {
    // Waveform: one traced line with a quieter reflection beneath it.
    let wave = point.y - sin(point.x * 4.6 + phase) * 0.16 * cos(point.x * 1.7);
    art.ink += stroke(wave, 1.6);
    let echo = point.y + 0.34 - sin(point.x * 4.6 + phase * 0.86) * 0.07;
    art.ink += stroke(echo, 1.1) * 0.4;
    let lead = point.y - 0.34 - sin(point.x * 4.6 + phase * 1.14) * 0.07;
    art.ink += stroke(lead, 1.1) * 0.4;
  }

  return art;
}

fn record(point: vec2f, phase: f32, variant: f32) -> Artwork {
  var art = Artwork(0.0, 0.0, 0.0);
  let radius = length(point);
  let disc = radius - 0.62;

  // The disc sits as a darker object on the gradient, which is what makes it read
  // as a record rather than as another glow.
  art.shade = fillMask(disc) * 0.4;
  art.ink += stroke(disc, 1.6);

  let grooves = 3.0 + floor(variant * 2.0);
  for (var groove = 0.0; groove < 4.0; groove += 1.0) {
    if (groove >= grooves) { break; }
    art.ink += stroke(radius - (0.3 + groove * 0.095), 1.0) * 0.32;
  }

  art.ink += stroke(radius - 0.2, 1.5) * 0.8;
  art.ink += fillMask(radius - 0.035) * 0.9;

  // Gloss band sweeping the disc, the one part that clearly moves.
  let direction = normalize(point + vec2f(0.0001));
  let lightDirection = vec2f(cos(phase * 0.8), sin(phase * 0.8));
  art.sheen = pow(max(dot(direction, lightDirection), 0.0), 6.0) * fillMask(disc);

  return art;
}

fn sleeves(point: vec2f, phase: f32, variant: f32) -> Artwork {
  var art = Artwork(0.0, 0.0, 0.0);
  let lean = 0.06 + variant * 0.05;

  // Back to front, each sleeve a little brighter than the one behind it.
  for (var layer = 2.0; layer >= 0.0; layer -= 1.0) {
    let offset = vec2f(0.1, -0.09) * layer;
    let card = sdBox(rotate(point + offset, -lean * layer), vec2f(0.44 - layer * 0.02));
    let mask = fillMask(card);
    art.shade = mix(art.shade, 0.34 - layer * 0.1, mask);
    art.ink = mix(art.ink, stroke(card, 1.5) * (1.0 - layer * 0.25), mask + stroke(card, 1.5));
  }

  // A small play mark on the front sleeve so the stack still reads as music.
  let mark = point - vec2f(0.02, 0.0);
  let bar = sdBox(vec2f(abs(mark.x) - 0.085, mark.y), vec2f(0.026, 0.13));
  art.ink += stroke(bar, 1.4) * 0.7;
  art.sheen = fillMask(sdBox(point, vec2f(0.44))) * max(0.0, sin(phase * 0.9)) * 0.5;

  return art;
}

@fragment
fn fs_main(@location(0) uv: vec2f) -> @location(0) vec4f {
  let point = uv * 2.0 - 1.0;
  let seed = cover.seed;
  let phase = cover.params.x * 0.28 + seed.z * TAU;
  let kind = cover.params.y;

  // Base is the item's own `bg-gradient-to-br`, so the cover matches its CSS fallback.
  let gradient = clamp((uv.x + uv.y) * 0.5, 0.0, 1.0);
  var color = mix(cover.stopA.rgb, cover.stopB.rgb, gradient);

  // Slow light drift gives the flat gradient some volume.
  let lightCenter = vec2f(-0.5, -0.55) + vec2f(cos(phase * 0.6), sin(phase * 0.8)) * 0.3;
  let light = exp(-dot(point - lightCenter, point - lightCenter) * 0.5);
  color = screenBlend(color, vec3f(1.0), light * 0.22);

  let shadeCenter = vec2f(0.6, 0.65) - vec2f(cos(phase * 0.6), sin(phase * 0.8)) * 0.22;
  color *= 1.0 - exp(-dot(point - shadeCenter, point - shadeCenter) * 0.7) * 0.26;

  var art = Artwork(0.0, 0.0, 0.0);
  if (kind < 0.5) {
    art = soundPrint(point, phase, cover.params.z);
  } else if (kind < 1.5) {
    art = record(point, phase, cover.params.z);
  } else {
    art = sleeves(point, phase, cover.params.z);
  }

  color *= 1.0 - clamp(art.shade, 0.0, 1.0);
  color = screenBlend(color, vec3f(1.0), clamp(art.ink, 0.0, 1.0) * 0.55);
  color = screenBlend(color, vec3f(1.0), clamp(art.sheen, 0.0, 1.0) * 0.16);

  // Sleeve edge: a hairline inset rule, the way a printed cover is trimmed.
  let trim = sdBox(point, vec2f(1.0 - 10.0 * cover.params.w));
  color = screenBlend(color, vec3f(1.0), stroke(trim, 1.0) * 0.1);

  // Corner falloff plus paper grain, both fixed so nothing shimmers frame to frame.
  color *= 1.0 - smoothstep(0.55, 1.6, length(point)) * 0.22;
  color += (hash21(floor(uv * 320.0) + seed.xy * 97.0) - 0.5) * 0.016;

  return vec4f(clamp(color, vec3f(0.0), vec3f(1.0)), 1.0);
}
