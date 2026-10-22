// Fuller interiors: extra furniture, decor and life in the downtown rooms (appended to each map).
(function () {
  const PI = Math.PI;
  const F = (fid, x, z, rot = 0) => ({ k: 'furn', fid, x, z, rot });
  const EXTRA = {
    casino: [
      { k: 'bjtable', x: 5, z: 8 }, { k: 'stool', x: 4.2, z: 9.1 }, { k: 'stool', x: 5.8, z: 9.1 },
      { k: 'slot', x: 10, z: 2.0, rot: PI }, { k: 'slot', x: 11.2, z: 2.0, rot: PI }, { k: 'slot', x: 12.4, z: 2.0, rot: PI }, { k: 'slot', x: 13.6, z: 2.0, rot: PI },
      { k: 'slot', x: 0.6, z: 4.2, rot: PI / 2 }, { k: 'slot', x: 0.6, z: 5.4, rot: PI / 2 }, { k: 'slot', x: 0.6, z: 6.6, rot: PI / 2 },
      { k: 'rug', x: 8.4, z: 6, w: 5, d: 4, col: '#7a1a2a' }, { k: 'chandelier', x: 12, z: 5 }, { k: 'chandelier', x: 3.5, z: 6.5 },
      F('sculpture', 14.6, 7.2), F('plant_fig', 15.2, 9.6), F('barcart', 9.2, 8.6), { k: 'neonwall', x: 12.2, z: 0.05, text: 'JACKPOT', col: '#ffd84a' },
    ],
    cafe: [
      F('bookshelf', 0.32, 3.5, PI / 2), { k: 'chair', x: 6.1, z: 2.5, rot: PI / 2 }, { k: 'chair', x: 6.1, z: 5.5, rot: PI / 2 }, { k: 'chair', x: 1.1, z: 5.5, rot: -PI / 2 },
      { k: 'stool', x: 4.6, z: 3.2 }, { k: 'stool', x: 5.6, z: 3.2 }, { k: 'rug', x: 4.5, z: 5.2, w: 3, d: 2, col: '#2f6a5a' },
      F('plant_fig', 8.4, 7.2), F('floorlamp', 0.6, 7.0), { k: 'neonwall', x: 6.6, z: 0.05, text: 'COFFEE', col: '#ffd84a' },
    ],
    boutique: [
      F('wardrobe', 8.6, 4.5, -PI / 2), F('lounge', 7.2, 6.3, PI), { k: 'chandelier', x: 4.5, z: 4 }, { k: 'glasscase', x: 4.4, z: 3.8, w: 2 },
      F('plant_fig', 0.6, 7.3), F('art', 4.8, 0.3),
    ],
    bank: [
      { k: 'chandelier', x: 6, z: 5.5 }, { k: 'flag', x: 11.3, z: 3.2 }, { k: 'flag', x: 11.3, z: 4.4 }, { k: 'desk', x: 9.6, z: 5.6 }, { k: 'chair', x: 9.6, z: 6.5, rot: PI },
      { k: 'filecab', x: 0.6, z: 0.6 }, { k: 'plant', x: 0.7, z: 2.6 }, { k: 'watercooler', x: 11.3, z: 7.8 }, F('art', 3.4, 0.3), { k: 'bench', x: 2.6, z: 7.6, rot: 0 },
    ],
    college: [
      { k: 'shelf', x: 0.6, z: 3, rot: PI / 2 }, { k: 'shelf', x: 0.6, z: 5, rot: PI / 2 }, { k: 'plant', x: 0.7, z: 7.6 }, { k: 'corkboard', x: 8.5, z: 0.1 },
      F('desk_work', 9.8, 5.8), { k: 'flag', x: 7, z: 0.6 }, F('bookshelf', 11.65, 5.5, -PI / 2),
    ],
    vancegrand: [
      F('ctable', 3.2, 6, PI / 2), F('piano', 11.5, 7), F('sculpture', 5.4, 8), { k: 'chandelier', x: 11, z: 5 }, F('aquarium', 12.6, 0.5),
      F('olive', 13.2, 8.8), F('floorlamp', 0.8, 9.0), F('art', 4.4, 0.3),
    ],
    cityhall: [
      { k: 'chandelier', x: 5, z: 5 }, { k: 'rug', x: 6.5, z: 6.6, w: 1.6, d: 5, col: '#7a2236' }, { k: 'plant', x: 13.3, z: 8.5 }, { k: 'shelf', x: 0.6, z: 4.2, rot: PI / 2 },
      { k: 'desk', x: 3, z: 5.4 }, { k: 'chair', x: 3, z: 6.3, rot: PI }, { k: 'filecab', x: 1.6, z: 0.6 }, { k: 'watercooler', x: 5.4, z: 0.5 },
    ],
    aurora: [
      F('aquarium', 10.5, 7.5, -PI / 2), F('sculpture', 8.5, 3.6), F('lounge', 2.6, 8.3), F('olive', 11.3, 1.6), F('art', 5.2, 0.3), F('floorlamp', 0.7, 4.8),
    ],
  };
  for (const id of Object.keys(EXTRA)) {
    const f = MAPS[id]; if (!f) continue;
    MAPS[id] = function () { const m = f.apply(this, arguments); m.objects = (m.objects || []).concat(EXTRA[id].map(o => Object.assign({}, o))); return m; };
  }
})();
