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
  };
  const point = k => { const s = SPOTS[k]; if (s.pt) return s.pt; const r = G.returnPoint(s.exit); return [r[0], r[1]]; };
  const CLIENTS = {
    legit: [['Raj', 'mart', 'Invoices for my cousin. Do not lose them.'], ['Dina', 'diner', 'Pies for a birthday. Keep them level.'], ['Gus', 'pawn', 'A watch that\'s actually legal. Rare, I know.'], ['Mrs. Chen', 'laundry', 'Clean shirts for my son. He never picks them up.'], ['Mo', 'bar', 'Sheet music. Don\'t get it wet.'], ['Lou', 'busstop', 'A care package for the road.']],
    shady: [['Sable', 'metro', 'You don\'t open it. You don\'t ask. You get paid.'], ['Kofi', 'docks', 'Small box, big favor.']],
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
    h += `<p style="color:var(--dim);font-size:12px;margin:6px 0 10px">Courier jobs around Lowtown. Grab a parcel, follow the arrow, beat the clock. Deliver fast for a 30% tip. ${hour() >= 23 || hour() < 7 ? 'Only the shady jobs are up this late.' : 'New jobs every few hours.'}</p>`;
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
    if (G.mapId !== 'city') return;
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
  STORY.canTalk = a => !!a.buyer || canTalk0(a);
  STORY.talk = a => a.buyer ? buyerTalk(a) : talk0(a);

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
    if (m !== lastMin) { lastMin = m; stepBuyers(); stepBus(); }
  };
  window.EXTRAS = { makeBuyer, stepBuyers, refreshOffers, acceptGig };
  const tick0 = UI.tick;
  UI.tick = function () { tick0.apply(this, arguments); try { tickHud(); } catch (e) { } };
})();
