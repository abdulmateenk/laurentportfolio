/* Local preview: `npm run dev`, then open http://localhost:3000 and http://localhost:3000/manage
   Without BLOB_READ_WRITE_TOKEN, content and uploads are saved in .data/. */
const http = require('http');
const fs = require('fs');
const path = require('path');
process.env.ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || (process.env.ADMIN_PASSWORD_HASH ? '' : 'laurent-dev-password');
if (!process.env.ADMIN_PASSWORD) delete process.env.ADMIN_PASSWORD;
const routes = { '/': ['page', ''], '/terms': ['page', 'view=terms'], '/sitemap.xml': ['sitemap', ''], '/robots.txt': ['robots', ''] };
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg', '.gif': 'image/gif', '.svg': 'image/svg+xml', '.json': 'application/json' };
const PORT = +process.env.PORT || 3000;
http.createServer((req, res) => {
  const u = new URL(req.url, 'http://localhost');
  let p = u.pathname;
  if (p.startsWith('/photos/') && !fs.existsSync(path.join(__dirname, '..', 'public', p))) { req.url = '/api/file?n=' + encodeURIComponent(p.slice(8)); p = '/api/file'; }
  if (routes[p]) { req.url = '/api/' + routes[p][0] + (routes[p][1] ? '?' + routes[p][1] : ''); p = '/api/' + routes[p][0]; }
  if (p.startsWith('/api/')) {
    const f = path.join(__dirname, '..', 'api', p.slice(5).replace(/[^a-z]/g, '') + '.js');
    if (!fs.existsSync(f)) { res.statusCode = 404; return res.end('Not found'); }
    return Promise.resolve(require(f)(req, res)).catch((e) => { console.error(e); res.statusCode = 500; res.end('Error'); });
  }
  const file = p.startsWith('/_local/') ? path.join(process.cwd(), '.data', p.slice(8)) : path.join(__dirname, '..', 'public', p === '/manage' ? 'manage.html' : p);
  if (!file.startsWith(path.join(__dirname, '..')) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.statusCode = 404; return res.end('Not found'); }
  res.setHeader('Content-Type', TYPES[path.extname(file)] || 'application/octet-stream');
  fs.createReadStream(file).pipe(res);
}).listen(PORT, () => console.log('Laurent site on http://localhost:' + PORT + '  ·  Manage: http://localhost:' + PORT + '/manage' + (process.env.ADMIN_PASSWORD ? '  (password: ' + process.env.ADMIN_PASSWORD + ')' : '')));
