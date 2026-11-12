/* Formularz dodawania wpisu, który potrafi też edytować istniejący wpis. */
import { scrollToNode } from '../core/dom.js';

/**
 * @param read   zwraca dane z pól albo null, gdy czegoś brakuje
 * @param save   zapisuje dane; drugi argument to id edytowanego wpisu lub ''
 * @param clear  czyści pola
 * @param fill   wypełnia pola edytowanym wpisem (tylko formularze z edycją)
 * @param done   wywoływane po każdej zmianie (zapis stanu i odświeżenie widoków)
 */
export function entryForm({ form, read, save, clear, fill, done }) {
  const label = form.querySelector('[type="submit"] span');
  const cancel = form.querySelector('[data-cancel]');
  const addLabel = label.textContent;
  let editing = '';

  function stop() {
    editing = '';
    clear();
    label.textContent = addLabel;
    if (cancel) cancel.hidden = true;
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const data = read();
    if (!data) return;
    save(data, editing);
    stop();
    done();
  });
  if (cancel) cancel.addEventListener('click', () => { stop(); done(); });

  return {
    get editing() { return editing; },
    edit(id, item) {
      if (!item) return;
      editing = id;
      fill(item);
      label.textContent = 'Zapisz zmiany';
      cancel.hidden = false;
      done();
      scrollToNode(form, 'center');
    },
    /** Przerywa edycję, gdy edytowany wpis został właśnie usunięty. */
    forget(id) { if (editing === id) stop(); },
  };
}
