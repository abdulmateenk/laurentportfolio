(function(){
  var B = window.LAdminBackend, LR = window.LR, esc = LR.esc;
  var $ = function(s, r){ return (r || document).querySelector(s); }, $$ = function(s, r){ return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var clone = function(o){ return JSON.parse(JSON.stringify(o)); };
  var PUBLISHED = clone(B.data()), PAGE = B.mode === 'page';
  var draft = clone(PUBLISHED), section = 'general', editor = false, needLogin = false, canUpload = false, ready = false;
  var root = $('#admin'), KEY = 'laurent-draft';

  var store = {
    get: function(){ try { var v = localStorage.getItem(KEY); return v ? JSON.parse(v) : null; } catch (e) { return null; } },
    set: function(v){ try { localStorage.setItem(KEY, JSON.stringify(v)); } catch (e) {} },
    clear: function(){ try { localStorage.removeItem(KEY); } catch (e) {} }
  };
  var same = function(a, b){ return JSON.stringify(a) === JSON.stringify(b); };
  var dirty = function(){ return !same(draft, PUBLISHED); };

  /* ---- Who can manage: decided by the backend (claude.ai edit access, or the password) ---- */
  async function boot(){
    var r = await B.init();
    editor = !!r.editor; needLogin = !!r.needLogin; canUpload = !!r.canUpload;
    if (r.data) { PUBLISHED = clone(r.data); draft = clone(PUBLISHED); }
    ready = true;
    if (PAGE || location.hash === '#admin') open();
  }
  boot();

  /* ---- Path helpers ---- */
  function getP(path){ return path.split('.').reduce(function(o, k){ return o == null ? o : o[k]; }, draft); }
  function setP(path, v){ var ks = path.split('.'), o = draft; for (var i = 0; i < ks.length - 1; i++) o = o[ks[i]]; o[ks[ks.length - 1]] = v; }

  /* ---- Field builders ---- */
  function f(label, path, opts){
    opts = opts || {}; var v = getP(path), id = 'ad-' + path.replace(/\./g, '-');
    var cls = 'ad-f' + (opts.full ? ' full' : '');
    var input;
    if (opts.lines) input = '<textarea id="' + id + '" data-path="' + path + '" data-lines="1" rows="' + (opts.rows || 4) + '">' + esc((v || []).join('\n')) + '</textarea>';
    else if (opts.area) input = '<textarea id="' + id + '" data-path="' + path + '" rows="' + (opts.rows || 3) + '">' + esc(v) + '</textarea>';
    else if (opts.options) input = '<select id="' + id + '" data-path="' + path + '">' + opts.options.map(function(o){ var ov = Array.isArray(o) ? o[0] : o, ol = Array.isArray(o) ? o[1] : o; return '<option value="' + esc(ov) + '"' + (ov === v ? ' selected' : '') + '>' + esc(ol) + '</option>'; }).join('') + '</select>';
    else input = '<input id="' + id + '" data-path="' + path + '" value="' + esc(v) + '"' + (opts.placeholder ? ' placeholder="' + esc(opts.placeholder) + '"' : '') + (opts.inputmode ? ' inputmode="' + opts.inputmode + '"' : '') + '>';
    return '<div class="' + cls + '"><label for="' + id + '">' + esc(label) + '</label>' + input + (opts.help ? '<small>' + esc(opts.help) + '</small>' : '') + (opts.count ? '<small data-count="' + path + '">' + String(v || '').length + ' characters</small>' : '') + '</div>';
  }
  function rowActs(listPath, i, n){
    return '<span class="ad-row-acts">' +
      '<button type="button" class="ad-mini" data-move="' + listPath + '" data-i="' + i + '" data-d="-1"' + (i === 0 ? ' disabled' : '') + ' aria-label="Move up">↑</button>' +
      '<button type="button" class="ad-mini" data-move="' + listPath + '" data-i="' + i + '" data-d="1"' + (i === n - 1 ? ' disabled' : '') + ' aria-label="Move down">↓</button>' +
      '<button type="button" class="ad-mini del" data-del="' + listPath + '" data-i="' + i + '">Remove</button></span>';
  }
  function imgField(path, label){
    var v = getP(path);
    return '<div class="ad-img"><img src="' + esc(v) + '" alt=""><div class="ad-f" style="flex:1">' +
      '<label>' + esc(label) + '</label>' +
      '<input type="file" accept="image/png,image/jpeg,image/webp,image/gif" data-upload="' + path + '">' +
      '<small>' + (canUpload ? 'JPG, PNG or WebP, up to 20 MB. A wide screenshot (16:10) looks best.' : 'Uploading isn\'t available in this view. Paste an image link below instead.') + '</small>' +
      '<input data-path="' + path + '" value="' + esc(v) + '" aria-label="Image link">' +
      '<span class="ad-msg" data-upmsg="' + path + '"></span></div></div>';
  }

  var SERVICES = ['Website', 'Online store', 'Branding', 'ERP / business portal'];
  var ICONS = Object.keys(LR.ICONS);
  var SECTIONS = [
    ['general', 'Business & contact'], ['hero', 'Top of page'], ['services', 'Services'], ['pricing', 'Prices'],
    ['erp', 'ERP screenshots'], ['faq', 'FAQs'], ['terms', 'Terms & Conditions'], ['seo', 'Search (SEO)'], ['backup', 'Backup']
  ];

  var VIEWS = {
    general: function(){
      return '<h3>Business & contact</h3><p class="hint">Used on the quote form, footer, Terms page and in search results.</p>' +
        '<div class="ad-card"><div class="ad-grid">' +
        f('Business name', 'brand.name') + f('Email for quote requests', 'brand.email', { inputmode: 'email' }) +
        f('WhatsApp number', 'brand.whatsapp', { inputmode: 'tel', placeholder: '923001234567', help: 'Country code and number, digits only. Turns on the "Send on WhatsApp" button and the floating WhatsApp button.' }) +
        f('Phone (optional)', 'brand.phone', { inputmode: 'tel' }) +
        f('City', 'brand.city') + f('Country', 'brand.country') +
        f('Reply time note', 'brand.replyTime', { full: true }) +
        '</div></div>';
    },
    hero: function(){
      var h = draft.hero;
      return '<h3>Top of page</h3><p class="hint">The headline, the business types under it and the gold panel.</p>' +
        '<div class="ad-card"><div class="ad-grid">' +
        f('First line', 'hero.line1', { full: true }) +
        f('Rotating second lines', 'hero.rotate', { lines: true, full: true, help: 'One per line. They take turns under the first line.' }) +
        f('Business types', 'hero.industries', { lines: true, full: true, help: 'One per line. Six looks best (3 across on laptops, 2 across on phones).' }) +
        f('Intro text', 'hero.text', { area: true, full: true }) + f('Main button', 'hero.button') +
        '</div></div>' +
        h.stats.map(function(s, i){ return '<div class="ad-card"><h4>Number ' + (i + 1) + rowActs('hero.stats', i, h.stats.length) + '</h4><div class="ad-grid">' + f('Value', 'hero.stats.' + i + '.value', { help: 'For example Rs 35k or 30 days.' }) + f('Label', 'hero.stats.' + i + '.label') + '</div></div>'; }).join('') +
        (h.stats.length < 4 ? '<button type="button" class="ad-add" data-add="hero.stats">+ Add a number</button>' : '');
    },
    services: function(){
      return '<h3>Services</h3><p class="hint">The cards under "Where we come in". Each card keeps its own illustration.</p>' +
        draft.services.map(function(s, i){
          return '<div class="ad-card"><h4>' + esc(s.title || 'Card ' + (i + 1)) + '</h4><div class="ad-grid">' +
            f('Title', 'services.' + i + '.title') + f('Price line', 'services.' + i + '.price', { help: 'For example From Rs 35,000 or Custom quote.' }) +
            f('Description', 'services.' + i + '.text', { area: true, full: true }) +
            (s.key === 'erp' ? imgField('services.' + i + '.img', 'Screenshot on this card') : '') +
            '</div></div>';
        }).join('') +
        '<div class="ad-card"><h4>Gold quote card</h4><div class="ad-grid">' + f('Title', 'servicesCta.title', { full: true }) + f('Text', 'servicesCta.text', { area: true, full: true }) + f('Button', 'servicesCta.button') + '</div></div>';
    },
    pricing: function(){
      return '<h3>Prices</h3><p class="hint">Each tab on the pricing section. Up to 4 plans per tab fit in one row.</p>' +
        '<div class="ad-card"><div class="ad-grid">' + f('Note under the plans', 'pricing.note', { full: true }) + '</div></div>' +
        draft.pricing.cats.map(function(c, ci){
          var base = 'pricing.cats.' + ci;
          return '<div class="ad-card" style="background:#FBF8F1"><h4>Tab: ' + esc(c.label) + '</h4><div class="ad-grid">' + f('Tab name', base + '.label') + f('Line under the tabs', base + '.note') + '</div></div>' +
            c.plans.map(function(p, pi){
              var pb = base + '.plans.' + pi;
              return '<div class="ad-card"><h4>' + esc(p.name || 'Plan') + rowActs(base + '.plans', pi, c.plans.length) + '</h4><div class="ad-grid">' +
                f('Plan name', pb + '.name') +
                f('Card style', pb + '.style', { options: [['plain', 'Plain'], ['pop', 'Highlighted (dark gold)'], ['fav', 'Soft gold']] }) +
                f('Label on top', pb + '.tab', { help: 'For example Fixed price or Most popular.' }) +
                f('Icon', pb + '.icon', { options: ICONS }) +
                f('Before price', pb + '.prefix', { help: 'For example From. Leave empty for none.' }) +
                f('Price', pb + '.price', { help: 'For example Rs 75,000 or Custom.' }) +
                f('After price', pb + '.suffix', { help: 'For example fixed or /month.' }) +
                f('Quote form service', pb + '.service', { options: SERVICES }) +
                f('Short description', pb + '.desc', { area: true, full: true }) +
                f('Button text', pb + '.button') +
                f('What\'s included', pb + '.features', { lines: true, full: true, help: 'One per line.' }) +
                '</div></div>';
            }).join('') +
            (c.plans.length < 4 ? '<button type="button" class="ad-add" data-add="' + base + '.plans" style="margin-bottom:22px">+ Add a plan to ' + esc(c.label) + '</button>' : '<p class="hint" style="margin-bottom:22px">This tab has 4 plans, the most that fit in one row.</p>');
        }).join('');
    },
    erp: function(){
      var e = draft.erp;
      return '<h3>ERP screenshots</h3><p class="hint">The gold block with the browser window. Screens rotate in this order.</p>' +
        '<div class="ad-card"><div class="ad-grid">' + f('Heading', 'erp.title', { full: true }) + '</div></div>' +
        e.points.map(function(p, i){ return '<div class="ad-card"><h4>Point ' + (i + 1) + rowActs('erp.points', i, e.points.length) + '</h4><div class="ad-grid">' + f('Big value', 'erp.points.' + i + '.n') + f('Text', 'erp.points.' + i + '.t') + '</div></div>'; }).join('') +
        (e.points.length < 4 ? '<button type="button" class="ad-add" data-add="erp.points" style="margin-bottom:14px">+ Add a point</button>' : '') +
        e.projects.map(function(p, i){ return '<div class="ad-card"><h4>Project button ' + (i + 1) + '</h4><div class="ad-grid">' + f('Name', 'erp.projects.' + i + '.name') + f('Line under it', 'erp.projects.' + i + '.sub') + '</div></div>'; }).join('') +
        e.slides.map(function(s, i){
          return '<div class="ad-card"><h4>Screen ' + (i + 1) + rowActs('erp.slides', i, e.slides.length) + '</h4><div class="ad-grid">' +
            f('Project', 'erp.slides.' + i + '.p', { options: e.projects.map(function(p){ return [p.id, p.name]; }) }) +
            f('Label in the window bar', 'erp.slides.' + i + '.label') +
            f('Description for search and screen readers', 'erp.slides.' + i + '.alt', { full: true }) +
            imgField('erp.slides.' + i + '.src', 'Screenshot') + '</div></div>';
        }).join('') +
        '<button type="button" class="ad-add" data-add="erp.slides">+ Add a screen</button>';
    },
    faq: function(){
      return '<h3>FAQs</h3><p class="hint">Also sent to Google as question-and-answer results.</p>' +
        draft.faq.map(function(q, i){ return '<div class="ad-card"><h4>Question ' + (i + 1) + rowActs('faq', i, draft.faq.length) + '</h4><div class="ad-grid">' + f('Question', 'faq.' + i + '.q', { full: true }) + f('Answer', 'faq.' + i + '.a', { area: true, full: true }) + '</div></div>'; }).join('') +
        '<button type="button" class="ad-add" data-add="faq">+ Add a question</button>';
    },
    terms: function(){
      return '<h3>Terms & Conditions</h3><p class="hint">Shown on the Terms page, linked from the footer and the quote form. Have a lawyer review them before you rely on them.</p>' +
        '<div class="ad-card"><div class="ad-grid">' + f('Last updated', 'terms.updated', { help: 'For example 21 November 2026.' }) +
        f('Terms text', 'terms.body', { area: true, rows: 22, full: true, help: 'Start a line with "## " for a heading and "- " for a bullet point. Leave a blank line between paragraphs.' }) + '</div></div>';
    },
    seo: function(){
      return '<h3>Search (SEO)</h3><p class="hint">What Google and link previews show. Prices, services and FAQs are also sent to search engines automatically.</p>' +
        '<div class="ad-card"><div class="ad-grid">' +
        f('Page title', 'seo.title', { full: true, count: true, help: 'Keep it under 60 characters.' }) +
        f('Description', 'seo.description', { area: true, full: true, count: true, help: 'Aim for 120–160 characters. Mention what you do and where.' }) +
        f('Keywords', 'seo.keywords', { area: true, full: true, help: 'Comma-separated. Most search engines give these little weight.' }) +
        '</div></div>';
    },
    security: function(){ return B.security ? B.security() : ''; },
    backup: function(){
      return '<h3>Backup</h3><p class="hint">Copy everything editable on the site, or restore a copy you saved earlier.</p>' +
        '<div class="ad-card"><h4>Current content</h4><div class="ad-f full"><textarea id="bk-out" rows="8" readonly>' + esc(JSON.stringify(draft, null, 2)) + '</textarea></div><p><button type="button" class="ad-btn lt" id="bk-copy">Copy backup</button></p></div>' +
        '<div class="ad-card"><h4>Restore</h4><div class="ad-f full"><label for="bk-in">Paste a backup</label><textarea id="bk-in" rows="6"></textarea></div><p style="display:flex;gap:10px;align-items:center;flex-wrap:wrap"><button type="button" class="ad-btn lt" id="bk-apply">Load this backup</button><span class="ad-msg" id="bk-msg"></span></p></div>';
    }
  };

  var NEW = {
    'hero.stats': function(){ return { value: '', label: '' }; },
    'erp.points': function(){ return { n: '', t: '' }; },
    'erp.slides': function(){ return { p: (draft.erp.projects[0] || {}).id || 'w', label: '', src: '', alt: '' }; },
    'faq': function(){ return { q: 'New question', a: '' }; }
  };
  function newItem(path){
    if (NEW[path]) return NEW[path]();
    if (/\.plans$/.test(path)) { var cat = getP(path.replace(/\.plans$/, '')); return { name: 'New plan', style: 'plain', tab: 'Fixed price', icon: 'site', prefix: 'From', price: 'Rs 0', suffix: '', desc: '', button: 'Get a quote', service: (cat.plans[0] || {}).service || 'Website', features: [] }; }
    return {};
  }

  /* ---- Render the Manage screen ---- */
  function shell(){
    var top = '<div class="ad-top"><h2>Manage site</h2><span class="st" id="adStatus"></span>';
    if (needLogin) {
      root.innerHTML = top + (PAGE ? '<a class="ad-btn" href="/">View site</a>' : '<button type="button" class="ad-btn" data-act="close">Close</button>') + '</div>' +
        '<form class="ad-locked ad-login" id="adLogin"><h3>Sign in to manage the site</h3><p class="hint">Enter the admin password.</p>' +
        '<div class="ad-f" style="text-align:left"><label for="ad-pw">Password</label><input id="ad-pw" type="password" autocomplete="current-password" required></div>' +
        '<p class="ad-msg err" id="adLoginMsg" role="alert"></p><button class="ad-btn pri" type="submit">Sign in</button></form>';
      setTimeout(function(){ var p = $('#ad-pw'); if (p) p.focus(); }, 50);
      return;
    }
    if (!editor) {
      root.innerHTML = top + '<button type="button" class="ad-btn" data-act="close">Close</button></div>' +
        '<div class="ad-locked"><h3>Only editors can manage this site</h3><p class="hint">Open this page in claude.ai while signed in with an account that can edit it. Visitors never see the Manage screen.</p><a class="ad-btn pri" href="#top">Back to the site</a></div>';
      return;
    }
    root.innerHTML = top +
      '<button type="button" class="ad-btn" data-act="discard">Discard changes</button>' +
      '<button type="button" class="ad-btn" data-act="preview">Preview</button>' +
      '<button type="button" class="ad-btn pri" data-act="publish">Publish</button>' +
      (PAGE ? '<a class="ad-btn" href="/" target="_blank" rel="noopener">View site</a><button type="button" class="ad-btn" data-act="logout">Sign out</button>' : '<button type="button" class="ad-btn" data-act="close" aria-label="Close Manage site">Close</button>') + '</div>' +
      '<div class="ad-body"><nav class="ad-nav" aria-label="Sections">' + sections().map(function(s){ return '<button type="button" data-sec="' + s[0] + '" aria-current="' + (s[0] === section) + '">' + esc(s[1]) + '</button>'; }).join('') + '</nav>' +
      '<div class="ad-main" id="adMain"><div class="wrapx" id="adView"></div></div></div>';
    view();
  }
  function sections(){ return SECTIONS.concat(B.security ? [['security', 'Password & security']] : []); }
  root.addEventListener('submit', async function(e){
    if (e.target.id !== 'adLogin') return;
    e.preventDefault();
    var m = $('#adLoginMsg'), btn = e.target.querySelector('button'); btn.disabled = true; m.textContent = '';
    try {
      var r = await B.login($('#ad-pw').value);
      if (r && r.data) { PUBLISHED = clone(r.data); draft = clone(PUBLISHED); }
      needLogin = false; editor = true; canUpload = true; shell();
    } catch (err) { m.textContent = err && err.message ? err.message : 'Wrong password.'; btn.disabled = false; $('#ad-pw').select(); }
  });
  function view(){
    var v = $('#adView'); if (!v) return;
    v.innerHTML = VIEWS[section]();
    var saved = store.get();
    if (saved && !same(saved, draft) && !same(saved, PUBLISHED) && same(draft, PUBLISHED)) {
      v.insertAdjacentHTML('afterbegin', '<div class="ad-card" style="background:#FFF8E8"><h4>You have unpublished changes from earlier</h4><p class="hint" style="margin:0 0 12px">They were saved in this browser.</p><button type="button" class="ad-btn pri" data-act="restore">Restore them</button> <button type="button" class="ad-btn lt" data-act="forget">Discard them</button></div>');
    }
    status();
  }
  function status(){
    var s = $('#adStatus'); if (s) s.textContent = dirty() ? 'Unpublished changes' : 'Everything is published';
    var p = root.querySelector('[data-act="publish"]'); if (p) p.disabled = !dirty();
  }
  var saveT = null;
  function changed(){ clearTimeout(saveT); saveT = setTimeout(function(){ store.set(draft); }, 400); status(); }

  root.addEventListener('input', function(e){
    var el = e.target, path = el.dataset && el.dataset.path; if (!path) return;
    var v = el.dataset.lines ? el.value.split('\n').map(function(x){ return x.trim(); }).filter(Boolean) : el.value;
    setP(path, v); changed();
    var c = root.querySelector('[data-count="' + path + '"]'); if (c) c.textContent = el.value.length + ' characters';
    if (el.closest('.ad-img') && !el.type.match(/file/)) { var im = el.closest('.ad-img').querySelector('img'); if (im) im.src = el.value; }
  });
  root.addEventListener('change', async function(e){
    var el = e.target;
    if (el.dataset && el.dataset.path && el.tagName === 'SELECT') { setP(el.dataset.path, el.value); changed(); }
    if (!el.dataset || !el.dataset.upload) return;
    var path = el.dataset.upload, msg = root.querySelector('[data-upmsg="' + path + '"]'), file = el.files && el.files[0];
    if (!file) return;
    if (!canUpload) { msg.textContent = 'Uploading isn\'t available here. Paste an image link instead.'; msg.className = 'ad-msg err'; return; }
    if (!/^image\//.test(file.type)) { msg.textContent = 'Choose a JPG, PNG or WebP image.'; msg.className = 'ad-msg err'; return; }
    if (file.size > 20 * 1024 * 1024) { msg.textContent = 'That image is over 20 MB. Choose a smaller one.'; msg.className = 'ad-msg err'; return; }
    msg.textContent = 'Uploading…'; msg.className = 'ad-msg';
    try {
      var url = await B.upload(file);
      setP(path, url); changed(); view();
      var m2 = root.querySelector('[data-upmsg="' + path + '"]'); if (m2) { m2.textContent = 'Uploaded. Publish to put it on the site.'; m2.className = 'ad-msg ok'; }
    } catch (err) { msg.textContent = 'Upload failed (' + (err && err.code || 'error') + '). Try again or use a smaller image.'; msg.className = 'ad-msg err'; }
  });
  root.addEventListener('click', function(e){
    var t = e.target.closest('button,a'); if (!t || !root.contains(t)) return;
    if (t.dataset.sec) { section = t.dataset.sec; $$('.ad-nav button', root).forEach(function(b){ b.setAttribute('aria-current', String(b === t)); }); view(); $('#adMain').scrollTop = 0; return; }
    if (t.dataset.add) { var list = getP(t.dataset.add); list.push(newItem(t.dataset.add)); changed(); view(); return; }
    if (t.dataset.del) { var l2 = getP(t.dataset.del); l2.splice(+t.dataset.i, 1); changed(); view(); return; }
    if (t.dataset.move) { var l3 = getP(t.dataset.move), i = +t.dataset.i, j = i + +t.dataset.d; if (j < 0 || j >= l3.length) return; var tmp = l3[i]; l3[i] = l3[j]; l3[j] = tmp; changed(); view(); return; }
    if (t.id === 'bk-copy') { var out = $('#bk-out'); if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(out.value).then(function(){ t.textContent = 'Copied'; }).catch(function(){ out.select(); t.textContent = 'Selected. Press Ctrl+C'; }); else { out.select(); t.textContent = 'Selected. Press Ctrl+C'; } return; }
    if (t.id === 'bk-apply') {
      var m = $('#bk-msg');
      try { var obj = JSON.parse($('#bk-in').value); if (!obj || !obj.brand || !obj.pricing || !obj.hero) throw new Error('shape'); draft = obj; changed(); view(); m = $('#bk-msg'); if (m) { m.textContent = 'Backup loaded. Preview or publish it.'; m.className = 'ad-msg ok'; } }
      catch (err) { m.textContent = 'That isn\'t a Laurent site backup. Paste the full text you copied.'; m.className = 'ad-msg err'; }
      return;
    }
    var act = t.dataset.act; if (!act) return;
    if (act === 'close') { close(); return; }
    if (act === 'discard') { confirmBox('Discard your changes?', 'The editor goes back to what is published now.', 'Discard', function(){ draft = clone(PUBLISHED); store.clear(); view(); }); return; }
    if (act === 'restore') { draft = store.get() || draft; view(); return; }
    if (act === 'forget') { store.clear(); view(); return; }
    if (act === 'preview') { preview(); return; }
    if (act === 'logout') { B.logout().then(function(){ needLogin = true; editor = false; shell(); }); return; }
    if (act === 'publish') { publishFlow(); return; }
  });

  /* ---- Preview the draft (nothing is saved) ---- */
  function applyToPage(data){
    Object.keys(LR.REGIONS).forEach(function(k){ if (k === 'seo') return; $$('[data-k="' + k + '"]').forEach(function(el){ el.innerHTML = LR.REGIONS[k](data); }); });
    window.__DATA = data; if (window.LApp) window.LApp.refresh();
  }
  function preview(){
    if (B.preview) { B.preview(clone(draft)); return; }
    applyToPage(clone(draft));
    root.hidden = true; document.body.classList.remove('v-admin');
    $('#prevBar').hidden = false;
    history.replaceState(null, '', location.pathname + location.search);
  }
  var pb = $('#prevBar');
  if (pb) pb.addEventListener('click', function(e){
    var b = e.target.closest('button'); if (!b) return;
    if (b.dataset.act === 'back') { pb.hidden = true; open(); }
    if (b.dataset.act === 'publish') { pb.hidden = true; open(); publishFlow(); }
  });

  /* ---- Publish ---- */
  function publishFlow(){
    confirmBox('Publish these changes?', 'Everyone who opens the site will see them.', 'Publish', async function(){
      var btn = root.querySelector('[data-act="publish"]'); if (btn) { btn.disabled = true; btn.textContent = 'Publishing…'; }
      store.set(draft);
      try {
        var r = await B.publish(clone(draft));
        store.clear();
        if (r && r.data) { PUBLISHED = clone(r.data); draft = clone(PUBLISHED); }
        else PUBLISHED = clone(draft);
        if (btn) btn.textContent = 'Publish';
        status(); toast('Published. The live site shows the changes now.', false);
      } catch (err) {
        var c = err && err.code;
        if (c === 'conflict') toast('Someone published a newer version, so the page is reloading. Your changes are saved in this browser; open Manage site to restore them.', true);
        else if (c === 'not_writer' || c === 'not_granted') toast('This account can view the page but can\'t publish it.', true);
        else if (c === 'unauthorized') { needLogin = true; shell(); var m = $('#adLoginMsg'); if (m) m.textContent = 'Your session ended. Sign in again; your changes are kept.'; }
        else if (c === 'rate_limited') toast('Too many publishes in a short time. Wait a minute and try again.', true);
        else toast('Publishing failed (' + (c || (err && err.message) || 'error') + '). Your changes are still here. Try again.', true);
        if (btn) { btn.textContent = 'Publish'; status(); }
      }
    });
  }

  function confirmBox(title, text, okLabel, onOk){
    var box = $('#adConfirm');
    box.querySelector('h4').textContent = title; box.querySelector('p').textContent = text;
    var ok = box.querySelector('[data-ok]'); ok.textContent = okLabel;
    box.hidden = false; ok.focus();
    var done = function(run){ box.hidden = true; ok.onclick = null; box.querySelector('[data-cancel]').onclick = null; if (run) onOk(); };
    ok.onclick = function(){ done(true); };
    box.querySelector('[data-cancel]').onclick = function(){ done(false); };
  }
  function toast(text, err){
    var s = $('#adStatus'); if (s) { s.textContent = text; s.style.color = err ? '#FFB4A8' : ''; setTimeout(function(){ s.style.color = ''; status(); }, 6000); }
  }

  function open(){
    if (!ready) return;
    var pbar = $('#prevBar'); if (pbar) pbar.hidden = true;
    root.hidden = false; document.body.classList.add('v-admin');
    shell();
    if (!PAGE && location.hash !== '#admin') history.replaceState(null, '', '#admin');
  }
  function close(){
    if (PAGE) return;
    root.hidden = true; document.body.classList.remove('v-admin');
    if (!same(window.__DATA, PUBLISHED)) applyToPage(clone(PUBLISHED));
    history.replaceState(null, '', location.pathname + location.search);
  }
  addEventListener('keydown', function(e){ var c = $('#adConfirm'); if (e.key === 'Escape' && !root.hidden && c && c.hidden) close(); });

  window.LAdmin = { open: open };
})();
