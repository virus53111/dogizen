// Independent, bilingual printer-offline troubleshooting guide from Microsoft and HP documentation.\nexport const wifiPrinterOfflineGuide = {
  "id": "wifi-printer-offline-windows-fix",
  "topic": "tech",
  "minutes": 9,
  "published": "2026-11-14",
  "updated": "2026-11-14",
  "image": "https://commons.wikimedia.org/wiki/Special:Redirect/file/Printer%202020.jpg?width=1200",
  "photoAsset": {
    "url": "https://commons.wikimedia.org/wiki/Special:Redirect/file/Printer%202020.jpg?width=1200",
    "source": "https://commons.wikimedia.org/wiki/File:Printer_2020.jpg",
    "credit": "Rinak66 / Wikimedia Commons — CC BY-SA 4.0; image resized for MURDILIMAX",
    "licenseLabel": "CC BY-SA 4.0",
    "license": "https://creativecommons.org/licenses/by-sa/4.0/"
  },
  "mediaAlt": {
    "en": "Real photo showing a person operating a printer/copier, not a photographed Windows Offline error",
    "ru": "Настоящее фото человека у принтера-копира, а не скриншот ошибки «Не в сети»"
  },
  "sources": [
    {
      "label": "Microsoft Support — Troubleshooting offline printer problems in Windows",
      "url": "https://support.microsoft.com/en-us/windows/hardware/printer/troubleshooting-offline-printer-problems-in-windows"
    },
    {
      "label": "Microsoft Support — Fix printer connection and printing problems",
      "url": "https://support.microsoft.com/en-us/windows/hardware/printer/fix-printer-connection-and-printing-problems-in-windows"
    },
    {
      "label": "HP Support — Printer is offline or unavailable",
      "url": "https://support.hp.com/gb-en/document/ish_2026537-1681507-16"
    },
    {
      "label": "HP Support — Printer setup on a Wi-Fi network",
      "url": "https://support.hp.com/rs-sr/document/ish_1780623-1698506-16"
    }
  ],
  "en": {
    "title": "Wi-Fi Printer Offline in Windows? Fix It Without Resetting Everything",
    "seoTitle": "Printer Offline but Connected to Wi-Fi? 7 Safe Fixes",
    "description": "Printer offline in Windows 11 or 10 even though Wi-Fi works? Check the same network, print queue, spooler, default printer and safe reconnect steps.",
    "subtitle": "The printer may be connected to Wi-Fi but unreachable by one computer. Identify the real failure before resetting the router or reinstalling drivers.",
    "factTable": {
      "title": "Printer offline: what the symptom tells you",
      "headers": [
        "What happens",
        "Likely area to inspect",
        "Best first check"
      ],
      "rows": [
        [
          "Printer's Wi-Fi indicator is off",
          "Printer-to-router connection",
          "Printer network setup"
        ],
        [
          "Phone prints, Windows says Offline",
          "Windows queue or printer entry",
          "Queue, default and spooler"
        ],
        [
          "All devices cannot print",
          "Printer network or device state",
          "Same network, printer display and restart"
        ],
        [
          "Only one document fails",
          "Application or document-specific issue",
          "Print a simple test page"
        ]
      ]
    },
    "stepGuide": {
      "title": "Five steps that solve common Offline states",
      "intro": "Check one layer at a time: printer, network, Windows, then drivers.",
      "steps": [
        [
          "Confirm printer power",
          "Check the display for errors and Wi-Fi status."
        ],
        [
          "Compare network names",
          "Printer and computer should be able to reach each other."
        ],
        [
          "Restart normally",
          "Restart the affected devices, respecting any update in progress."
        ],
        [
          "Inspect the Windows print queue",
          "Clear failed jobs you no longer need; check the default printer."
        ],
        [
          "Run the official troubleshooter",
          "Reinstall only the relevant printer if other checks fail."
        ]
      ]
    },
    "sections": [
      [
        "Why a Wi-Fi printer shows Offline even when the router works",
        "A printer can be powered on and still appear Offline if Windows is using an old printer address, the printer dropped off Wi-Fi, the print queue is paused or the computer is on a network that cannot see the device. It does not necessarily mean the printer needs replacement. Microsoft's Windows guidance starts with power, connection and queue checks; HP separately recommends confirming that the printer and the device you print from are on the same network. First distinguish three situations: the printer itself reports no Wi-Fi, the printer is connected but Windows labels it Offline, or only one document refuses to print. Each points to a different next step. Do not factory-reset the router or delete every printer driver before identifying the failure."
      ],
      [
        "Check the printer screen and the correct Wi-Fi network",
        "Inspect the printer's Wi-Fi light or network menu and confirm that it is actually associated with your intended home or office network. A network name ending in '-Guest' may isolate devices, and a computer connected through a different guest network may not discover the printer. HP advises checking that the printer and the computer or phone use the same Wi-Fi network; on supported HP models the wireless indicator or menu helps establish connection status. A printer that was set up before a router change may still remember an old network password. If necessary, follow the model's official reconnection instructions instead of guessing button combinations. Test from a second trusted device; if neither can find the printer, focus on the printer-to-router connection."
      ],
      [
        "Restart devices in a controlled order",
        "Save any important documents and cancel a stuck test job only if you no longer need it. Power off the printer using its own button, restart the computer, and restart the router only if the network connection appears to be the problem and other users can tolerate an interruption. Allow the wireless network to return before turning the printer back on; some models reconnect automatically. HP's printer-offline troubleshooting recommends restarting the printer, computer and—when relevant—the network equipment, followed by checking the network again. Do not disconnect a device during a firmware update or yank its power cord while an update is installing. After restart, print a simple one-page test rather than a large document. A successful test reveals that the original queued document or application may be the remaining problem."
      ],
      [
        "Clear a blocked print queue in Windows 11 or 10",
        "Open Windows Settings, then Bluetooth & devices → Printers & scanners on Windows 11, or the equivalent Printers & scanners page on your version. Select the intended printer and open its print queue. Check for paused printing, an incorrect default printer or older failed jobs. Microsoft's offline-printer guide recommends clearing unneeded pending jobs and, when necessary, restarting the Print Spooler service from the Windows Services app. Canceling a queue removes unsent jobs, so copy or save the originals first. Restarting the spooler may affect all printers on that computer; do it only if connection and device checks were insufficient. Avoid downloading 'driver fixer' utilities or deleting internal spool folders based on unrelated forum instructions."
      ],
      [
        "What if Windows still says Offline but a phone can print?",
        "If a phone can print on the same network but Windows cannot, the printer's Wi-Fi is probably working and the Windows queue or installed printer connection is a better place to focus. Run the official Windows printer troubleshooter and check the installed printer entry, driver and default selection. If the machine was assigned a different network address by the router, the old Windows configuration may need refreshing; use the printer maker's current setup app or the Windows add-printer flow for your model. Microsoft provides a remove-and-reinstall procedure after simpler checks fail. Only remove the correct printer entry, particularly on shared office computers where drivers, print servers or managed policies may be involved. If Windows can print a test page but not a PDF, troubleshoot the file or application instead."
      ],
      [
        "Do you need a new printer or a new router?",
        "Usually not until simpler checks reveal a hardware failure. Repeated disconnections can come from weak signal, router changes, incompatible network settings or outdated manufacturer software. Place the printer where it can maintain a dependable connection, consult its supported wireless bands and use only official setup instructions. Some printers support 2.4 GHz but not every 5 GHz network, so a computer and printer may need compatible network settings even though both display a Wi-Fi icon. Do not disable Wi-Fi security or share your printer openly with the internet as a workaround. Related guidance: /guides/wifi-router-placement/, /guides/wifi-connected-no-internet-windows/ and /guides/why-bluetooth-keeps-disconnecting/. The last article concerns a different radio technology; it is not a printer-specific solution."
      ],
      [
        "Fast FAQ: the questions people ask after seeing Offline",
        "Can the printer show Offline while the internet still works? Yes—printing relies on communication between your devices and printer, not just an external internet connection. Does turning off the printer delete a document? The file on your computer remains, though a queued print job may be interrupted. Should you press Reset on the router? Not as a first step; a factory reset changes network configuration and can disconnect other devices. Will reinstalling the driver always fix Offline? No; it cannot repair a printer that is disconnected from Wi-Fi. If the printer works from one device but not another, start with the failing device's queue and configuration."
      ]
    ],
    "photoCaption": "Actual photograph of someone operating a printer/copier, Rinak66 / Wikimedia Commons, CC BY-SA 4.0; resized. This photo does not show a network error."
  },
  "ru": {
    "title": "Принтер пишет «Не в сети», хотя Wi-Fi есть: что делать в Windows",
    "seoTitle": "Принтер не в сети, но Wi-Fi работает — 7 решений",
    "description": "Принтер отображается «Не в сети» в Windows 11 или 10? Проверяем Wi-Fi, очередь печати, службу Print Spooler, выбор принтера и повторное подключение.",
    "subtitle": "Не спешите сбрасывать роутер или покупать новый принтер. Проверьте сеть, очередь и настройки Windows по порядку.",
    "factTable": {
      "title": "Как понять причину статуса «Не в сети»",
      "headers": [
        "Симптом",
        "Где искать причину",
        "Что проверить сначала"
      ],
      "rows": [
        [
          "На принтере погас индикатор Wi-Fi",
          "Подключение к роутеру",
          "Меню сетевых настроек принтера"
        ],
        [
          "С телефона печатает, а Windows показывает Offline",
          "Очередь или запись принтера в Windows",
          "Очередь, принтер по умолчанию"
        ],
        [
          "Не печатает ни одно устройство",
          "Сеть или состояние принтера",
          "Общая сеть, экран и перезапуск"
        ],
        [
          "Не печатается только один документ",
          "Файл или приложение",
          "Печать обычной тестовой страницы"
        ]
      ]
    },
    "stepGuide": {
      "title": "Пять шагов проверки принтера",
      "intro": "Сначала устройство и сеть, потом очередь Windows и драйверы.",
      "steps": [
        [
          "Проверьте сам принтер",
          "Питание, ошибки на дисплее и состояние Wi-Fi."
        ],
        [
          "Сверьте название сети",
          "Компьютер и принтер должны видеть друг друга."
        ],
        [
          "Перезагрузите аккуратно",
          "Не отключайте питание во время обновления прошивки."
        ],
        [
          "Проверьте очередь Windows",
          "Уберите ненужные задачи, уточните принтер по умолчанию."
        ],
        [
          "Запустите штатную диагностику",
          "Повторно добавляйте устройство только при необходимости."
        ]
      ]
    },
    "sections": [
      [
        "Почему принтер пишет «Не в сети», хотя Wi-Fi работает",
        "Принтер может быть включён и всё равно отображаться как «Не в сети», если он потерял подключение к роутеру, Windows обращается к старому адресу устройства, очередь печати остановлена либо компьютер подключён к изолированной сети. Это не обязательно признак поломки принтера. В официальных инструкциях Microsoft сначала предлагается проверить питание, связь и очередь, а HP рекомендует убедиться, что принтер и компьютер работают в одной сети Wi-Fi. Важно различить три случая: сам принтер показывает отсутствие Wi-Fi, он подключён, но Windows считает его недоступным, или не печатается только один документ. Для каждого случая нужен свой порядок проверки. Не начинайте с заводского сброса роутера или удаления всех драйверов."
      ],
      [
        "Проверьте Wi-Fi принтера и сеть компьютера",
        "Откройте меню сети на принтере либо посмотрите на индикатор беспроводного подключения. Убедитесь, что он подключён к нужному домашнему или офисному Wi-Fi. Компьютер и принтер желательно проверить на одной сети: гостевой Wi-Fi иногда изолирует устройства друг от друга. HP прямо советует сравнить название сети на принтере и на компьютере или телефоне. После смены роутера принтер мог запомнить старый пароль и перестать подключаться. Для повторной настройки используйте инструкцию именно своей модели, а не случайные сочетания кнопок из видео. Попробуйте отправить тестовую страницу с другого доверенного устройства. Если принтер не видит ни один компьютер или смартфон, проверяйте связь самого принтера с роутером."
      ],
      [
        "Перезагрузка без потери настроек",
        "Сохраните документы и выключите принтер штатной кнопкой. Перезапустите компьютер. Роутер имеет смысл перезагрузить, только если проблема явно связана с сетью и это не помешает другим пользователям. После восстановления Wi-Fi включите принтер и дождитесь соединения. В инструкции HP для статуса Offline рекомендуется перезагрузка компьютера, принтера и, при необходимости, сетевого оборудования, затем повторная проверка связи. Нельзя внезапно отключать питание во время обновления прошивки принтера. Для теста отправьте небольшую страницу, а не большой файл. Если тест работает, а исходный документ нет, возможно, проблема в приложении, настройках файла или застрявшей задаче печати. Не стирайте очередь, пока не проверите, не находятся ли там нужные документы."
      ],
      [
        "Как очистить зависшую очередь печати Windows 11",
        "В Windows 11 откройте «Параметры» → «Bluetooth и устройства» → «Принтеры и сканеры», выберите нужный принтер и откройте его очередь. В Windows 10 название раздела может немного отличаться. Посмотрите, не приостановлена ли печать, выбран ли правильный принтер по умолчанию и есть ли старые задания. Microsoft рекомендует удалить ненужные зависшие задания, а затем при необходимости перезапустить службу «Диспетчер печати» (Print Spooler) через приложение «Службы». Перед очисткой убедитесь, что оригиналы документов сохранены, поскольку задания в очереди будут удалены. Перезапуск службы может затронуть все принтеры этого компьютера. Не устанавливайте программы «для автоматической починки драйверов» и не удаляйте системные файлы по советам из случайных комментариев."
      ],
      [
        "Принтер печатает с телефона, но не с компьютера",
        "Если смартфон печатает с той же сети Wi-Fi, а Windows показывает Offline, связь принтера с роутером, вероятно, работает. В первую очередь проверьте компьютер: правильность выбора принтера, очередь, драйвер и штатное средство устранения неполадок. После смены роутера или сетевых настроек адрес принтера может измениться, и старое подключение Windows перестанет работать. В этом случае установите принтер повторно через официальный мастер производителя или стандартное добавление устройства в Windows. Microsoft предлагает удалить и добавить принтер заново, когда простые проверки не помогают. Удаляйте только нужную запись: на рабочих компьютерах бывают общие серверы печати и политики организации. Если тестовая страница Windows печатается, но PDF нет, ищите причину в конкретном файле или приложении."
      ],
      [
        "Нужно ли менять принтер или покупать новый роутер?",
        "Обычно нет, пока не исключены настройки сети и очередь печати. Причиной повторяющихся отключений могут быть слабый сигнал, изменение параметров роутера, особенности поддерживаемого диапазона Wi-Fi или старая версия фирменного ПО. Установите принтер там, где связь устойчива, и проверьте поддержку частот в инструкции: некоторые модели работают только в 2,4 ГГц, а не во всех сетях 5 ГГц. Не отключайте пароль Wi-Fi и не открывайте принтер в интернет ради временного решения. Для связанных вопросов полезны /ru/guides/wifi-router-placement/ и /ru/guides/wifi-connected-no-internet-windows/. Материал /ru/guides/why-bluetooth-keeps-disconnecting/ объясняет другую технологию и не заменяет диагностику Wi-Fi-принтера. Если на панели горит аппаратная ошибка, следуйте руководству производителя."
      ],
      [
        "Короткие ответы на частые вопросы",
        "Может ли принтер быть не в сети, когда интернет работает? Да: связь с интернетом и обмен между компьютером и принтером — не одно и то же. Удалятся ли документы после выключения принтера? Исходные файлы останутся, но отправленная задача может прерваться. Нужно ли сразу нажимать Reset на роутере? Нет, заводской сброс может отключить всю домашнюю сеть. Поможет ли переустановка драйвера в любом случае? Нет, если принтер не подключён к Wi-Fi, драйвер этого не исправит. Если с одного устройства всё печатается, а с другого нет, начинайте диагностику с неисправного подключения второго устройства."
      ]
    ],
    "photoCaption": "Реальная фотография принтера-копира: Rinak66 / Wikimedia Commons, CC BY-SA 4.0; уменьшено. На фото нет сетевой ошибки."
  }
};\n