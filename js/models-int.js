// Interior shells and furniture.
(function () {
  const { MB, MT, W, P, text, textWidth, neonRect, R, pick, shade } = KIT;
  const WALL_H = 2.6;

  // floor + north/west back walls with door gaps, skirting and trim. Open to the south and east.
  function shell(map) {
    const mb = new MB();
    const wl = map.walls || {};
    const wear = wl.wear != null ? wl.wear : 0.45;
    const fc = wl.floorCol || '#6a5a48', fm = wl.floorMat != null ? wl.floorMat : MT.wood;
    for (let j = 0; j < map.h; j++) for (let i = 0; i < map.w; i++) {
      const t = map.tile(i, j);
      if (t === 'void') continue;
      let c = fc;
      if (wl.checker) c = (i + j) % 2 ? '#e8e2d8' : '#2a2a30';
      if (wl.tint) c = wl.tint(i, j, t) || c;
      mb.quad([i, 0, j + 1], [i + 1, 0, j + 1], [i + 1, 0, j], [i, 0, j], c, { mat: W(fm, wear * (0.7 + 0.5 * R(i, j, 2))), jit: 0.01 });
    }
    // edges of the diorama (thick floor slab)
    mb.box(map.w / 2, -0.6, map.h + 0.02, map.w, 0.6, 0.04, '#141218');
    mb.box(map.w + 0.02, -0.6, map.h / 2, 0.04, 0.6, map.h, '#141218');
    const gaps = (map.exits || []).map(e => e);
    const isGap = (side, k) => gaps.some(e => (side === 'n' && e.z === 0 && k >= e.x && k < e.x + (e.w || 1)) || (side === 'w' && e.x === 0 && k >= e.z && k < e.z + (e.h || 1)));
    const wc = wl.wallCol || '#c8b89a', wm = wl.wallMat != null ? wl.wallMat : MT.plaster, trim = wl.trim || '#5a3a2a';
    const H = map.underground ? 4.2 : WALL_H;
    if (wl.n) for (let i = 0; i < map.w; i++) {
      if (isGap('n', i)) { mb.box(i + 0.5, 2.0, -0.15, 1, H - 2.0, 0.3, wc, { mat: W(wm, wear) }); continue; }
      mb.box(i + 0.5, 0, -0.15, 1, H, 0.3, wc, { mat: W(wm, wear), top: '#141218' });
      mb.box(i + 0.5, 0, 0.02, 1, 0.16, 0.04, trim, { mat: W(MT.wood, wear) });
      if (!map.underground) mb.box(i + 0.5, 0.95, 0.02, 1, 0.06, 0.03, shade(wc, 0.85));
    }
    if (wl.w) for (let j = 0; j < map.h; j++) {
      if (isGap('w', j)) { mb.box(-0.15, 2.0, j + 0.5, 0.3, H - 2.0, 1, wc, { mat: W(wm, wear) }); continue; }
      mb.box(-0.15, 0, j + 0.5, 0.3, H, 1, shade(wc, 0.9), { mat: W(wm, wear), top: '#141218' });
      mb.box(0.02, 0, j + 0.5, 0.04, 0.16, 1, trim, { mat: W(MT.wood, wear) });
    }
    if (wl.n && wl.w) mb.box(-0.15, 0, -0.15, 0.3, H, 0.3, shade(wc, 0.8));
    // door frames for gaps
    for (const e of gaps) {
      if (e.z === 0) { mb.box(e.x + 0.05, 0, 0.02, 0.1, 2.0, 0.12, trim); mb.box(e.x + (e.w || 1) - 0.05, 0, 0.02, 0.1, 2.0, 0.12, trim); mb.box(e.x + (e.w || 1) / 2, 1.95, 0.02, e.w || 1, 0.1, 0.12, trim); }
      if (e.x === 0) { mb.box(0.02, 0, e.z + 0.05, 0.12, 2.0, 0.1, trim); mb.box(0.02, 0, e.z + (e.h || 1) - 0.05, 0.12, 2.0, 0.1, trim); mb.box(0.02, 1.95, e.z + (e.h || 1) / 2, 0.12, 0.1, e.h || 1, trim); }
    }
    return mb;
  }

  const F = {};
  const o = (m, w) => ({ mat: W(m, w || 0.3) });
  F.counter = (mb, x, z, w = 3, luxe) => {
    mb.box(x, 0, z, w, 1.0, 0.6, luxe ? '#2a2a34' : '#7a5a3e', luxe ? o(MT.marble, 0) : o(MT.wood, 0.5));
    mb.box(x, 1.0, z, w + 0.1, 0.06, 0.7, luxe ? '#e8e3da' : '#a8804a', luxe ? o(MT.marble, 0) : o(MT.wood, 0.4));
    if (luxe) mb.box(x, 0.4, z + 0.31, w, 0.08, 0.02, P.brass, { emit: 0.6 });
  };
  F.bell = (mb, x, z) => { mb.cyl(x, 1.06, z, 0.06, 0.02, 8, '#333'); mb.sphere(x, 1.1, z, 0.05, P.gold, { detail: 0, flatBottom: 0 }); };
  F.register = (mb, x, z) => { mb.box(x, 1.06, z, 0.4, 0.18, 0.32, '#3a3a40'); mb.box(x, 1.24, z - 0.08, 0.3, 0.14, 0.04, '#5aff8a', { emit: 0.8, jit: 0 }); };
  F.keyrack = (mb, x, z) => {
    mb.box(x, 1.1, z + 0.05, 1.2, 0.7, 0.06, '#5a3a2a', o(MT.wood, 0.4));
    for (let k = 0; k < 12; k++) { const kx = x - 0.48 + (k % 6) * 0.19, ky = 1.6 - Math.floor(k / 6) * 0.3; mb.box(kx, ky, z + 0.1, 0.03, 0.03, 0.04, P.gold); mb.box(kx, ky - 0.12, z + 0.1, 0.05, 0.1, 0.02, '#c84a3a'); }
  };
  F.plans = (mb, x, z) => {
    mb.box(x, 0.9, z + 0.04, 1.3, 1.0, 0.04, '#a8804a');
    mb.box(x, 0.95, z + 0.07, 1.2, 0.9, 0.02, '#3a5a8a', { emit: 0.15 });
    for (let k = 0; k < 4; k++) mb.box(x - 0.4 + k * 0.27, 1.1 + (k % 2) * 0.3, z + 0.09, 0.2, 0.2, 0.01, '#e8f0ff', { emit: 0.3 });
    mb.box(x + 0.4, 1.6, z + 0.1, 0.06, 0.06, 0.02, '#c84a3a');
  };
  F.partition = (mb, x, z, d) => { mb.box(x, 0, z + d / 2, 0.12, 2.2, d, '#a89a80', o(MT.plaster, 0.5)); };
  F.cot = (mb, x, z, luxe) => {
    mb.box(x, 0, z, 0.9, 0.35, 1.9, luxe ? '#3a3a50' : '#5a5a5a', o(MT.metal, 0.5));
    mb.box(x, 0.35, z, 0.88, 0.12, 1.86, luxe ? '#e8e2d8' : '#8a9a8a');
    mb.box(x, 0.47, z - 0.7, 0.6, 0.1, 0.35, '#e8e2d8');
    mb.box(x, 0.47, z + 0.25, 0.86, 0.06, 1.0, luxe ? '#7a2236' : '#5a6a8a');
  };
  F.safe = (mb, x, z) => {
    mb.box(x, 0, z, 0.75, 0.9, 0.7, '#3a3e48', o(MT.metal, 0.4));
    mb.cyl(x - 0.38, 0.5, z, 0.11, 0.04, 10, '#9a9aa2', { rz: 1 }); mb.box(x - 0.39, 0.12, z, 0.02, 0.7, 0.6, '#2a2c34');
  };
  F.fusebox = (mb, x, z) => {
    mb.box(x + 0.06, 1.0, z, 0.12, 0.7, 0.55, '#7a7a80', o(MT.metal, 0.8));
    mb.box(x + 0.13, 1.08, z, 0.02, 0.54, 0.42, '#5a5a60');
    mb.box(x + 0.15, 1.55, z + 0.15, 0.02, 0.08, 0.08, '#ffd84a');
  };
  F.plant = (mb, x, z) => { mb.cyl(x, 0, z, 0.2, 0.35, 8, '#a8603a', { r2: 0.24 }); mb.sphere(x, 0.65, z, 0.32, P.leaf, { detail: 1, jitter: 0.25, sway: 0.15, colTop: '#5a9a5a' }); };
  F.chair = (mb, x, z, rot = 0, col = '#5a3a2a') => {
    mb.at(x, 0, z, rot);
    for (const [dx, dz] of [[-0.17, -0.17], [0.17, -0.17], [-0.17, 0.17], [0.17, 0.17]]) mb.box(dx, 0, dz, 0.05, 0.42, 0.05, col);
    mb.box(0, 0.42, 0, 0.44, 0.06, 0.44, shade(col, 1.2), o(MT.wood, 0.4));
    mb.box(0, 0.46, -0.2, 0.44, 0.5, 0.05, col, o(MT.wood, 0.4));
    mb.pop();
  };
  F.rack = (mb, x, z, rot = 0) => { mb.at(x, 0, z, rot); mb.box(0, 0, 0, 0.9, 1.4, 0.25, '#7a5a3e', o(MT.wood, 0.5)); for (let k = 0; k < 6; k++) mb.box(-0.3 + (k % 3) * 0.3, 0.3 + Math.floor(k / 3) * 0.5, 0.13, 0.22, 0.3, 0.02, pick(['#3fb8a8', '#ffd84a', '#ff7ac0', '#7ad8ff'], R(k, 1, 1))); mb.pop(); };
  F.ceilfan = (mb, x, z) => { mb.box(x, 2.3, z, 0.05, 0.3, 0.05, '#3a3a40'); mb.box(x, 2.28, z, 1.2, 0.03, 0.14, '#5a3a2a'); mb.box(x, 2.28, z, 0.14, 0.03, 1.2, '#5a3a2a'); };
  F.tv = (mb, x, z) => { mb.box(x, 1.5, z, 0.9, 0.55, 0.08, '#1a1a1e'); mb.box(x, 1.54, z + 0.045, 0.8, 0.45, 0.01, '#5a7aff', { emit: 0.8, jit: 0 }); };
  F.watercooler = (mb, x, z) => { mb.box(x, 0, z, 0.35, 0.9, 0.35, '#e8e2d8'); mb.cyl(x, 0.9, z, 0.15, 0.4, 8, '#7ad8ff', { emit: 0.15 }); };
  F.rug = (mb, x, z, w, d, col) => { mb.box(x, 0.005, z, w, 0.01, d, col, o(MT.carpet, 0.4)); mb.box(x, 0.008, z, w - 0.2, 0.01, d - 0.2, shade(col, 1.25), o(MT.carpet, 0.4)); };
  F.elevator = (mb, x, z) => {
    mb.box(x, 0, z + 0.05, 1.5, 2.3, 0.08, P.brass, o(MT.metal, 0));
    mb.box(x - 0.33, 0.05, z + 0.1, 0.62, 2.0, 0.02, '#c8ccd4', o(MT.metal, 0)); mb.box(x + 0.33, 0.05, z + 0.1, 0.62, 2.0, 0.02, '#c8ccd4', o(MT.metal, 0));
    mb.box(x, 2.15, z + 0.11, 0.4, 0.1, 0.01, '#ff8a3a', { emit: 1.2, jit: 0 });
  };
  F.chandelier = (mb, x, z) => {
    mb.box(x, 2.0, z, 0.03, 0.6, 0.03, P.brass);
    mb.cyl(x, 1.9, z, 0.5, 0.1, 10, P.brass);
    for (let k = 0; k < 10; k++) { const a = k / 10 * 6.28; mb.box(x + Math.cos(a) * 0.45, 1.75, z + Math.sin(a) * 0.45, 0.06, 0.16, 0.06, '#fff2c0', { emit: 1.5, jit: 0 }); }
    mb.sphere(x, 1.7, z, 0.12, '#e8f4ff', { detail: 1, emit: 1.0 });
  };
  F.sofa = (mb, x, z, rot = 0, col = '#2c3e5a') => {
    mb.at(x, 0, z, rot);
    mb.box(0, 0, 0, 2.0, 0.42, 0.8, col, o(MT.carpet, 0.1)); mb.box(0, 0.42, -0.32, 2.0, 0.45, 0.18, col, o(MT.carpet, 0.1));
    mb.box(-0.95, 0.42, 0, 0.12, 0.25, 0.8, col); mb.box(0.95, 0.42, 0, 0.12, 0.25, 0.8, col);
    mb.pop();
  };
  F.coffeetable = (mb, x, z) => { mb.box(x, 0, z, 1.0, 0.35, 0.6, '#2a2a34', o(MT.marble, 0)); mb.box(x + 0.2, 0.35, z, 0.25, 0.04, 0.3, '#e8e2d8'); };
  F.barcounter = (mb, x, z, d = 4, rot = 0) => {
    mb.box(x, 0, z, 0.7, 1.05, d, '#2a1e2a', o(MT.wood, 0.2));
    mb.box(x, 1.05, z, 0.85, 0.06, d + 0.1, P.brass, o(MT.metal, 0));
    mb.box(x + 0.36, 0.2, z, 0.02, 0.06, d, '#ff4fa3', { emit: 1.4, jit: 0 });
    // back shelf with bottles
    mb.box(x - 0.9, 0, z, 0.35, 1.9, d, '#1e1620', o(MT.wood, 0.2));
    for (let k = 0; k < d * 4; k++) mb.box(x - 0.82, 1.0 + (k % 2) * 0.5, z - d / 2 + 0.15 + Math.floor(k / 2) * 0.48, 0.08, 0.26, 0.08, pick(['#3a8a5a', '#c8a03a', '#8a2a3a', '#e8e2d8', '#3a5a9a'], R(k, 2, 3)), { emit: 0.25 });
  };
  F.bed = (mb, x, z, st) => {
    const messy = st === 'dirty' || st === 'broken';
    mb.box(x, 0, z, 1.5, 0.45, 2.2, '#5a3a2a', o(MT.wood, 0.5));
    mb.box(x, 0, z - 1.15, 1.6, 1.0, 0.12, '#5a3a2a', o(MT.wood, 0.5));
    mb.box(x, 0.45, z + 0.05, 1.46, 0.14, 2.06, '#e8e2d8');
    if (messy) {
      mb.at(x + 0.1, 0.6, z + 0.3, 0.3); mb.box(0, 0, 0, 1.3, 0.12, 1.2, '#8a6a8a', o(MT.carpet, 0.8)); mb.pop();
      mb.box(x - 0.3, 0.6, z - 0.75, 0.5, 0.12, 0.35, '#d8d2c8'); mb.box(x + 0.5, 0.0, z + 0.9, 0.5, 0.1, 0.4, '#d8d2c8');
    } else {
      mb.box(x, 0.59, z + 0.35, 1.48, 0.08, 1.3, '#8a2a3a', o(MT.carpet, 0.2));
      mb.box(x - 0.35, 0.59, z - 0.75, 0.55, 0.14, 0.38, '#f2efe8'); mb.box(x + 0.35, 0.59, z - 0.75, 0.55, 0.14, 0.38, '#f2efe8');
    }
  };
  F.nightstand = (mb, x, z) => { mb.box(x, 0, z, 0.5, 0.55, 0.45, '#6a4a32', o(MT.wood, 0.5)); mb.box(x, 0.3, z + 0.23, 0.3, 0.04, 0.02, P.brass); };
  F.lamp = (mb, x, y, z, on = true) => { mb.box(x, y, z, 0.08, 0.35, 0.08, P.brass); mb.cyl(x, y + 0.32, z, 0.18, 0.24, 8, on ? '#ffe2a0' : '#d8c8a8', { r2: 0.12, emit: on ? 0.9 : 0 }); };
  F.tvstand = (mb, x, z, on) => { mb.box(x, 0, z, 1.1, 0.5, 0.45, '#4a3a2e', o(MT.wood, 0.5)); mb.box(x, 0.5, z, 0.8, 0.5, 0.2, '#1a1a1e'); mb.box(x, 0.54, z + 0.1, 0.7, 0.42, 0.01, on ? '#7aa8ff' : '#222', { emit: on ? 0.9 : 0, jit: 0 }); };
  F.bathroom = (mb, x, z, dirty) => {
    mb.box(x - 0.9, 0, z, 0.1, 1.1, 3.2, '#b8a890', o(MT.plaster, 0.4)); mb.box(x - 0.9, 1.1, z, 0.14, 0.05, 3.24, '#8a7a60');
    mb.box(x + 0.15, 0, z - 0.9, 1.4, 0.55, 0.75, '#e8e8e2', o(MT.tile, 0.3));
    mb.box(x + 0.15, 0.4, z - 0.9, 1.2, 0.12, 0.55, dirty ? '#8a8a6a' : '#9ad8e8', o(MT.water, 0));
    mb.box(x + 0.3, 0, z + 0.7, 0.45, 0.4, 0.55, '#f2f2ec'); mb.box(x + 0.3, 0.4, z + 0.98, 0.45, 0.4, 0.12, '#f2f2ec');
    for (let k = 0; k < 2; k++) for (let j = 0; j < 4; j++) mb.box(x - 0.83, 0.15 + k * 0.45, z - 1.2 + j * 0.7, 0.02, 0.45, 0.65, '#d8e8e8', o(MT.tile, dirty ? 0.8 : 0.1));
  };
  F.mess = (mb, x, z, n, active) => {
    if (!active) return;
    if (n === 0) { mb.box(x, 0, z, 0.36, 0.3, 0.36, '#3a3a40', o(MT.metal, 0.6)); for (let k = 0; k < 4; k++) mb.box(x - 0.2 + R(k, 1, n) * 0.4, 0.3, z - 0.2 + R(k, 2, n) * 0.4, 0.12, 0.08, 0.1, pick(['#e8e2d8', '#c84a3a', '#5a8a5a'], R(k, 3, n))); }
    if (n === 1) { for (let k = 0; k < 6; k++) mb.box(x - 0.4 + R(k, 1, 9) * 0.8, 0, z - 0.3 + R(k, 2, 9) * 0.6, 0.18, 0.04, 0.12, pick(['#e8e2d8', '#d8a83a', '#3a6a3a', '#c84a3a'], R(k, 3, 9))); mb.cyl(x + 0.2, 0, z, 0.06, 0.24, 6, '#3a7a3a'); }
    if (n === 2) { mb.box(x, 0.004, z, 0.9, 0.01, 0.6, '#3a2a1a', { jit: 0 }); mb.box(x + 0.3, 0.008, z + 0.1, 0.4, 0.01, 0.3, '#2a1a10', { jit: 0 }); }
  };
  F.hole = (mb, x, z, active) => { if (!active) return; mb.box(x + 0.04, 0.5, z, 0.04, 0.7, 0.8, '#2a1e18'); for (let k = 0; k < 4; k++) mb.box(x + 0.08, 0.5 + R(k, 1, 2) * 0.6, z - 0.3 + R(k, 2, 2) * 0.6, 0.03, 0.1, 0.16, '#c8b89a'); };
  F.wiring = (mb, x, z, active) => {
    mb.box(x, 1.4, z + 0.05, 0.3, 0.4, 0.04, '#8a8a80');
    if (active) for (let k = 0; k < 3; k++) { mb.at(x - 0.1 + k * 0.1, 1.4, z + 0.1, 0, 1, 0.3, (k - 1) * 0.3); mb.box(0, -0.5, 0, 0.025, 0.5, 0.025, pick(['#c84a3a', '#2a6aff', '#ffd84a'], k / 3)); mb.pop(); }
  };
  F.window = (mb, x, z) => {
    mb.box(x, 0.9, z + 0.02, 1.3, 1.1, 0.04, '#2a3a5a', o(MT.glass, 0.4));
    mb.box(x - 0.55, 0.85, z + 0.06, 0.3, 1.2, 0.03, '#8a2a3a'); mb.box(x + 0.55, 0.85, z + 0.06, 0.3, 1.2, 0.03, '#8a2a3a');
  };
  F.stash = (mb, x, z) => { mb.box(x, 0, z, 0.6, 0.25, 0.45, '#5a3a2a', o(MT.wood, 0.7)); mb.box(x, 0.25, z, 0.62, 0.03, 0.47, '#4a2e20'); };
  F.ac = (mb, x, z) => { mb.box(x, 1.6, z + 0.15, 0.7, 0.4, 0.3, '#d8d8d0', o(MT.metal, 0.5)); for (let k = 0; k < 4; k++) mb.box(x, 1.66 + k * 0.08, z + 0.31, 0.6, 0.02, 0.01, '#8a8a84'); };
  F.glasscase = (mb, x, z, w = 3, rot = 0) => {
    mb.at(x, 0, z, rot);
    mb.box(0, 0, 0, w, 0.5, 0.6, '#3a2a20', o(MT.wood, 0.5));
    mb.box(0, 0.5, 0, w, 0.5, 0.6, '#9ad8e8', o(MT.glass, 0.4));
    for (let k = 0; k < w * 3; k++) mb.box(-w / 2 + 0.2 + k * 0.32, 0.52, -0.1 + (k % 2) * 0.2, 0.12, 0.06, 0.12, pick([P.gold, '#c8ccd4', '#3a3a40', '#c84a3a'], R(k, 4, 1)), { emit: 0.3 });
    mb.box(0, 1.0, 0, w + 0.04, 0.04, 0.64, '#5a3a2a');
    mb.pop();
  };
  F.guitarwall = (mb, x, z) => { for (let k = 0; k < 5; k++) { const gx = x - 1.6 + k * 0.8; mb.box(gx, 1.0, z + 0.08, 0.3, 0.4, 0.06, pick(['#c84a3a', '#e8c13c', '#3a3a40', '#8a5a2a', '#3a8ad8'], k / 5)); mb.box(gx, 1.4, z + 0.08, 0.06, 0.55, 0.04, '#3a2a1a'); } };
  F.tvstack = (mb, x, z) => { for (let k = 0; k < 3; k++) { mb.box(x, k * 0.48, z, 0.55, 0.46, 0.5, '#2a2a30'); mb.box(x + 0.28, k * 0.48 + 0.06, z, 0.01, 0.34, 0.38, ['#5aff8a', '#ff7ac0', '#7ab8ff'][k], { emit: 0.8, jit: 0 }); } };
  F.neonwall = (mb, x, z, str, col) => { const px = 0.05; mb.box(x, 1.55, z + 0.04, textWidth(str, px) + 0.3, 0.6, 0.04, '#121218'); text(mb, str, x, 1.65, z + 0.08, px, col, { emit: 1.7, mat: MT.neon }); };
  F.shelf = (mb, x, z, rot = 0) => { mb.at(x, 0, z, rot); mb.box(0, 0, 0, 1.4, 1.8, 0.35, '#5a4a3a', o(MT.wood, 0.5)); for (let s = 0; s < 3; s++) for (let k = 0; k < 4; k++) mb.box(-0.5 + k * 0.33, 0.3 + s * 0.55, 0.05, 0.22, 0.3, 0.22, pick(['#c84a3a', '#e8c13c', '#3a6a9a', '#7a7a80', '#3a8a5a'], R(k, s, 7))); mb.pop(); };
  F.bikes = (mb, x, z) => { for (let k = 0; k < 2; k++) { const bx = x + k * 1.0; mb.cyl(bx - 0.3, 0.3, z, 0.28, 0.03, 10, '#222', { rz: 1 }); mb.box(bx, 0.3, z, 0.7, 0.05, 0.05, ['#c84a3a', '#3a8ad8'][k]); mb.cyl(bx + 0.3, 0.3, z, 0.28, 0.03, 10, '#222'); } };
  F.aisle = (mb, x, z, len = 3) => {
    mb.box(x, 0, z, len, 1.4, 0.6, '#d8d2c8', o(MT.metal, 0.3));
    for (const s of [-1, 1]) for (let r = 0; r < 3; r++) for (let k = 0; k < len * 4; k++) mb.box(x - len / 2 + 0.15 + k * 0.25, 0.15 + r * 0.42, z + s * 0.31, 0.18, 0.26, 0.04, pick(['#c84a3a', '#e8c13c', '#3a6a9a', '#3a8a5a', '#ff7ac0', '#e8833a'], R(k, r + s, 5)));
  };
  F.cooler = (mb, x, z, n = 3) => { for (let k = 0; k < n; k++) { const cx = x - (n - 1) * 0.45 + k * 0.9; mb.box(cx, 0, z + 0.3, 0.86, 2.0, 0.6, '#c8ccd4', o(MT.metal, 0.2)); mb.box(cx, 0.15, z + 0.61, 0.76, 1.7, 0.02, '#bfe8ff', { emit: 0.7, mat: W(MT.glass, 0.1) }); for (let r = 0; r < 4; r++) mb.box(cx, 0.3 + r * 0.4, z + 0.5, 0.7, 0.2, 0.1, pick(['#c84a3a', '#3a8a5a', '#e8c13c', '#3a5a9a'], R(k, r, 2)), { emit: 0.3 }); } };
  F.lotto = (mb, x, z) => { mb.box(x, 0, z, 0.6, 1.3, 0.5, '#e8c13c'); mb.box(x, 1.0, z + 0.26, 0.5, 0.25, 0.02, '#c84a3a', { emit: 0.9 }); text(mb, 'LOTTO', x, 1.04, z + 0.28, 0.025, '#fff', { emit: 1 }); };
  F.icecream = (mb, x, z) => { mb.box(x, 0, z, 0.8, 0.8, 1.4, '#e8e2d8'); mb.box(x, 0.8, z, 0.7, 0.02, 1.3, '#bfe8ff', o(MT.glass, 0.1)); };
  F.magrack = (mb, x, z, rot) => { mb.at(x, 0, z, rot); mb.box(0, 0, 0, 1.2, 1.2, 0.3, '#5a5a60'); for (let k = 0; k < 8; k++) mb.box(-0.45 + (k % 4) * 0.3, 0.3 + Math.floor(k / 4) * 0.45, 0.16, 0.24, 0.32, 0.02, pick(['#ff7ac0', '#7ad8ff', '#ffd84a', '#c84a3a'], R(k, 1, 3))); mb.pop(); };
  F.dinercounter = (mb, x, z, w) => {
    mb.box(x, 0, z, w, 1.0, 0.7, '#c8443c', o(MT.metal, 0.2));
    mb.box(x, 0.45, z + 0.36, w, 0.06, 0.02, P.chrome);
    mb.box(x, 1.0, z, w + 0.1, 0.06, 0.8, '#e8e2d8', o(MT.marble, 0.1));
    mb.box(x, 0, z - 1.1, w, 1.7, 0.4, '#c8ccd4', o(MT.metal, 0.3));
    mb.box(x - w / 2 + 0.6, 1.0, z - 1.1, 0.8, 0.3, 0.3, '#3a3a40');
  };
  F.stool = (mb, x, z) => { mb.cyl(x, 0, z, 0.04, 0.6, 6, P.chrome); mb.cyl(x, 0.6, z, 0.2, 0.08, 8, '#c8443c'); };
  F.booth = (mb, x, z, rot = 0) => {
    mb.at(x, 0, z, rot);
    for (const s of [-1, 1]) { mb.box(s * 0.75, 0, 0, 0.5, 0.45, 1.3, '#c8443c', o(MT.carpet, 0.2)); mb.box(s * 0.95, 0.45, 0, 0.12, 0.6, 1.3, '#c8443c', o(MT.carpet, 0.2)); }
    mb.box(0, 0, 0, 0.2, 0.72, 0.2, P.chrome); mb.box(0, 0.72, 0, 0.9, 0.05, 1.1, '#e8e2d8', o(MT.marble, 0.1));
    mb.pop();
  };
  F.jukebox = (mb, x, z) => {
    mb.box(x, 0, z, 0.8, 1.3, 0.5, '#8a2a3a', o(MT.wood, 0.2));
    mb.cyl(x, 1.3, z, 0.4, 0.25, 8, '#ffd84a', { emit: 0.8, rz: 0.6 });
    for (let k = 0; k < 5; k++) mb.box(x - 0.3 + k * 0.15, 0.2, z + 0.26, 0.06, 1.0, 0.02, pick(['#ff4fa3', '#3ff0ff', '#ffd84a', '#59ff8a', '#b44bff'], k / 5), { emit: 1.3, jit: 0 });
  };
  F.pies = (mb, x, z) => { mb.cyl(x, 1.06, z, 0.3, 0.02, 10, P.chrome); mb.cyl(x, 1.08, z, 0.26, 0.08, 10, '#c88a3a'); mb.cyl(x, 1.06, z, 0.3, 0.4, 10, '#d8f0ff', { r2: 0.06, mat: W(MT.glass, 0) }); };
  // metro
  F.metrostairs = (mb, x, z) => {
    // stairs rising to the street in the north wall
    for (let k = 0; k < 8; k++) mb.box(x + 1, k * 0.32, z - 0.3 - k * 0.3, 2.0, 0.32, 0.3, '#9a958e', { mat: W(MT.slab, 0.8) });
    for (const s of [x, x + 2]) mb.box(s, 0, z - 1.4, 0.15, 3.2, 2.8, '#3a3d48', { mat: W(MT.concrete, 0.8) });
    mb.box(x + 1, 3.0, z + 0.05, 2.4, 0.4, 0.08, '#2a3aa0', { jit: 0 });
    text(mb, 'EXIT', x + 1, 3.07, z + 0.1, 0.04, P.white, { emit: 1.2 });
  };
  F.tracks = (mb, x, z, w) => {
    mb.box(x + w / 2, -0.01, z + 0.04, w, 0.01, 0.08, P.tactile, { mat: W(MT.concrete, 0.7) });
    mb.box(x + w / 2, -1.1, z + 0.05, w, 1.1, 0.1, P.concrete, { mat: W(MT.concrete, 0.9) });
    mb.box(x + w / 2, -1.12, z + 3, w, 0.02, 6, '#3a342e', { mat: W(MT.roof, 0.5) });
    for (let i = 0.3; i < w; i += 0.7) mb.box(x + i, -1.1, z + 2.0, 0.24, 0.1, 2.0, '#5a3e2a', { mat: W(MT.wood, 0.9) });
    for (const rz of [1.4, 2.6]) mb.box(x + w / 2, -1.0, z + rz, w, 0.1, 0.07, P.steel, { mat: W(MT.metal, 0.7), top: '#b9c0c8' });
    mb.box(x + w / 2, -1.12, z + 6.0, w, 2.0, 0.2, '#24285a', { mat: W(MT.brick, 0.9) });
  };
  F.subwaycar = (mb, x, z) => {
    const L = 9, Wd = 2.2, y0 = -1.0;
    mb.box(x, y0 + 0.2, z, L, 2.1, Wd, '#a8acb4', { mat: W(MT.metal, 0.45), top: '#7a7e86', topMat: W(MT.metal, 0.7) });
    mb.box(x, y0 + 2.3, z, L - 0.2, 0.18, Wd - 0.4, '#8a8e96', { mat: W(MT.metal, 0.6) });
    for (const s of [-1, 1]) {
      const fz = z + s * (Wd / 2 + 0.01);
      mb.box(x, y0 + 0.9, fz, L - 0.3, 0.22, 0.02, '#c84a3a');
      for (let k = 0; k < 6; k++) mb.box(x - L / 2 + 0.9 + k * 1.45, y0 + 1.2, fz + s * 0.01, 0.9, 0.6, 0.02, '#ffe2a0', { mat: W(MT.glass, 0.7), emit: 0.45 });
      mb.box(x - 1.5, y0 + 0.25, fz + s * 0.02, 1.0, 1.7, 0.02, '#5a5e66');
    }
    C_graffiti(mb, x + 2.2, y0 + 0.3, z + Wd / 2 + 0.04, 3.0, 0.7, 3);
    text(mb, '2', x - L / 2 + 0.4, y0 + 1.3, z + Wd / 2 + 0.03, 0.06, '#ffd84a', { emit: 0.8 });
  };
  let C_graffiti = (...a) => CITY.graffiti(...a);
  F.stall = (mb, x, z, col, label) => {
    // folding table + crates + string lights + hand-painted sign
    mb.box(x, 0, z + 0.5, 2.4, 0.75, 0.8, '#5a4a3a', o(MT.wood, 0.8));
    mb.box(x, 0.75, z + 0.5, 2.5, 0.05, 0.85, '#3a2a3a');
    for (let k = 0; k < 6; k++) mb.box(x - 1.0 + k * 0.4, 0.8, z + 0.4 + (k % 2) * 0.2, 0.25, 0.12 + R(k, 1, 4) * 0.15, 0.2, pick(['#c84a3a', '#e8c13c', '#3a3a40', '#5aff8a', '#e8e2d8', '#7a5aff'], R(k, 2, 4)), { emit: 0.25 });
    mb.box(x - 1.4, 0, z - 0.2, 0.6, 0.6, 0.6, '#7a5a3a', o(MT.wood, 0.7)); mb.box(x + 1.4, 0, z - 0.2, 0.6, 0.9, 0.6, '#3a5a3a', o(MT.metal, 0.8));
    for (const s of [-1.3, 1.3]) mb.box(x + s, 0, z - 0.5, 0.06, 2.4, 0.06, P.iron);
    for (let k = 0; k < 9; k++) mb.box(x - 1.2 + k * 0.3, 2.25 - Math.sin(k / 8 * Math.PI) * 0.25, z - 0.5, 0.06, 0.06, 0.06, pick(['#ffd84a', '#ff4fa3', '#3ff0ff'], k / 9), { emit: 1.8, jit: 0 });
    mb.box(x, 1.6, z - 0.48, 1.6, 0.42, 0.04, '#1a1420');
    text(mb, label, x, 1.66, z - 0.44, 0.04, col, { emit: 1.8, mat: MT.neon });
    mb.box(x, 0.02, z + 0.5, 3.0, 0.01, 1.6, shade(col, 0.4), { mat: W(MT.carpet, 0.7), jit: 0 });
  };
  F.barrelfire = (mb, x, z) => { mb.cyl(x, 0, z, 0.3, 0.8, 8, '#5a3a2a', { mat: W(MT.metal, 0.95) }); mb.cyl(x, 0.8, z, 0.24, 0.05, 8, '#ff8a2a', { emit: 1.6 }); };
  F.metrorail = (mb, x0, x1, z) => { mb.box((x0 + x1) / 2, 0.95, z, x1 - x0, 0.06, 0.06, P.rust, { mat: W(MT.metal, 0.9) }); for (let x = x0; x <= x1 + 0.01; x += 0.45) mb.box(x, 0, z, 0.05, 0.95, 0.05, P.rust, { mat: W(MT.metal, 0.9) }); };
  F.rubble = (mb, x, z, n) => { for (let i = 0; i < n; i++) { const rx = x - 10 + R(i, 1, 6) * 20, rz = 1 + R(i, 2, 6) * 4; mb.box(rx, 0, rz, 0.1 + R(i, 3, 6) * 0.2, 0.04 + R(i, 4, 6) * 0.06, 0.08 + R(i, 5, 6) * 0.15, R(i, 6, 6) > 0.5 ? P.tile : P.concreteD, { mat: W(MT.concrete, 0.5), rot: R(i, 7, 6) * 3 }); } };
  F.tube = (mb, x, z) => { mb.box(x, 3.6, z, 2.0, 0.08, 0.16, '#e8f4ff', { emit: 1.4, mat: MT.neon, jit: 0 }); mb.box(x, 3.68, z, 2.1, 0.06, 0.24, P.iron); };
  F.neonstrip = (mb, x, z, col) => { mb.box(x, 3.2, z, 0.12, 0.1, 4.6, col, { emit: 1.8, mat: MT.neon, jit: 0 }); mb.box(x - 0.3, 0, z, 0.1, 3.2, 4.8, '#3a2a6a', { mat: W(MT.glass, 0.9) }); };
  F.cell = (mb, x, z) => { for (let k = 0; k < 9; k++) mb.box(x - 1.6 + k * 0.4, 0, z + 1.2, 0.05, 2.2, 0.05, '#5a5e66', o(MT.metal, 0.5)); mb.box(x, 2.1, z + 1.2, 3.4, 0.08, 0.08, '#5a5e66'); mb.box(x + 0.8, 0, z - 0.4, 1.4, 0.45, 0.7, '#6a6a70'); };
  F.door = (mb, x, z, label) => { mb.box(x, 0, z + 0.04, 0.95, 2.0, 0.06, '#5a4a3a', o(MT.wood, 0.4)); mb.box(x, 1.4, z + 0.08, 0.5, 0.35, 0.02, '#c8d8e8', o(MT.glass, 0.2)); if (label) text(mb, label, x, 1.15, z + 0.08, 0.018, '#e8e2d8', {}); mb.box(x + 0.35, 0.95, z + 0.09, 0.05, 0.05, 0.04, P.brass); };
  F.flag = (mb, x, z) => { mb.cyl(x, 0, z, 0.03, 2.1, 6, P.brass); mb.box(x + 0.35, 1.4, z, 0.65, 0.45, 0.02, '#2a4a9a', { sway: 0.3 }); for (let k = 0; k < 3; k++) mb.box(x + 0.35, 1.45 + k * 0.13, z + 0.015, 0.65, 0.05, 0.01, '#c84a3a'); };
  F.desk = (mb, x, z) => { mb.box(x, 0, z, 1.4, 0.75, 0.7, '#5a4a3a', o(MT.wood, 0.4)); mb.box(x - 0.3, 0.75, z, 0.4, 0.3, 0.05, '#2a2a30'); mb.box(x + 0.35, 0.75, z + 0.05, 0.4, 0.04, 0.3, '#e8e2d8'); };
  F.corkboard = (mb, x, z, str) => { mb.box(x, 1.0, z + 0.04, 1.4, 0.9, 0.04, '#a8804a'); for (let k = 0; k < 6; k++) mb.box(x - 0.5 + (k % 3) * 0.5, 1.2 + Math.floor(k / 3) * 0.35, z + 0.07, 0.3, 0.28, 0.01, '#e8e2d8'); if (str) text(mb, str, x, 1.92, z + 0.07, 0.03, '#c84a3a', {}); };
  F.washers = (mb, x, z, n) => { for (let k = 0; k < n; k++) { const wx = x - (n - 1) * 0.42 + k * 0.84; mb.box(wx, 0, z, 0.78, 0.95, 0.7, '#e8e8e2', o(MT.metal, 0.3)); mb.cyl(wx, 0.5, z + 0.36, 0.24, 0.02, 10, '#5a8aa0', { rz: 1 }); } };
  F.dryers = (mb, x, z, n) => { for (let k = 0; k < n; k++) { const wz = z - (n - 1) * 0.42 + k * 0.84; mb.box(x, 0, wz, 0.7, 1.7, 0.78, '#d8d8d0', o(MT.metal, 0.4)); mb.cyl(x + 0.36, 1.1, wz, 0.24, 0.02, 10, '#3a3a40', { rz: 1 }); } };
  F.foldtable = (mb, x, z) => { mb.box(x, 0, z, 2.0, 0.8, 0.8, '#d8d2c8', o(MT.marble, 0.3)); mb.box(x - 0.4, 0.8, z, 0.5, 0.15, 0.4, '#8ab8e8'); mb.box(x + 0.3, 0.8, z, 0.4, 0.2, 0.4, '#e8e2d8'); };
  F.changemachine = (mb, x, z) => { mb.box(x, 0, z, 0.6, 1.5, 0.5, '#5a6a8a', o(MT.metal, 0.4)); mb.box(x, 1.0, z + 0.26, 0.4, 0.2, 0.02, '#5aff8a', { emit: 0.8 }); };
  F.stage = (mb, x, z) => {
    mb.box(x, 0, z, 3.6, 0.35, 2.2, '#2a1e1a', o(MT.wood, 0.4));
    mb.box(x - 0.8, 0.35, z, 0.08, 1.4, 0.08, '#222'); mb.box(x - 0.8, 1.6, z + 0.05, 0.12, 0.2, 0.12, '#888');
    mb.box(x + 0.6, 0.35, z - 0.2, 1.0, 0.75, 0.5, '#111'); mb.box(x + 0.6, 1.1, z - 0.2, 1.0, 0.06, 0.5, '#e8e2d8');
    for (let k = 0; k < 3; k++) mb.box(x - 1.2 + k * 1.2, 2.4, z + 1.0, 0.18, 0.18, 0.18, ['#ff4fa3', '#4f7bff', '#ffd84a'][k], { emit: 1.5, jit: 0 });
  };
  F.roundtable = (mb, x, z) => { mb.cyl(x, 0, z, 0.06, 0.75, 6, '#222'); mb.cyl(x, 0.75, z, 0.45, 0.05, 10, '#3a2a22'); mb.cyl(x, 0.8, z, 0.06, 0.12, 6, '#ff8a2a', { emit: 1.2 }); };
  F.pooltable = (mb, x, z) => { mb.box(x, 0, z, 2.0, 0.75, 1.1, '#3a2a22', o(MT.wood, 0.3)); mb.box(x, 0.75, z, 1.8, 0.03, 0.9, '#1a6a3a', o(MT.carpet, 0.3)); mb.box(x, 2.0, z, 1.2, 0.1, 0.3, '#2a2a30'); mb.box(x, 1.96, z, 1.0, 0.04, 0.2, '#ffe2a0', { emit: 1.2 }); };
  F.crates = (mb, x, z, n) => { for (let k = 0; k < n; k++) { const s = 0.5 + R(k, 1, n) * 0.3; CITY.crate(mb, x + (k % 3) * 0.75 - 0.75, z + Math.floor(k / 3) * 0.75, s, k >= 3 && R(k, 2, n) > 0.5 ? 0.6 : 0, pick(['#8a6a44', '#6a5a3a', '#3a5a3a'], R(k, 3, n))); } };
  F.forklift = (mb, x, z, rot) => {
    mb.at(x, 0, z, rot);
    mb.box(0, 0.2, 0, 0.9, 0.7, 1.3, '#e8b62a', o(MT.metal, 0.6)); mb.box(0, 0.9, -0.2, 0.8, 0.8, 0.6, '#2a2a30', o(MT.metal, 0.5));
    mb.box(0, 0.2, 0.8, 0.8, 1.8, 0.1, '#3a3a40'); for (const s of [-0.25, 0.25]) mb.box(s, 0.1, 1.2, 0.1, 0.05, 0.8, '#3a3a40');
    for (const [sx, sz] of [[-0.45, 0.4], [0.45, 0.4], [-0.45, -0.4], [0.45, -0.4]]) { mb.at(sx, 0.2, sz, 0, 1, 0, Math.PI / 2); mb.cyl(0, -0.08, 0, 0.2, 0.16, 8, '#18181c'); mb.pop(); }
    mb.pop();
  };
  F.pallet = (mb, x, z) => CITY.pallet(mb, x, z);
  F.loft = (mb, x, z) => {
    mb.box(x + 2, 2.4, z + 1.6, 4, 0.15, 3.2, '#5a5048', o(MT.metal, 0.8));
    for (let k = 0; k < 9; k++) mb.box(x + 0.1 + k * 0.48, 2.55, z + 3.15, 0.04, 0.7, 0.04, '#7a7e86');
    for (const sx of [x + 0.1, x + 3.9]) mb.box(sx, 0, z + 3.1, 0.12, 2.4, 0.12, '#5a5048');
  };
  F.filecab = (mb, x, z) => { mb.box(x, 0, z, 0.55, 1.3, 0.6, '#7a7e86', o(MT.metal, 0.3)); for (let k = 0; k < 3; k++) mb.box(x, 0.15 + k * 0.4, z + 0.31, 0.4, 0.3, 0.02, '#8a8e96'); };
  F.model = (mb, x, z) => {
    mb.box(x, 0, z, 1.2, 0.8, 1.0, '#e8e2d8');
    mb.box(x, 0.8, z, 1.1, 0.02, 0.9, '#7ab87a');
    mb.box(x, 0.82, z, 0.35, 1.0, 0.35, '#bfe0ff', { mat: W(MT.glass, 0), emit: 0.3 });
    mb.box(x - 0.35, 0.82, z + 0.2, 0.2, 0.4, 0.2, '#d8d2c8'); mb.box(x + 0.35, 0.82, z + 0.2, 0.2, 0.3, 0.2, '#d8d2c8');
    text(mb, 'VANCE', x, 0.5, z + 0.51, 0.02, P.gold, {});
  };

  window.INT = { WALL_H, shell, F };
})();
