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

  // =====================================================================
  // Bel Vista, Palm Shore and the airport
  // =====================================================================
  const rotFoot = (o, w, d) => (Math.abs(Math.sin(o.rot || 0)) > 0.7 ? rectFoot(o.x - d / 2, o.z - w / 2, d, w) : rectFoot(o.x - w / 2, o.z - d / 2, w, d));
  const post = r => o => { rectFoot(o.x - r, o.z - r, r * 2, r * 2); return []; };
  // a modern hillside villa: white boxes, a cantilevered upper floor, walls of glass, flat roofs, a lit pool deck
  FACADE.mansion = function (mb, b) {
    const x0 = b.x, z0 = b.z, x1 = x0 + b.w, z1 = z0 + b.d, cx = (x0 + x1) / 2, cz = (z0 + z1) / 2;
    const white = '#f2efe8', stone = '#c8b89a', glassC = '#9fc8e0';
    // ground floor: stone base + glass front
    mb.box(cx, 0, cz, b.w, 2.6, b.d, white, { mat: W(MT.plaster, 0.05), top: '#e8e4dc' });
    mb.box(x0 + b.w * 0.3, 0, z1 + 0.02, b.w * 0.55, 2.4, 0.05, '#ffe2b0', { emit: 0.45, mat: W(MT.glass, 0.05) });
    for (let k = 0; k <= 5; k++) mb.box(x0 + 0.3 + k * b.w * 0.55 / 5 + b.w * 0.025, 0, z1 + 0.06, 0.06, 2.4, 0.06, '#2a2a30');
    mb.box(x1 - 1.4, 0, z1 + 0.02, 2.2, 2.6, 0.1, stone, { mat: W(MT.brick, 0.1) });
    mb.box(x1 + 0.02, 0.2, cz, 0.05, 2.0, b.d * 0.5, glassC, { emit: 0.3, mat: W(MT.glass, 0.05) });
    // upper floor cantilevers out over the terrace
    mb.box(cx + 0.8, 2.6, cz + 0.6, b.w - 1.2, 2.4, b.d - 0.4, white, { mat: W(MT.plaster, 0.05), top: '#d8d4cc' });
    mb.box(cx + 0.8, 2.75, cz + 0.6 + (b.d - 0.4) / 2 + 0.02, b.w - 2.4, 1.9, 0.05, glassC, { emit: 0.35, mat: W(MT.glass, 0.05) });
    mb.box(x1 + 0.22, 2.75, cz + 0.6, 0.05, 1.9, b.d - 1.6, glassC, { emit: 0.3, mat: W(MT.glass, 0.05) });
    mb.box(cx + 0.8, 5.0, cz + 0.6, b.w - 0.8, 0.18, b.d + 0.2, '#2a2a30');
    // wood slats and a roof garden
    for (let k = 0; k < 6; k++) mb.box(x0 + 0.4 + k * 0.18, 2.75, z1 + 0.65, 0.08, 1.9, 0.06, '#8a5a36');
    mb.box(cx + 0.8, 5.18, cz + 0.6, b.w - 2, 0.15, b.d - 2, '#4a7a3a', { mat: W(MT.grass, 0.2) });
    return 6;
  };
  FACADE.mansionLights = b => [{ x: b.x + b.w / 2, y: 2, z: b.z + b.d + 1.6, r: 5, c: [1, 0.85, 0.6], i: 0.9, night: true }];
  // The Bel Vista: a grand pink hotel, green-striped awnings, script sign on the roof
  FACADE.hotel = function (mb, b) {
    const x0 = b.x, z0 = b.z, x1 = x0 + b.w, z1 = z0 + b.d, cx = (x0 + x1) / 2, cz = (z0 + z1) / 2, H = 4 * STOREY + 0.6;
    const pink = '#e8a0a8', pinkD = '#c98088', green = '#2f6a4a', cream = '#f2ead8';
    mb.box(cx, 0, cz, b.w, H, b.d, pink, { mat: W(MT.plaster, 0.1), top: '#c87a5a', topMat: W(MT.roof, 0.2) });
    // centre tower with a bell-shaped top
    mb.box(cx, H, cz + 1, 5, 2.4, 4, pink, { mat: W(MT.plaster, 0.1) });
    mb.box(cx, H + 2.4, cz + 1, 5.4, 0.3, 4.4, cream);
    mb.box(cx, H + 2.7, cz + 1, 3.6, 1.0, 2.8, green, { mat: W(MT.roof, 0.2) });
    for (let f = 0; f < 4; f++) {
      const y = 0.6 + f * STOREY;
      mb.box(cx, y + STOREY - 0.5, z1 + 0.03, b.w + 0.05, 0.12, 0.06, cream);
      for (let k = 0.8; k < b.w - 0.5; k += 1.1) {
        if (f === 0 && Math.abs(x0 + k + 0.35 - cx) < 2.2) continue;
        mb.box(x0 + k + 0.35, y + 0.25, z1 + 0.04, 0.6, 1.1, 0.04, '#ffe6b8', { emit: 0.55, mat: W(MT.glass, 0.05) });
        mb.box(x0 + k + 0.35, y + 1.38, z1 + 0.25, 0.75, 0.08, 0.45, k % 2.2 < 1.1 ? green : cream);
      }
      for (let k = 0.8; k < b.d - 0.5; k += 1.1) mb.box(x1 + 0.04, y + 0.25, z0 + k + 0.35, 0.04, 1.1, 0.6, '#ffe6b8', { emit: 0.5, mat: W(MT.glass, 0.05) });
    }
    // porte-cochère: striped canopy, columns, red carpet, potted palms
    mb.box(cx, 2.7, z1 + 2.0, 5.0, 0.4, 4.0, cream);
    for (let k = 0; k < 10; k++) mb.box(cx - 2.25 + k * 0.5, 2.65, z1 + 4.02, 0.5, 0.35, 0.04, k % 2 ? green : cream);
    for (const sx of [-2.2, 2.2]) for (const sz of [1.4, 3.6]) mb.cyl(cx + sx, 0, z1 + sz, 0.14, 2.7, 8, cream);
    mb.box(cx, 0.15, z1 + 0.05, 2.6, 2.3, 0.06, '#ffe2b0', { emit: 0.8, mat: W(MT.glass, 0.05) });
    mb.box(cx, 0.005, z1 + 2.2, 1.8, 0.03, 4.4, '#2f6a4a', { mat: W(MT.carpet, 0.2) });
    // the sign
    const tw = textWidth('THE BEL VISTA', 0.16);
    mb.box(cx, H + 0.2, z1 - 0.4, tw + 0.8, 1.5, 0.12, '#1e2a22');
    text(mb, 'THE BEL VISTA', cx, H + 0.55, z1 - 0.3, 0.16, '#7af0b0', { emit: 2 });
    return H + 4;
  };
  FACADE.hotelLights = b => [{ x: b.x + b.w / 2, y: 2.4, z: b.z + b.d + 2.5, r: 6, c: [1, 0.85, 0.6], i: 1.1 }, { x: b.x + b.w / 2, y: 9, z: b.z + b.d, r: 6, c: [0.5, 1, 0.75], i: 0.8, night: true }];
  // airport terminal: a long glass hall under a wave roof, front faces east onto Terminal Drive
  FACADE.terminal = function (mb, b) {
    const x0 = b.x, z0 = b.z, x1 = x0 + b.w, z1 = z0 + b.d, cx = (x0 + x1) / 2, cz = (z0 + z1) / 2, H = 7;
    mb.box(cx, 0, cz, b.w, H, b.d, '#c8ccd4', { mat: W(MT.metal, 0.1), top: '#e8eaee' });
    // the glass curtain wall on the east face and the south end
    mb.box(x1 + 0.03, 0.2, cz, 0.05, H - 0.8, b.d - 1, '#9fd0f0', { emit: 0.45, mat: W(MT.glass, 0.05) });
    for (let k = 0.5; k < b.d; k += 1.4) mb.box(x1 + 0.07, 0, z0 + k, 0.08, H, 0.08, '#5a6070');
    mb.box(x1 + 0.07, 3.4, cz, 0.08, 0.12, b.d, '#5a6070');
    mb.box(cx, 0.2, z1 + 0.03, b.w - 1, H - 0.8, 0.05, '#9fd0f0', { emit: 0.4, mat: W(MT.glass, 0.05) });
    for (let k = 0.5; k < b.w; k += 1.4) mb.box(x0 + k, 0, z1 + 0.07, 0.08, H, 0.08, '#5a6070');
    // the wave roof: slabs stepping up and down along the length
    for (let k = 0; k < b.d; k += 1) { const y = H + 0.6 + Math.sin(k / b.d * Math.PI * 2) * 0.6; mb.box(cx + 0.6, y, z0 + k + 0.5, b.w + 2.6, 0.22, 1.02, '#e8eaee', { mat: W(MT.metal, 0.1) }); }
    // drop-off canopy over the curb
    mb.box(x1 + 2.2, 3.4, cz, 4.2, 0.2, b.d - 4, '#e8eaee', { mat: W(MT.metal, 0.1) });
    for (let k = 3; k < b.d - 2; k += 4) mb.cyl(x1 + 3.9, 0, z0 + k, 0.1, 3.4, 8, '#5a6070');
    // signs
    text(mb, 'HARBOR INTERNATIONAL', x1 + 0.1, H - 1.2, cz, 0.13, '#3ff0ff', { emit: 2, dir: 'z' });
    for (const [t, z, col] of [['DEPARTURES', cz - 4, '#ffd84a'], ['ARRIVALS', cz + 5, '#59ff8a']]) { mb.box(x1 + 4.35, 3.0, z, 0.08, 0.38, textWidth(t, 0.045) + 0.4, '#18181e'); text(mb, t, x1 + 4.4, 3.05, z, 0.045, col, { emit: 1.8, dir: 'z' }); }
    return H + 2;
  };
  FACADE.terminalLights = b => { const out = []; for (let k = 4; k < b.d; k += 8) out.push({ x: b.x + b.w + 2.5, y: 3, z: b.z + k, r: 6, c: [0.8, 0.9, 1], i: 0.9 }); return out; };
  FACADE.ctower = function (mb, b) {
    const cx = b.x + b.w / 2, cz = b.z + b.d / 2;
    mb.cyl(cx, 0, cz, 0.9, 13, 10, '#c8ccd4', { mat: W(MT.concrete, 0.2) });
    mb.cyl(cx, 13, cz, 1.9, 0.4, 10, '#5a6070');
    mb.cyl(cx, 13.4, cz, 1.8, 1.8, 10, '#2a4a68', { emit: 0.5, mat: W(MT.glass, 0.05) });
    mb.cyl(cx, 15.2, cz, 2.0, 0.35, 10, '#c8ccd4');
    mb.box(cx, 15.5, cz, 0.12, 1.6, 0.12, '#5a6070'); mb.box(cx, 17.1, cz, 0.25, 0.25, 0.25, '#ff3a3a', { emit: 2.2 });
    mb.box(cx, 0, cz, b.w, 2.4, b.d, '#c8ccd4', { mat: W(MT.concrete, 0.2) });
    return 18;
  };
  FACADE.ctowerLights = b => [{ x: b.x + b.w / 2, y: 14, z: b.z + b.d / 2, r: 5, c: [0.4, 0.7, 1], i: 0.8, night: true }];
  FACADE.beachshop = function (mb, b) {
    const H = FACADE.shed(mb, Object.assign({ doors: 1, h: 3.2, wear: 0.3 }, b, { label: null }));
    const x1 = b.x + b.w, cz = b.z + b.d / 2;
    for (let k = 0; k < b.d / 0.5; k++) mb.box(x1 + 0.7, 2.4, b.z + 0.25 + k * 0.5, 1.4, 0.08, 0.5, k % 2 ? '#ffffff' : b.awning || '#ff7a3a');
    const tw = textWidth(b.label, 0.06);
    mb.box(x1 + 0.08, 2.75, cz, 0.06, 0.55, tw + 0.5, '#18181e');
    text(mb, b.label, x1 + 0.12, 2.83, cz, 0.06, b.signCol || '#ffd84a', { emit: 1.8, dir: 'z' });
    if (b.boards) for (let k = 0; k < 4; k++) { mb.at(x1 + 0.35, 0.2, b.z + 0.5 + k * 0.45, 0, 1, -0.25); mb.box(0, 0, 0, 0.12, 1.9, 0.38, ['#3ff0ff', '#ff4fa3', '#ffd84a', '#59ff8a'][k]); mb.pop(); }
    return H;
  };
  // kinds
  K.palm = { build: (mb, o) => C.palm(mb, o.x, o.z, Math.floor(o.x * 7 + o.z * 3), o.h || 4.6), foot: post(0.22) };
  K.hedge = { build: (mb, o) => { const w = o.w || 2, d = o.d || 0.6; mb.box(o.x, 0.1, o.z, w, o.hgt || 1.1, d, '#2f5a2a', { mat: W(MT.grass, 0.1) }); mb.box(o.x, (o.hgt || 1.1) + 0.1, o.z, w - 0.1, 0.12, d - 0.1, '#3a6a32', { mat: W(MT.grass, 0.1) }); }, foot: o => rectFoot(o.x - (o.w || 2) / 2, o.z - (o.d || 0.6) / 2, o.w || 2, o.d || 0.6) };
  K.mpool = { build: (mb, o) => { mb.box(o.x, 0, o.z, o.w + 0.6, 0.3, o.d + 0.6, '#e8e4dc', { mat: W(MT.tile, 0.05) }); mb.box(o.x, 0.22, o.z, o.w, 0.1, o.d, '#3fc8e8', { emit: 0.45, mat: W(MT.water, 0) }); for (const s of [-1, 1]) { MOTEL_LOUNGER(mb, o.x + s * (o.w / 2 - 0.8), o.z + o.d / 2 + 1.3); } }, foot: o => rectFoot(o.x - o.w / 2 - 0.3, o.z - o.d / 2 - 0.3, o.w + 0.6, o.d + 0.6), light: o => ({ x: o.x, y: 0.6, z: o.z, r: 3.5, c: [0.3, 0.85, 1], i: 0.8, night: true }) };
  const MOTEL_LOUNGER = (mb, x, z) => { mb.box(x, 0.14, z, 0.7, 0.25, 1.6, '#f2efe8'); mb.at(x, 0.39, z - 0.55, 0, 1, 0.6); mb.box(0, 0, 0.2, 0.7, 0.06, 0.6, '#f2efe8'); mb.pop(); };
  K.beachumb = { build: (mb, o) => { mb.cyl(o.x, 0, o.z, 0.04, 2.0, 5, '#f2efe8'); mb.cone(o.x, 1.8, o.z, 1.1, 0.45, 8, o.col || '#ff7a3a', { sway: 0.1 }); mb.at(o.x + 0.7, 0.08, o.z + 0.4, o.rot || 0.3); mb.box(0, 0, 0, 0.8, 0.02, 1.7, o.towel || '#3ff0ff'); mb.box(0, 0, -0.5, 0.8, 0.021, 0.2, '#ffffff'); mb.pop(); }, foot: post(0.12) };
  K.lifeguard = { build: (mb, o) => { for (const [x, z] of [[-0.7, -0.7], [0.7, -0.7], [-0.7, 0.7], [0.7, 0.7]]) mb.box(o.x + x, 0, o.z + z, 0.1, 2.2, 0.1, '#f2efe8'); mb.box(o.x, 2.2, o.z, 1.9, 1.3, 1.9, '#e8c13c', { mat: W(MT.wood, 0.3) }); mb.box(o.x, 2.75, o.z + 0.96, 1.4, 0.5, 0.04, '#9fd0f0', { emit: 0.2 }); mb.box(o.x, 3.5, o.z, 2.2, 0.15, 2.2, '#c8443c'); mb.at(o.x + 0.3, 0, o.z + 1.4, 0, 1, -0.6); mb.box(0, 1.1, 0, 0.6, 0.06, 2.4, '#f2efe8'); mb.pop(); text(mb, 'LIFEGUARD', o.x, 2.4, o.z + 0.97, 0.035, '#c8443c'); }, foot: o => rectFoot(o.x - 0.8, o.z - 0.8, 1.6, 1.6) };
  K.volley = { build: (mb, o) => { for (const s of [-2.2, 2.2]) mb.box(o.x + s, 0, o.z, 0.08, 2.3, 0.08, '#f2efe8'); mb.box(o.x, 1.6, o.z, 4.4, 0.6, 0.02, '#2a2a30'); mb.box(o.x, 2.2, o.z, 4.4, 0.06, 0.03, '#f2efe8'); mb.sphere(o.x + 1, 0.15, o.z + 1.5, 0.14, '#ffd84a'); }, foot: o => [...rectFoot(o.x - 2.3, o.z - 0.1, 0.2, 0.2), ...rectFoot(o.x + 2.1, o.z - 0.1, 0.2, 0.2)] };
  K.gymrack = { build: (mb, o) => { mb.box(o.x, 0, o.z, 2.4, 0.1, 1.2, '#2a2a30'); for (const s of [-0.9, 0.9]) mb.box(o.x + s, 0, o.z, 0.1, 1.6, 0.1, '#8a919c'); mb.box(o.x, 1.4, o.z, 2.2, 0.05, 0.05, '#c8ccd4'); for (const s of [-1.1, 1.1]) mb.cyl(o.x + s, 1.2, o.z, 0.25, 0.08, 10, '#18181e'); mb.box(o.x, 0.4, o.z + 0.5, 1.4, 0.12, 0.3, '#c8443c'); }, foot: o => rectFoot(o.x - 1.2, o.z - 0.6, 2.4, 1.2) };
  // a parked airliner at the gate (or on the apron)
  function jetMesh(mb, s = 1, livery = '#c8443c') {
    const white = '#f2f2f4';
    mb.box(0, 0.6 * s, 0, 1.4 * s, 1.4 * s, 9 * s, white, { mat: W(MT.metal, 0.1) });
    mb.box(0, 0.75 * s, 4.6 * s, 1.1 * s, 1.0 * s, 0.6 * s, white); mb.box(0, 1.25 * s, 4.75 * s, 0.9 * s, 0.25 * s, 0.4 * s, '#1e2a3a', { emit: 0.2 });
    mb.box(0, 0.75 * s, -4.7 * s, 0.9 * s, 0.9 * s, 0.8 * s, white);
    mb.box(0, 1.2 * s, 0.4 * s, 9.5 * s, 0.14 * s, 1.6 * s, white, { mat: W(MT.metal, 0.1) });
    for (const sx of [-2.4, 2.4]) mb.cyl(sx * s, 0.5 * s, 0.9 * s, 0.35 * s, 1.2 * s, 10, '#c8ccd4');
    mb.box(0, 1.9 * s, -4.4 * s, 0.12 * s, 2.0 * s, 1.4 * s, livery);
    mb.box(0, 1.9 * s, -4.5 * s, 3.4 * s, 0.1 * s, 0.9 * s, white);
    mb.box(0, 1.3 * s, 0, 1.42 * s, 0.18 * s, 8.6 * s, livery);
    for (let k = -3.5; k < 3.5; k += 0.5) for (const sx of [-0.71, 0.71]) mb.box(sx * s, 1.05 * s, k * s, 0.02, 0.14 * s, 0.18 * s, '#1e2a3a', { emit: 0.3 });
    for (const [x, z] of [[0, 3.3], [-0.9, -0.2], [0.9, -0.2]]) mb.box(x * s, 0, z * s, 0.15 * s, 0.6 * s, 0.15 * s, '#2a2a30');
  }
  FACADE.jetMesh = jetMesh;
  K.jet = { build: (mb, o) => { mb.at(o.x, 0, o.z, o.rot || 0); jetMesh(mb, o.s || 1, o.col); mb.pop(); }, foot: o => rotFoot(o, 2.0 * (o.s || 1), 9 * (o.s || 1)), light: o => ({ x: o.x, y: 3, z: o.z, r: 5, c: [0.9, 0.95, 1], i: 0.6, night: true }) };
  // ferris wheel on the pier (the wheel itself is drawn turning, see south.js)
  K.ferrisbase = { build: (mb, o) => { for (const s of [-1, 1]) { mb.at(o.x, 0, o.z + s * 0.9, 0, 1, s * 0.0); mb.box(-1.6, 0, 0, 0.25, 0.25, 0.25, '#c8ccd4'); mb.pop(); } for (const s of [-1, 1]) for (const dx of [-1.8, 1.8]) { mb.at(o.x + dx * 0.5, 0, o.z + s * 0.9, 0, 1, dx > 0 ? 0.28 : -0.28); mb.box(0, 0, 0, 0.2, 7.4, 0.2, '#e8e2d8'); mb.pop(); } mb.box(o.x, 0, o.z, 3.6, 0.4, 2.4, '#3a3a44'); mb.box(o.x + 2.2, 0, o.z + 1.6, 1.4, 1.2, 1.0, '#c8443c'); text(mb, 'RIDE', o.x + 2.2, 0.45, o.z + 2.12, 0.04, '#ffd84a', { emit: 1.6 }); }, foot: o => rectFoot(o.x - 1.9, o.z - 1.3, 3.8, 2.6), light: o => ({ x: o.x, y: 7, z: o.z, r: 8, c: [1, 0.5, 0.8], i: 1.2, night: true }) };
  FACADE.wheelMesh = function (mb) {
    const R = 6.4, n = 16;
    for (let k = 0; k < n; k++) {
      const a = k / n * Math.PI * 2, a2 = (k + 1) / n * Math.PI * 2;
      const y = Math.sin(a) * R, z = Math.cos(a) * R;
      // rim segment and spoke
      const am = (a + a2) / 2, ym = Math.sin(am) * R * Math.cos(Math.PI / n), zm = Math.cos(am) * R * Math.cos(Math.PI / n);
      mb.at(0, ym, zm, 0, 1, -am + Math.PI / 2); mb.box(0, -0.06, 0, 0.12, 0.12, R * 2 * Math.sin(Math.PI / n) + 0.1, k % 2 ? '#ff4fa3' : '#3ff0ff', { emit: 1.4 }); mb.pop();
      mb.at(0, y / 2, z / 2, 0, 1, -a); mb.box(0, -0.03, 0, 0.06, 0.06, R, '#e8e2d8'); mb.pop();
      // gondola hangs straight down: drawn separately so it stays level
    }
    mb.cyl(0, -0.3, 0, 0.5, 0.6, 8, '#c8ccd4');
  };
  FACADE.gondolaMesh = function (mb) { mb.box(0, -0.9, 0, 0.9, 0.7, 0.9, '#ffd84a'); mb.box(0, -0.25, 0, 1.0, 0.1, 1.0, '#c8443c'); mb.box(0, -0.2, 0, 0.05, 0.4, 0.05, '#c8ccd4'); };
})();