/* Manage screen backend for laurentservices.com/manage: password sign-in and the site's own API. */
window.LAdminBackend = (function(){
  var data = null;
  var EMPTY = { brand: {}, seo: {}, hero: { stats: [], rotate: [], industries: [] }, erp: { points: [], projects: [], slides: [] }, services: [], servicesCta: {}, pricing: { cats: [] }, faq: [], terms: {} };
  async function api(path, opts){
    opts = opts || {};
    opts.credentials = 'same-origin';
    opts.headers = Object.assign({ 'X-Requested-With': 'laurent' }, opts.headers || {});
    var r = await fetch(path, opts), j = null;
    try { j = await r.json(); } catch (e) {}
    if (!r.ok) {
      var err = new Error((j && j.error) || ('Request failed (' + r.status + ')'));
      err.code = (j && j.code) || (r.status === 401 ? 'unauthorized' : r.status === 429 ? 'rate_limited' : 'error');
      if (err.code === 'wrong_password') err.code = 'unauthorized';
      throw err;
    }
    return j;
  }
  /* Large photos are scaled to 2000 px wide WebP before upload, so they load fast and fit Vercel's upload limit. */
  function shrink(file){
    return new Promise(function(resolve){
      if (file.type === 'image/gif') return resolve(file);
      var img = new Image(), url = URL.createObjectURL(file);
      img.onload = function(){
        var s = Math.min(1, 2000 / img.naturalWidth), c = document.createElement('canvas');
        c.width = Math.round(img.naturalWidth * s); c.height = Math.round(img.naturalHeight * s);
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        URL.revokeObjectURL(url);
        c.toBlob(function(b){ resolve(b && (b.size < file.size || file.size > 4e6) ? b : file); }, 'image/webp', 0.86);
      };
      img.onerror = function(){ URL.revokeObjectURL(url); resolve(file); };
      img.src = url;
    });
  }
  var json = function(d){ return { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(d) }; };
  return {
    mode: 'page',
    data: function(){ return data || EMPTY; },
    init: async function(){
      try { var s = await api('/api/session'); if (s.ok) { data = s.data; return { editor: true, canUpload: true, data: s.data }; } } catch (e) {}
      return { needLogin: true };
    },
    login: async function(pw){
      try { var r = await api('/api/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password: pw }) }); data = r.data; return r; }
      catch (e) { throw new Error(e.message); }
    },
    logout: function(){ return api('/api/logout', { method: 'POST' }).catch(function(){}); },
    publish: async function(d){ var r = await api('/api/content', json(d)); data = r.data; return r; },
    upload: async function(file){
      var b = await shrink(file);
      var r = await api('/api/upload', { method: 'POST', headers: { 'Content-Type': b.type || file.type }, body: b });
      return r.url;
    },
    preview: function(d){
      var w = window.open('', '_blank');
      if (!w) { alert('Allow pop-ups for this site to see the preview.'); return; }
      w.document.write('<p style="font:16px system-ui;padding:24px">Building preview…</p>');
      fetch('/api/preview', { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'laurent' }, body: JSON.stringify(d) })
        .then(function(r){ return r.text().then(function(t){ if (!r.ok) throw new Error(t); return t; }); })
        .then(function(html){ w.document.open(); w.document.write(html); w.document.close(); })
        .catch(function(e){ w.document.body.innerHTML = '<p style="font:16px system-ui;padding:24px">Preview failed. ' + String(e.message).replace(/</g, '&lt;') + '</p>'; });
    },
    security: function(){
      setTimeout(function(){
        var el = document.getElementById('siteStatus'); if (!el) return;
        api('/api/status').then(function(s){
          var when = s.lastPublished ? new Date(s.lastPublished).toLocaleString() : 'not yet';
          var ok = s.storage === 'Vercel Blob' || s.storage === 'local .data folder';
          el.innerHTML = '<div class="ad-grid">' +
            '<div><b>Storage</b><br><span style="color:' + (ok ? '#1F7A4C' : '#B4321F') + '">' + s.storage + '</span></div>' +
            '<div><b>Last publish</b><br>' + when + '</div>' +
            '<div><b>Saved versions</b><br>' + (s.versions == null ? 'n/a' : s.versions) + '</div>' +
            '<div><b>Deployment</b><br>' + (s.deployedAt || 'local') + '</div></div>' +
            (s.storage === 'not connected' ? '<p class="ad-msg err" style="margin-top:12px">Vercel hasn\'t given this deployment access to Blob. In Vercel, open Deployments, click the three dots on the latest one and choose Redeploy.</p>' : '') +
            (s.error ? '<p class="ad-msg err" style="margin-top:12px">' + s.error.replace(/</g, '&lt;') + '</p>' : '');
        }).catch(function(e){ el.textContent = 'Could not read the status: ' + e.message; });
      }, 0);
      return '<div class="ad-card"><h4>Site status</h4><div id="siteStatus">Checking…</div></div>' +
        '<h3>Password & security</h3><p class="hint">Only people with the password can open this page. Sessions end after 12 hours, and 5 wrong passwords lock sign-in for 15 minutes.</p>' +
        '<form class="ad-card" id="pwForm"><h4>Change password</h4><div class="ad-grid">' +
        '<div class="ad-f full"><label for="pw-cur">Current password</label><input id="pw-cur" type="password" autocomplete="current-password" required></div>' +
        '<div class="ad-f"><label for="pw-new">New password</label><input id="pw-new" type="password" autocomplete="new-password" minlength="10" required><small>At least 10 characters. A short sentence works well.</small></div>' +
        '<div class="ad-f"><label for="pw-new2">New password again</label><input id="pw-new2" type="password" autocomplete="new-password" required></div>' +
        '</div><p style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin:14px 0 0"><button class="ad-btn pri" type="submit">Change password</button><span class="ad-msg" id="pwMsg" role="status"></span></p>' +
        '<p class="hint" style="margin:12px 0 0">Changing it signs out every other browser.</p></form>' +
        '<div class="ad-card"><h4>Sign out</h4><p class="hint" style="margin:0 0 12px">Sign out when you\'re on a shared computer.</p><button type="button" class="ad-btn lt" data-act="logout">Sign out</button></div>';
    },
    changePassword: function(cur, next){ return api('/api/password', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ current: cur, next: next }) }); }
  };
})();
document.addEventListener('submit', async function(e){
  if (e.target.id !== 'pwForm') return;
  e.preventDefault();
  var m = document.getElementById('pwMsg'), n1 = document.getElementById('pw-new').value, n2 = document.getElementById('pw-new2').value;
  m.className = 'ad-msg err';
  if (n1.length < 10) { m.textContent = 'Use at least 10 characters.'; return; }
  if (n1 !== n2) { m.textContent = 'The new passwords don\'t match.'; return; }
  try { await window.LAdminBackend.changePassword(document.getElementById('pw-cur').value, n1); m.className = 'ad-msg ok'; m.textContent = 'Password changed.'; e.target.reset(); }
  catch (err) { m.textContent = err.message; }
});
