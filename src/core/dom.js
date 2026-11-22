/* Pomocnicze funkcje do pracy z drzewem strony. */

export const $ = (id) => document.getElementById(id);
export const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

/** Zapis w przeglądarce, który nie wywraca strony w trybie prywatnym. */
export const storage = {
  get(key, fallback = '') {
    try { return localStorage.getItem(key) ?? fallback; } catch (_) { return fallback; }
  },
  set(key, value) {
    try { localStorage.setItem(key, value); } catch (_) { /* brak dostępu do pamięci */ }
  },
};

export function fillSelect(select, options) {
  select.replaceChildren(...options.map((o) => {
    const opt = el('option', '', o.name);
    opt.value = o.id;
    return opt;
  }));
}

export function scrollToNode(node, block = 'nearest') {
  node.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block });
}

/** Płynne odliczanie liczby od poprzedniej wartości do nowej. */
const animated = new WeakMap();
export function countTo(node, target, format) {
  const prev = animated.get(node);
  const from = prev ? prev.value : 0;
  if (prev && prev.raf) cancelAnimationFrame(prev.raf);
  const entry = { value: from, raf: 0 };
  animated.set(node, entry);
  if (reducedMotion || from === target) {
    entry.value = target;
    node.textContent = format(target);
    return;
  }
  const start = performance.now();
  const step = (now) => {
    const t = Math.min(1, (now - start) / 800);
    entry.value = t < 1 ? from + (target - from) * (1 - Math.pow(1 - t, 4)) : target;
    node.textContent = format(entry.value);
    if (t < 1) entry.raf = requestAnimationFrame(step);
  };
  entry.raf = requestAnimationFrame(step);
}

export function flagInvalid(input) {
  const wrap = input.closest('.input-wrap');
  wrap.classList.remove('invalid');
  void wrap.offsetWidth; // wymusza ponowne odtworzenie animacji
  wrap.classList.add('invalid');
  input.focus();
  setTimeout(() => wrap.classList.remove('invalid'), 1200);
}

/** Odczytuje wymagane pole; gdy jest puste, podświetla je i zwraca wartość fałszywą. */
export function need(id, parse = (v) => v.trim()) {
  const input = $(id);
  const value = parse(input.value);
  if (!value) flagInvalid(input);
  return value;
}

/**
 * Uzgadnia listę na stronie z danymi. Każdy element `items` ma pole `key`;
 * wiersz jest budowany od nowa tylko wtedy, gdy jego dane się zmieniły,
 * więc niezmienione wiersze nie migają przy każdym odświeżeniu.
 */
export function syncList(container, items, build) {
  const old = new Map([...container.children].map((node) => [node.dataset.key, node]));
  const next = items.map((item) => {
    const key = String(item.key);
    const signature = JSON.stringify(item);
    const prev = old.get(key);
    if (prev && prev.signature === signature) return prev;
    const node = build(item);
    node.dataset.key = key;
    node.signature = signature;
    node.classList.toggle('settled', Boolean(prev));
    return node;
  });
  const unchanged = next.length === container.children.length && next.every((node, i) => node === container.children[i]);
  if (!unchanged) container.replaceChildren(...next);
}

/** Klucz wiersza listy (`data-key`), w którym leży element, albo pusty tekst. */
export function keyOf(node) {
  const row = node.closest('[data-key]');
  return row ? row.dataset.key : '';
}

/**
 * Obsługa kliknięć przycisków z atrybutem `data-action` wewnątrz kontenera.
 * Handler dostaje klucz wiersza (`data-key`) i sam przycisk.
 */
export function onAction(container, handlers) {
  container.addEventListener('click', (e) => {
    const button = e.target.closest('[data-action]');
    if (!button || !container.contains(button)) return;
    const handler = handlers[button.dataset.action];
    if (handler) handler(keyOf(button), button);
  });
}
