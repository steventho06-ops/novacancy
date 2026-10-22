const L = require('./_lib');
module.exports = L.wrap(async (req, res) => {
  const u = await L.userFromReq(req);
  if (!u) return L.send(res, 401, { error: 'Please sign in again.' });
  if (req.method === 'GET') {
    const s = await L.redis('GET', 'save:' + u.name);
    return L.send(res, 200, { username: u.name, save: s ? JSON.parse(s) : null });
  }
  if (req.method === 'PUT' || req.method === 'POST') {
    const b = L.body(req), s = b.save;
    if (!s || typeof s !== 'object' || !s.flags || !s.day) return L.send(res, 400, { error: 'That is not a valid save.' });
    const json = JSON.stringify(s);
    if (json.length > 400000) return L.send(res, 413, { error: 'Save is too large.' });
    // never let an older copy overwrite a newer one (two phones playing the same account)
    const cur = await L.redis('GET', 'save:' + u.name);
    if (cur && !b.force) { try { const c = JSON.parse(cur); if ((c.savedAt || 0) > (s.savedAt || 0) + 1000) return L.send(res, 409, { error: 'newer', save: c }); } catch (e) { } }
    await L.redis('SET', 'save:' + u.name, json);
    return L.send(res, 200, { ok: true, savedAt: s.savedAt || Date.now() });
  }
  L.send(res, 405, { error: 'Use GET or PUT.' });
});
