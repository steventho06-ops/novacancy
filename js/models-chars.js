// Characters: blocky pixel-chibi people built from parameters, plus poses.
(function () {
  const { MB, P, shade, R, pick, MT, W } = KIT;
  const { M4 } = GL3;

  const SKIN = ['#f2c9a0', '#e3ad84', '#c98e62', '#a8704a', '#7e5236', '#5c3a26'];
  const HAIR = ['#1e1a1a', '#3a2a20', '#6a4426', '#a8743a', '#d9b46a', '#c8c4c0', '#8a2a2a', '#5a3a8a', '#e86aa0'];
  const TOPS = ['#c8443c', '#2f6a9a', '#3a8a5a', '#e8c13c', '#8a4a9a', '#e8e2d8', '#2c2c38', '#d86a2a', '#5aa6a0', '#9a3a5a', '#4a4a5a'];
  const BOTTOMS = ['#2a3a5a', '#2c2c34', '#5a4a3a', '#3a3a44', '#6a6a72', '#1e2a3e'];

  // named cast
  const CAST = {
    player: { skin: SKIN[1], hair: '#2a1e1a', hairStyle: 'short', top: '#2f8a8a', topStyle: 'jacket', inner: '#e8e2d8', bottom: '#1e2a3e', shoes: '#ecebe6', hat: 'beanie', hatCol: '#d9a23a' },
    dex: { skin: SKIN[4], hair: '#111', hairStyle: 'bald', top: '#18181e', topStyle: 'jacket', inner: '#3a3a44', bottom: '#2c2c34', shoes: '#111', glasses: 'shades', acc: ['chain'], size: 1.18, beard: '#111' },
    marlowe: { skin: SKIN[0], hair: '#c8c4c0', hairStyle: 'slick', top: '#e8e2d8', topStyle: 'suit', inner: '#7a1a2a', bottom: '#e8e2d8', shoes: '#5a3a2a', hat: 'fedora', hatCol: '#e8e2d8', beard: '#9a9490', acc: ['ring'] },
    sable: { skin: SKIN[2], hair: '#d8d4e8', hairStyle: 'bob', top: '#4a2a6a', topStyle: 'coat', inner: '#18181e', bottom: '#18181e', shoes: '#18181e', acc: ['choker', 'lips'] },
    doc: { skin: SKIN[3], hair: '#1e1a1a', hairStyle: 'short', top: '#4a6a3a', topStyle: 'parka', inner: '#c84a3c', bottom: '#3a3a44', shoes: '#6a4a2a', hat: 'beanie', hatCol: '#2c2c38', glasses: 'round' },
    gus: { skin: SKIN[0], hair: '#c8c4c0', hairStyle: 'balding', top: '#8a6a4a', topStyle: 'cardigan', inner: '#e8e2d8', bottom: '#4a4a52', shoes: '#3a2a20', glasses: 'round', beard: '#c8c4c0' },
    nina: { skin: SKIN[1], hair: '#1a1416', hairStyle: 'pony', top: '#c8a878', topStyle: 'coat', inner: '#2c2c38', bottom: '#2c2c38', shoes: '#5a2a2a' },
    reyes: { skin: SKIN[2], hair: '#1a1416', hairStyle: 'bun', top: '#22305a', topStyle: 'uniform', inner: '#22305a', bottom: '#1a2240', shoes: '#111', hat: 'cop', hatCol: '#1a2240', acc: ['badge'] },
    holt: { skin: SKIN[0], hair: '#6a6a6a', hairStyle: 'short', top: '#1a2240', topStyle: 'uniform', inner: '#1a2240', bottom: '#1a2240', shoes: '#111', hat: 'cop', hatCol: '#1a2240', acc: ['badge', 'gold'], beard: '#6a6a6a', size: 1.08 },
    cop: { skin: SKIN[3], hair: '#1a1416', hairStyle: 'buzz', top: '#22305a', topStyle: 'uniform', inner: '#22305a', bottom: '#1a2240', shoes: '#111', hat: 'cop', hatCol: '#1a2240', acc: ['badge'] },
    vance: { skin: SKIN[0], hair: '#e8d08a', hairStyle: 'bun', top: '#f2efe8', topStyle: 'suit', inner: '#c9a14a', bottom: '#f2efe8', shoes: '#c9a14a', acc: ['earrings', 'lips'], glasses: 'shades' },
    ray: { skin: SKIN[1], hair: '#9a9490', hairStyle: 'messy', top: '#e8733a', topStyle: 'hawaii', inner: '#e8733a', bottom: '#c8b890', shoes: '#6a4a2a', beard: '#9a9490', glasses: 'shadesUp' },
    kofi: { skin: SKIN[5], hair: '#111', hairStyle: 'buzz', top: '#e8c13c', topStyle: 'parka', inner: '#2c2c38', bottom: '#2c2c34', shoes: '#111', hat: 'cap', hatCol: '#2c2c38' },
    lou: { skin: SKIN[0], hair: '#6a4426', hairStyle: 'short', top: '#c8443c', topStyle: 'flannel', inner: '#e8e2d8', bottom: '#2a3a5a', shoes: '#5a3a2a', hat: 'cap', hatCol: '#2a6a3a', beard: '#6a4426', size: 1.1 },
  };

  // guest / pedestrian templates
  const TYPES = {
    trucker: r => ({ top: pick(['#c8443c', '#2f6a9a', '#3a6a3a'], r(1)), topStyle: 'flannel', hat: 'cap', hatCol: pick(['#c8443c', '#2a6a3a', '#e8c13c'], r(2)), beard: r(3) > 0.4 ? 'hair' : null, size: 1.08 }),
    tourist: r => ({ top: pick(['#5aa6a0', '#e8c13c', '#ff7ac0', '#e8e2d8'], r(1)), topStyle: pick(['tee', 'hawaii'], r(2)), hat: r(3) > 0.5 ? 'bucket' : null, hatCol: '#e8e2d8', glasses: r(4) > 0.6 ? 'shades' : null, acc: ['camera'] }),
    business: r => ({ top: pick(['#2c2c38', '#3a3a50', '#5a5a64'], r(1)), topStyle: 'suit', inner: pick(['#c8443c', '#2f6a9a', '#e8c13c'], r(2)), bottom: '#2c2c38', shoes: '#111', hairStyle: pick(['slick', 'short', 'bun'], r(3)) }),
    musician: r => ({ top: '#18181e', topStyle: 'jacket', inner: pick(['#c8443c', '#e8e2d8'], r(1)), hairStyle: pick(['long', 'mohawk', 'curly'], r(2)), hair: pick(['#1e1a1a', '#e86aa0', '#5a3a8a'], r(3)), acc: ['guitar'] }),
    shady: r => ({ top: pick(['#2c2c38', '#3a2a2a', '#2a3a2a'], r(1)), topStyle: 'hoodie', hat: 'hood', glasses: r(2) > 0.5 ? 'shades' : null, acc: r(3) > 0.5 ? ['chain'] : [] }),
    couple: r => ({ top: pick(['#ff7ac0', '#9a3a5a', '#5aa6a0', '#e8e2d8'], r(1)), topStyle: pick(['dress', 'tee'], r(2)), hairStyle: pick(['long', 'pony', 'curly', 'bob'], r(3)) }),
    narc: r => ({ top: pick(['#5a5a64', '#4a4a5a'], r(1)), topStyle: 'jacket', inner: '#e8e2d8', bottom: '#2c2c34', shoes: '#c8a050', hairStyle: 'buzz', glasses: 'shades' }), // shiny shoes are the tell
    celeb: r => ({ top: pick(['#e8e2d8', '#c9a14a', '#18181e'], r(1)), topStyle: pick(['coat', 'suit', 'dress'], r(2)), glasses: 'shades', acc: ['gold', 'chain'], hairStyle: pick(['slick', 'long', 'bob'], r(3)), hair: pick(['#e8d08a', '#1e1a1a', '#e86aa0'], r(4)) }),
    // everyday people: pick an archetype so the street isn't full of clones
    ped: r => {
      const a = r(9), size = 0.9 + r(8) * 0.22;
      if (a < 0.16) return { size, top: pick(['#2c2c38', '#3a3a50', '#5a5a64', '#e8e2d8'], r(1)), topStyle: 'suit', inner: pick(['#c8443c', '#2f6a9a', '#e8c13c', '#e8e2d8'], r(2)), bottom: '#2c2c38', shoes: '#111', hairStyle: pick(['slick', 'short', 'bun', 'bob'], r(3)), acc: r(4) > 0.5 ? ['bag'] : [] };
      if (a < 0.28) return { size, top: pick(['#e8833a', '#3a8a5a', '#ff7ac0', '#5aa6a0'], r(1)), topStyle: 'tee', bottom: '#2c2c34', shoes: pick(['#ecebe6', '#e8c13c'], r(2)), hairStyle: pick(['pony', 'buzz', 'short'], r(3)), hat: r(4) > 0.6 ? 'cap' : null, hatCol: '#e8e2d8', acc: ['earbuds'] };
      if (a < 0.42) return { size: size * 0.96, hair: pick(['#c8c4c0', '#e8e4e0', '#9a9490'], r(1)), hairStyle: pick(['balding', 'short', 'bob', 'bun'], r(2)), top: pick(['#8a6a4a', '#6a5a7a', '#5a6a5a', '#9a7a6a'], r(3)), topStyle: pick(['cardigan', 'coat'], r(4)), glasses: r(5) > 0.4 ? 'round' : null, beard: r(6) > 0.7 ? 'hair' : null };
      if (a < 0.58) return { size: size * 0.95, topStyle: pick(['hoodie', 'tee', 'jacket'], r(1)), top: pick(['#5a3a8a', '#2f6a9a', '#c8443c', '#18181e', '#e8c13c'], r(2)), hairStyle: pick(['messy', 'curly', 'long', 'mohawk', 'afro'], r(3)), hair: pick(['#1e1a1a', '#6a4426', '#e86aa0', '#5a3a8a', '#d9b46a'], r(4)), acc: ['backpack'] };
      if (a < 0.68) return { size, top: '#e8833a', topStyle: 'vest', inner: '#5a5a64', hat: 'hardhat', hatCol: '#e8c13c', bottom: '#2a3a5a' };
      if (a < 0.76) return { size, top: pick(['#5aa6a0', '#e8c13c', '#ff7ac0', '#e8e2d8'], r(1)), topStyle: pick(['tee', 'hawaii'], r(2)), hat: r(3) > 0.5 ? 'bucket' : null, hatCol: '#e8e2d8', glasses: r(4) > 0.5 ? 'shades' : null, acc: ['camera'] };
      return { size, topStyle: pick(['tee', 'hoodie', 'jacket', 'coat', 'flannel', 'dress'], r(1)), hat: r(2) > 0.8 ? pick(['beanie', 'cap', 'bucket'], r(3)) : null, hatCol: pick(['#c8443c', '#2c2c38', '#e8c13c'], r(4)), glasses: r(5) > 0.8 ? 'shades' : null, acc: r(6) > 0.75 ? ['bag'] : [] };
    },
    // people living rough around the slums
    homeless: r => ({ size: 0.92 + r(8) * 0.15, top: pick(['#5a4a3a', '#4a5a4a', '#5a4a5a', '#6a5a4a', '#3a3a44'], r(1)), topStyle: pick(['parka', 'coat', 'coat'], r(2)), inner: pick(['#7a6a5a', '#5a4a3a'], r(3)), bottom: pick(['#4a4038', '#3a3a3a', '#5a5048'], r(4)), shoes: '#3a2a20', hat: r(5) > 0.3 ? 'beanie' : null, hatCol: pick(['#6a3a3a', '#3a4a5a', '#5a5a3a'], r(6)), hairStyle: pick(['messy', 'long', 'messy'], r(7)), hair: pick(['#6a6a66', '#3a2a20', '#9a9490'], r(9)), beard: r(10) > 0.35 ? 'hair' : null }),
    worker: r => ({ top: '#e8833a', topStyle: 'vest', inner: '#5a5a64', hat: 'hardhat', hatCol: '#e8c13c', bottom: '#2a3a5a' }),
  };
  function randomLook(seed, type = 'ped') {
    const r = k => R(seed, k, 31);
    const base = {
      skin: pick(SKIN, r(1)), hair: pick(HAIR.slice(0, 7), r(2)), hairStyle: pick(['short', 'long', 'pony', 'buzz', 'curly', 'bob', 'afro', 'messy', 'bald'], r(3)),
      top: pick(TOPS, r(4)), topStyle: 'tee', inner: pick(TOPS, r(5)), bottom: pick(BOTTOMS, r(6)), shoes: pick(['#ecebe6', '#18181e', '#6a4a2a', '#c8443c'], r(7)),
    };
    const t = TYPES[type] ? TYPES[type](k => r(10 + k)) : {};
    const out = Object.assign(base, t);
    if (out.beard === 'hair') out.beard = out.hair;
    return out;
  }

  // ---------- building ----------
  function buildChar(look) {
    const L = Object.assign({ skin: SKIN[1], hair: '#2a1e1a', hairStyle: 'short', top: '#c8443c', topStyle: 'tee', inner: '#e8e2d8', bottom: '#2a3a5a', shoes: '#ecebe6', acc: [] }, look);
    const acc = new Set(L.acc || []);
    const parts = {};
    const sk = L.skin, hc = L.hair;
    const o = { jit: 0.02 };
    // legs: pivot at hip (y=0), length 0.42
    for (const s of ['L', 'R']) {
      const m = new MB(); m.jit = 0.02;
      const dress = L.topStyle === 'dress';
      m.box(0, -0.38, 0, 0.13, 0.38, 0.14, dress ? sk : L.bottom, o);
      m.box(0, -0.42, 0.02, 0.14, 0.08, 0.2, L.shoes, o);
      parts['leg' + s] = m;
    }
    // torso: from hip (0) to shoulders (0.44)
    const t = new MB(); t.jit = 0.02;
    const st = L.topStyle;
    const top = L.top, inner = L.inner;
    if (st === 'dress') {
      t.box(0, -0.12, 0, 0.42, 0.3, 0.26, top, Object.assign({ taper: -0.04 }, o));
      t.box(0, 0.18, 0, 0.34, 0.26, 0.2, top, o);
    } else {
      t.box(0, -0.02, 0, 0.34, 0.12, 0.2, L.bottom, o); // belt/hips
      t.box(0, 0.08, 0, 0.36, 0.36, 0.21, top, o);
      if (st === 'jacket' || st === 'suit' || st === 'coat' || st === 'cardigan' || st === 'parka' || st === 'vest') t.box(0, 0.1, 0.105, 0.12, 0.32, 0.02, inner, o);
      if (st === 'suit') { t.box(0, 0.16, 0.118, 0.04, 0.24, 0.01, shade(inner, 0.7)); }
      if (st === 'hoodie') { t.box(0, 0.38, -0.08, 0.3, 0.12, 0.1, shade(top, 0.85), o); t.box(0, 0.12, 0.106, 0.2, 0.1, 0.01, shade(top, 0.8)); }
      if (st === 'coat' || st === 'parka') t.box(0, -0.22, 0, 0.38, 0.24, 0.22, top, o);
      if (st === 'parka') t.box(0, 0.4, -0.06, 0.38, 0.1, 0.14, '#d8c8a0', o);
      if (st === 'flannel') for (let k = 0; k < 3; k++) t.box(0, 0.12 + k * 0.1, 0.106, 0.36, 0.025, 0.01, shade(top, 0.65));
      if (st === 'hawaii') for (let k = 0; k < 6; k++) t.box(-0.14 + (k % 3) * 0.14, 0.12 + Math.floor(k / 3) * 0.16, 0.106, 0.05, 0.05, 0.01, k % 2 ? '#ffe27a' : '#3ab8a8');
      if (st === 'uniform') { t.box(0.1, 0.32, 0.108, 0.07, 0.06, 0.01, acc.has('gold') ? P.gold : '#c8ccd4'); t.box(0, 0.0, 0.106, 0.36, 0.05, 0.01, '#111'); }
      if (st === 'vest') { t.box(0, 0.22, 0.106, 0.36, 0.035, 0.01, '#e8e8a0'); t.box(0, 0.08, 0.106, 0.36, 0.035, 0.01, '#e8e8a0'); }
      if (st === 'cardigan') t.box(0, 0.06, 0.107, 0.02, 0.3, 0.01, '#e8d8a0');
    }
    if (acc.has('chain')) t.box(0, 0.33, 0.106, 0.16, 0.025, 0.01, P.gold, { emit: 0.3 });
    if (acc.has('camera')) t.box(0.1, 0.18, 0.12, 0.1, 0.08, 0.05, '#222');
    if (acc.has('backpack')) { t.box(0, 0.2, -0.16, 0.28, 0.3, 0.12, shade(L.top, 0.6), o); t.box(0, 0.12, -0.225, 0.2, 0.12, 0.02, shade(L.top, 0.5)); }
    if (acc.has('bag')) { t.box(-0.21, 0.02, 0.0, 0.06, 0.18, 0.2, '#5a3a2a', o); t.box(0.0, 0.3, 0.108, 0.36, 0.025, 0.01, '#5a3a2a'); }
    if (acc.has('guitar')) { t.at(0, 0.18, -0.14, 0, 1, 0, 0.6); t.box(0, -0.25, 0, 0.18, 0.3, 0.06, '#8a4a2a'); t.box(0, 0.05, 0, 0.05, 0.4, 0.04, '#3a2a1a'); t.pop(); }
    if (acc.has('choker')) t.box(0, 0.42, 0.06, 0.18, 0.03, 0.08, '#111');
    parts.torso = t;
    // arms: pivot at shoulder, hang down 0.38
    for (const s of ['L', 'R']) {
      const m = new MB(); m.jit = 0.02;
      const sleeve = (st === 'tee' || st === 'hawaii' || st === 'dress' || st === 'vest') ? (st === 'vest' ? inner : top) : top;
      const short = st === 'tee' || st === 'hawaii' || st === 'dress';
      m.box(0, short ? -0.16 : -0.3, 0, 0.1, short ? 0.16 : 0.3, 0.11, sleeve, o);
      if (short) m.box(0, -0.3, 0, 0.085, 0.14, 0.09, L.skin, o);
      m.box(0, -0.38, 0, 0.09, 0.08, 0.1, L.skin, o);
      if (s === 'R' && acc.has('ring')) m.box(0.03, -0.36, 0.05, 0.03, 0.03, 0.02, P.gold, { emit: 0.4 });
      parts['arm' + s] = m;
    }
    // head: pivot at neck, head box 0.32
    const h = new MB(); h.jit = 0.02;
    h.box(0, 0, 0, 0.12, 0.06, 0.12, L.skin, o);
    h.box(0, 0.05, 0.01, 0.32, 0.31, 0.3, L.skin, o);
    // face
    h.box(-0.075, 0.19, 0.162, 0.045, 0.06, 0.01, '#1a1418', { jit: 0 });
    h.box(0.075, 0.19, 0.162, 0.045, 0.06, 0.01, '#1a1418', { jit: 0 });
    h.box(0, 0.085, 0.162, 0.08, 0.02, 0.01, acc.has('lips') ? '#c83a4a' : shade(L.skin, 0.75), { jit: 0 });
    if (L.beard) { h.box(0, 0.05, 0.13, 0.32, 0.1, 0.06, L.beard, o); h.box(0, 0.13, 0.163, 0.16, 0.035, 0.01, L.beard); }
    if (acc.has('earbuds')) for (const s2 of [-1, 1]) h.box(s2 * 0.165, 0.1, 0.02, 0.03, 0.03, 0.03, '#f2efe8', { emit: 0.2 });
    if (acc.has('earrings')) for (const s of [-1, 1]) h.box(s * 0.17, 0.1, 0.02, 0.025, 0.05, 0.025, P.gold, { emit: 0.4 });
    // glasses
    if (L.glasses === 'shades') h.box(0, 0.18, 0.165, 0.3, 0.07, 0.02, '#0e0e12', { jit: 0 });
    if (L.glasses === 'round') { for (const s of [-1, 1]) { h.box(s * 0.075, 0.19, 0.165, 0.09, 0.09, 0.01, '#222'); h.box(s * 0.075, 0.2, 0.168, 0.05, 0.05, 0.01, '#9ad8e8'); } }
    if (L.glasses === 'shadesUp') h.box(0, 0.33, 0.1, 0.3, 0.05, 0.08, '#0e0e12');
    // hair
    const hs = L.hairStyle;
    const hb = (x, y, z, w, hh, d) => h.box(x, y, z, w, hh, d, hc, o);
    if (hs !== 'bald' && L.hat !== 'hood') {
      if (hs === 'buzz') hb(0, 0.31, -0.01, 0.33, 0.06, 0.31);
      else if (hs === 'balding') { hb(-0.16, 0.14, -0.02, 0.03, 0.14, 0.26); hb(0.16, 0.14, -0.02, 0.03, 0.14, 0.26); hb(0, 0.14, -0.155, 0.32, 0.14, 0.03); }
      else {
        hb(0, 0.3, -0.01, 0.34, 0.09, 0.33);                    // cap of hair
        hb(0, 0.12, -0.15, 0.34, 0.24, 0.05);                   // back
        hb(-0.16, 0.2, -0.02, 0.03, 0.16, 0.26); hb(0.16, 0.2, -0.02, 0.03, 0.16, 0.26);
        if (hs === 'short' || hs === 'messy' || hs === 'slick') hb(0, 0.3, 0.13, 0.3, 0.05, 0.06);
        if (hs === 'messy') { hb(-0.1, 0.38, 0.05, 0.08, 0.05, 0.08); hb(0.08, 0.39, -0.06, 0.08, 0.05, 0.08); }
        if (hs === 'long') { hb(0, -0.12, -0.13, 0.36, 0.3, 0.1); hb(-0.17, -0.02, 0.0, 0.04, 0.26, 0.2); hb(0.17, -0.02, 0.0, 0.04, 0.26, 0.2); hb(0, 0.27, 0.15, 0.3, 0.06, 0.04); }
        if (hs === 'bob') { hb(-0.18, 0.02, 0.0, 0.05, 0.3, 0.3); hb(0.18, 0.02, 0.0, 0.05, 0.3, 0.3); hb(0, 0.02, -0.15, 0.38, 0.3, 0.06); hb(0, 0.29, 0.155, 0.32, 0.08, 0.03); }
        if (hs === 'pony') { hb(0, 0.2, -0.2, 0.1, 0.1, 0.08); hb(0, -0.02, -0.23, 0.08, 0.24, 0.07); }
        if (hs === 'bun') hb(0, 0.36, -0.12, 0.14, 0.12, 0.12);
        if (hs === 'mohawk') { hb(0, 0.4, -0.01, 0.08, 0.14, 0.3); }
        if (hs === 'afro') h.sphere(0, 0.3, -0.02, 0.26, hc, { detail: 1, sy: 0.85, jitter: 0.08 });
        if (hs === 'curly') for (let k = 0; k < 6; k++) h.box(-0.13 + (k % 3) * 0.13, 0.36, -0.1 + Math.floor(k / 3) * 0.14, 0.11, 0.08, 0.11, hc);
      }
    }
    // hats
    const hat = L.hat, hcol = L.hatCol || '#2c2c38';
    if (hat === 'beanie') { h.box(0, 0.28, -0.01, 0.35, 0.14, 0.33, hcol, o); h.box(0, 0.27, -0.01, 0.36, 0.05, 0.34, shade(hcol, 0.8)); }
    if (hat === 'cap') { h.box(0, 0.3, -0.01, 0.34, 0.1, 0.33, hcol, o); h.box(0, 0.3, 0.2, 0.3, 0.03, 0.14, hcol); }
    if (hat === 'fedora') { h.box(0, 0.32, 0, 0.5, 0.03, 0.46, hcol); h.box(0, 0.34, 0, 0.32, 0.14, 0.3, hcol); h.box(0, 0.35, 0, 0.33, 0.035, 0.31, '#222'); }
    if (hat === 'cop') { h.box(0, 0.3, 0, 0.36, 0.1, 0.35, hcol); h.box(0, 0.33, 0.02, 0.4, 0.06, 0.38, hcol); h.box(0, 0.28, 0.2, 0.3, 0.03, 0.12, '#111'); h.box(0, 0.34, 0.2, 0.06, 0.05, 0.01, P.gold, { emit: 0.4 }); }
    if (hat === 'hood') { h.box(0, 0.2, -0.03, 0.38, 0.24, 0.36, L.top, o); h.box(0, 0.33, -0.02, 0.36, 0.06, 0.34, shade(L.top, 0.9)); }
    if (hat === 'bucket') { h.box(0, 0.28, 0, 0.44, 0.03, 0.42, hcol); h.box(0, 0.3, 0, 0.32, 0.1, 0.3, hcol); }
    if (hat === 'hardhat') { h.box(0, 0.28, 0, 0.42, 0.03, 0.42, hcol); h.box(0, 0.3, 0, 0.34, 0.12, 0.34, hcol); }
    parts.head = h;
    parts.size = L.size || 1;
    return parts;
  }

  // st: { t, walk, speed, talk, wave, reach, sit, carry, phone, hands, knock, nod, look, lean }
  function pose(x, y, z, yaw, st, size = 1) {
    const t = st.t || 0, w = st.walk || 0, sp = Math.min(1, st.speed || 0);
    const swing = Math.sin(w) * 0.7 * sp;
    const bob = Math.abs(Math.sin(w)) * 0.04 * sp + Math.sin(t * 2.0) * 0.006 * (1 - sp);
    const sit = st.sit ? 1 : 0;
    let root = M4.trs(x, y + bob + (sit ? -0.12 : 0), z, yaw, size);
    const out = {};
    const hip = 0.42;
    out.legL = M4.mul(root, M4.trs(-0.08, hip, 0, 0, 1, sit ? -1.45 : swing));
    out.legR = M4.mul(root, M4.trs(0.08, hip, 0, 0, 1, sit ? -1.4 : -swing));
    out.torso = M4.mul(root, M4.trs(0, hip, 0, 0, 1, sp * 0.08 + (st.lean || 0)));
    let aL = -swing * 0.9, aR = swing * 0.9, zL = -0.08, zR = 0.08;
    if (sit) { aL = aR = -0.5; }
    if (st.carry) { aL = aR = -1.2; zL = -0.02; zR = 0.02; }
    if (st.hands) { aL = aR = -3.0 + Math.sin(t * 6) * 0.05; zL = -0.25; zR = 0.25; }
    if (st.phone) { aR = -2.1; zR = 0.5; }
    if (st.wave) { aR = -2.7 + Math.sin(t * 10) * 0.35; zR = 0.35; }
    if (st.reach) aR = -1.4;
    if (st.knock) aR = -1.5 + Math.max(0, Math.sin(t * 16)) * 0.4;
    if (st.cross) { aL = aR = -0.9; zL = 0.6; zR = -0.6; }
    if (st.talk && !st.wave && !st.phone) aR += Math.sin(t * 7) * 0.25;
    out.armL = M4.mul(root, M4.trs(-0.235, hip + 0.42, 0, 0, 1, aL, zL));
    out.armR = M4.mul(root, M4.trs(0.235, hip + 0.42, 0, 0, 1, aR, zR));
    const nod = (st.talk ? Math.sin(t * 11) * 0.06 : 0) + (st.nod || 0);
    out.head = M4.mul(root, M4.trs(0, hip + 0.46, 0, (st.look || 0) + Math.sin(t * 0.7) * 0.04 * (1 - sp), 1, nod, Math.sin(t * 1.1) * 0.025));
    return out;
  }

  // ---------- Neon the cat (motel cat) ----------
  function buildCat() {
    const f = '#3a3a44', w = '#e8e2d8';
    const body = new MB();
    body.box(0, 0.12, 0, 0.2, 0.18, 0.4, f);
    for (const [lx, lz] of [[-0.06, 0.13], [0.06, 0.13], [-0.06, -0.13], [0.06, -0.13]]) body.box(lx, 0, lz, 0.05, 0.13, 0.05, f);
    const head = new MB();
    head.box(0, -0.05, 0, 0.2, 0.17, 0.17, f);
    for (const s of [-1, 1]) { head.box(s * 0.065, 0.12, -0.02, 0.05, 0.06, 0.04, f); head.box(s * 0.05, 0.02, 0.087, 0.035, 0.035, 0.01, '#e8d83a', { emit: 0.8, jit: 0 }); }
    head.box(0, -0.04, 0.087, 0.05, 0.03, 0.01, w);
    const tail = new MB();
    tail.box(0, 0, 0, 0.04, 0.32, 0.04, f);
    return { body, head, tail };
  }
  function poseCat(x, y, z, yaw, st) {
    const t = st.t || 0, sp = st.speed || 0;
    const root = M4.trs(x, y + Math.abs(Math.sin((st.walk || 0) * 2)) * 0.02 * sp, z, yaw);
    const sit = st.sit ? 1 : 0;
    return {
      body: M4.mul(root, M4.trs(0, sit ? -0.04 : 0, 0, 0, 1, sit ? -0.4 : 0)),
      head: M4.mul(root, M4.trs(0, sit ? 0.36 : 0.32, sit ? 0.12 : 0.22, Math.sin(t * 0.7) * 0.3 * (1 - sp), 1, st.sleep ? 0.5 : 0)),
      tail: M4.mul(root, M4.trs(0, 0.2, -0.2, Math.sin(t * 2.4) * 0.4, 1, -0.9 + Math.sin(t * 1.7) * 0.2)),
    };
  }

  // ---------- held / world items ----------
  const ITEM_MODELS = {
    cash: m => { m.box(0, 0, 0, 0.22, 0.06, 0.12, '#5aa65a'); m.box(0, 0.06, 0, 0.06, 0.005, 0.125, '#e8e2d8'); },
    box: m => { m.box(0, 0, 0, 0.3, 0.24, 0.24, '#a8804a', { mat: W(MT.wood, 0.3) }); m.box(0, 0.12, 0, 0.31, 0.03, 0.25, '#c8a060'); },
    phone: m => { m.box(0, 0, 0, 0.06, 0.11, 0.015, '#111'); m.box(0, 0.01, 0.008, 0.05, 0.09, 0.005, '#7ad8ff', { emit: 1.2 }); },
    mop: m => { m.box(0, 0, 0, 0.03, 0.9, 0.03, '#a8804a'); m.box(0, -0.06, 0, 0.18, 0.08, 0.1, '#e8e2d8'); },
    bag: m => { m.box(0, 0, 0, 0.3, 0.22, 0.14, '#2c2c34'); m.box(0, 0.22, 0, 0.2, 0.03, 0.03, '#111'); },
  };
  function itemMesh(id) { const m = new MB(); (ITEM_MODELS[id] || ITEM_MODELS.box)(m); return m; }

  window.CHARS = { CAST, TYPES, SKIN, HAIR, randomLook, buildChar, pose, buildCat, poseCat, itemMesh };
})();
