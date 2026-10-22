// World simulation: guests and rooms, money, market prices, police heat, traffic, pedestrians, the cat.
(function () {
  const D = DATA;
  const SIM = {};
  const rnd = (a, b) => a + Math.random() * (b - a);
  const pick = a => a[Math.floor(Math.random() * a.length)];
  const S = () => G.S;
  const abs = () => (S().day - 1) * 1440 + S().clock;
  SIM.abs = abs;

  // ---------------- init ----------------
  SIM.init = function (s) {
    if (!s.rooms || !s.rooms.length) {
      s.rooms = [];
      for (let k = 0; k < 12; k++) s.rooms.push({ state: k < 2 ? 'dirty' : 'broken', guest: null, tasks: k < 2 ? dirtyTasks() : brokenTasks(), request: null });
    }
    if (!s.prices || !Object.keys(s.prices).length) rollPrices(s);
    s.lastMin = s.lastMin || abs();
    s.inv = s.inv || {}; s.stash = s.stash || {};
  };
  function dirtyTasks() { return { bed: 1, trash1: Math.random() < 0.7 ? 1 : 0, trash2: Math.random() < 0.6 ? 1 : 0, stain: Math.random() < 0.4 ? 1 : 0, bath: 1 }; }
  function brokenTasks() { return { bed: 1, trash1: 1, trash2: 1, stain: 1, bath: 1, hole: 1, wiring: 1 }; }
  SIM.dirtyTasks = dirtyTasks;
  function rollPrices(s) {
    s.prices = {};
    for (const k of D.HOT) s.prices[k] = Math.round(rnd(0.75, 1.3) * 100) / 100;
    const tip = pick(['smokes', 'shine', 'kicks', 'perfume', 'carts', 'phone', 'watch']);
    s.prices[tip] = 0.6; s.flags.tipItem = tip;
    s.flags.hotDemand = pick(D.HOT.filter(k => !D.ITEMS[k].rare));
  }

  // ---------------- inventory & money ----------------
  const count = it => S().inv[it] || 0;
  SIM.count = count;
  SIM.capacity = () => 8 + (count('duffel') ? 8 : 0);
  SIM.carried = () => Object.entries(S().inv).filter(([k]) => !D.ITEMS[k] || (!D.ITEMS[k].story && !D.ITEMS[k].tool)).reduce((a, [, n]) => a + n, 0);
  SIM.hotCount = () => Object.entries(S().inv).reduce((a, [k, n]) => a + (D.ITEMS[k] && D.ITEMS[k].hot ? n * D.ITEMS[k].hot : 0), 0);
  SIM.give = function (it, n = 1) { S().inv[it] = count(it) + n; };
  SIM.take = function (it, n = 1) { S().inv[it] = Math.max(0, count(it) - n); if (!S().inv[it]) delete S().inv[it]; };
  SIM.stashCount = () => Object.values(S().stash).reduce((a, n) => a + n, 0);
  SIM.stashCap = () => (S().upgrades.safe2 ? 40 : 15);
  SIM.money = n => { S().money = Math.round(S().money + n); if (n > 0) S().stats.earned += n; UI.refreshHud(); if (n) UI.moneyPop(n); };
  SIM.price = (it, who) => {
    const base = D.ITEMS[it].base || D.ITEMS[it].price || 10;
    if (who && D.VENDORS[who] && D.VENDORS[who].legit) return D.ITEMS[it].price || base;
    return Math.max(1, Math.round(base * (S().prices[it] || 1)));
  };
  SIM.buyPrice = (it, buyer) => {
    const b = D.BUYERS[buyer]; if (!b || !b.buys[it]) return 0;
    const base = D.ITEMS[it].base;
    const demand = S().flags.hotDemand === it ? 1.25 : 1;
    return Math.round(base * b.buys[it] * demand * (0.92 + (S().prices[it] || 1) * 0.1));
  };

  // ---------------- rooms ----------------
  SIM.roomCount = () => D.TIER[S().tier].rooms;
  SIM.individualRooms = () => S().tier <= 3;
  SIM.cleanRooms = () => S().rooms.slice(0, Math.min(12, SIM.roomCount())).map((r, i) => [r, i]).filter(([r]) => r.state === 'clean');
  SIM.vacancy = function () {
    if (S().tier >= 4) return S().flags.occupancy == null || S().flags.occupancy < 0.97;
    return SIM.cleanRooms().length > 0;
  };
  SIM.rate = () => Math.round(D.TIER[S().tier].rate * (0.8 + S().rep * 0.1));
  SIM.setRoom = function (k, st) {
    const r = S().rooms[k]; r.state = st;
    if (st === 'dirty') r.tasks = dirtyTasks();
    if (st === 'clean') r.tasks = {};
    if (G.mapId === 'city') G.refresh('room' + (k + 1));
    UI.refreshHud();
  };
  SIM.roomTasksLeft = r => Object.values(r.tasks || {}).filter(Boolean).length;

  // ---------------- guests ----------------
  let gid = 0;
  function newGuest(typeKey, opts = {}) {
    const T = D.GUESTS[typeKey];
    const g = {
      id: 'g' + Date.now().toString(36) + (gid++), type: typeKey, name: pick(T.names), seed: Math.floor(Math.random() * 1e6),
      nights: Math.floor(rnd(T.nights[0], T.nights[1] + 1)), state: 'arriving', arrive: abs(), room: null, request: null, happy: 0.6, narc: !!T.narc, vip: !!T.vip,
    };
    Object.assign(g, opts);
    S().guests.push(g);
    return g;
  }
  SIM.newGuest = newGuest;
  function guestType() {
    const s = S();
    const pool = [];
    for (const [k, T] of Object.entries(D.GUESTS)) {
      let w = T.weight;
      if (k === 'narc') w = s.heat >= 2 ? 1 + s.heat * 0.6 : (s.day >= 3 ? 0.6 : 0);
      if (k === 'celeb') w = s.tier >= 3 ? s.tier - 2 : 0;
      for (let i = 0; i < Math.round(w * 2); i++) pool.push(k);
    }
    return pick(pool);
  }
  SIM.lookFor = g => {
    const T = D.GUESTS[g.type];
    const look = CHARS.randomLook(g.seed, g.type === 'couple' ? 'couple' : g.type === 'celeb' ? 'celeb' : g.type);
    return look;
  };
  SIM.waiting = () => S().guests.filter(g => g.state === 'waiting');
  SIM.staying = () => S().guests.filter(g => g.state === 'staying');
  // check a guest in: returns the room index or -1
  SIM.checkIn = function (g, roomIdx) {
    const s = S();
    if (s.tier >= 4) {
      g.state = 'staying'; g.room = -1;
      const pay = Math.round(SIM.rate() * g.nights * (g.vip ? 2.5 : 1));
      SIM.money(pay); s.stats.guests++;
      g.paid = pay;
      return -1;
    }
    const clean = SIM.cleanRooms();
    if (!clean.length) return null;
    const [r, k] = roomIdx != null ? [s.rooms[roomIdx], roomIdx] : clean[0];
    g.state = 'staying'; g.room = k; r.guest = g.id; r.request = null;
    r.state = 'occupied';
    const pay = SIM.rate() * g.nights;
    g.paid = pay;
    g.happy = 0.55 + (r.linens ? 0.15 : 0) + (s.upgrades.arcade ? 0.05 : 0) + (s.tier - 1) * 0.06 - Math.min(0.3, (abs() - g.arrive - 5) / 400);
    r.linens = false;
    SIM.money(pay); s.stats.guests++;
    if (G.mapId === 'city') G.refresh('room' + (k + 1));
    UI.refreshHud();
    return k;
  };
  SIM.turnAway = function (g) { g.state = 'gone'; if (!g.narc) S().rep = Math.max(0, S().rep - 0.05); };
  function checkout(g) {
    const s = S();
    g.state = 'gone';
    const rating = Math.max(0, Math.min(1, g.happy + (g.requestDone ? 0.15 : 0) - (g.requestFailed ? 0.1 : 0)));
    s.rep = Math.max(0, Math.min(5, s.rep * 0.9 + rating * 5 * 0.1));
    const tip = Math.round(rating > 0.7 ? SIM.rate() * 0.3 * (D.GUESTS[g.type].tip || 1) : 0);
    if (tip > 0) { SIM.money(tip); }
    if (g.room >= 0 && g.room != null) { const r = s.rooms[g.room]; r.guest = null; r.request = null; SIM.setRoom(g.room, 'dirty'); }
    s.log.unshift({ day: s.day, text: `${g.name} checked out ${'★'.repeat(Math.round(rating * 5))}${tip ? ' (tip $' + tip + ')' : ''}` });
    s.log.length = Math.min(s.log.length, 30);
  }
  // a guest asks for something (shows as a light over their door)
  function maybeRequest(g) {
    if (g.request || g.room == null || g.room < 0) return;
    const T = D.GUESTS[g.type];
    const it = Math.random() < 0.3 ? S().flags.hotDemand : pick(T.wants);
    if (!D.ITEMS[it] || D.ITEMS[it].story) return;
    const base = D.ITEMS[it].base || D.ITEMS[it].price || 10;
    const pay = Math.round(base * rnd(1.9, 2.8) * (T.tip || 1) / 5) * 5;
    g.request = { item: it, pay, at: abs() };
    const r = S().rooms[g.room]; r.request = g.request;
    if (G.mapId === 'city') G.refresh('room' + (g.room + 1));
    if (!G.busy) UI.toast(`Room ${g.room + 1} is asking for ${D.ITEMS[it].name.toLowerCase()}`, 'req');
  }
  SIM.guestInRoom = k => S().guests.find(g => g.state === 'staying' && g.room === k);

  // ---------------- daily ----------------
  SIM.newDay = function () {
    const s = S();
    rollPrices(s);
    // mostly dry: a rainy day now and then, showers come and go during the day (see extras.js)
    s.weather = Math.random() < 0.2 ? 'rain' : 'clear';
    G.raining = s.weather === 'rain';
    if (G.raining) s.flags.wetGround = 1; else s.flags.wetGround = Math.random() < 0.15 ? 1 : 0;
    s.flags.raidDay = null;
    // the rival tower grows
    s.flags.towerFloors = Math.min(9, (s.flags.towerFloors || 0) + (s.flags.vanceStopped ? 0 : 0.5));
    if (G.mapId === 'city') G.refresh('tower');
    if (STORY.onNewDay) STORY.onNewDay();
    UI.refreshHud();
  };
  function minuteEvents(m) {
    const s = S(), h = (m % 1440) / 60;
    // guest arrivals: afternoon to after midnight
    const arriveHours = h >= 10 || h < 2;
    if (arriveHours && s.flags.openForBusiness) {
      const vac = SIM.vacancy();
      const pending = s.guests.filter(g => g.state === 'arriving' || g.state === 'waiting').length;
      // busier from the start; evenings are the rush
      const evening = h >= 17 || h < 1 ? 1.4 : 1;
      const early = s.day <= 4 ? 1.5 : 1;
      const rate = (0.008 + s.rep * 0.0026) * evening * early * (s.tier >= 4 ? 2.2 : 1) * (vac ? 1 : 0.25);
      if (pending < 3 && Math.random() < rate) spawnArrival(guestType());
    }
    for (const g of s.guests) {
      if (g.state === 'arriving' && m - g.arrive > 8) { g.state = 'waiting'; g.waitStart = m; SIM.onGuestWaiting(g); }
      if (g.state === 'waiting' && m - (g.waitStart || g.arrive) > 150) { g.state = 'gone'; s.rep = Math.max(0, s.rep - 0.12); UI.toast(`${g.name} got tired of waiting and left.`, 'bad'); removeGuestAgent(g); }
      if (g.state === 'waiting' && s.staff.clerk && m - (g.waitStart || g.arrive) > 20 && G.mapId !== 'office' && G.mapId !== 'lobby') {
        if (!g.narc || Math.random() < 0.5) { const k = SIM.checkIn(g); if (k != null) { UI.toast(`Night clerk checked in ${g.name}.`); removeGuestAgent(g); } } else SIM.turnAway(g);
      }
      if (g.state === 'staying' && (h >= 17 || h < 3) && !g.requestDone && !g.requestFailed && Math.random() < 0.006) maybeRequest(g);
      if (g.state === 'staying' && g.request && m - g.request.at > 300) { g.requestFailed = true; g.request = null; if (g.room >= 0) { s.rooms[g.room].request = null; if (G.mapId === 'city') G.refresh('room' + (g.room + 1)); } }
    }
    // checkout at 11:00
    if (m % 1440 === 11 * 60) {
      for (const g of s.guests) if (g.state === 'staying') { g.nightsLeft = (g.nightsLeft == null ? g.nights : g.nightsLeft) - 1; if (g.nightsLeft <= 0) checkout(g); }
      s.guests = s.guests.filter(g => g.state !== 'gone');
      if (s.tier >= 4) abstractNight();
    }
    // nightly passive income at 03:00
    if (m % 1440 === 3 * 60) {
      let inc = 0;
      for (const [k, a] of Object.entries(D.ADDONS)) if (s.upgrades[k] && a.income) inc += a.income;
      if (s.upgrades.backroom && s.stash.shine) { const n = Math.min(4, s.stash.shine); s.stash.shine -= n; if (!s.stash.shine) delete s.stash.shine; inc += n * D.ITEMS.shine.base * 2; }
      if (inc) { SIM.money(inc); s.log.unshift({ day: s.day, text: `Night income: $${inc}` }); }
    }
    // wages at 06:00
    if (m % 1440 === 6 * 60) {
      let w = 0; for (const k of Object.keys(s.staff)) if (s.staff[k] && D.STAFF[k] && !(k === 'clerk' && s.flags.rayClerk)) w += D.STAFF[k].wage;
      if (w) { SIM.money(-w); s.log.unshift({ day: s.day, text: `Staff wages: -$${w}` }); }
    }
    // housekeeper
    if (s.staff.housekeeper && m % 90 === 0 && h >= 9 && h < 21) {
      const k = s.rooms.slice(0, Math.min(12, SIM.roomCount())).findIndex(r => r.state === 'dirty');
      if (k >= 0) { SIM.setRoom(k, 'clean'); s.rooms[k].linens = true; }
    }
    // heat cools
    if (m % 60 === 0) s.heat = Math.max(0, s.heat - (0.04 + (s.upgrades.cameras ? 0.02 : 0) + (s.staff.guard ? 0.03 : 0)));
    // raids when the heat is high
    if (h === 23 && s.heat >= 4 && s.flags.raidDay !== s.day && !s.flags.noRaids) { s.flags.raidDay = s.day; if (STORY.raid) G.run(STORY.raid); }
    if (STORY.onMinute) STORY.onMinute(m);
  }
  function abstractNight() {
    const s = S(), T = D.TIER[s.tier];
    const occ = Math.min(1, 0.35 + s.rep * 0.13 + (s.upgrades.arcade ? 0.03 : 0));
    s.flags.occupancy = occ;
    const inc = Math.round(T.rooms * occ * SIM.rate() * 0.5);
    SIM.money(inc);
    s.log.unshift({ day: s.day, text: `Hotel night: ${Math.round(occ * 100)}% full, +$${inc}` });
  }
  function spawnArrival(type) {
    const g = newGuest(type);
    if (G.mapId === 'city') spawnGuestAgent(g, 'arrive');
    return g;
  }
  SIM.spawnArrival = spawnArrival;
  SIM.onGuestWaiting = function (g) {
    if (G.mapId === 'office' || G.mapId === 'lobby') { spawnGuestAgent(g, 'queue'); SFX.play('bell'); }
    if (!G.busy) UI.toast(`A guest is waiting at the front desk.`, 'guest');
  };

  // ---------------- agents for guests ----------------
  function queueSpot(i) { return G.mapId === 'lobby' ? [5 + i * 0.9, 5.2 + (i % 2) * 0.3] : [3.3 + i * 0.9, 4.6 + (i % 2) * 0.25]; }
  function spawnGuestAgent(g, mode) {
    if (G.agent(g.id)) return;
    const look = SIM.lookFor(g);
    if (mode === 'arrive') {
      const fromNorth = Math.random() < 0.5;
      const a = G.addAgent({ id: g.id, kind: 'guest', guest: g, name: g.name, look, lookKey: 'g' + g.seed, x: 25.6, z: fromNorth ? 6 : 52, spd: 2.0, carry: 'bag' });
      const d = MOTEL.frontDoor(S().tier);
      G.walkAgent(a, d.x + (S().tier <= 3 ? 0.4 : 0), d.z + (S().tier <= 3 ? 0 : 0.6)).then(() => { G.removeAgent(a); });
    } else if (mode === 'queue') {
      const i = SIM.waiting().indexOf(g);
      const [x, z] = queueSpot(Math.max(0, i));
      const ex = G.map.spawn;
      const a = G.addAgent({ id: g.id, kind: 'guest', guest: g, name: g.name, look, lookKey: 'g' + g.seed, x: ex.x, z: ex.z, spd: 2.0, carry: 'bag', icon: 'bell' });
      G.walkAgent(a, x, z).then(() => { a.faceYaw = Math.PI; });
    } else if (mode === 'room') {
      const d = MOTEL.roomDoor(g.room, S().tier);
      const a = G.addAgent({ id: g.id, kind: 'guest', guest: g, name: g.name, look, lookKey: 'g' + g.seed, x: d.x + 0.6, z: d.z + 0.8, spd: 1.8 });
      a.faceYaw = Math.random() * 6;
      a.pose = Math.random() < 0.5 ? { phone: true } : {};
      a.loiter = { x: d.x, z: d.z + 0.8 };
    }
  }
  SIM.spawnGuestAgent = spawnGuestAgent;
  function removeGuestAgent(g) { const a = G.agent(g.id); if (a) G.removeAgent(a); }
  SIM.removeGuestAgent = removeGuestAgent;
  SIM.guestToRoom = function (g) {
    const a = G.agent(g.id);
    if (!a) return;
    if (G.mapId === 'office' || G.mapId === 'lobby') { const ex = G.map.spawn; G.walkAgent(a, ex.x, ex.z).then(() => G.removeAgent(a)); }
  };

  // ---------------- populate a map with people & cars ----------------
  SIM.populate = function (mapId, restored) {
    if (G.map && G.map.onPopulate) G.map.onPopulate(restored);
    const s = S();
    // story characters
    for (const n of STORY.npcs(mapId)) G.addAgent(Object.assign({ kind: 'npc' }, n));
    if (mapId === 'office' || mapId === 'lobby') SIM.waiting().forEach(g => spawnGuestAgent(g, 'queue'));
    const outdoor = G.map && G.map.outdoor;
    if (outdoor && restored) {
      // the street kept going while you were inside; just top up the police if heat rose
      const want = Math.min(4, 1 + Math.floor(s.heat)), have = G.agents.filter(a => a.kind === 'cop').length;
      if (have < want) spawnCops(have);
      return;
    }
    if (mapId === 'city') {
      // guests hanging out by their rooms in the evening
      const h = G.hour();
      if (s.tier <= 3) for (const g of SIM.staying()) if (g.room >= 0 && (h > 17 || h < 1) && Math.random() < 0.45) spawnGuestAgent(g, 'room');
      SIM.spawnCat();
    }
    if (outdoor) {
      spawnTraffic();
      for (let i = 0; i < (G.lowGfx ? 5 : (G.map.peds || 10)); i++) spawnPed(true);
      spawnCops();
    }
    if (mapId === 'office' && !(G.worlds && G.worlds.city && G.worlds.city.cat)) SIM.spawnCat(true);
  };
  SIM.spawnCat = function (inside) {
    if (S().flags.noCat) return;
    if (inside) { if (Math.random() < 0.5) G.cat = { x: 1.6, z: 6.3, yaw: 1, speed: 0, walk: 0, sit: true, sleep: true, home: [1.6, 6.3] }; return; }
    G.cat = { x: 16.5, z: 33, yaw: 0, speed: 0, walk: 0, sit: true, home: [16.5, 33], t: 0 };
  };
  SIM.stepCat = function (c, dt) {
    c.t = (c.t || 0) - dt;
    if (c.path && c.path.length) {
      const [tx, tz] = c.path[0]; const dx = tx - c.x, dz = tz - c.z, d = Math.hypot(dx, dz);
      if (d < 0.1) c.path.shift(); else { const st = Math.min(d, 1.6 * dt); c.x += dx / d * st; c.z += dz / d * st; c.yaw = G.angLerp(c.yaw, Math.atan2(dx, dz), 1 - Math.exp(-dt * 8)); c.speed = 1; }
      if (!c.path.length) c.path = null;
    } else { c.speed = 0; }
    c.walk = (c.walk || 0) + dt * 8 * c.speed;
    c.sit = !c.path;
    if (c.t <= 0 && !c.sleep) {
      c.t = 4 + Math.random() * 8;
      const p = G.player, dp = Math.hypot(p.x - c.x, p.z - c.z);
      let tx, tz;
      if (dp < 7 && Math.random() < 0.5) { tx = p.x + (Math.random() - 0.5) * 1.6; tz = p.z + 0.8; }
      else { tx = c.home[0] + (Math.random() - 0.5) * 5; tz = c.home[1] + (Math.random() - 0.5) * 5; }
      if (G.walkableTile(Math.floor(tx), Math.floor(tz))) G.pathTo(c, tx, tz);
    }
  };

  // ---------------- traffic ----------------
  const LANES0 = [
    { axis: 'z', x: 27.25, dir: 1, from: -30, to: 110 },    // southbound
    { axis: 'z', x: 30.75, dir: -1, from: 110, to: -30 },   // northbound
    { axis: 'x', z: 47.25, dir: -1, from: 48, to: -30 },    // westbound
    { axis: 'x', z: 50.75, dir: 1, from: -30, to: 46 },     // eastbound (ends at the pier)
  ];
  const CAR_COLS = ['#c8443c', '#2f6a9a', '#e8e2d8', '#3a3a44', '#3a8a5a', '#8a4a9a', '#e8833a', '#5a6a7a', '#d8c25a'];
  function spawnTraffic() {
    G.cars = [];
    const n = G.lowGfx ? 6 : (G.map.cars || 10);
    for (let i = 0; i < n; i++) {
      const LANES = G.map.lanes || LANES0;
      const L = LANES[i % LANES.length];
      let pos = 0;
      for (let k = 0; k < 12; k++) { pos = L.from + (L.to - L.from) * Math.random(); if (!G.cars.some(c => c.lane === L && Math.abs(c.pos - pos) < 6) && !(G.map.junctions || []).some(j => L.axis === 'z' ? pos > j.z0 - 2 && pos < j.z1 + 2 : pos > j.x0 - 2 && pos < j.x1 + 2)) break; }
      addCar(L, pos);
    }
  }
  function addCar(L, pos) {
    const r = Math.random();
    const kind = r < 0.15 ? 'taxi' : r < 0.25 ? 'van' : r < 0.3 && S().heat >= 1 ? 'police' : r < 0.36 ? 'sports' : 'sedan';
    const car = { lane: L, kind, col: kind === 'taxi' ? '#e8c13c' : kind === 'police' ? '#e8e2d8' : pick(CAR_COLS), pos, speed: rnd(4.5, 7), v: 0, lights: true, siren: kind === 'police' && S().heat >= 3 };
    placeCar(car);
    G.cars.push(car);
    return car;
  }
  function placeCar(c) {
    const L = c.lane;
    if (L.axis === 'z') { c.x = L.x; c.z = c.pos; c.yaw = L.dir > 0 ? 0 : Math.PI; }
    else { c.z = L.z; c.x = c.pos; c.yaw = L.dir > 0 ? Math.PI / 2 : -Math.PI / 2; }
  }
  // car bodies as rectangles [x, z, w, d] (cars only ever drive along the two axes)
  const CAR_HL = 1.15, CAR_HW = 0.55;
  function carRect(c) { const hl = c.kind === 'van' ? 1.25 : CAR_HL; return c.lane.axis === 'z' ? [c.x - CAR_HW, c.z - hl, CAR_HW * 2, hl * 2] : [c.x - hl, c.z - CAR_HW, hl * 2, CAR_HW * 2]; }
  SIM.carRect = carRect;
  // traffic signals: Sunset/Grand (z axis) and the cross streets (x axis) take turns
  const CYC = 24;
  function signal(axis, t) {
    const k = ((t != null ? t : G.t) % CYC + CYC) % CYC;
    if (axis === 'z') return k < 9 ? 'g' : k < 11.5 ? 'y' : 'r';
    return k >= 12 && k < 21 ? 'g' : k >= 21 && k < 23.5 ? 'y' : 'r';
  }
  SIM.signal = signal;
  function stepTraffic(dt) {
    const p = G.player, J = G.map.junctions || [];
    for (const c of G.cars) {
      const L = c.lane, d = L.dir, hl = c.kind === 'van' ? 1.25 : CAR_HL;
      // how far the front bumper can roll before touching something in our lane (or crossing it)
      let block = 99, byCar = false;
      const lat0 = (L.axis === 'z' ? L.x : L.z) - CAR_HW - 0.05, lat1 = lat0 + CAR_HW * 2 + 0.1;
      const test = (q, isCar) => {
        const l0 = L.axis === 'z' ? q[0] : q[1], l1 = l0 + (L.axis === 'z' ? q[2] : q[3]);
        if (l1 < lat0 || l0 > lat1) return;
        const b0 = L.axis === 'z' ? q[1] : q[0], b1 = b0 + (L.axis === 'z' ? q[3] : q[2]);
        const a0 = Math.min((b0 - c.pos) * d, (b1 - c.pos) * d), a1 = Math.max((b0 - c.pos) * d, (b1 - c.pos) * d);
        if (a1 < -hl + 0.2) return;                    // behind us
        const gap = Math.max(0, a0 - hl);
        if (gap < block) { block = gap; byCar = isCar; }
      };
      if (!p.hidden) test([p.x - 0.3, p.z - 0.3, 0.6, 0.6], false);
      for (const a of G.agents) if (!a.hidden) test([a.x - 0.3, a.z - 0.3, 0.6, 0.6], false);
      if (!(c.ghostT > 0)) for (const o of G.cars) if (o !== c) test(carRect(o), true);
      // red or amber light ahead: stop at the line (amber only if we can still stop)
      const st = signal(L.axis);
      if (st !== 'g') for (const j of J) {
        const lo = L.axis === 'z' ? j.x0 : j.z0, hi = L.axis === 'z' ? j.x1 : j.z1, lane = L.axis === 'z' ? L.x : L.z;
        if (lane < lo || lane > hi) continue;
        const entry = L.axis === 'z' ? (d > 0 ? j.z0 : j.z1) : (d > 0 ? j.x0 : j.x1);
        const gap = (entry - c.pos) * d - hl - 0.4;
        if (gap < -0.3 || gap > 9) continue;
        if (st === 'y' && gap < 1.5 && c.v > 2) continue; // too close to stop: go through
        if (gap < block) { block = Math.max(0, gap); byCar = false; }
      }
      const target = block < 0.35 ? 0 : block < 3.5 ? Math.min(c.speed, block * 1.4) : c.speed;
      c.v = G.lerp(c.v, target, 1 - Math.exp(-dt * (target < c.v ? 8 : 1.5)));
      if (block < 0.35) c.v = 0;
      // two cars nose to nose in a junction: after a while the one that's stuck edges through
      c.stuck = c.v < 0.05 && byCar ? (c.stuck || 0) + dt : 0;
      if (c.stuck > 7) { c.ghostT = 2.5; c.stuck = 0; }
      if (c.ghostT > 0) c.ghostT -= dt;
      if (block < 3 && block > 0.05 && !byCar && Math.hypot(p.x - c.x, p.z - c.z) < 3.5 && !c.honked && c.v < 0.5) { c.honked = true; SFX.play('horn'); setTimeout(() => { c.honked = false; }, 5000); }
      c.pos += c.v * d * dt;
      if ((d > 0 && c.pos > L.to) || (d < 0 && c.pos < L.to)) { c.pos = L.from; c.col = pick(CAR_COLS); c.v = c.speed * 0.6; }
      placeCar(c);
      if (c.kind === 'police') c.siren = S().heat >= 3 || !!S().flags.chase;
    }
  }

  // ---------------- pedestrians ----------------
  const WALKS0 = [[25.2, 2], [25.2, 76], [32.8, 2], [32.8, 76], [2, 45], [48, 45], [2, 52.8], [48, 52.8], [16, 4], [40, 44.6], [8, 53], [36, 53]];
  // pedestrians keep to sidewalks and cross at crosswalks, waiting for cars
  function inCross(x, z) { for (const c of G.map.crosswalks || []) if (x >= c.x0 && x <= c.x1 && z >= c.z0 && z <= c.z1) return c; return null; }
  const pedFilter = (x, z) => G.map.tile(x, z) !== 'road' || !!inCross(x, z);
  function pedGate(a) {
    const [nx, nz] = a.path[0];
    const here = G.map.tile(Math.floor(a.x), Math.floor(a.z));
    if (here === 'road') return true; // already crossing: keep going
    const c = inCross(Math.floor(nx), Math.floor(nz));
    if (!c) return true;
    for (const car of G.cars) {
      const L = car.lane, dir = L.dir;
      // distance along the lane to the crossing, positive = still coming
      const along = L.axis === 'z' ? ((c.z0 + c.z1 + 1) / 2 - car.pos) * dir : ((c.x0 + c.x1 + 1) / 2 - car.pos) * dir;
      const onRoad = L.axis === 'z' ? c.across === 'z' : c.across === 'x';
      if (onRoad && along > -1.5 && along < 9 && car.v > 0.3) return false;
    }
    return true;
  }
  SIM.pedFilter = pedFilter; SIM.pedGate = pedGate;
  let pedN = 0;
  function spawnPed(anywhere) {
    if (G.agents.filter(a => a.kind === 'ped').length >= (G.lowGfx ? 5 : (G.map.peds || 10) + 1)) return;
    const seed = Math.floor(Math.random() * 160); // a pool of 160 different faces and outfits
    pedN++;
    const WALKS = G.map.walks || WALKS0;
    const start = pick(WALKS);
    let x = start[0], z = start[1];
    if (anywhere) { const b = pick(WALKS); const t = Math.random(); x = start[0] + (b[0] - start[0]) * t; z = start[1] + (b[1] - start[1]) * t; const n = G.nearestWalkable(x, z); if (n) { x = n[0]; z = n[1]; } }
    const look = CHARS.randomLook(seed, 'ped');
    if (!pedFilter(Math.floor(x), Math.floor(z))) { const n = nearestPedTile(x, z); if (n) { x = n[0]; z = n[1]; } }
    const a = G.addAgent({ id: 'p' + seed + '_' + pedN, kind: 'ped', look, lookKey: 'p' + seed, x, z, spd: rnd(1.3, 2.1), ghost: true, walkFilter: pedFilter, gate: pedGate });
    if (Math.random() < 0.2) a.pose = { phone: true };
    pedNext(a);
  }
  function nearestPedTile(x, z) {
    let best = null, bd = 1e9;
    for (let dz = -5; dz <= 5; dz++) for (let dx = -5; dx <= 5; dx++) { const tx = Math.floor(x) + dx, tz = Math.floor(z) + dz; if (G.walkableTile(tx, tz) && pedFilter(tx, tz)) { const d = dx * dx + dz * dz; if (d < bd) { bd = d; best = [tx + 0.5, tz + 0.5]; } } }
    return best;
  }
  function pedNext(a) {
    const t = pick(G.map.walks || WALKS0);
    if (!G.pathTo(a, t[0] + rnd(-0.3, 0.3), t[1])) { G.removeAgent(a); return; }
    a.onArrive = () => { if (Math.random() < 0.5) { G.removeAgent(a); spawnPed(false); } else pedNext(a); };
  }

  // ---------------- police ----------------
  const BEATS0 = [[[25.2, 30], [25.2, 60], [12, 53], [25.2, 60]], [[32.8, 10], [32.8, 44], [45, 44.8], [32.8, 44]], [[8, 45.2], [24.6, 45.2], [24.6, 30], [24.6, 45.2]], [[3.2, 6], [22, 6], [24.6, 20], [22, 6]]];
  function spawnCops(from = 0) {
    const s = S();
    const n = Math.min(4, 1 + Math.floor(s.heat));
    for (let i = from; i < n; i++) {
      const BEATS = G.map.beats || BEATS0;
      const beat = BEATS[i % BEATS.length];
      // start somewhere along the beat, not always at the same corner
      const bi = Math.floor(Math.random() * beat.length), a0 = beat[bi], a1 = beat[(bi + 1) % beat.length], t = Math.random();
      const [x, z] = G.nearestWalkable(a0[0] + (a1[0] - a0[0]) * t, a0[1] + (a1[1] - a0[1]) * t) || a0;
      const isReyes = i === 0 && s.flags.metReyes && G.mapId === 'city';
      const a = G.addAgent({ id: isReyes ? 'reyes' : 'cop' + i, kind: 'cop', name: isReyes ? 'Officer Reyes' : 'Officer', look: isReyes ? CHARS.CAST.reyes : CHARS.CAST.cop, lookKey: isReyes ? 'reyes' : 'cop', x, z, spd: 1.5, beat, bi: bi + 1, susp: 0 });
      copNext(a);
    }
  }
  function copNext(a) {
    if (a.stopped) return;
    const t = a.beat[a.bi % a.beat.length]; a.bi++;
    if (!G.pathTo(a, t[0], t[1])) a.path = [[t[0], t[1]]];
    a.onArrive = () => { a.wait = rnd(1, 4); a.faceYaw = Math.random() * 6; };
  }
  function stepCops(dt) {
    const p = G.player, s = S();
    const hot = SIM.hotCount();
    for (const a of G.agents) {
      if (a.kind !== 'cop') continue;
      if (a.wait != null) { a.wait -= dt; if (a.wait <= 0) { a.wait = null; copNext(a); } }
      if (a.stopped || G.busy || G.map.indoor) continue;
      const dx = p.x - a.x, dz = p.z - a.z, d = Math.hypot(dx, dz);
      const facing = Math.sin(a.yaw) * dx / (d || 1) + Math.cos(a.yaw) * dz / (d || 1);
      const sees = d < 3.6 && (facing > 0.2 || d < 1.6);
      if (hot > 0 && sees) a.susp = Math.min(1, a.susp + dt * (0.22 + Math.min(0.5, hot * 0.035) + s.heat * 0.05) * (SIM.count('scanner') ? 0.7 : 1));
      else a.susp = Math.max(0, a.susp - dt * 0.25);
      a.icon = a.susp > 0.65 ? 'alert' : a.susp > 0.15 ? 'suspect' : null;
      if (a.susp >= 1) { a.susp = 0; a.icon = null; a.stopped = true; a.path = null; G.run(() => STORY.stopAndSearch(a)).then(() => { a.stopped = false; copNext(a); }); }
    }
  }
  // traffic, patrols and passers-by while the player is indoors (G is pointed at the street)
  SIM.stepWorld = function (dt) {
    stepTraffic(dt);
    for (const a of G.agents) if (a.kind === 'cop' && a.wait != null) { a.wait -= dt; if (a.wait <= 0) { a.wait = null; copNext(a); } }
    if (Math.random() < dt * 0.15) spawnPed(false);
  };
  SIM.heat = function (n, why) {
    const s = S();
    s.heat = Math.max(0, Math.min(5, s.heat + n));
    if (n > 0) UI.heatPop(n, why);
    UI.refreshHud();
  };

  // story characters come and go with flags and the hour
  SIM.syncNpcs = function (force) {
    if (!G.map || (G.busy && !force)) return;
    const want = STORY.npcs(G.mapId);
    for (const n of want) if (!G.agent(n.id)) G.addAgent(Object.assign({ kind: 'npc' }, n));
    for (const a of [...G.agents]) if (a.kind === 'npc' && !a.scripted && !want.some(n => n.id === a.id)) G.removeAgent(a);
  };
  let syncT = 0;
  // ---------------- per-frame ----------------
  SIM.update = function (dt) {
    const s = S();
    syncT -= dt; if (syncT <= 0) { syncT = 2; SIM.syncNpcs(); }
    // process whole in-game minutes
    const now = Math.floor(abs());
    if (s.lastMin == null || now - s.lastMin > 2000) s.lastMin = now;
    while (s.lastMin < now) { s.lastMin++; minuteEvents(s.lastMin); }
    if (G.map && G.map.outdoor) {
      stepTraffic(dt);
      stepCops(dt);
      if (Math.random() < dt * 0.15) spawnPed(false);
      // guests loitering by their doors go back inside eventually
      for (const a of G.agents) if (a.kind === 'guest' && a.loiter && Math.random() < dt * 0.02) { G.removeAgent(a); break; }
    }
  };

  window.SIM = SIM;
})();
