/* GET /sitemap.xml */
const site = require('../lib/site');
module.exports = (req, res) => {
  const base = site.siteUrl(req), today = new Date().toISOString().slice(0, 10);
  res.setHeader('Content-Type', 'application/xml; charset=utf-8');
  res.setHeader('Cache-Control', 'public, s-maxage=3600');
  res.end('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' +
    '<url><loc>' + base + '/</loc><lastmod>' + today + '</lastmod><priority>1.0</priority></url>' +
    '<url><loc>' + base + '/terms</loc><lastmod>' + today + '</lastmod><priority>0.3</priority></url></urlset>');
};
