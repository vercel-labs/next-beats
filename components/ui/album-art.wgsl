// Cover artwork, drawn as a luminance overlay on top of the element's own CSS gradient.
// The canvas is premultiplied-alpha, so the shader never needs the item's colours: it
// emits only light and shade, and the browser composites that over whatever `coverColor`
// paints. Covers match the theme -- opacity modifiers and dark mode included -- by
// construction, and one baked asset can serve every item sharing a motif.
//
// Each motif is a height field, not a drawing. Tracks use title-selected compositions,
// playlists use one recognisable family of stacked sleeves, and genres use six curated
// musical compositions. One shared light keeps all three types in the same visual world.
import { simplex2d } from "@vgpu/wgsl-std/noise/simplex";

struct Cover {
  seed: vec4f,
  // x: loop position 0..1, y: kind (0 track, 1 album, 2 playlist, 3 genre), z: motif,
  // w: bass beat strength for the currently playing track
  params: vec4f,
  // x: aspect ratio (width / height), y: detail scale. Thumbnail renders sample a slightly
  // wider field so the full composition remains readable inside a small square.
  shape: vec4f,
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

// Single octave, for forms that should fold rather than wrinkle: fbm's extra octaves put
// detail back at four times the base frequency, which is what turns cloth into foil.
fn smoothFlow(position: vec2f, cycle: f32, amount: f32) -> f32 {
  return simplex2d(position + vec2f(cos(cycle), sin(cycle)) * amount);
}

fn sphereHeight(point: vec2f, center: vec2f, radius: f32) -> f32 {
  let offset = point - center;
  return sqrt(max(radius * radius - dot(offset, offset), 0.0));
}

fn roundedBoxDistance(point: vec2f, halfSize: vec2f, radius: f32) -> f32 {
  let offset = abs(point) - halfSize + vec2f(radius);
  return length(max(offset, vec2f(0.0))) + min(max(offset.x, offset.y), 0.0) - radius;
}

fn roundedPlate(point: vec2f, halfSize: vec2f, radius: f32, lift: f32) -> f32 {
  let distance = roundedBoxDistance(point, halfSize, radius);
  let body = 1.0 - smoothstep(-0.12, 0.065, distance);
  return body * lift;
}

fn segmentDistance(point: vec2f, start: vec2f, end: vec2f) -> f32 {
  let line = end - start;
  let along = clamp(dot(point - start, line) / dot(line, line), 0.0, 1.0);
  return length(point - (start + line * along));
}

// Every field is parameterised by the seed -- frequency, count, radius, offset -- so two
// items that land on the same form still get their own composition. Nothing here depends
// on the seed in a way that breaks the loop: only shapes vary, never the harmonics.

/** Concentric liquid swells. */
fn swell(point: vec2f, cycle: f32, seed: vec4f) -> f32 {
  let center = (seed.xy - 0.5) * 0.5;
  let radius = length(point - center);
  let rings = 5.0 + seed.z * 5.0;
  return sin(radius * rings - cycle) * exp(-radius * (0.85 + seed.x * 0.7)) * 0.42;
}

/** The limb of a large body, lit from behind. */
fn limb(point: vec2f, cycle: f32, seed: vec4f) -> f32 {
  let center = vec2f((seed.x - 0.5) * 0.8 + sin(cycle) * 0.06, 0.95 + seed.y * 0.45);
  return sphereHeight(point, center, 1.25 + seed.z * 0.55) * 0.5;
}

/** Two broad folds meeting in a soft embrace for love and feelings titles. */
fn satin(point: vec2f, cycle: f32, seed: vec4f) -> f32 {
  let breathe = sin(cycle) * 0.025;
  let leftCenter = vec2f(-0.7 - breathe, -0.18 + (seed.y - 0.5) * 0.12);
  let rightCenter = vec2f(0.7 + breathe, -0.18 - (seed.y - 0.5) * 0.12);
  let left = sphereHeight(point, leftCenter, 1.02 + seed.x * 0.12) * 0.23;
  let right = sphereHeight(point, rightCenter, 1.02 + seed.z * 0.12) * 0.23;
  let meeting = exp(-dot(point - vec2f(0.0, 0.24), point - vec2f(0.0, 0.24)) * 8.0) * 0.07;
  return max(left, right) + meeting;
}

/** A grid of translucent panels lit from behind, each breathing on its own offset. */
fn panels(point: vec2f, cycle: f32, seed: vec4f) -> f32 {
  let cells = 3.0 + floor(seed.x * 3.0);
  let cell = rotate(point, (seed.z - 0.5) * 0.5) * cells * 0.5 + seed.xy * 4.0;
  let local = fract(cell) - 0.5;
  // Flat across the plate, falling away only at the seam, so these read as panels.
  let plate = 1.0 - smoothstep(0.32 + seed.y * 0.1, 0.48, max(abs(local.x), abs(local.y)));
  let lift = 0.35 + 0.65 * (0.5 + 0.5 * sin(cycle + hash21(floor(cell)) * TAU));
  let behind = exp(-dot(point - (seed.zw - 0.5) * 0.7, point - (seed.zw - 0.5) * 0.7) * (0.7 + seed.y * 0.6)) * 0.4;
  return plate * lift * 0.16 + behind;
}

/** Stacked strata, each plate drifting over the one beneath it. */
fn strata(point: vec2f, cycle: f32, seed: vec4f) -> f32 {
  let turned = rotate(point, (seed.z - 0.5) * 0.7);
  let layers = 4.0 + floor(seed.x * 3.0);
  let spacing = 1.7 / layers;
  var height = 0.0;
  for (var layer = 0.0; layer < 7.0; layer += 1.0) {
    if (layer >= layers) { break; }
    let crest = -0.8 + layer * spacing
      + sin(turned.x * (1.4 + seed.y * 1.4) + layer * 1.3 + cycle) * (0.09 + seed.w * 0.1);
    height += smoothstep(0.06, -0.06, turned.y - crest) * (1.0 / layers);
  }
  return height;
}

/** Connected nodes with staggered motion for async, thread, and promise titles. */
fn cluster(point: vec2f, cycle: f32, seed: vec4f) -> f32 {
  let driftA = vec2f(cos(cycle), sin(cycle)) * 0.035;
  let driftB = vec2f(cos(cycle + 2.1), sin(cycle + 2.1)) * 0.035;
  let firstCenter = vec2f(-0.42, -0.24) + driftA;
  let secondCenter = vec2f(0.43, 0.25) + driftB;
  let first = sphereHeight(point, firstCenter, 0.48 + seed.x * 0.1) * 0.42;
  let second = sphereHeight(point, secondCenter, 0.55 + seed.y * 0.1) * 0.42;
  let connection = exp(-pow(segmentDistance(point, firstCenter, secondCenter) * 7.0, 2.0)) * 0.075;
  let pendingCenter = vec2f(0.55 + seed.z * 0.15, -0.55) - driftA * 0.5;
  let pending = sphereHeight(point, pendingCenter, 0.2 + seed.w * 0.08) * 0.3;
  return max(max(first, second), pending) + connection;
}

/** A receding tunnel of nested frames. */
fn tunnel(point: vec2f, turn: f32, seed: vec4f) -> f32 {
  let square = rotate(point - (seed.xy - 0.5) * 0.45, seed.z * TAU);
  let extent = max(abs(square.x), abs(square.y * (0.75 + seed.w * 0.5)));
  let steps = fract(-log(max(extent, 0.02)) * (1.2 + seed.x * 1.1) + turn);
  return steps * 0.2 + (1.0 - smoothstep(0.0, 1.0, extent)) * 0.24;
}

/** Long smooth dunes. */
fn dunes(point: vec2f, cycle: f32, seed: vec4f) -> f32 {
  let turned = rotate(point, seed.z * TAU) + seed.xy * 6.0;
  let frequency = 0.45 + seed.x * 0.35;
  let warp = smoothFlow(turned * (frequency * 0.8), cycle, 0.3);
  return smoothFlow(turned * frequency + vec2f(warp * 0.45, 0.0), cycle, 0.2) * 0.6
    + point.y * (0.06 + seed.y * 0.12);
}

/** A cropped sail and hull: still sculptural, but unmistakably moving forward. */
fn monolith(point: vec2f, cycle: f32, seed: vec4f) -> f32 {
  let sway = sin(cycle) * 0.018;
  let local = rotate(point - vec2f((seed.x - 0.5) * 0.06, -0.03), -0.035 + sway);
  let top = -0.72;
  let bottom = 0.54;
  let mastX = -0.5;
  let sailEdge = 0.5 - (local.y - top) * 0.23;
  let vertical = smoothstep(top - 0.04, top + 0.04, local.y)
    * (1.0 - smoothstep(bottom - 0.04, bottom + 0.04, local.y));
  let inside = smoothstep(mastX - 0.035, mastX + 0.035, local.x)
    * (1.0 - smoothstep(sailEdge - 0.04, sailEdge + 0.04, local.x))
    * vertical;
  let sail = inside * (0.24 + (sailEdge - local.x) * 0.055);
  let leadingEdge = exp(-pow((local.x - sailEdge) * 28.0, 2.0)) * vertical * 0.18;
  let mast = exp(-pow((local.x - mastX) * 30.0, 2.0))
    * smoothstep(top - 0.08, top, local.y)
    * (1.0 - smoothstep(0.72, 0.8, local.y)) * 0.09;
  let boom = exp(-pow((local.y - 0.53) * 26.0, 2.0))
    * smoothstep(mastX - 0.05, mastX + 0.05, local.x)
    * (1.0 - smoothstep(0.43, 0.5, local.x)) * 0.1;
  let hullLocal = local - vec2f(-0.02, 0.66);
  let hull = roundedPlate(hullLocal, vec2f(0.62, 0.09), 0.08, 0.17);
  let wake = exp(-pow((local.y - 0.82) * 13.0, 2.0))
    * smoothstep(0.55, -0.82, local.x) * 0.075;
  return max(max(sail + leadingEdge, mast + boom), hull) + wake;
}

/** Folded paper forming an almost-heart: readable from the title, never an icon. */
fn pinch(point: vec2f, cycle: f32, seed: vec4f) -> f32 {
  let focus = vec2f((seed.x - 0.5) * 0.14, (seed.y - 0.5) * 0.12);
  let drift = vec2f(cos(cycle), sin(cycle)) * 0.014;
  let leftCenter = vec2f(-0.42, -0.22) + focus + drift;
  let rightCenter = vec2f(0.42, -0.22) + focus - drift;
  let left = sphereHeight(point, leftCenter, 0.72) * 0.2;
  let right = sphereHeight(point, rightCenter, 0.72) * 0.2;
  let heartPoint = (point - focus - vec2f(0.0, 0.04)) * vec2f(1.15, -1.05);
  let heartBase = heartPoint.x * heartPoint.x + heartPoint.y * heartPoint.y - 0.48;
  let heartField = heartBase * heartBase * heartBase
    - heartPoint.x * heartPoint.x * heartPoint.y * heartPoint.y * heartPoint.y;
  let foldedBody = (1.0 - smoothstep(-0.015, 0.065, heartField)) * 0.075;
  let outerFold = exp(-abs(heartField) * 20.0) * smoothstep(1.0, 0.22, length(heartPoint)) * 0.1;
  let pointAt = focus + vec2f(0.0, 0.68);
  let leftCrease = exp(-pow(segmentDistance(point, focus + vec2f(-0.42, -0.2), pointAt) * 12.0, 2.0));
  let rightCrease = exp(-pow(segmentDistance(point, focus + vec2f(0.42, -0.2), pointAt) * 12.0, 2.0));
  return max(left, right) + foldedBody + outerFold + max(leftCrease, rightCrease) * 0.055;
}

/** Three heavy sheets overflowing over broad, irregular edges. */
fn foldedEdge(point: vec2f, cycle: f32, seed: vec4f) -> f32 {
  let local = rotate(point * 0.84 - vec2f(0.0, 0.08), -0.18 + (seed.z - 0.5) * 0.08);
  var height = 0.0;
  for (var layer = 0.0; layer < 3.0; layer += 1.0) {
    let boundary = -0.34 + layer * 0.3
      + sin(local.x * (1.35 + layer * 0.16) + seed.x * TAU + layer) * 0.045
      + smoothFlow(vec2f(local.x * 0.62, seed.y * 2.0 + layer * 1.8), cycle, 0.14) * 0.05;
    let sheet = 1.0 - smoothstep(-0.04, 0.04, local.y - boundary);
    let rolledEdge = exp(-pow((local.y - boundary) * 8.5, 2.0)) * (0.065 + layer * 0.025);
    height = max(height, sheet * (0.1 + layer * 0.065) + rolledEdge);
  }
  return height;
}

/** Two large translucent sleeves inset into one another. */
fn insetPanels(point: vec2f, cycle: f32, seed: vec4f) -> f32 {
  let breathe = sin(cycle) * 0.018;
  let backLocal = rotate(point - vec2f(-0.24, 0.16), -0.02 + breathe);
  let frontLocal = rotate(point - vec2f(0.22, -0.18), 0.015 - breathe);
  let backDistance = roundedBoxDistance(backLocal, vec2f(0.75, 0.78), 0.09);
  let frontDistance = roundedBoxDistance(frontLocal, vec2f(0.58, 0.61), 0.1);
  let back = (1.0 - smoothstep(-0.1, 0.055, backDistance)) * 0.16
    + exp(-pow(backDistance * 18.0, 2.0)) * 0.075;
  let front = (1.0 - smoothstep(-0.1, 0.055, frontDistance)) * 0.3
    + exp(-pow(frontDistance * 19.0, 2.0)) * 0.12;
  let centre = exp(-dot(point - vec2f(0.25, -0.18), point - vec2f(0.25, -0.18)) * 3.8) * 0.07;
  return max(back, front) + centre;
}

/** A quiet diagonal horizon with one distant point of light. */
fn nightHorizon(point: vec2f, cycle: f32, seed: vec4f) -> f32 {
  let local = rotate(point, -0.66 + (seed.z - 0.5) * 0.04);
  let horizon = 1.0 - smoothstep(-0.035, 0.035, local.y + 0.12);
  let horizonEdge = exp(-pow((local.y + 0.12) * 18.0, 2.0)) * 0.09;
  let starAt = vec2f(0.48 + sin(cycle) * 0.012, -0.32);
  let star = exp(-dot(point - starAt, point - starAt) * 190.0) * 0.27;
  let starRay = exp(-abs(point.x - starAt.x) * 75.0) * exp(-abs(point.y - starAt.y) * 5.0) * 0.045;
  return horizon * 0.28 + horizonEdge + star + starRay;
}

/** The reference's centred, regular tile field for Pixel Perfect. */
fn pixelGrid(point: vec2f, cycle: f32, seed: vec4f) -> f32 {
  let cell = point * 2.0 + vec2f(2.0);
  let local = fract(cell) - 0.5;
  let tile = 1.0 - smoothstep(0.34, 0.47, max(abs(local.x), abs(local.y)));
  let tileId = floor(cell);
  let breathe = 0.72 + 0.28 * (0.5 + 0.5 * sin(cycle + hash21(tileId + seed.xy) * TAU));
  let centre = exp(-dot(point - vec2f(0.18, -0.08), point - vec2f(0.18, -0.08)) * 3.2) * 0.12;
  return tile * breathe * 0.2 + centre;
}

/** Four soft bodies joined around one centre, matching Component Chemistry. */
fn chemicalCluster(point: vec2f, cycle: f32, seed: vec4f) -> f32 {
  let angle = -0.42 + seed.z * 0.08;
  let drift = vec2f(cos(cycle + angle), sin(cycle + angle)) * 0.02;
  let firstCenter = vec2f(cos(angle), sin(angle)) * 0.5 + drift;
  let secondCenter = vec2f(cos(angle + TAU * 0.25), sin(angle + TAU * 0.25)) * 0.5 - drift.yx;
  let thirdCenter = vec2f(cos(angle + TAU * 0.5), sin(angle + TAU * 0.5)) * 0.5 - drift;
  let fourthCenter = vec2f(cos(angle + TAU * 0.75), sin(angle + TAU * 0.75)) * 0.5 + drift.yx;
  let first = sphereHeight(point, firstCenter, 0.43 + seed.x * 0.04) * 0.48;
  let second = sphereHeight(point, secondCenter, 0.45 + seed.y * 0.04) * 0.48;
  let third = sphereHeight(point, thirdCenter, 0.42 + seed.z * 0.04) * 0.48;
  let fourth = sphereHeight(point, fourthCenter, 0.46 + seed.w * 0.04) * 0.48;
  let bonds = max(
    max(
      exp(-pow(segmentDistance(point, firstCenter, secondCenter) * 12.0, 2.0)),
      exp(-pow(segmentDistance(point, secondCenter, thirdCenter) * 12.0, 2.0)),
    ),
    max(
      exp(-pow(segmentDistance(point, thirdCenter, fourthCenter) * 12.0, 2.0)),
      exp(-pow(segmentDistance(point, fourthCenter, firstCenter) * 12.0, 2.0)),
    ),
  ) * 0.08;
  return max(max(first, second), max(third, fourth)) + bonds;
}

/** One broad sheltering fold: the sparse, sweeping Type Safe Love composition. */
fn protectiveArc(point: vec2f, cycle: f32, seed: vec4f) -> f32 {
  // A single oversized circle puts one continuous edge through the top-left, centre,
  // and lower edge. Unlike Tailwind Hearts there is no three-way junction here.
  let drift = vec2f(sin(cycle), cos(cycle)) * 0.012;
  let center = vec2f(-1.82, 0.43) + drift;
  let radius = 1.79;
  let distance = length(point - center) - radius;
  let sheet = sphereHeight(point, center, radius) * 0.18;
  let litFold = exp(-pow(distance * 12.0, 2.0)) * 0.13;

  // A second, quieter body meets that fold at one point. It reads as an embrace at album
  // scale, while the two-body silhouette stays unmistakably different from Tailwind's
  // symmetric three-way pinch.
  let heldCenter = vec2f(1.14, -0.04) - drift;
  let heldRadius = 1.2;
  let heldDistance = length(point - heldCenter) - heldRadius;
  let held = sphereHeight(point, heldCenter, heldRadius) * 0.13;
  let heldEdge = exp(-pow(heldDistance * 13.0, 2.0)) * 0.075;
  return max(sheet, held) + litFold + heldEdge;
}

fn trackHeight(point: vec2f, cycle: f32, turn: f32, motif: f32, seed: vec4f) -> f32 {
  if (motif < 0.5) { return swell(point, cycle, seed); }
  if (motif < 1.5) { return limb(point, cycle, seed); }
  if (motif < 2.5) { return satin(point, cycle, seed); }
  if (motif < 3.5) { return panels(point, cycle, seed); }
  if (motif < 4.5) { return strata(point, cycle, seed); }
  if (motif < 5.5) { return cluster(point, cycle, seed); }
  if (motif < 6.5) { return tunnel(point, turn, seed); }
  if (motif < 7.5) { return dunes(point, cycle, seed); }
  if (motif < 8.5) { return monolith(point, cycle, seed); }
  if (motif < 9.5) { return pinch(point, cycle, seed); }
  if (motif < 10.5) { return foldedEdge(point, cycle, seed); }
  if (motif < 11.5) { return insetPanels(point, cycle, seed); }
  if (motif < 12.5) { return nightHorizon(point, cycle, seed); }
  if (motif < 13.5) { return pixelGrid(point, cycle, seed); }
  if (motif < 14.5) { return chemicalCluster(point, cycle, seed); }
  return protectiveArc(point, cycle, seed);
}

/** A reusable family of overlapping album sleeves, each with one quiet playlist cue. */
fn playlistHeight(point: vec2f, cycle: f32, variant: f32, seed: vec4f) -> f32 {
  let variant01 = variant / 3.0;
  let breathe = sin(cycle) * 0.014;
  var height = 0.0;

  for (var layer = 0.0; layer < 3.0; layer += 1.0) {
    let order = layer - 1.0;
    var center = vec2f(-0.18 + order * 0.035, order * -0.28);
    var angle = (seed.z - 0.5) * 0.018;
    var halfSize = vec2f(0.9, 0.92);
    if (variant > 0.5 && variant < 1.5) {
      center = vec2f(order * 0.13, order * -0.12 + 0.12);
      angle = 0.12 + order * 0.17;
      halfSize = vec2f(0.86, 0.9);
    } else if (variant > 1.5 && variant < 2.5) {
      center = vec2f(order * -0.1, order * -0.12 + 0.18);
      angle = order * -0.1;
      halfSize = vec2f(0.84, 0.88);
    } else if (variant > 2.5) {
      center = vec2f(0.23 + order * 0.08, order * -0.25);
      angle = 0.1 + order * 0.035;
      halfSize = vec2f(0.88, 0.9);
    }
    angle += breathe * order;
    let local = rotate(point - center, angle);
    let plate = roundedPlate(local, halfSize, 0.12, 0.13 + layer * 0.115);
    height = max(height, plate);
  }

  let glowCenter = vec2f((seed.x - 0.5) * 0.25, -0.42 + variant01 * 0.45);
  let glow = exp(-dot(point - glowCenter, point - glowCenter) * 1.35) * (0.075 + variant01 * 0.035);
  let recordCenter = vec2f(0.12, 0.03);
  let recordRadius = length(point - recordCenter);
  let record = sphereHeight(point, recordCenter, 0.5) * 0.26
    + exp(-pow((recordRadius - 0.35) * 20.0, 2.0)) * 0.1;
  var cue = 0.0;
  if (variant < 0.5) {
    // A record partly visible through the front sleeve.
    let label = sphereHeight(point, recordCenter, 0.115) * 0.42;
    cue = record + label;
  } else if (variant < 1.5) {
    // Equaliser bars pressed into the front sleeve.
    for (var bar = 0.0; bar < 5.0; bar += 1.0) {
      let pulse = 0.5 + 0.5 * sin(cycle + bar * 0.82);
      let barHeight = 0.16 + pulse * 0.26;
      let barCenter = vec2f(-0.4 + bar * 0.2, 0.28 - barHeight * 0.5);
      cue = max(cue, roundedPlate(point - barCenter, vec2f(0.065, barHeight), 0.04, 0.3));
    }
    cue += record * 0.52;
  } else if (variant < 2.5) {
    // A rising disc and horizon, kept inside the sleeve like cover printing.
    let sunCenter = vec2f(0.22, -0.08 + sin(cycle) * 0.012);
    let sun = sphereHeight(point, sunCenter, 0.42) * 0.36;
    let horizon = exp(-pow((point.y - 0.3) * 18.0, 2.0))
      * (1.0 - smoothstep(0.58, 0.74, abs(point.x))) * 0.16;
    cue = max(record * 0.38, sun + horizon);
  } else {
    // A night record with a small terminal-like inset.
    let moonCenter = vec2f(0.28, -0.18);
    let moon = sphereHeight(point, moonCenter, 0.39) * 0.36;
    let cutout = sphereHeight(point, moonCenter + vec2f(0.16, -0.08), 0.36) * 0.34;
    let cursor = roundedPlate(point - vec2f(-0.28, 0.3), vec2f(0.24, 0.04), 0.02, 0.24);
    cue = max(record * 0.32, max(moon - cutout, 0.0) + cursor);
  }
  return height + glow + cue;
}

fn electronicHeight(point: vec2f, cycle: f32, seed: vec4f) -> f32 {
  var height = 0.0;
  for (var index = 0.0; index < 15.0; index += 1.0) {
    let column = index - floor(index / 5.0) * 5.0;
    let row = floor(index / 5.0);
    let center = vec2f(-0.55 + column * 0.68, -0.58 + row * 0.58);
    let pulse = 0.5 + 0.5 * sin(cycle + index * 0.72 + seed.x * TAU);
    let local = point - center - vec2f(0.0, pulse * 0.02);
    let activity = select(0.45, 1.0, hash21(vec2f(index, seed.x * 19.0)) > 0.38);
    height = max(height, roundedPlate(local, vec2f(0.23, 0.22), 0.07, (0.12 + pulse * 0.2) * activity));
  }
  let sequencerRail = exp(-pow((point.y - 0.74) * 22.0, 2.0))
    * smoothstep(-0.9, -0.68, point.x)
    * (1.0 - smoothstep(2.28, 2.5, point.x)) * 0.07;
  return height + sequencerRail;
}

fn synthwaveHeight(point: vec2f, cycle: f32, seed: vec4f) -> f32 {
  let center = vec2f(1.25 + (seed.x - 0.5) * 0.22, 0.72 + sin(cycle) * 0.025);
  let radius = 0.95 + seed.y * 0.12;
  let body = sphereHeight(point, center, radius) * 0.36;
  let horizon = (1.0 - smoothstep(0.0, 0.055, abs(point.y - 0.55))) * 0.15;
  let sunBandA = exp(-pow((point.y - 0.22) * 20.0, 2.0))
    * (1.0 - smoothstep(radius - 0.12, radius, abs(point.x - center.x))) * 0.045;
  let sunBandB = exp(-pow((point.y - 0.38) * 22.0, 2.0))
    * (1.0 - smoothstep(radius - 0.12, radius, abs(point.x - center.x))) * 0.06;
  let depth = smoothstep(1.1, -0.4, point.y) * smoothstep(-0.8, 1.2, point.x) * 0.08;
  return max(body, horizon) + sunBandA + sunBandB + depth;
}

fn hipHopHeight(point: vec2f, cycle: f32, seed: vec4f) -> f32 {
  var height = 0.0;
  for (var index = 0.0; index < 3.0; index += 1.0) {
    let width = 0.38 + index * 0.035;
    let rise = 0.46 + index * 0.15;
    let bounce = sin(cycle + index * 1.35 + seed.x * TAU) * 0.035;
    let center = vec2f(0.18 + index * 0.86, 0.68 - rise * 0.28 + bounce);
    let local = point - center;
    let outerDistance = roundedBoxDistance(local, vec2f(width, rise), width);
    let innerDistance = roundedBoxDistance(local - vec2f(0.0, 0.1), vec2f(width * 0.56, rise * 0.67), width * 0.56);
    let outer = 1.0 - smoothstep(-0.08, 0.045, outerDistance);
    let inner = 1.0 - smoothstep(-0.07, 0.035, innerDistance);
    let arch = max(outer - inner * 0.86, 0.0) * (0.16 + index * 0.055);
    let cone = sphereHeight(point, center + vec2f(0.0, 0.22), width * 0.38) * 0.13;
    height = max(height, arch + cone);
  }
  return height;
}

fn indieHeight(point: vec2f, cycle: f32, seed: vec4f) -> f32 {
  var height = 0.0;
  for (var index = 0.0; index < 3.0; index += 1.0) {
    let center = vec2f(0.55 + index * 0.43, -0.42 + index * 0.1);
    let angle = -0.31 + index * 0.16 + sin(cycle) * (index - 1.0) * 0.008;
    let local = rotate(point - center, angle);
    let tornEdge = 0.28 + index * 0.17
      + sin(local.x * (2.2 + index * 0.35) + seed.x * TAU) * 0.035
      + simplex2d(vec2f(local.x * 2.6, index * 4.1 + seed.y * 5.0)) * 0.055;
    let insideX = 1.0 - smoothstep(1.25, 1.35, abs(local.x));
    let sheet = (1.0 - smoothstep(-0.045, 0.045, local.y - tornEdge)) * insideX;
    height = max(height, sheet * (0.13 + index * 0.085));
  }
  return height;
}

fn popHeight(point: vec2f, cycle: f32, seed: vec4f) -> f32 {
  let focus = vec2f(0.78 + (seed.x - 0.5) * 0.12, 0.04);
  var height = 0.0;
  for (var index = 0.0; index < 3.0; index += 1.0) {
    let direction = -0.8 + index * 2.15 + seed.y * 0.08 + sin(cycle) * 0.018;
    let radius = 1.35 + index * 0.18;
    let lobeCenter = focus - vec2f(cos(direction), sin(direction)) * radius;
    height = max(height, sphereHeight(point, lobeCenter, radius + 0.04) * (0.19 + index * 0.024));
  }
  let flare = exp(-dot(point - focus, point - focus) * 24.0) * 0.34;
  return height + flare;
}

fn loFiHeight(point: vec2f, cycle: f32, seed: vec4f) -> f32 {
  let center = vec2f(1.42 + (seed.x - 0.5) * 0.16, 0.68);
  let radius = length(point - center);
  let breathe = sin(cycle) * 0.018;
  var height = 0.0;
  for (var index = 0.0; index < 4.0; index += 1.0) {
    let ringRadius = 0.4 + index * 0.36 + breathe * (index + 1.0);
    let band = exp(-pow(abs(radius - ringRadius) * 5.5, 2.0));
    height = max(height, band * (0.14 + index * 0.028));
  }
  return height;
}

fn genreHeight(point: vec2f, cycle: f32, motif: f32, seed: vec4f) -> f32 {
  if (motif < 0.5) { return electronicHeight(point, cycle, seed); }
  if (motif < 1.5) { return synthwaveHeight(point, cycle, seed); }
  if (motif < 2.5) { return hipHopHeight(point, cycle, seed); }
  if (motif < 3.5) { return indieHeight(point, cycle, seed); }
  if (motif < 4.5) { return popHeight(point, cycle, seed); }
  return loFiHeight(point, cycle, seed);
}

fn heightAt(point: vec2f, cycle: f32, turn: f32, kind: f32, motif: f32, seed: vec4f) -> f32 {
  if (kind > 2.5) { return genreHeight(point, cycle, motif, seed); }
  if (kind > 1.5) { return playlistHeight(point, cycle, motif, seed); }
  return trackHeight(point, cycle, turn, motif, seed);
}

struct VertexOutput {
  @builtin(position) position: vec4f,
  @location(0) uv: vec2f,
}

struct SurfaceSample {
  point: vec2f,
  normal: vec3f,
  height: f32,
}

// Fullscreen triangle for the cover fragment shader.
@vertex
fn vs_main(@builtin(vertex_index) index: u32) -> VertexOutput {
  var positions = array<vec2f, 3>(vec2f(-1.0, -1.0), vec2f(3.0, -1.0), vec2f(-1.0, 3.0));
  var coordinates = array<vec2f, 3>(vec2f(0.0, 1.0), vec2f(2.0, 1.0), vec2f(0.0, -1.0));
  var output: VertexOutput;
  output.position = vec4f(positions[index], 0.0, 1.0);
  output.uv = coordinates[index];
  return output;
}

fn surfaceAt(uv: vec2f) -> SurfaceSample {
  let aspect = max(cover.shape.x, 0.0001);
  // Isotropic space: y spans -1..1, x widens with the aspect so nothing stretches.
  let point = (uv * 2.0 - 1.0) * vec2f(aspect, 1.0);
  let seed = cover.seed;
  // Every motion is an integer harmonic of `cycle`, so the artwork returns to its
  // starting state at turn = 1 and can be baked into a looping WebP.
  let turn = fract(cover.params.x);
  let cycle = turn * TAU;
  let motif = cover.params.z;
  let kind = cover.params.y;
  let banner = step(2.5, kind);
  let bass = cover.params.w;

  // Surface normal from the height field. Three samples is the whole cost of making a
  // flat field look like a lit object.
  let step2 = 0.008;
  let detail = select(cover.shape.y, 1.0, cover.shape.y <= 0.0);
  // Pull the sample point toward the centre on each kick. The field appears to expand
  // inside the artwork like a speaker cone without scaling or glowing the surrounding UI.
  let bassScale = 1.0 + bass * 0.045;
  let sample = point * detail / bassScale;
  let heightBoost = 1.0 + bass * 0.16;
  let height = heightAt(sample, cycle, turn, kind, motif, seed) * heightBoost;
  let alongX = heightAt(sample + vec2f(step2, 0.0), cycle, turn, kind, motif, seed) * heightBoost;
  let alongY = heightAt(sample + vec2f(0.0, step2), cycle, turn, kind, motif, seed) * heightBoost;
  let relief = select(0.3, 0.22, kind > 1.5);
  let normal = normalize(vec3f((height - alongX) / step2 * relief, (height - alongY) / step2 * relief, 1.0));

  return SurfaceSample(point, normal, height);
}

@fragment
fn fs_main(@location(0) uv: vec2f) -> @location(0) vec4f {
  let surface = surfaceAt(uv);
  let point = surface.point;
  let normal = surface.normal;
  let height = surface.height;
  let aspect = max(cover.shape.x, 0.0001);
  let seed = cover.seed;
  let turn = fract(cover.params.x);
  let kind = cover.params.y;
  let motif = cover.params.z;
  let banner = step(2.5, kind);
  let bass = cover.params.w;

  let toLight = normalize(vec3f(-0.5, -0.72, 0.52));
  let halfway = normalize(toLight + vec3f(0.0, 0.0, 1.0));
  let diffuse = max(dot(normal, toLight), 0.0);
  let specular = pow(max(dot(normal, halfway), 0.0), 14.0);
  // Grazing angles catch the light, which is what gives these forms an edge.
  let rim = pow(1.0 - clamp(normal.z, 0.0, 1.0), 3.0);

  let designed = step(1.5, kind);
  let translucentFill = smoothstep(0.025, 0.5, height) * designed;
  let trackGlow = diffuse * 0.1 + specular * 0.045 + rim * 0.055;
  let designedGlow = diffuse * 0.07 + specular * 0.1 + rim * 0.17 + translucentFill * 0.1;
  var glow = mix(trackGlow, designedGlow, designed);
  glow += bass * (0.025 + specular * 0.055);
  var shade = mix(
    (1.0 - diffuse) * 0.13 + (1.0 - clamp(height * 1.4 + 0.5, 0.0, 1.0)) * 0.065,
    (1.0 - diffuse) * 0.1 + (1.0 - clamp(height * 1.65 + 0.42, 0.0, 1.0)) * 0.075,
    designed,
  );
  let trackReference = (1.0 - step(1.5, kind)) * step(7.5, motif);
  let referenceFill = smoothstep(0.055, 0.24, height) * trackReference;
  let darkReference = max(
    1.0 - step(0.45, abs(motif - 8.0)),
    max(1.0 - step(0.45, abs(motif - 10.0)), 1.0 - step(0.45, abs(motif - 12.0))),
  );
  shade += referenceFill * (0.115 + darkReference * 0.13);
  glow += referenceFill * (0.018 + diffuse * 0.025);

  // A beam crossing the cover, its colour bands offset along it so the edges disperse the
  // way light does leaving glass. Dispersion is strongest on the specular crests.
  let sweepAxis = dot(point, normalize(vec2f(0.85, 0.5)));
  let sweepSpan = aspect + 1.0;
  let sweepAt = fract(turn + seed.w) * (sweepSpan * 2.4) - sweepSpan * 1.2;
  let spread = 0.06;
  let beam = vec3f(
    exp(-abs(sweepAxis - sweepAt - spread) * 2.4),
    exp(-abs(sweepAxis - sweepAt) * 2.4),
    exp(-abs(sweepAxis - sweepAt + spread) * 2.4),
  );
  let sweep = (beam.r + beam.g + beam.b) / 3.0;
  glow += sweep * (0.04 + specular * 0.22);

  // Banners carry a label at the lower left, so that corner gets a scrim.
  shade += banner * smoothstep(0.0, 1.0, point.y) * smoothstep(0.35, -0.5, point.x / aspect) * 0.18;

  // The original covers had a lifted centre and darker perimeter. Keep that depth in the
  // pixels themselves so the art sits above the card without a separate UI glow.
  let centredPoint = point / vec2f(aspect, 1.0);
  let edgeDistance = max(abs(centredPoint.x), abs(centredPoint.y));
  let edgeVignette = smoothstep(0.52, 1.02, edgeDistance);
  let centreLift = 1.0 - smoothstep(0.0, 0.9, length(centredPoint));
  shade += edgeVignette * 0.2;
  glow += centreLift * 0.035 + bass * centreLift * 0.025;

  // Fold it into one premultiplied source-over sample: highlight lifts the gradient,
  // shade lowers it. The highlight carries the beam's slight spectral tint.
  let tint = (beam - vec3f(sweep)) * (1.0 + specular * 2.0) * 0.07;
  let highlight = clamp(vec3f(glow) + tint, vec3f(0.0), vec3f(1.0));
  let darkened = clamp(shade, 0.0, 1.0);
  let alpha = 1.0 - (1.0 - darkened) * (1.0 - max(max(highlight.r, highlight.g), highlight.b));

  return vec4f(highlight, alpha);
}
