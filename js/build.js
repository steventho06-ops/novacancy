// Map -> renderable scene: chunked static geometry, fadeable buildings, rebuildable objects,
// collision footprint and light list.
(function () {
  const { MB, MT, W, P, R, pick, shade, text } = KIT;
  const C = CITY, I = INT, F = INT.F, M = MOTEL;

  // Collision: every footprint is an exact rectangle (RECTS). Tiles are only used for path finding.
  let RECTS = null;
  const tileOf = o => { if (RECTS) RECTS.push([o.x - 0.38, o.z - 0.38, 0.76, 0.76]); return [[Math.floor(o.x), Math.floor(o.z)]]; };
  const none = () => [];
  // small round-ish props (hydrants, cans, poles) that used to have no hitbox at all
  const post = (r = 0.18) => o => { if (RECTS) RECTS.push([o.x - r, o.z - r, r * 2, r * 2]); return []; };
  function rectFoot(x, z, w, d) {
    if (RECTS) RECTS.push([x, z, w, d]);
    const out = [];
    for (let j = Math.floor(z + 0.05); j < Math.ceil(z + d - 0.05); j++) for (let i = Math.floor(x + 0.05); i < Math.ceil(x + w - 0.05); i++) out.push([i, j]);
    return out;
  }
  const rotFoot = (o, w, d) => (Math.abs(Math.sin(o.rot || 0)) > 0.7 ? rectFoot(o.x - d / 2, o.z - w / 2, d, w) : rectFoot(o.x - w / 2, o.z - d / 2, w, d));
  const WARM = [1, 0.78, 0.5], COOL = [0.75, 0.9, 1], NEON_P = [1, 0.35, 0.7], NEON_C = [0.35, 0.95, 1], NEON_V = [0.75, 0.35, 1];

  // kind registry. build(mb, o, ctx); foot(o, ctx); light(o, ctx) -> light | [lights]; dyn: rebuild on state
  const K = {
    // ---------- city ----------
    lamp: { build: (mb, o) => { if (o.small) F.lamp(mb, o.x, o.y || 0, o.z, true); else C.streetLamp(mb, o.x, o.z, o.rot || 0); },
      light: o => { if (o.small) return { x: o.x, y: (o.y || 0) + 0.7, z: o.z, r: 3.2, c: WARM, i: 0.9 }; const s = Math.sin(o.rot || 0), c = Math.cos(o.rot || 0); return { x: o.x + s * 0.72, y: 2.7, z: o.z + c * 0.72, r: 10, c: [1, 0.8, 0.52], i: 1.5, night: true }; }, foot: o => o.small ? [] : post(0.12)(o) },
    traffic: { build: (mb, o) => C.trafficLight(mb, o.x, o.z, o.rot, 'g'), foot: post(0.14) },
    hydrant: { build: (mb, o) => C.hydrant(mb, o.x, o.z), foot: post(0.2) },
    trashcan: { build: (mb, o) => C.trashCan(mb, o.x, o.z), foot: post(0.26) },
    trashbags: { build: (mb, o) => C.trashBags(mb, o.x, o.z, 3, o.x * 7 + o.z) },
    dumpster: { build: (mb, o) => C.dumpster(mb, o.x, o.z, o.rot || 0, o.col), foot: o => rotFoot(o, 1.6, 0.9), h: 1.1 },
    bench: { build: (mb, o) => C.bench(mb, o.x, o.z, o.rot || 0), foot: tileOf, h: 0.6 },
    busstop: { build: (mb, o) => C.busStop(mb, o.x, o.z, o.rot || 0), foot: none, h: 2.2, light: o => ({ x: o.x + 0.4, y: 1.2, z: o.z, r: 2.6, c: [1, 0.5, 0.8], i: 0.7, night: true }) },
    newsbox: { build: (mb, o) => C.newsBox(mb, o.x, o.z, o.rot || 0, o.col), h: 0.9 },
    phonebooth: { build: (mb, o) => C.phoneBooth(mb, o.x, o.z, o.rot || 0), foot: tileOf, h: 2.2, light: o => ({ x: o.x + 0.6, y: 1.8, z: o.z, r: 2.5, c: COOL, i: 0.6, night: true }) },
    vending: { build: (mb, o) => C.vending(mb, o.x, o.z, o.rot || 0, o.col, o.glow), foot: tileOf, h: 1.8, light: o => ({ x: o.x + Math.sin(o.rot || 0) * 0.8, y: 1.0, z: o.z + Math.cos(o.rot || 0) * 0.8, r: 2.6, c: o.glow ? [1, 0.9, 0.6] : [0.7, 0.9, 1], i: 0.8 }) },
    icemachine: { build: (mb, o) => C.iceMachine(mb, o.x, o.z, o.rot || 0), foot: tileOf, h: 1.3 },
    planter: { build: (mb, o) => C.planterTree(mb, o.x, o.z, Math.floor(o.x * 3 + o.z), o.kind), foot: tileOf },
    billboard: { build: (mb, o) => C.billboard(mb, o.x, o.y, o.z, o.w, o.h, o.text, o.col, o.bg), foot: none, light: o => ({ x: o.x, y: o.y + 0.5, z: o.z + 1.5, r: 5, c: [1, 0.5, 0.8], i: 0.7, night: true }) },
    manhole: { build: (mb, o) => C.manhole(mb, o.x, o.z) },
    graffitiwall: { build: (mb, o) => { if (o.dir === 'z') { mb.box(o.x - 0.15, 0.1, o.z, 0.3, 2.2, o.w + 0.4, '#6a6e78', { mat: W(MT.brick, 0.7) }); C.graffiti(mb, o.x + 0.01, 0.4, o.z, o.w, o.h, o.seed || 1, 'z'); } else C.graffiti(mb, o.x, 0.4, o.z, o.w, o.h, o.seed || 1, 'x'); }, foot: o => o.dir === 'z' ? rectFoot(o.x - 0.3, o.z - o.w / 2 - 0.2, 0.3, o.w + 0.4) : [] },
    chain: { build: (mb, o) => C.chainFence(mb, o.x0, o.z0, o.x1, o.z1), foot: o => { const out = []; const n = Math.ceil(Math.hypot(o.x1 - o.x0, o.z1 - o.z0) * 2); for (let k = 0; k <= n; k++) { const x = o.x0 + (o.x1 - o.x0) * k / n, z = o.z0 + (o.z1 - o.z0) * k / n; out.push([Math.floor(x - (o.x1 === o.x0 ? 0.5 : 0)), Math.floor(z - (o.z1 === o.z0 ? 0.5 : 0))]); } return out; } },
    parking: { build: (mb, o) => { if (!o.n) return; const step = (o.x1 - o.x0) / o.n; for (let k = 0; k <= o.n; k++) C.stripe(mb, o.x0 + k * step, o.z + 0.2, o.x0 + k * step, o.z + 4.0, '#d8d8d0', 0.08); } },
    cone: { build: (mb, o) => C.cone(mb, o.x, o.z) },
    barrier: { build: (mb, o) => C.barrier(mb, o.x, o.z, o.rot || 0), foot: o => rotFoot(o, 1.4, 0.4) },
    pallet: { build: (mb, o) => C.pallet(mb, o.x, o.z), foot: tileOf },
    crates: { build: (mb, o) => F.crates(mb, o.x, o.z, o.n || 3), foot: o => rectFoot(o.x - 1.1, o.z - 0.4, 2.2, (o.n > 3 ? 1.6 : 0.8)), h: 1.0 },
    portaloo: { build: (mb, o) => { mb.box(o.x, 0.04, o.z, 1.0, 2.2, 1.0, '#3a8ad8', { mat: W(MT.metal, 0.6) }); mb.box(o.x, 0.2, o.z + 0.51, 0.7, 1.8, 0.02, '#2a6aa8'); }, foot: tileOf },
    sitesign: { build: (mb, o) => { mb.box(o.x, 0.1, o.z, 0.1, 2.6, 0.1, P.iron); mb.box(o.x, 0.1, o.z + 2.4, 0.1, 2.6, 0.1, P.iron); mb.box(o.x + 0.06, 1.3, o.z + 1.2, 0.06, 1.3, 2.6, '#f2efe8'); text(mb, 'COMING SOON', o.x + 0.1, 2.2, o.z + 1.2, 0.03, '#c9a14a', { dir: 'z' }); text(mb, 'VANCE', o.x + 0.1, 1.75, o.z + 1.2, 0.06, '#1c2436', { dir: 'z' }); text(mb, 'HOLDINGS', o.x + 0.1, 1.45, o.z + 1.2, 0.03, '#1c2436', { dir: 'z' }); }, foot: none },
    vancetower: { build: (mb, o, ctx) => { const fl = ctx.S ? 3 + Math.min(9, Math.floor((ctx.S.flags.towerFloors || 0))) : 3; C.concreteFrame(mb, o.x, o.z, o.w, o.d, fl, 0.5); C.scaffold(mb, o.x, o.z, o.w, o.d, Math.min(fl, 4)); }, foot: o => rectFoot(o.x, o.z, o.w, o.d + 0.6), occ: true, dyn: true },
    crane: { build: (mb, o) => C.crane(mb, o.x, o.z, 16, 11, o.rot || 0), foot: o => rectFoot(o.x - 0.8, o.z - 0.8, 1.6, 1.6), light: o => ({ x: o.x, y: 17, z: o.z, r: 3, c: [1, 0.2, 0.2], i: 0.8, night: true }), occ: true },
    trailer: { build: (mb, o) => { mb.box(o.x, 0.3, o.z, 4.4, 1.9, 2.2, '#e8e2d8', { mat: W(MT.metal, 0.4), top: '#c8c8c0' }); mb.box(o.x, 0.04, o.z, 4.2, 0.3, 2.0, '#2a2a30'); mb.box(o.x - 0.8, 0.3, o.z + 1.11, 0.8, 1.6, 0.04, '#5a5a64'); mb.box(o.x + 0.9, 1.0, o.z + 1.11, 1.4, 0.7, 0.03, '#ffe2a0', { emit: 0.4, mat: W(MT.glass, 0.2) }); mb.box(o.x - 0.8, 0.04, o.z + 1.4, 1.0, 0.26, 0.6, '#7a7a80'); text(mb, 'VANCE HOLDINGS', o.x + 0.4, 1.95, o.z + 1.13, 0.022, '#c9a14a', {}); }, foot: o => rectFoot(o.x - 2.2, o.z - 1.1, 4.4, 2.2), h: 2.2, light: o => ({ x: o.x + 0.9, y: 1.4, z: o.z + 1.8, r: 3, c: WARM, i: 0.6, night: true }) },
    policecar: { build: (mb, o) => { mb.at(o.x, 0.04, o.z, o.rot || 0); mb.merge(C.car('police')); mb.pop(); }, foot: o => rotFoot(o, 1.0, 2.1), h: 1.0 },
    court: { build: (mb, o) => { const c = '#d8d8d0'; C.stripe(mb, o.x + 0.5, o.z + 0.5, o.x + o.w - 0.5, o.z + 0.5, c, 0.08); C.stripe(mb, o.x + 0.5, o.z + o.d - 0.5, o.x + o.w - 0.5, o.z + o.d - 0.5, c, 0.08); C.stripe(mb, o.x + 0.5, o.z + 0.5, o.x + 0.5, o.z + o.d - 0.5, c, 0.08); C.stripe(mb, o.x + o.w - 0.5, o.z + 0.5, o.x + o.w - 0.5, o.z + o.d - 0.5, c, 0.08); for (let k = 0; k < 12; k++) { const a = k / 12 * Math.PI; C.stripe(mb, o.x + o.w / 2 + Math.cos(a) * 2.2, o.z + 1 + Math.sin(a) * 2.2, o.x + o.w / 2 + Math.cos(a + Math.PI / 12) * 2.2, o.z + 1 + Math.sin(a + Math.PI / 12) * 2.2, c, 0.08); } } },
    hoop: { build: (mb, o) => { mb.box(o.x, 0.14, o.z, 0.12, 2.9, 0.12, '#3a3a40'); mb.box(o.x, 2.7, o.z + 0.3, 1.0, 0.7, 0.05, '#e8e2d8', { mat: W(MT.plain, 0.5) }); mb.cyl(o.x, 2.7, o.z + 0.55, 0.22, 0.03, 8, '#e8642a'); for (let k = 0; k < 6; k++) mb.box(o.x - 0.18 + k * 0.07, 2.4, o.z + 0.55, 0.015, 0.3, 0.015, '#e8e2d8'); }, foot: tileOf, h: 3 },
    pierposts: { build: (mb, o) => C.pierPosts(mb, o.x0, o.z0, o.x1, o.z1) },
    bollard: { build: (mb, o) => C.bollard(mb, o.x, o.z) },
    containers: { build: (mb, o) => { const cols = ['#b8443a', '#2f6a9a', '#3a8a5a', '#e8b62a', '#8a4a9a']; for (let k = 0; k < 9; k++) { const cx = o.x + 1.2 + (k % 3) * 4, cz = o.z + 0.6 + Math.floor(k / 3) * 3.2; C.container(mb, cx, cz, 0, pick(cols, R(k, 1, 4)), 0.05); if (R(k, 2, 4) > 0.4) C.container(mb, cx, cz, 0, pick(cols, R(k, 3, 4)), 1.3); } }, foot: o => { const out = []; for (let k = 0; k < 9; k++) { const cx = o.x + 1.2 + (k % 3) * 4, cz = o.z + 0.6 + Math.floor(k / 3) * 3.2; out.push(...rectFoot(cx - 1.2, cz - 0.55, 2.4, 1.1)); } return out; }, occ: true },
    forklift: { build: (mb, o) => F.forklift(mb, o.x, o.z, o.rot || 0), foot: tileOf, h: 2 },
    boat: { build: (mb, o) => { mb.at(o.x, -0.75, o.z, o.rot || 0); mb.box(0, 0, 0, 2.2, 0.8, 5.0, '#e8e2d8', { taper: 0.2, mat: W(MT.metal, 0.6) }); mb.box(0, 0.8, -0.6, 1.6, 0.9, 1.8, '#3a5a8a', { mat: W(MT.metal, 0.5) }); mb.box(0, 1.2, 0.31, 1.4, 0.4, 0.02, '#ffe2a0', { emit: 0.6 }); mb.box(0, 0.8, 1.4, 1.8, 0.1, 1.4, P.woodL); text(mb, 'MARISOL', 1.12, 0.35, 0, 0.03, '#2a4a8a', { dir: 'z' }); mb.box(0, 1.7, -0.6, 0.05, 1.6, 0.05, P.iron); mb.box(0, 3.2, -0.6, 0.12, 0.12, 0.12, '#59ff8a', { emit: 1.6 }); mb.pop(); }, foot: o => rectFoot(o.x - 1.1, o.z - 2.5, 2.2, 5), anchor: o => ({ x: 50.4, y: 1.2, z: o.z, tiles: [[50, Math.floor(o.z) - 1], [50, Math.floor(o.z)], [50, Math.floor(o.z) + 1]] }), h: 2, light: o => ({ x: o.x, y: 2, z: o.z, r: 4, c: [0.6, 1, 0.7], i: 0.7, night: true }) },
    metro: { build: (mb, o) => C.metroEntrance(mb, o.x, o.z, 3, 5), foot: o => [...rectFoot(o.x - 0.3, o.z, 0.6, 5), ...rectFoot(o.x + 2.7, o.z, 0.8, 5), ...rectFoot(o.x, o.z - 0.3, 3, 0.6)], h: 1.2, light: o => ({ x: o.x + 1.5, y: 0.5, z: o.z + 1.5, r: 4, c: [0.4, 0.45, 1], i: 1.0 }) },
    // ---------- the motel ----------
    motel: {
      build: (mb, o, ctx) => {
        const t = ctx.tier;
        if (t <= 3) M.wing(mb, null, t);
        else if (t === 4) M.hotel(mb, null, t, ctx.night);
        else M.grand(mb, null, ctx.night);
      },
      foot: (o, ctx) => { const out = []; for (const [x, z, w, d] of M.footprint(ctx.tier)) out.push(...rectFoot(x, z, w, d)); if (ctx.tier >= 5) out.push(...rectFoot(14, 23, 4, 4), ...rectFoot(20, 22.5, 1, 3)); return out; },
      light: (o, ctx) => {
        const L = [];
        const t = ctx.tier, pw = ctx.S.flags.power;
        if (t <= 3) {
          if (pw) for (let k = 0; k < 6; k++) L.push({ x: M.WING.x + k * 3 + 1.5, y: 1.7, z: M.WING.z + M.WING.d + 0.9, r: 3.6, c: t === 1 ? [0.85, 1, 0.8] : WARM, i: t === 1 ? 0.65 : 0.8, buzz: t === 1 && (k === 2 || k === 4) ? 1 : 0, night: true });
          if (pw) L.push({ x: M.OFFICE.x + M.OFFICE.w + 0.9, y: 1.4, z: M.OFFICE.z + 3, r: 4, c: WARM, i: 0.8 });
        } else {
          L.push({ x: 13, y: 1.6, z: (t === 4 ? 18 : 19.5), r: 7, c: [1, 0.85, 0.6], i: 1.3, night: true });
          L.push({ x: 13, y: 9, z: 17, r: 10, c: t === 5 ? [1, 0.85, 0.5] : NEON_P, i: 0.7, night: true });
          L.push({ x: M.OFFICE.x + M.OFFICE.w + 1, y: 2, z: M.OFFICE.z + 3, r: 5, c: NEON_V, i: 1.0, night: true });
          if (t >= 5) L.push({ x: 16, y: 1.2, z: 25, r: 5, c: [0.5, 0.9, 1], i: 0.9, night: true });
        }
        if (t >= 2) L.push({ x: M.POOL.x + 3.5, y: 0.2, z: M.POOL.z + 3, r: 6, c: [0.3, 0.85, 1], i: 0.8, night: true });
        return L;
      },
      occ: true, dyn: true, h: 2.5,
    },
    moteloffice: { build: (mb, o, ctx) => { if (ctx.tier <= 3) M.office(mb, null, ctx.tier, ctx.S.flags.power); else M.lounge(mb, ctx.tier); }, occ: true, dyn: true },
    motelyard: {
      build: (mb, o, ctx) => {
        const t = ctx.tier;
        if (t >= 2) M.poolDeckProps(mb, t);
        if (t >= 2) { C.palm(mb, 23.2, 30.5, 3); C.palm(mb, 3.8, 18.5, 5); }
        if (t >= 4) { C.palm(mb, 3.8, 28, 6); C.palm(mb, 15, 18.6, 8); M.valetStand(mb, 18.5, 20); }
        if (t >= 5) { M.fountain(mb, 16, 25); mb.at(20.5, 0.04, 24, 0); mb.merge(C.car('limo', '#111')); mb.pop(); }
      }, dyn: true,
    },
    roomdoor: {
      build: (mb, o, ctx) => { if (ctx.tier > 3 || o.room >= M.TIERS[ctx.tier].rooms) return; const r = ctx.S.rooms[o.room]; M.roomFront(mb, o.room, ctx.tier, r ? r.state : 'broken'); },
      foot: none, dyn: true, anchor: (o, ctx) => { const d = M.roomDoor(o.room, ctx.tier); return { x: d.x, y: 1.0, z: d.z + 0.6, tiles: [[Math.floor(d.x), Math.floor(d.z)], [Math.floor(d.x) + 1, Math.floor(d.z)]] }; },
      visible: (o, ctx) => ctx.tier <= 3 && o.room < M.TIERS[ctx.tier].rooms, h: 1.8,
    },
    officedoor: { build: () => {}, foot: none, dyn: true, anchor: (o, ctx) => { const d = M.frontDoor(ctx.tier); return { x: d.x, y: 1.0, z: d.z, tiles: [d.tile] }; }, h: 1.8 },
    motelsign: { build: (mb, o, ctx) => { M.sign(mb, ctx.tier, ctx.S.flags.power ? 'on' : 'dead', ctx.vacancy); }, foot: tileOf, dyn: true, h: 5.5,
      light: (o, ctx) => ctx.S.flags.power ? [{ x: o.x + 1.2, y: 4.6, z: o.z, r: 7, c: NEON_P, i: 1.0, buzz: ctx.tier === 1 ? 0.6 : 0, night: true }, { x: o.x + 0.8, y: 3.4, z: o.z, r: 4, c: [1, 0.3, 0.3], i: 0.7, night: true }] : null },
    pool: { build: (mb, o, ctx) => M.pool(mb, ctx.tier, ctx.tier >= 2 || ctx.S.flags.poolFixed), foot: none, dyn: true, h: 0.5, anchor: () => ({ x: M.POOL.x + 3.5, y: 0.3, z: M.POOL.z + M.POOL.d + 0.2, tiles: rectFoot(M.POOL.x, M.POOL.z, M.POOL.w, M.POOL.d) }) },
    // ---------- interiors ----------
    counter: { build: (mb, o) => F.counter(mb, o.x, o.z, o.w || 3, o.luxe), foot: o => rectFoot(o.x - (o.w || 3) / 2, o.z - 0.3, o.w || 3, 0.6), h: 1.1 },
    bell: { build: (mb, o) => F.bell(mb, o.x, o.z), foot: none, h: 1.2, y: 1.1 },
    register: { build: (mb, o) => F.register(mb, o.x, o.z), foot: none, h: 1.3, y: 1.2 },
    keyrack: { build: (mb, o) => F.keyrack(mb, o.x, o.z), foot: none, h: 1.8, wall: true },
    plans: { build: (mb, o) => F.plans(mb, o.x, o.z), foot: none, h: 1.8, wall: true },
    partition: { build: (mb, o) => F.partition(mb, o.x, o.z, o.d), foot: o => rectFoot(o.x - 0.1, o.z, 0.2, o.d) },
    cot: { build: (mb, o) => F.cot(mb, o.x, o.z, o.luxe), foot: o => rectFoot(o.x - 0.45, o.z - 0.95, 0.9, 1.9), h: 0.6 },
    safe: { build: (mb, o) => F.safe(mb, o.x, o.z), foot: tileOf, h: 1.0 },
    fusebox: { build: (mb, o, ctx) => F.fusebox(mb, o.x, o.z), foot: none, h: 1.6, wall: true, y: 1.3 },
    plant: { build: (mb, o) => F.plant(mb, o.x, o.z), foot: tileOf },
    chair: { build: (mb, o) => F.chair(mb, o.x, o.z, o.rot || 0) },
    rack: { build: (mb, o) => F.rack(mb, o.x, o.z, o.rot || 0), foot: tileOf },
    ceilfan: { build: (mb, o) => F.ceilfan(mb, o.x, o.z) },
    tv: { build: (mb, o) => F.tv(mb, o.x, o.z) },
    watercooler: { build: (mb, o) => F.watercooler(mb, o.x, o.z), foot: tileOf },
    rug: { build: (mb, o) => F.rug(mb, o.x, o.z, o.w, o.d, o.col), noShadow: true },
    elevator: { build: (mb, o) => F.elevator(mb, o.x, o.z) },
    chandelier: { build: (mb, o) => F.chandelier(mb, o.x, o.z), light: o => ({ x: o.x, y: 1.6, z: o.z, r: 7, c: [1, 0.88, 0.65], i: 1.0 }) },
    sofa: { build: (mb, o) => F.sofa(mb, o.x, o.z, o.rot || 0), foot: o => rotFoot(o, 2.0, 0.8) },
    coffeetable: { build: (mb, o) => F.coffeetable(mb, o.x, o.z), foot: tileOf },
    barcounter: { build: (mb, o) => F.barcounter(mb, o.x, o.z, o.d || 4), foot: o => rectFoot(o.x - 1.1, o.z - (o.d || 4) / 2, 1.5, o.d || 4), h: 1.2, light: o => ({ x: o.x + 0.6, y: 0.4, z: o.z, r: 3, c: NEON_P, i: 0.6 }) },
    bed: { build: (mb, o, ctx) => F.bed(mb, o.x, o.z, ctx.room ? (ctx.room.tasks && ctx.room.tasks.bed ? 'dirty' : 'clean') : 'clean'), foot: o => rectFoot(o.x - 0.75, o.z - 1.15, 1.5, 2.3), dyn: true, h: 0.9 },
    nightstand: { build: (mb, o) => F.nightstand(mb, o.x, o.z), foot: tileOf },
    tvstand: { build: (mb, o, ctx) => F.tvstand(mb, o.x, o.z, ctx.room && ctx.room.state === 'occupied'), foot: o => rectFoot(o.x - 0.55, o.z - 0.25, 1.1, 0.5), dyn: true, h: 1.0 },
    bathroom: { build: (mb, o, ctx) => F.bathroom(mb, o.x, o.z, ctx.room && ctx.room.tasks && ctx.room.tasks.bath), foot: o => rectFoot(o.x - 0.95, o.z - 1.6, 1.8, 3.2), dyn: true, h: 0.9 },
    mess: { build: (mb, o, ctx) => F.mess(mb, o.x, o.z, o.n, ctx.room && ctx.room.tasks && ctx.room.tasks[o.id]), foot: none, dyn: true, h: 0.5 },
    hole: { build: (mb, o, ctx) => F.hole(mb, o.x, o.z, ctx.room && ctx.room.tasks && ctx.room.tasks.hole), foot: none, dyn: true, h: 1.2, wall: true },
    wiring: { build: (mb, o, ctx) => F.wiring(mb, o.x, o.z, ctx.room && ctx.room.tasks && ctx.room.tasks.wiring), foot: none, dyn: true, h: 1.8, wall: true },
    window: { build: (mb, o) => F.window(mb, o.x, o.z) },
    stash: { build: (mb, o) => F.stash(mb, o.x, o.z), foot: tileOf, h: 0.4 },
    ac: { build: (mb, o) => F.ac(mb, o.x, o.z) },
    glasscase: { build: (mb, o) => F.glasscase(mb, o.x, o.z, o.w || 3, o.rot || 0), foot: o => rotFoot(o, o.w || 3, 0.6), h: 1.1, light: o => ({ x: o.x, y: 1.2, z: o.z + 0.4, r: 2.4, c: COOL, i: 0.5 }) },
    guitarwall: { build: (mb, o) => F.guitarwall(mb, o.x, o.z) },
    tvstack: { build: (mb, o) => F.tvstack(mb, o.x, o.z), foot: tileOf },
    neonwall: { build: (mb, o) => F.neonwall(mb, o.x, o.z, o.text, o.col), light: o => ({ x: o.x, y: 1.8, z: o.z + 0.8, r: 4, c: KIT.rgb(o.col), i: 0.7 }) },
    shelf: { build: (mb, o) => F.shelf(mb, o.x, o.z, o.rot || 0), foot: o => rotFoot(o, 1.4, 0.4) },
    bikes: { build: (mb, o) => F.bikes(mb, o.x, o.z), foot: o => rectFoot(o.x - 0.6, o.z - 0.2, 2.0, 0.4) },
    aisle: { build: (mb, o) => F.aisle(mb, o.x, o.z, o.len || 3), foot: o => rectFoot(o.x - (o.len || 3) / 2, o.z - 0.3, o.len || 3, 0.6) },
    cooler: { build: (mb, o) => F.cooler(mb, o.x, o.z, o.n || 3), foot: o => rectFoot(o.x - (o.n || 3) * 0.45, o.z, (o.n || 3) * 0.9, 0.6), light: o => ({ x: o.x, y: 1.0, z: o.z + 1.2, r: 3.5, c: COOL, i: 0.7 }) },
    lotto: { build: (mb, o) => F.lotto(mb, o.x, o.z), foot: tileOf, h: 1.4 },
    icecream: { build: (mb, o) => F.icecream(mb, o.x, o.z), foot: o => rectFoot(o.x - 0.4, o.z - 0.7, 0.8, 1.4) },
    magrack: { build: (mb, o) => F.magrack(mb, o.x, o.z, o.rot || 0), foot: tileOf },
    dinercounter: { build: (mb, o) => F.dinercounter(mb, o.x, o.z, o.w || 5), foot: o => rectFoot(o.x - (o.w || 5) / 2, o.z - 1.3, o.w || 5, 2.0), h: 1.1 },
    stool: { build: (mb, o) => F.stool(mb, o.x, o.z) },
    booth: { build: (mb, o) => F.booth(mb, o.x, o.z, o.rot || 0), foot: o => rotFoot(o, 2.0, 1.3), h: 1.0 },
    jukebox: { build: (mb, o) => F.jukebox(mb, o.x, o.z), foot: tileOf, h: 1.6, light: o => ({ x: o.x + 0.6, y: 1.0, z: o.z + 0.6, r: 3, c: NEON_P, i: 0.7 }) },
    pies: { build: (mb, o) => F.pies(mb, o.x, o.z) },
    metrostairs: { build: (mb, o) => F.metrostairs(mb, o.x, o.z) },
    tracks: { build: (mb, o) => F.tracks(mb, o.x, o.z, o.w) },
    subwaycar: { build: (mb, o) => F.subwaycar(mb, o.x, o.z), foot: none, h: 1.5, anchor: o => ({ x: o.x, y: 0.8, z: 5.6, tiles: [[o.x - 1, 5], [o.x, 5], [o.x + 1, 5]] }), light: o => ({ x: o.x, y: 0.6, z: o.z - 1.6, r: 5, c: WARM, i: 0.7 }) },
    stall: { build: (mb, o) => F.stall(mb, o.x, o.z, o.col, o.text), foot: o => rectFoot(o.x - 1.7, o.z - 0.6, 3.4, 1.5), h: 1.4, light: o => ({ x: o.x, y: 2.0, z: o.z + 0.6, r: 4.5, c: KIT.rgb(o.col), i: 1.0 }) },
    barrelfire: { build: (mb, o) => F.barrelfire(mb, o.x, o.z), foot: tileOf, light: o => ({ x: o.x, y: 1.1, z: o.z, r: 4.5, c: [1, 0.55, 0.2], i: 1.3, flicker: 2 }) },
    metrorail: { build: (mb, o) => F.metrorail(mb, o.x0, o.x1, o.z), foot: o => rectFoot(o.x0, o.z - 0.2, o.x1 - o.x0, 0.4) },
    rubble: { build: (mb, o) => F.rubble(mb, o.x, o.z, o.n) },
    tube: { build: (mb, o) => F.tube(mb, o.x, o.z), light: o => ({ x: o.x, y: 3.2, z: o.z + 1.0, r: 6.5, c: [0.8, 0.95, 1], i: 1.0, buzz: o.x > 14 && o.x < 16 ? 1 : 0 }) },
    neonstrip: { build: (mb, o) => F.neonstrip(mb, o.x, o.z, o.col), light: o => ({ x: o.x - 1, y: 2.8, z: o.z, r: 7, c: NEON_V, i: 1.5 }) },
    cell: { build: (mb, o) => F.cell(mb, o.x, o.z), foot: o => rectFoot(o.x - 1.7, o.z - 1, 3.4, 2.4) },
    door: { build: (mb, o) => F.door(mb, o.x, o.z, o.label), h: 2, wall: true },
    flag: { build: (mb, o) => F.flag(mb, o.x, o.z), foot: tileOf },
    desk: { build: (mb, o) => F.desk(mb, o.x, o.z), foot: o => rectFoot(o.x - 0.7, o.z - 0.35, 1.4, 0.7), h: 1.0 },
    corkboard: { build: (mb, o) => F.corkboard(mb, o.x, o.z, o.text), h: 1.8, wall: true },
    washers: { build: (mb, o) => F.washers(mb, o.x, o.z, o.n), foot: o => rectFoot(o.x - o.n * 0.42, o.z - 0.35, o.n * 0.84, 0.7), h: 1.0 },
    dryers: { build: (mb, o) => F.dryers(mb, o.x, o.z, o.n), foot: o => rectFoot(o.x - 0.35, o.z - o.n * 0.42, 0.7, o.n * 0.84) },
    foldtable: { build: (mb, o) => F.foldtable(mb, o.x, o.z), foot: o => rectFoot(o.x - 1, o.z - 0.4, 2, 0.8) },
    changemachine: { build: (mb, o) => F.changemachine(mb, o.x, o.z), foot: tileOf, h: 1.5 },
    stage: { build: (mb, o) => F.stage(mb, o.x, o.z), foot: o => rectFoot(o.x - 1.8, o.z - 1.1, 3.6, 2.2), light: o => ({ x: o.x, y: 2.2, z: o.z + 1.2, r: 5, c: [0.4, 0.5, 1], i: 1.0 }) },
    roundtable: { build: (mb, o) => F.roundtable(mb, o.x, o.z), foot: tileOf, light: o => ({ x: o.x, y: 1.0, z: o.z, r: 2.2, c: [1, 0.6, 0.3], i: 0.5, flicker: 1 }) },
    pooltable: { build: (mb, o) => F.pooltable(mb, o.x, o.z), foot: o => rectFoot(o.x - 1, o.z - 0.55, 2, 1.1), h: 1.0, light: o => ({ x: o.x, y: 1.8, z: o.z, r: 3, c: WARM, i: 0.8 }) },
    loft: { build: (mb, o) => F.loft(mb, o.x, o.z), foot: o => [...rectFoot(o.x, o.z + 3, 0.3, 0.3), ...rectFoot(o.x + 3.8, o.z + 3, 0.3, 0.3)] },
    filecab: { build: (mb, o) => F.filecab(mb, o.x, o.z), foot: tileOf, h: 1.3 },
    model: { build: (mb, o) => F.model(mb, o.x, o.z), foot: o => rectFoot(o.x - 0.6, o.z - 0.5, 1.2, 1.0) },
    npcspot: { build: () => {}, foot: none },
    parked: { build: (mb, o) => { mb.at(o.x, o.y != null ? o.y : 0.03, o.z, o.rot || 0); mb.merge(C.car(o.kind || 'sedan', o.col || '#5a6a7a')); mb.pop(); if (o.kind === 'wreck') { for (const [dx, dz] of [[-0.4, -0.7], [0.4, -0.7], [-0.4, 0.7], [0.4, 0.7]]) mb.box(o.x + dx, 0.02, o.z + dz, 0.25, 0.2, 0.25, '#7a7670'); } }, foot: o => rotFoot(o, 1.0, 2.1), h: 1.0 },
    dirtpile: { build: (mb, o) => { mb.sphere(o.x, 0, o.z, o.r || 1.2, '#6a5640', { detail: 1, sy: 0.5, jitter: 0.25, seed: o.x, flatBottom: 0, mat: W(MT.concrete, 0.9) }); }, foot: o => rectFoot(o.x - (o.r || 1.2) * 0.8, o.z - (o.r || 1.2) * 0.8, (o.r || 1.2) * 1.6, (o.r || 1.2) * 1.6) },
    rebar: { build: (mb, o) => { for (let k = 0; k < 9; k++) mb.box(o.x, 0.06 + (k % 3) * 0.05, o.z - 0.2 + Math.floor(k / 3) * 0.2, 2.4, 0.04, 0.04, '#8a4a2a', { mat: W(MT.metal, 0.9) }); mb.box(o.x - 0.8, 0.04, o.z, 0.2, 0.06, 0.8, P.woodD); mb.box(o.x + 0.8, 0.04, o.z, 0.2, 0.06, 0.8, P.woodD); }, foot: o => rectFoot(o.x - 1.2, o.z - 0.4, 2.4, 0.8) },
    pipes: { build: (mb, o) => { for (let k = 0; k < 5; k++) { mb.at(o.x, 0.25 + (k > 2 ? 0.4 : 0), o.z - 0.6 + (k % 3) * 0.45 + (k > 2 ? 0.22 : 0), 0, 1, 0, Math.PI / 2); mb.cyl(0, -1.4, 0, 0.22, 2.8, 8, '#7a7e86', { mat: W(MT.metal, 0.7) }); mb.pop(); } }, foot: o => rectFoot(o.x - 1.4, o.z - 0.8, 2.8, 1.6) },
    mixer: { build: (mb, o) => { mb.at(o.x, 0.04, o.z, o.rot || 0); mb.box(0, 0.25, 0.9, 1.0, 1.1, 1.1, '#e8b62a', { mat: W(MT.metal, 0.6) }); mb.box(0, 0.25, -0.5, 1.0, 0.25, 2.2, '#3a3a40'); mb.at(0, 1.05, -0.5, 0, 1, 1.25); mb.cyl(0, -0.7, 0, 0.5, 1.4, 8, '#d8d8d0', { r2: 0.3, mat: W(MT.metal, 0.7) }); mb.pop(); for (const [dx, dz] of [[-0.5, 1], [0.5, 1], [-0.5, -1.2], [0.5, -1.2]]) { mb.at(dx, 0.25, dz, 0, 1, 0, Math.PI / 2); mb.cyl(0, -0.08, 0, 0.25, 0.16, 8, '#18181c'); mb.pop(); } mb.pop(); }, foot: o => rotFoot(o, 1.1, 3.2), h: 2 },
    excavator: { build: (mb, o) => { mb.at(o.x, 0.04, o.z, o.rot || 0); mb.box(0, 0, 0, 1.6, 0.45, 2.2, '#2a2a30'); mb.box(0, 0.45, -0.2, 1.4, 0.9, 1.4, '#e8b62a', { mat: W(MT.metal, 0.6) }); mb.box(0.3, 1.35, -0.2, 0.7, 0.7, 0.9, '#e8b62a'); mb.box(0.3, 1.45, 0.26, 0.6, 0.45, 0.02, '#2a3a4a', { mat: W(MT.glass, 0.3) }); mb.at(-0.3, 1.2, 0.4, 0, 1, -0.6); mb.box(0, 0, 1.0, 0.25, 0.25, 2.0, '#e8b62a'); mb.pop(); mb.at(-0.3, 1.7, 2.0, 0, 1, 0.9); mb.box(0, -1.5, 0, 0.22, 1.5, 0.22, '#e8b62a'); mb.pop(); mb.box(-0.3, 0.05, 2.6, 0.7, 0.5, 0.5, '#5a5a60'); mb.pop(); }, foot: o => rotFoot(o, 1.6, 3.2), h: 2.2 },
    barrels: { build: (mb, o) => { for (let k = 0; k < (o.n || 4); k++) mb.cyl(o.x + (k % 2) * 0.62, 0.05, o.z + Math.floor(k / 2) * 0.62, 0.28, 0.85, 8, pick(['#2f6a9a', '#c8443c', '#3a8a5a', '#5a5a64'], R(k, o.x, 2)), { mat: W(MT.metal, 0.8), top: '#3a3a40' }); }, foot: o => rectFoot(o.x - 0.3, o.z - 0.3, 1.25, Math.ceil((o.n || 4) / 2) * 0.62 + 0.1) },
    nets: { build: (mb, o) => { mb.box(o.x, 0.2, o.z, 1.4, 0.35, 1.0, '#5a6a4a', { mat: W(MT.carpet, 0.9) }); mb.sphere(o.x + 0.3, 0.55, o.z, 0.2, '#e8642a', { detail: 0 }); mb.sphere(o.x - 0.4, 0.5, o.z + 0.2, 0.16, '#e8e2d8', { detail: 0 }); } },
    nopark: { build: (mb, o) => { mb.box(o.x, 0.14, o.z, 0.05, 1.8, 0.05, '#8a8e96'); mb.box(o.x + 0.03, 1.55, o.z, 0.02, 0.45, 0.32, '#e8e2d8'); mb.box(o.x + 0.045, 1.62, o.z, 0.01, 0.28, 0.24, '#c8443c'); } },
    oilstain: { build: (mb, o) => { mb.box(o.x, 0.025, o.z, 0.9, 0.005, 0.6, '#18161e', { jit: 0 }); mb.box(o.x + 0.3, 0.026, o.z + 0.2, 0.4, 0.005, 0.3, '#24202c', { jit: 0 }); } },
    shoppingcart: { build: (mb, o) => { mb.at(o.x, 0.04, o.z, o.rot || 0); mb.box(0, 0.35, 0, 0.5, 0.45, 0.7, '#9aa0a8', { mat: W(MT.metal, 0.6) }); mb.box(0, 0.8, -0.38, 0.5, 0.05, 0.05, '#c8443c'); for (const [dx, dz] of [[-0.2, -0.3], [0.2, -0.3], [-0.2, 0.3], [0.2, 0.3]]) mb.box(dx, 0, dz, 0.06, 0.1, 0.06, '#222'); mb.pop(); } },
    // slum props
    bedroll: { build: (mb, o) => { mb.at(o.x, 0.02, o.z, o.rot || 0); mb.box(0, 0, 0, 0.8, 0.05, 1.7, '#8a6a4a', { mat: W(MT.wood, 0.9) }); mb.box(0, 0.05, 0.2, 0.62, 0.12, 1.1, o.col || '#4a5a7a', { mat: W(MT.plain, 0.8) }); mb.box(0, 0.05, -0.6, 0.5, 0.14, 0.3, '#c8c0b0', { mat: W(MT.plain, 0.6) }); mb.pop(); }, foot: none, h: 0.3 },
    shopcart: { build: (mb, o) => { mb.at(o.x, 0.04, o.z, o.rot || 0); for (const [x, z] of [[-0.25, -0.4], [0.25, -0.4], [-0.25, 0.4], [0.25, 0.4]]) mb.box(x, 0, z, 0.06, 0.08, 0.06, '#18181e'); mb.box(0, 0.12, 0, 0.56, 0.04, 0.9, '#8a8a92', { mat: W(MT.metal, 0.6) }); mb.box(-0.27, 0.16, 0, 0.03, 0.5, 0.9, '#a8a8b0', { mat: W(MT.metal, 0.5) }); mb.box(0.27, 0.16, 0, 0.03, 0.5, 0.9, '#a8a8b0', { mat: W(MT.metal, 0.5) }); mb.box(0, 0.16, 0.44, 0.56, 0.5, 0.03, '#a8a8b0', { mat: W(MT.metal, 0.5) }); mb.box(0, 0.16, -0.44, 0.56, 0.5, 0.03, '#a8a8b0', { mat: W(MT.metal, 0.5) }); mb.box(0, 0.66, 0.5, 0.5, 0.04, 0.04, '#c8443c'); mb.box(0, 0.2, 0, 0.48, 0.42, 0.8, '#3a3a44', { mat: W(MT.plain, 0.8) }); mb.box(0.08, 0.58, -0.1, 0.3, 0.16, 0.3, '#5a6a3a'); mb.pop(); }, foot: o => { if (RECTS) RECTS.push([o.x - 0.35, o.z - 0.5, 0.7, 1.0]); return []; }, h: 0.8 },
    cardboard: { build: (mb, o) => { mb.at(o.x, 0.02, o.z, o.rot || 0); mb.box(0, 0, 0, 0.9, 0.6, 0.9, '#b8864a', { mat: W(MT.wood, 0.9) }); mb.box(0, 0.6, 0.1, 0.9, 0.04, 0.6, '#a8763a'); mb.box(0, 0.12, 0.46, 0.6, 0.4, 0.02, '#2a1e14'); mb.pop(); }, foot: o => { if (RECTS) RECTS.push([o.x - 0.45, o.z - 0.45, 0.9, 0.9]); return []; }, h: 0.7 },
    tent: { build: (mb, o) => { mb.at(o.x, 0.05, o.z, o.rot || 0); mb.quad([-0.8, 0, 0.7], [0.8, 0, 0.7], [0, 1.0, 0.7], [0, 1.0, 0.7], '#3a6a8a'); mb.quad([-0.8, 0, -0.7], [-0.8, 0, 0.7], [0, 1.0, 0.7], [0, 1.0, -0.7], '#3a6a8a', { mat: W(MT.carpet, 0.8) }); mb.quad([0.8, 0, 0.7], [0.8, 0, -0.7], [0, 1.0, -0.7], [0, 1.0, 0.7], '#2a5a7a', { mat: W(MT.carpet, 0.8) }); mb.pop(); }, foot: tileOf },
  };

  // ---------------- interior ceiling lights (generic) ----------------
  function interiorLights(map) {
    const L = [];
    if (map.underground) return L;
    const dark = map.walls && map.walls.dark;
    for (let x = 2; x < map.w; x += 4) for (let z = 2; z < map.h; z += 4) L.push({ x, y: 2.3, z, r: 5.2, c: dark ? [0.7, 0.45, 0.9] : [1, 0.9, 0.75], i: dark ? 0.55 : 0.8 });
    return L;
  }

  // ---------------- skyline around the district ----------------
  function skyline(mb, map) {
    const add = (x, z, w, d, fl, seed, face) => C.building(mb, null, { x, z, w, d, floors: fl, seed, face: face || 's', lit: 0.45, wear: 0.6, roofProps: true, fire: R(seed, 1, 1) > 0.6 });
    // north edge: tall
    let x = -6;
    while (x < map.w + 6) { const w = 5 + Math.floor(R(x, 3, 1) * 5); if (x + w > 23 && x < 35) { x = 35; continue; } add(x, -9, w, 8, 5 + Math.floor(R(x, 4, 1) * 6), x * 3 + 1); x += w + 0.2; }
    // west edge: tall
    let z = 0;
    while (z < map.h) { const d = 5 + Math.floor(R(z, 5, 1) * 4); if (!(z > 44 && z < 52)) add(-9, z, 8, d, 4 + Math.floor(R(z, 6, 1) * 6), z * 5 + 7, 'e'); z += d + 0.2; }
  }
  function outerGround(mb, map) {
    const c = '#26242c';
    const flat = (x0, z0, x1, z1) => mb.quad([x0, -0.02, z1], [x1, -0.02, z1], [x1, -0.02, z0], [x0, -0.02, z0], c, { mat: W(MT.asphalt, 0.6), jit: 0 });
    // land around the map, leaving the harbour open so the water shows
    const wx = map.waterX != null ? map.waterX : map.w, wz = map.waterZ != null ? map.waterZ : 44;
    flat(-40, -40, map.w + 40, 0);          // north
    flat(-40, 0, 0, map.h + 40);            // west
    flat(0, map.h, wx, map.h + 40);         // south
    flat(map.w, 0, map.w + 40, wz);         // east, above the bay
    // Harbor St continues west; Sunset Blvd continues north and south
    mb.quad([-40, 0.005, 52], [0, 0.005, 52], [0, 0.005, 46], [-40, 0.005, 46], P.asphalt, { mat: W(MT.asphalt, 0.6), jit: 0 });
    mb.quad([26, 0.005, 0], [32, 0.005, 0], [32, 0.005, -40], [26, 0.005, -40], P.asphalt, { mat: W(MT.asphalt, 0.6), jit: 0 });
    mb.quad([26, 0.005, map.h + 40], [32, 0.005, map.h + 40], [32, 0.005, map.h], [26, 0.005, map.h], P.asphalt, { mat: W(MT.asphalt, 0.6), jit: 0 });
    // the bay beyond the docks
    const sea = (x0, z0, x1, z1) => mb.quad([x0, -0.9, z1], [x1, -0.9, z1], [x1, -0.9, z0], [x0, -0.9, z0], C.GROUND.water.c, { mat: W(MT.water, 0), jit: 0 });
    sea(map.w, wz, map.w + 40, map.h + 40);
    sea(wx, map.h, map.w, map.h + 40);
  }
  function roadPaint(mb, map) {
    // Sunset Blvd: double yellow centre, white lane dashes; Harbor St same
    C.stripe(mb, 28.93, -40, 28.93, 46, P.lane, 0.07); C.stripe(mb, 29.07, -40, 29.07, 46, P.lane, 0.07);
    C.stripe(mb, 28.93, 52, 28.93, map.h + 40, P.lane, 0.07); C.stripe(mb, 29.07, 52, 29.07, map.h + 40, P.lane, 0.07);
    C.laneDash(mb, 27.5, -40, 27.5, 45, P.laneW, 0.08); C.laneDash(mb, 30.5, -40, 30.5, 45, P.laneW, 0.08);
    C.laneDash(mb, 27.5, 53, 27.5, map.h + 40, P.laneW, 0.08); C.laneDash(mb, 30.5, 53, 30.5, map.h + 40, P.laneW, 0.08);
    C.stripe(mb, -40, 48.93, 25, 48.93, P.lane, 0.07); C.stripe(mb, -40, 49.07, 25, 49.07, P.lane, 0.07);
    C.stripe(mb, 33, 48.93, 50, 48.93, P.lane, 0.07); C.stripe(mb, 33, 49.07, 50, 49.07, P.lane, 0.07);
    C.laneDash(mb, -40, 47.5, 25, 47.5, P.laneW, 0.08); C.laneDash(mb, 33, 50.5, 50, 50.5, P.laneW, 0.08);
    for (const c of map.crosswalks || []) {
      if (c.across === 'z') C.crosswalk(mb, c.x0, c.z0 + 0.3, c.x1 + 1, c.z1 + 0.7, true);
      else C.crosswalk(mb, c.x0 + 0.3, c.z0, c.x1 + 0.7, c.z1 + 1, false);
    }
    C.stripe(mb, 26, 45.9, 29, 45.9, P.laneW, 0.18); C.stripe(mb, 29, 52.1, 32, 52.1, P.laneW, 0.18);
  }

  // ---------------- build a whole map ----------------
  // ctx: { S, tier, night, vacancy, room }
  function buildMap(map, ctx) {
    RECTS = [];
    const statics = []; // [{mb, x, z}] merged into chunks
    const CH = 16;
    const chunks = {};
    const chunk = (x, z) => { const k = Math.floor(x / CH) + ',' + Math.floor(z / CH); return chunks[k] || (chunks[k] = { mb: new MB(), key: k, cx: Math.floor(x / CH), cz: Math.floor(z / CH) }); };
    const occ = []; // fadeable occluders {mb, box, id}
    const dyn = []; // {o, k, mb}
    const solid = new Set(), walk = new Set();
    const lights = [];
    // ground
    if (map.outdoor) {
      const g = new MB(); C.ground(map, g);
      if (map.paint) map.paint(g, C, P); else roadPaint(g, map);
      if (map.outer) map.outer(g, C, P); else outerGround(g, map);
      statics.push({ mb: g, whole: true });
      const sky = new MB(); if (map.skyline) map.skyline(sky, C, P); else skyline(sky, map);
      occ.push({ mb: sky, box: [-12, 0, -12, map.w + 6, 30, map.h], id: 'skyline', noFade: true });
      // district buildings
      for (const b of map.buildings || []) {
        const mb = new MB();
        const H = b.tower ? DT.tower(mb, Object.assign({ seed: b.x * 31 + b.z * 17 }, b)) : C.building(mb, null, Object.assign({ seed: b.x * 31 + b.z * 17 }, b));
        occ.push({ mb, box: [b.x - 0.5, 0, b.z - 0.5, b.x + b.w + 1.2, H + 3, b.z + b.d + 1.2], id: b.id });
        if (b.shop) {
          const front = b.face === 'e' ? { x: b.x + b.w + 1.2, z: b.z + b.d / 2 } : { x: b.x + b.w / 2, z: b.z + b.d + 1.2 };
          lights.push({ x: front.x, y: 1.3, z: front.z, r: 4.2, c: KIT.rgb(b.shop.col).map(v => 0.4 + v * 0.6), i: b.shop.lit === false ? 0 : 0.85, night: true });
        }
      }
    } else {
      const g = I.shell(map);
      statics.push({ mb: g, whole: true });
      lights.push(...interiorLights(map));
    }
    for (const t of map.t.map((v, i) => [v, i])) {
      const [v, i] = t; const x = i % map.w, z = Math.floor(i / map.w);
      if (v === 'bldg' || v === 'water' || v === 'void') solid.add(x + ',' + z);
    }
    // objects
    for (const o of map.objects || []) {
      const k = K[o.k];
      if (!k) { console.warn('unknown kind', o.k); continue; }
      const isDyn = o.id != null || k.dyn;
      let built, a0;
      if (isDyn) {
        const mb = new MB(); k.build(mb, o, ctx);
        dyn.push({ o, k, mb }); built = mb; a0 = 0;
      } else if (k.occ) {
        const mb = new MB(); k.build(mb, o, ctx);
        occ.push({ mb, box: null, id: o.k }); built = mb; a0 = 0;
      } else {
        const ch = map.outdoor ? chunk(o.x != null ? o.x : o.x0, o.z != null ? o.z : o.z0) : chunk(0, 0);
        a0 = ch.mb.a.length; k.build(ch.mb, o, ctx); built = ch.mb;
      }
      // hitbox traced from the object's own geometry, so what you see is what you bump into
      if (!AUTO_SKIP.has(o.k) && !k.wall && !o.walkThrough) autoFoot(built.a, a0, built.a.length);
      else if (k.foot) {
        const n0 = RECTS.length, tiles = k.foot(o, ctx);
        // footprints given as raw tile lists become full-tile rectangles
        if (RECTS.length === n0) for (const [x, z] of tiles) RECTS.push([x, z, 1, 1]);
      }
      if (k.light) { const l = k.light(o, ctx); if (l) (Array.isArray(l) ? l : [l]).forEach(q => { q.src = o.id || o.k; lights.push(q); }); }
    }
    for (const e of map.exits || []) for (let i = 0; i < (e.w || 1); i++) for (let j = 0; j < (e.h || 1); j++) { walk.add((e.x + i) + ',' + (e.z + j)); solid.delete((e.x + i) + ',' + (e.z + j)); }
    const fp = collision(map, solid, walk, RECTS); RECTS = null;
    for (const c of Object.values(chunks)) statics.push({ mb: c.mb });
    return { statics, occ, dyn, fp, lights };
  }
  // ---------------- hitboxes from geometry ----------------
  // Everything at body height (between ankle and head) blocks. Each triangle is rasterised onto
  // a fine grid seen from above; vertical faces count as their edge. Cells merge into rectangles.
  const AUTO_SKIP = new Set(['motel', 'moteloffice', 'roomdoor', 'officedoor', 'npcspot', 'pool', 'mess', 'hole', 'wiring', 'bedroll', 'rug', 'oilstain', 'manhole', 'parking', 'court', 'tracks', 'metrostairs', 'billboard', 'tube', 'neonstrip', 'ceilfan', 'chandelier', 'window', 'ac', 'nets', 'skyline']);
  const CELL = 0.2, Y0 = 0.24, Y1 = 1.7;
  function autoFoot(a, s, e) {
    if (e <= s) return;
    const cells = new Set();
    const mark = (x, z) => cells.add(Math.floor(x / CELL) + ',' + Math.floor(z / CELL));
    for (let i = s; i + 35 < e; i += 36) {
      const ax = a[i], ay = a[i + 1], az = a[i + 2], bx = a[i + 12], by = a[i + 13], bz = a[i + 14], cx = a[i + 24], cy = a[i + 25], cz = a[i + 26];
      const lo = Math.min(ay, by, cy), hi = Math.max(ay, by, cy);
      if (hi < Y0 || lo > Y1) continue;
      const area = (bx - ax) * (cz - az) - (cx - ax) * (bz - az);
      if (Math.abs(area) < 1e-4) {
        // a wall seen edge-on: walk its longest edge
        let px = ax, pz = az, qx = bx, qz = bz;
        const d1 = (bx - ax) ** 2 + (bz - az) ** 2, d2 = (cx - ax) ** 2 + (cz - az) ** 2, d3 = (cx - bx) ** 2 + (cz - bz) ** 2;
        if (d2 >= d1 && d2 >= d3) { qx = cx; qz = cz; } else if (d3 >= d1 && d3 >= d2) { px = bx; pz = bz; qx = cx; qz = cz; }
        const n = Math.max(1, Math.ceil(Math.hypot(qx - px, qz - pz) / (CELL * 0.5)));
        for (let k = 0; k <= n; k++) mark(px + (qx - px) * k / n, pz + (qz - pz) * k / n);
        continue;
      }
      // horizontal surfaces only count if they sit at body height (a table top, a bench seat)
      if (lo < Y0 && hi < Y0 + 0.05) continue;
      const x0 = Math.min(ax, bx, cx), x1 = Math.max(ax, bx, cx), z0 = Math.min(az, bz, cz), z1 = Math.max(az, bz, cz);
      for (let gx = Math.floor(x0 / CELL); gx * CELL <= x1; gx++) for (let gz = Math.floor(z0 / CELL); gz * CELL <= z1; gz++) {
        const px = (gx + 0.5) * CELL, pz = (gz + 0.5) * CELL;
        const w0 = (bx - ax) * (pz - az) - (bz - az) * (px - ax), w1 = (cx - bx) * (pz - bz) - (cz - bz) * (px - bx), w2 = (ax - cx) * (pz - cz) - (az - cz) * (px - cx);
        if ((w0 >= 0 && w1 >= 0 && w2 >= 0) || (w0 <= 0 && w1 <= 0 && w2 <= 0)) cells.add(gx + ',' + gz);
      }
    }
    if (!cells.size) return;
    // rows of cells -> runs -> rectangles
    const rows = new Map();
    for (const c of cells) { const [x, z] = c.split(',').map(Number); if (!rows.has(z)) rows.set(z, []); rows.get(z).push(x); }
    const open = new Map(); // "x0,x1" -> rect
    const zs = [...rows.keys()].sort((p, q) => p - q);
    let prevZ = null;
    for (const z of zs) {
      const xs = rows.get(z).sort((p, q) => p - q); const runs = [];
      for (let i = 0; i < xs.length;) { let j = i; while (j + 1 < xs.length && xs[j + 1] === xs[j] + 1) j++; runs.push([xs[i], xs[j]]); i = j + 1; }
      const next = new Map();
      for (const [x0, x1] of runs) {
        const key = x0 + ',' + x1, r = open.get(key);
        if (r && prevZ === z - 1) { r[3] += CELL; next.set(key, r); open.delete(key); }
        else { const nr = [x0 * CELL, z * CELL, (x1 - x0 + 1) * CELL, CELL]; RECTS.push(nr); next.set(key, nr); }
      }
      open.clear(); for (const [k2, v] of next) open.set(k2, v);
      prevZ = z;
    }
  }

  // Precise collision data:
  //  block  - tiles that are solid by terrain (buildings, water, void)
  //  rects  - exact object footprints, bucketed per tile in grid
  //  stand  - for each walkable tile, a point inside it where the player fits (usually the centre)
  //  solid  - tiles with no room to stand at all (used by path finding)
  const PR = 0.2;
  function collision(map, block, walk, rects) {
    const grid = new Map();
    rects.forEach((r, i) => {
      for (let j = Math.floor(r[1] - 0.3); j <= Math.floor(r[1] + r[3] + 0.3); j++) for (let k = Math.floor(r[0] - 0.3); k <= Math.floor(r[0] + r[2] + 0.3); k++) {
        const key = k + ',' + j; if (!grid.has(key)) grid.set(key, []); grid.get(key).push(i);
      }
    });
    const fp = { block, walk, rects, grid, stand: new Map(), solid: new Set() };
    const tryPts = [[0.5, 0.5], [0.3, 0.5], [0.7, 0.5], [0.5, 0.3], [0.5, 0.7], [0.3, 0.3], [0.7, 0.3], [0.3, 0.7], [0.7, 0.7]];
    for (let z = 0; z < map.h; z++) for (let x = 0; x < map.w; x++) {
      const key = x + ',' + z;
      if (walk.has(key)) continue;
      if (block.has(key)) { fp.solid.add(key); continue; }
      const list = grid.get(key); if (!list) continue;
      let pt = null;
      for (const [ox, oz] of tryPts) { const px = x + ox, pz = z + oz; if (!list.some(i => circRect(px, pz, PR, rects[i]))) { pt = [px, pz]; break; } }
      if (!pt) fp.solid.add(key); else if (pt[0] !== x + 0.5 || pt[1] !== z + 0.5) fp.stand.set(key, pt);
    }
    return fp;
  }
  function circRect(x, z, r, q) { const cx = Math.max(q[0], Math.min(x, q[0] + q[2])), cz = Math.max(q[1], Math.min(z, q[1] + q[3])); return (x - cx) * (x - cx) + (z - cz) * (z - cz) < r * r; }


  // rebuild one dynamic object mesh
  function rebuild(d, ctx) { const mb = new MB(); d.k.build(mb, d.o, ctx); return mb; }
  // bounding box of a mesh builder's vertices
  function bbox(mb) {
    const a = mb.a; if (!a.length) return null;
    let x0 = 1e9, y0 = 1e9, z0 = 1e9, x1 = -1e9, y1 = -1e9, z1 = -1e9;
    for (let i = 0; i < a.length; i += 12) { const x = a[i], y = a[i + 1], z = a[i + 2]; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; if (z < z0) z0 = z; if (z > z1) z1 = z; }
    return [x0, y0, z0, x1, y1, z1];
  }

  window.BUILD = { K, buildMap, rebuild, bbox, rectFoot, tileOf, circRect };
})();
