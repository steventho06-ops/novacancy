const { send, hasDb } = require('./_lib');
module.exports = (req, res) => send(res, 200, { ok: true, accounts: true, db: hasDb() });
