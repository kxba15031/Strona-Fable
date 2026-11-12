/* Okno rozmowy z agentem: dymki, wskaźnik pisania i podmiana raportu bez skakania strony. */
import { $, el, reducedMotion, scrollToNode } from '../../core/dom.js';

let turn = 0; // rośnie przy każdej nowej wypowiedzi; spóźnione odpowiedzi są pomijane
let reportTimer = 0;
const chat = () => $('chat');

export function bubble(nodes, variant = '') {
  const node = el('div', `bubble ${variant}`);
  node.append(...nodes);
  return node;
}

/** Fragmenty akapitu: zwykły tekst albo ['pogrubienie']. */
const rich = (parts) => parts.map((part) => (Array.isArray(part) ? el('strong', '', part[0]) : part));

export function para(...parts) {
  const p = el('p');
  p.append(...rich(parts));
  return p;
}

export function bullets(items) {
  const ul = el('ul');
  items.forEach((item) => {
    const li = el('li');
    li.append(...rich([].concat(item)));
    ul.appendChild(li);
  });
  return ul;
}

/** Zaczyna nową wypowiedź: unieważnia poprzednie oczekujące odpowiedzi. */
function begin() {
  turn += 1;
  clearTimeout(reportTimer);
  chat().classList.remove('updating');
  chat().querySelectorAll('.pending').forEach((node) => node.remove());
  return turn;
}

/** Dopisuje pytanie użytkownika i zwraca dymek „agent pisze…”, do którego trafi odpowiedź. */
export function ask(question) {
  begin();
  const dots = el('div', 'typing');
  dots.append(el('span'), el('span'), el('span'));
  const pending = bubble([dots], 'pending');
  chat().append(bubble([question], 'user'), pending);
  scrollToNode(pending);
  return pending;
}

/** Zastępuje dymek oczekiwania gotowymi dymkami odpowiedzi. */
export function reply(pending, bubbles) {
  const mine = turn;
  setTimeout(() => {
    if (mine !== turn) return;
    bubbles.forEach((node, i) => { node.style.animationDelay = `${i * 0.18}s`; });
    pending.replaceWith(...bubbles);
    scrollToNode(bubbles[bubbles.length - 1]);
  }, reducedMotion ? 0 : 650);
}

/**
 * Wykonuje zmianę układu tak, żeby to, na co patrzy użytkownik, nie przesunęło się na ekranie.
 * Agent jest nad formularzami, więc zmiana wysokości rozmowy przesuwałaby całą stronę.
 */
function keepViewport(change) {
  let anchor = document.activeElement;
  if (!anchor || anchor === document.body || !anchor.getClientRects().length) {
    anchor = document.elementFromPoint(window.innerWidth / 2, window.innerHeight / 2);
  }
  const before = anchor ? anchor.getBoundingClientRect().top : 0;
  change();
  if (!anchor || !anchor.isConnected || chat().contains(anchor)) return;
  const delta = anchor.getBoundingClientRect().top - before;
  if (Math.abs(delta) > 0.5) window.scrollBy({ top: delta, behavior: 'instant' });
}

/** Po chwili bez zmian podmienia całą rozmowę świeżym raportem. */
export function scheduleReport(makeBubbles) {
  clearTimeout(reportTimer);
  reportTimer = setTimeout(() => {
    const mine = begin();
    chat().classList.add('updating');
    setTimeout(() => {
      if (mine !== turn) return;
      const bubbles = makeBubbles();
      bubbles.forEach((node, i) => { node.style.animationDelay = `${i * 0.12}s`; });
      keepViewport(() => chat().replaceChildren(...bubbles));
      chat().classList.remove('updating');
    }, reducedMotion ? 0 : 350);
  }, 500);
}
