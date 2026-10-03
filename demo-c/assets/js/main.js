(function () {
  'use strict';
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* year */
  $$('[data-year]').forEach(function (e) { e.textContent = new Date().getFullYear(); });

  /* header scroll + menu */
  var header = $('.site-header');
  var onScroll = function () { header.classList.toggle('scrolled', window.scrollY > 8); };
  onScroll(); window.addEventListener('scroll', onScroll, { passive: true });

  var btn = $('#menuBtn'), nav = $('#nav');
  var mq = window.matchMedia('(min-width: 960px)');
  function setMenu(open) {
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    nav.classList.toggle('open', open);
  }
  btn.addEventListener('click', function () { setMenu(btn.getAttribute('aria-expanded') !== 'true'); });
  $$('a', nav).forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && btn.getAttribute('aria-expanded') === 'true') { setMenu(false); btn.focus(); }
  });
  var syncMq = function () { if (mq.matches) setMenu(false); };
  if (mq.addEventListener) mq.addEventListener('change', syncMq);

  /* reveal */
  var rev = $$('[data-reveal]');
  if ('IntersectionObserver' in window && !reduce) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } });
    }, { threshold: 0.12 });
    rev.forEach(function (el, i) { el.style.setProperty('--d', (i % 3) * 0.08 + 's'); io.observe(el); });
  } else { rev.forEach(function (el) { el.classList.add('is-in'); }); }

  /* ---------- coverage ---------- */
  var AREAS = {
    CT: { title: 'CT: East Kent, Canterbury and Dover area', towns: [
      'Dover', 'Deal', 'Folkestone', 'Hythe', 'Canterbury', 'Herne Bay', 'Whitstable', 'Margate', 'Broadstairs', 'Ramsgate', 'Sandwich',
      'Ash', 'Aylesham', 'Capel-le-Ferne', 'Denton', 'East Langdon', 'Eastry', 'Eythorne', 'Goodnestone', 'Great Mongeham', 'Guston',
      'Hougham', 'Langdon', 'Lydden', 'Nonington', 'Preston', 'Ringwould'] },
    ME: { title: 'ME: Medway and North Kent', towns: [
      'Maidstone', 'Rochester', 'Chatham', 'Gillingham', 'Rainham', 'Medway', 'Aylesford', 'Kings Hill', 'Sittingbourne', 'Faversham'] },
    DA: { title: 'DA: Dartford and Gravesend', towns: ['Dartford', 'Gravesend', 'West Kingsdown'] },
    TN: { title: 'TN: West Kent', towns: ['Tonbridge', 'Tunbridge Wells', 'Sevenoaks', 'Cranbrook'] },
    Ashford: { title: 'Ashford (TN23, TN24, TN25)', towns: ['Ashford'] }
  };
  var ORDER = ['CT', 'ME', 'DA', 'TN', 'Ashford'];
  var tabs = $$('#areaTabs [role=tab]'), regions = $$('.region'), chips = $('#chips'),
      title = $('#areaTitle'), msg = $('#covMsg'), search = $('#townSearch'), panel = $('#chipPanel');
  var current = 'CT';

  function render(list, withArea) {
    chips.innerHTML = '';
    list.forEach(function (t) {
      var li = document.createElement('li');
      li.textContent = t.name;
      if (withArea) { var s = document.createElement('small'); s.textContent = t.area; li.appendChild(s); }
      chips.appendChild(li);
    });
  }
  function select(area, focusTab) {
    current = area;
    tabs.forEach(function (t) {
      var on = t.dataset.area === area;
      t.setAttribute('aria-selected', on ? 'true' : 'false');
      t.tabIndex = on ? 0 : -1;
      if (on) { panel.setAttribute('aria-labelledby', t.id); if (focusTab) t.focus(); }
    });
    regions.forEach(function (r) { r.classList.toggle('active', r.dataset.area === area); });
    if (search.value) search.value = '';
    title.textContent = AREAS[area].title;
    render(AREAS[area].towns.map(function (n) { return { name: n }; }));
    msg.textContent = 'We cover all of these, day and night. Also nearby villages: call us if yours is not listed.';
  }
  tabs.forEach(function (t, i) {
    t.addEventListener('click', function () { select(t.dataset.area); });
    t.addEventListener('keydown', function (e) {
      var n = null;
      if (e.key === 'ArrowRight') n = (i + 1) % tabs.length;
      else if (e.key === 'ArrowLeft') n = (i - 1 + tabs.length) % tabs.length;
      else if (e.key === 'Home') n = 0;
      else if (e.key === 'End') n = tabs.length - 1;
      if (n !== null) { e.preventDefault(); select(tabs[n].dataset.area, true); }
    });
  });
  regions.forEach(function (r) {
    r.addEventListener('click', function () { select(r.dataset.area); });
    r.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); select(r.dataset.area); }
    });
  });
  search.addEventListener('input', function () {
    var q = search.value.trim().toLowerCase();
    if (!q) { select(current); return; }
    var hits = [];
    ORDER.forEach(function (a) {
      AREAS[a].towns.forEach(function (n) { if (n.toLowerCase().indexOf(q) !== -1) hits.push({ name: n, area: a }); });
    });
    title.textContent = 'Search results';
    render(hits, true);
    msg.textContent = hits.length
      ? 'Great news, we cover ' + (hits.length === 1 ? 'this area' : 'these areas') + '. Call or WhatsApp for a fitter.'
      : 'Not in our list, but we cover 170+ Kent towns. Call 01304 350200 to check your exact spot.';
    if (hits.length === 1) {
      regions.forEach(function (r) { r.classList.toggle('active', r.dataset.area === hits[0].area); });
    }
  });
  $$('[data-area-link]').forEach(function (a) {
    a.addEventListener('click', function () { select(a.dataset.areaLink); });
  });
  select('CT');

  /* ---------- carousel ---------- */
  var track = $('#track');
  function step() { var c = track.firstElementChild; return c ? c.getBoundingClientRect().width + 16 : 300; }
  $('#prev').addEventListener('click', function () { track.scrollBy({ left: -step(), behavior: reduce ? 'auto' : 'smooth' }); });
  $('#next').addEventListener('click', function () { track.scrollBy({ left: step(), behavior: reduce ? 'auto' : 'smooth' }); });
  track.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowRight') { e.preventDefault(); track.scrollBy({ left: step(), behavior: reduce ? 'auto' : 'smooth' }); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); track.scrollBy({ left: -step(), behavior: reduce ? 'auto' : 'smooth' }); }
    else if (e.key === 'Home') { e.preventDefault(); track.scrollTo({ left: 0 }); }
    else if (e.key === 'End') { e.preventDefault(); track.scrollTo({ left: track.scrollWidth }); }
  });

  /* ---------- accordion ---------- */
  var accBtns = $$('.acc-btn');
  accBtns.forEach(function (b, i) {
    b.addEventListener('click', function () {
      var open = b.getAttribute('aria-expanded') === 'true';
      b.setAttribute('aria-expanded', open ? 'false' : 'true');
      document.getElementById(b.getAttribute('aria-controls')).hidden = open;
    });
    b.addEventListener('keydown', function (e) {
      var n = null;
      if (e.key === 'ArrowDown') n = (i + 1) % accBtns.length;
      else if (e.key === 'ArrowUp') n = (i - 1 + accBtns.length) % accBtns.length;
      if (n !== null) { e.preventDefault(); accBtns[n].focus(); }
    });
  });

  /* ---------- form (mailto) ---------- */
  var form = $('#qform'), status = $('#formStatus');
  function clearErr(f) { f.classList.remove('err'); var m = $('.emsg', f); if (m) m.remove(); }
  function setErr(input, text) {
    var f = input.closest('.field'); clearErr(f); f.classList.add('err');
    var p = document.createElement('p'); p.className = 'emsg'; p.id = input.id + '-err'; p.textContent = text; f.appendChild(p);
    input.setAttribute('aria-invalid', 'true'); input.setAttribute('aria-describedby', p.id);
  }
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    status.textContent = '';
    var bad = null;
    $$('.field', form).forEach(clearErr);
    $$('input,select,textarea', form).forEach(function (i) { i.removeAttribute('aria-invalid'); i.removeAttribute('aria-describedby'); });
    ['name', 'email', 'phone', 'postcode', 'service'].forEach(function (n) {
      var i = form.elements[n]; var v = i.value.trim(); var m = null;
      if (!v) m = 'Please fill this in.';
      else if (n === 'email' && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v)) m = 'Please enter a valid email.';
      else if (n === 'phone' && v.replace(/\D/g, '').length < 10) m = 'Please enter a valid phone number.';
      if (m) { setErr(i, m); if (!bad) bad = i; }
    });
    if (bad) { bad.focus(); return; }
    var g = function (n) { return form.elements[n].value.trim(); };
    var body = 'Name: ' + g('name') + '\nEmail: ' + g('email') + '\nPhone: ' + g('phone') + '\nPostcode: ' + g('postcode') +
      '\nService: ' + g('service') + '\n\nMessage:\n' + (g('message') || '-');
    var url = 'mailto:' + form.dataset.to + '?subject=' + encodeURIComponent('Callback request: ' + g('service') + ' (' + g('postcode') + ')') +
      '&body=' + encodeURIComponent(body);
    status.textContent = 'Opening your email app. If nothing happens, please email info@k1dovertyres.co.uk or call 01304 350200.';
    window.location.href = url;
  });
})();


