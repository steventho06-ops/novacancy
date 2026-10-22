// Shared helpers for the account + cloud-save API.
// Storage: Upstash Redis over its REST API (added to the Vercel project from the Storage tab).
const crypto = require('crypto');

const URL_ = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

async function redis(...cmd) {
  if (!URL_ || !TOKEN) throw Object.assign(new Error('Cloud saves are not set up yet (no database connected).'), { status: 503 });
  const r = await fetch(URL_, { method: 'POST', headers: { Authorization: 'Bearer ' + TOKEN, 'Content-Type': 'application/json' }, body: JSON.stringify(cmd) });
  const j = await r.json().catch(() => ({}));
  if (!r.ok || j.error) throw Object.assign(new Error('Database error: ' + (j.error || r.status)), { status: 502 });
  return j.result;
}

const SESSION_DAYS = 180;
function hashPw(pw, salt) { return crypto.scryptSync(pw, salt, 64).toString('hex'); }
function newToken() { return crypto.randomBytes(32).toString('hex'); }
function cleanName(n) { return String(n || '').trim().toLowerCase(); }
function validName(n) { return /^[a-z0-9_]{3,16}$/.test(n); }

async function userFromReq(req) {
  const h = req.headers.authorization || '';
  const t = h.startsWith('Bearer ') ? h.slice(7).trim() : '';
  if (!/^[a-f0-9]{64}$/.test(t)) return null;
  const name = await redis('GET', 'session:' + t);
  return name ? { name, token: t } : null;
}

// a few attempts per minute per address, so passwords can't be guessed quickly
async function limited(req, what, max) {
  const ip = String(req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'x').split(',')[0].trim();
  const k = 'rl:' + what + ':' + ip;
  const n = await redis('INCR', k);
  if (n === 1) await redis('EXPIRE', k, 60);
  return n > max;
}

function send(res, status, body) { res.status(status).setHeader('Cache-Control', 'no-store'); res.json(body); }
function wrap(fn) {
  return async (req, res) => {
    try { await fn(req, res); }
    catch (e) { send(res, e.status || 500, { error: e.status ? e.message : 'Something went wrong on the server.' }); }
  };
}
function body(req) { if (req.body && typeof req.body === 'object') return req.body; try { return JSON.parse(req.body || '{}'); } catch (e) { return {}; } }

module.exports = { redis, hashPw, newToken, cleanName, validName, userFromReq, limited, send, wrap, body, SESSION_DAYS, crypto, hasDb: () => !!(URL_ && TOKEN) };
