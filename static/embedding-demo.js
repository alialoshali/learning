/* Transformers, step 2: why embeddings? Interactive toy word embeddings.
   The vectors are made by hand from named "meaning" dimensions plus a hidden identity part,
   so that the geometry behaves like real learned embeddings (word2vec, GloVe, an LLM's E). */
(function () {
  var isNode = typeof window === 'undefined';

  /* ---------- the toy embedding ---------- */
  var DIMS = ['person', 'female', 'royal', 'young', 'animal', 'country', 'capital', 'verb', 'past tense', 'plural', 'food', 'vehicle', 'adjective', 'comparative'];
  var CATS = { person: 1, animal: 1, country: 1, capital: 1, verb: 1, food: 1, vehicle: 1, adjective: 1 };
  var NID = 12, D = DIMS.length + NID;
  var GROUPS = { people: '#2f54eb', animals: '#e8590c', places: '#2f9e44', verbs: '#9c36b5', food: '#f08c00', vehicles: '#0c8599', adjectives: '#d6336c' };
  // word, attributes, identity (words sharing an identity are forms of the same concept), group
  var RAW = [
    ['man', 'person', 'adult', 'people'], ['woman', 'person female', 'adult', 'people'],
    ['boy', 'person young', 'child', 'people'], ['girl', 'person female young', 'child', 'people'],
    ['king', 'person royal', 'monarch', 'people'], ['queen', 'person female royal', 'monarch', 'people'],
    ['prince', 'person royal young', 'heir', 'people'], ['princess', 'person female royal young', 'heir', 'people'],
    ['uncle', 'person', 'uncle', 'people'], ['aunt', 'person female', 'uncle', 'people'],
    ['kings', 'person royal plural', 'monarch', 'people'], ['men', 'person plural', 'adult', 'people'],
    ['cat', 'animal', 'cat', 'animals'], ['kitten', 'animal young', 'cat', 'animals'], ['cats', 'animal plural', 'cat', 'animals'],
    ['dog', 'animal', 'dog', 'animals'], ['puppy', 'animal young', 'dog', 'animals'], ['dogs', 'animal plural', 'dog', 'animals'],
    ['horse', 'animal', 'horse', 'animals'], ['foal', 'animal young', 'horse', 'animals'],
    ['France', 'country', 'fr', 'places'], ['Paris', 'capital', 'fr', 'places'],
    ['Italy', 'country', 'it', 'places'], ['Rome', 'capital', 'it', 'places'],
    ['Germany', 'country', 'de', 'places'], ['Berlin', 'capital', 'de', 'places'],
    ['Japan', 'country', 'jp', 'places'], ['Tokyo', 'capital', 'jp', 'places'],
    ['Spain', 'country', 'es', 'places'], ['Madrid', 'capital', 'es', 'places'],
    ['Egypt', 'country', 'eg', 'places'], ['Cairo', 'capital', 'eg', 'places'],
    ['walk', 'verb', 'walk', 'verbs'], ['walked', 'verb past', 'walk', 'verbs'],
    ['swim', 'verb', 'swim', 'verbs'], ['swam', 'verb past', 'swim', 'verbs'],
    ['run', 'verb', 'run', 'verbs'], ['ran', 'verb past', 'run', 'verbs'],
    ['eat', 'verb', 'eat', 'verbs'], ['ate', 'verb past', 'eat', 'verbs'],
    ['go', 'verb', 'go', 'verbs'], ['went', 'verb past', 'go', 'verbs'],
    ['see', 'verb', 'see', 'verbs'], ['saw', 'verb past', 'see', 'verbs'],
    ['apple', 'food', 'apple', 'food'], ['apples', 'food plural', 'apple', 'food'],
    ['banana', 'food', 'banana', 'food'], ['bread', 'food', 'bread', 'food'], ['pizza', 'food', 'pizza', 'food'],
    ['car', 'vehicle', 'car', 'vehicles'], ['cars', 'vehicle plural', 'car', 'vehicles'],
    ['truck', 'vehicle', 'truck', 'vehicles'], ['bus', 'vehicle', 'bus', 'vehicles'], ['bike', 'vehicle', 'bike', 'vehicles'],
    ['big', 'adjective', 'big', 'adjectives'], ['bigger', 'adjective comparative', 'big', 'adjectives'],
    ['small', 'adjective', 'small', 'adjectives'], ['smaller', 'adjective comparative', 'small', 'adjectives'],
    ['good', 'adjective', 'good', 'adjectives'], ['better', 'adjective comparative', 'good', 'adjectives'],
    ['fast', 'adjective', 'fast', 'adjectives'], ['faster', 'adjective comparative', 'fast', 'adjectives'],
    ['cold', 'adjective', 'cold', 'adjectives'], ['colder', 'adjective comparative', 'cold', 'adjectives']
  ];

  function rng(seed) { var s = seed; return function () { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }; }
  var R = rng(20261002); for (var w = 0; w < 10; w++) R();
  function gauss() { return Math.sqrt(-2 * Math.log(R() + 1e-12)) * Math.cos(6.283185307 * R()); }
  var IDV = {};
  function identity(k) {
    if (!IDV[k]) { var v = [], n = 0, i; for (i = 0; i < NID; i++) { v.push(gauss()); n += v[i] * v[i]; } n = Math.sqrt(n); IDV[k] = v.map(function (x) { return x / n * 1.1; }); }
    return IDV[k];
  }
  var WORDS = [], E = {}, GROUP = {};
  RAW.forEach(function (r) {
    var v = new Array(D).fill(0), at = r[1].split(' ');
    at.forEach(function (a) { var i = DIMS.indexOf(a); v[i] = CATS[a] ? 1.3 : 1.0; });
    var id = identity(r[2]); for (var i = 0; i < NID; i++) v[DIMS.length + i] = id[i];
    for (i = 0; i < D; i++) v[i] += gauss() * 0.06;
    WORDS.push(r[0]); E[r[0]] = v; GROUP[r[0]] = r[3];
  });

  /* ---------- vector maths ---------- */
  function dot(a, b) { var s = 0; for (var i = 0; i < a.length; i++) s += a[i] * b[i]; return s; }
  function norm(a) { return Math.sqrt(dot(a, a)); }
  function cos(a, b) { return dot(a, b) / (norm(a) * norm(b) + 1e-12); }
  function add(a, b, k) { return a.map(function (x, i) { return x + (k == null ? 1 : k) * b[i]; }); }
  function nearest(v, exclude, n) {
    return WORDS.filter(function (w) { return !exclude || exclude.indexOf(w) < 0; })
      .map(function (w) { return [w, cos(v, E[w])]; }).sort(function (a, b) { return b[1] - a[1]; }).slice(0, n || 5);
  }
  function analogy(a, b, c) { var t = add(add(E[b], E[a], -1), E[c]); return { t: t, list: nearest(t, [a, b, c], 5) }; }

  var CASES = {
    gender: { name: 'male → female', pairs: [['man', 'woman'], ['king', 'queen'], ['boy', 'girl'], ['prince', 'princess'], ['uncle', 'aunt']] },
    young: { name: 'adult → young', pairs: [['man', 'boy'], ['woman', 'girl'], ['king', 'prince'], ['cat', 'kitten'], ['dog', 'puppy'], ['horse', 'foal']] },
    capital: { name: 'country → capital', pairs: [['France', 'Paris'], ['Italy', 'Rome'], ['Germany', 'Berlin'], ['Japan', 'Tokyo'], ['Spain', 'Madrid'], ['Egypt', 'Cairo']] },
    past: { name: 'present → past', pairs: [['walk', 'walked'], ['swim', 'swam'], ['run', 'ran'], ['eat', 'ate'], ['go', 'went'], ['see', 'saw']] },
    plural: { name: 'singular → plural', pairs: [['cat', 'cats'], ['dog', 'dogs'], ['apple', 'apples'], ['car', 'cars'], ['king', 'kings'], ['man', 'men']] },
    compar: { name: 'adjective → comparative', pairs: [['big', 'bigger'], ['small', 'smaller'], ['good', 'better'], ['fast', 'faster'], ['cold', 'colder']] }
  };
  var PRESET = { gender: ['man', 'woman', 'king'], young: ['cat', 'kitten', 'dog'], capital: ['France', 'Paris', 'Japan'], past: ['walk', 'walked', 'swim'], plural: ['cat', 'cats', 'car'], compar: ['big', 'bigger', 'good'] };

  if (isNode) { module.exports = { WORDS: WORDS, E: E, cos: cos, nearest: nearest, analogy: analogy, CASES: CASES, PRESET: PRESET, DIMS: DIMS }; return; }

  var $ = function (id) { return document.getElementById(id); };
  if (!$('emb1')) return;
  var INK = '#171b24', MUTED = '#5d6675', LINE = '#dfe3ea';
  function ctx(id) { return window.L ? L.ctx(id) : (function () { var c = $(id), g = c.getContext('2d'); g.clearRect(0, 0, c.width, c.height); return { c: c, g: g, W: c.width, H: c.height }; })(); }
  function pos(c, e) { var r = c.getBoundingClientRect(), W = +(c.dataset.w || c.width), H = +(c.dataset.h || c.height); return [(e.clientX - r.left) / r.width * W, (e.clientY - r.top) / r.height * H]; }
  function seg(id, f) { var bs = $(id).querySelectorAll('button'); bs.forEach(function (b) { b.addEventListener('click', function () { bs.forEach(function (x) { x.classList.toggle('on', x === b); }); f(b.dataset.v); }); }); }
  var F = '12px IBM Plex Sans, system-ui, sans-serif', FB = '600 12px IBM Plex Sans, system-ui, sans-serif';
  function sim2col(s) { // -1..1 → orange..white..blue
    var t = Math.max(-1, Math.min(1, s)), a = Math.abs(t);
    return t >= 0 ? 'rgba(47,84,235,' + (0.06 + 0.9 * a) + ')' : 'rgba(232,89,12,' + (0.06 + 0.9 * a) + ')';
  }

  /* ===== A. one-hot vs embedding similarity matrix ===== */
  var HW = ['cat', 'kitten', 'dog', 'puppy', 'king', 'queen', 'France', 'Paris', 'apple', 'car'], hMode = 'oh', hSel = [0, 1];
  function drawHeat() {
    var k = ctx('emb1'), g = k.g, n = HW.length, x0 = 74, y0 = 74, cs = Math.min((k.W - x0 - 10) / n, (k.H - y0 - 10) / n);
    g.font = F; g.textBaseline = 'middle';
    for (var i = 0; i < n; i++) {
      g.fillStyle = INK; g.textAlign = 'right'; g.fillText(HW[i], x0 - 6, y0 + (i + .5) * cs);
      g.save(); g.translate(x0 + (i + .5) * cs, y0 - 6); g.rotate(-Math.PI / 4); g.textAlign = 'left'; g.fillText(HW[i], 0, 0); g.restore();
      for (var j = 0; j < n; j++) {
        var s = hMode === 'oh' ? (i === j ? 1 : 0) : cos(E[HW[i]], E[HW[j]]);
        g.fillStyle = sim2col(s); g.fillRect(x0 + j * cs + 1, y0 + i * cs + 1, cs - 2, cs - 2);
        g.fillStyle = Math.abs(s) > .55 ? '#fff' : INK; g.textAlign = 'center'; g.fillText(s.toFixed(hMode === 'oh' ? 0 : 2), x0 + (j + .5) * cs, y0 + (i + .5) * cs);
      }
    }
    var a = hSel[0], b = hSel[1];
    g.strokeStyle = '#f08c00'; g.lineWidth = 3; g.strokeRect(x0 + b * cs + 1, y0 + a * cs + 1, cs - 2, cs - 2);
    var s = hMode === 'oh' ? (a === b ? 1 : 0) : cos(E[HW[a]], E[HW[b]]);
    var txt = hMode === 'oh'
      ? 'One-hot: <b>' + HW[a] + '</b> = a 1 at position ' + WORDS.indexOf(HW[a]) + ', <b>' + HW[b] + '</b> = a 1 at position ' + WORDS.indexOf(HW[b]) + '. Similarity = <b>' + s.toFixed(0) + '</b>. ' + (a === b ? 'A word is only similar to itself.' : 'Different words never share a 1, so every pair scores 0: “cat” is as far from “kitten” as from “car”.')
      : 'Embedding: cos(<b>' + HW[a] + '</b>, <b>' + HW[b] + '</b>) = <b>' + s.toFixed(2) + '</b> · ' + (a === b ? 'identical' : s > .6 ? 'very similar meaning' : s > .3 ? 'related (same category)' : 'unrelated');
    $('emb1o').innerHTML = txt;
  }
  seg('emb1m', function (v) { hMode = v; drawHeat(); });
  $('emb1').addEventListener('click', function (e) {
    var q = pos($('emb1'), e), k = $('emb1'), W = +(k.dataset.w || k.width), H = +(k.dataset.h || k.height), n = HW.length, x0 = 74, y0 = 74, cs = Math.min((W - x0 - 10) / n, (H - y0 - 10) / n);
    var j = Math.floor((q[0] - x0) / cs), i = Math.floor((q[1] - y0) / cs); if (i >= 0 && j >= 0 && i < n && j < n) { hSel = [i, j]; drawHeat(); }
  });

  /* ===== B. the embedding map (stress MDS from cosine distances) ===== */
  var P = (function () {
    var n = WORDS.length, r = rng(7), GK = Object.keys(GROUPS), Dm = [];
    // start each category around its own spot on a circle; the optimisation below then arranges the words by similarity
    var X = WORDS.map(function (w) { var a = GK.indexOf(GROUP[w]) / GK.length * 6.283; return [Math.cos(a) * 1.2 + (r() - .5) * .5, Math.sin(a) * 1.2 + (r() - .5) * .5]; });
    for (var i = 0; i < n; i++) { Dm.push([]); for (var j = 0; j < n; j++) Dm[i].push(Math.sqrt(Math.max(0, 2 - 2 * cos(E[WORDS[i]], E[WORDS[j]])))); }
    for (var it = 0; it < 900; it++) {
      var lr = 0.5 * (1 - it / 1000);
      for (i = 0; i < n; i++) {
        var gx = 0, gy = 0;
        for (j = 0; j < n; j++) {
          if (i === j) continue; var dx = X[i][0] - X[j][0], dy = X[i][1] - X[j][1], d = Math.sqrt(dx * dx + dy * dy) + 1e-6, t = Dm[i][j];
          var wgt = 1 / (t * t + .05); var gg = wgt * (d - t) / d; gx += gg * dx; gy += gg * dy;
        }
        X[i][0] -= lr * gx / n; X[i][1] -= lr * gy / n;
      }
    }
    var mnx = 1e9, mxx = -1e9, mny = 1e9, mxy = -1e9;
    X.forEach(function (p) { mnx = Math.min(mnx, p[0]); mxx = Math.max(mxx, p[0]); mny = Math.min(mny, p[1]); mxy = Math.max(mxy, p[1]); });
    var o = {}; WORDS.forEach(function (w, i) { o[w] = [(X[i][0] - mnx) / (mxx - mnx), (X[i][1] - mny) / (mxy - mny)]; }); return o;
  })();
  var mSel = 'cat';
  function mxy(k, w) { return [36 + P[w][0] * (k.W - 100), 24 + P[w][1] * (k.H - 48)]; }
  function drawMap() {
    var k = ctx('emb2'), g = k.g, nb = nearest(E[mSel], [mSel], 5), s0 = mxy(k, mSel);
    nb.forEach(function (q, i) { var p = mxy(k, q[0]); g.strokeStyle = 'rgba(240,140,0,' + (0.35 + 0.6 * Math.max(0, q[1])) + ')'; g.lineWidth = 1 + 3 * Math.max(0, q[1]); g.beginPath(); g.moveTo(s0[0], s0[1]); g.lineTo(p[0], p[1]); g.stroke(); });
    WORDS.forEach(function (w) {
      var p = mxy(k, w), on = w === mSel, nbi = nb.some(function (q) { return q[0] === w; });
      g.beginPath(); g.arc(p[0], p[1], on ? 7 : 4.5, 0, 7); g.fillStyle = GROUPS[GROUP[w]]; g.globalAlpha = on || nbi ? 1 : .75; g.fill(); g.globalAlpha = 1;
      if (on) { g.lineWidth = 3; g.strokeStyle = '#f08c00'; g.stroke(); }
      g.font = on || nbi ? FB : F; g.fillStyle = on || nbi ? INK : MUTED; g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillText(w, p[0] + 7, p[1]);
    });
    var lg = Object.keys(GROUPS), lx = 10; g.font = F;
    lg.forEach(function (n) { g.fillStyle = GROUPS[n]; g.beginPath(); g.arc(lx + 5, k.H - 8, 4, 0, 7); g.fill(); g.fillStyle = MUTED; g.textAlign = 'left'; g.fillText(n, lx + 12, k.H - 8); lx += g.measureText(n).width + 30; });
    $('emb2o').innerHTML = 'nearest to <b>' + mSel + '</b>: ' + nb.map(function (q) { return q[0] + ' <b>' + q[1].toFixed(2) + '</b>'; }).join(' · ');
    $('emb2s').value = mSel;
  }
  $('emb2s').innerHTML = WORDS.slice().sort(function (a, b) { return a.toLowerCase() < b.toLowerCase() ? -1 : 1; }).map(function (w) { return '<option>' + w + '</option>'; }).join('');
  $('emb2s').onchange = function () { mSel = this.value; drawMap(); };
  $('emb2').addEventListener('click', function (e) {
    var k = { W: +($('emb2').dataset.w || $('emb2').width), H: +($('emb2').dataset.h || $('emb2').height) }, q = pos($('emb2'), e), best = null, bd = 400;
    WORDS.forEach(function (w) { var p = mxy(k, w), d = (p[0] - q[0]) * (p[0] - q[0]) + (p[1] - q[1]) * (p[1] - q[1]); if (d < bd) { bd = d; best = w; } });
    if (best) { mSel = best; drawMap(); }
  });

  /* ===== C. word arithmetic ===== */
  var cKey = 'gender', A = PRESET.gender.slice();
  function opts(sel) { return WORDS.map(function (w) { return '<option' + (w === sel ? ' selected' : '') + '>' + w + '</option>'; }).join(''); }
  function fillSel() { ['emb3a', 'emb3b', 'emb3c'].forEach(function (id, i) { $(id).innerHTML = opts(A[i]); }); }
  ['emb3a', 'emb3b', 'emb3c'].forEach(function (id, i) { $(id).onchange = function () { A[i] = this.value; cKey = null; document.querySelectorAll('#emb3m button').forEach(function (b) { b.classList.remove('on'); }); drawAn(); }; });
  seg('emb3m', function (v) { cKey = v; A = PRESET[v].slice(); fillSel(); drawAn(); });
  function unit(v) { var n = norm(v); return v.map(function (x) { return x / n; }); }
  function drawAn() {
    var a = A[0], b = A[1], c = A[2], res = analogy(a, b, c), top = res.list[0][0];
    var pairs = cKey ? CASES[cKey].pairs : [[a, b]];
    // axis 1 = average relation direction; axis 2 = main remaining variation of the plotted words
    var dir = new Array(D).fill(0); pairs.forEach(function (p) { dir = add(dir, add(E[p[1]], E[p[0]], -1)); }); dir = unit(dir);
    var words = []; pairs.forEach(function (p) { words.push(p[0], p[1]); }); [a, b, c, top].forEach(function (w) { if (words.indexOf(w) < 0) words.push(w); });
    var pts = words.map(function (w) { return E[w]; }).concat([res.t]);
    var mean = new Array(D).fill(0); pts.forEach(function (v) { mean = add(mean, v, 1 / pts.length); });
    var resid = pts.map(function (v) { var d0 = add(v, mean, -1); return add(d0, dir, -dot(d0, dir)); });
    var u = new Array(D).fill(0).map(function (_, i) { return Math.sin(i + 1); });
    for (var it = 0; it < 60; it++) { var nu = new Array(D).fill(0); resid.forEach(function (r) { nu = add(nu, r, dot(r, u)); }); u = unit(nu); }
    var pr = function (v) { var d0 = add(v, mean, -1); return [dot(d0, dir), dot(d0, u)]; };
    var all = pts.map(pr), mnx = 1e9, mxx = -1e9, mny = 1e9, mxy2 = -1e9;
    all.forEach(function (p) { mnx = Math.min(mnx, p[0]); mxx = Math.max(mxx, p[0]); mny = Math.min(mny, p[1]); mxy2 = Math.max(mxy2, p[1]); });
    var k = ctx('emb3'), g = k.g, padL = 40, padR = 80, padT = 40, padB = 40;
    // separate scales for the two axes (parallel arrows stay parallel), so both directions use the full plot
    var sx = (k.W - padL - padR) / (mxx - mnx + 1e-6), sy = Math.min((k.H - padT - padB) / (mxy2 - mny + 1e-6), sx * 2.5);
    var ox = padL, oy = padT + ((k.H - padT - padB) - sy * (mxy2 - mny)) / 2;
    var XY = function (v) { var p = pr(v); return [ox + (p[0] - mnx) * sx, oy + (mxy2 - p[1]) * sy]; };
    function arrow(p, q, colr, wdt, dash) {
      g.strokeStyle = colr; g.fillStyle = colr; g.lineWidth = wdt; g.setLineDash(dash || []); var ang = Math.atan2(q[1] - p[1], q[0] - p[0]), L2 = Math.hypot(q[0] - p[0], q[1] - p[1]), sh = 9;
      var e = [q[0] - Math.cos(ang) * sh, q[1] - Math.sin(ang) * sh]; g.beginPath(); g.moveTo(p[0] + Math.cos(ang) * 8, p[1] + Math.sin(ang) * 8); g.lineTo(e[0], e[1]); g.stroke(); g.setLineDash([]);
      if (L2 > 20) { g.beginPath(); g.moveTo(e[0] + Math.cos(ang) * 6, e[1] + Math.sin(ang) * 6); g.lineTo(e[0] - Math.cos(ang - .5) * 9, e[1] - Math.sin(ang - .5) * 9); g.lineTo(e[0] - Math.cos(ang + .5) * 9, e[1] - Math.sin(ang + .5) * 9); g.closePath(); g.fill(); }
    }
    g.font = F; g.fillStyle = MUTED; g.textAlign = 'right'; g.textBaseline = 'alphabetic'; g.fillText('→ relation direction' + (cKey ? ' (' + CASES[cKey].name + ')' : ' (' + a + ' → ' + b + ')'), k.W - 8, k.H - 8);
    pairs.forEach(function (p) { if (p[0] === a && p[1] === b) return; arrow(XY(E[p[0]]), XY(E[p[1]]), 'rgba(134,142,150,.55)', 1.5); });
    var pa = XY(E[a]), pb = XY(E[b]), pc = XY(E[c]), pt = XY(res.t), pd = XY(E[top]);
    arrow(pa, pb, '#2f54eb', 3); arrow(pc, pt, '#2f9e44', 3, [7, 5]);
    g.strokeStyle = 'rgba(47,84,235,.25)'; g.lineWidth = 1; g.setLineDash([3, 4]); g.beginPath(); g.moveTo(pa[0], pa[1]); g.lineTo(pc[0], pc[1]); g.moveTo(pb[0], pb[1]); g.lineTo(pt[0], pt[1]); g.stroke(); g.setLineDash([]);
    var placed = [];
    words.slice().sort(function (x, y) { var kx = [a, b, c, top].indexOf(x) >= 0, ky = [a, b, c, top].indexOf(y) >= 0; return ky - kx; }).forEach(function (w) {
      var p = XY(E[w]), key = w === a || w === b || w === c, ans = w === top;
      g.beginPath(); g.arc(p[0], p[1], key || ans ? 6 : 4, 0, 7); g.fillStyle = ans ? '#2f9e44' : key ? '#2f54eb' : '#adb5bd'; g.fill();
      g.font = key || ans ? FB : F; var tw = g.measureText(w).width, lx = p[0] + 8, ly = p[1] - 9, tries = [[0, 0], [0, 18], [0, -14], [-tw - 16, 0], [-tw - 16, 18], [0, 32], [0, -28]];
      for (var t = 0; t < tries.length; t++) { var x1 = p[0] + 8 + tries[t][0], y1 = p[1] - 9 + tries[t][1]; if (!placed.some(function (q) { return x1 < q[2] && x1 + tw > q[0] && Math.abs(y1 - q[1]) < 13; })) { lx = x1; ly = y1; break; } }
      placed.push([lx, ly, lx + tw]);
      g.fillStyle = key || ans ? INK : MUTED; g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillText(w, lx, ly);
    });
    g.strokeStyle = '#2f9e44'; g.lineWidth = 2; g.beginPath(); g.moveTo(pt[0] - 6, pt[1] - 6); g.lineTo(pt[0] + 6, pt[1] + 6); g.moveTo(pt[0] + 6, pt[1] - 6); g.lineTo(pt[0] - 6, pt[1] + 6); g.stroke();
    g.font = '11px IBM Plex Sans, system-ui, sans-serif'; g.fillStyle = '#2f9e44'; g.textAlign = 'left'; g.font = FB; g.fillText('✕ = ' + b + ' − ' + a + ' + ' + c, 8, 14);
    var expect = null; if (cKey) CASES[cKey].pairs.forEach(function (p) { if (p[0] === c) expect = p[1]; });
    $('emb3o').innerHTML = '<b>' + b + '</b> − <b>' + a + '</b> + <b>' + c + '</b> ≈ <b>' + top + '</b>' + (expect ? (expect === top ? ' ✓' : ' (expected ' + expect + ')') : '') + '<br>top 5 by cosine: ' + res.list.map(function (q) { return q[0] + ' ' + q[1].toFixed(2); }).join(' · ');
    drawBars(a, b, c, top);
  }
  function drawBars(a, b, c, d) {
    var k = ctx('emb4'), g = k.g, d1 = add(E[b], E[a], -1), d2 = add(E[d], E[c], -1), n = DIMS.length, x0 = 8, bw = (k.W - x0 - 70) / (n + 1), mid = 82, sc = 46;
    g.strokeStyle = LINE; g.beginPath(); g.moveTo(x0, mid); g.lineTo(k.W - 8, mid); g.stroke();
    var vals = function (v) { var o = v.slice(0, n), h = 0; for (var i = n; i < D; i++) h += v[i] * v[i]; o.push(Math.sqrt(h)); return o; };
    var v1 = vals(d1), v2 = vals(d2);
    for (var i = 0; i <= n; i++) {
      var x = x0 + i * bw, hid = i === n;
      [[v1[i], '#2f54eb', 0], [v2[i], '#2f9e44', 1]].forEach(function (q) { var h = Math.max(-1.6, Math.min(1.6, q[0])) * sc; g.fillStyle = hid ? (q[2] ? 'rgba(47,158,68,.35)' : 'rgba(47,84,235,.35)') : q[1]; g.fillRect(x + 4 + q[2] * (bw / 2 - 3), h >= 0 ? mid - h : mid, bw / 2 - 5, Math.abs(h)); });
      g.save(); g.translate(x + bw / 2, mid + 8); g.rotate(Math.PI / 5); g.font = '10.5px IBM Plex Sans, system-ui, sans-serif'; g.fillStyle = Math.abs(v1[i]) > .5 && !hid ? INK : MUTED; g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillText(hid ? 'other 12 (size)' : DIMS[i], 0, 0); g.restore();
    }
    g.font = FB; g.textAlign = 'left'; g.textBaseline = 'alphabetic'; g.fillStyle = '#2f54eb'; g.fillText('■ ' + b + ' − ' + a, x0, 14); g.fillStyle = '#2f9e44'; g.fillText('■ ' + d + ' − ' + c, x0 + 12 + g.measureText('■ ' + b + ' − ' + a).width + 14, 14);
    $('emb4o').innerHTML = 'cos(' + b + ' − ' + a + ', ' + d + ' − ' + c + ') = <b>' + cos(d1, d2).toFixed(2) + '</b> · ' + (cos(d1, d2) > .8 ? 'the two arrows point the same way: one shared “relation direction”' : 'the arrows differ: this is not one consistent relation');
  }

  function all() { drawHeat(); drawMap(); fillSel(); drawAn(); }
  if (window.L && L.reg) L.reg(all); else all();
  window.addEventListener('resize', function () { drawHeat(); drawMap(); drawAn(); });
})();
