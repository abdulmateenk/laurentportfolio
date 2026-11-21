/* GET /robots.txt */
const site = require('../lib/site');
module.exports = (req, res) => {
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Cache-Control', 'public, s-maxage=3600');
  res.end('User-agent: *\nAllow: /\nDisallow: /manage\nDisallow: /api/\n\nSitemap: ' + site.siteUrl(req) + '/sitemap.xml\n');
};
