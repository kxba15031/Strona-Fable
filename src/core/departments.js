/* Działy sklepu, w kolejności typowego przejścia przez sklep, i przypisanie produktów do działów. */
import { plain } from './format.js';

// Frazy są pisane bez polskich znaków; przy dopasowaniu wygrywa najdłuższa pasująca fraza,
// dzięki czemu „mleko kokosowe” trafia do produktów suchych, a samo „mleko” do nabiału.
const DEPARTMENTS = [
  { id: 'produce', name: 'Warzywa i owoce', words: ['pomidor', 'ogor', 'papryk', 'cebul', 'czosnek', 'marchew', 'ziemniak', 'salat', 'kapust', 'brokul', 'kalafior', 'cukini', 'baklazan', 'dynia', 'batat', 'burak', 'pieczark', 'szpinak', 'rzodkiewk', 'szczypior', 'pietruszk', 'natka', 'koper', 'seler', 'por', 'imbir', 'bazyli', 'kolendr', 'awokado', 'jablk', 'banan', 'cytryn', 'limonk', 'pomarancz', 'mandaryn', 'winogron', 'gruszk', 'truskawk', 'malin', 'borowk', 'arbuz', 'owoc', 'warzyw'] },
  { id: 'bakery', name: 'Pieczywo', words: ['chleb', 'bulk', 'bulki do', 'bagietk', 'bajg', 'chalk', 'tortill', 'pita', 'grzank', 'wafle'] },
  { id: 'dairy', name: 'Nabiał i jajka', words: ['mleko', 'maslo', 'jaj', 'ser', 'serek', 'twarog', 'jogurt', 'smietan', 'kefir', 'mozzarell', 'feta', 'parmezan', 'margaryn', 'hummus', 'tofu'] },
  { id: 'meat', name: 'Mięso i ryby', words: ['kurczak', 'piers z kurczaka', 'udka', 'mieso', 'wolowin', 'schab', 'karkowk', 'lopatk', 'indyk', 'boczek', 'szynk', 'kielbas', 'parowk', 'kabanos', 'pasztet', 'losos', 'dorsz', 'sledz', 'makrel', 'ryba', 'krewetk'] },
  { id: 'frozen', name: 'Mrożonki', words: ['mrozon', 'lody', 'frytki', 'pizza', 'pierogi', 'falafel', 'gnocchi', 'edamame', 'groszek mrozony', 'warzywa mrozone', 'owoce mrozone'] },
  { id: 'dry', name: 'Produkty suche i konserwy', words: ['makaron', 'ryz', 'kasza', 'kuskus', 'maka', 'cukier', 'sol', 'platki', 'granol', 'chia', 'soczewic', 'ciecierzyc', 'fasol', 'kukurydz', 'groszek', 'tunczyk', 'pomidory krojone', 'passat', 'koncentrat', 'ananas', 'olej', 'oliwa', 'oliwk', 'ocet', 'sos', 'ketchup', 'majonez', 'musztard', 'pesto', 'salsa', 'pasta curry', 'pasta miso', 'mleko kokosowe', 'maslo orzechowe', 'bulion', 'bulion warzywny', 'passata pomidorowa', 'zakwas', 'bulka tarta', 'drozdz', 'proszek do pieczenia', 'przypraw', 'pieprz', 'oregano', 'cynamon', 'papryka slodka mielona', 'sezam', 'miod', 'dzem', 'syrop', 'kakao', 'orzech', 'orzeszk', 'daktyl', 'wiorki', 'pestki', 'wodorost', 'prazona cebulka', 'kukurydza na popcorn', 'ogorki kiszone', 'kapusta kiszona'] },
  { id: 'drinks', name: 'Napoje', words: ['woda', 'sok', 'sok pomaranczowy', 'sok jablkowy', 'napoj', 'cola', 'kawa', 'herbat', 'piwo', 'wino', 'energetyk'] },
  { id: 'sweets', name: 'Słodycze i przekąski', words: ['czekolad', 'ciast', 'baton', 'zelki', 'chips', 'paluszk', 'nachos'] },
  { id: 'household', name: 'Chemia i higiena', words: ['papier toaletowy', 'recznik papierowy', 'plyn', 'proszek do prania', 'zel do prania', 'tabletki do zmywarki', 'szampon', 'mydlo', 'zel pod prysznic', 'pasta do zebow', 'dezodorant', 'krem', 'maszynk', 'podpask', 'pieluch', 'chusteczk', 'gabk', 'folia', 'worki', 'baterie', 'karma'] },
  { id: 'other', name: 'Pozostałe', words: [] },
];

const PHRASES = DEPARTMENTS
  .flatMap((department) => department.words.map((word) => [word, department]))
  .sort((a, b) => b[0].length - a[0].length);
const OTHER = DEPARTMENTS[DEPARTMENTS.length - 1];

/** Dział, w którym zwykle leży produkt o tej nazwie. */
export function departmentOf(name) {
  const key = plain(name);
  const hit = PHRASES.find(([phrase]) => key.includes(phrase));
  return hit ? hit[1] : OTHER;
}

/** Pozycja działu w kolejności przejścia przez sklep. */
export const departmentOrder = (department) => DEPARTMENTS.indexOf(department);
