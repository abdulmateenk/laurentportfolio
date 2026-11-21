/*
 * Password login for /manage.
 * - The password is checked against a scrypt hash: ADMIN_PASSWORD_HASH (make one with `npm run hash-password`),
 *   or a hash saved from the Manage screen after a password change (that one wins).
 * - Sessions are signed cookies (SESSION_SECRET), HttpOnly, SameSite=Strict, 12 hours.
 * - Changing the password signs every other session out.
 * - 5 wrong passwords from one address lock sign-in for 15 minutes.
 */
const crypto = require('crypto');
const store = require('./store');

const COOKIE = 'lsess';
const MAX_AGE = 12 * 60 * 60; // seconds
/* SESSION_SECRET is best. Without it, a key is derived from the admin password settings so sign-in still works. */
const ENV_SECRET = process.env.SESSION_SECRET || null;
function secretFor(hash) {
  if (ENV_SECRET) return ENV_SECRET;
  return crypto.createHash('sha256').update('laurent-session:' + String(hash || 'dev')).digest('hex');
}

function hashPassword(pw) {
  const salt = crypto.randomBytes(16);
  const key = crypto.scryptSync(String(pw), salt, 64, { N: 16384, r: 8, p: 1 });
  return 'scrypt$16384$' + salt.toString('hex') + '$' + key.toString('hex');
}
function verifyHash(pw, stored) {
  const parts = String(stored || '').split('$');
  if (parts.length !== 4 || parts[0] !== 'scrypt') return false;
  const N = parseInt(parts[1], 10), salt = Buffer.from(parts[2], 'hex'), want = Buffer.from(parts[3], 'hex');
  const got = crypto.scryptSync(String(pw), salt, want.length, { N, r: 8, p: 1 });
  return got.length === want.length && crypto.timingSafeEqual(got, want);
}

async function currentHash() {
  try { const a = await store.getAuth(); if (a && a.hash) return a.hash; } catch (e) { /* fall back to env */ }
  const envHash = (process.env.ADMIN_PASSWORD_HASH || '').trim();
  if (envHash) return envHash.startsWith('scrypt$') ? envHash : 'plain$' + envHash; // a plain password pasted here still works
  if (process.env.ADMIN_PASSWORD) return 'plain$' + process.env.ADMIN_PASSWORD; // allowed, but a hash is better
  return null;
}
async function checkPassword(pw) {
  const h = await currentHash();
  if (!h) { const e = new Error('No admin password is set. Add ADMIN_PASSWORD_HASH in Vercel → Settings → Environment Variables.'); e.code = 'not_configured'; throw e; }
  if (h.startsWith('plain$')) {
    const a = Buffer.from(h.slice(6)), b = Buffer.from(String(pw));
    return a.length === b.length && crypto.timingSafeEqual(a, b);
  }
  return verifyHash(pw, h);
}
const version = (h) => crypto.createHash('sha256').update(String(h)).digest('hex').slice(0, 12);

function sign(payload, secret) {
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  return body + '.' + crypto.createHmac('sha256', secret).update(body).digest('base64url');
}
function unsign(token, secret) {
  if (!token || token.indexOf('.') < 0) return null;
  const [body, sig] = token.split('.');
  const want = crypto.createHmac('sha256', secret).update(body).digest('base64url');
  if (sig.length !== want.length || !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(want))) return null;
  try { return JSON.parse(Buffer.from(body, 'base64url').toString()); } catch (e) { return null; }
}
function readCookie(req, name) {
  const m = String(req.headers.cookie || '').split(/;\s*/).find((c) => c.startsWith(name + '='));
  return m ? decodeURIComponent(m.slice(name.length + 1)) : null;
}
function secure(req) { return process.env.VERCEL || String(req.headers['x-forwarded-proto'] || '').includes('https'); }
function cookie(req, value, maxAge) {
  return COOKIE + '=' + value + '; Path=/; HttpOnly; SameSite=Strict; Max-Age=' + maxAge + (secure(req) ? '; Secure' : '');
}

async function startSession(req, res) {
  const h = await currentHash();
  res.setHeader('Set-Cookie', cookie(req, sign({ exp: Date.now() + MAX_AGE * 1000, v: version(h) }, secretFor(h)), MAX_AGE));
}
function endSession(req, res) { res.setHeader('Set-Cookie', cookie(req, '', 0)); }
async function isSignedIn(req) {
  const h = await currentHash();
  const p = unsign(readCookie(req, COOKIE), secretFor(h));
  if (!p || !p.exp || p.exp < Date.now()) return false;
  return p.v === version(h);
}

/* Simple lockout per address. Kept in memory, so it resets when Vercel starts a new instance. */
const tries = new Map();
function ip(req) { return String(req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').split(',')[0].trim(); }
function locked(req) { const t = tries.get(ip(req)); return !!(t && t.until > Date.now()); }
function failed(req) {
  const k = ip(req), t = tries.get(k) || { n: 0, until: 0 };
  t.n += 1; if (t.n >= 5) { t.until = Date.now() + 15 * 60 * 1000; t.n = 0; }
  tries.set(k, t);
}
function succeeded(req) { tries.delete(ip(req)); }

async function changePassword(current, next) {
  if (!(await checkPassword(current))) return { ok: false, error: 'Your current password is wrong.' };
  if (String(next).length < 10) return { ok: false, error: 'Use at least 10 characters for the new password.' };
  await store.setAuth({ hash: hashPassword(next), changedAt: new Date().toISOString() });
  return { ok: true };
}

module.exports = { hashPassword, checkPassword, startSession, endSession, isSignedIn, locked, failed, succeeded, changePassword };
