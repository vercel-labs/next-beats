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
  // w: point units per CSS pixel
  params: vec4f,
  // x: aspect ratio (width / height), y: detail scale -- below 1 samples a smaller slice
  // of the field, so its features come out larger. Small covers need that: downscaling a
  // 384px composition to 40px just turns it to mush.
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

/** Folded satin: one smooth field warped by another. */
fn satin(point: vec2f, cycle: f32, seed: vec4f) -> f32 {
  let turned = rotate(point, seed.z * TAU) + seed.xy * 8.0;
  let frequency = 0.34 + seed.x * 0.24;
  let warp = vec2f(
    smoothFlow(turned * frequency + vec2f(3.1, 0.0), cycle, 0.34),
    smoothFlow(turned * frequency + vec2f(0.0, 5.7), cycle, 0.34),
  );
  return smoothFlow(turned * (frequency * 1.2) + warp * (0.4 + seed.y * 0.35), cycle, 0.2) * 1.05;
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

/** A cluster of translucent spheres. */
fn cluster(point: vec2f, cycle: f32, seed: vec4f) -> f32 {
  let count = 3.0 + floor(seed.x * 3.0);
  var height = 0.0;
  for (var index = 0.0; index < 6.0; index += 1.0) {
    if (index >= count) { break; }
    let angle = index * (1.5 + seed.z) + seed.y * TAU;
    let drift = vec2f(cos(cycle + angle), sin(cycle + angle)) * 0.06;
    let center = vec2f(cos(angle), sin(angle * 1.3)) * (0.2 + index * (0.08 + seed.w * 0.06)) + drift;
    height = max(height, sphereHeight(point, center, 0.42 + hash21(vec2f(index, seed.x * 30.0)) * 0.3));
  }
  return height * 0.5;
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

fn trackHeight(point: vec2f, cycle: f32, turn: f32, motif: f32, seed: vec4f) -> f32 {
  if (motif < 0.5) { return swell(point, cycle, seed); }
  if (motif < 1.5) { return limb(point, cycle, seed); }
  if (motif < 2.5) { return satin(point, cycle, seed); }
  if (motif < 3.5) { return panels(point, cycle, seed); }
  if (motif < 4.5) { return strata(point, cycle, seed); }
  if (motif < 5.5) { return cluster(point, cycle, seed); }
  if (motif < 6.5) { return tunnel(point, turn, seed); }
  return dunes(point, cycle, seed);
}

/** A reusable family of overlapping album sleeves for generated playlists. */
fn playlistHeight(point: vec2f, cycle: f32, variant: f32, seed: vec4f) -> f32 {
  let variant01 = variant / 3.0;
  let breathe = sin(cycle) * 0.018;
  var height = 0.0;

  for (var layer = 0.0; layer < 3.0; layer += 1.0) {
    let order = layer - 1.0;
    var center = vec2f(order * 0.035, order * -0.15);
    var angle = (seed.z - 0.5) * 0.035;
    if (variant > 0.5 && variant < 1.5) {
      center = vec2f(order * 0.17, order * -0.09);
      angle += order * 0.13;
    } else if (variant > 1.5 && variant < 2.5) {
      center = vec2f(order * -0.12, order * -0.13);
      angle += order * -0.085;
    } else if (variant > 2.5) {
      center = vec2f(order * 0.13, order * -0.13);
      angle += order * 0.055 + 0.12;
    }
    angle += breathe * order;
    let local = rotate(point - center, angle);
    let plate = roundedPlate(local, vec2f(0.82, 0.9), 0.12, 0.16 + layer * 0.115);
    height = max(height, plate);
  }

  let glowCenter = vec2f((seed.x - 0.5) * 0.35, -0.18 + (seed.y - 0.5) * 0.2);
  let glow = exp(-dot(point - glowCenter, point - glowCenter) * 1.6) * (0.055 + variant01 * 0.035);
  return height + glow;
}

fn electronicHeight(point: vec2f, cycle: f32, seed: vec4f) -> f32 {
  var height = 0.0;
  for (var index = 0.0; index < 12.0; index += 1.0) {
    let column = index - floor(index / 4.0) * 4.0;
    let row = floor(index / 4.0);
    let center = vec2f(0.55 + column * 0.58, -0.55 + row * 0.55);
    let pulse = 0.5 + 0.5 * sin(cycle + index * 0.72 + seed.x * TAU);
    let local = point - center - vec2f(0.0, pulse * 0.025);
    height = max(height, roundedPlate(local, vec2f(0.24, 0.23), 0.075, 0.1 + pulse * 0.12));
  }
  return height;
}

fn synthwaveHeight(point: vec2f, cycle: f32, seed: vec4f) -> f32 {
  let center = vec2f(1.3 + (seed.x - 0.5) * 0.3, 0.74 + sin(cycle) * 0.025);
  let body = sphereHeight(point, center, 1.05 + seed.y * 0.18) * 0.38;
  let horizon = (1.0 - smoothstep(0.0, 0.055, abs(point.y - 0.55))) * 0.15;
  let depth = smoothstep(1.1, -0.4, point.y) * smoothstep(-0.8, 1.2, point.x) * 0.08;
  return max(body, horizon) + depth;
}

fn hipHopHeight(point: vec2f, cycle: f32, seed: vec4f) -> f32 {
  var height = 0.0;
  for (var index = 0.0; index < 3.0; index += 1.0) {
    let width = 0.38 + index * 0.055;
    let rise = 0.42 + index * 0.18;
    let bounce = sin(cycle + index * 1.35 + seed.x * TAU) * 0.035;
    let center = vec2f(0.2 + index * 0.95, 0.75 - rise * 0.32 + bounce);
    height = max(height, roundedPlate(point - center, vec2f(width, rise), width, 0.17 + index * 0.075));
  }
  return height;
}

fn indieHeight(point: vec2f, cycle: f32, seed: vec4f) -> f32 {
  let turned = rotate(point - vec2f(1.15, -0.2), -0.2 + (seed.z - 0.5) * 0.09);
  var height = 0.0;
  for (var index = 0.0; index < 3.0; index += 1.0) {
    let edge = -0.52 + index * 0.38
      + sin(turned.x * (0.82 + index * 0.12) + seed.x * TAU + cycle) * 0.045
      + simplex2d(vec2f(turned.x * 1.35, index * 2.7 + seed.y * 4.0)) * 0.075;
    height += (1.0 - smoothstep(-0.055, 0.055, turned.y - edge)) * (0.105 + index * 0.055);
  }
  return height;
}

fn popHeight(point: vec2f, cycle: f32, seed: vec4f) -> f32 {
  let center = vec2f(1.05 + (seed.x - 0.5) * 0.18, 0.02);
  let local = point - center;
  let radius = length(local);
  let angle = atan2(local.y, local.x);
  let fold = pow(1.0 - abs(sin(angle * 2.5 + sin(cycle) * 0.035)), 4.0) * exp(-radius * 0.8) * 0.23;
  var height = 0.0;
  for (var index = 0.0; index < 3.0; index += 1.0) {
    let lobeAngle = index * TAU / 3.0 + seed.y * 0.3 + sin(cycle) * 0.02;
    let lobeCenter = center + vec2f(cos(lobeAngle), sin(lobeAngle)) * 1.12;
    height = max(height, sphereHeight(point, lobeCenter, 1.22) * (0.16 + index * 0.018));
  }
  let focus = exp(-dot(local, local) * 22.0) * 0.14;
  return height + focus + fold;
}

fn loFiHeight(point: vec2f, cycle: f32, seed: vec4f) -> f32 {
  let center = vec2f(1.72 + (seed.x - 0.5) * 0.2, 0.68);
  let radius = length(point - center);
  let rings = (0.5 + 0.5 * cos(radius * 8.2 - cycle)) * exp(-radius * 0.32);
  let broad = exp(-pow(radius - 1.15 - sin(cycle) * 0.025, 2.0) * 3.0) * 0.12;
  return rings * 0.16 + broad;
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

// A fullscreen triangle is explicit here so vGPU can select any of the fragment entry
// points below. The diagnostic entries exercise the exact same height-field code as the
// shipped image instead of maintaining a parallel debug shader.
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

  // Surface normal from the height field. Three samples is the whole cost of making a
  // flat field look like a lit object.
  let step2 = 0.008;
  let detail = select(cover.shape.y, 1.0, cover.shape.y <= 0.0);
  let sample = point * detail;
  let height = heightAt(sample, cycle, turn, kind, motif, seed);
  let alongX = heightAt(sample + vec2f(step2, 0.0), cycle, turn, kind, motif, seed);
  let alongY = heightAt(sample + vec2f(0.0, step2), cycle, turn, kind, motif, seed);
  let relief = select(0.3, 0.17, kind > 1.5);
  let normal = normalize(vec3f((height - alongX) / step2 * relief, (height - alongY) / step2 * relief, 1.0));

  return SurfaceSample(point, normal, height);
}

// False-colour height view: violet is recessed, cyan is raised. This makes the SDF and
// field silhouettes readable before lighting hides them.
@fragment
fn fs_sdf(@location(0) uv: vec2f) -> @location(0) vec4f {
  let surface = surfaceAt(uv);
  let level = clamp(surface.height * 1.25 + 0.3, 0.0, 1.0);
  let low = vec3f(0.16, 0.06, 0.36);
  let high = vec3f(0.12, 0.86, 0.96);
  return vec4f(mix(low, high, level), 1.0);
}

// Encoded XYZ normals. Abrupt colour seams reveal the hard bevels that made the previous
// bake look metallic; the final design should stay broad and slowly varying here.
@fragment
fn fs_normal(@location(0) uv: vec2f) -> @location(0) vec4f {
  let surface = surfaceAt(uv);
  return vec4f(surface.normal * 0.5 + 0.5, 1.0);
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
  let banner = step(2.5, kind);

  let toLight = normalize(vec3f(-0.5, -0.72, 0.52));
  let halfway = normalize(toLight + vec3f(0.0, 0.0, 1.0));
  let diffuse = max(dot(normal, toLight), 0.0);
  let specular = pow(max(dot(normal, halfway), 0.0), 14.0);
  // Grazing angles catch the light, which is what gives these forms an edge.
  let rim = pow(1.0 - clamp(normal.z, 0.0, 1.0), 3.0);

  let designed = step(1.5, kind);
  let translucentFill = smoothstep(0.025, 0.5, height) * designed;
  var glow = diffuse * 0.1 + specular * 0.045 + rim * 0.055 + translucentFill * 0.055;
  var shade = (1.0 - diffuse) * 0.13 + (1.0 - clamp(height * 1.4 + 0.5, 0.0, 1.0)) * 0.065;

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

  // A broad corner falloff keeps the field dimensional without compression-hostile grain.
  shade += smoothstep(0.7, 1.8, length(point / vec2f(aspect, 1.0))) * 0.11;

  // Fold it into one premultiplied source-over sample: highlight lifts the gradient,
  // shade lowers it. The highlight carries the beam's slight spectral tint.
  let tint = (beam - vec3f(sweep)) * (1.0 + specular * 2.0) * 0.07;
  let highlight = clamp(vec3f(glow) + tint, vec3f(0.0), vec3f(1.0));
  let darkened = clamp(shade, 0.0, 1.0);
  let alpha = 1.0 - (1.0 - darkened) * (1.0 - max(max(highlight.r, highlight.g), highlight.b));

  return vec4f(highlight, alpha);
}
