// South of Lowtown: Bel Vista (the rich hills: mansions, the pink Bel Vista Hotel, Regent Row's designer shops),
// Palm Shore (beach, boardwalk, pier with a Ferris wheel) and Harbor International airport.
// world.js stitches this onto the city map (rows z = 78 .. 199).
(function () {
  const { R, MT, W, P, text, textWidth } = KIT;
  const C = CITY, PI = Math.PI;
  const Z1 = 200;
  const SOUTH = window.SOUTH = { Z0: 78, Z1 };

  // ---------------------------------------------------------------- ground
  SOUTH.tile = (x, z) => {
    if (x >= 26 && x <= 31) return 'road';                                   // Sunset Blvd / Terminal Dr
    if (z >= 100 && z <= 105 && x <= 37) return 'road';                      // Ocean Ave
    if (x === 24 || x === 25 || x === 32 || x === 33) return 'walk';
    if ((z === 98 || z === 99 || z === 106 || z === 107) && x <= 37) return 'walk';
    if (z < 140) {
      if (x <= 23) {
        if (z <= 97) return 'plaza';                                         // hotel forecourt
        if (z >= 115 && z <= 120) return 'plaza';                            // Regent Row promenade
        if (z >= 108 && z <= 114) return 'walk';
        if (z >= 129 && x >= 21) return 'lot';                               // driveway
        return 'grass';                                                      // lawns
      }
      if (x <= 37) return 'walk';                                            // boardwalk shops strip
      if (x <= 41) return 'pier';                                            // the boardwalk
      if (x >= 52 && z >= 106 && z <= 111) return 'pier';                    // the pier
      if (x >= 56 && z >= 104 && z <= 117) return 'pier';                    // pier head
      if (x <= 53) return 'sand';
      return 'water';
    }
    if (x <= 23) return z >= 148 && z <= 177 ? 'walk' : 'lot';               // terminal + parking
    return 'tarmac';                                                         // the airfield
  };
  SOUTH.buildings = [
    { id: 'belvista', custom: 'hotel', x: 2, z: 80, w: 20, d: 10 },
    { id: 'shopverre', x: 2, z: 109, w: 4, d: 6, floors: 2, face: 's', wall: '#f2ead8', mat: 11, wear: 0.05, shop: { text: 'VERRE', col: '#ff9ac8', fascia: '#18181e', glass: '#ffe6f0', awning: '#18181e' } },
    { id: 'shoporo', x: 6, z: 109, w: 4, d: 6, floors: 2, face: 's', wall: '#18181e', mat: 13, wear: 0.05, shop: { text: 'ORO', col: '#ffd84a', fascia: '#c9a14a', glass: '#fff2c8' } },
    { id: 'shopnoir', x: 10, z: 109, w: 5, d: 6, floors: 3, face: 's', wall: '#e8e6e0', mat: 11, wear: 0.05, shop: { text: 'NOIR', col: '#ffffff', fascia: '#0e0e10', glass: '#e8f0ff', awning: '#0e0e10' } },
    { id: 'shopvelour', x: 15, z: 109, w: 4, d: 6, floors: 2, face: 's', wall: '#5a2a5a', mat: 11, wear: 0.05, shop: { text: 'VELOUR', col: '#d8a0ff', fascia: '#2a102a', glass: '#f0d8ff' } },
    { id: 'shopgallery', x: 19, z: 109, w: 5, d: 6, floors: 2, face: 's', wall: '#ffffff', mat: 11, wear: 0.02, shop: { text: 'GALLERY', col: '#3ff0ff', fascia: '#e8e6e0', glass: '#f4f8ff' } },
    { id: 'villa1', custom: 'mansion', x: 2, z: 122, w: 9, d: 7 },
    { id: 'villa2', custom: 'mansion', x: 13, z: 122, w: 8, d: 7 },
    { id: 'surfshack', custom: 'beachshop', x: 34, z: 82, w: 4, d: 6, label: 'SURF', wall: '#3fa8b8', awning: '#ff7a3a', boards: true },
    { id: 'icecream', custom: 'beachshop', x: 34, z: 90, w: 4, d: 5, label: 'SCOOPS', wall: '#ff9ac8', awning: '#ffffff', signCol: '#ff4fa3' },
    { id: 'burgers', custom: 'beachshop', x: 34, z: 124, w: 4, d: 6, label: 'BURGERS', wall: '#e8c13c', awning: '#c8443c', signCol: '#ff7a3a' },
    { id: 'arcade', custom: 'shed', x: 58, z: 112, w: 6, d: 6, label: 'PIER ARCADE', wall: '#2a1a3a', doors: 1, wear: 0.2, signBg: '#18101e', signCol: '#ff4fa3', signEmit: 1.8 },
    { id: 'terminal', custom: 'terminal', x: 3, z: 148, w: 20, d: 30 },
    { id: 'ctower', custom: 'ctower', x: 59, z: 141, w: 4, d: 4 },
    { id: 'hangar', custom: 'shed', x: 36, z: 186, w: 12, d: 11, label: 'HANGAR 2', wall: '#8a919c', doors: 2, wear: 0.3, h: 6 },
  ];
  SOUTH.exits = [
    { id: 'belvistaIn', x: 11, z: 90, w: 2, h: 1, to: 'belvista', tx: 7, tz: 9.4, dir: 'up', door: true },
    { id: 'terminalIn', x: 23, z: 162, w: 1, h: 2, to: 'terminal', tx: 24.3, tz: 6, dir: 'left', door: true },
  ];
  SOUTH.junction = { x0: 24, x1: 34, z0: 98, z1: 107 };
  SOUTH.crosswalks = [
    { x0: 26, z0: 98, x1: 31, z1: 99, across: 'z' }, { x0: 26, z0: 106, x1: 31, z1: 107, across: 'z' },
    { x0: 24, z0: 100, x1: 25, z1: 105, across: 'x' }, { x0: 32, z0: 100, x1: 33, z1: 105, across: 'x' },
    { x0: 26, z0: 118, x1: 31, z1: 119, across: 'z' }, { x0: 26, z0: 144, x1: 31, z1: 145, across: 'z' },
  ];
  SOUTH.lanes = [{ axis: 'x', z: 101.25, dir: -1, from: 36, to: -30 }, { axis: 'x', z: 104.75, dir: 1, from: -30, to: 36 }];
  SOUTH.walks = [[24.6, 80], [24.6, 138], [33, 80], [33, 138], [24.6, 160], [33, 186], [12, 117], [2, 117], [22.5, 117], [39.5, 80], [39.5, 138], [46, 95], [47, 120], [2, 98.6], [36, 98.6], [2, 106.6], [36, 106.6], [11, 95], [55, 109], [60, 106]];
  SOUTH.beats = [[[33, 80], [33, 138], [39.5, 120], [39.5, 82]], [[24.6, 80], [24.6, 180], [12, 117], [24.6, 117]]];
  const O = SOUTH.objects = [];
  // street lamps and the signals at Ocean Ave
  for (let z = 82; z < 196; z += 9) { O.push({ k: 'lamp', x: 25.1, z, rot: PI / 2 }, { k: 'lamp', x: 32.9, z: z + 4, rot: -PI / 2 }); }
  O.push({ k: 'traffic', id: 'sig2a', axis: 'z', x: 25.3, z: 99.3, rot: PI / 2 }, { k: 'traffic', id: 'sig2b', axis: 'z', x: 32.7, z: 106.7, rot: -PI / 2 });
  O.push({ k: 'traffic', id: 'sig2c', axis: 'x', x: 32.7, z: 99.3, rot: 0 }, { k: 'traffic', id: 'sig2d', axis: 'x', x: 25.3, z: 106.7, rot: PI });
  // the Bel Vista's forecourt
  for (const x of [3, 7.5, 15.5, 20]) O.push({ k: 'palm', x, z: 95.6 });
  O.push({ k: 'dtfountain', x: 11.9, z: 94, r: 1.7 });
  O.push({ k: 'hedge', x: 5, z: 97.5, w: 8, d: 0.6 }, { k: 'hedge', x: 18.8, z: 97.5, w: 8.4, d: 0.6 });
  O.push({ k: 'parked', x: 17.5, z: 92.6, rot: PI / 2, kind: 'limo', col: '#111' }, { k: 'parked', x: 5.5, z: 92.6, rot: PI / 2, kind: 'sports', col: '#e8e2d8' });
  // Regent Row promenade
  for (let x = 2.5; x < 23; x += 4) O.push({ k: 'palm', x, z: 119.6, h: 4 });
  O.push({ k: 'bench', x: 4.5, z: 119.4, rot: PI }, { k: 'bench', x: 12.5, z: 119.4, rot: PI }, { k: 'bench', x: 20.5, z: 119.4, rot: PI });
  O.push({ k: 'planterbox', x: 8.5, z: 117.2, w: 2, d: 1 }, { k: 'planterbox', x: 16.5, z: 117.2, w: 2, d: 1 });
  // the villas: hedged lawns, pools, cars on the drive
  O.push({ k: 'mpool', x: 6.5, z: 132, w: 5, d: 2.4 }, { k: 'mpool', x: 17, z: 132, w: 4.4, d: 2.4 });
  O.push({ k: 'hedge', x: 12, z: 130.5, w: 0.6, d: 17 }, { k: 'hedge', x: 6, z: 138.6, w: 11, d: 0.6 }, { k: 'hedge', x: 16.5, z: 138.6, w: 8, d: 0.6 }, { k: 'hedge', x: 0.4, z: 130.5, w: 0.6, d: 17 });
  O.push({ k: 'palm', x: 1.5, z: 122 }, { k: 'palm', x: 11, z: 136 }, { k: 'palm', x: 20, z: 136 }, { k: 'palm', x: 1.5, z: 136 });
  O.push({ k: 'parked', x: 22.3, z: 133, rot: 0, kind: 'sports', col: '#ffd84a' }, { k: 'parked', x: 22.3, z: 137.5, rot: 0, kind: 'sedan', col: '#18181e' });
  // Palm Shore: boardwalk, beach, pier
  for (let z = 80; z < 139; z += 6) O.push({ k: 'palm', x: 41.6, z: z + 1, h: 5 });
  for (let z = 84; z < 139; z += 9) O.push({ k: 'bench', x: 38.4, z, rot: PI / 2 });
  O.push({ k: 'lifeguard', x: 47.5, z: 88 }, { k: 'lifeguard', x: 47.5, z: 130 }, { k: 'volley', x: 47, z: 116 });
  const umbs = [[44, 84, '#ff7a3a', '#3ff0ff'], [50, 85, '#3ff0ff', '#ff4fa3'], [45, 95, '#ffd84a', '#59ff8a'], [50.5, 97, '#ff4fa3', '#ffd84a'], [44.5, 104, '#59ff8a', '#ff7a3a'], [50, 108, '#c8443c', '#ffffff'], [44, 123, '#3ff0ff', '#ffd84a'], [50, 124, '#ffd84a', '#3ff0ff'], [45, 135, '#ff4fa3', '#59ff8a'], [50.5, 137, '#ff7a3a', '#ff4fa3']];
  umbs.forEach(([x, z, col, towel], i) => O.push({ k: 'beachumb', id: i === 2 ? 'sunspot' : undefined, x, z, col, towel, rot: R(i, 1, 9) - 0.5 }));
  O.push({ k: 'gymrack', x: 35.6, z: 110 }, { k: 'gymrack', x: 35.6, z: 113.2 }, { k: 'gymrack', x: 35.6, z: 116.4 });
  O.push({ k: 'npcspot', id: 'surfer', x: 38.5, z: 85.5 }, { k: 'npcspot', id: 'scooper', x: 38.5, z: 92.5 });
  O.push({ k: 'ferrisbase', id: 'ferris', x: 58.5, z: 107.8 });
  for (const x of [53, 57, 61]) O.push({ k: 'lamp', x, z: 105.9, rot: 0 });
  O.push({ k: 'bench', x: 55, z: 110.6, rot: 0 }, { k: 'bollard', x: 63.4, z: 104.4 });
  // the airport: fence, parked jets, parking, taxis and the bus
  O.push({ k: 'chain', x0: 34, z0: 140, x1: 34, z1: 199.9 }, { k: 'chain', x0: 34, z0: 139.95, x1: 64, z1: 139.95 });
  O.push({ k: 'jet', x: 40, z: 158, rot: 0, col: '#c8443c' }, { k: 'jet', x: 41, z: 172, rot: 0, col: '#2f6a9a', s: 0.9 });
  O.push({ k: 'taxistand', id: 'taxiap', x: 24.6, z: 170 }, { k: 'busstop', id: 'busstopap', x: 24.9, z: 152, rot: PI / 2 });
  for (let k = 0; k < 8; k++) { O.push({ k: 'parked', x: 2 + k * 2.6, z: 142.2, rot: 0, kind: k % 3 ? 'sedan' : 'van', col: ['#c8443c', '#2f6a9a', '#e8e2d8', '#3a3a44', '#3a8a5a', '#8a4a9a', '#d8c25a', '#5a6a7a'][k] }); if (k % 2) O.push({ k: 'parked', x: 2 + k * 2.6, z: 182, rot: PI, kind: 'sedan', col: ['#e8e2d8', '#3a3a44', '#c8443c', '#2f6a9a'][k % 4] }); }
  O.push({ k: 'parking', x0: 1, x1: 22, z: 140.6, n: 8 }, { k: 'palm', x: 23.4, z: 146 }, { k: 'palm', x: 23.4, z: 180 });

  SOUTH.paint = (mb) => {
    // runway: edge lines, centre dashes, threshold bars, lights; the taxiway line
    const lw = (x0, z0, x1, z1, col, w) => C.stripe(mb, x0, z0, x1, z1, col, w);
    lw(50, 144, 50, 197, '#e8e8e0', 0.15); lw(57, 144, 57, 197, '#e8e8e0', 0.15);
    C.laneDash(mb, 53.5, 147, 53.5, 194, '#e8e8e0', 0.25, 2.4, 1.6);
    for (let k = 0; k < 6; k++) { mb.box(50.6 + k * 1.15, 0, 145, 0.5, 0.013, 1.6, '#e8e8e0', { jit: 0 }); mb.box(50.6 + k * 1.15, 0, 195.5, 0.5, 0.013, 1.6, '#e8e8e0', { jit: 0 }); }
    for (let z = 145; z < 197; z += 3) for (const x of [49.6, 57.4]) mb.box(x, 0, z, 0.14, 0.12, 0.14, '#fff2b0', { emit: 1.4, jit: 0 });
    for (const x of [50.6, 51.8, 53, 54.2, 55.4, 56.6]) mb.box(x, 0, 143.6, 0.14, 0.12, 0.14, '#59ff8a', { emit: 1.6, jit: 0 });
    lw(44, 142, 44, 196, '#e8c13c', 0.12); lw(44, 196, 50, 196, '#e8c13c', 0.12); lw(44, 150, 50, 150, '#e8c13c', 0.12);
    // apron gate stands
    for (const z of [158, 172]) lw(36, z - 5, 36, z + 5, '#e8c13c', 0.1);
    // ocean ave + terminal drive + the Regent Row crossing
    const yx = (z, x0, x1) => { C.stripe(mb, x0, z - 0.07, x1, z - 0.07, P.lane, 0.07); C.stripe(mb, x0, z + 0.07, x1, z + 0.07, P.lane, 0.07); };
    yx(103, -40, 26); yx(103, 32, 38); C.laneDash(mb, -40, 101.5, 25, 101.5, P.laneW, 0.08); C.laneDash(mb, -40, 104.5, 25, 104.5, P.laneW, 0.08);
    C.stripe(mb, 26, 97.9, 29, 97.9, P.laneW, 0.18); C.stripe(mb, 29, 108.1, 32, 108.1, P.laneW, 0.18); C.stripe(mb, 34.1, 100, 34.1, 103, P.laneW, 0.18); C.stripe(mb, 23.9, 103, 23.9, 106, P.laneW, 0.18);
  };
  SOUTH.ground = { sand: { y: 0.06, c: '#d9c59a', m: MT.slab, w: 0.15 }, tarmac: { y: 0.01, c: '#3a3a42', m: MT.asphalt, w: 0.2 } };
  Object.assign(C.GROUND, SOUTH.ground);

  // the hills behind Bel Vista with the big white letters, warehouses behind the airport
  SOUTH.backdrop = (mb) => {
    for (let k = 0; k < 7; k++) {
      const z = 76 + k * 10, h = 8 + R(k, 3, 7) * 7, x = -18 - R(k, 4, 7) * 6;
      mb.box(x, 0, z, 26, h, 14, k % 2 ? '#4a6a3a' : '#567a42', { mat: W(MT.grass, 0.4), taper: 0.55 });
      for (let t = 0; t < 6; t++) mb.sphere(x + 6 - R(k, t, 3) * 4, h * (0.5 + R(k, t, 4) * 0.4), z - 5 + t * 2, 0.9 + R(t, k, 2) * 0.6, '#2f5a2a', { detail: 1, jitter: 0.2, seed: k * 9 + t });
    }
    const word = 'BEL VISTA', px = 0.5;
    mb.at(-9.5, 8, 108, PI / 2, 1, 0, 0);
    for (let i = 0; i < word.length; i++) if (word[i] !== ' ') { mb.box((i - word.length / 2) * 3.2, -1.5, 0.3, 0.2, 7, 0.2, '#8a8478'); }
    text(mb, word, 0, 0, 0, px, '#f2f2ee', { emit: 0.15 });
    mb.pop();
    for (let z = 140; z < 200; z += 12) C.building(mb, null, { x: -14, z, w: 10, d: 10, floors: 2, seed: z, face: 'e', wall: '#8a919c', mat: 5, wear: 0.5, roofProps: true });
  };

  // ---------------------------------------------------------------- interiors
  const room = (w, h) => { const t = new Array(w * h).fill('floor'); const m = { w, h, t, indoor: true, tile: (x, z) => (x < 0 || z < 0 || x >= w || z >= h ? null : t[z * w + x]), set: (x, z, v) => { if (x >= 0 && z >= 0 && x < w && z < h) t[z * w + x] = v; } }; return m; };
  const F = (fid, x, z, rot = 0) => ({ k: 'furn', fid, x, z, rot });
  MAPS.terminal = () => {
    const m = room(26, 12);
    m.walls = { n: true, w: true, wallCol: '#e8eaee', wallMat: MT.plaster, floorCol: '#d8dce2', floorMat: MT.marble, wear: 0.05, trim: '#5a6070' };
    m.objects = [
      { k: 'fids', id: 'fids', x: 13, z: 0.1 },
      { k: 'counter', id: 'checkin', x: 5, z: 2.6, w: 6, luxe: true }, { k: 'npcspot', id: 'agent', x: 5, z: 1.6 },
      { k: 'counter', x: 19.5, z: 2.6, w: 5, luxe: true },
      ...[0, 1].flatMap(r => [0, 1, 2, 3].map(c => ({ k: 'bench', x: 4 + c * 2.6, z: 6.2 + r * 2.2, rot: 0 }))),
      { k: 'glasscase', x: 17, z: 6.4, w: 3 }, { k: 'cooler', x: 21.5, z: 6.2, rot: 0 }, { k: 'magrack', x: 23.6, z: 6.2 },
      F('olive', 1, 1), F('olive', 1, 10.6), F('plant_fig', 15.2, 10.6), F('sculpture', 12.5, 5.2), { k: 'chandelier', x: 13, z: 6 },
      { k: 'rug', x: 13, z: 8.4, w: 4, d: 3, col: '#2f4a6a' },
    ];
    m.exits = [{ x: 25, z: 5, w: 1, h: 2, to: 'city', back: 'terminalIn', dir: 'right' }];
    m.spawn = { x: 24.2, z: 6, dir: 'left' };
    return m;
  };
  MAPS.belvista = () => {
    const m = room(14, 10);
    m.walls = { n: true, w: true, wallCol: '#e8a0a8', wallMat: MT.plaster, floorCol: '#f2ead8', floorMat: MT.marble, wear: 0.05, trim: '#2f6a4a', luxe: true, checker: true };
    m.objects = [
      { k: 'counter', id: 'bvdesk', x: 4, z: 2.4, w: 5, luxe: true }, { k: 'npcspot', id: 'bvclerk', x: 4, z: 1.4 },
      { k: 'bar2', id: 'bvbar', x: 11, z: 2.2, w: 4 }, { k: 'stool', x: 10, z: 3.2 }, { k: 'stool', x: 12, z: 3.2 },
      { k: 'chandelier', x: 7, z: 5 }, { k: 'rug', x: 7, z: 6, w: 6, d: 3, col: '#2f6a4a' },
      F('piano', 11.6, 7), { k: 'sofa', x: 1.5, z: 5.5, rot: PI / 2 }, F('ctable', 2.7, 5.5, PI / 2), F('olive', 0.8, 9), F('olive', 13.2, 9.2), F('art', 7, 0.3), F('floorlamp', 0.7, 3.5),
    ];
    m.exits = [{ x: 6, z: 9, w: 2, h: 1, to: 'city', back: 'belvistaIn', dir: 'down' }];
    m.spawn = { x: 7, z: 9.4, dir: 'up' };
    return m;
  };
  // departures board
  BUILD.K.fids = { build: (mb, o) => {
    mb.box(o.x, 1.2, o.z + 0.1, 7, 2.2, 0.15, '#0e1218');
    const rows = [['LAS VISTAS', 'ON TIME', '#59ff8a'], ['COAST CHARTER', 'BOARDING', '#ffd84a'], ['PORT CALDERA', 'DELAYED', '#ff4f5e'], ['NORTH SHORE', 'ON TIME', '#59ff8a']];
    rows.forEach(([a, b, col], i) => { text(mb, a, o.x - 1.6, 2.95 - i * 0.45, o.z + 0.2, 0.038, '#e8e6ff', { emit: 1.4 }); text(mb, b, o.x + 2.2, 2.95 - i * 0.45, o.z + 0.2, 0.038, col, { emit: 1.6 }); });
    text(mb, 'DEPARTURES', o.x, 3.45, o.z + 0.2, 0.05, '#ffd84a', { emit: 1.8 });
  }, light: o => ({ x: o.x, y: 2.2, z: o.z + 1, r: 5, c: [0.8, 0.9, 1], i: 0.8 }), h: 3.5 };
  BUILD.K.fids.foot = () => [];

  // ---------------------------------------------------------------- people and things to do
  const H = STORY.H, say = (w, t, o) => UI.say(w, t, o), narr = t => UI.say(null, t), me = t => UI.say('player', t);
  const pick = a => a[Math.floor(Math.random() * a.length)];
  const S = () => G.S;
  const pay = n => { if (S().money < n) return false; S().money -= n; UI.refreshHud(); SFX.play('cash'); return true; };
  const LOOK = {
    agent: { skin: '#e0b090', hair: '#2a1a14', hairStyle: 'bun', top: '#2f4a6a', topStyle: 'suit', inner: '#e8e2d8', bottom: '#2f4a6a', shoes: '#111', acc: [] },
    bvclerk: { skin: '#c98e62', hair: '#1e1a1a', hairStyle: 'slick', top: '#2f6a4a', topStyle: 'suit', inner: '#f2ead8', bottom: '#18181e', shoes: '#111', acc: ['gold'] },
    surfer: { skin: '#d8a070', hair: '#e8c870', hairStyle: 'bob', top: '#3fa8b8', topStyle: 'vest', inner: '#3fa8b8', bottom: '#ff7a3a', shoes: '#e8c870', acc: [] },
    scooper: { skin: '#8a5a3a', hair: '#1a1210', hairStyle: 'pony', top: '#ff9ac8', topStyle: 'cardigan', inner: '#ff9ac8', bottom: '#ffffff', shoes: '#ffffff', acc: [] },
  };
  const NAMES = { agent: 'Gate Agent', bvclerk: 'Mr. Lyle', surfer: 'Kai', scooper: 'Bree' };
  const npcs0 = STORY.npcs;
  STORY.npcs = id => {
    const out = npcs0(id);
    const add = (k, x, z, dir) => out.push({ id: k, name: NAMES[k], look: LOOK[k], lookKey: 'sx_' + k, x, z, dir, kind: 'npc' });
    if (id === 'terminal') add('agent', 5, 1.6, 'down');
    if (id === 'belvista') add('bvclerk', 4, 1.4, 'down');
    if (id === 'city') { const h = Math.floor(S().clock / 60); if (h >= 8 && h < 20) { add('surfer', 38.6, 85.5, 'right'); add('scooper', 38.6, 92.5, 'right'); } }
    return out;
  };
  const face = id => UI.setGuestFace({ key: 'sx_' + id, look: LOOK[id], name: NAMES[id] });
  const sayN = (id, t) => { face(id); return say('guest', t, { name: NAMES[id] }); };
  const TALK = {
    agent: async () => { await sayN('agent', 'Welcome to Harbor International. The departures board has everything that is leaving today.'); return flights(); },
    bvclerk: async () => sayN('bvclerk', pick(['The Bel Vista has been the place to be seen since 1932. Mostly by people who own the place.', 'Our suites are booked through the season, I\'m afraid. The bar, however, is open to... everyone.', 'Ms. Vance? She lunches here on Thursdays. Naturally.'])),
    surfer: async () => { await sayN('surfer', 'Swell\'s decent today, bro. Board and a lesson, fifteen bucks. You in?'); const c = await UI.choose(['Rent a board ($15)', 'Maybe later']); if (c === 0) return surf(); },
    scooper: async () => { await sayN('scooper', 'Mango, pistachio or "Midnight Fudge". The fudge is a lifestyle choice.'); const c = await UI.choose(['Cone ($4)', 'Just looking']); if (c === 0) { if (!pay(4)) return me('Four bucks. I don\'t have four bucks.'); SIM.heat && SIM.heat(-0.1); return narr('Pistachio. It melts faster than you can eat it. Worth it.'); } },
  };
  const talk0 = STORY.talk;
  STORY.talk = a => TALK[a.id] ? TALK[a.id](a) : talk0(a);

  async function surf() {
    if (!pay(15)) return me('Fifteen? I\'m broke, not dumb. Okay, I\'m both.');
    await UI.fade(0.7, 0.4); G.advanceClock(40); await UI.fade(0, 0.4);
    const hits = await UI.timingGame({ title: 'CATCH THE WAVE', sub: 'Pop up when the wave peaks.', rounds: 4, speed: 1.3, zone: 0.17 });
    G.evt && G.evt('surf', hits);
    if (hits >= 3) { SIM.heat && SIM.heat(-0.4); await sayN('surfer', 'Bro! You actually stood up! That was gnarly!'); }
    else await sayN('surfer', 'You ate it. Everybody eats it. Again tomorrow?');
  }
  H.sunspot = { name: 'Beach Towel', verbs: () => [{ label: 'Lie in the sun (1h)', fn: async () => { await UI.fade(0.6, 0.5); G.advanceClock(60); await UI.fade(0, 0.5); SIM.heat && SIM.heat(-0.35); await narr(pick(['Waves. Gulls. Somebody\'s radio playing something from the 80s. You forget about the motel for an hour. (Heat down)', 'You fall asleep and wake up with a sunburn shaped like a sunglasses tan. Worth it. (Heat down)'])); } }] };
  H.checkin = { name: 'Check-in', verbs: () => [{ label: 'Flights', fn: () => TALK.agent() }] };
  H.fids = { name: 'Departures', verbs: () => [{ label: 'Look at flights', fn: () => flights() }] };
  H.bvdesk = { name: 'Front Desk', verbs: () => [{ label: 'Ask about a room', fn: () => TALK.bvclerk() }] };
  H.bvbar = { name: 'Polo Bar', verbs: () => [{ label: 'Order a martini ($18)', fn: async () => { if (!pay(18)) return me('Eighteen dollars for a drink. I\'ll have the water, thanks.'); SFX.play('ice'); SIM.heat && SIM.heat(-0.15); await narr(pick(['Shaken. Two olives. A man at the end of the bar is pretending not to be famous.', 'It tastes like money. You look around for Celeste Vance. Not today.'])); } }] };
  H.ferris = { name: 'Ferris Wheel', verbs: () => [{ label: 'Ride the wheel ($5)', fn: async () => { if (!pay(5)) return me('Five bucks for a wheel that goes in a circle. I can\'t even afford that.'); await ferrisRide(); } }] };
  H.taxiap = { name: 'Taxi Stand', verbs: () => [{ label: 'Cab to the Starlite ($18)', fn: () => cab('The cab drops you at the Starlite.', 18, 24.4, 44.8, 'up') }, { label: 'Cab downtown ($22)', fn: () => cab('The cab drops you on Grand Ave.', 22, 24.6, -47.4, 'down') }] };
  H.busstopap = { name: 'Bus Stop', verbs: () => [{ label: 'Bus to Lowtown ($2)', fn: () => cab('Lowtown. Sunset & Harbor.', 2, 24.4, 41.6, 'down', 'busgo') }] };
  async function cab(label, cost, x, z, dir, sfx) { if (!pay(cost)) return me('I can\'t afford that.'); SFX.play(sfx || 'cardoor'); await UI.fade(1, 0.4); G.advanceClock(25); G.loadMap('city', x, z, dir); await UI.fade(0, 0.5); UI.toast(label); }
  // the Lowtown stops get a route south too
  const bus0 = H.busstop;
  H.busstop = { name: 'Bus Stop', verbs: () => [...bus0.verbs(), { label: 'Bus to the beach ($2)', fn: () => cab('Palm Shore. Surf\'s up.', 2, 33.2, 96, 'right', 'busgo') }, { label: 'Bus to the airport ($3)', fn: () => cab('Harbor International.', 3, 24.4, 160, 'left', 'busgo') }] };

  // ---------------------------------------------------------------- flights
  async function flights() {
    const c = await UI.choose(['Coast charter: a loop over the whole city ($250)', 'Weekend in Las Vistas ($600, back tomorrow)', 'Never mind']);
    if (c === 0) { if (!pay(250)) return me('Two hundred fifty to look out a window. Not today.'); return charter(); }
    if (c === 1) {
      if (!pay(600)) return me('Six hundred bucks. Maybe after a few good nights.');
      await UI.fade(1, 0.6); G.advanceClock(24 * 60); await UI.fade(0, 0.6);
      const r = Math.random(), win = r < 0.35 ? 2000 : r < 0.65 ? 700 : 0;
      if (win) { S().money += win; UI.refreshHud(); SFX.play('win'); }
      return narr(win >= 2000 ? 'Las Vistas. You hit on seventeen, the dealer busts, and you ride the heater all night. You fly home $2,000 richer.' : win ? 'Las Vistas. Pool parties, a buffet the size of a city block, and $700 from the craps table. Not bad.' : 'Las Vistas. You lost it all on roulette by 2 AM and spent the rest of the trip at the buffet. Classic.');
    }
  }
  // a camera ride along a path (used by the charter flight and the Ferris wheel)
  const lerp = (a, b, t) => a + (b - a) * t;
  function catmull(p0, p1, p2, p3, t) { const t2 = t * t, t3 = t2 * t; return [0, 1, 2].map(i => 0.5 * (2 * p1[i] + (-p0[i] + p2[i]) * t + (2 * p0[i] - 5 * p1[i] + 4 * p2[i] - p3[i]) * t2 + (-p0[i] + 3 * p1[i] - 3 * p2[i] + p3[i]) * t3)); }
  function along(pts, u) { const n = pts.length - 1, f = Math.min(n - 1e-6, Math.max(0, u * n)), i = Math.floor(f), t = f - i; return catmull(pts[Math.max(0, i - 1)], pts[i], pts[i + 1], pts[Math.min(n, i + 2)], t); }
  async function cinematic(pts, secs, zoom, draw) {
    const p = G.player, keep = { x: p.x, z: p.z, zoom: G.zoom };
    G.busy++; p.hidden = true; G.zoom = zoom;
    let u = 0, last = performance.now(), plane = null;
    if (draw) { plane = () => draw(u); G.extraDraws.push(plane); }
    try {
      await new Promise(done => {
        const step = () => {
          const now = performance.now(); u += (now - last) / 1000 / secs; last = now;
          const q = along(pts, Math.min(1, u)); G.camOverride = { x: q[0], y: q[1] * 0.7, z: q[2] };
          if (u >= 1) return done(); requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
      });
    } finally {
      G.camOverride = null; G.zoom = keep.zoom; p.hidden = false; G.busy = Math.max(0, G.busy - 1);
      if (plane) { const i = G.extraDraws.indexOf(plane); if (i >= 0) G.extraDraws.splice(i, 1); }
    }
  }
  const FLIGHT = [[53.5, 0.6, 196], [53.5, 0.6, 170], [53.5, 4, 145], [50, 14, 120], [30, 20, 100], [10, 24, 70], [12, 26, 20], [20, 30, -30], [40, 30, -58], [60, 26, -20], [62, 22, 40], [58, 18, 90], [56, 10, 125], [53.5, 3, 160], [53.5, 0.6, 184]];
  async function charter() {
    await UI.fade(1, 0.5);
    G.loadMap('city', 24.6, 165, 'left');
    await UI.fade(0, 0.6);
    UI.toast('Coast Charter 7, cleared for takeoff.');
    await cinematic(FLIGHT, 34, 0.55, u => {
      const q = along(FLIGHT, Math.min(1, u)), q2 = along(FLIGHT, Math.min(1, u + 0.004));
      const yaw = Math.atan2(q2[0] - q[0], q2[2] - q[2]);
      return { mesh: G.meshFor('flightjet', mb => FACADE.jetMesh(mb, 0.9, '#ff4fa3')), model: GL3.M4.trs(q[0], q[1], q[2], yaw), noShadow: q[1] > 2 };
    });
    await UI.fade(1, 0.4); G.advanceClock(45); G.loadMap('city', 24.7, 164, 'right'); await UI.fade(0, 0.5);
    await narr('Wheels down. From up there the whole city looked like a circuit board: Downtown glittering, Lowtown flickering, the Starlite a pink dot by the water.');
  }
  async function ferrisRide() {
    const W0 = [58.5, 2, 112], pts = [W0, [58.5, 8, 111], [57, 14, 110], [55, 15, 108], [56, 10, 106], [58.5, 2, 112]];
    await cinematic(pts, 14, 0.7);
    SIM.heat && SIM.heat(-0.2);
    await narr(pick(['At the top the wheel stops for a second. Bel Vista lights up behind you, the airport blinks to the south, and the ocean goes on forever.', 'You can see the Starlite sign from up here. Tiny. Pink. Yours.']));
  }

  // ---------------------------------------------------------------- moving things: the wheel and the planes
  let wheelA = 0, planeT = 0;
  const wheelDraws = () => {
    if (G.mapId !== 'city') return null;
    const cx = 58.5, cy = 7.6, cz = 107.8, out = [];
    out.push({ mesh: G.meshFor('ferriswheel', mb => FACADE.wheelMesh(mb)), model: GL3.M4.trs(cx, cy, cz, 0, 1, wheelA), noShadow: true });
    const gm = G.meshFor('gondola', mb => FACADE.gondolaMesh(mb));
    for (let k = 0; k < 8; k++) { const ph = k / 8 * PI * 2 - wheelA; out.push({ mesh: gm, model: GL3.M4.trs(cx, cy + Math.sin(ph) * 6.4, cz + Math.cos(ph) * 6.4, 0) }); }
    // airliners: one takes off, one lands, on a loop
    const jm = G.meshFor('airliner', mb => FACADE.jetMesh(mb, 1, '#2f6a9a'));
    const t = planeT % 60;
    if (t < 26) { // take off northbound
      const s = t / 26, z = 196 - 70 * s * s - 30 * s, y = s < 0.45 ? 0.05 : (s - 0.45) * 46;
      out.push({ mesh: jm, model: GL3.M4.trs(53.5, y, z, PI, 1, s < 0.45 ? 0 : -0.18), noShadow: y > 2 });
    } else if (t > 32) { // land from the south
      const s = (t - 32) / 28, z = 290 - 160 * Math.min(1, s / 0.75) - (s > 0.75 ? 25 * (s - 0.75) / 0.25 : 0), y = Math.max(0.05, 24 * (1 - s / 0.72));
      if (z < 260) out.push({ mesh: jm, model: GL3.M4.trs(53.5, y, z, PI, 1, y > 0.1 ? 0.08 : 0), noShadow: y > 2 });
    }
    return out;
  };
  const update0 = SIM.update;
  SIM.update = function (dt) {
    update0(dt);
    wheelA += dt * 0.18; planeT += dt;
    if (G.mapId === 'city' && !G.extraDraws.includes(wheelDraws)) G.extraDraws.push(wheelDraws);
    if (G.mapId === 'city' && G.night > 0.4 && Math.floor(G.t * 1.5) !== Math.floor((G.t - dt) * 1.5)) {
      for (const [x, y, z] of [[61, 17.2, 143], [53.5, 0.4, 143.4]]) G.emit({ x, y, z, life: 0.3, size: 3, r: 1, g: 0.2, b: 0.2, a: 1, grav: 0 });
    }
  };
  // music: a breezier mood by the beach and in Bel Vista
  const pick0 = SFX.pickMusic;
  SFX.pickMusic = function () { if (G.mapId === 'belvista' || G.mapId === 'terminal') return SFX.music('grand'); return pick0(); };
})();
