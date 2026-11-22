/* Agent na regułach: gotowe odpowiedzi wyliczane z danych budżetu. */
import { EXP_CATS, expCat } from '../../core/constants.js';
import { buildPlan, dueList, forecastText, goalNeed, monthSpending } from '../../core/compute.js';
import { el } from '../../core/dom.js';
import { daysText, monthLabel, plural, zl } from '../../core/format.js';
import { state } from '../../core/store.js';
import { linkButton } from '../../components/buttons.js';
import { bar } from '../../components/row.js';
import { bubble, bullets, para } from './chat.js';

const percent = (share) => `${Math.round(share * 100)}%`;

function planNode(proposal) {
  const wrap = el('div', 'plan');
  proposal.rows.forEach((row) => {
    const top = el('div', 'plan-top');
    top.append(el('span', '', `${row.label} · ${percent(row.part)}`), el('b', '', zl(row.amount)));
    const line = el('div', 'plan-row');
    line.append(top, bar([[row.part / proposal.rows[0].part, row.color]]));
    wrap.appendChild(line);
  });
  return wrap;
}

const dueWhen = (x) => {
  if (x.status === 'overdue') return 'po terminie';
  return x.diff === 0 ? 'termin dziś' : `za ${daysText(x.diff)}`;
};

/** Ostrzeżenia wspólne dla raportu: limity, terminy płatności, cele. */
function alerts(d) {
  const out = [];
  const over = EXP_CATS.filter((c) => state.limits[c.id] && (d.spentByCat[c.id] || 0) > state.limits[c.id]);
  if (over.length) {
    out.push(bubble([para('Przekroczone limity:'), bullets(over.map((c) => [[c.name], ` – o ${zl(d.spentByCat[c.id] - state.limits[c.id])} ponad limit ${zl(state.limits[c.id])}`]))], 'warn'));
  }
  const due = dueList().filter((x) => x.status === 'overdue' || x.status === 'soon');
  if (due.length) {
    const late = due.some((x) => x.status === 'overdue');
    const items = due.slice(0, 5).map((x) => [[x.cost.name], ` – ${zl(x.cost.amount)}, ${dueWhen(x)}`]);
    out.push(bubble([para(late ? 'Masz zaległe płatności. Do zapłaty:' : 'Najbliższe płatności:'), bullets(items)], late ? 'warn' : ''));
  }
  const perMonth = state.goals.reduce((total, g) => total + goalNeed(g).perMonth, 0);
  if (perMonth > 0 && d.left >= 0) {
    const tooMuch = perMonth > d.left;
    out.push(bubble([para('Żeby zdążyć z celami, odkładaj łącznie ', [zl(perMonth)], ' miesięcznie.', tooMuch ? ' To więcej, niż Ci teraz zostaje – rozważ dłuższy termin.' : '')], tooMuch ? 'warn' : ''));
  }
  return out;
}

function left(d) {
  if (d.income <= 0) {
    return [bubble([para('Cześć! Jestem Grosik 👋 Wpisz swoją ', ['wypłatę'], ' i dodaj stałe koszty, a policzę, ile naprawdę zostaje Ci na życie i co warto z tym zrobić.')])];
  }
  if (d.left < 0) {
    return [bubble([
      para(d.spent > 0 ? 'Uwaga: stałe koszty i wydatki przekraczają dochód o ' : 'Uwaga: stałe koszty przekraczają dochód o ', [zl(-d.left)], '.'),
      para('Zanim pomyślisz o oszczędzaniu, trzeba zbić koszty albo zwiększyć dochód. Zapytaj mnie „Jak ograniczyć koszty?”.'),
    ], 'warn'), ...alerts(d)];
  }
  const share = ` – to ${percent(d.left / d.income)} dochodu.`;
  const summary = d.spent > 0
    ? para('Po stałych kosztach i dotychczasowych wydatkach (', [zl(d.spent)], ') zostaje Ci ', [zl(d.left)], share)
    : para('Po opłaceniu stałych kosztów zostaje Ci ', [zl(d.left)], share);
  const pace = d.days > 0
    ? para(`Do wypłaty ${plural(d.days, 'został', 'zostały', 'zostało')} ${daysText(d.days)}. Gdyby cała ta kwota miała wystarczyć do tego czasu, to około `, [zl(d.left / d.days)], ' dziennie.')
    : para('Dziś dzień wypłaty – najlepszy moment, żeby od razu rozdzielić pieniądze według planu.');
  const out = [bubble([summary, pace])];
  if (d.forecast) out.push(bubble([para(forecastText(d))], d.forecast.left < 0 ? 'warn' : ''));
  if (d.share > 0.6) {
    out.push(bubble([para('Stałe koszty zjadają ', [percent(d.share)], ' dochodu. Bezpieczny poziom to okolice 50–60%, więc warto poszukać cięć.')], 'warn'));
  }
  return [...out, ...alerts(d)];
}

function plan(d) {
  if (d.income <= 0 || d.left <= 0) return left(d);
  const proposal = buildPlan(d);
  const intro = {
    cushion: para('W tym miesiącu priorytetem jest ', ['poduszka bezpieczeństwa'], '. Proponuję taki podział:'),
    growing: para('Masz już podstawowy zapas. Czas łączyć ', ['oszczędzanie z inwestowaniem'], ':'),
    invest: para('Poduszka gotowa – nadwyżkę możesz śmielej ', ['inwestować'], ':'),
  }[proposal.stage];
  const nodes = [intro, planNode(proposal)];
  const target = d.costs * 3;
  if (d.costs > 0 && d.savings < target) {
    const perMonth = proposal.rows.find((r) => r.label.startsWith('Poduszka')).amount;
    const months = perMonth > 0 ? Math.ceil((target - d.savings) / perMonth) : 0;
    nodes.push(para('Cel: 3 miesiące kosztów, czyli ', [zl(target)], months > 0 ? `. W tym tempie osiągniesz go za ok. ${months} ${plural(months, 'miesiąc', 'miesiące', 'miesięcy')}.` : '.'));
  }
  return [bubble(nodes)];
}

function invest(d) {
  if (d.income <= 0) return left(d);
  if (d.left <= 0) {
    return [bubble([para('Na inwestowanie przyjdzie czas, gdy budżet wyjdzie na plus. Najlepsza „inwestycja” teraz to ', ['obniżenie stałych kosztów'], ' i spłata najdroższych długów.')], 'warn')];
  }
  const proposal = buildPlan(d);
  const amount = proposal.rows.find((r) => r.label.toLowerCase().includes('inwestycje')).amount;
  const out = [];
  if (proposal.stage === 'cushion') {
    out.push(bubble([
      para('Twoje oszczędności pokrywają mniej niż 3 miesiące kosztów, więc najpierw ', ['bezpieczeństwo'], ', potem zysk:'),
      bullets([
        [['Konto oszczędnościowe lub lokata'], ' – na poduszkę, z szybkim dostępem do pieniędzy.'],
        [['Obligacje skarbowe'], ' (np. krótkoterminowe) – bezpieczne miejsce na nadwyżkę.'],
        ['Na naukę inwestowania przeznacz symbolicznie ok. ', [zl(amount)], ' miesięcznie.'],
      ]),
    ]));
  } else {
    out.push(bubble([
      para('W tym miesiącu możesz zainwestować około ', [zl(amount)], '. Rozważ:'),
      bullets([
        [['ETF na szeroki rynek akcji'], ' – tania, zdywersyfikowana baza na długi termin (5+ lat).'],
        [['Obligacje indeksowane inflacją'], ' – chronią realną wartość oszczędności.'],
        [['IKE / IKZE'], ' – te same inwestycje, ale z ulgami podatkowymi.'],
        proposal.stage === 'invest'
          ? [['Regularność'], ' – stałe zlecenie w dniu wypłaty działa lepiej niż łapanie okazji.']
          : ['Równolegle dobijaj poduszkę do ', ['6 miesięcy'], ' kosztów.'],
      ]),
    ]));
  }
  if (d.byCat.some((c) => c.id === 'loans')) {
    out.push(bubble([para('Masz raty lub kredyty. Jeśli ich oprocentowanie jest wysokie (np. karta, chwilówka), ', ['nadpłata długu'], ' da pewniejszy „zysk” niż większość inwestycji.')], 'warn'));
  }
  return out;
}

function cut(d) {
  if (!d.byCat.length) {
    return [bubble([para('Dodaj najpierw swoje stałe koszty – wtedy wskażę, gdzie najłatwiej coś urwać.')])];
  }
  const top = d.byCat[0];
  const biggest = [...state.costs].sort((a, b) => b.amount - a.amount)[0];
  const has = (id) => d.byCat.find((c) => c.id === id);
  const tips = [
    ['Największa kategoria to ', [top.name], ` (${zl(top.total)}, ${percent(top.total / d.costs)} kosztów). Tu każda obniżka daje najwięcej.`],
    ['Najwyższa pojedyncza pozycja: ', [biggest.name], ` – ${zl(biggest.amount)}. Sprawdź, czy da się ją renegocjować.`],
  ];
  if (has('subs')) tips.push(['Subskrypcje kosztują Cię ', [zl(has('subs').total * 12)], ' rocznie. Zrezygnuj z tych, których nie używasz co tydzień.']);
  if (has('bills')) tips.push(['Rachunki: porównaj oferty internetu, telefonu i prądu – zmiana dostawcy to często 10–20% mniej.']);
  if (has('loans')) tips.push(['Raty: zapytaj bank o konsolidację lub niższą marżę, a nadwyżki kieruj na najdroższy dług.']);
  if (d.income > 0) tips.push(['Obniżenie kosztów o 10% to dodatkowe ', [zl(d.costs * 0.1)], ' co miesiąc.']);
  return [bubble([para('Oto gdzie szukałbym oszczędności:'), bullets(tips)])];
}

/** Odpowiedzi na gotowe pytania (klucze odpowiadają przyciskom pod rozmową). */
export const answers = { left, plan, invest, cut };

/**
 * Bilans minionego miesiąca, pokazywany po zmianie miesiąca, dopóki użytkownik go nie zamknie.
 * Liczby pochodzą z zapisanej historii i z wydatków tamtego miesiąca.
 */
function monthSummary(month) {
  const index = state.history.findIndex((h) => h.month === month);
  const saved = state.history[index];
  if (!saved) return [];
  const { spent, spentByCat } = monthSpending(month);
  const result = saved.income - saved.fixed - spent;
  const nodes = [
    para(['Podsumowanie: '], [monthLabel(month)]),
    para('Dochód ', [zl(saved.income)], ', stałe koszty ', [zl(saved.fixed)], ', wydatki ', [zl(spent)], '.'),
    result >= 0
      ? para('Zostało ', [zl(result)], saved.income > 0 ? ` – ${percent(result / saved.income)} dochodu.` : '.')
      : para('Zabrakło ', [zl(-result)], ' – wydatki i koszty przekroczyły dochód.'),
  ];

  const [top] = Object.entries(spentByCat).sort((a, b) => b[1] - a[1]);
  if (top) nodes.push(para('Najwięcej poszło na: ', [expCat(top[0]).name], ` (${zl(top[1])}, ${percent(top[1] / spent)} wydatków).`));

  const limited = EXP_CATS.filter((c) => state.limits[c.id]);
  const over = limited.filter((c) => (spentByCat[c.id] || 0) > state.limits[c.id]);
  if (over.length) nodes.push(para('Przekroczone limity: ', over.map((c) => `${c.name} (o ${zl(spentByCat[c.id] - state.limits[c.id])})`).join(', '), '.'));
  else if (limited.length) nodes.push(para(`Wszystkie limity (${limited.length}) zostały dotrzymane.`));

  const before = state.history[index - 1];
  if (before && before.spent !== spent) {
    const diff = spent - before.spent;
    nodes.push(para('Wydatki były o ', [zl(Math.abs(diff))], `${diff > 0 ? ' wyższe' : ' niższe'} niż miesiąc wcześniej (${monthLabel(before.month)}).`));
  }
  nodes.push(linkButton({ label: 'Zamknij podsumowanie', action: 'dismiss' }));
  return [bubble(nodes, 'summary')];
}

/** Raport pokazywany automatycznie po każdej zmianie danych. */
export function report(d) {
  const current = d.income > 0 && d.left > 0 ? [...left(d), ...plan(d)] : left(d);
  return state.summaryFor ? [...monthSummary(state.summaryFor), ...current] : current;
}
