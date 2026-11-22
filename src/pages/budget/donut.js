/* Wykres kołowy stałych kosztów według kategorii, z legendą. */
import { $, countTo, el, syncList } from '../../core/dom.js';
import { zl } from '../../core/format.js';

const SVG_NS = 'http://www.w3.org/2000/svg';
const RADIUS = 50;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function circle(className) {
  const node = document.createElementNS(SVG_NS, 'circle');
  node.setAttribute('class', className);
  node.setAttribute('cx', 60);
  node.setAttribute('cy', 60);
  node.setAttribute('r', RADIUS);
  return node;
}

export function renderDonut(d) {
  const svg = $('donut');
  if (!svg.firstChild) svg.appendChild(circle('track'));
  const segments = new Map([...svg.querySelectorAll('.segment')].map((node) => [node.dataset.cat, node]));
  const gap = d.byCat.length > 1 ? 1.5 : 0;
  let offset = 0;
  d.byCat.forEach((cat) => {
    const length = (cat.total / d.costs) * CIRCUMFERENCE;
    let segment = segments.get(cat.id);
    if (!segment) {
      segment = circle('segment');
      segment.dataset.cat = cat.id;
      segment.style.stroke = cat.color;
      segment.style.strokeDasharray = `0 ${CIRCUMFERENCE}`;
      segment.style.strokeDashoffset = `${-offset}`;
      svg.appendChild(segment);
      segment.getBoundingClientRect(); // wymusza start animacji od zera
    }
    segment.style.strokeDasharray = `${Math.max(0, length - gap)} ${CIRCUMFERENCE}`;
    segment.style.strokeDashoffset = `${-offset}`;
    offset += length;
    segments.delete(cat.id);
  });
  segments.forEach((node) => node.remove());

  countTo($('donutTotal'), d.costs, zl);
  $('legendEmpty').hidden = d.byCat.length > 0;
  const rows = d.byCat.map((cat) => ({ key: cat.id, name: cat.name, color: cat.color, total: cat.total, share: Math.round((cat.total / d.costs) * 100) }));
  syncList($('legend'), rows, (row) => {
    const li = el('li');
    const dot = el('i');
    dot.style.background = row.color;
    li.append(dot, el('span', '', row.name), el('b', '', zl(row.total)), el('small', '', `${row.share}%`));
    return li;
  });
}
