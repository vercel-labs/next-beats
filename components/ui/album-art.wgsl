// Album artwork drawn as a luminance overlay on top of the element's own CSS gradient.
// The canvas is premultiplied-alpha, so the shader never needs the item's colours: it
// emits only highlight and shade, and the browser composites that over whatever
// `coverColor` already paints. Covers therefore match the theme -- including opacity
// modifiers and dark mode -- by construction.
//
// The motif comes from the title, so the artwork is about the song. The kind only picks
// how the motif is presented: a track prints it bare, an album sets it in a record, a
// playlist sets it on the front sleeve of a stack, a genre banner sets it beside the label.
struct Cover {
  seed: vec4f,
  // x: loop position 0..1, y: kind (0 track, 1 album, 2 playlist, 3 genre), z: motif,
  // w: point units per CSS pixel
  params: vec4f,
  // x: aspect ratio (width / height)
  shape: vec4f,
}

@group(0) @binding(0) var<uniform> cover: Cover;

const TAU = 6.28318530718;

// Highlight lifts the gradient toward white, shade pushes it toward black. Keeping the
// two separate is what lets a single premultiplied output reproduce both.
struct Artwork {
  ink: f32,
  glow: f32,
  shade: f32,
  // Distance to the nearest of the motif's own edges, in device pixels. The motifs are
  // implicit fields with wildly different gradients -- a squashed ellipse, a box, a
  // heart -- so each one is normalised by its own rate of change before being compared.
  // That is what makes the emission fall off evenly in every direction.
  field: f32,
}

const NO_FIELD = 1.0e6;

fn nearer(field: f32, distance: f32) -> f32 {
  return min(field, abs(distance) / max(fwidth(distance), 1.0e-6));
}

fn hash21(point: vec2f) -> f32 {
  return fract(sin(dot(point, vec2f(127.1, 311.7))) * 43758.5453);
}

fn rotate(point: vec2f, angle: f32) -> vec2f {
  let sine = sin(angle);
  let cosine = cos(angle);
  return vec2f(point.x * cosine - point.y * sine, point.x * sine + point.y * cosine);
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
  let p = vec2f(abs(point.x), point.y);
  if (p.y + p.x > 1.0) {
    let corner = p - vec2f(0.25, 0.75);
    return sqrt(dot(corner, corner)) - sqrt(2.0) / 4.0;
  }
  let top = p - vec2f(0.0, 1.0);
  let cleft = p - 0.5 * max(p.x + p.y, 0.0);
  return sqrt(min(dot(top, top), dot(cleft, cleft))) * sign(p.x - p.y);
}

// 1 while the cover is roughly under 72px, where fine detail turns to mush.
fn tiny() -> f32 {
  return step(0.028, cover.params.w);
}

// Strokes are specified in CSS pixels so a motif reads the same at 40px and at 240px.
// `scale` compensates for motif spaces that were shrunk to fit a container.
fn strokeAt(distance: f32, pixels: f32, scale: f32) -> f32 {
  let width = max(pixels * cover.params.w, 0.012) / scale;
  let softness = max(fwidth(distance), 0.0001);
  return 1.0 - smoothstep(width - softness, width + softness, abs(distance));
}

fn fillAt(distance: f32) -> f32 {
  let softness = max(fwidth(distance), 0.0001);
  return 1.0 - smoothstep(-softness, softness, distance);
}

fn ripple(point: vec2f, phase: f32, scale: f32) -> Artwork {
  var art = Artwork(0.0, 0.0, 0.0, NO_FIELD);
  let radius = length(point);
  let swell = sin(phase * 2.0) * 0.024;
  let rings = 4.0 - tiny() * 2.0;

  for (var ring = 0.0; ring < 4.0; ring += 1.0) {
    if (ring >= rings) { break; }
    let at = 0.26 + ring * 0.2 + swell * (1.0 + ring * 0.4);
    let weight = 1.0 - ring * 0.16;
    art.ink += strokeAt(radius - at, 2.0 - ring * 0.2, scale) * weight;
    art.glow += strokeAt(radius - at, 5.0, scale) * weight * 0.28;
    art.field = nearer(art.field, radius - at);
  }

  art.ink += fillAt(radius - 0.085) * 0.95;
  art.field = nearer(art.field, radius - 0.085);
  return art;
}

fn horizon(point: vec2f, phase: f32, scale: f32) -> Artwork {
  var art = Artwork(0.0, 0.0, 0.0, NO_FIELD);
  let line = 0.26;
  let within = 1.0 - smoothstep(0.8, 1.0, abs(point.x));
  let sun = vec2f(0.0, line - 0.32 - sin(phase) * 0.03);
  let disc = length(point - sun) - 0.36;

  // Sun resting on the horizon, its lower half cut away by the line.
  art.ink += strokeAt(disc, 2.2, scale) * step(point.y, line);
  art.glow += fillAt(disc) * step(point.y, line) * 0.55 + strokeAt(disc, 7.0, scale) * 0.3;
  art.ink += strokeAt(point.y - line, 2.2, scale) * within;
  art.field = min(nearer(art.field, disc), nearer(NO_FIELD, point.y - line) + (1.0 - within) * NO_FIELD);

  if (tiny() < 0.5) {
    for (var band = 1.0; band < 4.0; band += 1.0) {
      let at = line + band * 0.16 + sin(phase * 2.0 + band) * 0.014;
      art.ink += strokeAt(point.y - at, 1.4, scale) * (0.46 - band * 0.1) * within
        * (1.0 - smoothstep(0.08, 0.5, abs(point.x)));
    }
  }
  return art;
}

fn heart(point: vec2f, phase: f32, scale: f32) -> Artwork {
  var art = Artwork(0.0, 0.0, 0.0, NO_FIELD);
  let beat = 1.0 + max(0.0, sin(phase * 6.0)) * 0.04;
  let local = vec2f(point.x, -point.y + 0.18) / (0.64 * beat);
  let distance = sdHeart(local) * 0.64 * beat;

  art.ink += strokeAt(distance, 2.4, scale);
  art.glow += fillAt(distance) * 0.45 + strokeAt(distance, 7.0, scale) * 0.28;
  art.field = nearer(art.field, distance);
  return art;
}

fn grid(point: vec2f, phase: f32, scale: f32) -> Artwork {
  var art = Artwork(0.0, 0.0, 0.0, NO_FIELD);
  let cells = select(4.0, 2.0, tiny() > 0.5);
  let span = 0.82;
  let inside = fillAt(sdBox(point, vec2f(span)));
  let cell = point / span * cells * 0.5;
  let index = floor(cell);
  let local = fract(cell) - 0.5;
  let lit = smoothstep(0.4, 0.8, hash21(index + floor(phase / TAU * 4.0) * 7.0));
  let block = sdBox(local, vec2f(0.33));

  // Blocks alone, no bounding rule: a bounded grid reads as a table, not as artwork.
  art.ink += fillAt(block) * inside * (0.24 + lit * 0.66);
  art.glow += fillAt(block) * inside * lit * 0.5;
  art.field = nearer(art.field, block) + (1.0 - inside) * NO_FIELD;
  return art;
}

fn spectrum(point: vec2f, phase: f32, scale: f32) -> Artwork {
  var art = Artwork(0.0, 0.0, 0.0, NO_FIELD);
  let bars = select(6.0, 3.0, tiny() > 0.5);
  let span = 0.84;
  let base = 0.68;
  let column = floor((point.x / span * 0.5 + 0.5) * bars);
  let inside = step(0.0, column) * step(column, bars - 1.0) * step(abs(point.x), span);
  let center = ((column + 0.5) / bars * 2.0 - 1.0) * span;
  let noise = hash21(vec2f(column, 5.0));
  let height = 0.4 + noise * 0.62 + sin(phase * 3.0 + noise * TAU) * 0.12;

  // Anchored to a baseline so it reads as a meter rather than as floating slabs.
  let bar = sdBox(vec2f(point.x - center, point.y - (base - height * 0.5)), vec2f(span / bars * 0.33, height * 0.5));
  art.ink += fillAt(bar) * inside * 0.66;
  art.ink += strokeAt(bar, 1.7, scale) * inside;
  art.glow += fillAt(bar) * inside * 0.3;
  art.field = nearer(art.field, bar) + (1.0 - inside) * NO_FIELD;
  art.ink += strokeAt(point.y - base, 1.6, scale) * 0.5 * (1.0 - smoothstep(0.82, 1.0, abs(point.x)));
  return art;
}

fn orbit(point: vec2f, phase: f32, scale: f32) -> Artwork {
  var art = Artwork(0.0, 0.0, 0.0, NO_FIELD);
  let shells = 3.0 - tiny();

  for (var shell = 0.0; shell < 3.0; shell += 1.0) {
    if (shell >= shells) { break; }
    let turned = rotate(point, shell * TAU / 3.0 + phase / 3.0); // 3-fold symmetric, so a third of a turn closes the loop
    let ellipse = length(vec2f(turned.x, turned.y * 2.6)) - 0.68;
    art.ink += strokeAt(ellipse, 1.8, scale) * 0.9;
    art.glow += strokeAt(ellipse, 5.0, scale) * 0.2;
    art.field = nearer(art.field, ellipse);
  }

  art.ink += fillAt(length(point) - 0.12) * 0.95;
  let electron = rotate(vec2f(0.68, 0.0), -phase);
  art.ink += fillAt(length(point - vec2f(electron.x, electron.y / 2.6)) - 0.062) * 0.9;
  art.field = nearer(art.field, length(point) - 0.12);
  return art;
}

fn paths(point: vec2f, phase: f32, scale: f32) -> Artwork {
  var art = Artwork(0.0, 0.0, 0.0, NO_FIELD);
  let junction = vec2f(0.08 + sin(phase) * 0.03, 0.0);

  // Two branches meeting and continuing as one.
  art.ink += strokeAt(sdSegment(point, vec2f(-0.8, -0.52), junction), 2.2, scale);
  art.ink += strokeAt(sdSegment(point, vec2f(-0.8, 0.52), junction), 2.2, scale);
  art.ink += strokeAt(sdSegment(point, junction, vec2f(0.8, 0.0)), 2.2, scale);
  art.ink += fillAt(length(point - junction) - 0.1) * 0.95;
  art.glow += strokeAt(length(point - junction) - 0.1, 8.0, scale) * 0.4;
  art.field = nearer(art.field, sdSegment(point, vec2f(-0.8, -0.52), junction));
  art.field = nearer(art.field, sdSegment(point, vec2f(-0.8, 0.52), junction));
  art.field = nearer(art.field, sdSegment(point, junction, vec2f(0.8, 0.0)));

  if (tiny() < 0.5) {
    art.ink += fillAt(length(point - vec2f(-0.8, -0.52)) - 0.055) * 0.75;
    art.ink += fillAt(length(point - vec2f(-0.8, 0.52)) - 0.055) * 0.75;
  }
  return art;
}

fn crescent(point: vec2f, phase: f32, scale: f32) -> Artwork {
  var art = Artwork(0.0, 0.0, 0.0, NO_FIELD);
  let drift = sin(phase) * 0.02;
  let full = length(point - vec2f(0.06, 0.0)) - 0.62;
  let bite = length(point - vec2f(0.3 + drift, -0.1)) - 0.52;
  let moon = max(full, -bite);

  art.ink += strokeAt(moon, 2.4, scale);
  art.glow += fillAt(moon) * 0.5 + strokeAt(moon, 7.0, scale) * 0.28;
  art.field = nearer(art.field, moon);

  if (tiny() < 0.5) {
    for (var star = 0.0; star < 3.0; star += 1.0) {
      let at = vec2f(-0.54 + star * 0.11, -0.68 + star * 0.64);
      art.ink += fillAt(length(point - at) - 0.032) * 0.8;
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
  let aspect = max(cover.shape.x, 0.0001);
  // Isotropic space: y spans -1..1, x widens with the aspect so nothing stretches.
  let point = (uv * 2.0 - 1.0) * vec2f(aspect, 1.0);
  let seed = cover.seed;
  // Every motion below is an integer harmonic of `cycle`, so the whole cover returns to
  // its starting state at turn = 1. That is what lets it be baked into a looping WebP.
  let turn = fract(cover.params.x);
  let cycle = turn * TAU;
  let phase = cycle;
  let kind = cover.params.y;
  let motif = cover.params.z;

  var art = Artwork(0.0, 0.0, 0.0, NO_FIELD);
  var emission = NO_FIELD;

  // Gradient work. The CSS gradient underneath is a flat two-stop ramp, so the light is
  // built here instead: a broad directional ramp plus three drifting lobes whose angles
  // and radii come from the seed. Two covers sharing one `coverColor` still get their own
  // gradient, and because this only lifts and lowers luminance it stays in the palette.
  let ramp = dot(normalize(vec2f(cos(seed.x * TAU), sin(seed.x * TAU))), point / vec2f(aspect, 1.0));
  art.glow += smoothstep(-1.0, 1.0, ramp) * 0.55;
  art.shade += smoothstep(1.0, -1.0, ramp) * 0.1;

  for (var lobe = 0.0; lobe < 3.0; lobe += 1.0) {
    let angle = (seed.y + lobe * 0.37) * TAU + phase * select(1.0, -1.0, lobe > 1.5);
    let at = vec2f(cos(angle) * aspect, sin(angle * 1.19)) * (0.52 + lobe * 0.12);
    let spread = 0.42 + fract(seed.x + lobe * 0.31) * 0.55;
    let lobeFall = exp(-dot(point - at, point - at) * spread);
    if (lobe < 2.0) {
      art.glow += lobeFall * (0.85 - lobe * 0.3);
    } else {
      art.shade += lobeFall * 0.16;
    }
  }

  if (kind < 2.5) {
    // Track, album and playlist all print the motif bare. The colour family already
    // says which is which -- wrapping them in records or sleeves only added clutter.
    let printed = motifArt(point / 0.8, phase, motif, 0.8);
    art.ink += printed.ink;
    art.glow += printed.glow;
    emission = printed.field;
  } else {
    // Genre banner: wide, with the label at the lower left, so the motif sits right and
    // the text side gets a scrim instead of artwork.
    let printed = motifArt((point - vec2f(aspect - 0.95, -0.05)) / 0.72, phase, motif, 0.72);
    art.ink += printed.ink * 0.85;
    art.glow += printed.glow * 0.85;
    emission = printed.field;

    // Scrim under the label.
    art.shade += smoothstep(0.0, 1.0, point.y) * smoothstep(0.35, -0.5, point.x / aspect) * 0.16;
  }

  // Light bleeding out of the bright line work: a tight core over a wide halo, both
  // sized as a fraction of the cover so the bloom scales with it. Hovering a card opens
  // it up. Amplitudes stay well clear of 1.0 -- saturating here is what turns a glow
  // into a flat plate.
  let coverPixels = 2.0 / max(fwidth(point.y), 1.0e-6);
  let bloomRadius = max(coverPixels * 0.1, 2.0);
  let flare = exp(-emission / (bloomRadius * 0.3)) * 0.55 + exp(-emission / bloomRadius) * 0.45;
  art.glow += flare * 0.5;

  // A beam travelling across the cover. The motifs move too slowly to read as animation
  // on their own, so this is what makes a still cover look alive. The three colour bands
  // are offset along the beam so its edges disperse the way light does leaving glass --
  // warm on the leading edge, cool on the trailing one.
  let sweepAxis = dot(point, normalize(vec2f(0.85, 0.5)));
  let sweepSpan = aspect + 1.0;
  let sweepAt = fract(turn + seed.w) * (sweepSpan * 2.4) - sweepSpan * 1.2;
  let spread = 0.055;
  let beam = vec3f(
    exp(-abs(sweepAxis - sweepAt - spread) * 2.6),
    exp(-abs(sweepAxis - sweepAt) * 2.6),
    exp(-abs(sweepAxis - sweepAt + spread) * 2.6),
  );
  // Dispersion is strongest where the beam crosses the line work, as if refracted by it.
  let refracted = 1.0 + exp(-emission / max(bloomRadius * 0.6, 1.0)) * 2.2;
  let sweep = (beam.r + beam.g + beam.b) / 3.0;
  art.glow += sweep * 0.55;
  art.ink += art.ink * sweep * 0.3;

  // Motif glow breathes, so even the fine line work has a pulse to it.
  art.glow *= 1.0 + sin(phase * 2.0) * 0.16;

  // Corner falloff, plus paper grain fixed by position so nothing shimmers frame to frame.
  art.shade += smoothstep(0.62, 1.7, length(point / vec2f(aspect, 1.0))) * 0.16;
  let grain = (hash21(floor(uv * vec2f(300.0 * aspect, 300.0)) + seed.xy * 97.0) - 0.5) * 0.05;
  art.glow += max(grain, 0.0);
  art.shade += max(-grain, 0.0);

  // Fold the artwork into one premultiplied source-over sample: highlight lifts the
  // gradient, shade lowers it, both applied to whatever the CSS gradient painted below.
  // The highlight carries the beam's slight spectral tint; everything else is neutral.
  let neutral = art.glow * 0.11 + art.ink * 0.5;
  let tint = (beam - vec3f(sweep)) * refracted * 0.09;
  let highlight = clamp(vec3f(neutral) + tint, vec3f(0.0), vec3f(1.0));
  let shade = clamp(art.shade, 0.0, 1.0);
  let alpha = 1.0 - (1.0 - shade) * (1.0 - max(max(highlight.r, highlight.g), highlight.b));

  return vec4f(highlight, alpha);
}
