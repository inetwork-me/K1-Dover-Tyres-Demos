(function () {
  'use strict';
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  // year
  $$('[data-year]').forEach(function (e) { e.textContent = new Date().getFullYear(); });

  // header shadow
  var hd = $('header.site');
  var onScroll = function () { hd.classList.toggle('scrolled', window.scrollY > 10); };
  window.addEventListener('scroll', onScroll, { passive: true }); onScroll();

  // mobile menu
  var btn = $('.menu-btn'), nav = $('#nav');
  function setMenu(open) {
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    nav.classList.toggle('open', open);
  }
  btn.addEventListener('click', function () { setMenu(btn.getAttribute('aria-expanded') !== 'true'); });
  $$('a', nav).forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && btn.getAttribute('aria-expanded') === 'true') { setMenu(false); btn.focus(); }
  });

  // accordion
  $$('#acc button').forEach(function (b) {
    b.addEventListener('click', function () {
      var open = b.getAttribute('aria-expanded') === 'true';
      b.setAttribute('aria-expanded', open ? 'false' : 'true');
      $('#' + b.getAttribute('aria-controls')).classList.toggle('open', !open);
    });
  });

  // reveal
  var items = $$('[data-reveal]');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { threshold: 0.12 });
    items.forEach(function (i) { io.observe(i); });
  } else { items.forEach(function (i) { i.classList.add('in'); }); }

  // ---- postcode / town coverage checker (data from the content brief) ----
  var AREAS = {
    CT: ['Dover', 'Hythe', 'Canterbury', 'Deal', 'Folkestone', 'Herne Bay', 'Margate', 'Whitstable', 'Broadstairs', 'Ramsgate', 'Sandwich', 'Ash', 'Aylesham', 'Capel-le-Ferne', 'Denton', 'East Langdon', 'Eastry', 'Eythorne', 'Goodnestone', 'Great Mongeham', 'Guston', 'Hougham', 'Langdon', 'Lydden', 'Nonington', 'Preston', 'Ringwould', 'Buckland', 'Whitfield', 'River', 'Temple Ewell', 'Kearsney', "St Margaret's at Cliffe"],
    ME: ['Maidstone', 'Rochester', 'Chatham', 'Gillingham', 'Aylesford', 'Kings Hill', 'Sittingbourne', 'Faversham', 'Medway', 'Rainham'],
    DA: ['Dartford', 'Gravesend', 'West Kingsdown'],
    TN: ['Tonbridge', 'Tunbridge Wells', 'Sevenoaks', 'Cranbrook', 'Ashford']
  };
  var TEL = 'tel:01304350200', WA = 'https://wa.me/447842290576';
  var norm = function (s) { return s.toLowerCase().replace(/[^a-z0-9 ]/g, '').replace(/\s+/g, ' ').trim(); };
  var TOWN = {};
  Object.keys(AREAS).forEach(function (k) { AREAS[k].forEach(function (t) { TOWN[norm(t)] = { name: t, area: k }; }); });
  var AREA_NAMES = { CT: 'East Kent (CT)', ME: 'Medway & North Kent (ME)', DA: 'Dartford & Gravesend (DA)', TN: 'West Kent & Ashford (TN)' };

  function buttons() {
    return '<div class="cta-row"><a class="btn btn-red" href="' + TEL + '">Call now 01304 350200</a>' +
      '<a class="btn btn-wa" href="' + WA + '" target="_blank" rel="noopener">WhatsApp</a></div>';
  }
  function clearHits() { $$('.hit', $('#cov-grid')).forEach(function (e) { e.classList.remove('hit'); }); $$('.area.hit').forEach(function (e) { e.classList.remove('hit'); }); }
  function mark(area, name) {
    clearHits();
    var card = $('.area[data-pc="' + area + '"]');
    if (!card) return;
    card.classList.add('hit');
    if (name) $$('li', card).forEach(function (li) { if (norm(li.textContent) === norm(name)) li.classList.add('hit'); });
  }

  var form = $('#chk'), input = $('#chk-in'), out = $('#chk-out');
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var raw = input.value, q = norm(raw);
    out.className = 'result';
    if (!q) { out.className = 'result show no'; out.innerHTML = '<strong>Enter a postcode or town</strong>Try something like CT16 2LL or Maidstone.'; clearHits(); return; }
    var hit = null, label = '';
    var pm = raw.trim().toUpperCase().match(/^(CT|ME|DA|TN)\s?\d{1,2}/);
    if (pm) {
      hit = pm[1];
      var district = raw.trim().toUpperCase().match(/^[A-Z]{1,2}\d{1,2}/)[0];
      label = 'the ' + district + ' area';
      mark(hit);
    } else if (TOWN[q]) {
      hit = TOWN[q].area; label = TOWN[q].name; mark(hit, TOWN[q].name);
    } else {
      // partial / contains match on town names
      var keys = Object.keys(TOWN).filter(function (k) { return q.length > 2 && (k.indexOf(q) === 0 || q.indexOf(k) !== -1 && k.length > 3); });
      if (keys.length) { var t = TOWN[keys[0]]; hit = t.area; label = t.name; mark(hit, t.name); }
    }
    if (hit) {
      out.className = 'result show yes';
      out.innerHTML = '<strong>Yes &mdash; we cover ' + label.replace(/</g, '&lt;') + '</strong>Part of our ' + AREA_NAMES[hit] + ' patch. Call now and a fitter is dispatched.' + buttons();
    } else {
      clearHits();
      out.className = 'result show no';
      out.innerHTML = '<strong>Call us to check</strong>We couldn&rsquo;t match that to our list, but we cover a lot of Kent. Give us a ring and we will tell you straight away.' + buttons();
    }
  });

  // ---- quote form -> mailto ----
  var qf = $('#qf'), st = $('#qs');
  var rules = [
    ['f-name', 'e-name', function (v) { return v.trim().length > 1; }, 'Please enter your name.'],
    ['f-phone', 'e-phone', function (v) { return v.replace(/\D/g, '').length >= 10; }, 'Please enter a valid phone number.'],
    ['f-email', 'e-email', function (v) { return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v.trim()); }, 'Please enter a valid email.'],
    ['f-pc', 'e-pc', function (v) { return v.trim().length >= 3; }, 'Please enter your postcode.'],
    ['f-svc', 'e-svc', function (v) { return v !== ''; }, 'Please choose a service.']
  ];
  qf.addEventListener('submit', function (e) {
    e.preventDefault();
    var ok = true, first = null;
    rules.forEach(function (r) {
      var el = $('#' + r[0]), er = $('#' + r[1]), good = r[2](el.value);
      el.setAttribute('aria-invalid', good ? 'false' : 'true');
      if (!good) el.setAttribute('aria-describedby', r[1]); else el.removeAttribute('aria-describedby');
      er.textContent = good ? '' : r[3];
      if (!good) { ok = false; first = first || el; }
    });
    if (!ok) { st.textContent = 'Please check the highlighted fields.'; first.focus(); return; }
    var v = function (id) { return $('#' + id).value.trim(); };
    var body = 'Name: ' + v('f-name') + '\nPhone: ' + v('f-phone') + '\nEmail: ' + v('f-email') + '\nPostcode: ' + v('f-pc') +
      '\nService: ' + v('f-svc') + '\n\nMessage:\n' + (v('f-msg') || '(none)');
    window.location.href = 'mailto:info@k1dovertyres.co.uk?subject=' + encodeURIComponent('Callback request: ' + v('f-svc')) + '&body=' + encodeURIComponent(body);
    st.textContent = 'Your email app should now open with your request. Press send to submit it. Urgent? Call 01304 350200.';
  });
})();
