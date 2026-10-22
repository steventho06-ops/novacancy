// One city, one map: Downtown (north) runs straight into Lowtown (south) along Grand Ave / Sunset Blvd.
// Lowtown keeps its old coordinates (z 0..77); Downtown sits at z -60..-1, so the map starts at row -60.
// No loading between districts; buildings are still entered through their doors.
(function () {
  const { R } = KIT;
  const C = CITY, P = C.P || KIT.P;
  const DZ = -60, Z0 = -60, LTH = 78;  // Downtown's old z + DZ = city z
  const SO = window.SOUTH, Z1 = SO ? SO.Z1 : LTH;  // Bel Vista, Palm Shore and the airport south of Lowtown
  const W = 64, H = Z1 - Z0;
  const lowtown = MAPS.city, downtown = MAPS.downtown;
  delete MAPS.downtown;                // old saves and old links are converted in loadMap
  const WORLD = window.WORLD = { DZ, Z0, Z1, W, H, lowtown, downtown };

  const shift = o => { const c = Object.assign({}, o); for (const k of ['z', 'z0', 'z1', 'tz']) if (typeof c[k] === 'number' && !(k === 'tz' && o.to !== 'city')) c[k] += DZ; return c; };
  // where the old Lowtown/Downtown edges used to be: no more edge exits, no more traffic lights there (new ones below)
  const EDGE = new Set(['toDowntown', 'toDowntown2', 'toLowtown', 'toLowtown2']);

  MAPS.city = () => {
    const lt = lowtown(), dt = downtown();
    const t = new Array(W * H).fill('walk');
    const m = {
      w: W, h: H, z0: Z0, t, id: 'city', outdoor: true,
      tile: (x, z) => (x < 0 || z < Z0 || x >= W || z >= Z0 + H ? null : t[(z - Z0) * W + x]),
      set: (x, z, v) => { if (x >= 0 && z >= Z0 && x < W && z < Z0 + H) t[(z - Z0) * W + x] = v; },
      rect: (x, z, rw, rh, v) => { for (let j = z; j < z + rh; j++) for (let i = x; i < x + rw; i++) m.set(i, j, v); },
    };
    for (let z = 0; z < LTH; z++) for (let x = 0; x < W; x++) m.set(x, z, x < lt.w ? lt.tile(x, z) : z < 44 ? 'walk' : 'water');
    for (let z = 0; z < dt.h; z++) for (let x = 0; x < W; x++) m.set(x, z + DZ, dt.tile(x, z));
    if (SO) for (let z = LTH; z < Z1; z++) for (let x = 0; x < W; x++) m.set(x, z, SO.tile(x, z));
    m.buildings = [...lt.buildings, ...dt.buildings.map(shift)];
    // the casino gets its real Vegas front; more buildings on the docks, the gravel lot and downtown
    const apts = m.buildings.find(b => b.id === 'dtapts'); if (apts) apts.floors = 3; // keep the casino's front in view
    const cas = m.buildings.find(b => b.id === 'casino'); if (cas) { cas.custom = 'casino'; cas.door = 40.5; delete cas.shop; delete cas.sign; }
    m.buildings.push(
      { id: 'coldstore', custom: 'shed', x: 56, z: 2, w: 7, d: 8, label: 'COLD STORAGE', wall: '#5a7a8a', doors: 2 },
      { id: 'fishmkt', custom: 'market', x: 56, z: 13, w: 7, d: 6, wall: '#7a8a96', wear: 0.6 },
      { id: 'harbormaster', x: 57, z: 23, w: 6, d: 5, floors: 2, face: 's', wall: '#e8e2d8', mat: 11, wear: 0.4, shop: { text: 'HARBORMASTER', col: '#3ff0ff', fascia: '#2f4a6a', glass: '#bfe8ff' } },
      { id: 'bait', x: 57, z: 30, w: 5, d: 3, floors: 1, face: 's', wall: '#4a6a5a', mat: 5, wear: 0.7, shop: { text: 'BAIT', col: '#59ff8a', awning: '#3a8a5a' } },
      { id: 'autobody', custom: 'shed', x: 38, z: 71, w: 8, d: 6, label: 'AUTO BODY', wall: '#8a5a4a', doors: 2, wear: 0.75, signBg: '#18181e', signCol: '#ff7a3a', signEmit: 1.4 },
      { id: 'harborview', tower: true, x: 58, z: DZ + 2, w: 5, d: 9, floors: 18, crown: 'flat', glass: '#24324a', lit: 0.4 },
    );
    if (SO) m.buildings.push(...SO.buildings.map(b => Object.assign({}, b)));
    for (const b of m.buildings) for (let j = b.z; j < b.z + b.d; j++) for (let i = b.x; i < b.x + b.w; i++) m.set(i, j, 'bldg');
    m.exits = [...lt.exits.filter(e => !EDGE.has(e.id)), ...dt.exits.filter(e => !EDGE.has(e.id)).map(e => { const c = Object.assign({}, e); c.z += DZ; return c; }), ...(SO ? SO.exits.map(e => Object.assign({}, e)) : [])];
    const O = m.objects = [];
    for (const o of lt.objects) if (o.k !== 'traffic') O.push(o);
    for (const o of dt.objects) if (o.k !== 'traffic' && !(o.z < 0)) O.push(shift(o));
    if (SO) for (const o of SO.objects) O.push(Object.assign({}, o));
    // where the two districts meet: Downtown's south plaza runs into the metro plaza and the docks
    O.push({ k: 'lamp', x: 52, z: -0.6, rot: 0 }, { k: 'bench', x: 54, z: -0.8, rot: Math.PI }, { k: 'planter', x: 57, z: -0.8 }, { k: 'planter', x: 61, z: -0.8, kind: 'palm' });
    O.push({ k: 'foodtruck', id: 'foodtruck', x: 53.4, z: 20, rot: 0, label: 'TACOS', col: '#e8e2d8', col2: '#c8443c' });
    // two signalled junctions: Sunset x Harbor and Grand x Main
    m.junctions = [{ x0: 24, x1: 34, z0: 44, z1: 54 }, { x0: 24, x1: 34, z0: DZ + 24, z1: DZ + 30 }];
    if (SO) m.junctions.push(SO.junction);
    for (const [i, zc] of [[0, 46], [1, DZ + 24]]) {
      O.push({ k: 'traffic', id: 'sig' + i + 'a', axis: 'z', x: 25.3, z: zc - 0.7, rot: Math.PI / 2 });
      O.push({ k: 'traffic', id: 'sig' + i + 'b', axis: 'z', x: 32.7, z: zc + 6.7, rot: -Math.PI / 2 });
      O.push({ k: 'traffic', id: 'sig' + i + 'c', axis: 'x', x: 32.7, z: zc - 0.7, rot: 0 });
      O.push({ k: 'traffic', id: 'sig' + i + 'd', axis: 'x', x: 25.3, z: zc + 6.7, rot: Math.PI });
    }
    m.dress = true;
    m.crosswalks = [...lt.crosswalks, ...dt.crosswalks.map(shift), ...(SO ? SO.crosswalks : [])];
    m.lanes = [
      { axis: 'z', x: 27.25, dir: 1, from: Z0 - 30, to: Z1 + 30 }, { axis: 'z', x: 30.75, dir: -1, from: Z1 + 30, to: Z0 - 30 },
      { axis: 'x', z: 47.25, dir: -1, from: 48, to: -30 }, { axis: 'x', z: 50.75, dir: 1, from: -30, to: 46 },
      { axis: 'x', z: DZ + 25.25, dir: -1, from: W + 30, to: -30 }, { axis: 'x', z: DZ + 28.75, dir: 1, from: -30, to: W + 30 },
    ];
    if (SO) m.lanes.push(...SO.lanes);
    m.cars = SO ? 24 : 16; m.peds = SO ? 22 : 20;
    const WALKS_LT = [[25.2, 2], [25.2, 76], [32.8, 2], [32.8, 76], [2, 45], [48, 45], [2, 52.8], [48, 52.8], [16, 4], [40, 44.6], [8, 53], [36, 53]];
    const BEATS_LT = [[[25.2, 30], [25.2, 60], [12, 53], [25.2, 60]], [[32.8, 10], [32.8, 44], [45, 44.8], [32.8, 44]], [[8, 45.2], [24.6, 45.2], [24.6, 30], [24.6, 45.2]], [[3.2, 6], [22, 6], [24.6, 20], [22, 6]]];
    m.walks = [...WALKS_LT, ...dt.walks.map(([x, z]) => [x, z + DZ]), ...(SO ? SO.walks : [])];
    m.beats = [...BEATS_LT, ...dt.beats.map(b => b.map(([x, z]) => [x, z + DZ])), ...(SO ? SO.beats : [])];
    m.spawn = lt.spawn;
    dressStreets(m);
    m.paint = mb => {
      const yl = (x, z0, z1) => { C.stripe(mb, x - 0.07, z0, x - 0.07, z1, P.lane, 0.07); C.stripe(mb, x + 0.07, z0, x + 0.07, z1, P.lane, 0.07); };
      const yx = (z, x0, x1) => { C.stripe(mb, x0, z - 0.07, x1, z - 0.07, P.lane, 0.07); C.stripe(mb, x0, z + 0.07, x1, z + 0.07, P.lane, 0.07); };
      // Sunset Blvd / Grand Ave
      for (const [a, b] of SO ? [[Z0 - 40, DZ + 24], [DZ + 30, 46], [52, 100], [106, Z1 + 40]] : [[Z0 - 40, DZ + 24], [DZ + 30, 46], [52, LTH + 40]]) { yl(29, a, b); C.laneDash(mb, 27.5, a, 27.5, b, P.laneW, 0.08); C.laneDash(mb, 30.5, a, 30.5, b, P.laneW, 0.08); }
      // Harbor St and Main St
      yx(49, -40, 26); yx(49, 32, 50); C.laneDash(mb, -40, 47.5, 25, 47.5, P.laneW, 0.08); C.laneDash(mb, 33, 50.5, 50, 50.5, P.laneW, 0.08);
      const mz = DZ + 27;
      yx(mz, -40, 26); yx(mz, 32, W + 40);
      C.laneDash(mb, -40, mz - 1.5, 25, mz - 1.5, P.laneW, 0.08); C.laneDash(mb, -40, mz + 1.5, 25, mz + 1.5, P.laneW, 0.08);
      C.laneDash(mb, 33, mz - 1.5, W + 40, mz - 1.5, P.laneW, 0.08); C.laneDash(mb, 33, mz + 1.5, W + 40, mz + 1.5, P.laneW, 0.08);
      for (const c of m.crosswalks) { if (c.across === 'z') C.crosswalk(mb, c.x0, c.z0 + 0.3, c.x1 + 1, c.z1 + 0.7, true); else C.crosswalk(mb, c.x0 + 0.3, c.z0, c.x1 + 0.7, c.z1 + 1, false); }
      if (SO) SO.paint(mb);
      // stop lines, in front of the crosswalks
      for (const j of m.junctions.slice(0, 2)) {
        const zA = j.z0 === 44 ? 43.9 : j.z0 - 0.1, zB = j.z1 === 54 ? 54.1 : j.z1 + 0.1, rz0 = j.z0 === 44 ? 46 : j.z0, rz1 = j.z0 === 44 ? 52 : j.z1;
        C.stripe(mb, 26, zA, 29, zA, P.laneW, 0.18); C.stripe(mb, 29, zB, 32, zB, P.laneW, 0.18);
        C.stripe(mb, 34.1, rz0, 34.1, (rz0 + rz1) / 2, P.laneW, 0.18); C.stripe(mb, 23.9, (rz0 + rz1) / 2, 23.9, rz1, P.laneW, 0.18);
      }
    };
    m.outer = mb => {
      const c = '#26242c', flat = (x0, z0, x1, z1) => mb.quad([x0, -0.02, z1], [x1, -0.02, z1], [x1, -0.02, z0], [x0, -0.02, z0], c, { mat: KIT.W(KIT.MT.asphalt, 0.6), jit: 0 });
      if (SO) { flat(-40, Z0 - 40, W + 40, Z0); flat(-40, Z0, 0, Z1 + 40); flat(0, Z1, W, Z1 + 40); flat(W, Z0, W + 40, 44); }
      else { flat(-40, Z0 - 40, W + 40, Z0); flat(-40, Z0, 0, LTH + 40); flat(0, LTH, 51, LTH + 40); flat(W, Z0, W + 40, 44); }
      const road = (x0, z0, x1, z1) => mb.quad([x0, 0.005, z1], [x1, 0.005, z1], [x1, 0.005, z0], [x0, 0.005, z0], P.asphalt, { mat: KIT.W(KIT.MT.asphalt, 0.5), jit: 0 });
      road(26, Z0 - 40, 32, Z0); road(26, Z1, 32, Z1 + 40); if (SO) road(-40, 100, 0, 106); road(-40, 46, 0, 52); road(-40, DZ + 24, 0, DZ + 30); road(W, DZ + 24, W + 40, DZ + 30);
      const sea = (x0, z0, x1, z1) => mb.quad([x0, -0.9, z1], [x1, -0.9, z1], [x1, -0.9, z0], [x0, -0.9, z0], C.GROUND.water.c, { mat: KIT.W(KIT.MT.water, 0), jit: 0 });
      if (SO) sea(W, 44, W + 40, Z1 + 40); else { sea(W, 44, W + 40, LTH + 40); sea(51, LTH, W, LTH + 40); }
    };
    m.skyline = mb => {
      const old = (x, z, w, d, fl, seed, face) => C.building(mb, null, { x, z, w, d, floors: fl, seed, face: face || 's', lit: 0.45, wear: 0.6, roofProps: true, fire: R(seed, 1, 1) > 0.6 });
      // tall towers along the north edge and down the west side of Downtown, low blocks west of Lowtown
      let x = -10;
      while (x < W + 10) { const w = 6 + Math.floor(R(x, 3, 2) * 5); if (!(x + w > 24 && x < 34)) DT.tower(mb, { x, z: Z0 - 14, w, d: 10, floors: 14 + Math.floor(R(x, 4, 2) * 18), seed: x * 7 + 3, entrance: false }); x += w + 1; }
      x = -16;
      while (x < W + 16) { const w = 7 + Math.floor(R(x, 9, 2) * 6); if (!(x + w > 22 && x < 36)) DT.tower(mb, { x, z: Z0 - 30, w, d: 12, floors: 24 + Math.floor(R(x, 8, 2) * 20), seed: x * 5 + 11, entrance: false, lit: 0.4 }); x += w + 2; }
      let z = 0;
      while (z < LTH - 2) { const d = 5 + Math.floor(R(z, 5, 1) * 4); if (!(z + d > 44 && z < 52)) old(-9, z, 8, d, 4 + Math.floor(R(z, 6, 1) * 6), z * 5 + 7, 'e'); z += d + 0.2; }
      if (SO) SO.backdrop(mb);
      z = Z0 - 4;
      while (z < -1) { const d = 6 + Math.floor(R(z, 5, 2) * 4); if (!(z + d > DZ + 22 && z < DZ + 32)) DT.tower(mb, { x: -14, z, w: 10, d, floors: 10 + Math.floor(R(z, 6, 2) * 14), seed: z * 11 + 5, face: 'e', entrance: false }); z += d + 1; }
    };
    return m;
  };

  // street furniture along the sidewalks, by district, kept clear of doors, crossings, corners and other props
  function dressStreets(m) {
    const pts = [];
    for (const o of m.objects) if (o.x != null && o.z != null) pts.push([o.x, o.z, 1.7]);
    for (const e of m.exits) pts.push([e.x + (e.w || 1) / 2, e.z + (e.h || 1) / 2, 2.6]);
    for (const w of m.walks) pts.push([w[0], w[1], 1.2]);
    for (const b of m.beats) for (const w of b) pts.push([w[0], w[1], 1.2]);
    const clear = (x, z) => {
      for (const c of m.crosswalks) if (x > c.x0 - 1.5 && x < c.x1 + 2.5 && z > c.z0 - 1.5 && z < c.z1 + 2.5) return false;
      for (const j of m.junctions) if (x > j.x0 - 2 && x < j.x1 + 2 && z > j.z0 - 2 && z < j.z1 + 2) return false;
      for (const [px, pz, r] of pts) if (Math.abs(px - x) < r && Math.abs(pz - z) < r) return false;
      const t = m.tile(Math.floor(x), Math.floor(z)); return t === 'walk' || t === 'plaza';
    };
    const add = (o) => { if (!clear(o.x, o.z)) return; m.objects.push(o); pts.push([o.x, o.z, 1.7]); };
    const kit = { downtown: ['planterbox', 'newsbox', 'trashcan', 'bikes', 'tree'], lowtown: ['trashcan', 'newsbox', 'trashbags', 'hydrant'], belvista: ['palm', 'planterbox', 'trashcan'], palmshore: ['palm', 'trashcan'], airport: [] };
    let n = 0;
    for (const [x, side] of [[24.4, 1], [33.6, -1]]) for (let z = Z0 + 2; z < Z1 - 2; z += 3.3) {
      const d = WORLD.district(z, x), opts = kit[d]; if (!opts || !opts.length) continue;
      const k = opts[(n++ + Math.floor(z)) % opts.length];
      const o = { k, x, z, rot: side > 0 ? Math.PI / 2 : -Math.PI / 2 };
      if (k === 'planterbox') Object.assign(o, { w: 0.8, d: 1.6 });
      if (k === 'newsbox') o.col = ['#c8443c', '#2f6a9a', '#e8c13c'][n % 3];
      if (k === 'bikes') { o.x = x + (side > 0 ? 0 : -1.4); }
      add(o);
    }
    // cross-street sidewalks: Harbor St, Main St, Ocean Ave
    for (const [z, x0, x1] of [[45.4, 1, 24], [45.4, 34, 49], [52.6, 1, 24], [DZ + 22.4, 1, 24], [DZ + 22.4, 34, 63], [DZ + 31.6, 1, 24], [DZ + 31.6, 34, 63], [98.4, 1, 24], [107.6, 1, 24]]) for (let x = x0 + 1.5; x < x1 - 1; x += 3.6) {
      const d = WORLD.district(z, x), opts = kit[d]; if (!opts || !opts.length) continue;
      const k = opts[(n++ + Math.floor(x)) % opts.length];
      const o = { k, x, z, rot: 0 }; if (k === 'planterbox') Object.assign(o, { w: 1.6, d: 0.8 }); if (k === 'bikes') continue;
      add(o);
    }
  }

  // interiors that used to open onto the separate Downtown map now open onto the city
  for (const k of Object.keys(MAPS)) {
    if (k === 'city') continue;
    const f = MAPS[k];
    MAPS[k] = function () { const m = f.apply(this, arguments); for (const e of m.exits || []) if (e.to === 'downtown') e.to = 'city'; return m; };
  }
  // Downtown's people stand where they always did, now inside the one city
  const npcs0 = STORY.npcs;
  STORY.npcs = id => id === 'city' ? npcs0('city').concat(npcs0('downtown').map(n => Object.assign(n, { z: n.z + DZ }))) : id === 'downtown' ? [] : npcs0(id);
  // buses, cabs and the Red Line: same map, so just move you (no reload)
  const DIRYAW = { up: Math.PI, down: 0, left: -Math.PI / 2, right: Math.PI / 2 };
  const loadMap0 = G.loadMap;
  G.loadMap = function (id, x, z, dir) {
    if (id === 'downtown') { id = 'city'; if (z != null) z += DZ; }
    if (id === G.mapId && G.map && G.map.outdoor && x != null) {
      const p = G.player; p.x = x; p.z = z; p.path = null; p.speed = 0; p.interact = null;
      if (dir && DIRYAW[dir] != null) p.yaw = DIRYAW[dir];
      if (!G.walkableTile(Math.floor(p.x), Math.floor(p.z))) { const n = G.nearestWalkable(p.x, p.z); if (n) { p.x = n[0]; p.z = n[1]; } }
      p.y = G.groundY(p.x, p.z); G.camSnap = true; G.save();
      return;
    }
    return loadMap0.call(this, id, x, z, dir);
  };
  STORY.H.foodtruck = { name: 'Taco Truck', verbs: () => [{ label: 'Buy tacos ($6)', fn: async () => {
    if (G.S.money < 6) return UI.say('player', 'Six bucks. I have less than six bucks.');
    G.S.money -= 6; UI.refreshHud(); SFX.play('cash');
    await UI.say(null, ['Three al pastor, extra lime. The cook winks.', 'Carne asada, onions, cilantro. The salsa verde is a dare.', 'Fish tacos, still sizzling. The gulls watch you eat.'][Math.floor(Math.random() * 3)]);
    if (SIM.give) { SIM.give('hotdog', 1); await UI.itemGet('hotdog', 1); }
  } }] };
  WORLD.district = (z, x = 0) => z < 0 ? 'downtown' : z < LTH ? 'lowtown' : z < 140 ? (x < 34 ? 'belvista' : 'palmshore') : 'airport';
  const DNAME = { downtown: ['Downtown', 'Grand Ave'], lowtown: ['Lowtown', 'Sunset Blvd'], belvista: ['Bel Vista', 'Ocean Ave'], palmshore: ['Palm Shore', 'The Boardwalk'], airport: ['Harbor International', 'Terminal Drive'] };
  WORLD.districtName = d => DNAME[d][0];

  // =====================================================================
  // signals and district changes
  // =====================================================================
  let lastSig = '', lastDist = null;
  const update0 = SIM.update;
  SIM.update = function (dt) {
    update0(dt);
    if (G.mapId !== 'city' || !G.scene) { lastSig = ''; return; }
    const s = SIM.signal('z') + SIM.signal('x');
    if (s !== lastSig) { lastSig = s; for (const id in G.scene.byId) if (/^sig\d/.test(id)) G.refresh(id); }
    const d = WORLD.district(G.player.z, G.player.x);
    if (lastDist && d !== lastDist && !G.camOverride) { UI.banner(DNAME[d][0], DNAME[d][1]); if (SFX.pickMusic) SFX.pickMusic(); }
    lastDist = d;
  };

  // =====================================================================
  // the phone map: the whole city, drag to pan, pinch or +/- to zoom
  // =====================================================================
  const TS = 8;                         // pixels per tile in the pre-drawn map
  const TILE = { sand: '#d9c59a', tarmac: '#3a3a42', road: '#2c2a36', walk: '#57536a', lot: '#3b3848', grass: '#2f5a34', plaza: '#625d74', dirt: '#5a4632', gravel: '#4a453c', water: '#1d4f7c', pier: '#6a4e34', pooldeck: '#7a7a8c', bldg: '#57536a', void: '#1d4f7c' };
  const PLACE = {
    metroIn: ['Metro', 't'], pawnIn: ['Lucky Pawn', 's'], martIn: ['24/7 Mart', 's'], dinerIn: ["Dina's Diner", 'f'], precinctIn: ['Police', 'g'],
    laundryIn: ['Laundromat', 's'], barIn: ['Blue Note', 'f'], warehouseIn: ['Warehouse 9', 'x'], trailerIn: ['Site Office', 'x'],
    auroraIn: ['Aurora Tower', 'h'], bankIn: ['Bank', 'm'], casinoIn: ['Lucky 7 Casino', 'm'], cafeIn: ['Daily Grind', 'f'], boutiqueIn: ['Silk & Steel', 's'],
    collegeIn: ['College', 'g'], vancegrandIn: ['Vance Grand', 'x'], cityhallIn: ['City Hall', 'g'],
    terminalIn: ['Airport', 't'], belvistaIn: ['The Bel Vista', 'f'],
  };
  const PCOL = { h: '#3ff0ff', s: '#ff4fa3', f: '#ffb43a', m: '#59ff8a', g: '#b48cff', t: '#e8e6ff', x: '#ff6a5a' };
  const INSIDE = { office: 'officedoor', lobby: 'officedoor', room: 'officedoor', pawn: 'pawnIn', mart: 'martIn', diner: 'dinerIn', metro: 'metroIn', precinct: 'precinctIn', laundry: 'laundryIn', bar: 'barIn', warehouse: 'warehouseIn', trailer: 'trailerIn', aurora: 'auroraIn', penthouse: 'auroraIn', bank: 'bankIn', casino: 'casinoIn', cafe: 'cafeIn', boutique: 'boutiqueIn', college: 'collegeIn', vancegrand: 'vancegrandIn', cityhall: 'cityhallIn', terminal: 'terminalIn', belvista: 'belvistaIn' };
  let base = null, baseTier = -1, cityCache = null;
  const city = () => cityCache || (cityCache = MAPS.city());
  function drawBase() {
    const m = city(), c = document.createElement('canvas'); c.width = W * TS; c.height = H * TS;
    const x = c.getContext('2d');
    x.translate(0, -Z0 * TS);              // draw in world coordinates (z can be negative)
    for (let j = Z0; j < Z0 + H; j++) for (let i = 0; i < W; i++) {
      const t = m.tile(i, j); let col = TILE[t] || '#3b3848';
      x.fillStyle = col; x.fillRect(i * TS, j * TS, TS, TS);
      if (t === 'walk' || t === 'plaza') { x.fillStyle = 'rgba(0,0,0,0.12)'; x.fillRect(i * TS, j * TS, TS, 1); x.fillRect(i * TS, j * TS, 1, TS); }
      if (t === 'water' && (i * 7 + j * 3) % 5 === 0) { x.fillStyle = '#2f6aa0'; x.fillRect(i * TS + 2, j * TS + 3, 4, 1); }
      if (t === 'grass' && (i * 5 + j * 11) % 7 === 0) { x.fillStyle = '#3a6a3e'; x.fillRect(i * TS + 3, j * TS + 2, 2, 2); }
    }
    // road markings
    x.fillStyle = '#d8c25a';
    const SEG = SO ? [[Z0, DZ + 24], [DZ + 30, 46], [52, 100], [106, Z1]] : [[Z0, DZ + 24], [DZ + 30, 46], [52, LTH]];
    for (const [a, b] of SEG) x.fillRect(29 * TS - 1, a * TS, 2, (b - a) * TS);
    if (SO) { x.fillRect(0, 103 * TS - 1, 26 * TS, 2); x.fillRect(32 * TS, 103 * TS - 1, 6 * TS, 2); x.fillStyle = 'rgba(240,240,235,0.8)'; x.fillRect(50 * TS, 144 * TS, 1, 53 * TS); x.fillRect(57 * TS, 144 * TS, 1, 53 * TS); for (let z = 147; z < 194; z += 4) x.fillRect(53.5 * TS - 1, z * TS, 2, 2.4 * TS); x.fillStyle = '#d8c25a'; }
    x.fillRect(0, 49 * TS - 1, 26 * TS, 2); x.fillRect(32 * TS, 49 * TS - 1, 18 * TS, 2);
    x.fillRect(0, (DZ + 27) * TS - 1, 26 * TS, 2); x.fillRect(32 * TS, (DZ + 27) * TS - 1, (W - 32) * TS, 2);
    x.fillStyle = 'rgba(230,230,220,0.5)';
    for (const [a, b] of SEG) for (let z = a; z < b; z += 1.5) { x.fillRect(27.5 * TS, z * TS, 1, 6); x.fillRect(30.5 * TS, z * TS, 1, 6); }
    x.fillStyle = 'rgba(240,240,235,0.85)';
    for (const cw of m.crosswalks) for (let k = 0; k < 6; k++) {
      if (cw.across === 'z') x.fillRect((cw.x0 + k) * TS + 1, cw.z0 * TS + 3, TS - 3, (cw.z1 - cw.z0 + 1) * TS - 6);
      else x.fillRect(cw.x0 * TS + 3, (cw.z0 + k) * TS + 1, (cw.x1 - cw.x0 + 1) * TS - 6, TS - 3);
    }
    // buildings: drop shadow, roof, edge
    const blocks = m.buildings.map(b => [b.x, b.z, b.w, b.d, b.tower ? '#4a6688' : '#7a6a8e', b.tower]);
    const tier = G.S ? G.S.tier : 1;
    blocks.push([MOTEL.WING.x, MOTEL.WING.z, MOTEL.WING.w, MOTEL.WING.d, tier >= 4 ? '#c8a050' : '#3fa8b8'], [MOTEL.OFFICE.x, MOTEL.OFFICE.z, MOTEL.OFFICE.w, MOTEL.OFFICE.d, tier >= 4 ? '#c8a050' : '#3fa8b8']);
    blocks.push([40, 10, 9, 8, '#8a7a6a']);  // the Vance site tower
    for (const [bx, bz, bw, bd, col, tower] of blocks) {
      x.fillStyle = 'rgba(0,0,0,0.45)'; x.fillRect(bx * TS + 3, bz * TS + 3, bw * TS, bd * TS);
      x.fillStyle = col; x.fillRect(bx * TS, bz * TS, bw * TS, bd * TS);
      x.fillStyle = 'rgba(255,255,255,0.18)'; x.fillRect(bx * TS, bz * TS, bw * TS, 2); x.fillRect(bx * TS, bz * TS, 2, bd * TS);
      x.fillStyle = 'rgba(0,0,0,0.25)'; x.fillRect(bx * TS, (bz + bd) * TS - 2, bw * TS, 2); x.fillRect((bx + bw) * TS - 2, bz * TS, 2, bd * TS);
      if (tower) { x.fillStyle = 'rgba(160,210,255,0.35)'; for (let k = 2; k < bw * TS - 2; k += 5) x.fillRect(bx * TS + k, bz * TS + 4, 2, bd * TS - 8); }
    }
    // pool, trees, fountains
    x.fillStyle = '#3fc8e8'; x.fillRect(POOLX * TS, POOLZ * TS, 7 * TS, 6 * TS);
    for (const o of m.objects) {
      if (o.k === 'tree' || (o.k === 'planter' && o.kind === 'palm')) { x.fillStyle = '#244a28'; x.beginPath(); x.arc(o.x * TS, o.z * TS, 5, 0, 7); x.fill(); x.fillStyle = '#3f7a44'; x.beginPath(); x.arc(o.x * TS - 1, o.z * TS - 1, 3.5, 0, 7); x.fill(); }
      if (o.k === 'dtfountain') { x.fillStyle = '#c8c4d0'; x.beginPath(); x.arc(o.x * TS, o.z * TS, (o.r || 2) * TS, 0, 7); x.fill(); x.fillStyle = '#3fa8d8'; x.beginPath(); x.arc(o.x * TS, o.z * TS, (o.r || 2) * TS - 4, 0, 7); x.fill(); }
    }
    base = c; baseTier = tier;
  }
  const POOLX = 5, POOLZ = 20;
  function places() {
    const m = city(), out = [];
    for (const e of m.exits) if (PLACE[e.id]) out.push({ name: PLACE[e.id][0], cat: PLACE[e.id][1], x: e.x + (e.w || 1) / 2, z: e.z + (e.h || 1) / 2 });
    out.push({ name: 'Starlite Motel', cat: 'h', x: 13, z: 12.5, big: true });
    for (const o of m.objects) {
      if (o.id === 'busstop' || o.id === 'busstopdt') out.push({ name: 'Bus', cat: 't', x: o.x, z: o.z, small: true });
      if (o.id === 'taxilt' || o.id === 'taxidt') out.push({ name: 'Taxi', cat: 't', x: o.x, z: o.z, small: true });
      if (o.id === 'metrodt') out.push({ name: 'Grand Station', cat: 't', x: o.x, z: o.z });
      if (o.id === 'chess') out.push({ name: 'Chess', cat: 'g', x: o.x, z: o.z, small: true });
      if (o.id === 'hotdog') out.push({ name: 'Hot dogs', cat: 'f', x: o.x, z: o.z, small: true });
    }
    return out;
  }
  const AREAS = [['LOWTOWN', 30, 26, 1], ['DOWNTOWN', 40, DZ + 20, 1], ['BEL VISTA', 12, 104, 1], ['PALM SHORE', 46, 100, 1], ['AIRPORT', 46, 168, 1], ['Regent Row', 12, 117.5, 0], ['Pier', 60, 110, 0], ['Runway', 53.5, 185, 0], ['Central Park', 12, DZ + 40, 0], ['Docks', 54, 62, 0], ['Vance site', 44, 24, 0], ['Harbor', 58, 66, 0]];
  const STREETS = [['SUNSET BLVD', 29, 22, true], ['SUNSET BLVD', 29, 64, true], ['GRAND AVE', 29, DZ + 12, true], ['GRAND AVE', 29, DZ + 44, true], ['HARBOR ST', 12, 49, false], ['MAIN ST', 14, DZ + 27, false], ['MAIN ST', 48, DZ + 27, false], ['OCEAN AVE', 12, 103, false], ['BEL VISTA DR', 29, 122, true], ['TERMINAL DR', 29, 170, true]];
  const V = UI.mapView = UI.mapView || { zoom: 5.5, cx: null, cz: null };
  function playerSpot() {
    if (G.mapId === 'city') return { x: G.player.x, z: G.player.z, yaw: G.player.yaw, inside: null };
    const ex = INSIDE[G.mapId]; if (!ex) return null;
    let pt;
    if (ex === 'officedoor') { const d = MOTEL.frontDoor(G.S.tier); pt = [d.x, d.z]; } else { const e = city().exits.find(e => e.id === ex); if (!e) return null; pt = [e.x + (e.w || 1) / 2, e.z + (e.h || 1) / 2]; }
    return { x: pt[0], z: pt[1], yaw: null, inside: (UI.placeName ? UI.placeName(G.mapId) : G.mapId) };
  }
  function targets() {
    const out = [];
    for (const h of STORY.hints()) {
      const where = G.whereIs(h); if (!where) continue;
      if (where === 'city') { const m = city(); const o = m.objects.find(o => o.id === h) || m.exits.find(e => e.id === h); if (o && o.x != null) { out.push([o.x + (o.w && o.k === undefined ? o.w / 2 : 0), o.z]); continue; } const n = STORY.npcs('city').find(n => n.id === h); if (n) out.push([n.x, n.z]); continue; }
      const ex = INSIDE[where]; if (!ex) continue;
      if (ex === 'officedoor') { const d = MOTEL.frontDoor(G.S.tier); out.push([d.x, d.z]); } else { const e = city().exits.find(e => e.id === ex); if (e) out.push([e.x + (e.w || 1) / 2, e.z + (e.h || 1) / 2]); }
    }
    return out;
  }
  UI.TITLES.map = 'Map';
  UI.APPS.map = function (el) {
    if (!base || baseTier !== G.S.tier) drawBase();
    el.innerHTML = `<div class="mapview"><canvas id="mmv" aria-label="City map"></canvas>
      <div class="mapbtns"><button type="button" data-mz="1.4" aria-label="Zoom in">+</button><button type="button" data-mz="0.7" aria-label="Zoom out">−</button><button type="button" data-mz="me">Me</button><button type="button" data-mz="all">City</button></div>
      <div class="mapwhere" id="mmWhere"></div></div>
      <div class="legend maplegend"><span><i style="background:#ff4fa3"></i>You</span><span><i style="background:#ffd84a"></i>Objective</span><span><i style="background:#ffb43a"></i>Gig</span><span><i style="background:#3ff0ff"></i>Home</span><span><i style="background:#59ff8a"></i>Money</span><span><i style="background:#e8e6ff"></i>Transit</span>${SIM.count('scanner') ? '<span><i style="background:#4f7bff"></i>Cops</span>' : ''}</div>`;
    const cv = el.querySelector('#mmv'), ctx = cv.getContext('2d'), where = el.querySelector('#mmWhere');
    const P0 = places(), me0 = playerSpot();
    if (V.cx == null || V.follow !== false) { V.cx = me0 ? me0.x : 29; V.cz = me0 ? me0.z : 40; }
    let dpr = Math.min(2, window.devicePixelRatio || 1), Wc = 0, Hc = 0;
    const fit = () => { const r = cv.getBoundingClientRect(); Wc = r.width; Hc = r.height; cv.width = Math.round(Wc * dpr); cv.height = Math.round(Hc * dpr); };
    fit();
    const clampV = () => { V.zoom = Math.max(0.7, Math.min(18, V.zoom)); V.cx = Math.max(-4, Math.min(W + 4, V.cx)); V.cz = Math.max(Z0 - 4, Math.min(Z0 + H + 4, V.cz)); };
    const sx = wx => (wx - V.cx) * V.zoom + Wc / 2, sy = wz => (wz - V.cz) * V.zoom + Hc / 2;
    const font = px => `${px}px Lowtown, ui-monospace, monospace`;
    const label = (t, x, y, col, px, bg) => { ctx.font = font(px); const w = ctx.measureText(t).width; if (bg) { ctx.fillStyle = 'rgba(10,8,18,0.78)'; ctx.fillRect(x - w / 2 - 3, y - px + 1, w + 6, px + 3); } ctx.fillStyle = col; ctx.fillText(t, x - w / 2, y); };
    let raf = 0;
    const frame = () => {
      if (!cv.isConnected) { cancelAnimationFrame(raf); return; }
      const r = cv.getBoundingClientRect(); if (Math.abs(r.width - Wc) > 1 || Math.abs(r.height - Hc) > 1) fit();
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.fillStyle = '#16141f'; ctx.fillRect(0, 0, Wc, Hc);
      // sea beyond the docks
      ctx.fillStyle = '#183f66'; ctx.fillRect(sx(W), sy(44), Wc, Hc); if (!SO) ctx.fillRect(sx(51), sy(LTH), Wc, Hc);
      ctx.imageSmoothingEnabled = V.zoom < TS * 0.75;
      ctx.drawImage(base, sx(0), sy(Z0), W * V.zoom, H * V.zoom);
      ctx.imageSmoothingEnabled = false;
      const z = V.zoom;
      // areas and streets
      for (const [t, ax, az, big] of AREAS) if (big ? z < 9 : z >= 4) label(t, sx(ax), sy(az), big ? 'rgba(255,255,255,0.32)' : 'rgba(220,230,255,0.55)', big ? Math.round(14 + z * 1.4) : 12);
      if (z >= 4.5) for (const [t, ax, az, vert] of STREETS) { ctx.save(); ctx.translate(sx(ax), sy(az)); if (vert) ctx.rotate(-Math.PI / 2); ctx.font = font(11); const w = ctx.measureText(t).width; ctx.fillStyle = 'rgba(232,226,200,0.75)'; ctx.fillText(t, -w / 2, 4); ctx.restore(); }
      // traffic
      if (G.mapId === 'city') for (const c of G.cars) { const q = SIM.carRect(c); if (q[0] < 0 || q[1] < Z0 || q[0] > W - 2 || q[1] > Z1 - 2) continue; ctx.fillStyle = c.kind === 'police' ? '#4f7bff' : c.kind === 'taxi' ? '#e8c13c' : '#c8c4d8'; ctx.fillRect(sx(q[0]), sy(q[1]), Math.max(2, q[2] * z), Math.max(2, q[3] * z)); }
      if (G.mapId === 'city' && SIM.count('scanner')) for (const a of G.agents) if (a.kind === 'cop') { ctx.fillStyle = '#4f7bff'; ctx.beginPath(); ctx.arc(sx(a.x), sy(a.z), 3.5, 0, 7); ctx.fill(); }
      // places
      for (const p of P0) {
        if (p.small && z < 7) continue;
        const X = sx(p.x), Y = sy(p.z); if (X < -60 || Y < -20 || X > Wc + 60 || Y > Hc + 20) continue;
        ctx.fillStyle = '#0c0a14'; ctx.beginPath(); ctx.arc(X, Y, p.big ? 6 : 4.5, 0, 7); ctx.fill();
        ctx.fillStyle = PCOL[p.cat]; ctx.beginPath(); ctx.arc(X, Y, p.big ? 4.5 : 3, 0, 7); ctx.fill();
        if (z >= (p.big ? 3 : 5.2)) label(p.name, X, Y - 8, PCOL[p.cat], p.big ? 13 : 11, true);
      }
      const pulse = 0.5 + 0.5 * Math.sin(performance.now() / 220);
      // gig
      const g = G.S.gig; if (g && EXTRAS.gigPoint) { const [gx, gz] = EXTRAS.gigPoint(g.stage === 'pickup' ? g.from : g.to); ctx.strokeStyle = '#ffb43a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(sx(gx), sy(gz), 6 + pulse * 4, 0, 7); ctx.stroke(); ctx.fillStyle = '#ffb43a'; ctx.beginPath(); ctx.arc(sx(gx), sy(gz), 3.5, 0, 7); ctx.fill(); }
      // objective
      for (const [tx, tz] of targets()) { const X = sx(tx), Y = sy(tz); ctx.fillStyle = '#ffd84a'; ctx.beginPath(); ctx.moveTo(X, Y - 7 - pulse * 2); ctx.lineTo(X + 5, Y - 1); ctx.lineTo(X, Y + 5); ctx.lineTo(X - 5, Y - 1); ctx.closePath(); ctx.fill(); }
      // you
      const me = playerSpot();
      if (me) {
        const X = sx(me.x), Y = sy(me.z);
        ctx.fillStyle = 'rgba(255,79,163,0.25)'; ctx.beginPath(); ctx.arc(X, Y, 9 + pulse * 3, 0, 7); ctx.fill();
        ctx.save(); ctx.translate(X, Y);
        if (me.yaw != null) { ctx.rotate(Math.atan2(Math.sin(me.yaw), Math.cos(me.yaw)) * -1 + Math.PI); }
        ctx.fillStyle = '#ff4fa3'; ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5; ctx.beginPath();
        if (me.yaw != null) { ctx.moveTo(0, -8); ctx.lineTo(6, 6); ctx.lineTo(0, 3); ctx.lineTo(-6, 6); } else ctx.arc(0, 0, 5, 0, 7);
        ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore();
        const d = WORLD.districtName(WORLD.district(me.z, me.x));
        const txt = me.inside ? `Inside ${me.inside} · ${d}` : d;
        if (where.textContent !== txt) where.textContent = txt;
        if (V.follow) { V.cx += (me.x - V.cx) * 0.15; V.cz += (me.z - V.cz) * 0.15; }
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    // drag to pan, pinch/wheel to zoom
    const ptrs = new Map(); let pinch0 = null;
    cv.addEventListener('pointerdown', e => { cv.setPointerCapture(e.pointerId); ptrs.set(e.pointerId, [e.clientX, e.clientY]); V.follow = false; if (ptrs.size === 2) { const [a, b] = [...ptrs.values()]; pinch0 = { d: Math.hypot(a[0] - b[0], a[1] - b[1]), z: V.zoom }; } e.preventDefault(); e.stopPropagation(); });
    cv.addEventListener('pointermove', e => {
      if (!ptrs.has(e.pointerId)) return;
      const prev = ptrs.get(e.pointerId); ptrs.set(e.pointerId, [e.clientX, e.clientY]);
      if (ptrs.size === 2 && pinch0) { const [a, b] = [...ptrs.values()]; V.zoom = pinch0.z * Math.hypot(a[0] - b[0], a[1] - b[1]) / Math.max(10, pinch0.d); }
      else { V.cx -= (e.clientX - prev[0]) / V.zoom; V.cz -= (e.clientY - prev[1]) / V.zoom; }
      clampV(); e.preventDefault(); e.stopPropagation();
    });
    const up = e => { ptrs.delete(e.pointerId); if (ptrs.size < 2) pinch0 = null; };
    cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
    cv.addEventListener('wheel', e => { V.zoom *= e.deltaY < 0 ? 1.15 : 0.87; clampV(); e.preventDefault(); e.stopPropagation(); }, { passive: false });
    el.querySelectorAll('[data-mz]').forEach(b => b.addEventListener('click', e => {
      e.stopPropagation(); const v = b.dataset.mz;
      if (v === 'me') { const m2 = playerSpot(); if (m2) { V.cx = m2.x; V.cz = m2.z; } V.follow = true; V.zoom = Math.max(V.zoom, 5.5); }
      else if (v === 'all') { V.follow = false; V.zoom = Math.min(Wc / (W + 4), Hc / (H + 4)); V.cx = W / 2; V.cz = Z0 + H / 2; }
      else V.zoom *= +v;
      clampV();
    }));
    if (V.follow == null) V.follow = true;
  };
})();
