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

  // ===== Basket =====
  const KEY = 'shays-basket';
  const load = () => { try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch (e) { return []; } };
  let basket = load();
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(basket)); } catch (e) {} };
  const drawer = document.querySelector('.drawer'), scrim = document.querySelector('.drawer-scrim');
  const list = document.querySelector('.drawer-items'), empty = document.querySelector('.drawer-empty');
  const foot = document.querySelector('.drawer-foot'), countEl = document.querySelector('.basket-count');
  const totalEl = document.querySelector('.basket-total'), toast = document.querySelector('.toast');
  const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  const render = () => {
    const n = basket.reduce((a, i) => a + i.qty, 0);
    const total = basket.reduce((a, i) => a + i.qty * i.price, 0);
    countEl.textContent = n; countEl.dataset.n = n;
    totalEl.textContent = '$' + total.toFixed(total % 1 ? 2 : 0);
    empty.hidden = n > 0; foot.hidden = n === 0;
    list.innerHTML = basket.map((i) => `
      <li data-id="${esc(i.id)}">
        <img src="${esc(i.img)}" alt="">
        <div><h3>${esc(i.title)}</h3>
          <span class="mini-qty"><button type="button" data-d="-1" aria-label="Decrease">&minus;</button><span>${i.qty}</span><button type="button" data-d="1" aria-label="Increase">+</button></span></div>
        <span class="line-price">$${i.qty * i.price}</span>
      </li>`).join('');
  };
  const openDrawer = () => { scrim.hidden = false; requestAnimationFrame(() => { scrim.classList.add('open'); drawer.classList.add('open'); }); drawer.setAttribute('aria-hidden', 'false'); };
  const closeDrawer = () => { scrim.classList.remove('open'); drawer.classList.remove('open'); drawer.setAttribute('aria-hidden', 'true'); setTimeout(() => (scrim.hidden = true), 400); };
  let toastT;
  const say = (msg) => { toast.textContent = msg; toast.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => toast.classList.remove('show'), 2200); };

  document.querySelector('.basket-open').addEventListener('click', openDrawer);
  document.querySelector('.basket-close').addEventListener('click', closeDrawer);
  scrim.addEventListener('click', closeDrawer);
  addEventListener('keydown', (e) => { if (e.key === 'Escape') closeDrawer(); });
  list.addEventListener('click', (e) => {
    const b = e.target.closest('button[data-d]'); if (!b) return;
    const id = b.closest('li').dataset.id, item = basket.find((i) => i.id === id);
    item.qty += +b.dataset.d; if (item.qty <= 0) basket = basket.filter((i) => i !== item);
    save(); render();
  });
  addEventListener('basket:changed', () => { basket = load(); render(); });

  document.querySelectorAll('[data-add]').forEach((btn) => btn.addEventListener('click', () => {
    const q = btn.hasAttribute('data-with-qty') ? +(document.querySelector('[data-qty] output')?.textContent || 1) : 1;
    const { id, title, price, img } = btn.dataset;
    const found = basket.find((i) => i.id === id);
    found ? (found.qty += q) : basket.push({ id, title, price: +price, img, qty: q });
    save(); render();
    countEl.classList.remove('bump'); void countEl.offsetWidth; countEl.classList.add('bump');
    btn.classList.add('added'); setTimeout(() => btn.classList.remove('added'), 900);
    say(`Added ${title} to your basket`);
  }));
  render();

  // Quantity stepper
  document.querySelectorAll('[data-qty]').forEach((box) => {
    const out = box.querySelector('output');
    box.addEventListener('click', (e) => {
      const b = e.target.closest('button[data-step]'); if (!b) return;
      out.textContent = Math.max(1, Math.min(20, +out.textContent + +b.dataset.step));
    });
  });

  // Shop filters
  const chips = document.querySelectorAll('.chip[data-filter]');
  chips.forEach((chip) => chip.addEventListener('click', () => {
    chips.forEach((c) => c.setAttribute('aria-pressed', c === chip));
    const f = chip.dataset.filter;
    document.querySelectorAll('.shop-grid .pcard').forEach((card) => {
      const show = f === 'all' || card.dataset.category === f;
      card.hidden = !show; if (show) card.classList.add('in');
    });
  }));

  // Embers rising from the hearth
  const cv = document.querySelector('.embers');
  if (cv && !reduce) {
    const ctx = cv.getContext('2d'); let W, H, dpr = Math.min(2, devicePixelRatio || 1), parts = [];
    const size = () => { W = cv.offsetWidth; H = cv.offsetHeight; cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); };
    size(); addEventListener('resize', size);
    const spawn = () => ({ x: W * (0.45 + Math.random() * 0.4), y: H * (0.7 + Math.random() * 0.3), r: 0.6 + Math.random() * 2.2,
      vy: 0.35 + Math.random() * 1.1, vx: (Math.random() - 0.5) * 0.4, life: 0, max: 200 + Math.random() * 260, w: Math.random() * 6.28 });
    for (let i = 0; i < 70; i++) { const p = spawn(); p.life = Math.random() * p.max; p.y -= p.life * p.vy; parts.push(p); }
    let visible = true;
    new IntersectionObserver(([e]) => (visible = e.isIntersecting)).observe(cv);
    const loop = () => {
      if (visible) {
        ctx.clearRect(0, 0, W, H); ctx.globalCompositeOperation = 'lighter';
        parts.forEach((p, i) => {
          p.life++; p.w += 0.03; p.x += p.vx + Math.sin(p.w) * 0.35; p.y -= p.vy;
          const t = p.life / p.max, a = Math.max(0, Math.sin(Math.PI * t)) * 0.9;
          const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 4);
          g.addColorStop(0, `rgba(255,200,120,${a})`); g.addColorStop(0.35, `rgba(240,120,50,${a * 0.6})`); g.addColorStop(1, 'rgba(200,60,20,0)');
          ctx.fillStyle = g; ctx.beginPath(); ctx.arc(p.x, p.y, p.r * 4, 0, 6.28); ctx.fill();
          if (p.life > p.max || p.y < -20) parts[i] = spawn();
        });
      }
      requestAnimationFrame(loop);
    };
    loop();
  }
})();
