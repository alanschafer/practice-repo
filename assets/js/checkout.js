(() => {
  const data = JSON.parse(document.getElementById('pos-data').textContent);
  const byId = Object.fromEntries(data.products.map((p) => [p.id, p]));
  const KEY = 'shays-basket', SALES = 'shays-sales';
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const money = (n) => '$' + (Math.round(n * 100) / 100).toFixed(2);
  const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const get = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch (e) { return d; } };
  const set = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };

  let cart = get(KEY, []).filter((i) => byId[i.id]);
  let discount = null, pay = 'card', cashCents = 0, cat = 'all', query = '';
  const orderNo = () => {
    const d = new Date(), ymd = d.toISOString().slice(0, 10).replace(/-/g, '');
    const n = get(SALES, []).filter((s) => s.day === d.toDateString()).length + 1;
    return `SH-${ymd}-${String(n).padStart(3, '0')}`;
  };
  const sync = () => { set(KEY, cart); dispatchEvent(new Event('basket:changed')); };

  const totals = () => {
    const sub = cart.reduce((a, i) => a + i.qty * byId[i.id].price, 0);
    const taxableSub = cart.reduce((a, i) => a + (byId[i.id].taxable ? i.qty * byId[i.id].price : 0), 0);
    const pct = discount ? discount.percent / 100 : 0;
    const disc = sub * pct;
    const tax = Math.round(taxableSub * (1 - pct) * data.taxRate * 100) / 100;
    const total = Math.round((sub - disc + tax) * 100) / 100;
    return { sub, disc, tax, total, count: cart.reduce((a, i) => a + i.qty, 0) };
  };

  // Tiles
  const tiles = $('.pos-tiles');
  const drawTiles = () => {
    const q = query.trim().toLowerCase();
    tiles.innerHTML = data.products.filter((p) => (cat === 'all' || p.category === cat) && (!q || p.title.toLowerCase().includes(q))).map((p) => {
      const inCart = cart.find((i) => i.id === p.id);
      return `<button type="button" class="tile" data-id="${esc(p.id)}">
        <img src="${esc(p.img)}" alt="" loading="lazy">
        ${inCart ? `<span class="tile-qty">${inCart.qty}</span>` : ''}
        <span class="tile-body"><span class="meta">${esc(p.category)}</span><span class="tile-title">${esc(p.title)}</span><span class="tile-price">${money(p.price)}</span></span>
      </button>`;
    }).join('') || '<p class="ticket-empty">No items match that search.</p>';
  };
  tiles.addEventListener('click', (e) => {
    const t = e.target.closest('.tile'); if (!t) return;
    const p = byId[t.dataset.id], found = cart.find((i) => i.id === p.id);
    found ? found.qty++ : cart.push({ id: p.id, title: p.title, price: p.price, img: p.img, qty: 1 });
    t.classList.remove('pop'); void t.offsetWidth; t.classList.add('pop');
    sync(); render();
  });
  $$('.pos-cats .chip').forEach((c) => c.addEventListener('click', () => {
    $$('.pos-cats .chip').forEach((x) => x.setAttribute('aria-pressed', x === c)); cat = c.dataset.cat; drawTiles();
  }));
  $('.pos-search input').addEventListener('input', (e) => { query = e.target.value; drawTiles(); });

  // Ticket
  const lines = $('.ticket-lines');
  lines.addEventListener('click', (e) => {
    const b = e.target.closest('button[data-d]'); if (!b) return;
    const id = b.closest('li').dataset.id, item = cart.find((i) => i.id === id);
    if (b.dataset.d === 'x') item.qty = 0; else item.qty += +b.dataset.d;
    if (item.qty <= 0) cart = cart.filter((i) => i !== item);
    sync(); render();
  });
  $('.pos-clear').addEventListener('click', () => { cart = []; discount = null; cashCents = 0; $('.pos-code').value = ''; $('.pos-code-msg').textContent = ''; sync(); render(); });
  $('.pos-apply').addEventListener('click', () => {
    const code = $('.pos-code').value.trim().toUpperCase();
    const d = data.discounts.find((x) => x.code === code);
    discount = d || null;
    $('.pos-code-msg').textContent = d ? `${d.code} applied: ${d.label}.` : (code ? 'That code isn\u2019t valid. Try HEARTH10.' : '');
    render();
  });

  // Payment
  $$('.pay-tabs [data-pay]').forEach((b) => b.addEventListener('click', () => {
    pay = b.dataset.pay;
    $$('.pay-tabs [data-pay]').forEach((x) => x.setAttribute('aria-selected', x === b));
    $$('.pay-panel').forEach((p) => (p.hidden = p.dataset.panel !== pay));
    render();
  }));
  $('.keypad').addEventListener('click', (e) => {
    const k = e.target.closest('button')?.dataset.key; if (!k) return;
    if (k === 'back') cashCents = Math.floor(cashCents / 10);
    else cashCents = Math.min(9999999, cashCents * (k === '00' ? 100 : 10) + (k === '00' ? 0 : +k));
    render();
  });
  $('.quick-cash').addEventListener('click', (e) => {
    const v = e.target.closest('button')?.dataset.cash; if (v == null) return;
    cashCents = Math.round(+v * 100); render();
  });

  const render = () => {
    const t = totals();
    lines.innerHTML = cart.map((i) => {
      const p = byId[i.id];
      return `<li data-id="${esc(i.id)}">
        <div class="tl-main"><span class="tl-title">${esc(p.title)}</span><span class="tl-each">${money(p.price)} each${p.taxable ? ' &middot; taxable' : ''}</span></div>
        <span class="mini-qty"><button type="button" data-d="-1" aria-label="Decrease">&minus;</button><span>${i.qty}</span><button type="button" data-d="1" aria-label="Increase">+</button></span>
        <span class="tl-price">${money(i.qty * p.price)}</span>
        <button type="button" class="tl-x" data-d="x" aria-label="Remove ${esc(p.title)}">&times;</button>
      </li>`;
    }).join('');
    $('.ticket-empty').hidden = cart.length > 0;
    $('.t-sub').textContent = money(t.sub);
    $('.t-disc-row').hidden = !discount;
    if (discount) { $('.t-disc-label').textContent = `(${discount.code})`; $('.t-disc').textContent = '\u2212' + money(t.disc); }
    $('.t-tax').textContent = money(t.tax);
    $('.t-total').textContent = money(t.total);

    // cash
    const quick = [t.total, Math.ceil(t.total / 5) * 5, Math.ceil(t.total / 10) * 10, 20, 50, 100]
      .filter((v, i, a) => v > 0 && v >= t.total && a.indexOf(v) === i).slice(0, 4);
    $('.quick-cash').innerHTML = quick.map((v, i) => `<button type="button" data-cash="${v}">${i === 0 ? 'Exact' : money(v).replace('.00', '')}</button>`).join('');
    const cash = cashCents / 100;
    $('.cash-amt').textContent = money(cash);
    const change = cash - t.total;
    $('.change-amt').textContent = cash ? (change >= 0 ? money(change) : `${money(-change)} short`) : '$0.00';
    $('.change').classList.toggle('short', cash > 0 && change < 0);

    const charge = $('.pos-charge');
    const ok = t.count > 0 && (pay !== 'cash' || cash >= t.total);
    charge.disabled = !ok;
    charge.textContent = pay === 'cash' ? (t.count && cash < t.total ? 'Enter cash tendered' : `Complete cash sale \u00b7 ${money(t.total)}`) : `Charge ${money(t.total)}`;
    $('.pos-order').textContent = orderNo();
    const today = get(SALES, []).filter((s) => s.day === new Date().toDateString());
    $('.pos-today').textContent = `${today.length} sale${today.length === 1 ? '' : 's'} \u00b7 ${money(today.reduce((a, s) => a + s.total, 0)).replace('.00', '')}`;
    drawTiles();
  };

  // Clock
  const tick = () => ($('.pos-clock').textContent = new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }));
  tick(); setInterval(tick, 15000);

  // Charge
  const reader = $('.reader'), readerMsg = $('.reader-msg');
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  $('.pos-charge').addEventListener('click', async () => {
    const t = totals(), btn = $('.pos-charge');
    btn.disabled = true;
    let method = pay === 'cash' ? 'Cash' : pay === 'card' ? 'Card' : $('input[name="other"]:checked').value;
    if (pay === 'card') {
      reader.dataset.state = 'wait'; readerMsg.textContent = 'Waiting for card\u2026'; await sleep(1100);
      reader.dataset.state = 'proc'; readerMsg.textContent = 'Processing\u2026'; await sleep(1200);
      reader.dataset.state = 'ok'; readerMsg.textContent = 'Approved'; await sleep(600);
      method = 'Card \u2022\u2022\u2022\u2022 4242 (sample)';
    }
    const sale = {
      no: orderNo(), at: new Date().toLocaleString(), day: new Date().toDateString(), method,
      name: $('.pos-name').value.trim(), items: cart.map((i) => ({ title: byId[i.id].title, qty: i.qty, price: byId[i.id].price })),
      ...t, discount, cash: pay === 'cash' ? cashCents / 100 : null,
    };
    const sales = get(SALES, []); sales.push(sale); set(SALES, sales);
    showReceipt(sale);
  });

  const scrim = $('.receipt-scrim');
  const showReceipt = (s) => {
    $('.rc-meta').innerHTML = `<span>${esc(s.no)}</span><span>${esc(s.at)}</span>${s.name ? `<span>Customer: ${esc(s.name)}</span>` : ''}`;
    $('.rc-lines').innerHTML = s.items.map((i) => `<li><span>${i.qty} &times; ${esc(i.title)}</span><span>${money(i.qty * i.price)}</span></li>`).join('');
    $('.rc-totals').innerHTML = [
      ['Subtotal', money(s.sub)],
      s.discount ? [`Discount (${esc(s.discount.code)})`, '\u2212' + money(s.disc)] : null,
      [data.taxLabel, money(s.tax)], ['Total', money(s.total)], ['Paid by', esc(s.method)],
      s.cash != null ? ['Cash tendered', money(s.cash)] : null, s.cash != null ? ['Change', money(s.cash - s.total)] : null,
    ].filter(Boolean).map(([a, b], i) => `<div class="${a === 'Total' ? 'grand' : ''}"><dt>${a}</dt><dd>${b}</dd></div>`).join('');
    scrim.hidden = false; requestAnimationFrame(() => scrim.classList.add('open'));
    $('.rc-new').focus();
  };
  $('.rc-print').addEventListener('click', () => print());
  $('.rc-new').addEventListener('click', () => {
    scrim.classList.remove('open'); setTimeout(() => (scrim.hidden = true), 300);
    cart = []; discount = null; cashCents = 0; $('.pos-name').value = ''; $('.pos-code').value = ''; $('.pos-code-msg').textContent = '';
    reader.dataset.state = 'idle'; readerMsg.textContent = 'Ready for tap, insert, or swipe';
    sync(); render(); scrollTo({ top: 0, behavior: 'smooth' });
  });

  render();
})();
