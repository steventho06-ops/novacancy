// Downtown life: the people, the bank, the casino, outfits, the penthouse and getting around.
(function () {
  const S = () => G.S, I = DATA.ITEMS, H = STORY.H;
  const say = (who, text, o) => UI.say(who, text, o);
  const me = text => UI.say('player', text);
  const narr = text => UI.say(null, text);
  const choose = opts => UI.choose(opts);
  const wait = ms => new Promise(r => setTimeout(r, ms));
  const pick = a => a[Math.floor(Math.random() * a.length)];
  const fmt$ = n => '$' + Math.round(n).toLocaleString();
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  const money = n => { SIM.money(n); UI.refreshHud(); };
  const { shell, end, st, tap } = UI._mg;
  const PENTHOUSE_PRICE = 18000;

  I.hotdog = { name: 'Hot Dog', desc: 'Everything on it. Still warm. Someone in the slums would love this.', price: 4, icon: ['cup', '#c8443c'] };

  // =====================================================================
  // people downtown
  // =====================================================================
  const LOOK = {
    concierge: { skin: '#c98e62', hair: '#1e1a1a', hairStyle: 'slick', top: '#18181e', topStyle: 'suit', inner: '#c9a14a', bottom: '#18181e', shoes: '#111', acc: ['gold'] },
    teller: { skin: '#f2c9a0', hair: '#6a4426', hairStyle: 'bun', top: '#2a3a5a', topStyle: 'suit', inner: '#e8e2d8', bottom: '#2a3a5a', shoes: '#111', glasses: 'round' },
    dealer: { skin: '#a8704a', hair: '#1e1a1a', hairStyle: 'short', top: '#e8e2d8', topStyle: 'vest', inner: '#7a1a2a', bottom: '#18181e', shoes: '#111' },
    barista: { skin: '#e3ad84', hair: '#e86aa0', hairStyle: 'pony', top: '#2f6a5a', topStyle: 'tee', inner: '#e8e2d8', bottom: '#2c2c34', acc: ['earrings'] },
    stylist: { skin: '#7e5236', hair: '#d9b46a', hairStyle: 'afro', top: '#ff7ac0', topStyle: 'coat', inner: '#18181e', bottom: '#18181e', shoes: '#c9a14a', glasses: 'shades', acc: ['earrings', 'lips'] },
    busker: { skin: '#c98e62', hair: '#3a2a20', hairStyle: 'long', top: '#5a3a8a', topStyle: 'jacket', inner: '#e8c13c', bottom: '#2a3a5a', hat: 'beanie', hatCol: '#c8443c', acc: ['guitar'], beard: '#3a2a20' },
    ito: { skin: '#e3ad84', hair: '#e8e4e0', hairStyle: 'balding', top: '#6a5a7a', topStyle: 'cardigan', inner: '#e8e2d8', bottom: '#4a4a52', glasses: 'round' },
    vendor: { skin: '#a8704a', hair: '#1e1a1a', hairStyle: 'short', top: '#e8e2d8', topStyle: 'tee', inner: '#c8443c', bottom: '#2a3a5a', hat: 'cap', hatCol: '#c8443c' },
  };
  const NAMES = { concierge: 'Mr. Beaumont', teller: 'Ms. Albright', dealer: 'Dealer', barista: 'Kiki', stylist: 'Vero', busker: 'Danny Strings', ito: 'Old Man Ito', vendor: 'Sal' };
  const NPCS = {
    aurora: [['concierge', 3.5, 2.2, 'down']],
    bank: [['teller', 6, 2.0, 'down']],
    casino: [['dealer', 5, 3.4, 'down']],
    cafe: [['barista', 3.5, 1.4, 'down']],
    boutique: [['stylist', 6.5, 1.4, 'down']],
    downtown: [['busker', 9.8, 33.4, 'down', { pose: { strum: true } }], ['ito', 4.5, 43, 'right', { pose: { sit: true } }], ['vendor', 13.8, 35.6, 'up']],
  };
  const npcs0 = STORY.npcs;
  STORY.npcs = id => {
    const out = npcs0(id);
    for (const [k, x, z, dir, extra] of NPCS[id] || []) out.push(Object.assign({ id: k, name: NAMES[k], look: LOOK[k], lookKey: 'dt_' + k, x, z, dir, kind: 'npc' }, extra || {}));
    return out;
  };
  const face = id => UI.setGuestFace({ key: 'dtf_' + id, look: LOOK[id], name: NAMES[id] });
  const sayN = (id, text) => { face(id); return say('guest', text, { name: NAMES[id] }); };

  // =====================================================================
  // the bank
  // =====================================================================
  const bankBal = () => S().bank || 0;
  function bankSheet() {
    return new Promise(done => {
      const s = S();
      const html = () => `<div class="shead"><h3>First Harbor Bank</h3></div>
        <div class="card"><h4>SAVINGS</h4><b style="color:var(--green);font-size:24px">${fmt$(bankBal())}</b><p>Earns 1% interest every night. Cops can't take it and raids can't touch it.</p></div>
        <div class="card"><h4>CASH ON YOU</h4><b style="font-size:20px">${fmt$(s.money)}</b></div>
        <div class="bankrow"><b>Deposit</b>${[50, 200, 1000].map(n => `<button type="button" class="btn small" data-dep="${n}" ${s.money < n ? 'disabled' : ''}>${fmt$(n)}</button>`).join('')}<button type="button" class="btn small" data-dep="all" ${s.money < 1 ? 'disabled' : ''}>All</button></div>
        <div class="bankrow"><b>Withdraw</b>${[50, 200, 1000].map(n => `<button type="button" class="btn small ghost" data-wd="${n}" ${bankBal() < n ? 'disabled' : ''}>${fmt$(n)}</button>`).join('')}<button type="button" class="btn small ghost" data-wd="all" ${bankBal() < 1 ? 'disabled' : ''}>All</button></div>
        <button type="button" class="btn ghost" id="bankDone" style="margin-top:10px">Done</button>`;
      const sh = document.getElementById('sheet');
      const draw = () => {
        sh.innerHTML = `<div class="sbody">${html()}</div>`; sh.hidden = false; G.paused = true;
        sh.querySelectorAll('[data-dep]').forEach(b => tap(b, () => { const n = b.dataset.dep === 'all' ? s.money : +b.dataset.dep; if (n > 0 && s.money >= n) { s.money -= n; s.bank = bankBal() + n; SFX.play('cash'); UI.refreshHud(); draw(); } }));
        sh.querySelectorAll('[data-wd]').forEach(b => tap(b, () => { const n = b.dataset.wd === 'all' ? bankBal() : +b.dataset.wd; if (n > 0 && bankBal() >= n) { s.bank = bankBal() - n; s.money += n; SFX.play('coin'); UI.refreshHud(); draw(); } }));
        tap(sh.querySelector('#bankDone'), () => { sh.hidden = true; G.paused = false; done(); });
      };
      draw();
    });
  }
  const newDay0 = SIM.newDay;
  SIM.newDay = function () {
    newDay0();
    const s = S();
    if (s.bank > 0) { const i = Math.round(s.bank * 0.01); if (i > 0) { s.bank += i; s.log.unshift({ day: s.day, text: `Bank interest: +${fmt$(i)}` }); } }
  };
  const bankVerb = { label: 'Use the ATM', fn: () => bankSheet() };
  H.atm1 = H.atm2 = { name: 'ATM', verbs: () => [bankVerb] };
  H.teller_desk = { name: 'Teller', verbs: () => [{ label: 'Banking', fn: async () => { await sayN('teller', pick(['Welcome to First Harbor. Deposits, withdrawals?', 'How can First Harbor help you today?'])); await bankSheet(); } }] };

  // =====================================================================
  // the casino: blackjack and slots
  // =====================================================================
  const SUITS = ['♠', '♥', '♦', '♣'], RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
  const val = hand => { let t = 0, a = 0; for (const c of hand) { const r = c.r; if (r === 'A') { a++; t += 11; } else if ('JQK'.includes(r) || r === '10') t += 10; else t += +r; } while (t > 21 && a) { t -= 10; a--; } return t; };
  const cardHTML = (c, hidden) => hidden ? '<span class="pcard back"></span>' : `<span class="pcard ${c.s === '♥' || c.s === '♦' ? 'red' : ''}"><b>${c.r}</b><i>${c.s}</i></span>`;
  function blackjack() {
    return new Promise(done => {
      const s = S();
      let deck = [], bet = 0, player = [], dealer = [], phase = 'bet', msg = 'Place your bet.';
      const shuffle = () => { deck = []; for (const su of SUITS) for (const r of RANKS) deck.push({ r, s: su }); for (let i = deck.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [deck[i], deck[j]] = [deck[j], deck[i]]; } };
      const draw = () => { if (deck.length < 10) shuffle(); return deck.pop(); };
      const g = shell(`<div class="bj"><h3>Blackjack</h3><div class="bjrow"><small>Dealer</small><div class="cards" id="bjD"></div><small id="bjDV"></small></div><div class="bjrow"><small>You</small><div class="cards" id="bjP"></div><small id="bjPV"></small></div><p id="bjMsg" class="bjmsg"></p><div class="bjbtns" id="bjB"></div></div>`);
      g.querySelector('.gbody').classList.add('wide');
      const $ = id => g.querySelector('#' + id);
      const render = () => {
        $('bjD').innerHTML = dealer.map((c, i) => cardHTML(c, phase === 'play' && i === 1)).join('');
        $('bjP').innerHTML = player.map(c => cardHTML(c)).join('');
        $('bjDV').textContent = dealer.length ? (phase === 'play' ? '?' : val(dealer)) : '';
        $('bjPV').textContent = player.length ? val(player) : '';
        $('bjMsg').textContent = msg;
        const B = $('bjB');
        if (phase === 'bet' || phase === 'done') {
          B.innerHTML = [10, 50, 100, 500].map(n => `<button type="button" class="btn small" data-bet="${n}" ${s.money < n ? 'disabled' : ''}>Bet ${fmt$(n)}</button>`).join('') + '<button type="button" class="btn small ghost" id="bjLeave">Leave table</button>';
          B.querySelectorAll('[data-bet]').forEach(b => tap(b, () => deal(+b.dataset.bet)));
          tap($('bjLeave'), () => { st.gameKey = null; end(); done(); });
        } else {
          B.innerHTML = `<button type="button" class="btn small" id="bjHit">Hit</button><button type="button" class="btn small" id="bjStand">Stand</button>${player.length === 2 && s.money >= bet ? '<button type="button" class="btn small ghost" id="bjDouble">Double</button>' : ''}`;
          tap($('bjHit'), hit); tap($('bjStand'), stand); const d = $('bjDouble'); if (d) tap(d, dbl);
        }
      };
      const deal = n => {
        if (s.money < n) return;
        bet = n; money(-n); player = [draw(), draw()]; dealer = [draw(), draw()]; phase = 'play'; msg = `Bet ${fmt$(bet)}. Hit or stand?`; SFX.play('paper');
        if (val(player) === 21) { phase = 'done'; const win = Math.round(bet * 2.5); money(win); msg = `Blackjack! You win ${fmt$(win - bet)}.`; SFX.play('win'); }
        render();
      };
      const hit = () => { player.push(draw()); SFX.play('paper'); if (val(player) > 21) { phase = 'done'; msg = `Bust. You lose ${fmt$(bet)}.`; SFX.play('bad'); } render(); };
      const dbl = () => { money(-bet); bet *= 2; player.push(draw()); SFX.play('paper'); if (val(player) > 21) { phase = 'done'; msg = `Bust on the double. You lose ${fmt$(bet)}.`; SFX.play('bad'); render(); } else stand(); };
      const stand = async () => {
        phase = 'reveal'; render();
        while (val(dealer) < 17) { await wait(450); dealer.push(draw()); SFX.play('paper'); render(); }
        const p = val(player), d = val(dealer);
        if (d > 21 || p > d) { money(bet * 2); msg = `You win ${fmt$(bet)}!`; SFX.play('cash'); }
        else if (p === d) { money(bet); msg = 'Push. Bet returned.'; }
        else { msg = `Dealer wins. You lose ${fmt$(bet)}.`; SFX.play('bad'); }
        phase = 'done'; render();
      };
      shuffle(); render();
      st.gameKey = () => { if (phase === 'play') stand(); };
    });
  }
  const SLOTSYM = ['7', '★', '♦', '◆', '$', '♣'];
  function slots() {
    return new Promise(done => {
      const s = S();
      const g = shell(`<div class="slots"><h3>Neon Sevens</h3><div class="reels"><span>7</span><span>7</span><span>7</span></div><p class="bjmsg" id="slMsg">$10 a pull. Three 7s pays 50×.</p><div class="bjbtns"><button type="button" class="btn" id="slPull">Pull ($10)</button><button type="button" class="btn ghost" id="slLeave">Leave</button></div></div>`);
      const reels = [...g.querySelectorAll('.reels span')], m = g.querySelector('#slMsg');
      let spinning = false;
      const pull = async () => {
        if (spinning) return; if (s.money < 10) { m.textContent = 'Not enough cash.'; return; }
        spinning = true; money(-10); SFX.play('vend');
        const res = [0, 1, 2].map(() => SLOTSYM[Math.floor(Math.random() ** 1.15 * SLOTSYM.length)]);
        for (let t = 0; t < 14; t++) { reels.forEach((r, i) => { if (t < 6 + i * 4) r.textContent = pick(SLOTSYM); else r.textContent = res[i]; }); SFX.play('tap'); await wait(70); }
        reels.forEach((r, i) => r.textContent = res[i]);
        let win = 0;
        if (res[0] === res[1] && res[1] === res[2]) win = res[0] === '7' ? 500 : res[0] === '$' ? 250 : res[0] === '★' ? 150 : 80;
        else if (res[0] === res[1] || res[1] === res[2]) win = 15;
        if (win) { money(win); m.textContent = `WIN ${fmt$(win)}!`; SFX.play(win >= 80 ? 'win' : 'coin'); } else m.textContent = 'Nothing. Again?';
        spinning = false;
      };
      tap(g.querySelector('#slPull'), pull); st.gameKey = pull;
      tap(g.querySelector('#slLeave'), () => { st.gameKey = null; end(); done(); });
    });
  }
  H.bjtable = { name: 'Blackjack Table', verbs: () => [{ label: 'Play blackjack', fn: async () => { await sayN('dealer', pick(['Minimum ten. Dealer stands on seventeen.', 'Take a seat. Feeling lucky?'])); await blackjack(); } }] };
  for (const id of ['slot1', 'slot2', 'slot3', 'slot4']) H[id] = { name: 'Slot Machine', verbs: () => [{ label: 'Play the slots', fn: () => slots() }] };
  H.casbar = { name: 'Casino Bar', verbs: () => [{ label: 'Buy a drink ($8)', fn: async () => { if (S().money < 8) return me('I can\'t even afford the garnish.'); money(-8); SFX.play('ice'); await narr(pick(['Something blue with an umbrella in it. It tastes like a bad decision.', 'A neat whiskey. The ice cube is shaped like a 7.'])); } }] };
  H.phbar = { name: 'Bar', verbs: () => [{ label: 'Pour a drink', fn: async () => { SFX.play('ice'); await narr('You pour two fingers of something old and look out at the city. Not bad for a motel kid.'); } }] };

  // =====================================================================
  // cafe, hot dogs, chess, the busker, fountains
  // =====================================================================
  H.cafe_counter = { name: 'Counter', verbs: () => [{ label: 'Order', fn: async () => {
    await sayN('barista', pick(['Hey! What can I get you?', 'Welcome to the Daily Grind. Oat milk is extra, sorry.']));
    const c = await choose(['Coffee ($4)', 'Coffee x5 ($18)', 'Nothing']);
    if (c === 0 || c === 1) { const n = c ? 5 : 1, p = c ? 18 : 4; if (S().money < p) return me('Short on cash.'); money(-p); SIM.give('coffee', n); await UI.itemGet('coffee', n); }
  } }] };
  H.hotdog = { name: 'Hot Dog Cart', verbs: () => [{ label: 'Buy a hot dog ($4)', fn: async () => { if (S().money < 4) return me('Can\'t afford a hot dog. That\'s a new low.'); money(-4); face('vendor'); await say('guest', pick(['One with everything!', 'Best dog in the city. Says so on the cart.']), { name: NAMES.vendor }); SIM.give('hotdog', 1); await UI.itemGet('hotdog', 1); } }] };
  H.chess = { name: 'Chess Table', verbs: () => [{ label: 'Play Old Man Ito ($10)', fn: async () => {
    const s = S(); if (s.money < 10) return me('Ito plays for money. I have none.');
    await sayN('ito', 'Ten dollars. Blitz. Don\'t touch a piece unless you mean it.');
    money(-10);
    const hits = await UI.timingGame({ title: 'Speed chess', sub: 'Tap when the needle hits your move.', rounds: 3, speed: 1.25, zone: 0.17 });
    if (hits >= 2) { money(25); s.stats.chess = (s.stats.chess || 0) + 1; await sayN('ito', hits === 3 ? 'Mate in eleven. I did not see it. Here, take your money, genius.' : 'Hm. Lucky. Again tomorrow.'); }
    else await sayN('ito', 'Checkmate. Thank you for the donation.');
  } }] };
  H.fountain = H.fountain2 = { name: 'Fountain', verbs: () => [{ label: 'Toss a coin ($1)', fn: async () => { if (S().money < 1) return me('Not even a coin.'); money(-1); SFX.play('splash'); S().flags.wished = S().day; await narr(pick(['Plink. You make a wish. Something about a neon sign that says FULL.', 'The coin lands next to a thousand others. Everybody wants something.'])); } }] };
  H.statue = { name: 'Statue', verbs: () => [{ label: 'Read the plaque', fn: () => narr('"Harold Vance, who built this city." Somebody added "...on top of everyone else" in marker.') }] };
  H.newsdt = H.news;

  // =====================================================================
  // the boutique: outfits
  // =====================================================================
  const OUTFITS = [
    { id: 'default', name: 'Street (your usual)', price: 0, look: {} },
    { id: 'suit', name: 'Sharp Suit', price: 450, look: { top: '#2c2c38', topStyle: 'suit', inner: '#e8e2d8', bottom: '#2c2c38', shoes: '#111', hat: null } },
    { id: 'whitesuit', name: 'White Suit', price: 900, look: { top: '#f2efe8', topStyle: 'suit', inner: '#c9a14a', bottom: '#f2efe8', shoes: '#c9a14a', hat: null, glasses: 'shades', acc: ['gold'] } },
    { id: 'leather', name: 'Leather Jacket', price: 280, look: { top: '#18181e', topStyle: 'jacket', inner: '#c8443c', bottom: '#2c2c34', shoes: '#111', hat: null } },
    { id: 'hoodie', name: 'Night Hoodie', price: 120, look: { top: '#3a2a5a', topStyle: 'hoodie', inner: '#3a2a5a', bottom: '#18181e', hat: 'hood', hatCol: '#3a2a5a' } },
    { id: 'hawaii', name: 'Ray\'s Hawaiian', price: 90, look: { top: '#e8733a', topStyle: 'hawaii', inner: '#e8733a', bottom: '#c8b890', hat: null, glasses: 'shadesUp' } },
    { id: 'parka', name: 'Harbor Parka', price: 160, look: { top: '#c8a83a', topStyle: 'parka', inner: '#2c2c38', bottom: '#2a3a5a', hat: 'beanie', hatCol: '#18181e' } },
    { id: 'neon', name: 'Neon Bomber', price: 600, look: { top: '#ff4fa3', topStyle: 'jacket', inner: '#3ff0ff', bottom: '#18181e', shoes: '#3ff0ff', hat: 'cap', hatCol: '#3ff0ff', acc: ['chain'] } },
  ];
  G.playerLook = () => Object.assign({}, CHARS.CAST.player, (OUTFITS.find(o => o.id === (S() && S().outfit)) || OUTFITS[0]).look);
  G.playerKey = () => 'player_' + ((S() && S().outfit) || 'default');
  function outfitSheet(shop) {
    return new Promise(done => {
      const s = S(); s.outfits = s.outfits || ['default'];
      const sh = document.getElementById('sheet');
      const draw = () => {
        sh.innerHTML = `<div class="sbody"><div class="shead"><h3>${shop ? 'Silk &amp; Steel' : 'Wardrobe'}</h3></div><p style="color:var(--dim);margin:0 0 8px">${shop ? 'Look the part. Some people only talk to you in the right clothes.' : 'Pick what to wear.'} Cash: ${fmt$(s.money)}</p>
          <div class="outfits">${OUTFITS.filter(o => shop || s.outfits.includes(o.id)).map(o => { const own = s.outfits.includes(o.id), on = (s.outfit || 'default') === o.id; return `<div class="card outfit ${on ? 'on' : ''}"><b>${esc(o.name)}</b><p>${own ? (on ? 'Wearing' : 'Owned') : fmt$(o.price)}</p><button type="button" class="btn small ${own ? 'ghost' : ''}" data-o="${o.id}" ${(!own && s.money < o.price) || on ? 'disabled' : ''}>${own ? (on ? 'On' : 'Wear') : 'Buy & wear'}</button></div>`; }).join('')}</div>
          <button type="button" class="btn ghost" id="ofDone" style="margin-top:10px">Done</button></div>`;
        sh.hidden = false; G.paused = true;
        sh.querySelectorAll('[data-o]').forEach(b => tap(b, () => { const o = OUTFITS.find(x => x.id === b.dataset.o); if (!s.outfits.includes(o.id)) { if (s.money < o.price) return; money(-o.price); s.outfits.push(o.id); SFX.play('cash'); s.rep = Math.min(5, s.rep + 0.05); } s.outfit = o.id; SFX.play('item'); draw(); }));
        tap(sh.querySelector('#ofDone'), () => { sh.hidden = true; G.paused = false; done(); });
      };
      draw();
    });
  }
  H.boutique_counter = { name: 'Counter', verbs: () => [{ label: 'Browse outfits', fn: async () => { await sayN('stylist', pick(['Darling. Let\'s do something about all of... this.', 'You have potential. Expensive potential.'])); await outfitSheet(true); } }] };
  H.wardrobe = { name: 'Wardrobe', verbs: () => [{ label: 'Change clothes', fn: () => outfitSheet(false) }] };

  // =====================================================================
  // Aurora Tower and the penthouse
  // =====================================================================
  H.concierge_desk = { name: 'Concierge', verbs: () => [{ label: 'Talk', fn: () => conciergeTalk() }] };
  async function conciergeTalk() {
    const s = S();
    if (s.flags.penthouse) return sayN('concierge', pick(['Welcome home. The elevator is ready for you.', 'Your mail is upstairs. Mostly invitations.']));
    await sayN('concierge', `Welcome to Aurora. The penthouse on the thirty-second floor is available. ${fmt$(PENTHOUSE_PRICE)}, furnished, hot tub, the whole skyline.`);
    const c = await choose([s.money + (s.bank || 0) >= PENTHOUSE_PRICE ? `Buy it (${fmt$(PENTHOUSE_PRICE)})` : `Buy it (need ${fmt$(PENTHOUSE_PRICE)})`, 'Can I see it first?', 'Maybe later']);
    if (c === 0) {
      if (s.money + (s.bank || 0) < PENTHOUSE_PRICE) return sayN('concierge', 'I\'m afraid the price is the price. Do come back.');
      let need = PENTHOUSE_PRICE; const fromCash = Math.min(s.money, need); s.money -= fromCash; need -= fromCash; s.bank = (s.bank || 0) - need; UI.refreshHud();
      s.flags.penthouse = true; s.rep = Math.min(5, s.rep + 0.5);
      SFX.play('win'); UI.banner('Penthouse', 'Aurora Tower · Floor 32');
      await sayN('concierge', 'Congratulations. The elevator on the left is yours now. Welcome to the top.');
      s.log.unshift({ day: s.day, text: 'Bought the Aurora penthouse' });
    } else if (c === 1) { s.flags.phTour = true; await sayN('concierge', 'Of course. Take the elevator on the left. Please don\'t touch the art.'); }
  }
  H.phlift = { name: 'Private Elevator', verbs: () => [{ label: S().flags.penthouse ? 'Up to the penthouse' : S().flags.phTour ? 'Tour the penthouse' : 'Call the elevator', fn: async () => {
    const s = S();
    if (!s.flags.penthouse && !s.flags.phTour) return narr('A keycard reader blinks red. Floor 32 is private. The concierge can help.');
    SFX.play('bell'); await G.travel('penthouse', 1.6, 9.8, 'right');
    if (!s.flags.penthouse) UI.toast('Touring. Buy it from the concierge downstairs.');
  } }] };
  H.phbed = { name: 'King Bed', verbs: () => [S().flags.penthouse ? { label: 'Sleep', fn: () => H.cot.verbs()[0].fn() } : { label: 'Look', fn: () => narr('Silk sheets. You could sleep for a week. If it were yours.') }] };
  H.phsafe = { name: 'Wall Safe', verbs: () => [S().flags.penthouse ? { label: 'Open the safe', fn: () => UI.openStash() } : { label: 'Look', fn: () => narr('A safe behind a painting. Very classy. Very locked.') }] };
  H.hottub = { name: 'Hot Tub', verbs: () => [{ label: 'Soak', fn: async () => { if (!S().flags.penthouse) return narr('Steaming. Inviting. Not yours. Yet.'); SFX.play('splash'); await UI.fade(1, 0.5); G.advanceClock(60); await UI.fade(0, 0.5); SIM.heat(-0.6); await narr('An hour in the hot tub, looking down at the city. The cops feel very far away. (Heat down)'); } }] };
  H.phpool = { name: 'Pool Table', verbs: () => [{ label: 'Shoot a rack', fn: async () => { const hits = await UI.timingGame({ title: 'Eight ball', sub: 'Line up the shot.', rounds: 3, speed: 1.0, zone: 0.2 }); await narr(hits >= 2 ? 'You run the table. Nobody saw it. Typical.' : 'You scratch on the eight. Good thing nobody saw that either.'); } }] };
  H.wardrobe && 0;

  // =====================================================================
  // getting around: bus, taxi, train
  // =====================================================================
  async function ride(label, cost, to, x, z, dir, sfx) {
    const s = S();
    if (s.money < cost) return me(`It's ${fmt$(cost)}. I don't have it.`);
    money(-cost); SFX.play(sfx || 'cardoor');
    await UI.fade(1, 0.4); G.advanceClock(20); await wait(300);
    G.loadMap(to, x, z, dir); await UI.fade(0, 0.5);
    UI.toast(label);
  }
  const busstop0 = H.busstop;
  H.busstop = { name: 'Bus Stop', verbs: () => [{ label: 'Ride the bus downtown ($2)', fn: () => ride('Downtown. Grand Ave & Main.', 2, 'downtown', 24.6, 12.6, 'down', 'busgo') }, ...busstop0.verbs()] };
  H.busstopdt = { name: 'Bus Stop', verbs: () => [{ label: 'Ride the bus to Lowtown ($2)', fn: () => ride('Lowtown. Sunset & Harbor.', 2, 'city', 24.4, 41.6, 'down', 'busgo') }] };
  H.taxilt = { name: 'Taxi Stand', verbs: () => [{ label: 'Cab to Downtown ($12)', fn: () => ride('The cab drops you at the Lucky 7.', 12, 'downtown', 33, 41, 'left') }] };
  H.taxidt = { name: 'Taxi Stand', verbs: () => [{ label: 'Cab to the Starlite ($12)', fn: () => ride('The cab drops you at the Starlite.', 12, 'city', 24.4, 44.8, 'up') }] };
  H.metrodt = { name: 'Grand Station', verbs: () => [{ label: 'Red Line to Sunset Station ($2)', fn: () => ride('Sunset Station, Lowtown.', 2, 'city', 11, 8.6, 'down', 'busgo') }] };

  // =====================================================================
  // conversations
  // =====================================================================
  const TALK = {
    concierge: () => conciergeTalk(),
    teller: async () => { await sayN('teller', 'Your money is safer with us than in a motel safe. Probably.'); await bankSheet(); },
    dealer: async () => { await sayN('dealer', 'Table\'s open.'); await blackjack(); },
    barista: () => H.cafe_counter.verbs()[0].fn(),
    stylist: () => H.boutique_counter.verbs()[0].fn(),
    vendor: () => H.hotdog.verbs()[0].fn(),
    ito: () => H.chess.verbs()[0].fn(),
    busker: async () => {
      const s = S();
      await sayN('busker', pick(['This one\'s for the night shift.', 'Requests are a dollar. Silence is five.']));
      const c = await choose(['Tip $2', 'Tip $20', 'Just listen']);
      if (c < 2) { const n = c ? 20 : 2; if (s.money < n) return me('I\'m tapped out.'); money(-n); s.karma = (s.karma || 0) + (c ? 2 : 1); SFX.music('jukebox'); G.musicOverride = 'jukebox'; setTimeout(() => { G.musicOverride = null; SFX.pickMusic(); }, 30000); await sayN('busker', c ? 'Whoa. Okay, this one\'s YOURS, friend.' : 'Appreciate you.'); }
    },
  };
  const talk0 = STORY.talk;
  STORY.talk = a => TALK[a.id] ? TALK[a.id](a) : talk0(a);
  const blocked0 = STORY.blocked;
  STORY.blocked = async ex => ex.to === 'college' ? me('A sign on the door: NIGHT CLASSES - ENROLLMENT OPENS SOON.') : blocked0(ex);

  // music downtown
  const pick0 = SFX.pickMusic;
  SFX.pickMusic = function () {
    if (!window.G || !G.map) return;
    if (G.musicOverride) return SFX.music(G.musicOverride);
    const id = G.mapId;
    if (id === 'casino') return SFX.music('jukebox');
    if (id === 'penthouse' || id === 'aurora' || id === 'bank' || id === 'boutique') return SFX.music('grand');
    if (id === 'cafe') return SFX.music('office');
    return pick0();
  };
})();
