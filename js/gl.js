// Pixel-art 3D renderer (WebGL2).
// The scene is drawn with an orthographic isometric camera into a small render target
// (one texel = one art pixel), materials are painted procedurally in world space
// (tiles, brick, rust, grime, cracks), lighting is banded with ordered dither, then an
// edge pass adds outlines and the result is scaled up with nearest filtering.
(function () {
  // ---------------- math ----------------
  const M4 = {
    ident() { return new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]); },
    mul(a, b) {
      const o = new Float32Array(16);
      for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) {
        let s = 0; for (let k = 0; k < 4; k++) s += a[k * 4 + j] * b[i * 4 + k];
        o[i * 4 + j] = s;
      }
      return o;
    },
    ortho(l, r, b, t, n, f) {
      const o = M4.ident();
      o[0] = 2 / (r - l); o[5] = 2 / (t - b); o[10] = -2 / (f - n);
      o[12] = -(r + l) / (r - l); o[13] = -(t + b) / (t - b); o[14] = -(f + n) / (f - n);
      return o;
    },
    lookAt(e, c, up) {
      let zx = e[0] - c[0], zy = e[1] - c[1], zz = e[2] - c[2];
      let l = Math.hypot(zx, zy, zz); zx /= l; zy /= l; zz /= l;
      let xx = up[1] * zz - up[2] * zy, xy = up[2] * zx - up[0] * zz, xz = up[0] * zy - up[1] * zx;
      l = Math.hypot(xx, xy, xz); xx /= l; xy /= l; xz /= l;
      const yx = zy * xz - zz * xy, yy = zz * xx - zx * xz, yz = zx * xy - zy * xx;
      return new Float32Array([xx, yx, zx, 0, xy, yy, zy, 0, xz, yz, zz, 0,
        -(xx * e[0] + xy * e[1] + xz * e[2]), -(yx * e[0] + yy * e[1] + yz * e[2]), -(zx * e[0] + zy * e[1] + zz * e[2]), 1]);
    },
    // translate * rotY * rotX * rotZ * scale
    trs(x, y, z, ry = 0, s = 1, rx = 0, rz = 0) {
      const cy = Math.cos(ry), sy = Math.sin(ry), cx = Math.cos(rx), sx = Math.sin(rx), cz = Math.cos(rz), sz = Math.sin(rz);
      const r00 = cy * cz + sy * sx * sz, r01 = -cy * sz + sy * sx * cz, r02 = sy * cx;
      const r10 = cx * sz, r11 = cx * cz, r12 = -sx;
      const r20 = -sy * cz + cy * sx * sz, r21 = sy * sz + cy * sx * cz, r22 = cy * cx;
      return new Float32Array([r00 * s, r10 * s, r20 * s, 0, r01 * s, r11 * s, r21 * s, 0, r02 * s, r12 * s, r22 * s, 0, x, y, z, 1]);
    },
    scale3(m, sx, sy, sz) { const o = new Float32Array(m); for (let i = 0; i < 3; i++) { o[i] *= sx; o[4 + i] *= sy; o[8 + i] *= sz; } return o; },
    xform(m, x, y, z) {
      const w = m[3] * x + m[7] * y + m[11] * z + m[15];
      return [(m[0] * x + m[4] * y + m[8] * z + m[12]) / w, (m[1] * x + m[5] * y + m[9] * z + m[13]) / w, (m[2] * x + m[6] * y + m[10] * z + m[14]) / w];
    },
  };

  // ---------------- shaders ----------------
  const NL = 24; // point lights per frame
  const VS = `#version 300 es
layout(location=0) in vec3 aPos; layout(location=1) in vec3 aNor; layout(location=2) in vec3 aCol;
layout(location=3) in float aEmit; layout(location=4) in float aSway; layout(location=5) in float aMat;
uniform mat4 uVP, uModel, uShadowVP; uniform float uTime, uWind;
out vec3 vW; out vec3 vN; out vec3 vC; out float vE; out vec4 vS; flat out float vMat;
void main(){
  vec4 w = uModel * vec4(aPos, 1.0);
  if (aSway > 0.0) {
    w.x += (sin(uTime * 1.7 + w.x * 0.6 + w.z * 0.4) * 0.05 + sin(uTime * 3.3 + w.z) * 0.02) * aSway * uWind;
    w.z += cos(uTime * 1.3 + w.x * 0.5) * 0.035 * aSway * uWind;
  }
  vW = w.xyz; vN = mat3(uModel) * aNor; vC = aCol; vE = aEmit; vS = uShadowVP * w; vMat = aMat;
  gl_Position = uVP * w;
}`;

  const FS = `#version 300 es
precision highp float; precision highp sampler2DShadow;
in vec3 vW; in vec3 vN; in vec3 vC; in float vE; in vec4 vS; flat in float vMat;
uniform vec3 uSunDir, uSunCol, uSky, uGround, uFog, uViewDir, uTint;
uniform float uTime, uFlash, uOpacity, uShadowOn, uWet, uFogAmt, uOutline, uWearMul, uBands, uGlassGlow;
uniform int uNL; uniform vec4 uLP[${NL}]; uniform vec3 uLC[${NL}];
uniform sampler2DShadow uShadow; uniform float uShadowTexel;
layout(location=0) out vec4 o;
layout(location=1) out vec4 oN;
float hash(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float noise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), f.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), f.x), f.y); }
float fbm(vec2 p){ return noise(p) * 0.55 + noise(p * 2.13 + 7.1) * 0.3 + noise(p * 4.7 + 3.3) * 0.15; }
float bayer(vec2 p){ ivec2 q = ivec2(mod(p, 4.0)); int i = q.x + q.y * 4;
  int b[16] = int[16](0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5); return (float(b[i]) + 0.5) / 16.0; }
// crack lines: thin ridges of a warped noise
float cracks(vec2 p, float amount){
  if (amount <= 0.0) return 0.0;
  vec2 q = p + vec2(fbm(p * 0.7), fbm(p * 0.7 + 9.0)) * 1.3;
  float r = abs(noise(q * 1.2) - 0.5);
  float mask = smoothstep(1.0 - amount * 0.9, 1.0 - amount * 0.9 + 0.08, fbm(p * 0.35 + 3.0));
  return step(r, 0.022) * mask;
}
void main(){
  float dith = bayer(gl_FragCoord.xy);
  if (uOpacity < 0.999 && dith > uOpacity) discard;
  vec3 n = normalize(vN);
  float id = floor(vMat + 0.001), wear = clamp(fract(vMat + 0.001) * 1.02 * uWearMul, 0.0, 1.0);
  vec3 base = vC * uTint;
  // surface coordinates: floors use xz, walls use their own plane
  bool flr = abs(n.y) > 0.6;
  vec2 uv = flr ? vW.xz : (abs(n.x) > abs(n.z) ? vec2(vW.z, vW.y) : vec2(vW.x, vW.y));
  float wetK = 0.0, gloss = 0.0;
  if (id == 1.0) { // ceramic tiles (0.5)
    vec2 c = floor(uv * 2.0), f = fract(uv * 2.0);
    float h = hash(c);
    base *= 0.88 + 0.22 * h;
    if (h > 1.0 - wear * 0.06) base *= 0.55;                       // missing tile
    if (f.x < 0.07 || f.y < 0.07) base *= 0.6;                      // grout
    base *= 1.0 - cracks(uv * 1.3, wear) * 0.6;
    base *= mix(1.0, 0.72 + 0.28 * fbm(uv * 0.9), wear);
    wetK = 0.8; gloss = 0.5;
  } else if (id == 2.0 || id == 14.0) { // concrete / asphalt
    float sp = hash(floor(uv * 9.0));
    base *= 0.93 + 0.12 * sp;
    base *= mix(1.0, 0.8 + 0.2 * fbm(uv * 0.6), 0.5 + wear * 0.5);
    base *= 1.0 - cracks(uv, wear) * 0.55;
    if (id == 14.0) { wetK = 1.0; gloss = 0.35; } else { wetK = 0.7; gloss = 0.2; }
  } else if (id == 3.0) { // brick
    float row = floor(uv.y / 0.22);
    vec2 b = vec2(uv.x / 0.46 + mod(row, 2.0) * 0.5, uv.y / 0.22);
    vec2 f = fract(b), c = floor(b);
    base *= 0.84 + 0.26 * hash(c);
    if (f.x < 0.07 || f.y < 0.12) base = mix(base, vec3(0.42, 0.4, 0.38) * (vC.r + vC.g + vC.b) * 0.5, 0.8);
    base *= mix(1.0, 0.65 + 0.35 * smoothstep(0.0, 1.1, vW.y + fbm(uv * 1.5) * 0.6), wear);
  } else if (id == 4.0) { // wood planks
    float pl = floor((flr ? uv.x : uv.y) / 0.26);
    float along = flr ? uv.y : uv.x;
    float seam = fract((flr ? uv.x : uv.y) / 0.26);
    base *= 0.86 + 0.2 * hash(vec2(pl, floor(along / 1.7 + hash(vec2(pl, 3.0)))));
    base *= 0.93 + 0.1 * noise(vec2(along * 3.0, pl * 5.0));
    if (seam < 0.1) base *= 0.62;
    base *= mix(1.0, 0.75 + 0.25 * fbm(uv * 1.2), wear);
    gloss = 0.25;
  } else if (id == 5.0) { // metal, corrugated with rust
    base *= 0.92 + 0.12 * step(0.5, fract(uv.x * 4.0));
    float r = fbm(uv * 1.6 + 2.0) + fbm(vec2(uv.x * 7.0, uv.y * 0.6)) * 0.35;
    float rust = smoothstep(0.95 - wear * 0.55, 1.05 - wear * 0.55, r);
    base = mix(base, vec3(0.5, 0.25, 0.12) * (0.8 + 0.4 * hash(floor(uv * 10.0))), rust * 0.85);
    gloss = 0.3 * (1.0 - rust);
  } else if (id == 6.0) { // grass
    base *= 0.85 + 0.25 * fbm(uv * 1.7);
    base *= 0.9 + 0.2 * step(0.85, hash(floor(uv * 12.0)));
  } else if (id == 7.0) { // roof tar & gravel
    base *= 0.85 + 0.3 * hash(floor(uv * 7.0));
    base *= 0.85 + 0.2 * fbm(uv * 0.5);
    wetK = 0.5;
  } else if (id == 8.0) { // glass (lit windows look like plain glass by day)
    if (vE > 0.01) base = mix(vec3(0.16, 0.22, 0.32), base, uGlassGlow);
    float band = smoothstep(0.0, 0.08, abs(fract((uv.x + uv.y * 0.7) * 0.6) - 0.5) - 0.32);
    base = mix(base * 1.35 + 0.05, base, band);
    if (vE * uGlassGlow < 0.05) {
      // broken panes: shards radiating from an impact point
      vec2 pc = floor(uv * 0.8);
      if (hash(pc + 4.0) < (wear - 0.4) * 1.1) { // only run-down buildings have broken panes
        vec2 q = fract(uv * 0.8) - vec2(0.3 + 0.4 * hash(pc), 0.3 + 0.4 * hash(pc + 1.0));
        float a = atan(q.y, q.x), d = length(q);
        float spoke = abs(fract(a * 1.27 + hash(pc + 2.0)) - 0.5);
        float ring = abs(fract(d * 7.0) - 0.5);
        if (spoke < 0.06 || (ring < 0.06 && spoke < 0.3)) base = vec3(0.85, 0.9, 0.95);
        if (d < 0.12) base *= 0.25;
      }
    }
    gloss = 0.8;
  } else if (id == 9.0) { // water
    // rolling swell + banded highlights, kept blue (never darkened like wet asphalt)
    float w = sin(vW.x * 1.3 + uTime * 0.9) * cos(vW.z * 1.1 - uTime * 0.7) * 0.5 + 0.5;
    float w2 = sin((vW.x + vW.z) * 3.1 + uTime * 1.7) * 0.5 + 0.5;
    base = mix(base * 0.8, base * 1.15 + vec3(0.02, 0.05, 0.09), w * 0.55);
    if (w2 > 0.93 && fract(vW.z * 0.5 + w * 0.3) > 0.5) base += vec3(0.08, 0.12, 0.16);
    if (hash(floor(vW.xz * 10.0) + floor(uTime * 2.0)) > 0.993) base += vec3(0.35);
    wetK = 0.0; gloss = 0.45;
  } else if (id == 10.0) { // sidewalk slabs (1.0)
    vec2 c = floor(uv), f = fract(uv);
    base *= 0.9 + 0.16 * hash(c);
    if (f.x < 0.05 || f.y < 0.05) base *= 0.7;
    base *= 1.0 - cracks(uv * 1.4, wear * 0.8) * 0.5;
    base *= mix(1.0, 0.78 + 0.22 * fbm(uv * 0.8), wear);
    if (hash(c + 7.0) > 0.985 - wear * 0.02) base *= 0.75 + 0.2 * noise(uv * 4.0);  // gum, stains
    wetK = 0.75; gloss = 0.2;
  } else if (id == 11.0) { // painted plaster with stains and peeling paint
    base *= 0.95 + 0.07 * noise(uv * 3.0);
    float drip = fbm(vec2(uv.x * 5.0, uv.y * 0.35 + 2.0));
    base *= mix(1.0, 0.72 + 0.28 * smoothstep(0.25, 0.75, drip), wear * 0.9);
    float peel = fbm(uv * 1.4 + 11.0);
    if (peel > 1.0 - wear * 0.32) {
      float row = floor(uv.y / 0.22); vec2 b = vec2(uv.x / 0.46 + mod(row, 2.0) * 0.5, uv.y / 0.22);
      base = vec3(0.55, 0.3, 0.24) * (0.8 + 0.3 * hash(floor(b)));
      if (fract(b.x) < 0.08 || fract(b.y) < 0.14) base = vec3(0.4, 0.37, 0.35);
    }
    base *= mix(1.0, 0.7 + 0.3 * smoothstep(0.0, 0.9, vW.y), wear);
  } else if (id == 12.0) { // carpet
    vec2 g = fract(uv * 1.0) - 0.5;
    float dmd = step(abs(g.x) + abs(g.y), 0.22);
    base *= 0.9 + 0.12 * dmd + 0.06 * hash(floor(uv * 14.0));
    base *= mix(1.0, 0.75 + 0.25 * fbm(uv), wear);
  } else if (id == 13.0) { // marble
    float v = sin(uv.x * 2.3 + uv.y * 1.1 + fbm(uv * 1.3) * 7.0);
    base *= 0.94 + 0.08 * v;
    base = mix(base, base * 0.7, smoothstep(0.96, 1.0, abs(v)));
    vec2 f = fract(uv);
    if (f.x < 0.03 || f.y < 0.03) base *= 0.85;
    gloss = 0.9; wetK = 0.0;
  } else if (id == 15.0) { // neon tubes / signs: never shaded
  }
  // puddles on wet ground
  float puddle = 0.0;
  if (flr && uWet > 0.0 && wetK > 0.0) {
    puddle = smoothstep(0.62, 0.66, fbm(vW.xz * 0.35 + 5.0)) * wetK;
    base *= mix(1.0, 0.72, uWet * wetK);
    base = mix(base, base * 0.6, puddle * uWet);
    gloss = max(gloss, uWet * wetK * 0.7 + puddle * uWet * 0.3);
  }
  // ---- lighting ----
  float hemi = n.y * 0.5 + 0.5;
  vec3 amb = mix(uGround, uSky, hemi);
  float nd = max(dot(n, -uSunDir), 0.0);
  nd = smoothstep(0.0, 0.35, nd);
  float sh = 1.0;
  if (uShadowOn > 0.5) {
    vec3 sc = vS.xyz / vS.w * 0.5 + 0.5;
    if (sc.x > 0.0 && sc.x < 1.0 && sc.y > 0.0 && sc.y < 1.0 && sc.z < 1.0)
      sh = texture(uShadow, vec3(sc.xy, sc.z - 0.002));
  }
  vec3 light = amb + uSunCol * nd * sh;
  vec3 pl = vec3(0.0);
  vec3 spec = vec3(0.0);
  vec3 V = -uViewDir;
  for (int i = 0; i < ${NL}; i++) {
    if (i >= uNL) break;
    vec3 d = uLP[i].xyz - vW; float dist = length(d); vec3 L = d / max(dist, 0.001);
    float att = clamp(1.0 - dist / uLP[i].w, 0.0, 1.0); att *= att;
    // banded falloff with ordered dither: hand-painted light pools
    float q = floor(att * uBands + 0.5 + (dith - 0.5) * 0.55) / uBands;
    float l = max(dot(n, L), 0.0) * 0.7 + 0.3;
    pl += uLC[i] * q * l;
    if (gloss > 0.0) {
      // small, tinted glints on wet ground instead of big white blobs
      vec3 H = normalize(L + V);
      float s = pow(max(dot(n, H), 0.0), 22.0 + gloss * 40.0);
      float ra = clamp(1.0 - dist / (uLP[i].w * 1.5), 0.0, 1.0);
      vec3 tint = uLC[i] / max(max(uLC[i].r, max(uLC[i].g, uLC[i].b)), 0.001);
      tint = mix(tint, tint * tint, 0.5); // keep the warm lamp colour in the reflection
      spec += tint * step(0.38 - dith * 0.25, s * ra * gloss * 1.6) * 0.3 * gloss * min(1.2, max(uLC[i].r, max(uLC[i].g, uLC[i].b)));
    }
  }
  // overlapping lamps add up softly instead of blowing out to white
  light += 1.15 * (vec3(1.0) - exp(-pl / 1.15));
  spec = min(spec, vec3(0.38));
  float em = id == 8.0 ? vE * uGlassGlow : vE;
  vec3 col = base * light + spec + base * em * 1.7;
  if (id == 15.0) col = base * (0.6 + vE);
  // soft highlight shoulder
  vec3 hi = max(col - 0.75, 0.0);
  col = min(col, 0.75) + 0.3 * (1.0 - exp(-hi / 0.3));
  col = mix(col, vec3(1.0), uFlash);
  col = mix(col, uFog, uFogAmt * smoothstep(0.0, 1.0, gl_FragCoord.z));
  o = vec4(col, 1.0);
  oN = vec4(n * 0.5 + 0.5, uOutline);
}`;

  const VS_DEPTH = `#version 300 es
layout(location=0) in vec3 aPos; layout(location=4) in float aSway;
uniform mat4 uVP, uModel; uniform float uTime, uWind;
void main(){ vec4 w = uModel * vec4(aPos, 1.0);
  if (aSway > 0.0) { w.x += sin(uTime * 1.7 + w.x * 0.6 + w.z * 0.4) * 0.05 * aSway * uWind; }
  gl_Position = uVP * w; }`;
  const FS_DEPTH = `#version 300 es
precision mediump float; out vec4 o; void main(){ o = vec4(1.0); }`;

  // particles: square pixels
  const VS_PART = `#version 300 es
layout(location=0) in vec3 aPos; layout(location=1) in vec4 aCol; layout(location=2) in float aSize;
uniform mat4 uVP; out vec4 vC;
void main(){ gl_Position = uVP * vec4(aPos, 1.0); gl_PointSize = max(1.0, floor(aSize + 0.5)); vC = aCol; }`;
  const FS_PART = `#version 300 es
precision mediump float; in vec4 vC; layout(location=0) out vec4 o; layout(location=1) out vec4 oN;
void main(){ o = vec4(vC.rgb, vC.a); oN = vec4(0.5, 1.0, 0.5, 0.0); }`;
  // rain streaks
  const VS_LINE = `#version 300 es
layout(location=0) in vec3 aPos; layout(location=1) in vec4 aCol;
uniform mat4 uVP; out vec4 vC;
void main(){ gl_Position = uVP * vec4(aPos, 1.0); vC = aCol; }`;

  const VS_QUAD = `#version 300 es
layout(location=0) in vec2 aP; out vec2 vU; void main(){ vU = aP * 0.5 + 0.5; gl_Position = vec4(aP, 0.0, 1.0); }`;
  // edge pass: depth outlines + normal-crease highlights, at art resolution
  const FS_EDGE = `#version 300 es
precision highp float; in vec2 vU; uniform sampler2D uC, uN, uD; uniform float uRange, uDepthTh, uOutlineK, uHiK; out vec4 o;
void main(){
  ivec2 p = ivec2(gl_FragCoord.xy);
  vec3 c = texelFetch(uC, p, 0).rgb;
  vec4 nn = texelFetch(uN, p, 0);
  float d0 = texelFetch(uD, p, 0).r * uRange;
  vec3 n0 = nn.xyz * 2.0 - 1.0;
  float edge = 0.0, crease = 0.0;
  ivec2 off[4] = ivec2[4](ivec2(1, 0), ivec2(-1, 0), ivec2(0, 1), ivec2(0, -1));
  for (int i = 0; i < 4; i++) {
    ivec2 q = p + off[i];
    float d = texelFetch(uD, q, 0).r * uRange;
    vec4 m = texelFetch(uN, q, 0);
    if (d - d0 > uDepthTh) edge = max(edge, max(nn.a, 0.0));
    else if (abs(d - d0) < uDepthTh) {
      vec3 n1 = m.xyz * 2.0 - 1.0;
      float nd = 1.0 - dot(n0, n1);
      if (nd > 0.25 && dot(n0 - n1, vec3(-0.3, 1.0, 0.25)) > 0.0 && d >= d0 - 0.001) crease = max(crease, nn.a);
    }
  }
  if (edge > 0.0) c = c * uOutlineK;
  else if (crease > 0.0) c = c * (1.0 + uHiK) + vec3(0.02);
  o = vec4(c, 1.0);
}`;
  const FS_BRIGHT = `#version 300 es
precision mediump float; in vec2 vU; uniform sampler2D uT; uniform float uTh; out vec4 o;
void main(){ vec3 c = texture(uT, vU).rgb; float l = max(c.r, max(c.g, c.b)); o = vec4(c * smoothstep(uTh, uTh + 0.25, l), 1.0); }`;
  const FS_BLUR = `#version 300 es
precision mediump float; in vec2 vU; uniform sampler2D uT; uniform vec2 uDir; out vec4 o;
void main(){ vec3 c = texture(uT, vU).rgb * 0.227;
  c += texture(uT, vU + uDir * 1.385).rgb * 0.316; c += texture(uT, vU - uDir * 1.385).rgb * 0.316;
  c += texture(uT, vU + uDir * 3.23).rgb * 0.07; c += texture(uT, vU - uDir * 3.23).rgb * 0.07;
  o = vec4(c, 1.0); }`;
  // final: nearest upscale with sub-pixel camera offset, bloom, grade, quantise with dither
  const FS_POST = `#version 300 es
precision highp float; in vec2 vU; uniform sampler2D uT, uB, uB2; uniform vec2 uLow, uOff; uniform float uScale, uBloom, uVig, uFade, uSat, uLevels; uniform vec3 uGrade, uFadeCol; out vec4 o;
float bayer(vec2 p){ ivec2 q = ivec2(mod(p, 4.0)); int i = q.x + q.y * 4;
  int b[16] = int[16](0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5); return (float(b[i]) + 0.5) / 16.0; }
void main(){
  vec2 lp = gl_FragCoord.xy / uScale + 1.0 + uOff;
  vec2 cell = floor(lp);
  vec3 c = texelFetch(uT, ivec2(cell), 0).rgb;
  vec2 bu = lp / uLow;
  c += (texture(uB, bu).rgb * 0.9 + texture(uB2, bu).rgb * 0.8) * uBloom;
  float l = dot(c, vec3(0.299, 0.587, 0.114));
  c = mix(vec3(l), c, uSat) * uGrade;
  c = c / (1.0 + max(c - 1.0, 0.0) * 0.6);
  vec2 d = vU - 0.5; c *= 1.0 - dot(d, d) * uVig;
  // gentle colour quantisation with ordered dither, aligned to art pixels
  c = floor(c * uLevels + bayer(cell)) / uLevels;
  c = mix(c, uFadeCol, uFade);
  o = vec4(c, 1.0); }`;

  function compile(gl, vs, fs) {
    const mk = (t, s) => { const sh = gl.createShader(t); gl.shaderSource(sh, s); gl.compileShader(sh); if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(sh) + '\n' + s.split('\n').map((l, i) => (i + 1) + ': ' + l).join('\n').slice(0, 300)); return sh; };
    const p = gl.createProgram();
    gl.attachShader(p, mk(gl.VERTEX_SHADER, vs)); gl.attachShader(p, mk(gl.FRAGMENT_SHADER, fs));
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
    const u = {}; const n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS);
    for (let i = 0; i < n; i++) { const info = gl.getActiveUniform(p, i); const name = info.name.replace('[0]', ''); u[name] = gl.getUniformLocation(p, info.name); }
    return { p, u };
  }

  const RANGE = 400, NEAR = 1;
  class Renderer {
    constructor(canvas, opts = {}) {
      const gl = canvas.getContext('webgl2', { antialias: false, alpha: false, depth: false, powerPreference: 'high-performance', preserveDrawingBuffer: !!opts.preserve });
      if (!gl) throw new Error('WebGL2 not available');
      this.gl = gl; this.cv = canvas;
      this.prog = compile(gl, VS, FS);
      this.depthProg = compile(gl, VS_DEPTH, FS_DEPTH);
      this.partProg = compile(gl, VS_PART, FS_PART);
      this.lineProg = compile(gl, VS_LINE, FS_PART);
      this.edgeProg = compile(gl, VS_QUAD, FS_EDGE);
      this.brightProg = compile(gl, VS_QUAD, FS_BRIGHT);
      this.blurProg = compile(gl, VS_QUAD, FS_BLUR);
      this.postProg = compile(gl, VS_QUAD, FS_POST);
      this.quad = gl.createVertexArray(); gl.bindVertexArray(this.quad);
      const qb = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, qb);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
      gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
      gl.bindVertexArray(null);
      this.shadowSize = opts.shadowSize || 2048;
      this.initShadow();
      this.partBuf = gl.createBuffer(); this.partVao = gl.createVertexArray();
      gl.bindVertexArray(this.partVao); gl.bindBuffer(gl.ARRAY_BUFFER, this.partBuf);
      gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 32, 0);
      gl.enableVertexAttribArray(1); gl.vertexAttribPointer(1, 4, gl.FLOAT, false, 32, 12);
      gl.enableVertexAttribArray(2); gl.vertexAttribPointer(2, 1, gl.FLOAT, false, 32, 28);
      this.lineBuf = gl.createBuffer(); this.lineVao = gl.createVertexArray();
      gl.bindVertexArray(this.lineVao); gl.bindBuffer(gl.ARRAY_BUFFER, this.lineBuf);
      gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 28, 0);
      gl.enableVertexAttribArray(1); gl.vertexAttribPointer(1, 4, gl.FLOAT, false, 28, 12);
      gl.bindVertexArray(null);
      this.w = 0; this.h = 0; this.lw = 0; this.lh = 0; this.scale = 1;
      this.env = {
        sunDir: [-0.4, -1, -0.5], sunCol: [1, 0.95, 0.85], sky: [0.55, 0.62, 0.75], ground: [0.32, 0.3, 0.25],
        fog: [0.1, 0.08, 0.15], fogAmt: 0, clear: [0.05, 0.04, 0.08], bloom: 0.6, bloomTh: 0.72, vig: 0.6, sat: 1.1, grade: [1, 1, 1],
        shadow: 1, wet: 0, wind: 1, bands: 6, levels: 40, outlineK: 0.42, hiK: 0.22, depthTh: 0.35, wearMul: 1,
      };
      this.lights = [];
      this.fade = 0; this.fadeCol = [0, 0, 0];
    }
    initShadow() {
      const gl = this.gl, S = this.shadowSize;
      this.shadowTex = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, this.shadowTex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.DEPTH_COMPONENT24, S, S, 0, gl.DEPTH_COMPONENT, gl.UNSIGNED_INT, null);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_COMPARE_MODE, gl.COMPARE_REF_TO_TEXTURE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_COMPARE_FUNC, gl.LEQUAL);
      this.shadowFb = gl.createFramebuffer(); gl.bindFramebuffer(gl.FRAMEBUFFER, this.shadowFb);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, this.shadowTex, 0);
      gl.drawBuffers([gl.NONE]); gl.readBuffer(gl.NONE);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }
    tex(w, h, filter, fmt) {
      const gl = this.gl, t = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t);
      gl.texImage2D(gl.TEXTURE_2D, 0, fmt || gl.RGBA8, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter || gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter || gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      return t;
    }
    target(w, h, filter) {
      const gl = this.gl, t = this.tex(w, h, filter);
      const fb = gl.createFramebuffer(); gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, t, 0);
      return { t, fb, w, h };
    }
    // w,h: device pixels of the canvas; scale: device pixels per art pixel
    resize(w, h, scale) {
      scale = Math.max(1, Math.round(scale));
      if (w === this.w && h === this.h && scale === this.scale) return;
      const gl = this.gl;
      this.w = w; this.h = h; this.cv.width = w; this.cv.height = h; this.scale = scale;
      const lw = Math.ceil(w / scale) + 2, lh = Math.ceil(h / scale) + 2;
      this.lw = lw; this.lh = lh;
      if (this.sceneFb) { /* old targets are left to GC with the context; resizes are rare */ }
      const N = gl.NEAREST;
      this.colT = this.tex(lw, lh, N); this.norT = this.tex(lw, lh, N);
      this.depT = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, this.depT);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.DEPTH_COMPONENT24, lw, lh, 0, gl.DEPTH_COMPONENT, gl.UNSIGNED_INT, null);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, N); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, N);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      this.sceneFb = gl.createFramebuffer(); gl.bindFramebuffer(gl.FRAMEBUFFER, this.sceneFb);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.colT, 0);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT1, gl.TEXTURE_2D, this.norT, 0);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, this.depT, 0);
      gl.drawBuffers([gl.COLOR_ATTACHMENT0, gl.COLOR_ATTACHMENT1]);
      this.edge = this.target(lw, lh, gl.LINEAR);
      const bw = Math.max(1, lw >> 1), bh = Math.max(1, lh >> 1);
      this.b1 = this.target(bw, bh); this.b2 = this.target(bw, bh);
      this.c1 = this.target(Math.max(1, bw >> 1), Math.max(1, bh >> 1)); this.c2 = this.target(Math.max(1, bw >> 1), Math.max(1, bh >> 1));
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }
    upload(data) {
      const gl = this.gl;
      const vao = gl.createVertexArray(); gl.bindVertexArray(vao);
      const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
      const st = 12 * 4;
      gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 3, gl.FLOAT, false, st, 0);
      gl.enableVertexAttribArray(1); gl.vertexAttribPointer(1, 3, gl.FLOAT, false, st, 12);
      gl.enableVertexAttribArray(2); gl.vertexAttribPointer(2, 3, gl.FLOAT, false, st, 24);
      gl.enableVertexAttribArray(3); gl.vertexAttribPointer(3, 1, gl.FLOAT, false, st, 36);
      gl.enableVertexAttribArray(4); gl.vertexAttribPointer(4, 1, gl.FLOAT, false, st, 40);
      gl.enableVertexAttribArray(5); gl.vertexAttribPointer(5, 1, gl.FLOAT, false, st, 44);
      gl.bindVertexArray(null);
      return { vao, buf, count: data.length / 12 };
    }
    free(mesh) { if (!mesh) return; const gl = this.gl; gl.deleteBuffer(mesh.buf); gl.deleteVertexArray(mesh.vao); }

    // isometric camera, snapped to the art-pixel grid. Returns the sub-pixel remainder
    // so the final upscale can scroll smoothly.
    isoCam(target, ppu, yaw = Math.PI / 4, pitch = Math.PI / 6) {
      const cp = Math.cos(pitch), sp = Math.sin(pitch);
      const fwd = [-Math.sin(yaw) * cp, -sp, -Math.cos(yaw) * cp]; // direction the camera looks
      const right = [Math.cos(yaw), 0, -Math.sin(yaw)];
      const up = [fwd[1] * right[2] - fwd[2] * right[1], fwd[2] * right[0] - fwd[0] * right[2], fwd[0] * right[1] - fwd[1] * right[0]].map(v => -v);
      const tx = target[0] * right[0] + target[1] * right[1] + target[2] * right[2];
      const ty = target[0] * up[0] + target[1] * up[1] + target[2] * up[2];
      const sx = Math.round(tx * ppu) / ppu, sy = Math.round(ty * ppu) / ppu;
      const ox = (tx - sx) * ppu, oy = (ty - sy) * ppu;
      const t = [target[0] - right[0] * (tx - sx) - up[0] * (ty - sy), target[1] - right[1] * (tx - sx) - up[1] * (ty - sy), target[2] - right[2] * (tx - sx) - up[2] * (ty - sy)];
      const D = RANGE / 2;
      const eye = [t[0] - fwd[0] * D, t[1] - fwd[1] * D, t[2] - fwd[2] * D];
      const view = M4.lookAt(eye, t, [0, 1, 0]);
      const hw = this.lw / 2 / ppu, hh = this.lh / 2 / ppu;
      const proj = M4.ortho(-hw, hw, -hh, hh, NEAR, RANGE);
      const vp = M4.mul(proj, view);
      return { eye, target: t, real: target, view, proj, vp, fwd, right, up, ppu, off: [ox, oy], hw, hh };
    }
    // world -> CSS pixel position on the canvas
    project(cam, x, y, z, cssW, cssH) {
      const v = M4.xform(cam.vp, x, y, z);
      // NDC covers the low-res target incl. the 1px margin; account for the margin and sub-pixel offset
      const px = (v[0] * 0.5 + 0.5) * this.lw - 1 - cam.off[0], py = (v[1] * 0.5 + 0.5) * this.lh - 1 - cam.off[1];
      const k = this.scale / (this.w / cssW);
      return { x: px * k, y: cssH - py * k, z: v[2] };
    }
    render(cam, draws, parts, lines, time, shadow) {
      const gl = this.gl, E = this.env;
      // ---- shadow pass (sun or moon) ----
      const sd = norm(E.sunDir);
      const span = (shadow && shadow.span) || 26;
      const c = (shadow && shadow.center) || cam.real;
      const eye = [c[0] - sd[0] * 60, c[1] - sd[1] * 60, c[2] - sd[2] * 60];
      const sView = M4.lookAt(eye, c, Math.abs(sd[1]) > 0.99 ? [0, 0, 1] : [0, 1, 0]);
      const sProj = M4.ortho(-span, span, -span, span, 1, 140);
      const sVP = M4.mul(sProj, sView);
      if (E.shadow) {
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.shadowFb);
        gl.viewport(0, 0, this.shadowSize, this.shadowSize);
        gl.clear(gl.DEPTH_BUFFER_BIT);
        gl.enable(gl.DEPTH_TEST); gl.disable(gl.BLEND);
        gl.enable(gl.CULL_FACE); gl.cullFace(gl.FRONT);
        gl.useProgram(this.depthProg.p);
        gl.uniformMatrix4fv(this.depthProg.u.uVP, false, sVP);
        gl.uniform1f(this.depthProg.u.uTime, time); gl.uniform1f(this.depthProg.u.uWind, E.wind);
        for (const d of draws) {
          if (d.noShadow || (d.opacity != null && d.opacity < 0.5)) continue;
          gl.uniformMatrix4fv(this.depthProg.u.uModel, false, d.model || IDENT);
          gl.bindVertexArray(d.mesh.vao); gl.drawArrays(gl.TRIANGLES, 0, d.mesh.count);
        }
        gl.cullFace(gl.BACK);
      }
      // ---- main pass at art resolution ----
      gl.bindFramebuffer(gl.FRAMEBUFFER, this.sceneFb);
      gl.drawBuffers([gl.COLOR_ATTACHMENT0, gl.COLOR_ATTACHMENT1]);
      gl.viewport(0, 0, this.lw, this.lh);
      gl.clearBufferfv(gl.COLOR, 0, [E.clear[0], E.clear[1], E.clear[2], 1]);
      gl.clearBufferfv(gl.COLOR, 1, [0.5, 1, 0.5, 0]);
      gl.clearBufferfv(gl.DEPTH, 0, [1]);
      gl.enable(gl.DEPTH_TEST); gl.depthFunc(gl.LEQUAL); gl.enable(gl.CULL_FACE); gl.disable(gl.BLEND);
      const P = this.prog, u = P.u;
      gl.useProgram(P.p);
      gl.uniformMatrix4fv(u.uVP, false, cam.vp);
      gl.uniformMatrix4fv(u.uShadowVP, false, sVP);
      gl.uniform3fv(u.uSunDir, sd); gl.uniform3fv(u.uSunCol, E.sunCol); gl.uniform3fv(u.uSky, E.sky); gl.uniform3fv(u.uGround, E.ground);
      gl.uniform3fv(u.uFog, E.fog); gl.uniform1f(u.uFogAmt, E.fogAmt || 0);
      gl.uniform3fv(u.uViewDir, cam.fwd); gl.uniform1f(u.uTime, time); gl.uniform1f(u.uWind, E.wind);
      gl.uniform1f(u.uWet, E.wet); gl.uniform1f(u.uGlassGlow, E.glassGlow == null ? 1 : E.glassGlow); gl.uniform1f(u.uBands, E.bands); gl.uniform1f(u.uWearMul, E.wearMul);
      gl.uniform1f(u.uShadowOn, E.shadow ? 1 : 0); gl.uniform1f(u.uShadowTexel, 1 / this.shadowSize);
      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, this.shadowTex); gl.uniform1i(u.uShadow, 0);
      // lights nearest the view centre
      const L = this.lights.filter(l => l.on !== false && l.i > 0).map(l => ({ l, d: (l.x - c[0]) ** 2 + (l.z - c[2]) ** 2 - l.r * l.r * 0.5 })).sort((a, b) => a.d - b.d).slice(0, NL);
      const lp = new Float32Array(NL * 4), lc = new Float32Array(NL * 3);
      L.forEach(({ l }, i) => {
        let fl = 1;
        if (l.flicker) fl = 1 + Math.sin(time * 9 + i * 3.1) * 0.06 * l.flicker + Math.sin(time * 23 + i) * 0.04 * l.flicker;
        if (l.buzz) fl *= (Math.sin(time * 37 + i * 7) > 0.97 - l.buzz * 0.1 ? 0.25 : 1);
        lp.set([l.x, l.y, l.z, l.r], i * 4);
        lc.set([l.c[0] * l.i * fl, l.c[1] * l.i * fl, l.c[2] * l.i * fl], i * 3);
      });
      gl.uniform1i(u.uNL, L.length); gl.uniform4fv(u.uLP, lp); gl.uniform3fv(u.uLC, lc);
      for (const d of draws) {
        gl.uniformMatrix4fv(u.uModel, false, d.model || IDENT);
        gl.uniform3fv(u.uTint, d.tint || ONE);
        gl.uniform1f(u.uFlash, d.flash || 0);
        gl.uniform1f(u.uOpacity, d.opacity == null ? 1 : d.opacity);
        gl.uniform1f(u.uOutline, d.noOutline ? 0 : 1);
        if (d.noCull) gl.disable(gl.CULL_FACE);
        gl.bindVertexArray(d.mesh.vao); gl.drawArrays(gl.TRIANGLES, 0, d.mesh.count);
        if (d.noCull) gl.enable(gl.CULL_FACE);
      }
      gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
      gl.depthMask(false);
      if (lines && lines.n) {
        gl.useProgram(this.lineProg.p);
        gl.uniformMatrix4fv(this.lineProg.u.uVP, false, cam.vp);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.lineBuf);
        gl.bufferData(gl.ARRAY_BUFFER, lines.data.subarray(0, lines.n * 14), gl.DYNAMIC_DRAW);
        gl.bindVertexArray(this.lineVao); gl.drawArrays(gl.LINES, 0, lines.n * 2);
      }
      if (parts && parts.n) {
        gl.useProgram(this.partProg.p);
        gl.uniformMatrix4fv(this.partProg.u.uVP, false, cam.vp);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.partBuf);
        gl.bufferData(gl.ARRAY_BUFFER, parts.data.subarray(0, parts.n * 8), gl.DYNAMIC_DRAW);
        gl.bindVertexArray(this.partVao); gl.drawArrays(gl.POINTS, 0, parts.n);
      }
      gl.depthMask(true); gl.disable(gl.BLEND);
      // ---- edges, bloom, upscale ----
      gl.disable(gl.DEPTH_TEST); gl.disable(gl.CULL_FACE);
      gl.bindVertexArray(this.quad);
      const pass = (prog, tgt, setup) => {
        gl.bindFramebuffer(gl.FRAMEBUFFER, tgt ? tgt.fb : null);
        gl.viewport(0, 0, tgt ? tgt.w : this.w, tgt ? tgt.h : this.h);
        gl.useProgram(prog.p); setup(prog.u); gl.drawArrays(gl.TRIANGLES, 0, 3);
      };
      const bindT = (unit, t, loc) => { gl.activeTexture(gl.TEXTURE0 + unit); gl.bindTexture(gl.TEXTURE_2D, t); gl.uniform1i(loc, unit); };
      pass(this.edgeProg, this.edge, u2 => {
        bindT(0, this.colT, u2.uC); bindT(1, this.norT, u2.uN); bindT(2, this.depT, u2.uD);
        gl.uniform1f(u2.uRange, RANGE - NEAR); gl.uniform1f(u2.uDepthTh, E.depthTh); gl.uniform1f(u2.uOutlineK, E.outlineK); gl.uniform1f(u2.uHiK, E.hiK);
      });
      pass(this.brightProg, this.b1, u2 => { bindT(0, this.edge.t, u2.uT); gl.uniform1f(u2.uTh, E.bloomTh); });
      pass(this.blurProg, this.b2, u2 => { bindT(0, this.b1.t, u2.uT); gl.uniform2f(u2.uDir, 1 / this.b1.w, 0); });
      pass(this.blurProg, this.b1, u2 => { bindT(0, this.b2.t, u2.uT); gl.uniform2f(u2.uDir, 0, 1 / this.b1.h); });
      pass(this.blurProg, this.c1, u2 => { bindT(0, this.b1.t, u2.uT); gl.uniform2f(u2.uDir, 2 / this.b1.w, 0); });
      pass(this.blurProg, this.c2, u2 => { bindT(0, this.c1.t, u2.uT); gl.uniform2f(u2.uDir, 0, 1 / this.c1.h); });
      pass(this.blurProg, this.c1, u2 => { bindT(0, this.c2.t, u2.uT); gl.uniform2f(u2.uDir, 1.5 / this.c1.w, 0); });
      pass(this.blurProg, this.c2, u2 => { bindT(0, this.c1.t, u2.uT); gl.uniform2f(u2.uDir, 0, 1.5 / this.c1.h); });
      pass(this.postProg, null, u2 => {
        bindT(0, this.edge.t, u2.uT); bindT(1, this.b1.t, u2.uB); bindT(2, this.c2.t, u2.uB2);
        gl.uniform2f(u2.uLow, this.lw, this.lh); gl.uniform2f(u2.uOff, cam.off[0], cam.off[1]); gl.uniform1f(u2.uScale, this.scale);
        gl.uniform1f(u2.uBloom, E.bloom); gl.uniform1f(u2.uVig, E.vig); gl.uniform1f(u2.uFade, this.fade); gl.uniform3fv(u2.uFadeCol, this.fadeCol);
        gl.uniform1f(u2.uSat, E.sat); gl.uniform3fv(u2.uGrade, E.grade); gl.uniform1f(u2.uLevels, E.levels);
      });
      gl.bindVertexArray(null);
    }
  }
  const IDENT = M4.ident(), ONE = new Float32Array([1, 1, 1]);
  function norm(v) { const l = Math.hypot(v[0], v[1], v[2]) || 1; return [v[0] / l, v[1] / l, v[2] / l]; }

  window.GL3 = { M4, Renderer, norm };
})();
