(() => {
  'use strict';

  const STORAGE_KEY = 'grosik-v1';

  const CATEGORIES = [
    { id: 'home', name: 'Mieszkanie', color: '#15803d' },
    { id: 'bills', name: 'Rachunki', color: '#22c55e' },
    { id: 'food', name: 'Jedzenie', color: '#facc15' },
    { id: 'transport', name: 'Transport', color: '#86efac' },
    { id: 'subs', name: 'Subskrypcje', color: '#eab308' },
    { id: 'loans', name: 'Kredyty i raty', color: '#0f766e' },
    { id: 'health', name: 'Zdrowie', color: '#a3e635' },
    { id: 'other', name: 'Inne', color: '#fde68a' },
  ];
  const catById = (id) => CATEGORIES.find((c) => c.id === id) || CATEGORIES[CATEGORIES.length - 1];

  const $ = (id) => document.getElementById(id);
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Stan ---------- */
  const emptyState = () => ({ income: 0, payday: 10, savings: 0, costs: [], shop: [], store: '' });
  let state = emptyState();

  function load() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (saved && typeof saved === 'object') {
        state.income = Math.max(0, Number(saved.income) || 0);
        state.savings = Math.max(0, Number(saved.savings) || 0);
        state.payday = Math.min(31, Math.max(1, Math.round(Number(saved.payday)) || 10));
        state.costs = (Array.isArray(saved.costs) ? saved.costs : [])
          .filter((c) => c && Number(c.amount) > 0)
          .map((c) => ({
            id: String(c.id || uid()),
            name: String(c.name || 'Koszt').slice(0, 40),
            amount: Number(c.amount),
            category: catById(c.category).id,
          }));
        state.shop = (Array.isArray(saved.shop) ? saved.shop : [])
          .filter((i) => i && i.name)
          .map((i) => ({
            id: String(i.id || uid()),
            name: String(i.name).slice(0, 40),
            qty: Math.max(0.01, Number(i.qty) || 1),
            price: Math.max(0, Number(i.price) || 0),
            est: Boolean(i.est),
            done: Boolean(i.done),
          }));
        state.store = STORES.includes(saved.store) ? saved.store : '';
      }
    } catch (_) { /* brak lub uszkodzone dane – zaczynamy od zera */ }
  }

  function save() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (_) { /* tryb prywatny */ }
  }

  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

  /* ---------- Pomocnicze ---------- */
  const money = new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN' });
  const money0 = new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN', maximumFractionDigits: 0 });
  const zl = (n) => money0.format(Math.round(n));

  function parseAmount(text) {
    const n = parseFloat(String(text).replace(/\s/g, '').replace(',', '.'));
    return Number.isFinite(n) && n > 0 ? Math.round(n * 100) / 100 : 0;
  }

  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  /** Akapit z fragmentami: zwykły tekst lub ['pogrubienie']. */
  function para(...parts) {
    const p = el('p');
    parts.forEach((part) => {
      if (Array.isArray(part)) p.appendChild(el('strong', '', part[0]));
      else p.appendChild(document.createTextNode(part));
    });
    return p;
  }

  function list(items) {
    const ul = el('ul');
    items.forEach((item) => {
      const li = el('li');
      (Array.isArray(item) ? item : [item]).forEach((part) => {
        if (Array.isArray(part)) li.appendChild(el('strong', '', part[0]));
        else li.appendChild(document.createTextNode(part));
      });
      ul.appendChild(li);
    });
    return ul;
  }

  const animated = new WeakMap();
  function countTo(node, target, format) {
    const from = animated.has(node) ? animated.get(node).value : 0;
    const prev = animated.get(node);
    if (prev && prev.raf) cancelAnimationFrame(prev.raf);
    const entry = { value: from, raf: 0 };
    animated.set(node, entry);
    if (reducedMotion || from === target) {
      entry.value = target;
      node.textContent = format(target);
      return;
    }
    const start = performance.now();
    const duration = 800;
    const step = (now) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 4);
      entry.value = from + (target - from) * eased;
      node.textContent = format(entry.value);
      if (t < 1) entry.raf = requestAnimationFrame(step);
      else { entry.value = target; node.textContent = format(target); }
    };
    entry.raf = requestAnimationFrame(step);
  }

  function daysToPayday() {
    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth();
    const today = now.getDate();
    const clamp = (year, month) => Math.min(state.payday, new Date(year, month + 1, 0).getDate());
    const thisMonth = clamp(y, m);
    if (thisMonth > today) return thisMonth - today;
    if (thisMonth === today) return 0;
    const next = new Date(y, m + 1, clamp(y, m + 1));
    return Math.round((next - new Date(y, m, today)) / 86400000);
  }

  function plural(n, one, few, many) {
    if (n === 1) return one;
    const d = n % 10;
    const h = n % 100;
    return d >= 2 && d <= 4 && (h < 12 || h > 14) ? few : many;
  }

  /* ---------- Obliczenia ---------- */
  function compute() {
    const costs = state.costs.reduce((sum, c) => sum + c.amount, 0);
    const left = state.income - costs;
    const byCat = CATEGORIES
      .map((cat) => ({
        ...cat,
        total: state.costs.filter((c) => c.category === cat.id).reduce((s, c) => s + c.amount, 0),
      }))
      .filter((c) => c.total > 0)
      .sort((a, b) => b.total - a.total);
    const share = state.income > 0 ? costs / state.income : 0;
    const days = daysToPayday();
    const cushionMonths = costs > 0 ? state.savings / costs : (state.savings > 0 ? Infinity : 0);
    return { income: state.income, costs, left, byCat, share, days, cushionMonths, savings: state.savings };
  }

  function buildPlan(d) {
    const hasFood = d.byCat.some((c) => c.id === 'food');
    const daily = hasFood ? 'Codzienne wydatki' : 'Jedzenie i codzienne wydatki';
    let rows;
    let stage;
    if (d.cushionMonths < 3) {
      stage = 'cushion';
      rows = [
        [daily, 0.5, '#22c55e'],
        ['Poduszka bezpieczeństwa', 0.3, '#15803d'],
        ['Przyjemności', 0.15, '#facc15'],
        ['Pierwsze inwestycje', 0.05, '#eab308'],
      ];
    } else if (d.cushionMonths < 6) {
      stage = 'growing';
      rows = [
        [daily, 0.5, '#22c55e'],
        ['Inwestycje', 0.2, '#eab308'],
        ['Poduszka bezpieczeństwa', 0.15, '#15803d'],
        ['Przyjemności', 0.15, '#facc15'],
      ];
    } else {
      stage = 'invest';
      rows = [
        [daily, 0.45, '#22c55e'],
        ['Inwestycje', 0.3, '#eab308'],
        ['Przyjemności i cele', 0.2, '#facc15'],
        ['Dopłata do oszczędności', 0.05, '#15803d'],
      ];
    }
    return { stage, rows: rows.map(([label, part, color]) => ({ label, part, color, amount: d.left * part })) };
  }

  /* ---------- Render: podsumowanie ---------- */
  function renderSummary(d) {
    countTo($('leftAmount'), d.left, (v) => money.format(v));
    countTo($('statIncome'), d.income, zl);
    countTo($('statCosts'), d.costs, zl);
    $('statDays').textContent = d.days === 0 ? 'dziś!' : `${d.days} ${plural(d.days, 'dzień', 'dni', 'dni')}`;
    document.querySelector('.hero').classList.toggle('negative', d.left < 0);
    $('meterFill').style.width = `${Math.min(100, d.share * 100)}%`;
    $('meterNote').textContent = d.income <= 0
      ? 'Dodaj wypłatę, aby zacząć'
      : `Stałe koszty to ${Math.round(d.share * 100)}% Twojej wypłaty`;
  }

  /* ---------- Render: lista kosztów ---------- */
  function costItem(cost) {
    const cat = catById(cost.category);
    const li = el('li', 'cost');
    li.dataset.id = cost.id;
    const dot = el('span', 'cost-dot');
    dot.style.background = cat.color;
    const info = el('div', 'cost-info');
    info.append(el('div', 'cost-name', cost.name), el('div', 'cost-cat', cat.name));
    const del = el('button', 'del', '×');
    del.type = 'button';
    del.setAttribute('aria-label', `Usuń koszt: ${cost.name}`);
    li.append(dot, info, el('span', 'cost-amount', money.format(cost.amount)), del);
    return li;
  }

  function renderCosts() {
    const listNode = $('costList');
    listNode.replaceChildren(...state.costs.map(costItem));
    $('costEmpty').hidden = state.costs.length > 0;
  }

  /* ---------- Render: wykres ---------- */
  const SVG_NS = 'http://www.w3.org/2000/svg';
  const R = 50;
  const CIRC = 2 * Math.PI * R;

  function renderChart(d) {
    const svg = $('donut');
    const circles = new Map([...svg.querySelectorAll('circle[data-cat]')].map((c) => [c.dataset.cat, c]));
    if (!svg.querySelector('.track')) {
      const track = document.createElementNS(SVG_NS, 'circle');
      track.setAttribute('class', 'track');
      track.setAttribute('cx', 60); track.setAttribute('cy', 60); track.setAttribute('r', R);
      track.setAttribute('stroke', '#dcfce7');
      svg.appendChild(track);
    }
    let offset = 0;
    const seen = new Set();
    d.byCat.forEach((cat) => {
      const len = (cat.total / d.costs) * CIRC;
      let circle = circles.get(cat.id);
      if (!circle) {
        circle = document.createElementNS(SVG_NS, 'circle');
        circle.dataset.cat = cat.id;
        circle.setAttribute('cx', 60); circle.setAttribute('cy', 60); circle.setAttribute('r', R);
        circle.setAttribute('stroke', cat.color);
        circle.style.strokeDasharray = `0 ${CIRC}`;
        circle.style.strokeDashoffset = `${-offset}`;
        svg.appendChild(circle);
        circle.getBoundingClientRect(); // wymusza start animacji od zera
      }
      circle.style.strokeDasharray = `${Math.max(0, len - (d.byCat.length > 1 ? 1.5 : 0))} ${CIRC}`;
      circle.style.strokeDashoffset = `${-offset}`;
      offset += len;
      seen.add(cat.id);
    });
    circles.forEach((circle, id) => { if (!seen.has(id)) circle.remove(); });

    countTo($('donutTotal'), d.costs, zl);

    const legend = $('legend');
    if (!d.byCat.length) {
      legend.replaceChildren(el('li', '', 'Dodaj koszty, aby zobaczyć podział.'));
      return;
    }
    legend.replaceChildren(...d.byCat.map((cat) => {
      const li = el('li');
      const dot = el('i');
      dot.style.background = cat.color;
      li.append(dot, el('span', '', cat.name), el('b', '', zl(cat.total)), el('small', '', `${Math.round((cat.total / d.costs) * 100)}%`));
      return li;
    }));
  }

  /* ---------- Agent ---------- */
  function bubble(nodes, variant) {
    const b = el('div', `bubble${variant ? ' ' + variant : ''}`);
    b.append(...nodes);
    return b;
  }

  function planNode(plan) {
    const wrap = el('div', 'plan');
    plan.rows.forEach((row) => {
      const r = el('div', 'plan-row');
      const top = el('div', 'plan-top');
      top.append(el('span', '', `${row.label} · ${Math.round(row.part * 100)}%`), el('b', '', zl(row.amount)));
      const bar = el('div', 'plan-bar');
      const fill = el('i');
      fill.style.background = row.color;
      bar.appendChild(fill);
      r.append(top, bar);
      wrap.appendChild(r);
      requestAnimationFrame(() => requestAnimationFrame(() => { fill.style.width = `${row.part * 100 / plan.rows[0].part}%`; }));
    });
    return wrap;
  }

  function msgLeft(d) {
    if (d.income <= 0) {
      return [bubble([para('Cześć! Jestem Grosik 👋 Wpisz swoją ', ['wypłatę'], ' i dodaj stałe koszty, a policzę, ile naprawdę zostaje Ci na życie i co warto z tym zrobić.')])];
    }
    if (d.left < 0) {
      return [bubble([
        para('Uwaga: stałe koszty przekraczają wypłatę o ', [zl(-d.left)], '.'),
        para('Zanim pomyślisz o oszczędzaniu, trzeba zbić koszty albo zwiększyć dochód. Zapytaj mnie „Jak ograniczyć koszty?”.'),
      ], 'warn')];
    }
    const out = [];
    const nodes = [para('Po opłaceniu stałych kosztów zostaje Ci ', [zl(d.left)], ` – to ${Math.round((1 - d.share) * 100)}% wypłaty.`)];
    if (d.days > 0) {
      nodes.push(para(`Do wypłaty ${plural(d.days, 'został', 'zostały', 'zostało')} ${d.days} ${plural(d.days, 'dzień', 'dni', 'dni')}. Gdyby cała ta kwota miała wystarczyć do tego czasu, to około `, [zl(d.left / d.days)], ' dziennie.'));
    } else {
      nodes.push(para('Dziś dzień wypłaty – najlepszy moment, żeby od razu rozdzielić pieniądze według planu.'));
    }
    out.push(bubble(nodes));
    if (d.share > 0.6) {
      out.push(bubble([para('Stałe koszty zjadają ', [`${Math.round(d.share * 100)}%`], ' dochodu. Bezpieczny poziom to okolice 50–60%, więc warto poszukać cięć.')], 'warn'));
    }
    return out;
  }

  function msgPlan(d) {
    if (d.income <= 0 || d.left <= 0) return msgLeft(d);
    const plan = buildPlan(d);
    const intro = {
      cushion: para('W tym miesiącu priorytetem jest ', ['poduszka bezpieczeństwa'], '. Proponuję taki podział:'),
      growing: para('Masz już podstawowy zapas. Czas łączyć ', ['oszczędzanie z inwestowaniem'], ':'),
      invest: para('Poduszka gotowa – nadwyżkę możesz śmielej ', ['inwestować'], ':'),
    }[plan.stage];
    const nodes = [intro, planNode(plan)];
    if (d.costs > 0 && Number.isFinite(d.cushionMonths)) {
      const target = d.costs * 3;
      if (d.savings < target) {
        const perMonth = plan.rows.find((r) => r.label.startsWith('Poduszka')).amount;
        const months = perMonth > 0 ? Math.ceil((target - d.savings) / perMonth) : 0;
        nodes.push(para('Cel: 3 miesiące kosztów, czyli ', [zl(target)], months > 0 ? `. W tym tempie osiągniesz go za ok. ${months} ${plural(months, 'miesiąc', 'miesiące', 'miesięcy')}.` : '.'));
      }
    }
    return [bubble(nodes)];
  }

  function msgInvest(d) {
    if (d.income <= 0) return msgLeft(d);
    if (d.left <= 0) {
      return [bubble([para('Na inwestowanie przyjdzie czas, gdy budżet wyjdzie na plus. Najlepsza „inwestycja” teraz to ', ['obniżenie stałych kosztów'], ' i spłata najdroższych długów.')], 'warn')];
    }
    const plan = buildPlan(d);
    const investRow = plan.rows.find((r) => r.label.toLowerCase().includes('inwestycje'));
    const amount = investRow ? investRow.amount : 0;
    const hasLoans = d.byCat.some((c) => c.id === 'loans');
    const out = [];
    if (plan.stage === 'cushion') {
      out.push(bubble([
        para('Twoje oszczędności pokrywają mniej niż 3 miesiące kosztów, więc najpierw ', ['bezpieczeństwo'], ', potem zysk:'),
        list([
          [['Konto oszczędnościowe lub lokata'], ' – na poduszkę, z szybkim dostępem do pieniędzy.'],
          [['Obligacje skarbowe'], ' (np. krótkoterminowe) – bezpieczne miejsce na nadwyżkę.'],
          [`Na naukę inwestowania przeznacz symbolicznie ok. `, [zl(amount)], ' miesięcznie.'],
        ]),
      ]));
    } else {
      out.push(bubble([
        para('W tym miesiącu możesz zainwestować około ', [zl(amount)], '. Rozważ:'),
        list([
          [['ETF na szeroki rynek akcji'], ' – tania, zdywersyfikowana baza na długi termin (5+ lat).'],
          [['Obligacje indeksowane inflacją'], ' – chronią realną wartość oszczędności.'],
          [['IKE / IKZE'], ' – te same inwestycje, ale z ulgami podatkowymi.'],
          plan.stage === 'invest'
            ? [['Regularność'], ' – stałe zlecenie w dniu wypłaty działa lepiej niż łapanie okazji.']
            : ['Równolegle dobijaj poduszkę do ', ['6 miesięcy'], ' kosztów.'],
        ]),
      ]));
    }
    if (hasLoans) {
      out.push(bubble([para('Masz raty lub kredyty. Jeśli ich oprocentowanie jest wysokie (np. karta, chwilówka), ', ['nadpłata długu'], ' da pewniejszy „zysk” niż większość inwestycji.')], 'warn'));
    }
    return out;
  }

  function msgCut(d) {
    if (!d.byCat.length) {
      return [bubble([para('Dodaj najpierw swoje stałe koszty – wtedy wskażę, gdzie najłatwiej coś urwać.')])];
    }
    const tips = [];
    const top = d.byCat[0];
    const biggest = [...state.costs].sort((a, b) => b.amount - a.amount)[0];
    tips.push(['Największa kategoria to ', [top.name], ` (${zl(top.total)}, ${Math.round((top.total / d.costs) * 100)}% kosztów). Tu każda obniżka daje najwięcej.`]);
    if (biggest) tips.push(['Najwyższa pojedyncza pozycja: ', [biggest.name], ` – ${zl(biggest.amount)}. Sprawdź, czy da się ją renegocjować.`]);
    const subs = d.byCat.find((c) => c.id === 'subs');
    if (subs) tips.push(['Subskrypcje kosztują Cię ', [zl(subs.total * 12)], ' rocznie. Zrezygnuj z tych, których nie używasz co tydzień.']);
    const bills = d.byCat.find((c) => c.id === 'bills');
    if (bills) tips.push(['Rachunki: porównaj oferty internetu, telefonu i prądu – zmiana dostawcy to często 10–20% mniej.']);
    const loans = d.byCat.find((c) => c.id === 'loans');
    if (loans) tips.push(['Raty: zapytaj bank o konsolidację lub niższą marżę, a nadwyżki kieruj na najdroższy dług.']);
    if (d.income > 0) tips.push(['Obniżenie kosztów o 10% to dodatkowe ', [zl(d.costs * 0.1)], ' co miesiąc.']);
    return [bubble([para('Oto gdzie szukałbym oszczędności:'), list(tips)])];
  }

  const ANSWERS = { left: msgLeft, plan: msgPlan, invest: msgInvest, cut: msgCut };
  let chatToken = 0;

  function scrollChat(node) {
    node.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'nearest' });
  }

  /**
   * Wykonuje zmianę układu tak, żeby to, na co patrzy użytkownik, nie przesunęło się na ekranie.
   * Agent jest nad formularzami, więc zmiana wysokości czatu przesuwałaby całą stronę.
   */
  function keepViewport(change) {
    const chat = $('chat');
    let anchor = document.activeElement;
    if (!anchor || anchor === document.body || !anchor.getClientRects().length) {
      anchor = document.elementFromPoint(window.innerWidth / 2, window.innerHeight / 2);
    }
    const before = anchor ? anchor.getBoundingClientRect().top : 0;
    change();
    if (!anchor || !anchor.isConnected || chat.contains(anchor)) return;
    const delta = anchor.getBoundingClientRect().top - before;
    if (Math.abs(delta) > 0.5) window.scrollBy({ top: delta, behavior: 'instant' });
  }

  /** Odpowiedź na pytanie: wskaźnik pisania, a potem kolejne dymki pod rozmową. */
  function say(bubbles) {
    const chat = $('chat');
    const token = ++chatToken;
    chat.classList.remove('updating');
    chat.querySelectorAll('.typing').forEach((t) => t.parentElement.remove());
    const dots = el('div', 'typing');
    dots.append(el('span'), el('span'), el('span'));
    const typing = bubble([dots]);
    typing.style.padding = '0';
    chat.appendChild(typing);
    scrollChat(typing);
    setTimeout(() => {
      if (token !== chatToken) return;
      typing.remove();
      bubbles.forEach((b, i) => {
        b.style.animationDelay = `${i * 0.18}s`;
        chat.appendChild(b);
      });
      if (bubbles.length) scrollChat(bubbles[bubbles.length - 1]);
    }, reducedMotion ? 0 : 650);
  }

  /** Automatyczny raport: podmienia treść czatu w miejscu, bez przewijania strony. */
  function showReport(bubbles) {
    const chat = $('chat');
    const token = ++chatToken;
    chat.classList.add('updating');
    setTimeout(() => {
      if (token !== chatToken) return;
      bubbles.forEach((b, i) => { b.style.animationDelay = `${i * 0.12}s`; });
      keepViewport(() => chat.replaceChildren(...bubbles));
      chat.classList.remove('updating');
    }, reducedMotion ? 0 : 350);
  }

  function report() {
    const d = compute();
    const bubbles = msgLeft(d);
    if (d.income > 0 && d.left > 0) bubbles.push(...msgPlan(d));
    showReport(bubbles);
  }

  let reportTimer = 0;
  function scheduleReport() {
    clearTimeout(reportTimer);
    reportTimer = setTimeout(report, 500);
  }

  /* ---------- Całość ---------- */
  function refresh({ costsChanged = false } = {}) {
    const d = compute();
    renderSummary(d);
    renderShopSummary(d);
    if (costsChanged) renderCosts();
    renderChart(d);
    save();
    scheduleReport();
  }

  function flagInvalid(input) {
    const wrap = input.closest('.input-wrap');
    wrap.classList.remove('invalid');
    void wrap.offsetWidth;
    wrap.classList.add('invalid');
    input.focus();
    setTimeout(() => wrap.classList.remove('invalid'), 1200);
  }

  /* ---------- Zakupy ---------- */
  const STORES = ['Biedronka', 'Lidl', 'Kaufland', 'Auchan', 'Carrefour', 'Żabka', 'Netto', 'Dino'];

  // Orientacyjne ceny typowych opakowań (zł). Dłuższe frazy sprawdzane są najpierw.
  const PRICES = [
    ['papier toaletowy', 14], ['recznik papierowy', 9], ['plyn do naczyn', 8], ['plyn do prania', 30],
    ['proszek do prania', 35], ['pasta do zebow', 9], ['mieso mielone', 14], ['ser zolty', 9],
    ['piers z kurczaka', 13], ['woda mineralna', 2.2], ['platki', 8], ['mleko', 4.2], ['chleb', 5.5],
    ['bulk', 0.6], ['maslo', 8.5], ['jaj', 11], ['twarog', 6], ['jogurt', 2.5], ['smietan', 3.5],
    ['kefir', 3.5], ['ser', 9], ['kurczak', 18], ['szynk', 8], ['kielbas', 12], ['parowk', 8],
    ['boczek', 9], ['losos', 20], ['ryba', 15], ['tunczyk', 7], ['ryz', 5], ['makaron', 4.5],
    ['kasza', 5], ['maka', 3.8], ['cukier', 4.5], ['sol', 1.8], ['olej', 8.5], ['oliwa', 28],
    ['ziemniak', 6], ['pomidor', 9], ['ogor', 7], ['cebul', 3.5], ['czosnek', 2.5], ['marchew', 3.5],
    ['papryk', 6], ['salat', 4.5], ['jablk', 5], ['banan', 6.5], ['cytryn', 3], ['pomarancz', 7],
    ['kawa', 28], ['herbat', 9], ['woda', 2.2], ['sok', 5.5], ['cola', 7], ['piwo', 4], ['wino', 25],
    ['czekolad', 5.5], ['ciast', 5], ['chips', 7], ['lody', 12], ['ketchup', 7], ['majonez', 9],
    ['musztard', 4], ['dzem', 7], ['miod', 18], ['pizza', 12], ['szampon', 14], ['mydlo', 4],
    ['zel pod prysznic', 12], ['dezodorant', 13], ['pieluch', 45], ['karma', 6], ['worki', 7],
  ].sort((a, b) => b[0].length - a[0].length);
  const HINTS = ['Mleko', 'Chleb', 'Masło', 'Jajka', 'Ser żółty', 'Jogurt', 'Kurczak', 'Makaron', 'Ryż',
    'Ziemniaki', 'Pomidory', 'Jabłka', 'Banany', 'Kawa', 'Herbata', 'Woda', 'Olej', 'Cukier',
    'Papier toaletowy', 'Płyn do naczyń', 'Proszek do prania', 'Szampon'];

  const plain = (text) => String(text).toLowerCase().replace(/ł/g, 'l').normalize('NFD').replace(/[̀-ͯ]/g, '');

  function estimatePrice(name) {
    const n = plain(name);
    if (!n.trim()) return 0;
    const hit = PRICES.find(([key]) => n.includes(key));
    return hit ? hit[1] : 0;
  }

  const fmtNum = (n) => String(Math.round(n * 100) / 100).replace('.', ',');

  function shopTotals() {
    let toBuy = 0;
    let done = 0;
    state.shop.forEach((i) => { if (i.done) done += i.qty * i.price; else toBuy += i.qty * i.price; });
    return { toBuy, done, total: toBuy + done, noPrice: state.shop.filter((i) => !i.price).length };
  }

  function renderShopSummary(d) {
    const t = shopTotals();
    countTo($('shopTotal'), t.total, (v) => money.format(v));
    countTo($('shopToBuy'), t.toBuy, zl);
    countTo($('shopDone'), t.done, zl);
    $('shopMeter').style.width = `${t.total > 0 ? (t.done / t.total) * 100 : 0}%`;
    const after = d.left - t.total;
    $('shopAfter').textContent = d.income > 0 ? zl(after) : '–';
    let note;
    if (!state.shop.length) note = 'Dodaj pierwszy produkt do listy';
    else if (d.income > 0 && d.left > 0) note = `Zakupy to ${Math.round((t.total / d.left) * 100)}% kwoty, która zostaje Ci po stałych kosztach`;
    else note = `${state.shop.length} ${plural(state.shop.length, 'pozycja', 'pozycje', 'pozycji')} na liście`;
    if (t.noPrice) note += ` · ${t.noPrice} bez ceny`;
    $('shopNote').textContent = note;
    $('view-shop').querySelector('.hero').classList.toggle('negative', d.income > 0 && after < 0 && t.total > 0);
  }

  const CHECK_SVG = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';

  function shopItem(item) {
    const li = el('li', `cost shop-item${item.done ? ' done' : ''}`);
    li.dataset.id = item.id;
    const check = el('button', 'check');
    check.type = 'button';
    check.innerHTML = CHECK_SVG;
    check.setAttribute('aria-pressed', String(item.done));
    check.setAttribute('aria-label', `Kupione: ${item.name}`);
    const info = el('div', 'cost-info');
    const meta = el('div', 'shop-meta');
    const price = el('input', 'price-edit');
    price.type = 'text';
    price.inputMode = 'decimal';
    price.id = `price-${item.id}`;
    price.value = item.price ? item.price.toFixed(2).replace('.', ',') : '';
    price.placeholder = '0';
    price.setAttribute('aria-label', `Cena za sztukę: ${item.name}`);
    const tag = el('span', 'tag', item.price ? 'szac.' : 'bez ceny');
    tag.hidden = Boolean(item.price) && !item.est;
    meta.append(document.createTextNode(`${fmtNum(item.qty)} × `), price, document.createTextNode('zł'), tag);
    info.append(el('div', 'cost-name', item.name), meta);
    const del = el('button', 'del', '×');
    del.type = 'button';
    del.setAttribute('aria-label', `Usuń z listy: ${item.name}`);
    li.append(check, info, el('span', 'cost-amount', money.format(item.qty * item.price)), del);
    return li;
  }

  function renderShopList() {
    const sorted = [...state.shop].sort((a, b) => Number(a.done) - Number(b.done));
    $('shopList').replaceChildren(...sorted.map(shopItem));
    $('shopEmpty').hidden = state.shop.length > 0;
    $('shopClearDone').hidden = !state.shop.some((i) => i.done);
  }

  const searchUrl = (query) => `https://www.google.com/search?q=${encodeURIComponent(query)}`;

  function promoLink(label, action, query, main) {
    const a = el('a', `promo-link${main ? ' main' : ''}`);
    a.href = searchUrl(query);
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.append(el('span', '', label), el('small', '', `${action} ↗`));
    return a;
  }

  function renderPromos() {
    const chips = $('storeChips');
    chips.replaceChildren(...['', ...STORES].map((store) => {
      const chip = el('button', `chip${state.store === store ? ' active' : ''}`, store || 'Wszystkie sklepy');
      chip.type = 'button';
      chip.dataset.store = store;
      chip.setAttribute('aria-pressed', String(state.store === store));
      return chip;
    }));
    const store = state.store;
    const links = [store
      ? promoLink(`Aktualna gazetka – ${store}`, 'otwórz', `${store} gazetka promocyjna aktualna`, true)
      : promoLink('Aktualne gazetki promocyjne', 'otwórz', 'aktualne gazetki promocyjne sklepy spożywcze', true)];
    const seen = new Set();
    state.shop.filter((i) => !i.done).forEach((i) => {
      const key = plain(i.name);
      if (seen.has(key)) return;
      seen.add(key);
      links.push(promoLink(i.name, 'szukaj promocji', `${i.name} promocja ${store || 'gazetka'} aktualna`));
    });
    $('promoList').replaceChildren(...links);
  }

  function refreshShop({ list = true } = {}) {
    renderShopSummary(compute());
    if (list) { renderShopList(); renderPromos(); }
    save();
  }

  function setView(view) {
    ['budget', 'shop'].forEach((v) => {
      const on = v === view;
      $(`view-${v}`).hidden = !on;
      const tab = $(`tab-${v}`);
      tab.classList.toggle('active', on);
      tab.setAttribute('aria-selected', String(on));
    });
    try { localStorage.setItem(STORAGE_KEY + '-tab', view); } catch (_) { /* tryb prywatny */ }
  }

  function initShop() {
    $('shopHints').replaceChildren(...HINTS.map((h) => { const o = el('option'); o.value = h; return o; }));

    document.querySelector('.tabs').addEventListener('click', (e) => {
      const tab = e.target.closest('.tab');
      if (!tab || tab.classList.contains('active')) return;
      setView(tab.dataset.view);
      window.scrollTo({ top: 0, behavior: 'instant' });
    });
    let savedTab = 'budget';
    try { savedTab = localStorage.getItem(STORAGE_KEY + '-tab') || 'budget'; } catch (_) { /* tryb prywatny */ }
    if (savedTab === 'shop') setView('shop');

    $('shopName').addEventListener('input', (e) => {
      const est = estimatePrice(e.target.value);
      $('shopPrice').placeholder = est ? `ok. ${fmtNum(est)}` : 'wpisz cenę';
    });

    $('shopForm').addEventListener('submit', (e) => {
      e.preventDefault();
      const nameInput = $('shopName');
      const name = nameInput.value.trim();
      if (!name) return flagInvalid(nameInput);
      const qty = parseAmount($('shopQty').value) || 1;
      const typed = parseAmount($('shopPrice').value);
      const price = typed || estimatePrice(name);
      state.shop.unshift({ id: uid(), name, qty, price, est: !typed && price > 0, done: false });
      nameInput.value = '';
      $('shopQty').value = '1';
      $('shopPrice').value = '';
      $('shopPrice').placeholder = 'szacuję…';
      refreshShop();
    });

    $('shopList').addEventListener('click', (e) => {
      const li = e.target.closest('.shop-item');
      if (!li) return;
      const item = state.shop.find((i) => i.id === li.dataset.id);
      if (!item) return;
      if (e.target.closest('.check')) {
        item.done = !item.done;
        li.classList.toggle('done', item.done);
        li.querySelector('.check').setAttribute('aria-pressed', String(item.done));
        $('shopClearDone').hidden = !state.shop.some((i) => i.done);
        renderPromos();
        refreshShop({ list: false });
      } else if (e.target.closest('.del')) {
        if (li.classList.contains('removing')) return;
        li.classList.add('removing');
        state.shop = state.shop.filter((i) => i.id !== item.id);
        renderPromos();
        refreshShop({ list: false });
        setTimeout(() => {
          li.remove();
          $('shopEmpty').hidden = state.shop.length > 0;
          $('shopClearDone').hidden = !state.shop.some((i) => i.done);
        }, reducedMotion ? 0 : 350);
      }
    });

    $('shopList').addEventListener('input', (e) => {
      if (!e.target.classList.contains('price-edit')) return;
      const li = e.target.closest('.shop-item');
      const item = state.shop.find((i) => i.id === li.dataset.id);
      if (!item) return;
      item.price = parseAmount(e.target.value);
      item.est = false;
      const tag = li.querySelector('.tag');
      tag.textContent = 'bez ceny';
      tag.hidden = item.price > 0;
      li.querySelector('.cost-amount').textContent = money.format(item.qty * item.price);
      refreshShop({ list: false });
    });

    $('shopClearDone').addEventListener('click', () => {
      state.shop = state.shop.filter((i) => !i.done);
      refreshShop();
    });

    $('storeChips').addEventListener('click', (e) => {
      const chip = e.target.closest('.chip');
      if (!chip) return;
      state.store = chip.dataset.store;
      const left = $('storeChips').scrollLeft;
      renderPromos();
      $('storeChips').scrollLeft = left;
      save();
    });

    renderShopList();
    renderPromos();
  }

  function init() {
    load();

    $('monthLabel').textContent = new Date().toLocaleDateString('pl-PL', { month: 'long', year: 'numeric' });

    const select = $('costCategory');
    CATEGORIES.forEach((cat) => {
      const opt = el('option', '', cat.name);
      opt.value = cat.id;
      select.appendChild(opt);
    });

    if (state.income) $('income').value = String(state.income).replace('.', ',');
    if (state.savings) $('savings').value = String(state.savings).replace('.', ',');
    $('payday').value = state.payday;

    $('income').addEventListener('input', (e) => { state.income = parseAmount(e.target.value); refresh(); });
    $('savings').addEventListener('input', (e) => { state.savings = parseAmount(e.target.value); refresh(); });
    $('payday').addEventListener('input', (e) => {
      const n = Math.round(Number(e.target.value));
      if (n >= 1 && n <= 31) { state.payday = n; refresh(); }
    });

    $('costForm').addEventListener('submit', (e) => {
      e.preventDefault();
      const nameInput = $('costName');
      const amountInput = $('costAmount');
      const name = nameInput.value.trim();
      const amount = parseAmount(amountInput.value);
      if (!name) return flagInvalid(nameInput);
      if (!amount) return flagInvalid(amountInput);
      state.costs.unshift({ id: uid(), name, amount, category: select.value });
      nameInput.value = '';
      amountInput.value = '';
      refresh({ costsChanged: true });
    });

    $('costList').addEventListener('click', (e) => {
      const btn = e.target.closest('.del');
      if (!btn) return;
      const li = btn.closest('.cost');
      if (li.classList.contains('removing')) return;
      li.classList.add('removing');
      state.costs = state.costs.filter((c) => c.id !== li.dataset.id);
      const d = compute();
      renderSummary(d);
      renderShopSummary(d);
      renderChart(d);
      save();
      scheduleReport();
      setTimeout(() => { li.remove(); $('costEmpty').hidden = state.costs.length > 0; }, reducedMotion ? 0 : 350);
    });

    $('chips').addEventListener('click', (e) => {
      const chip = e.target.closest('.chip');
      if (!chip) return;
      clearTimeout(reportTimer);
      const chat = $('chat');
      chat.appendChild(bubble([document.createTextNode(chip.textContent)], 'user'));
      say(ANSWERS[chip.dataset.q](compute()));
    });

    // Potwierdzenie w dwóch kliknięciach (bez okna confirm, które bywa blokowane).
    let resetArmed = 0;
    $('resetBtn').addEventListener('click', (e) => {
      const btn = e.currentTarget;
      if (!resetArmed) {
        btn.textContent = 'Kliknij ponownie, aby potwierdzić';
        resetArmed = setTimeout(() => { resetArmed = 0; btn.textContent = 'Wyczyść dane'; }, 4000);
        return;
      }
      clearTimeout(resetArmed);
      resetArmed = 0;
      btn.textContent = 'Wyczyść dane';
      state = emptyState();
      $('income').value = '';
      $('savings').value = '';
      $('payday').value = 10;
      refresh({ costsChanged: true });
      renderShopList();
      renderPromos();
    });

    initShop();
    refresh({ costsChanged: true });
  }

  init();
})();
