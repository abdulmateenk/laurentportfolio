/* POST /api/upload (raw image body) → stores the image and returns its URL (signed in only). */
const auth = require('../lib/auth');
const store = require('../lib/store');
const { send, fail, readBody, sameOrigin } = require('../lib/http');

const TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'];
const LIMIT = 4 * 1024 * 1024; // Vercel functions accept bodies up to 4.5 MB; the Manage page shrinks images first.

module.exports = async (req, res) => {
  if (req.method !== 'POST') return fail(res, 405, 'method', 'Use POST.');
  if (!(await auth.isSignedIn(req))) return fail(res, 401, 'unauthorized', 'Sign in again.');
  if (!sameOrigin(req)) return fail(res, 403, 'forbidden', 'Upload from the Manage page.');
  const type = String(req.headers['content-type'] || '').split(';')[0].trim();
  if (!TYPES.includes(type)) return fail(res, 415, 'bad_type', 'Use a JPG, PNG, WebP or GIF image.');
  if (process.env.VERCEL && !store.USE_BLOB) return fail(res, 500, 'not_configured', 'Connect a Blob store to this Vercel project so images can be uploaded.');
  let buf;
  try { buf = await readBody(req, LIMIT); } catch (e) { return fail(res, 413, 'too_large', 'That image is over 4 MB. Use a smaller one.'); }
  if (!buf.length) return fail(res, 400, 'empty', 'The image was empty.');
  try { send(res, 200, { url: await store.saveUpload(buf, type) }); }
  catch (e) { fail(res, 500, 'upload_failed', 'Upload failed: ' + e.message); }
};
