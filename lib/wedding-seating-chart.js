export const seatingTool = {
  "id": "wedding-seating-chart",
  "icon": "◫",
  "en": {
    "name": "Wedding seating chart maker",
    "title": "Free Wedding Seating Chart Maker & Printable Place Cards",
    "description": "Assign guests to tables and print a seating chart, table numbers and place cards. Free, without an account, in A4 or US Letter.",
    "intro": "Add your guest list, set the number of seats at each table and choose where everyone sits.",
    "paste": "Guest names, one per line",
    "import": "Add guests",
    "add": "Add table",
    "table": "Table",
    "seats": "Seats",
    "remove": "Remove",
    "unassigned": "Unassigned",
    "guest": "Guest",
    "paper": "Paper size",
    "chart": "Seating chart",
    "numbers": "Table numbers",
    "cards": "Place cards",
    "empty": "No guests assigned",
    "privacy": "Your plan is saved in this browser when local storage is available. Select Save as PDF in the print dialog to keep a copy.",
    "names": [
      "Alex Rivera",
      "Sam Chen",
      "Noor Khan",
      "Jamie Silva"
    ]
  },
  "ru": {
    "name": "План рассадки гостей",
    "title": "Бесплатный конструктор рассадки гостей и именных карточек",
    "description": "Распределите гостей по столам и распечатайте план рассадки, номера столов и именные карточки на A4 или US Letter.",
    "intro": "Добавьте список гостей, укажите число мест за каждым столом и выберите, где кто сидит.",
    "paste": "Имена гостей, по одному на строку",
    "import": "Добавить гостей",
    "add": "Добавить стол",
    "table": "Стол",
    "seats": "Мест",
    "remove": "Удалить",
    "unassigned": "Без стола",
    "guest": "Гость",
    "paper": "Размер бумаги",
    "chart": "План рассадки",
    "numbers": "Номера столов",
    "cards": "Именные карточки",
    "empty": "Гости ещё не рассажены",
    "privacy": "План сохраняется в этом браузере, если доступно локальное хранилище. Чтобы скачать PDF, выберите «Сохранить как PDF» в окне печати.",
    "names": [
      "Анна Смирнова",
      "Алексей Волков",
      "Ирина Ким",
      "Максим Орлов"
    ]
  }
};

export function seatingToolBody(lang, esc) {
  const w = seatingTool[lang];
  return `<section class="section shell seat-tool">
  <style>
    .seat-tool{max-width:68rem}.seat-tool h1{font-size:clamp(2.4rem,6vw,4.5rem);line-height:1.05;margin:0 0 1rem}
    .seat-grid{display:grid;grid-template-columns:1fr 1fr;gap:1.2rem;margin:1.5rem 0}
    .seat-panel{border:1px solid #82998c;border-radius:1rem;padding:clamp(.8rem,3vw,1.4rem);min-width:0}
    .seat-panel h2{margin-top:0}.seat-tool label{display:grid;gap:.25rem}.seat-tool textarea{width:100%;box-sizing:border-box}
    .seat-tool button,.seat-tool input,.seat-tool select,.seat-tool textarea{font:inherit;color:#172d26;background:#fff;border:1px solid #82998c;border-radius:.5rem;padding:.48rem;max-width:100%;min-width:0}
    .seat-tool button{cursor:pointer}.seat-tool button:disabled{opacity:.55;cursor:default}.seat-tool .seat-primary{background:#195743;color:white}
    .seat-row{display:grid;grid-template-columns:minmax(0,1fr) minmax(4rem,.5fr) auto;gap:.45rem;align-items:end;margin:.65rem 0}
    .seat-guest{grid-template-columns:minmax(0,1fr) minmax(0,1fr) auto;align-items:center}.seat-guest input{width:100%;box-sizing:border-box}
    .seat-actions{display:flex;flex-wrap:wrap;gap:.6rem;align-items:end}.seat-actions label{margin-right:.5rem}
    .seat-table-status{grid-column:1/-1;margin:0;font-size:.9rem}.seat-full{color:#a92626;font-weight:700}
    #seat-output{display:none}
    @media(max-width:740px){.seat-grid{grid-template-columns:1fr}.seat-row button{font-size:.82rem}}
    @media print{
      body[data-seat-print]>:not(main),body[data-seat-print] #seat-editor{display:none!important}
      body[data-seat-print],body[data-seat-print] main,body[data-seat-print] .seat-tool{display:block;margin:0;padding:0;width:auto;max-width:none;min-height:0;background:white;color:black}
      body[data-seat-print] #seat-output{display:block;color:#182c25;background:white;font:12pt Georgia,serif}
      #seat-output h1{font:700 28pt Georgia,serif;margin:0 0 8mm}
      #seat-output h2{font:700 18pt Georgia,serif;margin:0 0 3mm}
      .seat-print-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:5mm}
      .seat-print-card{break-inside:avoid;border:1px solid #677e70;padding:6mm;overflow-wrap:anywhere;min-height:24mm}
      .seat-print-card p{margin:1.5mm 0}.seat-number{text-align:center;min-height:55mm;display:grid;place-content:center}.seat-number h2{font-size:30pt}
      .seat-place{text-align:center}.seat-place h2{font-size:17pt}
    }
  </style>
  <style id="seat-print-paper"></style>
  <div id="seat-editor">
    <h1>${esc(w.name)}</h1><p>${esc(w.intro)}</p>
    <div class="seat-grid">
      <section class="seat-panel">
        <h2>${lang==='ru'?'Столы':'Tables'}</h2>
        <div id="seat-tables"></div>
        <button type="button" id="seat-add-table" class="seat-primary">${esc(w.add)}</button>
      </section>
      <section class="seat-panel">
        <h2>${lang==='ru'?'Гости':'Guests'}</h2>
        <label>${esc(w.paste)}<textarea id="seat-paste" rows="3" maxlength="20000"></textarea></label>
        <button type="button" id="seat-import">${esc(w.import)}</button>
        <button type="button" id="seat-clear-example">${lang==='ru'?'Убрать пример':'Remove example guests'}</button>
        <p id="seat-status" role="status"></p>
        <div id="seat-guests"></div>
      </section>
    </div>
    <div class="seat-actions">
      <label>${esc(w.paper)}<select id="seat-paper"><option>A4</option><option value="letter">US Letter</option></select></label>
      ${['chart','numbers','cards'].map(kind=>`<button type="button" data-seat-output="${kind}">${esc(w[kind])} · PDF</button>`).join('')}
    </div>
    <p>${esc(w.privacy)}</p>
  </div>
  <div id="seat-output"></div>
  <script>
    (() => {
      const w = ${JSON.stringify(w)};
      const ru = ${lang==='ru'};
      const key = 'murdilimax-seating-v1';
      const find = id => document.getElementById(id);
      const tables = find('seat-tables');
      const guests = find('seat-guests');
      const paste = find('seat-paste');
      const paper = find('seat-paper');
      const output = find('seat-output');
      const buttons = [...document.querySelectorAll('[data-seat-output]')];
      let state = {
        paper: 'A4', nextTable: 3,
        tables: [{id: 1, name: '', seats: 4}, {id: 2, name: '', seats: 4}],
        guests: w.names.map((name, i) => ({name, example: true, table: i < 2 ? 1 : i === 2 ? 2 : null}))
      };
      try {
        const saved = JSON.parse(localStorage.getItem(key));
        if (saved && Array.isArray(saved.tables) && Array.isArray(saved.guests) && Number.isSafeInteger(saved.nextTable)) state = saved;
      } catch {}
      paper.value = state.paper === 'letter' ? 'letter' : 'A4';

      function save() {
        try { localStorage.setItem(key, JSON.stringify(state)); } catch {}
      }

      function node(tag, text, className) {
        const element = document.createElement(tag);
        if (text !== undefined) element.textContent = text;
        if (className) element.className = className;
        element.dir = 'auto';
        return element;
      }

      function control(label, input) {
        const wrapper = node('label', label);
        wrapper.append(input);
        return wrapper;
      }

      function button(label, action) {
        const element = node('button', label);
        element.type = 'button';
        element.addEventListener('click', action);
        return element;
      }

      function tableName(table) {
        return table.name.trim() || w.table + ' ' + table.id;
      }

      function updateCounts() {
        find('seat-clear-example').hidden = !state.guests.some(guest => guest.example);
        const unassigned = state.guests.filter(guest => guest.table === null).length;
        find('seat-status').textContent = w.unassigned + ' · ' + unassigned + ' / ' + state.guests.length;
        for (const table of state.tables) {
          const count = state.guests.filter(guest => guest.table === table.id).length;
          const status = find('seat-count-' + table.id);
          const left = table.seats - count;
          status.textContent = count + ' / ' + table.seats + ' · ' + (left >= 0
            ? (ru ? 'Свободно ' : 'Free seats ') + left
            : (ru ? 'Не хватает мест ' : 'Seats short ') + -left);
          status.classList.toggle('seat-full', left < 0);
        }
        for (const element of buttons) {
          element.disabled = element.dataset.seatOutput === 'cards'
            ? !state.guests.some(guest => guest.table !== null && guest.name.trim())
            : state.tables.length === 0;
        }
      }

      function render() {
        tables.replaceChildren();
        guests.replaceChildren();
        for (const table of state.tables) {
          const row = node('div', undefined, 'seat-row');
          const name = node('input');
          name.value = table.name;
          name.placeholder = w.table + ' ' + table.id;
          name.maxLength = 80;
          name.addEventListener('input', () => {
            table.name = name.value;
            for (const option of guests.querySelectorAll('option[value="' + table.id + '"]')) option.textContent = tableName(table);
            save();
          });
          const seats = node('input');
          seats.type = 'number';
          seats.min = 1;
          seats.max = 100;
          seats.value = table.seats;
          seats.addEventListener('change', () => {
            table.seats = Math.max(1, Math.min(100, Math.round(Number(seats.value) || 1)));
            seats.value = table.seats;
            save();
            updateCounts();
          });
          const status = node('p', '', 'seat-table-status');
          status.id = 'seat-count-' + table.id;
          const remove = button(w.remove, () => {
            state.tables = state.tables.filter(item => item !== table);
            for (const guest of state.guests) if (guest.table === table.id) guest.table = null;
            save();
            render();
            find('seat-add-table').focus();
          });
          remove.setAttribute('aria-label', w.remove + ' · ' + w.table + ' ' + table.id);
          row.append(control(w.table + ' ' + table.id, name), control(w.seats, seats), remove, status);
          tables.append(row);
        }

        for (const [index, guest] of state.guests.entries()) {
          const row = node('div', undefined, 'seat-row seat-guest');
          const name = node('input');
          name.value = guest.name;
          name.maxLength = 120;
          name.setAttribute('aria-label', w.guest + ' ' + (index + 1));
          name.addEventListener('input', () => { guest.name = name.value; delete guest.example; save(); updateCounts(); });
          const select = node('select');
          select.setAttribute('aria-label', w.table + ' · ' + w.guest + ' ' + (index + 1));
          const unassigned = node('option', w.unassigned);
          unassigned.value = '';
          select.append(unassigned);
          for (const table of state.tables) {
            const option = node('option', tableName(table));
            option.value = table.id;
            select.append(option);
          }
          select.value = guest.table ?? '';
          select.addEventListener('change', () => {
            guest.table = select.value ? Number(select.value) : null;
            save();
            updateCounts();
          });
          const remove = button(w.remove, () => {
            state.guests = state.guests.filter(item => item !== guest);
            save();
            render();
            paste.focus();
          });
          remove.setAttribute('aria-label', w.remove + ' · ' + w.guest + ' ' + (index + 1));
          row.append(name, select, remove);
          guests.append(row);
        }
        updateCounts();
      }

      function print(kind) {
        const grid = node('div', undefined, 'seat-print-grid');
        for (const table of state.tables) {
          const assigned = state.guests.filter(guest => guest.table === table.id && guest.name.trim());
          if (kind === 'cards') {
            for (const guest of assigned) {
              const card = node('article', undefined, 'seat-print-card seat-place');
              card.append(node('h2', guest.name), node('p', tableName(table)));
              grid.append(card);
            }
          } else {
            const card = node('article', undefined, 'seat-print-card' + (kind === 'numbers' ? ' seat-number' : ''));
            card.append(node('h2', tableName(table)));
            if (kind === 'chart') {
              if (!assigned.length) card.append(node('p', w.empty));
              for (const guest of assigned) card.append(node('p', guest.name));
            }
            grid.append(card);
          }
        }
        output.replaceChildren();
        if (kind === 'chart') output.append(node('h1', w.chart));
        output.append(grid);
        find('seat-print-paper').textContent = '@page { size: ' + (paper.value === 'letter' ? 'letter' : 'A4') + '; margin: 12mm; }';
        document.body.dataset.seatPrint = '1';
        window.print();
      }

      find('seat-add-table').addEventListener('click', () => {
        state.tables.push({id: state.nextTable++, name: '', seats: 8});
        save();
        render();
        tables.lastElementChild.querySelector('input').focus();
      });
      find('seat-import').addEventListener('click', () => {
        const names = paste.value.split(/\\r?\\n/).map(name => name.trim().slice(0, 120)).filter(Boolean);
        if (!names.length) { paste.focus(); return; }
        state.guests.push(...names.map(name => ({name, table: null})));
        paste.value = '';
        save();
        render();
      });
      find('seat-clear-example').addEventListener('click', () => {
        state.guests = state.guests.filter(guest => !guest.example);
        save();
        render();
        paste.focus();
      });
      paper.addEventListener('change', () => { state.paper = paper.value; save(); });
      for (const element of buttons) element.addEventListener('click', () => print(element.dataset.seatOutput));
      window.addEventListener('afterprint', () => { delete document.body.dataset.seatPrint; });
      render();
    })();
  </script>
  </section>`;
}
