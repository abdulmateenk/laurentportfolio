/* GET /api/status (signed in only): is storage connected, and which content is the live page using? */
const auth = require('../lib/auth');
const store = require('../lib/store');
const { send, fail } = require('../lib/http');

module.exports = async (req, res) => {
  if (!(await auth.isSignedIn(req))) return fail(res, 401, 'unauthorized', 'Sign in again.');
  const out = { storage: store.USE_BLOB ? 'Vercel Blob' : (process.env.VERCEL ? 'not connected' : 'local .data folder'), deployedAt: process.env.VERCEL_GIT_COMMIT_SHA ? process.env.VERCEL_GIT_COMMIT_SHA.slice(0, 7) : null };
  try { Object.assign(out, await store.info()); } catch (e) { out.error = e.message; }
  send(res, 200, out);
};
