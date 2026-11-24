(function(){
  window.__DATA = JSON.parse(document.getElementById('site-data').textContent);
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function(s, r){ return (r || document).querySelector(s); }, $$ = function(s, r){ return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var D = function(){ return window.__DATA; };
  var digits = function(s){ return String(s || '').replace(/\D/g, ''); };

  /* ---- Smooth scroll ---- */
  var lenis = null;
  if (window.Lenis && !reduce) {
    lenis = new Lenis({ duration: 1.2, easing: function(t){ return Math.min(1, 1.001 - Math.pow(2, -10 * t)); } });
    var raf = function(t){ lenis.raf(t); requestAnimationFrame(raf); }; requestAnimationFrame(raf);
  }
  function go(t){ if (lenis) lenis.scrollTo(t, { offset: -80 }); else t.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' }); }

  /* ---- Views: home, terms (#terms), manage (#admin) ---- */
  function setView(){
    var h = location.hash;
    var terms = h === '#terms' || /^\/terms\/?$/.test(location.pathname);
    document.body.classList.toggle('v-terms', terms);
    if (terms) { if (lenis) lenis.scrollTo(0, { immediate: true }); else scrollTo(0, 0); }
    if (h === '#admin' && window.LAdmin) window.LAdmin.open();
  }
  addEventListener('hashchange', setView);

  /* ---- Mobile menu ---- */
  var links = $('#links'), menuBtn = $('#menuBtn');
  function closeMenu(){ links.classList.remove('open'); menuBtn.setAttribute('aria-expanded', 'false'); menuBtn.textContent = 'Menu'; }
  menuBtn.addEventListener('click', function(){ var o = !links.classList.contains('open'); links.classList.toggle('open', o); menuBtn.setAttribute('aria-expanded', String(o)); menuBtn.textContent = o ? 'Close' : 'Menu'; });

  /* ---- In-page links (delegated, so re-rendered content keeps working) ---- */
  document.addEventListener('click', function(e){
    var a = e.target.closest && e.target.closest('a[href^="#"]'); if (!a) return;
    var id = a.getAttribute('href');
    if (id === '#terms' || id === '#admin') { closeMenu(); return; }
    if (a.dataset.service) setService(a.dataset.service, a.dataset.plan);
    if (a.dataset.tab) { setTab(a.dataset.tab); if (a.dataset.focus) setTimeout(function(){ flashPlan(a.dataset.tab, a.dataset.focus); }, 900); }
    var t = id.length > 1 && document.querySelector(id); if (!t) return;
    e.preventDefault(); closeMenu();
    if (/^\/terms\/?$/.test(location.pathname)) { location.href = '/' + id; return; }
    if (document.body.classList.contains('v-terms')) { location.hash = 'top'; setTimeout(function(){ go(t); }, 60); }
    else go(t);
  });

  /* ---- Load sequence ---- */
  /* Intro (logo animation) plays first on a visitor's first page in a session, then the hero animates in */
  var introOn = document.documentElement.classList.contains('intro');
  function startHero(){
    $$('.hero h1>*, .hero-sub, .hero-ctas, .trust>*').forEach(function(el, i){ el.style.transitionDelay = (.1 + i * .07) + 's'; });
    $('.panel').style.transitionDelay = '.35s';
    document.documentElement.classList.remove('ld');
  }
  requestAnimationFrame(function(){ requestAnimationFrame(function(){ setTimeout(startHero, introOn ? 1750 : 0); }); });
  if (introOn) setTimeout(function(){ var el = $('#intro'); if (el) el.remove(); document.documentElement.classList.remove('intro'); }, 2700);

  /* ---- Rotating hero line ---- */
  if (!reduce) {
    var ri = 0;
    setInterval(function(){
      var rot = $('#rot'), lines = D().hero.rotate; if (!rot || lines.length < 2) return;
      rot.style.transform = 'translateY(-110%)'; rot.style.opacity = '0';
      setTimeout(function(){
        ri = (ri + 1) % lines.length; rot.textContent = lines[ri];
        rot.style.transition = 'none'; rot.style.transform = 'translateY(110%)';
        requestAnimationFrame(function(){ requestAnimationFrame(function(){ rot.style.transition = ''; rot.style.transform = 'none'; rot.style.opacity = '1'; }); });
      }, 700);
    }, 3000);
  }

  /* ---- Blur-in headings, reveals ---- */
  $$('.bw').forEach(function(h){ h.innerHTML = h.textContent.trim().split(/\s+/).map(function(w){ return '<span class="w">' + w + '</span>'; }).join(' '); });
  var io = null;
  if (!reduce && 'IntersectionObserver' in window) {
    io = new IntersectionObserver(function(es){ es.forEach(function(en){
      if (!en.isIntersecting) return;
      var el = en.target;
      if (el.classList.contains('bw')) $$('.w', el).forEach(function(w, i){ w.style.transitionDelay = (i * .08) + 's'; });
      else if (el.classList.contains('zs')) el.style.transitionDelay = '0s';
      else { var sibs = Array.prototype.slice.call(el.parentElement.children); el.style.transitionDelay = (Math.max(0, sibs.indexOf(el)) % 3 * .08) + 's'; }
      el.classList.remove('pre'); io.unobserve(el);
    }); }, { rootMargin: '0px 0px -10% 0px' });
    $$('.bw, .rv, .zs').forEach(function(el){ if (el.getBoundingClientRect().top > innerHeight) { el.classList.add('pre'); io.observe(el); } });
  }

  /* ---- Scroll-driven: nav, hero parallax, steps line ---- */
  var nav = $('.nav'), lastY = 0;
  function onScroll(y){
    nav.classList.toggle('hide', y > lastY && y > 300 && !links.classList.contains('open')); lastY = y;
    if (reduce) return;
    var pbg = $('#pbg'); if (pbg) { var pr = pbg.parentElement.getBoundingClientRect(); pbg.style.transform = 'translate3d(0,' + Math.max(-60, Math.min(60, -pr.top * .12)) + 'px,0)'; }
    var zig = $('.zig'); if (zig) {
      var zr = zig.getBoundingClientRect(), mid = innerHeight * .6;
      zig.style.setProperty('--lp', Math.min(1, Math.max(0, (mid - zr.top) / zr.height)).toFixed(3));
      $$('.zrow', zig).forEach(function(r){ r.classList.toggle('lit', $('.zn', r).getBoundingClientRect().top < mid); });
    }
  }
  if (lenis) lenis.on('scroll', function(e){ onScroll(e.scroll); }); else addEventListener('scroll', function(){ onScroll(scrollY); }, { passive: true });
  onScroll(scrollY);

  /* ---- Count-ups ---- */
  function countUp(el){
    var end = +el.dataset.n, pre = el.dataset.pre || '', suf = el.dataset.suf || '', t0 = performance.now();
    (function tick(now){ var p = Math.min(1, (now - t0) / 1400), e = 1 - Math.pow(1 - p, 4); el.textContent = pre + Math.round(end * e) + suf; if (p < 1) requestAnimationFrame(tick); })(t0);
  }
  if (!reduce && 'IntersectionObserver' in window) {
    var cio = new IntersectionObserver(function(es){ es.forEach(function(en){ if (en.isIntersecting) { countUp(en.target); cio.unobserve(en.target); } }); }, { threshold: .6 });
    $$('[data-n]').forEach(function(el){ cio.observe(el); });
  }

  /* ---- Typing effect ---- */
  var typers = [];
  function startTypers(){
    typers.forEach(function(t){ clearTimeout(t.timer); }); typers = [];
    if (reduce) return;
    $$('.type[data-text]').forEach(function(el){
      var full = el.dataset.text, t = { el: el, timer: null, running: false };
      el.textContent = ''; el.classList.add('caret');
      function typeIn(i){ el.textContent = full.slice(0, i); if (i < full.length) t.timer = setTimeout(function(){ typeIn(i + 1); }, 45 + Math.random() * 55); else t.timer = setTimeout(function(){ erase(full.length); }, 2600); }
      function erase(i){ el.textContent = full.slice(0, i); if (i > 0) t.timer = setTimeout(function(){ erase(i - 1); }, 22); else t.timer = setTimeout(function(){ typeIn(1); }, 500); }
      if ('IntersectionObserver' in window) {
        var o = new IntersectionObserver(function(es){ if (es[0].isIntersecting && !t.running) { t.running = true; typeIn(1); o.disconnect(); } });
        o.observe(el);
      } else typeIn(1);
      typers.push(t);
    });
  }

  /* ---- Scan line heights ---- */
  function sizeScans(){ $$('.scan').forEach(function(s){ s.style.setProperty('--sh', (s.parentElement.clientHeight + 60) + 'px'); }); }
  addEventListener('resize', sizeScans);

  /* ---- Store card: cart count bumps on hover ---- */
  document.addEventListener('mouseover', function(e){
    var p = e.target.closest && e.target.closest('.shop .p, .rest .rp'); if (!p || p.dataset.bumped) return;
    p.dataset.bumped = '1'; setTimeout(function(){ delete p.dataset.bumped; }, 1200);
    var n = (p.closest('.shop, .rest') || p.parentElement).querySelector('.cartn'); if (!n) return;
    n.textContent = (+n.textContent % 9) + 1; n.classList.add('bump'); setTimeout(function(){ n.classList.remove('bump'); }, 350);
  });

  /* ---- FAQ open/close animation (delegated) ---- */
  document.addEventListener('click', function(e){
    var sum = e.target.closest && e.target.closest('.faq summary'); if (!sum || reduce) return;
    e.preventDefault();
    var d = sum.parentElement, body = d.querySelector('p');
    if (!d.open) { d.open = true; var h = body.offsetHeight; body.animate([{ height: '0px', opacity: 0 }, { height: h + 'px', opacity: 1 }], { duration: 450, easing: 'cubic-bezier(.16,1,.3,1)' }); }
    else { var h2 = body.offsetHeight, a = body.animate([{ height: h2 + 'px', opacity: 1 }, { height: '0px', opacity: 0 }], { duration: 350, easing: 'cubic-bezier(.16,1,.3,1)' }); a.onfinish = function(){ d.open = false; }; }
  });

  /* ---- Pricing tabs with sliding knob ---- */
  function moveKnob(){
    var tg = $('.toggle'); if (!tg) return;
    var knob = $('.knob', tg); if (!knob) { knob = document.createElement('span'); knob.className = 'knob'; tg.prepend(knob); tg.classList.add('ready'); }
    var b = $('[aria-selected="true"]', tg); if (!b) return;
    knob.style.width = b.offsetWidth + 'px'; knob.style.transform = 'translateX(' + b.offsetLeft + 'px)';
  }
  function setTab(key){
    $$('.toggle button').forEach(function(b){ b.setAttribute('aria-selected', String(b.dataset.tab === key)); });
    $$('.plans').forEach(function(el){
      var on = el.id === 'p-' + key; el.hidden = !on;
      if (on) { $('#tnote').textContent = el.dataset.note || ''; if (!reduce) { el.classList.remove('enter'); void el.offsetWidth; el.classList.add('enter'); } }
    });
    moveKnob();
  }
  document.addEventListener('click', function(e){ var b = e.target.closest && e.target.closest('.toggle button'); if (b) setTab(b.dataset.tab); });
  /* Briefly highlight one plan, e.g. after a service card was clicked */
  function flashPlan(tab, name){
    var panel = document.getElementById('p-' + tab); if (!panel) return;
    $$('.plan', panel).forEach(function(p){
      var h = $('h3', p); if (!h || h.textContent.trim() !== name) return;
      p.classList.remove('flash'); void p.offsetWidth; p.classList.add('flash');
      setTimeout(function(){ p.classList.remove('flash'); }, 2200);
    });
  }
  document.addEventListener('keydown', function(e){
    var b = e.target.closest && e.target.closest('.toggle button'); if (!b || (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft')) return;
    var bs = $$('.toggle button'), i = bs.indexOf(b), n = bs[(i + (e.key === 'ArrowRight' ? 1 : bs.length - 1)) % bs.length];
    setTab(n.dataset.tab); n.focus();
  });
  addEventListener('resize', moveKnob);

  /* ---- ERP showcase ---- */
  var ebT = null, ebI = 0;
  function ebShow(i){
    var imgs = $$('.eb-view img'); if (!imgs.length) return;
    ebI = (i + imgs.length) % imgs.length;
    imgs.forEach(function(im, k){ im.classList.toggle('on', k === ebI); if (k === ebI) im.loading = 'eager'; });
    var dots = $$('#ebDots i'); dots.forEach(function(d, k){ d.classList.toggle('on', k === ebI); });
    var cur = imgs[ebI], lab = $('#ebLabel'); if (lab) lab.textContent = cur.dataset.l;
    $$('.eb-proj button').forEach(function(b){ b.setAttribute('aria-pressed', String(b.dataset.p === cur.dataset.p)); });
  }
  function ebPlay(){ clearInterval(ebT); if (!reduce) ebT = setInterval(function(){ ebShow(ebI + 1); }, 3800); }
  document.addEventListener('click', function(e){
    var b = e.target.closest && e.target.closest('.eb-proj button'); if (!b) return;
    var imgs = $$('.eb-view img'); ebShow(imgs.findIndex(function(im){ return im.dataset.p === b.dataset.p; })); ebPlay();
  });


  /* ---- Pause card animations while they're off screen ---- */
  var cardIO = ('IntersectionObserver' in window) ? new IntersectionObserver(function(es){ es.forEach(function(e){ e.target.classList.toggle('onscreen', e.isIntersecting); }); }, { rootMargin: '100px 0px' }) : null;
  function watchCards(){ $$('.svc').forEach(function(c){ if (cardIO) cardIO.observe(c); else c.classList.add('onscreen'); }); }

  /* ---- Photo sliders (OG Burgers, IvCon, brand mockups): one slide shown at a time, driven here so they work on every phone ---- */
  function startSliders(){
    $$('.rslides, .ivsl, .kbsl').forEach(function(box){
      if (box.dataset.sl) return; box.dataset.sl = '1';
      var slides = [].slice.call(box.children); if (!slides.length) return;
      var root = box.closest('.rhero, .ivhero, .kbmocks') || box.parentElement;
      var dots = root ? [].slice.call(root.querySelectorAll('.rdots i')) : [];
      slides.forEach(function(s){ var im = s.tagName === 'IMG' ? s : s.querySelector('img'); if (im) im.loading = 'eager'; });
      var i = 0, every = box.classList.contains('kbsl') ? 3500 : 4000;
      function show(n){ slides.forEach(function(s, k){ s.classList.toggle('on', k === n); }); dots.forEach(function(d, k){ d.classList.toggle('on', k === n); }); }
      show(0);
      if (reduce || slides.length < 2) return;
      setInterval(function(){
        if (document.hidden) return;
        var r = box.getBoundingClientRect(); if (r.bottom < -100 || r.top > innerHeight + 100) return;
        i = (i + 1) % slides.length; show(i);
      }, every);
    });
  }
  /* ---- Quote builder ---- */
  var form = $('#qform'), sumText = $('#sumText'), waBtn = $('#waBtn'), msg = $('#sumMsg'), planSel = $('#q-plan');
  var val = function(id){ return ($(id).value || '').trim(); };
  function plansFor(service){
    var out = [];
    D().pricing.cats.forEach(function(c){ c.plans.forEach(function(p){ if (p.service === service) out.push(p.name); }); });
    return out;
  }
  function setService(s, plan){
    var r = $$('input[name="service"]').find(function(x){ return x.value === s; }); if (r) r.checked = true;
    planSel.innerHTML = '<option value="">No preference</option>' + plansFor(s).map(function(p){ return '<option' + (p === plan ? ' selected' : '') + '>' + window.LR.esc(p) + '</option>'; }).join('');
    $('#erpOnly').hidden = s !== 'ERP / business portal';
    $('#f-service').classList.remove('err'); build();
  }
  $$('input[name="service"]').forEach(function(r){ r.addEventListener('change', function(){ setService(r.value); }); });
  function build(){
    var s = (form.querySelector('input[name="service"]:checked') || {}).value || '';
    if (!s) { sumText.textContent = 'Start by choosing a service.'; waBtn.hidden = true; return ''; }
    var L = ['Hi ' + D().brand.name + ', I would like a quote.', '', 'Service: ' + s + (val('#q-plan') ? ' (' + val('#q-plan') + ')' : '')];
    if (val('#q-type')) L.push('Business type: ' + val('#q-type'));
    if (s === 'ERP / business portal') {
      var m = $$('input[name="mod"]:checked').map(function(x){ return x.value; });
      if (m.length) L.push('Modules: ' + m.join(', '));
      if (val('#q-branches')) L.push('Branches: ' + val('#q-branches'));
      if (val('#q-users')) L.push('Users: ' + val('#q-users'));
    }
    if (val('#q-budget')) L.push('Budget: ' + val('#q-budget'));
    if (val('#q-time')) L.push('Timeline: ' + val('#q-time'));
    if (val('#q-about')) L.push('', 'About the project:', val('#q-about'));
    L.push('');
    [['Name', '#q-name'], ['Business', '#q-biz'], ['Phone', '#q-phone'], ['City', '#q-city']].forEach(function(kv){ if (val(kv[1])) L.push(kv[0] + ': ' + val(kv[1])); });
    var text = L.join('\n').trim();
    sumText.textContent = text;
    var wa = digits(D().brand.whatsapp);
    if (wa) { waBtn.href = 'https://wa.me/' + wa + '?text=' + encodeURIComponent(text); waBtn.hidden = false; } else waBtn.hidden = true;
    return text;
  }
  form.addEventListener('input', build); form.addEventListener('change', build);
  form.addEventListener('submit', function(e){
    e.preventDefault();
    var ok = true, s = form.querySelector('input[name="service"]:checked');
    $('#f-service').classList.toggle('err', !s); if (!s) ok = false;
    [['#f-name', '#q-name'], ['#f-phone', '#q-phone']].forEach(function(p){ var bad = !val(p[1]); $(p[0]).classList.toggle('err', bad); if (bad) ok = false; });
    if (!ok) { msg.textContent = 'A few details are missing. They are marked on the form.'; var first = $('.f.err input, .f.err'); if (first && first.focus) first.focus(); return; }
    build();
    msg.textContent = digits(D().brand.whatsapp) ? 'Your request is ready. Tap "Send on WhatsApp" to send it to us.' : 'Your request is ready. Copy it and send it to ' + D().brand.email + '.';
    if (innerWidth < 900) $('.qside').scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
  });
  $('#copyBtn').addEventListener('click', function(){
    var text = build();
    if (!text) { msg.textContent = 'Choose a service first.'; return; }
    var sel = function(){ var r = document.createRange(); r.selectNodeContents(sumText); var g = getSelection(); g.removeAllRanges(); g.addRange(r); msg.textContent = 'Selected. Press Ctrl+C (or ⌘C) to copy.'; };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(function(){ msg.textContent = 'Copied. Paste it into WhatsApp or an email to us.'; }).catch(sel);
    else sel();
  });
  $('#year').textContent = new Date().getFullYear();

  /* ---- Re-run after content changes (live preview from the Manage screen) ---- */
  function refresh(){
    moveKnob(); ebShow(0); ebPlay(); startTypers(); sizeScans(); watchCards(); startSliders();
    var s = (form.querySelector('input[name="service"]:checked') || {}).value; if (s) setService(s, val('#q-plan')); else build();
  }
  window.LApp = { refresh: refresh, setService: setService };
  refresh();
  setView();
})();
