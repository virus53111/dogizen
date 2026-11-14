// Original bilingual troubleshooting article, researched against primary manufacturer guidance.
export const laptopChargingGuide = {
  "id": "laptop-plugged-in-not-charging-fixes",
  "topic": "tech",
  "minutes": 9,
  "published": "2026-11-14",
  "updated": "2026-11-14",
  "image": "https://commons.wikimedia.org/wiki/Special:Redirect/file/Laptop%20PC%20Battery%20Removed.jpg?width=1200",
  "photoAsset": {
    "url": "https://commons.wikimedia.org/wiki/Special:Redirect/file/Laptop%20PC%20Battery%20Removed.jpg?width=1200",
    "source": "https://commons.wikimedia.org/wiki/File:Laptop_PC_Battery_Removed.jpg",
    "credit": "Intel Free Press / Wikimedia Commons — CC BY-SA 2.0; resized for MURDILIMAX",
    "licenseLabel": "CC BY-SA 2.0",
    "license": "https://creativecommons.org/licenses/by-sa/2.0/"
  },
  "mediaAlt": {
    "en": "Real photograph of a laptop battery removed from a laptop computer; the photo illustrates hardware, not a diagnosed charging failure",
    "ru": "Настоящее фото аккумулятора ноутбука, снятого с устройства; изображение не показывает конкретную неисправность"
  },
  "sources": [
    {
      "label": "Microsoft Support — PC is charging slowly or discharging while plugged in",
      "url": "https://support.microsoft.com/en-us/windows/experience/power-battery/pc-is-charging-slowly-or-discharging-while-it-s-plugged-in"
    },
    {
      "label": "Microsoft Support — Use Smart charging in Windows",
      "url": "https://support.microsoft.com/en-us/windows/experience/power-battery/use-smart-charging-in-windows"
    },
    {
      "label": "Microsoft Support — Caring for your battery in Windows",
      "url": "https://support.microsoft.com/en-us/windows/experience/power-battery/caring-for-your-battery-in-windows"
    },
    {
      "label": "Dell Support — Laptop battery and AC adapter troubleshooting",
      "url": "https://www.dell.com/support/contents/en-us/article/product-support/self-support-knowledgebase/battery-and-power/ac-adapter"
    }
  ],
  "en": {
    "title": "Laptop Plugged In but Not Charging? Check These Causes First",
    "seoTitle": "Laptop Plugged In, Not Charging? Safe Fixes and Checks",
    "description": "Laptop says plugged in, not charging? Diagnose an underpowered USB-C charger, an 80% charge limit, cable issues and battery wear safely.",
    "subtitle": "An 80% charge limit can be normal. A weak charger, damaged cable or battery fault needs a different fix. Start with safe checks.",
    "factTable": {
      "title": "Match the charging symptom to the first check",
      "headers": [
        "What you see",
        "What it may indicate",
        "What to check"
      ],
      "rows": [
        [
          "Stuck near 60–80%, battery otherwise normal",
          "Manufacturer's battery-conservation limit",
          "Smart charging or OEM settings"
        ],
        [
          "Battery drops during heavy use on AC",
          "Underpowered or incompatible charger",
          "Adapter wattage, cable and charging port"
        ],
        [
          "Charger not recognized",
          "Adapter, connector or detection problem",
          "Official model-specific charger diagnostics"
        ],
        [
          "Swelling, heat, damaged wiring",
          "Potential safety-critical hardware fault",
          "Stop charging and obtain qualified service"
        ]
      ]
    },
    "stepGuide": {
      "title": "Five safe checks in order",
      "intro": "Avoid opening the computer or forcing hardware while diagnosing a charging warning.",
      "steps": [
        [
          "Check the displayed percentage",
          "Is it stable at a deliberate limit or still falling?"
        ],
        [
          "Read the laptop's specifications",
          "Confirm the required adapter wattage and charging port."
        ],
        [
          "Use a correct charger and cable",
          "Compare the behavior at idle or with the computer shut down."
        ],
        [
          "Review manufacturer battery settings",
          "Look for a battery-conservation or smart-charging threshold."
        ],
        [
          "Run official diagnostics",
          "If charging fails, record the warning and seek model-specific support."
        ]
      ]
    },
    "sections": [
      [
        "Why does a laptop say “plugged in, not charging”?",
        "The message does not automatically mean that the battery has failed. The laptop may be receiving enough power to run but not enough to charge, a protective charge limit may be active, or a charger or cable may not match the computer's requirements. Microsoft specifically warns that an incompatible or underpowered USB-C adapter can make a PC charge slowly or discharge while plugged in. Begin by noting the battery percentage, whether the machine runs on its adapter, and whether the message is constant or only occurs near a chosen charge threshold. Those observations separate a normal battery-preservation feature from a power problem. Do not open the case or remove a built-in battery just to investigate the status label."
      ],
      [
        "Check the charger, USB-C port and cable before changing Windows",
        "Look up the charging wattage specified for your exact laptop model. Compare that specification with the rating printed on the power adapter and, for USB-C charging, the cable's supported power delivery. A USB-C connector is not proof that every USB-C port accepts charging or that every small phone adapter is sufficient for a laptop. Use the manufacturer-recommended adapter and the port labelled for power input. Check for a loose connection, exposed wires, discoloration or a damaged port without inserting metal objects. Unplug and replace visibly damaged equipment rather than trying to bend contacts back. If the computer charges when switched off but drains during demanding work, insufficient adapter power is especially worth checking."
      ],
      [
        "Could a battery charge limit of 80 percent be intentional?",
        "Yes. Many manufacturers offer battery-conservation modes that stop charging below 100 percent to reduce time spent at maximum charge. Microsoft's Smart charging documentation explains that a laptop can report a smart-charged state while still plugged in, and this does not indicate a fault. Review the manufacturer's utility, battery settings or BIOS documentation for your model before changing anything. A level that repeatedly stays near 60 or 80 percent, with otherwise normal battery operation, can be consistent with an enabled limit. Do not turn off the limit merely to make the battery icon say 100 percent; consider temporarily changing it only when you need more capacity for travel. Distinguish this stable limit from a battery that is falling toward zero while connected."
      ],
      [
        "How to distinguish an aging battery from an adapter problem",
        "Check whether the battery percentage rises with the manufacturer-approved charger while the laptop is idle or sleeping. If it does, the original adapter, cable or operating load may explain the issue. If charging fails with a known-good compatible charger and the manufacturer's diagnostics report poor battery health, a worn battery or power circuit becomes more plausible. Some laptop makers display adapter type or wattage in their firmware diagnostics; Dell notes that a system may run without charging when the AC adapter wattage is not recognized or is insufficient. Use official model-specific tools and support instructions. Windows battery reports and a declining full-charge capacity can provide context, but software readings alone cannot identify a broken charging circuit or guarantee safe battery health."
      ],
      [
        "What is safe to try before paying for a repair?",
        "Save your work, close heavy applications and restart the computer once. Check the wall outlet with a harmless known-working device and make sure a power strip has not been switched off. Test the supplied adapter and the manufacturer-designated charging port; if possible, compare with a compatible adapter approved for the laptop, rather than a random charger. Check manufacturer-provided power settings and any conservation mode. Update the operating system only through normal supported channels and follow the laptop maker's troubleshooting guide; do not flash BIOS merely because a website recommends it. If the laptop uses a removable battery, follow the manufacturer's manual rather than improvising. Photograph the exact warning and note what changes between AC and battery operation before contacting support."
      ],
      [
        "When to stop troubleshooting and seek service",
        "Stop using and charging the computer if a battery looks swollen, its case is deforming, a cable is charred, the connector becomes unusually hot, there is a burning smell, or the machine makes abnormal noises. Do not puncture a lithium-ion battery, press down on swelling or continue testing damaged hardware. Arrange assessment by the manufacturer or a qualified repairer. If there are no safety warnings but charging still fails on a known-good correct adapter, describe the device model, adapter wattage, battery percentage and charging status to support. For related diagnostics, read /guides/laptop-overheating-checklist/, /guides/usb-c-cable-capabilities/ and /guides/why-phone-battery-drains-fast-fix/. These cover different failure modes; a phone charger that works for a phone may not be suitable for a laptop."
      ]
    ],
    "photoCaption": "Authentic laptop battery photograph: Intel Free Press / Wikimedia Commons, CC BY-SA 2.0; resized. Illustrative only and not evidence of an actual charging failure."
  },
  "ru": {
    "title": "Ноутбук подключён к сети, но не заряжается: причины и решения",
    "seoTitle": "Ноутбук подключён, но не заряжается — что делать",
    "description": "Почему ноутбук пишет «подключено, не заряжается»: проверяем зарядку USB-C, ограничение 80%, кабель, блок питания и износ батареи.",
    "subtitle": "Заряд остановился на 80% или падает прямо от розетки? Сначала отличите штатную защиту аккумулятора от проблем с питанием.",
    "factTable": {
      "title": "Что означает симптом и с чего начать",
      "headers": [
        "Симптом",
        "Возможная причина",
        "Первая проверка"
      ],
      "rows": [
        [
          "Останавливается на 60–80%",
          "Режим сохранения батареи",
          "Настройки производителя"
        ],
        [
          "Разряжается при работе от сети",
          "Слабая зарядка или кабель",
          "Мощность адаптера и нужный порт"
        ],
        [
          "Адаптер не распознаётся",
          "Разъём или источник питания",
          "Официальная диагностика модели"
        ],
        [
          "Вздутие, запах гари, сильный нагрев",
          "Опасное аппаратное повреждение",
          "Прекратить зарядку, обратиться в сервис"
        ]
      ]
    },
    "stepGuide": {
      "title": "Пять безопасных шагов проверки",
      "intro": "Не разбирайте корпус и не перепрошивайте BIOS наугад.",
      "steps": [
        [
          "Зафиксируйте процент заряда",
          "Порог постоянный или заряд постепенно падает?"
        ],
        [
          "Уточните требования ноутбука",
          "Проверьте нужную мощность и зарядный разъём."
        ],
        [
          "Используйте подходящий комплект",
          "Сравните заряд при выключенном устройстве."
        ],
        [
          "Проверьте режим сохранения батареи",
          "Ограничение 60–80% может быть нормальным."
        ],
        [
          "Запустите официальную диагностику",
          "Если проблема остаётся — обратитесь в сервис."
        ]
      ]
    },
    "sections": [
      [
        "Почему ноутбук пишет «подключено, не заряжается»?",
        "Такое сообщение ещё не означает поломку аккумулятора. Ноутбук может получать достаточно энергии для работы, но недостаточно для зарядки. Иногда включён режим сохранения ресурса батареи, а иногда блок питания, USB-C-кабель или разъём не соответствуют требованиям устройства. Microsoft указывает, что несовместимое или слишком слабое зарядное устройство способно вызвать медленную зарядку либо разряд даже при подключении к сети. Сначала запишите процент заряда, проверьте, работает ли ноутбук от блока питания и появляется ли сообщение постоянно или только около определённого уровня. Это поможет отличить нормальное ограничение зарядки от неисправности. Не разбирайте корпус и не снимайте встроенную батарею ради одной надписи в Windows."
      ],
      [
        "Проверьте мощность зарядки и нужный USB-C-порт",
        "Найдите требования к зарядному устройству для точной модели ноутбука на сайте производителя. Сравните указанную мощность с маркировкой блока питания, а при подключении через USB-C — ещё и с возможностями кабеля. Одинаковый разъём USB-C не гарантирует, что каждый порт поддерживает питание и любой телефонный адаптер подходит для ноутбука. Подключите оригинальный или рекомендованный производителем блок в предусмотренный для зарядки порт. Осмотрите кабель и разъём снаружи: не должно быть оголённых проводов, сильного перегиба, запаха гари или следов оплавления. Не пытайтесь чистить контакты металлическими предметами. Если при выключенном ноутбуке заряд идёт, а при высокой нагрузке батарея убывает, проверьте прежде всего недостаточную мощность адаптера."
      ],
      [
        "Почему заряд останавливается на 60 или 80 процентах?",
        "Это может быть штатная функция защиты аккумулятора. На некоторых ноутбуках режим сохранения батареи ограничивает максимальный уровень, чтобы уменьшить время, проводимое при полном заряде. Microsoft объясняет, что при включённой Smart charging устройство может оставаться подключённым к сети без дальнейшего увеличения процента, и это нормально. Посмотрите фирменную программу производителя, настройки питания или руководство к BIOS для своей модели. Если ноутбук стабильно останавливается на одном пороге и нормально работает от батареи, не спешите менять аккумулятор. Отключать ограничение имеет смысл только тогда, когда действительно нужна максимальная автономность, например перед дорогой. Если же заряд падает от 50 до 10 процентов прямо от розетки, проблема иная."
      ],
      [
        "Как отличить износ батареи от неисправной зарядки",
        "Проверьте, растёт ли процент с подходящим фирменным адаптером, когда ноутбук находится в спящем режиме или почти не нагружен. Если заряд пошёл, причина может быть в слабом предыдущем блоке, кабеле или высокой нагрузке. Если с исправной совместимой зарядкой ситуация не меняется, откройте официальную диагностику производителя. Некоторые модели Dell показывают в BIOS, распознаны ли тип и мощность адаптера: недостаточная мощность или ошибка распознавания могут мешать зарядке. Оценка состояния аккумулятора полезна, но сама по себе не доказывает неисправность конкретной платы питания. Не полагайтесь на случайные утилиты, обещающие «восстановить батарею программно». При резком выключении или явном износе лучше обратиться в сервис."
      ],
      [
        "Что безопасно сделать самостоятельно?",
        "Сохраните документы, закройте тяжёлые программы и перезагрузите ноутбук один раз. Проверьте, не выключена ли розетка или сетевой фильтр, а также плотно ли подключён адаптер. Используйте только подходящий источник питания и штатный порт зарядки; не подключайте случайные блоки без проверки характеристик. Посмотрите настройки ограничения уровня батареи в утилите производителя. Если предлагаются обычные обновления Windows и драйверов от производителя, устанавливайте их стандартным способом, но не перепрошивайте BIOS лишь из-за совета на неизвестном сайте. Если есть возможность, сравните поведение с заведомо исправной рекомендованной зарядкой. Для обращения в поддержку запишите модель, мощность адаптера, точное сообщение Windows и уровень заряда."
      ],
      [
        "Когда ремонт откладывать нельзя",
        "Прекратите использовать и заряжать ноутбук, если батарея вздулась, корпус начал расходиться, разъём оплавился, провод обуглен, появился запах гари или чрезмерный нагрев. Литий-ионную батарею нельзя прокалывать, сдавливать или пытаться «выправить». Обратитесь в официальный или квалифицированный сервис. Если опасных признаков нет, но правильный блок питания не помогает, специалист сможет проверить аккумулятор, разъём и цепь питания. Не покупайте новую батарею до выяснения причины: иногда проблема в адаптере. Смотрите также /ru/guides/laptop-overheating-checklist/, /ru/guides/usb-c-cable-capabilities/ и /ru/guides/why-phone-battery-drains-fast-fix/. Эти материалы помогают отличить перегрев, ограничения USB-C и поведение батареи телефона от неисправности зарядки ноутбука."
      ]
    ],
    "photoCaption": "Реальная фотография аккумулятора ноутбука: Intel Free Press / Wikimedia Commons, CC BY-SA 2.0; изображение уменьшено. Не является фотографией конкретной поломки."
  }
};
