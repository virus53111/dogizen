// Focused, researched upgrades to existing articles. Apply only to fully edited locales.
export const editorialUpgrades = {
 'ryzen-upgrade': {
  updated:'2026-11-09',
  sources:[
   {label:'AMD — Socket AM4 chipset compatibility',url:'https://www.amd.com/en/products/processors/chipsets/am4.html'},
   {label:'AMD — BIOS updates for Ryzen desktop systems',url:'https://www.amd.com/en/resources/support-articles/faqs/cpu-99.html'}
  ],
  en:{title:'Upgrading an older Ryzen PC: motherboard, BIOS and CPU checklist',
   subtitle:'A step-by-step AM4 upgrade plan: identify the exact board, confirm BIOS support, protect your files and test the result.',
   sections:[
    ['Identify the exact motherboard and current processor',
     'Start with the motherboard model and revision, not the CPU you want to buy. In Windows, open System Information to note the baseboard manufacturer, product and BIOS version. Check the board itself or its box if the revision is not clear. Record your current Ryzen processor, RAM type and whether you already have an SSD. A desktop AM4 board is not automatically compatible with every AM4 chip, even if the processor fits in the socket.'],
    ['Verify the official CPU support list and BIOS requirement',
     'Open the support page for your precise motherboard model. Find its CPU support or QVL list and check that the desired processor is explicitly supported, including the minimum BIOS version. AMD lists Ryzen 5000 compatibility for the B450 chipset, but individual board support and required firmware still vary. If a BIOS update is necessary, read the manufacturer instructions before buying; a newer BIOS may change support for some older processors. Never assume that a chipset table alone guarantees compatibility.'],
    ['Prepare a safe upgrade before opening the case',
     'Back up important files and verify that you can open the backup. If disk encryption is enabled, save the BitLocker recovery key somewhere separate from the computer before changing firmware. Download BIOS only from the board manufacturer, use the exact revision, and do not interrupt the update. Some boards offer a USB flashback function, while others need a currently supported CPU to boot and flash. If unsure about firmware flashing or electrical safety, seek hands-on help.'],
    ['Check the cooler, power and installation steps',
     'Make sure your CPU cooler supports the replacement processor and that the case has adequate airflow. Have suitable thermal paste available if the cooler is being removed. Shut the computer down, disconnect power and follow the board and cooler manuals for safe installation. Do not force pins or connectors. After mounting, reconnect the CPU fan, verify its operation and enter BIOS to confirm that the new processor and memory are detected before starting intensive applications.'],
    ['Test stability and decide whether the expense is worthwhile',
     'After the first successful boot, check operating-system updates, idle and sustained CPU temperatures, fan behavior and stability under a normal workload. Compare the expected improvement against the total cost of the CPU, cooler and any repair risk. An SSD often makes an older everyday PC feel much more responsive; extra RAM only helps when memory is actually the bottleneck. If your usage needs a new socket, DDR5 or major expansion features, compare a full platform upgrade instead.']
   ]},
  ru:{title:'Как обновить старый Ryzen: совместимость, BIOS и проверка после замены',
   subtitle:'Пошаговый план апгрейда AM4: узнайте модель платы, проверьте поддержку процессора, защитите данные и протестируйте систему.',
   sections:[
    ['Узнайте точную модель материнской платы и процессора',
     'Начинайте не с покупки нового Ryzen, а с определения материнской платы. В Windows откройте «Сведения о системе» и запишите производителя, модель, версию BIOS и текущий процессор. У некоторых плат есть несколько аппаратных ревизий — проверьте надпись на самой плате или упаковке. Также уточните тип оперативной памяти, объём ОЗУ и наличие SSD. Совпадение сокета AM4 ещё не гарантирует, что конкретная плата запустит любой процессор AM4.'],
    ['Проверьте список совместимости CPU на сайте производителя',
     'Найдите страницу поддержки именно вашей модели платы и откройте список поддерживаемых процессоров (CPU Support или QVL). Посмотрите не только название нового Ryzen, но и минимальную требуемую версию BIOS. Чипсет B450 в целом поддерживает Ryzen 5000, однако фактическая совместимость зависит от модели и прошивки. Учитывайте, что обновление BIOS иногда меняет поддержку старых процессоров. Не покупайте CPU, основываясь только на названии чипсета или похожей модели платы.'],
    ['Подготовьте резервную копию и обновление BIOS',
     'Сохраните важные файлы отдельно от компьютера и убедитесь, что копия открывается. При включённом BitLocker заранее найдите и сохраните ключ восстановления. Скачивайте BIOS исключительно с официальной страницы производителя материнской платы, точно под её ревизию, и следуйте инструкции без отключения питания в процессе. Для некоторых плат доступна функция USB BIOS Flashback, а для других нужен работающий совместимый процессор. Если не уверены в прошивке, лучше обратиться к специалисту.'],
    ['Проверьте охлаждение и аккуратно установите CPU',
     'Убедитесь, что ваш кулер подходит к выбранному процессору, а в корпусе достаточно вентиляции. При снятии кулера обычно нужна свежая термопаста. Полностью выключите ПК, отсоедините питание и действуйте по руководствам платы и системы охлаждения. Не прикладывайте силу к контактам и разъёмам. После сборки проверьте подключение вентилятора, зайдите в BIOS и убедитесь, что процессор и память определяются, прежде чем запускать игры или тяжёлые задачи.'],
    ['Проверьте температуры и оцените реальную выгоду',
     'После запуска Windows проверьте обновления, температуры процессора в покое и под нагрузкой, работу вентилятора и стабильность обычных программ. Сравните итоговую стоимость процессора, возможного кулера и обслуживания с ожидаемым выигрышем. Для повседневного ПК установка SSD часто ощущается сильнее, чем увеличение уже достаточного объёма RAM. Если нужны новый сокет, DDR5 и современные интерфейсы, имеет смысл сравнить не только процессоры, но и стоимость замены платформы целиком.']
   ]}},
 'wifi-speed': {
  updated:'2026-11-09',
  sources:[{label:'Microsoft Support — Wi-Fi and your home layout',url:'https://support.microsoft.com/en-us/windows/experience/connectivity-networking/wi-fi-and-your-home-layout'}],
  en:{title:'Why is Wi-Fi slow? Diagnose the problem before buying a router',
   subtitle:'Use wired comparisons, smart router placement and band checks to find the real cause of a slow wireless connection.',
   sections:[
    ['Check whether the bottleneck is the internet or Wi-Fi',
     'Test internet speed over Ethernet on a computer connected directly to the router, then repeat over Wi-Fi beside it. Run several tests at different times with the same service and without large downloads in the background. If Ethernet is also slow, inspect the ISP plan, modem and connection before replacing wireless gear. If only Wi-Fi is slow, investigate signal strength, congestion and device capability. Remember that local file-transfer speed and internet speed are different measurements.'],
    ['Give the router a better position',
     'Place the router in an open, central and reasonably elevated position rather than behind a TV, inside a cupboard or close to thick concrete walls. Metal, appliances and dense obstacles can weaken signals. Move one laptop or phone to the same room as the router to see whether distance is the cause. A mesh access point can help distant rooms, but wireless mesh nodes also need a strong connection to each other; an Ethernet backhaul is often more reliable.'],
    ['Choose the right wireless band and channel',
     'The 2.4 GHz band usually travels farther and passes through obstacles better, but it can be congested. The 5 GHz band often supports higher speeds over shorter distances. Wi-Fi 6E adds 6 GHz when both router and device support it, with still shorter practical range. If automatic band steering behaves badly, temporarily use distinct network names to test each band. On 2.4 GHz, channels 1, 6 and 11 avoid overlap in many regions; local rules and router settings still matter.'],
    ['Check devices, updates and connected clients',
     'Update router firmware through its official administration page and keep phone or computer wireless drivers current. Restart a stuck router and compare at least two client devices. If one device alone is slow, its antenna, driver or power-saving mode may be the cause. Inspect the router client list for unexpectedly busy devices, backups or downloads. Secure the network with a modern WPA2-AES or WPA3 password and disable outdated security modes when your devices allow it.'],
    ['Decide what equipment, if any, to change',
     'Upgrade only after the tests identify a limitation. An older device cannot gain newer Wi-Fi features simply because the router is replaced. For a large home, improved access-point placement or wired backhaul may help more than a premium single router. Save test results from the same room and compare with the realistic speed of your internet plan; advertised router maximums are laboratory numbers, not guaranteed whole-home download speeds.']
   ]},
  ru:{title:'Почему медленный Wi-Fi: как найти причину и ускорить сеть',
   subtitle:'Проверяем скорость по кабелю, расположение роутера, диапазоны и устройства — до покупки нового оборудования.',
   sections:[
    ['Отделите проблему интернета от проблемы Wi-Fi',
     'Сначала измерьте скорость через кабель Ethernet на компьютере, подключённом к роутеру, затем повторите тест по Wi-Fi рядом с ним. Проведите несколько измерений в разное время, остановив большие загрузки. Если и по кабелю результат плохой, проверьте тариф, соединение провайдера и модем до покупки нового роутера. Если по кабелю всё хорошо, а по воздуху медленно — ищите причину в уровне сигнала, помехах и возможностях устройства. Скорость домашней сети и скорость интернета — разные вещи.'],
    ['Поставьте роутер туда, где сигналу легче проходить',
     'Лучшее место для роутера — открытая центральная точка квартиры или дома, желательно выше пола. Не прячьте его за телевизор, в металлический шкаф или в дальний угол за толстыми стенами. Проверьте смартфон в одной комнате с роутером, а потом в проблемной комнате: разница покажет влияние расстояния. Mesh-системы помогают в больших домах, но беспроводные узлы должны хорошо принимать сигнал друг от друга; соединение точек кабелем обычно надёжнее.'],
    ['Правильно используйте 2,4, 5 и 6 ГГц',
     'Диапазон 2,4 ГГц обычно лучше проходит через препятствия, но часто перегружен. На 5 ГГц скорость может быть выше рядом с роутером, зато покрытие через стены слабее. Диапазон 6 ГГц доступен лишь с совместимыми роутером и устройством Wi-Fi 6E или новее. Если автоматический выбор диапазона работает плохо, временно задайте разные названия сетей для теста. В диапазоне 2,4 ГГц часто используют неперекрывающиеся каналы 1, 6 и 11; учитывайте настройки оборудования и местные правила.'],
    ['Проверьте прошивку, драйверы и другие устройства',
     'Обновляйте прошивку через официальный интерфейс роутера, а драйвер Wi-Fi — через производителя устройства или операционную систему. Перезагрузите роутер и сравните работу хотя бы на двух устройствах. Если проблема заметна только на одном ноутбуке, проверьте его драйвер, энергосбережение и состояние адаптера. Посмотрите, не загружают ли канал резервные копии, обновления или другие клиенты. Используйте современную защиту WPA2-AES или WPA3, когда устройства её поддерживают.'],
    ['Покупайте оборудование только после диагностики',
     'Если скорость ограничена старым Wi-Fi-адаптером ноутбука, новый дорогой роутер сам по себе проблему не решит. Для сложной планировки может быть полезнее правильно расположенная дополнительная точка доступа или проводное соединение между узлами. Сравнивайте измерения, сделанные рядом с роутером и в дальних комнатах, с реальной скоростью тарифа. Максимальные числа на коробке роутера — теоретические значения, а не гарантированная скорость интернета во всех помещениях.']
   ]}}
};
