/* POST /api/preview → renders unsaved content so it can be checked before publishing (signed in only). */
const auth = require('../lib/auth');
const site = require('../lib/site');
const { fail, readJson, sameOrigin } = require('../lib/http');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return fail(res, 405, 'method', 'Use POST.');
  if (!(await auth.isSignedIn(req))) return fail(res, 401, 'unauthorized', 'Sign in again.');
  if (!sameOrigin(req)) return fail(res, 403, 'forbidden', 'Not allowed.');
  let data;
  try { data = await readJson(req, 600 * 1024); } catch (e) { return fail(res, 400, 'bad_request', 'Bad request.'); }
  const problem = site.validate(data);
  if (problem) return fail(res, 422, 'invalid', problem);
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(site.renderPage(data, { view: 'home', base: site.siteUrl(req), preview: true }));
};
