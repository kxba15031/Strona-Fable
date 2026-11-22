/* Orientacyjne ceny typowych opakowań (zł) do szacowania listy zakupów. */
import { plain } from './format.js';

// Dłuższe frazy są sprawdzane najpierw, żeby „ser żółty” wygrał z „ser”.
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
  ['awokado', 5], ['winogron', 13], ['gruszk', 7], ['truskawk', 15], ['mandaryn', 8], ['arbuz', 5],
  ['kapust', 4], ['brokul', 7], ['kalafior', 8], ['pieczark', 5], ['cukini', 8], ['burak', 3],
  ['schab', 12], ['karkowk', 12], ['indyk', 14], ['wolowin', 25], ['kabanos', 7], ['pasztet', 4],
  ['serek', 4], ['mozzarell', 5], ['feta', 7], ['margaryn', 6], ['drozdz', 1.5], ['bulka tarta', 3.5],
  ['napoj', 5], ['energetyk', 5], ['baton', 3], ['zelki', 5], ['orzech', 9], ['paluszk', 3],
  ['przypraw', 3], ['pieprz', 4], ['ocet', 3], ['sos', 6], ['zupa', 4], ['pierogi', 9], ['frytki', 8],
  ['chusteczk', 5], ['gabk', 4], ['folia', 6], ['plyn do plukania', 12], ['tabletki do zmywarki', 30],
  ['zel do prania', 30], ['krem', 15], ['maszynk', 12], ['podpask', 8], ['baterie', 12],
  ['tortill', 7], ['hummus', 8], ['oliwk', 7], ['kukurydz', 4], ['bagietk', 3.5], ['rzodkiewk', 3],
  ['szczypior', 3], ['koncentrat', 4], ['pomidory krojone', 4.5], ['maslo orzechowe', 15], ['pietruszk', 3],
  ['chleb tostowy', 6], ['serek smietankowy', 6],
  ['makaron udon', 9], ['por', 4], ['makaron ryzowy', 7], ['makaron ramen', 6], ['makaron lasagne', 7], ['mleko kokosowe', 8],
  ['pasta curry', 9], ['pasta miso', 14], ['krewetk', 25], ['tofu', 8], ['imbir', 3], ['limonk', 2.5],
  ['kolendr', 4], ['szpinak', 6], ['ciecierzyc', 5], ['fasol', 4], ['soczewic', 6], ['pesto', 9],
  ['parmezan', 12], ['bazyli', 5], ['gnocchi', 7], ['passat', 5], ['pomidorki', 7], ['baklazan', 6],
  ['dynia', 6], ['pestki', 6], ['batat', 8], ['kuskus', 5], ['falafel', 10], ['pita', 5], ['nachos', 7],
  ['salsa', 7], ['sezam', 4], ['bulion', 4], ['ryz arborio', 8], ['granol', 10], ['chia', 9],
  ['borowk', 9], ['malin', 10], ['syrop klonowy', 18], ['chalk', 6], ['bajg', 4], ['makrel', 8],
  ['cynamon', 3], ['proszek do pieczenia', 1.5], ['sledz', 9], ['dorsz', 22], ['lopatk', 20],
  ['zakwas', 5], ['udka', 12], ['groszek', 4], ['ananas', 6], ['wodorost', 9], ['grzank', 4],
  ['natka', 3], ['koper', 3], ['seler', 4], ['edamame', 9], ['daktyl', 9], ['kakao', 8], ['wiorki', 5],
  ['wafle', 4], ['bulki do', 6], ['orzeszk', 7], ['oregano', 3], ['kukurydza na popcorn', 5],
  ['pierogi', 9], ['sos teriyaki', 9], ['sos slodko', 8], ['sos cezar', 8], ['papryka slodka mielona', 3],
  ['salata rzymska', 6], ['kapusta pekinska', 5], ['kapusta kiszona', 5], ['prazona cebulka', 5],
].sort((a, b) => b[0].length - a[0].length);

/** Podpowiedzi nazw w polu produktu. */
export const HINTS = ['Mleko', 'Chleb', 'Masło', 'Jajka', 'Ser żółty', 'Jogurt', 'Kurczak', 'Makaron', 'Ryż',
  'Ziemniaki', 'Pomidory', 'Jabłka', 'Banany', 'Kawa', 'Herbata', 'Woda', 'Olej', 'Cukier',
  'Papier toaletowy', 'Płyn do naczyń', 'Proszek do prania', 'Szampon'];

/** Szacowana cena produktu albo 0, gdy produkt jest nieznany. */
export function estimatePrice(name) {
  const key = plain(name).trim();
  const hit = key && PRICES.find(([phrase]) => key.includes(phrase));
  return hit ? hit[1] : 0;
}
