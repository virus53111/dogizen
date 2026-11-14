// Original globally useful EN/RU guides (2026): battery diagnostics, fare-cost comparisons and Four-in-Hand technique. All real photograph licences verified; source-backed tables and step-by-step panels.
export const globalLifetimeGuides = [
  {
    "id": "why-phone-battery-drains-fast-fix",
    "topic": "digital",
    "minutes": 9,
    "published": "2026-11-14",
    "updated": "2026-11-14",
    "photoAsset": {
      "url": "https://commons.wikimedia.org/wiki/Special:Redirect/file/Charging%20smartphone%20with%20powerbank%2020180312.jpg?width=1200",
      "source": "https://commons.wikimedia.org/wiki/File:Charging_smartphone_with_powerbank_20180312.jpg",
      "credit": "Santeri Viinamäki / Wikimedia Commons — CC BY-SA 4.0 (original photograph; resized/cropped for MURDILIMAX)",
      "licenseLabel": "CC BY-SA 4.0",
      "license": "https://creativecommons.org/licenses/by-sa/4.0/"
    },
    "mediaAlt": {
      "en": "Authentic photograph of a smartphone charging using a portable power bank",
      "ru": "Подлинная фотография зарядки смартфона от внешнего аккумулятора (пауэрбанка)"
    },
    "sources": [
      {
        "label": "Apple Support — If the battery in your iPhone or iPad drains too quickly (2026)",
        "url": "https://support.apple.com/en-euro/120745"
      },
      {
        "label": "Apple Support — Understand your iPhone battery usage and health",
        "url": "https://support.apple.com/guide/iphone/understand-iphone-battery-usage-health-iphd453d043a/27/ios/27"
      },
      {
        "label": "Google Android Help — Get the most life from your Android device's battery",
        "url": "https://support.google.com/android/answer/7664692"
      },
      {
        "label": "Samsung Support — Why Galaxy batteries drain faster",
        "url": "https://www.samsung.com/us/support/troubleshoot/TSG10013631/"
      }
    ],
    "en": {
      "title": "Why Is My Phone Battery Draining So Fast? Android and iPhone Fixes",
      "seoTitle": "Phone Battery Draining Fast? Diagnose iPhone & Android",
      "description": "Phone battery draining too fast? Find the real cause on iPhone or Android, check app usage, fix background drain, poor signal and worn battery symptoms.",
      "subtitle": "Don't install a random booster or reset your phone first. Battery charts, signal quality and a few safe checks usually tell you what to investigate.",
      "factTable": {
        "title": "Match the symptom to the first useful test",
        "headers": [
          "Symptom",
          "Possible explanation",
          "Check first"
        ],
        "rows": [
          [
            "Drops while screen is off",
            "Background activity, sync or weak signal",
            "Battery app/activity chart"
          ],
          [
            "Much worse after an update",
            "Temporary indexing or a malfunctioning app",
            "Wait briefly, check usage and update apps"
          ],
          [
            "Fast drain with navigation or video",
            "Bright screen, radios, GPS and demanding apps",
            "Screen time and display settings"
          ],
          [
            "Unexpected shutdown or poor battery health",
            "Aging battery or hardware fault",
            "Official battery health/diagnostics"
          ]
        ]
      },
      "stepGuide": {
        "title": "A five-minute battery diagnostic",
        "intro": "Follow the evidence before changing settings. Menu names vary by model and software.",
        "steps": [
          [
            "Check the chart",
            "Open Settings → Battery and identify top apps or system activity."
          ],
          [
            "Look at screen time",
            "Compare on-screen use with consumption while the screen was off."
          ],
          [
            "Check signal and heat",
            "Poor reception, hotspot use and heat can change battery demand."
          ],
          [
            "Try one safe change",
            "Reduce brightness, update a faulty app or use power saving; compare again."
          ],
          [
            "Assess battery health",
            "If capacity is degraded or shutdowns persist, arrange a professional check."
          ]
        ]
      },
      "sections": [
        [
          "Start with the battery usage chart—not a guess",
          "When a phone suddenly lasts only half a day, the cause may be a heavily used application, poor network reception, a recent update or an aging battery. The quickest starting point is the battery usage chart. On iPhone, open Settings → Battery to see recent energy consumption and which apps ran on screen or in the background. On Android, look in Settings → Battery or Battery usage; the exact menu varies by phone brand. Apple and Google both recommend identifying actual usage before trying broad fixes. Compare similar days: a day with hours of video calls cannot fairly be measured against one spent idle. Look for a new app, unusually high background activity or sharp battery drops without visible use. Resist installing a mystery 'battery repair' app: software cannot restore chemically lost lithium-ion capacity. Write down the circumstances before changing several settings at once."
        ],
        [
          "Why the battery drains when the screen is off",
          "A locked phone can still upload photos, synchronize email, download updates, locate itself, receive notifications and maintain a cellular connection. Some activity is expected. A battery chart that shows unusually high consumption with little screen use can point to a syncing loop, misbehaving app or poor reception. Apple labels background activity and periods with low cellular coverage in its battery reporting. Samsung also explains that unstable network signal can increase power demand. Try checking whether a single app is continuously active, whether a cloud photo backup is processing a large library and whether the phone is frequently searching for service. Update the affected app and restart once; if appropriate, restrict a rarely used app's background activity. Do not disable essential notifications, accessibility features or backup indiscriminately. Confirm any improvement over comparable periods rather than concluding from one isolated percentage reading."
        ],
        [
          "Screen brightness, GPS, video and cellular coverage",
          "The display is often a major energy consumer, especially at high brightness with long screen-on time. Navigation, gaming, a mobile hotspot, video calls and high-resolution streaming also place sustained demands on the processor and radios. Weak cellular reception makes the device work harder to maintain a usable connection; switching between coverage areas can contribute to drain. Apple's 2026 support guidance suggests auto-brightness, auto-lock and checking whether weak signal or high brightness appears in battery Insights. Samsung describes power-saving and screen settings that help reduce load when appropriate. Start with practical adjustments: shorten screen timeout, turn on adaptive brightness, stop an unused hotspot and use a stable available network. Do not turn off location permission for navigation or emergency features while you rely on them. A dark theme may help some OLED devices, but it is not a universal cure for a physically worn battery."
        ],
        [
          "What changes after installing an update or a new phone",
          "A newly configured phone or one that has just received a major update may spend time indexing photos, restoring backups and finishing installation tasks. Apple notes that battery use can temporarily rise during background activities after updates, and Samsung says new phones may optimize services over their first days. That does not mean every persistent drain should be dismissed as normal. Give the device a reasonable period for setup to finish while it can charge safely, then review the Battery screen and install official app patches. If one application became problematic after an update, check its developer's support notes and consider reducing its background permissions. Keep the operating system current, but avoid repeatedly reinstalling everything without evidence. A factory reset deletes local data and should only be considered after backing up and following manufacturer guidance. Document a reproducible problem if you need professional support."
        ],
        [
          "Battery health: when settings will not solve the problem",
          "Rechargeable lithium-ion batteries wear down gradually with charge cycles and age. A substantially worn cell may hold less energy than it did when new; the phone can also shut down unexpectedly when the battery cannot deliver power under load. On supported iPhones, Apple provides Battery Health information in Settings → Battery, with the menu varying by generation. Samsung Members offers diagnostic tests on supported Galaxy devices, and some Android manufacturers publish their own service tools. A health estimate is useful but not an absolute guarantee: consider abrupt shutdowns, charging irregularities and excessive heat as well. If the device becomes very hot during light use, visibly swells or shows battery deformation, stop using and charging it and seek qualified service. Do not puncture, compress or attempt to repair a swollen battery. Replacing a degraded battery professionally often makes more sense than buying a new phone solely because battery life has become poor."
        ],
        [
          "An efficient routine and links for related problems",
          "For the next few days, compare similar usage and make one change at a time: update a problematic app, enable power saving for long journeys or reduce unnecessary screen activity. Record your battery level before and after a realistic interval, and do not confuse a changing percentage indicator with an exact laboratory measurement. Leave secure backups enabled if they protect important photos, but schedule large transfers while charging and on suitable connectivity when possible. If nothing helps, check official diagnostics or contact the device maker rather than relying on undocumented 'calibration' rituals. Cold temperatures can cause a separate, temporary effect on performance and available power, which we explain at /guides/phone-battery-cold-weather/. If you fear losing files while troubleshooting, see /guides/recover-deleted-phone-photos/ and /guides/backup-321/. More everyday help is available in /topics/digital/."
        ]
      ],
      "photoCaption": "Real photograph of a smartphone charging from a power bank by Santeri Viinamäki / Wikimedia Commons, CC BY-SA 4.0; resized/cropped. Illustrative of mobile power, not evidence of a faulty phone battery."
    },
    "ru": {
      "title": "Почему телефон быстро разряжается: что проверить на Android и iPhone",
      "seoTitle": "Телефон быстро разряжается: причины и решения",
      "description": "Почему быстро садится батарея Android или iPhone: проверка расхода приложений, фоновой работы, слабого сигнала, обновлений и износа аккумулятора.",
      "subtitle": "Не нужно сразу сбрасывать телефон до заводских настроек. Сначала откройте статистику батареи, проверьте приложения и состояние аккумулятора.",
      "factTable": {
        "title": "Причина по симптомам: с чего начать проверку",
        "headers": [
          "Что происходит",
          "Возможная причина",
          "Первый шаг"
        ],
        "rows": [
          [
            "Заряд падает при выключенном экране",
            "Фоновая синхронизация или слабая сеть",
            "Статистика батареи и активность приложений"
          ],
          [
            "Стало хуже после обновления",
            "Индексация или сбой приложения",
            "Проверить процессы и обновить приложения"
          ],
          [
            "Разряжается с видео и навигацией",
            "Яркий экран, GPS и нагрузка",
            "Экранное время и яркость"
          ],
          [
            "Выключается на остатке заряда",
            "Износ аккумулятора или аппаратная проблема",
            "Официальная диагностика батареи"
          ]
        ]
      },
      "stepGuide": {
        "title": "Диагностика батареи за пять минут",
        "intro": "Идите от фактов к настройкам. Названия пунктов могут отличаться по модели.",
        "steps": [
          [
            "Откройте статистику",
            "Настройки → Батарея: посмотрите, какие приложения тратят заряд."
          ],
          [
            "Сравните экранное время",
            "Проверьте расход при включённом и выключенном экране."
          ],
          [
            "Оцените сигнал и нагрев",
            "Слабая сеть, раздача интернета и высокая температура важны."
          ],
          [
            "Измените один параметр",
            "Например, яркость или фоновую работу одного приложения; проверьте результат."
          ],
          [
            "Проверьте износ",
            "При внезапных отключениях используйте диагностику или сервис."
          ]
        ]
      },
      "sections": [
        [
          "Начните со статистики расхода, а не с догадок",
          "Если телефон перестал доживать до вечера, причина может быть в активном приложении, плохой сотовой связи, недавнем обновлении или изношенном аккумуляторе. Первый шаг — посмотреть, кто действительно расходует энергию. На iPhone откройте «Настройки» → «Аккумулятор» и проверьте график расхода, экранное время и фоновую активность. На Android откройте «Настройки» → «Батарея» или «Использование батареи» — расположение раздела зависит от производителя. Apple и Google рекомендуют сначала оценивать фактическое потребление, а не применять случайные советы. Сравнивайте похожие дни: несколько часов видеозвонков неизбежно отличаются от дня, когда телефон почти лежал на столе. Обратите внимание на приложения, которые недавно установили, длительную работу в фоне и резкие падения процента при простое. Программы с обещаниями «восстановить батарею одним нажатием» не могут устранить химический износ аккумулятора."
        ],
        [
          "Почему заряд уходит даже при заблокированном экране",
          "Телефон продолжает работать с выключенным экраном: получает сообщения, загружает фотографии в облако, синхронизирует почту, устанавливает обновления и поддерживает соединение с сетью. Часть такого расхода нормальна. Но если статистика показывает необычно активный процесс без вашего участия, стоит проверить конкретное приложение и условия связи. Apple отмечает фоновую активность и низкий уровень сотового сигнала в отчётах батареи. Samsung объясняет, что нестабильная сеть повышает энергопотребление. Посмотрите, не идёт ли большая загрузка фото, нет ли постоянных попыток синхронизации и не приходится ли устройству искать связь в помещении. Обновите проблемную программу, попробуйте перезапустить телефон и при необходимости ограничьте фоновую работу редко используемого приложения. Не отключайте бездумно резервные копии, важные уведомления и функции безопасности. Проверьте изменение расхода за сопоставимый промежуток времени."
        ],
        [
          "Экран, навигация, игры и слабый мобильный сигнал",
          "Яркий дисплей при долгой работе способен потреблять заметную часть заряда, а игры, видеосвязь, навигация, запись видео и режим точки доступа дополнительно нагружают процессор и беспроводные модули. При слабой сотовой связи телефон прилагает больше усилий, чтобы удержать соединение; постоянный поиск сети тоже может ухудшить автономность. В руководстве Apple за 2026 год предлагается включить автоматическую яркость и блокировку экрана и проверить подсказки по высокой яркости и плохому сигналу. Samsung рекомендует разумно использовать энергосбережение и настройки дисплея. Для начала уменьшите слишком высокую яркость, сократите время до блокировки экрана, выключите ненужную раздачу интернета и по возможности перейдите на стабильную связь. Но не отключайте геолокацию навигации или важных аварийных служб, когда они необходимы. Тёмная тема может экономить заряд на отдельных OLED-экранах, но не заменит исправный аккумулятор."
        ],
        [
          "Почему после обновления или покупки телефон садится быстрее",
          "После крупного обновления система может некоторое время индексировать фотографии, восстанавливать резервную копию, завершать установку программ и выполнять другие фоновые задачи. Apple предупреждает, что в этот период расход и нагрев иногда временно повышаются; Samsung объясняет аналогичную ситуацию у только что настроенных устройств. Поэтому в первые дни полезно дать операциям завершиться, проверить статистику и установить официальные исправления приложений. Но если проблема не проходит, не стоит бесконечно списывать её на «оптимизацию». Найдите приложение с ненормальной активностью и проверьте, не изменились ли разрешения и настройки синхронизации. Избегайте случайных программ-ускорителей и повторных сбросов без понимания причины. Заводской сброс удаляет локальные данные, поэтому его рассматривают только после резервного копирования и выполнения более безопасных проверок из руководства производителя. Зафиксируйте симптомы, если потребуется обращение в сервис."
        ],
        [
          "Как понять, что аккумулятор действительно изношен",
          "Литий-ионные аккумуляторы постепенно теряют ёмкость с возрастом и циклами зарядки. Изношенный элемент может хуже держать заряд и иногда приводить к неожиданному выключению устройства под нагрузкой. На поддерживаемых моделях iPhone есть раздел «Состояние аккумулятора» внутри настроек батареи; его расположение зависит от поколения телефона. В Samsung Members на совместимых смартфонах доступны диагностические тесты, а другие производители Android могут предлагать собственные инструменты. Оценка состояния полезна, но не отменяет наблюдения за чрезмерным нагревом, вздутием корпуса или необычными отключениями. Если аккумулятор вздулся, устройство сильно нагревается при лёгкой работе или видна деформация, прекратите использование и зарядку, обратитесь в квалифицированный сервис. Не прокалывайте и не пытайтесь самостоятельно вскрывать такой элемент. Профессиональная замена старого аккумулятора иногда разумнее покупки нового телефона."
        ],
        [
          "Как проверить улучшение и избежать лишних действий",
          "В течение нескольких дней наблюдайте расход при похожей нагрузке и меняйте по одному параметру: обновите сбойное приложение, включите энергосбережение для долгого дня или сократите время работы экрана. Записывайте заряд в начале и конце выбранного периода; процент на индикаторе — не точное лабораторное измерение ёмкости. Не выключайте полезные резервные копии только ради экономии нескольких процентов, но объёмную загрузку данных можно проводить при зарядке и стабильном соединении. Если эффекта нет, используйте официальную диагностику или сервис производителя, а не непроверенные способы «калибровки». Холодная погода может временно ухудшать работу батареи — отдельно это объясняем в /ru/guides/phone-battery-cold-weather/. Если переживаете за фотографии и данные, полезны /ru/guides/recover-deleted-phone-photos/ и /ru/guides/backup-321/. Другие инструкции собраны в /ru/topics/digital/."
        ]
      ],
      "photoCaption": "Подлинная фотография зарядки смартфона от пауэрбанка, автор Santeri Viinamäki / Wikimedia Commons, CC BY-SA 4.0; изображение уменьшено и кадрировано. Снимок не доказывает неисправность батареи."
    },
    "image": "https://commons.wikimedia.org/wiki/Special:Redirect/file/Charging%20smartphone%20with%20powerbank%2020180312.jpg?width=1200"
  },
  {
    "id": "how-to-find-cheap-flights-without-hidden-costs",
    "topic": "travel",
    "minutes": 10,
    "published": "2026-11-14",
    "updated": "2026-11-14",
    "photoAsset": {
      "url": "https://commons.wikimedia.org/wiki/Special:Redirect/file/Aeroplane%20wing.jpg?width=1200",
      "source": "https://commons.wikimedia.org/wiki/File:Aeroplane_wing.jpg",
      "credit": "Farrah Zakir / Wikimedia Commons — CC BY-SA 4.0 (original photograph; resized/cropped for MURDILIMAX)",
      "licenseLabel": "CC BY-SA 4.0",
      "license": "https://creativecommons.org/licenses/by-sa/4.0/"
    },
    "mediaAlt": {
      "en": "Authentic photograph of an aircraft wing above clouds seen from the passenger cabin",
      "ru": "Подлинный вид из окна самолёта на крыло и облака во время полёта"
    },
    "sources": [
      {
        "label": "Google Flights Help — Find the best fares, Cheapest tab, date grid and price graph",
        "url": "https://support.google.com/travel/answer/7664728?hl=en"
      },
      {
        "label": "Google Flights Help — Track routes and flight prices",
        "url": "https://support.google.com/travel/answer/6235879"
      },
      {
        "label": "Skyscanner Help — Flexible dates and estimated calendar prices",
        "url": "https://help.skyscanner.net/hc/en-gb/articles/201750142-How-do-I-find-the-cheapest-prices-across-a-month"
      },
      {
        "label": "US Department of Transportation — Before buying tickets, fees and restrictions",
        "url": "https://www.transportation.gov/individuals/aviation-consumer-protection/buying-ticket"
      }
    ],
    "en": {
      "title": "How to Find Cheap Flights: Compare Real Costs, Dates and Airports",
      "seoTitle": "How to Find Cheap Flights: 9 Smart Booking Checks",
      "description": "Find genuinely cheap flights with flexible dates, fare alerts and nearby airports. Compare baggage fees, self-transfers, hidden costs and booking rules.",
      "subtitle": "The lowest price on a search screen is not always the cheapest trip. Check the final cost, travel time, baggage and transfer risk before paying.",
      "factTable": {
        "title": "Example: compare what two tickets actually cost (illustrative, not live fares)",
        "headers": [
          "Cost for one traveler",
          "Flight A",
          "Flight B"
        ],
        "rows": [
          [
            "Advertised return fare",
            "€95",
            "€145"
          ],
          [
            "Bag you need",
            "€40",
            "Included"
          ],
          [
            "Seat selection you choose",
            "€18",
            "€0"
          ],
          [
            "Extra airport transfer",
            "€35",
            "€0"
          ],
          [
            "Illustrative all-in amount",
            "€188",
            "€145"
          ]
        ]
      },
      "stepGuide": {
        "title": "The eight-minute flight search",
        "intro": "Use real dates and destinations when searching; the example prices above are not current offers.",
        "steps": [
          [
            "Search flexible dates",
            "Compare several departure and return days with the date grid or calendar."
          ],
          [
            "Try nearby airports",
            "Include transport time and cost, not only the fare."
          ],
          [
            "Open both fare views",
            "Compare the Cheapest and Best itineraries, including layovers."
          ],
          [
            "Match baggage needs",
            "Check the exact cabin and checked baggage rules of that fare."
          ],
          [
            "Add ground transfers",
            "Compare the price to reach every airport on the itinerary."
          ],
          [
            "Set a price alert",
            "Watch a route without assuming prices must go down."
          ],
          [
            "Review ticket conditions",
            "Read changes, refunds, self-transfer and connection responsibilities."
          ],
          [
            "Verify final checkout",
            "Compare airline and agency prices before you pay."
          ]
        ]
      },
      "sections": [
        [
          "Start by comparing travel dates, not mythical booking days",
          "There is no reliable universal rule that buying on one particular weekday always produces the cheapest fare. Air ticket prices depend on route demand, available seats, travel dates, airline rules and changing inventory. The most useful flexibility is often when you fly, not the day you press the purchase button. Google Flights provides a date grid and price graph that reveal differences across nearby dates or weeks. Skyscanner offers a flexible-month calendar, while warning that displayed calendar amounts may be indicative estimates rather than prices bookable at that moment. Shift departure or return by a day if your schedule allows and compare the final itineraries, including whether a weekend trip requires an extra hotel night. For a fixed wedding or appointment, paying a fair price for suitable timing can be better than missing the event in pursuit of an arbitrary bargain. Use recent, available quotes rather than repeating online legends about clearing cookies or midnight purchases."
        ],
        [
          "Use Google Flights and Skyscanner as comparison tools",
          "Enter your departure region, destination, passenger count, cabin and tentative dates in a comparison service. In Google Flights, inspect both Best and Cheapest; Google's support page says Cheapest can contain itineraries with trade-offs such as self-transfers or different arrival and departure airports. Explore the price graph and set a track-prices alert for fixed dates or flexible routes. On Skyscanner, switch to Flexible dates or Whole Month to identify potentially cheaper days, then open the actual itinerary to see refreshed offers. The calendar may show estimated prices based on recent searches, which are not guaranteed until booking. These services do not necessarily include every airline, travel agency or fare, so check the carrier's own website as well. Keep dates, baggage requirements and traveller count consistent during comparisons. Do not judge two results by headline fare when one includes a convenient nonstop service and the other a 16-hour overnight connection."
        ],
        [
          "Compare nearby airports without ignoring the ground journey",
          "Nearby airports sometimes have cheaper flights, especially when budget airlines use a smaller airport far from the city centre. But it may take a costly train, bus, taxi or even an overnight hotel to reach that airport. Make an honest calculation: ticket plus the round-trip ground transport, extra accommodation, time and the practical stress of reaching an early-morning departure. Google Flights provides information about alternate airports, and Skyscanner likewise supports nearby-airport comparisons. If your destination has several airports, confirm which one the return flight uses; an arrival at a distant terminal can erase apparent savings. Also check whether you must switch airports during a connection. Never book two flights from different airports with an unrealistic transfer window because the search engine labelled the combination 'cheapest.' For travellers with disabilities, children or oversized luggage, transit accessibility can matter more than a small fare difference."
        ],
        [
          "Add bags, seats and other optional fees before deciding",
          "An inexpensive basic ticket may allow only a small personal item; an airline or route may charge separately for cabin baggage, checked luggage, seat selection, priority services or changes. Baggage sizes and allowances must be checked for the exact fare, not just the airline's general advertising. The U.S. Department of Transportation advises passengers to review fare restrictions and the cost of optional services before purchasing; rules vary by jurisdiction and carrier. Consider an example: Ticket A costs €95 but the bag is €40, a chosen seat €18 and the airport transfer €35, giving €188. Ticket B costs €145 with those needs already covered, so Ticket B is the lower total in this illustration. It is not a prediction of any live ticket. A carry-on might be cheaper than checking a bag on one route, but the reverse can happen. Verify the final checkout amount and the currency, and check whether the displayed total covers one person or the whole group."
        ],
        [
          "Understand separate tickets and self-transfer risks",
          "A cheaper itinerary can consist of two separately issued tickets or a self-transfer, where the traveller must collect luggage, possibly pass immigration, check in again and pass security for the next flight. An airline on the second booking may have no obligation to rebook you if the first leg is late. Google specifically notes self-transfer among the trade-offs that can appear in its Cheapest tab. Also consider visa and transit-document requirements, airport opening hours, flight connections across different terminals and the costs of delays. A protected through-ticket and a self-transfer package are not equivalent products merely because they share the same departure and arrival cities. If the total journey is critical, prefer an itinerary with manageable connections and clear responsibility for missed flights. For international trips, check the validity of your passport and any transit visas before booking. Saving a small amount up front can be expensive when a connection fails."
        ],
        [
          "Price alerts, booking checks and the final decision",
          "If you are not ready to buy, track a route in Google Flights and turn on price-change notifications; alerts describe observed or expected changes, not a guarantee of lower prices. Choose an itinerary that meets your schedule and has an acceptable total cost. Before paying, review the exact passenger names, date, airports, flight numbers, baggage allowance, cancellation policy and seller identity. Compare booking directly with the airline against a travel agent, especially if post-purchase support might be important. Screenshots of the final conditions can help you remember what was sold, but do not assume every screenshot is an enforceable ticket. Never pay through an unverified payment link sent by a stranger. This approach works for journeys worldwide, without pretending that one timing trick always wins. Related articles include /guides/lost-luggage-airport-what-to-do/ and /guides/international-travel-documents/, and more practical travel help lives in /topics/travel/."
        ]
      ],
      "photoCaption": "Authentic aircraft-window photograph of a wing and blue sky by Farrah Zakir / Wikimedia Commons, CC BY-SA 4.0; resized/cropped. This is a travel illustration, not a live airfare quote."
    },
    "ru": {
      "title": "Как найти дешёвые авиабилеты и не переплатить за багаж",
      "seoTitle": "Как найти дешёвые авиабилеты: 9 проверок цены",
      "description": "Как искать дешёвые авиабилеты: гибкие даты, соседние аэропорты, уведомления о цене, багаж, пересадки и подсчёт полной стоимости поездки.",
      "subtitle": "Билет с минимальной ценой на экране не всегда означает самую дешёвую поездку. Сравнивайте полный бюджет, удобство и условия пересадок.",
      "factTable": {
        "title": "Пример: настоящая стоимость двух вариантов (цифры условные)",
        "headers": [
          "Расход на одного человека",
          "Билет A",
          "Билет B"
        ],
        "rows": [
          [
            "Цена туда-обратно",
            "95 €",
            "145 €"
          ],
          [
            "Нужный багаж",
            "40 €",
            "Включён"
          ],
          [
            "Выбор места",
            "18 €",
            "0 €"
          ],
          [
            "Дополнительный трансфер",
            "35 €",
            "0 €"
          ],
          [
            "Итого в этом примере",
            "188 €",
            "145 €"
          ]
        ]
      },
      "stepGuide": {
        "title": "Поиск авиабилета: восемь шагов",
        "intro": "Сравнивайте реальные предложения для нужных дат. Цены из таблицы — только учебный пример.",
        "steps": [
          [
            "Сравните даты",
            "Посмотрите стоимость вылета и возврата в соседние дни."
          ],
          [
            "Проверьте аэропорты",
            "Учитывайте время и стоимость проезда к каждому."
          ],
          [
            "Откройте дешёвый и удобный варианты",
            "Смотрите не только цену, но и время пересадок."
          ],
          [
            "Уточните багаж",
            "Проверьте правила именно выбранного тарифа."
          ],
          [
            "Добавьте трансферы",
            "Посчитайте дорогу из аэропорта в обе стороны."
          ],
          [
            "Включите отслеживание",
            "Смотрите изменения цены без ожидания гарантированной скидки."
          ],
          [
            "Прочитайте условия",
            "Особенно возврат, изменения и самостоятельную пересадку."
          ],
          [
            "Проверьте итог",
            "Сравните окончательную цену авиакомпании и продавца."
          ]
        ]
      },
      "sections": [
        [
          "Сначала выбирайте даты, а не «волшебный день покупки»",
          "Не существует универсального правила, что билет обязательно дешевле в определённый день недели или после очистки cookie. На цену влияют спрос на маршрут, доступные места, даты полёта, условия тарифа и изменение предложения. Самый полезный способ сэкономить — проверить несколько дат вылета и возвращения, если график это позволяет. В Google Flights есть таблица дат и график цен, с помощью которых видно разницу между соседними днями. Skyscanner предлагает календарь на месяц, но предупреждает, что показанные в нём суммы могут быть ориентировочными, основанными на прошлых поисках, а не действующими предложениями. Попробуйте сместить поездку на день-два и проверьте все дополнительные расходы, включая лишнюю ночь в гостинице. Если поездка приурочена к свадьбе, встрече или важному событию, надёжное время прилёта может быть ценнее небольшой скидки. Сравнивайте реальные доступные варианты, а не популярные легенды о времени покупки."
        ],
        [
          "Где и как сравнивать авиабилеты без ошибок",
          "В поиске авиабилетов укажите город вылета, назначение, количество пассажиров, класс и примерные даты. В Google Flights проверьте вкладки Best и Cheapest: сам Google сообщает, что Cheapest может включать рискованные самостоятельные пересадки или разные аэропорты прибытия и обратного вылета. Используйте график цен и уведомления об изменениях стоимости. В Skyscanner откройте Flexible dates или поиск на целый месяц, чтобы найти дни с более низкими предварительными ценами; перед оплатой перейдите к фактическому предложению и проверьте его заново. Ни один агрегатор не обязан показывать абсолютно все авиакомпании и тарифы. Поэтому сравните результат с официальным сайтом перевозчика, не меняя при этом требования к багажу, даты и количество человек. Билет с двумя ночными пересадками нельзя оценивать только по разнице в цене с удобным прямым рейсом. Всегда сверяйте полное время путешествия."
        ],
        [
          "Соседние аэропорты: когда дешёвый билет становится дорогим",
          "Бюджетные авиакомпании иногда используют аэропорты, расположенные далеко от центра города. Стоимость самого перелёта там может быть ниже, зато поездка на автобусе, поезде или такси и возможная ночёвка съедят экономию. Считайте билет вместе с трансфером в обе стороны, потраченным временем и удобством раннего или позднего вылета. Google Flights и Skyscanner позволяют сравнивать соседние аэропорты. Проверьте также, не отличается ли аэропорт прилёта от аэропорта обратного рейса. При стыковках особенно опасны маршруты, в которых между двумя аэропортами нужно самостоятельно переезжать через незнакомый город. Не берите пересадку с нереалистичным временным запасом только потому, что поисковик показал привлекательную сумму. Для семьи с детьми, людей с ограниченной мобильностью и путешественников с крупным багажом доступность транспорта тоже часть стоимости и качества поездки. Иногда немного более дорогой прямой рейс оказывается значительно выгоднее."
        ],
        [
          "Посчитайте багаж, выбор места и другие доплаты",
          "Самый дешёвый тариф может разрешать лишь небольшую личную вещь, а за ручную кладь, чемодан, выбранное место, изменение билета и другие опции потребуется платить отдельно. Размеры и допустимый вес нужно проверять для конкретного рейса и тарифа, а не по старой фотографии из интернета. Министерство транспорта США рекомендует заранее сравнивать ограничения тарифа и стоимость дополнительных услуг; правила конкретной страны и перевозчика могут отличаться. Пример: вариант A стоит 95 €, но необходимый багаж добавляет 40 €, место 18 €, а дальний трансфер 35 € — вместе 188 €. Вариант B стоит 145 €, и всё перечисленное уже входит в цену; тогда он дешевле в целом. Это условный расчёт, не действующие предложения. Проверяйте валюту, сумму на одного пассажира и окончательный экран оплаты. Даже одинаковые названия тарифов у разных авиакомпаний могут означать разные ограничения."
        ],
        [
          "Чем опасны отдельные билеты и самостоятельные пересадки",
          "Иногда поисковик объединяет в один маршрут два самостоятельных билета, которые не защищены общей перевозкой. При такой пересадке может потребоваться получить багаж, пройти паспортный контроль, зарегистрироваться снова и повторно пройти досмотр. Если первый самолёт опоздает, следующий перевозчик не обязательно обязан бесплатно пересадить вас на другой рейс. Google указывает самостоятельные пересадки среди возможных особенностей дешёвых результатов. Заранее выясните необходимость транзитной визы, время переезда между терминалами или аэропортами, ночные ограничения и последствия задержки. Защищённая стыковка в едином билете и самостоятельная комбинация — не одинаковые варианты, даже если на экране похожее расписание. Если прилёт нужен к определённому времени, выбирайте маршрут с реальным запасом и понятной ответственностью продавца. Небольшая экономия на покупке может обернуться большой доплатой при сорванной пересадке."
        ],
        [
          "Как пользоваться уведомлениями и проверить билет перед оплатой",
          "Когда покупка пока не срочная, включите отслеживание маршрута в Google Flights: сервис присылает уведомления о существенных изменениях цены. Но ни система прогнозов, ни отдельный блогер не могут гарантировать, что стоимость обязательно упадёт. Выберите маршрут с подходящим временем и приемлемой полной суммой. Перед оплатой внимательно проверьте имя пассажира, даты, все аэропорты, номера рейсов, багаж, условия отмены и продавца. Сравните цену на сайте авиакомпании и у агентства, особенно если важно решение проблем после покупки. Сохраните подтверждение бронирования и условия тарифа. Не переходите по подозрительным платёжным ссылкам, присланным неизвестными людьми. Такой подход полезен для путешествий по всему миру и не зависит от конкретного сезона. Дополнительные инструкции есть в /ru/guides/lost-luggage-airport-what-to-do/ и /ru/guides/international-travel-documents/; раздел путешествий — /ru/topics/travel/."
        ]
      ],
      "photoCaption": "Настоящая фотография крыла самолёта на фоне неба, автор Farrah Zakir / Wikimedia Commons, CC BY-SA 4.0; уменьшена и кадрирована. Иллюстрация путешествий, а не актуальная стоимость билетов."
    },
    "image": "https://commons.wikimedia.org/wiki/Special:Redirect/file/Aeroplane%20wing.jpg?width=1200"
  },
  {
    "id": "how-to-tie-a-tie-four-in-hand-knot",
    "topic": "tools",
    "minutes": 8,
    "published": "2026-11-14",
    "updated": "2026-11-14",
    "photoAsset": {
      "url": "https://commons.wikimedia.org/wiki/Special:Redirect/file/Four-In-Hand%20tie%20knot.JPG?width=1200",
      "source": "https://commons.wikimedia.org/wiki/File:Four-In-Hand_tie_knot.JPG",
      "credit": "Keith S Brown (Ksbrown) / Wikimedia Commons — CC BY-SA 2.5 (original photograph; resized/cropped for MURDILIMAX)",
      "licenseLabel": "CC BY-SA 2.5",
      "license": "https://creativecommons.org/licenses/by-sa/2.5/"
    },
    "mediaAlt": {
      "en": "Real photograph of a finished Four-in-Hand knot in a patterned blue silk necktie",
      "ru": "Подлинная фотография готового узла Four-in-Hand на синем узорчатом шёлковом галстуке"
    },
    "sources": [
      {
        "label": "Ties.com — Four-in-Hand knot step-by-step instructions",
        "url": "https://www.ties.com/how-to-tie-a-tie/four-in-hand"
      },
      {
        "label": "Ties.com — Half-Windsor knot instructions",
        "url": "https://www.ties.com/how-to-tie-a-tie/half-windsor"
      },
      {
        "label": "Wikimedia Commons — Four-In-Hand silk tie photograph and licence",
        "url": "https://commons.wikimedia.org/wiki/File:Four-In-Hand_tie_knot.JPG"
      }
    ],
    "en": {
      "title": "How to Tie a Tie: The Four-in-Hand Knot in Seven Easy Steps",
      "seoTitle": "How to Tie a Tie: 7 Steps to a Four-in-Hand Knot",
      "description": "Learn how to tie a tie with a simple Four-in-Hand knot. Follow seven clear steps, fix tie length and narrow-end problems, and choose the right knot.",
      "subtitle": "One dependable knot is enough for most occasions. Follow the wide end around the narrow end, pass it through the loop and adjust the result.",
      "factTable": {
        "title": "Which tie knot should you try?",
        "headers": [
          "Knot",
          "Shape",
          "When it works well"
        ],
        "rows": [
          [
            "Four-in-Hand",
            "Slim, slightly asymmetrical",
            "Everyday wear, most collar shapes"
          ],
          [
            "Half-Windsor",
            "Medium, fairly symmetric",
            "Workwear and moderately spread collars"
          ],
          [
            "Full Windsor",
            "Broad, symmetrical",
            "Wider collars; needs more tie length"
          ],
          [
            "Simple / Oriental",
            "Small and compact",
            "Thicker ties; short remaining length"
          ]
        ]
      },
      "stepGuide": {
        "title": "Seven moves for the Four-in-Hand knot",
        "intro": "Face a mirror. These directions are from the wearer's perspective, with the wide end initially on your right.",
        "steps": [
          [
            "Start with unequal ends",
            "Place the tie around your neck, wide end to the right and hanging lower than the narrow end."
          ],
          [
            "Cross wide over narrow",
            "Move the wide end across the front of the narrow end toward your left."
          ],
          [
            "Wrap behind",
            "Bring the wide end behind the narrow end toward your right."
          ],
          [
            "Cross the front again",
            "Move the wide end across the front toward your left to create a visible band."
          ],
          [
            "Go up through the neck loop",
            "Bring the wide end upward from underneath, through the gap beside your neck."
          ],
          [
            "Go down through the front band",
            "Pass the wide tip down through the horizontal loop you just made."
          ],
          [
            "Tighten and adjust",
            "Hold the narrow end and slide the knot upward, then smooth the front and check the length."
          ]
        ]
      },
      "sections": [
        [
          "The quickest knot for beginners: Four-in-Hand",
          "The Four-in-Hand is a good first necktie knot because it uses a short sequence of movements and produces a relatively slim, mildly asymmetrical shape. It works with many ordinary dress shirts and tie fabrics and is easier to repeat than a large formal Windsor. Begin in front of a mirror with the collar raised, buttons done and the tie draped around your neck. The wider blade should start on your right and hang lower than the narrow end; the exact difference depends on your height, tie length and fabric thickness. Follow the seven numbered movements in the step guide above, moving the wide end throughout. The objective is not an impossibly perfect triangle: a small, clean knot that sits comfortably under the collar is suitable for most everyday settings. Ties.com recommends Four-in-Hand as one versatile knot to learn first, while distinguishing it from the fuller Half-Windsor and Windsor styles."
        ],
        [
          "Cross, wrap, make the front band and feed it through",
          "With the wide end on the right, cross it over the narrow end toward the left. Take it behind the narrow end back to the right. Cross it across the front a second time toward the left, forming a horizontal band that will become the face of the knot. Bring the wide end upward through the opening around your neck from underneath. Finally, feed the wide tip downward through the front band. That last opening must remain loose enough for the tip to pass without bunching or folding. Tighten by drawing the wide end down gently while holding the knot, then slide the knot toward your collar using the narrow end as a guide. This is an original verbal restatement of the standard Four-in-Hand sequence described by Ties.com, not a reproduction of its illustrated step images. If you lose track of the front band, reset and start again rather than twisting the fabric or forcing the tip through the wrong opening."
        ],
        [
          "Get the right tie length and make a neat dimple",
          "When properly adjusted, the broad tip of a conventional necktie generally reaches approximately your belt buckle or waistband. The starting difference between wide and narrow ends varies with your height, the tie's overall length, knot size and thickness. If the wide blade ends much too short, restart with it hanging lower before tying; if it extends too far below the belt, start with less excess length. Avoid pulling the knot extremely tight against your neck, because the collar should remain comfortable. A slight dimple immediately under the knot can make the tie look neat: as you tighten, pinch a small fold in the centre of the wide blade just below the forming knot. Smooth the fabric with your fingers rather than yanking it. The Four-in-Hand's natural asymmetry is part of its shape and not necessarily a mistake. Practise while wearing the same shirt and tie, since changing fabrics can noticeably alter the result."
        ],
        [
          "Four-in-Hand, Half-Windsor or Full Windsor?",
          "Different collar openings and tie materials can change how a knot looks. Four-in-Hand creates a narrow, slightly tilted knot that fits most regular collars and works well with thicker fabrics because it uses relatively few wraps. Half-Windsor is medium-sized and more symmetric, often suitable for business shirts with a moderate spread. Full Windsor is typically broader and consumes more tie length; it can suit wider collars and thinner tie fabrics, but may look oversized in a narrow opening. A small Oriental knot can be handy with a thicker fabric when the standard tie leaves little length, though it has its own instructions and can be less convenient to untie. These are style options, not rigid dress-code rules. If one knot feels uncomfortable or makes the tie too short, choose a simpler knot or a longer tie rather than trying to compensate by overtightening."
        ],
        [
          "Troubleshoot a crooked, loose or too-short tie",
          "A loose knot often means the fabric was never snugged down after passing the wide end through the front loop. Hold the knot and draw the wide blade downward slowly while guiding the knot toward the collar. If the front loop twists or creases badly, undo it completely and repeat, keeping the face of the tie flat on every wrap. A very short tip usually means the wide end did not start low enough or the tie is short for the chosen knot. The narrow end should normally stay hidden behind the broad blade; many ties have a keeper loop or label on the back to hold it. If a larger Full Windsor consumes too much fabric, try the Four-in-Hand before buying anything new. Most beginners benefit from making deliberate, slow movements in a mirror rather than pulling quickly. The diagram-like step cards above are a text-based visual sequence; consult the linked instructions if a photograph of each movement is more useful."
        ],
        [
          "Care for the tie and remember one dependable sequence",
          "Once the knot looks right, lower the collar, check that the shirt buttons are aligned and move the tie to the centre. When taking it off, reverse the knot rather than dragging the wide blade through a tight loop: this helps avoid excessive creasing and wear. Hang or roll a delicate tie according to its fabric and maker's care instructions. Silk should not be treated like a washable cotton garment; avoid aggressive scrubbing and direct heat. The practical memory aid is simple: over, behind, across the front, up through the neck loop, down through the front band, then tighten. After a few repetitions the sequence becomes familiar, and you can explore Half-Windsor or other knots if the outfit calls for it. For a professional application outfit, our related guide /guides/how-to-write-a-cover-letter-for-a-job/ explains how to prepare the written part, while /topics/tools/ collects other useful step-by-step resources."
        ]
      ],
      "photoCaption": "A genuine photograph of a completed blue silk Four-in-Hand tie knot by Keith S Brown (Ksbrown) / Wikimedia Commons, CC BY-SA 2.5; resized and cropped. The photo shows the finished knot, while the steps above describe how to make it."
    },
    "ru": {
      "title": "Как завязать галстук: узел Four-in-Hand за 7 шагов",
      "seoTitle": "Как завязать галстук: 7 простых шагов",
      "description": "Как завязать галстук простым узлом Four-in-Hand: семь понятных шагов, правильная длина, форма узла и решение частых ошибок для начинающих.",
      "subtitle": "Для большинства случаев достаточно одного удобного узла. Проведите широкий конец вокруг узкого, пропустите через петлю и аккуратно затяните.",
      "factTable": {
        "title": "Какой узел галстука выбрать?",
        "headers": [
          "Узел",
          "Форма",
          "Для чего подходит"
        ],
        "rows": [
          [
            "Four-in-Hand",
            "Узкий, немного асимметричный",
            "На каждый день и для обычных воротников"
          ],
          [
            "Полувиндзор",
            "Средний, почти симметричный",
            "Деловой стиль, умеренно широкий ворот"
          ],
          [
            "Виндзор",
            "Широкий, симметричный",
            "Широкий воротник; требует длины"
          ],
          [
            "Простой / Oriental",
            "Маленький и компактный",
            "Плотный галстук и короткий запас длины"
          ]
        ]
      },
      "stepGuide": {
        "title": "Узел Four-in-Hand: семь движений",
        "intro": "Встаньте перед зеркалом. Направления указаны для того, кто завязывает галстук: широкий конец сначала справа.",
        "steps": [
          [
            "Начните с разной длины",
            "Широкий конец справа и заметно ниже узкого, который находится слева."
          ],
          [
            "Перекрестите спереди",
            "Проведите широкий конец поверх узкого справа налево."
          ],
          [
            "Обведите сзади",
            "Заведите широкий конец под узкий и выведите направо."
          ],
          [
            "Сделайте переднюю полоску",
            "Снова проведите широкий конец по лицевой стороне справа налево."
          ],
          [
            "Поднимите через шейную петлю",
            "Выведите широкий конец снизу вверх через петлю у шеи."
          ],
          [
            "Опустите через переднюю петлю",
            "Пропустите широкий кончик вниз через горизонтальную полоску спереди."
          ],
          [
            "Затяните и выровняйте",
            "Держите узкий конец, подтяните узел к воротнику и расправьте галстук."
          ]
        ]
      },
      "sections": [
        [
          "Самый простой вариант для начинающих — Four-in-Hand",
          "Узел Four-in-Hand подходит для первого знакомства с галстуками: у него короткая последовательность движений, а форма получается сравнительно узкой и слегка асимметричной. Он уместен со многими обычными рубашками и тканями и требует меньше действий, чем крупный Виндзор. Встаньте перед зеркалом, застегните верхнюю пуговицу рубашки и поднимите воротник. Накиньте галстук так, чтобы широкий конец оказался справа и ниже узкого. Насколько именно ниже, зависит от роста, длины и толщины ткани. Затем повторите семь действий в пошаговом блоке выше, перемещая в основном широкий конец. Не пытайтесь добиться математически идеального треугольника: аккуратный небольшой узел, который удобно сидит под воротником, подходит для большинства повседневных случаев. Сайт Ties.com называет Four-in-Hand одним из самых универсальных простых узлов и отличает его от более объёмных вариантов."
        ],
        [
          "Как перекрестить, обернуть и пропустить широкий конец",
          "Положите широкий конец поверх узкого справа налево. Заведите его сзади узкого обратно направо. Проведите по передней стороне ещё раз налево — теперь перед вами должна образоваться горизонтальная полоска, которая будет лицевой частью узла. Затем поднимите широкий конец снизу вверх через петлю у шеи. Последним движением проденьте широкий кончик сверху вниз через переднюю полоску. Старайтесь не затягивать её до того, как протолкнёте галстук: отверстие должно оставаться достаточно свободным. Дальше осторожно потяните широкий конец вниз, одновременно удерживая узел, а затем подвиньте его к воротнику, придерживая узкий конец. Это собственное текстовое изложение стандартной последовательности Four-in-Hand, описанной на Ties.com, а не копия чужих иллюстраций. Если передняя петля перекрутилась и вы потеряли направление, лучше спокойно распустить узел и начать снова."
        ],
        [
          "Какой должна быть длина и как сделать красивую складку",
          "В обычном деловом образе кончик широкого конца галстука чаще всего располагают примерно у пряжки ремня или верхней линии пояса брюк. При этом исходная длина двух концов зависит от роста человека, длины галстука, толщины ткани и размера узла. Если широкий конец выходит слишком коротким, распустите узел и начните так, чтобы он свисал ниже. Если опускается далеко за ремень — оставьте меньше запаса. Не затягивайте узел с чрезмерным усилием у горла: воротник должен оставаться удобным. Небольшая центральная складка под узлом, или dimple, часто выглядит аккуратно. Для этого при окончательной затяжке слегка защипните ткань по центру широкой полосы ниже узла. Разглаживайте её пальцами, а не резкими рывками. Не забывайте, что лёгкая асимметрия — особенность Four-in-Hand, а не обязательно ошибка."
        ],
        [
          "Чем отличаются Four-in-Hand, Полувиндзор и Виндзор",
          "Узлы отличаются шириной, симметрией и количеством ткани, которое требуется для завязывания. Four-in-Hand обычно получается узким и слегка наклонённым, хорошо смотрится с обычным воротником и нередко подходит для плотного галстука благодаря небольшому числу оборотов. Полувиндзор заметно симметричнее и шире: он часто уместен с деловой рубашкой и средним раскрытием воротника. Полный Виндзор ещё шире и требует большей длины, поэтому может смотреться слишком массивно под узким воротником или на плотной ткани. Есть и маленький узел Oriental, но у него другая последовательность движений. Это вопросы удобства и стиля, а не строгая классификация «правильных» и «неправильных» узлов. Если с Виндзором широкая часть оказывается слишком короткой, попробуйте Four-in-Hand вместо чрезмерной затяжки и сложных манипуляций."
        ],
        [
          "Что делать, если узел кривой, слабый или галстук короткий",
          "Если узел болтается, возможно, вы не подтянули широкую часть после того, как провели её через переднюю петлю. Удерживая узел, осторожно вытяните широкий конец вниз и подвиньте узел к воротнику. Когда передняя полоска перекручена или сильно смята, лучше полностью распустить галстук и повторить действия, сохраняя лицевую сторону ткани ровной. Слишком короткий широкий конец чаще означает, что вы начали с недостаточным запасом длины, либо сам галстук короткий для этого узла. Узкий конец в конце обычно прячут сзади широкой полосы; на многих галстуках с изнанки есть специальная петля или ярлык, который его удерживает. Если полный Виндзор «съедает» слишком много длины, перейдите на Four-in-Hand. Новичку полезнее медленно повторить последовательность перед зеркалом, чем туго затягивать ткань на каждом этапе. Пошаговые карточки выше помогут запомнить порядок движений."
        ],
        [
          "Как сохранить форму галстука и запомнить узел",
          "Когда узел готов, опустите воротник, проверьте расположение верхних пуговиц и выровняйте галстук по центру. Снимая его, выполняйте движения в обратном порядке, а не вытягивайте широкий конец силой через уже затянутую петлю: так меньше заломов и износа. Деликатные галстуки стоит хранить с учётом материала — например, повесить или аккуратно свернуть. Шёлк нельзя чистить так же, как обычную хлопковую рубашку; сильная вода, трение и жар могут повредить ткань. Запомните короткую последовательность: поверх, сзади, спереди, вверх через шейную петлю, вниз через переднюю, затем затянуть. После нескольких повторений движения станут привычными, а при необходимости можно освоить Полувиндзор. Кстати, при подготовке к собеседованию полезна не только одежда, но и грамотное письмо к вакансии: /ru/guides/how-to-write-a-cover-letter-for-a-job/. Другие инструкции собраны в /ru/topics/tools/."
        ]
      ],
      "photoCaption": "Настоящая фотография готового узла Four-in-Hand на синем шёлковом галстуке, автор Keith S Brown (Ksbrown) / Wikimedia Commons, CC BY-SA 2.5; уменьшена и кадрирована. Снимок показывает результат, а последовательность действий описана выше."
    },
    "image": "https://commons.wikimedia.org/wiki/Special:Redirect/file/Four-In-Hand%20tie%20knot.JPG?width=1200"
  }
];
