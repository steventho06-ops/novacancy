const L = require('./_lib');
module.exports = L.wrap(async (req, res) => {
  if (req.method !== 'POST') return L.send(res, 405, { error: 'Use POST.' });
  if (await L.limited(req, 'login', 10)) return L.send(res, 429, { error: 'Too many tries. Wait a minute and try again.' });
  const b = L.body(req), name = L.cleanName(b.username), pw = String(b.password || '');
  const raw = L.validName(name) ? await L.redis('GET', 'user:' + name) : null;
  const bad = () => L.send(res, 401, { error: 'Wrong username or password.' });
  if (!raw) return bad();
  const u = JSON.parse(raw);
  const a = Buffer.from(L.hashPw(pw, u.salt), 'hex'), h = Buffer.from(u.hash, 'hex');
  if (a.length !== h.length || !L.crypto.timingSafeEqual(a, h)) return bad();
  const token = L.newToken();
  await L.redis('SET', 'session:' + token, name, 'EX', L.SESSION_DAYS * 86400);
  const save = await L.redis('GET', 'save:' + name);
  L.send(res, 200, { token, username: name, save: save ? JSON.parse(save) : null });
});
