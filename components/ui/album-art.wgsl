@group(0) @binding(0) var<uniform> seed: vec4f;
@group(0) @binding(1) var<uniform> time: f32;
@group(0) @binding(2) var<uniform> style: vec2f;

const PI = 3.14159265359;
const TAU = 6.28318530718;

fn rotate(point: vec2f, angle: f32) -> vec2f {
  let sine = sin(angle);
  let cosine = cos(angle);
  return vec2f(point.x * cosine - point.y * sine, point.x * sine + point.y * cosine);
}

fn hash21(point: vec2f) -> f32 {
  return fract(sin(dot(point, vec2f(127.1, 311.7))) * 43758.5453);
}

fn hsvToRgb(hue: f32, saturation: f32, value: f32) -> vec3f {
  let channels = clamp(
    abs(fract(hue + vec3f(0.0, 0.6666667, 0.3333333)) * 6.0 - 3.0) - 1.0,
    vec3f(0.0),
    vec3f(1.0),
  );
  return value * mix(vec3f(1.0), channels, saturation);
}

fn softOrb(point: vec2f, center: vec2f, radius: f32) -> f32 {
  return exp(-dot(point - center, point - center) / radius);
}

fn sdBox(point: vec2f, halfSize: vec2f) -> f32 {
  let corner = abs(point) - halfSize;
  return min(max(corner.x, corner.y), 0.0) + length(max(corner, vec2f(0.0)));
}

fn sdSegment(point: vec2f, start: vec2f, end: vec2f) -> f32 {
  let position = point - start;
  let segment = end - start;
  let projection = clamp(dot(position, segment) / dot(segment, segment), 0.0, 1.0);
  return length(position - segment * projection);
}

fn acesToneMap(color: vec3f) -> vec3f {
  let a = 2.51;
  let b = 0.03;
  let c = 2.43;
  let d = 0.59;
  let e = 0.14;
  return clamp((color * (a * color + b)) / (color * (c * color + d) + e), vec3f(0.0), vec3f(1.0));
}

fn linearToSrgb(color: vec3f) -> vec3f {
  let low = color * 12.92;
  let high = 1.055 * pow(color, vec3f(1.0 / 2.4)) - 0.055;
  return select(high, low, color <= vec3f(0.0031308));
}

@fragment
fn fs_main(@location(0) uv: vec2f) -> @location(0) vec4f {
  let point = uv * 2.0 - 1.0;
  let phase = time * (0.2 + seed.y * 0.1) + seed.z * TAU;

  var hue = 0.58 + (seed.x - 0.5) * 0.12;
  if (style.x > 0.5 && style.x < 1.5) {
    hue = 0.075 + (seed.x - 0.5) * 0.08;
  } else if (style.x > 1.5) {
    hue = 0.79 + (seed.x - 0.5) * 0.12;
  }

  let colorA = hsvToRgb(fract(hue), 0.72, 0.92);
  let colorB = hsvToRgb(fract(hue + 0.085), 0.64, 0.82);
  let highlight = hsvToRgb(fract(hue - 0.035), 0.28, 1.0);

  let driftA = vec2f(cos(phase * 0.41), sin(phase * 0.35)) * 0.14;
  let driftB = vec2f(sin(phase * 0.31), cos(phase * 0.38)) * 0.16;
  var color = vec3f(0.005, 0.006, 0.014);
  color += colorA * softOrb(point, vec2f(-0.5, -0.42) + driftA, 0.46) * 0.28;
  color += colorB * softOrb(point, vec2f(0.48, 0.36) + driftB, 0.4) * 0.25;
  color += mix(colorA, colorB, 0.5) * softOrb(point, vec2f(0.0), 0.9) * 0.075;

  var motif = style.y;
  if (style.x > 0.5 && style.x < 1.5) {
    motif = 6.0;
  } else if (style.x > 1.5) {
    motif = 7.0;
  }

  var core = 0.0;
  var glow = 0.0;
  var fill = 0.0;

  if (motif < 1.0) {
    let waterPoint = point - vec2f(0.0, 0.08);
    let radius = length(waterPoint * vec2f(1.0, 1.18));
    let ripple = sin(phase * 1.3) * 0.018;
    let ringA = abs(radius - (0.22 + ripple));
    let ringB = abs(radius - (0.4 - ripple * 0.55));
    let ringC = abs(radius - (0.58 + ripple * 0.3));
    core = exp(-ringA * 115.0) + exp(-ringB * 105.0) * 0.72 + exp(-ringC * 95.0) * 0.42;
    glow = exp(-ringA * 18.0) + exp(-ringB * 15.0) * 0.58 + exp(-ringC * 13.0) * 0.3;
    let drop = length(point - vec2f(0.0, -0.42 + sin(phase) * 0.035));
    core += exp(-drop * 65.0) * 0.8;
  } else if (motif < 2.0) {
    let heartPoint = point * 1.55 + vec2f(0.0, 0.08);
    let heartBase = heartPoint.x * heartPoint.x + heartPoint.y * heartPoint.y - 0.72;
    let heart = heartBase * heartBase * heartBase - heartPoint.x * heartPoint.x * heartPoint.y * heartPoint.y * heartPoint.y;
    let heartbeat = 1.0 + sin(phase * 2.4) * 0.045;
    core = exp(-abs(heart) * 44.0 / heartbeat);
    glow = exp(-abs(heart) * 7.0) * 0.82;
    fill = select(0.0, 0.15, heart < 0.0);
  } else if (motif < 3.0) {
    let gridPoint = (point + vec2f(0.56)) * 5.3;
    let cell = floor(gridPoint);
    let cellUv = abs(fract(gridPoint) - 0.5);
    let gridBounds = select(0.0, 1.0, max(abs(point.x), abs(point.y)) < 0.57);
    let lit = smoothstep(0.36, 0.72, hash21(cell + floor(phase * 0.8)));
    let pixelEdge = 1.0 - smoothstep(0.34, 0.45, max(cellUv.x, cellUv.y));
    fill = pixelEdge * gridBounds * (0.08 + lit * 0.28);
    core = pixelEdge * gridBounds * lit * 0.78;
    glow = pixelEdge * gridBounds * (0.16 + lit * 0.34);
  } else if (motif < 4.0) {
    let orbitA = abs(length(vec2f(point.x, point.y * 2.35)) - 0.42);
    let orbitBPoint = rotate(point, PI / 3.0);
    let orbitB = abs(length(vec2f(orbitBPoint.x, orbitBPoint.y * 2.35)) - 0.42);
    let orbitCPoint = rotate(point, -PI / 3.0);
    let orbitC = abs(length(vec2f(orbitCPoint.x, orbitCPoint.y * 2.35)) - 0.42);
    let atom = length(point);
    let electron = length(point - vec2f(cos(phase * 1.7), sin(phase * 1.7) / 2.35) * 0.42);
    core = exp(-orbitA * 105.0) + exp(-orbitB * 105.0) + exp(-orbitC * 105.0);
    core = core * 0.55 + exp(-atom * 55.0) + exp(-electron * 70.0);
    glow = exp(-min(orbitA, min(orbitB, orbitC)) * 15.0) * 0.72 + exp(-atom * 10.0);
  } else if (motif < 5.0) {
    let horizon = abs(point.y - 0.3);
    let sunCenter = vec2f(sin(phase * 0.45) * 0.06, 0.08 + cos(phase * 0.4) * 0.025);
    let sun = abs(length(point - sunCenter) - 0.29);
    let trail = sdSegment(point, vec2f(-0.6, 0.5), vec2f(0.46, -0.44));
    core = exp(-horizon * 110.0) * 0.62 + exp(-sun * 105.0) + exp(-trail * 100.0) * 0.48;
    glow = exp(-sun * 15.0) + exp(-trail * 14.0) * 0.34;
    fill = select(0.0, 0.11, length(point - sunCenter) < 0.29);
  } else if (motif < 6.0) {
    let waveA = abs(point.y + 0.28 - sin(point.x * 5.0 + phase) * 0.05);
    let waveB = abs(point.y + 0.09 - sin(point.x * 5.4 + phase * 0.92 + 0.8) * 0.06);
    let waveC = abs(point.y - 0.11 - sin(point.x * 5.8 + phase * 0.84 + 1.6) * 0.07);
    let waveD = abs(point.y - 0.32 - sin(point.x * 6.2 + phase * 0.76 + 2.4) * 0.08);
    let nearestWave = min(min(waveA, waveB), min(waveC, waveD));
    core = exp(-nearestWave * 108.0);
    glow = exp(-nearestWave * 16.0) * 0.9;
  } else if (motif < 7.0) {
    let discPoint = point * 1.08;
    let radius = length(discPoint);
    let outer = abs(radius - 0.58);
    let grooveA = abs(radius - 0.44);
    let grooveB = abs(radius - 0.34);
    let labelRing = abs(radius - 0.18);
    let specular = pow(max(dot(normalize(discPoint + vec2f(0.0001)), normalize(vec2f(cos(phase), sin(phase)))), 0.0), 22.0);
    core = exp(-outer * 110.0) + exp(-labelRing * 100.0) * 0.72;
    core += (exp(-grooveA * 150.0) + exp(-grooveB * 150.0)) * 0.22;
    glow = exp(-outer * 16.0) * 0.7 + specular * select(0.0, 0.7, radius < 0.58);
    fill = select(0.0, 0.13, radius < 0.58);
  } else {
    let back = abs(sdBox(rotate(point + vec2f(0.17, -0.08), -0.13), vec2f(0.4)));
    let middle = abs(sdBox(rotate(point + vec2f(0.08, -0.03), -0.055), vec2f(0.4)));
    let front = abs(sdBox(point, vec2f(0.4)));
    let stackEdge = min(back, min(middle, front));
    let playlistWave = abs(point.y - sin(point.x * 7.0 + phase) * 0.07);
    core = exp(-stackEdge * 105.0) * 0.72 + exp(-playlistWave * 95.0) * select(0.0, 0.85, max(abs(point.x), abs(point.y)) < 0.34);
    glow = exp(-stackEdge * 15.0) * 0.65 + exp(-playlistWave * 16.0) * 0.28;
    fill = select(0.0, 0.08, max(abs(point.x), abs(point.y)) < 0.4);
  }

  let shimmer = 0.72 + 0.28 * sin((point.x - point.y) * 6.0 + phase * 1.4);
  color += mix(colorA, colorB, uv.x) * glow * (0.28 + shimmer * 0.1);
  color += colorA * fill;
  color += mix(highlight, vec3f(1.0), 0.58) * core * (0.72 + shimmer * 0.42);

  let coverFrame = abs(max(abs(point.x), abs(point.y)) - 0.86);
  let frameLine = exp(-coverFrame * 130.0);
  color += mix(colorA, highlight, 0.45) * frameLine * 0.16;

  let sweepPosition = fract(time * 0.026 + seed.y) * 2.8 - 1.4;
  let sweep = exp(-abs(point.x + point.y * 0.32 - sweepPosition) * 27.0);
  color += highlight * sweep * (0.018 + glow * 0.045);

  let vignette = 1.0 - smoothstep(0.3, 1.4, length(point));
  let grain = hash21(floor(uv * 420.0) + seed.xy * 103.0 + floor(time * 4.0)) - 0.5;
  color = color * (0.68 + 0.32 * vignette) + grain * 0.011;

  return vec4f(linearToSrgb(acesToneMap(max(color, vec3f(0.0)))), 1.0);
}
