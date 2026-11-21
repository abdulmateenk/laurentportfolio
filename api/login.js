/* POST /api/login { password } → signed session cookie. */
const auth = require('../lib/auth');
const site = require('../lib/site');
const { send, fail, readJson, sameOrigin } = require('../lib/http');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return fail(res, 405, 'method', 'Use POST.');
  if (!sameOrigin(req)) return fail(res, 403, 'forbidden', 'Sign in from the Manage page.');
  if (auth.locked(req)) return fail(res, 429, 'rate_limited', 'Too many wrong passwords. Try again in 15 minutes.');
  let body;
  try { body = await readJson(req, 4096); } catch (e) { return fail(res, 400, 'bad_request', 'Bad request.'); }
  let ok = false;
  try { ok = await auth.checkPassword(body.password || ''); }
  catch (e) { return fail(res, 500, e.code || 'error', e.message); }
  if (!ok) {
    auth.failed(req);
    await new Promise((r) => setTimeout(r, 600));
    return fail(res, 401, 'wrong_password', 'Wrong password.');
  }
  auth.succeeded(req);
  try { await auth.startSession(req, res); } catch (e) { return fail(res, 500, e.code || 'error', e.message); }
  send(res, 200, { ok: true, data: await site.content(true) });
};
