// Dialogue portraits: each character's 3D model rendered as a 64x64 pixel-art bust.
(function () {
  const { M4 } = GL3;
  let R = null, cv = null;
  const cache = {};
  const BG = {
    player: '#2f8a8a', dex: '#3a1a1a', marlowe: '#4a3a1a', sable: '#3a1a5a', doc: '#1a3a2a', gus: '#4a3a2a', nina: '#2a2a4a', reyes: '#1a2a5a',
    holt: '#1a1a3a', vance: '#5a4a2a', ray: '#5a2a1a', kofi: '#1a3a4a', lou: '#3a2a1a', raj: '#2a4a2a', dina: '#5a1a2a', mo: '#1a1a3a', pruitt: '#1a2a4a', spider: '#2a2a2a', chen: '#1a4a4a', cop: '#1a2a5a', guest: '#3a2a4a',
  };
  function init() {
    cv = document.createElement('canvas');
    R = new GL3.Renderer(cv, { shadowSize: 256, preserve: true });
    R.resize(64, 64, 1);
  }
  function render(key, look, mood) {
    if (!R) init();
    const parts = CHARS.buildChar(look);
    const draws = [];
    const st = { t: 0.6, nod: mood === 'sad' ? 0.18 : mood === 'angry' ? -0.05 : 0, look: 0.12 };
    const ps = CHARS.pose(0, 0, 0, 0.2, st, 1);
    for (const k of ['torso', 'armL', 'armR', 'head']) {
      const m = R.upload(parts[k].data());
      draws.push({ mesh: m, model: ps[k] });
    }
    const bg = KIT.rgb(BG[key] || '#2a2236').map(v => v * 0.9);
    Object.assign(R.env, { sunDir: [-0.5, -0.6, -0.8], sunCol: [0.95, 0.9, 0.85], sky: [0.5, 0.48, 0.58], ground: [0.25, 0.2, 0.25], clear: bg, bloom: 0.2, bloomTh: 0.9, shadow: 0, vig: 0.5, levels: 48, outlineK: 0.35, hiK: 0.25, depthTh: 0.05 });
    R.lights = [{ x: 1.2, y: 1.6, z: 1.2, r: 4, c: KIT.rgb(BG[key] || '#ff4fa3').map(v => 0.4 + v), i: 0.6 }];
    const cam = R.isoCam([0, 1.02, 0], 62, 0.28, 0.12);
    R.render(cam, draws, null, null, 0);
    const url = cv.toDataURL();
    for (const d of draws) R.free(d.mesh);
    return url;
  }
  const PORTRAITS = {
    get(key, look, mood) {
      const k = key + ':' + (mood || '');
      if (!cache[k]) { try { cache[k] = render(key, look, mood); } catch (e) { console.warn(e); cache[k] = ''; } }
      return cache[k];
    },
    prewarm() { for (const id of ['player', 'dex', 'sable', 'marlowe', 'ray']) PORTRAITS.get(id, CHARS.CAST[id]); },
  };
  window.PORTRAITS = PORTRAITS;
})();
