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

fn squareValue(value: f32) -> f32 {
  return value * value;
}

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

// Analytic heart SDF: one continuous symbol silhouette with no primitive seams.
fn heartDistance(point: vec2f) -> f32 {
  let p = vec2f(abs(point.x), point.y);
  if (p.x + p.y > 1.0) {
    return length(p - vec2f(0.25, 0.75)) - 0.3535534;
  }
  let diagonal = p - 0.5 * max(p.x + p.y, 0.0) * vec2f(1.0);
  return sqrt(min(dot(p - vec2f(0.0, 1.0), p - vec2f(0.0, 1.0)), dot(diagonal, diagonal)))
    * sign(p.x - p.y);
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
  let connection = exp(-squareValue(segmentDistance(point, firstCenter, secondCenter) * 7.0)) * 0.075;
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
  let leadingEdge = exp(-squareValue((local.x - sailEdge) * 28.0)) * vertical * 0.18;
  let mast = exp(-squareValue((local.x - mastX) * 30.0))
    * smoothstep(top - 0.08, top, local.y)
    * (1.0 - smoothstep(0.72, 0.8, local.y)) * 0.09;
  let boom = exp(-squareValue((local.y - 0.53) * 26.0))
    * smoothstep(mastX - 0.05, mastX + 0.05, local.x)
    * (1.0 - smoothstep(0.43, 0.5, local.x)) * 0.1;
  let hullLocal = local - vec2f(-0.02, 0.66);
  let hull = roundedPlate(hullLocal, vec2f(0.62, 0.09), 0.08, 0.17);
  let wake = exp(-squareValue((local.y - 0.82) * 13.0))
    * smoothstep(0.55, -0.82, local.x) * 0.075;
  return max(max(sail + leadingEdge, mast + boom), hull) + wake;
}

/** One inset folded heart: recognisable at card size, but still sculptural rather than an icon. */
fn pinch(point: vec2f, cycle: f32, seed: vec4f) -> f32 {
  let focus = vec2f((seed.x - 0.5) * 0.14, (seed.y - 0.5) * 0.12);
  let breathe = 1.0 + sin(cycle) * 0.012;
  let local = (point - focus) / breathe;
  // The source SDF points upward; map its cusp to the lower edge of this cover.
  let distance = heartDistance(vec2f(local.x, 0.68 - local.y) / 1.17) * 1.17;
  let body = 1.0 - smoothstep(-0.025, 0.025, distance);
  let edge = exp(-squareValue(distance * 19.0));
  let paperPlane = body * (0.145 + local.x * 0.018 - local.y * 0.008);
  let fold = exp(-squareValue(segmentDistance(local, vec2f(-0.42, -0.12), vec2f(0.08, 0.54)) * 18.0));
  return paperPlane + edge * 0.075 + body * fold * 0.022;
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
    let rolledEdge = exp(-squareValue((local.y - boundary) * 8.5)) * (0.065 + layer * 0.025);
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
    + exp(-squareValue(backDistance * 18.0)) * 0.075;
  let front = (1.0 - smoothstep(-0.1, 0.055, frontDistance)) * 0.3
    + exp(-squareValue(frontDistance * 19.0)) * 0.12;
  let centre = exp(-dot(point - vec2f(0.25, -0.18), point - vec2f(0.25, -0.18)) * 3.8) * 0.07;
  return max(back, front) + centre;
}

/** A quiet diagonal horizon with one distant point of light. */
fn nightHorizon(point: vec2f, cycle: f32, seed: vec4f) -> f32 {
  let local = rotate(point, -0.66 + (seed.z - 0.5) * 0.04);
  let horizon = 1.0 - smoothstep(-0.035, 0.035, local.y + 0.12);
  let horizonEdge = exp(-squareValue((local.y + 0.12) * 18.0)) * 0.09;
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
      exp(-squareValue(segmentDistance(point, firstCenter, secondCenter) * 12.0)),
      exp(-squareValue(segmentDistance(point, secondCenter, thirdCenter) * 12.0)),
    ),
    max(
      exp(-squareValue(segmentDistance(point, thirdCenter, fourthCenter) * 12.0)),
      exp(-squareValue(segmentDistance(point, fourthCenter, firstCenter) * 12.0)),
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
  let litFold = exp(-squareValue(distance * 12.0)) * 0.13;

  // A second, quieter body meets that fold at one point. It reads as an embrace at album
  // scale, while the two-body silhouette stays unmistakably different from Tailwind's
  // symmetric three-way pinch.
  let heldCenter = vec2f(1.14, -0.04) - drift;
  let heldRadius = 1.2;
  let heldDistance = length(point - heldCenter) - heldRadius;
  let held = sphereHeight(point, heldCenter, heldRadius) * 0.13;
  let heldEdge = exp(-squareValue(heldDistance * 13.0)) * 0.075;
  return max(sheet, held) + litFold + heldEdge;
}

fn ringRelief(point: vec2f, center: vec2f, radius: f32, width: f32, lift: f32) -> f32 {
  return exp(-squareValue((length(point - center) - radius) / width)) * lift;
}

fn lineRelief(point: vec2f, start: vec2f, end: vec2f, width: f32, lift: f32) -> f32 {
  return exp(-squareValue(segmentDistance(point, start, end) / width)) * lift;
}

fn boxRelief(point: vec2f, center: vec2f, halfSize: vec2f, radius: f32, lift: f32) -> f32 {
  let distance = roundedBoxDistance(point - center, halfSize, radius);
  return exp(-squareValue(distance / 0.045)) * lift;
}

fn signalWave(point: vec2f, y: f32, frequency: f32, phase: f32, lift: f32) -> f32 {
  // Idle motion rocks the waveform in place instead of scrolling it across the cover.
  // Playback bass supplies the pronounced movement later in surfaceAt().
  let waveY = y + sin(point.x * frequency + sin(phase) * 0.12) * 0.13;
  return exp(-squareValue((point.y - waveY) * 22.0)) * lift;
}

fn asyncAwaitArt(point: vec2f, cycle: f32, seed: vec4f) -> f32 {
  let left = vec2f(-0.5, 0.2 + sin(cycle) * 0.035);
  let right = vec2f(0.5, -0.18 - sin(cycle) * 0.035);
  let nodes = sphereHeight(point, left, 0.34) * 0.38 + sphereHeight(point, right, 0.34) * 0.38;
  let waitOrbit = ringRelief(point, vec2f(0.0), 0.72, 0.055, 0.12);
  let handoff = lineRelief(point, left, right, 0.07, 0.1);
  return nodes + waitOrbit + handoff + sphereHeight(point, vec2f(0.0, 0.0), 0.13 + seed.x * 0.04) * 0.32;
}

fn websocketSunsetArt(point: vec2f, cycle: f32, seed: vec4f) -> f32 {
  let sunCenter = vec2f(0.38, 0.4 + sin(cycle) * 0.018);
  let sun = sphereHeight(point, sunCenter, 0.72) * 0.26;
  let socketA = ringRelief(point, vec2f(-0.72, -0.36), 0.14, 0.035, 0.2);
  let socketB = ringRelief(point, vec2f(0.72, -0.34), 0.14, 0.035, 0.2);
  let stream = signalWave(point, -0.34, 5.0 + seed.x, cycle, 0.15);
  let horizon = lineRelief(point, vec2f(-0.92, 0.48), vec2f(0.92, 0.48), 0.045, 0.09);
  return sun + socketA + socketB + stream + horizon;
}

fn serverVibesArt(point: vec2f, cycle: f32, seed: vec4f) -> f32 {
  let server = roundedPlate(point - vec2f(-0.45, 0.0), vec2f(0.38, 0.66), 0.1, 0.24);
  var slots = 0.0;
  for (var row = 0.0; row < 3.0; row += 1.0) {
    slots += boxRelief(point, vec2f(-0.45, -0.34 + row * 0.34), vec2f(0.22, 0.08), 0.025, 0.1);
  }
  let source = vec2f(-0.02, 0.0);
  var broadcast = 0.0;
  for (var arc = 0.0; arc < 3.0; arc += 1.0) {
    let radius = 0.3 + arc * 0.27 + sin(cycle) * 0.012;
    broadcast += ringRelief(point, source, radius, 0.045, 0.1) * smoothstep(-0.08, 0.2, point.x);
  }
  return server + slots + broadcast + sphereHeight(point, source, 0.09 + seed.y * 0.02) * 0.45;
}

fn hydrationArt(point: vec2f, cycle: f32, seed: vec4f) -> f32 {
  let dropCenter = vec2f(0.0, -0.08 + sin(cycle) * 0.018);
  let bulb = sphereHeight(point, dropCenter + vec2f(0.0, 0.16), 0.48) * 0.34;
  let tipLeft = lineRelief(point, vec2f(-0.34, -0.06), vec2f(0.0, -0.72), 0.1, 0.17);
  let tipRight = lineRelief(point, vec2f(0.34, -0.06), vec2f(0.0, -0.72), 0.1, 0.17);
  let rippleA = ringRelief(point, vec2f(0.0, 0.68), 0.42 + seed.x * 0.05, 0.045, 0.1);
  let rippleB = ringRelief(point, vec2f(0.0, 0.68), 0.72, 0.045, 0.065);
  return bulb + tipLeft + tipRight + rippleA + rippleB;
}

fn localhostMorningArt(point: vec2f, cycle: f32, seed: vec4f) -> f32 {
  let frame = boxRelief(point, vec2f(0.0, 0.0), vec2f(0.72, 0.72), 0.08, 0.14);
  let dividerX = lineRelief(point, vec2f(0.0, -0.7), vec2f(0.0, 0.7), 0.035, 0.08);
  let dividerY = lineRelief(point, vec2f(-0.7, 0.15), vec2f(0.7, 0.15), 0.035, 0.08);
  let sun = sphereHeight(point, vec2f(0.32, 0.1 + sin(cycle) * 0.012), 0.36 + seed.x * 0.03) * 0.34;
  let desk = roundedPlate(point - vec2f(0.0, 0.72), vec2f(0.82, 0.09), 0.04, 0.16);
  return frame + dividerX + dividerY + sun + desk;
}

fn readmeLetterArt(point: vec2f, cycle: f32, seed: vec4f) -> f32 {
  let paper = roundedPlate(rotate(point - vec2f(-0.08, 0.03), -0.08), vec2f(0.62, 0.76), 0.08, 0.2);
  let foldA = lineRelief(point, vec2f(0.18, -0.72), vec2f(0.58, -0.3), 0.05, 0.12);
  let foldB = lineRelief(point, vec2f(0.58, -0.3), vec2f(0.18, -0.3), 0.05, 0.12);
  let letter = pinch((point - vec2f(-0.12, 0.18)) * 1.75, cycle, seed) * 0.72;
  let lines = lineRelief(point, vec2f(-0.46, 0.52), vec2f(0.3, 0.52), 0.035, 0.07)
    + lineRelief(point, vec2f(-0.46, 0.67), vec2f(0.12, 0.67), 0.035, 0.06);
  return paper + foldA + foldB + letter + lines;
}

fn openSourceCrushArt(point: vec2f, cycle: f32, seed: vec4f) -> f32 {
  let left = roundedPlate(rotate(point - vec2f(-0.38, 0.06), -0.2), vec2f(0.44, 0.68), 0.07, 0.2);
  let right = roundedPlate(rotate(point - vec2f(0.38, 0.06), 0.2), vec2f(0.44, 0.68), 0.07, 0.2);
  let spine = lineRelief(point, vec2f(0.0, -0.58), vec2f(0.0, 0.72), 0.045, 0.1);
  let crush = pinch((point - vec2f(0.0, 0.08)) * 2.15, cycle, seed) * 0.62;
  return max(left, right) + spine + crush;
}

fn sundayDeployArt(point: vec2f, cycle: f32, seed: vec4f) -> f32 {
  let sun = sphereHeight(point, vec2f(0.5, -0.42), 0.42 + seed.x * 0.03) * 0.28;
  let planeNose = vec2f(0.62 + sin(cycle) * 0.025, -0.16);
  let plane = lineRelief(point, vec2f(-0.72, 0.46), planeNose, 0.07, 0.18)
    + lineRelief(point, vec2f(-0.2, -0.02), planeNose, 0.07, 0.16)
    + lineRelief(point, vec2f(-0.72, 0.46), vec2f(-0.2, -0.02), 0.07, 0.13);
  let trail = signalWave(point, 0.58, 3.2, cycle, 0.065) * smoothstep(0.5, -0.65, point.x);
  return sun + plane + trail;
}

fn npmFeelingsArt(point: vec2f, cycle: f32, seed: vec4f) -> f32 {
  let box = roundedPlate(point - vec2f(0.0, 0.06), vec2f(0.68, 0.54), 0.08, 0.2);
  let lid = lineRelief(point, vec2f(-0.68, -0.18), vec2f(0.0, -0.55), 0.055, 0.1)
    + lineRelief(point, vec2f(0.68, -0.18), vec2f(0.0, -0.55), 0.055, 0.1);
  let seam = lineRelief(point, vec2f(0.0, -0.55), vec2f(0.0, 0.58), 0.04, 0.08);
  let feeling = pinch((point - vec2f(0.0, 0.1)) * 2.2, cycle, seed) * 0.54;
  return box + lid + seam + feeling;
}

fn mergeConflictArt(point: vec2f, cycle: f32, seed: vec4f) -> f32 {
  let left = roundedPlate(rotate(point - vec2f(-0.34, 0.04), -0.34), vec2f(0.44, 0.72), 0.08, 0.19);
  let right = roundedPlate(rotate(point - vec2f(0.34, 0.04), 0.34), vec2f(0.44, 0.72), 0.08, 0.19);
  let collision = sphereHeight(point, vec2f(0.0, 0.02), 0.18 + sin(cycle) * 0.015) * 0.4;
  let slashA = lineRelief(point, vec2f(-0.42, -0.4), vec2f(0.42, 0.44), 0.045, 0.12);
  let slashB = lineRelief(point, vec2f(0.42, -0.4), vec2f(-0.42, 0.44), 0.045, 0.12);
  return max(left, right) + collision + slashA + slashB;
}

fn pushForceArt(point: vec2f, cycle: f32, seed: vec4f) -> f32 {
  let force = 0.03 + sin(cycle) * 0.015;
  let shaft = lineRelief(point, vec2f(-0.78, 0.3), vec2f(0.46 + force, -0.32), 0.1, 0.2);
  let headA = lineRelief(point, vec2f(0.46 + force, -0.32), vec2f(0.08, -0.43), 0.1, 0.2);
  let headB = lineRelief(point, vec2f(0.46 + force, -0.32), vec2f(0.32, 0.06), 0.1, 0.2);
  let pressure = lineRelief(point, vec2f(-0.68, 0.52), vec2f(-0.1, 0.24), 0.045, 0.08)
    + lineRelief(point, vec2f(-0.78, 0.68), vec2f(-0.25, 0.42), 0.045, 0.06);
  return shaft + headA + headB + pressure + sphereHeight(point, vec2f(0.48, -0.32), 0.14 + seed.x * 0.03) * 0.22;
}

fn firstPaintArt(point: vec2f, cycle: f32, seed: vec4f) -> f32 {
  let frame = boxRelief(point, vec2f(0.0), vec2f(0.75, 0.7), 0.08, 0.16);
  let wipeAt = -0.5 + fract(cycle / TAU) * 1.0;
  let paint = roundedPlate(point - vec2f(wipeAt, 0.02), vec2f(0.3, 0.48), 0.2, 0.24);
  let drop = sphereHeight(point, vec2f(0.46, 0.45), 0.16 + seed.x * 0.03) * 0.36;
  let brush = lineRelief(point, vec2f(-0.55, 0.52), vec2f(0.55, -0.48), 0.07, 0.12);
  return frame + paint + drop + brush;
}

fn slowBuildArt(point: vec2f, cycle: f32, seed: vec4f) -> f32 {
  var blocks = 0.0;
  for (var index = 0.0; index < 4.0; index += 1.0) {
    let center = vec2f(-0.55 + index * 0.34, 0.5 - index * 0.28);
    let breathe = sin(cycle + index * 0.7) * 0.015;
    blocks = max(blocks, roundedPlate(point - center - vec2f(0.0, breathe), vec2f(0.22, 0.18), 0.045, 0.18 + index * 0.035));
  }
  let foundation = roundedPlate(point - vec2f(0.0, 0.76), vec2f(0.82, 0.08), 0.04, 0.14);
  return blocks + foundation;
}

fn consoleCalmArt(point: vec2f, cycle: f32, seed: vec4f) -> f32 {
  let terminal = boxRelief(point, vec2f(0.0), vec2f(0.76, 0.62), 0.1, 0.14);
  let top = lineRelief(point, vec2f(-0.72, -0.36), vec2f(0.72, -0.36), 0.04, 0.08);
  let prompt = lineRelief(point, vec2f(-0.48, -0.05), vec2f(-0.28, 0.1), 0.045, 0.1)
    + lineRelief(point, vec2f(-0.28, 0.1), vec2f(-0.48, 0.25), 0.045, 0.1);
  let calm = signalWave(point, 0.35, 2.8 + seed.x, cycle * 0.25, 0.09) * smoothstep(-0.3, 0.0, point.x);
  return terminal + top + prompt + calm;
}

fn softResetArt(point: vec2f, cycle: f32, seed: vec4f) -> f32 {
  let centre = sphereHeight(point, vec2f(0.0), 0.34 + sin(cycle) * 0.012) * 0.34;
  let ring = ringRelief(point, vec2f(0.0), 0.66, 0.065, 0.15) * (1.0 - smoothstep(0.2, 0.6, point.x + point.y));
  let arrowA = lineRelief(point, vec2f(0.36, -0.52), vec2f(0.72, -0.5), 0.07, 0.14);
  let arrowB = lineRelief(point, vec2f(0.72, -0.5), vec2f(0.62, -0.15), 0.07, 0.14);
  return centre + ring + arrowA + arrowB + dunes(point * 1.5, cycle, seed) * 0.08;
}

fn idleThreadArt(point: vec2f, cycle: f32, seed: vec4f) -> f32 {
  let spool = ringRelief(point, vec2f(-0.34, -0.32), 0.34, 0.07, 0.18);
  let hub = sphereHeight(point, vec2f(-0.34, -0.32), 0.12) * 0.38;
  let slack = signalWave(point, 0.32, 3.4, cycle * 0.18, 0.11) * smoothstep(-0.15, 0.05, point.x);
  let end = sphereHeight(point, vec2f(0.7, 0.48), 0.1 + seed.x * 0.02) * 0.32;
  return spool + hub + slack + end;
}

fn installSleepArt(point: vec2f, cycle: f32, seed: vec4f) -> f32 {
  let parcel = roundedPlate(point - vec2f(-0.18, 0.18), vec2f(0.52, 0.42), 0.08, 0.2);
  let seam = lineRelief(point, vec2f(-0.7, 0.0), vec2f(0.34, 0.0), 0.045, 0.08);
  let moonCenter = vec2f(0.34, -0.35 + sin(cycle) * 0.012);
  let moon = sphereHeight(point, moonCenter, 0.43) * 0.34;
  let cutout = sphereHeight(point, moonCenter + vec2f(0.18, -0.08), 0.4) * 0.33;
  let sleepLine = signalWave(point, 0.62, 2.5 + seed.x, cycle * 0.2, 0.06);
  return parcel + seam + max(moon - cutout, 0.0) + sleepLine;
}

fn neonTerminalArt(point: vec2f, cycle: f32, seed: vec4f) -> f32 {
  let outer = boxRelief(point, vec2f(0.0), vec2f(0.76, 0.68), 0.12, 0.18);
  let inner = boxRelief(point, vec2f(0.0, 0.03), vec2f(0.6, 0.48), 0.08, 0.1);
  let promptA = lineRelief(point, vec2f(-0.38, -0.08), vec2f(-0.2, 0.05), 0.045, 0.13);
  let promptB = lineRelief(point, vec2f(-0.2, 0.05), vec2f(-0.38, 0.18), 0.045, 0.13);
  let cursor = roundedPlate(point - vec2f(0.16 + sin(cycle) * 0.015, 0.19), vec2f(0.2, 0.045), 0.02, 0.2);
  return outer + inner + promptA + promptB + cursor + sphereHeight(point, vec2f(seed.x - 0.5, -0.5), 0.2) * 0.12;
}

fn retroCompilerArt(point: vec2f, cycle: f32, seed: vec4f) -> f32 {
  let card = roundedPlate(rotate(point, -0.06), vec2f(0.72, 0.66), 0.07, 0.18);
  var holes = 0.0;
  for (var index = 0.0; index < 12.0; index += 1.0) {
    let column = index - floor(index / 4.0) * 4.0;
    let row = floor(index / 4.0);
    let center = vec2f(-0.48 + column * 0.32, -0.28 + row * 0.28);
    holes += roundedPlate(point - center, vec2f(0.07, 0.05), 0.018, 0.19);
  }
  let output = lineRelief(point, vec2f(-0.42, 0.58), vec2f(0.42, 0.58), 0.04, 0.1);
  return card + holes + output + panels(point * 1.8, cycle, seed) * 0.035;
}

fn cyberMondayArt(point: vec2f, cycle: f32, seed: vec4f) -> f32 {
  let bag = roundedPlate(point - vec2f(0.0, 0.16), vec2f(0.62, 0.52), 0.08, 0.2);
  let handle = ringRelief(point, vec2f(0.0, -0.38), 0.34, 0.06, 0.15) * (1.0 - smoothstep(-0.42, -0.12, point.y));
  let circuitA = lineRelief(point, vec2f(-0.42, 0.08), vec2f(0.28, 0.08), 0.04, 0.09);
  let circuitB = lineRelief(point, vec2f(-0.18, 0.08), vec2f(-0.18, 0.46), 0.04, 0.09);
  let chip = roundedPlate(point - vec2f(0.3, 0.32), vec2f(0.13, 0.13), 0.025, 0.26);
  return bag + handle + circuitA + circuitB + chip + sphereHeight(point, vec2f(-0.42, 0.08), 0.08) * 0.34;
}

fn chromeDreamsArt(point: vec2f, cycle: f32, seed: vec4f) -> f32 {
  let drift = vec2f(sin(cycle), cos(cycle)) * 0.02;
  let orbA = sphereHeight(point, vec2f(-0.42, -0.18) + drift, 0.58) * 0.34;
  let orbB = sphereHeight(point, vec2f(0.42, 0.08) - drift, 0.66) * 0.3;
  let orbC = sphereHeight(point, vec2f(0.0, 0.54), 0.4 + seed.x * 0.05) * 0.26;
  let dream = signalWave(point, 0.46, 3.0, cycle * 0.3, 0.08);
  return max(max(orbA, orbB), orbC) + dream;
}

fn midnightDeployArt(point: vec2f, cycle: f32, seed: vec4f) -> f32 {
  let moonCenter = vec2f(0.5, -0.42);
  let moon = sphereHeight(point, moonCenter, 0.42) * 0.3;
  let cutout = sphereHeight(point, moonCenter + vec2f(0.16, -0.08), 0.38) * 0.29;
  let tip = vec2f(0.18 + sin(cycle) * 0.015, -0.48);
  let rocket = lineRelief(point, vec2f(-0.38, 0.58), tip, 0.1, 0.2)
    + lineRelief(point, tip, vec2f(-0.12, -0.35), 0.08, 0.16)
    + lineRelief(point, tip, vec2f(0.3, -0.12), 0.08, 0.16);
  let exhaust = signalWave(point, 0.62, 4.0 + seed.x, cycle, 0.07) * smoothstep(0.15, -0.65, point.x);
  return max(moon - cutout, 0.0) + rocket + exhaust;
}

fn raceConditionArt(point: vec2f, cycle: f32, seed: vec4f) -> f32 {
  let finish = vec2f(0.65, 0.0);
  let top = lineRelief(point, vec2f(-0.78, -0.42 + sin(cycle) * 0.025), finish, 0.075, 0.16);
  let bottom = lineRelief(point, vec2f(-0.78, 0.42 - sin(cycle) * 0.025), finish, 0.075, 0.16);
  let racerA = sphereHeight(point, vec2f(-0.28 + sin(cycle) * 0.04, -0.22), 0.14) * 0.34;
  let racerB = sphereHeight(point, vec2f(-0.08 - sin(cycle) * 0.04, 0.22), 0.14 + seed.x * 0.02) * 0.34;
  let gate = lineRelief(point, vec2f(0.68, -0.56), vec2f(0.68, 0.56), 0.045, 0.12);
  return top + bottom + racerA + racerB + gate;
}

fn deadlockArt(point: vec2f, cycle: f32, seed: vec4f) -> f32 {
  let drift = sin(cycle) * 0.015;
  let left = ringRelief(point, vec2f(-0.34 - drift, 0.0), 0.5, 0.09, 0.2);
  let right = ringRelief(point, vec2f(0.34 + drift, 0.0), 0.5 + seed.x * 0.03, 0.09, 0.2);
  let locks = roundedPlate(point - vec2f(-0.34, 0.0), vec2f(0.12, 0.18), 0.04, 0.2)
    + roundedPlate(point - vec2f(0.34, 0.0), vec2f(0.12, 0.18), 0.04, 0.2);
  return left + right + locks;
}

fn backpressureArt(point: vec2f, cycle: f32, seed: vec4f) -> f32 {
  let barrier = roundedPlate(point - vec2f(0.5, 0.0), vec2f(0.1, 0.78), 0.05, 0.24);
  var waves = 0.0;
  for (var index = 0.0; index < 3.0; index += 1.0) {
    let y = -0.38 + index * 0.38;
    waves += signalWave(point, y, 4.2 + index, cycle + index, 0.1) * smoothstep(0.48, 0.2, point.x);
  }
  let rebound = ringRelief(point, vec2f(0.48, 0.0), 0.34 + seed.x * 0.04, 0.06, 0.1) * smoothstep(0.55, 0.25, point.x);
  return barrier + waves + rebound;
}

fn commitMessageArt(point: vec2f, cycle: f32, seed: vec4f) -> f32 {
  let card = roundedPlate(point - vec2f(0.0, 0.04), vec2f(0.72, 0.54), 0.08, 0.18);
  let foldA = lineRelief(point, vec2f(-0.68, -0.42), vec2f(0.0, 0.08), 0.05, 0.1);
  let foldB = lineRelief(point, vec2f(0.68, -0.42), vec2f(0.0, 0.08), 0.05, 0.1);
  let checkA = lineRelief(point, vec2f(-0.2, 0.22), vec2f(-0.02, 0.4), 0.06, 0.16);
  let checkB = lineRelief(point, vec2f(-0.02, 0.4), vec2f(0.38, 0.0), 0.06, 0.16);
  return card + foldA + foldB + checkA + checkB + sin(cycle) * seed.x * 0.002;
}

fn cacheHitArt(point: vec2f, cycle: f32, seed: vec4f) -> f32 {
  let bullseye = ringRelief(point, vec2f(0.22, 0.0), 0.62, 0.055, 0.11)
    + ringRelief(point, vec2f(0.22, 0.0), 0.38, 0.055, 0.14)
    + sphereHeight(point, vec2f(0.22, 0.0), 0.14) * 0.34;
  let incoming = roundedPlate(point - vec2f(-0.62 + sin(cycle) * 0.025, 0.0), vec2f(0.18, 0.18), 0.04, 0.24);
  let path = lineRelief(point, vec2f(-0.62, 0.0), vec2f(0.08, 0.0), 0.055, 0.1);
  return bullseye + incoming + path + seed.x * 0.01;
}

fn nullPointerArt(point: vec2f, cycle: f32, seed: vec4f) -> f32 {
  let tip = vec2f(0.32, 0.2);
  let pointer = lineRelief(point, vec2f(-0.62, -0.6), tip, 0.09, 0.2)
    + lineRelief(point, tip, vec2f(-0.1, 0.08), 0.09, 0.18)
    + lineRelief(point, vec2f(-0.1, 0.08), vec2f(-0.2, 0.5), 0.09, 0.18)
    + lineRelief(point, vec2f(-0.2, 0.5), vec2f(-0.62, -0.6), 0.09, 0.18);
  let voidRing = ringRelief(point, vec2f(0.52, -0.24), 0.25 + sin(cycle) * 0.01, 0.055, 0.15);
  return pointer + voidRing + sphereHeight(point, vec2f(0.52, -0.24), 0.06 + seed.x * 0.01) * 0.2;
}

fn vibeCodingArt(point: vec2f, cycle: f32, seed: vec4f) -> f32 {
  let headphones = ringRelief(point, vec2f(0.0, -0.02), 0.62, 0.075, 0.15) * (1.0 - smoothstep(0.12, 0.5, point.y));
  let leftCup = roundedPlate(point - vec2f(-0.58, 0.18), vec2f(0.13, 0.28), 0.07, 0.24);
  let rightCup = roundedPlate(point - vec2f(0.58, 0.18), vec2f(0.13, 0.28), 0.07, 0.24);
  let codeA = lineRelief(point, vec2f(-0.24, -0.12), vec2f(-0.08, 0.02), 0.045, 0.1)
    + lineRelief(point, vec2f(-0.08, 0.02), vec2f(-0.24, 0.16), 0.045, 0.1);
  let codeB = lineRelief(point, vec2f(0.24, -0.12), vec2f(0.08, 0.02), 0.045, 0.1)
    + lineRelief(point, vec2f(0.08, 0.02), vec2f(0.24, 0.16), 0.045, 0.1);
  return headphones + leftCup + rightCup + codeA + codeB + signalWave(point, 0.52, 5.0 + seed.x, cycle, 0.06);
}

fn approvedArt(point: vec2f, cycle: f32, seed: vec4f) -> f32 {
  let branchA = lineRelief(point, vec2f(-0.64, -0.48), vec2f(-0.18, 0.0), 0.065, 0.14);
  let branchB = lineRelief(point, vec2f(-0.64, 0.48), vec2f(-0.18, 0.0), 0.065, 0.14);
  let trunk = lineRelief(point, vec2f(-0.18, 0.0), vec2f(0.62, 0.0), 0.065, 0.14);
  let nodes = sphereHeight(point, vec2f(-0.64, -0.48), 0.11) * 0.34
    + sphereHeight(point, vec2f(-0.64, 0.48), 0.11) * 0.34
    + sphereHeight(point, vec2f(0.62, 0.0), 0.13 + sin(cycle) * 0.01) * 0.36;
  let check = lineRelief(point, vec2f(0.04, 0.16), vec2f(0.2, 0.32), 0.05, 0.12)
    + lineRelief(point, vec2f(0.2, 0.32), vec2f(0.48, -0.02), 0.05, 0.12);
  return branchA + branchB + trunk + nodes + check + seed.x * 0.005;
}

fn localhostLullabyArt(point: vec2f, cycle: f32, seed: vec4f) -> f32 {
  let house = roundedPlate(point - vec2f(-0.18, 0.22), vec2f(0.48, 0.4), 0.06, 0.18);
  let roofA = lineRelief(point, vec2f(-0.72, -0.16), vec2f(-0.18, -0.58), 0.08, 0.16);
  let roofB = lineRelief(point, vec2f(-0.18, -0.58), vec2f(0.36, -0.16), 0.08, 0.16);
  let window = roundedPlate(point - vec2f(-0.18, 0.18), vec2f(0.16, 0.18), 0.035, 0.28);
  let moonCenter = vec2f(0.5, -0.42);
  let moon = sphereHeight(point, moonCenter, 0.32) * 0.32;
  let cutout = sphereHeight(point, moonCenter + vec2f(0.14, -0.06), 0.29) * 0.3;
  return house + roofA + roofB + window + max(moon - cutout, 0.0) + signalWave(point, 0.72, 3.0 + seed.x, cycle * 0.2, 0.05);
}

fn stackTraceArt(point: vec2f, cycle: f32, seed: vec4f) -> f32 {
  var frames = 0.0;
  var trace = 0.0;
  for (var index = 0.0; index < 4.0; index += 1.0) {
    let center = vec2f(-0.48 + index * 0.3, 0.42 - index * 0.28);
    frames = max(frames, roundedPlate(point - center, vec2f(0.28, 0.18), 0.045, 0.14 + index * 0.03));
    if (index < 3.0) {
      trace += lineRelief(point, center, center + vec2f(0.3, -0.28), 0.045, 0.08);
    }
  }
  let endpoint = sphereHeight(point, vec2f(0.42, -0.42 + sin(cycle) * 0.012), 0.12 + seed.x * 0.02) * 0.36;
  return frames + trace + endpoint;
}

fn crtGlowArt(point: vec2f, cycle: f32, seed: vec4f) -> f32 {
  let screen = roundedPlate(point, vec2f(0.74, 0.62), 0.16, 0.18);
  let edge = boxRelief(point, vec2f(0.0), vec2f(0.74, 0.62), 0.16, 0.15);
  var scanlines = 0.0;
  for (var row = 0.0; row < 5.0; row += 1.0) {
    let y = -0.38 + row * 0.19;
    scanlines += lineRelief(point, vec2f(-0.58, y), vec2f(0.58, y), 0.025, 0.045);
  }
  let glow = sphereHeight(point, vec2f(sin(cycle) * 0.03, 0.0), 0.36 + seed.x * 0.04) * 0.23;
  return screen + edge + scanlines + glow;
}

fn modemHandshakeArt(point: vec2f, cycle: f32, seed: vec4f) -> f32 {
  let left = roundedPlate(point - vec2f(-0.62, 0.0), vec2f(0.26, 0.42), 0.06, 0.2);
  let right = roundedPlate(point - vec2f(0.62, 0.0), vec2f(0.26, 0.42), 0.06, 0.2);
  let waveA = signalWave(point, -0.12, 8.0, cycle, 0.1) * smoothstep(-0.32, -0.02, point.x) * smoothstep(0.18, -0.02, point.x);
  let waveB = signalWave(point, 0.12, 8.0, -cycle, 0.1) * smoothstep(0.32, 0.02, point.x) * smoothstep(-0.18, 0.02, point.x);
  let meeting = sphereHeight(point, vec2f(0.0), 0.13 + sin(cycle) * 0.012 + seed.x * 0.01) * 0.4;
  return left + right + waveA + waveB + meeting;
}

fn biosBootArt(point: vec2f, cycle: f32, seed: vec4f) -> f32 {
  let power = ringRelief(point, vec2f(0.0, -0.22), 0.36, 0.07, 0.17);
  let stem = lineRelief(point, vec2f(0.0, -0.62), vec2f(0.0, -0.14), 0.075, 0.2);
  var progress = 0.0;
  for (var index = 0.0; index < 5.0; index += 1.0) {
    let lit = select(0.08, 0.22, index <= floor(fract(cycle / TAU) * 6.0));
    progress += roundedPlate(point - vec2f(-0.48 + index * 0.24, 0.52), vec2f(0.08, 0.07), 0.018, lit);
  }
  let base = lineRelief(point, vec2f(-0.62, 0.7), vec2f(0.62, 0.7), 0.04, 0.08);
  return power + stem + progress + base + seed.x * 0.005;
}

fn trackHeight(point: vec2f, cycle: f32, turn: f32, motif: f32, seed: vec4f) -> f32 {
  if (motif < 0.5) { return asyncAwaitArt(point, cycle, seed); }
  if (motif < 1.5) { return websocketSunsetArt(point, cycle, seed); }
  if (motif < 2.5) { return serverVibesArt(point, cycle, seed); }
  if (motif < 3.5) { return hydrationArt(point, cycle, seed); }
  if (motif < 4.5) { return insetPanels(point, cycle, seed); }
  if (motif < 5.5) { return localhostMorningArt(point, cycle, seed); }
  if (motif < 6.5) { return readmeLetterArt(point, cycle, seed); }
  if (motif < 7.5) { return openSourceCrushArt(point, cycle, seed); }
  if (motif < 8.5) { return sundayDeployArt(point, cycle, seed); }
  if (motif < 9.5) { return npmFeelingsArt(point, cycle, seed); }
  if (motif < 10.5) { return monolith(point, cycle, seed); }
  if (motif < 11.5) { return foldedEdge(point, cycle, seed); }
  if (motif < 12.5) { return nightHorizon(point, cycle, seed); }
  if (motif < 13.5) { return mergeConflictArt(point, cycle, seed); }
  if (motif < 14.5) { return pushForceArt(point, cycle, seed); }
  if (motif < 15.5) { return pixelGrid(point, cycle, seed); }
  if (motif < 16.5) { return pinch(point, cycle, seed); }
  if (motif < 17.5) { return chemicalCluster(point, cycle, seed); }
  if (motif < 18.5) { return protectiveArc(point, cycle, seed); }
  if (motif < 19.5) { return firstPaintArt(point, cycle, seed); }
  if (motif < 20.5) { return slowBuildArt(point, cycle, seed); }
  if (motif < 21.5) { return consoleCalmArt(point, cycle, seed); }
  if (motif < 22.5) { return softResetArt(point, cycle, seed); }
  if (motif < 23.5) { return idleThreadArt(point, cycle, seed); }
  if (motif < 24.5) { return installSleepArt(point, cycle, seed); }
  if (motif < 25.5) { return neonTerminalArt(point, cycle, seed); }
  if (motif < 26.5) { return retroCompilerArt(point, cycle, seed); }
  if (motif < 27.5) { return cyberMondayArt(point, cycle, seed); }
  if (motif < 28.5) { return chromeDreamsArt(point, cycle, seed); }
  if (motif < 29.5) { return midnightDeployArt(point, cycle, seed); }
  if (motif < 30.5) { return raceConditionArt(point, cycle, seed); }
  if (motif < 31.5) { return deadlockArt(point, cycle, seed); }
  if (motif < 32.5) { return backpressureArt(point, cycle, seed); }
  if (motif < 33.5) { return commitMessageArt(point, cycle, seed); }
  if (motif < 34.5) { return pushForceArt(rotate(point, 0.32), cycle + 1.2, seed) + strata(point * 1.4, cycle, seed) * 0.08; }
  if (motif < 35.5) { return cacheHitArt(point, cycle, seed); }
  if (motif < 36.5) { return nullPointerArt(point, cycle, seed); }
  if (motif < 37.5) { return vibeCodingArt(point, cycle, seed); }
  if (motif < 38.5) { return approvedArt(point, cycle, seed); }
  if (motif < 39.5) { return localhostLullabyArt(point, cycle, seed); }
  if (motif < 40.5) { return stackTraceArt(point, cycle, seed); }
  if (motif < 41.5) { return crtGlowArt(point, cycle, seed); }
  if (motif < 42.5) { return modemHandshakeArt(point, cycle, seed); }
  if (motif < 43.5) { return biosBootArt(point, cycle, seed); }
  if (motif < 44.5) { return swell(point, cycle, seed); }
  if (motif < 45.5) { return limb(point, cycle, seed); }
  if (motif < 46.5) { return satin(point, cycle, seed); }
  if (motif < 47.5) { return panels(point, cycle, seed); }
  if (motif < 48.5) { return strata(point, cycle, seed); }
  if (motif < 49.5) { return cluster(point, cycle, seed); }
  if (motif < 50.5) { return tunnel(point, turn, seed); }
  return dunes(point, cycle, seed);
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
    + exp(-squareValue((recordRadius - 0.35) * 20.0)) * 0.1;
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
    let horizon = exp(-squareValue((point.y - 0.3) * 18.0))
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
  for (var index = 0.0; index < 12.0; index += 1.0) {
    let column = index - floor(index / 4.0) * 4.0;
    let row = floor(index / 4.0);
    let center = vec2f(0.45 + column * 0.52, -0.48 + row * 0.45);
    let pulse = 0.5 + 0.5 * sin(cycle + index * 0.72 + seed.x * TAU);
    let local = point - center - vec2f(0.0, pulse * 0.02);
    let activity = select(0.45, 1.0, hash21(vec2f(index, seed.x * 19.0)) > 0.38);
    height = max(height, roundedPlate(local, vec2f(0.19, 0.17), 0.055, (0.12 + pulse * 0.2) * activity));
  }
  let signalY = 0.58 + sin(point.x * 5.2 + cycle) * 0.08 + sin(point.x * 9.0 - cycle) * 0.035;
  let signal = exp(-squareValue((point.y - signalY) * 24.0))
    * smoothstep(0.18, 0.34, point.x)
    * (1.0 - smoothstep(2.25, 2.42, point.x)) * 0.15;
  let rail = exp(-squareValue((point.y - 0.76) * 25.0))
    * smoothstep(0.12, 0.3, point.x)
    * (1.0 - smoothstep(2.3, 2.48, point.x)) * 0.06;
  return height + signal + rail;
}

fn synthwaveHeight(point: vec2f, cycle: f32, seed: vec4f) -> f32 {
  let center = vec2f(1.35 + (seed.x - 0.5) * 0.16, 0.16 + sin(cycle) * 0.018);
  let radius = 0.72 + seed.y * 0.08;
  let sun = sphereHeight(point, center, radius) * 0.38;
  let horizonY = 0.46;
  let horizon = exp(-squareValue((point.y - horizonY) * 24.0))
    * smoothstep(0.05, 0.25, point.x)
    * (1.0 - smoothstep(2.48, 2.68, point.x)) * 0.17;
  var scanBands = 0.0;
  for (var band = 0.0; band < 4.0; band += 1.0) {
    let y = -0.1 + band * 0.16;
    let insideSun = 1.0 - smoothstep(radius - 0.08, radius + 0.02, length(point - center));
    scanBands += exp(-squareValue((point.y - y) * 32.0)) * insideSun * 0.055;
  }
  var grid = 0.0;
  for (var ray = 0.0; ray < 5.0; ray += 1.0) {
    let end = vec2f(0.15 + ray * 0.62, 1.05);
    grid = max(grid, exp(-squareValue(segmentDistance(point, vec2f(1.35, horizonY), end) * 22.0)) * 0.055);
  }
  for (var row = 0.0; row < 3.0; row += 1.0) {
    let y = horizonY + 0.13 + row * row * 0.075;
    grid = max(grid, exp(-squareValue((point.y - y) * 28.0)) * 0.045);
  }
  grid *= smoothstep(horizonY - 0.02, horizonY + 0.08, point.y);
  return sun + horizon + scanBands + grid;
}

fn hipHopHeight(point: vec2f, cycle: f32, seed: vec4f) -> f32 {
  let bounce = sin(cycle) * 0.025;
  let body = roundedPlate(point - vec2f(1.35, 0.12), vec2f(1.18, 0.68), 0.14, 0.13);
  let handleOuter = roundedPlate(point - vec2f(1.35, -0.65), vec2f(0.48, 0.18), 0.12, 0.13);
  let handleInner = roundedPlate(point - vec2f(1.35, -0.62), vec2f(0.32, 0.12), 0.09, 0.12);
  let handle = max(handleOuter - handleInner, 0.0);
  let leftCenter = vec2f(0.82, 0.12 + bounce);
  let rightCenter = vec2f(1.86, 0.04 - bounce);
  let leftRadius = 0.5;
  let rightRadius = 0.62;
  let leftCone = sphereHeight(point, leftCenter, leftRadius) * 0.34;
  let rightCone = sphereHeight(point, rightCenter, rightRadius) * 0.38;
  let leftRing = exp(-squareValue((length(point - leftCenter) - leftRadius * 0.72) * 18.0)) * 0.12;
  let rightRing = exp(-squareValue((length(point - rightCenter) - rightRadius * 0.72) * 18.0)) * 0.14;
  let bridge = roundedPlate(point - vec2f(1.34, 0.67), vec2f(1.1, 0.09), 0.07, 0.1);
  return body + handle + max(leftCone + leftRing, rightCone + rightRing) + bridge;
}

fn indieHeight(point: vec2f, cycle: f32, seed: vec4f) -> f32 {
  var height = 0.0;
  for (var index = 0.0; index < 3.0; index += 1.0) {
    let center = vec2f(0.65 + index * 0.48, -0.02 + index * 0.05);
    let angle = -0.24 + index * 0.18 + sin(cycle) * (index - 1.0) * 0.01;
    let local = rotate(point - center, angle);
    let tornEdge = 0.58
      + sin(local.x * (2.2 + index * 0.35) + seed.x * TAU) * 0.035
      + simplex2d(vec2f(local.x * 2.6, index * 4.1 + seed.y * 5.0)) * 0.055;
    let insideX = 1.0 - smoothstep(0.54, 0.62, abs(local.x));
    let top = smoothstep(-0.68, -0.61, local.y);
    let sheet = top * (1.0 - smoothstep(-0.045, 0.045, local.y - tornEdge)) * insideX;
    let paperEdge = exp(-squareValue((local.y - tornEdge) * 14.0)) * insideX * 0.09;
    height = max(height, sheet * (0.14 + index * 0.075) + paperEdge);
  }
  let tapeA = roundedPlate(rotate(point - vec2f(0.62, -0.57), -0.18), vec2f(0.24, 0.07), 0.025, 0.24);
  let tapeB = roundedPlate(rotate(point - vec2f(1.92, -0.5), 0.22), vec2f(0.23, 0.07), 0.025, 0.22);
  height = max(height, max(tapeA, tapeB));
  return height;
}

fn popHeight(point: vec2f, cycle: f32, seed: vec4f) -> f32 {
  let focus = vec2f(1.35 + (seed.x - 0.5) * 0.1, 0.03);
  var bubbleStar = sphereHeight(point, focus, 0.42) * 0.34;
  for (var index = 0.0; index < 5.0; index += 1.0) {
    let direction = index * TAU / 5.0 - 0.3 + sin(cycle) * 0.012;
    let lobeCenter = focus + vec2f(cos(direction), sin(direction)) * 0.46;
    bubbleStar = max(bubbleStar, sphereHeight(point, lobeCenter, 0.38) * 0.34);
  }
  let sparkleCenter = focus + vec2f(0.92, -0.5);
  let sparkle = exp(-abs(point.x - sparkleCenter.x) * 45.0) * exp(-abs(point.y - sparkleCenter.y) * 7.0)
    + exp(-abs(point.y - sparkleCenter.y) * 45.0) * exp(-abs(point.x - sparkleCenter.x) * 7.0);
  return bubbleStar + sparkle * 0.12;
}

fn loFiHeight(point: vec2f, cycle: f32, seed: vec4f) -> f32 {
  let bodyCenter = vec2f(1.35, 0.03);
  let body = roundedPlate(point - bodyCenter, vec2f(1.08, 0.7), 0.13, 0.2);
  let leftCenter = bodyCenter + vec2f(-0.43, -0.08);
  let rightCenter = bodyCenter + vec2f(0.43, -0.08);
  let spin = sin(cycle) * 0.01;
  let leftReel = sphereHeight(point, leftCenter, 0.29 + spin) * 0.36;
  let rightReel = sphereHeight(point, rightCenter, 0.29 - spin) * 0.36;
  let leftHub = sphereHeight(point, leftCenter, 0.09) * 0.5;
  let rightHub = sphereHeight(point, rightCenter, 0.09) * 0.5;
  let tapeWindow = roundedPlate(point - (bodyCenter + vec2f(0.0, 0.38)), vec2f(0.55, 0.09), 0.045, 0.28);
  let tape = exp(-squareValue(segmentDistance(point, leftCenter, rightCenter) * 20.0)) * 0.075;
  return body + max(leftReel + leftHub, rightReel + rightHub) + tapeWindow + tape;
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
  let bass = cover.params.w;

  // Surface normal from the height field. Three samples is the whole cost of making a
  // flat field look like a lit object.
  let step2 = 0.008;
  let detail = select(cover.shape.y, 1.0, cover.shape.y <= 0.0);
  // Pull the sample point toward the centre on each kick. The field appears to expand
  // inside the artwork like a speaker cone without scaling or glowing the surrounding UI.
  let bassScale = 1.0 + bass * 0.055;
  let sample = point * detail / bassScale;
  let heightBoost = 1.0 + bass * 0.2;
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

  // A subtle centre lift keeps the relief dimensional without adding a dark perimeter
  // that can read as a separate layer while the live canvas appears.
  let centredPoint = point / vec2f(aspect, 1.0);
  let centreLift = 1.0 - smoothstep(0.0, 0.9, length(centredPoint));
  glow += centreLift * 0.035 + bass * centreLift * 0.025;

  // Fold it into one premultiplied source-over sample: highlight lifts the gradient,
  // shade lowers it. The highlight carries the beam's slight spectral tint.
  let tint = (beam - vec3f(sweep)) * (1.0 + specular * 2.0) * 0.07;
  let highlight = clamp(vec3f(glow) + tint, vec3f(0.0), vec3f(1.0));
  let darkened = clamp(shade, 0.0, 1.0);
  let alpha = 1.0 - (1.0 - darkened) * (1.0 - max(max(highlight.r, highlight.g), highlight.b));

  return vec4f(highlight, alpha);
}
