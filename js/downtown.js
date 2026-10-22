// Downtown: glass skyscrapers, Aurora Tower (penthouse), the bank, the Lucky 7 casino, cafe,
// boutique, Central Park, and the train/taxi links back to Lowtown.
(function () {
  const { MB, MT, W, P, R, pick, shade, text } = KIT;
  const C = CITY, F = INT.F;
  const K = BUILD.K, rectFoot = BUILD.rectFoot;
  const STOREY = C.STOREY;

  // =====================================================================
  // models
  // =====================================================================
  const DT = window.DT = {};
  // a glass skyscraper on a stone podium; returns its height
  DT.tower = function (mb, b) {
    const seed = b.seed || (b.x * 13 + b.z * 7), r = k => R(seed, k, 5);
    const glass = b.glass || pick(['#1e3a5a', '#24324a', '#1a3a48', '#2a2a44', '#203848'], r(1));
    const frame = b.frame || pick(['#8a96a8', '#5a6070', '#b8b0a0', '#3a3f4a'], r(2));
    const pod = b.podium || { floors: 2, col: pick(['#c8c0b0', '#8a8478', '#4a4a52', '#b8a890'], r(3)) };
    const podH = pod.floors * STOREY + 0.2;
    const cx = b.x + b.w / 2, cz = b.z + b.d / 2;
    // podium
    mb.box(cx, 0, cz, b.w, podH, b.d, pod.col, { mat: W(MT.marble, 0.25), top: '#3a3a40', topMat: W(MT.roof, 0.4) });
    // ground-floor glass on the camera-facing sides
    mb.box(cx, 0.15, b.z + b.d + 0.01, b.w - 0.6, STOREY - 0.3, 0.04, '#ffe2a8', { emit: 0.5, mat: W(MT.glass, 0.1) });
    mb.box(b.x + b.w + 0.01, 0.15, cz, 0.04, STOREY - 0.3, b.d - 0.6, '#ffe2a8', { emit: 0.45, mat: W(MT.glass, 0.1) });
    for (let k = 1; k < b.w; k += 2) mb.box(b.x + k, 0.1, b.z + b.d + 0.05, 0.08, STOREY - 0.1, 0.06, frame);
    for (let k = 1; k < b.d; k += 2) mb.box(b.x + b.w + 0.05, 0.1, b.z + k, 0.06, STOREY - 0.1, 0.08, frame);
    // entrance canopy
    if (b.entrance !== false) {
      const ex = b.face === 'e' ? b.x + b.w + 0.8 : cx, ez = b.face === 'e' ? cz : b.z + b.d + 0.8;
      if (b.face === 'e') { mb.box(ex, STOREY - 0.15, ez, 1.8, 0.12, 3.2, frame, { mat: W(MT.metal, 0.2) }); mb.box(ex + 0.8, 0, ez - 1.5, 0.08, STOREY - 0.15, 0.08, frame); mb.box(ex + 0.8, 0, ez + 1.5, 0.08, STOREY - 0.15, 0.08, frame); }
      else { mb.box(ex, STOREY - 0.15, ez, 3.2, 0.12, 1.8, frame, { mat: W(MT.metal, 0.2) }); mb.box(ex - 1.5, 0, ez + 0.8, 0.08, STOREY - 0.15, 0.08, frame); mb.box(ex + 1.5, 0, ez + 0.8, 0.08, STOREY - 0.15, 0.08, frame); }
    }
    if (b.sign) {
      if (b.face === 'e') text(mb, b.sign.text, b.x + b.w + 0.06, podH - 0.7, cz, 0.07, b.sign.col, { dir: 'z', emit: 1.2 });
      else text(mb, b.sign.text, cx, podH - 0.7, b.z + b.d + 0.06, 0.07, b.sign.col, { emit: 1.2 });
    }
    // tower shaft(s): main body, then a setback crown section
    const inset = 0.5;
    const segs = [{ f0: 0, f1: Math.round(b.floors * 0.7), ins: inset }, { f0: Math.round(b.floors * 0.7), f1: b.floors, ins: inset + (b.w > 7 ? 0.9 : 0.5) }];
    let top = podH;
    for (const sg of segs) {
      const x0 = b.x + sg.ins, z0 = b.z + sg.ins, w = b.w - sg.ins * 2, d = b.d - sg.ins * 2;
      const y0 = podH + sg.f0 * STOREY, h = (sg.f1 - sg.f0) * STOREY;
      if (h <= 0) continue;
      mb.box(x0 + w / 2, y0, z0 + d / 2, w, h, d, glass, { mat: W(MT.glass, 0.15), top: frame, topMat: W(MT.roof, 0.3) });
      // mullions (south and east faces) and floor bands
      const colsS = Math.max(2, Math.round(w / 1.15)), colsE = Math.max(2, Math.round(d / 1.15));
      for (let k = 0; k <= colsS; k++) mb.box(x0 + w * k / colsS, y0, z0 + d + 0.02, 0.07, h, 0.06, frame, { mat: W(MT.metal, 0.2) });
      for (let k = 0; k <= colsE; k++) mb.box(x0 + w + 0.02, y0, z0 + d * k / colsE, 0.06, h, 0.07, frame, { mat: W(MT.metal, 0.2) });
      for (let f = sg.f0; f <= sg.f1; f++) {
        const y = podH + f * STOREY;
        mb.box(x0 + w / 2, y - 0.06, z0 + d + 0.03, w + 0.04, 0.12, 0.05, frame, { mat: W(MT.metal, 0.2) });
        mb.box(x0 + w + 0.03, y - 0.06, z0 + d / 2, 0.05, 0.12, d + 0.04, frame, { mat: W(MT.metal, 0.2) });
        if (f === sg.f1) break;
        // lit offices
        for (let k = 0; k < colsS; k++) if (R(seed + f * 31, k, 7) < (b.lit || 0.33)) { const warm = R(seed + k, f, 8) > 0.35; mb.box(x0 + w * (k + 0.5) / colsS, y + 0.25, z0 + d + 0.035, w / colsS - 0.16, STOREY - 0.55, 0.02, warm ? '#ffd890' : '#a8dcff', { emit: 0.75, mat: W(MT.glass, 0.1) }); }
        for (let k = 0; k < colsE; k++) if (R(seed + f * 37, k, 9) < (b.lit || 0.33)) { const warm = R(seed + k, f, 10) > 0.35; mb.box(x0 + w + 0.035, y + 0.25, z0 + d * (k + 0.5) / colsE, 0.02, STOREY - 0.55, d / colsE - 0.16, warm ? '#ffd890' : '#a8dcff', { emit: 0.7, mat: W(MT.glass, 0.1) }); }
      }
      top = y0 + h;
    }
    // crown
    const crown = b.crown || pick(['spire', 'flat', 'helipad', 'fins'], r(4));
    const tx = cx, tz = cz;
    if (crown === 'spire') { mb.box(tx, top, tz, 1.2, 1.2, 1.2, frame, { mat: W(MT.metal, 0.2) }); mb.box(tx, top + 1.2, tz, 0.25, 6, 0.25, frame); mb.box(tx, top + 7.2, tz, 0.3, 0.3, 0.3, '#ff3a3a', { emit: 2 }); }
    else if (crown === 'helipad') { mb.box(tx, top, tz, Math.min(b.w, b.d) - 1.6, 0.25, Math.min(b.w, b.d) - 1.6, '#3a3a44', { mat: W(MT.concrete, 0.3) }); mb.box(tx - 0.5, top + 0.26, tz, 0.2, 0.02, 1.4, '#ffd84a', { emit: 0.6 }); mb.box(tx + 0.5, top + 0.26, tz, 0.2, 0.02, 1.4, '#ffd84a', { emit: 0.6 }); mb.box(tx, top + 0.26, tz, 1.0, 0.02, 0.2, '#ffd84a', { emit: 0.6 }); for (const [ox, oz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) mb.box(tx + ox * (Math.min(b.w, b.d) / 2 - 1), top + 0.25, tz + oz * (Math.min(b.w, b.d) / 2 - 1), 0.15, 0.15, 0.15, '#ff3a3a', { emit: 1.6 }); }
    else if (crown === 'fins') { for (let k = -2; k <= 2; k++) mb.box(tx + k * 0.9, top, tz, 0.15, 2.4 - Math.abs(k) * 0.6, b.d - 2, frame, { mat: W(MT.metal, 0.2) }); mb.box(tx, top + 2.4, tz, 0.2, 0.2, 0.2, '#ff3a3a', { emit: 2 }); }
    else { mb.box(tx, top, tz, b.w - 2, 0.9, b.d - 2, '#5a5a64', { mat: W(MT.metal, 0.4) }); mb.box(tx + 1, top + 0.9, tz, 1.2, 0.8, 1.2, '#7a7a84', { mat: W(MT.metal, 0.4) }); }
    if (b.neon) { // a vertical neon blade on the corner
      const nx = b.x + b.w + 0.3, nz = b.z + b.d + 0.3;
      mb.box(nx, podH + 1, nz, 0.25, Math.min(14, (b.floors - 2) * STOREY), 0.25, b.neon, { emit: 1.6, mat: W(MT.neon, 0) });
    }
    return top + 3;
  };
  DT.fountain = function (mb, x, z, r = 2.2) {
    mb.cyl(x, 0.02, z, r, 0.5, 16, '#b8b0a0', { mat: W(MT.marble, 0.3) });
    mb.cyl(x, 0.42, z, r - 0.25, 0.1, 16, '#2a6496', { mat: W(MT.water, 0) });
    mb.cyl(x, 0.5, z, 0.45, 1.1, 10, '#c8c0b0', { mat: W(MT.marble, 0.2) });
    mb.cyl(x, 1.6, z, 0.9, 0.15, 12, '#c8c0b0', { mat: W(MT.marble, 0.2) });
    mb.cyl(x, 1.75, z, 0.75, 0.06, 12, '#2a6496', { mat: W(MT.water, 0) });
    mb.cyl(x, 1.75, z, 0.12, 0.7, 6, '#c8c0b0');
  };

  // =====================================================================
  // new object kinds
  // =====================================================================
  const none = () => [];
  const at = (mb, o, f) => { mb.at(o.x, o.y || 0, o.z, o.rot || 0); f(); mb.pop(); };
  Object.assign(K, {
    dtfountain: { build: (mb, o) => DT.fountain(mb, o.x, o.z, o.r || 2.2), h: 1.6, anchor: o => { const r = o.r || 2.2; return { x: o.x, y: 1.4, z: o.z + r * 0.7, tiles: rectFoot(o.x - r, o.z - r, r * 2, r * 2) }; }, light: o => ({ x: o.x, y: 0.8, z: o.z, r: 4.5, c: [0.5, 0.85, 1], i: 0.9, night: true }) },
    atm: { build: (mb, o) => at(mb, o, () => { mb.box(0, 0, 0, 0.7, 1.5, 0.45, '#3a3f4a', { mat: W(MT.metal, 0.3) }); mb.box(0, 0.95, 0.23, 0.42, 0.32, 0.02, '#59ff8a', { emit: 0.9 }); mb.box(0, 0.7, 0.26, 0.5, 0.08, 0.1, '#2a2a30'); text(mb, 'ATM', 0, 1.3, 0.24, 0.025, '#e8e2d8', { emit: 0.8 }); }), h: 1.5, light: o => ({ x: o.x + Math.sin(o.rot || 0) * 0.6, y: 1.1, z: o.z + Math.cos(o.rot || 0) * 0.6, r: 2.2, c: [0.5, 1, 0.6], i: 0.6 }) },
    hotdog: { build: (mb, o) => at(mb, o, () => { for (const x of [-0.6, 0.6]) mb.cyl(x, 0.25, 0.42, 0.22, 0.06, 10, '#18181e'); mb.box(0, 0.25, 0, 1.6, 0.75, 0.8, '#e8e2d8', { mat: W(MT.metal, 0.4) }); mb.box(0, 1.0, 0, 1.6, 0.06, 0.8, '#c8ccd4', { mat: W(MT.metal, 0.3) }); mb.box(0, 1.06, 0, 0.06, 1.1, 0.06, '#5a5a64'); mb.box(0, 2.1, 0, 2.0, 0.08, 1.4, '#c8443c'); mb.box(0, 2.0, 0, 2.0, 0.1, 1.4, '#e8c13c'); text(mb, 'HOT DOGS', 0, 0.55, 0.41, 0.03, '#c8443c', {}); }), h: 1.4, light: o => ({ x: o.x, y: 1.6, z: o.z + 0.6, r: 3, c: [1, 0.85, 0.55], i: 0.8, night: true }) },
    chess: { build: (mb, o) => at(mb, o, () => { mb.box(0, 0, 0, 0.18, 0.7, 0.18, '#5a5a64'); mb.box(0, 0.7, 0, 0.9, 0.06, 0.9, '#c8c0b0', { mat: W(MT.marble, 0.2) }); for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) if ((i + j) % 2) mb.box(-0.3 + i * 0.2, 0.761, -0.3 + j * 0.2, 0.2, 0.004, 0.2, '#2a2a30'); for (const z of [-0.8, 0.8]) mb.box(0, 0, z, 0.7, 0.45, 0.35, '#8a6a4a', { mat: W(MT.wood, 0.5) }); }), h: 0.8 },
    tree: { build: (mb, o) => C.planterTree(mb, o.x, o.z, Math.floor(o.x * 7 + o.z * 3), o.kind || 'tree'), h: 2.5 },
    flowerbed: { build: (mb, o) => { mb.box(o.x, 0.02, o.z, o.w || 2, 0.35, o.d || 1, '#8a8478', { mat: W(MT.concrete, 0.3) }); for (let k = 0; k < (o.w || 2) * (o.d || 1) * 5; k++) { const cols = ['#ff4fa3', '#ffd84a', '#e8e2d8', '#b44bff']; mb.box(o.x - (o.w || 2) / 2 + 0.15 + R(k, 1, o.x) * ((o.w || 2) - 0.3), 0.37, o.z - (o.d || 1) / 2 + 0.15 + R(k, 2, o.z) * ((o.d || 1) - 0.3), 0.1, 0.12, 0.1, cols[k % 4], { sway: 0.3 }); } mb.box(o.x, 0.35, o.z, (o.w || 2) - 0.1, 0.05, (o.d || 1) - 0.1, '#3a6a2a', { mat: W(MT.grass, 0.4) }); }, h: 0.5 },
    statue: { build: (mb, o) => { mb.box(o.x, 0, o.z, 1.4, 1.2, 1.4, '#a8a090', { mat: W(MT.marble, 0.4) }); mb.box(o.x, 1.2, o.z, 0.5, 1.4, 0.4, '#4a7a6a', { mat: W(MT.metal, 0.6) }); mb.box(o.x, 2.6, o.z, 0.34, 0.36, 0.34, '#4a7a6a', { mat: W(MT.metal, 0.6) }); mb.box(o.x + 0.35, 2.0, o.z, 0.14, 0.8, 0.14, '#4a7a6a', { mat: W(MT.metal, 0.6) }); text(mb, 'FOUNDER', o.x, 0.6, o.z + 0.71, 0.025, '#2a2a30', {}); }, h: 3 },
    taxistand: { build: (mb, o) => { mb.box(o.x, 0, o.z, 0.1, 2.3, 0.1, '#3a3a44'); mb.box(o.x, 2.0, o.z + 0.0, 0.9, 0.45, 0.06, '#e8c13c', { emit: 0.5 }); text(mb, 'TAXI', o.x, 2.08, o.z + 0.04, 0.035, '#18181e', {}); }, h: 2.4, light: o => ({ x: o.x, y: 2, z: o.z + 0.6, r: 2.5, c: [1, 0.85, 0.3], i: 0.6, night: true }) },
    bigwindow: { build: (mb, o) => { // floor-to-ceiling window with the city at night behind it
      const len = o.w || 6; mb.box(o.x, 0, o.z, len, 0.1, 0.3, '#2a2a30');
      mb.box(o.x, 0.1, o.z - 0.05, len, 3.0, 0.05, '#0d1424', { mat: W(MT.glass, 0.1) });
      for (let k = 0; k < len * 3; k++) { const h = 0.4 + R(k, 1, 9) * 1.8; mb.box(o.x - len / 2 + 0.2 + k * 0.33, 0.4, o.z - 0.02, 0.26, h, 0.01, '#16203a'); for (let f = 0; f < h / 0.2 - 1; f++) if (R(k, f, 3) > 0.6) mb.box(o.x - len / 2 + 0.2 + k * 0.33, 0.45 + f * 0.2, o.z, 0.05, 0.06, 0.01, R(k, f, 4) > 0.5 ? '#ffd890' : '#a8dcff', { emit: 1 }); }
      for (let k = 0; k <= len; k += 1.5) mb.box(o.x - len / 2 + k, 0.1, o.z, 0.06, 3.0, 0.08, '#3a3a44'); }, h: 3, wall: true },
    hottub: { build: (mb, o) => { mb.box(o.x, 0, o.z, 2.2, 0.6, 2.2, '#e8e2d8', { mat: W(MT.tile, 0.2) }); mb.box(o.x, 0.6, o.z, 2.0, 0.06, 2.0, '#3fc8e8', { emit: 0.5, mat: W(MT.water, 0) }); for (const [x, z, w, d] of [[0, -1.03, 2.2, 0.14], [0, 1.03, 2.2, 0.14], [-1.03, 0, 0.14, 2.2], [1.03, 0, 0.14, 2.2]]) mb.box(o.x + x, 0.6, o.z + z, w, 0.15, d, '#e8e2d8', { mat: W(MT.tile, 0.2) }); }, h: 0.8, light: o => ({ x: o.x, y: 0.9, z: o.z, r: 3.5, c: [0.3, 0.85, 1], i: 0.9 }) },
    wardrobe: { build: (mb, o) => at(mb, o, () => { mb.box(0, 0, 0, 1.8, 2.2, 0.6, '#5a3a2a', { mat: W(MT.wood, 0.3) }); mb.box(-0.45, 0.1, 0.31, 0.85, 2.0, 0.02, '#6a4a32', { mat: W(MT.wood, 0.3) }); mb.box(0.45, 0.1, 0.31, 0.85, 2.0, 0.02, '#c8ccd4', { mat: W(MT.glass, 0.1) }); mb.box(0, 1.0, 0.33, 0.04, 0.2, 0.03, P.gold); }), h: 2.2 },
    bar2: { build: (mb, o) => at(mb, o, () => { mb.box(0, 0, 0, o.w || 3, 1.05, 0.6, '#2a2a30', { mat: W(MT.marble, 0.2) }); mb.box(0, 1.05, 0, (o.w || 3) + 0.1, 0.06, 0.7, '#c9a14a', { mat: W(MT.metal, 0.2) }); for (let k = 0; k < (o.w || 3) * 2; k++) mb.box(-(o.w || 3) / 2 + 0.25 + k * 0.5, 1.11, -0.1, 0.08, 0.3, 0.08, pick(['#59ff8a', '#ffd84a', '#e8e2d8', '#c8443c'], R(k, 2, 3)), { emit: 0.3 }); }), h: 1.2 },
    slot: { build: (mb, o) => at(mb, o, () => { mb.box(0, 0, 0, 0.8, 1.7, 0.7, '#7a1a2a', { mat: W(MT.metal, 0.3) }); mb.box(0, 0.9, 0.36, 0.6, 0.45, 0.02, '#ffd84a', { emit: 0.8 }); for (let k = -1; k <= 1; k++) mb.box(k * 0.18, 0.98, 0.37, 0.14, 0.28, 0.01, '#f2efe8', { emit: 0.6 }); mb.box(0, 1.7, 0, 0.8, 0.3, 0.7, '#ff4fa3', { emit: 1.2 }); mb.box(0.45, 0.9, 0.1, 0.06, 0.5, 0.06, '#c8ccd4'); mb.box(0.45, 1.4, 0.1, 0.12, 0.12, 0.12, '#c8443c', { emit: 0.4 }); }), h: 2, light: o => ({ x: o.x, y: 1.6, z: o.z + 0.8, r: 2.4, c: [1, 0.4, 0.7], i: 0.6 }) },
    bjtable: { build: (mb, o) => at(mb, o, () => { mb.box(0, 0, 0, 0.5, 0.75, 0.5, '#2a1e1a'); mb.box(0, 0.75, 0, 2.6, 0.08, 1.4, '#1f6a3a', { mat: W(MT.carpet, 0.2) }); mb.box(0, 0.75, -0.72, 2.6, 0.12, 0.08, '#5a3a2a', { mat: W(MT.wood, 0.3) }); mb.box(0, 0.75, 0.72, 2.6, 0.12, 0.08, '#5a3a2a', { mat: W(MT.wood, 0.3) }); for (let k = -1; k <= 1; k++) mb.box(k * 0.7, 0.84, 0.3, 0.2, 0.01, 0.28, '#f2efe8'); for (let k = 0; k < 4; k++) mb.box(-0.9 + k * 0.12, 0.84, -0.4, 0.1, 0.05 + k * 0.02, 0.1, ['#c8443c', '#2f6a9a', '#18181e', '#e8c13c'][k]); }), h: 1, light: o => ({ x: o.x, y: 2.4, z: o.z, r: 3.5, c: [1, 0.9, 0.7], i: 1 }) },
    mannequin: { build: (mb, o) => at(mb, o, () => { mb.box(0, 0, 0, 0.4, 0.05, 0.4, '#18181e'); mb.box(0, 0.05, 0, 0.05, 0.8, 0.05, '#c8ccd4'); mb.box(0, 0.85, 0, 0.42, 0.55, 0.24, o.col || '#c8443c'); mb.box(0, 1.4, 0, 0.2, 0.22, 0.2, '#e8e2d8'); }), h: 1.6 },
    espresso: { build: (mb, o) => at(mb, o, () => { mb.box(0, 1.05, 0, 0.7, 0.5, 0.45, '#c8ccd4', { mat: W(MT.metal, 0.2) }); mb.box(0, 1.55, 0, 0.5, 0.08, 0.35, '#3a3a40'); mb.box(-0.15, 1.15, 0.25, 0.08, 0.12, 0.08, '#18181e'); mb.box(0.15, 1.15, 0.25, 0.08, 0.12, 0.08, '#18181e'); }), h: 1.6 },
    vault: { build: (mb, o) => { mb.box(o.x, 0.1, o.z, 2.4, 2.4, 0.3, '#8a8a92', { mat: W(MT.metal, 0.3) }); mb.cyl(o.x, 1.3, o.z + 0.16, 0.9, 0.1, 16, '#a8a8b0', { mat: W(MT.metal, 0.2) }); for (let k = 0; k < 6; k++) { const a = k / 6 * Math.PI * 2; mb.box(o.x + Math.cos(a) * 0.4, 1.3 + Math.sin(a) * 0.4, o.z + 0.28, 0.08, 0.08, 0.1, '#5a5a64'); } }, h: 2.6, wall: true },
    metrodt: { build: (mb, o) => C.metroEntrance(mb, o.x, o.z, 3, 5), foot: o => [...rectFoot(o.x - 0.3, o.z, 0.6, 5), ...rectFoot(o.x + 2.7, o.z, 0.8, 5), ...rectFoot(o.x, o.z - 0.3, 3, 0.6)], h: 1.2, light: o => ({ x: o.x + 1.5, y: 0.5, z: o.z + 1.5, r: 4, c: [0.4, 0.45, 1], i: 1.0 }), anchor: o => ({ x: o.x + 1.5, y: 1.2, z: o.z + 5.4, tiles: [[Math.floor(o.x + 1), Math.floor(o.z + 5)], [Math.floor(o.x + 2), Math.floor(o.z + 5)]] }) },
    elevator2: { build: (mb, o) => F.elevator(mb, o.x, o.z), foot: none, h: 2.2, wall: true },
    planterbox: { build: (mb, o) => { mb.box(o.x, 0, o.z, o.w || 1, 0.55, o.d || 1, '#5a5a64', { mat: W(MT.concrete, 0.3) }); mb.box(o.x, 0.55, o.z, (o.w || 1) - 0.1, 0.35, (o.d || 1) - 0.1, '#3a7a3a', { mat: W(MT.grass, 0.3), sway: 0.2 }); }, h: 0.9 },
  });

  // =====================================================================
  // the downtown map
  // =====================================================================
  function grid(w, h, fill) {
    const t = new Array(w * h).fill(fill);
    const m = { w, h, t, tile: (x, z) => (x < 0 || z < 0 || x >= w || z >= h ? null : t[z * w + x]), set: (x, z, v) => { if (x >= 0 && z >= 0 && x < w && z < h) t[z * w + x] = v; }, rect: (x, z, rw, rh, v) => { for (let j = z; j < z + rh; j++) for (let i = x; i < x + rw; i++) m.set(i, j, v); } };
    return m;
  }
  MAPS.downtown = () => {
    const m = grid(64, 60, 'plaza');
    m.outdoor = true; m.id = 'downtown';
    m.rect(24, 0, 2, 60, 'walk'); m.rect(32, 0, 2, 60, 'walk');      // Grand Ave sidewalks
    m.rect(0, 22, 64, 2, 'walk'); m.rect(0, 30, 64, 2, 'walk');      // Main St sidewalks
    m.rect(26, 0, 6, 60, 'road');                                     // Grand Ave (continues Sunset Blvd)
    m.rect(0, 24, 64, 6, 'road');                                     // Main St
    m.rect(1, 33, 22, 25, 'grass');                                   // Central Park
    m.rect(1, 44, 22, 2, 'walk'); m.rect(11, 33, 2, 25, 'walk');      // park paths
    m.rect(15, 49, 5, 4, 'water');                                    // the pond
    m.waterX = 64; m.waterZ = 60;
    m.crosswalks = [];
    for (const z of [10, 20, 32, 45]) m.crosswalks.push({ x0: 26, z0: z, x1: 31, z1: z + 1, across: 'z' });
    for (const x of [12, 24, 32, 50]) m.crosswalks.push({ x0: x, z0: 24, x1: x + 1, z1: 29, across: 'x' });
    m.lanes = [
      { axis: 'z', x: 27.25, dir: 1, from: -30, to: 90 }, { axis: 'z', x: 30.75, dir: -1, from: 90, to: -30 },
      { axis: 'x', z: 25.25, dir: -1, from: 94, to: -30 }, { axis: 'x', z: 28.75, dir: 1, from: -30, to: 94 },
    ];
    m.cars = 12; m.peds = 14;
    m.walks = [[24.6, 0.5], [24.6, 59.5], [33, 0.5], [33, 59.5], [0.5, 22.6], [63.5, 22.6], [0.5, 31], [63.5, 31], [12, 45], [12, 34], [40, 20.5], [56, 21], [42, 33], [55, 46], [18, 22.6], [5, 31]];
    m.beats = [[[25, 2], [25, 57], [12, 45], [25, 57]], [[33, 2], [33, 57], [56, 31], [33, 31]], [[2, 22.6], [62, 22.6], [62, 31], [2, 31]]];
    // buildings
    m.buildings = [
      { id: 'vancegrand', tower: true, x: 2, z: 3, w: 12, d: 12, floors: 26, crown: 'helipad', glass: '#2a2a3a', frame: '#c9a14a', podium: { floors: 2, col: '#e8e0d0' }, sign: { text: 'VANCE GRAND', col: '#e8c878' }, lit: 0.4 },
      { id: 'cityhall', x: 15, z: 6, w: 8, d: 10, floors: 3, face: 's', wall: '#d8d0c0', mat: 11, wear: 0.15, shop: { text: 'CITY HALL', col: '#e8e2d8', fascia: '#8a8478', glass: '#ffe2a8' } },
      { id: 'aurora', tower: true, x: 36, z: 3, w: 10, d: 11, floors: 32, crown: 'spire', glass: '#1a3048', frame: '#b8c4d8', podium: { floors: 2, col: '#2a2a30' }, sign: { text: 'AURORA', col: '#9fd8ff' }, lit: 0.36, neon: '#9fd8ff' },
      { id: 'meridian', tower: true, x: 49, z: 2, w: 9, d: 9, floors: 22, crown: 'fins', lit: 0.45 },
      { id: 'bank', x: 49, z: 13, w: 9, d: 7, floors: 3, face: 's', wall: '#c8c0b0', mat: 11, wear: 0.1, shop: { text: 'FIRST HARBOR BANK', col: '#e8c878', fascia: '#3a3a44', glass: '#ffe2a8' } },
      { id: 'casino', x: 35, z: 34, w: 11, d: 8, floors: 3, face: 's', wall: '#2a1430', mat: 11, wear: 0.2, shop: { text: 'LUCKY 7 CASINO', col: '#ff4fa3', fascia: '#18101e', glass: '#ffb0e0' }, sign: { text: '777', col: '#ffd84a' } },
      { id: 'cafe', x: 48, z: 35, w: 6, d: 6, floors: 2, face: 's', wall: '#6a4a32', mat: 3, wear: 0.3, shop: { text: 'DAILY GRIND', col: '#ffd84a', awning: '#2f6a5a', glass: '#ffe2a8' } },
      { id: 'boutique', x: 56, z: 35, w: 7, d: 6, floors: 2, face: 's', wall: '#e8e2d8', mat: 11, wear: 0.15, shop: { text: 'SILK & STEEL', col: '#ff7ac0', fascia: '#18181e', glass: '#ffd8f0' } },
      { id: 'dtapts', x: 47, z: 46, w: 7, d: 9, floors: 7, face: 's', wear: 0.3, fire: false },
      { id: 'college', x: 56, z: 45, w: 7, d: 11, floors: 3, face: 's', wall: '#8a3a2a', mat: 3, wear: 0.3, shop: { text: 'COMMUNITY COLLEGE', col: '#e8e2d8', fascia: '#2a2a30', glass: '#ffe2a8' } },
    ];
    for (const b of m.buildings) m.rect(b.x, b.z, b.w, b.d, 'bldg');
    // exits
    m.exits = [
      { id: 'auroraIn', x: 40, z: 14, w: 2, h: 1, to: 'aurora', tx: 6, tz: 8.4, dir: 'up', door: true },
      { id: 'bankIn', x: 53, z: 20, w: 1, h: 1, to: 'bank', tx: 6, tz: 7.4, dir: 'up', door: true },
      { id: 'casinoIn', x: 40, z: 42, w: 1, h: 1, to: 'casino', tx: 8, tz: 9.4, dir: 'up', door: true },
      { id: 'cafeIn', x: 51, z: 41, w: 1, h: 1, to: 'cafe', tx: 4, tz: 6.4, dir: 'up', door: true },
      { id: 'boutiqueIn', x: 59, z: 41, w: 1, h: 1, to: 'boutique', tx: 4, tz: 6.4, dir: 'up', door: true },
      { id: 'collegeIn', x: 59, z: 56, w: 1, h: 1, to: 'college', tx: 5, tz: 7.4, dir: 'up', door: true, need: 'collegeOpen' },
      { id: 'vancegrandIn', x: 7, z: 15, w: 2, h: 1, to: 'vancegrand', tx: 7, tz: 9.4, dir: 'up', door: true, need: 'dressed' },
      { id: 'cityhallIn', x: 18, z: 16, w: 2, h: 1, to: 'cityhall', tx: 7, tz: 9.4, dir: 'up', door: true },
      { id: 'toLowtown', x: 24, z: 59, w: 2, h: 1, to: 'city', dir: 'down', back: 'toDowntown' },
      { id: 'toLowtown2', x: 32, z: 59, w: 2, h: 1, to: 'city', dir: 'down', back: 'toDowntown2' },
    ];
    // objects
    const O = m.objects = [];
    const lamp = (x, z, rot) => O.push({ k: 'lamp', x, z, rot });
    for (let z = 3; z < 60; z += 8) { if (z > 20 && z < 33) continue; lamp(25.1, z, Math.PI / 2); lamp(32.9, z + 4, -Math.PI / 2); }
    for (let x = 3; x < 64; x += 8) { if (x > 21 && x < 35) continue; lamp(x, 23.1, 0); lamp(x + 4, 30.9, Math.PI); }
    O.push({ k: 'traffic', x: 25.3, z: 23.3, rot: Math.PI / 2 }, { k: 'traffic', x: 32.7, z: 30.7, rot: -Math.PI / 2 });
    // north plazas
    O.push({ k: 'dtfountain', id: 'fountain2', x: 20, z: 19, r: 1.6 });
    O.push({ k: 'planterbox', x: 3, z: 19, w: 2, d: 1 }, { k: 'planterbox', x: 9, z: 19, w: 2, d: 1 }, { k: 'tree', x: 16, z: 19.5 }, { k: 'bench', x: 6, z: 20.3, rot: Math.PI });
    O.push({ k: 'parked', x: 3.6, z: 18.4, rot: Math.PI / 2, kind: 'limo', col: '#111' });
    O.push({ k: 'statue', id: 'statue', x: 19, z: 1.8 });
    O.push({ k: 'flowerbed', x: 39, z: 17.5, w: 3, d: 1 }, { k: 'flowerbed', x: 44, z: 17.5, w: 3, d: 1 }, { k: 'tree', x: 35.5, z: 18.5 }, { k: 'tree', x: 47, z: 18.5 });
    O.push({ k: 'atm', id: 'atm1', x: 57.5, z: 20.6, rot: 0 }, { k: 'newsbox', id: 'newsdt', x: 47.8, z: 20.8, rot: 0, col: '#c8443c' });
    O.push({ k: 'bench', x: 60, z: 20.8, rot: Math.PI }, { k: 'planterbox', x: 62, z: 15, w: 1, d: 3 });
    // park
    O.push({ k: 'dtfountain', id: 'fountain', x: 12, z: 45, r: 2.4 });
    for (const [x, z] of [[4, 36], [8, 39], [4, 52], [7, 55], [17, 36], [20, 40], [21, 55], [16, 56], [3, 47], [21, 47], [8, 50]]) O.push({ k: 'tree', x, z });
    O.push({ k: 'bench', x: 9.3, z: 41, rot: Math.PI / 2 }, { k: 'bench', x: 14.7, z: 41, rot: -Math.PI / 2 }, { k: 'bench', x: 9.3, z: 49, rot: Math.PI / 2 }, { k: 'bench', x: 14.7, z: 49.5, rot: -Math.PI / 2 });
    O.push({ k: 'chess', id: 'chess', x: 5.5, z: 43, rot: Math.PI / 2 }, { k: 'chess', x: 5.5, z: 47, rot: Math.PI / 2 });
    O.push({ k: 'hotdog', id: 'hotdog', x: 13.8, z: 34.6, rot: 0 });
    O.push({ k: 'flowerbed', x: 17.5, z: 45, w: 2, d: 2 }, { k: 'flowerbed', x: 6.5, z: 45, w: 2, d: 2 });
    O.push({ k: 'trashcan', x: 10.4, z: 37 }, { k: 'trashcan', x: 13.6, z: 53 });
    // south-east block
    O.push({ k: 'metrodt', id: 'metrodt', x: 39, z: 49 });
    O.push({ k: 'taxistand', id: 'taxidt', x: 33.4, z: 40 }, { k: 'parked', x: 34.6, z: 37.2, rot: Math.PI, kind: 'taxi', col: '#e8c13c' });
    O.push({ k: 'atm', id: 'atm2', x: 46.2, z: 42.6, rot: 0 }, { k: 'bench', x: 36, z: 43.4, rot: Math.PI }, { k: 'planterbox', x: 44, z: 47, w: 2, d: 1 }, { k: 'tree', x: 46.5, z: 56 });
    O.push({ k: 'vending', x: 33.4, z: 46, rot: -Math.PI / 2, col: '#c8443c', glow: '#ffe8a0' }, { k: 'hydrant', x: 33.3, z: 52 }, { k: 'hydrant', x: 24.7, z: 16 });
    O.push({ k: 'phonebooth', x: 24.7, z: 36.5, rot: Math.PI / 2 }, { k: 'busstop', id: 'busstopdt', x: 24.9, z: 12, rot: Math.PI / 2 });
    O.push({ k: 'billboard', x: 30, y: 13, z: -1, w: 9, h: 3, text: 'AURORA LIVING', col: '#9fd8ff', bg: '#1a2238' });
    O.push({ k: 'manhole', x: 29, z: 14 }, { k: 'manhole', x: 40, z: 27 });
    O.push({ k: 'npcspot', id: 'busker', x: 9.8, z: 33.2 }, { k: 'npcspot', id: 'recruiter', x: 53.5, z: 11.6 }, { k: 'npcspot', id: 'doorman', x: 10, z: 15.6 });
    // a way back to the motel
    O.push({ k: 'taxistand', x: 23.5, z: 57.5 });
    m.spawn = { x: 29, z: 57.5, dir: 'up' };
    m.skyline = (mb) => {
      // dense towers to the north and west (the camera looks that way); the waterfront to the east
      let x = -10;
      while (x < m.w + 10) { const w = 6 + Math.floor(R(x, 3, 2) * 5); if (!(x + w > 24 && x < 34)) DT.tower(mb, { x, z: -14, w, d: 10, floors: 14 + Math.floor(R(x, 4, 2) * 18), seed: x * 7 + 3, entrance: false }); x += w + 1; }
      let z = -4;
      while (z < m.h + 4) { const d = 6 + Math.floor(R(z, 5, 2) * 4); if (!(z + d > 22 && z < 32)) DT.tower(mb, { x: -14, z, w: 10, d, floors: 10 + Math.floor(R(z, 6, 2) * 14), seed: z * 11 + 5, face: 'e', entrance: false }); z += d + 1; }
    };
    m.outer = (mb) => {
      const c = '#2a2830', flat = (x0, z0, x1, z1) => mb.quad([x0, -0.02, z1], [x1, -0.02, z1], [x1, -0.02, z0], [x0, -0.02, z0], c, { mat: W(MT.slab, 0.3), jit: 0 });
      flat(-40, -40, m.w + 40, 0); flat(-40, 0, 0, m.h + 40); flat(0, m.h, m.w + 40, m.h + 40); flat(m.w, 0, m.w + 40, m.h);
      const road = (x0, z0, x1, z1) => mb.quad([x0, 0.005, z1], [x1, 0.005, z1], [x1, 0.005, z0], [x0, 0.005, z0], P.asphalt, { mat: W(MT.asphalt, 0.4), jit: 0 });
      road(26, -40, 32, 0); road(26, m.h, 32, m.h + 40); road(-40, 24, 0, 30); road(m.w, 24, m.w + 40, 30);
    };
    m.paint = (mb) => {
      C.stripe(mb, 28.93, -40, 28.93, 24, P.lane, 0.07); C.stripe(mb, 29.07, -40, 29.07, 24, P.lane, 0.07);
      C.stripe(mb, 28.93, 30, 28.93, m.h + 40, P.lane, 0.07); C.stripe(mb, 29.07, 30, 29.07, m.h + 40, P.lane, 0.07);
      C.laneDash(mb, 27.5, -40, 27.5, 23, P.laneW, 0.08); C.laneDash(mb, 30.5, -40, 30.5, 23, P.laneW, 0.08);
      C.laneDash(mb, 27.5, 31, 27.5, m.h + 40, P.laneW, 0.08); C.laneDash(mb, 30.5, 31, 30.5, m.h + 40, P.laneW, 0.08);
      C.stripe(mb, -40, 26.93, 26, 26.93, P.lane, 0.07); C.stripe(mb, -40, 27.07, 26, 27.07, P.lane, 0.07);
      C.stripe(mb, 32, 26.93, m.w + 40, 26.93, P.lane, 0.07); C.stripe(mb, 32, 27.07, m.w + 40, 27.07, P.lane, 0.07);
      C.laneDash(mb, -40, 25.5, 25, 25.5, P.laneW, 0.08); C.laneDash(mb, -40, 28.5, 25, 28.5, P.laneW, 0.08);
      C.laneDash(mb, 33, 25.5, m.w + 40, 25.5, P.laneW, 0.08); C.laneDash(mb, 33, 28.5, m.w + 40, 28.5, P.laneW, 0.08);
      for (const c of m.crosswalks) {
        if (c.across === 'z') C.crosswalk(mb, c.x0, c.z0 + 0.3, c.x1 + 1, c.z1 + 0.7, true);
        else C.crosswalk(mb, c.x0 + 0.3, c.z0, c.x1 + 0.7, c.z1 + 1, false);
      }
    };
    return m;
  };

  // =====================================================================
  // interiors
  // =====================================================================
  function room(w, h) { const m = grid(w, h, 'floor'); m.indoor = true; return m; }
  MAPS.aurora = () => { // the lobby of Aurora Tower
    const m = room(12, 10);
    m.walls = { n: true, w: true, wallCol: '#2a2a30', wallMat: MT.marble, floorCol: '#e8e3da', floorMat: MT.marble, trim: '#c9a14a', luxe: true };
    m.objects = [
      { k: 'counter', id: 'concierge_desk', x: 3.5, z: 3.2, w: 4, luxe: true }, { k: 'npcspot', id: 'concierge', x: 3.5, z: 2.2 },
      { k: 'elevator2', id: 'phlift', x: 8, z: 0.1 }, { k: 'elevator2', x: 10.2, z: 0.1 },
      { k: 'chandelier', x: 6, z: 5 }, { k: 'rug', x: 6, z: 6.4, w: 5, d: 3, col: '#1a2238' },
      { k: 'sofa', x: 1.3, z: 6.5, rot: Math.PI / 2 }, { k: 'plant', x: 0.7, z: 0.8 }, { k: 'plant', x: 11.3, z: 4.5 }, { k: 'coffeetable', x: 2.6, z: 6.5 },
    ];
    m.exits = [{ x: 5, z: 9, w: 2, h: 1, to: 'downtown', dir: 'down', back: 'auroraIn' }];
    m.spawn = { x: 6, z: 8.4, dir: 'up' };
    return m;
  };
  MAPS.penthouse = () => {
    const m = room(16, 12);
    m.walls = { n: true, w: true, wallCol: '#e8e2d8', wallMat: MT.plaster, floorCol: '#6a4a32', floorMat: MT.wood, trim: '#2a2a30', luxe: true };
    m.objects = [
      { k: 'bigwindow', x: 8, z: 0.15, w: 14 },
      { k: 'bed', id: 'phbed', x: 13.5, z: 3.2 }, { k: 'nightstand', x: 11.9, z: 1.2 },
      { k: 'wardrobe', id: 'wardrobe', x: 1.4, z: 0.5 },
      { k: 'sofa', x: 6, z: 5.6, rot: 0 }, { k: 'coffeetable', x: 6, z: 4.3 }, { k: 'tvstand', x: 6, z: 2.6 },
      { k: 'rug', x: 6, z: 4.5, w: 5, d: 3.5, col: '#7a2236' },
      { k: 'bar2', id: 'phbar', x: 3.5, z: 9.5, w: 3 }, { k: 'stool', x: 2.6, z: 10.4 }, { k: 'stool', x: 4.2, z: 10.4 },
      { k: 'hottub', id: 'hottub', x: 13.5, z: 9 }, { k: 'plant', x: 10.8, z: 10.8 }, { k: 'plant', x: 15.3, z: 6.2 },
      { k: 'safe', id: 'phsafe', x: 0.7, z: 3.4 }, { k: 'pooltable', id: 'phpool', x: 9, z: 8.6 }, { k: 'chandelier', x: 6, z: 4.5 },
    ];
    m.exits = [{ x: 0, z: 9, w: 1, h: 2, to: 'aurora', tx: 8.5, tz: 1.6, dir: 'left', back: 'phlift' }];
    m.spawn = { x: 1.6, z: 9.8, dir: 'right' };
    return m;
  };
  MAPS.bank = () => {
    const m = room(12, 9);
    m.walls = { n: true, w: true, wallCol: '#d8d0c0', wallMat: MT.marble, floorCol: '#e8e3da', floorMat: MT.marble, trim: '#8a7a50' };
    m.objects = [
      { k: 'counter', id: 'teller_desk', x: 6, z: 3.0, w: 7, luxe: true }, { k: 'npcspot', id: 'teller', x: 6, z: 2.0 },
      { k: 'vault', x: 10, z: 0.2 }, { k: 'plant', x: 0.7, z: 6.5 }, { k: 'plant', x: 11.3, z: 6.5 }, { k: 'rug', x: 6, z: 6, w: 4, d: 2, col: '#2a3a5a' },
      { k: 'sofa', x: 1.5, z: 4.6, rot: Math.PI / 2 },
    ];
    m.exits = [{ x: 5, z: 8, w: 2, h: 1, to: 'downtown', dir: 'down', back: 'bankIn' }];
    m.spawn = { x: 6, z: 7.4, dir: 'up' };
    return m;
  };
  MAPS.casino = () => {
    const m = room(16, 11);
    m.walls = { n: true, w: true, wallCol: '#2a1430', wallMat: MT.plaster, floorCol: '#5a1a2a', floorMat: MT.carpet, trim: '#c9a14a' };
    m.objects = [
      { k: 'bjtable', id: 'bjtable', x: 5, z: 4.5 }, { k: 'npcspot', id: 'dealer', x: 5, z: 3.4 },
      { k: 'stool', x: 4.2, z: 5.6 }, { k: 'stool', x: 5.8, z: 5.6 },
      { k: 'slot', id: 'slot1', x: 10, z: 0.6 }, { k: 'slot', id: 'slot2', x: 11.2, z: 0.6 }, { k: 'slot', id: 'slot3', x: 12.4, z: 0.6 }, { k: 'slot', id: 'slot4', x: 13.6, z: 0.6 },
      { k: 'bar2', id: 'casbar', x: 12, z: 8, w: 4 }, { k: 'stool', x: 11, z: 9 }, { k: 'stool', x: 13, z: 9 },
      { k: 'neonwall', x: 6, z: 0.05, text: 'LUCKY 7', col: '#ff4fa3' }, { k: 'chandelier', x: 8, z: 5 }, { k: 'plant', x: 0.7, z: 9.6 },
      { k: 'roundtable', x: 1.6, z: 2 }, { k: 'door', id: 'countroom', x: 15.95, z: 3, label: 'STAFF ONLY' },
    ];
    m.exits = [{ x: 7, z: 10, w: 2, h: 1, to: 'downtown', dir: 'down', back: 'casinoIn' }];
    m.spawn = { x: 8, z: 9.4, dir: 'up' };
    return m;
  };
  MAPS.cafe = () => {
    const m = room(9, 8);
    m.walls = { n: true, w: true, wallCol: '#c8b89a', wallMat: MT.brick, floorCol: '#8a6a4a', floorMat: MT.wood, trim: '#2f6a5a' };
    m.objects = [
      { k: 'counter', id: 'cafe_counter', x: 3.5, z: 2.4, w: 5 }, { k: 'npcspot', id: 'barista', x: 3.5, z: 1.4 }, { k: 'espresso', x: 2.2, z: 2.4 },
      { k: 'roundtable', x: 7, z: 2.5 }, { k: 'roundtable', x: 7, z: 5.5 }, { k: 'roundtable', x: 2, z: 5.5 },
      { k: 'chair', x: 7, z: 3.4, rot: Math.PI }, { k: 'chair', x: 7, z: 6.4, rot: Math.PI }, { k: 'chair', x: 2, z: 6.4, rot: Math.PI },
      { k: 'plant', x: 8.4, z: 0.6 },
    ];
    m.exits = [{ x: 3, z: 7, w: 2, h: 1, to: 'downtown', dir: 'down', back: 'cafeIn' }];
    m.spawn = { x: 4, z: 6.4, dir: 'up' };
    return m;
  };
  MAPS.college = () => {
    const m = room(12, 9);
    m.walls = { n: true, w: true, wallCol: '#c8b89a', wallMat: MT.plaster, floorCol: '#8a7a6a', floorMat: MT.tile, trim: '#5a3a2a' };
    m.objects = [
      { k: 'corkboard', id: 'chalkboard', x: 4, z: 0.1 }, { k: 'desk', id: 'lectern', x: 4, z: 1.6 }, { k: 'npcspot', id: 'professor', x: 5.4, z: 1.4 },
      ...[0, 1, 2].flatMap(r => [0, 1, 2].map(c => ({ k: 'desk', x: 1.8 + c * 2.4, z: 4 + r * 1.6 }))),
      { k: 'npcspot', id: 'priya', x: 4.2, z: 5.0 }, { k: 'shelf', x: 11.2, z: 2, rot: -Math.PI / 2 }, { k: 'plant', x: 11.3, z: 7.6 }, { k: 'watercooler', x: 10.6, z: 0.5 },
    ];
    m.exits = [{ x: 4, z: 8, w: 2, h: 1, to: 'downtown', dir: 'down', back: 'collegeIn' }];
    m.spawn = { x: 5, z: 7.4, dir: 'up' };
    return m;
  };
  MAPS.vancegrand = () => {
    const m = room(14, 10);
    m.walls = { n: true, w: true, wallCol: '#1a1a22', wallMat: MT.marble, floorCol: '#f2efe8', floorMat: MT.marble, trim: '#c9a14a', luxe: true };
    m.objects = [
      { k: 'counter', id: 'vgdesk', x: 9.5, z: 2.4, w: 5, luxe: true }, { k: 'npcspot', id: 'celeste', x: 9.5, z: 1.4 },
      { k: 'chandelier', x: 7, z: 5 }, { k: 'rug', x: 7, z: 6, w: 6, d: 3, col: '#c9a14a' }, { k: 'sofa', x: 2, z: 4.5, rot: Math.PI / 2 }, { k: 'sofa', x: 2, z: 7.5, rot: Math.PI / 2 },
      { k: 'plant', x: 0.7, z: 0.8 }, { k: 'plant', x: 13.3, z: 6 }, { k: 'model', x: 4.5, z: 2.2 }, { k: 'elevator2', x: 1.5, z: 0.1 },
    ];
    m.exits = [{ x: 6, z: 9, w: 2, h: 1, to: 'downtown', dir: 'down', back: 'vancegrandIn' }];
    m.spawn = { x: 7, z: 9.4, dir: 'up' };
    return m;
  };
  MAPS.cityhall = () => {
    const m = room(14, 10);
    m.walls = { n: true, w: true, wallCol: '#d8d0c0', wallMat: MT.marble, floorCol: '#a89a80', floorMat: MT.wood, trim: '#5a4a32' };
    m.objects = [
      { k: 'counter', id: 'clerkdesk', x: 3, z: 2.4, w: 3.5 }, { k: 'npcspot', id: 'clerk', x: 3, z: 1.4 },
      { k: 'barcounter', id: 'councilbench', x: 10.5, z: 2.0, d: 5 }, { k: 'npcspot', id: 'shaw', x: 10.5, z: 0.8 },
      { k: 'desk', id: 'podium', x: 9.5, z: 4.6 }, { k: 'flag', x: 13.3, z: 0.6 }, { k: 'flag', x: 7.3, z: 0.6 },
      ...[0, 1].flatMap(r => [0, 1, 2].map(c => ({ k: 'bench', x: 8 + c * 2.2, z: 6.6 + r * 1.4, rot: 0 }))),
      { k: 'plant', x: 0.7, z: 8.5 }, { k: 'filecab', x: 0.6, z: 0.6 },
    ];
    m.exits = [{ x: 6, z: 9, w: 2, h: 1, to: 'downtown', dir: 'down', back: 'cityhallIn' }];
    m.spawn = { x: 7, z: 9.4, dir: 'up' };
    return m;
  };
  MAPS.boutique = () => {
    const m = room(9, 8);
    m.walls = { n: true, w: true, wallCol: '#f2efe8', wallMat: MT.plaster, floorCol: '#e8e3da', floorMat: MT.marble, trim: '#ff7ac0' };
    m.objects = [
      { k: 'counter', id: 'boutique_counter', x: 6.5, z: 2.4, w: 3, luxe: true }, { k: 'npcspot', id: 'stylist', x: 6.5, z: 1.4 },
      { k: 'mannequin', x: 1.2, z: 1.2, col: '#c8443c' }, { k: 'mannequin', x: 2.4, z: 1.2, col: '#18181e' }, { k: 'mannequin', x: 3.6, z: 1.2, col: '#e8c13c' },
      { k: 'rack', x: 1, z: 4.5, rot: Math.PI / 2 }, { k: 'rack', x: 1, z: 6, rot: Math.PI / 2 }, { k: 'plant', x: 8.4, z: 6.6 }, { k: 'rug', x: 5, z: 5, w: 3, d: 2, col: '#ff7ac0' },
    ];
    m.exits = [{ x: 3, z: 7, w: 2, h: 1, to: 'downtown', dir: 'down', back: 'boutiqueIn' }];
    m.spawn = { x: 4, z: 6.4, dir: 'up' };
    return m;
  };
})();
