/* GET / and /terms: the public site, rendered on the server so search engines see the real content. */
const site = require('../lib/site');

module.exports = async (req, res) => {
  const url = new URL(req.url, 'http://x');
  const view = url.searchParams.get('view') === 'terms' ? 'terms' : 'home';
  const data = await site.content();
  const html = site.renderPage(data, { view, base: site.siteUrl(req) });
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  // Never cached: a publish from /manage shows on the next page load.
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  res.setHeader('CDN-Cache-Control', 'no-store');
  res.setHeader('Vercel-CDN-Cache-Control', 'no-store');
  res.end(html);
};
