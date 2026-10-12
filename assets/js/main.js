(() => {
  const root = document.documentElement;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;

  // Theme toggle
  const toggle = document.querySelector('.theme-toggle');
  const current = () => root.dataset.theme || (matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
  toggle && toggle.addEventListener('click', () => {
    const next = current() === 'dark' ? 'light' : 'dark';
    const apply = () => { root.dataset.theme = next; try { localStorage.setItem('theme', next); } catch (e) {} };
    document.startViewTransition && !reduce ? document.startViewTransition(apply) : apply();
  });

  // Reveal on scroll
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
  }, { threshold: 0.01 });
  document.querySelectorAll('.reveal').forEach((el) => io.observe(el));

  // Count-up stats
  const counter = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      const el = e.target, to = +el.dataset.to || 0, t0 = performance.now(), dur = reduce ? 1 : 1600;
      const tick = (t) => {
        const p = Math.min(1, (t - t0) / dur), eased = 1 - Math.pow(1 - p, 4);
        el.textContent = Math.round(to * eased);
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick); counter.unobserve(el);
    });
  }, { threshold: 0.6 });
  document.querySelectorAll('.count').forEach((el) => counter.observe(el));

  // Scroll progress + hide nav on scroll down
  const bar = document.querySelector('.progress span');
  const nav = document.querySelector('.nav');
  let lastY = scrollY;
  const onScroll = () => {
    const max = document.documentElement.scrollHeight - innerHeight;
    if (bar) bar.style.transform = `scaleX(${max > 0 ? scrollY / max : 0})`;
    if (nav) nav.classList.toggle('hide', scrollY > lastY && scrollY > 200);
    lastY = scrollY;
  };
  addEventListener('scroll', onScroll, { passive: true }); onScroll();

  // Fine-pointer effects
  if (fine && !reduce) {
    const glow = document.querySelector('.cursor-glow');
    addEventListener('pointermove', (e) => { if (glow) glow.style.transform = `translate(${e.clientX - 260}px, ${e.clientY - 260}px)`; }, { passive: true });
    if (glow) glow.style.transform = 'translate(-999px,-999px)';

    document.querySelectorAll('.tilt').forEach((el) => {
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
        el.style.setProperty('--mx', `${x * 100}%`); el.style.setProperty('--my', `${y * 100}%`);
        el.style.transform = `perspective(900px) rotateX(${(0.5 - y) * 5}deg) rotateY(${(x - 0.5) * 6}deg) translateY(-4px)`;
      });
      el.addEventListener('pointerleave', () => { el.style.transform = ''; });
    });

    document.querySelectorAll('.magnetic').forEach((el) => {
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        el.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * 0.25}px, ${(e.clientY - r.top - r.height / 2) * 0.35}px)`;
      });
      el.addEventListener('pointerleave', () => { el.style.transform = ''; });
    });
  }

  // Copy buttons on code blocks
  document.querySelectorAll('.prose div.highlighter-rouge').forEach((block) => {
    const btn = document.createElement('button');
    btn.className = 'copy-btn'; btn.type = 'button'; btn.textContent = 'Copy';
    btn.addEventListener('click', async () => {
      try { await navigator.clipboard.writeText(block.querySelector('code').innerText); btn.textContent = 'Copied'; }
      catch (e) { btn.textContent = 'Press Ctrl+C'; }
      setTimeout(() => (btn.textContent = 'Copy'), 1600);
    });
    block.appendChild(btn);
  });
})();
