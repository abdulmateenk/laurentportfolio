window.LR = (function(){
  var esc = function(s){ return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); };
  var ICONS = {
    site:'<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18"/>',
    page:'<path d="M4 5h16v14H4z"/><path d="M8 9h8M8 13h5"/>',
    bag:'<path d="M5 7h14l-1 13H6z"/><path d="M9 7a3 3 0 016 0"/>',
    clock:'<circle cx="12" cy="12" r="8"/><path d="M12 8v4l3 2"/>',
    logo:'<circle cx="12" cy="12" r="8"/><path d="M8 12h8"/>',
    grid:'<rect x="4" y="4" width="7" height="7" rx="1"/><rect x="13" y="4" width="7" height="7" rx="1"/><rect x="4" y="13" width="16" height="7" rx="1"/>',
    shop:'<path d="M4 20V8l8-4 8 4v12"/><path d="M9 20v-6h6v6"/>',
    phone:'<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 17h6"/>',
    table:'<path d="M4 11h16M6 11v8M18 11v8M8 7h8l2 4H6z"/>',
    box:'<path d="M4 7h16v13H4z"/><path d="M8 7V4h8v3M8 12h8M8 16h5"/>',
    nodes:'<circle cx="6" cy="12" r="2"/><circle cx="18" cy="6" r="2"/><circle cx="18" cy="18" r="2"/><path d="M8 12h4l4-5M12 12l4 5"/>',
    shield:'<path d="M12 3l8 4v5c0 5-3.5 8-8 9-4.5-1-8-4-8-9V7z"/>'
  };
  var BOLT = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M13 2L4 14h7l-1 8 9-12h-7z"/></svg>';
  var HEART = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 21s-7-4.4-9.3-8.6C1 9 3 5 6.8 5c2 0 3.4 1.1 5.2 3 1.8-1.9 3.2-3 5.2-3C21 5 23 9 21.3 12.4 19 16.6 12 21 12 21z"/></svg>';
  var MK = '<svg style="color:#fff" viewBox="1.5 1 101.5 108" aria-hidden="true"><use href="#mk"/></svg>';
  var digits = function(s){ return String(s || '').replace(/\D/g, ''); };
  var jsonSafe = function(o){ return JSON.stringify(o).replace(/</g, '\\u003c'); };
  var priceNum = function(p){ var m = String(p.price || '').replace(/,/g, '').match(/\d+(\.\d+)?/); if (!m) return null; var n = +m[0]; if (/k\b/i.test(p.price)) n *= 1000; return n; };

  function seo(d){
    var b = d.brand, s = d.seo;
    var offers = [];
    d.pricing.cats.forEach(function(c){ c.plans.forEach(function(p){
      var o = { '@type':'Offer', name: p.name, category: c.label, description: p.desc, priceCurrency: 'PKR' };
      var n = priceNum(p); if (n) { o.priceSpecification = { '@type':'PriceSpecification', priceCurrency:'PKR', price:n, valueAddedTaxIncluded:false }; if (p.prefix) o.priceSpecification.minPrice = n; }
      offers.push(o);
    }); });
    var org = { '@context':'https://schema.org', '@type':'ProfessionalService', name: b.name, description: s.description,
      areaServed: { '@type':'Country', name: b.country }, address: { '@type':'PostalAddress', addressLocality: b.city, addressCountry: 'PK' },
      email: b.email, knowsAbout: d.services.map(function(x){ return x.title; }),
      hasOfferCatalog: { '@type':'OfferCatalog', name: 'Services and prices', itemListElement: offers } };
    if (b.whatsapp || b.phone) org.telephone = '+' + digits(b.whatsapp || b.phone);
    var faq = { '@context':'https://schema.org', '@type':'FAQPage', mainEntity: d.faq.map(function(f){ return { '@type':'Question', name: f.q, acceptedAnswer: { '@type':'Answer', text: f.a } }; }) };
    return '<title>' + esc(s.title) + '</title>' +
      '<meta name="description" content="' + esc(s.description) + '">' +
      '<meta name="keywords" content="' + esc(s.keywords) + '">' +
      '<meta name="robots" content="index,follow">' +
      '<meta name="theme-color" content="#0A0A0A">' +
      '<meta property="og:type" content="website"><meta property="og:site_name" content="' + esc(b.name) + '">' +
      '<meta property="og:title" content="' + esc(s.title) + '"><meta property="og:description" content="' + esc(s.description) + '">' +
      '<meta property="og:locale" content="en_PK"><meta name="twitter:card" content="summary_large_image">' +
      '<script type="application/ld+json">' + jsonSafe(org) + '</scr' + 'ipt>' +
      '<script type="application/ld+json">' + jsonSafe(faq) + '</scr' + 'ipt>';
  }

  function heroTop(d){
    var h = d.hero;
    return '<div class="hero-grid">' +
      '<h1><span style="display:block">' + esc(h.line1) + '</span><span class="rot" aria-live="polite"><span id="rot">' + esc(h.rotate[0] || '') + '</span></span></h1>' +
      '<div class="hero-copy"><p class="hero-sub">' + esc(h.text) + '</p>' +
      '<div class="hero-ctas"><a class="btn" href="#quote">' + esc(h.button) + ' <span aria-hidden="true">→</span></a><a class="btn ghost" href="#pricing">See prices</a></div></div>' +
      '<ul class="trust ind-grid" aria-label="Businesses we work with">' + h.industries.map(function(x){
        return '<li><i aria-hidden="true">' + esc(String(x).trim().charAt(0).toUpperCase()) + '</i>' + esc(x) + '</li>';
      }).join('') + '</ul></div>';
  }

  function heroPanel(d){
    var h = d.hero, shot = (d.erp.slides || [])[0];
    return '<div class="stats">' + h.stats.map(function(s){
      var m = String(s.value).match(/^(\D*)(\d+)(.*)$/), attrs = '';
      if (m && !/[–-]/.test(s.value)) attrs = ' data-n="' + m[2] + '" data-pre="' + esc(m[1]) + '" data-suf="' + esc(m[3]) + '"';
      return '<div class="stat"><b' + attrs + '>' + esc(s.value) + '</b><span>' + esc(s.label) + '</span></div>';
    }).join('') + '</div>' +
    (shot ? '<figure class="hero-shot"><div class="hs-bar"><i></i><i></i><i></i><span>' + esc(shot.label) + '</span></div><img src="' + esc(shot.src) + '" alt="' + esc(shot.alt) + '" width="1400" height="875" fetchpriority="high"></figure>' : '');
  }

  function erp(d){
    var e = d.erp, first = e.slides[0] || {};
    return '<div class="eb-copy"><h3>' + esc(e.title) + '</h3>' +
      '<ul class="eb-list">' + e.points.map(function(p){ return '<li><b>' + esc(p.n) + '</b><span>' + esc(p.t) + '</span></li>'; }).join('') + '</ul>' +
      '<div class="eb-proj" role="group" aria-label="ERP systems we have built">' + e.projects.map(function(p, i){
        return '<button type="button" data-p="' + esc(p.id) + '" aria-pressed="' + (p.id === first.p) + '"><b>' + esc(p.name) + '</b><span>' + esc(p.sub) + '</span></button>';
      }).join('') + '</div></div>' +
      '<div class="eb-stage"><div class="eb-win"><div class="eb-bar"><i></i><i></i><i></i><span id="ebLabel">' + esc(first.label) + '</span></div>' +
      '<div class="eb-view"><span class="scan" aria-hidden="true"></span>' + e.slides.map(function(s, i){
        return '<img' + (i ? ' loading="lazy"' : ' class="on"') + ' width="1400" height="875" data-p="' + esc(s.p) + '" data-l="' + esc(s.label) + '" src="' + esc(s.src) + '" alt="' + esc(s.alt) + '">';
      }).join('') + '</div></div><div class="eb-dots" id="ebDots" aria-hidden="true">' + e.slides.map(function(_, i){ return '<i' + (i ? '' : ' class="on"') + '></i>'; }).join('') + '</div></div>';
  }

  var ART = {
    web: function(){
      /* IvCon Corporation: a company portfolio site. Photos live in photos/ next to the page;
         if one can't load, the coloured panel behind it shows instead. */
      var ph = function(n, w, h){ return '<img src="photos/' + n + '.webp" alt="" loading="lazy" width="' + w + '" height="' + h + '" onerror="this.remove()">'; };
      var svc = function(n, t){ return '<div class="ivs"><span class="ivp">' + ph(n, 200, 150) + '</span><b>' + t + '</b></div>'; };
      return '<div class="br ivc"><div class="b"><i></i><i></i><i></i><span class="url">ivcon.com.pk</span></div>' +
        '<div class="ivh"><span class="ivl"><span>IvCon<small>Corporation</small></span></span><span class="ivn">About</span><span class="ivn">Services</span><em class="ivbtn">Contact us</em></div>' +
        '<div class="ivhero"><span class="ivp ivsl">' + ph('iv-hero-1', 560, 300) + ph('iv-hero-2', 560, 300) + ph('iv-hero-3', 560, 300) + '</span><div class="ivtx"><small>Engineering · Construction</small><span class="type" data-text="Building what Pakistan runs on.">Building what Pakistan runs on.</span></div><span class="rdots"><i></i><i></i><i></i></span></div>' +
        '<div class="ivab"><span class="ivp">' + ph('iv-about', 240, 180) + '</span><div><small>About us</small><b>20 years, 140+ projects delivered</b><i></i><i></i></div></div>' +
        '<div class="ivsv"><small>Our services</small><div class="ivg">' + svc('iv-build', 'Construction') + svc('iv-estate', 'Real estate') + svc('iv-consult', 'Consulting') + '</div></div>' +
        '<div class="ivct"><span><b>Contact us</b>info@ivcon.com.pk</span><em class="ivbtn">Get in touch</em></div></div>';
    },
    store: function(){
      /* Photos live in photos/ next to the page; if a photo can't load, the drawn dish or dark banner behind it shows instead. */
      var ph = function(src, cls, w, h){ return '<img class="' + cls + '" src="' + src + '" alt="" loading="lazy" width="' + w + '" height="' + h + '" onerror="this.remove()">'; };
      var dish = function(src, d, name, price){ return '<div class="rp"><span class="dish ' + d + ' dwrap">' + ph(src, 'dimg', 120, 96) + '</span><b>' + name + '</b><span class="rpr">' + price + '<em class="radd">+</em></span></div>'; };
      return '<div class="br rest"><div class="b"><i></i><i></i><i></i><span class="url">ogburgers.pk/menu</span></div>' +
        '<div class="rh"><span class="rl"><i>OG</i>OG Burgers</span><span class="rn">Menu</span><span class="rn">Deals</span><span class="rcart"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 5h10l-1 9H4zM6 5V4a2 2 0 014 0v1" fill="none" stroke="currentColor" stroke-width="1.5"/></svg><b class="cartn">2</b></span></div>' +
        '<div class="rhero"><div class="rslides" aria-hidden="true">' + ph('photos/og-s0.webp', '', 560, 320) + ph('photos/og-s1.webp', '', 560, 320) + ph('photos/og-s2.webp', '', 560, 320) + '</div>' +
        '<div class="rtx"><small>Open till 1 am · Free delivery</small><span class="type" data-text="Smashed fresh, at your door in 30 min.">Smashed fresh, at your door in 30 min.</span><em class="rbtn">Order now</em></div><span class="rdots"><i></i><i></i><i></i></span></div>' +
        '<div class="rcards">' + dish('photos/og-b1.webp', 'd1', 'OG Smash', 'Rs 950') + dish('photos/og-b2.webp', 'd1', 'Grill Classic', 'Rs 1,150') + dish('photos/og-ch.webp', 'd4', 'Crispy chicken', 'Rs 850') + '</div></div>';
    },
    brand: function(){ return '<div class="ba"><div class="bf"><span>Shop Name</span></div><div class="af"><div class="mk"><i>K</i><b>Kiran Bakers</b></div></div><em class="e1">BEFORE</em><em class="e2">AFTER</em><span class="div"></span></div>'; },
    erp: function(s){ return '<div class="br erpshot"><div class="b"><i></i><i></i><i></i></div><div class="ev"><span class="scan" aria-hidden="true"></span><img src="' + esc(s.img) + '" alt="' + esc(s.title) + ' dashboard example" loading="lazy" width="1400" height="875"></div></div>'; },
    portal: function(){ return '<div class="nodes"><svg viewBox="0 0 250 190" preserveAspectRatio="none" aria-hidden="true"><path class="flow" d="M30 95 C110 95 120 30 190 30 M30 95 L190 95 M30 95 C110 95 120 160 190 160" fill="none" stroke="#D9D6CE" stroke-width="1.2"/></svg><span class="hub">' + MK + '</span><span class="ch" style="top:16%"><i></i>Orders</span><span class="ch" style="top:50%"><i></i>Invoices</span><span class="ch" style="top:84%"><i></i>Approvals</span></div>'; }
  };

  /* Which pricing tab (and plan) each service card opens */
  var GO = { web: ['web', ''], store: ['web', 'Online store'], brand: ['brand', ''], erp: ['erp', ''], portal: ['erp', 'Custom business portal'] };
  function services(d){
    return d.services.map(function(s){
      var go = GO[s.key] || ['web', ''];
      return '<article class="svc rv" data-key="' + esc(s.key) + '"><h3>' + esc(s.title) + '</h3><div class="art">' + (ART[s.key] ? ART[s.key](s) : '') + '</div><p>' + esc(s.text) + '</p>' +
        '<div class="pr"><span>' + esc(s.price) + '</span><span class="more" aria-hidden="true">See prices →</span></div>' +
        '<a class="svc-link" href="#pricing" data-tab="' + go[0] + '"' + (go[1] ? ' data-focus="' + esc(go[1]) + '"' : '') + ' aria-label="See ' + esc(s.title) + ' prices"></a></article>';
    }).join('') +
    '<article class="svc cta rv"><h3>' + esc(d.servicesCta.title) + '</h3><div><p>' + esc(d.servicesCta.text) + '</p><a class="btn white" href="#quote">' + esc(d.servicesCta.button) + '</a></div></article>';
  }

  function pricing(d){
    var cats = d.pricing.cats;
    var tabs = '<div><div class="toggle" role="tablist" aria-label="Pricing category">' + cats.map(function(c, i){
      return '<button role="tab" aria-selected="' + (i === 0) + '" aria-controls="p-' + esc(c.key) + '" id="t-' + esc(c.key) + '" data-tab="' + esc(c.key) + '">' + esc(c.label) + '</button>';
    }).join('') + '</div></div><p class="tnote" id="tnote">' + esc((cats[0] || {}).note) + '</p>';
    var panels = cats.map(function(c, i){
      return '<div class="plans" id="p-' + esc(c.key) + '" role="tabpanel" aria-labelledby="t-' + esc(c.key) + '" data-note="' + esc(c.note) + '"' + (i ? ' hidden' : '') + '>' + c.plans.map(function(p){
        var cls = p.style === 'pop' ? ' pop' : p.style === 'fav' ? ' fav' : '';
        var tabIc = p.style === 'pop' ? BOLT : p.style === 'fav' ? HEART : '';
        return '<article class="plan' + cls + '"><div class="tab">' + tabIc + esc(p.tab) + '</div><div class="body">' +
          '<span class="ic"><svg viewBox="0 0 24 24" fill="none" stroke-width="1.5" aria-hidden="true">' + (ICONS[p.icon] || ICONS.site) + '</svg></span>' +
          '<h3>' + esc(p.name) + '</h3><div class="price">' + (p.prefix ? '<small>' + esc(p.prefix) + '</small>' : '') + '<b>' + esc(p.price) + '</b>' + (p.suffix ? '<small>' + esc(p.suffix) + '</small>' : '') + '</div>' +
          '<p class="desc">' + esc(p.desc) + '</p>' +
          '<a class="btn block" href="#quote" data-service="' + esc(p.service) + '" data-plan="' + esc(p.name) + '">' + esc(p.button) + '</a>' +
          '<ul>' + p.features.map(function(f){ return '<li>' + esc(f) + '</li>'; }).join('') + '</ul></div></article>';
      }).join('') + '</div>';
    }).join('');
    return tabs + panels + '<p class="pnote">' + esc(d.pricing.note) + ' Not sure which fits? <a href="#quote">Get a free quote</a> and we\'ll tell you.</p>';
  }

  var ARR = '<span class="arr" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2"><path d="M12 5v14M6 13l6 6 6-6"/></svg></span>';
  function faq(d){
    return d.faq.map(function(f, i){ return '<details class="faq"' + (i ? '' : ' open') + '><summary>' + esc(f.q) + ARR + '</summary><p>' + esc(f.a) + '</p></details>'; }).join('');
  }

  function md(text){
    var out = [], list = null;
    String(text || '').split(/\n/).forEach(function(line){
      var t = line.trim();
      if (/^- /.test(t)) { if (!list) { list = []; } list.push('<li>' + esc(t.slice(2)) + '</li>'); return; }
      if (list) { out.push('<ul>' + list.join('') + '</ul>'); list = null; }
      if (!t) return;
      if (/^### /.test(t)) out.push('<h3>' + esc(t.slice(4)) + '</h3>');
      else if (/^## /.test(t)) out.push('<h2>' + esc(t.slice(3)) + '</h2>');
      else out.push('<p>' + esc(t) + '</p>');
    });
    if (list) out.push('<ul>' + list.join('') + '</ul>');
    return out.join('');
  }
  function terms(d){
    return '<p class="t-eyebrow">Legal</p><h1>Terms &amp; Conditions</h1><p class="t-upd">Last updated ' + esc(d.terms.updated) + '</p><div class="t-body">' + md(d.terms.body) + '</div>' +
      '<p class="t-note">Questions? Email <b>' + esc(d.brand.email) + '</b>' + (d.brand.whatsapp ? ' or WhatsApp <b>+' + esc(digits(d.brand.whatsapp)) + '</b>' : '') + '.</p>';
  }

  function qcontact(d){
    var b = d.brand;
    return 'Or contact us directly<b id="contactEmail">' + esc(b.email) + '</b>' + (b.whatsapp ? '<b>WhatsApp +' + esc(digits(b.whatsapp)) + '</b>' : '') + (b.phone ? '<b>Phone ' + esc(b.phone) + '</b>' : '');
  }
  function fcontact(d){
    var b = d.brand;
    return '<span class="fh">Contact</span><span>' + esc(b.email) + '</span>' + (b.whatsapp ? '<a href="https://wa.me/' + digits(b.whatsapp) + '" target="_blank" rel="noopener">WhatsApp +' + esc(digits(b.whatsapp)) + '</a>' : '') + (b.phone ? '<span>' + esc(b.phone) + '</span>' : '') + '<span>' + esc(b.city) + ', ' + esc(b.country) + '</span>';
  }
  function wa(d){
    var n = digits(d.brand.whatsapp);
    return n ? '<a class="wa-float" href="https://wa.me/' + n + '?text=' + encodeURIComponent('Hi ' + d.brand.name + ', I would like a quote.') + '" target="_blank" rel="noopener" aria-label="Chat with us on WhatsApp"><svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2a10 10 0 00-8.6 15.1L2 22l5-1.3A10 10 0 1012 2zm0 18.2a8.2 8.2 0 01-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1112 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8s-.4-.1-.6.1-.7.8-.8 1-.3.2-.5.1a6.7 6.7 0 01-3.3-2.9c-.3-.4.3-.4.7-1.4.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 00-.7.3 3 3 0 00-.9 2.2 5.2 5.2 0 001.1 2.8 11.9 11.9 0 004.6 4c1.7.7 2.4.8 3.2.7a2.8 2.8 0 001.8-1.3 2.3 2.3 0 00.2-1.3c-.1-.1-.3-.2-.5-.3z"/></svg><span>WhatsApp us</span></a>' : '';
  }

  var REGIONS = { seo: seo, heroTop: heroTop, heroPanel: heroPanel, erp: erp, services: services, pricing: pricing, faq: faq, terms: terms, qcontact: qcontact, fcontact: fcontact, wa: wa };
  var OPEN = '<' + '!--K:', CLOSE = '<' + '!--/K:', END = '--' + '>';

  /* Rebuild the page source with new data: every marked region and the data block. */
  function build(src, data){
    Object.keys(REGIONS).forEach(function(k){
      var a = OPEN + k + END, b = CLOSE + k + END, i = src.indexOf(a), j = src.indexOf(b);
      if (i < 0 || j < 0) return;
      src = src.slice(0, i + a.length) + REGIONS[k](data) + src.slice(j);
    });
    var da = '<script type="application/json" id="site-data">', i2 = src.indexOf(da), j2 = src.indexOf('</' + 'script>', i2);
    src = src.slice(0, i2 + da.length) + jsonSafe(data) + src.slice(j2);
    return src;
  }
  /* The complete document a fresh viewer receives, with the source carried inside itself. */
  var SKELETON = '<!doctype html><html><head><meta charset=utf8><meta name=viewport content="width=device-width,initial-scale=1,viewport-fit=cover"><style>:root{color-scheme:light;box-sizing:border-box;padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}html{scroll-padding-top:env(safe-area-inset-top,0px)}body{margin:0;padding:0;font:14px -apple-system,BlinkMacSystemFont,sans-serif;background:#fff;color:#000}img{max-width:100%}[hidden]:not([hidden=until-found i]){display:none!important}</style></head><body>';
  var TOKEN = '__LAURENT' + '_SRC__';
  function embed(src){ var i = src.indexOf(TOKEN); return src.slice(0, i) + JSON.stringify(src).replace(/</g, '\\u003c') + src.slice(i + TOKEN.length); }
  function documentFor(src, data){ return SKELETON + embed(build(src, data)) + '</body></html>'; }

  return { esc: esc, REGIONS: REGIONS, build: build, embed: embed, documentFor: documentFor, md: md, ICONS: ICONS };
})();
