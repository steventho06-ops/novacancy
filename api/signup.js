const L = require('./_lib');
module.exports = L.wrap(async (req, res) => {
  if (req.method !== 'POST') return L.send(res, 405, { error: 'Use POST.' });
  if (await L.limited(req, 'signup', 5)) return L.send(res, 429, { error: 'Too many tries. Wait a minute and try again.' });
  const b = L.body(req), name = L.cleanName(b.username), pw = String(b.password || '');
  if (!L.validName(name)) return L.send(res, 400, { error: 'Usernames are 3-16 letters, numbers or _.' });
  if (pw.length < 6 || pw.length > 100) return L.send(res, 400, { error: 'Passwords need at least 6 characters.' });
  const salt = L.crypto.randomBytes(16).toString('hex');
  const rec = JSON.stringify({ salt, hash: L.hashPw(pw, salt), created: Date.now() });
  const ok = await L.redis('SET', 'user:' + name, rec, 'NX');
  if (ok !== 'OK') return L.send(res, 409, { error: 'That username is taken. Try another one.' });
  const token = L.newToken();
  await L.redis('SET', 'session:' + token, name, 'EX', L.SESSION_DAYS * 86400);
  L.send(res, 200, { token, username: name, save: null });
});
