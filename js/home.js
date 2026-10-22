// Home: Aurora Tower penthouses. Pick a floor plan (rent or buy), look out at a living skyline,
// order furniture on your phone (next-morning or express delivery) and place it yourself.
(function () {
  const { MB, MT, W, P, R, pick, shade, text } = KIT;
  const K = BUILD.K, F = INT.F;
  const S = () => G.S, I = DATA.ITEMS, H = STORY.H;
  const say = (who, t, o) => UI.say(who, t, o), me = t => UI.say('player', t), narr = t => UI.say(null, t);
  const choose = o => UI.choose(o);
  const fmt$ = n => '$' + Math.round(n).toLocaleString();
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  const absMin = () => (S().day - 1) * 1440 + S().clock;
  const { tap } = UI._mg;
  G.evt = G.evt || (() => { });

  // =====================================================================
  // floor plans
  // =====================================================================
  const PLANS = {
    loft: { name: 'Sky Loft', floor: 30, w: 11, h: 9, rent: 250, buy: 9000, glass: 'n', desc: 'An open studio with one glass wall over the city. Kitchenette, rain shower.' },
    corner: { name: 'Corner Suite', floor: 34, w: 15, h: 11, rent: 600, buy: 22000, glass: 'nw', desc: 'Two walls of glass on the corner. Kitchen island, walk-in closet, room to entertain.' },
    crown: { name: 'The Crown', floor: 41, w: 19, h: 15, rent: 1500, buy: 55000, glass: 'nw', terrace: 4, desc: 'The entire top floor. A terrace with an infinity pool, and the whole city at your feet.' },
  };
  G.PLANS = PLANS;
  const the = id => /^The /.test(PLANS[id].name) ? PLANS[id].name : 'the ' + PLANS[id].name;
  const home = () => S().home;
  function ensureHome() {
    const s = S();
    if (!s.home) s.home = { plan: null, owned: false, items: [], storage: {}, pending: [], uid: 1 };
    // players who bought the old penthouse get the Corner Suite, furnished
    if (s.flags.penthouse && !s.home.plan && !s.home.migrated) {
      s.home.migrated = true; s.home.plan = 'corner'; s.home.owned = true;
      for (const [id, x, z, rot] of [['bed_king', 2.2, 5.2, 0], ['sofa_l', 7, 6.2, 0], ['ctable', 6.5, 4.4, 0], ['tvwall', 6.5, 1.0, 0], ['rug_big', 6.8, 5, 0], ['hottub', 10.2, 8.6, 0], ['barcart', 8, 10.3, 0], ['pooltable', 9.5, 1.4, 0], ['floorlamp', 4, 2.0, 0]]) s.home.items.push({ uid: s.home.uid++, id, x, z, rot });
    }
    return s.home;
  }

  // =====================================================================
  // furniture: modern pieces in white, charcoal, walnut and brass
  // =====================================================================
  const WH = '#f2f0ec', CH = '#2a2a30', WN = '#6a4a32', BR = '#c9a14a', MB_ = '#e8e6e0', GY = '#8a8a92';
  const box = (mb, x, y, z, w, h, d, c, o) => mb.box(x, y, z, w, h, d, c, o);
  const FURN = {
    bed_mattress: { name: 'Floor Mattress', cat: 'Bedroom', price: 120, w: 1.6, d: 2.1, comfort: 1, verbs: ['sleep'], b: mb => { box(mb, 0, 0, 0, 1.5, 0.22, 2.0, WH, { mat: W(MT.plain, 0.3) }); box(mb, 0, 0.22, -0.75, 1.3, 0.12, 0.4, '#d8d4cc'); } },
    bed_king: { name: 'Platform King Bed', cat: 'Bedroom', price: 2400, w: 2.4, d: 2.5, comfort: 4, verbs: ['sleep'], b: mb => { box(mb, 0, 0, 0, 2.3, 0.3, 2.4, WN, { mat: W(MT.wood, 0.2) }); box(mb, 0, 0.3, 0.1, 2.1, 0.25, 2.1, WH, { mat: W(MT.plain, 0.2) }); box(mb, 0, 0.3, -1.12, 2.3, 1.0, 0.16, '#5a5a64', { mat: W(MT.carpet, 0.2) }); box(mb, -0.5, 0.55, -0.85, 0.8, 0.16, 0.4, '#e8e4dc'); box(mb, 0.5, 0.55, -0.85, 0.8, 0.16, 0.4, '#e8e4dc'); box(mb, 0, 0.55, 0.55, 2.12, 0.04, 0.8, '#2f8a8a'); } },
    nightstand: { name: 'Floating Nightstand', cat: 'Bedroom', price: 260, w: 0.6, d: 0.5, verbs: [], b: mb => { box(mb, 0, 0.3, 0, 0.55, 0.3, 0.45, WN, { mat: W(MT.wood, 0.2) }); box(mb, 0, 0.6, 0, 0.12, 0.3, 0.12, BR); box(mb, 0, 0.9, 0, 0.3, 0.22, 0.3, '#ffe8c0', { emit: 0.9 }); }, light: [0, 1.0, 0, 2.6, [1, 0.85, 0.6], 0.6] },
    sofa_mod: { name: 'Modular Sofa', cat: 'Living', price: 1600, w: 2.6, d: 1.0, comfort: 2, verbs: ['relax'], b: mb => { box(mb, 0, 0, 0, 2.6, 0.12, 1.0, CH); box(mb, 0, 0.12, 0.05, 2.5, 0.28, 0.85, '#9a9aa4', { mat: W(MT.carpet, 0.2) }); box(mb, 0, 0.12, -0.42, 2.6, 0.62, 0.18, '#8a8a94', { mat: W(MT.carpet, 0.2) }); for (const x of [-0.9, 0, 0.9]) box(mb, x, 0.4, -0.2, 0.7, 0.3, 0.12, '#b8b8c0'); } },
    sofa_l: { name: 'L Sectional', cat: 'Living', price: 2800, w: 3.0, d: 2.0, comfort: 3, verbs: ['relax'], b: mb => { box(mb, 0, 0, -0.5, 3.0, 0.12, 1.0, CH); box(mb, 1.0, 0, 0.5, 1.0, 0.12, 1.0, CH); box(mb, 0, 0.12, -0.45, 2.9, 0.28, 0.85, '#e8e2d8', { mat: W(MT.carpet, 0.2) }); box(mb, 1.0, 0.12, 0.5, 0.9, 0.28, 1.0, '#e8e2d8', { mat: W(MT.carpet, 0.2) }); box(mb, 0, 0.12, -0.92, 3.0, 0.62, 0.16, '#d8d2c8', { mat: W(MT.carpet, 0.2) }); box(mb, 1.42, 0.12, 0.5, 0.16, 0.62, 1.0, '#d8d2c8'); box(mb, -0.6, 0.4, -0.7, 0.45, 0.3, 0.12, '#2f8a8a'); box(mb, 0.2, 0.4, -0.7, 0.45, 0.3, 0.12, BR); } },
    lounge: { name: 'Lounge Chair & Ottoman', cat: 'Living', price: 1200, w: 1.0, d: 1.6, comfort: 1, verbs: ['relax'], b: mb => { box(mb, 0, 0, -0.2, 0.08, 0.3, 0.08, CH); box(mb, 0, 0.3, -0.2, 0.85, 0.12, 0.8, WN, { mat: W(MT.wood, 0.2) }); box(mb, 0, 0.42, -0.15, 0.75, 0.12, 0.7, '#1e1e24'); box(mb, 0, 0.42, -0.55, 0.75, 0.75, 0.12, '#1e1e24'); box(mb, 0, 0, 0.55, 0.6, 0.38, 0.5, '#1e1e24'); } },
    ctable: { name: 'Marble Coffee Table', cat: 'Living', price: 700, w: 1.4, d: 0.8, b: mb => { for (const [x, z] of [[-0.55, -0.28], [0.55, -0.28], [-0.55, 0.28], [0.55, 0.28]]) box(mb, x, 0, z, 0.05, 0.36, 0.05, BR); box(mb, 0, 0.36, 0, 1.4, 0.06, 0.8, MB_, { mat: W(MT.marble, 0.1) }); box(mb, 0.3, 0.42, 0, 0.3, 0.05, 0.22, '#c8443c'); box(mb, -0.3, 0.42, 0.1, 0.12, 0.2, 0.12, '#59ff8a', { sway: 0.3 }); } },
    dining: { name: 'Walnut Dining Set', cat: 'Living', price: 1900, w: 2.2, d: 1.8, verbs: ['eat'], b: mb => { box(mb, 0, 0, 0, 0.2, 0.72, 0.2, CH); box(mb, 0, 0.72, 0, 1.8, 0.06, 0.95, WN, { mat: W(MT.wood, 0.15) }); for (const [x, z] of [[-0.5, -0.7], [0.5, -0.7], [-0.5, 0.7], [0.5, 0.7]]) { box(mb, x, 0, z, 0.42, 0.45, 0.42, CH); box(mb, x, 0.45, z + (z < 0 ? -0.18 : 0.18), 0.42, 0.45, 0.06, CH); } box(mb, 0, 0.78, 0, 0.2, 0.2, 0.2, '#e8e2d8'); } },
    tvwall: { name: '85" TV + Console', cat: 'Entertainment', price: 2200, w: 2.4, d: 0.5, verbs: ['watch'], b: mb => { box(mb, 0, 0, 0, 2.4, 0.42, 0.45, CH); box(mb, 0, 0.5, -0.1, 2.0, 1.15, 0.06, '#0a0a10'); box(mb, 0, 0.55, -0.065, 1.9, 1.05, 0.01, '#3a6aa8', { emit: 0.9 }); box(mb, -0.6, 0.42, 0.1, 0.5, 0.06, 0.15, '#c8ccd4'); }, light: [0, 1.0, 0.8, 3, [0.5, 0.7, 1], 0.6] },
    theater: { name: 'Home Theater', cat: 'Entertainment', price: 4200, w: 3.2, d: 0.6, verbs: ['watch'], b: mb => { box(mb, 0, 0, 0, 3.2, 0.36, 0.5, CH); box(mb, 0, 0.45, -0.12, 2.6, 1.45, 0.06, '#0a0a10'); box(mb, 0, 0.5, -0.085, 2.5, 1.35, 0.01, '#c84a8a', { emit: 0.9 }); for (const x of [-1.5, 1.5]) box(mb, x, 0, 0.0, 0.3, 1.3, 0.3, '#18181e'); box(mb, 0, 0.36, 0.15, 1.6, 0.1, 0.12, '#18181e'); }, light: [0, 1.2, 0.9, 3.5, [1, 0.5, 0.8], 0.7] },
    gaming: { name: 'Gaming Battlestation', cat: 'Entertainment', price: 3000, w: 1.8, d: 1.2, verbs: ['game'], b: mb => { box(mb, 0, 0.7, -0.2, 1.7, 0.05, 0.7, CH); for (const x of [-0.75, 0.75]) box(mb, x, 0, -0.2, 0.06, 0.7, 0.6, CH); for (const [x, r] of [[-0.6, 0.4], [0, 0], [0.6, -0.4]]) box(mb, x, 0.85, -0.45, 0.5, 0.32, 0.03, '#18181e'); box(mb, -0.6, 0.88, -0.43, 0.46, 0.28, 0.01, '#59ff8a', { emit: 1 }); box(mb, 0, 0.88, -0.43, 0.46, 0.28, 0.01, '#3ff0ff', { emit: 1 }); box(mb, 0.6, 0.88, -0.43, 0.46, 0.28, 0.01, '#ff4fa3', { emit: 1 }); box(mb, 0, 0.755, -0.05, 1.6, 0.01, 0.04, '#b44bff', { emit: 1.4 }); box(mb, 0, 0, 0.4, 0.55, 0.5, 0.55, '#c8443c'); box(mb, 0, 0.5, 0.62, 0.55, 0.7, 0.1, '#c8443c'); }, light: [0, 1.0, 0.2, 2.8, [0.6, 0.4, 1], 0.7] },
    arcade: { name: 'Neon Arcade Cabinet', cat: 'Entertainment', price: 1500, w: 0.8, d: 0.8, verbs: ['game'], b: mb => { box(mb, 0, 0, 0, 0.75, 1.8, 0.7, '#18101e'); box(mb, 0, 1.0, 0.25, 0.6, 0.45, 0.04, '#59ff8a', { emit: 1 }); box(mb, 0, 0.8, 0.32, 0.7, 0.08, 0.2, '#2a2a30'); box(mb, 0, 1.6, 0.3, 0.7, 0.2, 0.06, '#ff4fa3', { emit: 1.2 }); box(mb, -0.38, 0, 0, 0.02, 1.8, 0.7, '#3ff0ff', { emit: 0.8 }); box(mb, 0.38, 0, 0, 0.02, 1.8, 0.7, '#3ff0ff', { emit: 0.8 }); }, light: [0, 1.2, 0.8, 2.6, [0.4, 1, 0.6], 0.6] },
    aquarium: { name: 'Reef Aquarium', cat: 'Decor', price: 3400, w: 2.2, d: 0.7, verbs: ['fish'], b: mb => { box(mb, 0, 0, 0, 2.2, 0.75, 0.65, CH); box(mb, 0, 0.75, 0, 2.1, 0.95, 0.6, '#3fa8d8', { emit: 0.7, mat: W(MT.water, 0) }); for (let k = 0; k < 8; k++) box(mb, -0.85 + k * 0.24, 0.9 + (k % 3) * 0.22, 0.31, 0.12, 0.06, 0.01, ['#ff8a3a', '#ffd84a', '#ff4fa3', '#e8e2d8'][k % 4], { emit: 0.5 }); for (let k = 0; k < 5; k++) box(mb, -0.8 + k * 0.4, 0.75, 0, 0.1, 0.3 + (k % 2) * 0.25, 0.1, '#3a8a5a', { sway: 0.6 }); box(mb, 0, 1.7, 0, 2.2, 0.06, 0.65, CH); }, light: [0, 1.2, 0.6, 3.2, [0.3, 0.75, 1], 0.9] },
    bookshelf: { name: 'Walnut Bookshelf', cat: 'Decor', price: 900, w: 1.6, d: 0.4, verbs: ['study'], b: mb => { box(mb, 0, 0, 0, 1.6, 2.1, 0.38, WN, { mat: W(MT.wood, 0.2) }); for (let r = 0; r < 4; r++) for (let k = 0; k < 9; k++) if (R(k, r, 4) > 0.2) box(mb, -0.68 + k * 0.16, 0.12 + r * 0.5, 0.06, 0.1, 0.32 + R(k, r, 5) * 0.08, 0.26, ['#c8443c', '#2f6a9a', '#e8e2d8', '#3a8a5a', '#c9a14a', '#18181e'][(k + r) % 6]); } },
    floorlamp: { name: 'Brass Arc Lamp', cat: 'Decor', price: 450, w: 0.6, d: 0.6, b: mb => { box(mb, 0, 0, 0, 0.4, 0.06, 0.4, MB_); box(mb, 0, 0.06, 0, 0.05, 1.7, 0.05, BR); box(mb, 0.35, 1.72, 0, 0.75, 0.05, 0.05, BR); box(mb, 0.7, 1.45, 0, 0.36, 0.26, 0.36, '#ffe8c0', { emit: 1 }); }, light: [0.7, 1.4, 0, 4, [1, 0.82, 0.55], 0.9] },
    art: { name: 'Abstract Canvas', cat: 'Decor', price: 1300, w: 1.6, d: 0.4, verbs: ['admire'], b: mb => { box(mb, -0.6, 0, 0, 0.05, 0.6, 0.3, CH); box(mb, 0.6, 0, 0, 0.05, 0.6, 0.3, CH); box(mb, 0, 0.6, 0, 1.5, 1.2, 0.06, WH); box(mb, -0.3, 0.75, 0.035, 0.6, 0.7, 0.01, '#ff4fa3'); box(mb, 0.25, 0.95, 0.036, 0.5, 0.6, 0.01, '#3ff0ff'); box(mb, 0.1, 0.7, 0.037, 0.35, 0.3, 0.01, '#ffd84a'); } },
    sculpture: { name: 'Twisted Sculpture', cat: 'Decor', price: 2600, w: 0.7, d: 0.7, verbs: ['admire'], b: mb => { box(mb, 0, 0, 0, 0.6, 0.9, 0.6, WH, { mat: W(MT.marble, 0.1) }); for (let k = 0; k < 8; k++) { mb.at(0, 0.9 + k * 0.15, 0, k * 0.35); box(mb, 0, 0, 0, 0.42, 0.14, 0.12, BR, { emit: 0.15 }); mb.pop(); } } },
    rug_big: { name: 'Large Wool Rug', cat: 'Decor', price: 600, w: 3.4, d: 2.4, walk: true, b: mb => { box(mb, 0, 0.005, 0, 3.4, 0.02, 2.4, '#c8c0b4', { mat: W(MT.carpet, 0.2) }); box(mb, 0, 0.01, 0, 3.0, 0.02, 2.0, '#d8d0c4', { mat: W(MT.carpet, 0.2) }); } },
    rug_round: { name: 'Round Rug', cat: 'Decor', price: 380, w: 2.0, d: 2.0, walk: true, b: mb => mb.cyl(0, 0.005, 0, 1.0, 0.02, 16, '#2f6a6a', { mat: W(MT.carpet, 0.2) }) },
    plant_fig: { name: 'Fiddle Leaf Fig', cat: 'Decor', price: 220, w: 0.6, d: 0.6, b: mb => { box(mb, 0, 0, 0, 0.45, 0.45, 0.45, WH, { mat: W(MT.plain, 0.2) }); mb.cyl(0, 0.45, 0, 0.04, 0.8, 5, P.woodD); mb.sphere(0, 1.5, 0, 0.45, '#3a7a3a', { detail: 1, jitter: 0.2, seed: 3, sway: 0.4 }); mb.sphere(0.15, 1.15, 0.1, 0.32, '#4a8a4a', { detail: 1, jitter: 0.2, seed: 4, sway: 0.4 }); } },
    olive: { name: 'Potted Olive Tree', cat: 'Decor', price: 480, w: 0.8, d: 0.8, b: mb => { box(mb, 0, 0, 0, 0.7, 0.55, 0.7, CH); mb.cyl(0, 0.55, 0, 0.05, 1.0, 5, '#8a7a5a'); mb.sphere(0, 1.9, 0, 0.6, '#7a9a6a', { detail: 1, jitter: 0.25, seed: 7, sway: 0.4 }); } },
    piano: { name: 'Grand Piano', cat: 'Entertainment', price: 6500, w: 1.6, d: 2.0, verbs: ['piano'], b: mb => { for (const [x, z] of [[-0.6, -0.7], [0.6, -0.7], [0, 0.8]]) box(mb, x, 0, z, 0.1, 0.62, 0.1, '#0a0a0e'); box(mb, 0, 0.62, 0, 1.5, 0.32, 1.9, '#0a0a0e', { mat: W(MT.plain, 0.05) }); box(mb, 0, 0.94, -0.85, 1.4, 0.02, 0.2, WH); box(mb, 0.3, 0.94, 0.1, 0.05, 0.9, 1.5, '#0a0a0e'); box(mb, 0, 0, -1.3, 0.8, 0.45, 0.35, '#0a0a0e'); } },
    pooltable: { name: 'Pool Table', cat: 'Entertainment', price: 2900, w: 2.6, d: 1.6, verbs: ['pool'], b: mb => F.pooltable(mb, 0, 0) },
    winefridge: { name: 'Wine Fridge', cat: 'Kitchen', price: 1100, w: 0.7, d: 0.6, verbs: ['drink'], b: mb => { box(mb, 0, 0, 0, 0.65, 1.8, 0.55, CH); box(mb, 0, 0.1, 0.28, 0.55, 1.6, 0.01, '#2a1a2a', { emit: 0.2 }); for (let r = 0; r < 6; r++) for (let k = 0; k < 3; k++) box(mb, -0.18 + k * 0.18, 0.2 + r * 0.26, 0.27, 0.1, 0.06, 0.01, '#7a1a2a', { emit: 0.4 }); }, light: [0, 1, 0.5, 1.6, [1, 0.4, 0.5], 0.4] },
    barcart: { name: 'Brass Bar Cart', cat: 'Kitchen', price: 650, w: 1.0, d: 0.6, verbs: ['drink'], b: mb => { for (const [x, z] of [[-0.42, -0.22], [0.42, -0.22], [-0.42, 0.22], [0.42, 0.22]]) box(mb, x, 0, z, 0.04, 0.85, 0.04, BR); box(mb, 0, 0.3, 0, 0.9, 0.03, 0.5, '#c8ccd4', { mat: W(MT.glass, 0.1) }); box(mb, 0, 0.82, 0, 0.9, 0.03, 0.5, '#c8ccd4', { mat: W(MT.glass, 0.1) }); for (let k = 0; k < 4; k++) box(mb, -0.3 + k * 0.2, 0.85, 0, 0.08, 0.3, 0.08, ['#59ff8a', '#ffd84a', '#c8443c', '#e8e2d8'][k], { emit: 0.3 }); } },
    fireplace: { name: 'Floating Fireplace', cat: 'Decor', price: 3800, w: 1.8, d: 0.6, verbs: ['relax'], b: mb => { box(mb, 0, 0, 0, 1.8, 0.3, 0.6, CH); box(mb, 0, 0.3, 0, 1.6, 0.6, 0.5, '#0a0a0e'); for (let k = 0; k < 6; k++) box(mb, -0.6 + k * 0.24, 0.32, 0.05, 0.14, 0.2 + R(k, 1, 3) * 0.25, 0.1, k % 2 ? '#ffb43a' : '#ff6a2a', { emit: 1.6 }); box(mb, 0, 0.9, 0, 1.8, 1.0, 0.5, '#3a3a40'); }, light: [0, 0.6, 0.6, 4, [1, 0.55, 0.25], 1.1] },
    telescope: { name: 'Brass Telescope', cat: 'Decor', price: 1700, w: 0.8, d: 0.8, verbs: ['scope'], b: mb => { for (const a of [0, 2.1, 4.2]) box(mb, Math.cos(a) * 0.25, 0, Math.sin(a) * 0.25, 0.04, 1.1, 0.04, WN); mb.at(0, 1.15, 0, 0.6, 1, 0.6); box(mb, 0, 0, 0, 0.14, 0.14, 1.0, BR); mb.pop(); } },
    treadmill: { name: 'Treadmill', cat: 'Fitness', price: 1400, w: 0.9, d: 2.0, verbs: ['run'], b: mb => { box(mb, 0, 0, 0.1, 0.8, 0.18, 1.8, CH); box(mb, 0, 0.18, 0.1, 0.6, 0.02, 1.6, '#3a3a40'); for (const x of [-0.35, 0.35]) box(mb, x, 0.18, -0.75, 0.05, 1.0, 0.05, GY); box(mb, 0, 1.15, -0.75, 0.75, 0.2, 0.15, CH); box(mb, 0, 1.2, -0.68, 0.4, 0.12, 0.01, '#3ff0ff', { emit: 1 }); } },
    desk_work: { name: 'Minimal Desk + Laptop', cat: 'Office', price: 800, w: 1.5, d: 0.8, verbs: ['study'], b: mb => { box(mb, 0, 0.72, 0, 1.5, 0.04, 0.7, WH); for (const x of [-0.7, 0.7]) box(mb, x, 0, 0, 0.04, 0.72, 0.65, CH); box(mb, 0, 0.76, 0, 0.42, 0.02, 0.3, GY); box(mb, 0, 0.78, -0.13, 0.42, 0.28, 0.02, '#18181e'); box(mb, 0, 0.8, -0.12, 0.38, 0.24, 0.01, '#a8dcff', { emit: 0.9 }); box(mb, 0, 0, 0.6, 0.5, 0.45, 0.5, CH); box(mb, 0, 0.45, 0.82, 0.5, 0.55, 0.06, CH); } },
    neonsign: { name: 'Custom Neon: NO VACANCY', cat: 'Decor', price: 900, w: 2.0, d: 0.3, b: mb => { box(mb, 0, 0, 0, 1.9, 1.6, 0.06, '#18101e'); text(mb, 'NO', -0.2, 1.05, 0.05, 0.05, '#ff4fa3', { emit: 1.8 }); text(mb, 'VACANCY', 0, 0.55, 0.05, 0.045, '#ff4fa3', { emit: 1.8 }); }, light: [0, 1.0, 0.8, 3.6, [1, 0.35, 0.7], 1.0] },
    hottub: { name: 'Hot Tub', cat: 'Fitness', price: 7500, w: 2.3, d: 2.3, verbs: ['soak'], b: mb => { box(mb, 0, 0, 0, 2.2, 0.6, 2.2, '#3a3a40', { mat: W(MT.tile, 0.1) }); box(mb, 0, 0.6, 0, 2.0, 0.06, 2.0, '#3fc8e8', { emit: 0.55, mat: W(MT.water, 0) }); for (const [x, z, w, d] of [[0, -1.03, 2.2, 0.14], [0, 1.03, 2.2, 0.14], [-1.03, 0, 0.14, 2.2], [1.03, 0, 0.14, 2.2]]) box(mb, x, 0.6, z, w, 0.15, d, '#2a2a30', { mat: W(MT.tile, 0.1) }); }, light: [0, 0.9, 0, 3.4, [0.3, 0.85, 1], 0.9] },
    safe2: { name: 'Hidden Wall Safe', cat: 'Office', price: 1200, w: 0.7, d: 0.6, verbs: ['safe'], b: mb => { box(mb, 0, 0, 0, 0.65, 0.9, 0.55, '#3a3a44', { mat: W(MT.metal, 0.2) }); mb.cyl(0.1, 0.45, 0.28, 0.12, 0.03, 10, BR); } },
    wardrobe: { name: 'Glass Wardrobe', cat: 'Bedroom', price: 1600, w: 1.8, d: 0.6, verbs: ['clothes'], b: mb => { box(mb, 0, 0, 0, 1.8, 2.2, 0.55, WN, { mat: W(MT.wood, 0.2) }); box(mb, 0, 0.1, 0.28, 1.7, 2.0, 0.02, '#2a3a4a', { mat: W(MT.glass, 0.1) }); for (let k = 0; k < 7; k++) box(mb, -0.7 + k * 0.23, 0.9, 0.1, 0.18, 1.0, 0.3, ['#c8443c', '#2c2c38', '#e8e2d8', '#ff4fa3', '#2f6a9a', '#c9a14a', '#18181e'][k]); box(mb, 0, 2.0, 0.27, 1.6, 0.03, 0.02, '#ffe8c0', { emit: 1 }); } },
  };
  G.FURN = FURN;
  // fixtures that come with every plan (can't be moved)
  K.furn = {
    build: (mb, o) => { const f = FURN[o.fid]; if (!f) return; mb.at(o.x, 0, o.z, o.rot || 0); f.b(mb, o); mb.pop(); },
    light: o => { const f = FURN[o.fid]; if (!f || !f.light) return null; const [lx, ly, lz, r, c, i] = f.light; const cs = Math.cos(o.rot || 0), sn = Math.sin(o.rot || 0); return { x: o.x + lx * cs + lz * sn, y: ly, z: o.z - lx * sn + lz * cs, r, c, i }; },
    h: 1.2,
  };
  K.kitchen = { build: (mb, o) => { mb.at(o.x, 0, o.z, o.rot || 0); const L = o.len || 4; box(mb, 0, 0, 0, L, 0.9, 0.65, WH, { mat: W(MT.plain, 0.15) }); box(mb, 0, 0.9, 0, L + 0.04, 0.05, 0.7, '#1e1e24', { mat: W(MT.marble, 0.1) }); box(mb, -L / 2 + 0.5, 0.95, 0, 0.6, 0.02, 0.45, '#3a3a40'); for (let k = 0; k < 4; k++) box(mb, -L / 2 + 0.38 + (k % 2) * 0.25, 0.97, -0.12 + Math.floor(k / 2) * 0.25, 0.14, 0.01, 0.14, '#ff4a2a', { emit: 0.3 }); box(mb, L / 2 - 0.4, 0, -0.02, 0.75, 2.2, 0.68, '#c8ccd4', { mat: W(MT.metal, 0.15) }); box(mb, 0.2, 0.92, -0.05, 0.6, 0.04, 0.4, '#c8ccd4', { mat: W(MT.metal, 0.1) }); box(mb, 0, 0.95, -0.32, L, 0.03, 0.02, '#ffe8c0', { emit: 1 }); mb.pop(); }, h: 1.2, light: o => ({ x: o.x, y: 1.6, z: o.z + 0.6, r: 3, c: [1, 0.9, 0.75], i: 0.6 }) };
  K.island = { build: (mb, o) => { box(mb, o.x, 0, o.z, o.w || 2.4, 0.92, 1.0, '#e8e6e0', { mat: W(MT.marble, 0.1) }); box(mb, o.x, 0.92, o.z, (o.w || 2.4) + 0.2, 0.06, 1.1, '#f2f0ec', { mat: W(MT.marble, 0.05) }); for (let k = 0; k < 3; k++) box(mb, o.x - 0.7 + k * 0.7, 0, o.z + 0.85, 0.35, 0.75, 0.35, CH); for (let k = 0; k < 3; k++) box(mb, o.x - 0.7 + k * 0.7, 2.6, o.z, 0.25, 0.3, 0.25, '#ffe8c0', { emit: 1 }); }, h: 1, light: o => ({ x: o.x, y: 2.2, z: o.z, r: 3.5, c: [1, 0.88, 0.7], i: 0.8 }) };
  K.bathpod = { build: (mb, o) => { const w = o.w || 3, d = o.d || 3; box(mb, o.x, 0, o.z, w, 0.02, d, '#d8d4cc', { mat: W(MT.tile, 0.1) }); box(mb, o.x - w / 2 + 0.05, 0, o.z, 0.1, 2.4, d, '#e8e6e0', { mat: W(MT.plaster, 0.1) }); box(mb, o.x, 0, o.z - d / 2 + 0.05, w, 2.4, 0.1, '#e8e6e0', { mat: W(MT.plaster, 0.1) }); box(mb, o.x + 0.4, 0, o.z + d / 2 - 0.05, w - 0.8, 2.4, 0.06, '#a8c8d8', { mat: W(MT.glass, 0.1) }); box(mb, o.x - 0.6, 0, o.z - 0.4, 1.3, 0.55, 1.6, WH, { mat: W(MT.plain, 0.1) }); box(mb, o.x - 0.6, 0.45, o.z - 0.4, 1.1, 0.08, 1.4, '#7ad8f0', { emit: 0.2, mat: W(MT.water, 0) }); box(mb, o.x + 0.8, 0, o.z - 0.9, 0.6, 0.85, 0.45, WH); box(mb, o.x + 0.8, 1.2, o.z - 1.1, 0.6, 0.7, 0.03, '#c8dce8', { mat: W(MT.glass, 0.05), emit: 0.2 }); }, h: 2.4 };
  K.glasswall = { build: (mb, o) => { // floor-to-ceiling glass: slim black mullions, no pane, so the city shows through
    const L = o.len, horiz = o.dir === 'x';
    const seg = (a, b) => horiz ? box(mb, o.x + a + b / 2 - L / 2, 0, o.z, b, 0.28, 0.25, '#1e1e24') : box(mb, o.x, 0, o.z + a + b / 2 - L / 2, 0.25, 0.28, b, '#1e1e24');
    const g = o.gap; if (g) { seg(0, g[0]); seg(g[1], L - g[1]); } else seg(0, L);
    for (let k = 0; k <= L; k += 1.6) if (!g || k < g[0] - 0.05 || k > g[1] + 0.05) horiz ? box(mb, o.x - L / 2 + k, 0, o.z, 0.07, 3.0, 0.1, '#1e1e24') : box(mb, o.x, 0, o.z - L / 2 + k, 0.1, 3.0, 0.07, '#1e1e24');
    horiz ? box(mb, o.x, 3.0, o.z, L, 0.14, 0.2, '#1e1e24') : box(mb, o.x, 3.0, o.z, 0.2, 0.14, L, '#1e1e24');
    if (g && horiz) { box(mb, o.x - L / 2 + g[0], 0, o.z, 0.1, 3.0, 0.12, '#1e1e24'); box(mb, o.x - L / 2 + g[1], 0, o.z, 0.1, 3.0, 0.12, '#1e1e24'); box(mb, o.x - L / 2 + g[1] + 0.8, 0.02, o.z - 0.12, 1.5, 2.9, 0.04, '#9fd0e8', { mat: W(MT.glass, 0.05) }); }
    if (g && horiz) { box(mb, g[0] / 2, 0.29, o.z + 0.13, g[0], 0.03, 0.02, '#a8dcff', { emit: 1 }); box(mb, (g[1] + L) / 2, 0.29, o.z + 0.13, L - g[1], 0.03, 0.02, '#a8dcff', { emit: 1 }); } else horiz ? box(mb, o.x, 0.29, o.z + 0.13, L, 0.03, 0.02, '#a8dcff', { emit: 1 }) : box(mb, o.x + 0.13, 0.29, o.z, 0.02, 0.03, L, '#a8dcff', { emit: 1 }); }, h: 3, wall: false };
  K.ledlight = { build: () => { }, light: o => ({ x: o.x, y: 2.8, z: o.z, r: o.r || 5, c: o.c || [1, 0.9, 0.78], i: o.i || 0.8 }) };
  K.infinity = { build: (mb, o) => { box(mb, o.x, -0.05, o.z, o.w, 0.5, o.d, '#2a2a30', { mat: W(MT.tile, 0.1) }); box(mb, o.x, 0.45, o.z, o.w - 0.1, 0.07, o.d - 0.1, '#2fb8e8', { emit: 0.5, mat: W(MT.water, 0) }); box(mb, o.x, 0.45, o.z + o.d / 2 - 0.08, o.w, 0.18, 0.16, '#e8e6e0', { mat: W(MT.marble, 0.05) }); box(mb, o.x - o.w / 2 + 0.08, 0.45, o.z, 0.16, 0.18, o.d, '#e8e6e0', { mat: W(MT.marble, 0.05) }); box(mb, o.x + o.w / 2 - 0.08, 0.45, o.z, 0.16, 0.18, o.d, '#e8e6e0', { mat: W(MT.marble, 0.05) }); box(mb, o.x, 0.47, o.z - o.d / 2 + 0.02, o.w, 0.03, 0.04, '#a8f0ff', { emit: 1.2 }); }, h: 0.6, light: o => ({ x: o.x, y: 0.8, z: o.z, r: 4, c: [0.3, 0.85, 1], i: 0.8 }) };
  const HWY_Y = -12;
  K.skyview = { // the city beyond the glass, lit window pattern changes every hour
    build: (mb, o, ctx) => {
      const hr = Math.floor((ctx.S ? ctx.S.clock : 0) / 60), night = hr >= 19 || hr < 6;
      const lit = night ? 0.3 : 0.06;
      const rows = o.rows;
      for (const t of rows) { mb.at(0, t.base, 0); DT.tower(mb, { x: t.x, z: t.z, w: t.w, d: t.d, floors: t.f, seed: t.seed + hr * 101, lit, crown: t.crown, entrance: false, podium: { floors: 1, col: '#3a3a44' }, glass: t.glass }); mb.pop(); }
      // an elevated highway between the towers
      if (o.hwy) { const [x0, z0, x1, z1, y] = o.hwy; box(mb, (x0 + x1) / 2, y, (z0 + z1) / 2, Math.abs(x1 - x0) || 2.2, 0.4, Math.abs(z1 - z0) || 2.2, '#3a3a44', { mat: W(MT.concrete, 0.4) }); }
    }, h: 1, dyn: true,
  };

  // =====================================================================
  // the penthouse map, generated from your plan and furniture
  // =====================================================================
  function grid(w, h, fill) { const t = new Array(w * h).fill(fill); const m = { w, h, t, tile: (x, z) => (x < 0 || z < 0 || x >= w || z >= h ? null : t[z * w + x]), set: (x, z, v) => { if (x >= 0 && z >= 0 && x < w && z < h) t[z * w + x] = v; }, rect: (x, z, rw, rh, v) => { for (let j = z; j < z + rh; j++) for (let i = x; i < x + rw; i++) m.set(i, j, v); } }; return m; }
  function fixtures(planId) {
    const p = PLANS[planId], w = p.w, h = p.h, T = p.terrace || 0, O = [];
    const y0 = T; // interior starts below the terrace
    if (planId === 'loft') {
      O.push({ k: 'kitchen', x: w - 0.45, z: 3, rot: -Math.PI / 2, len: 3.6 }, { k: 'bathpod', x: 1.6, z: h - 1.6, w: 3, d: 3 }, { k: 'furn', fid: 'safe2', id: 'phsafe', x: w - 0.5, z: 6.4, rot: -Math.PI / 2 });
    } else if (planId === 'corner') {
      O.push({ k: 'kitchen', x: w - 0.45, z: 3.4, rot: -Math.PI / 2, len: 4.4 }, { k: 'island', x: w - 3.2, z: 3.4, w: 2.6 }, { k: 'bathpod', x: 1.6, z: h - 1.6, w: 3, d: 3 }, { k: 'furn', fid: 'wardrobe', id: 'wardrobe', x: 5.2, z: h - 0.4, rot: Math.PI }, { k: 'furn', fid: 'safe2', id: 'phsafe', x: w - 0.5, z: 7.2, rot: -Math.PI / 2 });
    } else {
      O.push({ k: 'kitchen', x: w - 0.45, z: y0 + 3.4, rot: -Math.PI / 2, len: 5 }, { k: 'island', x: w - 3.4, z: y0 + 3.6, w: 3 }, { k: 'bathpod', x: 1.6, z: h - 1.6, w: 3, d: 3 }, { k: 'furn', fid: 'wardrobe', id: 'wardrobe', x: 5.2, z: h - 0.4, rot: Math.PI }, { k: 'furn', fid: 'safe2', id: 'phsafe', x: w - 0.5, z: y0 + 8, rot: -Math.PI / 2 });
      O.push({ k: 'infinity', id: 'infinity', x: 5.5, z: 1.7, w: 9, d: 2.6 }, { k: 'furn', fid: 'lounge', x: 13, z: 1.6, rot: 0 }, { k: 'furn', fid: 'olive', x: 17.6, z: 0.8 });
    }
    return O;
  }
  function viewRows(p) {
    // towers beyond the glass: a near row, a far row, west side for corner plans
    const out = [], w = p.w, T = p.terrace || 0;
    let x = -6;
    while (x < w + 10) { const tw = 4 + Math.floor(R(x, 1, 41) * 4); out.push({ x, z: -9 - Math.floor(R(x, 2, 41) * 6), w: tw, d: 5, f: 3 + Math.floor(R(x, 3, 41) * 7), seed: x * 13 + 1, base: -16 }); x += tw + 2 + Math.floor(R(x, 4, 41) * 3); }
    x = -14;
    while (x < w + 20) { const tw = 5 + Math.floor(R(x, 5, 43) * 5); out.push({ x, z: -26 - Math.floor(R(x, 6, 43) * 8), w: tw, d: 6, f: 8 + Math.floor(R(x, 7, 43) * 14), seed: x * 7 + 9, base: -26, crown: R(x, 8, 43) > 0.6 ? 'spire' : undefined }); x += tw + 1; }
    if (p.glass.includes('w')) { let z = T; while (z < p.h + 6) { const td = 4 + Math.floor(R(z, 9, 47) * 4); out.push({ x: -10 - Math.floor(R(z, 10, 47) * 6), z, w: 5, d: td, f: 3 + Math.floor(R(z, 11, 47) * 7), seed: z * 17 + 3, base: -16 }); z += td + 2; } }
    // drop them so you look down on most roofs from up here
    return out.map(t => Object.assign(t, { glass: R(t.x, t.z, 9) > 0.5 ? '#203848' : '#2a2a40' }));
  }
  MAPS.penthouse = () => {
    const hm = ensureHome();
    const planId = (hm.tour && hm.tour !== hm.plan ? hm.tour : hm.plan) || 'corner', p = PLANS[planId];
    const m = grid(p.w, p.h, 'floor');
    m.indoor = true; m.view = true; m.plan = planId;
    const T = p.terrace || 0;
    m.walls = { n: false, w: false, floorCol: '#d6d0c6', floorMat: MT.marble, wear: 0.04, wallCol: '#e8e6e0', trim: '#1e1e24', tint: (i, j) => (j < T ? '#9a948c' : ((i >> 1) + (j >> 1)) % 2 ? '#c4bdb2' : '#bcb5aa') };
    const O = m.objects = [];
    // glass walls
    O.push({ k: 'glasswall', dir: 'x', x: p.w / 2, z: T + 0.12, len: p.w, gap: T ? [10.6, 12.9] : null });
    if (p.glass.includes('w')) O.push({ k: 'glasswall', dir: 'z', x: 0.12, z: T + (p.h - T) / 2, len: p.h - T });
    if (T) O.push({ k: 'glasswall', dir: 'x', x: p.w / 2, z: 0.1, len: p.w });
    // the view
    const rows = viewRows(p);
    O.push({ k: 'skyview', id: 'skyview', x: 0, z: -10, rows, hwy: [-30, -16.8, p.w + 30, -15.2, HWY_Y - 0.4] });
    m.viewRows = rows;
    O.push(...fixtures(planId));
    for (const it of hm.plan === planId ? hm.items : []) O.push({ k: 'furn', fid: it.id, id: 'f_' + it.uid, x: it.x, z: it.z, rot: it.rot || 0, walkThrough: FURN[it.id] && FURN[it.id].walk });
    // the door by the elevator, bottom right
    m.exits = [{ x: p.w - 3, z: p.h - 1, w: 2, h: 1, to: 'aurora', tx: 8.5, tz: 1.8, dir: 'down' }];
    m.spawn = { x: p.w - 2, z: p.h - 1.6, dir: 'up' };
    return m;
  };
  // =====================================================================
  // live view: aircraft, highway traffic, blinking roof beacons, clouds
  // =====================================================================
  let craft = [], lastMap = null;
  function viewTick(dt) {
    if (G.mapId !== 'penthouse' || !G.map || !G.map.view) { craft = []; lastMap = null; return; }
    if (lastMap !== G.map) { lastMap = G.map; craft = [{ kind: 'heli', t: Math.random() * 40, sp: 0.03 }, { kind: 'plane', t: Math.random() * 60, sp: 0.018 }, { kind: 'blimp', t: Math.random() * 90, sp: 0.008 }]; }
    const W_ = G.map.w, night = G.night > 0.5;
    // highway traffic: headlights one way, tail lights the other
    if (Math.random() < dt * 9) G.emit({ x: -18, y: HWY_Y + 0.15, z: -15.6, vx: 7 + Math.random() * 3, life: 7, size: 2, r: 1, g: 0.95, b: 0.75, a: 1, grav: 0, drag: 0 });
    if (Math.random() < dt * 9) G.emit({ x: W_ + 18, y: HWY_Y + 0.15, z: -16.4, vx: -(7 + Math.random() * 3), life: 7, size: 2, r: 1, g: 0.2, b: 0.2, a: 1, grav: 0, drag: 0 });
    // blinking roof beacons
    if (night && Math.floor(G.t * 1.2) !== Math.floor((G.t - dt) * 1.2)) for (const t of G.map.viewRows || []) if (R(t.x, t.z, 5) > 0.55) G.emit({ x: t.x + t.w / 2, y: t.base + 0.2 + (1 + t.f) * 1.9 + (t.crown === 'spire' ? 7.3 : 0.5), z: t.z + t.d / 2, life: 0.35, size: 3, r: 1, g: 0.15, b: 0.15, a: 1, grav: 0 });
    for (const c of craft) c.t += dt * c.sp;
  }
  // aircraft are drawn as small meshes moving across the sky
  function craftDraws() {
    const out = [];
    if (G.mapId !== 'penthouse') return out;
    const W_ = G.map.w;
    for (const c of craft) {
      const f = c.t % 1, x = -30 + f * (W_ + 60), y = c.kind === 'blimp' ? 16 : c.kind === 'plane' ? 22 : 11, z = c.kind === 'blimp' ? -34 : c.kind === 'plane' ? -50 : -22;
      const mesh = G.meshFor('craft_' + c.kind, mb => {
        if (c.kind === 'heli') { box(mb, 0, 0, 0, 1.4, 0.6, 0.6, '#2a2a30'); box(mb, -1.2, 0.2, 0, 1.4, 0.15, 0.15, '#2a2a30'); box(mb, 0, 0.65, 0, 2.6, 0.04, 0.12, '#5a5a64'); box(mb, 0.45, 0.1, 0, 0.3, 0.3, 0.62, '#9fd8ff', { emit: 0.6 }); }
        else if (c.kind === 'plane') { box(mb, 0, 0, 0, 3.2, 0.4, 0.4, '#e8e6e0'); box(mb, 0.2, 0.1, 0, 0.8, 0.08, 3.0, '#e8e6e0'); box(mb, -1.4, 0.2, 0, 0.4, 0.7, 0.08, '#c8443c'); }
        else { mb.sphere(0, 0, 0, 1.0, '#c8ccd4', { detail: 1 }); box(mb, -0.2, -0.95, 0, 1.4, 0.3, 0.4, '#3a3a44'); box(mb, 0, -0.1, 1.0, 2.4, 0.5, 0.02, '#ff4fa3', { emit: 1.4 }); }
      });
      const model = GL3.M4.trs(x, y, z, Math.PI / 2 * 0, c.kind === 'blimp' ? 2.2 : 1);
      out.push({ mesh, model, noShadow: true });
      if (G.night > 0.4 && Math.floor(G.t * 2) % 2 === 0) G.emit({ x: x + 0.8, y: y + 0.3, z, life: 0.08, size: 3, r: 1, g: 0.2, b: 0.2, a: 1, grav: 0 });
    }
    return out;
  }

  // =====================================================================
  // delivery, rent, and the hourly view refresh
  // =====================================================================
  let lastHr = -1;
  const update0 = SIM.update;
  SIM.update = function (dt) {
    update0(dt);
    const s = S(); if (!s) return;
    const hm = ensureHome();
    viewTick(dt);
    if (hm.tour) { if (G.mapId === 'penthouse') hm.touring = true; else if (hm.touring) { hm.tour = null; hm.touring = false; } }
    if (G.mapId === 'penthouse' && !G.extraDraws.includes(craftDraws)) G.extraDraws.push(craftDraws);
    const hr = Math.floor(s.clock / 60);
    if (hr !== lastHr) { lastHr = hr; if (G.mapId === 'penthouse' && G.scene && G.scene.byId.skyview) G.refresh('skyview'); }
    // deliveries
    if (hm.pending.length) {
      const now = absMin(), arrived = hm.pending.filter(p => p.at <= now);
      if (arrived.length) {
        hm.pending = hm.pending.filter(p => p.at > now);
        for (const p of arrived) hm.storage[p.id] = (hm.storage[p.id] || 0) + 1;
        STORY.msg('Habitat', `Delivered: ${arrived.map(p => FURN[p.id].name).join(', ')}. ${hm.plan ? 'It\'s waiting in your apartment. Open Habitat on your phone to place it.' : 'We\'re holding it at Aurora Tower until you have an apartment there.'}`);
        SFX.play('phone');
      }
    }
  };
  const newDay0 = SIM.newDay;
  SIM.newDay = function () {
    newDay0();
    const s = S(), hm = ensureHome();
    if (hm.plan && !hm.owned) {
      hm.rentDays = (hm.rentDays || 0) + 1;
      if (hm.rentDays >= 7) {
        hm.rentDays = 0; const rent = PLANS[hm.plan].rent;
        let paid = false;
        if (s.money >= rent) { s.money -= rent; paid = true; } else if ((s.bank || 0) + s.money >= rent) { s.bank -= rent - s.money; s.money = 0; paid = true; }
        if (paid) { hm.strikes = 0; s.log.unshift({ day: s.day, text: `Rent, ${PLANS[hm.plan].name}: -${fmt$(rent)}` }); }
        else {
          hm.strikes = (hm.strikes || 0) + 1;
          if (hm.strikes >= 2) { evict(); STORY.msg('Aurora Tower', 'Two missed rent payments. Your lease is terminated. Your furniture is in storage.'); }
          else STORY.msg('Aurora Tower', `Your rent of ${fmt$(rent)} bounced. Please pay by next week or we will end your lease.`);
        }
      }
    }
  };
  function evict() { const hm = home(); for (const it of hm.items) hm.storage[it.id] = (hm.storage[it.id] || 0) + 1; hm.items = []; hm.plan = null; hm.owned = false; S().flags.penthouse = false; }

  // =====================================================================
  // renting and buying: the brochure
  // =====================================================================
  function planCanvas(id) {
    const p = PLANS[id], c = document.createElement('canvas'); c.width = p.w * 6; c.height = p.h * 6; c.className = 'plancanvas';
    const x = c.getContext('2d'); x.fillStyle = '#3a3634'; x.fillRect(0, 0, c.width, c.height);
    if (p.terrace) { x.fillStyle = '#c8c0b4'; x.fillRect(0, 0, c.width, p.terrace * 6); x.fillStyle = '#2fb8e8'; x.fillRect(6, 3, 54, 15); }
    x.fillStyle = '#a8dcff'; x.fillRect(0, (p.terrace || 0) * 6, c.width, 2); if (p.glass.includes('w')) x.fillRect(0, (p.terrace || 0) * 6, 2, c.height);
    for (const f of fixtures(id)) { if (f.k === 'ledlight') continue; x.fillStyle = f.k === 'bathpod' ? '#e8e6e0' : f.k === 'kitchen' ? '#c8ccd4' : f.k === 'island' ? '#f2f0ec' : f.k === 'infinity' ? '#2fb8e8' : '#8a7a6a'; const w = f.k === 'bathpod' ? 3 : f.k === 'kitchen' ? 0.7 : f.k === 'island' ? (f.w || 2.4) : f.k === 'infinity' ? f.w : 1, d = f.k === 'bathpod' ? 3 : f.k === 'kitchen' ? (f.len || 4) : f.k === 'island' ? 1 : f.k === 'infinity' ? f.d : 0.6; x.fillRect((f.x - w / 2) * 6, (f.z - d / 2) * 6, w * 6, d * 6); }
    x.fillStyle = '#ffd84a'; x.fillRect((p.w - 3) * 6, (p.h - 1) * 6 + 3, 12, 3);
    return c;
  }
  function brochure() {
    return new Promise(done => {
      const s = S(), hm = ensureHome(), cash = () => s.money + (s.bank || 0);
      const sh = document.getElementById('sheet');
      const draw = () => {
        sh.innerHTML = `<div class="sbody"><div class="shead"><h3>Aurora Residences</h3></div><p style="color:var(--dim);margin:0 0 8px">Rent by the week or buy outright. Furniture is up to you: order it on your phone. You have ${fmt$(s.money)} cash${s.bank ? ` and ${fmt$(s.bank)} in the bank` : ''}.</p>
          <div class="plans">${Object.entries(PLANS).map(([id, p]) => { const mine = hm.plan === id; return `<div class="card plan ${mine ? 'on' : ''}"><h4>FLOOR ${p.floor} · ${p.w}×${p.h}</h4><b>${esc(p.name)}</b><div class="pc" data-pc="${id}"></div><p>${esc(p.desc)}</p>
            ${mine ? `<p style="color:var(--green)">${hm.owned ? 'Yours.' : `You rent this. ${fmt$(p.rent)}/week.`}</p>` : `<div class="planbtns"><button type="button" class="btn small ghost" data-tour="${id}">Tour</button><button type="button" class="btn small" data-rent="${id}" ${cash() < p.rent ? 'disabled' : ''}>Rent ${fmt$(p.rent)}/wk</button><button type="button" class="btn small" data-buy="${id}" ${cash() < p.buy ? 'disabled' : ''}>Buy ${fmt$(p.buy)}</button></div>`}</div>`; }).join('')}</div>
          ${hm.plan ? '<p style="color:var(--dim);font-size:14px">Moving out of your current place sends your furniture to storage. Owned homes sell back at 80%.</p>' : ''}
          <button type="button" class="btn ghost" id="brDone" style="margin-top:8px">Close</button></div>`;
        sh.hidden = false; G.paused = true;
        sh.querySelectorAll('[data-pc]').forEach(el => el.appendChild(planCanvas(el.dataset.pc)));
        const pay = n => { const fromCash = Math.min(s.money, n); s.money -= fromCash; s.bank = (s.bank || 0) - (n - fromCash); UI.refreshHud(); };
        const moveOut = () => { if (!hm.plan) return; if (hm.owned) { const back = Math.round(PLANS[hm.plan].buy * 0.8); s.money += back; UI.toast(`Sold your old place: +${fmt$(back)}`, 'good'); } for (const it of hm.items) hm.storage[it.id] = (hm.storage[it.id] || 0) + 1; hm.items = []; };
        const take = (id, own) => { moveOut(); hm.plan = id; hm.owned = own; hm.rentDays = 0; hm.strikes = 0; hm.tour = null; s.flags.penthouse = true; if (!hm.items.length && !Object.keys(hm.storage).length) { hm.items.push({ uid: hm.uid++, id: 'bed_mattress', x: PLANS[id].w - 3, z: (PLANS[id].terrace || 0) + 2.5, rot: 0 }); } SFX.play('win'); UI.banner(PLANS[id].name, `Aurora Tower · Floor ${PLANS[id].floor}`); s.log.unshift({ day: s.day, text: `${own ? 'Bought' : 'Rented'} ${the(id)}` }); G.evt('home', id); };
        sh.querySelectorAll('[data-tour]').forEach(b => tap(b, () => { hm.tour = b.dataset.tour; sh.hidden = true; G.paused = false; done('tour'); }));
        sh.querySelectorAll('[data-rent]').forEach(b => tap(b, () => { const id = b.dataset.rent, p = PLANS[id]; if (cash() < p.rent) return; pay(p.rent); take(id, false); draw(); }));
        sh.querySelectorAll('[data-buy]').forEach(b => tap(b, () => { const id = b.dataset.buy, p = PLANS[id]; if (cash() < p.buy) return; pay(p.buy); take(id, true); draw(); }));
        tap(sh.querySelector('#brDone'), () => { sh.hidden = true; G.paused = false; done(); });
      };
      draw();
    });
  }
  // concierge and the elevator (replaces the old one-apartment version)
  const conciergeSay = t => { UI.setGuestFace({ key: 'dtf_concierge', look: { skin: '#c98e62', hair: '#1e1a1a', hairStyle: 'slick', top: '#18181e', topStyle: 'suit', inner: '#c9a14a', bottom: '#18181e', shoes: '#111', acc: ['gold'] }, name: 'Mr. Beaumont' }); return say('guest', t, { name: 'Mr. Beaumont' }); };
  async function concierge() {
    const hm = ensureHome();
    await conciergeSay(hm.plan ? 'Welcome home. Thinking of a bigger view? I have the brochure right here.' : 'Welcome to Aurora. Three residences are available. Rent by the week, or buy. Have a look.');
    const r = await brochure();
    if (r === 'tour') await conciergeSay('Take the private elevator. Enjoy the view. Please don\'t touch the art.');
  }
  H.concierge_desk = { name: 'Concierge', verbs: () => [{ label: 'Residences', fn: concierge }] };
  const talk0 = STORY.talk;
  STORY.talk = a => a.id === 'concierge' ? concierge() : talk0(a);
  H.phlift = { name: 'Private Elevator', verbs: () => { const hm = ensureHome(); return [{ label: hm.tour && hm.tour !== hm.plan ? `Tour ${the(hm.tour)}` : hm.plan ? `Up to ${the(hm.plan)}` : 'Call the elevator', fn: async () => {
    if (!hm.plan && !hm.tour) return narr('A keycard reader blinks red. The residences are private. The concierge can help.');
    if (hm.plan && hm.tour === hm.plan) hm.tour = null;
    SFX.play('bell'); await G.travel('penthouse');
    if (hm.tour && hm.tour !== hm.plan) UI.toast(`Touring ${the(hm.tour)}. Rent or buy it from the concierge.`);
  } }]; } };
  // leaving a tour ends it
  const travel0 = G.travel;
  G.travel = async function (to, x, z, d) { const hm = S() && ensureHome(); const r = await travel0(to, x, z, d); if (hm && G.mapId !== 'penthouse' && G.mapId !== 'aurora') hm.tour = null; return r; };

  // =====================================================================
  // furniture you can use
  // =====================================================================
  const owned = () => { const hm = ensureHome(); return !!hm.plan && G.map && G.map.plan === hm.plan; };
  const VERB = {
    sleep: { label: 'Sleep', fn: () => H.cot.verbs()[0].fn() },
    relax: { label: 'Relax', fn: async () => { await UI.fade(0.7, 0.4); G.advanceClock(45); await UI.fade(0, 0.4); SIM.heat(-0.25); await narr('You sink into it and watch the city. For once, nobody needs anything from you.'); } },
    watch: { label: 'Watch TV', fn: async () => { await UI.fade(0.6, 0.4); G.advanceClock(60); await UI.fade(0, 0.4); await narr(pick(['Channel 6: "...Vance Holdings shares fall as..." You change the channel.', 'A nature documentary about octopuses. They can open jars. Respect.', 'A cooking competition. Somebody cries over a soufflé.'])); } },
    game: { label: 'Play', fn: async () => { const hits = await UI.timingGame({ title: 'NEON RACER', sub: 'Hit the boost at the right moment.', rounds: 4, speed: 1.4, zone: 0.16 }); G.evt('play', hits); await narr(hits >= 3 ? 'New high score. You type your initials: ' + (S().name || 'JAY').slice(0, 3).toUpperCase() + '.' : 'Game over. One more go. Just one.'); } },
    fish: { label: 'Feed the fish', fn: async () => { await narr('You sprinkle in some flakes. The clownfish does a little loop. Probably gratitude.'); } },
    study: { label: 'Study (1h)', fn: async () => { await UI.fade(0.6, 0.4); G.advanceClock(60); await UI.fade(0, 0.4); G.evt('study', 1); await narr('An hour with the books. Hospitality law, tax tricks, how hotels really make money.'); } },
    admire: { label: 'Admire', fn: () => narr(pick(['It cost more than your first car. You still don\'t know what it means.', 'You tilt your head. It tilts back. Art.'])) },
    piano: { label: 'Play the piano', fn: async () => { SFX.play('fixed'); await UI.fade(0.5, 0.4); G.advanceClock(30); await UI.fade(0, 0.4); G.evt('piano', 1); await narr('You plunk out something halfway between jazz and a cry for help. It\'s getting better.'); } },
    pool: { label: 'Shoot a rack', fn: async () => { const hits = await UI.timingGame({ title: 'Eight ball', sub: 'Line up the shot.', rounds: 3, speed: 1.0, zone: 0.2 }); await narr(hits >= 2 ? 'You run the table. Nobody saw it. Typical.' : 'Scratch on the eight. Good thing nobody saw that either.'); } },
    drink: { label: 'Pour a drink', fn: async () => { SFX.play('ice'); await narr('Two fingers of something old. You look out at the lights. Not bad for a motel kid.'); } },
    scope: { label: 'Look through it', fn: () => narr(pick(['Through the scope: a man on a balcony forty floors down, also looking through a telescope. You both wave.', 'You find the Starlite sign, tiny and pink, way down in Lowtown. Home.', 'Celeste Vance\'s office light is still on at the Vance Grand.'])) },
    run: { label: 'Run (30 min)', fn: async () => { SFX.play('run'); await UI.fade(0.6, 0.4); G.advanceClock(30); await UI.fade(0, 0.4); G.evt('workout', 1); await narr('Five kilometres facing the skyline. Your legs hate you. Your lungs love you.'); } },
    soak: { label: 'Soak', fn: async () => { SFX.play('splash'); await UI.fade(1, 0.5); G.advanceClock(60); await UI.fade(0, 0.5); SIM.heat(-0.6); await narr('An hour in the hot tub over the city. The cops feel very far away. (Heat down)'); } },
    safe: { label: 'Open the safe', fn: () => UI.openStash() },
    clothes: { label: 'Change clothes', fn: () => H.wardrobe.verbs()[0].fn() },
    eat: { label: 'Eat', fn: async () => { await narr('Takeout on real plates. It counts as cooking.'); } },
  };
  const handler0 = STORY.handler;
  STORY.handler = (id, o) => {
    if (G.mapId === 'penthouse' && (/^f_/.test(id) || id === 'phsafe' || id === 'wardrobe')) {
      const f = FURN[o && o.fid]; if (!f) return handler0(id, o);
      return { name: f.name, verbs: () => owned() ? (f.verbs || []).map(v => VERB[v]).filter(Boolean).concat(DECO.on ? [] : []) : [{ label: 'Look', fn: () => narr('Nice. If only it were yours.') }] };
    }
    if (id === 'infinity') return { name: 'Infinity Pool', verbs: () => [{ label: owned() ? 'Swim' : 'Look', fn: async () => { if (!owned()) return narr('The water runs right off the edge of the building. Into the sky, basically.'); SFX.play('splash'); await UI.fade(1, 0.5); G.advanceClock(45); await UI.fade(0, 0.5); G.evt('workout', 1); SIM.heat(-0.3); await narr('Laps at the edge of the sky. The city spins slowly below.'); } }] };
    return handler0(id, o);
  };

  // =====================================================================
  // ordering furniture (phone app) and decorating
  // =====================================================================
  function order(id, express) {
    const s = S(), hm = ensureHome(), f = FURN[id], price = Math.round(f.price * (express ? 1.25 : 1));
    if (s.money < price) { UI.toast('Not enough cash.', 'bad'); return false; }
    s.money -= price; UI.refreshHud(); SFX.play('cash');
    if (express) { hm.storage[id] = (hm.storage[id] || 0) + 1; UI.toast(`${f.name} delivered. Open Habitat to place it.`, 'good'); }
    else { const tomorrow9 = S().day * 1440 + 9 * 60; hm.pending.push({ id, at: tomorrow9 }); UI.toast(`${f.name} arrives tomorrow at 9 AM.`, 'good'); }
    G.evt('order', id);
    return true;
  }
  UI.TABS.push(['home2', 'Habitat', 'key', '#9fd8ff']);
  UI.TITLES.home2 = 'Habitat';
  UI.APPS.home2 = function (el, tab) {
    const s = S(), hm = ensureHome();
    const sub = UI.homeTab || 'place';
    const plan = hm.plan ? PLANS[hm.plan] : null;
    const cats = [...new Set(Object.values(FURN).map(f => f.cat))];
    const storeItems = Object.entries(hm.storage).filter(([, n]) => n > 0);
    el.innerHTML = `<div class="card"><h4>YOUR PLACE</h4><b>${plan ? esc(plan.name) : 'No apartment yet'}</b><p>${plan ? `Aurora Tower, floor ${plan.floor}. ${hm.owned ? 'Owned.' : `Renting at ${fmt$(plan.rent)}/week (${7 - (hm.rentDays || 0)} days to next payment).`}` : 'See the concierge at Aurora Tower, downtown, to rent or buy.'}</p></div>
      <div class="seg hseg"><button type="button" data-h="place" class="${sub === 'place' ? 'on' : ''}">My furniture</button><button type="button" data-h="shop" class="${sub === 'shop' ? 'on' : ''}">Habitat store</button></div>
      <div id="homeSub"></div>`;
    el.querySelectorAll('[data-h]').forEach(b => b.addEventListener('click', () => { UI.homeTab = b.dataset.h; UI.APPS.home2(el); }));
    const box2 = el.querySelector('#homeSub');
    if (sub === 'shop') {
      box2.innerHTML = `<p style="color:var(--dim);font-size:14px;margin:6px 0">Free delivery tomorrow at 9 AM, or Express for +25% and it's there right now. Cash ${fmt$(s.money)}.</p>` + cats.map(c => `<h4 class="cath">${esc(c.toUpperCase())}</h4>` + Object.entries(FURN).filter(([, f]) => f.cat === c).map(([id, f]) => `<div class="row furnrow"><div class="grow"><b>${esc(f.name)}</b><small>${fmt$(f.price)} · ${f.w}×${f.d}m${f.verbs && f.verbs.length ? ' · ' + f.verbs.map(v => VERB[v] ? VERB[v].label.toLowerCase() : v).join(', ') : ''}${hm.storage[id] ? ` · ${hm.storage[id]} in storage` : ''}</small></div><button type="button" class="btn small ghost" data-ord="${id}" ${s.money < f.price ? 'disabled' : ''}>Tomorrow</button><button type="button" class="btn small" data-exp="${id}" ${s.money < f.price * 1.25 ? 'disabled' : ''}>Now ${fmt$(f.price * 1.25)}</button></div>`).join('')).join('');
      box2.querySelectorAll('[data-ord]').forEach(b => b.addEventListener('click', () => { if (order(b.dataset.ord, false)) UI.APPS.home2(el); }));
      box2.querySelectorAll('[data-exp]').forEach(b => b.addEventListener('click', () => { if (order(b.dataset.exp, true)) UI.APPS.home2(el); }));
    } else {
      const inHome = owned();
      box2.innerHTML = `${hm.pending.length ? `<p style="color:var(--yellow);font-size:14px">On the way: ${hm.pending.map(p => esc(FURN[p.id].name)).join(', ')} (tomorrow 9 AM)</p>` : ''}
        <p style="color:var(--dim);font-size:14px;margin:6px 0">${inHome ? 'Tap an item to place it. Then tap the floor where you want it.' : hm.plan ? 'Go to your apartment to place or move furniture.' : 'Get an apartment first. Orders wait in storage.'}</p>
        <h4 class="cath">IN STORAGE</h4>${storeItems.length ? storeItems.map(([id, n]) => `<div class="row furnrow"><div class="grow"><b>${esc(FURN[id].name)}</b><small>×${n}</small></div><button type="button" class="btn small" data-place="${id}" ${inHome ? '' : 'disabled'}>Place</button></div>`).join('') : '<p style="color:var(--dim)">Nothing in storage.</p>'}
        ${inHome ? `<h4 class="cath">IN YOUR APARTMENT</h4>${hm.items.length ? hm.items.map(it => `<div class="row furnrow"><div class="grow"><b>${esc(FURN[it.id].name)}</b></div><button type="button" class="btn small ghost" data-move="${it.uid}">Move</button><button type="button" class="btn small ghost" data-store="${it.uid}">Store</button></div>`).join('') : '<p style="color:var(--dim)">Empty. Very minimalist.</p>'}` : ''}`;
      box2.querySelectorAll('[data-place]').forEach(b => b.addEventListener('click', () => { UI.closePhone(); DECO.start(b.dataset.place, null); }));
      box2.querySelectorAll('[data-move]').forEach(b => b.addEventListener('click', () => { const it = hm.items.find(x => x.uid === +b.dataset.move); UI.closePhone(); DECO.start(it.id, it); }));
      box2.querySelectorAll('[data-store]').forEach(b => b.addEventListener('click', () => { const i = hm.items.findIndex(x => x.uid === +b.dataset.store); if (i >= 0) { const it = hm.items.splice(i, 1)[0]; hm.storage[it.id] = (hm.storage[it.id] || 0) + 1; G.rebuildMap(); UI.APPS.home2(el); } }));
    }
  };

  // placing furniture: a ghost follows your taps; rotate, then place
  const DECO = { on: false };
  let bar = null;
  function footprint(id, x, z, rot) { const f = FURN[id]; const q = Math.abs(Math.sin(rot)) > 0.5; const w = q ? f.d : f.w, d = q ? f.w : f.d; return [x - w / 2, z - d / 2, w, d]; }
  function valid(id, x, z, rot, skipUid) {
    const m = G.map, p = PLANS[m.plan], [rx, rz, rw, rd] = footprint(id, x, z, rot);
    const T = p.terrace || 0;
    if (rx < 0.3 || rz < T + 0.3 || rx + rw > p.w - 0.05 || rz + rd > p.h - 0.05) return false;
    // keep the doorway clear
    const ex = m.exits[0]; if (rx < ex.x + ex.w && rx + rw > ex.x && rz + rd > ex.z - 1.2) return false;
    const over = (a, b) => a[0] < b[0] + b[2] && a[0] + a[2] > b[0] && a[1] < b[1] + b[3] && a[1] + a[3] > b[1];
    const me_ = [rx, rz, rw, rd];
    for (const f of fixtures(m.plan)) {
      if (f.k === 'ledlight') continue;
      const fw = f.k === 'bathpod' ? 3 : f.k === 'kitchen' ? 0.7 : f.k === 'island' ? (f.w || 2.4) : f.k === 'infinity' ? f.w : f.fid ? FURN[f.fid].w : 1;
      const fd = f.k === 'bathpod' ? 3 : f.k === 'kitchen' ? (f.len || 4) : f.k === 'island' ? 1.9 : f.k === 'infinity' ? f.d : f.fid ? FURN[f.fid].d : 1;
      if (over(me_, [f.x - fw / 2 - 0.1, f.z - fd / 2 - 0.1, fw + 0.2, fd + 0.2])) return false;
    }
    if (FURN[id].walk) return true;
    for (const it of home().items) { if (it.uid === skipUid || FURN[it.id].walk) continue; if (over(me_, footprint(it.id, it.x, it.z, it.rot || 0))) return false; }
    return true;
  }
  DECO.start = function (id, existing) {
    if (!owned()) { UI.toast('You can only decorate your own apartment.', 'bad'); return; }
    DECO.on = true; DECO.id = id; DECO.ex = existing; DECO.rot = existing ? existing.rot || 0 : 0;
    const p = G.player; DECO.x = existing ? existing.x : Math.round(p.x * 2) / 2; DECO.z = existing ? existing.z : Math.round((p.z - 1.5) * 2) / 2;
    if (!bar) { bar = document.createElement('div'); bar.className = 'decobar pix'; document.body.appendChild(bar); }
    bar.hidden = false;
    bar.innerHTML = `<b>${esc(FURN[id].name)}</b><span id="decoOk"></span><div><button type="button" class="btn small ghost" id="dRot">Rotate</button><button type="button" class="btn small" id="dPlace">Place</button><button type="button" class="btn small ghost" id="dCancel">Cancel</button></div><small>Tap the floor to move it.</small>`;
    bar.querySelector('#dRot').onclick = () => { DECO.rot = (DECO.rot + Math.PI / 2) % (Math.PI * 2); upd(); };
    bar.querySelector('#dCancel').onclick = () => stop();
    bar.querySelector('#dPlace').onclick = () => {
      if (!valid(DECO.id, DECO.x, DECO.z, DECO.rot, DECO.ex && DECO.ex.uid)) { SFX.play('bad'); UI.toast('It doesn\'t fit there.', 'bad'); return; }
      const hm = home();
      if (DECO.ex) Object.assign(DECO.ex, { x: DECO.x, z: DECO.z, rot: DECO.rot });
      else { hm.storage[DECO.id]--; if (hm.storage[DECO.id] <= 0) delete hm.storage[DECO.id]; hm.items.push({ uid: hm.uid++, id: DECO.id, x: DECO.x, z: DECO.z, rot: DECO.rot }); }
      SFX.play('build'); stop(); G.rebuildMap(); G.evt('decorate', 1); G.save();
    };
    upd();
  };
  function upd() { const ok = valid(DECO.id, DECO.x, DECO.z, DECO.rot, DECO.ex && DECO.ex.uid); const el = bar && bar.querySelector('#decoOk'); if (el) { el.textContent = ok ? 'Fits' : 'Blocked'; el.className = ok ? 'ok' : 'no'; } }
  function stop() { DECO.on = false; if (bar) bar.hidden = true; }
  G.tapHook = function (sx, sy) {
    if (!DECO.on) return false;
    if (G.mapId !== 'penthouse') { stop(); return false; }
    const [gx, gz] = G.groundAt(sx, sy);
    DECO.x = Math.round(gx * 2) / 2; DECO.z = Math.round(gz * 2) / 2; upd(); SFX.play('tap');
    return true;
  };
  // the ghost preview
  G.extraDraws = G.extraDraws || [];
  const ghost = () => {
    if (!DECO.on || G.mapId !== 'penthouse') return null;
    const mesh = G.meshFor('furn_' + DECO.id, mb => FURN[DECO.id].b(mb, {}));
    const ok = valid(DECO.id, DECO.x, DECO.z, DECO.rot, DECO.ex && DECO.ex.uid);
    const el = bar && bar.querySelector('#decoOk'); if (el && el.className !== (ok ? 'ok' : 'no')) { el.textContent = ok ? 'Fits' : 'Blocked'; el.className = ok ? 'ok' : 'no'; }
    return { mesh, model: GL3.M4.trs(DECO.x, 0.02, DECO.z, DECO.rot), opacity: ok ? 0.75 : 0.3 + Math.abs(Math.sin(G.t * 8)) * 0.25, flash: ok ? 0.25 : 0, noShadow: true };
  };
  window.HOME = { PLANS, FURN, DECO, order, valid, place(id, x, z, rot = 0) { DECO.start(id, null); if (!DECO.on) return false; DECO.x = x; DECO.z = z; DECO.rot = rot; const n = home().items.length; bar.querySelector('#dPlace').onclick(); return home().items.length > n; } };
  const loadMap0 = G.loadMap;
  G.loadMap = function () { const r = loadMap0.apply(this, arguments); if (G.mapId === 'penthouse') { G.extraDraws.push(ghost, craftDraws); } else stop(); return r; };
})();
