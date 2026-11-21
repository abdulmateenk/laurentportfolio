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
const CONTENT = 'site/content.json';          // local file name
const CONTENT_PREFIX = 'site/content/';        // on Blob: one new file per publish, so no cached copy is ever reused
const KEEP_VERSIONS = 20;
const AUTH_PREFIX = 'secure/admin-auth';

let blob = null;
function sdk() { if (!blob) blob = require('@vercel/blob'); return blob; }

async function newest(prefix) {
  const { blobs } = await sdk().list({ prefix, limit: 1000 });
  if (!blobs.length) return null;
  return blobs.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt))[0];
}

async function readJson(name, prefix) {
  if (USE_BLOB) {
    const b = await newest(prefix || name);
    if (!b) return null;
    const r = await fetch(b.url, { cache: 'no-store' });
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

async function getContent() {
  if (!USE_BLOB) return readJson(CONTENT);
  const latest = await readJson(CONTENT, CONTENT_PREFIX);
  return latest || readJson(CONTENT); // falls back to a file saved by the first version of this site
}

async function setContent(data) {
  if (!USE_BLOB) return writeJson(CONTENT, data);
  // A new, uniquely named file each time: the URL has never been cached anywhere.
  await sdk().put(CONTENT_PREFIX + Date.now() + '.json', JSON.stringify(data), { access: 'public', addRandomSuffix: true, contentType: 'application/json', cacheControlMaxAge: 31536000 });
  try {
    const { blobs } = await sdk().list({ prefix: CONTENT_PREFIX, limit: 1000 });
    const old = blobs.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt)).slice(KEEP_VERSIONS);
    if (old.length) await sdk().del(old.map((b) => b.url));
  } catch (e) { /* tidying up old versions can wait for the next publish */ }
}

async function info() {
  if (!USE_BLOB) return { versions: null, lastPublished: null };
  const { blobs } = await sdk().list({ prefix: CONTENT_PREFIX, limit: 1000 });
  const latest = blobs.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt))[0];
  return { versions: blobs.length, lastPublished: latest ? latest.uploadedAt : null };
}

module.exports = {
  info,
  USE_BLOB,
  LOCAL,
  getContent,
  setContent,
  getAuth: () => readJson('secure/admin-auth.json', AUTH_PREFIX),
  setAuth: (auth) => writeJson('secure/admin-auth.json', auth, { secret: true }),
  saveUpload,
};
