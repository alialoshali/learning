/* Shared helpers for interactive lessons. Exposes window.L.
   Loaded after KaTeX, before each page's own script. */
(function () {
  'use strict';
  var root = document.documentElement;
  var FB = { '--line': '#dfe3ea', '--muted': '#5d6675', '--accent': '#2f54eb', '--warm': '#e8590c', '--surface': '#ffffff',
    '--text': '#171b24', '--bg': '#f6f7f9', '--green': '#2f9e44', '--purple': '#9c36b5', '--teal': '#0c8599', '--red': '#e03131', '--yellow': '#f08c00' };
  function col(n) { return getComputedStyle(root).getPropertyValue(n).trim() || FB[n]; }
  function $(id) { return document.getElementById(id); }
  var C = { blue: '#2f54eb', orange: '#e8590c', green: '#2f9e44', purple: '#9c36b5', teal: '#0c8599', yellow: '#f08c00', red: '#e03131', gray: '#868e96', pink: '#d6336c', ink: '#171b24' };
  var PAL = [C.blue, C.orange, C.green, C.purple, C.teal, C.yellow, C.pink, C.gray];

  /* ---------- seeded random numbers ---------- */
  function rng(seed) {
    var s = (seed || 1) % 2147483647; if (s <= 0) s += 2147483646;
    var r = function () { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
    r.g = function () { return Math.sqrt(-2 * Math.log(r() + 1e-12)) * Math.cos(6.283185307 * r()); };
    r.int = function (n) { return Math.floor(r() * n); };
    s = (s * 48271 + 12345) % 2147483647 || 1; for (var i = 0; i < 8; i++) r();
    return r;
  }

  /* ---------- canvas with crisp HiDPI backing store ---------- */
  function ctx(id) {
    var c = typeof id === 'string' ? $(id) : id;
    if (!c.dataset.w) { c.dataset.w = c.width; c.dataset.h = c.height; }
    var W = +c.dataset.w, H = +c.dataset.h, d = Math.min(window.devicePixelRatio || 1, 2);
    if (c.width !== Math.round(W * d)) { c.width = Math.round(W * d); c.height = Math.round(H * d); }
    var g = c.getContext('2d'); g.setTransform(d, 0, 0, d, 0, 0); g.clearRect(0, 0, W, H);
    g.lineCap = 'round'; g.lineJoin = 'round';
    return { c: c, g: g, W: W, H: H };
  }

  /* ---------- a 2-D plot in data coordinates ----------
     o = {x:[x0,x1], y:[y0,y1], xl:'x label', yl:'y label', grid:true, ticks:true, m:[t,r,b,l], frame:true} */
  function plot(id, o) {
    o = o || {};
    var k = ctx(id), g = k.g, W = k.W, H = k.H;
    var x0 = o.x ? o.x[0] : 0, x1 = o.x ? o.x[1] : 1, y0 = o.y ? o.y[0] : 0, y1 = o.y ? o.y[1] : 1;
    var m = o.m || [14, 14, o.xl ? 38 : 26, o.yl ? 50 : 38];
    var L0 = m[3], R0 = W - m[1], T0 = m[0], B0 = H - m[2];
    var p = { c: k.c, g: g, W: W, H: H, x0: x0, x1: x1, y0: y0, y1: y1, L: L0, R: R0, T: T0, B: B0 };
    p.X = function (v) { return L0 + (v - x0) / (x1 - x0) * (R0 - L0); };
    p.Y = function (v) { return B0 - (v - y0) / (y1 - y0) * (B0 - T0); };
    p.ix = function (px) { return x0 + (px - L0) / (R0 - L0) * (x1 - x0); };
    p.iy = function (py) { return y0 + (B0 - py) / (B0 - T0) * (y1 - y0); };
    function nice(span, n) { var r = span / n, e = Math.pow(10, Math.floor(Math.log10(r))), f = r / e; return (f < 1.5 ? 1 : f < 3 ? 2 : f < 7 ? 5 : 10) * e; }
    function fmt(v, s) { var d = s >= 1 ? 0 : Math.min(3, Math.ceil(-Math.log10(s))); return (+v.toFixed(d)).toString(); }
    g.font = '12px "IBM Plex Sans", system-ui, sans-serif';
    if (o.grid !== false || o.ticks !== false) {
      var sx = nice(x1 - x0, Math.max(3, (R0 - L0) / 80)), sy = nice(y1 - y0, Math.max(3, (B0 - T0) / 55));
      g.lineWidth = 1;
      for (var v = Math.ceil(x0 / sx) * sx; v <= x1 + 1e-9; v += sx) {
        if (o.grid !== false) { g.strokeStyle = col('--line'); g.globalAlpha = .55; g.beginPath(); g.moveTo(p.X(v), T0); g.lineTo(p.X(v), B0); g.stroke(); g.globalAlpha = 1; }
        if (o.ticks !== false && o.xt !== false) { g.fillStyle = col('--muted'); g.textAlign = 'center'; g.textBaseline = 'top'; g.fillText(fmt(v, sx), p.X(v), B0 + 5); }
      }
      for (v = Math.ceil(y0 / sy) * sy; v <= y1 + 1e-9; v += sy) {
        if (o.grid !== false) { g.strokeStyle = col('--line'); g.globalAlpha = .55; g.beginPath(); g.moveTo(L0, p.Y(v)); g.lineTo(R0, p.Y(v)); g.stroke(); g.globalAlpha = 1; }
        if (o.ticks !== false && o.yt !== false) { g.fillStyle = col('--muted'); g.textAlign = 'right'; g.textBaseline = 'middle'; g.fillText(fmt(v, sy), L0 - 6, p.Y(v)); }
      }
    }
    if (o.frame !== false) { g.strokeStyle = col('--line'); g.lineWidth = 1; g.strokeRect(L0, T0, R0 - L0, B0 - T0); }
    g.fillStyle = col('--muted'); g.font = '12.5px "IBM Plex Sans", system-ui, sans-serif';
    if (o.xl) { g.textAlign = 'center'; g.textBaseline = 'bottom'; g.fillText(o.xl, (L0 + R0) / 2, H - 2); }
    if (o.yl) { g.save(); g.translate(12, (T0 + B0) / 2); g.rotate(-Math.PI / 2); g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(o.yl, 0, 0); g.restore(); }
    g.textAlign = 'left'; g.textBaseline = 'alphabetic';

    p.clip = function (f) { g.save(); g.beginPath(); g.rect(L0, T0, R0 - L0, B0 - T0); g.clip(); f(); g.restore(); };
    p.line = function (f, c, lw, dash, n) {
      p.clip(function () {
        g.beginPath(); g.strokeStyle = c || C.blue; g.lineWidth = lw || 2.5; g.setLineDash(dash || []);
        var s = false, N = n || 300;
        for (var i = 0; i <= N; i++) {
          var x = x0 + (x1 - x0) * i / N, y = f(x);
          if (!isFinite(y) || y < y0 - (y1 - y0) || y > y1 + (y1 - y0)) { s = false; continue; }
          g[s ? 'lineTo' : 'moveTo'](p.X(x), p.Y(y)); s = true;
        }
        g.stroke(); g.setLineDash([]);
      });
    };
    p.path = function (pts, c, lw, dash, fill, alpha) {
      if (!pts.length) return;
      p.clip(function () {
        g.beginPath(); pts.forEach(function (q, i) { g[i ? 'lineTo' : 'moveTo'](p.X(q[0]), p.Y(q[1])); });
        if (fill) { g.globalAlpha = alpha == null ? .2 : alpha; g.fillStyle = fill; g.closePath(); g.fill(); g.globalAlpha = 1; }
        if (c) { g.strokeStyle = c; g.lineWidth = lw || 2; g.setLineDash(dash || []); g.stroke(); g.setLineDash([]); }
      });
    };
    p.dot = function (x, y, c, r, ring) {
      g.beginPath(); g.arc(p.X(x), p.Y(y), r || 5, 0, 6.2832); g.fillStyle = c || C.blue; g.fill();
      if (ring !== false) { g.lineWidth = 1.3; g.strokeStyle = ring || col('--surface'); g.stroke(); }
    };
    p.ring = function (x, y, c, r, lw) { g.beginPath(); g.arc(p.X(x), p.Y(y), r || 8, 0, 6.2832); g.strokeStyle = c; g.lineWidth = lw || 2; g.stroke(); };
    p.hl = function (y, c, dash, lw) { g.beginPath(); g.strokeStyle = c || col('--muted'); g.lineWidth = lw || 1; g.setLineDash(dash || [4, 4]); g.moveTo(L0, p.Y(y)); g.lineTo(R0, p.Y(y)); g.stroke(); g.setLineDash([]); };
    p.vl = function (x, c, dash, lw) { g.beginPath(); g.strokeStyle = c || col('--muted'); g.lineWidth = lw || 1; g.setLineDash(dash || [4, 4]); g.moveTo(p.X(x), T0); g.lineTo(p.X(x), B0); g.stroke(); g.setLineDash([]); };
    p.seg = function (xa, ya, xb, yb, c, lw, dash) { p.clip(function () { g.beginPath(); g.strokeStyle = c || C.ink; g.lineWidth = lw || 1.5; g.setLineDash(dash || []); g.moveTo(p.X(xa), p.Y(ya)); g.lineTo(p.X(xb), p.Y(yb)); g.stroke(); g.setLineDash([]);  }); };
    p.arrow = function (xa, ya, xb, yb, c, lw) { arrow(g, p.X(xa), p.Y(ya), p.X(xb), p.Y(yb), c, lw); };
    p.text = function (s, x, y, c, align, font, base) { g.fillStyle = c || col('--muted'); g.textAlign = align || 'left'; g.textBaseline = base || 'alphabetic'; g.font = font || '12.5px "IBM Plex Sans", system-ui, sans-serif'; g.fillText(s, p.X(x), p.Y(y)); g.textAlign = 'left'; g.textBaseline = 'alphabetic'; };
    p.ptext = function (s, px, py, c, align, font) { g.fillStyle = c || col('--muted'); g.textAlign = align || 'left'; g.font = font || '12.5px "IBM Plex Sans", system-ui, sans-serif'; g.fillText(s, px, py); g.textAlign = 'left'; };
    p.rect = function (xa, ya, xb, yb, fill, alpha) { g.globalAlpha = alpha == null ? 1 : alpha; g.fillStyle = fill; var a = p.X(xa), b = p.Y(yb); g.fillRect(a, b, p.X(xb) - a, p.Y(ya) - b); g.globalAlpha = 1; };
    /* colour the background: f(x,y) returns a css colour (or null) and an alpha */
    p.field = function (f, n) {
      n = n || 60;
      var oc = document.createElement('canvas'); oc.width = n; oc.height = n;
      var og = oc.getContext('2d'), im = og.createImageData(n, n), dx = (x1 - x0) / n, dy = (y1 - y0) / n;
      for (var i = 0; i < n; i++) for (var j = 0; j < n; j++) {
        var r = f(x0 + (i + .5) * dx, y0 + (j + .5) * dy); if (!r) continue;
        var c = rgb(r[0]), k = ((n - 1 - j) * n + i) * 4;
        im.data[k] = c[0]; im.data[k + 1] = c[1]; im.data[k + 2] = c[2]; im.data[k + 3] = Math.round(255 * r[1]);
      }
      og.putImageData(im, 0, 0);
      g.save(); g.imageSmoothingEnabled = true; g.drawImage(oc, L0, T0, R0 - L0, B0 - T0); g.restore();
    };
    return p;
  }

  function rgb(c) {
    if (c[0] === '#') { var h = c.length === 4 ? c.replace(/#(.)(.)(.)/, '#$1$1$2$2$3$3') : c; return [parseInt(h.substr(1, 2), 16), parseInt(h.substr(3, 2), 16), parseInt(h.substr(5, 2), 16)]; }
    var m = c.match(/[\d.]+/g); if (c.indexOf('hsl') === 0) { var H = +m[0] / 360, S = +m[1] / 100, Lg = +m[2] / 100, q = Lg < .5 ? Lg * (1 + S) : Lg + S - Lg * S, p2 = 2 * Lg - q, t = function (t) { t = (t + 1) % 1; return t < 1 / 6 ? p2 + (q - p2) * 6 * t : t < .5 ? q : t < 2 / 3 ? p2 + (q - p2) * (2 / 3 - t) * 6 : p2; }; return [t(H + 1 / 3) * 255, t(H) * 255, t(H - 1 / 3) * 255]; }
    return [+m[0], +m[1], +m[2]];
  }

  /* coordinate transform of a plot without drawing (same options as plot) */
  function coords(id, o) {
    o = o || {}; var c = typeof id === 'string' ? $(id) : id, W = +(c.dataset.w || c.width), H = +(c.dataset.h || c.height);
    var x0 = o.x ? o.x[0] : 0, x1 = o.x ? o.x[1] : 1, y0 = o.y ? o.y[0] : 0, y1 = o.y ? o.y[1] : 1;
    var m = o.m || [14, 14, o.xl ? 38 : 26, o.yl ? 50 : 38], L0 = m[3], R0 = W - m[1], T0 = m[0], B0 = H - m[2];
    return { ix: function (px) { return x0 + (px - L0) / (R0 - L0) * (x1 - x0); }, iy: function (py) { return y0 + (B0 - py) / (B0 - T0) * (y1 - y0); },
      X: function (v) { return L0 + (v - x0) / (x1 - x0) * (R0 - L0); }, Y: function (v) { return B0 - (v - y0) / (y1 - y0) * (B0 - T0); } };
  }

  function arrow(g, xa, ya, xb, yb, c, lw) {
    var a = Math.atan2(yb - ya, xb - xa), h = 7 + (lw || 2);
    g.strokeStyle = g.fillStyle = c || C.ink; g.lineWidth = lw || 2;
    g.beginPath(); g.moveTo(xa, ya); g.lineTo(xb - Math.cos(a) * h * .6, yb - Math.sin(a) * h * .6); g.stroke();
    g.beginPath(); g.moveTo(xb, yb); g.lineTo(xb - h * Math.cos(a - .4), yb - h * Math.sin(a - .4)); g.lineTo(xb - h * Math.cos(a + .4), yb - h * Math.sin(a + .4)); g.closePath(); g.fill();
  }

  /* ---------- redraw registry ---------- */
  var R = [];
  function reg(f) { R.push(f); f(); return f; }
  function redraw() { R.forEach(function (f) { f(); }); }

  /* ---------- sliders: <input type=range id=x> + <output id=xv> ---------- */
  function val(id) { return +$(id).value; }
  function bind(ids, f, digits) {
    (Array.isArray(ids) ? ids : [ids]).forEach(function (id) {
      var e = $(id), o = $(id + 'v'), d = digits == null ? (String(e.step).indexOf('.') >= 0 ? String(e.step).split('.')[1].length : 0) : digits;
      var upd = function () { if (o) o.textContent = (+e.value).toFixed(d); };
      upd(); e.addEventListener('input', function () { upd(); f && f(); }); e.addEventListener('change', function () { upd(); f && f(); });
    });
  }
  /* segmented buttons: <div class=seg id=..><button data-v=..> */
  function seg(id, f) {
    var box = $(id), bs = box.querySelectorAll('button'), cur = (box.querySelector('button.on') || bs[0]).dataset.v;
    function set(v) { cur = v; bs.forEach(function (b) { b.classList.toggle('on', b.dataset.v === v); }); }
    set(cur);
    bs.forEach(function (b) { b.addEventListener('click', function () { set(b.dataset.v); f && f(cur); }); });
    return { get: function () { return cur; }, set: function (v) { set(v); f && f(cur); } };
  }
  /* pointer events in canvas logical pixels */
  function pointer(id, h) {
    var c = typeof id === 'string' ? $(id) : id, down = false;
    function pos(e) { var r = c.getBoundingClientRect(), W = +(c.dataset.w || c.width), H = +(c.dataset.h || c.height); return [(e.clientX - r.left) / r.width * W, (e.clientY - r.top) / r.height * H]; }
    c.addEventListener('pointerdown', function (e) { down = true; try { c.setPointerCapture(e.pointerId); } catch (_) {} var q = pos(e); h.down && h.down(q[0], q[1], e); });
    c.addEventListener('pointermove', function (e) { var q = pos(e); h.move && h.move(q[0], q[1], down, e); });
    c.addEventListener('pointerup', function (e) { down = false; var q = pos(e); h.up && h.up(q[0], q[1], e); });
    c.addEventListener('contextmenu', function (e) { if (h.down) e.preventDefault(); });
  }
  /* run / pause button driving a step function; step returns false to stop */
  function runner(btnId, step, every) {
    var b = $(btnId), t = null, lab = b.textContent;
    function stop() { if (t) { clearInterval(t); t = null; } b.textContent = lab; b.classList.remove('on'); }
    b.addEventListener('click', function () {
      if (t) return stop();
      b.textContent = 'Pause ❚❚'; b.classList.add('on');
      t = setInterval(function () { if (step() === false) stop(); }, every || 40);
    });
    return { stop: stop, running: function () { return !!t; } };
  }

  /* ---------- maths ---------- */
  function softmax(z, T) { T = T || 1; var m = Math.max.apply(null, z.map(function (v) { return v / T; })), e = z.map(function (v) { return Math.exp(v / T - m); }), s = e.reduce(function (a, b) { return a + b; }, 0); return e.map(function (v) { return v / s; }); }
  function sigmoid(z) { return 1 / (1 + Math.exp(-z)); }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function dot(a, b) { var s = 0; for (var i = 0; i < a.length; i++) s += a[i] * b[i]; return s; }
  function norm(a) { return Math.sqrt(dot(a, a)); }
  function f(v, d) { return (+v).toFixed(d == null ? 2 : d); }

  /* ---------- KaTeX ---------- */
  function tex(el, s, display) {
    el = typeof el === 'string' ? $(el) : el;
    if (window.katex) { try { katex.render(s, el, { displayMode: !!display, throwOnError: false }); return; } catch (e) {} }
    el.textContent = s;
  }
  function renderMath(el) {
    if (window.renderMathInElement) renderMathInElement(el || document.body, {
      delimiters: [{ left: '$$', right: '$$', display: true }, { left: '\\[', right: '\\]', display: true }, { left: '\\(', right: '\\)', display: false }],
      throwOnError: false, ignoredTags: ['script', 'noscript', 'style', 'textarea', 'pre', 'code', 'canvas', 'svg']
    });
  }

  /* ---------- page furniture: math, "On this page", copy buttons ---------- */
  function init() {
    var art = document.querySelector('.lsn-main');
    if (art) renderMath(art);
    var lead = document.querySelector('header.lesson'); if (lead) renderMath(lead);
    var toc = document.querySelector('.lsn-toc nav'), heads = document.querySelectorAll('.lsn-main > h2');
    if (toc && heads.length) {
      heads.forEach(function (h, i) { if (!h.id) h.id = 'sec-' + (i + 1); var a = document.createElement('a'); a.href = '#' + h.id; var hc = h.cloneNode(true), n = hc.querySelector('.n'); if (n) n.remove(); a.textContent = hc.textContent.trim(); toc.appendChild(a); });
      var links = toc.querySelectorAll('a');
      var sc = function () { var c = 0; heads.forEach(function (h, i) { if (h.getBoundingClientRect().top < 150) c = i; }); links.forEach(function (l, i) { l.classList.toggle('on', i === c); }); };
      addEventListener('scroll', sc, { passive: true }); sc();
    }
    document.querySelectorAll('.code').forEach(function (box) {
      var b = document.createElement('button'); b.className = 'copy'; b.type = 'button'; b.textContent = 'Copy'; box.appendChild(b);
      b.onclick = function () { var t = box.querySelector('pre').innerText, d = function () { b.textContent = 'Copied'; setTimeout(function () { b.textContent = 'Copy'; }, 1400); }; if (navigator.clipboard) navigator.clipboard.writeText(t).then(d, d); else d(); };
    });
    var rt; addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(redraw, 150); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();

  window.L = { $: $, col: col, C: C, PAL: PAL, rng: rng, ctx: ctx, plot: plot, coords: coords, arrow: arrow, reg: reg, redraw: redraw, val: val, bind: bind, seg: seg,
    pointer: pointer, runner: runner, softmax: softmax, sigmoid: sigmoid, clamp: clamp, dot: dot, norm: norm, f: f, rgb: rgb, tex: tex, renderMath: renderMath };
})();
