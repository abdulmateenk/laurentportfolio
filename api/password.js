/* POST /api/password { current, next } → change the admin password (signed in only). Signs out other sessions. */
const auth = require('../lib/auth');
const store = require('../lib/store');
const { send, fail, readJson, sameOrigin } = require('../lib/http');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return fail(res, 405, 'method', 'Use POST.');
  if (!(await auth.isSignedIn(req))) return fail(res, 401, 'unauthorized', 'Sign in again.');
  if (!sameOrigin(req)) return fail(res, 403, 'forbidden', 'Not allowed.');
  if (auth.locked(req)) return fail(res, 429, 'rate_limited', 'Too many wrong passwords. Try again in 15 minutes.');
  if (process.env.VERCEL && !store.USE_BLOB) return fail(res, 500, 'not_configured', 'Connect a Blob store to this Vercel project first.');
  let b;
  try { b = await readJson(req, 4096); } catch (e) { return fail(res, 400, 'bad_request', 'Bad request.'); }
  const r = await auth.changePassword(b.current || '', b.next || '');
  if (!r.ok) { if (/current/.test(r.error)) auth.failed(req); return fail(res, 400, 'invalid', r.error); }
  await auth.startSession(req, res); // keep this browser signed in with the new password
  send(res, 200, { ok: true });
};
