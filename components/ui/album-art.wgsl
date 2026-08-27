@group(0) @binding(0) var<uniform> seed: vec4f;

fn hash21(point: vec2f) -> f32 {
  return fract(sin(dot(point, vec2f(127.1, 311.7))) * 43758.5453);
}

fn palette(value: f32) -> vec3f {
  let phase = vec3f(seed.x, seed.y, seed.z);
  return 0.5 + 0.5 * cos(6.2831853 * (value + phase));
}

@fragment
fn fs_main(@location(0) uv: vec2f) -> @location(0) vec4f {
  let point = uv * 2.0 - 1.0;
  let angle = seed.w * 6.2831853;
  let sine = sin(angle);
  let cosine = cos(angle);
  let rotated = vec2f(
    point.x * cosine - point.y * sine,
    point.x * sine + point.y * cosine,
  );

  let frequency = 2.0 + floor(seed.y * 5.0);
  let wave = sin((rotated.x + 0.18 * sin(rotated.y * 5.0 + seed.z * 8.0)) * frequency * 3.1415927);
  let center = vec2f(seed.x - 0.5, seed.z - 0.5) * 0.9;
  let radius = distance(point, center);
  let ringRadius = 0.3 + seed.w * 0.45;
  let ring = 1.0 - smoothstep(0.035, 0.08, abs(radius - ringRadius));
  let secondCenter = vec2f(0.55 - seed.y, seed.w - 0.45);
  let disc = 1.0 - smoothstep(0.22, 0.48, distance(point, secondCenter));
  let ribbon = 1.0 - smoothstep(
    0.055,
    0.13,
    abs(rotated.y - 0.28 * sin(rotated.x * (2.0 + seed.x * 4.0) + seed.z * 6.2831853))
  );

  let colorA = palette(seed.x + uv.y * 0.12);
  let colorB = palette(seed.z + 0.38);
  let colorC = palette(seed.w + 0.72);
  var color = mix(colorA * 0.58, colorB, smoothstep(-0.5, 0.65, wave));
  color = mix(color, colorC, disc * 0.78);
  color = mix(color, colorA + vec3f(0.22), ring * 0.88);
  color = mix(color, vec3f(0.025, 0.035, 0.08), ribbon * 0.78);

  let vignette = smoothstep(1.35, 0.2, length(point));
  let grain = hash21(floor(uv * 420.0) + seed.xy * 97.0) - 0.5;
  color = color * (0.68 + 0.32 * vignette) + grain * 0.045;

  return vec4f(clamp(color, vec3f(0.0), vec3f(1.0)), 1.0);
}
