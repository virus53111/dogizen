// Independently sourced bilingual troubleshooting guides with subject-matched licensed photography.
export const seoUsefulGuidesA = [
  {
    "id": "bluetooth-headphones-connected-no-sound-windows",
    "topic": "tech",
    "minutes": 7,
    "published": "2026-11-11",
    "updated": "2026-11-11",
    "image": "https://commons.wikimedia.org/wiki/Special:Redirect/file/SoundPeats%20TrueBuds-8735.jpg?width=1200",
    "sources": [
      {
        "label": "Microsoft Support — Fix Bluetooth connected but no sound in Windows",
        "url": "https://support.microsoft.com/en-us/windows/hardware/bluetooth/fix-bluetooth-connected-but-no-sound-issue-on-windows"
      },
      {
        "label": "Microsoft Support — Fix audio when Windows speakers or headphones are silent",
        "url": "https://support.microsoft.com/en-us/windows/hardware/audio/fix-audio-issues-when-no-sound-plays-from-speakers-or-headphones-in-windows"
      }
    ],
    "en": {
      "title": "Bluetooth headphones connected but no sound in Windows: 7 checks",
      "seoTitle": "Bluetooth Connected but No Sound in Windows? 7 Fixes",
      "description": "Bluetooth headphones connected but silent? Follow seven safe checks for sound output, volume, pairing and drivers in Windows 10 or 11.",
      "subtitle": "Start with the correct playback device before reinstalling anything. These checks also help with speakers that connect but remain silent.",
      "sections": [
        [
          "Check the selected output first",
          "A Bluetooth connection means Windows can communicate with the headset; it does not guarantee that audio is being sent there. Play a short video, click the speaker icon and select the headphones as the output device. In Windows 10 open Settings, System, Sound and choose the device under Output. In Windows 11 use Settings, System, Sound and check Output. Make sure the computer and the headset are not muted. If a program has its own audio-output setting, check that too. Test with a second program before changing system settings."
        ],
        [
          "Separate a pairing problem from an audio problem",
          "If the headphones say connected but do not appear in the audio-output list, turn Bluetooth off and back on. Recharge the headset, move it closer and disconnect it from another phone or laptop that may have taken control. Then use Settings, Bluetooth devices to remove the headset and pair it again. The names of menus differ between Windows 10 and Windows 11, but the sequence is the same: remove, restart Bluetooth, put the headphones into pairing mode and add them again. Do not reset unrelated network adapters."
        ],
        [
          "Check microphone or call mode",
          "Some older Bluetooth headsets use different audio profiles for music playback and hands-free calls. Sound may become lower-quality or appear to disappear when an app activates the microphone. Close meeting and voice-chat apps, try playing music and check which output device Windows selected. If the headset offers separate Stereo and Hands-Free entries, choose the stereo playback entry for listening. The exact options depend on headset hardware and Windows version. Do not disable a microphone you need for calls without testing it first."
        ],
        [
          "Restart and update carefully",
          "Restart the PC and the headset. In Device Manager, expand Bluetooth and use Update driver for the Bluetooth adapter, then check the headset manufacturer’s support page if the problem persists. Install Windows updates when supported for your version. Avoid anonymous driver-updater websites and do not delete system drivers simply because the first attempt failed. Microsoft notes that Windows 10 regular support ended in October 2025, so unsupported machines may require an upgrade plan as well as normal troubleshooting."
        ],
        [
          "When to test different hardware",
          "Try the headphones with a phone and try another Bluetooth audio device on the computer. If only one headset fails everywhere, the headset may need service. If several Bluetooth devices fail on one PC, investigate the adapter, interference and operating-system configuration. Also test a wired speaker or headset to distinguish a general Windows audio fault from Bluetooth-specific trouble. Record which test changes the result; that makes subsequent diagnosis faster."
        ],
        [
          "Quick checklist and next reading",
          "A practical order is: output selection, volume, charging, reconnection, competing devices, app call mode, then drivers and updates. Only after these checks should you consider reinstalling Bluetooth components or replacing equipment. Related reading on MURDILIMAX: guide to router placement at /guides/wifi-router-placement/ and ways to review browser permissions at /guides/review-browser-permissions/. Those topics will not repair headset hardware but can help keep a Windows setup better organized."
        ]
      ],
      "photoCaption": "Documentary photograph illustrating the subject; it does not show a verified malfunction. Photo: © Raimond Spekking / Wikimedia Commons — CC BY-SA 4.0."
    },
    "ru": {
      "title": "Bluetooth-наушники подключены, но звука нет: что делать в Windows",
      "seoTitle": "Bluetooth подключён, но нет звука: 7 решений для Windows",
      "description": "Наушники подключены по Bluetooth, но молчат? Проверьте вывод звука, громкость, повторное сопряжение и драйверы в Windows 10 и 11.",
      "subtitle": "Начните с простых проверок — часто переустановка драйверов вообще не требуется.",
      "sections": [
        [
          "Проверьте, куда Windows выводит звук",
          "Надпись «Подключено» не означает, что звук действительно отправляется в наушники. Включите видео, нажмите значок динамика на панели задач и выберите Bluetooth-наушники как устройство вывода. В Windows 10 это можно проверить через Параметры → Система → Звук → Устройство вывода. В Windows 11 путь похожий. Убедитесь, что звук не отключён ни на компьютере, ни на самих наушниках. Проверьте вторую программу: иногда отдельное приложение отправляет звук на другой выход."
        ],
        [
          "Подключите наушники заново",
          "Если наушники отображаются как подключённые, но не появляются в списке вывода звука, выключите и включите Bluetooth. Зарядите наушники, поднесите их к компьютеру и временно отключите от другого телефона, который мог перехватить соединение. В параметрах Bluetooth удалите устройство, переведите наушники в режим сопряжения и добавьте снова. Не сбрасывайте все сетевые настройки ради одной гарнитуры: это может создать дополнительные проблемы."
        ],
        [
          "Проверьте режим звонков и микрофон",
          "У некоторых гарнитур есть разные режимы для музыки и телефонных разговоров. Когда программа видеосвязи включает микрофон, качество звука может резко ухудшаться или звук исчезает. Закройте приложения для созвонов, включите обычную музыку и ещё раз выберите выходное устройство. Если Windows показывает отдельно Stereo и Hands-Free, для прослушивания музыки обычно нужен стереорежим. Названия и доступность вариантов зависят от наушников и версии системы."
        ],
        [
          "Перезапуск и драйверы",
          "Перезагрузите компьютер и наушники. Если не помогло, откройте Диспетчер устройств, раздел Bluetooth, и проверьте обновление драйвера адаптера. При необходимости найдите официальную страницу поддержки производителя ноутбука или Bluetooth-адаптера. Не устанавливайте случайные «универсальные драйверы» с рекламных сайтов. Обычная поддержка Windows 10 закончилась в октябре 2025 года: для старых систем стоит отдельно продумать обновление, но это не повод удалять драйверы без диагностики."
        ],
        [
          "Определите, где неисправность",
          "Подключите наушники к телефону, а к компьютеру — другие Bluetooth-наушники или колонку. Если гарнитура не работает нигде, вероятна проблема самого устройства. Если на одном компьютере молчат несколько беспроводных устройств, проверяйте адаптер, помехи и настройки Windows. Дополнительно испытайте проводные наушники: так проще отличить общую неисправность звука от сбоя Bluetooth. Записывайте результат каждого теста, чтобы не повторять одни и те же действия."
        ],
        [
          "Короткий порядок проверки",
          "Правильная последовательность обычно такая: устройство вывода, громкость, заряд, повторное подключение, другие подключённые устройства, режим звонков, драйверы. Не начинайте с полной переустановки Windows. По смежным вопросам на MURDILIMAX есть материалы о размещении Wi-Fi-роутера (/ru/guides/wifi-router-placement/) и разрешениях браузера (/ru/guides/review-browser-permissions/)."
        ]
      ],
      "photoCaption": "Документальная фотография по теме статьи; она не показывает доказанную неисправность. Фото: © Raimond Spekking / Wikimedia Commons — CC BY-SA 4.0."
    },
    "photoAsset": {
      "url": "https://commons.wikimedia.org/wiki/Special:Redirect/file/SoundPeats%20TrueBuds-8735.jpg?width=1200",
      "source": "https://commons.wikimedia.org/wiki/File:SoundPeats_TrueBuds-8735.jpg",
      "credit": "© Raimond Spekking / Wikimedia Commons — CC BY-SA 4.0",
      "licenseLabel": "CC BY-SA 4.0",
      "license": "https://creativecommons.org/licenses/by-sa/4.0/"
    },
    "mediaAlt": {
      "en": "Wireless Bluetooth earbuds with charging case displayed for product photography",
      "ru": "Беспроводные Bluetooth-наушники и футляр для зарядки"
    }
  },
  {
    "id": "phone-charging-slowly-checklist",
    "topic": "digital",
    "minutes": 7,
    "published": "2026-11-11",
    "updated": "2026-11-11",
    "image": "https://commons.wikimedia.org/wiki/Special:Redirect/file/Charging%20smartphone.jpg?width=1200",
    "sources": [
      {
        "label": "Samsung Support — Galaxy charging slowly or not charging",
        "url": "https://www.samsung.com/us/support/troubleshoot/TSG10013245/"
      },
      {
        "label": "Samsung Support — Fast charging requirements and checks",
        "url": "https://www.samsung.com/us/support/troubleshoot/TSG10013503/"
      }
    ],
    "en": {
      "title": "Why is my phone charging slowly? A safe troubleshooting checklist",
      "seoTitle": "Phone Charging Slowly? 8 Things to Check First",
      "description": "Phone charging too slowly? Check cable, adapter, USB port, heat and battery settings before replacing the battery.",
      "subtitle": "Use simple comparisons to tell normal charge protection from a damaged cable, a dirty port or an unsuitable adapter.",
      "sections": [
        [
          "Measure the problem instead of guessing",
          "Charging rates vary with battery percentage, temperature, screen use, charger output and device support. A phone may charge quickly while the battery is low and more slowly near full charge; that is often intentional protection rather than a fault. Make a simple test: note battery percentage, turn the screen off, connect a trusted wall charger and check again after 15 to 20 minutes. Compare with the same conditions another day. A charging-time estimate is not a guaranteed promise, and background activity can change results."
        ],
        [
          "Try a compatible adapter and cable",
          "A high-wattage number on an adapter does not mean every phone will draw that power. The charger, cable and phone must share a supported charging protocol and power profile. Try a known-good cable and manufacturer-compatible wall charger before buying anything. Avoid frayed cables, bent plugs, heat-damaged adapters and unknown fast-charging accessories. USB ports on older computers and some cars can supply much less power than a suitable wall adapter, so they are poor benchmarks for charging speed."
        ],
        [
          "Look at the charging port safely",
          "Pocket lint and dirt can prevent a plug from seating securely. Disconnect the cable and inspect the phone’s USB port with good light. Do not push metal objects, liquids or sharp tools inside. If the connection feels loose, shows corrosion or will only charge at a particular angle, stop forcing the cable and seek an authorized repair assessment. Repeatedly inserting a damaged plug can worsen the problem. If the phone reports moisture detected, follow the manufacturer’s drying advice rather than trying to override the warning."
        ],
        [
          "Heat and cold change charging behavior",
          "Fast charging generates heat. Gaming, direct sunlight, a thick insulating case or a hot room can cause the phone to lower charging power. Let the phone cool naturally in a shaded, ventilated place and avoid charging under a pillow. Do not place electronics in a refrigerator or freezer to cool them. Very low temperatures can also affect charging. Swollen batteries, a burning smell, crackling sounds or unusually hot hardware are signs to disconnect power if safe and contact qualified service immediately."
        ],
        [
          "Check software and battery protection",
          "Battery protection, scheduled charging or adaptive charging may deliberately slow or pause charging near a selected percentage. Look in your phone’s Battery settings, compare behaviour with the screen off and install official system updates. The exact menu differs between Android brands and iPhone models. If charging becomes slow only while streaming video or using navigation, the phone may be consuming much of the incoming power. Do not disable protective features permanently just to obtain a faster number on the display."
        ],
        [
          "When the battery or port needs service",
          "If two proven chargers and cables give the same poor result in a cool room while the screen is off, arrange a professional diagnostic check. The cause could be a worn battery, damaged USB connector or internal charging circuit; a web article cannot identify which part failed. Back up important data before repair. For related storage and device maintenance, see /guides/phone-storage-full-safe-cleanup/ and /guides/organize-family-photo-archive/ on MURDILIMAX."
        ]
      ],
      "photoCaption": "Documentary photograph illustrating the subject; it does not show a verified malfunction. Photo: Santeri Viinamäki / Wikimedia Commons — CC BY-SA 4.0."
    },
    "ru": {
      "title": "Почему телефон медленно заряжается: что проверить сначала",
      "seoTitle": "Телефон медленно заряжается: 8 причин и что делать",
      "description": "Телефон стал медленно заряжаться? Проверьте кабель, блок питания, разъём, температуру и настройки аккумулятора без рискованных действий.",
      "subtitle": "Не спешите менять батарею: сначала отделите нормальную защиту аккумулятора от реальной неисправности.",
      "sections": [
        [
          "Проверьте скорость одинаковым способом",
          "Скорость зарядки зависит от уровня батареи, температуры, экрана, фоновых приложений и возможностей самого телефона. Часто устройство заряжается быстро при низком проценте и замедляется ближе к 100% — это предусмотренное поведение. Для сравнения запишите процент заряда, выключите экран, подключите исправный сетевой адаптер и проверьте результат через 15–20 минут. Повторите тест в похожих условиях. Оставшееся время зарядки на экране — приблизительный расчёт, а не гарантия."
        ],
        [
          "Проверьте кабель и блок питания",
          "Надпись «быстрая зарядка» на адаптере не гарантирует максимальную скорость именно для вашего телефона. Модель устройства, кабель и блок должны поддерживать совместимый режим питания. Попробуйте проверенный кабель и подходящий адаптер. Не используйте повреждённые, перегретые или перетёртые провода. Зарядка от старого USB-разъёма компьютера или автомобиля часто заметно слабее, чем от нормального сетевого блока. Поэтому не сравнивайте их напрямую."
        ],
        [
          "Осмотрите разъём без опасных инструментов",
          "В порту USB-C или Lightning может скапливаться пыль и ворс. Отсоедините провод и аккуратно осмотрите разъём при хорошем освещении. Не вставляйте металлические иглы, острые предметы и не лейте внутрь жидкость. Если штекер болтается, кабель держится только под углом, видна коррозия или повреждения, нужна диагностика в сервисе. Если телефон показывает предупреждение о влаге, следуйте инструкции производителя и не пытайтесь принудительно заряжать его."
        ],
        [
          "Не перегревайте телефон",
          "Во время быстрой зарядки выделяется тепло. Игры, видеосвязь, солнце и плотный чехол иногда заставляют систему снижать мощность. Оставьте телефон с выключенным экраном в прохладном проветриваемом месте. Не заряжайте под подушкой и не охлаждайте устройство в морозилке. При вздутии аккумулятора, запахе гари, треске или опасном нагреве безопаснее прекратить использование и обратиться к специалисту."
        ],
        [
          "Учитывайте настройки защиты аккумулятора",
          "На Android и iPhone могут работать адаптивная зарядка, ограничения до выбранного процента и другие защитные функции. Они намеренно меняют скорость или приостанавливают заряд. Проверьте раздел «Аккумулятор» в настройках и установите официальные обновления. Если зарядка идёт медленно только при просмотре видео или работе навигатора, часть энергии тратится прямо сейчас. Не отключайте полезную защиту батареи навсегда ради лишних минут."
        ],
        [
          "Когда пора в сервис",
          "Если зарядка остаётся медленной с двумя исправными комплектами кабелей и адаптеров, при выключенном экране и нормальной температуре, обратитесь на диагностику. Причина может быть в батарее, разъёме или контроллере питания — определить её без проверки нельзя. До ремонта сохраните резервную копию данных. Рядом по теме: /ru/guides/phone-storage-full-safe-cleanup/ и /ru/guides/organize-family-photo-archive/."
        ]
      ],
      "photoCaption": "Документальная фотография по теме статьи; она не показывает доказанную неисправность. Фото: Santeri Viinamäki / Wikimedia Commons — CC BY-SA 4.0."
    },
    "photoAsset": {
      "url": "https://commons.wikimedia.org/wiki/Special:Redirect/file/Charging%20smartphone.jpg?width=1200",
      "source": "https://commons.wikimedia.org/wiki/File:Charging_smartphone.jpg",
      "credit": "Santeri Viinamäki / Wikimedia Commons — CC BY-SA 4.0",
      "licenseLabel": "CC BY-SA 4.0",
      "license": "https://creativecommons.org/licenses/by-sa/4.0/"
    },
    "mediaAlt": {
      "en": "Smartphone connected to a charging cable",
      "ru": "Смартфон подключён к кабелю зарядки"
    }
  },
  {
    "id": "washing-machine-smells-cleaning-guide",
    "topic": "construction",
    "minutes": 7,
    "published": "2026-11-11",
    "updated": "2026-11-11",
    "image": "https://commons.wikimedia.org/wiki/Special:Redirect/file/Washing%20machine%20open.jpg?width=1200",
    "sources": [
      {
        "label": "Bosch — Causes of washing-machine laundry odours",
        "url": "https://www.bosch-home.com/us/owner-support/get-support/clothes-from-washing-machine-smell"
      },
      {
        "label": "Bosch — Cleaning a washing machine door seal",
        "url": "https://www.bosch-home.co.uk/customer-service/get-support/washing-machines/cleaning-door-seal"
      },
      {
        "label": "Bosch — How to clean the washer rubber seal",
        "url": "https://www.bosch-home.com/us/owner-support/get-support/support-selfhelp-washing-cleaning-the-washing-machine-seal"
      }
    ],
    "en": {
      "title": "Washing machine smells bad: how to clean it and prevent odours",
      "seoTitle": "Washing Machine Smells? Clean These 5 Places First",
      "description": "A smelly washing machine can make clean laundry smell musty. Check the door seal, drawer, drum and filter using safe maintenance steps.",
      "subtitle": "Find the source of musty laundry odours without mixing household cleaners or dismantling the machine.",
      "sections": [
        [
          "Identify where the smell starts",
          "Notice whether the smell comes from the drum, rubber door gasket, detergent drawer, drain area or the clothes after a cycle. Moisture combined with laundry soil and detergent residue provides conditions for unpleasant odours. Leaving wet clothes inside overnight can make the situation worse. Inspect visible surfaces before assuming there is a blocked pipe or expensive mechanical fault. A sewage-like smell that appears around several drains may indicate a plumbing issue, which requires a different investigation."
        ],
        [
          "Clean the rubber door seal",
          "For a front-loading machine, open the door and inspect the folds of the rubber gasket. Wipe away trapped lint, moisture and visible residue with a soft damp cloth, following the manufacturer's care instructions. Do not use sharp scrapers or aggressive cleaners that can damage the seal. Dry the folds after cleaning. If the seal is torn, persistently leaking or heavily contaminated beyond safe cleaning, ask a qualified service technician about replacement instead of pulling it apart yourself."
        ],
        [
          "Wash the drawer and follow the maintenance cycle",
          "Detergent and fabric conditioner can build up in a drawer and its channels. If your model allows removal, take out the drawer according to the manual, wash with warm water, clean reachable surfaces and dry it. Run the manufacturer-recommended drum cleaning or hot maintenance cycle, using only a product approved for that machine. Never mix bleach with vinegar, acids, ammonia or other cleaners. More detergent is not always cleaner: overdosing leaves residue and can worsen smells."
        ],
        [
          "Check the filter only when the manual permits",
          "Some washers have an accessible pump filter that collects lint and small objects; others use different designs. Read the model instructions before opening anything. Switch off power as directed, prepare a shallow tray and towels and remember that trapped water may be hot. If the panel is inaccessible or the machine leaks, do not improvise by unscrewing plumbing or tipping the machine. A blocked drain, damaged hose or persistent sewer odour may call for professional service."
        ],
        [
          "Prevent the smell from returning",
          "Remove washed clothes soon after a cycle. Wipe standing water from the gasket and leave the door and dispenser slightly open if the manufacturer's guidance and home safety allow it, keeping children and pets safe. Use a suitable detergent dose for water hardness and load size, avoid constant overdosing and schedule a maintenance cycle at the recommended interval. Check that garments are washed at a temperature appropriate for their labels and your machine."
        ],
        [
          "When cleaning is not enough",
          "If odours return after proper cleaning, especially together with poor draining, leaks, error codes or water remaining in the drum, stop guessing and arrange service. A blocked standpipe, siphon or machine component needs a specific fix. Maintain this as a seasonal household checklist rather than a one-time emergency. Related reading: /guides/find-water-leaks-home/ and /guides/window-condensation-explained/ address other common moisture problems."
        ]
      ],
      "photoCaption": "Documentary photograph illustrating the subject; it does not show a verified malfunction. Photo: Corn cheese / Wikimedia Commons — CC0 1.0."
    },
    "ru": {
      "title": "Стиральная машина неприятно пахнет: как убрать запах",
      "seoTitle": "Запах из стиральной машины: как очистить и убрать причину",
      "description": "Стиральная машина пахнет сыростью, а бельё после стирки несвежее? Проверьте манжету, лоток, барабан и фильтр безопасным способом.",
      "subtitle": "Найдите источник запаха и разберитесь, когда достаточно чистки, а когда нужен мастер.",
      "sections": [
        [
          "Определите, откуда идёт запах",
          "Проверьте, пахнет ли из барабана, резиновой манжеты, лотка для порошка, слива или только от белья. Остатки моющих средств, загрязнения и постоянная влажность способствуют появлению неприятного запаха. Если оставить мокрые вещи внутри на много часов, проблема усиливается. Не спешите считать виновным двигатель или насос: сначала осмотрите доступные места. Запах канализации одновременно из нескольких сливов может быть проблемой сантехники, а не самой машины."
        ],
        [
          "Очистите резиновую манжету",
          "У фронтальной машины откройте люк и осмотрите складки уплотнителя. Там могут оставаться вода, ворс и грязь. Протрите доступные поверхности мягкой влажной тканью так, как указано в инструкции производителя, затем просушите. Не используйте острые предметы и агрессивные составы: они повреждают резину. Если манжета порвана, протекает или загрязнение невозможно безопасно удалить, лучше обратиться в сервис, а не разбирать крепления самостоятельно."
        ],
        [
          "Промойте лоток и запустите очистку",
          "В отсеке для порошка и кондиционера со временем образуется налёт. Если инструкция позволяет, выньте лоток, промойте тёплой водой и высушите. Запустите штатную программу «Очистка барабана» или рекомендованный производителем цикл обслуживания. Пользуйтесь только разрешённым чистящим средством. Никогда не смешивайте хлорсодержащие средства с уксусом, кислотами или аммиаком — могут выделяться опасные пары. Избыточный порошок тоже оставляет налёт и усиливает проблему."
        ],
        [
          "Фильтр и слив: не разбирайте наугад",
          "У некоторых моделей есть доступный фильтр насоса, у других конструкция отличается. Перед открытием прочитайте инструкцию именно своей модели. Подготовьте тряпки и невысокую ёмкость: внутри может быть вода, иногда горячая. Отключение питания и порядок слива выполняйте по руководству. Если машина подтекает или фильтр не открывается нормально, не применяйте силу. Для засора трубы или неисправности насоса может понадобиться мастер."
        ],
        [
          "Как предупредить запах",
          "Доставайте бельё вскоре после окончания программы. Убирайте влагу с уплотнителя и при допустимых условиях оставляйте люк и лоток приоткрытыми для высыхания, учитывая безопасность детей и животных. Подбирайте дозировку порошка по жёсткости воды и объёму белья. Периодически запускайте предусмотренный производителем цикл очистки. Не стирайте всё подряд на минимальной температуре, если ярлыки вещей и инструкция допускают более подходящий режим."
        ],
        [
          "Когда нужен ремонт",
          "Если после чистки запах быстро возвращается, вода плохо уходит, появляются ошибки или течь, нужна отдельная диагностика слива или машины. Не стоит бесконечно лить чистящие средства. Похожие домашние проблемы рассмотрены в статьях /ru/guides/find-water-leaks-home/ и /ru/guides/window-condensation-explained/."
        ]
      ],
      "photoCaption": "Документальная фотография по теме статьи; она не показывает доказанную неисправность. Фото: Corn cheese / Wikimedia Commons — CC0 1.0."
    },
    "photoAsset": {
      "url": "https://commons.wikimedia.org/wiki/Special:Redirect/file/Washing%20machine%20open.jpg?width=1200",
      "source": "https://commons.wikimedia.org/wiki/File:Washing_machine_open.jpg",
      "credit": "Corn cheese / Wikimedia Commons — CC0 1.0",
      "licenseLabel": "CC0 1.0",
      "license": "https://creativecommons.org/publicdomain/zero/1.0/"
    },
    "mediaAlt": {
      "en": "Open washing machine photographed during a wash",
      "ru": "Открытая стиральная машина во время стирки"
    }
  }
];
