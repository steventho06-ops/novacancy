const L = require('./_lib');
module.exports = L.wrap(async (req, res) => {
  const u = await L.userFromReq(req);
  if (u) await L.redis('DEL', 'session:' + u.token);
  L.send(res, 200, { ok: true });
});
