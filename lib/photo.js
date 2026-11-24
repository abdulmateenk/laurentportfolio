/* GET /photos/<name>.webp (routed through /api/file?n=...) : demo food photos for the Websites card, served from this site.
   The function fetches each photo once from Unsplash (Unsplash License) and Vercel's CDN keeps it,
   so visitors' browsers never have to reach Unsplash. Only the names below are served. */
const PHOTOS = {
  'og-slide-1': ['1561758033-d89a9ad46330', 560, 320],
  'og-slide-2': ['1553979459-d2229ba7433b', 560, 320],
  'og-slide-3': ['1549611016-3a70d82b5040', 560, 320],
  'og-burger':  ['1553979459-d2229ba7433b', 240, 192],
  'og-churros': ['1624371414361-e670edf4898d', 240, 192],
  'og-shake':   ['1571856344028-9fdc8c08ac35', 240, 192]
};

module.exports = async (req, res, name) => {
  name = String(name || '').replace(/\.webp$/, '');
  const p = PHOTOS[name];
  if (!p) { res.statusCode = 404; return res.end('Not found'); }
  try {
    const r = await fetch('https://images.unsplash.com/photo-' + p[0] + '?fm=webp&fit=crop&w=' + p[1] + '&h=' + p[2] + '&q=72');
    if (!r.ok) throw new Error('upstream ' + r.status);
    const buf = Buffer.from(await r.arrayBuffer());
    res.statusCode = 200;
    res.setHeader('Content-Type', 'image/webp');
    res.setHeader('Cache-Control', 'public, max-age=604800, s-maxage=31536000, stale-while-revalidate=31536000');
    res.end(buf);
  } catch (e) {
    console.error('photo', name, e.message);
    res.statusCode = 502; res.setHeader('Cache-Control', 'no-store'); res.end('Unavailable');
  }
};
