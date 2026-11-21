/* GET / and /terms: the public site, rendered on the server so search engines see the real content. */
const site = require('../lib/site');

module.exports = async (req, res) => {
  const url = new URL(req.url, 'http://x');
  const view = url.searchParams.get('view') === 'terms' ? 'terms' : 'home';
  const data = await site.content();
  const html = site.renderPage(data, { view, base: site.siteUrl(req) });
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=10, stale-while-revalidate=60');
  res.end(html);
};
