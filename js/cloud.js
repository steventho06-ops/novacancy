// Accounts + cloud saves.
// On the Vercel site (where /api exists) you must sign in; your save lives online with your account
// and follows you to any device. Where there is no server (e.g. a local preview) the game stays local.
(function () {
  const $ = id => document.getElementById(id);
  const LS = {
    get: k => { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set: (k, v) => { try { localStorage.setItem(k, v); } catch (e) { } },
    del: k => { try { localStorage.removeItem(k); } catch (e) { } },
  };
  const SAVE_KEY = 'novacancy-save-v1';
  const C = window.CLOUD = { mode: 'local', token: LS.get('nv-token'), user: LS.get('nv-user'), dirty: false, busy: false, conflict: false };
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

  async function api(path, opts = {}, timeout = 8000) {
    const ctl = 'AbortController' in window ? new AbortController() : null;
    const t = ctl && setTimeout(() => ctl.abort(), timeout);
    try {
      const headers = { 'Content-Type': 'application/json' };
      if (C.token) headers.Authorization = 'Bearer ' + C.token;
      const r = await fetch('api/' + path, { method: opts.method || 'GET', headers, body: opts.body ? JSON.stringify(opts.body) : undefined, signal: ctl && ctl.signal, keepalive: !!opts.keepalive, cache: 'no-store' });
      let j = null; try { j = await r.json(); } catch (e) { }
      return { status: r.status, ok: r.ok, data: j || {} };
    } finally { if (t) clearTimeout(t); }
  }
  const localSave = () => { try { const s = LS.get(SAVE_KEY); return s ? JSON.parse(s) : null; } catch (e) { return null; } };
  const writeLocal = s => { if (s) LS.set(SAVE_KEY, JSON.stringify(s)); else LS.del(SAVE_KEY); LS.set('nv-owner', C.user || ''); };

  // Decide which save wins after signing in: the account's online save or what's on this phone.
  async function reconcile(cloud) {
    const owner = LS.get('nv-owner');
    let local = localSave();
    if (local && owner && owner !== C.user) local = null; // someone else's game on this phone: never mix them
    if (cloud && (!local || (cloud.savedAt || 0) >= (local.savedAt || 0))) { writeLocal(cloud); return; }
    if (local) { writeLocal(local); C.dirty = true; await push(); return; }
    writeLocal(null);
  }

  async function push(keepalive) {
    if (C.mode !== 'cloud' || !C.token || C.busy || C.conflict) return;
    const s = localSave(); if (!s) return;
    C.busy = true; C.dirty = false;
    try {
      const r = await api('save', { method: 'PUT', body: { save: s }, keepalive });
      if (r.status === 401) { C.token = null; LS.del('nv-token'); }
      else if (r.status === 409) { C.conflict = true; UI.toast && UI.toast('This account was played on another device. Quit to title to load the newest save.', 'bad'); }
      else if (!r.ok) C.dirty = true;
      else C.lastPush = Date.now();
    } catch (e) { C.dirty = true; } // offline: try again later
    finally { C.busy = false; }
  }
  C.push = push;

  // ---------- the sign-in screen ----------
  function authScreen() {
    return new Promise(done => {
      const t = $('title');
      const btns = t.querySelector('.tbtns'); if (btns) btns.hidden = true;
      const box = document.createElement('div'); box.className = 'auth pix'; box.id = 'auth';
      let mode = 'login';
      const draw = (err = '') => {
        box.innerHTML = `<div class="atabs"><button type="button" data-m="login" class="${mode === 'login' ? 'on' : ''}">Sign in</button><button type="button" data-m="signup" class="${mode === 'signup' ? 'on' : ''}">Create account</button></div>
          <form id="authForm" novalidate>
            <label for="authUser">Username</label>
            <input id="authUser" autocomplete="username" autocapitalize="none" spellcheck="false" maxlength="16" placeholder="3-16 letters or numbers">
            <label for="authPass">Password</label>
            <input id="authPass" type="password" autocomplete="${mode === 'login' ? 'current-password' : 'new-password'}" maxlength="100" placeholder="${mode === 'login' ? 'Your password' : 'At least 6 characters'}">
            ${mode === 'signup' ? '<label for="authPass2">Password again</label><input id="authPass2" type="password" autocomplete="new-password" maxlength="100">' : ''}
            <p class="aerr" id="authErr" role="alert">${esc(err)}</p>
            <button type="submit" class="btn" id="authGo">${mode === 'login' ? 'Sign in' : 'Create account'}</button>
            <small>${mode === 'login' ? 'Your progress is saved to your account, so you can keep playing on any device.' : 'Pick a name only you know. If you forget your password, there is no way to reset it yet.'}</small>
          </form>`;
        box.querySelectorAll('[data-m]').forEach(b => b.onclick = () => { mode = b.dataset.m; const u = box.querySelector('#authUser').value; draw(); box.querySelector('#authUser').value = u; });
        box.querySelector('#authForm').onsubmit = async e => {
          e.preventDefault();
          const user = box.querySelector('#authUser').value.trim().toLowerCase(), pass = box.querySelector('#authPass').value;
          const errEl = box.querySelector('#authErr'), go = box.querySelector('#authGo');
          if (!/^[a-z0-9_]{3,16}$/.test(user)) { errEl.textContent = 'Usernames are 3-16 letters, numbers or _.'; return; }
          if (pass.length < 6) { errEl.textContent = 'Passwords need at least 6 characters.'; return; }
          if (mode === 'signup' && pass !== box.querySelector('#authPass2').value) { errEl.textContent = "The two passwords don't match."; return; }
          go.disabled = true; go.textContent = mode === 'login' ? 'Signing in...' : 'Creating...'; errEl.textContent = '';
          try {
            const r = await api(mode === 'login' ? 'login' : 'signup', { method: 'POST', body: { username: user, password: pass } });
            if (!r.ok) { errEl.textContent = r.data.error || 'Could not reach the server. Check your connection.'; go.disabled = false; go.textContent = mode === 'login' ? 'Sign in' : 'Create account'; return; }
            C.token = r.data.token; C.user = r.data.username; LS.set('nv-token', C.token); LS.set('nv-user', C.user);
            await reconcile(r.data.save);
            box.remove(); if (btns) btns.hidden = false;
            done(true);
          } catch (err) { errEl.textContent = 'Could not reach the server. Check your connection and try again.'; go.disabled = false; go.textContent = mode === 'login' ? 'Sign in' : 'Create account'; }
        };
      };
      draw();
      t.appendChild(box);
      setTimeout(() => { const u = box.querySelector('#authUser'); if (u && matchMedia('(pointer: fine)').matches) u.focus(); }, 50);
    });
  }

  // ---------- start-up: find out whether this copy has a server, then sign in ----------
  C.start = async function () {
    try { const r = await api('health', {}, 5000); if (r.ok && r.data.accounts) C.mode = 'cloud'; } catch (e) { }
    if (C.mode !== 'cloud') return;
    if (C.token) {
      try {
        const r = await api('save');
        if (r.status === 401) { C.token = null; LS.del('nv-token'); }
        else if (r.ok) { C.user = r.data.username; LS.set('nv-user', C.user); await reconcile(r.data.save); }
      } catch (e) { /* offline: play the copy on this phone, it uploads later */ }
    }
  };
  // shown over the title backdrop when nobody is signed in
  C.gate = async function () {
    if (C.mode !== 'cloud' || C.token) return;
    await authScreen();
    UI.title(); // redraw the title so Continue reflects the account's save
  };

  C.signOut = async function () {
    await push();
    try { await api('logout', { method: 'POST' }); } catch (e) { }
    C.token = null; LS.del('nv-token'); LS.del('nv-user'); LS.del('nv-owner'); LS.del(SAVE_KEY); LS.del(SAVE_KEY + '-bak');
    G.noSave = true; location.reload();
  };

  // ---------- keep the online copy fresh ----------
  setInterval(() => { if (C.dirty) push(); }, 20000);
  document.addEventListener('visibilitychange', () => { if (document.hidden && C.dirty) push(true); });
  addEventListener('pagehide', () => { if (C.dirty) push(true); });
  C.onSaved = function () { if (C.mode === 'cloud' && C.token && !G.noSave) { LS.set('nv-owner', C.user || ''); C.dirty = true; } };
})();
