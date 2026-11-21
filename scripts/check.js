/* `npm run check`: renders the default content for home and terms and checks the basics. */
const site = require('../lib/site');
const problem = site.validate(site.DEFAULTS);
if (problem) { console.error('Content problem:', problem); process.exit(1); }
const home = site.renderPage(site.DEFAULTS, { view: 'home', base: 'https://laurentservices.com' });
const terms = site.renderPage(site.DEFAULTS, { view: 'terms', base: 'https://laurentservices.com' });
const must = [[home, '<title>'], [home, 'application/ld+json'], [home, 'rel="canonical"'], [terms, 'Terms &amp; Conditions |'], [home, 'id="pricing"']];
const missing = must.filter(([h, s]) => !h.includes(s));
if (missing.length) { console.error('Missing:', missing.map((m) => m[1])); process.exit(1); }
if (/#admin|\/manage/.test(home)) { console.error('The public page must not link to the Manage page.'); process.exit(1); }
console.log('OK  home', home.length, 'bytes · terms', terms.length, 'bytes');
