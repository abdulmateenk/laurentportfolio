/* GET /api/file?p=uploads/... : serves an uploaded image when the Blob store is private. */
const store = require('../lib/store');
const photo = require('../lib/photo');

module.exports = async (req, res) => {
  const q = new URL(req.url, 'http://x').searchParams;
  if (q.get('n')) return photo(req, res, q.get('n'));
  const p = q.get('p') || '';
  try {
    const r = await store.openUpload(p);
    if (!r || !r.stream) { res.statusCode = 404; return res.end('Not found'); }
    res.statusCode = 200;
    res.setHeader('Content-Type', r.blob.contentType || 'application/octet-stream');
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    const buf = Buffer.from(await new Response(r.stream).arrayBuffer());
    res.end(buf);
  } catch (e) { res.statusCode = 404; res.end('Not found'); }
};
