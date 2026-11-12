export const STORAGE_KEY = 'grosik-v1';
export const VIEWS = ['budget', 'spend', 'goals', 'shop', 'recipes'];

/** Kategorie stałych kosztów. */
export const CATEGORIES = [
  { id: 'home', name: 'Mieszkanie', color: '#15803d' },
  { id: 'bills', name: 'Rachunki', color: '#22c55e' },
  { id: 'food', name: 'Jedzenie', color: '#facc15' },
  { id: 'transport', name: 'Transport', color: '#86efac' },
  { id: 'subs', name: 'Subskrypcje', color: '#eab308' },
  { id: 'loans', name: 'Kredyty i raty', color: '#0f766e' },
  { id: 'health', name: 'Zdrowie', color: '#a3e635' },
  { id: 'other', name: 'Inne', color: '#fde68a' },
];

/** Kategorie codziennych wydatków. */
export const EXP_CATS = [
  { id: 'food', name: 'Jedzenie', color: '#22c55e' },
  { id: 'transport', name: 'Transport', color: '#86efac' },
  { id: 'fun', name: 'Rozrywka', color: '#facc15' },
  { id: 'health', name: 'Zdrowie', color: '#a3e635' },
  { id: 'clothes', name: 'Ubrania', color: '#eab308' },
  { id: 'home', name: 'Dom', color: '#15803d' },
  { id: 'other', name: 'Inne', color: '#fde68a' },
];
export const GOAL_CAT = { id: 'goal', name: 'Cele oszczędnościowe', color: '#0f766e' };

const byId = (list, id) => list.find((c) => c.id === id) || list[list.length - 1];
export const catById = (id) => byId(CATEGORIES, id);
export const expCat = (id) => (id === GOAL_CAT.id ? GOAL_CAT : byId(EXP_CATS, id));

/** Stałe strony sklepów, na których zawsze są bieżące gazetki. */
export const STORE_LINKS = {
  Biedronka: 'https://www.biedronka.pl/pl/gazetki',
  Lidl: 'https://www.lidl.pl/c/nasze-gazetki/s10008614',
  Kaufland: 'https://sklep.kaufland.pl/gazeta-reklamowa.html',
  Auchan: 'https://www.auchan.pl/pl',
  Carrefour: 'https://www.carrefour.pl/oferta-sklepow-stacjonarnych',
  Żabka: 'https://gazetka.zabka.pl/',
  Netto: 'https://netto.pl/gazetka-netto/',
  Dino: 'https://marketdino.pl/gazetki/lista/standard',
};
export const STORES = Object.keys(STORE_LINKS);
