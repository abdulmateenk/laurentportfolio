/* POST /api/logout → clears the session cookie. */
const auth = require('../lib/auth');
const { send, fail, sameOrigin } = require('../lib/http');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return fail(res, 405, 'method', 'Use POST.');
  if (!sameOrigin(req)) return fail(res, 403, 'forbidden', 'Not allowed.');
  auth.endSession(req, res);
  send(res, 200, { ok: true });
};
