// 3D simplex noise by Ashima Arts / Stefan Gustavson (MIT licence).
const noise = /* glsl */ `
vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 permute(vec4 x) { return mod289(((x * 34.0) + 10.0) * x); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

float snoise(vec3 v) {
  const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
  vec3 i = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);
  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;
  i = mod289(i);
  vec4 p = permute(permute(permute(
            i.z + vec4(0.0, i1.z, i2.z, 1.0))
          + i.y + vec4(0.0, i1.y, i2.y, 1.0))
          + i.x + vec4(0.0, i1.x, i2.x, 1.0));
  float n_ = 0.142857142857;
  vec3 ns = n_ * D.wyz - D.xzx;
  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);
  vec4 x = x_ * ns.x + ns.yyyy;
  vec4 y = y_ * ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);
  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);
  vec4 s0 = floor(b0) * 2.0 + 1.0;
  vec4 s1 = floor(b1) * 2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));
  vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);
  vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
  p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
  vec4 m = max(0.5 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
  m = m * m;
  return 105.0 * dot(m * m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
}
`;

export const blobVertex = /* glsl */ `
uniform float uTime;
uniform float uAmp;
uniform float uFreq;
uniform vec2 uMouse;

varying vec3 vNormal;
varying vec3 vView;
varying float vNoise;

${noise}

float field(vec3 p) {
  float t = uTime * 0.18;
  float n = snoise(p * uFreq + vec3(t, t * 0.7, -t));
  n += 0.2 * snoise(p * uFreq * 2.1 + vec3(-t, t, t * 0.5));
  // The pointer gently pulls the surface towards it.
  n += 0.35 * dot(normalize(p).xy, uMouse);
  return n;
}

vec3 displace(vec3 p) {
  return p + normalize(p) * field(p) * uAmp;
}

// Tangent basis around the original normal, used to rebuild the bent normal.
vec3 orthogonal(vec3 v) {
  return normalize(abs(v.x) > abs(v.z) ? vec3(-v.y, v.x, 0.0) : vec3(0.0, -v.z, v.y));
}

void main() {
  vec3 p = displace(position);
  float e = 0.01;
  vec3 t = orthogonal(normal);
  vec3 b = normalize(cross(normal, t));
  vec3 pt = displace(position + t * e);
  vec3 pb = displace(position + b * e);
  vec3 n = normalize(cross(pt - p, pb - p));

  vNoise = field(position);
  vNormal = normalize(normalMatrix * n);
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  vView = normalize(-mv.xyz);
  gl_Position = projectionMatrix * mv;
}
`;

export const blobFragment = /* glsl */ `
uniform vec3 uAccent;
uniform float uOpacity;
uniform float uTime;

varying vec3 vNormal;
varying vec3 vView;
varying float vNoise;

// Cosine palette (Inigo Quilez) for a soft oil-slick shimmer.
vec3 palette(float t) {
  vec3 a = vec3(0.5);
  vec3 b = vec3(0.5);
  vec3 c = vec3(1.0);
  vec3 d = vec3(0.10, 0.33, 0.67);
  return a + b * cos(6.28318 * (c * t + d));
}

void main() {
  vec3 n = normalize(vNormal);
  float facing = clamp(dot(n, vView), 0.0, 1.0);
  float fresnel = pow(1.0 - facing, 2.4);

  vec3 base = vec3(0.035, 0.035, 0.05);
  vec3 sheen = palette(vNoise * 0.35 + fresnel * 0.6 + uTime * 0.03) * 0.22;

  vec3 lightDir = normalize(vec3(-0.6, 0.8, 0.6));
  vec3 halfV = normalize(lightDir + vView);
  float spec = pow(max(dot(n, halfV), 0.0), 60.0);

  vec3 color = base + sheen * (0.4 + fresnel);
  color += uAccent * fresnel * 0.9;
  color += vec3(spec) * 0.6;
  // Thin bright bands where the surface folds.
  color += uAccent * smoothstep(0.92, 1.0, sin(vNoise * 9.0) * 0.5 + 0.5) * 0.12;

  gl_FragColor = vec4(color, uOpacity);
}
`;

export const pointsVertex = /* glsl */ `
uniform float uTime;
uniform float uPixelRatio;
attribute float aSize;
attribute float aSeed;
varying float vSeed;

void main() {
  vec3 p = position;
  p.y += sin(uTime * 0.3 + aSeed * 6.28) * 0.06;
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_PointSize = aSize * uPixelRatio * (6.0 / -mv.z);
  vSeed = aSeed;
  gl_Position = projectionMatrix * mv;
}
`;

export const pointsFragment = /* glsl */ `
uniform vec3 uAccent;
uniform float uOpacity;
uniform float uTime;
varying float vSeed;

void main() {
  float d = length(gl_PointCoord - 0.5);
  float alpha = smoothstep(0.5, 0.0, d);
  float twinkle = 0.55 + 0.45 * sin(uTime * 1.2 + vSeed * 40.0);
  vec3 color = mix(vec3(0.75), uAccent, step(0.88, vSeed));
  gl_FragColor = vec4(color, alpha * twinkle * uOpacity * 0.7);
}
`;
