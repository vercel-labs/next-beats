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

  let frequency = 3.0 + floor(seed.y * 6.0);
  let wave = sin((rotated.x + 0.22 * sin(rotated.y * 4.0 + seed.z * 8.0)) * frequency * 3.1415927);
  let center = vec2f(seed.x - 0.5, seed.z - 0.5) * 0.9;
  let radius = distance(point, center);
  let ringRadius = 0.28 + seed.w * 0.42;
  let ring = 1.0 - smoothstep(0.025, 0.12, abs(radius - ringRadius));
  let glow = exp(-3.2 * distance(point, -center * 0.65));

  let colorA = palette(seed.x + wave * 0.08);
  let colorB = palette(seed.z + 0.34 + radius * 0.12);
  var color = mix(colorA, colorB, smoothstep(-0.75, 0.75, wave));
  color += ring * palette(seed.y + 0.65) * 0.24;
  color += glow * palette(seed.w + 0.18) * 0.2;

  let vignette = smoothstep(1.35, 0.2, length(point));
  let grain = hash21(floor(uv * 420.0) + seed.xy * 97.0) - 0.5;
  color = color * (0.72 + 0.28 * vignette) + grain * 0.035;

  return vec4f(clamp(color, vec3f(0.0), vec3f(1.0)), 1.0);
}
