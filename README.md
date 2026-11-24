# Laurent Services

Landing page for Laurent: websites, branding and ERP back offices for small businesses in Pakistan.
It runs on Vercel and has a password-protected editor at `/manage`.

## How it works

- `/` and `/terms` are rendered on the server (`api/page.js`) from `site/template.html` and the current content.
- Content is a JSON document. Defaults live in `site/content.json`. Changes published from `/manage` are saved to Vercel Blob (`site/content/<timestamp>.json`, last 20 kept), so the live site updates without a redeploy.
- Images uploaded in `/manage` go to Blob too (max 4 MB each).
- `lib/render.js` builds each page section from the content. It is a copy of `public/assets/render.js`; after editing that file run `npm run sync-render`.

## Vercel settings

| Variable | Needed | What it is |
|---|---|---|
| `ADMIN_PASSWORD_HASH` | yes | Password for `/manage`. Make a hash with `node scripts/hash-password.js "your password"` (a plain password also works, but a hash is safer). |
| `SESSION_SECRET` | recommended | Any long random string. Signs the sign-in cookie. |
| Blob store | yes | Connect a Blob store to the project (gives `BLOB_STORE_ID` or `BLOB_READ_WRITE_TOKEN`). |
| `SITE_URL` | optional | Your domain, e.g. `https://laurentservices.com`, for canonical links and the sitemap. |

The password can also be changed from `/manage` → Password & security; that change is stored in Blob and takes over from the environment variable.

## Local development

```bash
npm install
ADMIN_PASSWORD_HASH=test node scripts/dev-server.js   # http://localhost:3000
node scripts/check.js                                 # renders the pages and checks for problems
```

Without Blob settings, local runs save content and uploads to `.data/`.
