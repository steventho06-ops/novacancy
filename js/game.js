// Core: state, map loading, movement, camera, interaction, day/night, weather, render loop, input.
(function () {
  const { M4 } = GL3;
  const { MB } = KIT;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const angLerp = (a, b, t) => { const d = ((b - a + Math.PI * 3) % (Math.PI * 2)) - Math.PI; return a + d * t; };
  const SOLID_T = new Set(['bldg', 'water', 'void']);
  const DIRS = { up: Math.PI, down: 0, left: -Math.PI / 2, right: Math.PI / 2 };
  const SAVE_KEY = 'novacancy-save-v1';
  const HOUR = 25; // real seconds per in-game hour

  // ---------------- lighting by hour ----------------
  const KEYS = [
    [0, { sunDir: [0.35, -1, -0.45], sunCol: [0.17, 0.19, 0.36], sky: [0.4, 0.39, 0.6], ground: [0.17, 0.14, 0.23], clear: [0.04, 0.03, 0.08], bloom: 0.62, bloomTh: 0.72, sat: 1.15, grade: [0.98, 0.97, 1.06], night: 1 }],
    [5, { sunDir: [0.35, -1, -0.45], sunCol: [0.17, 0.19, 0.36], sky: [0.4, 0.39, 0.6], ground: [0.17, 0.14, 0.23], clear: [0.04, 0.03, 0.08], bloom: 0.62, bloomTh: 0.72, sat: 1.15, grade: [0.98, 0.97, 1.06], night: 1 }],
    [6.5, { sunDir: [-0.85, -0.45, -0.2], sunCol: [0.95, 0.6, 0.5], sky: [0.42, 0.36, 0.5], ground: [0.22, 0.17, 0.2], clear: [0.5, 0.36, 0.45], bloom: 0.55, bloomTh: 0.75, sat: 1.12, grade: [1.04, 0.97, 0.98], night: 0.4 }],
    [8.5, { sunDir: [-0.6, -0.8, -0.35], sunCol: [0.95, 0.86, 0.72], sky: [0.5, 0.52, 0.64], ground: [0.3, 0.27, 0.25], clear: [0.55, 0.6, 0.7], bloom: 0.32, bloomTh: 0.86, sat: 1.06, grade: [1.02, 1, 0.98], night: 0 }],
    [13, { sunDir: [-0.3, -1, -0.45], sunCol: [0.98, 0.94, 0.84], sky: [0.52, 0.56, 0.68], ground: [0.32, 0.29, 0.27], clear: [0.55, 0.65, 0.75], bloom: 0.28, bloomTh: 0.9, sat: 1.05, grade: [1, 1, 1], night: 0 }],
    [17, { sunDir: [0.55, -0.65, -0.4], sunCol: [1.0, 0.78, 0.55], sky: [0.5, 0.46, 0.58], ground: [0.3, 0.24, 0.22], clear: [0.6, 0.5, 0.5], bloom: 0.38, bloomTh: 0.82, sat: 1.1, grade: [1.04, 0.99, 0.95], night: 0 }],
    [19, { sunDir: [0.85, -0.38, -0.35], sunCol: [0.95, 0.42, 0.45], sky: [0.42, 0.32, 0.52], ground: [0.18, 0.13, 0.2], clear: [0.32, 0.2, 0.35], bloom: 0.6, bloomTh: 0.7, sat: 1.18, grade: [1.04, 0.95, 1.04], night: 0.55 }],
    [20.5, { sunDir: [0.35, -1, -0.45], sunCol: [0.17, 0.19, 0.36], sky: [0.4, 0.39, 0.6], ground: [0.17, 0.14, 0.23], clear: [0.04, 0.03, 0.08], bloom: 0.62, bloomTh: 0.72, sat: 1.15, grade: [0.98, 0.97, 1.06], night: 1 }],
    [24, { sunDir: [0.35, -1, -0.45], sunCol: [0.17, 0.19, 0.36], sky: [0.4, 0.39, 0.6], ground: [0.17, 0.14, 0.23], clear: [0.04, 0.03, 0.08], bloom: 0.62, bloomTh: 0.72, sat: 1.15, grade: [0.98, 0.97, 1.06], night: 1 }],
  ];
  function envAt(h) {
    let i = 0; while (i < KEYS.length - 2 && KEYS[i + 1][0] <= h) i++;
    const [h0, a] = KEYS[i], [h1, b] = KEYS[i + 1];
    const t = clamp((h - h0) / (h1 - h0 || 1), 0, 1), s = t * t * (3 - 2 * t);
    const o = {};
    for (const k in a) o[k] = Array.isArray(a[k]) ? a[k].map((v, j) => lerp(v, b[k][j], s)) : lerp(a[k], b[k], s);
    return o;
  }
  const INDOOR = { sunDir: [0.4, -1, 0.5], sunCol: [0.26, 0.24, 0.26], sky: [0.5, 0.47, 0.5], ground: [0.26, 0.22, 0.2], clear: [0.03, 0.02, 0.05], bloom: 0.6, bloomTh: 0.7, sat: 1.12, grade: [1.02, 0.99, 0.98], night: 1 };
  const UNDER = { sunDir: [0.3, -1, 0.5], sunCol: [0.16, 0.16, 0.28], sky: [0.34, 0.33, 0.5], ground: [0.16, 0.13, 0.2], clear: [0.02, 0.02, 0.05], bloom: 0.85, bloomTh: 0.6, sat: 1.18, grade: [0.98, 0.98, 1.06], night: 1 };

  // ---------------- game state ----------------
  const G = {
    R: null, cv: null, t: 0, S: null, map: null, mapId: null, scene: null, cam: null, busy: 0,
    agents: [], cars: [], player: null, cat: null, camOverride: null, shakeT: 0, zoom: 1, input: { keys: {}, joy: null },
    extraDraws: [], extraLights: [], meshCache: {}, lowGfx: false, night: 1, raining: false, paused: false,
  };
  function newState(name) {
    return {
      v: 1, name: name || 'Jay', map: 'city', x: 25.2, z: 41.5, dir: 'left',
      day: 1, clock: 22 * 60, money: 40, debt: 3000, heat: 0, rep: 1, tier: 1,
      inv: {}, stash: {}, flags: {}, obj: {}, rooms: [], guests: [], log: [], msgs: [], upgrades: {}, staff: {}, stats: { earned: 0, guests: 0, deals: 0 }, prices: {}, weather: 'rain', time: 0,
    };
  }
  G.newState = newState;
  G.hour = () => (G.S ? G.S.clock / 60 : 22);

  // ---------------- particles & rain ----------------
  const MAXP = 1600;
  const PT = { data: new Float32Array(MAXP * 8), list: [], n: 0 };
  function emit(p) { if (PT.list.length >= MAXP) return; PT.list.push(Object.assign({ vx: 0, vy: 0, vz: 0, life: 1, t: 0, size: 2, r: 1, g: 1, b: 1, a: 1, grav: 0, drag: 0, fade: 1 }, p)); }
  function burst(x, y, z, n, col, o = {}) {
    for (let i = 0; i < n; i++) { const a = Math.random() * Math.PI * 2, s = (o.speed || 1.5) * (0.4 + Math.random() * 0.8); emit({ x, y, z, vx: Math.cos(a) * s, vz: Math.sin(a) * s, vy: (o.up || 1) * (0.5 + Math.random()) * 1.5, life: (o.life || 0.7) * (0.6 + Math.random() * 0.6), size: o.size || 2, r: col[0], g: col[1], b: col[2], a: col[3] == null ? 1 : col[3], grav: o.grav == null ? 5 : o.grav, drag: o.drag || 1 }); }
  }
  G.emit = emit; G.burst = burst;
  function stepParticles(dt) {
    let n = 0;
    const L = PT.list;
    for (let i = L.length - 1; i >= 0; i--) {
      const p = L[i]; p.t += dt;
      if (p.t >= p.life) { L.splice(i, 1); continue; }
      p.vy -= p.grav * dt; const dr = Math.exp(-p.drag * dt); p.vx *= dr; p.vz *= dr; p.vy *= p.drag ? dr : 1;
      p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt;
    }
    for (const p of L) {
      const k = p.fade ? 1 - p.t / p.life : 1;
      PT.data.set([p.x, p.y, p.z, p.r, p.g, p.b, p.a * k, p.size], n * 8); n++;
    }
    PT.n = n;
  }
  const RAIN = { data: new Float32Array(900 * 14), drops: [], n: 0 };
  function stepRain(dt) {
    const want = G.raining && !G.map.indoor ? (G.lowGfx ? 260 : 600) : 0;
    const c = G.cam ? G.cam.real : [0, 0, 0];
    while (RAIN.drops.length < want) RAIN.drops.push({ x: c[0] + (Math.random() - 0.5) * 40, y: Math.random() * 14, z: c[2] + (Math.random() - 0.5) * 40 });
    if (RAIN.drops.length > want) RAIN.drops.length = want;
    let n = 0;
    for (const d of RAIN.drops) {
      d.y -= dt * 16; d.x -= dt * 2.4; d.z += dt * 0.8;
      if (d.y < 0) {
        if (Math.random() < 0.25) emit({ x: d.x, y: 0.15, z: d.z, vy: 1.2, vx: (Math.random() - 0.5), vz: (Math.random() - 0.5), life: 0.18, size: 1, r: 0.75, g: 0.8, b: 0.95, a: 0.6, grav: 9 });
        d.x = c[0] + (Math.random() - 0.5) * 40; d.z = c[2] + (Math.random() - 0.5) * 40; d.y = 10 + Math.random() * 6;
      }
      RAIN.data.set([d.x, d.y, d.z, 0.62, 0.7, 0.9, 0.55, d.x + 0.15, d.y + 0.9, d.z - 0.05, 0.62, 0.7, 0.9, 0.0], n * 14); n++;
    }
    RAIN.n = n;
  }

  // ---------------- meshes ----------------
  function upload(mb) { return mb && mb.count ? G.R.upload(mb.data()) : null; }
  G.upload = upload;
  function cached(key, fn) { if (!G.meshCache[key]) { const mb = new MB(); fn(mb); G.meshCache[key] = upload(mb); } return G.meshCache[key]; }
  G.cached = cached;
  function charMeshes(key, look) {
    const ck = 'ch:' + key;
    if (G.meshCache[ck]) return G.meshCache[ck];
    const p = CHARS.buildChar(look);
    const out = { size: p.size };
    for (const k of ['legL', 'legR', 'torso', 'armL', 'armR', 'head']) out[k] = upload(p[k]);
    return (G.meshCache[ck] = out);
  }
  G.charMeshes = charMeshes;
  function carMesh(kind, col) { return cached('car:' + kind + col, mb => mb.merge(CITY.car(kind, col))); }
  G.carMesh = carMesh;

  // ---------------- map loading ----------------
  function ctx() { return { S: G.S, tier: G.S.tier, night: G.night > 0.5, vacancy: SIM.vacancy ? SIM.vacancy() : true, room: G.S.flags.curRoom != null ? G.S.rooms[G.S.flags.curRoom] : null }; }
  G.ctx = ctx;
  function freeScene() {
    const sc = G.scene; if (!sc) return;
    for (const d of [...sc.statics, ...sc.occ, ...sc.dyn]) G.R.free(d.mesh);
  }
  function loadMap(id, tx, tz, dir) {
    // leaving the street: the city keeps living while you're inside (see stepWorld)
    if (G.mapId === 'city' && id !== 'city' && G.map) G.world = { map: G.map, fp: G.fp, agents: G.agents.filter(a => a.kind !== 'npc' && !a.scripted && !a.hidden), cars: G.cars, cat: G.cat, ghost: { id: 'ghost', x: -500, z: -500, y: 0 } };
    freeScene();
    PT.list.length = 0;
    const map = MAPS[id]();
    G.map = map; G.mapId = id; G.S.map = id;
    const B = BUILD.buildMap(map, ctx());
    const sc = { statics: [], occ: [], dyn: [], byId: {}, lights: B.lights };
    for (const s of B.statics) { const mesh = upload(s.mb); if (mesh) sc.statics.push({ mesh, box: BUILD.bbox(s.mb) }); }
    for (const o of B.occ) { const mesh = upload(o.mb); if (mesh) sc.occ.push({ mesh, box: BUILD.bbox(o.mb), id: o.id, fade: 1, noFade: o.noFade }); }
    for (const d of B.dyn) {
      const e = { o: d.o, k: d.k, mesh: upload(d.mb), box: BUILD.bbox(d.mb), fade: 1, flash: 0 };
      sc.dyn.push(e); if (d.o.id != null) sc.byId[d.o.id] = e;
    }
    G.scene = sc; G.fp = B.fp;
    const p = G.player || { id: 'player', x: 0, z: 0, y: 0, yaw: 0, speed: 0, walk: 0, path: null };
    p.x = tx != null ? tx : map.spawn.x; p.z = tz != null ? tz : map.spawn.z;
    p.yaw = DIRS[dir || map.spawn.dir] != null ? DIRS[dir || map.spawn.dir] : 0; p.path = null; p.speed = 0; p.interact = null;
    G.player = p;
    if (!walkableTile(Math.floor(p.x), Math.floor(p.z))) { const n = nearestWalkable(p.x, p.z); if (n) { p.x = n[0]; p.z = n[1]; } }
    p.y = groundY(p.x, p.z);
    G.agents = []; G.cars = []; G.cat = null; G.extraDraws = []; G.extraLights = [];
    let restored = false;
    if (id === 'city' && G.world) {
      // back outside: pick the street up exactly where it is now
      G.agents = G.world.agents; G.cars = G.world.cars; G.cat = G.world.cat; G.world = null; restored = true;
      for (const a of G.agents) if (a.path && a.kind !== 'cop') { const g = a.path[a.path.length - 1]; if (!pathTo(a, g[0], g[1])) a.path = [g]; }
    }
    if (SIM.populate) SIM.populate(id, restored);
    G.camSnap = true;
    if (STORY.onEnter) STORY.onEnter(id);
    if (UI.onMap) UI.onMap(id);
    save();
  }
  G.loadMap = loadMap;
  function refresh(id) {
    const e = G.scene && G.scene.byId[id]; if (!e) return;
    G.R.free(e.mesh);
    const mb = BUILD.rebuild(e, ctx());
    e.mesh = upload(mb); e.box = BUILD.bbox(mb);
    if (e.k.foot && e.k.occ) { /* footprint may change with tier */ const B = BUILD.buildMap(G.map, ctx()); G.fp = B.fp; G.scene.lights = B.lights; }
    else if (e.k.light) { const B = BUILD.buildMap(G.map, ctx()); G.scene.lights = B.lights; }
  }
  G.refresh = refresh;
  G.refreshAll = () => { const p = G.player; const keep = { x: p.x, z: p.z, yaw: p.yaw }; const ag = G.agents, cars = G.cars; loadMapKeep(); p.x = keep.x; p.z = keep.z; p.yaw = keep.yaw; };
  function loadMapKeep() {
    freeScene();
    const map = G.map;
    const B = BUILD.buildMap(map, ctx());
    const sc = { statics: [], occ: [], dyn: [], byId: {}, lights: B.lights };
    for (const s of B.statics) { const mesh = upload(s.mb); if (mesh) sc.statics.push({ mesh, box: BUILD.bbox(s.mb) }); }
    for (const o of B.occ) { const mesh = upload(o.mb); if (mesh) sc.occ.push({ mesh, box: BUILD.bbox(o.mb), id: o.id, fade: 1, noFade: o.noFade }); }
    for (const d of B.dyn) { const e = { o: d.o, k: d.k, mesh: upload(d.mb), box: BUILD.bbox(d.mb), fade: 1, flash: 0 }; sc.dyn.push(e); if (d.o.id != null) sc.byId[d.o.id] = e; }
    G.scene = sc; G.fp = B.fp;
  }
  G.setObj = (id, v) => { G.S.obj[id] = v; refresh(id); };

  // ---------------- collision & pathfinding ----------------
  function walkableTile(x, z) {
    const m = G.map, t = m.tile(x, z);
    if (t == null) return false;
    const key = x + ',' + z;
    if (G.fp.walk.has(key)) return true;
    if (SOLID_T.has(t)) return false;
    if (G.fp.solid.has(key)) return false;
    return true;
  }
  G.walkableTile = walkableTile;
  // where to stand inside a walkable tile (the centre unless furniture pokes into it)
  function standPt(x, z) { const p = G.fp.stand && G.fp.stand.get(x + ',' + z); return p ? [p[0], p[1]] : [x + 0.5, z + 0.5]; }
  G.standPt = standPt;
  function nearestWalkable(x, z) {
    let best = null, bd = 1e9;
    for (let dz = -4; dz <= 4; dz++) for (let dx = -4; dx <= 4; dx++) { const nx = Math.floor(x) + dx, nz = Math.floor(z) + dz; if (walkableTile(nx, nz)) { const sp = standPt(nx, nz); const d = Math.hypot(sp[0] - x, sp[1] - z); if (d < bd) { bd = d; best = sp; } } }
    return best;
  }
  G.nearestWalkable = nearestWalkable;
  function groundY(x, z) {
    if (G.map.indoor) return 0;
    const t = G.map.tile(Math.floor(x), Math.floor(z));
    const g = CITY.GROUND[t]; return g ? Math.max(0, g.y) : 0.14;
  }
  G.groundY = groundY;
  function terrainOk(tx, tz) {
    const key = tx + ',' + tz;
    if (G.fp.walk.has(key)) return true;
    const t = G.map.tile(tx, tz);
    if (t == null || SOLID_T.has(t)) return false;
    return !(G.fp.block && G.fp.block.has(key));
  }
  // exact test: terrain at the four edges of the body, then object rectangles, then people
  function freeAt(x, z, r = 0.22, self, ignoreAgents) {
    for (const [dx, dz] of [[-r, -r], [r, -r], [-r, r], [r, r]]) if (!terrainOk(Math.floor(x + dx), Math.floor(z + dz))) return false;
    const fp = G.fp;
    if (fp.rects && !fp.walk.has(Math.floor(x) + ',' + Math.floor(z))) {
      const list = fp.grid.get(Math.floor(x) + ',' + Math.floor(z));
      if (list) for (const i of list) if (BUILD.circRect(x, z, r, fp.rects[i])) return false;
    } else if (!fp.rects) {
      for (const [dx, dz] of [[-r, -r], [r, -r], [-r, r], [r, r]]) if (!walkableTile(Math.floor(x + dx), Math.floor(z + dz))) return false;
    }
    if (self === G.player && !ignoreAgents) for (const a of G.agents) if (!a.ghost && !a.hidden && Math.hypot(a.x - x, a.z - z) < 0.42 && Math.hypot(a.x - x, a.z - z) < Math.hypot(a.x - self.x, a.z - self.z)) return false;
    return true;
  }
  G.freeAt = freeAt;
  function moveEnt(e, dx, dz, r) {
    // already overlapping something (spawned in a tight spot, a door closed on us): let us walk out
    const ign = e === G.player && (e.pushT || 0) > 0.5;
    if (!freeAt(e.x, e.z, r, e, true)) {
      if (freeAt(e.x, e.z, 0.08, e, true)) r = 0.08; // just grazing: move with a thinner body
      else { const nx = e.x + dx, nz = e.z + dz; if (terrainOk(Math.floor(nx), Math.floor(nz))) { e.x = nx; e.z = nz; return true; } }
    }
    let moved = false;
    if (freeAt(e.x + dx, e.z, r, e, ign)) { e.x += dx; moved = true; }
    if (freeAt(e.x, e.z + dz, r, e, ign)) { e.z += dz; moved = true; }
    if (!moved) {
      // slide around corners: try the two 45-degree turns
      const l = Math.hypot(dx, dz);
      for (const a of [0.785, -0.785, 1.3, -1.3]) {
        const c = Math.cos(a), s2 = Math.sin(a), ndx = (dx * c - dz * s2) * 0.7, ndz = (dx * s2 + dz * c) * 0.7;
        if (l && freeAt(e.x + ndx, e.z + ndz, r, e, ign)) { e.x += ndx; e.z += ndz; moved = true; break; }
      }
    }
    if (e === G.player) e.pushT = moved ? 0 : (e.pushT || 0) + 1 / 60;
    return moved;
  }
  G.moveEnt = moveEnt;
  function astar(sx, sz, tx, tz, maxN = 6000, filter) {
    if (!walkableTile(tx, tz)) return null;
    if (filter && !filter(tx, tz)) return null;
    const W = G.map.w, key = (x, z) => z * W + x;
    const open = [[sx, sz, 0, Math.hypot(tx - sx, tz - sz)]];
    const came = new Map(), gs = new Map([[key(sx, sz), 0]]);
    let n = 0;
    while (open.length && n++ < maxN) {
      let bi = 0; for (let i = 1; i < open.length; i++) if (open[i][3] < open[bi][3]) bi = i;
      const [x, z] = open[bi]; open[bi] = open[open.length - 1]; open.pop();
      if (x === tx && z === tz) {
        const path = [[x, z]]; let k = key(x, z);
        while (came.has(k)) { const c = came.get(k); path.unshift(c); k = key(c[0], c[1]); }
        return path;
      }
      for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]]) {
        const nx = x + dx, nz = z + dz;
        if (!walkableTile(nx, nz) || (filter && !filter(nx, nz))) continue;
        if (dx && dz && (!walkableTile(x + dx, z) || !walkableTile(x, z + dz) || (filter && (!filter(x + dx, z) || !filter(x, z + dz))))) continue;
        if (!edgeOk(x, z, nx, nz)) continue;
        const g = gs.get(key(x, z)) + (dx && dz ? 1.414 : 1);
        const nk = key(nx, nz);
        if (!gs.has(nk) || g < gs.get(nk)) { gs.set(nk, g); came.set(nk, [x, z]); open.push([nx, nz, g, g + Math.hypot(tx - nx, tz - nz) * 1.05]); }
      }
    }
    return null;
  }
  // can you walk straight from one tile's stand point to its neighbour's? (cached per map build)
  function edgeOk(x, z, nx, nz) {
    const fp = G.fp; if (!fp.grid) return true;
    if (!fp.grid.has(x + ',' + z) && !fp.grid.has(nx + ',' + nz)) return true;
    if (!fp.edges) fp.edges = new Map();
    const k = x < nx || (x === nx && z < nz) ? x + ',' + z + '>' + nx + ',' + nz : nx + ',' + nz + '>' + x + ',' + z;
    let v = fp.edges.get(k);
    if (v === undefined) { const a = standPt(x, z), b = standPt(nx, nz); v = lineFree(a[0], a[1], b[0], b[1]); fp.edges.set(k, v); }
    return v;
  }
  function lineFree(x0, z0, x1, z1, filter) {
    const n = Math.ceil(Math.hypot(x1 - x0, z1 - z0) * 4);
    for (let i = 0; i <= n; i++) { const t = i / n, x = x0 + (x1 - x0) * t, z = z0 + (z1 - z0) * t; if (!freeAt(x, z, 0.2)) return false; if (filter && !filter(Math.floor(x), Math.floor(z))) return false; }
    return true;
  }
  function pathTo(e, tx, tz) {
    const s = walkableTile(Math.floor(e.x), Math.floor(e.z)) ? [Math.floor(e.x), Math.floor(e.z)] : (nearestWalkable(e.x, e.z) || [e.x, e.z]).map(Math.floor);
    const f = e.walkFilter;
    const raw = astar(s[0], s[1], Math.floor(tx), Math.floor(tz), 6000, f);
    if (!raw) return false;
    const pts = raw.map(([x, z]) => standPt(x, z));
    if (freeAt(tx, tz, 0.2)) pts[pts.length - 1] = [tx, tz];
    const out = []; let cx = e.x, cz = e.z, i = 0;
    while (i < pts.length) {
      let j = Math.min(pts.length - 1, i + 24);
      while (j > i && !lineFree(cx, cz, pts[j][0], pts[j][1], f)) j--;
      out.push(pts[j]); cx = pts[j][0]; cz = pts[j][1]; i = j + 1;
    }
    e.path = out;
    return true;
  }
  G.pathTo = pathTo;
  function approach(e, target) {
    const tiles = target.tiles && target.tiles.length ? target.tiles : [[Math.floor(target.x), Math.floor(target.z)]];
    const cand = new Map();
    for (const [x, z] of tiles) for (const [dx, dz] of [[0, 1], [1, 0], [0, -1], [-1, 0], [1, 1], [-1, 1], [1, -1], [-1, -1], [0, 0]]) {
      const nx = x + dx, nz = z + dz;
      if (walkableTile(nx, nz)) cand.set(nx + ',' + nz, [nx, nz, (dx && dz ? 0.3 : 0) + (dz === 1 || dx === 1 ? -0.3 : 0)]);
    }
    let best = null, bl = 1e9;
    const sorted = [...cand.values()].sort((a, b) => Math.hypot(a[0] - e.x, a[1] - e.z) - Math.hypot(b[0] - e.x, b[1] - e.z)).slice(0, 6);
    for (const [nx, nz, pen] of sorted) {
      const p = astar(Math.floor(e.x), Math.floor(e.z), nx, nz, 4000);
      if (!p) continue;
      const l = p.length + pen;
      if (l < bl) { bl = l; best = standPt(nx, nz); }
    }
    return best;
  }
  G.approach = approach;
  // which map holds a quest target, and which exit/door on this map leads toward it
  let where = null;
  G.whereIs = function (id) {
    if (!where) {
      where = {};
      for (const k of Object.keys(MAPS)) { const m = MAPS[k](); for (const o of m.objects || []) if (o.id != null && !where[o.id]) where[o.id] = k; for (const e of m.exits || []) if (e.id && !where[e.id]) where[e.id] = k; }
    }
    if (where[id]) return where[id];
    for (const k of Object.keys(MAPS)) if (STORY.npcs(k).some(n => n.id === id)) return k;
    return null;
  };
  // returns a world point to guide the player toward map `to`
  G.pointToward = function (to) {
    if (!to || to === G.mapId) return null;
    if (G.mapId !== 'city') { const e = (G.map.exits || []).find(e => e.to === 'city'); return e ? [e.x + (e.w || 1) / 2, 1.4, e.z + (e.h || 1) / 2] : null; }
    if (to === 'office' || to === 'lobby') { const d = MOTEL.frontDoor(G.S.tier); return [d.x, 1.8, d.z]; }
    if (to === 'room') { const d = MOTEL.roomDoor(G.S.flags.curRoom || 0, G.S.tier); return [d.x, 1.9, d.z + 0.3]; }
    const e = G.map.exits.find(e => e.to === to);
    if (e) return [e.x + (e.w || 1) / 2, 1.6, e.z + (e.h || 1) / 2];
    return null;
  };

  // ---------------- agents (any walking person on this map) ----------------
  // a: { id, look, lookKey, x, z, yaw, speed, walk, path, name, kind, onArrive, hidden, pose:{}, icon, spd }
  function addAgent(a) {
    const ag = Object.assign({ yaw: 0, speed: 0, walk: 0, path: null, t0: Math.random() * 10, pose: {}, spd: 2.2, y: 0 }, a);
    if (a.dir && DIRS[a.dir] != null) ag.yaw = DIRS[a.dir];
    ag.y = groundY(ag.x, ag.z);
    G.agents.push(ag);
    return ag;
  }
  function removeAgent(a) { const i = G.agents.indexOf(a); if (i >= 0) G.agents.splice(i, 1); }
  G.addAgent = addAgent; G.removeAgent = removeAgent;
  G.agent = id => G.agents.find(a => a.id === id);
  function walkAgent(a, x, z) {
    return new Promise(res => {
      if (!pathTo(a, x, z)) a.path = [[x, z]];
      // each walk has its own finisher: an old walk's timeout must never cancel a newer walk
      let done = false;
      const finish = () => { if (done) return; done = true; if (a.onArrive === finish) a.onArrive = null; res(); };
      a.onArrive = finish;
      setTimeout(finish, 15000);
    });
  }
  G.walkAgent = walkAgent;
  function stepAgent(a, dt) {
    // waiting at the curb for traffic
    if (a.gate && a.path && a.path.length && !a.gate(a)) { a.speed = lerp(a.speed, 0, 1 - Math.exp(-dt * 10)); a.walk += dt * 10 * a.speed; return; }
    if (a.path && a.path.length) {
      const [tx, tz] = a.path[0];
      const dx = tx - a.x, dz = tz - a.z, d = Math.hypot(dx, dz);
      if (d < 0.1) { a.path.shift(); if (!a.path.length) { a.path = null; if (a.onArrive) a.onArrive(); } }
      else {
        const st = Math.min(d, (a.spd || 2.2) * dt * (G.speedMul || 1));
        a.x += dx / d * st; a.z += dz / d * st;
        a.yaw = angLerp(a.yaw, Math.atan2(dx, dz), 1 - Math.exp(-dt * 10));
        a.speed = lerp(a.speed, 1, 1 - Math.exp(-dt * 10));
      }
    } else {
      a.speed = lerp(a.speed, 0, 1 - Math.exp(-dt * 10));
      if (a.faceYaw != null) a.yaw = angLerp(a.yaw, a.faceYaw, 1 - Math.exp(-dt * 8));
    }
    a.walk += dt * 10 * a.speed * (a.spd || 2.2) / 2.2;
    a.y = lerp(a.y, groundY(a.x, a.z), 1 - Math.exp(-dt * 12));
  }

  // the street while you're indoors: same people, same cars, still moving
  function stepWorld(dt) {
    const W = G.world, keep = { map: G.map, fp: G.fp, agents: G.agents, cars: G.cars, player: G.player, mapId: G.mapId, cat: G.cat };
    G.map = W.map; G.fp = W.fp; G.agents = W.agents; G.cars = W.cars; G.player = W.ghost; G.mapId = 'city'; G.cat = W.cat;
    try { for (const a of G.agents) stepAgent(a, dt); if (G.cat && SIM.stepCat) SIM.stepCat(G.cat, dt); if (SIM.stepWorld) SIM.stepWorld(dt); }
    catch (e) { console.error(e); }
    finally { W.agents = G.agents; W.cars = G.cars; W.cat = G.cat; Object.assign(G, keep); }
  }

  // ---------------- interaction ----------------
  function targets() {
    const out = [];
    const c = ctx();
    for (const e of G.scene.dyn) {
      const o = e.o; if (o.id == null) continue;
      const h = STORY.handler(o.id, o);
      if (!h || (h.visible && !h.visible())) continue;
      if (e.k.visible && !e.k.visible(o, c)) continue;
      const k = e.k;
      const an = k.anchor ? k.anchor(o, c) : null;
      const x = an ? an.x : o.x, z = an ? an.z : o.z;
      const tiles = an && an.tiles ? an.tiles : footTiles(o, k);
      out.push({ type: 'obj', id: o.id, o, x, y: an ? an.y : (k.y != null ? k.y : (k.h || 1) * 0.6), z: z + (k.wall && !an ? 0.35 : 0), h: k.h || 1, tiles, name: typeof h.name === 'function' ? h.name() : (h.name || o.id), ent: e });
    }
    for (const a of G.agents) if (!a.hidden && STORY.canTalk(a)) out.push({ type: 'agent', id: a.id, a, x: a.x, y: 0.9, z: a.z, h: 1.3, tiles: [[Math.floor(a.x), Math.floor(a.z)]], name: a.name || a.id });
    if (G.cat && !G.cat.hidden) out.push({ type: 'cat', id: 'cat', x: G.cat.x, y: 0.3, z: G.cat.z, h: 0.4, tiles: [[Math.floor(G.cat.x), Math.floor(G.cat.z)]], name: 'Neon' });
    return out;
  }
  function footTiles(o, k) {
    const f = k.foot ? k.foot(o, ctx()) : [];
    if (f.length) return f;
    if (k.wall) return [[Math.floor(o.x), Math.floor(o.z + 0.6)]];
    return [[Math.floor(o.x), Math.floor(o.z)]];
  }
  G.targets = targets;
  function screenOf(x, y, z) {
    if (!G.cam) return { x: -999, y: -999, z: 0 };
    const r = G.cv.getBoundingClientRect();
    const s = G.R.project(G.cam, x, y, z, r.width, r.height);
    return { x: s.x + r.left, y: s.y + r.top, z: s.z };
  }
  G.screenOf = screenOf;
  // CSS pixel -> world point on a horizontal plane
  function groundAt(sx, sy, planeY = 0.1) {
    const r = G.cv.getBoundingClientRect(), c = G.cam;
    const k = G.R.scale / (G.R.w / r.width);
    const px = (sx - r.left) / k + 1 + c.off[0], py = (r.height - (sy - r.top)) / k + 1 + c.off[1];
    const ox = (px / G.R.lw * 2 - 1) * c.hw, oy = (py / G.R.lh * 2 - 1) * c.hh;
    // point on the camera plane through the target
    const p = [c.target[0] + c.right[0] * ox + c.up[0] * oy, c.target[1] + c.right[1] * ox + c.up[1] * oy, c.target[2] + c.right[2] * ox + c.up[2] * oy];
    const t = (planeY - p[1]) / c.fwd[1];
    return [p[0] + c.fwd[0] * t, p[2] + c.fwd[2] * t];
  }
  G.groundAt = groundAt;

  function tap(sx, sy) {
    if (G.busy || UI.blocking()) return;
    const [gx, gz] = groundAt(sx, sy);
    let best = null, bd = 1e9;
    const sc = Math.min(innerWidth, innerHeight) / 400;
    for (const t of targets()) {
      const s = screenOf(t.x, t.y + 0.2, t.z), s2 = screenOf(t.x, 0.1, t.z);
      const ax = s2.x, ay = s2.y, bx = s.x, by = s.y;
      const vx = bx - ax, vy = by - ay, l2 = vx * vx + vy * vy || 1;
      const u = clamp(((sx - ax) * vx + (sy - ay) * vy) / l2, 0, 1);
      let d = Math.hypot(sx - (ax + vx * u), sy - (ay + vy * u));
      if (t.tiles.some(([x, z]) => Math.floor(gx) === x && Math.floor(gz) === z)) d = Math.min(d, 16);
      const lim = (t.type === 'agent' ? 34 : 28) * sc;
      if (d < lim && d < bd) { bd = d; best = t; }
    }
    if (best) { goInteract(best); return; }
    const tx = Math.floor(gx), tz = Math.floor(gz);
    if (walkableTile(tx, tz)) { if (pathTo(G.player, gx, gz)) { G.player.interact = null; ripple(gx, gz); SFX.play('tap'); } }
    else { const near = approach(G.player, { x: gx, z: gz, tiles: [[tx, tz]] }); if (near) { pathTo(G.player, near[0], near[1]); G.player.interact = null; ripple(near[0], near[1]); } }
  }
  function ripple(x, z) { const y = groundY(x, z) + 0.03; for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; emit({ x: x + Math.cos(a) * 0.1, y, z: z + Math.sin(a) * 0.1, vx: Math.cos(a) * 1.4, vz: Math.sin(a) * 1.4, life: 0.35, size: 2, r: 1, g: 0.85, b: 0.4, a: 0.9, drag: 5 }); } }
  function goInteract(t) {
    const p = G.player;
    const d = Math.hypot(p.x - t.x, p.z - t.z);
    const reach = t.type === 'agent' ? 1.6 : 1.5;
    const nearTile = t.tiles.some(([x, z]) => Math.abs(Math.floor(p.x) - x) <= 1 && Math.abs(Math.floor(p.z) - z) <= 1);
    if (d < reach || (nearTile && d < 2.6)) { p.path = null; faceTo(p, t.x, t.z); doInteract(t); return; }
    const spot = t.type === 'agent' ? (nearestWalkable(t.x + 0.7, t.z + 0.7) || [t.x, t.z + 1]) : approach(p, t);
    if (!spot) { UI.toast("Can't get there from here."); return; }
    pathTo(p, spot[0], spot[1]);
    p.interact = t;
  }
  G.goInteract = goInteract;
  function faceTo(e, x, z) { e.yawTarget = Math.atan2(x - e.x, z - e.z); e.faceYaw = e.yawTarget; }
  G.faceTo = faceTo;
  function doInteract(t) {
    if (t.type === 'agent') { const a = t.a; faceTo(a, G.player.x, G.player.z); run(() => STORY.talk(a)); return; }
    if (t.type === 'cat') { run(() => STORY.petCat()); return; }
    UI.verbs(t);
  }
  G.doInteract = doInteract;
  G.nearest = function () {
    if (!G.player) return null;
    const p = G.player; let best = null, bd = 1.9;
    for (const t of targets()) {
      let d = Math.hypot(t.x - p.x, t.z - p.z);
      if (t.tiles.some(([x, z]) => Math.abs(Math.floor(p.x) - x) <= 1 && Math.abs(Math.floor(p.z) - z) <= 1)) d = Math.min(d, 1.2);
      if (d < bd) { bd = d; best = t; }
    }
    return best;
  };

  // ---------------- scripts ----------------
  async function run(fn) {
    G.busy++;
    G.player.path = null;
    try { await fn(); }
    catch (e) { console.error(e); }
    finally { G.busy = Math.max(0, G.busy - 1); UI.refreshHud(); save(); }
  }
  G.run = run;
  G.sleep = ms => new Promise(r => setTimeout(r, ms));

  // ---------------- travel between maps ----------------
  async function travel(to, tx, tz, dir) {
    G.busy++;
    try {
      SFX.play('door');
      await UI.fade(1, 0.25);
      const exitBack = G.mapId;
      loadMap(to, tx, tz, dir);
      G.lastFrom = exitBack;
    } catch (e) { console.error(e); }
    finally { await UI.fade(0, 0.3); G.busy = Math.max(0, G.busy - 1); }
  }
  G.travel = travel;
  // where to stand when returning to the city through a given exit id
  function returnPoint(back) {
    const m = MAPS.city();
    if (back === 'officedoor') { const d = MOTEL.frontDoor(G.S.tier); return [d.x + (G.S.tier <= 3 ? 0.6 : 0), d.z + (G.S.tier <= 3 ? 0 : 0.8), G.S.tier <= 3 ? 'right' : 'down']; }
    if (back === 'room') { const r = G.S.flags.curRoom || 0; const d = MOTEL.roomDoor(r, G.S.tier); return [d.x, d.z + 1.1, 'down']; }
    const ex = m.exits.find(e => e.id === back);
    if (ex) { const dx = ex.dir === 'right' ? 1.2 : ex.dir === 'left' ? -1.2 : 0, dz = ex.dir === 'down' || ex.dir === 'up' ? 1.3 : 0; return [ex.x + (ex.w || 1) / 2 + dx, ex.z + (ex.h || 1) / 2 + dz, ex.dir === 'right' ? 'right' : 'down']; }
    return [m.spawn.x, m.spawn.z, 'down'];
  }
  G.returnPoint = returnPoint;
  function checkExits() {
    const p = G.player; if (G.busy || UI.blocking()) return;
    const tx = Math.floor(p.x), tz = Math.floor(p.z);
    for (const e of G.map.exits || []) {
      if (tx >= e.x && tx < e.x + (e.w || 1) && tz >= e.z && tz < e.z + (e.h || 1)) {
        if (G.lastExitTile === tx + ',' + tz) return;
        G.lastExitTile = tx + ',' + tz;
        if (e.need && !G.S.flags[e.need]) { run(() => STORY.blocked(e)); p.path = null; nudgeBack(e); return; }
        if (e.to === 'city') { const [x, z, d] = returnPoint(e.back); travel('city', x, z, d); }
        else travel(e.to, e.tx, e.tz, e.dir);
        return;
      }
    }
    G.lastExitTile = null;
  }
  function nudgeBack(e) { const p = G.player; p.x += e.dir === 'right' ? -0.6 : e.dir === 'left' ? 0.6 : 0; p.z += e.dir === 'up' ? 0.6 : e.dir === 'down' ? -0.6 : 0; }

  // ---------------- time & weather ----------------
  G.advanceClock = function (minutes) {
    const S = G.S;
    const before = S.clock;
    S.clock += minutes;
    while (S.clock >= 1440) { S.clock -= 1440; S.day++; if (SIM.newDay) SIM.newDay(); }
    // announce the turn of the day (only for normal time passing, not skips)
    if (minutes > 0 && minutes < 30 && G.map && !G.map.indoor) {
      const crossed = h => before < h * 60 && S.clock >= h * 60;
      if (crossed(6.5)) { UI.banner('Sunrise', `Day ${S.day} · the city wakes up`); if (G.raining && Math.random() < 0.6) { S.weather = 'clear'; G.raining = false; UI.toast('The rain lets up.'); } }
      if (crossed(19.5)) UI.banner('Nightfall', 'The neon comes on. So do the cops.');
    }
  };
  function updateEnv(dt) {
    const E = G.R.env;
    let T;
    if (G.map.underground) T = UNDER;
    else if (G.map.indoor) T = INDOOR;
    else T = envAt(G.hour());
    // night brightness setting (Phone > Settings): lifts the moonlight and ambient fill
    const nb = G.nightBoost || 1, nn = G.map.indoor && !G.map.underground ? 0 : (T.night || 0);
    if (nb !== 1 && nn > 0) { const f = 1 + (nb - 1) * nn; T = Object.assign({}, T, { sky: T.sky.map(v => v * f), ground: T.ground.map(v => v * f), sunCol: T.sunCol.map(v => v * f) }); }
    const k = G.envSnap ? 1 : 1 - Math.exp(-dt * 3);
    G.envSnap = false;
    for (const key in T) {
      if (key === 'night') continue;
      if (Array.isArray(T[key])) for (let i = 0; i < T[key].length; i++) E[key][i] = lerp(E[key][i], T[key][i], k);
      else E[key] = lerp(E[key], T[key], k);
    }
    const nOut = envAt(G.hour()).night;
    G.night = G.map.indoor ? nOut : nOut;
    const wetT = G.raining && !G.map.indoor ? 1 : (G.S.flags.wetGround && !G.map.indoor ? 0.6 : 0);
    E.wet = lerp(E.wet, wetT, 1 - Math.exp(-dt * 0.8));
    E.glassGlow = G.map.indoor ? 1 : clamp(nOut * 1.4, 0, 1);
    E.wind = G.raining ? 1.8 : 1;
    if (G.raining && !G.map.indoor) { E.sky = E.sky.map(v => v * 0.93); E.sunCol = E.sunCol.map(v => v * 0.82); }
  }

  // ---------------- update ----------------
  function update(dt) {
    const p = G.player, S = G.S;
    G.t += dt; S.time += dt;
    if (!G.paused && !G.busy && !UI.blocking()) G.advanceClock(dt / HOUR * 60 * (G.clockMul || 1));
    else if (!G.paused && G.busy) G.advanceClock(dt / HOUR * 60 * 0.25);
    // input
    let mx = 0, mz = 0;
    if (!G.busy && !UI.blocking()) {
      const k = G.input.keys;
      let jx = 0, jy = 0;
      if (k.ArrowLeft || k.a) jx -= 1; if (k.ArrowRight || k.d) jx += 1; if (k.ArrowUp || k.w) jy -= 1; if (k.ArrowDown || k.s) jy += 1;
      if (G.input.joy) { jx = G.input.joy.x; jy = G.input.joy.y; }
      // screen-relative: up on screen is north-west in the world
      mx = 0.7071 * jx + 0.7071 * jy; mz = -0.7071 * jx + 0.7071 * jy;
    }
    const spd = (G.input.keys.Shift || G.input.run ? 5.2 : 3.6) * (G.speedMul || 1);
    if (mx || mz) {
      const l = Math.hypot(mx, mz), m = Math.min(1, l);
      p.path = null; p.interact = null;
      const n = Math.ceil(spd * m * dt / 0.2);
      for (let i = 0; i < n; i++) moveEnt(p, mx / l * spd * m * dt / n, mz / l * spd * m * dt / n, 0.22);
      p.yawTarget = Math.atan2(mx, mz); p.speed = lerp(p.speed, m, 1 - Math.exp(-dt * 12));
    } else if (p.path && p.path.length) {
      const [tx, tz] = p.path[0];
      const dx = tx - p.x, dz = tz - p.z, d = Math.hypot(dx, dz);
      if (d < 0.08) { p.path.shift(); if (!p.path.length) { p.path = null; p.replanned = false; if (p.interact) { const t = p.interact; p.interact = null; faceTo(p, t.x, t.z); doInteract(t); } } }
      else {
        const st = Math.min(d, spd * dt);
        const n = Math.ceil(st / 0.2);
        for (let i = 0; i < n; i++) moveEnt(p, dx / d * st / n, dz / d * st / n, 0.2);
        // no progress toward the waypoint: re-plan once, then give up
        const nd = Math.hypot(tx - p.x, tz - p.z);
        if (nd > d - st * 0.3) { p.stuck = (p.stuck || 0) + dt; if (p.stuck > 0.45) { p.stuck = 0; const goal = p.path[p.path.length - 1], it = p.interact; if (!p.replanned && pathTo(p, goal[0], goal[1])) { p.replanned = true; p.interact = it; } else { p.path = null; p.replanned = false; if (it) { p.interact = null; if (Math.hypot(p.x - it.x, p.z - it.z) < 2.8) { faceTo(p, it.x, it.z); doInteract(it); } } } } }
        else { p.stuck = 0; }
        p.yawTarget = Math.atan2(dx, dz); p.speed = lerp(p.speed, 1, 1 - Math.exp(-dt * 12));
      }
    } else p.speed = lerp(p.speed, 0, 1 - Math.exp(-dt * 10));
    if (p.yawTarget != null) p.yaw = angLerp(p.yaw, p.yawTarget, 1 - Math.exp(-dt * 14));
    const before = p.walk;
    p.walk += dt * 11 * p.speed * spd / 3.6;
    p.y = lerp(p.y || 0, groundY(p.x, p.z), 1 - Math.exp(-dt * 14));
    if (p.speed > 0.5 && Math.floor(p.walk / Math.PI) !== Math.floor(before / Math.PI)) {
      const t = G.map.tile(Math.floor(p.x), Math.floor(p.z));
      SFX.play(G.raining && !G.map.indoor ? 'stepWet' : G.map.indoor ? (t === 'tiles' ? 'stepTile' : 'stepWood') : 'step');
      if (G.raining && !G.map.indoor) for (let i = 0; i < 3; i++) emit({ x: p.x, y: p.y + 0.05, z: p.z, vx: (Math.random() - 0.5) * 1.2, vy: 1 + Math.random(), vz: (Math.random() - 0.5) * 1.2, life: 0.3, size: 1, r: 0.7, g: 0.8, b: 1, a: 0.7, grav: 8 });
    }
    for (const a of G.agents) stepAgent(a, dt);
    if (G.cat) SIM.stepCat && SIM.stepCat(G.cat, dt);
    if (G.world && G.mapId !== 'city') stepWorld(dt);
    if (SIM.update) SIM.update(dt);
    checkExits();
    updateEnv(dt);
    ambient(dt);
    stepParticles(dt);
    stepRain(dt);
    G.shakeT = Math.max(0, G.shakeT - dt * 2);
    for (const e of G.scene.dyn) e.flash = Math.max(0, (e.flash || 0) - dt * 3);
  }
  function ambient(dt) {
    const c = G.cam ? G.cam.real : [0, 0, 0];
    if (G.map.underground) {
      if (Math.random() < dt * 6) emit({ x: c[0] + (Math.random() - 0.5) * 16, y: 0.5 + Math.random() * 3, z: c[2] + (Math.random() - 0.5) * 10, vx: 0.1, vy: 0.05, life: 4, size: 1, r: 0.8, g: 0.8, b: 0.9, a: 0.35, grav: 0, drag: 0 });
      return;
    }
    if (G.map.indoor) { if (Math.random() < dt * 2) emit({ x: Math.random() * G.map.w, y: 0.5 + Math.random() * 1.8, z: Math.random() * G.map.h, vy: 0.04, vx: 0.05, life: 5, size: 1, r: 1, g: 0.95, b: 0.8, a: 0.3, grav: 0 }); return; }
    // steam from manholes, moths around lamps at night
    if (G.night > 0.5) for (const l of G.scene.lights) if (l.night && l.r > 6 && Math.random() < dt * 0.6 && Math.hypot(l.x - c[0], l.z - c[2]) < 18) emit({ x: l.x + (Math.random() - 0.5) * 0.6, y: l.y - 0.2, z: l.z + (Math.random() - 0.5) * 0.6, vx: (Math.random() - 0.5), vy: (Math.random() - 0.5) * 0.4, vz: (Math.random() - 0.5), life: 1.5, size: 1, r: 1, g: 0.95, b: 0.7, a: 0.8, grav: 0, drag: 0.5 });
    for (const o of G.map.objects) if (o.k === 'manhole' && Math.random() < dt * 3 && Math.hypot(o.x - c[0], o.z - c[2]) < 20) emit({ x: o.x + (Math.random() - 0.5) * 0.4, y: 0.1, z: o.z + (Math.random() - 0.5) * 0.4, vx: 0.3 + Math.random() * 0.2, vy: 0.6, vz: -0.1, life: 2.2, size: 3, r: 0.75, g: 0.75, b: 0.8, a: 0.25, grav: -0.1, drag: 0.3 });
  }

  // ---------------- camera ----------------
  function ppuFor() {
    let base = clamp(Math.min(G.R.lw / 26, G.R.lh / 13), 16, 30);
    if (G.map && G.map.indoor && !G.map.underground) base = clamp(Math.min(G.R.lw / ((G.map.w + G.map.h) * 0.72), G.R.lh / ((G.map.w + G.map.h) * 0.42)), 16, 42);
    if (G.map && G.map.underground) base = clamp(Math.min(G.R.lw / 18, G.R.lh / 10), 18, 34);
    return Math.round(base * G.zoom * 2) / 2;
  }
  function updateCamera(dt) {
    const p = G.player, m = G.map;
    let tx = p.x, ty = (p.y || 0) + 0.6, tz = p.z;
    if (G.camOverride) { const o = G.camOverride; tx = o.x; ty = o.y != null ? o.y : 0.5; tz = o.z; }
    else if (!m.indoor) {
      tx = clamp(tx, 2, m.w - 2); tz = clamp(tz, 2, m.h - 2);
    } else { tx = lerp(tx, m.w / 2, 0.35); tz = lerp(tz, m.h / 2, 0.35); }
    const c = G.camState || (G.camState = { x: tx, y: ty, z: tz });
    const k = G.camSnap ? 1 : 1 - Math.exp(-dt * (G.camOverride ? 2.5 : 6));
    G.camSnap = false;
    c.x = lerp(c.x, tx, k); c.y = lerp(c.y, ty, k); c.z = lerp(c.z, tz, k);
    let sx = 0, sz = 0;
    if (G.shakeT > 0) { sx = (Math.random() - 0.5) * G.shakeT * 0.5; sz = (Math.random() - 0.5) * G.shakeT * 0.5; }
    G.cam = G.R.isoCam([c.x + sx, c.y, c.z + sz], ppuFor());
  }
  G.shake = (s = 0.5) => { G.shakeT = Math.max(G.shakeT, s); };

  // ---------------- drawing ----------------
  function onScreen(box) {
    if (!box) return true;
    const vp = G.cam.vp;
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
    for (let i = 0; i < 8; i++) {
      const v = M4.xform(vp, i & 1 ? box[3] : box[0], i & 2 ? box[4] : box[1], i & 4 ? box[5] : box[2]);
      if (v[0] < x0) x0 = v[0]; if (v[0] > x1) x1 = v[0]; if (v[1] < y0) y0 = v[1]; if (v[1] > y1) y1 = v[1];
    }
    return !(x1 < -1.05 || x0 > 1.05 || y1 < -1.05 || y0 > 1.05);
  }
  // does this box hide the player? cast a ray from the player toward the camera and test the box
  function rayHits(o, d, box) {
    let t0 = 0, t1 = 1e9;
    for (let i = 0; i < 3; i++) {
      const lo = box[i] + 0.15, hi = box[i + 3] - 0.15;
      if (Math.abs(d[i]) < 1e-6) { if (o[i] < lo || o[i] > hi) return false; continue; }
      let a = (lo - o[i]) / d[i], b = (hi - o[i]) / d[i]; if (a > b) { const t = a; a = b; b = t; }
      t0 = Math.max(t0, a); t1 = Math.min(t1, b); if (t0 > t1) return false;
    }
    return t1 > 0.05;
  }
  function hidesPlayer(box) {
    if (!box) return false;
    const p = G.player, f = G.cam.fwd, d = [-f[0], -f[1], -f[2]];
    const y = p.y || 0;
    return rayHits([p.x, y + 0.6, p.z], d, box) || rayHits([p.x, y + 1.2, p.z], d, box);
  }
  function draws(dt) {
    const out = [];
    const sc = G.scene;
    for (const s of sc.statics) if (onScreen(s.box)) out.push({ mesh: s.mesh });
    for (const o of sc.occ) {
      if (!onScreen(o.box)) continue;
      const hide = !o.noFade && !G.map.indoor && hidesPlayer(o.box);
      o.fade = lerp(o.fade, hide ? 0.28 : 1, 1 - Math.exp(-dt * 8));
      out.push({ mesh: o.mesh, opacity: o.fade < 0.98 ? o.fade : 1 });
    }
    for (const e of sc.dyn) {
      if (!e.mesh || !onScreen(e.box)) continue;
      let op = 1;
      if (e.k.occ && !G.map.indoor) { const hide = hidesPlayer(e.box); e.fade = lerp(e.fade, hide ? 0.28 : 1, 1 - Math.exp(-dt * 8)); op = e.fade < 0.98 ? e.fade : 1; }
      out.push({ mesh: e.mesh, opacity: op, flash: e.flash, noShadow: e.k.noShadow });
    }
    // people
    const p = G.player;
    pushChar(out, 'player', CHARS.CAST.player, p.x, p.y || 0, p.z, p.yaw, Object.assign({ t: G.t, walk: p.walk, speed: p.speed, talk: UI.speaking('player') ? 1 : 0 }, p.pose || {}));
    for (const a of G.agents) {
      if (a.hidden) continue;
      if (!onScreen([a.x - 1, 0, a.z - 1, a.x + 1, 2, a.z + 1])) continue;
      pushChar(out, a.lookKey || a.id, a.look, a.x, a.y || 0, a.z, a.yaw, Object.assign({ t: G.t + a.t0, walk: a.walk, speed: a.speed, talk: UI.speaking(a.id) ? 1 : 0 }, a.pose || {}));
      if (a.carry) out.push({ mesh: cached('item:' + a.carry, mb => mb.merge(CHARS.itemMesh(a.carry))), model: M4.mul(M4.trs(a.x, (a.y || 0), a.z, a.yaw), M4.trs(0, 0.75, 0.3, 0)) });
    }
    if (G.cat && !G.cat.hidden) {
      const cm = G.meshCache.cat || (G.meshCache.cat = (() => { const c = CHARS.buildCat(); return { body: upload(c.body), head: upload(c.head), tail: upload(c.tail) }; })());
      const c = G.cat, ps = CHARS.poseCat(c.x, c.y || groundY(c.x, c.z), c.z, c.yaw, { t: G.t, walk: c.walk, speed: c.speed, sit: c.sit, sleep: c.sleep });
      for (const k in cm) out.push({ mesh: cm[k], model: ps[k] });
    }
    for (const car of G.cars) {
      if (!onScreen([car.x - 2, 0, car.z - 2, car.x + 2, 2, car.z + 2])) continue;
      out.push({ mesh: carMesh(car.kind, car.col), model: M4.trs(car.x, 0.01, car.z, car.yaw) });
    }
    for (const d of G.extraDraws) { const v = typeof d === 'function' ? d() : d; if (v) out.push(v); }
    return out;
  }
  function pushChar(out, key, look, x, y, z, yaw, st) {
    const m = charMeshes(key, look);
    const ps = CHARS.pose(x, y, z, yaw, st, m.size || 1);
    for (const k of ['legL', 'legR', 'torso', 'armL', 'armR', 'head']) if (m[k]) out.push({ mesh: m[k], model: ps[k] });
    // held item
    if (st.hold) out.push({ mesh: cached('item:' + st.hold, mb => mb.merge(CHARS.itemMesh(st.hold))), model: M4.mul(ps.armR, M4.trs(0, -0.42, 0.05, 0)) });
  }
  function lights() {
    const L = [];
    const nf = G.map.indoor ? 1 : G.night;
    for (const l of G.scene.lights) {
      if (l.night && nf < 0.15) continue;
      L.push(l.night ? Object.assign({}, l, { i: l.i * clamp(nf * 1.3, 0, 1) }) : l);
    }
    for (const car of G.cars) if (car.lights && nf > 0.3) {
      const s = Math.sin(car.yaw), c = Math.cos(car.yaw);
      L.push({ x: car.x + s * 2.4, y: 0.6, z: car.z + c * 2.4, r: 4.5, c: [1, 0.92, 0.75], i: 0.9 });
      if (car.kind === 'police' && car.siren) L.push({ x: car.x, y: 1.5, z: car.z, r: 6, c: Math.sin(G.t * 12) > 0 ? [1, 0.15, 0.2] : [0.2, 0.35, 1], i: 1.6 });
    }
    for (const l of G.extraLights) { const v = typeof l === 'function' ? l() : l; if (v) L.push(v); }
    // a soft pool of light around you after dark, so you can always see where you're walking
    const pg = G.map.indoor && !G.map.underground ? 0 : clamp(nf, 0, 1);
    if (pg > 0.05 && G.player) L.unshift({ x: G.player.x, y: 1.7, z: G.player.z + 0.2, r: 5, c: [0.85, 0.82, 1], i: 0.38 * pg * (G.nightBoost || 1) });
    return L;
  }

  // ---------------- main loop ----------------
  let last = 0, acc = 0;
  function frame(now) {
    requestAnimationFrame(frame);
    if (!G.S || !G.map) return;
    let dt = Math.min(0.05, (now - last) / 1000 || 0.016); last = now;
    if (document.hidden) return;
    // a chore minigame covers the screen: freeze the world so the phone spends its effort on the minigame
    if (UI.inMinigame && UI.inMinigame()) { if (G.frozenDrawn) return; G.frozenDrawn = true; } else G.frozenDrawn = false;
    update(dt);
    updateCamera(dt);
    G.R.lights = lights();
    G.R.render(G.cam, draws(dt), PT, RAIN, G.t, { span: G.map.indoor ? 14 : 24, center: G.cam.real });
    UI.tick();
  }

  // ---------------- input ----------------
  function setupInput() {
    const cv = G.cv;
    const ptrs = new Map();
    let down = null, pinch = null;
    cv.addEventListener('pointerdown', e => {
      SFX.unlock();
      ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (ptrs.size === 2) { const [a, b] = [...ptrs.values()]; pinch = { d: Math.hypot(a.x - b.x, a.y - b.y), z: G.zoom }; down = null; G.input.joy = null; UI.joystick(null); return; }
      down = { x: e.clientX, y: e.clientY, t: performance.now(), drag: false };
      try { cv.setPointerCapture(e.pointerId); } catch (err) { }
    });
    cv.addEventListener('pointermove', e => {
      if (!ptrs.has(e.pointerId)) return;
      ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pinch && ptrs.size === 2) { const [a, b] = [...ptrs.values()]; G.zoom = clamp(pinch.z * Math.hypot(a.x - b.x, a.y - b.y) / pinch.d, 0.6, 1.6); return; }
      if (!down) return;
      const dx = e.clientX - down.x, dy = e.clientY - down.y;
      if (!down.drag && Math.hypot(dx, dy) > 14 && !G.busy && !UI.blocking()) down.drag = true;
      if (down.drag) {
        const R = 56, l = Math.hypot(dx, dy), k = Math.min(1, l / R);
        G.input.joy = { x: dx / (l || 1) * k, y: dy / (l || 1) * k };
        G.input.run = l > R * 1.6;
        UI.joystick(down.x, down.y, dx / (l || 1) * Math.min(l, R), dy / (l || 1) * Math.min(l, R));
      }
    });
    const end = e => {
      ptrs.delete(e.pointerId);
      if (ptrs.size < 2) pinch = null;
      if (!down) return;
      if (!down.drag && performance.now() - down.t < 600) tap(e.clientX, e.clientY);
      down = null; G.input.joy = null; G.input.run = false; UI.joystick(null);
    };
    cv.addEventListener('pointerup', end); cv.addEventListener('pointercancel', end);
    cv.addEventListener('wheel', e => { e.preventDefault(); G.zoom = clamp(G.zoom * (e.deltaY > 0 ? 0.92 : 1.08), 0.6, 1.6); }, { passive: false });
    addEventListener('keydown', e => {
      if (e.target && e.target.tagName === 'INPUT') return;
      SFX.unlock();
      const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      G.input.keys[k] = true; if (e.shiftKey) G.input.keys.Shift = true;
      if (k === 'e' || k === ' ' || k === 'Enter') { if (UI.keyAdvance()) { e.preventDefault(); return; } if (!G.busy && !UI.blocking()) { const t = G.nearest(); if (t) { e.preventDefault(); goInteract(t); } } }
      if (k === 'Escape') UI.escape();
      if (k === 'p' || k === 'tab') { e.preventDefault(); UI.togglePhone(); }
      if (k === 'i') UI.openPhone('bag');
    });
    addEventListener('keyup', e => { const k = e.key.length === 1 ? e.key.toLowerCase() : e.key; G.input.keys[k] = false; if (!e.shiftKey) G.input.keys.Shift = false; });
    addEventListener('blur', () => { G.input.keys = {}; });
  }

  // ---------------- save / load ----------------
  function save() {
    if (!G.S || G.noSave) return;
    const p = G.player;
    if (p) { G.S.x = p.x; G.S.z = p.z; }
    G.S.savedAt = Date.now();
    try {
      const json = JSON.stringify(G.S);
      // keep the previous good save as a backup in case a write is cut off mid-way
      const prev = localStorage.getItem(SAVE_KEY);
      if (prev) localStorage.setItem(SAVE_KEY + '-bak', prev);
      localStorage.setItem(SAVE_KEY, json);
    } catch (e) { }
    if (window.CLOUD && CLOUD.onSaved) CLOUD.onSaved();
  }
  function parseSave(str) { try { const s = str ? JSON.parse(str) : null; return s && s.flags && s.day ? migrate(s) : null; } catch (e) { return null; } }
  // Saves from older versions of the game: keep everything, fill in anything a newer version added.
  function migrate(s) {
    const d = newState(s.name);
    for (const k in d) {
      if (s[k] === undefined || s[k] === null) s[k] = d[k];
      else if (d[k] && typeof d[k] === 'object' && !Array.isArray(d[k]) && typeof s[k] === 'object') for (const j in d[k]) if (s[k][j] === undefined) s[k][j] = d[k][j];
    }
    if (!Array.isArray(s.rooms)) s.rooms = [];
    return s;
  }
  function loadSave() {
    try { return parseSave(localStorage.getItem(SAVE_KEY)) || parseSave(localStorage.getItem(SAVE_KEY + '-bak')); } catch (e) { return null; }
  }
  function clearSave() { try { localStorage.removeItem(SAVE_KEY); localStorage.removeItem(SAVE_KEY + '-bak'); } catch (e) { } }
  // save codes: move a game between Safari and the home-screen app, or to another phone
  function exportSave() { save(); const s = loadSave(); if (!s) return ''; return 'NV1.' + btoa(unescape(encodeURIComponent(JSON.stringify(s)))); }
  function importSave(code) {
    code = (code || '').trim().replace(/\s+/g, '');
    if (!code.startsWith('NV1.')) return null;
    let s; try { s = parseSave(decodeURIComponent(escape(atob(code.slice(4))))); } catch (e) { return null; }
    if (!s) return null;
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(s)); } catch (e) { return null; }
    return s;
  }
  G.save = save; G.loadSave = loadSave; G.clearSave = clearSave; G.exportSave = exportSave; G.importSave = importSave;
  setInterval(() => { if (G.S && !G.busy) save(); }, 15000);
  // phones kill backgrounded apps without warning, so save the moment the game is hidden
  const saveNow = () => { if (G.S) save(); };
  document.addEventListener('visibilitychange', () => { if (document.hidden) saveNow(); });
  addEventListener('pagehide', saveNow);
  try { navigator.storage && navigator.storage.persist && navigator.storage.persist().catch(() => { }); } catch (e) { }

  // ---------------- boot ----------------
  function resize() {
    const dpr = Math.min(devicePixelRatio || 1, G.lowGfx ? 1.5 : 3);
    const w = Math.round(innerWidth * dpr), h = Math.round(innerHeight * dpr);
    // aim for roughly 270 art pixels across the short side
    // aim for roughly 290 art pixels on the short side (landscape is the main layout)
    const short = Math.min(w, h);
    const scale = Math.max(2, Math.round(short / 290));
    G.R.resize(w, h, scale);
  }
  G.resize = resize;
  G.boot = function () {
    G.cv = document.getElementById('view');
    try { G.lowGfx = localStorage.getItem('nv-gfx') === 'fast'; } catch (e) { }
    G.R = new GL3.Renderer(G.cv, { shadowSize: G.lowGfx ? 1024 : 2048, preserve: !!window.__TEST });
    resize();
    addEventListener('resize', resize);
    setupInput();
    requestAnimationFrame(frame);
  };
  G.start = function (S) {
    G.S = S;
    if (SIM.init) SIM.init(S);
    G.raining = S.weather === 'rain';
    G.envSnap = true;
    loadMap(S.map || 'city', S.x, S.z, S.dir);
    UI.refreshHud();
  };
  G.PT = PT; G.HOUR = HOUR; G.DIRS = DIRS; G.clamp = clamp; G.lerp = lerp; G.angLerp = angLerp;
  window.G = G;
})();
