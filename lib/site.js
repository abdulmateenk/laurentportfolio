/* Renders the public page (and the Terms page) from the template and the current content. */
const fs = require('fs');
const path = require('path');
const LR = require('./render');
const store = require('./store');

const TEMPLATE = fs.readFileSync(path.join(process.cwd(), 'site', 'template.html'), 'utf8');
const DEFAULTS = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'site', 'content.json'), 'utf8'));

let cache = { at: 0, data: null };
async function content(fresh) {
  if (!fresh && cache.data && Date.now() - cache.at < 5000) return cache.data;
  let data = null;
  try { data = await store.getContent(); } catch (e) { console.error('content read failed', e.message); }
  cache = { at: Date.now(), data: data || DEFAULTS };
  return cache.data;
}
function remember(data) { cache = { at: Date.now(), data }; }

function siteUrl(req) {
  if (process.env.SITE_URL) return process.env.SITE_URL.replace(/\/$/, '');
  const proto = String(req.headers['x-forwarded-proto'] || 'https').split(',')[0];
  return proto + '://' + req.headers.host;
}

function renderPage(data, opts) {
  const view = opts.view || 'home', base = opts.base;
  let src = LR.build(TEMPLATE, data);
  const cut = src.indexOf('<!--HEAD-END-->');
  let head = src.slice(0, cut), body = src.slice(cut + '<!--HEAD-END-->'.length);
  const canonical = base + (view === 'terms' ? '/terms' : '/');
  if (view === 'terms') {
    head = head.replace(/<title>([^<]*)<\/title>/, '<title>Terms &amp; Conditions | $1</title>')
      .replace(/(<meta property="og:title" content=")([^"]*)"/, '$1Terms &amp; Conditions | $2"');
  }
  head += '<link rel="canonical" href="' + canonical + '"><meta property="og:url" content="' + canonical + '">' +
    '<link rel="icon" href="/favicon.svg" type="image/svg+xml">' + (opts.preview ? '<meta name="robots" content="noindex">' : '');
  if (view === 'home') { const a = body.indexOf('<section id="terms-view"'), b = body.indexOf('</section>', a); if (a > -1 && b > -1) body = body.slice(0, a) + body.slice(b + 10); }
  body = body.replace(/href="#terms"/g, 'href="/terms"').replace('<a class="back" href="#top">', '<a class="back" href="/">');
  if (opts.preview) body = '<div style="position:fixed;z-index:999;left:50%;top:10px;transform:translateX(-50%);background:#0A0A0A;color:#fff;padding:8px 14px;border-radius:999px;font:600 13px system-ui">Preview, not published</div>' + body;
  return '<!doctype html><html lang="en"><head><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">' +
    '<style>body{margin:0}img{max-width:100%}</style>' + head + '</head><body' + (view === 'terms' ? ' class="v-terms"' : '') + '>' + body + '</body></html>';
}

/* Light checks so a broken save can't take the site down. Everything is escaped when rendered. */
function validate(d) {
  const ok = d && typeof d === 'object' && d.brand && d.seo && d.hero && d.erp && Array.isArray(d.services) && d.servicesCta &&
    d.pricing && Array.isArray(d.pricing.cats) && Array.isArray(d.faq) && d.terms;
  if (!ok) return 'The content is missing a section. Reload the Manage page and try again.';
  const imgs = [].concat(d.erp.slides.map((s) => s.src), d.services.filter((s) => s.img).map((s) => s.img));
  if (imgs.some((u) => !/^(\/|https:\/\/)/.test(String(u || '/')))) return 'Image links must start with https:// or /.';
  try { LR.build(TEMPLATE, d); } catch (e) { return 'The content could not be rendered: ' + e.message; }
  return null;
}

module.exports = { content, remember, renderPage, siteUrl, validate, DEFAULTS };
