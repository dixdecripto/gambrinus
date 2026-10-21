/* Gran Caffè Gambrinus v3 — motore di scroll senza dipendenze */
const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const seg = (p, a, b) => clamp((p - a) / (b - a));
const ease = t => 1 - Math.pow(1 - t, 3);
const inout = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
const lerp = (a, b, t) => a + (b - a) * t;
const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* scroll morbido (Lenis se disponibile) */
let lenis = null;
if (!calm && window.Lenis && !location.search.includes('rec')) { lenis = new Lenis({ lerp: .085, wheelMultiplier: .9 }); }

/* menu */
$('.burger')?.addEventListener('click', () => document.body.classList.toggle('menu-open'));
$$('.sheet a').forEach(a => a.addEventListener('click', () => document.body.classList.remove('menu-open')));

/* reveal */
let pending = $$('[data-reveal]');
function reveal() { if (!pending.length) return; pending = pending.filter(el => { const r = el.getBoundingClientRect(); if (r.top < innerHeight * .92 && r.bottom > 0) { el.classList.add('is-in'); return false; } return true; }); }

/* utilità: progresso di una sezione alta (sticky) */
function prog(el) { const r = el.getBoundingClientRect(); return clamp(-r.top / Math.max(1, r.height - innerHeight)); }
function through(el) { const r = el.getBoundingClientRect(); return clamp((innerHeight - r.top) / (innerHeight + r.height)); }

const scenes = [reveal];

/* HOME — l'ingresso: la sala a tutto schermo, lo scroll ti porta dentro */
const entry = $('.entry');
if (entry) {
  const img = $('.entry-img'), veil = $('.entry-veil'), sign = $('.entry-sign'), hint = $('.entry-hint'), inside = $('.entry-inside');
  scenes.push(() => {
    const p = prog(entry);
    img.style.transform = `scale(${lerp(1, 1.5, ease(seg(p, 0, .9)))})`;
    veil.style.opacity = 1 - .55 * inout(seg(p, .1, .7));
    const s = seg(p, 0, .4);
    sign.style.opacity = 1 - ease(s);
    sign.style.transform = `scale(${1 + s * .4})`;
    if (p > .02) hint.style.animation = 'none';
    hint.style.opacity = 1 - seg(p, 0, .1);
    inside.style.opacity = seg(p, .5, .7);
    inside.style.transform = `translateY(${(1 - ease(seg(p, .5, .78))) * 60}px)`;
  });
}

/* HOME — sale in orizzontale */
const rooms = $('.rooms');
if (rooms) {
  const track = $('.rooms-track'), imgs = $$('.room img');
  scenes.push(() => {
    const p = prog(rooms), max = track.scrollWidth - innerWidth;
    track.style.transform = `translateX(${-p * max}px)`;
    imgs.forEach((im, i) => { const r = im.parentElement.getBoundingClientRect(); const c = (r.left + r.width / 2) / innerWidth - .5; im.style.transform = `scale(1.15) translateX(${c * -8}%)`; });
  });
}

/* parallasse generica */
$$('[data-parallax]').forEach(el => {
  const k = parseFloat(el.dataset.parallax) || .15;
  scenes.push(() => { const t = through(el.parentElement) - .5; el.style.transform = `translateY(${t * k * -100}%)`; });
});

/* CAFFÈ — il film allo scroll */
const film = $('.film');
if (film) {
  const L = Object.fromEntries($$('.layer', film).map(l => [l.dataset.k, l]));
  const chapters = $$('.chapter', film), parts = $$('.part', film), cards = $$('.bean-cards article', film);
  const title = $('.film-title'), bar = $('.film-hud .bar2 span'), count = $('.film-hud .count');
  const vid = $('video', L.k2 || film);
  // [layer, p inizio entrata, p fine entrata, p inizio uscita, p fine uscita, scala da, scala a, origine]
  const show = (el, op, sc, ox = 50, oy = 50, tx = 0) => { if (!el) return; el.style.opacity = op; el.dataset.tx = tx; el.style.transform = `translateX(${tx}vw) scale(${sc})`; el.style.transformOrigin = `${ox}% ${oy}%`; };
  scenes.push(() => {
    const p = prog(film);
    bar.style.transform = `scaleX(${p})`;
    title.style.opacity = 1 - seg(p, .03, .08);
    title.style.transform = `translateY(${-seg(p, 0, .1) * 80}px)`;

    // spostamento laterale: la macchina lascia spazio al testo (solo schermi larghi)
    const wide = innerWidth > innerHeight * 1.05 ? 1 : 0;
    const tx = wide * (lerp(0, -13, inout(seg(p, .04, .1))) + 25 * inout(seg(p, .14, .29)) - 12 * inout(seg(p, .46, .56)));
    // 1 macchina intera → esploso (video a scatti di scroll se c'è, altrimenti dissolvenza)
    const a = inout(seg(p, .13, .30));
    const V = L.kv && $('video', L.kv), vok = V && V.readyState >= 2 && V.duration;
    if (vok) {
      show(L.k1, 1 - seg(p, .125, .135), lerp(1.04, 1, seg(p, 0, .13)), 50, 50, tx);
      show(L.kv, seg(p, .12, .13) * (1 - seg(p, .3, .31)), 1, 50, 50, tx);
      const t = seg(p, .13, .30) * (V.duration - .04); if (!V.seeking && Math.abs(V.currentTime - t) > .02) V.currentTime = t;
    } else show(L.k1, 1 - a, lerp(1.04, 1, seg(p, 0, .13)) + a * .02, 50, 50, tx);
    // 2 esploso → zoom dentro il gruppo
    const z1 = inout(seg(p, .46, .57));
    show(L.k2, (vok ? seg(p, .295, .305) : a) * (1 - seg(p, .535, .56)), lerp(1.02, 1, a) + z1 * 1.6, 53, 55, tx);
    // 3 sezione → zoom nel caffè pressato
    const z2 = inout(seg(p, .66, .75));
    show(L.k3, seg(p, .53, .56) * (1 - seg(p, .71, .75)), lerp(1.3, 1, ease(seg(p, .53, .62))) + z2 * 2, 51, 56, wide * -14 * inout(seg(p, .55, .6)) * (1 - inout(seg(p, .66, .72))));
    // 4 macinato → chicchi
    const z3 = inout(seg(p, .79, .85));
    show(L.k4, seg(p, .71, .75) * (1 - seg(p, .82, .85)), lerp(1.35, 1, ease(seg(p, .71, .8))) + z3 * .6);
    show(L.k5, seg(p, .82, .86), lerp(1.3, 1.02, ease(seg(p, .82, 1))));

    chapters.forEach(c => { const [i, o] = c.dataset.at.split(',').map(Number); const v = Math.min(seg(p, i, i + .012), 1 - seg(p, o - .012, o)); c.style.opacity = v; c.style.transform = `translateY(${(1 - v) * 24}px)`; });
    parts.forEach(t => {
      const [i, o] = t.dataset.at.split(',').map(Number); t.classList.toggle('on', p >= i && p < o);
      // posiziona il punto sull'immagine reale (cover o contain) seguendo lo zoom del livello
      const lay = L[t.dataset.k || 'k2'], img = $('img', lay); if (!img.naturalWidth) return;
      const W = innerWidth, H = innerHeight, iw = img.naturalWidth, ih = img.naturalHeight;
      const fit = getComputedStyle(img).objectFit;
      const s = fit === 'fill' ? img.offsetWidth / iw : fit === 'contain' ? Math.min(W / iw, H / ih) : Math.max(W / iw, H / ih);
      const cy = fit === 'fill' ? img.offsetTop : H / 2; let x = (W - iw * s) / 2 + t.dataset.x * iw * s, y = cy - ih * s / 2 + t.dataset.y * ih * s;
      const m = /scale\(([\d.]+)\)/.exec(lay.style.transform); const k = m ? +m[1] : 1; const sh = (+lay.dataset.tx || 0) * W / 100;
      const [ox, oy] = (lay.style.transformOrigin || '50% 50%').split(' ').map(v => parseFloat(v) / 100);
      x = ox * W + (x - ox * W) * k + sh; y = oy * H + (y - oy * H) * k;
      if (!t.dataset.side) t.dataset.side = t.classList.contains('left') ? 'l' : 'r';
      t.classList.toggle('left', t.dataset.side === 'l' || x > W - 150);
      t.style.left = x - 4.5 + 'px'; t.style.top = y - 4.5 + 'px';
    });
    const box = cards[0]?.parentElement; if (box) box.style.opacity = ease(seg(p, .86, .9));
    cards.forEach((c, i) => { const v = ease(seg(p, .88 + i * .02, .92 + i * .02)); c.style.opacity = v; c.style.transform = `translateY(${(1 - v) * 40}px)`; });
    if (count) count.textContent = String(1 + Math.min(4, Math.floor(p * 5))).padStart(2, '0') + ' / 05';
  });
}

/* STORIA — binario */
const rail = $('.tl-rail span');
if (rail) scenes.push(() => { rail.style.transform = `scaleY(${through($('.timeline')) * 1.25 - .1})`; });

/* GIORNALE — anteprima che segue il cursore */
const peek = $('.jpeek');
if (peek) {
  const im = $('img', peek);
  $$('.jrow').forEach(r => {
    r.addEventListener('mouseenter', () => { im.src = r.dataset.img; peek.classList.add('on'); });
    r.addEventListener('mouseleave', () => peek.classList.remove('on'));
  });
  addEventListener('mousemove', e => { peek.style.left = e.clientX + 'px'; peek.style.top = e.clientY + 'px'; });
}

/* avanzamento */
const pg = $('.progress');
scenes.push(() => { const h = document.documentElement.scrollHeight - innerHeight; if (pg) pg.style.transform = `scaleX(${scrollY / Math.max(1, h)})`; });

/* ciclo */
function tick(t) { lenis?.raf(t); scenes.forEach(f => f()); requestAnimationFrame(tick); }
requestAnimationFrame(tick);
