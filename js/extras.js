// Things to do between guests:
//  - Gigs: courier jobs from the phone (pick up a parcel, deliver it across town against the clock)
//  - Street buyers: passers-by with a $ over their head want something you might be carrying
//  - Tour bus: once a day a bus drops off a crowd of guests at the stop by the motel
//  - Front desk: "Wait for guests" fast-forwards until the next guest walks in
(function () {
  const S = () => G.S, I = DATA.ITEMS;
  const say = (who, text, o) => UI.say(who, text, o);
  const me = text => UI.say('player', text);
  const narr = text => UI.say(null, text);
  const choose = opts => UI.choose(opts);
  const wait = ms => new Promise(r => setTimeout(r, ms));
  const rnd = (a, b) => a + Math.random() * (b - a);
  const pick = a => a[Math.floor(Math.random() * a.length)];
  const absMin = () => (S().day - 1) * 1440 + S().clock;
  const hour = () => G.hour();
  const fmt$ = n => '$' + Math.round(n).toLocaleString();
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

  // items used by gigs
  I.parcel = { name: 'Parcel', desc: 'Somebody\'s delivery. Taped shut. Don\'t shake it.', story: true, icon: ['box', '#c8a060'] };
  I.hotparcel = { name: 'Unmarked Parcel', desc: 'No label, no questions. Heavier than it looks. Cops would love to open it.', story: true, hot: 2, icon: ['box', '#8a5a9a'] };

  // =====================================================================
  // GIGS
  // =====================================================================
  const SPOTS = {
    mart: { exit: 'martIn', name: 'the 24/7 Mart' },
    pawn: { exit: 'pawnIn', name: 'the Lucky Pawn' },
    diner: { exit: 'dinerIn', name: 'Dina\'s Diner' },
    laundry: { exit: 'laundryIn', name: 'the laundromat' },
    bar: { exit: 'barIn', name: 'the Blue Note' },
    metro: { exit: 'metroIn', name: 'the old metro steps' },
    motel: { exit: 'officedoor', name: 'the Starlite office' },
    busstop: { pt: [24.0, 41.6], name: 'the bus stop' },
    docks: { pt: [49.6, 58.5], name: 'the docks' },
    hoop: { pt: [7.5, 66.5], name: 'the basketball court' },
    // downtown, down Sunset where it turns into Grand Ave (longer runs, better pay)
    cafe: { exit: 'cafeIn', name: 'the Daily Grind' },
    casino: { exit: 'casinoIn', name: 'the Lucky 7' },
    boutique: { exit: 'boutiqueIn', name: 'Silk & Steel' },
    aurora: { exit: 'auroraIn', name: 'Aurora Tower' },
    cityhall: { exit: 'cityhallIn', name: 'City Hall' },
    park: { pt: [12, -60 + 41], name: 'Central Park' },
  };
  const point = k => { const s = SPOTS[k]; if (s.pt) return s.pt; const r = G.returnPoint(s.exit); return [r[0], r[1]]; };
  const CLIENTS = {
    legit: [['Raj', 'mart', 'Invoices for my cousin. Do not lose them.'], ['Dina', 'diner', 'Pies for a birthday. Keep them level.'], ['Gus', 'pawn', 'A watch that\'s actually legal. Rare, I know.'], ['Mrs. Chen', 'laundry', 'Clean shirts for my son. He never picks them up.'], ['Mo', 'bar', 'Sheet music. Don\'t get it wet.'], ['Lou', 'busstop', 'A care package for the road.'], ['Kiki', 'cafe', 'Coffee beans. The good ones.'], ['Vero', 'boutique', 'A dress for a client. Do not wrinkle it.'], ['A clerk', 'cityhall', 'Permits. Very boring, very urgent.'], ['A doorman', 'aurora', 'Dry cleaning for the 30th floor.'], ['Sal', 'park', 'Buns. I ran out of buns.']],
    shady: [['Sable', 'metro', 'You don\'t open it. You don\'t ask. You get paid.'], ['Kofi', 'docks', 'Small box, big favor.'], ['A croupier', 'casino', 'Chips. Don\'t count them.']],
  };
  function makeOffer() {
    const h = hour(), late = h >= 23 || h < 7;
    const shady = late || Math.random() < 0.22;
    const [client, from, note] = pick(shady ? CLIENTS.shady : CLIENTS.legit);
    const to = pick(Object.keys(SPOTS).filter(k => k !== from && (shady || k !== 'metro')));
    const a = point(from), b = point(to), dist = Math.hypot(a[0] - b[0], a[1] - b[1]);
    const rush = !shady && Math.random() < 0.3;
    const pay = Math.round((14 + dist * 0.9) * (rush ? 1.7 : 1) * (shady ? 2.6 : 1) * (1 + Math.min(4, S().day) * 0.05) / 5) * 5;
    const mins = Math.round((70 + dist * 4) * (rush ? 0.6 : 1));
    return { id: Math.floor(Math.random() * 1e9), client, from, to, note, pay, mins, rush, shady };
  }
  function refreshOffers(force) {
    const s = S(); const now = absMin();
    if (!force && s.gigOffers && s.gigRefresh && now < s.gigRefresh) return;
    const list = [];
    for (let k = 0; k < 20 && list.length < 3; k++) { const o = makeOffer(); if (!list.some(x => x.client === o.client || (x.from === o.from && x.to === o.to))) list.push(o); }
    s.gigOffers = list;
    s.gigRefresh = now + 240;
  }
  function acceptGig(o) {
    const s = S();
    if (s.gig) return UI.toast('Finish your current gig first.', 'bad');
    s.gig = Object.assign({}, o, { stage: 'pickup', start: absMin() });
    s.gigOffers = (s.gigOffers || []).filter(x => x.id !== o.id);
    SFX.play('quest');
    UI.toast(`Gig accepted: pick up from ${SPOTS[o.from].name}.`, 'good');
    UI.closePhone();
  }
  function dropGig(reason) {
    const s = S(); if (!s.gig) return;
    SIM.take('parcel', 9); SIM.take('hotparcel', 9);
    s.gig = null; UI.refreshHud();
    if (reason) UI.toast(reason, 'bad');
  }
  async function arrive() {
    const s = S(), g = s.gig; if (!g) return;
    if (g.stage === 'pickup') {
      SFX.play('item');
      SIM.give(g.shady ? 'hotparcel' : 'parcel', 1);
      g.stage = 'deliver'; g.pickedAt = absMin();
      await UI.itemGet(g.shady ? 'hotparcel' : 'parcel', 1);
      UI.toast(`Deliver it to ${SPOTS[g.to].name}.`, 'good');
      if (g.shady) UI.toast('Hot cargo: avoid cops on the way.', 'bad');
      return;
    }
    // delivery
    const used = absMin() - g.start, late = used > g.mins;
    let pay = g.pay; let line;
    if (!late && used < g.mins * 0.55) { pay = Math.round(pay * 1.3); line = 'Fast! Here\'s a little extra.'; }
    else if (late) { pay = Math.round(pay * 0.5); line = 'You\'re late. Half pay.'; }
    else line = pick(['Right on time. Thanks.', 'Perfect. Here you go.', 'Appreciate it.']);
    SIM.take('parcel', 9); SIM.take('hotparcel', 9);
    s.gig = null;
    s.stats.gigs = (s.stats.gigs || 0) + 1;
    SFX.play('cash'); SIM.money(pay);
    s.log.unshift({ day: s.day, text: `Gig for ${g.client}: +${fmt$(pay)}` });
    UI.toast(`${line} +${fmt$(pay)}`, late ? '' : 'good');
    if (!late && !g.shady) s.rep = Math.min(5, s.rep + 0.03);
    UI.refreshHud();
  }

  // the beacon you walk into
  const beacon = () => {
    const g = S() && S().gig; if (!g || G.mapId !== 'city') return null;
    const [x, z] = point(g.stage === 'pickup' ? g.from : g.to);
    return { x, y: 1.4, z, r: 3.2, c: g.shady ? [0.75, 0.35, 1] : [1, 0.85, 0.3], i: 1.2 + Math.sin(G.t * 4) * 0.2 };
  };
  let chip, gm;
  function ensureHud() {
    if (chip) return;
    chip = document.createElement('button'); chip.type = 'button'; chip.className = 'gigchip pix'; chip.hidden = true;
    document.getElementById('hud').appendChild(chip);
    chip.addEventListener('click', e => { e.stopPropagation(); UI.openPhone('gigs'); });
    gm = document.createElement('div'); gm.className = 'marker gigm'; gm.hidden = true; gm.innerHTML = '<i></i>';
    document.body.appendChild(gm);
  }
  function tickHud() {
    ensureHud();
    const s = S(), g = s && s.gig;
    if (!g || !G.map) { chip.hidden = true; gm.hidden = true; return; }
    const left = g.mins - (absMin() - g.start);
    const t = left >= 0 ? `${Math.floor(left / 60)}:${String(Math.floor(left % 60)).padStart(2, '0')}` : 'LATE';
    chip.hidden = false; chip.classList.toggle('late', left < 0); chip.classList.toggle('shady', !!g.shady);
    const html = `<b>GIG</b> ${g.stage === 'pickup' ? 'Pick up at' : 'Deliver to'} ${esc(SPOTS[g.stage === 'pickup' ? g.from : g.to].name)} <span>${t}</span>`;
    if (chip.innerHTML !== html) chip.innerHTML = html;
    // arrow toward the spot (outside only)
    if (G.mapId !== 'city' || UI.blocking() || G.busy) { gm.hidden = true; return; }
    const [x, z] = point(g.stage === 'pickup' ? g.from : g.to);
    const sc = G.screenOf(x, 1.6, z), m = 26;
    gm.hidden = false;
    const inside = sc.x > m && sc.y > 80 && sc.x < innerWidth - m && sc.y < innerHeight - 90;
    if (inside) { gm.className = 'marker gigm' + (g.shady ? ' shady' : ''); gm.style.transform = `translate(${sc.x}px, ${sc.y + Math.sin(G.t * 5) * 3}px)`; }
    else {
      const cx = innerWidth / 2, cy = innerHeight / 2; let dx = sc.x - cx, dy = sc.y - cy;
      const k = Math.min((innerWidth / 2 - m) / Math.abs(dx || 1), (innerHeight / 2 - 100) / Math.abs(dy || 1));
      gm.className = 'marker gigm edge' + (g.shady ? ' shady' : ''); gm.style.transform = `translate(${cx + dx * k}px, ${cy + dy * k}px) rotate(${Math.atan2(dy, dx) + Math.PI / 2}rad)`;
    }
  }

  // phone app
  UI.TABS.push(['gigs', 'Gigs', 'box', '#ffd84a']);
  UI.TITLES.gigs = 'Gigs';
  UI.APPS.gigs = function (el) {
    const s = S(); refreshOffers();
    const g = s.gig;
    let h = '';
    if (g) {
      const left = g.mins - (absMin() - g.start);
      h += `<div class="card"><h4>CURRENT GIG</h4><b>${esc(g.client)}: ${esc(SPOTS[g.from].name)} → ${esc(SPOTS[g.to].name)}</b><p>${g.stage === 'pickup' ? 'Go pick up the parcel.' : 'Parcel in hand. Deliver it.'} ${left >= 0 ? `${Math.floor(left / 60)}h ${Math.floor(left % 60)}m left.` : 'You\'re late: half pay.'} Pays ${fmt$(g.pay)}${g.shady ? ' (hot cargo)' : ''}.</p><button type="button" class="btn ghost small" id="gigDrop">Cancel gig</button></div>`;
    }
    h += `<p style="color:var(--dim);font-size:14px;margin:6px 0 10px">Courier jobs around Lowtown. Grab a parcel, follow the arrow, beat the clock. Deliver fast for a 30% tip. ${hour() >= 23 || hour() < 7 ? 'Only the shady jobs are up this late.' : 'New jobs every few hours.'}</p>`;
    h += (s.gigOffers || []).map(o => `<div class="card gig ${o.shady ? 'shady' : ''}"><h4>${o.shady ? 'NO QUESTIONS ASKED' : o.rush ? 'RUSH' : 'DELIVERY'} · ${esc(o.client)}</h4><b>${esc(SPOTS[o.from].name)} → ${esc(SPOTS[o.to].name)}</b><p>"${esc(o.note)}"</p><p><span class="tag deal">${fmt$(o.pay)}</span> within ${Math.floor(o.mins / 60)}h ${o.mins % 60}m${o.shady ? ' · <span class="hot">hot cargo, cops will care</span>' : ''}</p><button type="button" class="btn small" data-gig="${o.id}" ${g ? 'disabled' : ''}>Take the job</button></div>`).join('') || '<p style="color:var(--dim)">No jobs right now. Check back later.</p>';
    el.innerHTML = h;
    el.querySelectorAll('[data-gig]').forEach(b => b.addEventListener('click', () => { const o = (s.gigOffers || []).find(x => x.id === +b.dataset.gig); if (o) acceptGig(o); }));
    const d = el.querySelector('#gigDrop'); if (d) d.addEventListener('click', () => { dropGig('Gig cancelled.'); UI.openPhone('gigs'); });
  };

  // =====================================================================
  // STREET BUYERS
  // =====================================================================
  const STREET = ['smokes', 'shine', 'kicks', 'perfume', 'carts', 'phone', 'watch', 'fireworks', 'coffee'];
  const LINES = ['Psst. Hey. You got any {item}?', 'You look like someone who knows a guy. I need {item}.', 'Long night. I\'d kill for some {item}. Well. Pay for.', 'Word is the motel kid can get {item}. That you?'];
  function makeBuyer(a) {
    const s = S();
    const mine = STREET.filter(k => SIM.count(k) > 0);
    const item = mine.length && Math.random() < 0.65 ? pick(mine) : (Math.random() < 0.35 && s.flags.hotDemand && STREET.includes(s.flags.hotDemand) ? s.flags.hotDemand : pick(STREET));
    const base = I[item].base || I[item].price || 10;
    const price = Math.round(base * rnd(1.45, 1.95) * (item === s.flags.hotDemand ? 1.25 : 1));
    a.buyer = { item, price, until: absMin() + 200, narc: s.heat >= 2 && Math.random() < 0.18 };
    a.icon = 'deal'; a.name = 'Stranger';
  }
  function stepBuyers() {
    const s = S(); if (!s.flags.metSable) return; // they show up once you know the Underline
    const now = absMin();
    for (const a of G.agents) if (a.buyer && now > a.buyer.until) { a.buyer = null; a.icon = null; }
    if (!G.map || !G.map.outdoor) return;
    if (!s.nextBuyer) s.nextBuyer = now + 30;
    if (now < s.nextBuyer) return;
    s.nextBuyer = now + rnd(45, 110);
    if (G.agents.filter(a => a.buyer).length >= 2) return;
    const p = G.player;
    const cands = G.agents.filter(a => a.kind === 'ped' && !a.buyer && !a.hidden && Math.hypot(a.x - p.x, a.z - p.z) < 22);
    if (cands.length) makeBuyer(pick(cands));
  }
  async function buyerTalk(a) {
    const b = a.buyer; if (!b) return;
    const s = S();
    a.path = null;
    UI.setGuestFace({ key: 'st' + a.id, look: a.look, name: 'Stranger' });
    const nm = I[b.item].name.toLowerCase();
    await say('guest', pick(LINES).replace('{item}', nm), { name: 'Stranger' });
    const have = SIM.count(b.item) > 0;
    const c = await choose([have ? `Sell 1 for ${fmt$(b.price)}` : `I don't have any ${nm}`, 'Not today']);
    if (c === 0 && have) {
      SIM.take(b.item, 1);
      if (b.narc) {
        await narr('He reaches for his wallet... and flashes a badge instead.');
        await say('guest', 'Thanks for making my quota easy, kid. I\'ll keep this.', { name: 'Undercover cop' });
        SIM.heat(1.2, 'Sold to an undercover cop');
      } else {
        SIM.money(b.price); SFX.play('cash');
        s.stats.deals = (s.stats.deals || 0) + 1;
        await say('guest', pick(['Pleasure doing business.', 'You\'re a lifesaver.', 'Same time tomorrow?']), { name: 'Stranger' });
        UI.toast(`Street sale: +${fmt$(b.price)}`, 'good');
      }
    } else if (c === 0) await say('guest', 'Huh. Ask around then, yeah? I\'ll be around.', { name: 'Stranger' });
    else await say('guest', 'Your loss.', { name: 'Stranger' });
    if (c === 0 && have) { a.buyer = null; a.icon = null; }
    // keep walking
    const t = pick([[25.2, 2], [25.2, 76], [32.8, 2], [32.8, 76], [2, 45], [48, 45], [2, 52.8], [48, 52.8]]);
    if (!G.pathTo(a, t[0], t[1])) a.path = [t];
    UI.refreshHud();
  }
  const canTalk0 = STORY.canTalk, talk0 = STORY.talk;
  STORY.canTalk = a => !!a.buyer || a.kind === 'homeless' || canTalk0(a);
  STORY.talk = a => a.buyer ? buyerTalk(a) : a.kind === 'homeless' ? homelessTalk(a) : talk0(a);

  // =====================================================================
  // THE SLUMS: people living rough. Kindness pays back in its own way.
  // =====================================================================
  const CAMP = [
    { id: 'hl_walt', name: 'Walt', x: 2.6, z: 28.9, yaw: 1.2, sit: true },
    { id: 'hl_maggie', name: 'Maggie', x: 2.4, z: 31.6, yaw: -1.4 },
    { id: 'hl_tito', name: 'Tito', x: 2.6, z: 67.7, yaw: 1.6, sit: true },
    { id: 'hl_june', name: 'June', x: 3.2, z: 63.8, yaw: -1.2 },
    { id: 'hl_preacher', name: 'The Preacher', x: 35.0, z: 56.8, yaw: -1.6, sit: true },
    { id: 'hl_kid', name: 'Skids', x: 13.0, z: 67.0, yaw: 1.4, sit: true },
    { id: 'hl_rover', name: 'Rover', x: 12.5, z: 53.0, yaw: 0, wander: true },
  ];
  const HL_LINES = {
    hl_walt: ['Ray used to bring me coffee. Every morning. Never asked for nothing.', 'Thirty years I drove a bus on Sunset. Now I just watch \'em go by.'],
    hl_maggie: ['Fire\'s for everybody. Warm your hands.', 'The cops sweep the alley Tuesdays. Don\'t keep nothing here you want to keep.'],
    hl_tito: ['You got a smoke? No? That\'s alright, kid.', 'Vance\'s people came through with a clipboard. Counting us. Like inventory.'],
    hl_june: ['I had a flower shop on Harbor. Lease went up four times in a year.', 'Mind the third step on the metro stairs. Broke my wrist on it.'],
    hl_preacher: ['The meek shall inherit the earth. The developers will have zoned it first.', 'Repent! Or at least tip your waitress.'],
    hl_kid: ['I\'m not homeless, I\'m between apartments. Like, all of them.', 'I can get into any car in under a minute. Not that I would. Anymore.'],
    hl_rover: ['Seen a cat with a neon collar? Looks like she owns the place.', 'Every night a black car parks by the construction site. Engine running. Nobody gets out.'],
  };
  function spawnCamp() {
    const s = S();
    for (const c of CAMP) {
      if (G.agent(c.id)) continue;
      const seed = 200 + CAMP.indexOf(c) * 7;
      const a = G.addAgent({ id: c.id, kind: 'homeless', name: c.name, look: CHARS.randomLook(seed, 'homeless'), lookKey: 'hl' + seed, x: c.x, z: c.z, spd: 0.9, home: [c.x, c.z], wander: !!c.wander, ghost: true, walkFilter: SIM.pedFilter, gate: SIM.pedGate });
      a.yaw = a.faceYaw = c.yaw;
      if (c.sit) a.pose = { sit: true };
      if (s.flags['helped_' + c.id] >= 3) a.icon = null;
    }
  }
  function stepCamp() {
    for (const a of G.agents) if (a.kind === 'homeless' && a.wander && !a.path && Math.random() < 0.08) {
      const t = pick([[12.5, 53], [2.5, 44.5], [24.5, 53], [3, 30]]);
      if (!G.pathTo(a, t[0], t[1])) a.path = null;
    }
  }
  const populate0 = SIM.populate;
  SIM.populate = function (id, restored) {
    populate0(id, restored);
    if (id === 'city') spawnCamp();
  };
  async function homelessTalk(a) {
    const s = S(), id = a.id;
    UI.setGuestFace({ key: 'hlf' + id, look: a.look, name: a.name });
    const helped = s.flags['helped_' + id] || 0;
    await say('guest', pick(HL_LINES[id] || ['...']), { name: a.name });
    const opts = [];
    if (s.money >= 5) opts.push('Give $5');
    if (SIM.count('coffee')) opts.push('Give a coffee');
    opts.push('Ask what\'s going on', 'Leave');
    const c = opts[await choose(opts)];
    if (c === 'Give $5' || c === 'Give a coffee') {
      if (c === 'Give $5') SIM.money(-5); else SIM.take('coffee', 1);
      s.flags['helped_' + id] = helped + 1;
      s.karma = (s.karma || 0) + 1;
      s.rep = Math.min(5, s.rep + 0.02);
      SFX.play('coin');
      const roll = Math.random();
      if (helped + 1 === 3) {
        await say('guest', 'You\'re alright, kid. Here. Found it in a dumpster behind the Blue Note. Figure you can use it more than me.', { name: a.name });
        const gift = pick(['lockpick', 'watch', 'phone', 'perfume']);
        SIM.give(gift, 1); await UI.itemGet(gift, 1);
      } else if (roll < 0.35 && s.heat > 0.3) {
        await say('guest', 'Tell you what. Cops ask, I never seen you. And I\'ll whistle if they come round the motel.', { name: a.name });
        SIM.heat(-0.5); UI.toast('Heat down a little: the street has your back.', 'good');
      } else if (roll < 0.7) {
        const it = I[s.flags.hotDemand], tip = I[s.flags.tipItem];
        await say('guest', `Word on the street: everybody's looking for ${it ? it.name.toLowerCase() : 'something'} today. And Sable's sitting on a pile of ${tip ? tip.name.toLowerCase() : 'junk'}. Cheap.`, { name: a.name });
      } else await say('guest', pick(['God bless.', 'That\'s a hot meal. Thank you.', 'You\'re Ray\'s kid, huh? It shows.']), { name: a.name });
    } else if (c === 'Ask what\'s going on') {
      const lines = HL_LINES[id] || []; await say('guest', lines[1] || lines[0] || 'Same as always.', { name: a.name });
    }
    a.faceYaw = null;
  }

  // =====================================================================
  // TOUR BUS
  // =====================================================================
  function stepBus() {
    const s = S(); if (!s.flags.openForBusiness || s.tier >= 4) return;
    const h = hour();
    if (s.flags.busDay !== s.day) { s.flags.busDay = s.day; s.flags.busAt = s.day >= 2 && Math.random() < 0.7 ? rnd(15, 21) : -1; }
    if (s.flags.busAt > 0 && h >= s.flags.busAt && h < s.flags.busAt + 1) {
      s.flags.busAt = -1;
      const free = SIM.cleanRooms().length;
      const n = Math.max(1, Math.min(3, free, 3 - SIM.waiting().length));
      if (!free) { if (G.mapId === 'city') UI.toast('A tour bus stopped, saw the NO VACANCY sign and drove off. Clean more rooms!', 'bad'); return; }
      for (let i = 0; i < n; i++) setTimeout(() => SIM.spawnArrival(pick(['tourist', 'tourist', 'couple', 'musician'])), i * 1200);
      SFX.play('busgo');
      UI.toast(`A tour bus just pulled up! ${n} guest${n > 1 ? 's' : ''} heading to the office.`, 'good');
    }
  }

  // =====================================================================
  // FRONT DESK: wait for guests
  // =====================================================================
  const bell0 = STORY.H.bell;
  STORY.H.bell = {
    name: 'Bell', verbs: () => {
      const v = bell0.verbs();
      if (S().flags.openForBusiness && !SIM.waiting().length) v.unshift({ label: 'Wait for guests', fn: waitForGuests });
      return v;
    },
  };
  async function waitForGuests() {
    const s = S(), h = hour();
    if (!SIM.cleanRooms().length) return me('No clean rooms. Nobody\'s checking into a mess. I should clean one first.');
    if (h >= 2 && h < 10) return me('Nobody checks in at this hour. I should get some sleep, or go make some money.');
    await UI.fade(0.75, 0.3);
    const startN = s.guests.length; let mins = 0;
    G.player.pose = { cross: true };
    while (mins < 240) {
      G.advanceClock(5); mins += 5;
      await wait(40); // let the world process those minutes
      if (s.guests.length > startN || SIM.waiting().length) break;
      const hh = hour(); if (hh >= 2 && hh < 10) break;
    }
    G.player.pose = {};
    await UI.fade(0, 0.3);
    if (s.guests.length > startN || SIM.waiting().length) UI.toast(`${Math.round(mins / 60 * 10) / 10}h later: a guest is coming in.`, 'good');
    else await me('Dead night. Maybe I should go hustle instead.');
  }

  // =====================================================================
  // WEATHER: showers come and go
  // =====================================================================
  function stepWeather() {
    const s = S();
    if (s.day === 1 && hour() < 7) return; // the arrival night stays rainy
    if (G.raining && Math.random() < 0.25) { G.raining = false; s.weather = 'clear'; if (G.mapId === 'city') UI.toast('The rain stops.'); }
    else if (!G.raining && Math.random() < 0.035) { G.raining = true; s.weather = 'rain'; s.flags.wetGround = 1; if (G.mapId === 'city') UI.toast('It starts to rain.'); }
    // puddles dry out a few hours after the rain
    if (!G.raining && s.flags.wetGround && Math.random() < 0.3) s.flags.wetGround = 0;
  }

  // =====================================================================
  // per-frame
  // =====================================================================
  const update0 = SIM.update;
  let lastMin = -1;
  SIM.update = function (dt) {
    update0(dt);
    const s = S(); if (!s) return;
    if (!G.extraLights.includes(beacon)) G.extraLights.push(beacon);
    const g = s.gig;
    if (g) {
      // particles rising from the target spot
      if (G.mapId === 'city' && Math.random() < dt * 14) { const [x, z] = point(g.stage === 'pickup' ? g.from : g.to); G.emit({ x: x + rnd(-0.3, 0.3), y: 0.2, z: z + rnd(-0.3, 0.3), vy: rnd(1.2, 2.2), life: 0.9, size: 2, r: g.shady ? 0.8 : 1, g: g.shady ? 0.4 : 0.85, b: g.shady ? 1 : 0.3, a: 0.9, drag: 0.5 }); }
      if (absMin() - g.start > g.mins * 2) dropGig(`${g.client} gave up waiting. Gig cancelled.`);
      else if (G.mapId === 'city' && !G.busy && !UI.blocking()) {
        const [x, z] = point(g.stage === 'pickup' ? g.from : g.to);
        if (Math.hypot(G.player.x - x, G.player.z - z) < 1.3) G.run(arrive);
      }
    }
    const m = Math.floor(absMin());
    if (m !== lastMin) { lastMin = m; stepBuyers(); stepBus(); if (G.mapId === 'city') stepCamp(); if (m % 60 === 0) stepWeather(); }
  };
  window.EXTRAS = { makeBuyer, stepBuyers, refreshOffers, acceptGig, gigPoint: point };
  const tick0 = UI.tick;
  UI.tick = function () { tick0.apply(this, arguments); try { tickHud(); } catch (e) { } };
})();
