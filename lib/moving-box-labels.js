export const movingTool = {
  "id": "moving-box-labels",
  "icon": "▣",
  "en": {
    "name": "Moving box labels and inventory",
    "title": "Free Moving Box Label Maker & Printable Inventory",
    "description": "Make numbered moving box labels and a matching inventory. Edit rooms, contents and fragile marks, then print or save a PDF in A4 or US Letter.",
    "box": "Box",
    "room": "Room",
    "contents": "Contents",
    "fragile": "Fragile",
    "add": "Add box",
    "remove": "Remove",
    "paper": "Paper size",
    "printLabels": "Print labels / Save PDF",
    "printInventory": "Print inventory / Save PDF",
    "inventory": "Moving box inventory",
    "instructions": "Edit the examples or add your own boxes. Print the labels and inventory separately. To download a PDF, choose Save as PDF in the print window.",
    "privacy": "Your entries are saved in this browser when storage is available.",
    "empty": "Add a box before printing.",
    "example": [
      [
        "Kitchen",
        "Plates and glasses",
        true
      ],
      [
        "Bedroom",
        "Sheets and pillows",
        false
      ],
      [
        "Living room",
        "Books and cables",
        false
      ]
    ]
  },
  "ru": {
    "name": "Наклейки и опись для переезда",
    "title": "Бесплатный конструктор наклеек на коробки и описи для переезда",
    "description": "Сделайте наклейки с номерами коробок и общую опись для переезда. Укажите комнату, содержимое и хрупкие вещи. Печатайте на A4 или US Letter.",
    "box": "Коробка",
    "room": "Комната",
    "contents": "Содержимое",
    "fragile": "Хрупкое",
    "add": "Добавить коробку",
    "remove": "Удалить",
    "paper": "Размер бумаги",
    "printLabels": "Печать наклеек / PDF",
    "printInventory": "Печать описи / PDF",
    "inventory": "Опись коробок для переезда",
    "instructions": "Измените примеры или добавьте свои коробки. Наклейки и опись можно распечатать отдельно. Чтобы скачать PDF, выберите «Сохранить как PDF» в окне печати.",
    "privacy": "Записи сохраняются в этом браузере, если доступно локальное хранилище.",
    "empty": "Добавьте коробку перед печатью.",
    "example": [
      [
        "Кухня",
        "Тарелки и стаканы",
        true
      ],
      [
        "Спальня",
        "Простыни и подушки",
        false
      ],
      [
        "Гостиная",
        "Книги и кабели",
        false
      ]
    ]
  }
};

export function movingToolBody(lang, esc) {
  const words = movingTool[lang];
  return `<section class="section shell move-tool">
    <style>
      .move-tool{max-width:64rem}.move-tool h1{font-size:clamp(2.2rem,6vw,4rem);line-height:1.05;margin:0 0 1rem}
      .move-intro{max-width:42rem}.move-toolbar{display:flex;flex-wrap:wrap;align-items:end;gap:.7rem;margin:1.25rem 0}
      .move-tool button,.move-tool select,.move-tool input{font:inherit;padding:.55rem .7rem;border:1px solid #7f9990;border-radius:.4rem;color:#172623;background:#fff}
      .move-tool button{cursor:pointer}.move-tool button:disabled{opacity:.55;cursor:default}.move-tool .move-primary{background:#17644f;color:#fff}
      .move-row{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,2fr) auto auto;align-items:center;gap:.75rem;margin:.7rem 0;padding:1rem;border:1px solid #86a59b;border-radius:.7rem;min-width:0}
      .move-row label,.move-toolbar label{display:grid;gap:.25rem}.move-row input{min-width:0;width:100%;box-sizing:border-box}
      .move-row .move-fragile{display:flex;align-items:center}.move-row .move-fragile input{width:auto}
      #move-output{display:none}
      @media(max-width:700px){.move-row{grid-template-columns:1fr 1fr}.move-row .move-contents{grid-column:1/-1}.move-row legend{grid-column:1/-1}}
      @media print{
        body[data-move-print] > :not(main),body[data-move-print] #move-editor{display:none!important}
        body[data-move-print],body[data-move-print] main,body[data-move-print] .move-tool{display:block;margin:0;padding:0;width:auto;max-width:none;min-height:0;background:white;color:black}
        body[data-move-print] #move-output{display:block;background:white;color:black;font:11pt system-ui}
        .move-labels{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:4mm}
        .move-label{break-inside:avoid;border:1px dashed #333;padding:5mm;min-height:31mm;overflow-wrap:anywhere}
        .move-label strong{font-size:18pt}.move-label p{margin:2mm 0}
        #move-output table{border-collapse:collapse;width:100%;table-layout:fixed}
        #move-output th,#move-output td{border:1px solid #555;text-align:start;padding:2mm;overflow-wrap:anywhere}
        #move-output tr{break-inside:avoid}#move-output thead{display:table-header-group}
      }
    </style>
    <style id="move-paper"></style>
    <div id="move-editor">
      <h1>${esc(words.name)}</h1><p class="move-intro">${esc(words.instructions)}</p>
      <div class="move-toolbar">
        <button type="button" id="move-add" class="move-primary">${esc(words.add)}</button>
        <label>${esc(words.paper)}<select id="move-size"><option>A4</option><option value="letter">US Letter</option></select></label>
        <button type="button" id="move-labels">${esc(words.printLabels)}</button>
        <button type="button" id="move-inventory">${esc(words.printInventory)}</button>
      </div>
      <p>${esc(words.privacy)}</p>
      <p id="move-empty" role="status" hidden>${esc(words.empty)}</p>
      <div id="move-boxes"></div>
    </div>
    <div id="move-output"></div>
    <script>
      (() => {
        const words = ${JSON.stringify(words)};
        const key = 'murdilimax-moving-boxes-v1';
        const defaultState = {
          size: 'A4',
          next: words.example.length + 1,
          boxes: words.example.map(([room, contents, fragile], index) => ({id: index + 1, room, contents, fragile}))
        };
        let state = defaultState;
        try {
          const saved = JSON.parse(localStorage.getItem(key));
          if (saved && Array.isArray(saved.boxes) && Number.isSafeInteger(saved.next)) state = saved;
        } catch {}
        const list = document.querySelector('#move-boxes');
        const size = document.querySelector('#move-size');
        const output = document.querySelector('#move-output');
        const printLabels = document.querySelector('#move-labels');
        const printInventory = document.querySelector('#move-inventory');
        size.value = state.size === 'letter' ? 'letter' : 'A4';

        function element(tag, text) {
          const node = document.createElement(tag);
          if (text !== undefined) node.textContent = text;
          return node;
        }

        function save() {
          try { localStorage.setItem(key, JSON.stringify(state)); } catch {}
        }

        function appendBox(box) {
          const row = element('fieldset');
          row.className = 'move-row';
          row.append(element('legend', words.box + ' ' + box.id));
          for (const field of ['room', 'contents', 'fragile']) {
            const label = element('label', words[field]);
            label.className = 'move-' + field;
            const input = element('input');
            if (field === 'fragile') {
              input.type = 'checkbox';
              input.checked = box.fragile;
            } else {
              input.maxLength = field === 'room' ? 60 : 160;
              input.dir = 'auto';
              input.value = box[field];
            }
            input.addEventListener('input', () => {
              box[field] = field === 'fragile' ? input.checked : input.value;
              save();
            });
            label.append(input);
            row.append(label);
          }
          const remove = element('button', words.remove);
          remove.type = 'button';
          remove.setAttribute('aria-label', words.remove + ' · ' + words.box + ' ' + box.id);
          remove.addEventListener('click', () => {
            state.boxes = state.boxes.filter(item => item !== box);
            const nextInput = (row.nextElementSibling || row.previousElementSibling)?.querySelector('input');
            row.remove();
            save();
            updateButtons();
            (nextInput || document.querySelector('#move-add')).focus();
          });
          row.append(remove);
          list.append(row);
          return row;
        }

        function updateButtons() {
          const empty = state.boxes.length === 0;
          printLabels.disabled = empty;
          printInventory.disabled = empty;
          document.querySelector('#move-empty').hidden = !empty;
        }

        function prepareLabels() {
          const grid = element('div');
          grid.className = 'move-labels';
          for (const box of state.boxes) {
            const label = element('article');
            label.className = 'move-label';
            label.append(element('strong', words.box + ' ' + box.id));
            for (const text of [box.room, box.contents, box.fragile ? words.fragile : '']) {
              if (!text.trim()) continue;
              const line = element('p', text);
              line.dir = 'auto';
              label.append(line);
            }
            grid.append(label);
          }
          output.replaceChildren(grid);
        }

        function prepareInventory() {
          const table = element('table');
          const header = table.createTHead().insertRow();
          for (const field of ['box', 'room', 'contents', 'fragile']) {
            const heading = element('th', words[field]);
            heading.scope = 'col';
            header.append(heading);
          }
          const body = table.createTBody();
          for (const box of state.boxes) {
            const row = body.insertRow();
            for (const value of [String(box.id), box.room, box.contents, box.fragile ? words.fragile : '']) {
              const cell = row.insertCell();
              cell.textContent = value;
              cell.dir = 'auto';
            }
          }
          output.replaceChildren(element('h1', words.inventory), table);
        }

        function print(prepare) {
          if (!state.boxes.length) return;
          prepare();
          document.querySelector('#move-paper').textContent = '@page { size: ' + (size.value === 'letter' ? 'letter' : 'A4') + '; margin: 12mm; }';
          document.body.dataset.movePrint = 'true';
          window.print();
        }
        window.addEventListener('afterprint', () => { delete document.body.dataset.movePrint; });

        document.querySelector('#move-add').addEventListener('click', () => {
          const box = {id: state.next++, room: '', contents: '', fragile: false};
          state.boxes.push(box);
          appendBox(box).querySelector('input').focus();
          updateButtons();
          save();
        });
        size.addEventListener('change', () => { state.size = size.value; save(); });
        printLabels.addEventListener('click', () => print(prepareLabels));
        printInventory.addEventListener('click', () => print(prepareInventory));
        state.boxes.forEach(appendBox);
        updateButtons();
      })();
    </script>
  </section>`;
}
