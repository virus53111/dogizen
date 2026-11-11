// Distinct licensed photography, primary-source factual checks, original EN/RU guides.
export const seoPracticalGrowthA = [
  {
    "id": "usb-drive-not-showing-windows",
    "topic": "tech",
    "minutes": 7,
    "published": "2026-11-11",
    "updated": "2026-11-11",
    "image": "https://commons.wikimedia.org/wiki/Special:Redirect/file/Usb%20flash%20drive%20on%20a%20laptop%20closeup.jpg?width=1200",
    "photoAsset": {
      "url": "https://commons.wikimedia.org/wiki/Special:Redirect/file/Usb%20flash%20drive%20on%20a%20laptop%20closeup.jpg?width=1200",
      "source": "https://commons.wikimedia.org/wiki/File:Usb_flash_drive_on_a_laptop_closeup.jpg",
      "credit": "Shixart1985 / Wikimedia Commons — CC BY 2.0",
      "licenseLabel": "CC BY 2.0",
      "license": "https://creativecommons.org/licenses/by/2.0/"
    },
    "mediaAlt": {
      "en": "A USB flash drive plugged into a laptop, photographed close up",
      "ru": "Флешка USB, подключённая к ноутбуку крупным планом"
    },
    "sources": [
      {
        "label": "Microsoft Support — Disk Management in Windows",
        "url": "https://support.microsoft.com/en-gb/windows/experience/storage-filemanagement/disk-management-in-windows"
      },
      {
        "label": "Microsoft Learn — Change or assign a drive letter",
        "url": "https://learn.microsoft.com/en-us/windows-server/storage/disk-management/change-a-drive-letter"
      },
      {
        "label": "Microsoft Support — Safely remove hardware in Windows",
        "url": "https://support.microsoft.com/en-us/windows/hardware/safely-remove-hardware-in-windows"
      }
    ],
    "en": {
      "title": "USB drive not showing up in Windows: how to find it without losing files",
      "seoTitle": "USB Drive Not Showing in Windows? Safe Fixes First",
      "description": "USB stick missing from File Explorer? Check USB ports, Disk Management and drive letters without formatting or losing your files.",
      "subtitle": "Follow safe checks for a flash drive that lights up but does not appear in File Explorer. Protect any important files before taking repair steps.",
      "photoCaption": "Real USB flash drive connected to a laptop. The photograph illustrates the device, not a specific Windows error.",
      "sections": [
        [
          "Start with the USB port and another computer",
          "Unplug the drive only after Windows finishes any file operation. Try a different USB port directly on the computer, not a hub. If possible, test it on another trusted PC and try a second known-good USB stick in the original port. These comparisons separate a faulty flash drive from a damaged port or an unstable hub. If the connector is bent, unusually hot or physically loose, stop inserting it. If the files are irreplaceable, avoid repeated experiments and consider a professional recovery service before making changes."
        ],
        [
          "Look in Disk Management before changing anything",
          "Right-click Start and choose Disk Management, or press Windows+R and enter diskmgmt.msc. Locate the removable drive by its approximate capacity and note the status carefully. A drive can be recognized by Windows even when it is absent from File Explorer. Never assume Disk 0 or the first unfamiliar entry is your USB stick: internal system drives may be shown beside it. If Windows offers to initialize or format a drive containing valuable files, cancel the prompt; those operations are not safe first steps for data recovery."
        ],
        [
          "If the drive has no letter, assign one carefully",
          "A healthy existing partition may appear without a drive letter. Right-click the correct volume and look for Change Drive Letter and Paths, then Add a free letter if the option is available. Microsoft documents this feature, but it should be used only when you have positively identified the removable volume. Do not alter letters assigned to Windows or application disks. If the option is greyed out, the partition may be inaccessible or unallocated; adding a letter will not repair damaged file-system structures."
        ],
        [
          "RAW or unallocated does not mean you must format it",
          "If Disk Management says RAW, Unallocated or Not Initialized, Windows may not recognize the file system or partition layout. The device could also be failing. Formatting, creating a new volume and running destructive partition commands can overwrite information needed for recovery. If you need files on the drive, stop at this point and make a recovery plan. If the drive is new and genuinely empty, follow its manufacturer's setup instructions after confirming that no data needs preserving. Do not trust pop-ups promising a one-click fix."
        ],
        [
          "Check Windows devices without random driver tools",
          "Open Device Manager and inspect Disk drives and Universal Serial Bus controllers for entries that change when you connect the stick. Reconnect once, restart Windows if convenient and use built-in updates from Microsoft or the PC manufacturer's website. A yellow warning icon is a clue, not an instruction to uninstall everything. Avoid downloading unknown 'USB repair' executables. If the drive disappears intermittently or disconnects while copying files, suspect a physical connection or power issue and copy important data while it remains accessible."
        ],
        [
          "Safely eject and know when to ask for help",
          "When Windows recognizes the drive and file operations are finished, use Eject or Safely Remove Hardware before unplugging it. If it opens, copy important files to another location before testing large transfers. Persistent detection failures on multiple PCs, audible clicking from external disks or a connector that is damaged require specialized help. To understand storage technology and backup habits, read /guides/ssd-vs-hdd/ and /guides/backup-321/. The key rule is to preserve data first, not to make the error message disappear."
        ]
      ]
    },
    "ru": {
      "title": "Флешка не отображается в Windows: как проверить без потери данных",
      "seoTitle": "Флешка не видна в Windows: что делать без форматирования",
      "description": "Windows не видит флешку? Проверьте USB-порт, Управление дисками и букву накопителя, не рискуя важными файлами.",
      "subtitle": "Что проверить, если флешка подключена, но не появилась в проводнике. Главное — не форматировать накопитель с нужными данными.",
      "photoCaption": "Настоящая USB-флешка в разъёме ноутбука. Фото иллюстрирует устройство, а не конкретную ошибку Windows.",
      "sections": [
        [
          "Начните с разъёма и другого компьютера",
          "Отсоединяйте накопитель после завершения операций с файлами. Попробуйте другой USB-порт непосредственно на компьютере, без разветвителя. По возможности проверьте флешку на другом доверенном ПК, а к первому подключите заведомо исправный накопитель. Так можно понять, проблема в самой флешке или порте. Если штекер погнут, сильно нагревается или держится неплотно, не продолжайте попытки. При наличии уникальных данных лучше подумать о профессиональном восстановлении до экспериментов."
        ],
        [
          "Найдите накопитель в Управлении дисками",
          "Нажмите правой кнопкой мыши на «Пуск» и выберите «Управление дисками», либо откройте Win+R и введите diskmgmt.msc. Сравните примерный объём накопителя и внимательно посмотрите его состояние. Иногда Windows видит флешку, хотя в проводнике её нет. Не считайте, что первый незнакомый диск в списке — именно флешка: рядом могут быть системные разделы. Если система предлагает инициализацию или форматирование накопителя, на котором находятся нужные файлы, отмените действие."
        ],
        [
          "Если у раздела нет буквы",
          "Иногда исправный раздел виден в Управлении дисками, но ему не назначена буква. Щёлкните правой кнопкой именно на разделе флешки, выберите «Изменить букву диска или путь к диску» и при доступности опции добавьте свободную букву. Microsoft описывает эту процедуру для существующих томов. Важно не менять буквы системных дисков или дисков с программами. Если кнопка неактивна, причина может быть в состоянии раздела, а не в простой настройке отображения."
        ],
        [
          "RAW и «Не распределена» — не повод всё стирать",
          "Надписи RAW, «Не распределена» или «Не инициализирован» могут говорить о повреждении структуры данных, несовместимой файловой системе или неисправном устройстве. Создание нового тома, форматирование и команды очистки разделов способны уничтожить информацию, нужную для восстановления. Если файлы ценны, остановитесь и выберите безопасный способ диагностики. Для новой действительно пустой флешки можно выполнить первоначальную настройку по инструкции, но только после уверенности, что сохранять нечего."
        ],
        [
          "Проверьте Диспетчер устройств",
          "Откройте Диспетчер устройств и посмотрите разделы «Дисковые устройства» и «Контроллеры USB». Обратите внимание, меняется ли список при подключении накопителя. При необходимости перезагрузите компьютер, проверьте обычные обновления Windows и поддержку производителя. Не скачивайте случайные программы «починки флешек» и не удаляйте подряд все USB-драйверы. Если флешка то появляется, то исчезает, вероятны проблемы с контактом, кабелем или питанием; это отдельный повод сохранить доступные данные."
        ],
        [
          "Сохраните файлы и безопасно извлеките накопитель",
          "Если накопитель появился, прежде всего скопируйте важные файлы в другое место, а не запускайте тяжёлые проверки. После окончания копирования используйте «Извлечь» или «Безопасное извлечение устройства». Если флешка не определяется на нескольких компьютерах, повреждена физически или содержит незаменимые данные, не рискуйте самостоятельным ремонтом. Дополнительные статьи: /ru/guides/ssd-vs-hdd/ о накопителях и /ru/guides/backup-321/ о резервных копиях."
        ]
      ]
    }
  },
  {
    "id": "transfer-photos-android-to-windows",
    "topic": "digital",
    "minutes": 7,
    "published": "2026-11-11",
    "updated": "2026-11-11",
    "image": "https://commons.wikimedia.org/wiki/Special:Redirect/file/Phone%20tethering%20on%20laptop.jpg?width=1200",
    "photoAsset": {
      "url": "https://commons.wikimedia.org/wiki/Special:Redirect/file/Phone%20tethering%20on%20laptop.jpg?width=1200",
      "source": "https://commons.wikimedia.org/wiki/File:Phone_tethering_on_laptop.jpg",
      "credit": "Paowee / Wikimedia Commons — CC BY-SA 4.0",
      "licenseLabel": "CC BY-SA 4.0",
      "license": "https://creativecommons.org/licenses/by-sa/4.0/"
    },
    "mediaAlt": {
      "en": "Android smartphone connected to a laptop with a cable, shown for file-transfer illustration",
      "ru": "Смартфон Android соединён кабелем с ноутбуком — иллюстрация передачи файлов"
    },
    "sources": [
      {
        "label": "Google Android Help — Transfer files between computer and Android device",
        "url": "https://support.google.com/android/answer/9064445?hl=en"
      },
      {
        "label": "Google Android Help — Share files between Android and Windows with Quick Share",
        "url": "https://support.google.com/android/answer/13801258?hl=en"
      }
    ],
    "en": {
      "title": "How to transfer photos from Android to a Windows PC: USB and wireless",
      "seoTitle": "Transfer Android Photos to Windows: USB & Wireless",
      "description": "Copy Android photos to a Windows 10 or 11 PC using USB, Quick Share or cloud backup. Verify the files before deleting photos.",
      "subtitle": "Move your pictures from phone to computer, find the camera folder and avoid accidental deletion of originals.",
      "photoCaption": "An Android phone physically connected to a laptop. The photograph shows a cable connection; the computer screen is not a Windows transfer dialog.",
      "sections": [
        [
          "Prepare the cable and unlock your phone",
          "Use a USB cable that supports data transfer, not only charging. Unlock the phone, connect it directly to the Windows computer and watch for an Android notification such as 'Charging this device via USB.' Tap it and choose File transfer or a comparable option. The wording varies between manufacturers and Android versions. Windows may show the phone as a portable device in File Explorer. If you see only a charging symbol, do not assume your photos are lost; the USB mode or cable is often the issue."
        ],
        [
          "Find DCIM, Camera and other picture folders",
          "Open File Explorer, This PC, your phone and its internal storage. Camera photographs are commonly inside DCIM/Camera, while screenshots, downloads and photos saved by apps may be in Pictures, Download or app-specific folders. Select the files you actually want and copy them into a new dated folder on the PC. For a large archive, transfer smaller batches so a loose cable or sleep mode does not interrupt everything. Keep the phone unlocked when its manufacturer requires it for access."
        ],
        [
          "Copy first, verify second, delete much later",
          "Use Copy and Paste rather than Cut or Move when transferring important memories. After the transfer finishes, open several photographs and videos on the computer, compare file counts and check that full-size originals transferred rather than tiny previews. Videos may use formats that need supported codecs; a playback problem does not always mean the copy failed. Back up the new folder to another disk or reputable cloud storage before considering deletion from the phone. An isolated copy on one PC is not a complete backup."
        ],
        [
          "Try Quick Share when a cable is inconvenient",
          "Google's Quick Share can move images and documents between compatible nearby Android and Windows devices. Install the official Quick Share application for Windows, enable Bluetooth and a supported network connection, set the receiver's visibility, select photographs on Android and share to the PC. Confirm the receiver and matching PIN when prompted. Some Samsung PCs use Samsung's own Quick Share app. Verify the Windows system requirements and local network conditions rather than installing random third-party file-transfer utilities."
        ],
        [
          "What if Windows does not detect the Android phone?",
          "Try a different data-capable cable and USB port. Restart the phone and computer, reconnect with the phone unlocked and look again at the USB mode notification. Charging-only cables cannot carry your photos. If another PC recognizes the device, investigate Windows drivers or ports; if no PC recognizes it, the cable or handset port may be at fault. On the Android device, remember that some private folders are inaccessible by normal file transfer. Do not unlock a bootloader or factory-reset a phone simply to retrieve pictures."
        ],
        [
          "Cloud sync is an alternative, not the same as a local copy",
          "Google Photos and other cloud services may already hold backed-up versions of your photos. Check which account is active, whether original-quality backups are enabled and whether the images are truly uploaded before removing anything. Cloud synchronization and local USB copies have different storage, privacy and billing implications. For household photo organization see /guides/organize-family-photo-archive/, and for storage troubleshooting see /guides/phone-storage-full-safe-cleanup/. Keep personal photo folders private unless you intentionally want to share them."
        ]
      ]
    },
    "ru": {
      "title": "Как перенести фотографии с Android на компьютер Windows",
      "seoTitle": "Как перенести фото с Android на компьютер: 3 способа",
      "description": "Перенос фотографий с Android на Windows: USB-кабель, Quick Share и облако. Как найти DCIM и не потерять оригиналы.",
      "subtitle": "Подключаем телефон, копируем снимки и проверяем результат, прежде чем удалять что-либо из памяти смартфона.",
      "photoCaption": "Android-смартфон подключён кабелем к ноутбуку. На фотографии не показано конкретное окно Windows.",
      "sections": [
        [
          "Подготовьте кабель и разблокируйте смартфон",
          "Нужен кабель USB с передачей данных: некоторые провода предназначены только для зарядки. Разблокируйте телефон и подключите его непосредственно к компьютеру. На Android найдите уведомление «Зарядка устройства через USB» или похожий пункт, нажмите и выберите «Передача файлов». Названия меню отличаются у разных производителей. В проводнике Windows телефон должен появиться как переносное устройство. Если устройство только заряжается, это ещё не означает неисправность памяти — возможно, выбран неправильный режим или не подходит кабель."
        ],
        [
          "Найдите папку DCIM и фотографии",
          "Откройте проводник Windows → «Этот компьютер» → название телефона → внутренний накопитель. Фотографии камеры часто лежат в DCIM/Camera, скриншоты — в Pictures или Screenshots, а снимки из приложений могут храниться в других папках. Выделите нужные файлы и скопируйте их в новую папку на компьютере, например с датой поездки. Большие архивы переносите частями, чтобы случайное отсоединение кабеля не прервало всю операцию. При необходимости держите телефон разблокированным."
        ],
        [
          "Сначала копируйте, потом проверяйте",
          "Для важных семейных фотографий выбирайте «Копировать», а не «Вырезать». После переноса откройте несколько изображений и видеороликов на компьютере, сравните количество файлов и убедитесь, что перенесены оригиналы, а не миниатюры. Иногда видеоролик не воспроизводится из-за кодека, хотя файл скопирован правильно. Перед удалением фотографий с телефона сделайте ещё одну резервную копию на другом носителе или в надёжном облаке. Одна папка на одном компьютере не защищает от его поломки."
        ],
        [
          "Передача без кабеля через Quick Share",
          "Официальный Quick Share от Google позволяет пересылать фотографии между совместимыми устройствами Android и Windows поблизости. Установите программу для Windows с сайта Google, включите Bluetooth и сетевое подключение, настройте видимость компьютера. На телефоне выделите фото → «Поделиться» → Quick Share → нужный ПК. Если появляется PIN-код, сравните его на обоих устройствах. Для некоторых компьютеров Samsung предусмотрен другой вариант приложения. Не устанавливайте неизвестные программы, обещающие «ускорить передачу»."
        ],
        [
          "Если компьютер не видит телефон",
          "Попробуйте другой кабель с поддержкой данных, другой разъём USB, затем перезагрузите телефон и компьютер. Подключайте смартфон разблокированным и снова проверьте уведомление о режиме USB. Если тот же телефон виден на другом ПК, причина может быть в настройках или порте Windows. Если его не видит ни один компьютер, проверьте кабель и состояние разъёма смартфона. Не сбрасывайте телефон до заводских настроек и не разблокируйте загрузчик ради обычного копирования: это может привести к потере данных."
        ],
        [
          "Использование облака и сохранение архива",
          "Если включена синхронизация Google Фото, часть снимков уже может находиться в аккаунте Google. Проверьте правильность аккаунта, качество резервных копий и завершение загрузки — не считайте все снимки автоматически сохранёнными. Перенос на компьютер и облачная синхронизация решают разные задачи и имеют ограничения по объёму и приватности. Другие полезные материалы на MURDILIMAX: /ru/guides/organize-family-photo-archive/ и /ru/guides/phone-storage-full-safe-cleanup/. Не публикуйте семейные фото открыто без необходимости."
        ]
      ]
    }
  },
  {
    "id": "wifi-connected-no-internet-windows",
    "topic": "tech",
    "minutes": 7,
    "published": "2026-11-11",
    "updated": "2026-11-11",
    "image": "https://commons.wikimedia.org/wiki/Special:Redirect/file/Close-up%20of%20the%20internet%20router.jpg?width=1200",
    "photoAsset": {
      "url": "https://commons.wikimedia.org/wiki/Special:Redirect/file/Close-up%20of%20the%20internet%20router.jpg?width=1200",
      "source": "https://commons.wikimedia.org/wiki/File:Close-up_of_the_internet_router.jpg",
      "credit": "Shixart1985 / Wikimedia Commons — CC BY 2.0",
      "licenseLabel": "CC BY 2.0",
      "license": "https://creativecommons.org/licenses/by/2.0/"
    },
    "mediaAlt": {
      "en": "Close-up photograph of a home Wi-Fi router, an example of networking hardware",
      "ru": "Настоящий домашний Wi-Fi-роутер крупным планом"
    },
    "sources": [
      {
        "label": "Microsoft Support — Fix Wi-Fi connection issues in Windows",
        "url": "https://support.microsoft.com/en-us/windows/experience/connectivity-networking/fix-wi-fi-connection-issues-in-windows"
      },
      {
        "label": "Microsoft Support — Essential network settings and tasks in Windows",
        "url": "https://support.microsoft.com/en-us/windows/experience/connectivity-networking/essential-network-settings-and-tasks-in-windows"
      }
    ],
    "en": {
      "title": "Wi-Fi connected but no internet in Windows: diagnose the right cause",
      "seoTitle": "Wi-Fi Connected but No Internet? Windows Fixes",
      "description": "Windows shows Wi-Fi connected but no internet? Diagnose the router, ISP, DNS and your PC with safe steps before resetting settings.",
      "subtitle": "A connection to a router is not always a connection to the internet. Identify which part is failing before changing network settings.",
      "photoCaption": "A real home Wi-Fi router, shown as an example of the hardware that connects devices to a local network.",
      "sections": [
        [
          "Determine whether the problem is one PC or the whole network",
          "The Wi-Fi icon confirms a wireless link to the router, not necessarily internet access. On a second phone or laptop, connect to the same Wi-Fi network and open two different websites. If every device fails, focus on the router, modem or internet provider. If only one Windows PC fails, focus on the PC. Also distinguish a single broken website from a network outage by trying a second trusted destination. This simple comparison prevents unnecessary driver changes and repeated router resets."
        ],
        [
          "Restart in the least disruptive order",
          "Turn Wi-Fi off and back on on the affected PC, then reconnect to the correct network. Restart the computer. If the whole household has no internet, check provider outage notices using mobile data and inspect the modem or router status lights according to its manual. Restart network equipment if allowed by the provider; do not press the factory reset button, because it may erase your configuration. After equipment restarts, give it time to reconnect to the service before testing again."
        ],
        [
          "Check IP address and DHCP information",
          "Open Settings → Network & internet to confirm you joined the intended Wi-Fi. In a Windows terminal, use ipconfig to check that the wireless adapter has an IPv4 address and default gateway. An automatically assigned 169.254.x.x address often indicates that the device could not obtain a normal address from DHCP. That can point to a local network or router issue. Do not copy someone else's static IP or DNS configuration blindly: those values vary by network and may create conflicting addresses."
        ],
        [
          "Look for DNS or application-specific faults",
          "If the computer can reach the router but domain names fail, DNS may be involved; captive portals, VPNs and proxy settings can also interfere. Microsoft documents using the network troubleshooter and, for suitable cases, ipconfig /flushdns to clear cached DNS information. First check whether a VPN, browser extension or manually configured proxy has changed the connection. If your public Wi-Fi requires a sign-in page, use its official portal. Avoid downloading unknown network-repair software or disabling security tools just to make a website load."
        ],
        [
          "Leave driver reinstalls and network reset until last",
          "In Windows 11 try the built-in Get Help network troubleshooter; Windows 10 has its own Network troubleshooter in Settings. Update an adapter driver only from Microsoft or the computer manufacturer. Uninstalling network devices or using Network reset can remove saved Wi-Fi, VPN and virtual-adapter settings; Microsoft describes reset as a last resort. If you depend on a VPN for work or have a custom configuration, record those settings and get administrator help before changing them. Also remember Windows 10 standard support ended in October 2025."
        ],
        [
          "Keep a short troubleshooting record",
          "Write down which devices fail, when the issue began, the router status lights and the result of the restart. This helps an ISP or technician distinguish a service outage from a failing router, weak signal or a Windows misconfiguration. If the connection drops mainly in one room, see MURDILIMAX's /guides/wifi-router-placement/ for safe placement advice; for basic speed issues, see /guides/wifi-speed/. An intermittent connection and a completely unavailable internet service require different solutions."
        ]
      ]
    },
    "ru": {
      "title": "Wi-Fi подключён, но интернета нет: что проверить в Windows",
      "seoTitle": "Wi-Fi подключён, но интернета нет: решения Windows",
      "description": "Windows показывает подключение к Wi-Fi без интернета? Проверьте роутер, провайдера, DNS и компьютер без рискованных сбросов.",
      "subtitle": "Ноутбук может быть подключён к роутеру, но не иметь выхода в интернет. Сначала выясняем, на каком участке проблема.",
      "photoCaption": "Настоящий Wi-Fi-роутер. Фото иллюстрирует сетевое устройство и не показывает конкретную неисправность.",
      "sections": [
        [
          "Проверьте, работает ли интернет на других устройствах",
          "Значок Wi-Fi означает связь с роутером, но не гарантирует доступ в интернет. Подключите другой телефон или ноутбук к той же сети и попробуйте открыть два известных сайта. Если интернет не работает нигде, вероятнее проблема роутера, модема или провайдера. Если сбой только на одном компьютере, проверяйте Windows. Также полезно отличить поломку одного сайта от общего отсутствия связи. Такой тест сэкономит время и убережёт от ненужной переустановки драйверов."
        ],
        [
          "Начните с простого перезапуска",
          "Выключите и снова включите Wi-Fi на проблемном компьютере, выберите правильную сеть и переподключитесь. Перезагрузите Windows. Если интернет пропал во всей квартире, проверьте информацию провайдера с мобильного интернета и посмотрите индикаторы роутера по инструкции. При необходимости перезапустите сетевое оборудование обычным способом. Не нажимайте кнопку сброса к заводским настройкам: она может стереть пароль и параметры подключения. После перезапуска подождите, пока модем снова установит связь."
        ],
        [
          "Посмотрите IP-адрес и шлюз",
          "Откройте «Параметры» → «Сеть и Интернет» и убедитесь, что выбрана нужная сеть. В командной строке Windows выполните ipconfig и посмотрите IPv4-адрес и основной шлюз Wi-Fi-адаптера. Адрес вида 169.254.x.x нередко говорит, что компьютер не получил обычный адрес от DHCP-сервера. Это может быть локальная проблема между ноутбуком и роутером. Не копируйте чужие статические адреса и DNS-настройки из интернета без понимания своей сети: можно создать конфликт адресов."
        ],
        [
          "Проверка DNS, VPN и прокси",
          "Если соединение с роутером есть, но сайты не открываются по имени, возможен сбой DNS. Иногда помехой становятся VPN, ручной прокси или портал авторизации общественной сети. В Windows предусмотрено средство устранения сетевых неполадок; в отдельных случаях помогает очистка кеша DNS командой ipconfig /flushdns. Сначала проверьте, не изменяла ли настройки недавняя программа или расширение. Не скачивайте подозрительные «ускорители интернета» и не отключайте защиту компьютера ради одного сайта."
        ],
        [
          "Когда нужны обновления и сброс сети",
          "В Windows 11 воспользуйтесь встроенной диагностикой через Get Help, в Windows 10 — средством устранения неполадок сети. Драйвер адаптера лучше брать из обновлений Windows или с официального сайта производителя ПК. Полный «Сброс сети» и удаление сетевых адаптеров оставляйте на крайний случай: могут исчезнуть сохранённые Wi-Fi, VPN и другие специальные параметры. Если ноутбук рабочий, согласуйте такие действия с администратором. Обычная поддержка Windows 10 закончилась в октябре 2025 года."
        ],
        [
          "Как понять, что делать дальше",
          "Запишите, на каких устройствах проблема, когда она началась и как ведут себя индикаторы роутера. Эти сведения полезны при разговоре с провайдером или мастером. Если Wi-Fi пропадает только в дальней комнате, вероятнее причина в покрытии: читайте /ru/guides/wifi-router-placement/. Если подключение есть, но скорость низкая, полезна статья /ru/guides/wifi-speed/. Слабый сигнал и авария у провайдера — разные случаи, для которых нужны разные решения."
        ]
      ]
    }
  }
];
