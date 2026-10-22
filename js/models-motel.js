// The Starlite: five tiers, from a wrecked roadside motel to a glass luxury tower.
// Lot: x 3..24, z 8..42. Boulevard sidewalk starts at x = 24.
(function () {
  const { MB, MT, W, P, text, textWidth, neonRect, R, shade } = KIT;
  const C = CITY, S = C.STOREY;
  const LOT = { x0: 3, z0: 8, x1: 24, z1: 42 };
  const WING = { x: 4, z: 10, w: 18, d: 5 }; // tiers 1-3 room wing, doors face south at z = 15
  const OFFICE = { x: 17, z: 31, w: 6, d: 6 }; // tiers 1-3 office, door faces east at x = 23
  const TIERS = [null,
    { name: 'Starlite Motel', wear: 0.92, wall: '#d8a2aa', trim: '#8a5a62', door: '#4f8a86', rooms: 6, floors: 1 },
    { name: 'Starlite Motel', wear: 0.2, wall: '#f2b6c2', trim: '#3f9a92', door: '#3fb8a8', rooms: 6, floors: 1 },
    { name: 'Starlite Inn', wear: 0.15, wall: '#f4e2c8', trim: '#3f8a9a', door: '#e8733a', rooms: 12, floors: 2 },
    { name: 'Starlite Hotel', wear: 0.08, wall: '#efe6d6', trim: '#2c3e5a', door: '#2c3e5a', rooms: 40, floors: 5 },
    { name: 'The Starlite Grand', wear: 0, wall: '#1c2436', trim: '#c9a14a', door: '#c9a14a', rooms: 120, floors: 16 },
  ];

  function roomDoor(k, tier) {
    const up = k >= 6, i = k % 6;
    return { x: WING.x + i * 3 + 1.0, z: WING.z + WING.d, y: up ? S : 0, up };
  }

  // ---------- tiers 1-3: the room wing ----------
  function wing(mb, glow, tier) {
    const T = TIERS[tier], wear = T.wear;
    const H = T.floors * S + 0.2;
    const cx = WING.x + WING.w / 2, cz = WING.z + WING.d / 2;
    mb.box(cx, 0.1, cz, WING.w, H, WING.d, T.wall, { mat: W(MT.plaster, wear), topMat: W(MT.roof, wear), top: P.roof });
    // base course
    mb.box(cx, 0.1, WING.z + WING.d + 0.01, WING.w, 0.35, 0.04, shade(T.trim, 0.9), { mat: W(MT.concrete, wear) });
    // walkway slab + overhang per floor
    for (let f = 0; f < T.floors; f++) {
      const y = f * S;
      if (f === 0) mb.box(cx, 0.1, WING.z + WING.d + 0.8, WING.w + 0.4, 0.12, 1.6, '#a8a29a', { mat: W(MT.slab, wear) });
      // overhang / balcony above this floor
      mb.box(cx, y + S, WING.z + WING.d + 0.8, WING.w + 0.6, 0.16, 1.7, shade(T.trim, 1.1), { mat: W(MT.concrete, wear), top: f === T.floors - 1 ? P.roof : '#a8a29a', topMat: f === T.floors - 1 ? W(MT.roof, wear) : W(MT.slab, wear) });
      // posts
      for (let k = 0; k <= 6; k++) mb.box(WING.x + k * 3 - (k === 6 ? 0.1 : -0.1), y + 0.22, WING.z + WING.d + 1.5, 0.12, S - 0.06, 0.12, T.trim, { mat: W(MT.metal, wear) });
      // balcony railing on upper floors
      if (f >= 1) {
        mb.box(cx, y + S * 0 + 0.75, WING.z + WING.d + 1.6, WING.w + 0.4, 0.06, 0.06, T.trim, { mat: W(MT.metal, wear) });
        for (let x = WING.x - 0.1; x <= WING.x + WING.w + 0.1; x += 0.3) mb.box(x, y + 0.1, WING.z + WING.d + 1.6, 0.04, 0.68, 0.04, T.trim, { mat: W(MT.metal, wear) });
      }
    }
    // fascia sign over the walkway
    if (tier >= 2) {
      const sx = cx, sy = T.floors * S + 0.25, sz = WING.z + WING.d + 1.66;
      mb.box(sx, sy - 0.12, sz, 7, 0.36, 0.06, '#1a1a26');
      text(mb, tier === 3 ? 'STARLITE INN' : 'STARLITE MOTEL', sx, sy - 0.07, sz + 0.05, 0.035, P.neonPink, { emit: 1.5, mat: MT.neon });
    }
    // exterior stairs at the east end for two floors
    if (T.floors >= 2) {
      const sx = WING.x + WING.w + 0.7;
      for (let k = 0; k < 10; k++) mb.box(sx, 0.1 + k * S / 10, WING.z + WING.d + 1.5 - k * 0.42, 1.0, S / 10, 0.42, '#a8a29a', { mat: W(MT.slab, wear) });
      mb.box(sx + 0.5, 0.1, WING.z + WING.d - 1.2, 0.08, S + 1, 0.08, T.trim);
    }
    // side windows on the east gable
    for (let f = 0; f < T.floors; f++) mb.box(WING.x + WING.w + 0.01, f * S + 0.8, cz, 0.04, 0.7, 1.0, P.glassD, { mat: W(MT.glass, wear) });
    // roof clutter
    for (let k = 0; k < 3; k++) mb.box(WING.x + 2 + k * 6, H + 0.1, WING.z + 1.5, 0.9, 0.5, 0.7, '#9a9a96', { mat: W(MT.metal, wear) });
  }
  // a single room front (door, window, number, AC) - rebuilt when the room's state changes
  // st: 'broken' | 'dirty' | 'clean' | 'occupied' | 'request'
  function roomFront(mb, k, tier, st) {
    const T = TIERS[Math.min(tier, 3)], wear = T.wear, d = roomDoor(k, tier);
    const z = d.z + 0.01, y = d.y + 0.22;
    // door
    const dc = st === 'broken' ? shade(T.door, 0.6) : T.door;
    mb.box(d.x, y, z, 0.8, 1.5, 0.06, dc, { mat: W(MT.wood, st === 'broken' ? 0.95 : wear) });
    mb.box(d.x, y + 1.5, z + 0.02, 0.92, 0.08, 0.08, T.trim);
    mb.box(d.x + 0.28, y + 0.72, z + 0.06, 0.06, 0.06, 0.04, P.brass);
    // number plate
    mb.box(d.x, y + 1.15, z + 0.05, 0.3, 0.2, 0.02, '#e8e2d0', { jit: 0 });
    text(mb, String(k + 1), d.x, y + 1.18, z + 0.07, 0.02, '#222', {});
    // window
    const wx = d.x + 1.35;
    if (st === 'broken') {
      mb.box(wx, y + 0.55, z, 1.0, 0.8, 0.04, P.glassD, { mat: W(MT.glass, 0.99) });
      for (let b = 0; b < 3; b++) { mb.at(wx, y + 0.65 + b * 0.25, z + 0.06, 0, 1, 0, (b - 1) * 0.12); mb.box(0, 0, 0, 1.2, 0.16, 0.04, '#9a7a52', { mat: W(MT.wood, 0.9) }); mb.pop(); }
    } else {
      const lit = st === 'occupied' || st === 'request';
      mb.box(wx, y + 0.55, z, 1.0, 0.8, 0.04, lit ? '#ffc96a' : P.glass, { mat: W(MT.glass, wear * 0.3), emit: lit ? 0.75 : 0 });
      // curtains
      mb.box(wx - 0.38, y + 0.55, z + 0.03, 0.22, 0.8, 0.02, tier >= 2 ? '#c84a5a' : '#8a6a5a', { jit: 0 });
      mb.box(wx + 0.38, y + 0.55, z + 0.03, 0.22, 0.8, 0.02, tier >= 2 ? '#c84a5a' : '#8a6a5a', { jit: 0 });
    }
    mb.box(wx, y + 0.47, z + 0.06, 1.12, 0.08, 0.12, T.trim);
    // AC unit
    mb.box(wx, y + 0.08, z + 0.2, 0.55, 0.36, 0.36, st === 'broken' ? '#7a7066' : '#c8c8c0', { mat: W(MT.metal, st === 'broken' ? 0.95 : wear) });
    // do-not-disturb / dirty marker
    if (st === 'dirty') { mb.box(d.x - 0.5, y + 0.1, z + 0.35, 0.35, 0.3, 0.3, '#2a2a2e'); mb.box(d.x - 0.62, y + 0.12, z + 0.5, 0.25, 0.16, 0.2, '#e8e2d8'); }
    if (st === 'request') mb.box(d.x, y + 1.72, z + 0.06, 0.16, 0.16, 0.04, '#ffd84a', { emit: 1.5, jit: 0 });
    return d;
  }

  // ---------- tiers 1-3: office ----------
  function office(mb, glow, tier, lightsOn) {
    const T = TIERS[tier], wear = T.wear;
    const o = OFFICE, cx = o.x + o.w / 2, cz = o.z + o.d / 2;
    const H = S + 0.4;
    mb.box(cx, 0.1, cz, o.w, H, o.d, T.wall, { mat: W(MT.plaster, wear), topMat: W(MT.roof, wear), top: P.roof });
    mb.box(cx, H + 0.1, cz, o.w + 0.2, 0.18, o.d + 0.2, T.trim, { mat: W(MT.concrete, wear), noTop: true });
    // glass front on the east (street) side, door at z = 34
    const fx = o.x + o.w + 0.01;
    mb.box(fx, 0.32, cz - 1.3, 0.05, 1.3, 2.2, lightsOn ? '#ffd890' : P.glass, { mat: W(MT.glass, wear), emit: lightsOn ? 0.45 : 0 });
    mb.box(fx, 0.22, cz + 1.0, 0.06, 1.55, 0.85, lightsOn ? '#ffd890' : P.glassD, { mat: W(MT.glass, wear * 0.6), emit: lightsOn ? 0.35 : 0 });
    mb.box(fx + 0.03, 1.77, cz + 1.0, 0.06, 0.08, 0.95, T.trim);
    mb.box(fx + 0.03, 0.22, cz + 0.55, 0.06, 1.6, 0.08, T.trim); mb.box(fx + 0.03, 0.22, cz + 1.45, 0.06, 1.6, 0.08, T.trim);
    // "OFFICE" neon over the door
    mb.box(fx + 0.05, 1.95, cz - 0.4, 0.06, 0.38, 2.0, '#16161e');
    text(mb, 'OFFICE', fx + 0.1, 2.01, cz - 0.4, 0.04, lightsOn ? P.neonCyan : '#2a4a50', { dir: 'z', emit: lightsOn ? 1.6 : 0, mat: MT.neon });
    // south side window
    mb.box(cx - 0.6, 0.8, o.z + o.d + 0.01, 1.6, 0.9, 0.04, lightsOn ? '#ffd890' : P.glassD, { mat: W(MT.glass, wear), emit: lightsOn ? 0.4 : 0 });
    // canopy for tier 3
    if (tier >= 3) {
      mb.box(fx + 1.3, S + 0.1, cz + 1.0, 2.6, 0.14, 2.4, T.trim, { mat: W(MT.metal, 0.1) });
      for (const dz of [-1, 1]) mb.box(fx + 2.4, 0.14, cz + 1.0 + dz, 0.12, S, 0.12, T.trim);
    }
    // bell sign
    if (lightsOn && glow) glow.push([fx + 0.6, 1.2, cz, true]);
  }

  // ---------- the roadside sign ----------
  // state: 'dead' (tier 1 before the fuse is fixed), 'flicker', 'on'; vac: true = VACANCY lit, false = NO VACANCY
  function sign(mb, tier, state, vac) {
    const x = 22.6, z = 39.2;
    const on = state !== 'dead';
    const big = tier >= 3;
    const h = big ? 6.5 : 5.2;
    mb.box(x, 0.14, z, 0.8, 0.4, 0.8, '#7a7670', { mat: W(MT.concrete, 0.7) });
    mb.cyl(x, 0.5, z, 0.14, h - 0.5, 8, tier === 1 ? '#6a5048' : '#d8d2c8', { mat: W(MT.metal, tier === 1 ? 0.9 : 0.2) });
    // the star
    const sy = h + 0.4;
    const starC = on ? '#ffd84a' : '#5a5040';
    const em = on ? 1.6 : 0;
    for (let k = 0; k < 5; k++) { mb.at(x, sy + 1.2, z, 0, 1, 0, k * Math.PI * 2 / 5); mb.box(-0.09, 0, -0.06, 0.18, 0.9, 0.12, starC, { emit: em, mat: MT.neon }); mb.pop(); }
    // main board (faces +x toward the street and -x too)
    const bw = big ? 4.6 : 3.8;
    mb.box(x, h - 0.9, z, 0.3, 1.5, bw, tier >= 2 ? '#1c3a5a' : '#3a3a48', { mat: W(MT.metal, tier === 1 ? 0.95 : 0.1) });
    neonRect(mb, x + 0.17, h - 0.85, z, bw - 0.2, 1.4, on ? P.neonPink : '#4a2a3a', 0.05, 'z', em);
    const title = tier >= 5 ? 'GRAND' : tier >= 4 ? 'HOTEL' : tier >= 3 ? 'INN' : 'MOTEL';
    // STARLITE in script-ish caps, broken letters dark on tier 1
    const word = 'STARLITE';
    text(mb, word, x + 0.18, h - 0.2, z, 0.06, on ? P.neonCyan : '#2a4a50', { dir: 'z', emit: em, mat: MT.neon, colFn: i => (tier === 1 && (i === 2 || i === 6)) || !on ? '#2a4a50' : P.neonCyan });
    text(mb, title, x + 0.18, h - 0.72, z, 0.06, on ? P.neonPink : '#4a2a3a', { dir: 'z', emit: em, mat: MT.neon });
    // vacancy box below
    const vy = h - 2.0;
    mb.box(x, vy, z, 0.24, 0.62, bw * 0.8, '#16161e');
    const vacOn = on && vac, noOn = on && !vac;
    text(mb, 'NO', x + 0.13, vy + 0.15, z + bw * 0.3, 0.045, noOn ? P.neonRed : '#3a1a1a', { dir: 'z', emit: noOn ? 1.7 : 0, mat: MT.neon });
    text(mb, 'VACANCY', x + 0.13, vy + 0.15, z - 0.28, 0.045, on ? P.neonRed : '#3a1a1a', { dir: 'z', emit: on ? 1.7 : 0, mat: MT.neon });
    return { x: x + 1.2, y: h - 0.5, z, on };
  }

  // ---------- pool ----------
  const POOL = { x: 5, z: 20, w: 7, d: 6 };
  function pool(mb, tier, full) {
    const p = POOL, cx = p.x + p.w / 2, cz = p.z + p.d / 2;
    const wear = tier === 1 ? 0.95 : 0.1;
    // deck is ground tile 'pooldeck'; basin walls go down
    const depth = 1.1;
    mb.box(cx, -depth, cz, p.w, 0.02, p.d, tier === 1 ? '#7a8a8a' : '#5ac8d8', { mat: W(MT.tile, wear) });
    for (const [x, z, w, d] of [[cx, p.z + 0.05, p.w, 0.1], [cx, p.z + p.d - 0.05, p.w, 0.1], [p.x + 0.05, cz, 0.1, p.d], [p.x + p.w - 0.05, cz, 0.1, p.d]])
      mb.box(x, -depth, z, w, depth + 0.14, d, tier === 1 ? '#8a9a9a' : '#7ad8e8', { mat: W(MT.tile, wear), top: '#d8d2c4' });
    // coping
    if (full) {
      mb.box(cx, -0.25, cz, p.w - 0.2, 0.02, p.d - 0.2, '#3ab8d8', { mat: W(MT.water, 0), emit: tier >= 4 ? 0.25 : 0.1 });
    } else {
      // dead leaves and a shopping cart
      for (let k = 0; k < 14; k++) mb.box(p.x + 0.5 + R(k, 1, 3) * (p.w - 1), -depth + 0.02, p.z + 0.5 + R(k, 2, 3) * (p.d - 1), 0.12, 0.02, 0.08, '#7a5a2a');
      C.graffiti(mb, cx, -depth + 0.15, p.z + 0.11, 3.2, 0.7, 7, 'x');
    }
    // ladder
    for (const s of [-0.18, 0.18]) mb.box(p.x + p.w - 0.6 + s, -depth + 0.1, p.z + 0.12, 0.04, depth + 0.6, 0.04, P.chrome);
  }
  function poolDeckProps(mb, tier) {
    if (tier < 2) return;
    const p = POOL;
    const lc = tier >= 4 ? '#f2f2ea' : '#ffffff';
    for (let k = 0; k < 3; k++) lounger(mb, p.x + 1 + k * 2.2, p.z + p.d + 1.2, lc);
    umbrella(mb, p.x + p.w + 1.1, p.z + 1.5, tier >= 4 ? '#2c3e5a' : '#e8733a');
    if (tier >= 3) umbrella(mb, p.x + p.w + 1.1, p.z + 4.2, tier >= 4 ? '#c9a14a' : '#3fb8a8');
  }
  function lounger(mb, x, z, col) {
    mb.box(x, 0.14, z, 0.7, 0.25, 1.6, col, { mat: W(MT.plain, 0) });
    mb.at(x, 0.39, z - 0.55, 0, 1, 0.6); mb.box(0, 0, 0.2, 0.7, 0.06, 0.6, col); mb.pop();
  }
  function umbrella(mb, x, z, col) {
    mb.cyl(x, 0.14, z, 0.04, 2.0, 5, P.white);
    mb.cone(x, 1.8, z, 1.1, 0.5, 8, col, { sway: 0.1 });
    mb.box(x, 0.14, z, 0.8, 0.6, 0.8, P.white, { taper: 0.1 });
  }

  // ---------- tier 4: hotel block ----------
  function hotel(mb, glow, tier, lit) {
    const T = TIERS[4];
    const x0 = 4, z0 = 9, w = 18, d = 8, floors = 5;
    const H = floors * S + 0.3, cx = x0 + w / 2, cz = z0 + d / 2;
    mb.box(cx, 0.1, cz, w, H, d, T.wall, { mat: W(MT.plaster, 0.1), topMat: W(MT.roof, 0.3), top: P.roof });
    mb.box(cx, 0.1, z0 + d + 0.02, w, S, 0.06, '#8a4636', { mat: W(MT.brick, 0.15) });
    // lobby glass at ground floor centre
    mb.box(cx, 0.15, z0 + d + 0.06, 7, 1.7, 0.05, '#ffd890', { mat: W(MT.glass, 0), emit: 0.5 });
    for (let k = 0; k <= 7; k++) mb.box(cx - 3.5 + k, 0.15, z0 + d + 0.09, 0.07, 1.7, 0.05, T.trim);
    // canopy
    mb.box(cx, S + 0.1, z0 + d + 1.2, 8, 0.18, 2.6, T.trim, { mat: W(MT.metal, 0) });
    for (const sx of [-3.6, 3.6]) mb.box(cx + sx, 0.14, z0 + d + 2.3, 0.14, S, 0.14, P.brass);
    text(mb, 'STARLITE HOTEL', cx, S + 0.02, z0 + d + 2.52, 0.04, P.brass, { emit: 1.2, mat: MT.neon });
    // balconies and windows
    for (let f = 1; f < floors; f++) for (let k = 0; k < 9; k++) {
      const x = x0 + 1 + k * 2, y = f * S + 0.2;
      const lt = R(k, f, 3) < (lit ? 0.6 : 0.15);
      mb.box(x, y + 0.2, z0 + d + 0.01, 1.2, 1.3, 0.04, lt ? (R(k, f, 5) > 0.3 ? '#ffc870' : '#a8d8ff') : P.glass, { mat: W(MT.glass, 0), emit: lt ? 0.42 : 0 });
      mb.box(x, y, z0 + d + 0.4, 1.5, 0.08, 0.8, '#d8d2c8', { mat: W(MT.concrete, 0.1) });
      mb.box(x, y + 0.08, z0 + d + 0.79, 1.5, 0.55, 0.03, '#9ad8e8', { mat: W(MT.glass, 0) });
    }
    // east facade windows
    for (let f = 1; f < floors; f++) for (let k = 0; k < 3; k++) mb.box(x0 + w + 0.01, f * S + 0.5, z0 + 1.5 + k * 2.5, 0.04, 1.0, 1.2, R(k, f, 8) < 0.5 ? '#ffd890' : P.glass, { mat: W(MT.glass, 0), emit: R(k, f, 8) < 0.5 ? 0.6 : 0 });
    // roof sign
    const ry = H + 0.2;
    for (const sx of [-4, 4]) mb.box(cx + sx, ry, z0 + d - 0.8, 0.1, 0.6, 0.1, P.iron);
    mb.box(cx, ry + 0.5, z0 + d - 0.8, 9.6, 1.3, 0.12, '#14141c');
    text(mb, 'STARLITE', cx, ry + 0.66, z0 + d - 0.7, 0.13, P.neonPink, { emit: 1.8, mat: MT.neon });
    for (let k = 0; k < 4; k++) mb.box(x0 + 3 + k * 4, H + 0.1, z0 + 2, 1.2, 0.8, 1.0, '#9a9a96', { mat: W(MT.metal, 0.3) });
  }
  // old office becomes a lounge bar for tier 4+
  function lounge(mb, tier) {
    const o = OFFICE, cx = o.x + o.w / 2, cz = o.z + o.d / 2;
    mb.box(cx, 0.1, cz, o.w, S + 0.6, o.d, '#2a2236', { mat: W(MT.plaster, 0.05), top: P.roof, topMat: W(MT.roof, 0.2) });
    mb.box(o.x + o.w + 0.01, 0.25, cz, 0.05, 1.6, o.d - 1, '#ff7ac0', { mat: W(MT.glass, 0), emit: 0.45 });
    mb.box(o.x + o.w + 0.05, S + 0.0, cz, 0.08, 0.5, 3.6, '#14141c');
    text(mb, tier >= 5 ? 'VELVET' : 'LOUNGE', o.x + o.w + 0.1, S + 0.07, cz, 0.05, P.neonPurple, { dir: 'z', emit: 1.8, mat: MT.neon });
  }

  // ---------- tier 5: the Grand ----------
  function grand(mb, glow, lit) {
    const T = TIERS[5];
    // podium
    const px = 4, pz = 9, pw = 18, pd = 9;
    const pod = 3 * S;
    mb.box(px + pw / 2, 0.1, pz + pd / 2, pw, pod, pd, '#2a2a34', { mat: W(MT.marble, 0), top: '#3a3a44', topMat: W(MT.slab, 0) });
    for (let f = 0; f < 3; f++) for (let k = 0; k < 8; k++) {
      const lt = f === 0 || R(k, f, 4) < 0.7;
      mb.box(px + 1.2 + k * 2.2, f * S + 0.3, pz + pd + 0.01, 1.9, 1.5, 0.04, lt ? '#ffc880' : '#2a3a5a', { mat: W(MT.glass, 0), emit: lt ? 0.5 : 0.05 });
    }
    for (let k = 0; k <= 8; k++) mb.box(px + 0.1 + k * 2.2, 0.1, pz + pd + 0.04, 0.12, pod, 0.08, T.trim, { mat: W(MT.metal, 0) });
    // tower
    const tx = 7, tz = 10, tw = 12, td = 6, floors = 16;
    const top = pod + floors * S;
    mb.box(tx + tw / 2, pod, tz + td / 2, tw, floors * S, td, '#1a2234', { mat: W(MT.glass, 0), top: '#2a2a34', topMat: W(MT.slab, 0) });
    for (let f = 0; f < floors; f++) {
      const y = pod + f * S;
      for (let k = 0; k < 6; k++) {
        const lt = R(k, f, 11) < (lit ? 0.42 : 0.12);
        const warm = R(k, f, 12) > 0.25;
        mb.box(tx + 1 + k * 2, y + 0.3, tz + td + 0.01, 1.7, 1.4, 0.03, lt ? (warm ? '#ffc070' : '#90c8ff') : '#26324a', { mat: W(MT.glass, 0), emit: lt ? 0.45 : 0.04 });
      }
      for (let k = 0; k < 3; k++) {
        const lt = R(k, f, 13) < (lit ? 0.5 : 0.1);
        mb.box(tx + tw + 0.01, y + 0.3, tz + 1 + k * 2, 0.03, 1.4, 1.7, lt ? '#ffc070' : '#26324a', { mat: W(MT.glass, 0), emit: lt ? 0.45 : 0.04 });
      }
      mb.box(tx + tw / 2, y + S - 0.08, tz + td + 0.05, tw + 0.1, 0.1, 0.08, T.trim);
    }
    // gold fins
    for (let k = 0; k <= 6; k++) mb.box(tx + k * 2, pod, tz + td + 0.1, 0.12, floors * S, 0.2, T.trim, { mat: W(MT.metal, 0) });
    for (let k = 0; k <= 3; k++) mb.box(tx + tw + 0.1, pod, tz + k * 2, 0.2, floors * S, 0.12, T.trim, { mat: W(MT.metal, 0) });
    // crown
    mb.box(tx + tw / 2, top, tz + td / 2, tw + 0.4, 1.2, td + 0.4, '#14141c');
    text(mb, 'STARLITE', tx + tw / 2, top + 0.2, tz + td + 0.22, 0.15, P.neonPink, { emit: 2.0, mat: MT.neon });
    text(mb, 'GRAND', tx + tw + 0.22, top + 0.2, tz + td / 2, 0.12, P.brass, { dir: 'z', emit: 1.8, mat: MT.neon });
    // helipad + beacon
    mb.cyl(tx + tw / 2, top + 1.2, tz + td / 2, 2.4, 0.1, 12, '#3a3a44');
    text(mb, 'H', tx + tw / 2, top + 1.31, tz + td / 2 + 0.3, 0.12, P.white, { mat: 0, depth: 0.02 });
    mb.box(tx + tw / 2, top + 1.3, tz + td / 2, 0.1, 0.5, 0.1, '#ff3030', { emit: 2, jit: 0 });
    // grand canopy over the drive
    const cz = pz + pd;
    mb.box(13, S + 0.3, cz + 1.8, 9, 0.22, 3.4, T.trim, { mat: W(MT.metal, 0) });
    for (let k = 0; k < 9; k++) mb.box(9 + k, S + 0.25, cz + 3.4, 0.12, 0.06, 0.12, '#fff2c0', { emit: 1.8, jit: 0 });
    for (const sx of [-4.2, 4.2]) mb.cyl(13 + sx, 0.14, cz + 3.2, 0.14, S + 0.2, 8, T.trim);
    text(mb, 'THE STARLITE GRAND', 13, S + 0.34, cz + 3.52, 0.035, P.brass, { emit: 1.4, mat: MT.neon });
    // red carpet
    mb.box(13, 0.15, cz + 1.8, 2, 0.01, 3.4, '#a01a2a', { mat: W(MT.carpet, 0) });
    return top;
  }
  function fountain(mb, x, z) {
    mb.cyl(x, 0.14, z, 2.0, 0.5, 14, '#d8d2c8', { mat: W(MT.marble, 0) });
    mb.cyl(x, 0.6, z, 1.8, 0.02, 14, '#3ab8d8', { mat: W(MT.water, 0), emit: 0.2 });
    mb.cyl(x, 0.14, z, 0.3, 1.5, 8, '#d8d2c8', { mat: W(MT.marble, 0) });
    mb.cyl(x, 1.6, z, 0.9, 0.2, 10, '#d8d2c8', { mat: W(MT.marble, 0) });
    mb.sphere(x, 2.0, z, 0.25, P.brass, { detail: 1 });
  }
  function valetStand(mb, x, z) {
    mb.box(x, 0.14, z, 0.6, 1.1, 0.4, '#2c3e5a', { mat: W(MT.wood, 0) });
    mb.box(x, 1.24, z, 0.7, 0.06, 0.5, P.brass);
    text(mb, 'VALET', x, 0.7, z + 0.21, 0.016, P.brass, {});
  }

  // walkable footprint for the current tier (tiles blocked)
  function footprint(tier) {
    const out = [];
    const rect = (x, z, w, d) => out.push([x, z, w, d]);
    if (tier <= 3) { rect(WING.x, WING.z, WING.w, WING.d); rect(OFFICE.x, OFFICE.z, OFFICE.w, OFFICE.d); if (TIERS[tier].floors >= 2) rect(WING.x + WING.w, WING.z + WING.d - 3, 1.4, 4); }
    else if (tier === 4) { rect(4, 9, 18, 8); rect(OFFICE.x, OFFICE.z, OFFICE.w, OFFICE.d); }
    else { rect(4, 9, 18, 9); rect(OFFICE.x, OFFICE.z, OFFICE.w, OFFICE.d); }
    rect(POOL.x, POOL.z, POOL.w, POOL.d);
    return out;
  }
  // where the hotel's front door is for each tier (interaction anchor + exit tile)
  function frontDoor(tier) {
    if (tier <= 3) return { x: OFFICE.x + OFFICE.w + 0.4, z: OFFICE.z + OFFICE.d / 2 + 1.0, map: 'office', tile: [OFFICE.x + OFFICE.w, OFFICE.z + 4] };
    if (tier === 4) return { x: 13, z: 17.4, map: 'lobby', tile: [13, 17] };
    return { x: 13, z: 18.4, map: 'lobby', tile: [13, 18] };
  }

  window.MOTEL = { LOT, WING, OFFICE, POOL, TIERS, roomDoor, wing, roomFront, office, sign, pool, poolDeckProps, lounger, umbrella, hotel, lounge, grand, fountain, valetStand, footprint, frontDoor };
})();
