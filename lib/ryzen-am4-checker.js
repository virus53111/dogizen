export const ryzenTool = {
  "id": "ryzen-am4-checker",
  "icon": "▣",
  "en": {
    "name": "Ryzen AM4 Compatibility Checker",
    "title": "Ryzen AM4 Compatibility Checker — CPU and BIOS",
    "description": "Check Ryzen CPU support and the listed minimum BIOS for seven ASUS AM4 motherboards."
  },
  "ru": {
    "name": "Проверка совместимости Ryzen AM4",
    "title": "Совместимость Ryzen AM4 — процессор, плата и BIOS",
    "description": "Проверьте поддержку Ryzen и минимальную версию BIOS для семи материнских плат ASUS AM4."
  }
};

// Keep the existing order so previously shared links resolve to the same hardware.
const boards = [
  {
    "name": "ASUS PRIME B450M-A II",
    "source": "https://www.asus.com/supportonly/prime%20b450m-a%20ii/helpdesk_cpu/",
    "bios": [
      "3211",
      "2409",
      "3211",
      "3802"
    ]
  },
  {
    "name": "ASUS TUF GAMING B550-PLUS",
    "source": "https://www.asus.com/us/supportonly/tuf%20gaming%20b550-plus/helpdesk_cpu/",
    "bios": [
      "2423",
      "1401",
      "2423",
      "2803"
    ]
  },
  {
    "name": "ASUS ROG STRIX B550-F GAMING",
    "source": "https://www.asus.com/supportonly/rog%20strix%20b550-f%20gaming/helpdesk_cpu/",
    "bios": [
      "2423",
      "1401",
      "2423",
      "2803"
    ]
  },
  {
    "name": "ASUS TUF GAMING B450-PLUS II",
    "source": "https://www.asus.com/supportonly/tuf%20gaming%20b450-plus%20ii/helpdesk_cpu/",
    "bios": [
      "3211",
      "2409",
      "3211",
      "3802"
    ]
  },
  {
    "name": "ASUS PRIME B550M-A",
    "source": "https://www.asus.com/us/supportonly/prime%20b550m-a/helpdesk_cpu/",
    "bios": [
      "2423",
      "1401",
      "2423",
      "2803"
    ]
  },
  {
    "name": "ASUS TUF GAMING B550M-PLUS",
    "source": "https://www.asus.com/us/supportonly/tuf%20gaming%20b550m-plus/helpdesk_cpu/",
    "bios": [
      "2423",
      "1401",
      "2423",
      "2803"
    ]
  },
  {
    "name": "ASUS ROG STRIX B450-F GAMING II",
    "source": "https://www.asus.com/uk/supportonly/rog%20strix%20b450-f%20gaming%20ii/helpdesk_cpu/",
    "bios": [
      "4801",
      "4402",
      "4801",
      "5302"
    ]
  }
];
const cpus = ["Ryzen 5 5600","Ryzen 5 5600G","Ryzen 7 5800X3D","Ryzen 7 5700X3D"];

export function ryzenToolBody(lang, esc, url, photo) {
  const ru = lang === 'ru';
  const t = (en, ruText) => ru ? ruText : en;
  const content = ryzenTool[lang];
  return `<section class="section shell am4">
    <style>
      .am4-hero,.am4-panel{display:grid;grid-template-columns:1fr 1fr;gap:clamp(1rem,4vw,3rem);align-items:center}
      .am4-hero h1{font-size:clamp(2rem,5vw,4.5rem);line-height:1.03;margin:0 0 1rem}
      .am4-hero figure{margin:0}.am4-hero img{width:100%;height:auto;aspect-ratio:16/10;object-fit:cover;border-radius:1rem}
      .am4-hero figcaption{font-size:.85rem;margin-top:.5rem}
      .am4-panel{margin:2rem 0;align-items:start}.am4-box{padding:clamp(1rem,3vw,2rem);background:#172933;color:#fff;border-radius:1rem}
      .am4-box h2,.am4-box p,.am4-box a{color:inherit}.am4-box label{display:grid;gap:.35rem;margin:1rem 0}
      .am4-box select,.am4-box input,.am4-box button{font:inherit;color:#162833;background:#fff;border:1px solid #aec5c2;border-radius:.5rem;padding:.65rem;max-width:100%}
      .am4-box button{cursor:pointer}.am4-box a{text-decoration:underline}.am4-bios{font-size:2.1rem;font-weight:700}
      .am4-fields{display:grid;gap:.5rem;padding:1rem;border:1px solid currentColor;border-radius:.5rem;margin:1rem 0}
      .am4-fields span{display:flex;justify-content:space-between;gap:.5rem;flex-wrap:wrap}.am4-fields code{font-size:.85rem}
      .am4-table{overflow:auto}.am4-table table{width:100%;border-collapse:collapse}.am4-table th,.am4-table td{text-align:left;padding:.65rem;border-bottom:1px solid #829595}
      @media(max-width:700px){.am4-hero,.am4-panel{grid-template-columns:1fr}}
      @media print{.am4 form,.am4 button,.am4-hero figure{display:none}.am4-box,.am4-box a{color:#000;background:#fff}}
    </style>
    <div class="am4-hero"><div><h1>${esc(content.name)}</h1><p>${esc(content.description)}</p></div>
      <figure><img src="${esc(photo)}" alt="${t('Close-up of a motherboard circuit board','Фрагмент печатной платы крупным планом')}" width="1400" height="780" fetchpriority="high"><figcaption>${t('Motherboard detail from the Murdilimax Ryzen upgrade guide.','Фото платы из руководства Murdilimax по апгрейду Ryzen.')}</figcaption></figure></div>
    <div class="am4-panel">
      <div class="am4-box" id="am4-checker">
        <h2>${t('Check your board and CPU','Проверьте плату и процессор')}</h2>
        <form>
          <label>${t('Exact motherboard model','Точная модель материнской платы')}<select name="board">${boards.map((board,i)=>`<option value="${i}">${esc(board.name)}</option>`).join('')}</select></label>
          <label>${t('Processor','Процессор')}<select name="cpu">${cpus.map((cpu,i)=>`<option value="${i}">${esc(cpu)}</option>`).join('')}</select></label>
          <label>${t('Installed BIOS version (optional)', 'Установленная версия BIOS (необязательно)')}
            <input name="installed" inputmode="numeric" maxlength="4" autocomplete="off" placeholder="2409">
          </label>
        </form>
        <noscript><p>${t('See the compatibility table below.','Смотрите таблицу совместимости ниже.')}</p></noscript>
        <div id="am4-result" aria-live="polite" hidden>
          <p id="am4-model"></p>
          <p>${t('ASUS lists support from BIOS','ASUS указывает поддержку с версии BIOS')} <strong class="am4-bios" id="am4-bios"></strong></p>
          <p id="am4-comparison"></p>
          <p id="am4-graphics"></p>
          <p><a id="am4-source" target="_blank" rel="noopener noreferrer">${t('Open official ASUS CPU support table','Открыть официальную таблицу ASUS')}</a></p>
        </div>
        <button type="button" id="am4-share" hidden>${t('Copy result link','Скопировать ссылку на результат')}</button>
        <button type="button" id="am4-print" hidden>${t('Print / save PDF','Печать / сохранить PDF')}</button>
        <p id="am4-status" role="status"></p>
      </div>
      <div>
        <h2>${t('Find your model in Windows','Как узнать модель платы в Windows')}</h2>
        <p>${t('Press Win + R, enter msinfo32 and open System Summary. Look for these fields:','Нажмите Win + R, введите msinfo32 и откройте «Сведения о системе». Найдите поля:')}</p>
        <div class="am4-fields" aria-label="${t('Illustrated example of System Information fields','Пример полей окна «Сведения о системе»')}">
          <span>${t('BaseBoard Manufacturer','Изготовитель основной платы')} <code>ASUSTeK</code></span>
          <span>${t('BaseBoard Product','Модель основной платы')} <code>PRIME B450M-A II</code></span>
          <span>${t('BIOS Version/Date','Версия BIOS')} <code>3211</code></span>
        </div>
        <p>${t('Match the complete model name, including II or Wi-Fi. For an OEM PC, check the PC manufacturer’s support page.','Сверьте полное название модели, включая II или Wi-Fi. Для готового ПК используйте страницу поддержки производителя компьютера.')}</p>
        <p>${t('Before swapping CPUs, compare your installed BIOS with the support table and follow ASUS instructions for the exact board. The listed minimum is the first validated version.','Перед заменой процессора сверяйте установленную версию BIOS с таблицей и следуйте инструкции ASUS для вашей платы. В таблице указана первая проверенная версия.')}</p>
        <p><a href="${url(lang,'guides/ryzen-upgrade')}">${t('Read the Ryzen upgrade checklist','Читать руководство по апгрейду Ryzen')} ↗</a></p>
      </div>
    </div>
    <h2>${t('Minimum BIOS by motherboard and processor','Минимальная версия BIOS для каждой пары')}</h2>
    <div class="am4-table" role="region" aria-label="${t('CPU compatibility table','Таблица совместимости процессоров')}" tabindex="0"><table><thead><tr><th scope="col">${t('Motherboard','Материнская плата')}</th>${cpus.map(cpu=>`<th scope="col">${esc(cpu)}</th>`).join('')}</tr></thead>
    <tbody>${boards.map(board=>`<tr><th scope="row"><a href="${board.source}">${esc(board.name)}</a></th>${board.bios.map(version=>`<td>${version}</td>`).join('')}</tr>`).join('')}</tbody></table></div>
    <p>${t('Coverage: seven exact ASUS desktop boards and four CPUs. For any other combination, open the support page for your board.','В базе семь конкретных плат ASUS для настольных ПК и четыре процессора. Для других комбинаций откройте страницу поддержки своей платы.')}</p>
    <script>
      (() => {
        const boards = ${JSON.stringify(boards)};
        const cpus = ${JSON.stringify(cpus)};
        const root = document.querySelector('#am4-checker');
        const form = root.querySelector('form');
        const boardInput = form.elements.board;
        const cpuInput = form.elements.cpu;
        const installedInput = form.elements.installed;
        const share = root.querySelector('#am4-share');
        const print = root.querySelector('#am4-print');
        const status = root.querySelector('#am4-status');
        const params = new URLSearchParams(location.search);
        for (const input of [boardInput, cpuInput]) {
          const value = params.get(input.name);
          if ([...input.options].some(option => option.value === value)) input.value = value;
        }
        function render() {
          const board = boards[Number(boardInput.value)];
          const cpu = Number(cpuInput.value);
          root.querySelector('#am4-model').textContent = board.name + ' · ' + cpus[cpu];
          const minimum = board.bios[cpu];
          root.querySelector('#am4-bios').textContent = minimum;
          const installed = installedInput.value.trim();
          const comparison = root.querySelector('#am4-comparison');
          comparison.hidden = !installed;
          if (installed && !/^[0-9]{4}$/.test(installed)) {
            comparison.textContent = ${JSON.stringify(t('Enter the four-digit ASUS BIOS version.', 'Введите четыре цифры версии BIOS ASUS.'))};
          } else if (installed) {
            comparison.textContent = Number(installed) < Number(minimum)
              ? ${JSON.stringify(t('Your BIOS is older than the listed minimum. Check the ASUS update instructions before replacing the CPU.', 'Ваша версия BIOS ниже минимальной. Перед заменой процессора проверьте инструкцию ASUS по обновлению.'))}
              : ${JSON.stringify(t('Your BIOS meets the listed minimum. Check the official notes before replacing the CPU.', 'Ваша версия BIOS соответствует указанному минимуму. Перед заменой процессора проверьте примечания ASUS.'))};
          }
          root.querySelector('#am4-source').href = board.source;
          root.querySelector('#am4-graphics').textContent = cpu === 1
            ? ${JSON.stringify(t('Integrated graphics available.', 'Есть встроенная графика.'))}
            : ${JSON.stringify(t('A discrete graphics card is required.', 'Нужна отдельная видеокарта.'))};
          status.textContent = '';
        }
        form.addEventListener('change', render);
        installedInput.addEventListener('input', render);
        form.addEventListener('submit', event => event.preventDefault());
        share.addEventListener('click', async () => {
          const link = new URL(location.pathname, location.origin);
          link.searchParams.set('board', boardInput.value);
          link.searchParams.set('cpu', cpuInput.value);
          try {
            await navigator.clipboard.writeText(link.href);
            status.textContent = ${JSON.stringify(t('Link copied.', 'Ссылка скопирована.'))};
          } catch {
            const input = document.createElement('input');
            input.readOnly = true;
            input.value = link.href;
            input.setAttribute('aria-label', ${JSON.stringify(t('Result link', 'Ссылка на результат'))});
            status.replaceChildren(input);
            input.select();
          }
        });
        print.addEventListener('click', () => window.print());
        render();
        root.querySelector('#am4-result').hidden = false;
        share.hidden = false;
        print.hidden = false;
      })();
    </script>
  </section>`;
}
