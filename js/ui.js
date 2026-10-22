// Interface: HUD, dialogue, phone, shops, upgrades, minigames, title.
(function () {
  const UI = {};
  const $ = id => document.getElementById(id);
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  const tap = (el, fn) => el && el.addEventListener('click', e => { e.stopPropagation(); SFX.unlock(); fn(e); });
  const D = DATA, I = DATA.ITEMS;
  const S = () => G.S;
  const st = { dialog: null, bubble: null, phone: null, sheet: null, game: null, title: false, speaker: null, near: null, guestLook: null, guestName: '' };
  const store = (k, v) => { try { localStorage.setItem('nv-' + k, v); } catch (e) { } };
  const load = k => { try { return localStorage.getItem('nv-' + k); } catch (e) { return null; } };
  const fmt$ = n => (n < 0 ? '-$' : '$') + Math.abs(Math.round(n)).toLocaleString();

  // ---------------- pixel icons ----------------
  const BMP = {
    bottle: ['...kk.....', '...kak....', '..kaak....', '.kaaaak...', '.kaccak...', '.kaccak...', '.kaaaak...', '.kbbbbk...', '..kkkk....', '..........'],
    cloth: ['..........', '.kkkkkkk..', '.kaaaaaak.', '.kacaacak.', '.kaaaaaak.', '.kbbbbbbk.', '.kaaaaaak.', '.kkkkkkkk.', '..........', '..........'],
    tool: ['.kkk......', 'kaaak.....', 'kaaaak....', '.kkaagk...', '...kggk...', '....kggk..', '.....kggk.', '......kgk.', '.......k..', '..........'],
    fuse: ['..........', '..kkkkkk..', '.kggggggk.', '.kaaaaaak.', '.kaccccak.', '.kaaaaaak.', '.kggggggk.', '..kkkkkk..', '..........', '..........'],
    cup: ['..........', '..c.c.....', '...c.c....', '.kkkkkk...', '.kaaaakkk.', '.kaaaak.k.', '.kaaaakkk.', '.kbbbbk...', '..kkkk....', '..........'],
    box: ['..........', '.kkkkkkkk.', '.kccccccck', '.kaaaaaaak', '.kaaccaaak', '.kaaaaaaak', '.kbbbbbbbk', '.kkkkkkkkk', '..........', '..........'],
    jar: ['..kkkkk...', '..kgggk...', '.kaaaaak..', '.kaccaak..', '.kaccaak..', '.kaaaaak..', '.kaaaaak..', '.kbbbbbk..', '..kkkkk...', '..........'],
    shoe: ['..........', '..........', '..kkk.....', '.kaaak....', '.kacaakk..', '.kaaaaaak.', 'kaaaaaaaak', 'kbbbbbbbbk', '.kkkkkkkk.', '..........'],
    cart: ['..........', '.kkkkkkk..', '.kgggggk..', '.kgaaagk..', '.kgaaagk..', '.kgggggk..', '.kgkgkgk..', '.kkkkkkk..', '..........', '..........'],
    phone: ['..kkkkk...', '..kgggk...', '..kaaak...', '..kacak...', '..kaaak...', '..kaaak...', '..kgggk...', '..kgkgk...', '..kkkkk...', '..........'],
    watch: ['...kkk....', '...kgk....', '..kkkkk...', '.kaaaaak..', '.kacckak..', '.kaacaak..', '.kaaaaak..', '..kkkkk...', '...kgk....', '...kkk....'],
    card: ['..........', 'kkkkkkkkk.', 'kaaaaaaak.', 'kacckgggk.', 'kacckaaak.', 'kaaakgggk.', 'kaaaaaaak.', 'kkkkkkkkk.', '..........', '..........'],
    rocket: ['....k.....', '...kak....', '...kak....', '..kacak...', '..kaaak...', '..kaaak...', '..kbbbk...', '.kk.k.kk..', '...c.c....', '..c...c...'],
    idol: ['...kkk....', '..kaaak...', '..kckck...', '..kaaak...', '.kkaaakk..', '.kaaaaak..', '..kaaak...', '..kbbbk...', '.kkkkkkk..', '..........'],
    frame: ['kkkkkkkkk.', 'kgggggggk.', 'kgaaacagk.', 'kgaaaaagk.', 'kgabbaagk.', 'kgbbbbbgk.', 'kgggggggk.', 'kkkkkkkkk.', '..........', '..........'],
    crate: ['..........', '.kkkkkkkk.', '.kaaaaaak.', '.kbkaakbk.', '.kakbbkak.', '.kakbbkak.', '.kbkaakbk.', '.kaaaaaak.', '.kkkkkkkk.', '..........'],
    pick: ['..........', 'kk........', 'kgk.......', '.kgk......', '..kgkkk...', '...kgggk..', '....kkagk.', '......kak.', '.......k..', '..........'],
    radio: ['......k...', '......k...', '.kkkkkkk..', '.kgggggk..', '.kgaaagk..', '.kgggggk..', '.kgkgkgk..', '.kgggggk..', '.kkkkkkk..', '..........'],
    bag: ['..kkkk....', '.k....k...', 'kkkkkkkk..', 'kaaaaaak..', 'kaacaaak..', 'kaaaaaak..', 'kbbbbbbk..', 'kkkkkkkk..', '..........', '..........'],
    letter: ['..........', 'kkkkkkkkk.', 'kckcccckk.', 'kcckcckck.', 'kccckkcck.', 'kcccccccck', 'kkkkkkkkk.', '..........', '..........', '..........'],
    book: ['..........', '.kkkkkkk..', '.kaaaaaak.', '.kaccccak.', '.kaaaaaak.', '.kaaaaaak.', '.kcccccck.', '.kkkkkkkk.', '..........', '..........'],
    photo: ['..........', 'kkkkkkkk..', 'kccccccck.', 'kcaabaack.', 'kcabbbaak.', 'kcbbbbbck.', 'kcccccccck', 'kkkkkkkkk.', '..........', '..........'],
    key: ['..........', '.kkk......', 'kaaak.....', 'kacakkkkk.', 'kaaaaaaaak', '.kkk.kkak.', '.....k.k..', '..........', '..........', '..........'],
    hphone: ['..kkkkk...', '..kgggk...', '..kcccck..', '..kcaack..', '..kcccck..', '..kcaack..', '..kcccck..', '..kgggk...', '..kkkkk...', '..........'],
    rain: ['..kkk.....', '.kgggk....', 'kgggggk...', 'kkkkkkk...', '.c.c.c....', 'c.c.c.....', '..........', '..........'],
    moon: ['..kkk.....', '.kcck.....', 'kcck......', 'kcck......', 'kcck......', '.kcck.....', '..kkk.....', '..........'],
    sun: ['...c....', '.c.c.c..', '..ccc...', 'ccccccc.', '..ccc...', '.c.c.c..', '...c....', '........'],
  };
  const PAL = { k: '#0d0b14', g: '#8a8a9a', c: '#f2efe8' };
  function iconSVG(shape, col) {
    const b = BMP[shape] || BMP.box;
    const dark = KIT.shade(col, 0.6).map(v => Math.round(v * 255));
    const pal = Object.assign({}, PAL, { a: col, b: `rgb(${dark})` });
    let r = '';
    b.forEach((row, y) => { for (let x = 0; x < row.length; x++) { const ch = row[x]; if (ch !== '.' && pal[ch]) r += `<rect x="${x}" y="${y}" width="1.02" height="1.02" fill="${pal[ch]}"/>`; } });
    return `<svg viewBox="0 0 10 10" shape-rendering="crispEdges">${r}</svg>`;
  }
  UI.iconSVG = iconSVG;
  const itemIcon = it => { const d = I[it]; return d ? iconSVG(d.icon[0], d.icon[1]) : iconSVG('box', '#888'); };

  // ---------------- HUD ----------------
  const PLACES = { city: 'Lowtown', office: 'Starlite Office', lobby: 'Starlite Lobby', room: 'Room', pawn: 'Lucky Pawn', mart: '24/7 Mart', diner: "Dina's Diner", metro: 'The Underline', precinct: '9th Precinct', laundry: 'Suds & Duds', bar: 'The Blue Note', warehouse: 'Warehouse 9', trailer: 'Vance Holdings' };
  UI.onMap = function (id) {
    if (st.title) return;
    if (id !== 'room' && id !== 'city') UI.banner(PLACES[id] || id, ''); else if (id === 'city' && !st.cityShown) { st.cityShown = true; UI.banner('Lowtown', 'Sunset Boulevard'); }
    SFX.pickMusic();
    UI.refreshHud();
  };
  function clockStr() { const m = Math.floor(S().clock); let h = Math.floor(m / 60), mm = m % 60; const ap = h >= 12 ? 'PM' : 'AM'; h = h % 12 || 12; return `${h}:${String(mm).padStart(2, '0')} ${ap}`; }
  let lastObjKey = '';
  UI.refreshHud = function () {
    const s = S(); if (!s || st.title) return;
    const m = $('money'); m.textContent = fmt$(s.money); m.classList.toggle('neg', s.money < 0);
    $('dayText').textContent = `DAY ${s.day}` + (G.raining ? ' · RAIN' : '');
    $('wxIcon').innerHTML = iconSVG(G.night > 0.5 ? 'moon' : G.raining ? 'rain' : 'sun', '#ffd84a').replace(/<svg[^>]*>|<\/svg>/g, '');
    const hp = $('heat').querySelectorAll('i');
    hp.forEach((el, i) => { el.className = s.heat >= i + 1 ? 'on' : s.heat >= i + 0.5 ? 'half' : ''; });
    const r = Math.max(0, Math.min(5, s.rep));
    $('stars').textContent = '★'.repeat(Math.round(r)) + '☆'.repeat(5 - Math.round(r));
    const o = STORY.objective();
    const ob = $('obj');
    if (o) {
      ob.hidden = false; $('objTitle').textContent = o.money ? 'GOAL' : 'OBJECTIVE'; $('objText').textContent = o.t;
      const bar = $('objBar');
      if (o.money) { bar.hidden = false; $('objFill').style.width = Math.max(0, Math.min(100, s.money / o.money * 100)) + '%'; } else bar.hidden = true;
      if (lastObjKey && lastObjKey !== o.t) { ob.classList.remove('pulse'); void ob.offsetWidth; ob.classList.add('pulse'); SFX.play('quest'); }
      lastObjKey = o.t;
    } else ob.hidden = true;
    const n = SIM.carried(); $('bagText').textContent = `${n}/${SIM.capacity()}`;
    const unread = s.msgs.filter(x => x.unread).length; $('msgBadge').hidden = !unread; $('msgBadge').textContent = unread;
  };
  UI.moneyPop = function (n) {
    const el = document.createElement('span'); el.className = n > 0 ? 'plus' : 'minus'; el.textContent = (n > 0 ? '+' : '') + fmt$(n);
    const r = $('money').getBoundingClientRect(); el.style.left = r.left + 'px'; el.style.top = (r.bottom + 4) + 'px';
    $('pops').appendChild(el); setTimeout(() => el.remove(), 1500);
    if (n > 0) SFX.play('coin');
  };
  UI.heatPop = function (n, why) {
    const h = $('heat'); h.classList.remove('flash'); void h.offsetWidth; h.classList.add('flash');
    SFX.play('heat');
    if (why) UI.toast(`HEAT +${n.toFixed(1)}: ${why}`, 'bad');
  };
  UI.toast = function (text, kind) {
    const el = document.createElement('div'); el.className = 'toast pix ' + (kind || ''); el.textContent = text;
    const box = $('toasts'); box.appendChild(el); while (box.children.length > 3) box.firstChild.remove();
    setTimeout(() => el.remove(), 3600);
  };
  UI.banner = function (text, sub) { const b = $('banner'); b.innerHTML = `${esc(text)}${sub ? `<small>${esc(sub)}</small>` : ''}`; b.classList.remove('show'); void b.offsetWidth; b.classList.add('show'); };
  tap($('btnPhone'), () => UI.openPhone());
  tap($('btnBag'), () => UI.openPhone('bag'));
  tap($('obj'), () => UI.openPhone('home'));
  $('icoPhone').outerHTML = iconSVG('hphone', '#3ff0ff').replace('<svg', '<svg class="ico" id="icoPhone"');
  $('icoBag').outerHTML = iconSVG('bag', '#ff4fa3').replace('<svg', '<svg class="ico" id="icoBag"');

  // per frame: clock, action button, marker, icons over heads, bubble position
  const iconEls = new Map();
  UI.tick = function () {
    if (!S() || st.title) return;
    $('clockText').textContent = clockStr();
    const busy = G.busy || UI.blocking();
    const near = busy ? null : G.nearest();
    st.near = near;
    const ab = $('actBtn');
    if (near) { ab.hidden = false; $('actName').textContent = near.name; ab.classList.toggle('talk', near.type !== 'obj'); } else ab.hidden = true;
    // objective marker
    const mk = $('marker');
    let tgt = null;
    if (!busy) for (const id of STORY.hints()) {
      const e = G.scene.byId[id];
      if (e) { const k = e.k, an = k.anchor ? k.anchor(e.o, G.ctx()) : null; if (k.visible && !k.visible(e.o, G.ctx())) continue; tgt = an ? [an.x, (k.h || 1.5) + 0.4, an.z] : [e.o.x, (k.h || 1) + 0.6, e.o.z + (k.wall ? 0.3 : 0)]; break; }
      const a = G.agent(id); if (a && !a.hidden) { tgt = [a.x, 1.9, a.z]; break; }
      const ex = (G.map.exits || []).find(x => x.id === id); if (ex) { tgt = [ex.x + (ex.w || 1) / 2, 1.6, ex.z + (ex.h || 1) / 2]; break; }
    }
    if (!busy && !tgt) for (const id of STORY.hints()) { const p = G.pointToward(G.whereIs(id)); if (p) { tgt = p; break; } }
    if (tgt) {
      const s = G.screenOf(...tgt), m = 26;
      const inside = s.x > m && s.y > 80 && s.x < innerWidth - m && s.y < innerHeight - 90;
      mk.hidden = false;
      if (inside) { mk.className = 'marker'; mk.style.transform = `translate(${s.x}px, ${s.y + Math.sin(G.t * 5) * 3}px)`; }
      else {
        const cx = innerWidth / 2, cy = innerHeight / 2; let dx = s.x - cx, dy = s.y - cy;
        const k = Math.min((innerWidth / 2 - m) / Math.abs(dx || 1), (innerHeight / 2 - 100) / Math.abs(dy || 1));
        mk.className = 'marker edge'; mk.style.transform = `translate(${cx + dx * k}px, ${cy + dy * k}px) rotate(${Math.atan2(dy, dx) + Math.PI / 2}rad)`;
      }
    } else mk.hidden = true;
    // icons over heads and doors
    const want = new Map();
    if (!busy || G.busy) {
      for (const a of G.agents) if (a.icon && !a.hidden) want.set('a' + a.id, [a.x, 1.75, a.z, a.icon === 'alert' ? '!' : a.icon === 'suspect' ? '?' : a.icon === 'bell' ? '!' : a.icon === 'deal' ? '$' : '•', a.icon === 'bell' ? 'req' : a.icon]);
      if (G.mapId === 'city' && S().tier <= 3) S().rooms.forEach((r, k) => { if (r.request && k < SIM.roomCount()) { const d = MOTEL.roomDoor(k, S().tier); want.set('r' + k, [d.x, d.y + 2.1, d.z + 0.2, '$', 'req']); } });
      if ((G.mapId === 'office' || G.mapId === 'lobby') && SIM.waiting().length) { const e = G.scene.byId.desk; if (e) want.set('desk', [e.o.x, 1.9, e.o.z, '!', 'req']); }
    }
    for (const [k, el] of iconEls) if (!want.has(k)) { el.remove(); iconEls.delete(k); }
    for (const [k, [x, y, z, ch, cls]] of want) {
      let el = iconEls.get(k);
      if (!el) { el = document.createElement('i'); $('icons').appendChild(el); iconEls.set(k, el); }
      el.className = cls || ''; el.textContent = ch;
      const s = G.screenOf(x, y, z); el.style.left = s.x + 'px'; el.style.top = s.y + 'px';
    }
    if (st.bubble && st.bubble.t) {
      const t = st.bubble.t, s = G.screenOf(t.x, (t.h || 1) + 0.3, t.z);
      const b = $('bubble'), w = b.offsetWidth, h = b.offsetHeight;
      b.style.left = Math.max(8, Math.min(innerWidth - w - 8, s.x - w / 2)) + 'px';
      b.style.top = Math.max(60, Math.min(innerHeight - h - 90, s.y - h - 12)) + 'px';
    }
  };
  UI.promptTarget = () => st.near;
  tap($('actBtn'), () => { if (st.near && !G.busy && !UI.blocking()) G.goInteract(st.near); });

  // ---------------- verbs ----------------
  UI.verbs = function (t) {
    const h = STORY.handler(t.id, t.o); if (!h) return;
    const verbs = h.verbs ? h.verbs() : [];
    const b = $('bubble');
    b.innerHTML = `<div class="bname">${esc(t.name)}</div><div class="bverbs"></div>`;
    const box = b.querySelector('.bverbs');
    for (const v of verbs) { const el = document.createElement('button'); el.type = 'button'; el.className = 'vb main'; el.textContent = v.label; tap(el, () => { UI.closeBubble(); SFX.play('ui'); G.run(v.fn); }); box.appendChild(el); }
    const x = document.createElement('button'); x.type = 'button'; x.className = 'vb look'; x.textContent = 'Never mind'; tap(x, () => UI.closeBubble()); box.appendChild(x);
    if (verbs.length === 1 && h.auto) { UI.closeBubble(); G.run(verbs[0].fn); return; }
    b.hidden = false; st.bubble = { t };
    SFX.play('open'); UI.tick();
  };
  UI.closeBubble = function () { $('bubble').hidden = true; st.bubble = null; };
  G.cv && G.cv.addEventListener('pointerdown', () => { if (st.bubble) UI.closeBubble(); });

  // ---------------- dialogue ----------------
  let dlgResolve = null, typing = null;
  UI.setGuestFace = g => { st.guestLook = g.look || SIM.lookFor(g); st.guestName = g.name; st.guestKey = g.key || 'g' + g.seed; };
  function portrait(who) {
    if (!who) return null;
    if (who === 'guest') return PORTRAITS.get(st.guestKey || 'guest', st.guestLook || CHARS.randomLook(1));
    if (who === 'player') return PORTRAITS.get('player', CHARS.CAST.player);
    const look = CHARS.CAST[who] || (G.agent(who) && G.agent(who).look) || CHARS.CAST.cop;
    return PORTRAITS.get(who, look);
  }
  UI.say = function (who, text, o = {}) {
    return new Promise(res => {
      UI.closeBubble();
      const d = $('dialog');
      d.hidden = false; d.className = 'dialog' + (who ? '' : ' narr');
      const img = portrait(who);
      $('dPortrait').style.backgroundImage = img ? `url(${img})` : '';
      $('dName').textContent = who ? (o.name || (who === 'guest' ? st.guestName : STORY.charName(who))) : '';
      $('dName').hidden = !who;
      $('dChoices').innerHTML = ''; $('dNext').hidden = true;
      st.dialog = true; st.speaker = who === 'guest' ? null : who;
      const el = $('dText'); el.textContent = '';
      const full = String(text);
      let i = 0, done = false;
      const finish = () => { if (done) return; done = true; clearInterval(typing); el.textContent = full; $('dNext').hidden = false; st.speaker = null; };
      typing = setInterval(() => { i += 2; el.textContent = full.slice(0, i); if (who && i % 4 === 0) SFX.play('blip', who); if (i >= full.length) finish(); }, 24);
      dlgResolve = () => { if (!done) { finish(); return false; } dlgResolve = null; st.dialog = null; st.speaker = null; d.hidden = true; res(); return true; };
    });
  };
  UI.choose = function (opts) {
    return new Promise(res => {
      const d = $('dialog'); d.hidden = false; st.dialog = true;
      $('dNext').hidden = true;
      const box = $('dChoices'); box.innerHTML = '';
      dlgResolve = () => false;
      opts.forEach((o, i) => {
        const b = document.createElement('button'); b.type = 'button'; b.className = 'choice'; b.textContent = o;
        tap(b, () => { SFX.play('ui'); box.innerHTML = ''; d.hidden = true; st.dialog = null; dlgResolve = null; res(i); });
        box.appendChild(b);
      });
    });
  };
  tap($('dialog'), () => { if (dlgResolve) { SFX.play('tap'); dlgResolve(); } });
  UI.keyAdvance = function () {
    if (st.gameKey) { st.gameKey(); return true; }
    if (dlgResolve) { dlgResolve(); return true; }
    if (st.popup) { st.popup(); return true; }
    return false;
  };
  UI.talking = () => !!st.dialog;
  UI.speaking = id => st.speaker === id;

  // ---------------- popups ----------------
  UI.itemGet = function (it, n = 1) {
    return new Promise(res => {
      SFX.play('item');
      const p = $('popup'), d = I[it] || { name: it, desc: '' };
      p.innerHTML = `<div class="pcard neonC"><div class="picon">${itemIcon(it)}</div><div class="ptxt"><small>${d.hot ? 'CONTRABAND' : 'GOT'}</small><b>${esc(d.name)}${n > 1 ? ' ×' + n : ''}</b><span>${esc(d.desc)}</span>${d.hot ? '<div class="hot">Hot item: cops will care.</div>' : ''}</div></div>`;
      p.hidden = false;
      let closed = false;
      const close = () => { if (closed) return; closed = true; p.hidden = true; st.popup = null; res(); };
      st.popup = close; setTimeout(() => { p.onclick = close; }, 250); setTimeout(close, 2800);
    });
  };
  UI.readPage = function (page) {
    return new Promise(res => {
      const p = $('page');
      p.innerHTML = `<div class="paper"><h3>${esc(page.title)}</h3><div class="ptext">${esc(page.text)}</div><button type="button" class="btn">Close</button></div>`;
      p.hidden = false; SFX.play('paper'); st.sheet = 'page';
      const close = () => { p.hidden = true; st.sheet = null; st.popup = null; SFX.play('close'); res(); };
      st.popup = close; tap(p.querySelector('.btn'), close);
    });
  };
  UI.fade = function (to, dur) {
    return new Promise(res => { const f = $('fade'); f.style.transition = `opacity ${dur}s steps(${Math.max(2, Math.round(dur * 10))})`; f.style.opacity = to; f.style.pointerEvents = to > 0.5 ? 'auto' : 'none'; setTimeout(res, dur * 1000 + 40); });
  };
  UI.chapterCard = function (a, b) {
    return new Promise(res => {
      const c = $('card'); c.innerHTML = `<h2>${esc(a)}</h2><p>${esc(b)}</p>`; c.className = 'card2'; c.hidden = false; SFX.play('win');
      let done = false;
      const close = () => { if (done) return; done = true; c.classList.add('out'); st.popup = null; setTimeout(() => { c.hidden = true; res(); }, 600); };
      setTimeout(() => { st.popup = close; c.onclick = close; }, 900); setTimeout(close, 3800);
    });
  };
  UI.dreamCard = text => { const d = $('dream'); d.textContent = text; d.hidden = false; };
  UI.closeDream = () => { $('dream').hidden = true; };

  // ---------------- phone ----------------
  UI.TITLES = UI.TITLES || {};
  const TABS = UI.TABS = [['home', 'Home', 'hphone', '#3ff0ff'], ['msgs', 'Texts', 'letter', '#b44bff'], ['hotel', 'Hotel', 'key', '#ffd84a'], ['bag', 'Bag', 'bag', '#ff4fa3'], ['map', 'Map', 'frame', '#59ff8a']];
  UI.phoneBuzz = function (from) { SFX.play('phone'); if (!st.title) UI.toast(`New text from ${from}`, 'guest'); UI.refreshHud(); };
  UI.togglePhone = () => st.phone ? UI.closePhone() : UI.openPhone();
  UI.closePhone = () => { $('phone').hidden = true; st.phone = null; G.paused = false; };
  UI.openPhone = function (tab = 'home') {
    if (G.busy && !st.phone) return;
    const p = $('phone');
    st.phone = tab; p.hidden = false; G.paused = true;
    const s = S();
    const title = (UI.TITLES = Object.assign({ home: 'Burner', msgs: 'Messages', hotel: 'The Starlite', bag: 'Bag', map: 'Lowtown', settings: 'Settings' }, UI.TITLES || {}))[tab];
    p.innerHTML = `<div class="pbody"><div class="pstatus"><span>${clockStr()}</span><span>DAY ${s.day}</span><span>${G.raining ? 'RAIN' : 'CLEAR'} ▮▮▮</span></div>
      <div class="ptitle"><h3>${title}</h3>${tab === 'home' ? '<button type="button" class="x" id="pSet" aria-label="Settings">⚙</button>' : ''}<button type="button" class="x" id="pX" aria-label="Close">×</button></div>
      <div class="pmain" id="pMain"></div>
      <div class="pnav">${TABS.map(([k, l, ic, c]) => `<button type="button" data-t="${k}" class="${k === tab ? 'on' : ''}">${iconSVG(ic, c).replace('<svg', '<svg class="ico"')}${l}${k === 'msgs' && s.msgs.some(m => m.unread) ? '<span class="dot"></span>' : ''}</button>`).join('')}</div></div>`;
    tap(p.querySelector('#pX'), UI.closePhone);
    tap(p.querySelector('#pSet'), () => UI.openPhone('settings'));
    p.querySelectorAll('.pnav button').forEach(b => tap(b, () => { SFX.play('ui'); UI.openPhone(b.dataset.t); }));
    p.onclick = e => { if (e.target === p) UI.closePhone(); };
    const main = p.querySelector('#pMain');
    APPS[tab](main);
    SFX.play('open');
  };
  const APPS = UI.APPS = {};
  APPS.home = function (el) {
    const s = S(), o = STORY.objective();
    const next = !s.flags.paid3 ? D.DEBT.find((d, i) => !s.flags['paid' + (i + 1)]) : null;
    const T = D.TIER[s.tier];
    el.innerHTML = `
      ${o ? `<div class="card"><h4>${o.money ? 'GOAL' : 'NOW'}</h4><b>${esc(o.t)}</b><p>${esc(o.d || '')}</p></div>` : ''}
      <div class="card"><h4>WALLET</h4><b style="color:var(--green);font-size:22px">${fmt$(s.money)}</b><p>${next ? `Marlowe wants ${fmt$(next.amount + (s.flags.lateFee || 0))} by Day ${next.day + (s.flags['ext' + D.DEBT.indexOf(next)] || 0)}.` : 'No debts. Not to Marlowe, anyway.'}</p></div>
      <div class="card"><h4>${esc(T.name.toUpperCase())}</h4><p>Rating ${'★'.repeat(Math.round(s.rep))}${'☆'.repeat(5 - Math.round(s.rep))} · $${SIM.rate()}/night · ${s.tier >= 4 ? Math.round((s.flags.occupancy || 0.5) * 100) + '% full' : SIM.cleanRooms().length + ' clean rooms'}</p><p>Guests waiting: ${SIM.waiting().length} · Staying: ${SIM.staying().length}</p></div>
      <div class="card"><h4>HEAT</h4><p>${s.heat < 1 ? 'Nobody is looking at you.' : s.heat < 2.5 ? 'A few cops know your face.' : s.heat < 4 ? 'You are on the precinct\'s radar. Careful with hot goods.' : 'Raids are coming. Keep contraband in the safe.'}</p><p>Hot items on you: ${SIM.hotCount() ? `<span class="hot">${Object.entries(s.inv).filter(([k]) => I[k] && I[k].hot).map(([k, n]) => I[k].name + ' ×' + n).join(', ')}</span>` : 'none'}</p></div>
      <div class="card"><h4>TODAY ON THE STREET</h4><p>Cheap at Sable's: <span class="tag deal">${esc(I[s.flags.tipItem] ? I[s.flags.tipItem].name : '?')}</span></p><p>Everybody wants: <span class="tag want">${esc(I[s.flags.hotDemand] ? I[s.flags.hotDemand].name : '?')}</span></p></div>
      <div class="card"><h4>LOG</h4>${s.log.slice(0, 6).map(l => `<p>Day ${l.day}: ${esc(l.text)}</p>`).join('') || '<p>Nothing yet.</p>'}</div>`;
  };
  APPS.msgs = function (el) {
    const s = S();
    el.innerHTML = s.msgs.length ? s.msgs.map(m => `<div class="msg ${m.unread ? 'unread' : ''}"><small>Day ${m.day}</small><b>${esc(m.from)}</b><div>${esc(m.text)}</div></div>`).join('') : '<p style="color:var(--dim)">No messages. Nobody has this number yet.</p>';
    s.msgs.forEach(m => { m.unread = false; }); UI.refreshHud();
  };
  APPS.hotel = function (el) {
    const s = S(), n = Math.min(12, SIM.roomCount());
    let h = '';
    if (s.tier <= 3) {
      h += `<div class="roomgrid">${s.rooms.slice(0, n).map((r, k) => { const g = SIM.guestInRoom(k); return `<div class="rm ${r.state}"><b>${k + 1}</b>${r.state === 'occupied' ? esc(g ? g.name : 'guest') + (r.request ? ' <span class="tag want">$</span>' : '') : r.state}</div>`; }).join('')}</div>`;
      h += `<p style="color:var(--dim);font-size:11px;margin:8px 0">Clean rooms take guests. Dirty rooms need a Cleaning Kit. Wrecked rooms need a Toolkit first. Yellow $ = a guest request: knock on their door.</p>`;
    } else h += `<div class="card"><h4>OCCUPANCY</h4><p>${Math.round((s.flags.occupancy || 0.5) * 100)}% of ${D.TIER[s.tier].rooms} rooms. Staff handle the rooms; VIPs still want to meet the owner at the desk.</p></div>`;
    const staff = Object.keys(D.STAFF).filter(k => s.staff[k]).map(k => D.STAFF[k].name + (k === 'clerk' && s.flags.rayClerk ? ' (Ray, free)' : ` ($${D.STAFF[k].wage}/day)`));
    h += `<div class="card"><h4>STAFF</h4><p>${staff.length ? staff.map(esc).join('<br>') : 'Just you. Hire help on the plans board in the office.'}</p></div>`;
    const up = Object.keys(D.ADDONS).filter(k => s.upgrades[k]).map(k => D.ADDONS[k].name);
    h += `<div class="card"><h4>UPGRADES</h4><p>${up.length ? up.map(esc).join(', ') : 'None yet.'}</p></div>`;
    h += `<div class="card"><h4>GUESTS</h4>${s.guests.filter(g => g.state === 'staying' || g.state === 'waiting').map(g => `<p>${esc(g.name)} · ${D.GUESTS[g.type].label} · ${g.state === 'waiting' ? 'waiting at the desk' : 'room ' + (g.room + 1)}</p>`).join('') || '<p>No guests right now.</p>'}</div>`;
    el.innerHTML = h;
  };
  APPS.bag = function (el) {
    const s = S();
    const entries = Object.entries(s.inv).filter(([, n]) => n > 0);
    el.innerHTML = `<p style="color:var(--dim);font-size:11px;margin:0 0 8px">Carrying ${SIM.carried()}/${SIM.capacity()} · <span class="hot">red = contraband</span></p>` + (entries.length ? entries.map(([k, n]) => {
      const d = I[k] || { name: k, desc: '' };
      const acts = [];
      if (d.read) acts.push(`<button type="button" class="btn small ghost" data-read="${k}">Read</button>`);
      if (d.use) acts.push(`<button type="button" class="btn small" data-use="${k}">Use</button>`);
      if (!d.story) acts.push(`<button type="button" class="btn small ghost" data-drop="${k}">Drop</button>`);
      return `<div class="row"><div class="icn">${itemIcon(k)}</div><div class="grow"><b>${esc(d.name)} ×${n}</b><small>${d.hot ? '<span class="hot">HOT · </span>' : ''}${esc(d.desc)}</small></div>${acts.join('')}</div>`;
    }).join('') : '<p style="color:var(--dim)">Empty pockets.</p>');
    el.querySelectorAll('[data-read]').forEach(b => tap(b, () => { UI.closePhone(); G.run(() => UI.readPage(STORY.LORE[I[b.dataset.read].read])); }));
    el.querySelectorAll('[data-drop]').forEach(b => tap(b, () => { SIM.take(b.dataset.drop); SFX.play('close'); UI.refreshHud(); APPS.bag(el); }));
    el.querySelectorAll('[data-use]').forEach(b => tap(b, () => { const k = b.dataset.use; UI.closePhone(); G.run(() => useItem(k)); }));
  };
  async function useItem(k) {
    if (k === 'coffee') { SIM.take('coffee'); await UI.say(null, 'You drink the coffee. Your heart rate is now a drum solo. Time feels... slower.'); G.advanceClock(-30); return; }
    if (k === 'crate') {
      SIM.take('crate'); SFX.play('search'); await G.sleep(500);
      const r = Math.random();
      const loot = r < 0.06 ? ['painting', 1] : r < 0.14 ? ['jade', 1] : r < 0.3 ? ['watch', 1] : r < 0.5 ? ['phone', 2] : r < 0.7 ? ['fireworks', 3] : r < 0.85 ? ['kicks', 2] : ['carts', 4];
      SIM.give(loot[0], loot[1]); await UI.itemGet(loot[0], loot[1]);
      if (I[loot[0]].rare) await UI.say(null, 'Your hands are shaking. This is worth more than the motel. Somebody, somewhere, wants it back.');
    }
  }
  APPS.map = function (el) {
    el.innerHTML = `<canvas class="minimap" id="mm" width="58" height="78"></canvas><div class="legend"><span><i style="background:#ff4fa3"></i>You</span><span><i style="background:#ffd84a"></i>Objective</span><span><i style="background:#3ff0ff"></i>Starlite</span><span><i style="background:#b44bff"></i>Underline</span>${SIM.count('scanner') ? '<span><i style="background:#4f7bff"></i>Cops</span>' : ''}</div>
      <div class="card" style="margin-top:8px"><p>Pawn, Mart and Diner: south on Sunset. Blue Note bar and laundromat: north side of Harbor St. Docks: east end of Harbor St.</p></div>`;
    const c = el.querySelector('#mm'), x = c.getContext('2d');
    const m = MAPS.city();
    const col = { road: '#2a2838', walk: '#4a4658', lot: '#33303f', grass: '#2f4a2a', plaza: '#4f4a5c', dirt: '#4a3c2c', gravel: '#3c3830', water: '#16304a', pier: '#5a4430', pooldeck: '#6a6a7a', bldg: '#7a6a8a' };
    for (let j = 0; j < m.h; j++) for (let i = 0; i < m.w; i++) { x.fillStyle = col[m.tile(i, j)] || '#333'; x.fillRect(i, j, 1, 1); }
    x.fillStyle = '#3ff0ff'; x.fillRect(4, 10, 18, 7); x.fillRect(17, 31, 6, 6);
    x.fillStyle = '#b44bff'; x.fillRect(9, 2, 3, 5);
    const dot = (px, pz, c2, r = 2) => { x.fillStyle = c2; x.fillRect(Math.round(px) - (r >> 1), Math.round(pz) - (r >> 1), r, r); };
    if (SIM.count('scanner') && G.mapId === 'city') for (const a of G.agents) if (a.kind === 'cop') dot(a.x, a.z, '#4f7bff');
    const hint = STORY.hints().map(h => { const e = G.mapId === 'city' && G.scene.byId[h]; return e ? e.o : null; }).find(Boolean);
    if (hint && hint.x != null) dot(hint.x, hint.z, '#ffd84a', 3);
    if (G.mapId === 'city') dot(G.player.x, G.player.z, '#ff4fa3', 3);
  };
  APPS.settings = function (el) {
    el.innerHTML = `<div class="opts">
      <label>Sound <input type="range" min="0" max="1" step="0.05" value="${SFX.vol}" id="sVol"></label>
      <label>Music <input type="range" min="0" max="1" step="0.05" value="${SFX.mus}" id="sMus"></label>
      <label>Graphics <span class="seg"><button type="button" data-g="pretty" class="${G.lowGfx ? '' : 'on'}">Pretty</button><button type="button" data-g="fast" class="${G.lowGfx ? 'on' : ''}">Fast</button></span></label>
      <label>Night <span class="seg"><button type="button" data-nb="0.8" class="${G.nightBoost === 0.8 ? 'on' : ''}">Dark</button><button type="button" data-nb="1" class="${!G.nightBoost || G.nightBoost === 1 ? 'on' : ''}">Normal</button><button type="button" data-nb="1.4" class="${G.nightBoost === 1.4 ? 'on' : ''}">Bright</button></span></label>
      <label>Zoom <span class="seg"><button type="button" data-z="0.8">−</button><button type="button" data-z="1">1×</button><button type="button" data-z="1.25">+</button></span></label>
    </div>
    <div style="display:flex;gap:8px;margin-top:14px;flex-wrap:wrap"><button type="button" class="btn" id="sSave">Save</button><button type="button" class="btn ghost" id="sQuit">Quit to title</button><button type="button" class="btn ghost" id="sFull">Fullscreen</button></div>
    ${window.CLOUD && CLOUD.mode === 'cloud' && CLOUD.user ? `<div class="savecode"><b>Account</b><small>Signed in as <span style="color:var(--cyan)">${esc(CLOUD.user)}</span>. Your progress saves to your account automatically.</small><div style="display:flex;gap:8px;flex-wrap:wrap"><button type="button" class="btn ghost" id="sOut">Sign out</button></div></div>` : ''}
    <div class="savecode"><b>Move your save</b><small>Copy this code, then paste it in Settings on the home-screen app or another phone.</small>
      <div style="display:flex;gap:8px;flex-wrap:wrap"><button type="button" class="btn ghost" id="sCopy">Copy save code</button><button type="button" class="btn ghost" id="sPasteBtn">Load a save code</button></div>
      <div id="sPasteBox" hidden><textarea id="sCode" rows="2" placeholder="Paste a code that starts with NV1." aria-label="Save code"></textarea><button type="button" class="btn" id="sLoad">Load this save</button></div></div>
    <p style="color:var(--dim);font-size:11px;margin-top:14px">Tap to walk, drag to steer (drag far to run). Pinch or scroll to zoom. Keyboard: WASD, Shift to run, E to use, P for phone.</p>
    <p style="color:var(--dim);font-size:11px">For true fullscreen on iPhone: Share → Add to Home Screen, then turn your phone sideways.</p>`;
    el.querySelector('#sVol').oninput = e => { SFX.setVol(+e.target.value); store('sfx', e.target.value); };
    el.querySelector('#sMus').oninput = e => { SFX.setMusic(+e.target.value); store('mus', e.target.value); };
    el.querySelectorAll('[data-g]').forEach(b => tap(b, () => { store('gfx', b.dataset.g); G.save(); location.reload(); }));
    el.querySelectorAll('[data-nb]').forEach(b => tap(b, () => { G.nightBoost = +b.dataset.nb; store('nb', b.dataset.nb); el.querySelectorAll('[data-nb]').forEach(x => x.classList.toggle('on', x === b)); }));
    el.querySelectorAll('[data-z]').forEach(b => tap(b, () => { G.zoom = +b.dataset.z; }));
    tap(el.querySelector('#sSave'), () => { G.save(); UI.toast('Saved.', 'good'); });
    tap(el.querySelector('#sQuit'), () => { G.save(); location.reload(); });
    const out = el.querySelector('#sOut');
    if (out) tap(out, () => { out.disabled = true; out.textContent = 'Signing out...'; G.save(); CLOUD.signOut(); });
    const code = el.querySelector('#sCode');
    tap(el.querySelector('#sCopy'), () => {
      const c = G.exportSave(); if (!c) { UI.toast('No saved game yet.', 'bad'); return; }
      const fallback = () => { el.querySelector('#sPasteBox').hidden = false; code.value = c; code.focus(); code.select(); UI.toast('Select all and copy the code.', 'good'); };
      try { navigator.clipboard.writeText(c).then(() => UI.toast('Save code copied.', 'good'), fallback); } catch (e) { fallback(); }
    });
    tap(el.querySelector('#sPasteBtn'), () => { el.querySelector('#sPasteBox').hidden = false; code.value = ''; code.focus(); });
    tap(el.querySelector('#sLoad'), () => {
      const s2 = G.importSave(code.value);
      if (!s2) { UI.toast('That code didn\'t work. Copy the whole thing, starting with NV1.', 'bad'); return; }
      UI.toast('Save loaded: Day ' + s2.day + '. Restarting...', 'good');
      G.noSave = true; setTimeout(() => location.reload(), 900);
    });
    tap(el.querySelector('#sFull'), () => { const d = document.documentElement; try { const r = (d.requestFullscreen || d.webkitRequestFullscreen || (() => { })).call(d); if (r && r.catch) r.catch(() => { }); } catch (e) { } });
  };

  // ---------------- shops ----------------
  function sheet(html) {
    const sh = $('sheet'); sh.innerHTML = `<div class="sbody">${html}</div>`; sh.hidden = false; st.sheet = 'sheet'; G.paused = true;
    sh.onclick = e => { if (e.target === sh) UI.closeSheet(); };
    return sh;
  }
  UI.closeSheet = () => { $('sheet').hidden = true; st.sheet = null; G.paused = false; if (st.sheetRes) { const r = st.sheetRes; st.sheetRes = null; r(); } UI.refreshHud(); };
  const FACE = { sable: 'sable', doc: 'doc', kofi: 'kofi', gusShop: 'gus', gus: 'gus', raj: 'raj', mo: 'mo', collector: 'marlowe' };
  function faceUrl(k) { const id = FACE[k]; if (!id) return ''; const a = G.agent(id); return PORTRAITS.get(id, CHARS.CAST[id] || (a && a.look) || CHARS.CAST.cop); }
  UI.openShop = function (vendor) {
    return new Promise(res => {
      st.sheetRes = res;
      const V = D.VENDORS[vendor];
      const draw = () => {
        const s = S();
        const sh = sheet(`<div class="shead"><div class="face pix" style="background-image:url(${faceUrl(vendor)})"></div><div style="flex:1"><h3>${esc(V.name)}</h3><p>${V.legit ? 'Legit goods. Fixed prices.' : 'Cash only. Prices change daily.'}</p></div><button type="button" class="x" id="shX">×</button></div>
          <div class="slist">${V.sells.map(it => {
            const p = SIM.price(it, vendor), d = I[it];
            const deal = !V.legit && s.flags.tipItem === it, want = !V.legit && s.flags.hotDemand === it;
            return `<div class="row"><div class="icn">${itemIcon(it)}</div><div class="grow"><b>${esc(d.name)} ${deal ? '<span class="tag deal">DEAL</span>' : ''}${want ? '<span class="tag want">HOT DEMAND</span>' : ''}</b><small>${d.hot ? '<span class="hot">HOT · </span>' : ''}${esc(d.desc)} You have ${SIM.count(it)}.</small></div><span class="price">$${p}</span><button type="button" class="btn small ${s.money < p ? 'off' : ''}" data-b="${it}">Buy</button></div>`;
          }).join('')}</div>
          <div class="sfoot"><span>Cash <b>${fmt$(s.money)}</b></span><span>Carrying ${SIM.carried()}/${SIM.capacity()}</span></div>`);
        tap(sh.querySelector('#shX'), UI.closeSheet);
        sh.querySelectorAll('[data-b]').forEach(b => tap(b, () => {
          const it = b.dataset.b, p = SIM.price(it, vendor), d = I[it];
          if (S().money < p) { SFX.play('bad'); UI.toast('Not enough cash.', 'bad'); return; }
          if (!d.tool && SIM.carried() >= SIM.capacity()) { SFX.play('bad'); UI.toast('Your pockets are full. Stash stuff in the office safe.', 'bad'); return; }
          if (d.tool && SIM.count(it)) { UI.toast('You already have one.'); return; }
          SIM.money(-p); SIM.give(it); SFX.play('cash');
          if (it === 'lockpick') S().flags.gotLockpick = true;
          draw();
        }));
      };
      draw();
    });
  };
  UI.openSell = function (buyer) {
    return new Promise(res => {
      st.sheetRes = res;
      const B = D.BUYERS[buyer];
      const draw = () => {
        const s = S();
        const items = Object.keys(B.buys).filter(it => SIM.count(it) > 0);
        const sh = sheet(`<div class="shead"><div class="face pix" style="background-image:url(${faceUrl(buyer)})"></div><div style="flex:1"><h3>Sell to ${esc(B.name)}</h3><p>Buys: ${Object.keys(B.buys).map(k => I[k].name).join(', ')}</p></div><button type="button" class="x" id="shX">×</button></div>
          <div class="slist">${items.length ? items.map(it => { const p = SIM.buyPrice(it, buyer); return `<div class="row"><div class="icn">${itemIcon(it)}</div><div class="grow"><b>${esc(I[it].name)} ×${SIM.count(it)}</b><small>${s.flags.hotDemand === it ? '<span class="tag want">HOT DEMAND</span> ' : ''}Paying $${p} each</small></div><button type="button" class="btn small" data-s="${it}">Sell 1</button>${SIM.count(it) > 1 ? `<button type="button" class="btn small ghost" data-all="${it}">All</button>` : ''}</div>`; }).join('') : `<p style="color:var(--dim)">You have nothing ${esc(B.name)} wants. They buy: ${Object.keys(B.buys).map(k => I[k].name).join(', ')}.</p>`}</div>
          <div class="sfoot"><span>Cash <b>${fmt$(s.money)}</b></span><span>Deals done: ${s.stats.deals}</span></div>`);
        tap(sh.querySelector('#shX'), UI.closeSheet);
        const sell = (it, n) => { const p = SIM.buyPrice(it, buyer); SIM.take(it, n); SIM.money(p * n); S().stats.deals += n; SFX.play('cash'); if (I[it].hot >= 2) SIM.heat(0.1 * n); draw(); };
        sh.querySelectorAll('[data-s]').forEach(b => tap(b, () => sell(b.dataset.s, 1)));
        sh.querySelectorAll('[data-all]').forEach(b => tap(b, () => sell(b.dataset.all, SIM.count(b.dataset.all))));
      };
      draw();
    });
  };
  UI.openStash = function () {
    return new Promise(res => {
      st.sheetRes = res;
      const draw = () => {
        const s = S();
        const inv = Object.entries(s.inv).filter(([k, n]) => n > 0 && I[k] && !I[k].story && !I[k].tool);
        const sta = Object.entries(s.stash).filter(([, n]) => n > 0);
        const sh = sheet(`<div class="shead"><div style="flex:1"><h3>Office Safe</h3><p>Raids and searches can't touch what's in here. ${SIM.stashCount()}/${SIM.stashCap()}</p></div><button type="button" class="x" id="shX">×</button></div>
          <div class="slist"><p style="color:var(--cyan)">IN THE SAFE</p>${sta.length ? sta.map(([k, n]) => `<div class="row"><div class="icn">${itemIcon(k)}</div><div class="grow"><b>${esc(I[k].name)} ×${n}</b></div><button type="button" class="btn small" data-out="${k}">Take 1</button><button type="button" class="btn small ghost" data-outall="${k}">All</button></div>`).join('') : '<p style="color:var(--dim)">Empty.</p>'}
          <p style="color:var(--pink)">IN YOUR POCKETS</p>${inv.length ? inv.map(([k, n]) => `<div class="row"><div class="icn">${itemIcon(k)}</div><div class="grow"><b>${esc(I[k].name)} ×${n}</b><small>${I[k].hot ? '<span class="hot">HOT</span>' : ''}</small></div><button type="button" class="btn small" data-in="${k}">Store 1</button><button type="button" class="btn small ghost" data-inall="${k}">All</button></div>`).join('') : '<p style="color:var(--dim)">Nothing to store.</p>'}</div>
          <div class="sfoot"><button type="button" class="btn small" id="stAll">Store all hot goods</button><span>Carrying ${SIM.carried()}/${SIM.capacity()}</span></div>`);
        tap(sh.querySelector('#shX'), UI.closeSheet);
        const put = (k, n) => { n = Math.min(n, SIM.stashCap() - SIM.stashCount()); if (n <= 0) { UI.toast('The safe is full.', 'bad'); return; } SIM.take(k, n); s.stash[k] = (s.stash[k] || 0) + n; SFX.play('ui'); draw(); };
        const get = (k, n) => { n = Math.min(n, s.stash[k], SIM.capacity() - SIM.carried()); if (n <= 0) { UI.toast('Your pockets are full.', 'bad'); return; } s.stash[k] -= n; if (!s.stash[k]) delete s.stash[k]; SIM.give(k, n); SFX.play('ui'); draw(); };
        sh.querySelectorAll('[data-in]').forEach(b => tap(b, () => put(b.dataset.in, 1)));
        sh.querySelectorAll('[data-inall]').forEach(b => tap(b, () => put(b.dataset.inall, SIM.count(b.dataset.inall))));
        sh.querySelectorAll('[data-out]').forEach(b => tap(b, () => get(b.dataset.out, 1)));
        sh.querySelectorAll('[data-outall]').forEach(b => tap(b, () => get(b.dataset.outall, s.stash[b.dataset.outall])));
        tap(sh.querySelector('#stAll'), () => { for (const [k, n] of inv) if (I[k].hot) put(k, n); });
      };
      draw();
    });
  };
  UI.openUpgrades = function () {
    return new Promise(res => {
      st.sheetRes = res;
      const draw = () => {
        const s = S(), next = D.TIER[s.tier + 1];
        let h = `<div class="shead"><div style="flex:1"><h3>Plans</h3><p>${esc(D.TIER[s.tier].name)} · ${'★'.repeat(Math.round(s.rep))}${'☆'.repeat(5 - Math.round(s.rep))} · $${SIM.rate()}/night</p></div><button type="button" class="x" id="shX">×</button></div><div class="slist">`;
        if (next) {
          const lock = !s.flags.paid1 ? 'Pay off Marlowe\'s first installment first.' : s.tier === 1 && !s.rooms.slice(0, 6).every(r => r.state !== 'broken') ? 'Repair all 6 rooms first.' : s.rep < next.rep ? `Needs ${next.rep}★ reputation.` : s.tier >= 3 && !s.flags.storyRun ? 'Too risky to build big while Holt is after you.' : '';
          h += `<div class="card"><h4>NEXT: ${esc(next.name.toUpperCase())}</h4><p>${esc(next.desc)}</p><p>${next.rooms} rooms · $${next.rate}/night base</p><div style="display:flex;justify-content:space-between;align-items:center;margin-top:8px"><span class="price">${fmt$(next.cost)}</span><button type="button" class="btn ${lock || s.money < next.cost ? 'off' : ''}" id="upT">Build</button></div>${lock ? `<p class="hot" style="margin-top:6px">${esc(lock)}</p>` : ''}</div>`;
        } else h += `<div class="card"><h4>THE STARLITE GRAND</h4><p>You built the best hotel in Lowtown.</p></div>`;
        h += `<p style="color:var(--cyan)">ADD-ONS</p>`;
        for (const [k, a] of Object.entries(D.ADDONS)) {
          const own = s.upgrades[k], lock = a.minTier && s.tier < a.minTier;
          h += `<div class="row"><div class="grow"><b>${esc(a.name)}</b><small>${esc(a.desc)}</small></div>${own ? '<span class="tag deal">OWNED</span>' : lock ? `<span class="tag">TIER ${a.minTier}</span>` : `<span class="price">$${a.cost}</span><button type="button" class="btn small ${s.money < a.cost ? 'off' : ''}" data-a="${k}">Buy</button>`}</div>`;
        }
        h += `<p style="color:var(--cyan)">STAFF</p>`;
        for (const [k, a] of Object.entries(D.STAFF)) {
          const on = s.staff[k], ray = k === 'clerk' && s.flags.rayClerk;
          h += `<div class="row"><div class="grow"><b>${esc(ray ? 'Uncle Ray (Night Clerk)' : a.name)}</b><small>${esc(a.desc)} ${ray ? 'Works for free. Mostly for coffee.' : `$${a.wage}/day.`}</small></div>${ray ? '<span class="tag deal">FAMILY</span>' : `<button type="button" class="btn small ${on ? 'ghost' : ''}" data-s="${k}">${on ? 'Fire' : 'Hire'}</button>`}</div>`;
        }
        h += `</div><div class="sfoot"><span>Cash <b>${fmt$(s.money)}</b></span></div>`;
        const sh = sheet(h);
        tap(sh.querySelector('#shX'), UI.closeSheet);
        const t = sh.querySelector('#upT');
        if (t) tap(t, () => {
          if (t.classList.contains('off')) { SFX.play('bad'); return; }
          SIM.money(-next.cost); UI.closeSheet(); G.run(() => buildTier(s.tier + 1));
        });
        sh.querySelectorAll('[data-a]').forEach(b => tap(b, () => { const a = D.ADDONS[b.dataset.a]; if (s.money < a.cost) { SFX.play('bad'); return; } SIM.money(-a.cost); s.upgrades[b.dataset.a] = true; SFX.play('build'); s.rep = Math.min(5, s.rep + 0.15); draw(); }));
        sh.querySelectorAll('[data-s]').forEach(b => tap(b, () => { s.staff[b.dataset.s] = !s.staff[b.dataset.s]; SFX.play('ui'); draw(); }));
      };
      draw();
    });
  };
  async function buildTier(t) {
    const s = S();
    await UI.fade(1, 0.6);
    SFX.play('build');
    s.tier = t;
    if (t === 2) s.rooms.slice(0, 6).forEach(r => { if (r.state === 'dirty') { r.state = 'clean'; r.tasks = {}; } });
    if (t === 3) for (let k = 6; k < 12; k++) { s.rooms[k].state = 'clean'; s.rooms[k].tasks = {}; }
    s.rep = Math.min(5, s.rep + 0.3);
    UI.dreamCard('CONSTRUCTION...');
    await G.sleep(1400);
    UI.closeDream();
    const inside = G.mapId === 'office' || G.mapId === 'lobby';
    if (inside) { const [x, z, d] = G.returnPoint('officedoor'); G.loadMap('city', x, z, d); }
    else G.refreshAll();
    G.camOverride = { x: 13, z: 22, y: 1 };
    await UI.fade(0, 0.8);
    await UI.chapterCard(D.TIER[t].name.toUpperCase(), ['', '', 'Six new rooms. Same old neon.', 'Five floors. A real lobby. Valet.', 'Sixteen floors of glass. The skyline knows your name.'][t] || 'Fresh paint, working sign, a pool with water in it.');
    G.camOverride = null;
    if (t >= 5 && !s.flags.ending) setTimeout(() => G.run(STORY.ending), 2000);
  }

  // ---------------- minigames ----------------
  function gameShell(html) { const g = $('game'); g.innerHTML = `<div class="gbody pix">${html}</div>`; g.hidden = false; st.game = true; return g; }
  function gameEnd() { $('game').hidden = true; st.game = null; st.gameKey = null; }
  UI._mg = { shell: gameShell, end: gameEnd, st, tap };
  UI.inMinigame = () => !!(st.game && st.chore);
  UI.timingGame = function ({ title, sub, rounds = 3, speed = 1, zone = 0.2 }) {
    return new Promise(res => {
      const g = gameShell(`<h3>${esc(title)}</h3><p>${esc(sub)}</p><div class="track"><div class="zone"></div><div class="needle"></div></div><div class="pips">${'<span></span>'.repeat(rounds)}</div><button type="button" class="btn">TAP!</button>`);
      const zEl = g.querySelector('.zone'), nEl = g.querySelector('.needle'), pips = g.querySelectorAll('.pips span');
      let r = 0, hits = 0, t0 = performance.now(), zx = 0, raf;
      const place = () => { zx = 0.15 + Math.random() * (0.7 - zone); zEl.style.left = zx * 100 + '%'; zEl.style.width = zone * 100 + '%'; };
      place();
      const loop = () => { const t = (performance.now() - t0) / 1000 * speed; const x = 0.5 - 0.5 * Math.cos(t * Math.PI); nEl.style.left = x * 100 + '%'; st.nx = x; raf = requestAnimationFrame(loop); };
      loop();
      const press = () => {
        if (r >= rounds) return;
        const ok = st.nx >= zx && st.nx <= zx + zone;
        pips[r].className = ok ? 'ok' : 'no'; if (ok) hits++;
        SFX.play(ok ? 'good' : 'bad'); r++;
        if (r >= rounds) { cancelAnimationFrame(raf); setTimeout(() => { gameEnd(); res(hits); }, 450); } else { place(); speed *= 1.15; }
      };
      tap(g.querySelector('.btn'), press); st.gameKey = press;
    });
  };
  UI.lockGame = function (pins = 3) {
    return new Promise(res => {
      const g = gameShell(`<h3>Lockpicking</h3><p>Set each pin when the pick is in the green.</p><div class="lock">${'<span></span>'.repeat(pins)}</div><div class="track"><div class="zone"></div><div class="needle"></div></div><button type="button" class="btn">SET PIN</button><p style="margin-top:8px;font-size:11px">Two slips and the pick snaps.</p>`);
      const pinEls = g.querySelectorAll('.lock span'), zEl = g.querySelector('.zone'), nEl = g.querySelector('.needle');
      let k = 0, fails = 0, t0 = performance.now(), sp = 1.1, zx = 0, zw = 0.18, raf;
      const place = () => { zx = 0.1 + Math.random() * 0.7; zEl.style.left = zx * 100 + '%'; zEl.style.width = zw * 100 + '%'; pinEls.forEach((p, i) => p.classList.toggle('cur', i === k)); };
      place();
      const loop = () => { const t = (performance.now() - t0) / 1000 * sp; const x = 0.5 - 0.5 * Math.cos(t * Math.PI); nEl.style.left = x * 100 + '%'; st.nx = x; if (Math.random() < 0.05) SFX.play('pick'); raf = requestAnimationFrame(loop); };
      loop();
      const press = () => {
        const ok = st.nx >= zx && st.nx <= zx + zw;
        if (ok) { pinEls[k].className = 'set'; SFX.play('pin'); k++; sp *= 1.2; zw *= 0.9; if (k >= pins) { cancelAnimationFrame(raf); setTimeout(() => { gameEnd(); res(true); }, 400); return; } place(); }
        else { fails++; SFX.play('fail'); G.shake(0.15); if (fails >= 2) { cancelAnimationFrame(raf); setTimeout(() => { gameEnd(); res(false); }, 300); } }
      };
      tap(g.querySelector('.btn'), press); st.gameKey = press;
    });
  };
  UI.scrubGame = function (label, kind) {
    return new Promise(res => {
      const n = 7;
      const g = gameShell(`<h3>${esc(label)}</h3><p>${kind === 'tool' ? 'Tap every loose bit.' : 'Rub or tap every spot away.'}</p><div class="scrub"></div><div class="bar"><i style="width:0%"></i></div><button type="button" class="btn ghost">Stop</button>`);
      const box = g.querySelector('.scrub'), bar = g.querySelector('.bar i');
      let left = n;
      const cols = kind === 'tool' ? ['#8a8a9a', '#c8443c', '#ffd84a'] : ['#6a5a3a', '#4a5a3a', '#7a4a5a'];
      for (let i = 0; i < n; i++) {
        const d = document.createElement('div'); d.className = 'dirt'; d.style.left = (6 + Math.random() * 82) + '%'; d.style.top = (8 + Math.random() * 70) + '%';
        d.style.background = cols[i % 3]; d.style.width = d.style.height = (18 + Math.random() * 16) + 'px';
        d.dataset.hp = kind === 'tool' ? 2 : 3;
        box.appendChild(d);
      }
      const hit = el => {
        if (!el || !el.classList.contains('dirt') || el.classList.contains('gone')) return;
        el.dataset.hp--; SFX.play(kind === 'tool' ? 'tool' : 'scrub'); el.style.opacity = 0.3 + el.dataset.hp * 0.25;
        if (el.dataset.hp <= 0) { el.classList.add('gone'); left--; bar.style.width = ((n - left) / n * 100) + '%'; if (left <= 0) setTimeout(() => { gameEnd(); res(true); }, 300); }
      };
      let down = false, lastHit = 0;
      box.addEventListener('pointerdown', e => { down = true; hit(e.target); });
      box.addEventListener('pointermove', e => { if (!down) return; const now = performance.now(); if (now - lastHit < 70) return; lastHit = now; hit(document.elementFromPoint(e.clientX, e.clientY)); });
      addEventListener('pointerup', () => { down = false; }, { once: true });
      tap(g.querySelector('.btn'), () => { gameEnd(); res(false); });
      st.gameKey = () => { const d = box.querySelector('.dirt:not(.gone)'); hit(d); };
    });
  };
  UI.scratchGame = function () {
    return new Promise(res => {
      const syms = ['$', '★', '7', '♥', '◎'];
      const grid = Array.from({ length: 6 }, () => syms[Math.floor(Math.random() * syms.length)]);
      if (Math.random() < 0.25) { const s = syms[Math.floor(Math.random() * 3)]; grid[0] = grid[2] = grid[4] = s; }
      const g = gameShell(`<h3>Lucky Neon Scratcher</h3><p>Match 3 to win.</p><div class="scratch">${grid.map((s, i) => `<button type="button" data-i="${i}">?</button>`).join('')}</div><button type="button" class="btn ghost" id="scDone" hidden>Done</button>`);
      let opened = 0;
      g.querySelectorAll('.scratch button').forEach(b => tap(b, () => {
        if (b.classList.contains('open')) return;
        b.classList.add('open'); b.textContent = grid[+b.dataset.i]; SFX.play('scratch'); opened++;
        if (opened === 6) {
          const cnt = {}; grid.forEach(s => cnt[s] = (cnt[s] || 0) + 1);
          const win = Object.entries(cnt).find(([, n]) => n >= 3);
          const prize = win ? ({ '$': 50, '★': 25, '7': 100, '♥': 15, '◎': 10 })[win[0]] : 0;
          g.querySelector('p').textContent = prize ? `WINNER! $${prize}` : 'No match. The house always wins.';
          SFX.play(prize ? 'win' : 'bad');
          const done = g.querySelector('#scDone'); done.hidden = false; tap(done, () => { gameEnd(); res(prize); });
        }
      }));
    });
  };
  UI.escapeGame = function () {
    return new Promise(res => {
      const g = gameShell(`<h3>RUN!</h3><p>Tap to jump the obstacles. Get away!</p><div class="run"><div class="floor"></div><div class="cop"></div><div class="me"></div></div><div class="bar"><i style="width:0%"></i></div><button type="button" class="btn">JUMP</button>`);
      const run = g.querySelector('.run'), me = g.querySelector('.me'), cop = g.querySelector('.cop'), bar = g.querySelector('.bar i');
      let y = 0, vy = 0, dist = 0, copX = 5, walls = [], t0 = performance.now(), last = t0, raf, hits = 0;
      const W = run.offsetWidth || 300;
      const loop = now => {
        const dt = Math.min(0.05, (now - last) / 1000); last = now;
        vy -= 900 * dt; y = Math.max(0, y + vy * dt); if (y === 0) vy = 0;
        me.style.bottom = 20 + y + 'px';
        dist += dt;
        if (Math.random() < dt * 0.9 && (!walls.length || walls[walls.length - 1].x < W - 120)) { const w = document.createElement('div'); w.className = 'wall'; run.appendChild(w); walls.push({ el: w, x: W }); }
        for (const w of walls) { w.x -= 170 * dt; w.el.style.left = w.x + 'px'; const mx = W * 0.4; if (!w.hit && w.x < mx + 14 && w.x > mx - 12 && y < 20) { w.hit = true; hits++; copX += 18; SFX.play('bad'); G.shake(0.2); } }
        walls = walls.filter(w => { if (w.x < -20) { w.el.remove(); return false; } return true; });
        copX = Math.min(40, copX + dt * 1.2);
        cop.style.left = copX + '%';
        bar.style.width = Math.min(100, dist / 6 * 100) + '%';
        if (copX >= 38) { cancelAnimationFrame(raf); setTimeout(() => { gameEnd(); res(false); }, 300); return; }
        if (dist >= 6) { cancelAnimationFrame(raf); SFX.play('good'); setTimeout(() => { gameEnd(); res(true); }, 300); return; }
        raf = requestAnimationFrame(loop);
      };
      raf = requestAnimationFrame(loop);
      const jump = () => { if (y < 2) { vy = 330; SFX.play('run'); } };
      tap(g.querySelector('.btn'), jump); st.gameKey = jump;
    });
  };

  // ---------------- menu / misc ----------------
  UI.escape = function () {
    if (st.phone) return UI.closePhone();
    if (st.sheet === 'sheet') return UI.closeSheet();
    if (st.bubble) return UI.closeBubble();
    if (!G.busy && !st.title) UI.openPhone('settings');
  };
  UI.blocking = () => !!(st.dialog || st.sheet || st.phone || st.game || st.title || !$('popup').hidden || !$('card').hidden || st.bubble);
  UI.joystick = function (x, y, dx = 0, dy = 0) {
    const j = $('joy');
    if (x == null) { j.hidden = true; return; }
    j.hidden = false; j.style.left = x + 'px'; j.style.top = y + 'px';
    j.firstElementChild.style.transform = `translate(${dx}px, ${dy}px)`;
  };

  // ---------------- title ----------------
  function saveLine(s) {
    if (!s) return '';
    const name = (DATA.TIER[s.tier || 1] || {}).name || 'Starlite Motel';
    return `${s.name || 'Jay'} · Day ${s.day} · $${(s.money || 0).toLocaleString()} · ${name}`;
  }
  UI.title = function () {
    st.title = true;
    const has = !!G.loadSave();
    const t = $('title'); t.hidden = false; $('hud').hidden = true;
    t.innerHTML = `<div class="logo"><h1><span class="no" id="tNo">NO</span>VACANCY</h1><p>Run the motel. Work the black market. Own the city.</p></div>
      <div class="tbtns">${has ? `<button type="button" class="btn" id="tCont">Continue<small class="tsub">${saveLine(G.loadSave())}</small></button>` : ''}<button type="button" class="btn ${has ? 'ghost' : ''}" id="tNew">New Game</button><button type="button" class="btn ghost" id="tOpt">Settings</button><div class="tfoot">Best played sideways · tap to walk, drag to steer</div></div>`;
    // the backdrop: the motel at night in the rain
    const bg = G.newState('Jay');
    Object.assign(bg, { clock: 23 * 60, weather: 'rain' }); bg.flags.power = true;
    G.noSave = true;
    G.start(bg);
    G.player.x = 24.5; G.player.z = 30.5; G.player.yaw = 2.4;
    G.camOverride = { x: 20.5, z: 31, y: 1.5 };
    G.zoom = 0.9;
    const no = $('tNo');
    const flick = setInterval(() => { if (!st.title) { clearInterval(flick); return; } no.classList.toggle('off', Math.random() < 0.15); }, 160);
    SFX.music('title');
    if (has) tap($('tCont'), () => begin(G.loadSave(), false));
    tap($('tNew'), askName);
    tap($('tOpt'), () => { st.title = false; UI.openPhone('settings'); st.title = true; });
  };
  function askName() {
    const old = G.loadSave();
    if (old && !askName.ok) {
      const c = sheet(`<div class="shead"><h3>Start over?</h3></div><p style="color:var(--dim)">A new game replaces your saved game:<br><b style="color:var(--text)">${saveLine(old)}</b></p><div style="display:flex;gap:8px;flex-wrap:wrap"><button type="button" class="btn" id="ngYes">Start a new game</button><button type="button" class="btn ghost" id="ngNo">Keep my save</button></div>`);
      st.title = false; st.sheet = 'sheet';
      tap(c.querySelector('#ngYes'), () => { askName.ok = true; askName(); askName.ok = false; });
      tap(c.querySelector('#ngNo'), () => { $('sheet').hidden = true; st.sheet = null; st.title = true; });
      return;
    }
    const sh = sheet(`<div class="shead"><h3>Who are you?</h3></div><p style="color:var(--dim)">Ray's nephew? Niece? Kid? What do people call you?</p><input id="nameIn" maxlength="12" value="Jay" aria-label="Your name" autocomplete="off"><button type="button" class="btn" id="nameGo">Get off the bus</button>`);
    st.title = false; st.sheet = 'sheet';
    const go = () => { const n = (sh.querySelector('#nameIn').value || 'Jay').trim().slice(0, 12) || 'Jay'; $('sheet').hidden = true; st.sheet = null; G.clearSave(); const S0 = G.newState(n); begin(S0, true); };
    tap(sh.querySelector('#nameGo'), go);
    sh.querySelector('#nameIn').addEventListener('keydown', e => { if (e.key === 'Enter') go(); });
  }
  async function begin(S0, fresh) {
    await UI.fade(1, 0.5);
    st.title = false; $('title').hidden = true; $('hud').hidden = false;
    G.noSave = false; G.camOverride = null; G.zoom = 1;
    G.start(S0);
    UI.refreshHud();
    await UI.fade(0, 0.7);
    if (fresh) G.run(STORY.intro);
  }
  UI._begin = begin;
  UI.init = function () {
    const m = load('mus'), s = load('sfx');
    if (m != null) SFX.setMusic(+m); if (s != null) SFX.setVol(+s);
    const nb = load('nb'); if (nb != null) G.nightBoost = +nb;
    document.getElementById('view').addEventListener('pointerdown', () => { if (st.bubble) UI.closeBubble(); }, true);
  };
  window.UI = UI;
})();
