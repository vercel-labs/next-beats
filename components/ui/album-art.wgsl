// Album artwork drawn over the item's own Tailwind gradient. The base reproduces the
// exact `coverColor` gradient, so a cover matches the CSS it sits on; everything added
// is light, ink and grain, which keeps the covers inside the app's palette.
//
// The motif comes from the title, so the artwork is about the song. The kind only picks
// how that motif is presented: a track prints it bare, an album sets it in a record, a
// playlist sets it on the front sleeve of a stack.
struct Cover {
  stopA: vec4f,
  stopB: vec4f,
  seed: vec4f,
  // x: seconds, y: kind (0 track, 1 album, 2 playlist), z: motif, w: point units per CSS pixel
  params: vec4f,
}

@group(0) @binding(0) var<uniform> cover: Cover;

const TAU = 6.28318530718;

struct Artwork {
  ink: f32,
  glow: f32,
  shade: f32,
}

fn hash21(point: vec2f) -> f32 {
  return fract(sin(dot(point, vec2f(127.1, 311.7))) * 43758.5453);
}

fn rotate(point: vec2f, angle: f32) -> vec2f {
  let sine = sin(angle);
  let cosine = cos(angle);
  return vec2f(point.x * cosine - point.y * sine, point.x * sine + point.y * cosine);
}

// Bounded, so highlights lift the gradient instead of blowing out to white.
fn screenBlend(base: vec3f, top: vec3f, amount: f32) -> vec3f {
  return mix(base, vec3f(1.0) - (vec3f(1.0) - base) * (vec3f(1.0) - top), clamp(amount, 0.0, 1.0));
}

fn sdBox(point: vec2f, halfSize: vec2f) -> f32 {
  let corner = abs(point) - halfSize;
  return min(max(corner.x, corner.y), 0.0) + length(max(corner, vec2f(0.0)));
}

fn sdSegment(point: vec2f, start: vec2f, end: vec2f) -> f32 {
  let offset = point - start;
  let span = end - start;
  return length(offset - span * clamp(dot(offset, span) / dot(span, span), 0.0, 1.0));
}

fn sdHeart(point: vec2f) -> f32 {
  var p = vec2f(abs(point.x), point.y);
  if (p.y + p.x > 1.0) {
    let d = p - vec2f(0.25, 0.75);
    return sqrt(dot(d, d)) - sqrt(2.0) / 4.0;
  }
  let a = p - vec2f(0.0, 1.0);
  let b = p - 0.5 * max(p.x + p.y, 0.0);
  return sqrt(min(dot(a, a), dot(b, b))) * sign(p.x - p.y);
}

// 1 while the cover is roughly under 70px, where fine detail turns to mush.
fn tiny() -> f32 {
  return step(0.029, cover.params.w);
}

// Strokes are specified in CSS pixels so a motif reads the same at 40px and 240px.
// `scale` compensates for motif coordinate spaces that were shrunk to fit a container.
fn strokeAt(distance: f32, pixels: f32, scale: f32) -> f32 {
  let width = max(pixels * cover.params.w, 0.014) / scale;
  let softness = max(fwidth(distance), 0.0001);
  return 1.0 - smoothstep(width - softness, width + softness, abs(distance));
}

fn fillAt(distance: f32) -> f32 {
  let softness = max(fwidth(distance), 0.0001);
  return 1.0 - smoothstep(-softness, softness, distance);
}

fn ripple(point: vec2f, phase: f32, scale: f32) -> Artwork {
  var art = Artwork(0.0, 0.0, 0.0);
  let radius = length(point);
  let swell = sin(phase * 1.2) * 0.022;
  let rings = 4.0 - tiny();

  for (var ring = 0.0; ring < 4.0; ring += 1.0) {
    if (ring >= rings) { break; }
    let at = 0.24 + ring * 0.19 + swell * (1.0 + ring * 0.4);
    let weight = 1.0 - ring * 0.17;
    art.ink += strokeAt(radius - at, 1.7 - ring * 0.2, scale) * weight;
    art.glow += strokeAt(radius - at, 5.0, scale) * weight * 0.3;
  }

  art.ink += fillAt(radius - 0.075) * 0.95;
  return art;
}

fn horizon(point: vec2f, phase: f32, scale: f32) -> Artwork {
  var art = Artwork(0.0, 0.0, 0.0);
  let line = 0.24;
  let sun = vec2f(0.0, line - 0.3 - sin(phase * 0.5) * 0.035);
  let disc = length(point - sun) - 0.34;

  // Sun sitting on the horizon, its lower half cut by the line.
  art.ink += strokeAt(disc, 1.9, scale) * step(point.y, line);
  art.glow += fillAt(disc) * 0.5 + strokeAt(disc, 7.0, scale) * 0.35;

  art.ink += strokeAt(point.y - line, 1.9, scale);
  if (tiny() < 0.5) {
    // Reflection bands below the water line.
    for (var band = 1.0; band < 4.0; band += 1.0) {
      let at = line + band * 0.15 + sin(phase * 0.9 + band) * 0.012;
      art.ink += strokeAt(point.y - at, 1.2, scale) * (0.42 - band * 0.09)
        * (1.0 - smoothstep(0.1, 0.55, abs(point.x)));
    }
  }
  return art;
}

fn heart(point: vec2f, phase: f32, scale: f32) -> Artwork {
  var art = Artwork(0.0, 0.0, 0.0);
  let beat = 1.0 + max(0.0, sin(phase * 2.2)) * 0.035;
  let local = vec2f(point.x, -point.y + 0.16) / (0.62 * beat);
  let distance = sdHeart(local) * 0.62 * beat;

  art.ink += strokeAt(distance, 2.0, scale);
  art.glow += fillAt(distance) * 0.42 + strokeAt(distance, 7.0, scale) * 0.3;
  return art;
}

fn grid(point: vec2f, phase: f32, scale: f32) -> Artwork {
  var art = Artwork(0.0, 0.0, 0.0);
  let cells = select(5.0, 3.0, tiny() > 0.5);
  let span = 0.86;
  let inside = fillAt(sdBox(point, vec2f(span)));
  let cell = point / span * cells * 0.5;
  let index = floor(cell);
  let local = fract(cell) - 0.5;
  let lit = smoothstep(0.42, 0.78, hash21(index + floor(phase * 0.35) * 7.0));
  let block = sdBox(local, vec2f(0.34));

  art.ink += fillAt(block) * inside * (0.2 + lit * 0.7);
  art.glow += fillAt(block) * inside * lit * 0.5;
  art.ink += strokeAt(sdBox(point, vec2f(span)), 1.6, scale);
  return art;
}

fn spectrum(point: vec2f, phase: f32, scale: f32) -> Artwork {
  var art = Artwork(0.0, 0.0, 0.0);
  let bars = select(7.0, 4.0, tiny() > 0.5);
  let span = 0.88;
  let column = floor((point.x / span * 0.5 + 0.5) * bars);
  let inside = step(0.0, column) * step(column, bars - 1.0) * step(abs(point.x), span);
  let center = ((column + 0.5) / bars * 2.0 - 1.0) * span;
  let noise = hash21(vec2f(column, 5.0));
  let height = 0.22 + noise * 0.44 + sin(phase * 1.3 + noise * TAU) * 0.09;
  let bar = sdBox(vec2f(point.x - center, point.y), vec2f(span / bars * 0.34, height));

  art.ink += fillAt(bar) * inside * 0.62;
  art.ink += strokeAt(bar, 1.5, scale) * inside;
  art.glow += fillAt(bar) * inside * 0.3;
  return art;
}

fn orbit(point: vec2f, phase: f32, scale: f32) -> Artwork {
  var art = Artwork(0.0, 0.0, 0.0);
  let shells = 3.0 - tiny();

  for (var shell = 0.0; shell < 3.0; shell += 1.0) {
    if (shell >= shells) { break; }
    let turned = rotate(point, shell * TAU / 3.0 + phase * 0.16);
    let ellipse = length(vec2f(turned.x, turned.y * 2.6)) - 0.66;
    art.ink += strokeAt(ellipse, 1.5, scale) * 0.85;
    art.glow += strokeAt(ellipse, 5.0, scale) * 0.2;
  }

  art.ink += fillAt(length(point) - 0.1) * 0.95;
  let electron = rotate(vec2f(0.66, 0.0), -phase * 1.1);
  art.ink += fillAt(length(point - vec2f(electron.x, electron.y / 2.6)) - 0.055) * 0.9;
  art.glow += 0.35;
  return art;
}

fn paths(point: vec2f, phase: f32, scale: f32) -> Artwork {
  var art = Artwork(0.0, 0.0, 0.0);
  let junction = vec2f(0.1 + sin(phase * 0.6) * 0.03, 0.0);

  // Two branches meeting and continuing as one.
  art.ink += strokeAt(sdSegment(point, vec2f(-0.82, -0.5), junction), 1.9, scale);
  art.ink += strokeAt(sdSegment(point, vec2f(-0.82, 0.5), junction), 1.9, scale);
  art.ink += strokeAt(sdSegment(point, junction, vec2f(0.82, 0.0)), 1.9, scale);
  art.ink += fillAt(length(point - junction) - 0.085) * 0.95;
  art.glow += strokeAt(length(point - junction) - 0.085, 8.0, scale) * 0.45;

  if (tiny() < 0.5) {
    art.ink += fillAt(length(point - vec2f(-0.82, -0.5)) - 0.05) * 0.7;
    art.ink += fillAt(length(point - vec2f(-0.82, 0.5)) - 0.05) * 0.7;
  }
  return art;
}

fn crescent(point: vec2f, phase: f32, scale: f32) -> Artwork {
  var art = Artwork(0.0, 0.0, 0.0);
  let drift = sin(phase * 0.4) * 0.02;
  let full = length(point - vec2f(0.04, 0.0)) - 0.6;
  let bite = length(point - vec2f(0.26 + drift, -0.1)) - 0.5;
  let moon = max(full, -bite);

  art.ink += strokeAt(moon, 2.0, scale);
  art.glow += fillAt(moon) * 0.45 + strokeAt(moon, 7.0, scale) * 0.3;

  if (tiny() < 0.5) {
    // A couple of stars, fixed by position so they never flicker.
    for (var star = 0.0; star < 3.0; star += 1.0) {
      let at = vec2f(-0.52 + star * 0.1, -0.66 + star * 0.62);
      art.ink += fillAt(length(point - at) - 0.028) * 0.75;
    }
  }
  return art;
}

fn motifArt(point: vec2f, phase: f32, motif: f32, scale: f32) -> Artwork {
  if (motif < 0.5) { return ripple(point, phase, scale); }
  if (motif < 1.5) { return horizon(point, phase, scale); }
  if (motif < 2.5) { return heart(point, phase, scale); }
  if (motif < 3.5) { return grid(point, phase, scale); }
  if (motif < 4.5) { return spectrum(point, phase, scale); }
  if (motif < 5.5) { return orbit(point, phase, scale); }
  if (motif < 6.5) { return paths(point, phase, scale); }
  return crescent(point, phase, scale);
}

@fragment
fn fs_main(@location(0) uv: vec2f) -> @location(0) vec4f {
  let point = uv * 2.0 - 1.0;
  let seed = cover.seed;
  let phase = cover.params.x * 0.3 + seed.z * TAU;
  let kind = cover.params.y;
  let motif = cover.params.z;

  // Base is the item's own `bg-gradient-to-br`, so the cover matches its CSS fallback.
  let gradient = clamp((uv.x + uv.y) * 0.5, 0.0, 1.0);
  var color = mix(cover.stopA.rgb, cover.stopB.rgb, gradient);

  // Slow light drift gives the flat gradient some volume.
  let lightAt = vec2f(-0.5, -0.55) + vec2f(cos(phase * 0.6), sin(phase * 0.8)) * 0.3;
  color = screenBlend(color, vec3f(1.0), exp(-dot(point - lightAt, point - lightAt) * 0.5) * 0.2);
  let shadeAt = vec2f(0.6, 0.65) - vec2f(cos(phase * 0.6), sin(phase * 0.8)) * 0.22;
  color *= 1.0 - exp(-dot(point - shadeAt, point - shadeAt) * 0.75) * 0.22;

  var art = Artwork(0.0, 0.0, 0.0);
  var sheen = 0.0;

  if (kind < 0.5) {
    // Track: the motif printed straight onto the sleeve.
    art = motifArt(point / 0.82, phase, motif, 0.82);
  } else if (kind < 1.5) {
    // Album: a record, with the motif as its label art.
    let radius = length(point);
    let disc = radius - 0.66;
    art = motifArt(point / 0.42, phase, motif, 0.42);
    art.ink *= fillAt(radius - 0.44);
    art.glow *= fillAt(radius - 0.44);
    art.shade = fillAt(disc) * 0.22;
    art.ink += strokeAt(disc, 2.0, 1.0);

    if (tiny() < 0.5) {
      for (var groove = 0.0; groove < 3.0; groove += 1.0) {
        art.ink += strokeAt(radius - (0.5 + groove * 0.055), 1.0, 1.0) * 0.26;
      }
    }
    art.ink += strokeAt(radius - 0.46, 1.4, 1.0) * 0.7;
    art.ink += fillAt(radius - 0.035) * 0.9;

    // Gloss band sweeping the record, the one part that clearly moves.
    let towards = normalize(point + vec2f(0.0001));
    sheen = pow(max(dot(towards, vec2f(cos(phase * 0.7), sin(phase * 0.7))), 0.0), 6.0) * fillAt(disc);
  } else {
    // Playlist: the motif on the front sleeve of a stack, a record peeking out behind.
    let peek = length(point - vec2f(0.34, -0.06)) - 0.5;
    art.shade = fillAt(peek) * 0.16;
    art.ink += strokeAt(peek, 1.6, 1.0) * 0.55;

    let backSleeve = sdBox(rotate(point + vec2f(0.12, 0.1), 0.055), vec2f(0.6));
    art.shade = mix(art.shade, 0.2, fillAt(backSleeve));
    art.ink += strokeAt(backSleeve, 1.4, 1.0) * 0.5;

    let front = sdBox(point + vec2f(-0.05, -0.05), vec2f(0.62));
    art.shade = mix(art.shade, 0.06, fillAt(front));
    art.ink += strokeAt(front, 1.8, 1.0) * 0.9;

    let inner = motifArt((point + vec2f(-0.05, -0.05)) / 0.44, phase, motif, 0.44);
    let onFront = fillAt(front + 0.03);
    art.ink += inner.ink * onFront;
    art.glow += inner.glow * onFront;
  }

  color *= 1.0 - clamp(art.shade, 0.0, 1.0);
  color = screenBlend(color, vec3f(1.0), clamp(art.glow, 0.0, 1.0) * 0.1);
  color = screenBlend(color, vec3f(1.0), clamp(art.ink, 0.0, 1.0) * 0.5);
  color = screenBlend(color, vec3f(1.0), clamp(sheen, 0.0, 1.0) * 0.14);

  // Corner falloff plus paper grain, both fixed so nothing shimmers frame to frame.
  color *= 1.0 - smoothstep(0.6, 1.65, length(point)) * 0.18;
  color += (hash21(floor(uv * 300.0) + seed.xy * 97.0) - 0.5) * 0.014;

  return vec4f(clamp(color, vec3f(0.0), vec3f(1.0)), 1.0);
}
