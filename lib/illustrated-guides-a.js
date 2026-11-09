// Ten illustrated EN/RU practical guides, first collection (five entries).
export const illustratedGuidesA = [
  {
    "id": "wifi-router-placement",
    "topic": "digital",
    "minutes": 6,
    "updated": "2026-11-09",
    "sources": [
      {
        "label": "Ofcom — Improving your Wi-Fi experience",
        "url": "https://www.ofcom.org.uk/phones-and-broadband/coverage-and-speeds/improving-your-wifi-experience"
      }
    ],
    "en": {
      "title": "Where to place a Wi-Fi router: a room-by-room coverage plan",
      "subtitle": "Improve dead zones by testing router position, walls and interference before spending money on new hardware.",
      "sections": [
        [
          "Check whether the problem is Wi-Fi or broadband",
          "Run a speed test near the router and, if possible, on a computer connected by Ethernet. Repeat the test in the room where you notice trouble and at several times of day. If the wired connection is also slow, contact your broadband provider or investigate the service before buying a repeater. If wired performance is fine but a distant bedroom has poor reception, work on wireless coverage instead. Keep a short note of download speed, connection stability and device location so you can compare changes."
        ],
        [
          "Start centrally and above floor level",
          "Routers generally send radio signals in several directions. Try placing yours on a stable open shelf, near the centre of the rooms that need service, rather than behind a television, under a desk or at the far edge of the building. Thick brick and concrete walls weaken signals; metal furniture, mirrors and aquariums may also interfere with coverage. Do not hide the router in a sealed cabinet that traps heat. Keep cables secure and make sure its ventilation openings remain free."
        ],
        [
          "Separate interference from distance",
          "Microwave ovens, baby monitors and cordless equipment may affect some wireless connections, particularly on the 2.4 GHz band. Move the router away from these devices and test again. When the router offers both 2.4 and 5 GHz bands, remember that the faster higher-frequency option may have a shorter useful range through walls. Automatic channel selection can help, but do not change several advanced settings at once. Make one adjustment, then revisit the same test locations to see whether it improved actual use."
        ],
        [
          "Decide between Ethernet, mesh and extenders",
          "A desk computer or television that stays in one place may work best with an Ethernet cable. For a large home, a mesh system with correctly located nodes can improve coverage, but every additional wireless hop has limits. A cheap repeater placed in a room that already has almost no signal cannot magically create a strong connection. Put an extender where it still receives good service from the main router and check whether the resulting speed and latency are acceptable. In rental homes, avoid drilling or permanent cabling without permission."
        ],
        [
          "Verify the result and keep the network secure",
          "Retest each problem room while making a video call or using another activity that previously failed. Update router firmware using the manufacturer's official instructions, choose WPA2-AES or WPA3 where supported, and change default administrator credentials. Never turn off Wi-Fi security to gain a little speed. If connections drop only on one device, update its wireless software before replacing the router. Write down the final router position and the measurements so you can identify future regressions."
        ]
      ]
    },
    "ru": {
      "title": "Где поставить Wi-Fi-роутер: улучшаем покрытие по комнатам",
      "subtitle": "Как устранить зоны слабого сигнала, проверить стены и помехи и не покупать оборудование раньше времени.",
      "sections": [
        [
          "Отделите проблему Wi-Fi от проблемы провайдера",
          "Сначала измерьте скорость рядом с роутером и, если возможно, на компьютере, подключённом сетевым кабелем. Повторите тест в комнате, где связь пропадает, и в разное время суток. Если по кабелю тоже медленно, сначала разберитесь с тарифом, линией или оборудованием провайдера. Если кабель работает нормально, а дальняя комната почти не ловит сеть, проблема скорее в покрытии Wi-Fi. Запишите скорость, стабильность соединения и место каждого замера: так будет проще объективно оценить перестановку."
        ],
        [
          "Выберите открытое место ближе к центру квартиры",
          "Роутер обычно распространяет сигнал во многих направлениях. Попробуйте поставить его на устойчивую открытую полку, ближе к середине помещений, где нужен интернет. Не прячьте устройство за телевизором, в металлическом шкафу или на полу в самом дальнем углу. Толстые кирпичные и бетонные стены ослабляют радиоволны; металлическая мебель и аквариумы тоже могут мешать. При этом не закрывайте вентиляционные отверстия роутера и позаботьтесь о безопасном расположении проводов."
        ],
        [
          "Проверьте помехи и разницу между частотами",
          "Микроволновка, радионяня и некоторые беспроводные устройства могут мешать сети, особенно в диапазоне 2,4 ГГц. Переставьте роутер подальше и повторите замер. Диапазон 5 ГГц часто обеспечивает высокую скорость поблизости, но хуже проходит через препятствия. Автоматический выбор канала иногда помогает, однако не стоит менять десяток настроек одновременно. Сделайте одно изменение, снова проверьте те же комнаты и отметьте, стало ли лучше в реальных задачах: звонках, загрузках и просмотре видео."
        ],
        [
          "Когда поможет кабель, усилитель или mesh-система",
          "Стационарный компьютер и телевизор можно подключить Ethernet-кабелем — это часто надёжнее радиосвязи. Для большой квартиры или дома может пригодиться mesh-система с правильно установленными узлами. Простой повторитель не создаст качественный интернет, если сам стоит там, где почти нет сигнала: ему нужно получать устойчивую связь от основного роутера. Оцените не только число делений Wi-Fi, но и скорость, задержку и стабильность. В арендованном жилье заранее согласуйте любые отверстия и постоянную прокладку кабелей."
        ],
        [
          "Зафиксируйте улучшение и проверьте безопасность",
          "Повторите тест во всех проблемных комнатах, желательно во время видеозвонка или другой привычной нагрузки. Установите обновления прошивки по инструкции производителя, используйте WPA2-AES либо WPA3 при поддержке устройств и поменяйте стандартный пароль администратора. Не отключайте шифрование сети ради нескольких мегабит. Если обрывы происходят только на одном ноутбуке, сначала проверьте его драйвер и настройки. Сохраните итоговые результаты замеров, чтобы позже легко понять, когда качество связи снова изменилось."
        ]
      ]
    }
  },
  {
    "id": "laptop-overheating-checklist",
    "topic": "tech",
    "minutes": 6,
    "updated": "2026-11-09",
    "sources": [
      {
        "label": "Dell Support — How to Prevent Overheating",
        "url": "https://www.dell.com/support/contents/en-us/article/product-support/self-support-knowledgebase/battery-and-power/fan"
      }
    ],
    "en": {
      "title": "Laptop running hot? A safe overheating troubleshooting checklist",
      "subtitle": "Distinguish normal fan noise from blocked airflow, heavy background tasks and faults that need professional service.",
      "sections": [
        [
          "Look for a pattern instead of guessing a temperature",
          "A warm laptop during a game or video export is not necessarily broken. Sudden shutdowns, severe slowdowns, repeated thermal warnings or an unusually loud fan when idle deserve attention. Note whether the problem happens while charging, during a specific application, or only on a bed or sofa. If the case is excessively hot, you notice an unusual smell, or the battery looks swollen, stop using and charging the device and seek qualified service. Do not try to puncture or press on a swollen battery."
        ],
        [
          "Give the air vents room to work",
          "Switch to a firm, flat surface that does not cover the intake and exhaust openings. Soft bedding and cushions can trap heat and block fan vents. Check the manufacturer's diagram to locate the air path, especially on thin laptops where the openings may be underneath or near the hinge. Keep liquids and loose objects away from the equipment. When switching from a blanket to a desk noticeably reduces fan noise, you have already found a useful part of the problem without taking the case apart."
        ],
        [
          "Inspect background load and power settings",
          "Open the operating system's task manager or activity monitor and look for a program using a large share of CPU or graphics resources while you are doing very little. Close unnecessary tasks, allow legitimate updates to finish, and check whether unwanted software is running. An energy-saving or balanced power setting can reduce heat compared with a maximum-performance profile. Do not disable the cooling fan, throttle safety systems or install random utilities promising impossible temperature reductions. Test again with the same application after each adjustment."
        ],
        [
          "Clean only what can be cleaned safely",
          "Shut the laptop down, disconnect power and inspect visible vents for dust. Follow the manufacturer's cleaning instructions; many vendors recommend carefully applied canned air while warning against ordinary vacuum cleaners or forceful blowers that may damage components. Do not insert objects deep into the fan or spray liquids inside. If opening the case may void service terms or you are unsure how the battery is attached, do not disassemble it yourself. Professional cleaning may be appropriate after years of accumulated lint."
        ],
        [
          "Know when software updates or service are the next step",
          "Install appropriate operating-system, driver and firmware updates from the device maker, following its power and backup precautions. Some models provide built-in fan diagnostics; use those before assuming the processor is defective. If the fan grinds, never spins, or the laptop shuts down repeatedly on a hard surface with low workload, arrange servicing. Back up important documents before a repair. A cooling pad can help airflow in some situations but cannot replace a failed fan or fix a damaged heat sink."
        ]
      ]
    },
    "ru": {
      "title": "Ноутбук сильно греется: безопасная проверка по шагам",
      "subtitle": "Как отличить обычную работу вентилятора от пыли, программной нагрузки и неисправности системы охлаждения.",
      "sections": [
        [
          "Сначала найдите закономерность, а не случайную цифру температуры",
          "Нагрев во время игры или обработки видео не обязательно означает поломку. Но внезапные выключения, сильные тормоза, предупреждения о перегреве и шум вентилятора при простое требуют проверки. Запишите, когда это происходит: при зарядке, в конкретной программе или только на кровати. Если корпус необычно раскалён, появился странный запах либо аккумулятор вздулся, прекратите пользоваться устройством и заряжать его, обратитесь в сервис. Не пытайтесь прокалывать или прижимать вздувшуюся батарею."
        ],
        [
          "Освободите отверстия для забора и выхода воздуха",
          "Поставьте ноутбук на твёрдый ровный стол, а не на одеяло или диванную подушку. Мягкая ткань нередко перекрывает вентиляционные решётки и удерживает тепло. Найдите расположение воздухозаборников по инструкции к конкретной модели: у тонких ноутбуков они могут быть снизу или около шарнира. Уберите жидкости и мелкие предметы, которые способны попасть внутрь. Если после переноса на стол вентилятор заметно затих, это уже полезная диагностическая подсказка без разборки устройства."
        ],
        [
          "Проверьте процессы и режим энергопотребления",
          "Откройте диспетчер задач или системный монитор и посмотрите, не использует ли какая-то программа процессор либо видеокарту почти полностью в простое. Закройте ненужные задачи, дождитесь завершения легитимных обновлений, проверьте неизвестное программное обеспечение. Сбалансированный или энергосберегающий режим иногда уменьшает нагрев по сравнению с максимальной производительностью. Не отключайте защиту от перегрева и вентиляторы ради тишины. Меняйте по одной настройке и проверяйте результат в одинаковых условиях."
        ],
        [
          "Удаляйте пыль только безопасным способом",
          "Выключите устройство, отсоедините питание и осмотрите доступные вентиляционные отверстия. Руководствуйтесь инструкцией производителя: некоторые рекомендуют аккуратное применение баллона со сжатым воздухом, но предупреждают об опасности обычных пылесосов и мощных воздуходувок. Не просовывайте внутрь металлические предметы и не распыляйте жидкости. Если разборка сложная или затрагивает аккумулятор и гарантию, не экспериментируйте. После нескольких лет эксплуатации профессиональная чистка системы охлаждения бывает разумнее случайного ремонта."
        ],
        [
          "Определите признаки неисправности, требующей сервиса",
          "Установите подходящие обновления системы, драйверов и прошивки только из официальных источников, соблюдая инструкции по резервному копированию и питанию. У некоторых моделей есть встроенная диагностика вентилятора. Если он скрежещет, перестал вращаться или ноутбук выключается даже на столе при небольшой нагрузке, обратитесь к специалисту. Сохраните важные файлы перед ремонтом. Охлаждающая подставка может улучшить циркуляцию воздуха, но не заменит сломанный вентилятор или повреждённый радиатор."
        ]
      ]
    }
  },
  {
    "id": "freezer-food-storage",
    "topic": "cooking",
    "minutes": 6,
    "updated": "2026-11-09",
    "sources": [
      {
        "label": "FoodSafety.gov — Cold Food Storage Chart",
        "url": "https://www.foodsafety.gov/food-safety-charts/cold-food-storage-charts"
      }
    ],
    "en": {
      "title": "Freezer organization and food safety: temperatures, labels and thawing",
      "subtitle": "Reduce food waste with a practical freezer system that separates safety from quality and makes frozen meals easy to find.",
      "sections": [
        [
          "Check the temperature instead of trusting the dial",
          "A household freezer is generally set to 0°F (−18°C) or colder for safe long-term frozen storage. Use a freezer thermometer if the appliance has no reliable display. Food kept continuously frozen at that temperature can remain safe, although texture and flavor decline over time; storage charts usually describe quality, not a deadline when everything suddenly becomes unsafe. A faulty door seal, frequent thawing or an overloaded warm appliance can change the picture. Check the current FoodSafety.gov table for individual food recommendations."
        ],
        [
          "Pack food in portions and remove excess air",
          "Use freezer-suitable containers or bags that close tightly. Divide cooked meals into meal-size portions and label the contents and freezing date. Expel excess air where appropriate to help limit freezer burn, which primarily affects quality. Avoid putting a very large pot of hot food straight into a crowded freezer: cool it safely using shallow containers and follow food-safety guidance for prompt refrigeration. Keep raw products contained so their juices cannot contaminate ready-to-eat foods while packing or thawing."
        ],
        [
          "Group similar foods and keep a simple list",
          "Assign zones for vegetables, bread, meat, cooked meals and ingredients used for quick dinners. Keep newer items behind older ones when practical. A washable marker on bags or a short note on your phone saves time when boxes are opaque. Do not block the cooling vents identified by the appliance maker. If the freezer has drawers, use them for stable categories rather than stacking loose packages that fall when the door opens. Schedule a brief inventory before shopping so you use what you already have."
        ],
        [
          "Thaw safely, not on the kitchen counter",
          "The safest routine for many foods is thawing in the refrigerator. Other approved methods include cold water with appropriate handling or a microwave when the food will be cooked immediately. Leaving raw meat on the counter for hours creates conditions for bacterial growth even while the center remains icy. Follow food-specific instructions and check safe cooking temperatures with a food thermometer. Do not taste questionable food to judge safety. If the freezer loses power, consult official outage guidance before deciding what to keep or discard."
        ],
        [
          "Inspect regularly and treat dates correctly",
          "Use the manufacturer's guidance to clean seals and manage frost. A package covered in ice crystals or showing freezer burn may taste worse, but those signs alone do not prove dangerous bacterial growth. A package that thawed and stayed warm is a different issue and may need disposal. Check FoodSafety.gov for food-specific quality periods rather than applying one number to everything. When in doubt about temperature history or contamination, discard the food instead of gambling on a sniff test."
        ]
      ]
    },
    "ru": {
      "title": "Как хранить продукты в морозилке: температура, упаковка и разморозка",
      "subtitle": "Понятная система хранения, которая помогает уменьшить пищевые отходы и не путать срок качества с безопасностью.",
      "sections": [
        [
          "Проверьте температуру, а не только положение регулятора",
          "Для домашней морозилки обычно рекомендуют температуру −18 °C (0 °F) или ниже. Если нет точного дисплея, пригодится отдельный термометр. Еда, которая непрерывно оставалась замороженной при такой температуре, может сохранять безопасность долго, но вкус и текстура со временем ухудшаются. Сроки в таблицах хранения чаще относятся к качеству продукта, а не к моменту, когда вся еда мгновенно становится опасной. Неисправный уплотнитель, частые оттаивания и перегрев техники требуют отдельного внимания. Для разных продуктов сверяйтесь с официальной таблицей FoodSafety.gov."
        ],
        [
          "Фасуйте порции и подписывайте пакеты",
          "Выбирайте контейнеры и пакеты, предназначенные для замораживания и плотно закрывающиеся. Делите готовую еду на удобные порции, указывайте содержимое и дату. По возможности убирайте лишний воздух из упаковки: это помогает уменьшить морозильный ожог, который прежде всего ухудшает качество. Не ставьте огромную кастрюлю горячей еды в забитую морозилку: безопасно охладите её в неглубоких ёмкостях, соблюдая сроки охлаждения и хранения. Сырое мясо упаковывайте отдельно, чтобы сок не попадал на готовые продукты."
        ],
        [
          "Разложите продукты по категориям и ведите короткий список",
          "Выделите зоны для овощей, хлеба, мяса, готовых блюд и небольших заготовок. Более старые пакеты старайтесь располагать впереди. Маркер на упаковке или список в заметках экономит время, когда коробки непрозрачные. Не перекрывайте вентиляционные каналы, предусмотренные производителем техники. Если есть выдвижные ящики, организуйте их по назначению, а не складывайте всё в одну неустойчивую стопку. Перед покупкой продуктов быстро просматривайте запасы, чтобы не замораживать повторно то, о чём давно забыли."
        ],
        [
          "Размораживайте безопасно, а не часами на столе",
          "Для многих продуктов самый предсказуемый способ — медленное оттаивание в холодильнике. Размораживание в холодной воде или микроволновке требует соблюдения правил, а после микроволновки продукт обычно нужно готовить сразу. Сырое мясо, оставленное на столешнице на несколько часов, может становиться опасным снаружи, даже если внутри ещё лёд. Следуйте инструкции для конкретного продукта, проверяйте готовность еды термометром. При длительном отключении электричества используйте официальные рекомендации, а не только собственное обоняние."
        ],
        [
          "Проверяйте уплотнитель и различайте потери качества и порчу",
          "Периодически очищайте уплотнитель дверцы и удаляйте наледь по инструкции к технике. Ледяные кристаллы и пересушенные участки могут указывать на ухудшение вкуса и текстуры, но сами по себе не доказывают опасность. Другая ситуация — продукт, который оттаял и долго был тёплым: его безопасность зависит от температуры и времени. Не назначайте всем продуктам один одинаковый срок, пользуйтесь таблицей для конкретного вида еды. При неизвестной истории хранения или подозрении на загрязнение лучше отказаться от продукта."
        ]
      ]
    }
  },
  {
    "id": "start-seeds-indoors",
    "topic": "plants",
    "minutes": 6,
    "updated": "2026-11-09",
    "sources": [
      {
        "label": "Royal Horticultural Society — How to Sow Seeds Indoors",
        "url": "https://www.rhs.org.uk/propagation/how-to-sow-seeds-indoors"
      }
    ],
    "en": {
      "title": "Starting seeds indoors: light, watering and stronger seedlings",
      "subtitle": "Plan an indoor sowing tray without leggy plants, waterlogged roots or transplant shock.",
      "sections": [
        [
          "Read the seed packet before choosing a date",
          "Different plants need different temperatures, germination times and final outdoor conditions. A seed packet or reliable plant guide will tell you whether to sow indoors at all and roughly when to transplant. Starting too early can leave fast-growing seedlings crowded indoors long before frost risk has passed. Note the expected last frost for your area and count backwards using the crop's guidance, rather than copying a calendar from a different climate. Label the containers with species, variety and sowing date so similar seedlings do not get mixed up."
        ],
        [
          "Use clean containers with drainage",
          "Seed trays or small pots need drainage holes. Fill them with suitable seed compost and moisten the medium without turning it into a swamp. Follow the seed packet for sowing depth: some seeds need only a fine covering, and others require light to germinate. Use clean containers to reduce disease risk. Recycled food containers can work if thoroughly washed and given drainage. Covering a tray may help retain moisture during germination, but remove or vent the covering as soon as seedlings appear to limit stagnant, damp conditions."
        ],
        [
          "Provide enough light as growth begins",
          "A warm windowsill can encourage germination, but young seedlings also need sufficient light. Thin pale stems leaning heavily toward the glass often indicate insufficient lighting, especially in winter. Move plants to a brighter safe location or use a suitable grow light following the device's instructions; do not place hot lamps directly against leaves. Turn trays where needed so growth stays balanced. Avoid sudden moves from low indoor light to intense direct sun because leaves may scorch. The goal is compact sturdy plants, not the tallest shoots."
        ],
        [
          "Water carefully and thin crowded plants",
          "Check the surface of the compost and the weight of the tray before watering. Gentle bottom watering or a fine spray avoids washing small seeds out of place. Allow excess water to drain; continuously soaked roots can suffer, and stagnant air encourages disease. As seedlings produce true leaves, thin or transplant them according to spacing instructions so they are not fighting for light. Handle delicate plants by a leaf rather than squeezing their stems and use containers large enough for the developing roots."
        ],
        [
          "Harden off before planting outdoors",
          "Indoor plants need time to adjust to wind, cooler nights and stronger sunlight. When local weather and the species allow, gradually expose seedlings to outdoor conditions over several days, starting in a sheltered spot and increasing the time. Bring them back inside if frost or damaging wind is expected. Water after transplanting and monitor the first week rather than assuming every plant will establish immediately. Keep a note of which varieties thrived and which stretched or suffered from excess moisture, so next year's sowing plan improves."
        ]
      ]
    },
    "ru": {
      "title": "Как вырастить крепкую рассаду дома: посев, свет и полив",
      "subtitle": "Практический план для посева семян: правильные сроки, дренаж, подсветка и подготовка растений к пересадке.",
      "sections": [
        [
          "Сначала посмотрите на пакетик семян и местные заморозки",
          "Разные культуры требуют своей температуры, глубины посева и сроков пересадки. На упаковке или в надёжном справочнике обычно указано, нужно ли вообще выращивать вид через рассаду. Если посеять слишком рано, сеянцы перерастут контейнеры задолго до высадки в грунт. Уточните обычные сроки последних заморозков для своего региона и рассчитайте дату посева с учётом конкретного растения, а не случайного календаря из другой страны. Подписывайте горшки названием культуры, сортом и датой, чтобы не перепутать похожие ростки."
        ],
        [
          "Возьмите чистые ёмкости с отверстиями для воды",
          "Посевные кассеты и стаканчики должны иметь дренаж. Используйте подходящий рыхлый субстрат и увлажните его без образования болота. Глубину заделки определяйте по инструкции: некоторым семенам нужна только тонкая присыпка, а отдельные виды лучше всходят на свету. Чистые ёмкости снижают риск инфекций. Пищевые контейнеры можно использовать повторно, если хорошо вымыть и сделать отверстия. Прозрачная крышка помогает удерживать влагу при прорастании, но после появления сеянцев её обычно убирают или приоткрывают."
        ],
        [
          "Обеспечьте свет с первых дней после всходов",
          "Тёплый подоконник может помочь семенам прорасти, но маленьким растениям также нужен свет. Бледные вытянутые стебли, сильно наклоняющиеся к окну, часто указывают на его нехватку, особенно зимой. Переставьте рассаду в более светлое место или используйте подходящую фитолампу по инструкции. Не подносите горячий светильник вплотную к листьям. Поворачивайте контейнеры, если растения явно тянутся в одну сторону. Не переносите слабые ростки сразу под жёсткое прямое солнце: резкая перемена может вызвать ожоги."
        ],
        [
          "Поливайте аккуратно и вовремя прореживайте",
          "Проверяйте верхний слой грунта и вес контейнера, прежде чем добавлять воду. Полив снизу или мелкий распылитель помогает не вымывать маленькие семена. Давайте лишней влаге стекать: постоянно мокрые корни и застой воздуха повышают риск проблем. Когда появятся настоящие листья, проредите посевы или рассадите растения с учётом рекомендованного расстояния. Перемещая нежный сеянец, лучше осторожно держать его за лист, а не сдавливать стебель. Выбирайте объём горшка по мере развития корней."
        ],
        [
          "Закаляйте растения перед высадкой на улицу",
          "Домашняя рассада должна постепенно привыкнуть к ветру, более прохладным ночам и сильному свету. Если погода и культура позволяют, выносите её на улицу сначала ненадолго в защищённое место, а затем увеличивайте время. При угрозе заморозков или сильного ветра возвращайте растения в помещение. После пересадки полейте и наблюдайте за состоянием в первую неделю. Записывайте, какие сорта росли хорошо, а какие вытягивались или страдали от перелива: эти заметки помогут подготовить следующий сезон."
        ]
      ]
    }
  },
  {
    "id": "rain-garden-at-home",
    "topic": "nature",
    "minutes": 7,
    "updated": "2026-11-09",
    "sources": [
      {
        "label": "US EPA — Soak Up the Rain: Rain Gardens",
        "url": "https://www.epa.gov/soakuptherain/soak-rain-rain-gardens"
      },
      {
        "label": "Massachusetts CZM — Rain Gardens for Homeowners",
        "url": "https://www.mass.gov/info-details/stormwater-solutions-for-homeowners-fact-sheet-rain-gardens"
      }
    ],
    "en": {
      "title": "Rain garden basics: where roof runoff can safely soak into the ground",
      "subtitle": "Plan a planted rain garden with sensible siting, overflow routes and low-maintenance vegetation.",
      "sections": [
        [
          "Understand the purpose before digging",
          "A rain garden is a shallow planted depression that temporarily collects runoff from a roof or paved surface so water can soak into suitable soil. It is not a permanent pond and cannot solve every drainage problem. Correctly designed gardens can reduce water running toward storm drains and help filter pollutants. Before starting, walk outside during rain to identify where water naturally moves and whether it pools near a building. Photograph the flow and note where safe overflow could go in a very heavy storm."
        ],
        [
          "Choose a safe site away from vulnerable structures",
          "Avoid locations right beside house foundations, wells, septic systems, underground services or unstable slopes. Local guidance sets different minimum distances and setbacks; the Massachusetts homeowner fact sheet, for example, gives specific separation recommendations. Check your municipality's standards and call the appropriate utility-marking service before digging. Do not redirect runoff onto a neighbor's plot or a public pavement. If the yard is already saturated for long periods, a conventional rain garden may not be appropriate without professional drainage advice."
        ],
        [
          "Test drainage and plan for overflow",
          "The soil must drain the stored water within a suitable period so the garden does not become a stagnant pond. Simple observation after rain helps, but a proper infiltration test and local design guidance are better for deciding size and construction depth. Sketch the source of incoming runoff, a shallow sloped inlet and a safe overflow route for storms larger than the design can handle. Avoid excavating into utilities or damaging tree roots. Never assume that a decorative flower bed with no overflow can manage water from an entire roof."
        ],
        [
          "Select plants for wet and dry periods",
          "Rain-garden plants may face wet soil immediately after a storm and dry spells between events. Choose species suited to your region, light conditions, soil and expected water depth. Local native grasses, sedges and flowering perennials often provide resilient choices and support wildlife, but verify each plant's invasiveness and suitability before planting. Group plants with compatible moisture needs and leave room for mature size. Mulch carefully to limit erosion while keeping inlets and drains clear."
        ],
        [
          "Maintain the garden and inspect after storms",
          "Look for blocked inlets, sediment buildup, erosion, standing water that does not recede and damage to nearby paths or foundations. Remove litter and invasive plants, replace dead vegetation and direct overflow safely. New plants need extra care until roots establish. Observe several rain events before claiming the system works. A rain garden is a small landscape water-management feature, not a substitute for repairing leaking drains, grading problems or a failing foundation."
        ]
      ]
    },
    "ru": {
      "title": "Дождевой сад на участке: куда отвести воду с крыши",
      "subtitle": "Как спланировать цветник для дождевой воды, учесть грунт, безопасный перелив и расстояния до строений.",
      "sections": [
        [
          "Разберитесь, для чего нужен дождевой сад",
          "Дождевой сад — это неглубокое понижение с растениями, куда временно поступает вода с кровли или дорожки и постепенно впитывается в подходящий грунт. Это не постоянный пруд и не универсальное средство от подтопления. При грамотном устройстве такая клумба уменьшает поверхностный сток и помогает задерживать часть загрязнений. Во время дождя посмотрите, по каким дорожкам течёт вода и где она скапливается. Сфотографируйте проблемные места и заранее подумайте, куда безопасно уйдёт избыток воды при сильном ливне."
        ],
        [
          "Выберите место вдали от фундамента и коммуникаций",
          "Не устраивайте водосбор прямо у стен дома, колодца, септика, подземных сетей или неустойчивого склона. Точные расстояния зависят от местных правил и устройства участка: например, в американских рекомендациях для домовладельцев приводятся отдельные минимальные отступы. Перед земляными работами уточните расположение подземных коммуникаций и требования муниципалитета. Не направляйте сток к соседям или на общественный тротуар. Если грунт и так долго остаётся мокрым, без консультации специалиста такая конструкция может усилить проблему."
        ],
        [
          "Проверьте впитывание воды и предусмотрите перелив",
          "Вода должна уходить из понижения достаточно быстро, чтобы там не образовался застойный пруд. Наблюдение после дождя даёт первые подсказки, но для выбора размеров лучше провести испытание грунта и использовать местные рекомендации по дренажу. Нарисуйте схему: источник стока, пологий вход в клумбу и безопасное направление перелива на случай сильного ливня. Не копайте над кабелями и не повреждайте корни крупных деревьев. Обычная декоративная клумба без выхода лишней воды не рассчитана на сток со всей крыши."
        ],
        [
          "Посадите виды, которые выдерживают сырость и засуху",
          "После дождя грунт может быть влажным, а между осадками — пересыхать. Подбирайте виды по климату, освещению, составу почвы и глубине временного затопления. Местные злаки, осоки и цветущие многолетники часто подходят, но нужно проверить, не являются ли они инвазивными и действительно ли выдерживают условия участка. Сажайте растения группами с похожими требованиями к влаге и оставляйте место для будущего роста. Мульча помогает снизить эрозию, однако не должна перекрывать вход и выход воды."
        ],
        [
          "Проверяйте сад после каждого заметного ливня",
          "Смотрите, не забился ли вход мусором, не размывается ли почва и не стоит ли вода слишком долго. Удаляйте сорняки и наносы, заменяйте погибшие растения и следите, чтобы перелив не подмывал дорожку или фундамент. Молодым посадкам потребуется дополнительный уход, пока корни не укрепятся. Оценивать эффективность лучше по нескольким дождям, а не по одному удачному дню. Дождевой сад дополняет грамотный водоотвод, но не заменяет ремонт протекающих труб, уклонов и повреждений основания дома."
        ]
      ]
    }
  }
];
