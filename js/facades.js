// Custom building fronts that read as what they are: the Lucky 7 casino, dockside sheds, the fish market.
// map.buildings entries with { custom: 'casino' | 'shed' | 'market' } are built here instead of the generic block.
(function () {
  const { MT, W, P, R, text, neonRect, textWidth } = KIT;
  const C = CITY, STOREY = C.STOREY;
  const FACADE = window.FACADE = {};
  const K = BUILD.K, rectFoot = BUILD.rectFoot;

  // ------------------------------------------------------------------ the Lucky 7
  FACADE.casino = function (mb, b) {
    const x0 = b.x, z0 = b.z, x1 = b.x + b.w, z1 = b.z + b.d, cx = (x0 + x1) / 2, cz = (z0 + z1) / 2, H = 7.6;
    const gold = '#d8b04a', plum = '#2a1430', plumL = '#3e1d48';
    // the mass: a stepped plum box, gold cornices
    mb.box(cx, 0, cz, b.w, H, b.d, plum, { mat: W(MT.marble, 0.08), top: '#1a0e20', topMat: W(MT.roof, 0.2) });
    mb.box(cx - 1, H, cz - 1, b.w - 4, 1.6, b.d - 3, plumL, { mat: W(MT.marble, 0.08), top: '#1a0e20' });
    for (const y of [2.9, 5.4, H - 0.25]) { mb.box(cx, y, z1 + 0.02, b.w + 0.1, 0.22, 0.1, gold, { mat: W(MT.metal, 0.1), emit: 0.25 }); mb.box(x1 + 0.02, y, cz, 0.1, 0.22, b.d + 0.1, gold, { mat: W(MT.metal, 0.1), emit: 0.25 }); }
    // upper floors: tall arched-looking windows with warm light
    for (let k = 0.9; k < b.w - 0.5; k += 1.3) for (const y of [3.3, 5.8]) mb.box(x0 + k + 0.4, y, z1 + 0.03, 0.62, 1.3, 0.04, '#ffcf7a', { emit: 0.75, mat: W(MT.glass, 0.05) });
    for (let k = 0.9; k < b.d - 0.5; k += 1.3) for (const y of [3.3, 5.8]) mb.box(x1 + 0.03, y, z0 + k + 0.4, 0.04, 1.3, 0.62, '#ffcf7a', { emit: 0.7, mat: W(MT.glass, 0.05) });
    // ground floor: all glass, gold mullions
    mb.box(cx, 0.15, z1 + 0.03, b.w - 0.4, 2.55, 0.05, '#ffb0e0', { emit: 0.55, mat: W(MT.glass, 0.05) });
    for (let k = 0.2; k <= b.w - 0.2; k += 1.1) mb.box(x0 + k, 0.1, z1 + 0.08, 0.1, 2.7, 0.08, gold, { mat: W(MT.metal, 0.1) });
    // gold columns along the front
    for (let k = 1.2; k < b.w - 0.8; k += 2.2) { mb.cyl(x0 + k, 0, z1 + 0.6, 0.2, 2.75, 10, gold, { mat: W(MT.metal, 0.08), emit: 0.15 }); mb.box(x0 + k, 2.7, z1 + 0.6, 0.55, 0.15, 0.55, gold); mb.box(x0 + k, 0, z1 + 0.6, 0.55, 0.15, 0.55, gold); }
    // the marquee over the doors: bulbs all round, LUCKY 7 in neon
    const ex = b.door != null ? b.door : cx, mw = 6.4;
    mb.box(ex, 2.9, z1 + 1.5, mw, 0.6, 3.0, '#18101e', { mat: W(MT.metal, 0.2) });
    for (let k = 0; k <= mw / 0.3; k++) { const bx = ex - mw / 2 + k * 0.3; mb.box(bx, 3.05, z1 + 3.02, 0.12, 0.12, 0.06, k % 2 ? '#fff2b0' : '#ffd84a', { emit: 1.8, jit: 0 }); mb.box(bx, 3.3, z1 + 3.02, 0.12, 0.12, 0.06, k % 2 ? '#ffd84a' : '#fff2b0', { emit: 1.8, jit: 0 }); }
    for (let k = 0; k <= 3 / 0.3; k++) { const bz = z1 + k * 0.3; mb.box(ex + mw / 2 + 0.02, 3.18, bz, 0.06, 0.12, 0.12, '#fff2b0', { emit: 1.8, jit: 0 }); mb.box(ex - mw / 2 - 0.02, 3.18, bz, 0.06, 0.12, 0.12, '#fff2b0', { emit: 1.8, jit: 0 }); }
    mb.box(ex, 3.5, z1 + 2.9, 4.6, 1.0, 0.12, '#0e0812');
    text(mb, 'LUCKY 7', ex, 3.62, z1 + 2.98, 0.11, '#ff4fa3', { emit: 2.0 });
    // brass-and-glass double doors and a red carpet to the kerb
    mb.box(ex, 0.1, z1 + 0.06, 2.2, 2.4, 0.08, gold, { mat: W(MT.metal, 0.1) });
    for (const s of [-0.52, 0.52]) mb.box(ex + s, 0.15, z1 + 0.1, 0.95, 2.25, 0.04, '#ffe0f0', { emit: 0.7, mat: W(MT.glass, 0.05) });
    mb.box(ex, 0.005, z1 + 1.8, 2.2, 0.03, 3.6, '#8a1a2a', { mat: W(MT.carpet, 0.2) });
    for (const s of [-1.35, 1.35]) for (let k = 0; k < 3; k++) { mb.box(ex + s, 0, z1 + 0.9 + k * 1.1, 0.08, 0.95, 0.08, gold); mb.box(ex + s, 0.92, z1 + 0.9 + k * 1.1, 0.14, 0.14, 0.14, gold); }
    for (const s of [-1.35, 1.35]) mb.box(ex + s, 0.78, z1 + 2.0, 0.04, 0.05, 2.2, '#8a1a2a');
    // the big sign on the roof: 777 in a ring of bulbs
    const sy = H + 0.2, sw = 7.6, sh = 3.2;
    mb.box(cx, sy, z1 - 0.3, 0.3, 0.6, 0.3, '#2a2a30');
    mb.box(cx, sy + 0.5, z1 - 0.2, sw, sh, 0.25, '#120a16', { mat: W(MT.metal, 0.3) });
    neonRect(mb, cx, sy + 0.62, z1 - 0.05, sw - 0.3, sh - 0.25, '#ffd84a', 0.08, 'x', 1.8);
    for (let k = 0; k < 26; k++) mb.box(cx - sw / 2 + 0.25 + k * (sw - 0.5) / 25, sy + 0.55, z1 - 0.05, 0.1, 0.1, 0.06, k % 2 ? '#ff4fa3' : '#fff2b0', { emit: 2, jit: 0 });
    text(mb, '777', cx, sy + 1.25, z1 - 0.03, 0.3, '#ffd84a', { emit: 2.2 });
    text(mb, 'CASINO', cx, sy + 0.82, z1 - 0.03, 0.08, '#ff4fa3', { emit: 2.0 });
    // a tall neon blade on the corner
    const bx = x1 + 0.35, bz = z1 + 0.35;
    mb.box(bx, 1.2, bz, 0.35, 8.2, 0.9, '#120a16');
    'LUCKY'.split('').forEach((ch, i) => text(mb, ch, bx + 0.19, 8.0 - i * 1.25, bz, 0.13, '#3ff0ff', { emit: 2, dir: 'z' }));
    mb.box(bx + 0.19, 1.3, bz, 0.04, 8.0, 0.06, '#ff4fa3', { emit: 1.8 }); mb.box(bx + 0.19, 1.3, bz - 0.4, 0.04, 8.0, 0.06, '#ff4fa3', { emit: 1.8 });
    // palms in gold planters either side of the entrance
    for (const s of [-3.8, 3.8]) { mb.box(ex + s, 0, z1 + 1.2, 0.9, 0.6, 0.9, gold, { mat: W(MT.metal, 0.1) }); C.palm(mb, ex + s, z1 + 1.2, 0.6); }
    return H + sh + 1;
  };
  FACADE.casinoLights = b => { const z1 = b.z + b.d, ex = b.door != null ? b.door : b.x + b.w / 2; return [{ x: ex, y: 2.2, z: z1 + 2.2, r: 6, c: [1, 0.75, 0.4], i: 1.2 }, { x: b.x + b.w / 2, y: 9, z: z1 + 1.5, r: 7, c: [1, 0.4, 0.75], i: 1.0, night: true }, { x: b.x + b.w + 0.8, y: 4, z: z1 + 0.8, r: 5, c: [0.3, 0.9, 1], i: 0.8, night: true }]; };

  // ------------------------------------------------------------------ dockside sheds and the market
  FACADE.shed = function (mb, b) {
    const x0 = b.x, z0 = b.z, x1 = x0 + b.w, z1 = z0 + b.d, cx = (x0 + x1) / 2, cz = (z0 + z1) / 2, H = b.h || 4.2;
    const col = b.wall || '#6a7a8a';
    mb.box(cx, 0, cz, b.w, H, b.d, col, { mat: W(MT.metal, b.wear != null ? b.wear : 0.5), top: '#4a4650', topMat: W(MT.metal, 0.5) });
    // corrugation ribs on the front and side
    for (let k = 0.2; k < b.w; k += 0.35) mb.box(x0 + k, 0, z1 + 0.02, 0.06, H, 0.04, shadeC(col, 0.8));
    for (let k = 0.2; k < b.d; k += 0.35) mb.box(x1 + 0.02, 0, z0 + k, 0.04, H, 0.06, shadeC(col, 0.8));
    // a pitched roof edge
    mb.box(cx, H, cz, b.w + 0.3, 0.25, b.d + 0.3, '#3a3a44', { mat: W(MT.metal, 0.6) });
    // roll-up doors with hazard stripes, one half open and lit inside
    const doors = b.doors || 2, dw = Math.min(2.6, (b.w - 1) / doors - 0.4);
    for (let d = 0; d < doors; d++) {
      const dx = x0 + (b.w / doors) * (d + 0.5), open = d === 0;
      mb.box(dx, 0, z1 + 0.04, dw + 0.3, 3.0, 0.06, '#2a2a30');
      if (open) { mb.box(dx, 1.6, z1 + 0.08, dw, 1.35, 0.05, '#8a9098', { mat: W(MT.metal, 0.4) }); mb.box(dx, 0.02, z1 + 0.05, dw, 1.55, 0.03, '#ffe2a0', { emit: 0.6 }); }
      else for (let r = 0; r < 10; r++) mb.box(dx, 0.05 + r * 0.29, z1 + 0.08, dw, 0.24, 0.05, '#8a9098', { mat: W(MT.metal, 0.5) });
      for (let k = 0; k < 6; k++) mb.box(dx - dw / 2 - 0.1 + k * (dw + 0.2) / 5, 0, z1 + 0.1, 0.1, 0.25, 0.04, k % 2 ? '#1a1a1a' : '#e8c13c');
    }
    // sign board
    if (b.label) { const tw = textWidth(b.label, 0.065); mb.box(cx, H - 1.0, z1 + 0.08, tw + 0.6, 0.65, 0.06, b.signBg || '#e8e2d8'); text(mb, b.label, cx, H - 0.9, z1 + 0.13, 0.065, b.signCol || '#2a2a30', { emit: b.signEmit || 0 }); }
    // a wall lamp over each door
    for (let d = 0; d < doors; d++) { const dx = x0 + (b.w / doors) * (d + 0.5); mb.box(dx, 3.15, z1 + 0.2, 0.4, 0.12, 0.3, '#2a2a30'); mb.box(dx, 3.08, z1 + 0.25, 0.3, 0.05, 0.2, '#ffe2a0', { emit: 1.4 }); }
    return H + 1;
  };
  function shadeC(hex, f) { return KIT.shade(hex, f); }
  FACADE.shedLights = b => { const out = [], doors = b.doors || 2; for (let d = 0; d < doors; d++) out.push({ x: b.x + (b.w / doors) * (d + 0.5), y: 3, z: b.z + b.d + 1, r: 3.6, c: [1, 0.85, 0.55], i: 0.8, night: true }); return out; };
  FACADE.market = function (mb, b) {
    const H = FACADE.shed(mb, Object.assign({}, b, { doors: 1, label: null }));
    const x0 = b.x, z1 = b.z + b.d;
    // striped awning, stalls with ice and fish, a hanging sign
    for (let k = 0; k < b.w / 0.5; k++) mb.box(x0 + 0.25 + k * 0.5, 2.6, z1 + 0.9, 0.5, 0.08, 1.8, k % 2 ? '#e8e2d8' : '#2f6a9a');
    for (let s = 0; s < 3; s++) {
      const sx = x0 + 1.2 + s * (b.w - 2.4) / 2;
      mb.box(sx, 0, z1 + 1.1, 1.6, 0.85, 0.8, '#6a4a32', { mat: W(MT.wood, 0.5) });
      mb.box(sx, 0.85, z1 + 1.1, 1.5, 0.08, 0.7, '#dff4ff', { mat: W(MT.tile, 0.1) });
      for (let f = 0; f < 5; f++) mb.box(sx - 0.55 + f * 0.27, 0.95, z1 + 1.05 + (f % 2) * 0.15, 0.22, 0.06, 0.08, ['#c8ccd4', '#e8836a', '#9aa4b0'][f % 3]);
    }
    const tw = textWidth('FISH MARKET', 0.07);
    mb.box(b.x + b.w / 2, 3.1, z1 + 0.06, tw + 0.6, 0.7, 0.06, '#2f6a9a');
    text(mb, 'FISH MARKET', b.x + b.w / 2, 3.22, z1 + 0.11, 0.07, '#3ff0ff', { emit: 1.6 });
    return H;
  };
  // food truck (a prop you can buy from)
  K.foodtruck = { build: (mb, o) => {
    mb.at(o.x, 0, o.z, o.rot || 0);
    for (const sx of [-0.55, 0.55]) for (const sz of [-1.0, 1.0]) { mb.at(sx, 0.2, sz, 0, 1, 0, Math.PI / 2); mb.cyl(0, -0.1, 0, 0.2, 0.2, 8, '#18181c'); mb.pop(); }
    mb.box(0, 0.25, 0, 1.3, 1.8, 3.0, o.col || '#e8e2d8', { mat: W(MT.metal, 0.2) });
    mb.box(0.66, 0.95, -0.2, 0.04, 0.8, 1.7, '#18181e');
    mb.box(0.67, 1.0, -0.2, 0.03, 0.7, 1.6, '#ffe2a0', { emit: 0.7 });
    mb.box(0.95, 0.95, -0.2, 0.6, 0.05, 1.8, o.col2 || '#c8443c');
    mb.box(0.66, 1.85, -0.2, 0.04, 0.4, 2.2, o.col2 || '#c8443c');
    text(mb, o.label || 'TACOS', 0.69, 1.9, -0.2, 0.045, '#fff2b0', { emit: 1.4, dir: 'z' });
    mb.box(0, 2.05, 0.8, 0.5, 0.25, 0.5, '#3a3a44');
    mb.pop();
  }, foot: o => { const q = Math.abs(Math.sin(o.rot || 0)) > 0.5; return q ? rectFoot(o.x - 1.5, o.z - 0.7, 3.0, 1.4) : rectFoot(o.x - 0.7, o.z - 1.5, 1.4, 3.0); }, light: o => ({ x: o.x + 1.2, y: 1.6, z: o.z, r: 3.2, c: [1, 0.85, 0.55], i: 0.8, night: true }) };
})();
