// Cover artwork, drawn as a luminance overlay on top of the element's own CSS gradient.
// The canvas is premultiplied-alpha, so the shader never needs the item's colours: it
// emits only light and shade, and the browser composites that over whatever `coverColor`
// paints. Covers match the theme -- opacity modifiers and dark mode included -- by
// construction, and one baked asset can serve every item sharing a motif.
//
// Each motif is a height field, not a drawing. One shared light shades all of them, which
// is what makes eight abstract compositions read as one series rather than eight icons.
// The title picks the field, so the artwork is still about the song.
import { fbmSimplex2d } from "@vgpu/wgsl-std/noise/simplex";

struct Cover {
  seed: vec4f,
  // x: loop position 0..1, y: kind (0 square, 3 banner), z: motif,
  // w: point units per CSS pixel
  params: vec4f,
  // x: aspect ratio (width / height)
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

// Noise sampled along a closed circular path, so an animated field returns to its start
// at the end of the loop. Walking a straight line through the field would never close.
fn flowNoise(position: vec2f, cycle: f32, amount: f32) -> f32 {
  return fbmSimplex2d(position + vec2f(cos(cycle), sin(cycle)) * amount, 3, 2.17, 0.5);
}

fn sphereHeight(point: vec2f, center: vec2f, radius: f32) -> f32 {
  let offset = point - center;
  return sqrt(max(radius * radius - dot(offset, offset), 0.0));
}

/** Concentric liquid swells. */
fn swell(point: vec2f, cycle: f32) -> f32 {
  let radius = length(point);
  return sin(radius * 7.0 - cycle) * exp(-radius * 1.1) * 0.42;
}

/** The limb of a large body low in the frame, lit from behind. */
fn limb(point: vec2f, cycle: f32) -> f32 {
  return sphereHeight(point, vec2f(sin(cycle) * 0.06, 1.18), 1.5) * 0.5;
}

/** Folded satin: noise warped by noise. */
fn satin(point: vec2f, cycle: f32) -> f32 {
  let warp = vec2f(
    flowNoise(point * 1.1 + vec2f(3.1, 0.0), cycle, 0.42),
    flowNoise(point * 1.1 + vec2f(0.0, 5.7), cycle, 0.42),
  );
  return flowNoise(point * 1.6 + warp * 0.7, cycle, 0.28) * 0.5;
}

/** A grid of translucent panels, each breathing on its own offset. */
fn panels(point: vec2f, cycle: f32) -> f32 {
  let cells = 4.0;
  let cell = point * cells * 0.5;
  let local = fract(cell) - 0.5;
  let plate = 1.0 - smoothstep(0.26, 0.5, max(abs(local.x), abs(local.y)));
  let lift = 0.4 + 0.6 * (0.5 + 0.5 * sin(cycle + hash21(floor(cell)) * TAU));
  return plate * lift * 0.34;
}

/** Stacked strata, each plate drifting over the one beneath it. */
fn strata(point: vec2f, cycle: f32) -> f32 {
  var height = 0.0;
  for (var layer = 0.0; layer < 5.0; layer += 1.0) {
    let crest = -0.72 + layer * 0.34 + sin(point.x * 2.2 + layer * 1.3 + cycle) * 0.11;
    height += smoothstep(0.03, -0.03, point.y - crest) * 0.13;
  }
  return height;
}

/** A cluster of translucent spheres. */
fn cluster(point: vec2f, cycle: f32, seed: f32) -> f32 {
  var height = 0.0;
  for (var index = 0.0; index < 6.0; index += 1.0) {
    let angle = index * 1.7 + seed * TAU;
    let drift = vec2f(cos(cycle + angle), sin(cycle + angle)) * 0.05;
    let center = vec2f(cos(angle), sin(angle * 1.3)) * (0.22 + index * 0.09) + drift;
    height = max(height, sphereHeight(point, center, 0.34 + hash21(vec2f(index, 2.0)) * 0.16));
  }
  return height * 0.62;
}

/** A receding tunnel of nested frames. */
fn tunnel(point: vec2f, turn: f32) -> f32 {
  let square = rotate(point, 0.22);
  let extent = max(abs(square.x), abs(square.y));
  let steps = fract(-log(max(extent, 0.02)) * 1.6 + turn);
  return steps * 0.2 + (1.0 - smoothstep(0.0, 1.0, extent)) * 0.24;
}

/** Long smooth dunes. */
fn dunes(point: vec2f, cycle: f32) -> f32 {
  let warp = flowNoise(point * 0.8, cycle, 0.32);
  return flowNoise(point + vec2f(warp * 0.6, 0.0), cycle, 0.22) * 0.42 + point.y * 0.12;
}

fn heightAt(point: vec2f, cycle: f32, turn: f32, motif: f32, seed: f32) -> f32 {
  if (motif < 0.5) { return swell(point, cycle); }
  if (motif < 1.5) { return limb(point, cycle); }
  if (motif < 2.5) { return satin(point, cycle); }
  if (motif < 3.5) { return panels(point, cycle); }
  if (motif < 4.5) { return strata(point, cycle); }
  if (motif < 5.5) { return cluster(point, cycle, seed); }
  if (motif < 6.5) { return tunnel(point, turn); }
  return dunes(point, cycle);
}

@fragment
fn fs_main(@location(0) uv: vec2f) -> @location(0) vec4f {
  let aspect = max(cover.shape.x, 0.0001);
  // Isotropic space: y spans -1..1, x widens with the aspect so nothing stretches.
  let point = (uv * 2.0 - 1.0) * vec2f(aspect, 1.0);
  let seed = cover.seed;
  // Every motion is an integer harmonic of `cycle`, so the artwork returns to its
  // starting state at turn = 1 and can be baked into a looping WebP.
  let turn = fract(cover.params.x);
  let cycle = turn * TAU;
  let motif = cover.params.z;
  let banner = step(2.5, cover.params.y);

  // Surface normal from the height field. Three samples is the whole cost of making a
  // flat field look like a lit object.
  let step2 = 0.008;
  let height = heightAt(point, cycle, turn, motif, seed.y);
  let alongX = heightAt(point + vec2f(step2, 0.0), cycle, turn, motif, seed.y);
  let alongY = heightAt(point + vec2f(0.0, step2), cycle, turn, motif, seed.y);
  let normal = normalize(vec3f((height - alongX) / step2, (height - alongY) / step2, 1.0));

  let toLight = normalize(vec3f(-0.5, -0.72, 0.52));
  let halfway = normalize(toLight + vec3f(0.0, 0.0, 1.0));
  let diffuse = max(dot(normal, toLight), 0.0);
  let specular = pow(max(dot(normal, halfway), 0.0), 30.0);
  // Grazing angles catch the light, which is what gives these forms an edge.
  let rim = pow(1.0 - clamp(normal.z, 0.0, 1.0), 3.0);

  var glow = diffuse * 0.16 + specular * 0.34 + rim * 0.12;
  var shade = (1.0 - diffuse) * 0.14 + (1.0 - clamp(height * 1.4 + 0.5, 0.0, 1.0)) * 0.08;

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
  glow += sweep * (0.05 + specular * 0.5);

  // Banners carry a label at the lower left, so that corner gets a scrim.
  shade += banner * smoothstep(0.0, 1.0, point.y) * smoothstep(0.35, -0.5, point.x / aspect) * 0.18;

  // Corner falloff, plus grain fixed by position so nothing shimmers frame to frame.
  shade += smoothstep(0.7, 1.8, length(point / vec2f(aspect, 1.0))) * 0.14;
  let grain = (hash21(floor(uv * vec2f(300.0 * aspect, 300.0)) + seed.xy * 97.0) - 0.5) * 0.04;
  glow += max(grain, 0.0);
  shade += max(-grain, 0.0);

  // Fold it into one premultiplied source-over sample: highlight lifts the gradient,
  // shade lowers it. The highlight carries the beam's slight spectral tint.
  let tint = (beam - vec3f(sweep)) * (1.0 + specular * 3.0) * 0.08;
  let highlight = clamp(vec3f(glow) + tint, vec3f(0.0), vec3f(1.0));
  let darkened = clamp(shade, 0.0, 1.0);
  let alpha = 1.0 - (1.0 - darkened) * (1.0 - max(max(highlight.r, highlight.g), highlight.b));

  return vec4f(highlight, alpha);
}
