# Grosik

Menedżer finansów działający w całości w przeglądarce: budżet z agentem, codzienne wydatki
z limitami i wykresami, cele oszczędnościowe, kalkulator inwestycji, lista zakupów i przepisy.
Dane zapisują się lokalnie w przeglądarce (`localStorage`).

## Uruchomienie

Strona korzysta z modułów JavaScript, więc trzeba ją otworzyć przez serwer (np. GitHub Pages),
a nie bezpośrednio z dysku:

```bash
npm start          # lokalny serwer w bieżącym folderze
```

Wersja w jednym pliku, którą można otworzyć bezpośrednio z dysku:

```bash
npm install
npm run build      # tworzy dist/grosik.html
```

## Struktura

```
index.html              szkielet: nagłówek, zakładki, puste kontenery widoków, stopka
styles/
  tokens.css            kolory i zmienne (tryb jasny i ciemny)
  base.css              reset, tło, nagłówek, układ, animacje
  components.css        karty, pola, przyciski, wiersze list, paski
  pages.css             elementy właściwe dla jednej zakładki
src/
  main.js               start: wstawia szablony zakładek i odświeża je po zmianie danych
  core/                 wspólna logika bez interfejsu
    constants.js        kategorie, sklepy, nazwy widoków
    store.js            stan, zapis/odczyt, powiadamianie o zmianach
    compute.js          wszystkie obliczenia (budżet, prognoza, terminy, cele)
    format.js           kwoty, daty, odmiana słów
    dom.js              pomocnicze funkcje do budowania i aktualizacji strony
    prices.js           szacunkowe ceny produktów
  components/           elementy wielokrotnego użytku
    buttons.js          przyciski: usuń, edytuj, zaznacz, pastylki, wyślij formularz
    layout.js           karta, pole formularza, zielona karta podsumowania
    row.js              wiersz listy, pole w wierszu, paski postępu
    entryForm.js        formularz dodawania i edycji wpisu
    tabs.js             zakładki
    themeToggle.js      przełącznik trybu ciemnego
    icons.js            ikony
  pages/                jedna zakładka = jeden folder
    budget/             Budżet: index.js, agent.js, ai.js, chat.js, donut.js
    spend/              Wydatki: index.js, charts.js
    goals/              Cele: index.js, calculator.js
    shop/               Zakupy: index.js
    recipes/            Przepisy: index.js, data.js (lista przepisów)
  features/             funkcje całej strony
    backup.js           kopia zapasowa i czyszczenie danych
    keyboard.js         chowanie klawiatury na telefonie
scripts/build.mjs       buduje wersję jednoplikową
```

Każda zakładka eksportuje to samo: `template` (HTML), `init()` (podpięcie zdarzeń)
i `render(dane)` (odświeżenie widoku). Dane zmienia się w `state`, a potem woła `commit()`.
