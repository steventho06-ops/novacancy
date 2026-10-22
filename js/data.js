// Game data: items, contraband, vendors, buyers, upgrades, staff, guests.
(function () {
  // icon: [shape, colour] drawn as tiny pixel art in the UI (see ui.js iconSVG)
  const ITEMS = {
    // legit
    cleaner: { name: 'Cleaning Kit', desc: 'Bleach, rags and a sponge. One kit cleans one room.', price: 8, icon: ['bottle', '#5ad8ff'] },
    linens: { name: 'Fresh Linens', desc: 'Crisp sheets for a turned-over room. Guests notice.', price: 12, icon: ['cloth', '#f2efe8'] },
    toolkit: { name: 'Toolkit', desc: 'Hammer, plaster, wire nuts. Fixes one wrecked room.', price: 60, icon: ['tool', '#c8443c'] },
    fuse: { name: 'Fuse', desc: 'A chunky 30-amp fuse. Old buildings eat these.', price: 15, icon: ['fuse', '#e8c13c'] },
    coffee: { name: 'Coffee', desc: 'Gas-station coffee. Tastes like a dare.', price: 3, icon: ['cup', '#8a5a36'], use: 'coffee' },
    // contraband (hot = police care about it)
    smokes: { name: 'Untaxed Smokes', desc: 'A carton with no tax stamp. Truckers love these.', hot: 1, base: 18, icon: ['box', '#e8e2d8'] },
    shine: { name: 'Moonshine', desc: 'Clear as water, kicks like a mule. Mason jar.', hot: 1, base: 22, icon: ['jar', '#bfe8ff'] },
    kicks: { name: 'Bootleg Kicks', desc: '"Air Jordache" high-tops. The swoosh is backwards.', hot: 1, base: 45, icon: ['shoe', '#e8e2d8'] },
    perfume: { name: 'Knockoff Perfume', desc: '"Chanelle No. 6". Smells almost right.', hot: 1, base: 28, icon: ['bottle', '#ff7ac0'] },
    carts: { name: 'Bootleg Carts', desc: 'A stack of pirated game cartridges. 999-in-1.', hot: 1, base: 15, icon: ['cart', '#5a5a64'] },
    phone: { name: 'Hot Phone', desc: 'Fell off a truck. Several trucks, apparently.', hot: 1, base: 70, icon: ['phone', '#18181e'] },
    watch: { name: 'Hot Watch', desc: 'A "Rollo" Submariner. Heavy, shiny, very warm.', hot: 2, base: 120, icon: ['watch', '#d9aa3a'] },
    fakeid: { name: 'Fake ID', desc: 'Good enough for a bouncer. Not for a cop.', hot: 2, base: 90, icon: ['card', '#7ab8ff'] },
    fireworks: { name: 'Illegal Fireworks', desc: 'Mortars from across the border. Do not shake.', hot: 2, base: 35, icon: ['rocket', '#ff4fa3'] },
    jade: { name: 'Jade Idol', desc: 'Ancient, priceless, and very much stolen.', hot: 3, base: 600, icon: ['idol', '#59ff8a'], rare: true },
    painting: { name: 'Stolen Painting', desc: 'Rolled canvas. Small, blue, worth a fortune.', hot: 3, base: 900, icon: ['frame', '#4f7bff'], rare: true },
    crate: { name: 'Mystery Crate', desc: 'Sealed, no label. Could be anything.', hot: 1, base: 100, icon: ['crate', '#a8804a'], use: 'crate' },
    // tools
    lockpick: { name: 'Lockpick Set', desc: 'Tension wrench and rakes. Opens what keys won\'t.', hot: 1, base: 60, icon: ['pick', '#c8ccd4'] },
    scanner: { name: 'Police Scanner', desc: 'Hear the cops coming. Shows patrols on your map.', hot: 1, base: 150, icon: ['radio', '#3a3a40'], tool: true },
    duffel: { name: 'Duffel Bag', desc: 'Carry 6 more items.', base: 80, icon: ['bag', '#2c2c34'], tool: true },
    // story
    letter: { name: "Ray's Letter", desc: 'Uncle Ray\'s handwriting, shaky and rushed.', story: true, icon: ['letter', '#f2efe8'], read: 'letter' },
    ledger: { name: 'The Ledger', desc: 'Payments from Vance Holdings to "C.H." Dates. Amounts. Addresses.', story: true, icon: ['book', '#8a2a3a'], read: 'ledger' },
    photo: { name: 'Polaroid', desc: 'Captain Holt shaking hands with Celeste Vance outside the trailer.', story: true, icon: ['photo', '#e8e2d8'] },
    roomkey: { name: 'Room 6 Key', desc: 'A brass key on a star-shaped fob.', story: true, icon: ['key', '#d9aa3a'] },
  };
  const HOT = Object.keys(ITEMS).filter(k => ITEMS[k].hot);

  // vendors: what they sell, price multiplier on base
  const VENDORS = {
    sable: { name: 'Sable', sells: ['smokes', 'shine', 'kicks', 'perfume', 'carts', 'phone', 'watch'], mult: 1.0 },
    doc: { name: 'Doc', sells: ['fakeid', 'lockpick', 'scanner', 'duffel'], mult: 1.0 },
    kofi: { name: 'Kofi', sells: ['crate', 'fireworks', 'jade', 'painting'], mult: 1.0 },
    raj: { name: '24/7 Mart', sells: ['cleaner', 'linens', 'coffee', 'fuse'], legit: true },
    gusShop: { name: 'Lucky Pawn', sells: ['toolkit', 'fuse', 'duffel'], legit: true },
  };
  // buyers: what they pay for, multiplier on base
  const BUYERS = {
    gus: { name: 'Gus', buys: { watch: 1.45, phone: 1.4, kicks: 1.35, carts: 1.5, perfume: 1.3, jade: 1.3, painting: 1.2, fakeid: 1.1 } },
    mo: { name: 'Mo', buys: { shine: 1.7, smokes: 1.6, fireworks: 1.5 } },
    collector: { name: 'The Collector', buys: { jade: 2.4, painting: 2.6, watch: 1.8 } },
  };

  // motel tiers and add-ons
  const TIER = [null,
    { name: 'Starlite Motel', rate: 42, rooms: 6 },
    { name: 'Starlite Motel', rate: 55, rooms: 6, cost: 1500, rep: 1.5, need: 'All 6 rooms repaired', desc: 'Fresh paint, new doors, working sign, a pool with actual water in it.' },
    { name: 'Starlite Inn', rate: 80, rooms: 12, cost: 6000, rep: 2.5, desc: 'A second floor with 6 more rooms, balconies and a canopy over the office.' },
    { name: 'Starlite Hotel', rate: 140, rooms: 40, cost: 25000, rep: 3.5, desc: 'Tear it down, build up: a five-storey hotel with a lobby, a lounge and valet parking.' },
    { name: 'The Starlite Grand', rate: 320, rooms: 120, cost: 90000, rep: 4.5, desc: 'A sixteen-storey glass tower with a rooftop helipad. The skyline will know your name.' },
  ];
  const ADDONS = {
    vending: { name: 'Vending Machine', cost: 250, desc: 'Snacks and soda. +$15 a night.', income: 15 },
    arcade: { name: 'Arcade Cabinet', cost: 400, desc: 'Neon Racer by the ice machine. +$25 a night, guests love it.', income: 25, happy: 0.1 },
    cameras: { name: 'Security Cameras', cost: 600, desc: 'Raids find less, and cops trust you more. Heat cools faster.' },
    safe2: { name: 'Bigger Safe', cost: 500, desc: 'The office safe holds 40 items instead of 15.' },
    backroom: { name: 'Back Room', cost: 1200, minTier: 2, desc: 'A hidden poker room. Sells moonshine from your stash every night at 2x.' },
  };
  const STAFF = {
    housekeeper: { name: 'Rosa (Housekeeper)', wage: 45, desc: 'Cleans dirty rooms on her own, one every couple of hours.' },
    clerk: { name: 'Night Clerk', wage: 55, desc: 'Checks guests in when you are not at the desk.' },
    guard: { name: 'Security Guard', wage: 70, desc: 'Keeps trouble out. Raids never surprise you, heat cools faster.' },
  };

  // guests
  const GUESTS = {
    trucker: { label: 'Trucker', names: ['Big Lou', 'Earl', 'Darlene', 'Hank', 'Rusty'], nights: [1, 2], wants: ['smokes', 'shine', 'coffee'], tip: 1.0, weight: 3 },
    tourist: { label: 'Tourist', names: ['Mia & Theo', 'The Jorgensens', 'Priya', 'Sven', 'Gabi'], nights: [2, 3], wants: ['fireworks', 'perfume', 'kicks'], tip: 1.2, weight: 3 },
    business: { label: 'Salesman', names: ['Mr. Patel', 'Ms. Okafor', 'Gene', 'Mr. Kowalski'], nights: [1, 2], wants: ['phone', 'watch', 'fakeid'], tip: 1.4, weight: 2 },
    musician: { label: 'Musician', names: ['Vinnie Vox', 'Lux', 'Tommy Tremolo', 'Static'], nights: [1, 3], wants: ['shine', 'smokes', 'carts'], tip: 0.9, weight: 2 },
    shady: { label: 'Drifter', names: ['"Snake"', 'No-Name', 'Jojo', 'Mister K'], nights: [1, 4], wants: ['fakeid', 'phone', 'watch', 'lockpick'], tip: 1.6, weight: 2 },
    couple: { label: 'Couple', names: ['Ana & Luis', 'Kim & Jo', 'The Newlyweds'], nights: [1, 2], wants: ['perfume', 'shine'], tip: 1.3, weight: 2 },
    narc: { label: 'Tourist', names: ['"Dave"', '"Steve"', '"Bob"'], nights: [1, 2], wants: ['phone', 'watch', 'fakeid', 'shine'], tip: 2.2, weight: 1, narc: true },
    celeb: { label: 'VIP', names: ['DJ Kaleido', 'Rosa Starr', 'The Baron'], nights: [1, 2], wants: ['jade', 'painting', 'watch', 'fireworks'], tip: 3.0, weight: 0, vip: true },
  };

  const DEBT = [ // Marlowe's schedule: day due, amount
    { day: 4, amount: 500 }, { day: 8, amount: 1000 }, { day: 12, amount: 1500 },
  ];

  window.DATA = { ITEMS, HOT, VENDORS, BUYERS, TIER, ADDONS, STAFF, GUESTS, DEBT };
})();
