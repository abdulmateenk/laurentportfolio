/*
 * Where content, uploads and the admin password hash are kept.
 * On Vercel: Vercel Blob (connect a Blob store to the project; it adds BLOB_READ_WRITE_TOKEN).
 * Locally without a token: the .data/ folder, so `npm run dev` works offline.
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const USE_BLOB = !!process.env.BLOB_READ_WRITE_TOKEN;
const LOCAL = path.join(process.cwd(), '.data');
const CONTENT = 'site/content.json';
const AUTH_PREFIX = 'secure/admin-auth';

let blob = null;
function sdk() { if (!blob) blob = require('@vercel/blob'); return blob; }

async function newest(prefix) {
  const { blobs } = await sdk().list({ prefix, limit: 100 });
  if (!blobs.length) return null;
  return blobs.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt))[0];
}

async function readJson(name, prefix) {
  if (USE_BLOB) {
    const b = await newest(prefix || name);
    if (!b) return null;
    const r = await fetch(b.url + '?v=' + encodeURIComponent(b.uploadedAt), { cache: 'no-store' });
    if (!r.ok) throw new Error('Could not read ' + name + ' (' + r.status + ')');
    return r.json();
  }
  const f = path.join(LOCAL, name);
  return fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, 'utf8')) : null;
}

async function writeJson(name, obj, opts = {}) {
  const body = JSON.stringify(obj);
  if (USE_BLOB) {
    if (opts.secret) {
      // Random suffix keeps the public URL unguessable; only the server can list it.
      const old = await sdk().list({ prefix: AUTH_PREFIX });
      await sdk().put(AUTH_PREFIX + '.json', body, { access: 'public', addRandomSuffix: true, contentType: 'application/json', cacheControlMaxAge: 60 });
      if (old.blobs.length) await sdk().del(old.blobs.map((b) => b.url));
      return;
    }
    await sdk().put(name, body, { access: 'public', addRandomSuffix: false, allowOverwrite: true, contentType: 'application/json', cacheControlMaxAge: 60 });
    return;
  }
  const f = path.join(LOCAL, name);
  fs.mkdirSync(path.dirname(f), { recursive: true });
  fs.writeFileSync(f, body);
}

async function saveUpload(buf, contentType) {
  const ext = { 'image/png': '.png', 'image/jpeg': '.jpg', 'image/webp': '.webp', 'image/gif': '.gif' }[contentType] || '.bin';
  const name = 'uploads/' + Date.now() + '-' + crypto.randomBytes(4).toString('hex') + ext;
  if (USE_BLOB) {
    const r = await sdk().put(name, buf, { access: 'public', addRandomSuffix: true, contentType, cacheControlMaxAge: 31536000 });
    return r.url;
  }
  const f = path.join(LOCAL, name);
  fs.mkdirSync(path.dirname(f), { recursive: true });
  fs.writeFileSync(f, buf);
  return '/_local/' + name;
}

module.exports = {
  USE_BLOB,
  LOCAL,
  getContent: () => readJson(CONTENT),
  setContent: (data) => writeJson(CONTENT, data),
  getAuth: () => readJson('secure/admin-auth.json', AUTH_PREFIX),
  setAuth: (auth) => writeJson('secure/admin-auth.json', auth, { secret: true }),
  saveUpload,
};
