// City models: ground, buildings with storefronts, street furniture, vehicles, docks, construction.
// Scale: 1 unit = 1 tile. Characters are ~1.15 tall, a storey is 1.9.
(function () {
  const { MB, MT, W, P, text, textWidth, neonRect, R, pick, shade, mixc, rgb } = KIT;
  const STOREY = 1.9;

  // ---------------- ground ----------------
  // tile types: road, walk (sidewalk), lot (parking asphalt), grass, plaza, dirt, water, pier, curbN.. handled by neighbours
  const GROUND = {
    road: { y: 0, c: P.asphalt, m: MT.asphalt, w: 0.55 },
    lot: { y: 0.02, c: '#40404a', m: MT.asphalt, w: 0.75 },
    walk: { y: 0.14, c: P.slab, m: MT.slab, w: 0.7 },
    plaza: { y: 0.14, c: P.concrete, m: MT.slab, w: 0.55 },
    grass: { y: 0.1, c: P.grass, m: MT.grass, w: 0.4 },
    dirt: { y: 0.04, c: '#6a5640', m: MT.concrete, w: 0.9 },
    gravel: { y: 0.05, c: '#5c5650', m: MT.roof, w: 0.6 },
    water: { y: -0.9, c: '#1f5582', m: MT.water, w: 0 },
    pier: { y: 0.2, c: '#6e5238', m: MT.wood, w: 0.8 },
    tiles: { y: 0.14, c: '#9fb7c0', m: MT.tile, w: 0.3 },
    pooldeck: { y: 0.14, c: '#c9bfae', m: MT.slab, w: 0.5 },
    floor: { y: 0, c: '#5a4a3c', m: MT.wood, w: 0.5 },
    void: { y: -0.5, c: '#111', m: 0, w: 0 },
  };
  function ground(map, mb, wearMul = 1) {
    const H = (i, j) => { const t = map.tile(i, j); return t && GROUND[t] ? GROUND[t].y : 0.14; };
    for (let j = 0; j < map.h; j++) for (let i = 0; i < map.w; i++) {
      const t = map.tile(i, j); const g = GROUND[t] || GROUND.walk;
      if (t === 'void' || t === 'bldg') continue;
      const y = g.y, wear = Math.min(0.99, g.w * wearMul * (0.8 + 0.4 * R(i, j, 5)));
      const col = map.tint && map.tint(i, j) || g.c;
      mb.quad([i, y, j + 1], [i + 1, y, j + 1], [i + 1, y, j], [i, y, j], col, { mat: W(g.m, wear), jit: 0.015 });
      // side faces where this tile is higher than its neighbour (curbs, pier edges, pool walls)
      const sides = [[0, 1, 'f'], [1, 0, 'r'], [0, -1, 'b'], [-1, 0, 'l']];
      for (const [dx, dz, s] of sides) {
        const nt = map.tile(i + dx, j + dz);
        const ny = nt == null ? -1 : H(i + dx, j + dz);
        if (nt === 'bldg') continue;
        if (ny < y - 0.001) {
          const cc = t === 'walk' || t === 'plaza' || t === 'pooldeck' ? P.curb : t === 'pier' ? P.woodD : shade(col, 0.7);
          const mat = t === 'pier' ? W(MT.wood, 0.8) : W(MT.concrete, 0.6);
          if (s === 'f') mb.quad([i, ny, j + 1], [i + 1, ny, j + 1], [i + 1, y, j + 1], [i, y, j + 1], cc, { mat });
          if (s === 'b') mb.quad([i + 1, ny, j], [i, ny, j], [i, y, j], [i + 1, y, j], cc, { mat });
          if (s === 'r') mb.quad([i + 1, ny, j + 1], [i + 1, ny, j], [i + 1, y, j], [i + 1, y, j + 1], cc, { mat });
          if (s === 'l') mb.quad([i, ny, j], [i, ny, j + 1], [i, y, j + 1], [i, y, j], cc, { mat });
        }
      }
    }
  }
  // road paint
  function laneDash(mb, x0, z0, x1, z1, col = P.lane, w = 0.1, dash = 0.8, gap = 0.7) {
    const len = Math.hypot(x1 - x0, z1 - z0), dx = (x1 - x0) / len, dz = (z1 - z0) / len;
    for (let s = 0; s < len; s += dash + gap) {
      const e = Math.min(len, s + dash);
      const ax = x0 + dx * s, az = z0 + dz * s, bx = x0 + dx * e, bz = z0 + dz * e;
      const px = -dz * w / 2, pz = dx * w / 2;
      mb.quad([ax - px, 0.012, az - pz], [bx - px, 0.012, bz - pz], [bx + px, 0.012, bz + pz], [ax + px, 0.012, az + pz], col, { mat: W(MT.concrete, 0.7), jit: 0 });
    }
  }
  function stripe(mb, x0, z0, x1, z1, col = P.laneW, w = 0.1, y = 0.012) { laneDash(mb, x0, z0, x1, z1, col, w, 1e4, 0); }
  function crosswalk(mb, x0, z0, x1, z1, horiz) {
    // zebra bars across a road segment
    if (horiz) for (let x = x0 + 0.2; x < x1; x += 0.6) mb.box(x + 0.15, 0, (z0 + z1) / 2, 0.3, 0.014, z1 - z0, P.laneW, { mat: W(MT.concrete, 0.8), jit: 0 });
    else for (let z = z0 + 0.2; z < z1; z += 0.6) mb.box((x0 + x1) / 2, 0, z + 0.15, x1 - x0, 0.014, 0.3, P.laneW, { mat: W(MT.concrete, 0.8), jit: 0 });
  }
  function manhole(mb, x, z) { mb.cyl(x, 0, z, 0.32, 0.02, 10, '#2c2c32', { mat: W(MT.metal, 0.6) }); }

  // ---------------- buildings ----------------
  // b: { x, z, w, d, floors, wall, mat, wear, trim, roof, shop:{text,col,glass,awning}, side:'s'|'e', lit, seed, fire, roofProps, sign }
  // The front faces +z (south) or +x (east) depending on b.face; we model front = +z and rotate for 'e'.
  function building(mb, glow, b) {
    if (b.face === 'e') {
      // model it facing south in a rotated frame: local +z becomes world +x, local -x becomes world +z
      mb.at(b.x + b.w / 2, 0, b.z + b.d / 2, Math.PI / 2);
      const H = buildingLocal(mb, Object.assign({}, b, { x: -b.d / 2, z: -b.w / 2, w: b.d, d: b.w, face: 's', side: 'w', seed: b.seed || (b.x * 13 + b.z * 7) }));
      mb.pop();
      return H;
    }
    return buildingLocal(mb, Object.assign({ side: 'e' }, b));
  }
  function buildingLocal(mb, b) {
    const glow = null;
    const H = b.floors * STOREY + 0.3;
    const seed = b.seed || (b.x * 13 + b.z * 7);
    const r = k => R(seed, k, 3);
    const wear = b.wear != null ? b.wear : 0.6;
    const wall = b.wall || pick([P.brick, '#6a5a7a', '#5a6a6e', '#7a6050', '#8a7a60', '#4a5a7a', P.brickD], r(1));
    const mat = b.mat != null ? b.mat : pick([MT.brick, MT.brick, MT.plaster, MT.concrete], r(2));
    const trim = b.trim || shade(wall, 0.7);
    const cx = b.x + b.w / 2, cz = b.z + b.d / 2;
    // body
    mb.box(cx, 0, cz, b.w, H, b.d, wall, { mat: W(mat, wear), topMat: W(MT.roof, 0.6), top: P.roof });
    // parapet + cornice
    mb.box(cx, H, cz, b.w + 0.08, 0.22, b.d + 0.08, trim, { mat: W(MT.concrete, wear), noTop: true, skip: '' });
    mb.box(cx, H + 0.22, cz, b.w + 0.08, 0.04, b.d + 0.08, shade(trim, 1.15), { mat: W(MT.concrete, wear) });
    // floor bands
    for (let f = 1; f < b.floors; f++) mb.box(cx, f * STOREY + 0.18, cz, b.w + 0.04, 0.1, b.d + 0.04, trim, { mat: W(MT.concrete, wear), noTop: true });
    // windows on the two camera-facing sides (south +z, east +x) and dim ones on the far sides
    const winRow = (face, f) => {
      const len = face === 's' || face === 'n' ? b.w : b.d;
      const n = Math.max(1, Math.floor((len - 0.4) / 1.25));
      const step = len / n;
      for (let k = 0; k < n; k++) {
        if (f === 0 && b.shop && face === 's') continue;
        const u = -len / 2 + step * (k + 0.5), y = f * STOREY + 0.75;
        const lit = R(seed + k * 3 + f * 17, face.charCodeAt(0), 9) < (b.lit != null ? b.lit : 0.42);
        const warm = R(seed + k, f, 4) > 0.3;
        const gc = lit ? (warm ? '#ffc96a' : '#9fd8ff') : P.glassD;
        const em = lit ? 0.6 : 0;
        const wc = { mat: W(MT.glass, wear * 0.5), jit: 0, emit: em };
        let px, pz, ww = 0.62, wh = 0.86;
        if (face === 's') { px = cx + u; pz = b.z + b.d + 0.01; mb.box(px, y, pz, ww, wh, 0.04, gc, wc); mb.box(px, y - 0.08, pz + 0.04, ww + 0.16, 0.08, 0.1, trim, { mat: W(MT.concrete, wear) }); mb.box(px, y + wh, pz + 0.02, ww + 0.1, 0.07, 0.06, trim); if (lit && glow) glow.push([px, y + 0.4, pz + 0.3, warm]); }
        if (face === 'w') { px = b.x - 0.01; pz = cz + u; mb.box(px, y, pz, 0.04, wh, ww, gc, wc); mb.box(px - 0.04, y - 0.08, pz, 0.1, 0.08, ww + 0.16, trim, { mat: W(MT.concrete, wear) }); mb.box(px - 0.02, y + wh, pz, 0.06, 0.07, ww + 0.1, trim); }
        if (face === 'e') { px = b.x + b.w + 0.01; pz = cz + u; mb.box(px, y, pz, 0.04, wh, ww, gc, wc); mb.box(px + 0.04, y - 0.08, pz, 0.1, 0.08, ww + 0.16, trim, { mat: W(MT.concrete, wear) }); mb.box(px + 0.02, y + wh, pz, 0.06, 0.07, ww + 0.1, trim); if (lit && glow) glow.push([px + 0.3, y + 0.4, pz, warm]); }
        // AC unit under some windows
        if (f > 0 && R(seed + k, f, 11) > 0.82) {
          if (face === 's') mb.box(px, y - 0.38, pz + 0.18, 0.42, 0.28, 0.32, '#b8b8b0', { mat: W(MT.metal, wear) });
          if (face === 'e') mb.box(px + 0.18, y - 0.38, pz, 0.32, 0.28, 0.42, '#b8b8b0', { mat: W(MT.metal, wear) });
          if (face === 'w') mb.box(px - 0.18, y - 0.38, pz, 0.32, 0.28, 0.42, '#b8b8b0', { mat: W(MT.metal, wear) });
        }
      }
    };
    for (let f = 0; f < b.floors; f++) { winRow('s', f); winRow(b.side || 'e', f); }
    // storefront on the ground floor
    if (b.shop) storefront(mb, b, cx, cz, wear);
    // fire escape on the east face
    if (b.fire && b.floors > 1 && b.side !== 'w') fireEscape(mb, b.x + b.w, cz, b.floors, Math.min(2.6, b.d - 0.6), wear);
    // roof props
    const ry = H;
    if (b.roofProps !== false) {
      if (r(5) > 0.35) mb.box(b.x + 0.6 + r(6) * (b.w - 1.4), ry, b.z + 0.6 + r(7) * (b.d - 1.4), 0.8, 0.5, 0.6, '#9a9a96', { mat: W(MT.metal, 0.7) });
      if (r(8) > 0.6) mb.box(b.x + 0.5 + r(9) * (b.w - 1.2), ry, b.z + 0.5 + r(10) * (b.d - 1.2), 0.7, 0.7, 0.7, '#6a6a6e', { mat: W(MT.metal, 0.6) });
      if (b.floors >= 3 && r(12) > 0.55) waterTower(mb, b.x + b.w * (0.25 + r(13) * 0.5), ry, b.z + b.d * (0.3 + r(14) * 0.4));
      if (r(15) > 0.7) { mb.cyl(b.x + b.w - 0.6, ry, b.z + 0.6, 0.03, 1.4, 4, P.iron); }
    }
    if (b.sign && b.side !== 'w') bladeSign(mb, b.x + b.w + 0.05, 2.4, b.z + b.d - 0.8, b.sign.text, b.sign.col, Math.min(b.floors * STOREY - 2.6, 3.2));
    return H;
  }
  function storefront(mb, b, cx, cz, wear) {
    const s = b.shop, fz = b.z + b.d + 0.02;
    const gw = b.w - 0.6;
    // glass front with mullions and a door
    mb.box(cx, 0.14, fz, gw, 1.5, 0.05, s.glass || '#3a5a6e', { mat: W(MT.glass, wear * 0.4), emit: s.lit === false ? 0 : 0.35, jit: 0 });
    for (let k = 0; k <= 4; k++) mb.box(cx - gw / 2 + gw * k / 4, 0.14, fz + 0.03, 0.08, 1.5, 0.06, P.iron, { mat: W(MT.metal, wear) });
    mb.box(cx, 1.64, fz + 0.03, gw + 0.1, 0.1, 0.08, P.iron, { mat: W(MT.metal, wear) });
    mb.box(cx, 0.14, fz + 0.03, gw + 0.1, 0.18, 0.08, shade(b.trim || P.iron, 0.9), { mat: W(MT.metal, wear) });
    // fascia with sign text
    const fc = s.fascia || '#1c1c26';
    mb.box(cx, 1.74, fz + 0.04, b.w - 0.2, 0.62, 0.1, fc, { mat: W(MT.metal, wear * 0.5) });
    const px = Math.min(0.07, (b.w - 0.8) / (textWidth(s.text, 1)));
    text(mb, s.text, cx, 1.82, fz + 0.12, px, s.col, { emit: 1.5, mat: MT.neon });
    // awning
    if (s.awning) {
      const ac = s.awning;
      for (let k = 0; k < Math.floor(gw / 0.5); k++) {
        const ax = cx - gw / 2 + 0.25 + k * 0.5;
        mb.at(ax, 2.1, fz + 0.45, 0, 1, -0.5); mb.box(0, 0, 0, 0.5, 0.05, 1.0, k % 2 ? ac : P.white, { mat: W(MT.plain, 0) }); mb.pop();
      }
    }
  }
  function fireEscape(mb, x, z, floors, len, wear) {
    const o = { mat: W(MT.metal, Math.max(0.5, wear)) };
    for (let f = 1; f < floors; f++) {
      const y = f * STOREY;
      mb.box(x + 0.45, y, z, 0.9, 0.06, len, P.iron, o);
      mb.box(x + 0.88, y + 0.5, z, 0.04, 0.04, len, P.iron, o);
      for (let k = -len / 2; k <= len / 2 + 0.01; k += 0.4) mb.box(x + 0.88, y, z + k, 0.04, 0.5, 0.04, P.iron, o);
      // ladder down
      mb.at(x + 0.45, y - STOREY, z - len / 2 + 0.5, 0, 1, -0.62, 0);
      mb.box(-0.2, 0, 0, 0.04, STOREY * 1.18, 0.04, P.iron, o); mb.box(0.2, 0, 0, 0.04, STOREY * 1.18, 0.04, P.iron, o);
      for (let k = 0.2; k < STOREY * 1.15; k += 0.25) mb.box(0, k, 0, 0.4, 0.035, 0.05, P.iron, o);
      mb.pop();
    }
  }
  function waterTower(mb, x, y, z) {
    const o = { mat: W(MT.wood, 0.7) };
    for (const [dx, dz] of [[-0.4, -0.4], [0.4, -0.4], [-0.4, 0.4], [0.4, 0.4]]) mb.box(x + dx, y, z + dz, 0.07, 1.0, 0.07, P.iron, { mat: W(MT.metal, 0.8) });
    mb.cyl(x, y + 1.0, z, 0.62, 1.1, 10, '#7a5a3e', o);
    mb.cone(x, y + 2.1, z, 0.7, 0.45, 10, '#4a4048', { mat: W(MT.metal, 0.8) });
  }
  // vertical blade sign hanging off a facade (faces +x)
  function bladeSign(mb, x, y, z, str, col, h) {
    str = String(str).toUpperCase();
    const n = str.length, px = Math.min(0.08, h / (n * 8));
    const hh = n * 8 * px + 0.2;
    mb.box(x + 0.25, y, z, 0.12, hh, 0.5, '#15151c', { mat: W(MT.metal, 0.5) });
    neonRect(mb, x + 0.32, y + 0.03, z, 0.44, hh - 0.06, col, 0.035, 'z');
    for (let i = 0; i < n; i++) {
      const g = str[i];
      const yy = y + hh - 0.15 - (i + 1) * 8 * px;
      text(mb, g, x + 0.33, yy, z, px, col, { dir: 'z', emit: 1.6, mat: MT.neon });
    }
    mb.box(x + 0.1, y + hh - 0.1, z, 0.25, 0.05, 0.05, P.iron); mb.box(x + 0.1, y + 0.1, z, 0.25, 0.05, 0.05, P.iron);
  }

  // ---------------- street furniture ----------------
  function streetLamp(mb, x, z, rot = 0) {
    mb.at(x, 0.14, z, rot);
    mb.cyl(0, 0, 0, 0.09, 0.2, 6, P.iron, { mat: W(MT.metal, 0.6) });
    mb.cyl(0, 0, 0, 0.05, 3.1, 6, '#3a3e48', { mat: W(MT.metal, 0.5) });
    mb.box(0, 3.0, 0.35, 0.06, 0.06, 0.8, '#3a3e48');
    mb.box(0, 2.88, 0.72, 0.34, 0.12, 0.22, '#2a2c34');
    mb.box(0, 2.84, 0.72, 0.26, 0.04, 0.16, '#ffe2a8', { emit: 1.6, mat: MT.neon, jit: 0 });
    mb.pop();
    const c = Math.cos(rot), s = Math.sin(rot);
    return { x: x + s * 0.72, y: 2.7, z: z + c * 0.72 };
  }
  function hydrant(mb, x, z) {
    mb.cyl(x, 0.14, z, 0.11, 0.38, 7, P.red, { mat: W(MT.metal, 0.5) });
    mb.cyl(x, 0.52, z, 0.08, 0.08, 7, P.red); mb.box(x, 0.36, z, 0.32, 0.08, 0.08, P.red);
  }
  function trashCan(mb, x, z) { mb.cyl(x, 0.14, z, 0.2, 0.55, 8, '#3c4a3c', { mat: W(MT.metal, 0.7) }); mb.cyl(x, 0.69, z, 0.22, 0.05, 8, '#2c362c'); }
  function trashBags(mb, x, z, n = 3, seed = 0) {
    for (let i = 0; i < n; i++) mb.sphere(x + (R(seed, i, 1) - 0.5) * 0.6, 0.14 + 0.18, z + (R(seed, i, 2) - 0.5) * 0.5, 0.22 + R(seed, i, 3) * 0.08, R(seed, i, 4) > 0.3 ? '#1e1e24' : '#2a3a5a', { detail: 1, sy: 0.85, jitter: 0.15, seed: i, flatBottom: 0.8 });
  }
  function dumpster(mb, x, z, rot = 0, col = '#2e5a3e') {
    mb.at(x, 0, z, rot);
    mb.box(0, 0.1, 0, 1.6, 0.85, 0.9, col, { mat: W(MT.metal, 0.85), taper: -0.05 });
    mb.at(0, 0.98, -0.42, 0, 1, -0.15); mb.box(0, 0, 0.45, 1.66, 0.06, 0.95, shade(col, 0.8), { mat: W(MT.metal, 0.9) }); mb.pop();
    for (const sx of [-0.6, 0.6]) mb.cyl(sx, 0, 0.3, 0.08, 0.1, 6, '#222');
    mb.pop();
  }
  function bench(mb, x, z, rot = 0, col = P.woodL) {
    mb.at(x, 0.14, z, rot);
    for (const sx of [-0.55, 0.55]) mb.box(sx, 0, 0, 0.08, 0.42, 0.42, P.iron, { mat: W(MT.metal, 0.6) });
    mb.box(0, 0.4, 0, 1.4, 0.07, 0.42, col, { mat: W(MT.wood, 0.7) });
    mb.box(0, 0.5, -0.2, 1.4, 0.36, 0.06, col, { mat: W(MT.wood, 0.7) });
    mb.pop();
  }
  function busStop(mb, x, z, rot = 0) {
    mb.at(x, 0.14, z, rot);
    for (const sx of [-1.2, 1.2]) mb.box(sx, 0, -0.4, 0.07, 2.0, 0.07, P.steel, { mat: W(MT.metal, 0.4) });
    mb.box(0, 2.0, -0.1, 2.6, 0.08, 1.0, '#2c3038', { mat: W(MT.metal, 0.5) });
    mb.box(0, 0.3, -0.42, 2.4, 1.6, 0.04, '#5a8aa0', { mat: W(MT.glass, 0.6) });
    mb.box(1.25, 0.3, 0, 0.04, 1.6, 0.8, '#5a8aa0', { mat: W(MT.glass, 0.4) });
    mb.box(-0.5, 0.42, -0.25, 1.4, 0.06, 0.3, P.steel);
    // lit ad panel
    mb.box(-1.25, 0.25, 0, 0.12, 1.5, 0.8, '#18181e');
    mb.box(-1.18, 0.35, 0, 0.02, 1.3, 0.66, '#ff7ac0', { emit: 1.0, jit: 0 });
    text(mb, 'BUS', 0.6, 2.12, 0.42, 0.045, P.white, { emit: 0.6 });
    mb.pop();
  }
  function phoneBooth(mb, x, z, rot = 0) {
    mb.at(x, 0.14, z, rot);
    mb.box(0, 0, 0, 0.8, 2.2, 0.8, '#2a4a8a', { mat: W(MT.metal, 0.6) });
    mb.box(0, 0.5, 0.41, 0.6, 1.4, 0.02, '#3a6a8a', { mat: W(MT.glass, 0.8) });
    mb.box(0, 1.95, 0.42, 0.7, 0.18, 0.03, '#e8f4ff', { emit: 0.9, jit: 0 });
    text(mb, 'PHONE', 0, 1.98, 0.45, 0.022, '#2a4a8a', {});
    mb.pop();
  }
  function newsBox(mb, x, z, rot = 0, col = '#c8443c') { mb.at(x, 0.14, z, rot); mb.box(0, 0, 0, 0.45, 0.85, 0.4, col, { mat: W(MT.metal, 0.6) }); mb.box(0, 0.5, 0.21, 0.32, 0.25, 0.02, '#cfd6d8', { mat: W(MT.glass, 0.3) }); mb.pop(); }
  function vending(mb, x, z, rot = 0, col = '#c8443c', glow = '#bfe8ff') {
    mb.at(x, 0.14, z, rot);
    mb.box(0, 0, 0, 0.9, 1.75, 0.7, col, { mat: W(MT.metal, 0.5) });
    mb.box(-0.12, 0.5, 0.36, 0.52, 1.1, 0.02, glow, { emit: 1.0, jit: 0 });
    for (let r = 0; r < 4; r++) for (let k = 0; k < 3; k++) mb.box(-0.3 + k * 0.17, 0.6 + r * 0.26, 0.38, 0.1, 0.16, 0.02, pick(['#ff5a5a', '#5aff9a', '#ffd84a', '#5a8aff'], R(r, k, 1)), { emit: 0.5, jit: 0 });
    mb.box(0.3, 0.7, 0.36, 0.16, 0.5, 0.03, '#222');
    mb.pop();
  }
  function iceMachine(mb, x, z, rot = 0) {
    mb.at(x, 0.14, z, rot);
    mb.box(0, 0, 0, 0.9, 1.3, 0.7, '#d8dde0', { mat: W(MT.metal, 0.6) });
    mb.box(0, 0.75, 0.36, 0.7, 0.4, 0.02, '#3a8ad8', { emit: 0.6, jit: 0 });
    text(mb, 'ICE', 0, 0.82, 0.38, 0.045, P.white, { emit: 1.0 });
    mb.pop();
  }
  function trafficLight(mb, x, z, rot = 0, state = 'g') {
    mb.at(x, 0.14, z, rot);
    mb.cyl(0, 0, 0, 0.06, 3.2, 6, '#2a2c34', { mat: W(MT.metal, 0.4) });
    mb.box(0, 3.1, 0.6, 0.07, 0.07, 1.3, '#2a2c34');
    mb.box(0, 2.45, 1.2, 0.28, 0.8, 0.24, '#1c1c22');
    const L = [['#ff3b3b', 'r', 2.98], ['#ffc83b', 'y', 2.73], ['#3bff7a', 'g', 2.48]];
    for (const [c, k, y] of L) mb.box(0, y, 1.33, 0.14, 0.14, 0.02, state === k ? c : shade(c, 0.25), { emit: state === k ? 1.6 : 0, jit: 0 });
    mb.pop();
  }
  function cone(mb, x, z) { mb.box(x, 0.14, z, 0.32, 0.04, 0.32, '#e8642a'); mb.cone(x, 0.18, z, 0.12, 0.45, 6, '#ff7a2a'); mb.cyl(x, 0.33, z, 0.085, 0.07, 6, P.white, { r2: 0.07 }); }
  function barrier(mb, x, z, rot = 0) {
    mb.at(x, 0.14, z, rot);
    for (const sx of [-0.6, 0.6]) { mb.box(sx, 0, 0, 0.06, 0.8, 0.06, P.white); mb.box(sx, 0, 0, 0.36, 0.06, 0.3, P.iron); }
    for (let k = 0; k < 6; k++) mb.box(-0.6 + k * 0.24 + 0.12, 0.55, 0, 0.24, 0.2, 0.05, k % 2 ? P.white : '#ff6a2a', { jit: 0 });
    mb.pop();
  }
  function chainFence(mb, x0, z0, x1, z1, h = 1.8, wear = 0.8) {
    const len = Math.hypot(x1 - x0, z1 - z0), ang = Math.atan2(x1 - x0, z1 - z0);
    mb.at(x0, 0.05, z0, ang);
    const o = { mat: W(MT.metal, wear) };
    for (let s = 0; s <= len + 0.01; s += 2) mb.cyl(0, 0, Math.min(s, len), 0.04, h + 0.1, 5, '#7a7e86', o);
    mb.box(0, h, len / 2, 0.04, 0.04, len, '#7a7e86', o);
    mb.box(0, 0.1, len / 2, 0.03, 0.03, len, '#7a7e86', o);
    for (let s = 0.25; s < len; s += 0.25) { mb.box(0, 0.1, s, 0.02, h - 0.1, 0.035, '#6a6e78', o); }
    for (let k = 0.35; k < h; k += 0.35) mb.box(0, k, len / 2, 0.02, 0.035, len, '#6a6e78', o);
    mb.pop();
  }
  function lowWall(mb, x0, z0, x1, z1, h = 0.6, col = P.concrete) {
    const len = Math.hypot(x1 - x0, z1 - z0), ang = Math.atan2(x1 - x0, z1 - z0);
    mb.at(x0, 0.1, z0, ang); mb.box(0, 0, len / 2, 0.3, h, len, col, { mat: W(MT.brick, 0.6), top: shade(col, 1.1), topMat: W(MT.concrete, 0.5) }); mb.pop();
  }
  function planterTree(mb, x, z, seed = 0, kind = 'tree') {
    mb.box(x, 0.14, z, 0.9, 0.35, 0.9, '#6a6560', { mat: W(MT.concrete, 0.6), top: '#4a3a2a' });
    if (kind === 'palm') return palm(mb, x, z, seed);
    mb.cyl(x, 0.45, z, 0.07, 1.4, 5, P.woodD);
    const lc = pick([P.leaf, '#4f8a4a', '#3a6a40'], R(seed, 1, 1));
    mb.sphere(x, 2.1, z, 0.7, lc, { detail: 1, jitter: 0.18, seed, sway: 0.35, colTop: shade(lc, 1.25), colBot: shade(lc, 0.75) });
    mb.sphere(x + 0.35, 1.8, z + 0.2, 0.45, lc, { detail: 1, jitter: 0.2, seed: seed + 1, sway: 0.4, colTop: shade(lc, 1.2) });
  }
  function palm(mb, x, z, seed = 0, h = 4.2) {
    // curved segmented trunk
    let px = x, pz = z, py = 0.3;
    const lean = (R(seed, 2, 2) - 0.5) * 0.5, dir = R(seed, 3, 2) * 6.28;
    for (let k = 0; k < 7; k++) {
      const nx = px + Math.cos(dir) * lean * 0.12 * k, nz = pz + Math.sin(dir) * lean * 0.12 * k;
      mb.cyl(nx, py, nz, 0.11 - k * 0.007, h / 7, 6, k % 2 ? '#8a6a4a' : '#7a5a3e', { mat: W(MT.wood, 0.5) });
      px = nx; pz = nz; py += h / 7;
    }
    for (let k = 0; k < 7; k++) {
      const a = k / 7 * 6.28 + seed;
      mb.at(px, py, pz, a, 1, 0.5 + R(seed, k, 4) * 0.4);
      mb.quad([-0.08, 0, 0], [0.08, 0, 0], [0.18, -0.2, 1.4], [-0.18, -0.2, 1.4], P.leaf, { sway: 0.6 });
      mb.quad([0.08, 0, 0], [-0.08, 0, 0], [-0.18, -0.2, 1.4], [0.18, -0.2, 1.4], P.leafD, { sway: 0.6 });
      mb.pop();
    }
    mb.sphere(px, py - 0.05, pz, 0.16, '#6a4a2a', { detail: 0 });
  }
  function bush(mb, x, z, seed = 0, r = 0.45) { const c = pick([P.leaf, '#4a7a3e', '#3a6a46'], R(seed, 5, 1)); mb.sphere(x, 0.1 + r * 0.6, z, r, c, { detail: 1, jitter: 0.2, seed, sway: 0.2, colTop: shade(c, 1.2), flatBottom: 0.6 }); }
  function graffiti(mb, x, y, z, w, h, seed = 0, dir = 'x') {
    // blobby tag: a few coloured bars with outline, slightly off the wall
    const cols = [P.neonPink, '#5affd8', '#ffd84a', '#b44bff', '#ff7a3a'];
    const c1 = pick(cols, R(seed, 1, 7)), c2 = pick(cols, R(seed, 2, 7));
    const n = 4 + Math.floor(R(seed, 3, 7) * 4);
    for (let k = 0; k < n; k++) {
      const u = -w / 2 + (k + 0.5) * w / n, hh = h * (0.5 + R(seed, k, 8) * 0.5), yy = y + (h - hh) * R(seed, k, 9);
      if (dir === 'x') { mb.box(x + u, yy - 0.04, z, w / n * 0.9 + 0.06, hh + 0.08, 0.012, '#141218', { jit: 0 }); mb.box(x + u, yy, z + 0.01, w / n * 0.9, hh, 0.012, k % 2 ? c1 : c2, { jit: 0, emit: 0.15 }); }
      else { mb.box(x, yy - 0.04, z - u, 0.012, hh + 0.08, w / n * 0.9 + 0.06, '#141218', { jit: 0 }); mb.box(x + 0.01, yy, z - u, 0.012, hh, w / n * 0.9, k % 2 ? c1 : c2, { jit: 0, emit: 0.15 }); }
    }
  }
  function billboard(mb, x, y, z, w, h, str, col, bg = '#1a1430', rot = 0) {
    mb.at(x, y, z, rot);
    for (const sx of [-w / 3, w / 3]) mb.box(sx, -y, -0.2, 0.1, y + 0.1, 0.1, P.iron, { mat: W(MT.metal, 0.8) });
    mb.box(0, 0, 0, w + 0.2, h + 0.2, 0.15, '#22222a', { mat: W(MT.metal, 0.7) });
    mb.box(0, 0.1, 0.08, w, h, 0.02, bg, { emit: 0.35, jit: 0 });
    const px = Math.min(h / 10, w / textWidth(str, 1) * 0.85);
    text(mb, str, 0, h / 2 - px * 3.5 + 0.1, 0.11, px, col, { emit: 1.4, mat: MT.neon });
    for (let k = 0; k < 3; k++) mb.box(-w / 3 + k * w / 3, -0.1, 0.3, 0.12, 0.06, 0.3, '#e8f0ff', { emit: 1.2, jit: 0 });
    mb.pop();
  }

  // ---------------- vehicles (built around origin, facing +z) ----------------
  function car(kind = 'sedan', col = '#c84a3c', seed = 0) {
    const mb = new MB(); mb.jit = 0.02;
    const L = kind === 'van' ? 2.3 : kind === 'limo' ? 3.0 : kind === 'sports' ? 2.0 : 2.1;
    const Wd = kind === 'van' ? 1.0 : 0.95;
    const body = col, dark = shade(col, 0.75);
    const o = { mat: W(MT.metal, kind === 'wreck' ? 0.9 : 0.15) };
    // wheels
    for (const sx of [-Wd / 2 + 0.05, Wd / 2 - 0.05]) for (const sz of [-L / 2 + 0.38, L / 2 - 0.38]) {
      mb.at(sx, 0.17, sz, 0, 1, 0, Math.PI / 2); mb.cyl(0, -0.08, 0, 0.17, 0.16, 8, '#18181c'); mb.cyl(0, -0.085, 0, 0.09, 0.17, 6, '#8a8a92'); mb.pop();
    }
    if (kind === 'van') {
      mb.box(0, 0.18, 0, Wd, 1.0, L, body, Object.assign({ front: dark }, o));
      mb.box(0, 0.68, L / 2 - 0.02, Wd - 0.12, 0.4, 0.04, '#2a3a4a', { mat: W(MT.glass, 0.1) });
      mb.box(Wd / 2 + 0.01, 0.7, L / 2 - 0.45, 0.02, 0.35, 0.5, '#2a3a4a', { mat: W(MT.glass, 0.1) });
      mb.box(-Wd / 2 - 0.01, 0.7, L / 2 - 0.45, 0.02, 0.35, 0.5, '#2a3a4a', { mat: W(MT.glass, 0.1) });
    } else {
      const hb = kind === 'sports' ? 0.32 : 0.4;
      mb.box(0, 0.2, 0, Wd, hb, L, body, Object.assign({ front: dark }, o));
      const cl = kind === 'limo' ? L - 1.0 : kind === 'sports' ? L * 0.4 : L * 0.5;
      const ch = kind === 'sports' ? 0.26 : 0.34;
      mb.box(0, 0.2 + hb, kind === 'sports' ? -0.15 : -0.05, Wd - 0.12, ch, cl, body, Object.assign({ taper: 0.06 }, o));
      // windows
      mb.box(0, 0.24 + hb, -0.05 + cl / 2 - 0.02, Wd - 0.26, ch - 0.1, 0.03, '#2a3a4a', { mat: W(MT.glass, 0.1) });
      mb.box(0, 0.24 + hb, -0.05 - cl / 2 + 0.02, Wd - 0.26, ch - 0.1, 0.03, '#2a3a4a', { mat: W(MT.glass, 0.1) });
      for (const s of [-1, 1]) mb.box(s * (Wd / 2 - 0.05), 0.25 + hb, -0.05, 0.03, ch - 0.12, cl - 0.25, '#2a3a4a', { mat: W(MT.glass, 0.1) });
    }
    // lights
    for (const s of [-1, 1]) {
      mb.box(s * (Wd / 2 - 0.16), 0.38, L / 2 + 0.005, 0.2, 0.08, 0.02, '#fff2c0', { emit: 1.2, jit: 0 });
      mb.box(s * (Wd / 2 - 0.16), 0.38, -L / 2 - 0.005, 0.2, 0.08, 0.02, '#ff3030', { emit: 1.0, jit: 0 });
    }
    mb.box(0, 0.22, L / 2 + 0.02, Wd - 0.1, 0.07, 0.04, '#9a9aa2'); mb.box(0, 0.22, -L / 2 - 0.02, Wd - 0.1, 0.07, 0.04, '#9a9aa2');
    if (kind === 'taxi') { mb.box(0, 0.94, -0.05, 0.4, 0.12, 0.18, '#ffe27a', { emit: 0.9, jit: 0 }); text(mb, 'TAXI', 0, 0.955, 0.045, 0.012, '#222', {}); for (let k = 0; k < 8; k++) mb.box(Wd / 2 + 0.005, 0.3, -0.8 + k * 0.2, 0.01, 0.06, 0.1, k % 2 ? '#222' : '#ffe27a', { jit: 0 }); }
    if (kind === 'police') {
      mb.box(0, 0.94, -0.05, 0.6, 0.1, 0.18, '#222');
      mb.box(-0.16, 0.98, -0.05, 0.24, 0.08, 0.16, '#ff2a3a', { emit: 1.6, jit: 0 }); mb.box(0.16, 0.98, -0.05, 0.24, 0.08, 0.16, '#2a6aff', { emit: 1.6, jit: 0 });
      for (const s of [-1, 1]) mb.box(s * (Wd / 2 + 0.005), 0.28, 0, 0.01, 0.24, 1.1, P.white, { jit: 0 });
      text(mb, 'POLICE', Wd / 2 + 0.02, 0.32, 0, 0.022, '#1a2a5a', { dir: 'z' });
    }
    return mb;
  }
  function bus() {
    const mb = new MB(); const L = 4.4, Wd = 1.1;
    for (const sx of [-Wd / 2 + 0.05, Wd / 2 - 0.05]) for (const sz of [-L / 2 + 0.6, L / 2 - 0.7]) { mb.at(sx, 0.2, sz, 0, 1, 0, Math.PI / 2); mb.cyl(0, -0.08, 0, 0.2, 0.16, 8, '#18181c'); mb.pop(); }
    mb.box(0, 0.22, 0, Wd, 1.35, L, '#e8b23a', { mat: W(MT.metal, 0.3), top: '#d8d8d0' });
    for (let k = 0; k < 6; k++) for (const s of [-1, 1]) mb.box(s * (Wd / 2 + 0.005), 0.9, -L / 2 + 0.5 + k * 0.62, 0.02, 0.45, 0.5, '#2a3a4a', { mat: W(MT.glass, 0.1), emit: 0.25 });
    mb.box(0, 0.9, L / 2 + 0.005, Wd - 0.15, 0.5, 0.02, '#2a3a4a', { mat: W(MT.glass, 0.1) });
    mb.box(0, 1.42, L / 2 + 0.01, 0.8, 0.12, 0.02, '#ffb02a', { emit: 1.2, jit: 0 });
    for (const s of [-1, 1]) mb.box(s * 0.38, 0.4, L / 2 + 0.01, 0.16, 0.1, 0.02, '#fff2c0', { emit: 1.2, jit: 0 });
    return mb;
  }

  // ---------------- docks & construction ----------------
  function container(mb, x, z, rot = 0, col = '#b8443a', y = 0) {
    mb.at(x, y, z, rot);
    mb.box(0, 0, 0, 2.4, 1.25, 1.1, col, { mat: W(MT.metal, 0.75), top: shade(col, 1.1) });
    for (let k = -1.1; k <= 1.11; k += 0.22) mb.box(k, 0.05, 0.56, 0.06, 1.15, 0.02, shade(col, 0.85), { mat: W(MT.metal, 0.8) });
    mb.pop();
  }
  function crate(mb, x, z, s = 0.6, y = 0, col = '#8a6a44') {
    mb.box(x, y, z, s, s, s, col, { mat: W(MT.wood, 0.6) });
    mb.box(x, y + s * 0.45, z, s + 0.02, 0.06, s + 0.02, shade(col, 0.8), { mat: W(MT.wood, 0.6) });
  }
  function pallet(mb, x, z) { for (let k = 0; k < 4; k++) mb.box(x - 0.36 + k * 0.24, 0.2, z, 0.18, 0.05, 0.9, P.woodL, { mat: W(MT.wood, 0.7) }); mb.box(x, 0.14, z, 0.9, 0.06, 0.9, P.woodD); }
  function bollard(mb, x, z) { mb.cyl(x, 0.2, z, 0.14, 0.4, 7, '#2a2a30', { mat: W(MT.metal, 0.8) }); mb.cyl(x, 0.6, z, 0.18, 0.08, 7, '#2a2a30'); }
  function crane(mb, x, z, h = 16, arm = 11, rot = 0) {
    const o = { mat: W(MT.metal, 0.4) }, y0 = 0.04;
    mb.box(x, y0, z, 1.6, 0.4, 1.6, '#6a6a70', { mat: W(MT.concrete, 0.6) });
    for (let k = 0; k < h; k += 1) {
      for (const [dx, dz] of [[-0.35, -0.35], [0.35, -0.35], [-0.35, 0.35], [0.35, 0.35]]) mb.box(x + dx, y0 + 0.4 + k, z + dz, 0.08, 1.0, 0.08, '#e8b62a', o);
      mb.at(x, y0 + 0.4 + k + 0.5, z + 0.36, 0, 1, 0, 0.8); mb.box(0, -0.62, 0, 0.05, 1.24, 0.05, '#e8b62a', o); mb.pop();
      mb.at(x + 0.36, y0 + 0.4 + k + 0.5, z, 0, 1, 0.8, 0); mb.box(0, -0.62, 0, 0.05, 1.24, 0.05, '#e8b62a', o); mb.pop();
    }
    const top = y0 + 0.4 + h;
    mb.box(x, top, z, 1.0, 0.9, 1.0, '#e8b62a', o);
    mb.box(x + 0.2, top + 0.15, z + 0.51, 0.5, 0.4, 0.02, '#2a3a4a', { mat: W(MT.glass, 0.2) });
    mb.at(x, top + 0.9, z, rot);
    mb.box(0, 0, arm / 2 - 1.5, 0.5, 0.5, arm, '#e8b62a', o);
    mb.box(0, 0, -2.6, 0.9, 0.7, 1.4, '#7a7a80', { mat: W(MT.concrete, 0.5) });
    mb.cyl(0, 0.5, 0, 0.05, 2.2, 4, '#e8b62a');
    mb.box(0, -5.55, arm - 2.5, 0.04, 5.5, 0.04, '#222'); mb.box(0, -5.6, arm - 2.5, 0.4, 0.3, 0.3, '#c83a2a');
    mb.box(0, 2.6, 0, 0.12, 0.12, 0.12, '#ff3030', { emit: 1.6, jit: 0 });
    mb.pop();
    return { x, y: top + 3.5, z };
  }
  function scaffold(mb, x0, z0, w, d, floors) {
    const o = { mat: W(MT.metal, 0.6) };
    for (let f = 0; f <= floors; f++) {
      const y = f * STOREY + 0.05;
      mb.box(x0 + w / 2, y, z0 + d, w, 0.05, 0.6, P.woodL, { mat: W(MT.wood, 0.7) });
      mb.box(x0 + w / 2, y + 1.0, z0 + d + 0.28, w, 0.04, 0.04, '#9aa0a8', o);
    }
    for (let k = 0; k <= w + 0.01; k += 1.5) for (const dz of [0, 0.56]) mb.box(x0 + k, 0.05, z0 + d + dz - 0.28, 0.05, floors * STOREY + 1.1, 0.05, '#9aa0a8', o);
  }
  function concreteFrame(mb, x0, z0, w, d, floors, wear = 0.5) {
    // unfinished tower: slabs + columns, rebar on top
    const o = { mat: W(MT.concrete, wear) };
    for (let f = 0; f < floors; f++) {
      const y = f * STOREY;
      mb.box(x0 + w / 2, y + STOREY - 0.2, z0 + d / 2, w, 0.2, d, '#8a8680', Object.assign({ top: '#9a968e' }, o));
      for (let i = 0; i <= w + 0.01; i += w / 4) for (let j = 0; j <= d + 0.01; j += d / 3) mb.box(x0 + Math.min(i, w - 0.2) + 0.1, y, z0 + Math.min(j, d - 0.2) + 0.1, 0.25, STOREY - 0.2, 0.25, '#7a7670', o);
    }
    const top = floors * STOREY;
    for (let i = 0.2; i < w; i += 0.6) mb.box(x0 + i, top, z0 + 0.3, 0.03, 0.6, 0.03, '#8a4a2a');
    return top;
  }
  function pierPosts(mb, x0, z0, x1, z1) { for (let x = x0; x <= x1; x += 1.5) for (const z of [z0, z1]) mb.cyl(x, -1.2, z, 0.12, 1.42, 6, '#4a3626', { mat: W(MT.wood, 0.8) }); }

  // the metro entrance (stairs down into the ground), opening faces +z
  function metroEntrance(mb, x, z, w = 3, d = 5) {
    const o = { mat: W(MT.concrete, 0.8) };
    const cx = x + w / 2;
    // side walls
    for (const sx of [x, x + w]) { mb.box(sx, -2.2, z + d / 2, 0.3, 2.85, d, '#8a8680', Object.assign({ top: '#a09a90' }, o)); }
    mb.box(cx, -2.2, z, w + 0.3, 2.85, 0.3, '#8a8680', o);
    // steps going down to the north
    const n = 11;
    for (let k = 0; k < n; k++) {
      const y = 0.14 - (k + 1) * 0.2, zz = z + d - (k + 0.5) * (d - 0.6) / n;
      mb.box(cx, -2.5, zz, w - 0.3, y + 2.5, (d - 0.6) / n, '#9a958e', { mat: W(MT.slab, 0.85), top: '#a8a39a' });
    }
    // blue-lit tunnel mouth
    mb.box(cx, -2.2, z + 0.25, w - 0.3, 2.0, 0.05, '#2a2aa0', { emit: 0.7, jit: 0 });
    // railings
    const ro = { mat: W(MT.metal, 0.9) };
    for (const sx of [x - 0.02, x + w + 0.02]) {
      mb.box(sx, 1.05, z + d / 2, 0.06, 0.06, d, P.rust, ro); mb.box(sx, 0.62, z + d / 2, 0.05, 0.05, d, P.rust, ro);
      for (let k = 0; k <= d; k += 0.5) mb.box(sx, 0.14, z + k, 0.05, 0.95, 0.05, P.rust, ro);
    }
    mb.box(cx, 1.05, z - 0.02, w, 0.06, 0.06, P.rust, ro);
    // sign post
    mb.box(x + w + 0.4, 0.14, z + d - 0.3, 0.1, 2.6, 0.1, P.iron);
    mb.box(x + w + 0.4, 2.3, z + d - 0.3, 0.12, 0.6, 1.5, '#2a3aa0', { emit: 0.5, jit: 0 });
    text(mb, 'METRO', x + w + 0.47, 2.38, z + d - 0.3, 0.05, P.white, { dir: 'z', emit: 1.2 });
    return { x: cx, y: -1, z: z + 0.6 };
  }

  window.CITY = {
    STOREY, GROUND, ground, laneDash, stripe, crosswalk, manhole, building, storefront, bladeSign, fireEscape, waterTower,
    streetLamp, hydrant, trashCan, trashBags, dumpster, bench, busStop, phoneBooth, newsBox, vending, iceMachine, trafficLight, cone, barrier,
    chainFence, lowWall, planterTree, palm, bush, graffiti, billboard, car, bus, container, crate, pallet, bollard, crane, scaffold, concreteFrame, pierPosts, metroEntrance,
  };
})();
