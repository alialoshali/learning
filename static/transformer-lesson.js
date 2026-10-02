/* Transformers lesson: a complete toy Transformer computed live (d = 4, 1 layer, 1 head, d_k = 2, d_ff = 8),
   a sticky flowchart that follows the reader, training of the output layer, and an LLM parameter calculator.
   Numbers follow the worked example "I love" -> "you". Requires lesson.js (window.L). */
(function () {
  'use strict';
  var $ = L.$, C = L.C, col = L.col;

  /* ================= the toy model ================= */
  var VOC = ['I', 'love', 'you', 'cats', 'dogs'];
  var E = [[1, 0, 1, 0], [0, 1, 1, 0], [1, 1, 0, 1], [0, 1, 0, 1], [1, 0, 0, 1]];
  var WQ = [[1, 0], [0, 1], [1, 0], [0, 1]], WK = [[0, 1], [1, 0], [0, 1], [1, 0]], WV = [[1, 0], [0, 1], [0, 1], [1, 0]];
  var WO = [[1, 0, .5, 0], [0, 1, .5, 1]];
  var W1 = [[1, 0, 0, 0, 0, 1, 0, 1], [0, 1, 0, 0, 1, 1, 1, 0], [0, 0, 1, 0, 1, 0, 0, 1], [0, 0, 0, 1, 0, 0, 1, 0]], B1 = [0, 0, 0, 0, 0, 0, -.5, 0];
  var W2 = [[1, 0, 0, 0], [0, 1, 0, 0], [0, 0, 1, 0], [0, 0, 0, 1], [0, .5, .5, 0], [.5, .5, 0, 0], [0, .5, 0, .5], [.5, 0, .5, 0]], B2 = [0, 0, 0, 0];
  var D = 4, DK = 2;
  var seq = [0, 1], follow = -1, M = null;

  function mm(A, B) { return A.map(function (r) { return B[0].map(function (_, j) { var s = 0; for (var k = 0; k < r.length; k++) s += r[k] * B[k][j]; return s; }); }); }
  function vm(v, B) { return mm([v], B)[0]; }
  function T_(A) { return A[0].map(function (_, j) { return A.map(function (r) { return r[j]; }); }); }
  function pe(p, d) { return Array.from({ length: d }, function (_, i) { var k = Math.floor(i / 2), f = p / Math.pow(10000, 2 * k / d); return i % 2 ? Math.cos(f) : Math.sin(f); }); }
  function lnorm(r, g, b) { var n = r.length, mu = r.reduce(function (a, v) { return a + v; }, 0) / n, dev = r.map(function (v) { return v - mu; }), va = dev.reduce(function (a, v) { return a + v * v; }, 0) / n, sd = Math.sqrt(va + 1e-5);
    return { mu: mu, dev: dev, va: va, sd: sd, h: dev.map(function (v) { return g * v / sd + b; }) }; }
  function f2(v, d) { if (v === -Infinity) return '−∞'; if (d == null && Number.isInteger(v)) return String(v).replace('-', '−'); var s = (+v).toFixed(d == null ? 2 : d); return s === '-0.00' ? '0.00' : s.replace('-', '−'); }
  function fi() { return follow < 0 || follow >= seq.length ? seq.length - 1 : follow; }

  function compute() {
    var n = seq.length, mask = $('mask6').checked, relu = !$('norelu11').checked, g = L.val('g10'), b = L.val('b10');
    var X0 = seq.map(function (id) { return E[id].slice(); }), P = seq.map(function (_, p) { return pe(p, D); });
    var X = X0.map(function (r, i) { return r.map(function (v, j) { return v + P[i][j]; }); });
    var Q = mm(X, WQ), K = mm(X, WK), V = mm(X, WV), S = mm(Q, T_(K));
    var Ss = S.map(function (r, i) { return r.map(function (v, j) { return mask && j > i ? -Infinity : v / Math.sqrt(DK); }); });
    var A = Ss.map(function (r) { var m = Math.max.apply(null, r.filter(isFinite)), e = r.map(function (v) { return isFinite(v) ? Math.exp(v - m) : 0; }), s = e.reduce(function (a, v) { return a + v; }, 0); return e.map(function (v) { return v / s; }); });
    var Z = mm(A, V), AO = mm(Z, WO), R1 = AO.map(function (r, i) { return r.map(function (v, j) { return v + X[i][j]; }); });
    var LN1 = R1.map(function (r) { return lnorm(r, g, b); }), H = LN1.map(function (o) { return o.h; });
    var U = mm(H, W1).map(function (r) { return r.map(function (v, j) { return v + B1[j]; }); }), Dt = mm(H, W1);
    var Act = U.map(function (r) { return r.map(function (v) { return relu ? Math.max(0, v) : v; }); });
    var F = mm(Act, W2).map(function (r) { return r.map(function (v, j) { return v + B2[j]; }); });
    var R2 = F.map(function (r, i) { return r.map(function (v, j) { return v + H[i][j]; }); }), LN2 = R2.map(function (r) { return lnorm(r, 1, 0); }), HF = LN2.map(function (o) { return o.h; });
    var LG = HF.map(function (h) { return E.map(function (e) { return L.dot(h, e); }); });
    return { n: n, X0: X0, P: P, X: X, Q: Q, K: K, V: V, S: S, Ss: Ss, A: A, Z: Z, AO: AO, R1: R1, LN1: LN1, H: H, Dt: Dt, U: U, Act: Act, F: F, R2: R2, LN2: LN2, HF: HF, LG: LG, mask: mask, relu: relu };
  }

  /* ================= small renderers ================= */
  function heat(v, mx) { if (!isFinite(v)) return '#f1f3f5'; var a = Math.min(1, Math.abs(v) / (mx || 1)); return v >= 0 ? 'rgba(47,84,235,' + (.08 + a * .62).toFixed(3) + ')' : 'rgba(232,89,12,' + (.08 + a * .62).toFixed(3) + ')'; }
  function mx(Mt, o) {
    o = o || {}; var max = o.max || Math.max.apply(null, [].concat.apply([], Mt).filter(isFinite).map(Math.abs).concat([1e-9])), h = '<table class="mx">';
    if (o.cl) h += '<tr><th></th>' + o.cl.map(function (c) { return '<th>' + c + '</th>'; }).join('') + '</tr>';
    Mt.forEach(function (r, i) {
      h += '<tr' + (o.rowAttr ? ' ' + o.rowAttr(i) : '') + '><th>' + (o.rl ? o.rl[i] : '') + '</th>' + r.map(function (v, j) {
        var cls = [], hl = o.hl && o.hl(i, j); if (hl) cls.push('hl'); if (o.off && o.off(i, j)) cls.push('off');
        return '<td data-i="' + i + '" data-j="' + j + '" class="' + cls.join(' ') + '" style="background:' + (o.noheat ? '#f8f9fb' : heat(v, max)) + (Math.abs(v) / max > .7 && !o.noheat ? ';color:#fff' : '') + '">' + (o.fmt ? o.fmt(v) : f2(v)) + '</td>';
      }).join('') + '</tr>';
    });
    return h + '</table>' + (o.cap ? '<div class="mcap">' + o.cap + '</div>' : '');
  }
  function blk(html) { return '<div>' + html + '</div>'; }
  function tokNames() { return seq.map(function (id, i) { return VOC[id] + (seq.indexOf(id) !== i ? '·' + i : ''); }); }

  /* ================= sentence bar ================= */
  function drawSentence() {
    $('sent').innerHTML = seq.map(function (id, i) { return '<span class="tok' + (i === fi() ? ' on' : '') + '">' + VOC[id] + '</span>'; }).join('') + '<span class="lbl">+</span>';
    $('vocab').innerHTML = VOC.map(function (w, id) { return '<button data-id="' + id + '">' + w + '</button>'; }).join(' ');
    $('vocab').querySelectorAll('button').forEach(function (b) { b.onclick = function () { if (seq.length < 6) { seq.push(+b.dataset.id); follow = -1; update(true); } }; });
    $('fol').innerHTML = seq.map(function (id, i) { return '<span class="tok' + (i === fi() ? ' on' : '') + '" data-i="' + i + '" style="cursor:pointer">' + VOC[id] + '</span>'; }).join('');
    $('fol').querySelectorAll('.tok').forEach(function (t) { t.onclick = function () { follow = +t.dataset.i; update(false); }; });
  }
  $('sback').onclick = function () { if (seq.length > 1) { seq.pop(); follow = -1; update(true); } };
  $('sreset').onclick = function () { seq = [0, 1]; follow = -1; update(true); };

  /* ================= 0: cost bars ================= */
  function draw0() {
    var n = L.val('n0'), k = L.ctx('c0'), g = k.g, rows = [['RNN: sequential steps (token 1 → token n)', n - 1, C.red], ['Attention: sequential steps', 1, C.blue], ['Attention: scores computed (n × n, in parallel)', n * n, '#adb5bd']], mx_ = Math.log10(40000), lg = function (v) { return Math.max(4, Math.log10(Math.max(1, v)) / mx_ * (k.W - 160)); };
    g.font = '12.5px IBM Plex Sans,sans-serif';
    rows.forEach(function (r, i) { var y = 16 + i * 64; g.fillStyle = C.ink; g.fillText(r[0], 8, y + 12); g.fillStyle = r[2]; g.fillRect(8, y + 20, lg(r[1]), 24); g.fillStyle = C.ink; g.font = '600 12.5px IBM Plex Mono,monospace'; g.fillText(r[1].toLocaleString(), 14 + lg(r[1]), y + 37); g.font = '12.5px IBM Plex Sans,sans-serif'; });
    g.fillStyle = col('--muted'); g.fillText('(log scale)', 8, k.H - 6);
  }
  L.bind('n0', draw0); L.reg(draw0);

  /* ================= 1: tokenizer ================= */
  var PIECES = ['the', 'trans', 'form', 'er', 'ers', 's', 'learn', 'ed', 'ing', 'token', 'ization', 'ize', 'un', 'believ', 'able', 'ably', 'fast', 'cat', 'dog', 'love', 'i', 'you', 'a', 'an', 'and', 'in', 'on', 'at', 'is', 'it', 'was', 'model', 'models', 'lang', 'uage', 'large', 'neural', 'net', 'work', 'works', 'atten', 'tion', 'self', 'pre', 'train', 'ing', 'gener', 'ate', 'ative', 'text', 'word', 'words', 'pred', 'ict', 'next', 'deep', 'machine', 'chat', 'bot', 'claude', 'gpt', 'super', 'vis', 'ion', 'data', 'set', 'math', 'ly', 'er', 'est', 're', 'de', 'con', 'pro', 'ex', 'st', 'ch', 'th', 'qu', 'ly', 'ness', 'ful', 'less', 'ment', 'tion', 'sion', 'er', 'ou', 'ai', 'ml'];
  var PV = Array.from(new Set(PIECES)).sort(function (a, b) { return b.length - a.length; });
  function draw1() {
    var txt = $('tkin').value.toLowerCase(), words = txt.match(/[a-z]+|[0-9]+|[^\sa-z0-9]/g) || [], out = [];
    words.forEach(function (w, wi) { var i = 0; while (i < w.length) { var hit = null; for (var p = 0; p < PV.length; p++) if (w.substr(i, PV[p].length) === PV[p]) { hit = PV[p]; break; } if (!hit) hit = w[i]; out.push([hit, wi, PV.indexOf(hit) >= 0 ? 100 + PV.indexOf(hit) : w.charCodeAt(i)]); i += hit.length; } });
    $('tkout').innerHTML = out.map(function (t) { return '<span style="display:inline-flex;flex-direction:column;align-items:center"><span class="tok" style="background:' + L.PAL[t[1] % 8] + '22;border-color:' + L.PAL[t[1] % 8] + '">' + t[0] + '</span><small style="font:10px var(--mono);color:var(--muted)">' + t[2] + '</small></span>'; }).join('');
    $('tko').innerHTML = '<b>' + words.length + '</b> words → <b>' + out.length + '</b> tokens (' + (out.length / Math.max(1, words.length)).toFixed(2) + ' tokens per word)';
  }
  $('tkin').addEventListener('input', draw1); draw1();

  /* ================= 3: PE heat map ================= */
  function drawPE() {
    var d = 64, a = L.val('a3'), k = L.ctx('c3'), g = k.g, cw = k.W / d, ch = k.H / 64;
    for (var p = 0; p < 64; p++) { var v = pe(p, d); for (var i = 0; i < d; i++) { g.fillStyle = heat(v[i], 1); g.fillRect(i * cw, p * ch, cw + .5, ch + .5); } }
    g.strokeStyle = C.ink; g.lineWidth = 2; g.strokeRect(0, a * ch, k.W, ch);
    var vals = []; for (p = 0; p < 64; p++) vals.push([p, L.dot(pe(a, d), pe(p, d)) / (d / 2)]);
    var q = L.plot('c3b', { x: [0, 63], y: [-.3, 1.05], xl: 'position', yl: 'similarity', m: [6, 10, 30, 46] }); q.path(vals, C.blue, 2.2); q.vl(a, C.ink, [3, 3]);
  }
  L.bind('a3', drawPE); L.reg(drawPE);

  /* ================= 6: why sqrt(dk) ================= */
  function draw6b() {
    var dk = L.val('dk6'), sc = $('sc6').checked, r = L.rng(17), q = [], i, j;
    for (i = 0; i < dk; i++) q.push(r.g());
    var sco = []; for (j = 0; j < 6; j++) { var kk = []; for (i = 0; i < dk; i++) kk.push(r.g()); sco.push(L.dot(q, kk) / (sc ? Math.sqrt(dk) : 1)); }
    var p = L.softmax(sco), k = L.ctx('c6'), g = k.g, bw = (k.W - 20) / 6;
    p.forEach(function (v, j) { var h = v * 130; g.fillStyle = v > .9 ? C.red : C.blue; g.fillRect(10 + j * bw + 8, 140 - h, bw - 16, h); g.fillStyle = C.ink; g.font = '12px IBM Plex Mono,monospace'; g.fillText((v * 100).toFixed(1) + '%', 10 + j * bw + 12, 136 - h); g.fillStyle = col('--muted'); g.fillText('s=' + sco[j].toFixed(1), 10 + j * bw + 10, 160); });
    var sd = Math.sqrt(sco.reduce(function (a, v) { return a + v * v; }, 0) / 6);
    $('o6').innerHTML = 'd_k = <b>' + dk + '</b> · typical score size ≈ <b>' + sd.toFixed(1) + '</b> (√d_k = ' + Math.sqrt(dk).toFixed(1) + ') · largest weight <b>' + (Math.max.apply(null, p) * 100).toFixed(0) + '%</b>' + (Math.max.apply(null, p) > .95 ? ' → <span style="color:var(--red)">saturated</span>' : '');
  }
  L.bind('dk6', draw6b); $('sc6').onchange = draw6b; L.reg(draw6b);

  /* ================= 9: two heads (illustrative) ================= */
  var HT = ['The', 'cat', 'sat', 'because', 'it', 'was', 'tired'], hmode = 0;
  function headW(h) { return HT.map(function (_, i) { return L.softmax(HT.map(function (_, j) { if (j > i) return -1e9; if (h === 0) return j === i - 1 ? 4 : j === i ? 1.2 : 0; if (HT[i] === 'it' && HT[j] === 'cat') return 4.5; if (HT[i] === 'was' && HT[j] === 'it') return 3; if (HT[i] === 'was' && HT[j] === 'cat') return 2.4; if ((HT[i] === 'tired' || HT[i] === 'sat') && HT[j] === 'cat') return 3; return j === i ? 1.5 : 0; })); }); }
  function draw9b() {
    var A = headW(hmode), k = L.ctx('c9'), g = k.g, cs = 34, ox = 90, oy = 50; g.font = '12px IBM Plex Sans,sans-serif';
    HT.forEach(function (t, j) { g.save(); g.translate(ox + j * cs + 10, oy - 6); g.rotate(-.6); g.fillStyle = col('--muted'); g.fillText(t, 0, 0); g.restore(); });
    A.forEach(function (r, i) { g.fillStyle = C.ink; g.textAlign = 'right'; g.fillText(HT[i], ox - 8, oy + i * cs + cs / 2 + 4); g.textAlign = 'left'; r.forEach(function (v, j) { g.fillStyle = j > i ? '#f1f3f5' : 'rgba(47,84,235,' + (.06 + v * .94).toFixed(3) + ')'; g.fillRect(ox + j * cs, oy + i * cs, cs - 3, cs - 3); if (j <= i) { g.fillStyle = v > .5 ? '#fff' : C.ink; g.font = '10px IBM Plex Mono,monospace'; g.fillText(v.toFixed(2), ox + j * cs + 3, oy + i * cs + cs / 2 + 3); g.font = '12px IBM Plex Sans,sans-serif'; } }); });
    g.fillStyle = col('--muted'); g.fillText(hmode ? 'Head 2: “it” takes most of its information from “cat”.' : 'Head 1: each word attends mostly to the previous word.', ox + 7 * cs + 12, oy + 20);
  }
  L.seg('hd9', function (v) { hmode = +v; draw9b(); }); draw9b();

  /* ================= per-step renderers using the live model ================= */
  var sel4 = -1, hov5 = null, view12 = 'row';
  function render() {
    var m = M, n = m.n, t = fi(), names = tokNames(), dims = ['d1', 'd2', 'd3', 'd4'];
    // E table
    $('f0e').innerHTML = mx(E, { rl: VOC, cl: dims, hl: function (i) { return seq.indexOf(i) >= 0; }, max: 1 });
    // 2
    var oh = VOC.map(function (_, i) { return i === seq[t] ? 1 : 0; });
    $('f2').innerHTML = '<div class="mrow">' + blk(mx([oh], { rl: ['one-hot'], cl: VOC, max: 1, fmt: function (v) { return v; } })) + '<span class="op">·</span>' + blk(mx(E, { rl: VOC, cl: dims, max: 1, hl: function (i) { return i === seq[t]; }, fmt: function (v) { return v; } })) + '<span class="op">=</span>' + blk(mx([E[seq[t]]], { rl: [VOC[seq[t]]], cl: dims, max: 1, fmt: function (v) { return v; } })) + '</div>' +
      '<div class="mcap" style="text-align:left;margin-top:6px">All tokens stacked (n × d = ' + n + ' × 4):</div>' + mx(m.X0, { rl: names, cl: dims, max: 1, hl: function (i) { return i === t; }, fmt: function (v) { return v; } });
    // 3
    $('f3').innerHTML = '<div class="mrow">' + blk(mx(m.X0, { rl: names, cl: dims, max: 2, cap: 'E[id]' })) + '<span class="op">+</span>' + blk(mx(m.P, { rl: m.P.map(function (_, i) { return 'p=' + i; }), cl: dims, max: 2, cap: 'PE' })) + '<span class="op">=</span>' + blk(mx(m.X, { rl: names, cl: dims, max: 2, hl: function (i) { return i === t; }, cap: 'x (enters the layer)' })) + '</div>';
    // 4
    var s4 = sel4 < 0 || sel4 >= n ? t : sel4, x = m.X[s4];
    $('f4').innerHTML = '<div class="mrow">' + blk(mx(m.X, { rl: names, cl: dims, max: 2, hl: function (i) { return i === s4; }, rowAttr: function (i) { return 'data-r="' + i + '" style="cursor:pointer"'; }, cap: 'X (click a row)' })) + '<span class="op">·</span>' +
      blk(mx(WQ, { cl: ['', ''], max: 1, cap: 'W_Q' })) + blk(mx(WK, { cl: ['', ''], max: 1, cap: 'W_K' })) + blk(mx(WV, { cl: ['', ''], max: 1, cap: 'W_V' })) + '</div><div class="mrow">' +
      blk(mx(m.Q, { rl: names, cl: ['q1', 'q2'], max: 3, hl: function (i) { return i === s4; }, cap: 'Q = X·W_Q' })) + blk(mx(m.K, { rl: names, cl: ['k1', 'k2'], max: 3, hl: function (i) { return i === s4; }, cap: 'K = X·W_K' })) + blk(mx(m.V, { rl: names, cl: ['v1', 'v2'], max: 3, hl: function (i) { return i === s4; }, cap: 'V = X·W_V' })) + '</div>' +
      '<div class="calc">' + [['q', WQ, m.Q], ['k', WK, m.K], ['v', WV, m.V]].map(function (r) { return '<b>' + r[0] + '</b>(' + names[s4] + ') = [' + [0, 1].map(function (c) { return r[1].map(function (w, i) { return w[c] ? f2(x[i]) + (w[c] !== 1 ? '·' + w[c] : '') : null; }).filter(Boolean).join(' + ') + ' = <b>' + f2(r[2][s4][c]) + '</b>'; }).join(' , ') + ']'; }).join('<br>') + '</div>';
    $('f4').querySelectorAll('tr[data-r]').forEach(function (tr) { tr.onclick = function () { sel4 = +tr.dataset.r; render(); }; });
    // 5
    var hv = hov5 || [t, t];
    if (hv[0] >= n || hv[1] >= n) hv = [t, t];
    $('f5').innerHTML = mx(m.S, { rl: names.map(function (s) { return 'q(' + s + ')'; }), cl: names.map(function (s) { return 'k(' + s + ')'; }), hl: function (i, j) { return i === hv[0] && j === hv[1]; } }) +
      '<div class="calc">S[' + names[hv[0]] + ', ' + names[hv[1]] + '] = q·k = (' + f2(m.Q[hv[0]][0]) + ')(' + f2(m.K[hv[1]][0]) + ') + (' + f2(m.Q[hv[0]][1]) + ')(' + f2(m.K[hv[1]][1]) + ') = <b>' + f2(m.S[hv[0]][hv[1]]) + '</b></div>';
    $('f5').querySelectorAll('td').forEach(function (td) { var f = function () { hov5 = [+td.dataset.i, +td.dataset.j]; render(); }; td.addEventListener('mouseenter', f); td.addEventListener('click', f); });
    // 6
    $('f6').innerHTML = mx(m.Ss, { rl: names, cl: names, off: function (i, j) { return !isFinite(m.Ss[i][j]); }, hl: function (i) { return i === t; } }) + '<div class="calc">row “' + names[t] + '”: ' + m.S[t].map(function (v, j) { return isFinite(m.Ss[t][j]) ? f2(v) + ' / 1.414 = <b>' + f2(m.Ss[t][j]) + '</b>' : names[j] + ': masked → −∞'; }).join(' · ') + '</div>';
    // 7
    var row = m.Ss[t], mxr = Math.max.apply(null, row.filter(isFinite)), ex = row.map(function (v) { return isFinite(v) ? Math.exp(v) : 0; }), sm = ex.reduce(function (a, v) { return a + v; }, 0);
    $('f7').innerHTML = mx(m.A, { rl: names, cl: names, max: 1, off: function (i, j) { return !isFinite(m.Ss[i][j]); }, hl: function (i) { return i === t; } }) +
      '<div class="calc">' + row.map(function (v, j) { return isFinite(v) ? 'e<sup>' + f2(v) + '</sup> = ' + (ex[j] > 1000 ? ex[j].toFixed(0) : ex[j].toFixed(2)) : 'e<sup>−∞</sup> = 0'; }).join(' · ') + '<br>sum = ' + (sm > 1000 ? sm.toFixed(0) : sm.toFixed(2)) + ' → α = [' + m.A[t].map(function (v) { return '<b>' + v.toFixed(2) + '</b>'; }).join(', ') + ']</div>' +
      '<div class="nbars">' + m.A[t].map(function (v, j) { return '<div class="r"><span>' + names[j] + '</span><span class="z"><i style="width:' + (v * 100) + '%;background:' + C.blue + '"></i></span><span>' + (v * 100).toFixed(1) + '%</span></div>'; }).join('') + '</div>';
    // 8
    var p8 = L.plot('c8', { x: [-.3, 3.2], y: [-.3, 3.2], xl: 'value dimension 1', yl: 'value dimension 2' });
    m.V.forEach(function (v, j) { var a = m.A[t][j]; p8.arrow(0, 0, v[0], v[1], a > .01 ? L.PAL[j % 8] : '#ced4da', 1.5 + a * 4); p8.text(names[j] + '  α=' + a.toFixed(2), v[0] + .05, v[1] + .08, L.PAL[j % 8], 'left', '600 12px IBM Plex Sans,sans-serif'); });
    var z = m.Z[t]; p8.dot(z[0], z[1], C.orange, 8); p8.text('z = [' + f2(z[0]) + ', ' + f2(z[1]) + ']', z[0] + .12, z[1] - .45, C.orange, 'left', '700 13px IBM Plex Sans,sans-serif');
    $('f8').innerHTML = '<div class="calc">z(' + names[t] + ') = ' + m.A[t].map(function (a, j) { return a > 1e-6 ? a.toFixed(2) + '×[' + m.V[j].map(function (v) { return f2(v); }).join(', ') + ']' : null; }).filter(Boolean).join(' + ') + ' = <b>[' + z.map(function (v) { return f2(v); }).join(', ') + ']</b></div>' + mx(m.Z, { rl: names, cl: ['z1', 'z2'], max: 3, hl: function (i) { return i === t; }, cap: 'Z = α·V' });
    // 9
    $('f9').innerHTML = '<div class="mrow">' + blk(mx(m.Z, { rl: names, cl: ['z1', 'z2'], max: 3, cap: 'Z' })) + '<span class="op">·</span>' + blk(mx(WO, { cl: dims, max: 1, cap: 'W_O (2 × 4)' })) + '<span class="op">=</span>' + blk(mx(m.AO, { rl: names, cl: dims, max: 3, hl: function (i) { return i === t; }, cap: 'attention output' })) + '</div>';
    // 10
    var ln = m.LN1[t], groups = [m.X[t], m.AO[t], m.R1[t], ln.h], gc = ['#adb5bd', C.purple, C.blue, C.orange], p10 = L.plot('c10', { x: [-.5, 3.5], y: [Math.min(-2, Math.min.apply(null, ln.h) - .3), Math.max(4.5, Math.max.apply(null, m.R1[t]) + .5)], xl: 'dimension', yl: 'value', xt: false });
    p10.hl(0, col('--muted'), []);
    for (var dd = 0; dd < 4; dd++) { groups.forEach(function (gv, gi) { var x0 = dd - .36 + gi * .18; p10.rect(x0, Math.min(0, gv[dd]), x0 + .16, Math.max(0, gv[dd]), gc[gi], .9); }); p10.text('d' + (dd + 1), dd, p10.y0 + .1, C.ink, 'center', '600 12px IBM Plex Sans,sans-serif'); }
    ['x', 'attn', 'r = x + attn', 'h = LayerNorm(r)'].forEach(function (s, gi) { p10.ptext(s, p10.L + 8 + gi * 90, p10.T + 14, gc[gi], 'left', '600 12px IBM Plex Sans,sans-serif'); });
    $('f10').innerHTML = 'r = [' + m.R1[t].map(function (v) { return f2(v); }).join(', ') + ']<br>μ = ' + f2(ln.mu * 4) + ' / 4 = <b>' + f2(ln.mu) + '</b> · deviations = [' + ln.dev.map(function (v) { return f2(v); }).join(', ') + ']<br>σ² = <b>' + ln.va.toFixed(3) + '</b> · σ = <b>' + f2(Math.sqrt(ln.va)) + '</b> · h = γ·dev/σ + β = <b>[' + ln.h.map(function (v) { return f2(v); }).join(', ') + ']</b>';
    // 11
    var h = m.H[t], tb = '<table class="mx"><tr><th>neuron</th><th>listens for (W₁ col)</th><th>dot</th><th>+ bias</th><th>= score</th><th>' + (m.relu ? 'ReLU' : 'no ReLU') + '</th></tr>';
    for (var j = 0; j < 8; j++) { var colj = W1.map(function (r) { return r[j]; }), on = m.Act[t][j] > 0; tb += '<tr' + (on || !m.relu ? '' : ' style="opacity:.45"') + '><th>n' + (j + 1) + '</th><td style="background:#f8f9fb">[' + colj.join(', ') + ']</td><td style="background:#f8f9fb">' + f2(m.Dt[t][j]) + '</td><td style="background:#f8f9fb">' + f2(B1[j]) + '</td><td style="background:#f8f9fb">' + f2(m.U[t][j]) + '</td><td style="background:' + heat(m.Act[t][j], 2) + '"><b>' + f2(m.Act[t][j]) + '</b>' + (m.relu && !on ? ' silent' : '') + '</td></tr>'; }
    $('f11').innerHTML = '<div class="calc">h(' + names[t] + ') = [' + h.map(function (v) { return f2(v); }).join(', ') + ']</div>' + tb + '</table>';
    var amx = Math.max(1.5, Math.max.apply(null, m.Act[t].map(Math.abs)));
    $('nb11').innerHTML = m.Act[t].map(function (v, j) { var w = Math.abs(v) / amx * 50; return '<div class="r"><span>n' + (j + 1) + '</span><span class="z"><i style="position:absolute;top:0;height:14px;' + (v >= 0 ? 'left:50%' : 'right:50%') + ';width:' + w + '%;background:' + (v >= 0 ? C.blue : C.orange) + '"></i><i style="position:absolute;left:50%;top:-2px;width:1px;height:18px;background:#868e96"></i></span><span>' + f2(v) + '</span></div>'; }).join('');
    // 12
    var a = m.Act[t], contrib = W2.map(function (r, j) { return r.map(function (v) { return v * a[j]; }); }), sums = [0, 1, 2, 3].map(function (c) { return contrib.reduce(function (s, r) { return s + r[c]; }, 0); });
    if (view12 === 'row') {
      var t12 = '<table class="mx"><tr><th>neuron</th><th>fired a</th><th>writes (W₂ row)</th><th>out1</th><th>out2</th><th>out3</th><th>out4</th></tr>';
      contrib.forEach(function (r, j) { t12 += '<tr' + (Math.abs(a[j]) < 1e-9 ? ' style="opacity:.4"' : '') + '><th>n' + (j + 1) + '</th><td style="background:#f8f9fb">' + f2(a[j]) + '</td><td style="background:#f8f9fb">[' + W2[j].join(', ') + ']</td>' + r.map(function (v) { return '<td style="background:' + heat(v, 1.5) + '">' + v.toFixed(3) + '</td>'; }).join('') + '</tr>'; });
      t12 += '<tr><th colspan="3" style="text-align:right">column sums = f</th>' + sums.map(function (v) { return '<td style="background:#fff3bf"><b>' + f2(v) + '</b></td>'; }).join('') + '</tr></table>';
      $('f12').innerHTML = t12;
    } else {
      $('f12').innerHTML = '<div class="calc">a = [' + a.map(function (v) { return f2(v); }).join(', ') + ']<br>' + [0, 1, 2, 3].map(function (c) { return 'a·W₂[:,' + (c + 1) + '] = ' + W2.map(function (r, j) { return r[c] && Math.abs(a[j]) > 1e-9 ? f2(a[j]) + '×' + r[c] : null; }).filter(Boolean).join(' + ') + ' = <b>' + f2(sums[c]) + '</b>'; }).join('<br>') + '</div>' + mx(T_(W2), { rl: ['col1', 'col2', 'col3', 'col4'], cl: ['n1', 'n2', 'n3', 'n4', 'n5', 'n6', 'n7', 'n8'], max: 1, cap: 'columns of W₂ (each 8 numbers long)' });
    }
    // 13
    var ln2 = m.LN2[t];
    $('f13').innerHTML = '<div class="calc">f + h = [' + m.F[t].map(function (v) { return f2(v); }).join(', ') + '] + [' + m.H[t].map(function (v) { return f2(v); }).join(', ') + '] = [' + m.R2[t].map(function (v) { return f2(v); }).join(', ') + ']<br>μ = <b>' + f2(ln2.mu) + '</b> · σ = <b>' + f2(Math.sqrt(ln2.va)) + '</b> → h_final = <b>[' + ln2.h.map(function (v) { return f2(v); }).join(', ') + ']</b></div>';
    draw13();
    // 14
    var hf = m.HF[t], lg = m.LG[t], lmx = Math.max.apply(null, lg.map(Math.abs)), t14 = '<table class="mx"><tr><th>word</th><th>E[w]</th><th>h_final · E[w]</th><th>logit</th><th style="min-width:120px"></th></tr>';
    VOC.forEach(function (w, i) { var terms = E[i].map(function (e, k) { return e ? '(' + f2(hf[k]) + ')' : null; }).filter(Boolean).join(' + '); var bw = Math.abs(lg[i]) / lmx * 50; t14 += '<tr><th>' + w + '</th><td style="background:#f8f9fb">[' + E[i].join(',') + ']</td><td style="background:#f8f9fb;text-align:left">' + terms + '</td><td style="background:' + heat(lg[i], lmx) + '"><b>' + f2(lg[i]) + '</b></td><td style="background:#fff;position:relative"><i style="position:absolute;top:6px;height:12px;' + (lg[i] >= 0 ? 'left:50%' : 'right:50%') + ';width:' + bw + '%;background:' + (lg[i] >= 0 ? C.blue : C.orange) + ';border-radius:3px"></i></td></tr>'; });
    $('f14').innerHTML = '<div class="calc">h_final(' + names[t] + ') = [' + hf.map(function (v) { return f2(v); }).join(', ') + ']</div>' + t14 + '</table>';
    draw15(); draw16(); flowText();
  }
  L.seg('v12', function (v) { view12 = v; render(); });

  function draw13() {
    var N = L.val('n13'), k = L.ctx('c13'), g = k.g, bw = Math.min(70, (k.W - 120) / N - 8), n = M.n;
    g.font = '12px IBM Plex Sans,sans-serif';
    for (var i = 0; i <= N; i++) { var x = 20 + i * (bw + 8) + (i ? 0 : 0); }
    g.fillStyle = col('--muted'); g.fillText('X: ' + n + ' × 4', 4, 104);
    for (i = 0; i < N; i++) { var x0 = 70 + i * (bw + 8); g.fillStyle = i % 2 ? '#d0dcff' : '#e6ecff'; g.fillRect(x0, 40, bw, 110); g.strokeStyle = C.blue; g.strokeRect(x0, 40, bw, 110); g.fillStyle = C.ink; g.fillText('L' + (i + 1), x0 + bw / 2 - 8, 62); g.fillStyle = '#d3f9d8'; g.fillRect(x0 + 6, 92, bw - 12, 22); g.fillStyle = '#fff3bf'; g.fillRect(x0 + 6, 120, bw - 12, 22); g.fillStyle = col('--muted'); g.font = '10px IBM Plex Sans,sans-serif'; if (bw > 40) { g.fillText('attn', x0 + 10, 107); g.fillText('FFN', x0 + 10, 135); } g.font = '12px IBM Plex Sans,sans-serif'; L.arrow(g, x0 - 7, 95, x0 - 1, 95, C.ink, 1.5); }
    var xe = 70 + N * (bw + 8); L.arrow(g, xe - 7, 95, xe + 4, 95, C.ink, 1.5); g.fillStyle = col('--muted'); g.fillText(n + ' × 4', xe + 8, 99);
    g.fillStyle = C.ink; g.font = '600 13px IBM Plex Sans,sans-serif'; g.fillText(N + ' layer' + (N > 1 ? 's' : '') + ' → toy model parameters: 20 + ' + N + ' × 124 = ' + (20 + 124 * N), 4, 22);
    g.font = '12px IBM Plex Sans,sans-serif'; g.fillStyle = col('--muted'); g.fillText('each layer: attention (32) + FFN (76) + 2 LayerNorms (16) = 124 parameters; the embedding (20) is shared', 4, k.H - 10);
  }
  L.bind('n13', function () { draw13(); });

  var T15 = 1;
  function draw15() {
    var t = fi(), lg = M.LG[t], T = L.val('t15'), p = L.softmax(lg, T), k = L.ctx('c15'), g = k.g, bw = (k.W - 40) / 5, top = p.indexOf(Math.max.apply(null, p));
    p.forEach(function (v, i) { var h = v * 180, x = 24 + i * bw; g.fillStyle = i === 2 ? C.green : C.blue; g.globalAlpha = i === 2 ? .9 : .75; g.fillRect(x + 10, 205 - h, bw - 20, h); g.globalAlpha = 1; if (i === top) { g.strokeStyle = C.ink; g.lineWidth = 2.5; g.strokeRect(x + 10, 205 - h, bw - 20, h); }
      g.fillStyle = C.ink; g.font = '600 13px IBM Plex Mono,monospace'; g.textAlign = 'center'; g.fillText((v * 100).toFixed(1) + '%', x + bw / 2, 198 - h); g.font = '13px IBM Plex Sans,sans-serif'; g.fillText(VOC[i] + (i === 2 ? ' (target)' : ''), x + bw / 2, 224); g.fillStyle = col('--muted'); g.font = '11px IBM Plex Mono,monospace'; g.fillText('logit ' + f2(lg[i]), x + bw / 2, 240); g.textAlign = 'left'; });
  }
  L.bind('t15', function () { draw15(); });

  /* 16: sampling */
  var counts = [0, 0, 0, 0, 0], last16 = null, r16 = L.rng(5);
  function probs16() { var T = L.val('t16'), lg = M.LG[M.n - 1]; if (T < .02) { var b = lg.indexOf(Math.max.apply(null, lg)); return lg.map(function (_, i) { return i === b ? 1 : 0; }); } return L.softmax(lg, T); }
  function sample16() { var p = probs16(), u = r16(), a = 0; for (var i = 0; i < 5; i++) { a += p[i]; if (u < a) return i; } return 4; }
  function draw16() {
    var p = probs16(), tot = counts.reduce(function (a, b) { return a + b; }, 0), k = L.ctx('c16'), g = k.g, bw = (k.W - 40) / 5;
    p.forEach(function (v, i) { var x = 24 + i * bw, f = tot ? counts[i] / tot : 0; g.fillStyle = C.orange; g.globalAlpha = .8; g.fillRect(x + 14, 170 - f * 150, bw - 28, f * 150); g.globalAlpha = 1; g.strokeStyle = '#868e96'; g.setLineDash([4, 3]); g.strokeRect(x + 10, 170 - v * 150, bw - 20, v * 150); g.setLineDash([]);
      g.fillStyle = C.ink; g.textAlign = 'center'; g.font = '13px IBM Plex Sans,sans-serif'; g.fillText(VOC[i], x + bw / 2, 188); g.font = '11px IBM Plex Mono,monospace'; g.fillStyle = col('--muted'); g.fillText(counts[i] + ' × · exp ' + (v * 100).toFixed(0) + '%', x + bw / 2, 204); g.textAlign = 'left'; });
    $('o16').innerHTML = (last16 === null ? 'Press <b>Sample</b>.' : 'last sample: <b>“' + VOC[last16] + '”</b>') + ' · samples so far: <b>' + tot + '</b> · the sentence is “' + seq.map(function (i) { return VOC[i]; }).join(' ') + '” → next word?';
  }
  $('smp16').onclick = function () { last16 = sample16(); counts[last16]++; draw16(); };
  $('smp100').onclick = function () { for (var i = 0; i < 100; i++) { last16 = sample16(); counts[last16]++; } draw16(); };
  $('app16').onclick = function () { if (last16 === null) { last16 = sample16(); } if (seq.length < 6) { seq.push(last16); follow = -1; counts = [0, 0, 0, 0, 0]; last16 = null; update(true); } else $('o16').innerHTML = 'The sentence bar holds at most 6 tokens. Press ⌫ or reset.'; };
  L.bind('t16', function () { counts = [0, 0, 0, 0, 0]; draw16(); });

  /* ================= 17: training W_U ================= */
  var WU, P0, hist17, tgt = 2, lastG = null, r17 = null;
  function tr17reset() { WU = T_(E).map(function (r) { return r.slice(); }); var h = M.HF[M.n - 1]; P0 = L.softmax(VOC.map(function (_, w) { return h.reduce(function (s, v, k) { return s + v * WU[k][w]; }, 0); })); hist17 = [-Math.log(P0[tgt])]; lastG = null; draw17(); }
  function probs17() { var h = M.HF[M.n - 1]; return L.softmax(VOC.map(function (_, w) { return h.reduce(function (s, v, k) { return s + v * WU[k][w]; }, 0); })); }
  function step17() { var h = M.HF[M.n - 1], p = probs17(), lr = L.val('lr17'), g = p.map(function (v, i) { return v - (i === tgt ? 1 : 0); }); for (var w = 0; w < 5; w++) for (var k = 0; k < 4; k++) WU[k][w] -= lr * g[w] * h[k]; lastG = g; hist17.push(-Math.log(probs17()[tgt])); }
  function draw17() {
    var p = probs17(), k = L.ctx('c17'), g = k.g, bw = (k.W - 40) / 5;
    p.forEach(function (v, i) { var x = 24 + i * bw; g.fillStyle = '#ced4da'; g.fillRect(x + 8, 190 - P0[i] * 160, (bw - 20) / 2, P0[i] * 160); g.fillStyle = C.blue; g.fillRect(x + 8 + (bw - 20) / 2, 190 - v * 160, (bw - 20) / 2, v * 160); if (i === tgt) { g.strokeStyle = C.green; g.lineWidth = 3; g.strokeRect(x + 4, 190 - Math.max(v, P0[i]) * 160 - 4, bw - 12, Math.max(v, P0[i]) * 160 + 4); }
      g.fillStyle = C.ink; g.textAlign = 'center'; g.font = '13px IBM Plex Sans,sans-serif'; g.fillText(VOC[i], x + bw / 2, 208); g.font = '11px IBM Plex Mono,monospace'; g.fillStyle = col('--muted'); g.fillText((P0[i] * 100).toFixed(1) + '% → ' + (v * 100).toFixed(1) + '%', x + bw / 2, 224); g.textAlign = 'left'; });
    var q = L.plot('c17b', { x: [0, Math.max(20, hist17.length - 1)], y: [0, Math.max(2, hist17[0] * 1.1)], xl: 'training step', yl: 'loss', m: [6, 10, 30, 46] }); q.path(hist17.map(function (v, i) { return [i, v]; }), C.purple, 2.5); q.dot(hist17.length - 1, hist17[hist17.length - 1], C.purple, 4);
    var cur = hist17[hist17.length - 1];
    $('f17').innerHTML = 'steps <b>' + (hist17.length - 1) + '</b> · P(' + VOC[tgt] + ') = <b>' + (p[tgt] * 100).toFixed(1) + '%</b> · loss −ln P = <b>' + cur.toFixed(2) + '</b> (start ' + hist17[0].toFixed(2) + ')' +
      (lastG ? '<br>last step: p − y = [' + lastG.map(function (v, i) { return VOC[i] + ' ' + (v >= 0 ? '+' : '') + v.toFixed(3); }).join(', ') + ']<br>W_U column of “' + VOC[tgt] + '” now = [' + WU.map(function (r) { return r[tgt].toFixed(3); }).join(', ') + ']' : '<br>press Train: the target word’s logit is pushed up, the others down');
  }
  $('tg17').innerHTML = VOC.map(function (w, i) { return '<button data-v="' + i + '"' + (i === 2 ? ' class="on"' : '') + '>' + w + '</button>'; }).join('');
  L.seg('tg17', function (v) { tgt = +v; tr17reset(); });
  $('tr1').onclick = function () { step17(); draw17(); };
  $('tr20').onclick = function () { for (var i = 0; i < 20; i++) step17(); draw17(); };
  L.runner('trrun', function () { step17(); draw17(); if (hist17.length > 400) return false; }, 80);
  $('trrs').onclick = tr17reset; L.bind('lr17');

  /* ================= 18: parameter calculator ================= */
  var PRE = {
    toy: [4, 1, 1, 1, 2, 8, 5, 2, 0, 1, 1, 0, 0, 0, 0], gpt2s: [768, 12, 12, 12, 64, 3072, 50257, 1024, 0, 1, 1, 1, 0, 1, 1], gpt2xl: [1600, 48, 25, 25, 64, 6400, 50257, 1024, 0, 1, 1, 1, 0, 1, 1],
    gpt3: [12288, 96, 96, 96, 128, 49152, 50257, 2048, 0, 1, 1, 1, 0, 1, 1], l7: [4096, 32, 32, 32, 128, 11008, 32000, 4096, 1, 0, 0, 0, 1, 0, 1], l13: [5120, 40, 40, 40, 128, 13824, 32000, 4096, 1, 0, 0, 0, 1, 0, 1], l70: [8192, 80, 64, 8, 128, 28672, 32000, 4096, 1, 0, 0, 0, 1, 0, 1]
  };
  var PNAME = { toy: 'our toy model', gpt2s: 'GPT-2 small (2019)', gpt2xl: 'GPT-2 XL (2019)', gpt3: 'GPT-3 (2020)', l7: 'Llama 2 7B (2023)', l13: 'Llama 2 13B (2023)', l70: 'Llama 2 70B (2023)' }, curPre = 'toy';
  var NUM = ['pd', 'pL', 'ph', 'pkv', 'pdk', 'pff', 'pV', 'pctx'], CHK = ['pgate', 'ptied', 'pbias', 'pabias', 'prms', 'plpos', 'pfin'];
  function setPre(k) { curPre = k; var v = PRE[k]; NUM.forEach(function (id, i) { $(id).value = v[i]; }); CHK.forEach(function (id, i) { $(id).checked = !!v[8 + i]; }); draw18(); }
  function hum(n) { return n >= 1e9 ? (n / 1e9).toFixed(2) + ' B' : n >= 1e6 ? (n / 1e6).toFixed(2) + ' M' : n >= 1e3 ? (n / 1e3).toFixed(1) + ' K' : String(n); }
  function by(n) { return n >= 1e12 ? (n / 1e12).toFixed(1) + ' TB' : n >= 1e9 ? (n / 1e9).toFixed(1) + ' GB' : n >= 1e6 ? (n / 1e6).toFixed(1) + ' MB' : n >= 1e3 ? (n / 1e3).toFixed(1) + ' KB' : n + ' bytes'; }
  function draw18() {
    var g = {}; NUM.forEach(function (id) { g[id] = Math.max(1, Math.round(+$(id).value || 1)); }); CHK.forEach(function (id) { g[id] = $(id).checked; });
    var d = g.pd, Lr = g.pL, h = g.ph, kv = g.pkv, dk = g.pdk, ff = g.pff, V = g.pV, ctx = g.pctx, nw = g.prms ? d : 2 * d;
    var emb = V * d, pos = g.plpos ? ctx * d : 0;
    var q = d * h * dk + (g.pabias ? h * dk : 0), kk = d * kv * dk + (g.pabias ? kv * dk : 0), o = h * dk * d + (g.pabias ? d : 0), att = q + 2 * kk + o;
    var ffn = (g.pgate ? 3 : 2) * d * ff + (g.pbias ? (g.pgate ? 2 * ff : ff) + d : 0), nrm = 2 * nw, layer = att + ffn + nrm, fin = g.pfin ? nw : 0, un = g.ptied ? 0 : V * d;
    var total = emb + pos + Lr * layer + fin + un, rule = 12 * d * d * Lr + V * d;
    var parts = [['Embeddings (token + position)', emb + pos, C.gray], ['Attention (Q, K, V, O) × L', Lr * att, C.blue], ['Feed-forward × L', Lr * ffn, C.green], ['Norms (γ, β)', Lr * nrm + fin, C.yellow], ['Unembedding', un, C.purple]];
    var k = L.ctx('c18'), cx = k.g, x = 4; cx.font = '600 13px IBM Plex Sans,sans-serif'; cx.fillStyle = C.ink; cx.fillText(PNAME[curPre] ? 'Where the ' + hum(total) + ' parameters of ' + PNAME[curPre] + ' live' : 'Custom model: ' + hum(total) + ' parameters', 4, 16);
    parts.forEach(function (p) { var w = p[1] / total * (k.W - 8); if (w <= 0) return; cx.fillStyle = p[2]; cx.fillRect(x, 26, w, 40); if (w > 46) { cx.fillStyle = '#fff'; cx.font = '600 12px IBM Plex Sans,sans-serif'; cx.fillText((p[1] / total * 100).toFixed(0) + '%', x + 6, 51); } x += w; });
    cx.font = '12px IBM Plex Sans,sans-serif'; parts.forEach(function (p, i) { var lx = 4 + (i % 3) * 210, ly = 88 + Math.floor(i / 3) * 20; cx.fillStyle = p[2]; cx.fillRect(lx, ly - 10, 12, 12); cx.fillStyle = C.ink; cx.fillText(p[0], lx + 18, ly); });
    var rows = [
      ['token embedding E', 'V·d = ' + V.toLocaleString() + '·' + d.toLocaleString(), emb],
      ['learned positions', g.plpos ? 'ctx·d = ' + ctx.toLocaleString() + '·' + d.toLocaleString() : 'sinusoidal / RoPE: none', pos],
      ['attention per layer', 'd·h·d_k + 2·d·kv·d_k + h·d_k·d' + (g.pabias ? ' + biases' : ''), att],
      ['feed-forward per layer', (g.pgate ? '3' : '2') + '·d·d_ff' + (g.pbias ? ' + biases' : ''), ffn],
      ['2 norms per layer', '2 × ' + (g.prms ? 'd' : '2d'), nrm],
      ['× L layers', Lr + ' × ' + layer.toLocaleString(), Lr * layer],
      ['final norm', g.pfin ? (g.prms ? 'd' : '2d') : 'none', fin],
      ['unembedding W_U', g.ptied ? 'tied to E: 0' : 'd·V', un]];
    $('f18').innerHTML = '<table class="mx" style="width:100%;font-size:12px"><tr><th style="text-align:left">group</th><th style="text-align:left">formula</th><th style="text-align:right">count</th></tr>' + rows.map(function (r) { return '<tr><td style="background:#f8f9fb;text-align:left">' + r[0] + '</td><td style="background:#f8f9fb;text-align:left">' + r[1] + '</td><td style="background:#f8f9fb;text-align:right">' + r[2].toLocaleString() + '</td></tr>'; }).join('') +
      '<tr><td style="background:#fff3bf;text-align:left"><b>TOTAL</b></td><td style="background:#fff3bf;text-align:left">exact</td><td style="background:#fff3bf;text-align:right"><b>' + total.toLocaleString() + '</b> (' + hum(total) + ')</td></tr>' +
      '<tr><td style="text-align:left">rule of thumb</td><td style="text-align:left">12·d²·L + V·d</td><td style="text-align:right">' + rule.toLocaleString() + ' (' + hum(rule) + ', ' + (rule / total * 100).toFixed(0) + '% of exact)</td></tr>' +
      '<tr><td style="text-align:left">memory to store</td><td style="text-align:left">fp16: 2 bytes / parameter</td><td style="text-align:right">' + by(total * 2) + '</td></tr>' +
      '<tr><td style="text-align:left">memory to train</td><td style="text-align:left">≈ 16 bytes / parameter (Adam)</td><td style="text-align:right">' + by(total * 16) + '</td></tr></table>';
  }
  L.seg('pre18', setPre); NUM.concat(CHK).forEach(function (id) { $(id).addEventListener('input', function () { curPre = 'custom'; document.querySelectorAll('#pre18 button').forEach(function (b) { b.classList.remove('on'); }); draw18(); }); $(id).addEventListener('change', function () { curPre = 'custom'; draw18(); }); });

  /* ================= flowchart ================= */
  var FB = [
    { s: 0, id: 'in', t: 'INPUT TEXT', sub: '', c: '#1e2430', x: 20, y: 6 },
    { s: 1, t: '1 · Tokenize', sub: 'text → integer ids', c: '#1e2430', y: 62 },
    { s: 2, t: '2 · Embed: look up table E', sub: 'each id → d numbers', c: '#1e2430', y: 98 },
    { s: 3, t: '3 · Add positional encoding', sub: 'inject word order (fixed formula)', c: '#1e2430', y: 134 },
    { s: 4, t: 'Q = X·W_Q', sub: 'what I seek', c: '#3b3fa6', y: 212, x: 26, w: 80 },
    { s: 4, t: 'K = X·W_K', sub: 'what I advertise', c: '#3b3fa6', y: 212, x: 110, w: 80 },
    { s: 4, t: 'V = X·W_V', sub: 'what I hand over', c: '#1d6b5a', y: 212, x: 194, w: 80 },
    { s: 5, t: '5 · Scores = Q·Kᵀ', sub: 'one match number per word pair', c: '#3b3fa6', y: 250 },
    { s: 6, t: '6 · ÷ √d_k, causal mask', sub: 'future positions → −∞', c: '#3b3fa6', y: 286 },
    { s: 7, t: '7 · Softmax', sub: 'scores → weights that sum to 1', c: '#8a5a1c', y: 322 },
    { s: 8, t: '8 · Multiply by V', sub: 'each word becomes a blend', c: '#1d6b5a', y: 358 },
    { s: 9, t: '9 · Project with W_O', sub: 'recombine heads, restore width d', c: '#3b3fa6', y: 394 },
    { s: 10, t: '10 · Add residual, LayerNorm', sub: 'learned γ and β', c: '#8a5a1c', y: 430 },
    { s: 11, t: '11 · FFN expand + ReLU  d → 4d', sub: 'detectors fire or stay silent', c: '#1d6b5a', y: 474 },
    { s: 12, t: '12 · FFN contract  4d → d', sub: 'collect the votes into one vector', c: '#1d6b5a', y: 510 },
    { s: 13, t: '13 · Add residual, LayerNorm', sub: 'same width d, so layers stack', c: '#8a5a1c', y: 546 },
    { s: 14, t: '14 · Unembed with W_U', sub: 'one logit per vocabulary word', c: '#3b3fa6', y: 612 },
    { s: 15, t: '15 · Softmax over the vocabulary', sub: 'logits → probabilities', c: '#8a5a1c', y: 648 },
    { s: 16, t: '16 · Sample a token', sub: 'temperature controls randomness', c: '#1d6b5a', y: 684 },
    { s: 17, t: 'TRAINING: loss → gradients → update', sub: 'backprop through every step (training only)', c: '#e8590c', y: 736, dash: 1 }];
  var TRAINABLE = [2, 4, 9, 10, 11, 12, 13, 14], curStep = 0;
  var FXT = ['The sentence enters at the top. Scroll to follow it through every step.', 'Cut the text into tokens and replace each by its integer id.', 'Each id selects a row of E: a learned vector of d numbers.', 'Add a position pattern so word order is not lost.', 'Three projections give every token a query, a key and a value.', 'Every query is compared with every key (dot products).', 'Scale the scores and hide future tokens.', 'Each row of scores becomes weights that sum to 1.', 'Each token’s new vector is a weighted blend of the values.', 'Map back to width d (and mix the heads).', 'Add the input back, then normalise.', 'Each token passes through 8 detectors.', 'The detectors’ outputs are collected back to width d.', 'Add and normalise again; the layer is done (repeat N times).', 'The last token’s vector gives one score per vocabulary word.', 'Scores become next-word probabilities.', 'Pick a token, append it, run everything again.', 'Training: compare with the true next word and adjust every parameter.', 'Highlighted: every box with trained parameters (144 in total).'];
  function drawFlow() {
    var s = '<defs><marker id="fa" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto"><path d="M0 0L7 3.5L0 7z" fill="#5d6675"/></marker><marker id="fo" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto"><path d="M0 0L7 3.5L0 7z" fill="#e8590c"/></marker></defs><g font-family="IBM Plex Sans,system-ui,sans-serif">';
    s += '<text x="20" y="56" font-size="9.5" font-weight="700" fill="#5d6675" letter-spacing=".08em">PHASE 1 · TEXT IN</text>';
    s += '<rect x="14" y="174" width="272" height="410" rx="10" fill="none" stroke="#adb5bd" stroke-width="1.3"/><text x="24" y="188" font-size="10" font-weight="700" fill="#5d6675" letter-spacing=".06em">THE LAYER — REPEAT N TIMES</text>';
    s += '<text x="276" y="203" text-anchor="end" font-size="9" fill="#868e96">attention: tokens talk</text><text x="276" y="469" text-anchor="end" font-size="9" fill="#868e96">feed-forward: each token alone</text>';
    s += '<text x="20" y="606" font-size="9.5" font-weight="700" fill="#5d6675" letter-spacing=".08em">PHASE 3 · WORD OUT</text>';
    // arrows between consecutive boxes
    [[36, 62], [92, 98], [128, 134], [164, 212], [244, 250], [280, 286], [316, 322], [352, 358], [388, 394], [424, 430], [460, 474], [504, 510], [540, 546], [576, 612], [642, 648], [678, 684]].forEach(function (a) { s += '<path d="M150 ' + a[0] + ' V' + (a[1] - 1) + '" stroke="#5d6675" stroke-width="1.2" marker-end="url(#fa)"/>'; });
    s += '<path d="M150 180 V 206" stroke="none"/>';
    // residual arrows
    s += '<path d="M18 200 V 445 H 22" fill="none" stroke="#e8590c" stroke-width="1.4" stroke-dasharray="3 2" marker-end="url(#fo)"/><text x="4" y="330" font-size="8.5" fill="#e8590c" transform="rotate(-90 8 330)">residual</text>';
    s += '<path d="M282 466 V 561 H 278" fill="none" stroke="#e8590c" stroke-width="1.4" stroke-dasharray="3 2" marker-end="url(#fo)"/>';
    // loop
    s += '<path d="M280 699 H 296 V 21 H 282" fill="none" stroke="#2f9e44" stroke-width="1.5" marker-end="url(#fa)"/><text x="292" y="640" font-size="8.5" fill="#2f9e44" transform="rotate(-90 292 640)">append token, run again</text>';
    var seqTxt = '“' + seq.map(function (i) { return VOC[i]; }).join(' ') + '”', topw = M ? VOC[M.LG[M.n - 1].indexOf(Math.max.apply(null, M.LG[M.n - 1]))] : '';
    FB.forEach(function (b, i) {
      var on = curStep === 18 ? TRAINABLE.indexOf(b.s) >= 0 : b.s === curStep, x = b.x != null ? b.x : (b.s >= 4 && b.s <= 13 ? 26 : 20), w = b.w || (b.s >= 4 && b.s <= 13 ? 248 : 260), hgt = 30, past = b.s < curStep && curStep <= 17;
      var t = b.id === 'in' ? 'INPUT TEXT ' + seqTxt : b.s === 16 && topw ? b.t + ' → “' + topw + '”' : b.t;
      s += '<g class="fb" data-s="' + b.s + '"><rect x="' + x + '" y="' + b.y + '" width="' + w + '" height="' + hgt + '" rx="6" fill="' + (on ? '#e8590c' : b.c) + '" opacity="' + (on ? 1 : past ? .85 : .55) + '" stroke="' + (on ? '#171b24' : 'none') + '" stroke-width="2"' + (b.dash ? ' stroke-dasharray="4 3"' : '') + '/>' +
        '<text x="' + (x + w / 2) + '" y="' + (b.y + 13) + '" text-anchor="middle" font-size="' + (w < 100 ? 10 : 11) + '" font-weight="700" fill="#fff">' + t + '</text><text x="' + (x + w / 2) + '" y="' + (b.y + 25) + '" text-anchor="middle" font-size="' + (w < 100 ? 8 : 9) + '" fill="#fff" opacity=".85">' + b.sub + '</text></g>';
    });
    $('flow').innerHTML = s + '</g>';
    $('flow').querySelectorAll('g.fb').forEach(function (gr) { gr.onclick = function () { var h = document.querySelector('.lsn-main h2[data-step="' + gr.dataset.s + '"]'); if (h) h.scrollIntoView({ behavior: 'smooth', block: 'start' }); }; });
  }
  function flowText() {
    $('flowx').innerHTML = '<b>' + (curStep >= 1 && curStep <= 16 ? 'Step ' + curStep + ' of 16' : curStep === 17 ? 'Training' : curStep === 18 ? 'Parameters' : 'Start') + '</b> · ' + FXT[curStep];
    $('fbn').textContent = curStep >= 1 && curStep <= 16 ? curStep + '/16' : curStep === 17 ? 'train' : curStep === 18 ? 'params' : 'start';
    $('fbt').textContent = (FB.filter(function (b) { return b.s === curStep; })[0] || { t: '' }).t.replace(/^\d+ · /, '');
    $('fbp').style.width = Math.min(100, curStep / 16 * 100) + '%';
    drawFlow();
  }
  var heads = Array.prototype.slice.call(document.querySelectorAll('.lsn-main h2[data-step]'));
  heads.forEach(function (h) { var s = +h.dataset.step; if (s >= 1 && s <= 16) h.setAttribute('data-badge', 'step ' + s + ' / 16'); });
  function onScroll() { var lim = innerHeight * .35, c = 0; heads.forEach(function (h) { if (h.getBoundingClientRect().top < lim) c = +h.dataset.step; }); if (c !== curStep) { curStep = c; flowText(); } }
  addEventListener('scroll', onScroll, { passive: true });

  /* ================= wiring ================= */
  function update(resetTrain) { M = compute(); drawSentence(); render(); if (resetTrain || !WU) tr17reset(); }
  $('mask6').onchange = function () { update(true); };
  $('norelu11').onchange = function () { update(true); };
  L.bind(['g10', 'b10'], function () { update(true); });
  update(true); setPre('toy'); onScroll(); flowText();
  addEventListener('resize', function () { draw13(); draw15(); draw16(); draw17(); });
})();
