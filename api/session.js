/* GET /api/session → whether this browser is signed in, plus the content to edit. */
const auth = require('../lib/auth');
const site = require('../lib/site');
const { send } = require('../lib/http');

module.exports = async (req, res) => {
  if (!(await auth.isSignedIn(req))) return send(res, 200, { ok: false });
  send(res, 200, { ok: true, data: await site.content(true) });
};
