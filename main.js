(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(pointer: fine)').matches;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;

  /* nav */
  const nav = $('[data-nav]');
  const onScroll = () => nav.classList.toggle('is-stuck', scrollY > 24);
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* cursor spotlight + card glow */
  if (fine && !reduce) {
    let tx = innerWidth / 2, ty = innerHeight / 3, cx = tx, cy = ty;
    addEventListener('pointermove', (e) => { tx = e.clientX; ty = e.clientY; }, { passive: true });
    const tick = () => {
      cx = lerp(cx, tx, .08); cy = lerp(cy, ty, .08);
      document.documentElement.style.setProperty('--mx', cx + 'px');
      document.documentElement.style.setProperty('--my', cy + 'px');
      requestAnimationFrame(tick);
    };
    tick();
    $$('.tile, .step').forEach((el) => {
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        el.style.setProperty('--x', ((e.clientX - r.left) / r.width * 100) + '%');
        el.style.setProperty('--y', ((e.clientY - r.top) / r.height * 100) + '%');
      });
    });
  }

  /* reveal on scroll */
  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
  }, { threshold: .18, rootMargin: '0px 0px -8% 0px' });
  $$('.reveal').forEach((el) => io.observe(el));

  /* counters */
  const countUp = (el) => {
    const target = +el.dataset.count, suffix = el.dataset.suffix || '';
    const start = performance.now(), dur = reduce ? 0 : 1400;
    const step = (now) => {
      const t = dur ? clamp((now - start) / dur, 0, 1) : 1;
      const eased = 1 - Math.pow(1 - t, 3);
      el.textContent = Math.round(target * eased) + suffix;
      if (t < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };
  const cio = new IntersectionObserver((entries) => {
    entries.forEach((en) => { if (en.isIntersecting) { countUp(en.target); cio.unobserve(en.target); } });
  }, { threshold: .5 });
  $$('[data-count]').forEach((el) => cio.observe(el));

  /* magnetic buttons */
  if (fine && !reduce) {
    $$('[data-magnet]').forEach((el) => {
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        const dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
        el.style.transform = `translate(${dx * .18}px, ${dy * .28}px)`;
      });
      el.addEventListener('pointerleave', () => { el.style.transform = ''; });
    });
  }

  /* marquee: duplicate once for a seamless loop + 3D tilt */
  const track = $('.marquee-track');
  if (track) {
    track.innerHTML += track.innerHTML;
    if (fine && !reduce) {
      $$('.card', track).forEach((card) => {
        card.addEventListener('pointermove', (e) => {
          const r = card.getBoundingClientRect();
          const px = (e.clientX - r.left) / r.width - .5, py = (e.clientY - r.top) / r.height - .5;
          card.style.setProperty('--ry', (px * 18) + 'deg');
          card.style.setProperty('--rx', (-py * 18) + 'deg');
        });
        card.addEventListener('pointerleave', () => { card.style.setProperty('--rx', '0deg'); card.style.setProperty('--ry', '0deg'); });
      });
    }
  }

  /* hero phone: tilt toward the cursor */
  const phone = $('[data-demo]');
  if (phone && fine && !reduce) {
    const hero = $('.hero');
    hero.addEventListener('pointermove', (e) => {
      const r = hero.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - .5, py = (e.clientY - r.top) / r.height - .5;
      phone.style.setProperty('--ry', (px * 14) + 'deg');
      phone.style.setProperty('--rx', (-py * 10) + 'deg');
    });
    hero.addEventListener('pointerleave', () => { phone.style.setProperty('--rx', '0deg'); phone.style.setProperty('--ry', '0deg'); });
  }

  /* hero demo loop: pose appears, score climbs, ring goes green, shutter fires, next pose */
  const POSES = [
    { id: 'p01', name: 'Wind dancer', tip: 'Raise both arms overhead and hold one wrist.', peak: 92 },
    { id: 'p04', name: 'Ledge lean', tip: 'Lean your weight onto one arm.', peak: 88 },
    { id: 'p08', name: 'Hair frame', tip: 'Lift one arm over your head.', peak: 95 },
    { id: 'p05', name: 'Stair glance', tip: 'Look back over your shoulder at the lens.', peak: 90 },
  ];
  const CIRC = 276.46;
  const tier = (s) => s >= 80 ? 'is-green' : s >= 50 ? 'is-yellow' : s >= 20 ? 'is-red' : '';
  if (phone) {
    const feed = $('[data-feed]', phone), feedNext = $('[data-feed-next]', phone), lines = $('[data-lines]', phone);
    const name = $('[data-pose-name]', phone), tip = $('[data-tip]', phone);
    const ring = $('[data-ring]', phone), fill = $('[data-ring-fill]', phone), score = $('[data-score]', phone);
    const thumb = $('[data-thumb]', phone), toast = $('[data-toast]', phone), flash = $('[data-flash]', phone);
    const floatScore = $('[data-float-score]');
    const wait = (ms) => new Promise((r) => setTimeout(r, reduce ? Math.min(ms, 50) : ms));

    const setScore = (s) => {
      const v = Math.round(s);
      score.textContent = v;
      if (floatScore) floatScore.textContent = v + '%';
      fill.style.strokeDashoffset = CIRC * (1 - v / 100);
      const t = tier(v);
      if (!ring.classList.contains(t)) {
        [ring, floatScore && floatScore.parentElement].forEach((el) => { if (!el) return; el.classList.remove('is-green', 'is-yellow', 'is-red'); if (t) el.classList.add(t); });
      }
    };
    const animateScore = (from, to, ms) => new Promise((done) => {
      const start = performance.now();
      const step = (now) => {
        const t = clamp((now - start) / ms, 0, 1);
        const e = 1 - Math.pow(1 - t, 2.2);
        const wobble = Math.sin(t * 14) * (1 - t) * 4;
        setScore(from + (to - from) * e + wobble);
        if (t < 1) requestAnimationFrame(step); else { setScore(to); done(); }
      };
      requestAnimationFrame(step);
    });

    const show = (pose, first) => {
      name.textContent = pose.name;
      tip.textContent = pose.tip;
      tip.classList.remove('hide');
      lines.src = `assets/lines/${pose.id}.png`;
      lines.classList.remove('draw'); void lines.offsetWidth; lines.classList.add('draw');
      if (!first) { feed.src = `assets/poses/${pose.id}.jpg`; phone.classList.remove('is-switching'); }
    };

    let i = 0;
    const run = async () => {
      show(POSES[0], true);
      for (;;) {
        const pose = POSES[i];
        setScore(0);
        await wait(900);
        await animateScore(0, 38, 1100);
        await wait(300);
        await animateScore(38, 64, 900);
        await wait(250);
        await animateScore(64, pose.peak, 1000);
        tip.classList.add('hide');
        await wait(650);
        flash.classList.remove('on'); void flash.offsetWidth; flash.classList.add('on');
        thumb.style.backgroundImage = `url(assets/poses/${pose.id}.jpg)`;
        thumb.classList.remove('pop'); void thumb.offsetWidth; thumb.classList.add('pop');
        toast.classList.add('show');
        await wait(1500);
        toast.classList.remove('show');
        i = (i + 1) % POSES.length;
        const next = POSES[i];
        feedNext.src = `assets/poses/${next.id}.jpg`;
        phone.classList.add('is-switching');
        await wait(750);
        show(next, false);
        await wait(200);
      }
    };
    run();
  }

  /* match section: ring driven by scroll */
  const match = $('[data-match]');
  if (match) {
    const ring = $('[data-match-ring]'), fill = $('[data-match-fill]'), num = $('[data-match-num]'), state = $('[data-match-state]');
    const ticks = $$('.ticks li');
    const C = 552.9;
    const stacked = () => matchMedia('(max-width: 860px)').matches;
    let shown = -1;
    const render = (p) => {
      const v = Math.round(p * 100);
      if (v === shown) return;
      shown = v;
      num.textContent = v;
      fill.style.strokeDashoffset = C * (1 - p);
      match.classList.remove('is-green', 'is-yellow', 'is-red');
      const t = tier(v); if (t) match.classList.add(t);
      state.textContent = v >= 80 ? 'Hold it. Shoot.' : v >= 50 ? 'Almost, fix the arms' : v >= 20 ? 'Keep going' : 'Find the pose';
      ticks.forEach((li) => li.classList.toggle('on', v >= +li.dataset.at));
    };
    if (stacked() || reduce) {
      const mio = new IntersectionObserver((en) => {
        if (!en[0].isIntersecting) return;
        mio.disconnect();
        const start = performance.now(), dur = reduce ? 0 : 2200;
        const step = (now) => {
          const t = dur ? clamp((now - start) / dur, 0, 1) : 1;
          render(.92 * (1 - Math.pow(1 - t, 3)));
          if (t < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
      }, { threshold: .4 });
      mio.observe(ring);
    } else {
      const update = () => {
        const r = match.getBoundingClientRect();
        const total = r.height - innerHeight;
        const p = clamp(-r.top / total, 0, 1);
        render(clamp(p * 1.1, 0, 1) * .96);
      };
      addEventListener('scroll', update, { passive: true });
      addEventListener('resize', update);
      update();
    }
  }

  /* notify form: open the mail client with the address in the body */
  const form = $('[data-notify]');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = $('#email', form).value.trim();
      const subject = encodeURIComponent('Notify me when POZE launches');
      const body = encodeURIComponent(`Please notify ${email} when POZE is live on the App Store.`);
      location.href = `mailto:feedback@getpoze.com?subject=${subject}&body=${body}`;
    });
  }
})();
