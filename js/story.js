// Story: objectives, who stands where, every interaction and conversation.
(function () {
  const ST = {};
  const D = DATA, I = DATA.ITEMS;
  const S = () => G.S;
  const f = k => !!S().flags[k];
  const set = (k, v = true) => { S().flags[k] = v; };
  const has = (it, n = 1) => SIM.count(it) >= n;
  const say = (who, text, o) => UI.say(who, text, o);
  const me = (text, o) => UI.say('player', text, o);
  const narr = text => UI.say(null, text);
  const choose = opts => UI.choose(opts);
  const wait = ms => new Promise(r => setTimeout(r, ms));
  const money = n => SIM.money(n);
  async function give(it, n = 1, quiet) { SIM.give(it, n); if (!quiet) await UI.itemGet(it, n); UI.refreshHud(); }
  const take = (it, n = 1) => SIM.take(it, n);
  const hour = () => G.hour();
  const night = () => hour() >= 20 || hour() < 5;
  const msg = (from, text) => { S().msgs.unshift({ from, text, day: S().day, t: Math.floor(S().clock), unread: true }); UI.phoneBuzz(from); };
  ST.msg = msg;

  // ---------------- names & faces ----------------
  const NAMES = { player: () => S().name, dex: 'Dex', marlowe: 'Mr. Marlowe', sable: 'Sable', doc: 'Doc', gus: 'Gus', nina: 'Nina Park', reyes: 'Officer Reyes', holt: 'Captain Holt', vance: 'Celeste Vance', ray: 'Uncle Ray', kofi: 'Kofi', lou: 'Big Lou', raj: 'Raj', dina: 'Dina', mo: 'Mo', pruitt: 'Sgt. Pruitt', spider: 'Spider', chen: 'Mrs. Chen', cop: 'Officer' };
  ST.charName = id => { const n = NAMES[id]; return typeof n === 'function' ? n() : n || id; };
  const CASTLOOK = id => CHARS.CAST[id] || CHARS.CAST.player;

  // ---------------- lore ----------------
  ST.LORE = {
    letter: { title: "Ray's Letter", text: "Kid,\n\nIf you're reading this I had to disappear for a while. Don't come looking.\n\nThe Starlite is yours now. Spare office key is under the ice machine, same as always.\n\nPay Marlowe. He's a shark but he's an honest shark. Don't trust anybody in a white suit, and don't trust anybody with a badge who smiles too much.\n\nFeed the cat. His name is Neon.\n\n- Ray" },
    ledger: { title: 'The Ledger', text: "A cheap green ledger, Ray's handwriting.\n\nVANCE HOLDINGS -> \"C.H.\"\n  Mar 3   $10,000   (Rosie's Laundromat raided Mar 5. Sold Mar 20.)\n  Apr 11  $15,000   (Lin's Grocery raided Apr 12. Sold May 1.)\n  Jun 2   $25,000   (STARLITE - \"by end of summer\")\n\nC.H. = Captain Holt, 9th Precinct.\nPickups at the trailer, Thursdays.\n\nIf they get me: Warehouse 9. Ask the boat MARISOL." },
    news1: { title: 'The Lowtown Ledger', text: "VANCE TOWER BREAKS GROUND\n\"A new era for Lowtown,\" says developer Celeste Vance. Neighbours worry about rising rents.\n\nPOLICE STEP UP PATROLS\nCaptain Holt promises to \"clean up Sunset Boulevard, one business at a time.\"\n\nWEATHER: rain, rain, and then more rain." },
    news2: { title: 'The Lowtown Ledger', text: "MARKET WATCH\nStreet sources say {demand} is in demand this week.\n\nMOTEL ROW\nThe old Starlite has its lights back on. \"About time,\" says Dina of Dina's Diner. \"Ray's pancakes were terrible but his sign was beautiful.\"" },
    news3: { title: 'The Lowtown Ledger', text: "COP ON THE TAKE\nCaptain R. Holt of the 9th Precinct suspended after reporter Nina Park published ledgers showing $50,000 in payments from Vance Holdings.\n\nVANCE TOWER HALTED\nCity freezes all permits. Celeste Vance \"unavailable for comment.\"\n\nThe Starlite Motel: \"Vacancy. For now.\"" },
  };

  // ---------------- objectives ----------------
  ST.objective = function () {
    const s = S();
    if (!f('intro')) return null;
    if (!f('gotKey')) return { t: 'Find the spare office key', d: 'Ray says it is under the ice machine by the rooms.', hint: ['ice'] };
    if (!f('enteredOffice')) return { t: 'Get into the office', d: 'The office faces the boulevard.', hint: ['officedoor'] };
    if (!f('power')) {
      if (!has('fuse')) return { t: 'Buy a fuse at the 24/7 Mart', d: 'The main fuse is blown. The Mart is south on Sunset Blvd, past the crossroads.', hint: ['martreg', 'martIn'] };
      return { t: 'Fix the fuse box in the office', d: 'Bring the light back to the Starlite.', hint: ['fuse', 'officedoor'] };
    }
    if (!f('room1Clean')) return { t: 'Clean Room 1', d: 'Grab a cleaning kit from the office closet if you need one. Every guest needs a clean room.', hint: S().flags.curRoom === 0 && G.mapId === 'room' ? ['bed', 'trash1', 'trash2', 'stain', 'bath'] : ['room1'] };
    if (!f('firstGuest')) return { t: 'Check in your first guest', d: 'Wait at the front desk. Somebody always needs a bed on a night like this.', hint: ['desk', 'officedoor'] };
    if (!f('slept1')) return { t: 'Get some sleep', d: 'Ray kept a cot in the back of the office.', hint: ['cot', 'officedoor'] };
    if (!f('dexMet')) return { t: 'Someone is waiting outside', d: 'Check outside the office.', hint: ['dex', 'officedoor'] };
    if (!f('metSable')) return { t: 'Find Sable in the Underline', d: 'The old metro station on the plaza north of the motel.', hint: ['metro', 'sable'] };
    if (!f('paid1')) return { t: `Pay Marlowe $500 by Day 4`, d: `Marlowe holds court at Dina's Diner. You have $${s.money}. Rent rooms, fill guest requests, flip goods.`, hint: s.money >= 500 ? ['marlowe', 'dinerIn'] : ['desk'], money: 500 };
    if (!f('gotLockpick') && !f('room6Open')) return { t: 'Get a lockpick from Doc', d: 'Doc says Ray hid something in Room 6. It is padlocked.', hint: ['doc', 'metro'] };
    if (!f('room6Open')) return { t: 'Pick the lock on Room 6', d: 'Room 6 is the last door on the row.', hint: ['room6'] };
    if (!f('gotLedger')) return { t: 'Search Room 6', d: 'Ray hid something in there.', hint: ['roomstash', 'room6'] };
    if (!f('metKofi')) return { t: 'Find the boat MARISOL', d: 'Down at the docks, east on Harbor St. Kofi only comes in at night.', hint: ['kofi', 'boat'] };
    if (!f('warehouseOpen')) return { t: 'Bring Kofi a Fake ID', d: 'Doc in the Underline makes them.', hint: has('fakeid') ? ['kofi', 'boat'] : ['doc', 'metro'] };
    if (!f('foundRay')) return { t: 'Find Uncle Ray in Warehouse 9', d: 'Kofi gave you the key.', hint: ['warehouseIn', 'ray'] };
    if (!f('rayHome')) return { t: 'Talk to Uncle Ray', d: 'He is hiding in Warehouse 9.', hint: ['ray', 'warehouseIn'] };
    if (!f('paid2')) return { t: `Pay Marlowe $1,000 by Day 8`, d: `You have $${s.money}.`, hint: s.money >= 1000 ? ['marlowe', 'dinerIn'] : ['desk'], money: 1000 };
    if (!f('metNina')) return { t: 'Talk to Nina Park at the diner', d: 'Ray says she is the only reporter in town Holt can\'t buy.', hint: ['nina', 'dinerIn'] };
    if (!f('gotPhoto')) return { t: 'Find proof in Vance\'s trailer', d: 'The site trailer across the boulevard, through the gate. Pick the lock at night, when nobody is around.' + (has('lockpick') ? '' : ' You need a lockpick from Doc.'), hint: has('lockpick') || f('trailerOpen') ? ['files', 'trailer', 'trailerIn'] : ['doc', 'metro'] };
    if (!f('raidDone')) return { t: 'Something is wrong at the motel...', d: 'Get back to the Starlite.', hint: ['officedoor'] };
    if (!f('storyRun')) return { t: 'Bring the ledger and the photo to Nina', d: 'Dina\'s Diner. End this.', hint: ['nina', 'dinerIn'] };
    if (!f('paid3')) return { t: `Pay Marlowe's last $1,500`, d: `Then the Starlite is truly yours. You have $${s.money}.`, hint: s.money >= 1500 ? ['marlowe', 'dinerIn'] : ['desk'], money: 1500 };
    // sandbox goals
    const t = s.tier;
    if (t < 5) { const T = D.TIER[t + 1]; return { t: `Build the ${T.name}`, d: `$${T.cost.toLocaleString()} and ${T.rep}★ reputation. Open the plans board in the office.`, hint: ['plans', 'officedoor'], money: T.cost }; }
    if (!f('ending')) return { t: 'NO VACANCY', d: 'Fill the Grand to the top. Keep the rep high.', hint: [] };
    return { t: 'Lowtown is yours', d: 'Keep the lights on.', hint: [] };
  };
  ST.hints = () => { const o = ST.objective(); return o && o.hint ? o.hint : []; };

  // ---------------- who is where ----------------
  ST.npcs = function (map) {
    const s = S(), out = [], h = hour();
    const N = (id, x, z, dir, extra) => out.push(Object.assign({ id, name: ST.charName(id), look: CASTLOOK(id), lookKey: id, x, z, dir }, extra || {}));
    if (map === 'city') {
      if (f('dexArrives') && !f('dexMet')) N('dex', 24.2, 34.6, 'right', { pose: { cross: true } });
      if (f('dexSmash')) N('dex', 24.6, 32, 'right', { pose: { cross: true } });
      if (f('vanceHere') && !f('vanceMet')) N('vance', 24.4, 36.5, 'right');
      if (f('metKofi') || f('gotLedger')) { if (h >= 19 || h < 5) N('kofi', 50.2, 60.4, 'right'); }
      if (f('gotLedger') && !f('metKofi') && (h >= 19 || h < 5)) { /* kofi spawned above */ }
      if (f('rayHome') && h > 7 && h < 18 && !f('raidDone')) N('ray', 21.0, 34.5, 'right', { pose: { phone: true } });
    }
    if (map === 'metro') {
      N('sable', 10.5, 0.75, 'down');
      N('doc', 16.5, 0.75, 'down');
      N('spider', 21.8, 3.2, 'left', { look: CHARS.randomLook(77, 'shady'), lookKey: 'spider' });
      if ((s.day * 7) % 10 < 7) N('ped1', 7.0, 4.6, 'right', { name: 'Stranger', look: CHARS.randomLook(91, 'shady'), lookKey: 'm1', ghost: true, pose: { cross: true }, mute: true });
      if ((s.day * 3) % 10 < 7) N('ped2', 5.2, 3.8, 'right', { name: 'Stranger', look: CHARS.randomLook(92, 'ped'), lookKey: 'm2', ghost: true, mute: true });
    }
    if (map === 'pawn') N('gus', 5.4, 1.5, 'down');
    if (map === 'mart') N('raj', 2.6, 0.85, 'down', { look: CHARS.randomLook(15, 'ped'), lookKey: 'raj' });
    if (map === 'diner') {
      N('dina', 6.2, 0.9, 'down', { look: Object.assign(CHARS.randomLook(33, 'ped'), { topStyle: 'dress', top: '#e8a0b4', hairStyle: 'bun', hair: '#c8443c' }), lookKey: 'dina' });
      if (!f('paid3')) N('marlowe', 8.75, 7.0, 'left', { pose: { sit: true } });
      if (f('foundRay') || f('metNina')) N('nina', 8.75, 5.0, 'left', { pose: { sit: true } });
      if (s.day % 3 !== 1) N('d1', 5.2, 2.9, 'up', { name: 'Regular', look: CHARS.randomLook(55, 'trucker'), lookKey: 'd1', pose: { sit: true }, mute: true });
    }
    if (map === 'precinct') { N('pruitt', 5, 1.6, 'down', { look: Object.assign({}, CHARS.CAST.cop, { skin: CHARS.SKIN[1], hairStyle: 'balding', beard: '#6a4426' }), lookKey: 'pruitt' }); if (!f('holtDown')) N('holt', 7.6, 1.0, 'down'); }
    if (map === 'bar') {
      N('mo', 1.2, 3.4, 'right', { look: Object.assign(CHARS.randomLook(66, 'ped'), { top: '#18181e', topStyle: 'vest', inner: '#e8e2d8', hairStyle: 'bald', beard: '#222' }), lookKey: 'mo' });
      N('band', 7.4, 1.0, 'down', { name: 'Static', look: CHARS.randomLook(12, 'musician'), lookKey: 'band', mute: true, pose: { talk: true } });
      if (s.day % 4 !== 2) N('b1', 6.6, 4.0, 'left', { name: 'Patron', look: CHARS.randomLook(41, 'business'), lookKey: 'b1', mute: true, pose: { sit: true } });
    }
    if (map === 'laundry') N('chen', 6.2, 4.2, 'left', { look: Object.assign(CHARS.randomLook(8, 'ped'), { skin: CHARS.SKIN[0], hair: '#c8c4c0', hairStyle: 'bun', top: '#5aa6a0', topStyle: 'cardigan', glasses: 'round' }), lookKey: 'chen' });
    if (map === 'warehouse' && !f('rayHome')) N('ray', 10.8, 6.6, 'left');
    if (map === 'office' && f('rayHome') && !(h > 7 && h < 18)) N('ray', 4.0, 2.4, 'down');
    if (map === 'lobby' && f('rayHome')) N('ray', 6.0, 2.4, 'down');
    if (map === 'trailer' && f('vanceInside')) N('vance', 4.4, 0.7, 'down');
    return out;
  };
  ST.canTalk = a => !a.mute && a.kind !== 'ped';

  // ---------------- arriving on a map ----------------
  ST.onEnter = function (map) {
    SFX.ambience(map);
    if (map === 'office' && !f('enteredOffice')) { set('enteredOffice'); G.run(officeFirst); }
    if (map === 'metro' && !f('metroSeen')) { set('metroSeen'); G.run(async () => { await narr('Down the stairs, the old Line 2 platform hums with stolen electricity. Stalls, string lights, burning barrels. The Underline.'); }); }
    if (map === 'city' && f('slept1') && !f('dexArrives') && hour() >= 7) { set('dexArrives'); SIM.syncNpcs(true); setTimeout(() => G.run(dexIntro), 600); }
    if (map === 'room') roomEnter();
    if (map === 'warehouse' && !f('foundRay')) G.run(rayFound);
    if (map === 'city' && f('gotPhoto') && !f('raidDone') && !f('raidStarted')) { set('raidStarted'); setTimeout(() => G.run(bigRaid), 900); }
    if (map === 'city' && f('dexSmash')) { SIM.syncNpcs(true); setTimeout(() => G.run(dexSmash), 600); }
    if (map === 'city' && f('vanceHere') && !f('vanceMet')) { SIM.syncNpcs(true); setTimeout(() => G.run(vanceIntro), 700); }
  };
  ST.onNewDay = function () {
    const s = S();
    if (s.day === 3 && !f('vanceMet')) set('vanceHere');
    // debt deadlines
    for (const [i, d] of D.DEBT.entries()) {
      const k = 'paid' + (i + 1);
      if (!f(k) && s.day > d.day + (s.flags['ext' + i] || 0) && f('dexMet')) { set('dexSmash'); s.flags['ext' + i] = (s.flags['ext' + i] || 0) + 2; s.flags.lateFee = (s.flags.lateFee || 0) + 250; }
    }
    if (s.day === 2) msg('Unknown', 'Ray\'s friend here. If you need money fast, the old metro station on the plaza. Line 2. Ask for Sable. Delete this.');
    if (f('foundRay') && !f('metNina') && s.day >= 6) msg('Ray', 'Nina Park. Reporter. She eats at Dina\'s every day. She is the only one Holt can\'t buy.');
    UI.toast(`Day ${s.day}. ${s.weather === 'rain' ? 'Rain again.' : 'Clear skies.'}`);
  };
  ST.onMinute = function (m) {
    const s = S(), h = (m % 1440) / 60;
    // the scripted first guest
    if (f('room1Clean') && !f('firstGuestSpawned')) { set('firstGuestSpawned'); const g = SIM.newGuest('trucker', { name: 'Big Lou', story: 'lou', nights: 1 }); g.state = 'arriving'; g.arrive = SIM.abs() - 3; if (G.mapId === 'city') SIM.spawnGuestAgent(g, 'arrive'); }
  };
  ST.blocked = async function (ex) {
    if (ex.to === 'warehouse') return me('Locked. A heavy padlock. Somebody has a key.');
    if (ex.to === 'trailer') return me('The trailer is locked. I\'d need a lockpick, and nobody watching.');
    return me('Locked.');
  };

  // ---------------- interaction handlers ----------------
  const H = ST.H = {};
  ST.handler = (id, o) => {
    if (/^room\d+$/.test(id)) return roomHandler(+id.slice(4) - 1);
    return H[id] || null;
  };
  // ---- city ----
  H.ice = { name: 'Ice Machine', verbs: () => [
    !f('gotKey') ? { label: 'Look underneath', fn: async () => { SFX.play('search'); G.player.pose = { reach: true }; await wait(700); G.player.pose = {}; await give('roomkey', 1, true); take('roomkey'); set('gotKey'); await narr('A key on a star-shaped fob, taped under the machine. OFFICE, it says.'); await me('Same as always, huh Ray.'); UI.toast('The office is unlocked'); } } : null,
    { label: 'Get ice', fn: async () => { SFX.play('ice'); await narr(['The machine groans and drops exactly three cubes.', 'Ice. Cold. It works, which is more than most things here.'][Math.floor(Math.random() * 2)]); } },
  ].filter(Boolean) };
  H.officedoor = { name: () => S().tier >= 4 ? 'Hotel Entrance' : 'Office', verbs: () => [{ label: 'Go inside', fn: async () => { if (!f('gotKey')) return me('Locked. Ray said the spare key is under the ice machine.'); G.travel(S().tier >= 4 ? 'lobby' : 'office', null, null, null); } }] };
  H.sign = { name: 'Starlite Sign', verbs: () => [{ label: 'Look up', fn: async () => { await narr(f('power') ? (S().tier >= 3 ? 'The sign buzzes proudly. Moths dance in the pink light.' : 'STAR_LITE MOTEL. Two letters still dead. VACANCY glows red in the rain.') : 'Dead neon. A star with no light in it.'); } }] };
  H.pool = { name: 'Pool', verbs: () => [S().tier === 1 && !f('poolFixed') ? { label: 'Refill ($300)', fn: async () => { if (S().money < 300) return me('$300 to fill it. Not today.'); money(-300); set('poolFixed'); G.refresh('pool'); SFX.play('splash'); await narr('A truck comes, a hose runs for an hour, and suddenly the Starlite has a pool. Guests will like this.'); S().rep = Math.min(5, S().rep + 0.2); } } : { label: 'Sit by the pool', fn: async () => { await narr(S().tier === 1 && !f('poolFixed') ? 'An empty pool full of leaves and somebody\'s old shopping cart. Romantic.' : 'The water glows. For a minute the city is quiet.'); } }] };
  H.vend = { name: 'Vending Machine', verbs: () => [{ label: 'Buy a soda ($2)', fn: async () => { if (S().money < 2) return me('Two bucks. I don\'t have two bucks.'); money(-2); SFX.play('vend'); await narr(Math.random() < 0.15 ? 'The machine eats your money, thinks about it, then drops TWO sodas. Lucky.' : 'Clunk. A can of Neon Cola. It tastes like a battery.'); } }, { label: 'Shake it', fn: async () => { G.shake(0.2); SFX.play('stomp'); if (!f('vendShook') && Math.random() < 0.5) { set('vendShook'); money(5); await narr('Five crumpled dollars fall out of the coin return.'); } else await narr('Nothing. A guest across the lot watches you judgmentally.'); } }] };
  H.dumpster = { name: 'Dumpster', verbs: () => [{ label: 'Search it', fn: async () => {
    SFX.play('search'); G.player.pose = { reach: true }; await wait(900); G.player.pose = {};
    const k = 'dump' + S().day;
    if (f(k)) return narr('Just trash now. Real trash. You checked.');
    set(k);
    const r = Math.random();
    if (r < 0.3) { await narr('A pair of sneakers still in the box. They are... bootlegs. Somebody panicked.'); await give('kicks'); }
    else if (r < 0.55) { await narr('A cleaning kit, barely used. Score.'); await give('cleaner'); }
    else if (r < 0.7) { money(8); await narr('An envelope with $8 and a note: "for the cat."'); }
    else await narr('Pizza boxes, a broken umbrella, and a raccoon who does not want to talk about it.');
  } }] };
  H.busstop = { name: 'Bus Stop', verbs: () => [{ label: 'Read the schedule', fn: async () => { await narr('ROUTE 9 - SUNSET BLVD. Every 20 minutes. Someone has written "LIES" under it in marker.'); } }] };
  H.news = { name: 'Newspaper Box', verbs: () => [{ label: 'Buy a paper ($1)', fn: async () => {
    if (S().money < 1) return me('One dollar. I am that broke.');
    money(-1); SFX.play('paper');
    const p = f('storyRun') ? ST.LORE.news3 : S().day <= 2 ? ST.LORE.news1 : { title: ST.LORE.news2.title, text: ST.LORE.news2.text.replace('{demand}', I[S().flags.hotDemand] ? I[S().flags.hotDemand].name.toLowerCase() : 'everything') };
    await UI.readPage(p);
  } }] };
  H.phone = { name: 'Payphone', verbs: () => [{ label: 'Call someone (25c)', fn: async () => { SFX.play('dial'); await wait(900); await narr(['A recorded voice: "The number you have dialed is... disappointed in you."', 'Dial tone. Then, very faintly, someone breathing. You hang up.', 'You call your own phone. It rings in your pocket. Neat.'][Math.floor(Math.random() * 3)]); } }] };
  H.metro = { name: 'Metro (Line 2)', verbs: () => [{ label: 'Go down', fn: async () => G.travel('metro', 4.5, 2.6, 'down') }] };
  H.tower = { name: 'Vance Tower (site)', verbs: () => [{ label: 'Look', fn: async () => { await narr(f('vanceStopped') ? 'A frozen skeleton of concrete. The crane hasn\'t moved since the story ran.' : `Floor after floor of raw concrete. VANCE TOWER - LUXURY LIVING. It grows a little every day.`); } }] };
  H.trailer = { name: 'Site Trailer', verbs: () => [{ label: f('trailerOpen') ? 'Go inside' : 'Pick the lock', fn: async () => {
    if (f('trailerOpen')) return G.travel('trailer', 2.5, 3.4, 'up');
    if (!f('metNina')) return me('Vance Holdings. I have no business in there. Yet.');
    if (!has('lockpick')) return me('Locked. I need a lockpick.');
    if (!night()) return me('Too many workers around. I should come back at night.');
    const ok = await UI.lockGame(4);
    if (!ok) { SIM.heat(0.5, 'Noise at the trailer'); return me('Dammit. Too loud. I should try again.'); }
    set('trailerOpen'); SFX.play('unlock'); G.travel('trailer', 2.5, 3.4, 'up');
  } }] };
  H.hoop = { name: 'Basketball Hoop', verbs: () => [{ label: 'Shoot hoops', fn: async () => { const hits = await UI.timingGame({ title: 'Free throws', sub: 'Tap when the marker hits the sweet spot.', rounds: 3, speed: 1.3, zone: 0.16 }); await narr(hits === 3 ? 'Three for three. Somebody on a balcony claps.' : hits ? `${hits} for 3. Not bad, not great.` : 'Air ball, air ball, air ball. The hoop is laughing at you.'); } }] };
  H.boat = { name: 'Boat: MARISOL', verbs: () => [{ label: 'Look', fn: async () => { await narr(night() ? 'The MARISOL rocks at the pier, a green lamp burning on her mast.' : 'The MARISOL, tied up and dark. Her captain must work nights.'); } }] };
  H.pcar1 = { name: 'Police Cruiser', verbs: () => [{ label: 'Look', fn: async () => narr('A 9th Precinct cruiser. There\'s a box of donuts on the dash and a "CLEAN UP SUNSET" bumper sticker.') }] };

  // ---- rooms (doors) ----
  function roomHandler(k) {
    const r = S().rooms[k];
    const door = { name: () => `Room ${k + 1}` + (r.state === 'broken' ? ' (wrecked)' : r.state === 'dirty' ? ' (dirty)' : r.state === 'occupied' ? (r.request ? ' (request!)' : ' (occupied)') : ' (clean)') };
    door.verbs = () => {
      const v = [];
      if (k === 5 && !f('room6Open')) return [{ label: has('lockpick') ? 'Pick the padlock' : 'Padlocked', fn: async () => {
        if (!f('paid1')) return me('Padlocked. Ray\'s padlock. Whatever is in there, he didn\'t want it found.');
        if (!has('lockpick')) return me('A heavy padlock. Doc said he sells picks.');
        const ok = await UI.lockGame(3);
        if (!ok) return me('The pick slipped. Again.');
        set('room6Open'); SFX.play('unlock'); await narr('Click. The padlock drops into a puddle.'); enterRoom(k);
      } }];
      if (r.state === 'occupied') {
        v.push({ label: r.request ? 'Answer the request' : 'Knock', fn: () => knock(k) });
        return v;
      }
      v.push({ label: r.state === 'broken' ? 'Go in (wrecked)' : r.state === 'dirty' ? 'Go in and clean' : 'Go in', fn: async () => enterRoom(k) });
      return v;
    };
    return door;
  }
  async function enterRoom(k) {
    S().flags.curRoom = k;
    await G.travel('room', 3.5, 5.6, 'up');
  }
  function roomEnter() {
    const k = S().flags.curRoom, r = S().rooms[k];
    UI.banner(`Room ${k + 1}`, r.state === 'broken' ? 'Wrecked' : r.state === 'dirty' ? 'Needs cleaning' : r.state === 'clean' ? 'Ready for a guest' : '');
    if (r.state === 'broken' && !f('toldRepair')) { set('toldRepair'); setTimeout(() => G.run(async () => { await me('Holes in the wall, wires hanging out... I need a toolkit for this. Gus at the Lucky Pawn sells them.'); }), 600); }
  }
  async function knock(k) {
    const r = S().rooms[k], g = SIM.guestInRoom(k);
    SFX.play('knock'); G.player.pose = { knock: true }; await wait(700); G.player.pose = {};
    if (!g) return narr('No answer.');
    const who = g.story === 'lou' ? 'lou' : 'guest';
    UI.setGuestFace(g);
    if (!g.request) return say('guest', pick(['Yeah? Oh, it\'s the manager. Everything\'s fine, thanks.', 'We\'re good! The ice machine is iconic, by the way.', 'Do you know the wifi password? There is no wifi? Huh.', 'Is it always this loud out there? Love it.']), { name: g.name });
    const it = g.request.item, pay = g.request.pay;
    await say('guest', requestLine(g, it, pay), { name: g.name });
    const opts = [has(it) ? `Hand it over (+$${pay})` : `I don't have any ${I[it].name.toLowerCase()}`, 'Not that kind of motel.'];
    const c = await choose(opts);
    if (c === 0 && has(it)) {
      take(it);
      if (g.narc) return narcBust(g);
      money(pay); g.requestDone = true; g.request = null; r.request = null; g.happy = Math.min(1, g.happy + 0.2);
      S().stats.deals++;
      SFX.play('cash');
      if (I[it].hot) SIM.heat(0.15);
      await say('guest', pick(['Pleasure doing business.', 'You\'re a lifesaver. Five stars.', 'This stays between us, yeah?']), { name: g.name });
      G.refresh('room' + (k + 1));
    } else if (c === 1) {
      g.request = null; r.request = null; g.requestFailed = !g.narc;
      if (g.narc) { await say('guest', 'Heh. Right. Of course. Just... testing. Have a good night, "manager".', { name: g.name }); SIM.heat(-0.5); UI.toast('That guest looked a lot like a cop...'); }
      else await say('guest', 'Your loss.', { name: g.name });
      G.refresh('room' + (k + 1));
    } else await say('guest', 'Well, if you find some, you know where I am.', { name: g.name });
  }
  const pick = a => a[Math.floor(Math.random() * a.length)];
  function requestLine(g, it, pay) {
    const n = I[it].name.toLowerCase();
    if (g.narc) return pick([`So, uh, buddy. I'm a regular normal tourist. Where would a regular guy get ${n}? I'll pay $${pay}. Cash. Totally normal.`, `Hey pal. Me and the boys - I mean, my wife - need ${n}. $${pay}. No questions. I definitely won't ask questions.`]);
    if (g.type === 'trucker') return `Long haul tomorrow. You got any ${n}? I'll pay $${pay}, no tax man needs to know.`;
    if (g.type === 'shady') return `Word is you can get things. I need ${n}. $${pay}. Tonight.`;
    if (g.type === 'business') return `Listen, I'm in a bind. I need ${n} for a meeting. $${pay}? Discretion appreciated.`;
    if (g.type === 'celeb') return `Darling. I need ${n}. Money is no object. Well. $${pay} is the object.`;
    return `Hey! Any chance you can find us ${n}? We'll pay $${pay}!`;
  }
  async function narcBust(g) {
    SFX.play('siren'); G.shake(0.4);
    await say('guest', 'And THAT is a sale. Lowtown PD, you\'re under - eh. You know what, fine. Paperwork.', { name: g.name });
    await narr('He flashes a badge. Your heart does a backflip.');
    const fine = Math.min(S().money, 150 + Math.round(S().heat * 60));
    money(-fine); SIM.heat(1.5, 'Sold to an undercover cop');
    const lost = [];
    for (const k of Object.keys(S().inv)) if (I[k] && I[k].hot && !I[k].tool) { lost.push(k); delete S().inv[k]; }
    await narr(`He takes $${fine} "for the fine" and ${lost.length ? 'everything hot in your pockets' : 'a long look at you'}. He checks out early.`);
    g.state = 'gone'; const r = S().rooms[g.room]; r.guest = null; r.request = null; SIM.setRoom(g.room, 'dirty');
    UI.toast('Tip: narcs overpay and have shiny shoes.');
  }

  // ---- inside a room ----
  const TASK_TEXT = { bed: 'Make the bed', trash1: 'Empty the trash', trash2: 'Pick up the junk', stain: 'Scrub the stain', bath: 'Scrub the bathroom', hole: 'Patch the hole', wiring: 'Fix the wiring' };
  for (const id of ['bed', 'trash1', 'trash2', 'stain', 'bath', 'hole', 'wiring']) H[id] = {
    name: () => ({ bed: 'Bed', trash1: 'Trash', trash2: 'Junk', stain: 'Stain', bath: 'Bathroom', hole: 'Hole in the wall', wiring: 'Loose wiring' })[id],
    visible: () => { const r = curRoom(); return r && r.tasks && r.tasks[id]; },
    verbs: () => [{ label: TASK_TEXT[id], fn: () => doTask(id) }],
  };
  const curRoom = () => G.mapId === 'room' ? S().rooms[S().flags.curRoom] : null;
  async function doTask(id) {
    const r = curRoom(); if (!r || !r.tasks[id]) return;
    const repair = id === 'hole' || id === 'wiring';
    if (repair && !has('toolkit')) return me('I need a toolkit for this. The Lucky Pawn sells them.');
    if (!repair && !has('cleaner')) return me('I\'m out of cleaning kits. The 24/7 Mart has them.');
    if (!repair && (r.tasks.hole || r.tasks.wiring)) return me('No point cleaning until the wall and the wiring are fixed.');
    const ok = await UI.scrubGame(TASK_TEXT[id], repair ? 'tool' : 'scrub', id);
    if (!ok) return;
    r.tasks[id] = 0;
    G.refresh(id); G.refresh('bed'); G.refresh('bath');
    const e = G.scene.byId[id]; if (e) G.burst(e.o.x, 0.6, e.o.z, 16, repair ? [1, 0.85, 0.4, 1] : [0.8, 0.95, 1, 1], { speed: 1.6 });
    if (repair && !r.tasks.hole && !r.tasks.wiring && r.state === 'broken') { take('toolkit'); r.state = 'dirty'; SFX.play('fixed'); UI.toast(`Room ${S().flags.curRoom + 1} repaired. Now clean it.`); }
    if (SIM.roomTasksLeft(r) === 0) {
      take('cleaner'); r.state = 'clean'; r.linens = has('linens'); if (r.linens) take('linens');
      SFX.play('sparkle');
      UI.toast(`Room ${S().flags.curRoom + 1} is spotless.${r.linens ? ' Fresh linens on the bed.' : ''}`, 'good');
      if (S().flags.curRoom === 0 && !f('room1Clean')) { set('room1Clean'); await wait(400); await me('Not bad. Smells like bleach instead of regret. Now I need a guest.'); }
      if (S().rooms.slice(0, 6).every(x => x.state !== 'broken') && !f('allRepaired')) { set('allRepaired'); msg('Ray', f('foundRay') ? 'All six rooms fixed? Kid, you\'re better at this than me.' : 'Somebody fixed up the whole Starlite. Ray would be proud. - A friend'); }
    }
    UI.refreshHud();
  }
  H.tv = { name: 'TV', visible: () => true, verbs: () => [{ label: 'Watch', fn: async () => narr(pick(['Channel 6: "...police say the crackdown on Sunset Boulevard will continue..."', 'A late-night ad for knives that can cut a shoe. Who needs that.', 'Static. Then a cooking show. Then static.'])) }] };
  H.roomstash = { name: 'Loose Floorboard', visible: () => G.mapId === 'room' && S().flags.curRoom === 5, verbs: () => [{ label: 'Pry it up', fn: async () => {
    if (f('gotLedger')) return narr('Empty now. Just dust and a dead spider.');
    SFX.play('search'); G.player.pose = { reach: true }; await wait(900); G.player.pose = {};
    await narr('Under the floorboard: a tin box. Inside, $300 in twenties, and a green ledger.');
    money(300); await give('ledger'); set('gotLedger');
    await UI.readPage(ST.LORE.ledger);
    await me('Vance pays "C.H." and then the cops raid the place. Then Vance buys it. And the Starlite was next.');
    await me('Warehouse 9. The MARISOL. Ray, what did you get into?');
  } }] };

  // ---- office / lobby ----
  H.desk = { name: 'Front Desk', verbs: () => {
    const w = SIM.waiting();
    const v = [];
    if (w.length) v.push({ label: `Check in ${w[0].name}`, fn: () => checkInFlow(w[0]) });
    v.push({ label: 'Guest book', fn: async () => UI.openPhone('hotel') });
    return v;
  } };
  H.bell = { name: 'Bell', verbs: () => [{ label: 'Ring it', fn: async () => { SFX.play('bell'); await narr(SIM.waiting().length ? 'Ding! The guest jumps.' : 'Ding! Nobody comes. You are the somebody who comes.'); } }] };
  H.register = { name: () => G.mapId === 'mart' ? 'Register' : 'Cash Register', verbs: () => G.mapId === 'mart' ? [{ label: 'Shop', fn: async () => UI.openShop('raj') }] : [{ label: 'Count the till', fn: async () => narr(`$${S().money} in the till. Earned so far: $${S().stats.earned}.`) }] };
  H.keys = { name: 'Key Rack', verbs: () => [{ label: 'Check the rooms', fn: async () => UI.openPhone('hotel') }] };
  H.plans = { name: 'Plans Board', verbs: () => [{ label: 'Upgrades & staff', fn: async () => UI.openUpgrades() }] };
  H.safe = { name: 'Safe', verbs: () => [{ label: 'Open the safe', fn: async () => UI.openStash() }] };
  H.cot = { name: 'Cot', verbs: () => [{ label: 'Sleep until morning', fn: () => sleep() }] };
  H.fuse = { name: 'Fuse Box', verbs: () => [{ label: f('power') ? 'Check it' : 'Replace the fuse', fn: async () => {
    if (f('power')) return narr('Humming along. Mostly.');
    if (!has('fuse')) { await narr('The main fuse is black and cracked. It smells like a campfire.'); return me('I need a new fuse. The 24/7 Mart should have one.'); }
    take('fuse'); SFX.play('clunk'); G.shake(0.3); await wait(500);
    set('power');
    SFX.play('powerup');
    G.refreshAll();
    await narr('CLUNK. The fluorescent tubes stutter, buzz... and light. Outside, the Starlite sign flickers awake.');
    await me('There she is.');
    await narr('In the back closet: two cleaning kits and a note in Ray\'s hand. "Room 1 first. Always room 1 first."');
    await give('cleaner', 2);
  } }] };

  async function checkInFlow(g) {
    const T = D.GUESTS[g.type];
    UI.setGuestFace(g);
    const lines = g.story === 'lou' ? ['Evening! Big Lou. I drive for Sunrise Freight. You got a room for one night? The Starlite was always my spot.'] :
      g.narc ? [pick(['Hi. Room please. I\'m a tourist. From... out of town. Nice motel. Do you, uh, sell anything... special?', 'Evening, pal. Room for the night. I\'m just a regular salesman. Of sales.'])] :
        g.vip ? ['Darling, the penthouse. Discretion is everything.'] :
          [pick([`Hi! One room, ${g.nights} night${g.nights > 1 ? 's' : ''}?`, `You got a room? ${g.nights} night${g.nights > 1 ? 's' : ''}. I'm beat.`, `Evening. I need a bed and a door that locks. ${g.nights} night${g.nights > 1 ? 's' : ''}.`])];
    await say('guest', lines[0], { name: g.name });
    if (!SIM.vacancy()) {
      await me('Sorry, we\'re full tonight. No clean rooms.');
      SIM.turnAway(g); SIM.removeGuestAgent(g); return;
    }
    const rate = SIM.rate();
    const opts = [`Check in (${g.nights} × $${rate})`, 'Sorry, we\'re full.'];
    if (g.narc && f('narcHint')) opts.push('Ask about their shoes');
    const c = await choose(opts);
    if (c === 1) { SIM.turnAway(g); SIM.removeGuestAgent(g); await say('guest', 'Seriously? Fine.', { name: g.name }); return; }
    if (c === 2) { await say('guest', 'My shoes? They\'re... regular shoes. Department issue. I mean department STORE. Good night.', { name: g.name }); SIM.turnAway(g); SIM.removeGuestAgent(g); SIM.heat(-0.3); return; }
    const k = SIM.checkIn(g);
    SFX.play('cash');
    await say('guest', k >= 0 ? `Room ${k + 1}. Perfect.` : 'Perfect.', { name: g.name });
    SIM.guestToRoom(g);
    if (g.story === 'lou') {
      set('firstGuest'); set('openForBusiness');
      await wait(300);
      await say('guest', 'Hey, one more thing. Ray used to keep smokes behind the desk. No tax stamp, if you catch my drift. You got any?', { name: 'Big Lou' });
      await me('I just got here, Lou. I don\'t even have soap.');
      await say('guest', 'Heh. Ray got his from the Underline. Old metro on the plaza. Ask around. Night, kid.', { name: 'Big Lou' });
      UI.toast('The Starlite is open for business! Guests will start arriving.', 'good');
      if (!f('slept1')) msg('Tip', 'Guests arrive afternoon to midnight. Keep rooms clean, check guests in at the desk, and answer requests (yellow light over the door).');
    }
  }
  async function sleep() {
    const h = hour();
    if (h >= 7 && h < 19 && f('slept1')) { const c = await choose(['Nap until evening', 'Never mind']); if (c) return; await UI.fade(1, 0.6); skipTo(19 * 60); await UI.fade(0, 0.6); return; }
    await UI.fade(1, 0.8);
    UI.dreamCard(`Day ${S().day} → Day ${S().day + (h >= 7 ? 1 : 0)}`);
    // fast-forward to 07:00
    skipTo(7 * 60);
    set('slept1');
    G.player.x = G.map.spawn.x; G.player.z = G.map.spawn.z - 1.5;
    await wait(1200);
    await UI.fade(0, 0.8);
    UI.closeDream();
    const s = S();
    await narr(`Morning. ${s.weather === 'rain' ? 'Rain on the roof.' : 'Sun through the blinds.'} You have $${s.money}.`);
  }
  function skipTo(minuteOfDay) {
    const s = S();
    let now = s.clock;
    let add = minuteOfDay - now; if (add <= 0) add += 1440;
    G.advanceClock(add);
    SIM.update(0.001);
    G.envSnap = true;
  }
  ST.skipTo = skipTo;

  // ---- other interiors ----
  H.counter = { name: () => G.mapId === 'pawn' ? 'Display Case' : 'Counter', verbs: () => G.mapId === 'pawn' ? [{ label: 'Buy', fn: async () => UI.openShop('gusShop') }, { label: 'Sell goods', fn: async () => UI.openSell('gus') }] : [{ label: 'Order coffee ($3)', fn: async () => { if (S().money < 3) return me('Three bucks I don\'t have.'); money(-3); await give('coffee', 1, true); await narr('Dina slides a mug across. "On the house next time, sugar. Probably."'); } }] };
  H.martreg = { name: 'Register', verbs: () => [{ label: 'Shop', fn: async () => {
    if (!f('power') && !has('fuse') && S().money < I.fuse.price) { await say('raj', 'A fuse? For the Starlite? You\'re Ray\'s kid. Take it. Pay me when the sign is on.', { name: 'Raj' }); return give('fuse'); }
    return UI.openShop('raj');
  } }] };
  H.martdesk = H.martreg;
  H.lotto = { name: 'Lotto Scratchers', verbs: () => [{ label: 'Buy a scratcher ($5)', fn: async () => { if (S().money < 5) return me('Five dollars to lose five dollars. Can\'t afford it.'); money(-5); const prize = await UI.scratchGame(); if (prize) money(prize); } }] };
  H.jukebox = { name: 'Jukebox', verbs: () => [{ label: 'Play a song (25c)', fn: async () => { SFX.play('coin'); SFX.music('jukebox'); await narr('The jukebox picks a song for you. It is a good song.'); } }] };
  H.booth1 = H.booth2 = H.booth3 = null;
  H.train = { name: 'Abandoned Train', verbs: () => [{ label: 'Look inside', fn: async () => narr('Seats ripped out. Someone sleeps in the third car every night. A sign says DO NOT DISTURB in three languages and one drawing.') }] };
  H.fire = { name: 'Barrel Fire', verbs: () => [{ label: 'Warm your hands', fn: async () => narr(pick(['Warm. Smells like burning magazines.', 'A man by the fire says the Underline used to be a real station. "Then the city forgot it. We didn\'t."'])) }] };
  H.alleyfire = H.fire;
  H.frontdesk = { name: 'Front Desk', verbs: () => [{ label: 'Pay off your heat', fn: async () => {
    const s = S();
    if (s.heat < 0.5) return say('pruitt', 'Your record is clean. Suspiciously clean. Move along.');
    const cost = Math.round(s.heat * 120);
    await say('pruitt', `"Administrative fees." $${cost} and some of your... file goes missing. Cash only.`);
    const c = await choose([`Pay $${cost}`, 'No thanks']);
    if (c) return;
    if (s.money < cost) return me('I don\'t have that.');
    money(-cost); s.heat = Math.max(0, s.heat - 2); UI.refreshHud(); SFX.play('cash');
    await say('pruitt', 'Pleasure. This conversation never happened.');
  } }] };
  H.wanted = { name: 'Wanted Board', verbs: () => [{ label: 'Read', fn: async () => narr(S().heat >= 3 ? 'There\'s a blurry photo of you pinned on it. "PERSON OF INTEREST." Not ideal.' : 'Mugshots, a lost dog, and a flyer: "SUNSET BLVD CLEAN-UP - CPT. HOLT".') }] };
  H.captain = { name: 'Captain\'s Office', verbs: () => [{ label: 'Knock', fn: async () => narr(f('holtDown') ? 'The nameplate has been unscrewed. Somebody left the plant to die.' : '"BUSY," shouts a voice. It sounds like a man who has never been told no.') }] };
  H.washer = { name: 'Washing Machines', verbs: () => [{ label: 'Wash linens ($6)', fn: async () => { if (S().money < 6) return me('Six bucks. Nope.'); money(-6); SFX.play('washer'); await wait(600); await give('linens', 1); } }] };
  H.change = { name: 'Change Machine', verbs: () => [{ label: 'Look', fn: async () => narr('It changes dollars into quarters. It does not change your life.') }] };
  H.bartender = null;
  H.pooltable = { name: 'Pool Table', verbs: () => [{ label: 'Play a rack ($10)', fn: async () => { if (S().money < 10) return me('Ten to play. No.'); money(-10); const hits = await UI.timingGame({ title: 'Eight ball', sub: 'Line up the shot.', rounds: 3, speed: 1.0, zone: 0.18 }); if (hits >= 2) { money(25); await narr('You sink the eight. The guy in the hat pays up, grumbling. +$25.'); } else await narr('Scratch on the eight. The guy in the hat buys himself a drink with your ten.'); } }] };
  H.raycot = null;
  H.raydesk = { name: 'Ray\'s Desk', verbs: () => [{ label: 'Look', fn: async () => narr('Maps of Lowtown with red circles. Every circle is a business Vance bought after a raid. The Starlite has three circles.') }] };
  H.vancedesk = { name: 'Vance\'s Desk', verbs: () => [{ label: 'Search', fn: async () => {
    if (f('gotBlueprint')) return narr('Nothing else here but expensive pens.');
    set('gotBlueprint'); SFX.play('search'); await wait(700);
    await narr('A blueprint: "VANCE STARLITE CASINO & RESIDENCES". Your motel, bulldozed into a parking ramp. A sticky note: "Holt - raid by Friday."');
  } }] };
  H.files = { name: 'Filing Cabinet', verbs: () => [{ label: 'Search', fn: async () => {
    if (f('gotPhoto')) return narr('Invoices. Lawyers. Nothing you don\'t already have.');
    SFX.play('search'); G.player.pose = { reach: true }; await wait(900); G.player.pose = {};
    await narr('Behind the hanging folders, an envelope of Polaroids. Celeste Vance handing Captain Holt a fat envelope, right outside this trailer.');
    await give('photo'); set('gotPhoto'); SIM.heat(1, 'Broke into Vance\'s trailer');
    await me('Got you.');
    await narr('Headlights sweep across the window. You should go. Now.');
  } }] };

  // ---------------- conversations ----------------
  ST.talk = async function (a) {
    const id = a.id;
    if (a.kind === 'guest') return guestTalk(a);
    if (a.kind === 'cop') return copTalk(a);
    const fn = TALK[id];
    if (fn) return fn(a);
    return narr(`${a.name || 'They'} doesn't want to talk.`);
  };
  async function guestTalk(a) {
    const g = a.guest;
    UI.setGuestFace(g);
    if (g.state === 'waiting') return checkInFlow(g);
    if (g.state === 'arriving') return say('guest', 'Just looking for the office. Thanks!', { name: g.name });
    if (g.request) { a.pose = {}; return say('guest', `Hey, still need that ${I[g.request.item].name.toLowerCase()}. I'm in room ${g.room + 1}.`, { name: g.name }); }
    return say('guest', pick(['Nice night for it.', 'Your sign is gorgeous. Like, unreasonably.', 'Is the pool... supposed to have a cart in it?', 'I\'m just out here for some air. And some neon.']), { name: g.name });
  }
  async function copTalk(a) {
    if (a.id === 'reyes') {
      if (S().heat >= 3) return say('reyes', 'I hear things about you. I don\'t like what I hear. Be careful.');
      return say('reyes', pick(['Evening. Keep your head down and your receipts handy.', 'Holt\'s got everyone on overtime. Somebody upstairs wants Sunset "clean". Whatever that means.', 'Your uncle was a good guy. Messy, but good.']));
    }
    return say('cop', pick(['Move along.', 'Got somewhere to be?', 'Nice night to stay out of trouble.']), { name: 'Officer' });
  }
  const TALK = {};
  TALK.dex = async () => {
    if (!f('dexMet')) return dexIntro();
    if (f('dexSmash')) return say('dex', 'You heard the man. Pay up, or I come back with the bat again.');
    return say('dex', 'Diner. Marlowe\'s booth. Don\'t make me come find you.');
  };
  TALK.marlowe = async () => {
    const s = S();
    const i = !f('paid1') ? 0 : !f('paid2') ? 1 : !f('paid3') ? 2 : -1;
    if (i < 0) return say('marlowe', 'Your account is closed, kid. Coffee\'s still on me.');
    if (!f('dexMet')) return say('marlowe', 'Do I know you? Sit somewhere else, I\'m expecting company.');
    const due = D.DEBT[i].amount + (s.flags.lateFee || 0);
    await say('marlowe', i === 0 ? `Ray's kid. Sit. Ray owes me three thousand. First piece is $${due}.` : `Back again. Next piece: $${due}.`);
    const c = await choose([`Pay $${due}`, 'Not yet.']);
    if (c) return say('marlowe', `Day ${D.DEBT[i].day + (s.flags['ext' + i] || 0)}. Don't be late. Dex hates being late. It makes him sad, and sad makes him swing.`);
    if (s.money < due) return say('marlowe', 'You\'re short. Come back when you can count.');
    money(-due); s.flags.lateFee = 0; s.debt -= D.DEBT[i].amount;
    set('paid' + (i + 1)); SFX.play('cash'); UI.refreshHud();
    if (i === 0) {
      await say('marlowe', 'On time. Ray never managed that. Maybe you\'re the smart one.');
      await say('marlowe', 'A word of advice, free of charge: Celeste Vance has been asking about your little motel. People who say no to Vance tend to get visits from the police.');
      msg('Doc', 'Sable says you\'re good for business. Ray hid something in Room 6, he told me once. Padlocked. I sell picks. Underline, my table.');
      set('docHint');
    } else if (i === 1) {
      await say('marlowe', 'Two down. You know, kid, I didn\'t think you\'d last a week.');
    } else {
      await say('marlowe', 'And that, as they say, is that. The Starlite is yours, free and clear.');
      await say('marlowe', 'Ray called me last night, by the way. He says thank you. And the cat says thank you.');
      UI.chapterCard('THE STARLITE IS YOURS', 'Now make it the best hotel in the city.');
    }
  };
  TALK.sable = async () => {
    if (!f('metSable')) {
      set('metSable');
      await say('sable', 'Well, well. Ray\'s kid. You\'ve got his eyes. Let\'s hope you\'ve got better luck.');
      await say('sable', 'Here\'s how it works down here. I sell things that fell off trucks. Smokes, shine, kicks, phones, watches. Prices move every day.');
      await say('sable', 'Your guests will ask for things. Knock on their door when the light\'s on - they pay double, triple. Gus at the Lucky Pawn buys the shiny stuff. Mo at the Blue Note buys smokes and shine.');
      await say('sable', 'And the cops. Carrying hot goods past a cop makes them curious. Curious cops search you. Keep your stock in the office safe, not in your pockets.');
      await say('sable', 'One more thing: guests who overpay and wear shiny shoes are narcs. Don\'t sell to them.');
      set('narcHint');
      await say('sable', 'Ray left a tab. Take these, on the house. Welcome to the Underline.');
      await give('smokes', 2);
      msg('Sable', 'Prices change daily. My "deal of the day" is always marked. Don\'t get greedy. - S');
    }
    const c = await choose(['Show me what you\'ve got', 'Any news?', 'Later']);
    if (c === 0) return UI.openShop('sable');
    if (c === 1) {
      const tip = S().flags.tipItem, dem = S().flags.hotDemand;
      return say('sable', `Today ${I[tip].name.toLowerCase()} is cheap - bulk shipment. And everybody upstairs is asking for ${I[dem].name.toLowerCase()}. Do the math.`);
    }
  };
  TALK.doc = async () => {
    if (!f('metDoc')) { set('metDoc'); await say('doc', 'Doc. Not a real doctor. I make IDs, picks, gadgets. Cash only, no refunds, no names.'); }
    if (f('docHint') && !f('gotLockpick') && !has('lockpick')) await say('doc', 'For Ray\'s room, you\'ll want a pick set. Sixty bucks.');
    const c = await choose(['Browse gadgets', 'Later']);
    if (c === 0) { await UI.openShop('doc'); if (has('lockpick')) set('gotLockpick'); }
  };
  TALK.spider = async () => {
    await say('spider', pick([
      'Spider. I hear everything down here. Today? Cops are thick on Harbor St. Take the alley.',
      'Kofi on the MARISOL brings in the real treasures. Jade, paintings. Only at night, only cash.',
      'The Collector? Old guy, eats pie at Dina\'s on weekends. Pays crazy money for art. Or so they say.',
      'Pruitt at the precinct takes "administrative fees". Your heat gets lighter, your wallet too.',
      `Word is ${I[S().flags.hotDemand].name.toLowerCase()} is what everybody wants this week.`,
    ]), { name: 'Spider' });
  };
  TALK.gus = async () => {
    if (!f('metGus')) { set('metGus'); await say('gus', 'Lucky Pawn. Fifty years. I buy, I sell, I don\'t ask. Your uncle owed me twenty bucks, by the way. Forget it. He fixed my sign once.'); }
    const c = await choose(['Sell goods', 'Buy tools', 'Later']);
    if (c === 0) return UI.openSell('gus');
    if (c === 1) return UI.openShop('gusShop');
  };
  TALK.raj = async () => { const c = await choose(['Shop', 'How\'s business?']); if (c === 0) return UI.openShop('raj'); return say('raj', pick(['Business? Same as always. Coffee, cigarettes, lottery dreams.', 'Your uncle bought a fuse every week. That motel eats fuses.', 'Captain Holt came in yesterday. Didn\'t pay for his donuts. Again.']), { name: 'Raj' }); };
  TALK.dina = async () => { const c = await choose(['Coffee ($3)', 'What\'s new?']); if (c === 0) return H.counter.verbs()[0].fn(); return say('dina', pick(['Marlowe\'s in the back. He tips well and nobody asks why.', 'Nina Park? Best reporter this town ever had. Drinks her coffee black, like her stories.', 'Pie of the day is cherry. Pie of every day is cherry.']), { name: 'Dina' }); };
  TALK.mo = async () => {
    const c = await choose(['Sell smokes & shine', 'Any rumors?', 'Later']);
    if (c === 0) return UI.openSell('mo');
    if (c === 1) return say('mo', pick(['Holt drinks here off-duty. Never pays. Never smiles. Real charmer.', 'The Collector comes in sometimes. Asks if anybody\'s got "something old and beautiful". I tell him I\'m married.', 'Vance had a party upstairs last week. Champagne. Cops. Same cops who raid places. Funny.']), { name: 'Mo' });
  };
  TALK.chen = async () => { await say('chen', pick(['Linens? Six dollars a wash. Your guests will sleep like babies.', 'Your uncle brought me his sheets every Tuesday. Then one day, no more Tuesday.', 'I had a laundromat across the street. Then the police came. Then Vance came.']), { name: 'Mrs. Chen' }); if (S().flags.curRoom != null && !f('chenHint')) { set('chenHint'); await say('chen', 'Fresh linens make guests happier. Happier guests tip.', { name: 'Mrs. Chen' }); } };
  TALK.pruitt = async () => H.frontdesk.verbs()[0].fn();
  TALK.holt = async () => {
    if (!f('metHolt')) { set('metHolt'); await say('holt', 'So you\'re the new owner of the Starlite. Sunset Boulevard is changing, son. The smart ones change with it. The others... well.'); return; }
    return say('holt', 'Don\'t you have a motel to lose?');
  };
  TALK.kofi = async () => {
    if (!f('metKofi')) {
      if (!f('gotLedger')) { set('metKofiEarly'); return say('kofi', 'Kofi. I bring things in by boat. Crates, curiosities. Come back when you have money and manners.', { name: 'Kofi' }); }
      set('metKofi');
      await say('kofi', 'You have Ray\'s face and Ray\'s ledger. I can see it in your jacket. Put it away, the harbor has eyes.', { name: 'Kofi' });
      await say('kofi', 'Ray is safe. Warehouse 9. I have the key. But the harbor master checks my papers every week, and my papers are... imaginative.', { name: 'Kofi' });
      await say('kofi', 'Bring me a Fake ID - Doc makes good ones - and the key is yours.', { name: 'Kofi' });
      return;
    }
    if (!f('warehouseOpen') && has('fakeid')) {
      take('fakeid'); set('warehouseOpen');
      await say('kofi', 'Ah. "Kofi Mensah-Delacroix, licensed marine pilot". Beautiful. Here, the key. Go see your uncle.', { name: 'Kofi' });
      SFX.play('keys'); UI.toast('Warehouse 9 is unlocked');
      return;
    }
    const c = await choose(['See the goods', 'Later']);
    if (c === 0) return UI.openShop('kofi');
  };
  TALK.ray = async () => {
    if (G.mapId === 'warehouse' && !f('rayHome')) {
      const c = await choose(['Come home, Ray.', 'Tell me about Holt again.']);
      if (c === 1) return say('ray', 'Holt raids, Vance buys. They tried it on me. I ran. The ledger is the only thing that can stop them.');
      set('rayHome'); set('rayClerk'); S().staff.clerk = true;
      await say('ray', 'Home. Heh. Alright. I\'ll work the night desk, nobody looks twice at a night clerk. You do the rest.');
      return G.travel('city', 23.8, 34.2, 'right');
    }
    if (!f('metNina')) return say('ray', 'Nina Park. Dina\'s Diner. Go.');
    return say('ray', pick(['You run this place better than I ever did. Don\'t tell anyone I said that.', 'Neon ate my sandwich again. That cat is a criminal.', 'I\'ve got the desk. Go make money.']));
  };
  TALK.nina = async () => {
    if (!f('foundRay')) return say('nina', 'Sorry, I\'m on deadline.');
    if (!f('metNina')) {
      set('metNina');
      await say('nina', 'You\'re Ray\'s nephew - niece - kid. He called me. Show me.');
      await narr('You slide the ledger across the table. She reads it twice, very slowly.');
      await say('nina', 'This is real. It\'s also just handwriting. Holt\'s lawyers will say Ray made it up.');
      await say('nina', 'I need something they can\'t argue with. A photo of the two of them together. Vance keeps everything in that trailer on her site. Everything.');
      await say('nina', 'Be careful. If Holt figures out you have this, he\'ll come for you before I can print a word.');
      return;
    }
    if (f('gotPhoto') && f('raidDone') && !f('storyRun')) {
      await narr('You lay the ledger and the photo on the table. Nina doesn\'t say anything for a long time.');
      await say('nina', 'Front page. Tomorrow morning. They won\'t know what hit them.');
      take('ledger'); take('photo');
      set('storyRun'); set('holtDown'); set('vanceStopped'); set('noRaids');
      S().heat = 0; UI.refreshHud();
      await UI.fade(1, 1);
      ST.skipTo(8 * 60);
      await UI.readPage(ST.LORE.news3);
      await UI.fade(0, 1);
      msg('Nina', 'Holt is suspended. Vance\'s permits are frozen. You did this. Coffee\'s on me forever.');
      msg('Ray', 'Kid. I watched the news three times. Pay off Marlowe and the Starlite is ours. Yours.');
      return;
    }
    if (f('gotPhoto') && !f('raidDone')) return say('nina', 'You have it? Then why are you HERE? Go check on your motel - Holt has eyes everywhere.');
    return say('nina', 'The trailer. Vance\'s site. Find me a photo, a receipt, anything with both their names.');
  };
  TALK.vance = async () => { if (!f('vanceMet')) return vanceIntro(); return say('vance', 'My offer stands. It won\'t stand forever.'); };

  // ---------------- cutscenes ----------------
  ST.intro = async function () {
    set('intro');
    G.camOverride = { x: 25, z: 38, y: 0.5 };
    UI.chapterCard('NO VACANCY', 'Lowtown. Night. Rain.');
    await wait(2600);
    // the bus pulls away
    const bus = { kind: 'bus', x: 27.3, z: 40, yaw: 0 };
    G.extraDraws.push(() => ({ mesh: G.cached('bus', mb => mb.merge(CITY.bus())), model: GL3.M4.trs(bus.x, 0.01, bus.z, 0) }));
    G.extraLights.push(() => ({ x: bus.x, y: 0.8, z: bus.z + 3, r: 5, c: [1, 0.9, 0.7], i: 1 }));
    SFX.play('busgo');
    for (let i = 0; i < 70; i++) { bus.z += 0.08 + i * 0.006; await wait(30); }
    G.extraDraws = []; G.extraLights = [];
    await narr('The last bus of the night leaves you at a crooked bus stop on Sunset Boulevard.');
    await narr('Across the lot, a dead neon star. The Starlite Motel. Uncle Ray\'s motel. Your motel, apparently.');
    G.camOverride = null;
    await give('letter', 1, true);
    await UI.readPage(ST.LORE.letter);
    await me('Under the ice machine. Okay, Ray. Okay.');
    UI.toast('Tap to walk, or drag anywhere to steer. Tap things to use them.');
  };
  async function officeFirst() {
    await narr('Dark. Dusty. The smell of old coffee and cigarettes. A cot in the back, a safe, a fuse box with a scorch mark.');
    await me('Home sweet home, I guess.');
  }
  async function dexIntro() {
    SIM.syncNpcs(true);
    const a = G.agent('dex'); if (!a || f('dexMet')) return;
    G.camOverride = { x: 23.5, z: 35, y: 0.5 };
    await wait(600);
    await say('dex', 'You the new owner? I\'m Dex. I work for Mr. Marlowe.');
    await say('dex', 'Your uncle borrowed three grand to keep this dump alive. Then he skipped town. Debts don\'t skip town.');
    await say('dex', '$500 by Day 4. Then a thousand by Day 8. Then fifteen hundred by Day 12. You pay Marlowe in person, Dina\'s Diner, back booth.');
    const c = await choose(['I\'ll get you the money.', 'And if I don\'t?']);
    if (c === 1) { await say('dex', 'Then I come back with a bat, and one of your rooms gets real ugly.'); }
    else await say('dex', 'Smart. Real smart.');
    set('dexMet');
    G.camOverride = null;
    await G.walkAgent(a, 25.6, 50);
    G.removeAgent(a);
    msg('Marlowe', `Day 4: $500. Day 8: $1,000. Day 12: $1,500. Dina's Diner. - M`);
  }
  async function dexSmash() {
    SIM.syncNpcs(true);
    const a = G.agent('dex');
    if (!a) return;
    S().flags.dexSmash = false;
    const k = S().rooms.findIndex((r, i) => i < 6 && r.state !== 'broken' && r.state !== 'occupied');
    G.camOverride = { x: a.x, z: a.z, y: 0.5 };
    await say('dex', 'You\'re late. Mr. Marlowe added a late fee. And I added... this.');
    if (k >= 0) {
      const d = MOTEL.roomDoor(k, S().tier);
      await G.walkAgent(a, d.x + 0.5, d.z + 0.8);
      for (let i = 0; i < 3; i++) { SFX.play('smash'); G.shake(0.5); G.burst(d.x, 1, d.z + 0.3, 20, [0.9, 0.9, 1, 1], { speed: 2.5 }); await wait(350); }
      S().rooms[k].state = 'broken'; S().rooms[k].tasks = SIM.dirtyTasks(); S().rooms[k].tasks.hole = 1; S().rooms[k].tasks.wiring = 1;
      G.refresh('room' + (k + 1));
      await say('dex', `Room ${k + 1} needs some work now. Two more days. Then it's two rooms.`);
    }
    G.camOverride = null;
    await G.walkAgent(a, 25.6, 52); G.removeAgent(a);
  }
  async function vanceIntro() {
    SIM.syncNpcs(true);
    const a = G.agent('vance'); if (!a || f('vanceMet')) return;
    set('vanceMet'); set('vanceHere', false);
    G.camOverride = { x: 24, z: 36.5, y: 0.5 };
    const limo = { x: 27.3, z: 36.5 };
    G.extraDraws.push(() => ({ mesh: G.carMesh('limo', '#f2efe8'), model: GL3.M4.trs(limo.x, 0.01, limo.z, 0) }));
    await wait(500);
    await say('vance', 'You must be the new owner. Celeste Vance, Vance Holdings. I\'m building across the street. You\'ve noticed, I\'m sure.');
    await say('vance', 'I\'ll be direct. This lot is perfect for my parking structure. Twenty thousand dollars, cash, today. You walk away rich.');
    const c = await choose(['Not for sale.', 'Twenty thousand? For Ray\'s motel?', 'I\'ll think about it.']);
    if (c === 0) await say('vance', 'Everything is for sale. The only question is how you sell. The easy way, or the expensive way.');
    else if (c === 1) await say('vance', 'Ray had his chance. He chose the expensive way. Look where he is now. Nowhere.');
    else await say('vance', 'Think quickly. My friends at the 9th Precinct are very interested in motels with... reputations.');
    await say('vance', 'Have a lovely evening.');
    await G.walkAgent(a, 26.6, 36.5);
    G.removeAgent(a); G.extraDraws = [];
    SFX.play('cardoor');
    G.camOverride = null;
    msg('Unknown', 'Don\'t take her money. She\'ll take everything else too. - a friend');
  }
  async function rayFound() {
    const a = G.agent('ray');
    await wait(300);
    set('foundRay');
    await narr('Crates. A cot. A camping lamp. And a tired man in a loud shirt, holding a crowbar.');
    await say('ray', 'Who\'s - KID? What are you doing here? I told you not to come looking!');
    await me('You also told me to feed a cat you didn\'t mention was a menace. Hi, Ray.');
    await say('ray', 'Heh. He likes you then.');
    await say('ray', 'Listen. Vance wants the Starlite for her casino. When I said no, Holt raided us and "found" a kilo of something in Room 6 that I never saw in my life. I ran before they could book me.');
    await say('ray', 'The ledger is everything I could prove. Payments to Holt, then raids, then Vance buys. Every time.');
    await say('ray', 'Give it to Nina Park. Reporter. Dina\'s Diner. She\'s the only one in this town Holt can\'t buy.');
    msg('Ray', 'Burner phone. Text me if you need me. Don\'t call. - R');
  }
  async function bigRaid() {
    set('raidDone');
    G.player.path = null;
    const s = S();
    G.camOverride = { x: 22, z: 36, y: 0.5 };
    SFX.play('siren'); SIM.heat(2, 'Raid on the Starlite');
    const holt = G.addAgent({ id: 'holt', kind: 'npc', scripted: true, name: 'Captain Holt', look: CHARS.CAST.holt, lookKey: 'holt', x: 25.8, z: 30, dir: 'down' });
    const c1 = G.addAgent({ id: 'raidcop1', kind: 'npc', scripted: true, name: 'Officer', look: CHARS.CAST.cop, lookKey: 'cop', x: 25.8, z: 28.8, mute: true });
    const c2 = G.addAgent({ id: 'raidcop2', kind: 'npc', scripted: true, name: 'Officer', look: CHARS.CAST.cop, lookKey: 'cop', x: 26.6, z: 29.5, mute: true });
    G.extraLights.push(() => ({ x: 27.5, y: 1.5, z: 30, r: 9, c: Math.sin(G.t * 12) > 0 ? [1, 0.15, 0.2] : [0.2, 0.35, 1], i: 2 }));
    G.extraDraws.push(() => ({ mesh: G.carMesh('police', '#e8e2d8'), model: GL3.M4.trs(27.3, 0.01, 30, 0) }));
    G.walkAgent(c1, 21.5, 37.5); G.walkAgent(c2, 23.5, 33.2);
    await G.walkAgent(holt, G.player.x + 0.9, G.player.z + 0.6);
    G.faceTo(holt, G.player.x, G.player.z);
    await say('holt', 'Well. If it isn\'t the new owner. Anonymous tip says this motel is a den of contraband. Shocking, I know.');
    const hot = Object.keys(s.inv).filter(k => I[k] && I[k].hot);
    if (hot.length) {
      await narr('An officer pats you down. Everything hot in your pockets goes into an evidence bag.');
      for (const k of hot) delete s.inv[k];
      const fine = Math.min(s.money, 400); money(-fine);
      await say('holt', `And a $${fine} fine. I'm feeling generous.`);
    } else await say('holt', 'Clean pockets. Smart. Your safe, however...');
    await say('holt', 'Here\'s the thing, kid. I know Ray left you something. A little green book. You give it to me, this all goes away.');
    const c = await choose(['What book?', 'Hand over the ledger']);
    if (c === 1) {
      await narr('Your hand moves to your jacket... and stops. Ray. Mrs. Chen. Lin\'s Grocery. Every red circle on Ray\'s map.');
      await me('...On second thought. What book?');
    } else await me('What book?');
    await say('holt', 'Have it your way. We\'ll be watching. Every night. Every guest. Every room.');
    G.walkAgent(c1, 25.8, 29); G.walkAgent(c2, 26.5, 29.5); await G.walkAgent(holt, 26, 30);
    G.removeAgent(holt); G.removeAgent(c1); G.removeAgent(c2); G.extraLights = []; G.extraDraws = [];
    G.camOverride = null;
    msg('Nina', 'I heard sirens on Sunset. Tell me you\'re okay. Tell me you still have it. Come to the diner.');
  }
  ST.raid = async function () {
    const s = S();
    if (G.mapId !== 'city' && G.mapId !== 'office' && G.mapId !== 'lobby') { // raid while you're away
      const lost = Object.keys(s.inv).filter(k => I[k] && I[k].hot);
      msg('Ray', s.staff.guard ? 'Cops came sniffing. The guard kept them at the door. We\'re fine.' : 'Cops raided the office while you were out. They didn\'t find the safe. Lay low, kid.');
      return;
    }
    if (s.staff.guard) { UI.toast('Your guard turned away a police "inspection".'); return; }
    SFX.play('siren'); G.shake(0.3);
    await narr('Red and blue light floods the lot. A late-night "inspection". Two officers search the office and pat you down.');
    const lost = Object.keys(s.inv).filter(k => I[k] && I[k].hot && !I[k].tool);
    for (const k of lost) delete s.inv[k];
    const fine = Math.min(s.money, 100 + Math.round(s.heat * 40));
    money(-fine); s.heat = Math.max(0, s.heat - 1.5);
    await narr(lost.length ? `They take everything hot you were carrying and a $${fine} "fine". The safe stays shut - they didn't have a warrant for it.` : `Your pockets are clean. They still write you a $${fine} ticket for "neon pollution".`);
    UI.refreshHud();
  };
  ST.stopAndSearch = async function (cop) {
    const s = S();
    G.player.path = null;
    G.faceTo(cop, G.player.x, G.player.z); G.faceTo(G.player, cop.x, cop.z);
    SFX.play('whistle');
    const name = cop.id === 'reyes' ? 'reyes' : 'cop';
    if (cop.id === 'reyes' && !f('metReyes')) set('metReyes');
    await say(name, cop.id === 'reyes' ? 'Hey. Hold up. Your pockets are... lumpy. Mind if I take a look?' : 'Hold it right there. Hands where I can see them. Random search.', { name: cop.name });
    const bribe = 60 + Math.round(s.heat * 30);
    const c = await choose(['Comply', 'Run for it!', `Slip them $${bribe}`]);
    if (c === 0) {
      G.player.pose = { hands: true }; await wait(700); G.player.pose = {};
      const lost = Object.keys(s.inv).filter(k => I[k] && I[k].hot && !I[k].tool);
      for (const k of lost) delete s.inv[k];
      const fine = Math.min(s.money, 50 + Math.round(s.heat * 25));
      money(-fine); SIM.heat(0.5, 'Searched by police');
      await say(name, `Well, well. Confiscated. And a $${fine} fine. Get out of here.`, { name: cop.name });
    } else if (c === 1) {
      const p = G.player;
      const ok = await UI.escapeGame();
      if (ok) { SIM.heat(1.0, 'Ran from police'); UI.toast('You lost them in the alleys!', 'good'); }
      else {
        const lost = Object.keys(s.inv).filter(k => I[k] && I[k].hot && !I[k].tool); for (const k of lost) delete s.inv[k];
        const fine = Math.min(s.money, 120 + Math.round(s.heat * 40)); money(-fine); SIM.heat(1.5, 'Caught running');
        await say(name, `Nice try. Everything goes in the bag. $${fine} fine, and I\'ll remember your face.`, { name: cop.name });
      }
    } else {
      if (s.money < bribe) return say(name, 'With what money? Turn out your pockets.', { name: cop.name }).then(() => ST.stopAndSearch(cop));
      if (cop.id === 'reyes' || Math.random() < 0.18) {
        await say(name, cop.id === 'reyes' ? 'Are you trying to bribe me? I\'m going to pretend I didn\'t see that. Go home.' : 'Bribing an officer? That\'s cute. Double fine.', { name: cop.name });
        if (cop.id !== 'reyes') { money(-Math.min(s.money, bribe * 2)); SIM.heat(1, 'Bribery attempt'); }
      } else { money(-bribe); SIM.heat(0.2); await say(name, 'I didn\'t see anything. Move along.', { name: cop.name }); }
    }
  };
  ST.petCat = async function () {
    SFX.play('purr');
    if (!f('fedCat')) { set('fedCat'); await narr('A black cat with yellow eyes. His collar tag says NEON. He headbutts your shin like he has been waiting for you.'); return; }
    await narr(pick(['Neon purrs like a broken engine.', 'Neon looks at you, then at the pool, then at you. He wants you to know he knows.', 'Neon rolls over. It is a trap. You fall for it anyway.']));
  };
  ST.ending = async function () {
    set('ending');
    G.camOverride = { x: 13, z: 20, y: 6 };
    await narr('Every window of the Starlite Grand is lit. The VACANCY sign flickers... and switches.');
    await UI.chapterCard('NO VACANCY', `The Starlite Grand is full. ${S().name}, Lowtown is yours.`);
    G.camOverride = null;
  };

  window.STORY = ST;
})();
