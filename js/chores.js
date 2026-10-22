// Room chores: one quick pixel-art minigame per job (make the bed, toss the trash,
// scrub a stain, patch a hole, fix the wiring). Big targets, forgiving input, juicy feedback.
(function () {
  const W = 192, H = 108;
  const { shell, end, st, tap } = UI._mg;

  // ---------- helpers ----------
  const hash = (x, y) => { let h = (x * 374761393 + y * 668265263) | 0; h = (h ^ (h >>> 13)) * 1274126177 | 0; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
  const hex = c => [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)];
  const lerp = (a, b, t) => a + (b - a) * t;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const near = (x, y, cx, cy, r) => (x - cx) * (x - cx) + (y - cy) * (y - cy) <= r * r;

  function room(x, floorY) {
    // wall with wallpaper stripes, baseboard, dithered carpet
    x.fillStyle = '#2a1e3a'; x.fillRect(0, 0, W, floorY);
    x.fillStyle = '#30234a'; for (let i = 0; i < W; i += 10) x.fillRect(i, 0, 4, floorY);
    x.fillStyle = '#4a3a2a'; x.fillRect(0, floorY - 3, W, 3);
    x.fillStyle = '#6a5038'; x.fillRect(0, floorY - 3, W, 1);
    x.fillStyle = '#4a2232'; x.fillRect(0, floorY, W, H - floorY);
    x.fillStyle = '#56283c';
    for (let yy = floorY; yy < H; yy += 2) for (let xx = (yy >> 1) % 2 * 2; xx < W; xx += 4) x.fillRect(xx, yy, 1, 1);
  }
  function sparkleStar(x, px, py, c) { x.fillStyle = c; x.fillRect(px - 1, py, 3, 1); x.fillRect(px, py - 1, 1, 3); }

  // ---------- shared shell ----------
  function chore(title, doneText, game) {
    return new Promise(res => {
      const g = shell(`<div class="chead"><h3>${title}</h3><button type="button" class="cx" aria-label="Stop">✕</button></div>
        <div class="cstage"><canvas width="${W}" height="${H}"></canvas><div class="chint"></div><div class="cdone" hidden>${doneText}</div></div>
        <div class="bar"><i style="width:0%"></i></div>`);
      g.querySelector('.gbody').classList.add('wide'); st.chore = true;
      const cv = g.querySelector('canvas'), x = cv.getContext('2d');
      const hintEl = g.querySelector('.chint'), barEl = g.querySelector('.bar i'), doneEl = g.querySelector('.cdone');
      const parts = [];
      let raf, last = performance.now(), finished = false, closed = false, down = false, px = -99, py = -99;
      const api = {
        x, parts, t: 0,
        hint(t) { if (hintEl.textContent !== t) { hintEl.textContent = t; hintEl.classList.remove('bump'); void hintEl.offsetWidth; hintEl.classList.add('bump'); } },
        bar(p) { barEl.style.width = clamp(p, 0, 1) * 100 + '%'; },
        puff(cx, cy, n, cols, o = {}) {
          for (let i = 0; i < n; i++) {
            const a = Math.random() * Math.PI * 2, s = (o.speed || 30) * (0.4 + Math.random());
            parts.push({ x: cx, y: cy, vx: Math.cos(a) * s, vy: Math.sin(a) * s - (o.up || 0), g: o.g == null ? 40 : o.g, life: (o.life || 0.6) * (0.6 + Math.random() * 0.6), c: cols[i % cols.length], s: o.size || 1, star: o.star });
          }
        },
        done() {
          if (finished) return; finished = true;
          api.bar(1); SFX.play('sparkle');
          for (let i = 0; i < 26; i++) api.puff(Math.random() * W, Math.random() * H, 1, ['#fff', '#ffd84a', '#3ff0ff'], { speed: 6, g: -10, life: 0.9, star: true });
          doneEl.hidden = false; hintEl.hidden = true;
          setTimeout(() => close(true), 900);
        },
        get down() { return down; }, get px() { return px; }, get py() { return py; },
      };
      const close = ok => { if (closed) return; closed = true; cancelAnimationFrame(raf); removeEventListener('pointerup', up); removeEventListener('pointercancel', up); st.chore = false; end(); res(ok); };
      const pos = e => { const r = cv.getBoundingClientRect(); return [(e.clientX - r.left) / r.width * W, (e.clientY - r.top) / r.height * H]; };
      cv.addEventListener('pointerdown', e => {
        if (finished) return; e.preventDefault();
        try { cv.setPointerCapture(e.pointerId); } catch (_) { }
        down = true;[px, py] = pos(e); game.down && game.down(api, px, py);
      });
      cv.addEventListener('pointermove', e => {
        const [nx, ny] = pos(e);
        if (down && !finished && game.drag) {
          // walk the segment in small steps so fast swipes don't skip anything
          const d = Math.hypot(nx - px, ny - py), n = Math.max(1, Math.ceil(d / 3));
          for (let i = 1; i <= n; i++) game.drag(api, lerp(px, nx, (i - 1) / n), lerp(py, ny, (i - 1) / n), lerp(px, nx, i / n), lerp(py, ny, i / n));
        }
        px = nx; py = ny;
      });
      const up = () => { if (down) { down = false; game.up && game.up(api); } };
      addEventListener('pointerup', up); addEventListener('pointercancel', up);
      tap(g.querySelector('.cx'), () => close(false));
      st.gameKey = () => { if (!finished) game.auto(api); };
      game.init && game.init(api);
      const loop = now => {
        const dt = Math.min(0.05, (now - last) / 1000); last = now; api.t += dt;
        game.update && game.update(api, dt);
        game.draw(api, x);
        for (const p of parts) { p.vy += p.g * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt; }
        for (let i = parts.length - 1; i >= 0; i--) if (parts[i].life <= 0) parts.splice(i, 1);
        for (const p of parts) { if (p.star) sparkleStar(x, Math.round(p.x), Math.round(p.y), p.c); else { x.fillStyle = p.c; x.fillRect(Math.round(p.x), Math.round(p.y), p.s, p.s); } }
        raf = requestAnimationFrame(loop);
      };
      raf = requestAnimationFrame(loop);
    });
  }

  // =====================================================================
  // MAKE THE BED: pull the blanket up, fluff the pillows, smooth it out.
  // =====================================================================
  const bedGame = {
    init(a) {
      a.step = 0; a.pull = 0; a.pullT = 0;
      a.pillows = [{ x: 54, y: 24, mess: 1, t: 1, dx: -10, dy: 16, sl: 0.9 }, { x: 102, y: 24, mess: 1, t: 1, dx: 12, dy: 10, sl: -0.75 }];
      a.wr = [[50, 92, 52], [86, 140, 58], [56, 104, 66], [96, 144, 73]].map(([x0, x1, y]) => ({ x0, x1, y, a: 1 }));
      a.hint('Swipe up to pull the blanket');
    },
    down(a, x, y) {
      if (a.step === 0) { a.pullT = Math.min(1, a.pullT + 0.34); SFX.play('paper'); a.puff(x, y, 4, ['#d8d2e0', '#fff'], { speed: 20 }); }
      else if (a.step === 1) this.fluff(a, x, y);
      else if (a.step === 2) this.smooth(a, x, y, 12);
    },
    drag(a, x0, y0, x1, y1) {
      if (a.step === 0) { const d = y0 - y1; if (d > 0) a.pullT = Math.min(1, a.pullT + d / 40); }
      else if (a.step === 1) this.fluff(a, x1, y1);
      else if (a.step === 2) this.smooth(a, x1, y1, 8);
    },
    fluff(a, x, y) {
      for (const p of a.pillows) if (p.t > 0 && x > p.x + p.dx * p.mess - 10 && x < p.x + 38 + p.dx * p.mess + 10 && y > p.y - 10 + p.dy * p.mess && y < p.y + 16 + p.dy * p.mess + 10) {
        p.t = 0; SFX.play('stomp'); a.puff(p.x + 18, p.y + 6, 10, ['#fff', '#e8e2f8', '#c8c0dc'], { speed: 40, up: 10 });
      }
    },
    smooth(a, x, y, r) {
      for (const w of a.wr) if (w.a > 0.5 && x > w.x0 - r && x < w.x1 + r && Math.abs(y - w.y) < r) {
        w.a = 0.49; SFX.play('scrub'); a.puff(x, w.y, 5, ['#fff', '#ffd84a'], { speed: 16, g: 0, life: 0.4 });
      }
    },
    auto(a) {
      if (a.step === 0) a.pullT = Math.min(1, a.pullT + 0.5);
      else if (a.step === 1) { const p = a.pillows.find(p => p.t > 0); if (p) this.fluff(a, p.x + 18 + p.dx, p.y + 4 + p.dy); }
      else { const w = a.wr.find(w => w.a > 0.5); if (w) this.smooth(a, (w.x0 + w.x1) / 2, w.y, 4); }
    },
    update(a, dt) {
      a.pull = lerp(a.pull, a.pullT, Math.min(1, dt * 10));
      for (const p of a.pillows) p.mess = lerp(p.mess, p.t, Math.min(1, dt * 12));
      for (const w of a.wr) if (w.a < 0.5) w.a = Math.max(0, w.a - dt * 3);
      if (a.step === 0 && a.pullT >= 1) { a.step = 1; SFX.play('good'); a.hint('Tap the pillows to fluff them'); }
      if (a.step === 1 && a.pillows.every(p => p.t === 0)) { a.step = 2; a.hint('Swipe across to smooth the wrinkles'); }
      if (a.step === 2 && a.wr.every(w => w.a <= 0)) { a.step = 3; a.done(); }
      a.bar(a.step >= 3 ? 1 : (a.pull + a.pillows.filter(p => p.t === 0).length / 2 + a.wr.filter(w => w.a < 0.5).length / 4) / 3);
    },
    draw(a, x) {
      room(x, 62);
      // lamp glow on the wall
      x.fillStyle = '#3a2a4e'; x.fillRect(4, 8, 30, 26); x.fillStyle = '#ffd84a'; x.fillRect(14, 22, 10, 6); x.fillStyle = '#c8a040'; x.fillRect(18, 28, 2, 10); x.fillStyle = '#5a3a26'; x.fillRect(8, 38, 24, 24); x.fillStyle = '#6a4a30'; x.fillRect(8, 38, 24, 2);
      // headboard
      x.fillStyle = '#5a3420'; x.fillRect(44, 10, 104, 26); x.fillStyle = '#7a4a2c'; x.fillRect(44, 10, 104, 3); x.fillStyle = '#4a2a18'; for (let i = 52; i < 146; i += 16) x.fillRect(i, 15, 2, 19);
      // mattress + base
      x.fillStyle = '#ece8f2'; x.fillRect(40, 34, 112, 50); x.fillStyle = '#c8c0dc'; x.fillRect(40, 80, 112, 6);
      x.fillStyle = '#3e2418'; x.fillRect(38, 86, 116, 8); x.fillStyle = '#2a180e'; x.fillRect(40, 94, 4, 6); x.fillRect(148, 94, 4, 6);
      // pillows (slanted and shoved aside when messy)
      for (const p of a.pillows) {
        const m = p.mess, ox = Math.round(p.x + p.dx * m), oy = Math.round(p.y + p.dy * m);
        for (let r = 0; r < 14; r++) {
          const sx = Math.round((r - 7) * p.sl * m), inset = r === 0 || r === 13 ? 2 : r === 1 || r === 12 ? 1 : 0;
          x.fillStyle = r > 10 ? '#d0c8e4' : '#fbf8ff'; x.fillRect(ox + sx + inset, oy + r, 36 - inset * 2, 1);
        }
        x.fillStyle = '#e4dcf4'; x.fillRect(ox + 4 + Math.round(-3 * p.sl * m), oy + 6, 28, 1);
      }
      // blanket: bunched at the foot, pulled up to the pillows
      const top = Math.round(lerp(78, 40, a.pull)), amp = (1 - a.pull) * 3;
      for (let xx = 40; xx < 152; xx++) {
        const t = Math.round(top + Math.sin(xx * 0.3 + 1) * amp + Math.sin(xx * 0.11) * amp);
        x.fillStyle = '#8a2f4a'; x.fillRect(xx, t, 1, 88 - t);
        x.fillStyle = '#a33a58'; for (let yy = t + 8; yy < 88; yy += 12) x.fillRect(xx, yy, 1, 3);
        x.fillStyle = a.pull > 0.9 ? '#f4f0fa' : '#b84a6a'; x.fillRect(xx, t, 1, a.pull > 0.9 ? 4 : 2);
      }
      x.fillStyle = '#6a2238'; x.fillRect(40, 86, 112, 2);
      // wrinkles
      if (a.step >= 1) for (const w of a.wr) if (w.a > 0) {
        x.globalAlpha = Math.min(1, w.a * 2);
        x.fillStyle = '#5e1e34';
        for (let xx = w.x0; xx < w.x1; xx++) x.fillRect(xx, w.y + Math.round(Math.sin(xx * 0.5) * 1.2), 1, 1);
        x.fillStyle = '#b04a68'; for (let xx = w.x0; xx < w.x1; xx += 2) x.fillRect(xx, w.y - 1 + Math.round(Math.sin(xx * 0.5) * 1.2), 1, 1);
        x.globalAlpha = 1;
      }
      // guide arrow for the first step
      if (a.step === 0) { const b = Math.round((a.t * 30) % 14); x.fillStyle = '#ffd84a'; const cx = 96, cy = 70 - b; x.fillRect(cx - 1, cy, 3, 8); x.fillRect(cx - 3, cy + 2, 7, 1); x.fillRect(cx - 2, cy + 1, 5, 1); }
      if (a.step === 1) for (const p of a.pillows) if (p.t > 0 && Math.floor(a.t * 4) % 2) { x.fillStyle = '#ffd84a'; const ox = Math.round(p.x + p.dx * p.mess), oy = Math.round(p.y + p.dy * p.mess); x.fillRect(ox + 16, oy - 6, 4, 3); x.fillRect(ox + 17, oy - 3, 2, 1); }
    },
  };

  // =====================================================================
  // TRASH / JUNK: tap each piece and it flies into the bin.
  // =====================================================================
  const SPR = {
    can(x, X, Y) { x.fillStyle = '#c8443c'; x.fillRect(X, Y + 2, 7, 10); x.fillStyle = '#e8e2e8'; x.fillRect(X, Y, 7, 2); x.fillRect(X, Y + 12, 7, 1); x.fillStyle = '#ff7a6a'; x.fillRect(X + 1, Y + 3, 1, 8); x.fillStyle = '#fff'; x.fillRect(X + 3, Y + 5, 3, 2); return [7, 13]; },
    paper(x, X, Y) { x.fillStyle = '#e8e2d8'; x.fillRect(X + 1, Y, 8, 9); x.fillRect(X, Y + 2, 10, 5); x.fillStyle = '#a8a0a8'; x.fillRect(X + 3, Y + 2, 1, 4); x.fillRect(X + 5, Y + 5, 3, 1); x.fillRect(X + 6, Y + 1, 1, 2); return [10, 9]; },
    pizza(x, X, Y) { x.fillStyle = '#b8864a'; x.fillRect(X, Y, 16, 13); x.fillStyle = '#d8a868'; x.fillRect(X, Y, 16, 2); x.fillStyle = '#8a5a2a'; x.fillRect(X + 9, Y + 6, 4, 3); x.fillStyle = '#c8443c'; x.fillRect(X + 3, Y + 4, 5, 2); return [16, 13]; },
    bottle(x, X, Y) { x.fillStyle = '#2f7a44'; x.fillRect(X + 1, Y + 4, 6, 10); x.fillRect(X + 2, Y, 3, 4); x.fillStyle = '#6ad08a'; x.fillRect(X + 2, Y + 5, 1, 7); x.fillStyle = '#e8c13c'; x.fillRect(X + 1, Y + 7, 6, 3); return [8, 14]; },
    cup(x, X, Y) { x.fillStyle = '#f2efe8'; x.fillRect(X, Y + 3, 8, 10); x.fillStyle = '#ff4fa3'; x.fillRect(X, Y + 6, 8, 3); x.fillStyle = '#d8d2c8'; x.fillRect(X - 1, Y + 2, 10, 2); x.fillStyle = '#3ff0ff'; x.fillRect(X + 5, Y - 2, 1, 5); return [8, 13]; },
    peel(x, X, Y) { x.fillStyle = '#e8c13c'; x.fillRect(X + 4, Y, 3, 6); x.fillRect(X, Y + 5, 11, 3); x.fillRect(X, Y + 8, 3, 3); x.fillRect(X + 8, Y + 8, 3, 3); x.fillStyle = '#8a6a1a'; x.fillRect(X + 5, Y, 1, 1); return [11, 11]; },
    sock(x, X, Y) { x.fillStyle = '#f2efe8'; x.fillRect(X, Y, 5, 10); x.fillRect(X, Y + 7, 10, 4); x.fillStyle = '#4f7bff'; x.fillRect(X, Y + 1, 5, 1); x.fillRect(X, Y + 3, 5, 1); x.fillStyle = '#c8c0b8'; x.fillRect(X + 7, Y + 8, 3, 3); return [10, 11]; },
    mag(x, X, Y) { x.fillStyle = '#ff7ac0'; x.fillRect(X, Y, 12, 15); x.fillStyle = '#fff'; x.fillRect(X + 2, Y + 2, 8, 2); x.fillStyle = '#b44bff'; x.fillRect(X + 3, Y + 6, 6, 6); x.fillStyle = '#c8508a'; x.fillRect(X, Y + 14, 12, 1); return [12, 15]; },
    takeout(x, X, Y) { x.fillStyle = '#f2efe8'; x.fillRect(X + 1, Y + 2, 12, 9); x.fillRect(X, Y, 14, 3); x.fillStyle = '#c8443c'; x.fillRect(X + 5, Y + 5, 4, 3); x.fillStyle = '#b8b0a8'; x.fillRect(X + 1, Y + 10, 12, 1); x.fillStyle = '#c8ccd4'; x.fillRect(X + 6, Y - 2, 2, 2); return [14, 11]; },
    cards(x, X, Y) { x.fillStyle = '#f2efe8'; x.fillRect(X, Y + 2, 8, 11); x.fillRect(X + 5, Y, 8, 11); x.fillStyle = '#c8443c'; x.fillRect(X + 8, Y + 3, 2, 2); x.fillStyle = '#18181e'; x.fillRect(X + 2, Y + 8, 2, 2); return [13, 13]; },
  };
  function trashGame(kind) {
    const bag = kind === 'trash2';
    const pool = bag ? ['sock', 'mag', 'takeout', 'cards', 'bottle', 'paper'] : ['can', 'paper', 'pizza', 'bottle', 'cup', 'peel'];
    const BIN = { x: 158, y: 46, w: 26, h: 42, mx: 171, my: 48 };
    return {
      init(a) {
        a.items = []; a.got = 0; a.wob = 0;
        const n = 6;
        for (let i = 0; i < n; i++) {
          let ix, iy, tries = 0;
          do { ix = 10 + Math.random() * 126; iy = 44 + Math.random() * 46; tries++; } while (tries < 40 && a.items.some(o => Math.abs(o.x - ix) < 20 && Math.abs(o.y - iy) < 16));
          a.items.push({ k: pool[i % pool.length], x: ix, y: iy, fly: -1, bob: Math.random() * 6 });
        }
        a.n = n;
        a.hint(`Tap the ${bag ? 'junk' : 'trash'} to toss it  0/${n}`);
      },
      grab(a, x, y, r) {
        for (const it of a.items) if (it.fly < 0 && near(x, y, it.x + 6, it.y + 6, r)) {
          it.fly = 0; it.sx = it.x; it.sy = it.y; SFX.play('pick');
          a.puff(it.x + 6, it.y + 6, 5, ['#fff', '#ffd84a'], { speed: 22, life: 0.35 });
          return true;
        }
      },
      down(a, x, y) { this.grab(a, x, y, 15); },
      drag(a, x0, y0, x1, y1) { this.grab(a, x1, y1, 11); },
      auto(a) { const it = a.items.find(i => i.fly < 0); if (it) this.grab(a, it.x + 6, it.y + 6, 4); },
      update(a, dt) {
        a.wob = Math.max(0, a.wob - dt * 3);
        for (const it of a.items) if (it.fly >= 0 && it.fly < 1) {
          it.fly = Math.min(1, it.fly + dt * 2.6);
          const t = it.fly;
          it.x = lerp(it.sx, BIN.mx - 6, t); it.y = lerp(it.sy, BIN.my - 8, t) - Math.sin(t * Math.PI) * 30;
          if (it.fly >= 1) { it.fly = 2; a.got++; a.wob = 1; SFX.play('clunk'); a.puff(BIN.mx, BIN.my, 6, ['#c8ccd4', '#fff'], { speed: 26, up: 20 }); a.hint(`Tap the ${bag ? 'junk' : 'trash'} to toss it  ${a.got}/${a.n}`); if (a.got >= a.n) a.done(); }
        }
        a.bar(a.got / a.n);
      },
      draw(a, x) {
        room(x, 34);
        // window with neon outside
        x.fillStyle = '#120e20'; x.fillRect(70, 4, 44, 22); x.fillStyle = '#1e1838'; x.fillRect(72, 6, 40, 18); x.fillStyle = '#ff4fa3'; x.fillRect(80, 12, 10, 2); x.fillStyle = '#3ff0ff'; x.fillRect(96, 16, 8, 2); x.fillStyle = '#5a3a26'; x.fillRect(70, 14, 44, 1);
        // little rug + shadows under items
        x.fillStyle = '#3a6a7a'; x.fillRect(20, 62, 96, 30); x.fillStyle = '#4a8a9a'; for (let i = 22; i < 114; i += 6) x.fillRect(i, 64, 3, 26); x.fillStyle = '#ffd84a'; x.fillRect(20, 62, 96, 1); x.fillRect(20, 91, 96, 1);
        for (const it of a.items) if (it.fly < 0) { x.fillStyle = 'rgba(0,0,0,0.35)'; x.fillRect(Math.round(it.x), Math.round(it.y) + 12, 13, 3); }
        // bin (wobbles when something lands)
        const wb = Math.round(Math.sin(a.t * 40) * a.wob * 2);
        x.fillStyle = 'rgba(0,0,0,0.35)'; x.fillRect(BIN.x - 2, BIN.y + BIN.h - 2, BIN.w + 4, 4);
        if (bag) {
          x.fillStyle = '#18181e'; x.fillRect(BIN.x + wb, BIN.y + 6, BIN.w, BIN.h - 6); x.fillRect(BIN.x + 3 + wb, BIN.y + 2, BIN.w - 6, 4);
          x.fillStyle = '#3a3a48'; x.fillRect(BIN.x + 4 + wb, BIN.y + 10, 2, 24); x.fillRect(BIN.x + 18 + wb, BIN.y + 14, 2, 18);
          x.fillStyle = '#ffd84a'; x.fillRect(BIN.x + 10 + wb, BIN.y, 6, 2);
        } else {
          x.fillStyle = '#5a6a7a'; x.fillRect(BIN.x + wb, BIN.y + 4, BIN.w, BIN.h - 4); x.fillStyle = '#7a8a9a'; x.fillRect(BIN.x - 2 + wb, BIN.y + 2, BIN.w + 4, 4);
          x.fillStyle = '#48586a'; for (let i = 4; i < BIN.w; i += 5) x.fillRect(BIN.x + i + wb, BIN.y + 8, 2, BIN.h - 12);
          x.fillStyle = '#9aaaba'; x.fillRect(BIN.x + 1 + wb, BIN.y + 8, 1, BIN.h - 12);
        }
        // fill level peeking out
        if (a.got) { x.fillStyle = bag ? '#2a2a34' : '#e8e2d8'; x.fillRect(BIN.x + 4 + wb, BIN.y + 4 - Math.min(4, a.got), BIN.w - 8, Math.min(4, a.got)); }
        // items, with a gentle bob so they read as "tap me"
        for (const it of a.items) if (it.fly !== 2) {
          const b = it.fly < 0 ? Math.round(Math.sin(a.t * 4 + it.bob) * 0.8) : 0;
          SPR[it.k](x, Math.round(it.x), Math.round(it.y) + b);
          if (it.fly < 0 && Math.floor(a.t * 3 + it.bob) % 4 === 0) sparkleStar(x, Math.round(it.x) + 12, Math.round(it.y) - 1, '#ffd84a');
        }
      },
    };
  }

  // =====================================================================
  // RUB: scrub the carpet stain / bathroom grime, or spread plaster over a hole.
  // =====================================================================
  function rubGame(kind) {
    const plaster = kind === 'hole';
    return {
      init(a) {
        // background
        const bg = document.createElement('canvas'); bg.width = W; bg.height = H; const b = bg.getContext('2d');
        if (kind === 'bath') {
          b.fillStyle = '#b8d0d8'; b.fillRect(0, 0, W, H);
          b.fillStyle = '#8aa4b0'; for (let i = 0; i < W; i += 14) b.fillRect(i, 0, 1, H); for (let j = 0; j < H; j += 14) b.fillRect(0, j, W, 1);
          b.fillStyle = '#d8eaf0'; for (let i = 1; i < W; i += 14) for (let j = 1; j < H; j += 14) b.fillRect(i, j, 4, 1);
          // sink
          b.fillStyle = '#f4f8fa'; b.fillRect(60, 58, 72, 30); b.fillStyle = '#d0dce4'; b.fillRect(66, 62, 60, 16); b.fillStyle = '#9aaab4'; b.fillRect(94, 70, 4, 3);
          b.fillStyle = '#c8ccd4'; b.fillRect(92, 50, 8, 10); b.fillRect(86, 50, 20, 3); b.fillStyle = '#e8ecf0'; b.fillRect(60, 58, 72, 2);
          b.fillStyle = '#c8ccd4'; b.fillRect(70, 6, 52, 36); b.fillStyle = '#5a7a8a'; b.fillRect(72, 8, 48, 32); b.fillStyle = '#8ab0c0'; b.fillRect(76, 12, 6, 2); b.fillRect(76, 16, 3, 2);
        } else if (plaster) {
          b.fillStyle = '#2a1e3a'; b.fillRect(0, 0, W, H); b.fillStyle = '#30234a'; for (let i = 0; i < W; i += 10) b.fillRect(i, 0, 4, H);
          b.fillStyle = '#4a3a2a'; b.fillRect(0, 96, W, 12); b.fillStyle = '#6a5038'; b.fillRect(0, 96, W, 1);
        } else {
          b.fillStyle = '#4a2232'; b.fillRect(0, 0, W, H); b.fillStyle = '#56283c';
          for (let yy = 0; yy < H; yy += 2) for (let xx = (yy >> 1) % 2 * 2; xx < W; xx += 4) b.fillRect(xx, yy, 1, 1);
          b.fillStyle = '#3e1c2a'; for (let i = 0; i < 40; i++) b.fillRect(Math.floor(hash(i, 3) * W), Math.floor(hash(i, 9) * H), 2, 1);
        }
        a.bg = b.getImageData(0, 0, W, H);
        a.img = x0(a);
        // dirt mask
        const m = a.mask = new Float32Array(W * H);
        const blobs = kind === 'bath' ? [[40, 30, 14], [150, 28, 16], [96, 80, 18], [30, 84, 12], [160, 82, 13]]
          : plaster ? [[96, 52, 22], [84, 46, 12], [110, 60, 12]]
            : [[96, 54, 26], [74, 44, 12], [122, 64, 13], [40, 26, 7], [156, 86, 8]];
        for (let yy = 0; yy < H; yy++) for (let xx = 0; xx < W; xx++) {
          let v = 0;
          for (const [cx, cy, r] of blobs) {
            const rr = r * (0.85 + hash(Math.floor(xx / 3), Math.floor(yy / 3)) * 0.3);
            const d = Math.hypot(xx - cx, (yy - cy) * 1.1) / rr;
            if (d < 1) v = Math.max(v, plaster ? 1 : clamp((1 - d) * 2.2, 0, 1));
          }
          m[yy * W + xx] = v;
        }
        a.total = 0; for (let i = 0; i < m.length; i++) if (m[i] > 0.05) a.total++;
        a.cleared = 0; a.rubbing = 0;
        a.hint(plaster ? 'Rub to spread plaster over the hole' : 'Rub the grime away (or tap it)');
      },
      stamp(a, cx, cy, r, s) {
        const m = a.mask; let any = false;
        for (let yy = Math.max(0, Math.floor(cy - r)); yy <= Math.min(H - 1, cy + r); yy++)
          for (let xx = Math.max(0, Math.floor(cx - r)); xx <= Math.min(W - 1, cx + r); xx++) {
            const i = yy * W + xx; if (m[i] <= 0) continue;
            const d = Math.hypot(xx - cx, yy - cy); if (d > r) continue;
            m[i] = Math.max(0, m[i] - s * (1.2 - d / r)); any = true;
          }
        if (any) {
          a.rubbing = 0.15;
          if (Math.random() < 0.5) a.puff(cx + (Math.random() - 0.5) * 10, cy + (Math.random() - 0.5) * 8, 1, plaster ? ['#e8e2d8', '#c8c0b8'] : ['#ffffff', '#bff4ff', '#e8f8ff'], { speed: 10, g: plaster ? 40 : -25, life: 0.7, size: 2 });
        }
        return any;
      },
      down(a, x, y) { if (this.stamp(a, x, y, 13, 0.7)) SFX.play(plaster ? 'tool' : 'scrub'); },
      drag(a, x0, y0, x1, y1) { if (this.stamp(a, x1, y1, 12, 0.16) && Math.random() < 0.12) SFX.play(plaster ? 'tool' : 'scrub'); },
      auto(a) {
        // scrub the dirtiest spot left
        let best = -1, bi = 0; for (let i = 0; i < a.mask.length; i += 7) if (a.mask[i] > best) { best = a.mask[i]; bi = i; }
        if (best > 0.05) this.down(a, bi % W, Math.floor(bi / W));
      },
      update(a, dt) {
        a.rubbing = Math.max(0, a.rubbing - dt);
        let left = 0; const m = a.mask; for (let i = 0; i < m.length; i++) if (m[i] > 0.05) left++;
        const p = 1 - left / a.total;
        if (p >= 0.9 && !a.fin) { a.fin = 1; }
        if (a.fin) { for (let i = 0; i < m.length; i++) m[i] = Math.max(0, m[i] - dt * 2); if (left === 0 && a.fin === 1) { a.fin = 2; a.done(); } }
        a.bar(Math.min(1, p / 0.9));
      },
      draw(a, x) {
        const bg = a.bg.data, out = a.img.data, m = a.mask;
        const dirtA = kind === 'bath' ? hex('#6a7a3a') : plaster ? hex('#0d0b14') : hex('#5a3a1e');
        const dirtB = kind === 'bath' ? hex('#4a5a2a') : plaster ? hex('#1a1424') : hex('#3e2614');
        const fresh = hex('#e8e2d8');
        for (let i = 0, p = 0; i < m.length; i++, p += 4) {
          let r = bg[p], g = bg[p + 1], b = bg[p + 2];
          const v = m[i];
          if (plaster) {
            // anything that was part of the hole shows fresh plaster once covered
            if (v > 0.05) { const xx = i % W, yy = (i / W) | 0; const c = ((xx + yy) & 3) === 0 || hash(xx, yy) < 0.2 ? dirtB : dirtA; r = c[0]; g = c[1]; b = c[2]; }
            else if (a.holeMask ? a.holeMask[i] : 0) { r = fresh[0]; g = fresh[1]; b = fresh[2]; if (hash(i, 7) < 0.12) { r -= 20; g -= 20; b -= 20; } }
          } else if (v > 0.02) {
            const xx = i % W, yy = (i / W) | 0;
            const c = hash(xx >> 1, yy >> 1) < 0.35 ? dirtB : dirtA;
            const k = Math.min(1, v * 1.3);
            // ordered dither on the edge so it stays crisp pixel art
            const th = ((xx & 1) * 2 + (yy & 1)) / 4;
            if (k > th * 0.8 + 0.1) { r = c[0]; g = c[1]; b = c[2]; }
          }
          out[p] = r; out[p + 1] = g; out[p + 2] = b; out[p + 3] = 255;
        }
        x.putImageData(a.img, 0, 0);
        if (plaster) {
          // cracks around the hole until it's patched
          if (!a.fin) { x.fillStyle = '#120e1c'; for (const [cx, cy, dx, dy] of [[74, 40, -1, -1], [118, 64, 1, 1], [100, 30, 1, -1], [80, 66, -1, 1]]) for (let i = 0; i < 10; i++) x.fillRect(cx + dx * i, cy + dy * Math.round(i * 0.6) + (i % 3 === 1 ? dy : 0), 1, 1); }
        }
        // the tool follows your finger
        if (a.down && a.px > -50) {
          const X = Math.round(a.px), Y = Math.round(a.py);
          if (plaster) { x.fillStyle = '#c8ccd4'; x.fillRect(X - 6, Y - 2, 12, 4); x.fillStyle = '#e8ecf0'; x.fillRect(X - 6, Y - 2, 12, 1); x.fillStyle = '#7a4a2c'; x.fillRect(X - 1, Y + 2, 3, 9); }
          else { x.fillStyle = '#e8c13c'; x.fillRect(X - 7, Y - 4, 14, 9); x.fillStyle = '#3a8a4a'; x.fillRect(X - 7, Y - 6, 14, 3); x.fillStyle = '#f8e070'; x.fillRect(X - 6, Y - 3, 3, 2); }
        }
      },
    };
    function x0(a) { const img = new ImageData(W, H); return img; }
  }
  // remember which pixels were the hole so they turn into fresh plaster
  const _rubInit = (g, kind) => { const init = g.init; g.init = a => { init.call(g, a); if (kind === 'hole') a.holeMask = Uint8Array.from(a.mask, v => v > 0.05 ? 1 : 0); }; return g; };

  // =====================================================================
  // WIRING: tap each sparking wire to snap it into its terminal.
  // =====================================================================
  const wireGame = {
    init(a) {
      const cols = ['#c8443c', '#18181e', '#f2efe8'];
      a.wires = [0, 1, 2].map(i => ({ c: cols[i], tx: 84 + i * 12, ty: 36, ax: 62 + i * 34, ay: 84 + (i % 2) * 8, t: 0, go: false, ph: i * 2 }));
      a.cover = 0; a.hint('Tap each sparking wire to connect it  0/3');
    },
    tip(w) { return [lerp(w.ax, w.tx, w.t), lerp(w.ay, w.ty + 4, w.t)]; },
    hit(a, x, y, r) {
      for (const w of a.wires) if (!w.go) {
        const [tx, ty] = this.tip(w);
        for (let k = 0; k <= 8; k++) { const px = lerp(w.tx, tx, k / 8), py = lerp(w.ty + 4, ty, k / 8) + Math.sin(k / 8 * Math.PI) * 10; if (near(x, y, px, py, r)) { w.go = true; SFX.play('tool'); return; } }
      }
    },
    down(a, x, y) { this.hit(a, x, y, 14); },
    drag(a, x0, y0, x1, y1) { this.hit(a, x1, y1, 9); },
    auto(a) { const w = a.wires.find(w => !w.go); if (w) w.go = true; },
    update(a, dt) {
      let n = 0;
      for (const w of a.wires) {
        if (w.go && w.t < 1) { w.t = Math.min(1, w.t + dt * 3); if (w.t >= 1) { SFX.play('clunk'); a.puff(w.tx, w.ty + 4, 8, ['#ffd84a', '#fff'], { speed: 30 }); } }
        if (w.t >= 1) n++;
        else if (Math.random() < dt * 6) { const [sx, sy] = this.tip(w); a.puff(sx, sy, 3, ['#ffd84a', '#fff', '#3ff0ff'], { speed: 40, life: 0.25 }); if (Math.random() < 0.15) SFX.play('buzz'); }
      }
      if (n !== a.n) { a.n = n; a.hint(`Tap each sparking wire to connect it  ${n}/3`); }
      if (n === 3) { a.cover = Math.min(1, a.cover + dt * 3); if (a.cover >= 1 && !a.fin) { a.fin = 1; SFX.play('fixed'); a.done(); } }
      a.bar(n / 3 * 0.9 + a.cover * 0.1);
    },
    draw(a, x) {
      room(x, 96);
      // junction box
      x.fillStyle = '#5a5a64'; x.fillRect(74, 18, 44, 30); x.fillStyle = '#3a3a44'; x.fillRect(76, 20, 40, 26);
      for (const w of a.wires) { x.fillStyle = '#c8a040'; x.fillRect(w.tx - 2, w.ty - 2, 5, 5); x.fillStyle = '#8a6a20'; x.fillRect(w.tx, w.ty - 1, 1, 3); }
      // wires: hang from the box and swing, snap up when fixed
      for (const w of a.wires) {
        const [tx, ty] = this.tip(w), sw = (1 - w.t) * Math.sin(a.t * 3 + w.ph) * 3;
        x.fillStyle = w.c;
        for (let k = 0; k <= 24; k++) { const s = k / 24; const px = lerp(w.tx, tx + sw, s), py = lerp(w.ty + 4, ty, s) + Math.sin(s * Math.PI) * 10 * (1 - w.t); x.fillRect(Math.round(px) - 1, Math.round(py), 3, 2); }
        if (w.t < 1) { x.fillStyle = '#c8a040'; x.fillRect(Math.round(tx + sw) - 1, Math.round(ty) + 1, 3, 3); }
      }
      // cover plate slides on at the end
      if (a.cover > 0) { const y = Math.round(lerp(-30, 18, a.cover)); x.fillStyle = '#e8e2d8'; x.fillRect(74, y, 44, 30); x.fillStyle = '#c8c0b8'; x.fillRect(74, y + 28, 44, 2); x.fillStyle = '#8a8a9a'; x.fillRect(78, y + 4, 2, 2); x.fillRect(112, y + 24, 2, 2); }
      // warning sign
      x.fillStyle = '#ffd84a'; x.fillRect(140, 20, 16, 14); x.fillStyle = '#18181e'; x.fillRect(147, 23, 2, 6); x.fillRect(147, 30, 2, 2);
    },
  };

  const DONE = { bed: 'MADE!', trash1: 'ALL CLEAN!', trash2: 'TIDY!', stain: 'SPOTLESS!', bath: 'SPARKLING!', hole: 'PATCHED!', wiring: 'FIXED!' };
  const old = UI.scrubGame;
  UI.scrubGame = function (label, kind, id) {
    let g;
    if (id === 'bed') g = bedGame;
    else if (id === 'trash1' || id === 'trash2') g = trashGame(id);
    else if (id === 'stain' || id === 'bath' || id === 'hole') g = _rubInit(rubGame(id), id);
    else if (id === 'wiring') g = wireGame;
    if (!g) return old(label, kind);
    return chore(label, DONE[id] || 'DONE!', g);
  };
})();
