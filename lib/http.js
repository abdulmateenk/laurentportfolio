/* Small helpers shared by the API routes. */
function send(res, status, obj, headers) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  Object.entries(headers || {}).forEach(([k, v]) => res.setHeader(k, v));
  res.end(JSON.stringify(obj));
}
function fail(res, status, code, error) { send(res, status, { code, error }); }

function readBody(req, limit) {
  return new Promise((resolve, reject) => {
    const chunks = []; let size = 0;
    req.on('data', (c) => {
      size += c.length;
      if (size > limit) { reject(Object.assign(new Error('Too large'), { code: 'too_large' })); req.destroy(); return; }
      chunks.push(c);
    });
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}
async function readJson(req, limit) {
  const buf = await readBody(req, limit || 600 * 1024);
  try { return JSON.parse(buf.toString('utf8') || '{}'); } catch (e) { throw Object.assign(new Error('Bad JSON'), { code: 'bad_request' }); }
}

/* Writes must come from this site's own Manage page. */
function sameOrigin(req) {
  if (req.headers['x-requested-with'] !== 'laurent') return false;
  const origin = req.headers.origin;
  if (!origin) return true;
  try { return new URL(origin).host === req.headers.host; } catch (e) { return false; }
}

module.exports = { send, fail, readBody, readJson, sameOrigin };
