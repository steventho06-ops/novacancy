// World layout: the Lowtown district and every interior.
// Coordinates: 1 unit = 1 tile, +x east, +z south. The camera looks north-west, so building
// fronts face south (+z) or east (+x).
(function () {
  function grid(w, h, fill) {
    const t = new Array(w * h).fill(fill);
    const m = {
      w, h, t,
      tile: (x, z) => (x < 0 || z < 0 || x >= w || z >= h ? null : t[z * w + x]),
      set: (x, z, v) => { if (x >= 0 && z >= 0 && x < w && z < h) t[z * w + x] = v; },
      rect: (x, z, rw, rh, v) => { for (let j = z; j < z + rh; j++) for (let i = x; i < x + rw; i++) m.set(i, j, v); },
    };
    return m;
  }
  const MAPS = {};

  // ======================= LOWTOWN =======================
  MAPS.city = () => {
    const m = grid(58, 78, 'walk');
    // roads
    m.rect(26, 0, 6, 78, 'road');                 // Sunset Blvd (x 26..31)
    m.rect(0, 46, 50, 6, 'road');                 // Harbor St (z 46..51)
    // motel lot
    m.rect(3, 8, 21, 36, 'lot');
    m.rect(3, 8, 21, 2, 'grass');
    m.rect(4, 15, 18, 2, 'walk');                 // walkway in front of rooms
    m.rect(4, 19, 9, 8, 'pooldeck');
    m.rect(5, 20, 7, 6, 'void');                  // pool basin
    m.rect(16, 30, 8, 9, 'walk');                 // office pad
    m.rect(3, 42, 21, 2, 'grass');
    m.rect(0, 0, 3, 46, 'lot');                   // west alley
    // metro plaza
    m.rect(3, 0, 21, 8, 'plaza');
    // construction site
    m.rect(35, 3, 18, 31, 'dirt');
    m.rect(35, 3, 1, 1, 'dirt');
    // docks
    m.rect(50, 0, 8, 44, 'walk');
    m.rect(48, 44, 10, 9, 'pier');
    m.rect(51, 53, 7, 25, 'water');
    m.waterX = 51; m.waterZ = 44;
    // crosswalks: pedestrians only step onto the road here (tile rectangles, inclusive)
    m.crosswalks = [];
    for (const z of [7, 19, 33, 44, 52, 62, 72]) m.crosswalks.push({ x0: 26, z0: z, x1: 31, z1: z + 1, across: 'z' });
    for (const x of [9, 24, 32, 40]) m.crosswalks.push({ x0: x, z0: 46, x1: x + 1, z1: 51, across: 'x' });
    m.rect(48, 53, 3, 25, 'pier');
    m.rect(35, 55, 13, 23, 'gravel');
    // south-west block
    m.rect(13, 54, 4, 24, 'lot');                 // alley
    m.rect(1, 63, 11, 5, 'lot');                  // precinct parking
    m.rect(1, 68, 11, 9, 'plaza');                // basketball court
    m.rect(34, 54, 1, 24, 'grass');
    // building footprints
    const B = m.buildings = [
      { id: 'laundry', x: 35, z: 37, w: 6, d: 6, floors: 2, face: 's', wall: '#5a6a8a', mat: 11, wear: 0.6, shop: { text: 'LAUNDRY', col: '#3ff0ff', awning: '#3a8ad8' } },
      { id: 'bluenote', x: 42, z: 37, w: 7, d: 6, floors: 2, face: 's', wall: '#2a2236', mat: 3, wear: 0.5, shop: { text: 'BLUE NOTE', col: '#4f7bff', fascia: '#101018', glass: '#3a2a5a' }, sign: { text: 'BAR', col: '#ff4fa3' } },
      { id: 'apts1', x: 50, z: 35, w: 7, d: 8, floors: 5, face: 's', wear: 0.6, fire: true },
      { id: 'pawn', x: 17, z: 55, w: 7, d: 6, floors: 2, face: 'e', wall: '#6a5a4a', mat: 3, wear: 0.75, shop: { text: 'LUCKY PAWN', col: '#ffd84a', awning: '#c8443c' } },
      { id: 'mart', x: 17, z: 62, w: 7, d: 5, floors: 1, face: 'e', wall: '#e8e2d8', mat: 11, wear: 0.6, shop: { text: '24/7 MART', col: '#59ff8a', fascia: '#c8443c', glass: '#bfe8ff' } },
      { id: 'diner', x: 17, z: 68, w: 7, d: 7, floors: 1, face: 'e', wall: '#c8443c', mat: 11, wear: 0.4, shop: { text: "DINA'S DINER", col: '#ff4fa3', fascia: '#e8e2d8', glass: '#ffd890', awning: '#e8e2d8' } },
      { id: 'precinct', x: 2, z: 55, w: 10, d: 8, floors: 3, face: 's', wall: '#6a7080', mat: 2, wear: 0.4, shop: { text: 'POLICE', col: '#4f7bff', fascia: '#18203a', glass: '#5a8aa0' } },
      { id: 'warehouse', x: 36, z: 56, w: 10, d: 8, floors: 2, face: 's', wall: '#5a5048', mat: 5, wear: 0.8, roofProps: false, shop: { text: 'WAREHOUSE 9', col: '#ff7a3a', fascia: '#2a2420', glass: '#2a2a30', lit: false } },
      { id: 'alleyB', x: 4, z: 0, w: 0, d: 0, floors: 0 },
    ].filter(b => b.w > 0);
    for (const b of B) m.rect(b.x, b.z, b.w, b.d, 'bldg');
    // background skyline buildings just outside the playable edges are added by build.js
    m.spawn = { x: 25.2, z: 41.5, dir: 'left' };
    m.outdoor = true;
    // exits into interiors (tiles) — "door" tiles the player walks onto
    m.exits = [
      { id: 'metroIn', x: 10, z: 7, w: 2, h: 1, to: 'metro', tx: 4.5, tz: 3.2, dir: 'down' },
      { id: 'pawnIn', x: 24, z: 58, to: 'pawn', tx: 1.5, tz: 4.5, dir: 'right', door: true },
      { id: 'martIn', x: 24, z: 64, to: 'mart', tx: 1.5, tz: 4.0, dir: 'right', door: true },
      { id: 'dinerIn', x: 24, z: 71, to: 'diner', tx: 1.5, tz: 4.5, dir: 'right', door: true },
      { id: 'precinctIn', x: 7, z: 63, to: 'precinct', tx: 5.0, tz: 6.4, dir: 'up', door: true },
      { id: 'laundryIn', x: 38, z: 43, to: 'laundry', tx: 3.5, tz: 5.4, dir: 'up', door: true },
      { id: 'barIn', x: 45, z: 43, to: 'bar', tx: 4.5, tz: 6.4, dir: 'up', door: true },
      { id: 'warehouseIn', x: 41, z: 64, to: 'warehouse', tx: 6.0, tz: 7.4, dir: 'up', door: true, need: 'warehouseOpen' },
      { id: 'trailerIn', x: 37, z: 31, to: 'trailer', tx: 2.5, tz: 3.4, dir: 'up', door: true, need: 'trailerOpen' },
      // Sunset Blvd runs north into Downtown
      { id: 'toDowntown', x: 24, z: 0, w: 2, h: 1, to: 'downtown', tx: 24.9, tz: 58.2, dir: 'up' },
      { id: 'toDowntown2', x: 32, z: 0, w: 2, h: 1, to: 'downtown', tx: 33, tz: 58.2, dir: 'up' },
    ];
    // static props (merged) and interactive objects (with ids)
    const O = m.objects = [];
    const lamp = (x, z, rot) => O.push({ k: 'lamp', x, z, rot });
    for (let z = 4; z < 78; z += 9) { if (z > 42 && z < 55) continue; lamp(25.1, z, Math.PI / 2); lamp(32.9, z + 4, -Math.PI / 2); }
    for (let x = 4; x < 50; x += 9) { if (x > 22 && x < 35) continue; lamp(x, 45.1, 0); lamp(x + 4, 52.9, Math.PI); }
    O.push({ k: 'traffic', x: 25.3, z: 45.3, rot: Math.PI / 2 }, { k: 'traffic', x: 32.7, z: 52.7, rot: -Math.PI / 2 });
    // motel
    O.push({ k: 'motel', id: 'motel', x: 13, z: 12 }, { k: 'moteloffice', id: 'moteloffice', x: 20, z: 34 }, { k: 'motelyard', id: 'motelyard', x: 13, z: 25 });
    for (let r = 0; r < 12; r++) O.push({ k: 'roomdoor', id: 'room' + (r + 1), room: r });
    O.push({ k: 'motelsign', id: 'sign', x: 22.6, z: 39.2 });
    O.push({ k: 'officedoor', id: 'officedoor' });
    O.push({ k: 'pool', id: 'pool', x: 8.5, z: 23 });
    O.push({ k: 'vending', id: 'vend', x: 3.6, z: 16.2, rot: Math.PI / 2 });
    O.push({ k: 'icemachine', id: 'ice', x: 22.6, z: 16.6, rot: -Math.PI / 2 });
    O.push({ k: 'dumpster', id: 'dumpster', x: 4.4, z: 38.5, rot: Math.PI / 2 });
    O.push({ k: 'trashbags', x: 4.2, z: 40.8 });
    O.push({ k: 'parking', x0: 4, x1: 23, z: 17.2, n: 9 });
    O.push({ k: 'parking', x0: 14, x1: 16, z: 31, n: 0 });
    O.push({ k: 'busstop', id: 'busstop', x: 24.9, z: 40, rot: Math.PI / 2 });
    O.push({ k: 'taxistand', id: 'taxilt', x: 24.6, z: 43.4 });
    O.push({ k: 'newsbox', id: 'news', x: 24.6, z: 36.4, rot: Math.PI / 2 });
    O.push({ k: 'hydrant', x: 24.7, z: 33 }, { k: 'hydrant', x: 33.3, z: 60 }, { k: 'hydrant', x: 12, z: 53.4 });
    O.push({ k: 'planter', x: 24.8, z: 27, kind: 'palm' }, { k: 'planter', x: 24.8, z: 20, kind: 'palm' }, { k: 'planter', x: 24.8, z: 12, kind: 'palm' });
    O.push({ k: 'phonebooth', id: 'phone', x: 24.7, z: 52.9, rot: Math.PI / 2 });
    O.push({ k: 'billboard', x: 18, y: 6.5, z: 2.0, w: 7, h: 2.6, text: 'VANCE TOWER', col: '#e8e2d8', bg: '#2a2236' });
    O.push({ k: 'billboard', x: 44, y: 8.5, z: 2.5, w: 8, h: 3, text: 'DRINK NEON', col: '#ff4fa3', bg: '#1a1430' });
    // metro plaza
    O.push({ k: 'metro', id: 'metro', x: 9.5, z: 2.0 });
    O.push({ k: 'bench', x: 16, z: 3.2, rot: Math.PI }, { k: 'bench', x: 19, z: 3.2, rot: Math.PI });
    O.push({ k: 'planter', x: 5, z: 6 }, { k: 'planter', x: 22, z: 6 });
    O.push({ k: 'trashcan', x: 14.2, z: 6.5 }, { k: 'graffitiwall', x: 3.0, z: 4, w: 4, h: 1.4, dir: 'z' });
    O.push({ k: 'newsbox', x: 23.2, z: 1.2, rot: 0, col: '#2f6a9a' });
    // west alley
    O.push({ k: 'dumpster', x: 1.4, z: 24, rot: Math.PI / 2, col: '#5a3a2a' }, { k: 'trashbags', x: 1.5, z: 27 }, { k: 'trashbags', x: 1.2, z: 12 });
    O.push({ k: 'chain', x0: 3, z0: 8, x1: 3, z1: 44 });
    // construction
    O.push({ k: 'chain', x0: 35, z0: 3, x1: 53, z1: 3 }, { k: 'chain', x0: 53, z0: 3, x1: 53, z1: 34 }, { k: 'chain', x0: 35, z0: 34, x1: 53, z1: 34 });
    O.push({ k: 'chain', x0: 35, z0: 3, x1: 35, z1: 23.5 }, { k: 'chain', x0: 35, z0: 27, x1: 35, z1: 34 });
    O.push({ k: 'vancetower', id: 'tower', x: 40, z: 10, w: 9, d: 8 });
    O.push({ k: 'crane', x: 50, z: 22, rot: -2.4 });
    O.push({ k: 'trailer', id: 'trailer', x: 37.8, z: 29.4 });
    O.push({ k: 'sitesign', x: 34.6, z: 28.5, text: 'VANCE HOLDINGS' });
    for (let k = 0; k < 4; k++) O.push({ k: 'cone', x: 41.5 + k * 0.9, z: 32.8 });
    O.push({ k: 'barrier', x: 34.0, z: 21.5, rot: Math.PI / 2 });
    O.push({ k: 'pallet', x: 45, z: 27 }, { k: 'pallet', x: 46.2, z: 27.2 }, { k: 'crates', x: 44, z: 30, n: 3 });
    O.push({ k: 'portaloo', x: 51.5, z: 31.5 });
    // harbor side north row
    O.push({ k: 'trashcan', x: 41.6, z: 44.6 }, { k: 'bench', x: 48, z: 44.8, rot: Math.PI });
    // south-west block
    O.push({ k: 'dumpster', x: 14.2, z: 58, rot: Math.PI / 2 }, { k: 'trashbags', x: 14, z: 60.5 }, { k: 'dumpster', x: 14.2, z: 70, rot: Math.PI / 2, col: '#2a3a5a' });
    O.push({ k: 'graffitiwall', x: 16.95, z: 64.5, w: 3, h: 1.3, dir: 'z', seed: 4 });
    O.push({ k: 'policecar', id: 'pcar1', x: 4, z: 65.5, rot: Math.PI / 2 }, { k: 'policecar', x: 8.6, z: 65.5, rot: Math.PI / 2 });
    O.push({ k: 'court', x: 1, z: 68, w: 11, d: 9 });
    O.push({ k: 'hoop', id: 'hoop', x: 6.5, z: 68.6, rot: 0 });
    O.push({ k: 'chain', x0: 1, z0: 68, x1: 12, z1: 68 }, { k: 'chain', x0: 12, z0: 68, x1: 12, z1: 77 });
    // docks
    O.push({ k: 'pierposts', x0: 48, z0: 44, x1: 58, z1: 53 });
    for (let z = 46; z < 53; z += 2.5) O.push({ k: 'bollard', x: 57.4, z });
    for (let z = 55; z < 77; z += 4) O.push({ k: 'bollard', x: 50.6, z });
    O.push({ k: 'boat', id: 'boat', x: 54.5, z: 60, rot: 0 });
    O.push({ k: 'containers', x: 36.5, z: 67 });
    O.push({ k: 'crates', x: 47, z: 57, n: 4 }, { k: 'pallet', x: 47, z: 62 }, { k: 'forklift', x: 44.5, z: 66, rot: 0.4 });
    O.push({ k: 'lamp', x: 49.5, z: 58, rot: -Math.PI / 2 }, { k: 'lamp', x: 49.5, z: 68, rot: -Math.PI / 2 }, { k: 'lamp', x: 53, z: 45, rot: 0 });
    O.push({ k: 'trashbags', x: 34.8, z: 62 });
    O.push({ k: 'npcspot', id: 'foreman', x: 46.4, z: 59.5 });
    // street furniture near shops
    O.push({ k: 'bench', x: 25, z: 66, rot: Math.PI / 2 }, { k: 'trashcan', x: 25, z: 61 }, { k: 'newsbox', x: 25, z: 69.4, rot: Math.PI / 2, col: '#e8c13c' });
    O.push({ k: 'manhole', x: 29, z: 30 }, { k: 'manhole', x: 20, z: 49 }, { k: 'manhole', x: 29, z: 63 });
    O.push({ k: 'vending', x: 24.7, z: 55.2, rot: Math.PI / 2, col: '#2f6a9a', glow: '#ffe8a0' });
    // parked cars and lot clutter
    const pk = (x, z, rot, kind, col) => O.push({ k: 'parked', x, z, rot, kind, col });
    pk(17.4, 18.9, Math.PI, 'wreck', '#7a5a4a'); pk(14.3, 18.9, Math.PI, 'sedan', '#2f6a9a'); pk(21.0, 19.0, Math.PI, 'van', '#e8e2d8');
    pk(4.6, 33.5, Math.PI / 2, 'sedan', '#8a4a9a'); pk(4.6, 36.0, Math.PI / 2, 'sports', '#c8443c');
    pk(10.5, 41.0, 0, 'sedan', '#3a8a5a');
    O.push({ k: 'oilstain', x: 9.5, z: 20 }, { k: 'oilstain', x: 17, z: 22 }, { k: 'oilstain', x: 8, z: 34 }, { k: 'oilstain', x: 12.5, z: 27.5 });
    O.push({ k: 'shoppingcart', x: 11.4, z: 29.2, rot: 0.6 }, { k: 'nopark', x: 24.6, z: 24 }, { k: 'nopark', x: 33.3, z: 30 });
    O.push({ k: 'trashbags', x: 15.4, z: 38.6 }, { k: 'trashcan', x: 16.2, z: 29.6 });
    O.push({ k: 'planter', x: 33.2, z: 16, kind: 'palm' }, { k: 'planter', x: 33.2, z: 36 }, { k: 'planter', x: 33.2, z: 66, kind: 'palm' }, { k: 'planter', x: 25, z: 74 });
    // construction site
    O.push({ k: 'dirtpile', x: 44, z: 7, r: 1.6 }, { k: 'dirtpile', x: 38.5, z: 22, r: 1.2 }, { k: 'rebar', x: 47, z: 30.2 }, { k: 'pipes', x: 40, z: 26.5 });
    O.push({ k: 'mixer', x: 38.6, z: 8, rot: 0.3 }, { k: 'excavator', x: 46.5, z: 23.5, rot: -0.8 });
    O.push({ k: 'barrels', x: 51, z: 6, n: 4 });
    // docks & alleys
    O.push({ k: 'barrels', x: 47.4, z: 70, n: 6 }, { k: 'nets', x: 49.6, z: 64 }, { k: 'nets', x: 49.4, z: 72 });
    O.push({ k: 'tent', x: 1.4, z: 33, rot: Math.PI / 2 }, { k: 'barrelfire', id: 'alleyfire', x: 1.5, z: 30.5 });
    // the slums: camps in the alley, behind the shops and down by the warehouse
    O.push({ k: 'bedroll', x: 2.6, z: 28.6, rot: 0.2 }, { k: 'shopcart', x: 3.0, z: 34.6, rot: 0.6 }, { k: 'cardboard', x: 0.8, z: 36.2 });
    O.push({ k: 'tent', x: 1.4, z: 65, rot: Math.PI / 2, col: '#6a4a3a' }, { k: 'bedroll', x: 2.6, z: 67.5, rot: -0.3, col: '#6a3a3a' }, { k: 'barrelfire', x: 2.2, z: 63.4 }, { k: 'shopcart', x: 0.9, z: 62.2, rot: 1.2 });
    O.push({ k: 'bedroll', x: 35.0, z: 56.5, rot: 1.4, col: '#3a5a3a' }, { k: 'cardboard', x: 34.6, z: 58.4 }, { k: 'shopcart', x: 35.2, z: 60.3, rot: -0.4 });
    O.push({ k: 'bedroll', x: 13.0, z: 66.8, rot: 0.1, col: '#5a4a6a' }, { k: 'cardboard', x: 13.4, z: 68.8 });
    O.push({ k: 'trashbags', x: 13.8, z: 66 }, { k: 'graffitiwall', x: 34.95, z: 60, w: 3, h: 1.2, dir: 'z', seed: 12 });
    O.push({ k: 'parked', x: 15, z: 75, rot: 0, kind: 'van', col: '#5a5a64' });
    return m;
  };

  // ======================= INTERIORS =======================
  // interiors are dioramas: back walls on the north and west, open towards the camera.
  function room(w, h, floor = 'floor') { const m = grid(w, h, floor); m.indoor = true; return m; }

  // motel office (tiers 1-3)
  MAPS.office = () => {
    const m = room(10, 8);
    m.walls = { n: true, w: true, wallCol: '#c8b89a', wallMat: 11, floorCol: '#6a5a48', floorMat: 4, trim: '#5a3a2a' };
    m.objects = [
      { k: 'counter', id: 'desk', x: 3.9, z: 3.4, w: 3.4, rot: 0 },
      { k: 'bell', id: 'bell', x: 3.1, z: 3.4 },
      { k: 'register', id: 'register', x: 4.6, z: 3.4 },
      { k: 'keyrack', id: 'keys', x: 2.8, z: 0.1 },
      { k: 'plans', id: 'plans', x: 4.9, z: 0.1 },
      { k: 'partition', x: 6.5, z: 0, d: 3.2 },
      { k: 'cot', id: 'cot', x: 9.0, z: 1.4 },
      { k: 'safe', id: 'safe', x: 7.5, z: 3.5 },
      { k: 'fusebox', id: 'fuse', x: 0.1, z: 1.4, rot: Math.PI / 2 },
      { k: 'plant', x: 0.6, z: 6.6 }, { k: 'chair', x: 1.0, z: 5.6, rot: Math.PI / 2 }, { k: 'chair', x: 1.0, z: 4.6, rot: Math.PI / 2 },
      { k: 'rack', x: 0.4, z: 3.3, rot: Math.PI / 2 },
      { k: 'ceilfan', x: 4, z: 4.5 },
      { k: 'tv', x: 7.8, z: 0.25 }, { k: 'watercooler', x: 1.6, z: 0.45 },
      { k: 'rug', x: 4, z: 5.6, w: 3, d: 2, col: '#7a3a3a' },
    ];
    m.exits = [{ x: 9, z: 6, w: 1, h: 2, to: 'city', dir: 'right', back: 'officedoor' }];
    m.spawn = { x: 8.6, z: 6.5, dir: 'left' };
    return m;
  };
  // grand lobby (tiers 4-5)
  MAPS.lobby = () => {
    const m = room(16, 12);
    m.walls = { n: true, w: true, wallCol: '#e8e0d0', wallMat: 11, floorCol: '#e8e3da', floorMat: 13, trim: '#c9a14a', luxe: true };
    m.objects = [
      { k: 'counter', id: 'desk', x: 6, z: 3.4, w: 5, rot: 0, luxe: true },
      { k: 'bell', id: 'bell', x: 5, z: 3.4 }, { k: 'register', id: 'register', x: 7.4, z: 3.4 },
      { k: 'keyrack', id: 'keys', x: 5, z: 0.1 }, { k: 'plans', id: 'plans', x: 8.6, z: 0.1 },
      { k: 'elevator', x: 11.5, z: 0.1 }, { k: 'elevator', x: 13.5, z: 0.1 },
      { k: 'chandelier', x: 8, z: 6 },
      { k: 'sofa', x: 3, z: 8, rot: Math.PI / 2 }, { k: 'sofa', x: 6, z: 9.6, rot: Math.PI }, { k: 'coffeetable', x: 4.6, z: 8.4 },
      { k: 'plant', x: 0.7, z: 0.7 }, { k: 'plant', x: 15.2, z: 4.0 }, { k: 'plant', x: 10, z: 0.7 },
      { k: 'rug', x: 8, z: 7, w: 6, d: 4, col: '#7a2236' },
      { k: 'barcounter', x: 13.6, z: 8, d: 4 },
      { k: 'partition', x: 2.4, z: 0, d: 2.6 },
      { k: 'safe', id: 'safe', x: 0.7, z: 1.2 }, { k: 'cot', id: 'cot', x: 0.9, z: 9.4, luxe: true },
    ];
    m.exits = [{ x: 7, z: 11, w: 2, h: 1, to: 'city', dir: 'down', back: 'officedoor' }];
    m.spawn = { x: 8, z: 10.4, dir: 'up' };
    return m;
  };
  // a motel room (shared template, state comes from the room record)
  MAPS.room = () => {
    const m = room(7, 7);
    m.walls = { n: true, w: true, wallCol: '#b8a890', wallMat: 11, floorCol: '#5a3a3a', floorMat: 12, trim: '#5a3a2a' };
    m.objects = [
      { k: 'bed', id: 'bed', x: 2.0, z: 2.0 },
      { k: 'nightstand', x: 3.4, z: 0.6 }, { k: 'lamp', x: 3.4, z: 0.6, y: 0.55, small: true },
      { k: 'tvstand', id: 'tv', x: 5.6, z: 0.5 },
      { k: 'bathroom', id: 'bath', x: 6.2, z: 4.0 },
      { k: 'mess', id: 'trash1', x: 4.6, z: 3.4, n: 0 }, { k: 'mess', id: 'trash2', x: 1.6, z: 4.6, n: 1 }, { k: 'mess', id: 'stain', x: 4.0, z: 5.2, n: 2 },
      { k: 'hole', id: 'hole', x: 0.1, z: 4.4 }, { k: 'wiring', id: 'wiring', x: 4.8, z: 0.1 },
      { k: 'window', x: 1.2, z: 0.05 },
      { k: 'stash', id: 'roomstash', x: 0.5, z: 5.8 },
      { k: 'ac', x: 2.6, z: 0.05 },
    ];
    m.exits = [{ x: 3, z: 6, w: 2, h: 1, to: 'city', dir: 'down', back: 'room' }];
    m.spawn = { x: 3.5, z: 5.6, dir: 'up' };
    return m;
  };
  MAPS.pawn = () => {
    const m = room(9, 7);
    m.walls = { n: true, w: true, wallCol: '#5a4a3a', wallMat: 3, floorCol: '#4a4a44', floorMat: 1, trim: '#2a2018' };
    m.objects = [
      { k: 'glasscase', id: 'counter', x: 5.4, z: 2.6, w: 4 }, { k: 'glasscase', x: 7.4, z: 4.6, w: 2, rot: Math.PI / 2 },
      { k: 'npcspot', id: 'gus', x: 5.4, z: 1.4 },
      { k: 'guitarwall', x: 2.5, z: 0.1 }, { k: 'tvstack', x: 0.6, z: 3.8 }, { k: 'safe', x: 8.4, z: 0.7 },
      { k: 'neonwall', x: 5.4, z: 0.1, text: 'WE BUY GOLD', col: '#ffd84a' },
      { k: 'shelf', x: 0.4, z: 1.4, rot: Math.PI / 2 }, { k: 'bikes', x: 2.4, z: 5.6 },
    ];
    m.exits = [{ x: 0, z: 4, w: 1, h: 2, to: 'city', dir: 'left', back: 'pawnIn' }];
    m.spawn = { x: 1.5, z: 4.5, dir: 'right' };
    m.flipX = true; // entrance on the west side
    return m;
  };
  MAPS.mart = () => {
    const m = room(9, 7);
    m.walls = { n: true, w: true, wallCol: '#e8e2d8', wallMat: 11, floorCol: '#d8d2c8', floorMat: 1, trim: '#c8443c' };
    m.objects = [
      { k: 'counter', id: 'martdesk', x: 2.6, z: 1.6, w: 2.4 }, { k: 'register', id: 'martreg', x: 2.6, z: 1.6 },
      { k: 'npcspot', id: 'raj', x: 2.6, z: 0.8 },
      { k: 'aisle', x: 5.5, z: 2.5, len: 3.0 }, { k: 'aisle', x: 5.5, z: 4.6, len: 3.0 },
      { k: 'cooler', x: 6.5, z: 0.1, n: 3 }, { k: 'lotto', id: 'lotto', x: 0.8, z: 2.6 },
      { k: 'icecream', x: 8.3, z: 5.4 }, { k: 'magrack', x: 0.4, z: 5.0, rot: Math.PI / 2 },
    ];
    m.exits = [{ x: 0, z: 3, w: 1, h: 2, to: 'city', dir: 'left', back: 'martIn' }];
    m.spawn = { x: 1.5, z: 4.0, dir: 'right' };
    return m;
  };
  MAPS.diner = () => {
    const m = room(10, 8);
    m.walls = { n: true, w: true, wallCol: '#e8e2d8', wallMat: 11, floorCol: '#e8e2d8', floorMat: 1, trim: '#c8443c', checker: true };
    m.objects = [
      { k: 'dinercounter', id: 'counter', x: 6.0, z: 1.8, w: 6 },
      { k: 'stool', x: 4, z: 2.7 }, { k: 'stool', x: 5.2, z: 2.7 }, { k: 'stool', x: 6.4, z: 2.7 }, { k: 'stool', x: 7.6, z: 2.7 },
      { k: 'booth', id: 'booth1', x: 9.0, z: 5.0 }, { k: 'booth', id: 'booth2', x: 9.0, z: 7.0 },
      { k: 'booth', id: 'booth3', x: 4.5, z: 6.6, rot: Math.PI / 2 },
      { k: 'jukebox', id: 'jukebox', x: 0.6, z: 1.0 },
      { k: 'npcspot', id: 'dina', x: 6.0, z: 0.9 },
      { k: 'pies', x: 8.4, z: 1.8 },
    ];
    m.exits = [{ x: 0, z: 4, w: 1, h: 2, to: 'city', dir: 'left', back: 'dinerIn' }];
    m.spawn = { x: 1.5, z: 4.5, dir: 'right' };
    return m;
  };
  // the Underline: abandoned metro platform turned black market (the reference scene)
  MAPS.metro = () => {
    const m = grid(24, 12, 'tiles');
    m.indoor = true; m.underground = true;
    m.rect(0, 6, 24, 6, 'void');                // track pit (walls handled by model)
    m.walls = { n: true, w: true, wallCol: '#24285a', wallMat: 11, floorCol: '#b9b3a8', floorMat: 1, trim: '#3a3d48', metro: true, wear: 0.9 };
    m.objects = [
      { k: 'metrostairs', x: 3.0, z: 0 },
      { k: 'tracks', x: 0, z: 6, w: 24 },
      { k: 'subwaycar', id: 'train', x: 15, z: 9 },
      { k: 'stall', id: 'sable', x: 10.5, z: 1.4, col: '#b44bff', text: 'SABLE' },
      { k: 'stall', id: 'doc', x: 16.5, z: 1.4, col: '#3ff0ff', text: 'DOC' },
      { k: 'crates', x: 20.5, z: 1.8, n: 4 }, { k: 'npcspot', id: 'crateguy', x: 21.5, z: 3.0 },
      { k: 'bench', x: 7.4, z: 1.0, rot: 0 },
      { k: 'barrelfire', id: 'fire', x: 6.0, z: 4.4 },
      { k: 'metrorail', x0: 0.6, x1: 2.4, z: 3.6 },
      { k: 'rubble', x: 12, z: 4, n: 18 },
      { k: 'tube', x: 4, z: 0.6 }, { k: 'tube', x: 9.5, z: 0.6 }, { k: 'tube', x: 15, z: 0.6 }, { k: 'tube', x: 20.5, z: 0.6 },
      { k: 'neonstrip', x: 23.6, z: 2.6, col: '#b44bff' },
      { k: 'graffitiwall', x: 13.5, z: 0.12, w: 3, h: 1.2, dir: 'x', seed: 9 },
    ];
    m.exits = [{ x: 3, z: 0, w: 2, h: 1, to: 'city', dir: 'down', back: 'metro' }];
    m.spawn = { x: 4.5, z: 2.0, dir: 'down' };
    return m;
  };
  MAPS.precinct = () => {
    const m = room(11, 8);
    m.walls = { n: true, w: true, wallCol: '#a8b0b8', wallMat: 11, floorCol: '#8a9098', floorMat: 1, trim: '#22305a' };
    m.objects = [
      { k: 'counter', id: 'frontdesk', x: 5, z: 2.6, w: 4 }, { k: 'npcspot', id: 'deskcop', x: 5, z: 1.6 },
      { k: 'bench', x: 1.2, z: 5.0, rot: Math.PI / 2 }, { k: 'corkboard', id: 'wanted', x: 2, z: 0.1, text: 'WANTED' },
      { k: 'cell', x: 9.2, z: 2.0 }, { k: 'door', id: 'captain', x: 7.6, z: 0.1, label: 'CAPTAIN' },
      { k: 'flag', x: 0.5, z: 0.6 }, { k: 'watercooler', x: 3.6, z: 0.45 }, { k: 'desk', x: 2.5, z: 3.6 },
    ];
    m.exits = [{ x: 4, z: 7, w: 2, h: 1, to: 'city', dir: 'down', back: 'precinctIn' }];
    m.spawn = { x: 5, z: 6.4, dir: 'up' };
    return m;
  };
  MAPS.laundry = () => {
    const m = room(8, 7);
    m.walls = { n: true, w: true, wallCol: '#9ad8e8', wallMat: 11, floorCol: '#d8d8d0', floorMat: 1, trim: '#2f6a9a' };
    m.objects = [
      { k: 'washers', id: 'washer', x: 4, z: 0.6, n: 5 }, { k: 'dryers', x: 0.6, z: 3.5, n: 3 },
      { k: 'foldtable', x: 4.2, z: 3.4 }, { k: 'chair', x: 6.6, z: 5.4, rot: -Math.PI / 2 }, { k: 'changemachine', id: 'change', x: 7.4, z: 0.5 },
    ];
    m.exits = [{ x: 3, z: 6, w: 1, h: 1, to: 'city', dir: 'down', back: 'laundryIn' }];
    m.spawn = { x: 3.5, z: 5.4, dir: 'up' };
    return m;
  };
  MAPS.bar = () => {
    const m = room(10, 8);
    m.walls = { n: true, w: true, wallCol: '#2a2236', wallMat: 3, floorCol: '#3a2a22', floorMat: 4, trim: '#4f7bff', dark: true };
    m.objects = [
      { k: 'barcounter', id: 'bartender', x: 2.2, z: 3.5, d: 5, rot: 0, long: true }, { k: 'npcspot', id: 'mo', x: 1.2, z: 3.4 },
      { k: 'stage', x: 7.5, z: 1.2 }, { k: 'stool', x: 3.0, z: 2.0 }, { k: 'stool', x: 3.0, z: 3.2 }, { k: 'stool', x: 3.0, z: 4.4 },
      { k: 'roundtable', x: 6, z: 4.6 }, { k: 'roundtable', x: 8.2, z: 5.6 }, { k: 'jukebox', x: 9.4, z: 3.2 },
      { k: 'neonwall', x: 5, z: 0.1, text: 'LIVE JAZZ', col: '#4f7bff' }, { k: 'pooltable', id: 'pooltable', x: 6.4, z: 6.8 },
    ];
    m.exits = [{ x: 4, z: 7, w: 1, h: 1, to: 'city', dir: 'down', back: 'barIn' }];
    m.spawn = { x: 4.5, z: 6.4, dir: 'up' };
    return m;
  };
  MAPS.warehouse = () => {
    const m = room(13, 9);
    m.walls = { n: true, w: true, wallCol: '#5a5048', wallMat: 5, floorCol: '#6a6660', floorMat: 2, trim: '#3a3430', wear: 0.9 };
    m.objects = [
      { k: 'crates', x: 2, z: 1.5, n: 6 }, { k: 'crates', x: 10, z: 2, n: 5 }, { k: 'forklift', x: 8.5, z: 5, rot: 0.6 },
      { k: 'pallet', x: 4, z: 5 }, { k: 'loft', x: 9, z: 0 }, { k: 'cot', id: 'raycot', x: 11.6, z: 6.4 },
      { k: 'lamp', x: 11.0, z: 5.4, small: true, y: 0 }, { k: 'barrelfire', x: 6, z: 3 }, { k: 'npcspot', id: 'ray', x: 10.8, z: 6.6 },
      { k: 'desk', id: 'raydesk', x: 3.4, z: 7.0 },
    ];
    m.exits = [{ x: 5, z: 8, w: 2, h: 1, to: 'city', dir: 'down', back: 'warehouseIn' }];
    m.spawn = { x: 6, z: 7.4, dir: 'up' };
    return m;
  };
  MAPS.trailer = () => {
    const m = room(7, 5);
    m.walls = { n: true, w: true, wallCol: '#e8e2d8', wallMat: 11, floorCol: '#5a5a64', floorMat: 12, trim: '#c9a14a' };
    m.objects = [
      { k: 'desk', id: 'vancedesk', x: 4.4, z: 1.4 }, { k: 'chair', x: 4.4, z: 0.6, rot: 0 }, { k: 'filecab', id: 'files', x: 6.4, z: 0.5 },
      { k: 'model', x: 1.4, z: 1.4 }, { k: 'plant', x: 0.5, z: 0.5 },
    ];
    m.exits = [{ x: 2, z: 4, w: 1, h: 1, to: 'city', dir: 'down', back: 'trailerIn' }];
    m.spawn = { x: 2.5, z: 3.4, dir: 'up' };
    return m;
  };

  window.MAPS = MAPS;
  window.MAPGRID = grid;
})();
