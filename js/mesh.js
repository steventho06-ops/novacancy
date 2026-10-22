// Mesh builder: flat-shaded low-poly primitives with vertex colours, emission, sway and a
// surface material id (the shader paints tiles, brick, rust, grime from it in world space).
(function () {
  const { M4 } = GL3;
  const hexCache = {};
  function rgb(h) {
    if (Array.isArray(h)) return h;
    if (hexCache[h]) return hexCache[h];
    const n = parseInt(h.slice(1), 16);
    return (hexCache[h] = [(n >> 16 & 255) / 255, (n >> 8 & 255) / 255, (n & 255) / 255]);
  }
  function mixc(a, b, t) { a = rgb(a); b = rgb(b); return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]; }
  function shade(c, k) { c = rgb(c); return [c[0] * k, c[1] * k, c[2] * k]; }
  function hash3(x, y, z) {
    let h = (Math.floor(x * 73.1) * 374761393 + Math.floor(y * 91.7) * 668265263 + Math.floor(z * 53.3) * 2147483647) | 0;
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
  }

  class MB {
    constructor() { this.a = []; this.stack = []; this.m = null; this.jit = 0.04; this.emit = 0; this.sway = 0; this.mat = 0; }
    push(m) { this.stack.push(this.m); this.m = this.m ? M4.mul(this.m, m) : m; return this; }
    pop() { this.m = this.stack.pop(); return this; }
    at(x, y, z, ry = 0, s = 1, rx = 0, rz = 0) { return this.push(M4.trs(x, y, z, ry, s, rx, rz)); }
    v(p, n, c, e, s, mt) {
      let x = p[0], y = p[1], z = p[2], nx = n[0], ny = n[1], nz = n[2];
      if (this.m) {
        const m = this.m;
        const tx = m[0] * x + m[4] * y + m[8] * z + m[12], ty = m[1] * x + m[5] * y + m[9] * z + m[13], tz = m[2] * x + m[6] * y + m[10] * z + m[14];
        const qx = m[0] * nx + m[4] * ny + m[8] * nz, qy = m[1] * nx + m[5] * ny + m[9] * nz, qz = m[2] * nx + m[6] * ny + m[10] * nz;
        const l = Math.hypot(qx, qy, qz) || 1;
        x = tx; y = ty; z = tz; nx = qx / l; ny = qy / l; nz = qz / l;
      }
      this.a.push(x, y, z, nx, ny, nz, c[0], c[1], c[2], e, s, mt);
    }
    // triangle with flat normal; col may be one colour or [ca, cb, cc]
    tri(a, b, c, col, o = {}) {
      const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], wx = c[0] - a[0], wy = c[1] - a[1], wz = c[2] - a[2];
      let nx = uy * wz - uz * wy, ny = uz * wx - ux * wz, nz = ux * wy - uy * wx;
      const l = Math.hypot(nx, ny, nz) || 1; const n = [nx / l, ny / l, nz / l];
      const e = o.emit != null ? o.emit : this.emit, s = o.sway != null ? o.sway : this.sway, mt = o.mat != null ? o.mat : this.mat;
      const multi = Array.isArray(col) && Array.isArray(col[0]);
      let k = 1;
      const jit = o.jit != null ? o.jit : this.jit;
      if (jit) k = 1 + (hash3(a[0] + c[0], a[1] + b[1], a[2] + b[2]) - 0.5) * 2 * jit;
      const C = cc => { const q = rgb(cc); return [q[0] * k, q[1] * k, q[2] * k]; };
      if (multi) { this.v(a, n, C(col[0]), e, s, mt); this.v(b, n, C(col[1]), e, s, mt); this.v(c, n, C(col[2]), e, s, mt); }
      else { const q = C(col); this.v(a, n, q, e, s, mt); this.v(b, n, q, e, s, mt); this.v(c, n, q, e, s, mt); }
      return this;
    }
    quad(a, b, c, d, col, o) {
      if (Array.isArray(col) && Array.isArray(col[0])) { this.tri(a, b, c, [col[0], col[1], col[2]], o); this.tri(a, c, d, [col[0], col[2], col[3]], o); }
      else { this.tri(a, b, c, col, o); this.tri(a, c, d, col, o); }
      return this;
    }
    // axis-aligned box: centre x,z; bottom y; size w(x) h(y) d(z)
    box(x, y, z, w, h, d, col, o = {}) {
      const x0 = x - w / 2, x1 = x + w / 2, z0 = z - d / 2, z1 = z + d / 2, y0 = y, y1 = y + h;
      const tp = o.taper || 0; // shrink top
      const tx0 = x0 + tp, tx1 = x1 - tp, tz0 = z0 + tp, tz1 = z1 - tp;
      const top = o.top || col, side = o.side || col, bot = o.bottom || shade(col, 0.6);
      const sd = shade(side, 0.92);
      if (o.rot) this.at(x, 0, z, o.rot).at(-x, 0, -z);
      const ot = o.topMat != null ? Object.assign({}, o, { mat: o.topMat }) : o;
      if (!o.noTop) this.quad([tx0, y1, tz1], [tx1, y1, tz1], [tx1, y1, tz0], [tx0, y1, tz0], top, ot);
      if (o.bottomFace) this.quad([x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1], bot, o);
      const sk = o.skip || '';
      if (!sk.includes('f')) this.quad([x0, y0, z1], [x1, y0, z1], [tx1, y1, tz1], [tx0, y1, tz1], o.front || side, o);
      if (!sk.includes('b')) this.quad([x1, y0, z0], [x0, y0, z0], [tx0, y1, tz0], [tx1, y1, tz0], o.back || sd, o);
      if (!sk.includes('r')) this.quad([x1, y0, z1], [x1, y0, z0], [tx1, y1, tz0], [tx1, y1, tz1], o.right || sd, o);
      if (!sk.includes('l')) this.quad([x0, y0, z0], [x0, y0, z1], [tx0, y1, tz1], [tx0, y1, tz0], o.left || sd, o);
      if (o.rot) { this.pop(); this.pop(); }
      return this;
    }
    // cylinder along y: bottom centre x,y,z
    cyl(x, y, z, r, h, seg, col, o = {}) {
      const r2 = o.r2 != null ? o.r2 : r, rz = o.rz || 1, top = o.top || col, ph = o.phase || 0;
      for (let i = 0; i < seg; i++) {
        const a0 = (i / seg) * Math.PI * 2 + ph, a1 = ((i + 1) / seg) * Math.PI * 2 + ph;
        const b0 = [x + Math.cos(a0) * r, y, z + Math.sin(a0) * r * rz], b1 = [x + Math.cos(a1) * r, y, z + Math.sin(a1) * r * rz];
        const t0 = [x + Math.cos(a0) * r2, y + h, z + Math.sin(a0) * r2 * rz], t1 = [x + Math.cos(a1) * r2, y + h, z + Math.sin(a1) * r2 * rz];
        if (r2 > 0) this.quad(b1, b0, t0, t1, col, o); else this.tri(b1, b0, t0, col, o);
        if (o.cap !== false && r2 > 0) this.tri([x, y + h, z], t1, t0, top, o);
        if (o.bottomCap) this.tri([x, y, z], b0, b1, shade(col, 0.6), o);
      }
      return this;
    }
    cone(x, y, z, r, h, seg, col, o = {}) { return this.cyl(x, y, z, r, h, seg, col, Object.assign({}, o, { r2: 0 })); }
    // low-poly sphere (icosphere). o: detail, jitter, sy, colTop, colBot, flatBottom
    sphere(x, y, z, r, col, o = {}) {
      const g = ico(o.detail == null ? 1 : o.detail);
      const sy = o.sy || 1, sx = o.sx || 1, sz = o.sz || 1, jt = o.jitter || 0, seed = o.seed || 0;
      const P = g.v.map(p => {
        const k = 1 + (jt ? (hash3(p[0] * 3 + seed, p[1] * 3, p[2] * 3) - 0.5) * 2 * jt : 0);
        let py = p[1] * r * sy * k;
        if (o.flatBottom != null) py = Math.max(py, -o.flatBottom * r);
        return [x + p[0] * r * sx * k, y + py, z + p[2] * r * sz * k];
      });
      for (const [a, b, c] of g.f) {
        let cc = col;
        if (o.colTop) {
          const my = (P[a][1] + P[b][1] + P[c][1]) / 3 - y;
          cc = mixc(o.colBot || col, o.colTop, Math.max(0, Math.min(1, (my / (r * sy) + 1) / 2)));
        }
        this.tri(P[a], P[b], P[c], cc, o);
      }
      return this;
    }
    // flat polygon on the xz plane at height y (convex), points [[x,z],...] counter-clockwise from above
    poly(pts, y, col, o) {
      for (let i = 1; i < pts.length - 1; i++) this.tri([pts[0][0], y, pts[0][1]], [pts[i + 1][0], y, pts[i + 1][1]], [pts[i][0], y, pts[i][1]], col, o);
      return this;
    }
    // vertical panel facing +z (for signs, pictures)
    panel(x, y, z, w, h, col, o = {}) {
      return this.quad([x - w / 2, y, z], [x + w / 2, y, z], [x + w / 2, y + h, z], [x - w / 2, y + h, z], col, o);
    }
    merge(other) { const A = other.a; for (let i = 0; i < A.length; i += 12) { this.v([A[i], A[i + 1], A[i + 2]], [A[i + 3], A[i + 4], A[i + 5]], [A[i + 6], A[i + 7], A[i + 8]], A[i + 9], A[i + 10], A[i + 11]); } return this; }
    data() { return new Float32Array(this.a); }
    get count() { return this.a.length / 12; }
  }

  // icosphere cache
  const icoCache = {};
  function ico(detail) {
    if (icoCache[detail]) return icoCache[detail];
    const t = (1 + Math.sqrt(5)) / 2;
    let v = [[-1, t, 0], [1, t, 0], [-1, -t, 0], [1, -t, 0], [0, -1, t], [0, 1, t], [0, -1, -t], [0, 1, -t], [t, 0, -1], [t, 0, 1], [-t, 0, -1], [-t, 0, 1]].map(nrm);
    let f = [[0, 11, 5], [0, 5, 1], [0, 1, 7], [0, 7, 10], [0, 10, 11], [1, 5, 9], [5, 11, 4], [11, 10, 2], [10, 7, 6], [7, 1, 8], [3, 9, 4], [3, 4, 2], [3, 2, 6], [3, 6, 8], [3, 8, 9], [4, 9, 5], [2, 4, 11], [6, 2, 10], [8, 6, 7], [9, 8, 1]];
    for (let d = 0; d < detail; d++) {
      const mid = {}; const nf = [];
      const m = (a, b) => { const k = a < b ? a + '_' + b : b + '_' + a; if (mid[k] == null) { v.push(nrm([(v[a][0] + v[b][0]) / 2, (v[a][1] + v[b][1]) / 2, (v[a][2] + v[b][2]) / 2])); mid[k] = v.length - 1; } return mid[k]; };
      for (const [a, b, c] of f) { const ab = m(a, b), bc = m(b, c), ca = m(c, a); nf.push([a, ab, ca], [b, bc, ab], [c, ca, bc], [ab, bc, ca]); }
      f = nf;
    }
    return (icoCache[detail] = { v, f });
  }
  function nrm(p) { const l = Math.hypot(p[0], p[1], p[2]); return [p[0] / l, p[1] / l, p[2] / l]; }

  window.MESH = { MB, rgb, mixc, shade, hash3 };
})();
