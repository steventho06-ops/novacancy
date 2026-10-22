// Sound: synthesized effects, voice blips, rain/city ambience, and lo-fi / synthwave music.
(function () {
  const S = { ctx: null, vol: 0.75, mus: 0.5, theme: null, timer: null };
  function ac() {
    if (!S.ctx) {
      try {
        S.ctx = new (window.AudioContext || window.webkitAudioContext)();
        S.master = S.ctx.createGain(); S.master.gain.value = S.vol; S.master.connect(S.ctx.destination);
        S.mbus = S.ctx.createGain(); S.mbus.gain.value = S.mus * 0.55;
        // music goes through a warm lowpass (tape) and a reverb
        S.tape = S.ctx.createBiquadFilter(); S.tape.type = 'lowpass'; S.tape.frequency.value = 5200;
        S.mbus.connect(S.tape); S.tape.connect(S.ctx.destination);
        const conv = S.ctx.createConvolver(); const len = S.ctx.sampleRate * 2.6;
        const buf = S.ctx.createBuffer(2, len, S.ctx.sampleRate);
        for (let c = 0; c < 2; c++) { const d = buf.getChannelData(c); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.4); }
        conv.buffer = buf; const wet = S.ctx.createGain(); wet.gain.value = 0.3; S.tape.connect(conv); conv.connect(wet); wet.connect(S.ctx.destination);
        S.abus = S.ctx.createGain(); S.abus.gain.value = 0.6; S.abus.connect(S.master);
        startRain();
      } catch (e) { return null; }
    }
    if (S.ctx.state === 'suspended') S.ctx.resume();
    return S.ctx;
  }
  const semi = n => 440 * Math.pow(2, n / 12);
  function env(g, t, a, d, peak) { g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak), t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + a + d); }
  function tone(f, dur, type = 'sine', vol = 0.2, when = 0, slide = 0, bus) {
    const c = ac(); if (!c) return;
    const t = c.currentTime + when, o = c.createOscillator(), g = c.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t); if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, f * slide), t + dur);
    env(g, t, 0.006, dur, vol); o.connect(g); g.connect(bus || S.master); o.start(t); o.stop(t + dur + 0.1);
  }
  let nbuf = null;
  function noiseBuf() { const c = ac(); if (!nbuf) { nbuf = c.createBuffer(1, c.sampleRate * 2, c.sampleRate); const d = nbuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; } return nbuf; }
  function noise(dur, vol, freq, when = 0, q = 1, type = 'bandpass', bus) {
    const c = ac(); if (!c) return;
    const t = c.currentTime + when, src = c.createBufferSource(); src.buffer = noiseBuf(); src.loop = true;
    const f = c.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q;
    const g = c.createGain(); env(g, t, 0.004, dur, vol);
    src.connect(f); f.connect(g); g.connect(bus || S.master); src.start(t, Math.random()); src.stop(t + dur + 0.05);
  }
  const VOICE = { player: 0, dex: -12, marlowe: -9, sable: 3, doc: 5, gus: -6, nina: 6, reyes: 2, holt: -10, vance: 7, ray: -4, kofi: -7, guest: 1, cop: -5, pruitt: -8, spider: 8, chen: 9, raj: 2, dina: 6, mo: -7, lou: -9 };
  S.play = function (name, k) {
    if (!S.ctx) return;
    switch (name) {
      case 'step': noise(0.05, 0.05, 900 + Math.random() * 300, 0, 1.4); break;
      case 'stepWet': noise(0.06, 0.07, 2200 + Math.random() * 600, 0, 0.8); noise(0.04, 0.04, 600, 0.01, 1); break;
      case 'stepWood': noise(0.05, 0.08, 500 + Math.random() * 200, 0, 2.5); tone(110 + Math.random() * 20, 0.04, 'triangle', 0.03); break;
      case 'stepTile': noise(0.04, 0.07, 2600, 0, 3); tone(300, 0.03, 'triangle', 0.02); break;
      case 'tap': tone(1200, 0.04, 'square', 0.025); break;
      case 'ui': tone(880, 0.04, 'square', 0.035); tone(1320, 0.05, 'square', 0.03, 0.04); break;
      case 'open': tone(523, 0.06, 'square', 0.04); tone(784, 0.1, 'square', 0.035, 0.05); break;
      case 'close': tone(784, 0.05, 'square', 0.03); tone(523, 0.08, 'square', 0.03, 0.04); break;
      case 'blip': { const v = VOICE[k] != null ? VOICE[k] : 0; tone(semi(v + 2 + Math.floor(Math.random() * 4)), 0.04, 'square', 0.03); break; }
      case 'item': [0, 4, 7, 12].forEach((n, i) => tone(semi(3 + n), 0.14, 'square', 0.05, i * 0.06)); break;
      case 'cash': tone(2100, 0.05, 'square', 0.05); tone(2800, 0.18, 'square', 0.05, 0.05); noise(0.1, 0.08, 4000, 0.02, 1); break;
      case 'coin': tone(1318, 0.06, 'square', 0.04); tone(1760, 0.14, 'square', 0.04, 0.06); break;
      case 'quest': [0, 7, 12, 16, 19].forEach((n, i) => tone(semi(n), 0.25, 'square', 0.04, i * 0.06)); break;
      case 'door': noise(0.25, 0.08, 500, 0, 5); tone(140, 0.2, 'sawtooth', 0.02, 0, 1.3); noise(0.06, 0.12, 200, 0.24, 1); break;
      case 'bell': tone(semi(19), 1.2, 'sine', 0.12); tone(semi(26), 0.8, 'sine', 0.05); break;
      case 'search': noise(0.4, 0.1, 1800, 0, 0.8); noise(0.2, 0.08, 900, 0.3, 1); break;
      case 'ice': for (let i = 0; i < 3; i++) tone(2400 + Math.random() * 900, 0.05, 'triangle', 0.05, i * 0.09); break;
      case 'splash': noise(0.5, 0.15, 1100, 0, 0.7); break;
      case 'vend': tone(90, 0.2, 'square', 0.06); noise(0.15, 0.15, 400, 0.2, 1); break;
      case 'stomp': tone(60, 0.25, 'sine', 0.3, 0, 0.5); noise(0.2, 0.2, 150, 0, 1); break;
      case 'paper': noise(0.25, 0.08, 3000, 0, 0.6); break;
      case 'dial': for (let i = 0; i < 7; i++) tone(700 + i * 90, 0.06, 'sine', 0.05, i * 0.1); break;
      case 'unlock': tone(1200, 0.05, 'square', 0.05); tone(800, 0.08, 'square', 0.05, 0.08); noise(0.1, 0.1, 2000, 0.15, 2); break;
      case 'knock': for (let i = 0; i < 3; i++) { tone(110, 0.06, 'sine', 0.25, i * 0.16); noise(0.04, 0.15, 400, i * 0.16, 2); } break;
      case 'siren': for (let i = 0; i < 4; i++) { tone(700, 0.25, 'sawtooth', 0.04, i * 0.5, 1.4); tone(980, 0.25, 'sawtooth', 0.04, i * 0.5 + 0.25, 0.72); } break;
      case 'whistle': tone(2200, 0.15, 'sine', 0.08); tone(2600, 0.35, 'sine', 0.08, 0.15); break;
      case 'clunk': tone(70, 0.3, 'square', 0.15, 0, 0.5); noise(0.2, 0.2, 300, 0, 1); break;
      case 'powerup': for (let i = 0; i < 6; i++) noise(0.05, 0.1, 6000, i * 0.09 + Math.random() * 0.04, 3); tone(60, 1.2, 'sawtooth', 0.05, 0.4, 2); tone(120, 1.4, 'square', 0.02, 0.6); break;
      case 'buzz': noise(0.15, 0.03, 120, 0, 8); break;
      case 'washer': noise(0.8, 0.06, 300, 0, 2); break;
      case 'fixed': [0, 5, 9].forEach((n, i) => tone(semi(n), 0.12, 'square', 0.05, i * 0.07)); break;
      case 'sparkle': [12, 16, 19, 24, 28].forEach((n, i) => tone(semi(n), 0.2, 'sine', 0.05, i * 0.05)); break;
      case 'scrub': noise(0.12, 0.08, 2600 + Math.random() * 800, 0, 1.2); break;
      case 'tool': tone(180 + Math.random() * 60, 0.05, 'square', 0.06); noise(0.06, 0.1, 1500, 0, 2); break;
      case 'pick': tone(2600 + Math.random() * 400, 0.03, 'square', 0.03); break;
      case 'pin': tone(1800, 0.05, 'square', 0.05); tone(2400, 0.08, 'square', 0.04, 0.04); break;
      case 'fail': tone(semi(-5), 0.15, 'square', 0.06); tone(semi(-9), 0.25, 'square', 0.06, 0.12); break;
      case 'good': tone(semi(12), 0.1, 'square', 0.05); tone(semi(19), 0.16, 'square', 0.05, 0.08); break;
      case 'bad': tone(semi(-2), 0.16, 'square', 0.05); break;
      case 'keys': for (let i = 0; i < 4; i++) tone(3000 + Math.random() * 1500, 0.04, 'triangle', 0.04, i * 0.06); break;
      case 'smash': noise(0.4, 0.35, 2500, 0, 0.5); noise(0.3, 0.25, 600, 0.02, 0.8); break;
      case 'cardoor': noise(0.1, 0.2, 300, 0, 1.5); tone(80, 0.15, 'sine', 0.15); break;
      case 'busgo': noise(1.6, 0.08, 200, 0, 0.6, 'lowpass'); tone(55, 1.6, 'sawtooth', 0.04, 0, 1.4); noise(0.4, 0.06, 3000, 0.1, 3); break;
      case 'horn': tone(392, 0.3, 'square', 0.05); tone(466, 0.3, 'square', 0.04); break;
      case 'purr': for (let i = 0; i < 8; i++) noise(0.06, 0.05, 140, i * 0.08, 2); break;
      case 'meow': tone(semi(14), 0.28, 'triangle', 0.08, 0, 0.75); break;
      case 'heat': tone(semi(-12), 0.2, 'sawtooth', 0.05); tone(semi(-13), 0.3, 'sawtooth', 0.05, 0.1); break;
      case 'phone': tone(1400, 0.06, 'sine', 0.06); tone(1800, 0.08, 'sine', 0.06, 0.08); break;
      case 'scratch': noise(0.08, 0.08, 4000, 0, 1); break;
      case 'win': [0, 4, 7, 12, 16, 19, 24].forEach((n, i) => tone(semi(n), 0.2, 'square', 0.05, i * 0.07)); break;
      case 'build': for (let i = 0; i < 8; i++) { tone(90 + Math.random() * 60, 0.08, 'square', 0.06, i * 0.12); noise(0.06, 0.12, 1200, i * 0.12, 2); } [0, 7, 12, 19, 24].forEach((n, i) => tone(semi(n), 0.3, 'square', 0.05, 1 + i * 0.08)); break;
      case 'run': noise(0.08, 0.06, 1200, 0, 1); break;
    }
  };

  // ---------------- music ----------------
  // each theme: bpm, chord roots (semitones), chord types, bass pattern, melody, drum style
  const MAJ7 = [0, 4, 7, 11], MIN7 = [0, 3, 7, 10], DOM7 = [0, 4, 7, 10], MIN9 = [0, 3, 7, 10, 14], MAJ9 = [0, 4, 7, 11, 14];
  const THEMES = {
    title: { bpm: 92, prog: [[-3, MIN9], [-7, MAJ9], [0, MAJ7], [-5, DOM7]], mel: [16, null, 14, 12, null, 9, 12, null, 14, null, 12, 9, 7, null, null, null], lead: 'sawtooth', drums: 'synth', arp: true },
    night: { bpm: 74, prog: [[-3, MIN9], [-8, MAJ7], [-5, MIN7], [-10, DOM7]], mel: [12, null, null, 10, 7, null, 5, null, 7, null, 10, null, 12, 14, null, null], lead: 'triangle', drums: 'lofi' },
    day: { bpm: 86, prog: [[0, MAJ9], [-3, MIN7], [5, MAJ7], [7, DOM7]], mel: [16, 14, 12, null, 11, 12, 14, null, 12, null, 9, null, 7, null, null, null], lead: 'triangle', drums: 'lofi' },
    underline: { bpm: 104, prog: [[-3, MIN7], [-3, MIN7], [-7, MAJ7], [-8, DOM7]], mel: [null, 9, null, 12, 10, null, 9, 7, null, null, 9, null, 5, null, 3, null], lead: 'sawtooth', drums: 'synth', dark: true },
    office: { bpm: 70, prog: [[2, MIN9], [7, DOM7], [0, MAJ9], [0, MAJ7]], mel: [14, null, 12, null, 9, 11, 12, null, null, null, 7, 9, 11, null, null, null], lead: 'sine', drums: 'brush' },
    diner: { bpm: 112, prog: [[0, MAJ7], [-3, MIN7], [5, MAJ7], [7, DOM7]], mel: [12, 12, 14, 16, null, 12, 16, null, 19, null, 17, 16, 14, null, 12, null], lead: 'square', drums: 'brush' },
    tension: { bpm: 120, prog: [[-3, MIN7], [-2, [0, 3, 6, 9]], [-3, MIN7], [-4, DOM7]], mel: [null, null, 3, null, null, null, 2, null, null, null, 3, null, 6, null, 5, null], lead: 'sawtooth', drums: 'synth', dark: true },
    grand: { bpm: 96, prog: [[5, MAJ9], [4, MIN7], [2, MIN9], [7, DOM7]], mel: [19, null, 17, 16, null, 14, 12, null, 14, null, 16, null, 17, null, 19, 21], lead: 'sine', drums: 'lofi', arp: true },
    jukebox: { bpm: 126, prog: [[0, DOM7], [5, DOM7], [0, DOM7], [7, DOM7]], mel: [12, 15, 16, 19, 16, 15, 12, null, 10, 12, 15, null, 12, null, null, null], lead: 'square', drums: 'brush' },
  };
  S.music = function (name) {
    if (S.theme === name) return;
    S.theme = name;
    const c = ac(); if (!c) return;
    if (S.timer) clearInterval(S.timer);
    if (!name) return;
    const th = THEMES[name] || THEMES.night;
    const beat = 60 / th.bpm / 2;
    let step = 0, next = c.currentTime + 0.2;
    const t0 = c.currentTime;
    const out = S.mbus;
    S.timer = setInterval(() => {
      if (S.theme !== name) return;
      while (next < c.currentTime + 0.4) {
        const bar = Math.floor(step / 16) % th.prog.length, s = step % 16;
        const [root, type] = th.prog[bar];
        const vol = Math.min(1, (next - t0) / 2.5);
        const swing = th.drums === 'lofi' || th.drums === 'brush' ? (s % 2 ? beat * 0.18 : 0) : 0;
        const t = next + swing;
        if (s === 0) { // pad (detuned pair through lowpass)
          for (const n of type) for (const det of [-6, 6]) {
            const o = c.createOscillator(), g = c.createGain(), fl = c.createBiquadFilter();
            o.type = th.dark ? 'sawtooth' : 'triangle'; o.frequency.value = semi(n + root - 12); o.detune.value = det;
            fl.type = 'lowpass'; fl.frequency.value = th.dark ? 900 : 1500;
            env(g, t, 0.4, beat * 15, 0.012 * vol); o.connect(fl); fl.connect(g); g.connect(out); o.start(t); o.stop(t + beat * 16.5);
          }
        }
        // bass
        if (s === 0 || s === 6 || s === 10 || (th.drums === 'synth' && s % 4 === 0)) {
          const o = c.createOscillator(), g = c.createGain(), fl = c.createBiquadFilter();
          o.type = th.drums === 'synth' ? 'sawtooth' : 'triangle'; o.frequency.value = semi(root - 24 + (s === 10 ? 7 : 0));
          fl.type = 'lowpass'; fl.frequency.value = 500;
          env(g, t, 0.01, beat * 2.5, 0.12 * vol); o.connect(fl); fl.connect(g); g.connect(out); o.start(t); o.stop(t + beat * 3);
        }
        // arpeggio
        if (th.arp && s % 2 === 0) { const n = type[(s / 2) % type.length]; const o = c.createOscillator(), g = c.createGain(); o.type = 'square'; o.frequency.value = semi(n + root + 12); env(g, t, 0.004, beat * 0.9, 0.012 * vol); o.connect(g); g.connect(out); o.start(t); o.stop(t + beat); }
        // lead melody
        const m = th.mel[s];
        if (m != null && bar % 2 === 1 - (step >= 64 ? 1 : 0)) {
          const o = c.createOscillator(), g = c.createGain(), fl = c.createBiquadFilter();
          o.type = th.lead; o.frequency.value = semi(m + root); const vib = c.createOscillator(), vg = c.createGain(); vib.frequency.value = 5; vg.gain.value = 4; vib.connect(vg); vg.connect(o.detune); vib.start(t); vib.stop(t + beat * 3);
          fl.type = 'lowpass'; fl.frequency.value = 2600;
          env(g, t, 0.02, beat * 2.4, (th.lead === 'sawtooth' || th.lead === 'square' ? 0.022 : 0.04) * vol); o.connect(fl); fl.connect(g); g.connect(out); o.start(t); o.stop(t + beat * 3);
        }
        // drums
        if (th.drums) {
          const kick = th.drums === 'synth' ? s % 4 === 0 : (s === 0 || s === 7 || s === 10);
          if (kick) { const o = c.createOscillator(), g = c.createGain(); o.frequency.setValueAtTime(120, t); o.frequency.exponentialRampToValueAtTime(40, t + 0.12); env(g, t, 0.002, 0.16, 0.22 * vol); o.connect(g); g.connect(out); o.start(t); o.stop(t + 0.2); }
          if (s % 8 === 4) { const src = c.createBufferSource(); src.buffer = noiseBuf(); const fl = c.createBiquadFilter(); fl.type = th.drums === 'brush' ? 'bandpass' : 'highpass'; fl.frequency.value = th.drums === 'brush' ? 3000 : 1600; const g = c.createGain(); env(g, t, 0.003, th.drums === 'brush' ? 0.2 : 0.14, (th.drums === 'brush' ? 0.06 : 0.1) * vol); src.connect(fl); fl.connect(g); g.connect(out); src.start(t, Math.random()); src.stop(t + 0.25); }
          if (s % 2 === 1 || th.drums === 'synth') { const src = c.createBufferSource(); src.buffer = noiseBuf(); const fl = c.createBiquadFilter(); fl.type = 'highpass'; fl.frequency.value = 7500; const g = c.createGain(); env(g, t, 0.002, 0.03, (s % 4 === 2 ? 0.035 : 0.02) * vol); src.connect(fl); fl.connect(g); g.connect(out); src.start(t, Math.random()); src.stop(t + 0.05); }
          // vinyl crackle for lofi
          if (th.drums === 'lofi' && Math.random() < 0.4) { const src = c.createBufferSource(); src.buffer = noiseBuf(); const fl = c.createBiquadFilter(); fl.type = 'highpass'; fl.frequency.value = 5000; const g = c.createGain(); env(g, t + Math.random() * beat, 0.001, 0.008, 0.03 * vol); src.connect(fl); fl.connect(g); g.connect(out); src.start(t, Math.random()); src.stop(t + 0.03); }
        }
        next += beat; step++;
      }
    }, 100);
  };

  // ---------------- rain + city ambience ----------------
  function startRain() {
    const c = S.ctx;
    const src = c.createBufferSource(); src.buffer = noiseBuf(); src.loop = true;
    const f1 = c.createBiquadFilter(); f1.type = 'lowpass'; f1.frequency.value = 2400;
    const f2 = c.createBiquadFilter(); f2.type = 'highpass'; f2.frequency.value = 300;
    S.rainGain = c.createGain(); S.rainGain.gain.value = 0;
    src.connect(f1); f1.connect(f2); f2.connect(S.rainGain); S.rainGain.connect(S.abus); src.start();
    S.rainFilter = f1;
    const hum = c.createBufferSource(); hum.buffer = noiseBuf(); hum.loop = true;
    const hf = c.createBiquadFilter(); hf.type = 'lowpass'; hf.frequency.value = 180;
    S.humGain = c.createGain(); S.humGain.gain.value = 0;
    hum.connect(hf); hf.connect(S.humGain); S.humGain.connect(S.abus); hum.start();
    setInterval(() => {
      if (!window.G || !G.map) return;
      const t = c.currentTime;
      const out = !G.map.indoor;
      const rain = G.raining ? (out ? 0.16 : G.map.underground ? 0.0 : 0.05) : 0;
      S.rainGain.gain.setTargetAtTime(rain, t, 0.6);
      S.rainFilter.frequency.setTargetAtTime(out ? 2400 : 700, t, 0.3);
      S.humGain.gain.setTargetAtTime(out ? 0.06 : G.map.underground ? 0.08 : 0.02, t, 0.8);
      // occasional far-off city sounds
      if (out && Math.random() < 0.06) tone(300 + Math.random() * 200, 1.4, 'sawtooth', 0.006, 0, 1.6, S.abus);
      if (out && G.night > 0.5 && Math.random() < 0.03) { tone(700, 0.4, 'sawtooth', 0.004, 0, 1.4, S.abus); tone(980, 0.4, 'sawtooth', 0.004, 0.4, 0.72, S.abus); }
      if (G.map.underground && Math.random() < 0.05) { noise(2.5, 0.05, 120, 0, 0.6, 'lowpass', S.abus); }
      if (G.map.underground && Math.random() < 0.08) tone(1400 + Math.random() * 800, 0.02, 'square', 0.01, 0, 0, S.abus);
    }, 500);
  }
  S.ambience = function (map) {
    // music follows the map and the hour
    if (!window.G) return;
    S.pickMusic();
  };
  S.pickMusic = function () {
    if (!window.G || !G.map) return;
    if (G.musicOverride) return S.music(G.musicOverride);
    const id = G.mapId, h = G.hour();
    if (id === 'metro') return S.music('underline');
    if (id === 'diner') return S.music('diner');
    if (id === 'bar') return S.music('office');
    if (id === 'office' || id === 'room' || id === 'laundry' || id === 'pawn' || id === 'mart') return S.music(G.S.tier >= 4 ? 'grand' : 'office');
    if (id === 'lobby') return S.music('grand');
    if (id === 'precinct' || id === 'trailer' || id === 'warehouse') return S.music('tension');
    return S.music(h >= 19 || h < 6 ? 'night' : 'day');
  };
  S.unlock = function () { ac(); };
  S.setVol = v => { S.vol = v; if (S.master) S.master.gain.value = v; };
  S.setMusic = v => { S.mus = v; if (S.mbus) S.mbus.gain.value = v * 0.55; };
  window.SFX = S;
})();
