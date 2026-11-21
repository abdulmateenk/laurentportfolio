/* PUT /api/content → save and publish the site content (signed in only). */
const auth = require('../lib/auth');
const site = require('../lib/site');
const store = require('../lib/store');
const { send, fail, readJson, sameOrigin } = require('../lib/http');

module.exports = async (req, res) => {
  if (!(await auth.isSignedIn(req))) return fail(res, 401, 'unauthorized', 'Sign in again.');
  if (req.method === 'GET') return send(res, 200, { data: await site.content(true) });
  if (req.method !== 'PUT') return fail(res, 405, 'method', 'Use PUT.');
  if (!sameOrigin(req)) return fail(res, 403, 'forbidden', 'Save from the Manage page.');
  let data;
  try { data = await readJson(req, 600 * 1024); } catch (e) { return fail(res, 400, e.code || 'bad_request', e.code === 'too_large' ? 'The content is too large.' : 'Bad request.'); }
  const problem = site.validate(data);
  if (problem) return fail(res, 422, 'invalid', problem);
  if (process.env.VERCEL && !store.USE_BLOB) return fail(res, 500, 'not_configured', 'Vercel Blob isn\'t connected to this deployment. In Vercel open Storage, connect the Blob store to this project for Production, then redeploy.');
  try { await store.setContent(data); } catch (e) { return fail(res, 500, 'save_failed', 'Saving failed: ' + e.message); }
  site.remember(data);
  send(res, 200, { ok: true, data });
};
