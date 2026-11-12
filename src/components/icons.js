/* Ikony liniowe używane na stronie. */
const PATHS = {
  plus: 'M12 5v14 M5 12h14',
  check: 'M5 12.5l4.5 4.5L19 7.5',
  edit: 'M4 20h4L19 9l-4-4L4 16z M13 7l4 4',
  wallet: 'M3 7h18v12H3z M3 11h18 M7 15h4',
  receipt: 'M6 3h12v18l-3-2-3 2-3-2-3 2z M9 8h6 M9 12h6',
  pie: 'M12 3a9 9 0 1 0 9 9h-9z M15 3.5A9 9 0 0 1 20.5 9H15z',
  calendar: 'M5 5h14v15H5z M5 10h14 M9 3v4 M15 3v4',
  bars: 'M4 20V10 M10 20V4 M16 20v-8 M22 20H2',
  purse: 'M4 7h16v12H4z M4 7l2-3h12l2 3 M15 13h2',
  shield: 'M12 3l8 4v5c0 5-3.5 8-8 9-4.5-1-8-4-8-9V7z M9 12l2 2 4-4',
  target: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8z M12 12h.01',
  flag: 'M5 21V4 M5 4h12l-2 4 2 4H5',
  trend: 'M3 17l6-6 4 4 8-8 M15 7h6v6',
  cart: 'M4 5h2l2 11h10l2-8H7 M9 20h.01 M17 20h.01',
  tag: 'M3 12V4h8l10 10-8 8z M7.5 8.5h.01',
  search: 'M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14z M20 20l-4-4',
  star: 'M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z',
};

export const icon = (name) => `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${PATHS[name]}"/></svg>`;
