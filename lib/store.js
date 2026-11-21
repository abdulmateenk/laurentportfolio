/*
 * Where content, uploads and the admin password hash are kept.
 * On Vercel: Vercel Blob. Works with either kind of connection Vercel creates:
 *   - BLOB_STORE_ID (newer; signs in with Vercel's built-in OIDC token), or
 *   - BLOB_READ_WRITE_TOKEN (older).
 * Works with public or private stores. With a private store, uploaded images are served through /api/file.
 * Locally without either: the .data/ folder, so `npm run dev` works offline.
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const USE_BLOB = !!(process.env.BLOB_STORE_ID || process.env.BLOB_READ_WRITE_TOKEN);
const LOCAL = path.join(process.cwd(), '.data');
const CONTENT = 'site/content.json';          // local file name, and where the first version saved it
const CONTENT_PREFIX = 'site/content/';        // one new file per publish, so no cached copy is ever reused
const AUTH_PREFIX = 'secure/admin-auth';
const KEEP_VERSIONS = 20;

let blob = null;
function sdk() { if (!blob) blob = require('@vercel/blob'); return blob; }

/* Public or private store? Set BLOB_ACCESS to skip detection; otherwise the first write finds out. */
let access = process.env.BLOB_ACCESS === 'private' || process.env.BLOB_ACCESS === 'public' ? process.env.BLOB_ACCESS : null;
const looksPrivate = (e) => /private/i.test(String(e && e.message));
async function put(name, body, opts) {
  const tryAccess = access || 'public';
  try {
    const r = await sdk().put(name, body, Object.assign({ access: tryAccess }, opts));
    access = tryAccess; return r;
  } catch (e) {
    if (access || !looksPrivate(e)) throw e;
    access = 'private';
    return sdk().put(name, body, Object.assign({ access: 'private' }, opts));
  }
}
async function readText(urlOrPath) {
  const order = access ? [access] : ['public', 'private'];
  let last;
  for (const a of order) {
    try {
      const r = await sdk().get(urlOrPath, { access: a, useCache: false });
      if (!r || !r.stream) return null;
      access = a;
      return await new Response(r.stream).text();
    } catch (e) { last = e; }
  }
  throw last;
}

async function newest(prefix) {
  const { blobs } = await sdk().list({ prefix, limit: 1000 });
  if (!blobs.length) return null;
  return blobs.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt))[0];
}
async function readJson(localName, prefix) {
  if (USE_BLOB) {
    const b = await newest(prefix || localName);
    if (!b) return null;
    const text = await readText(b.url);
    return text ? JSON.parse(text) : null;
  }
  const f = path.join(LOCAL, localName);
  return fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, 'utf8')) : null;
}
function writeLocal(name, body) {
  const f = path.join(LOCAL, name);
  fs.mkdirSync(path.dirname(f), { recursive: true });
  fs.writeFileSync(f, body);
}
async function prune(prefix, keep) {
  try {
    const { blobs } = await sdk().list({ prefix, limit: 1000 });
    const old = blobs.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt)).slice(keep);
    if (old.length) await sdk().del(old.map((b) => b.url));
  } catch (e) { /* tidying up can wait for the next save */ }
}

async function getContent() {
  if (!USE_BLOB) return readJson(CONTENT);
  return (await readJson(CONTENT, CONTENT_PREFIX)) || (await readJson(CONTENT, CONTENT));
}
async function setContent(data) {
  const body = JSON.stringify(data);
  if (!USE_BLOB) return writeLocal(CONTENT, body);
  await put(CONTENT_PREFIX + Date.now() + '.json', body, { addRandomSuffix: true, contentType: 'application/json', cacheControlMaxAge: 31536000 });
  await prune(CONTENT_PREFIX, KEEP_VERSIONS);
}

async function getAuth() { return readJson('secure/admin-auth.json', AUTH_PREFIX); }
async function setAuth(auth) {
  const body = JSON.stringify(auth);
  if (!USE_BLOB) return writeLocal('secure/admin-auth.json', body);
  // Random suffix keeps any public URL unguessable; only the server can list it.
  await put(AUTH_PREFIX + '.json', body, { addRandomSuffix: true, contentType: 'application/json', cacheControlMaxAge: 60 });
  await prune(AUTH_PREFIX, 1);
}

async function saveUpload(buf, contentType) {
  const ext = { 'image/png': '.png', 'image/jpeg': '.jpg', 'image/webp': '.webp', 'image/gif': '.gif' }[contentType] || '.bin';
  const name = 'uploads/' + Date.now() + '-' + crypto.randomBytes(4).toString('hex') + ext;
  if (!USE_BLOB) { writeLocal(name, buf); return '/_local/' + name; }
  const r = await put(name, buf, { addRandomSuffix: true, contentType, cacheControlMaxAge: 31536000 });
  return access === 'private' ? '/api/file?p=' + encodeURIComponent(r.pathname) : r.url;
}
/* For private stores: stream one uploaded image. */
async function openUpload(pathname) {
  if (!USE_BLOB || !/^uploads\/[\w.-]+$/.test(pathname)) return null;
  return sdk().get(pathname, { access: access || 'private', useCache: true });
}

async function info() {
  if (!USE_BLOB) return { versions: null, lastPublished: null };
  const { blobs } = await sdk().list({ prefix: CONTENT_PREFIX, limit: 1000 });
  const latest = blobs.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt))[0];
  return { versions: blobs.length, lastPublished: latest ? latest.uploadedAt : null, access: access || 'not checked yet' };
}

module.exports = { USE_BLOB, LOCAL, getContent, setContent, getAuth, setAuth, saveUpload, openUpload, info };
