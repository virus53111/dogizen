const published = '2026-11-16';

export const techTroubleshootingGuides = [
  {
    id: 'gmail-storage-full-not-receiving-email',
    photoAsset: {
      url: 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Person%20works%20on%20laptop%20while%20holding%20smartphone%20in%20living%20room.jpg?width=1200',
      source: 'https://commons.wikimedia.org/wiki/File:Person_works_on_laptop_while_holding_smartphone_in_living_room.jpg',
      credit: 'Shixart1985 / Wikimedia Commons — CC BY 2.0',
      licenseLabel: 'CC BY 2.0',
      license: 'https://creativecommons.org/licenses/by/2.0/'
    },
    mediaAlt: {en: 'Person holding a phone beside a laptop', ru: 'Человек держит телефон рядом с ноутбуком'},
    topic: 'digital',
    minutes: 6,
    published,
    updated: published,
    sources: [
      {label: 'Google One — Manage storage in Drive, Gmail and Photos', url: 'https://support.google.com/googleone/answer/6374270?hl=en'},
      {label: 'Gmail Help — Search operators', url: 'https://support.google.com/mail/answer/7190?hl=en'},
      {label: 'Google Drive Help — Find or recover a file', url: 'https://support.google.com/drive/answer/1716222?hl=en'}
    ],
    en: {
      title: 'Gmail storage full? How to start receiving email again',
      seoTitle: 'Gmail Storage Full and Not Receiving Email? How to Fix It',
      description: 'Check what fills your Google account, free space without losing important files, and test incoming Gmail before asking senders to resend.',
      subtitle: 'Check the account quota, clear space in the service using it, then test delivery from another address.',
      sections: [
        ['Check whether storage is actually full', 'Open Google One storage in a browser and check the avatar so you are looking at the same account as the affected inbox. Gmail, Drive and Google Photos can draw on the same account quota. If the storage indicator has room and only one sender is missing, check Spam and All Mail, then ask that sender for the delivery error. A work or school Google account may have a storage policy set by its administrator.'],
        ['Free space where it will make a difference', 'Use the storage breakdown to pick a service. In Gmail, try has:attachment larger:10M older_than:1y to find older messages with large attachments. It is a search, so inspect results before selecting anything. In Drive, open Storage to see large files owned by the account. In Photos, review videos before deleting rows of small images. Saving a file elsewhere helps only if you open that copy and check it first.'],
        ['Review the trash before emptying it', 'Deleted mail and Drive files can still count toward storage while they remain in Trash. Gmail Spam can count too. Review those folders and permanently delete only items you recognise and no longer need. In Google Photos, deleting a backed-up image can remove it from devices where backup is enabled; verify any independent copy before deleting it. If you deleted something by mistake and it is still in Trash, restore it before continuing.'],
        ['Test with a fresh message from another address', 'Refresh the storage page after cleanup. The quota display may take time to update, particularly after a large deletion. When there is headroom, ask a trusted sender to send a new message with a unique subject and no attachment. Check the inbox and Spam in Gmail on the web. If an earlier message bounced while your account was full, ask for a resend after this test arrives.'],
        ['If web Gmail still receives nothing', 'Ask for the exact delivery error rather than a screenshot of the compose window. If the test lands in web Gmail but not the phone app, focus on account selection and sync on that device. If only an attachment-heavy message fails, test another small message first. When mail remains blocked across senders after the quota updates, use Google Account support or contact the administrator of a managed mailbox.']
      ]
    },
    ru: {
      title: 'Хранилище Gmail заполнено и письма не приходят: что делать',
      seoTitle: 'Gmail не принимает письма: как освободить место',
      description: 'Как проверить квоту Google, безопасно освободить место в Gmail, Диске или Фото и проверить, возобновился ли приём писем.',
      subtitle: 'Проверьте, какой сервис занял место, освободите его и отправьте пробное письмо с другого адреса.',
      sections: [
        ['Убедитесь, что причина в хранилище', 'Откройте хранилище Google One в браузере и проверьте аватар: аккаунт должен совпадать с адресом проблемного ящика. Gmail, Диск и Google Фото могут расходовать одну квоту. Если место есть и письмо не приходит только от одного отправителя, проверьте «Спам» и «Вся почта», затем попросите переслать текст ошибки доставки. У рабочего или учебного аккаунта лимит может определять администратор.'],
        ['Начните с сервиса, который занял больше всего места', 'Откройте разбивку по сервисам. В Gmail запрос has:attachment larger:10M older_than:1y покажет старые письма с крупными вложениями. Сначала просмотрите результаты. На Диске откройте раздел «Хранилище» и проверьте крупные файлы, которые принадлежат вам. В Google Фото начните с больших видео. Перед удалением важного файла откройте резервную копию и убедитесь, что она читается.'],
        ['Проверьте корзину перед окончательным удалением', 'Письма и файлы на Диске могут занимать место, пока находятся в корзине. Спам в Gmail тоже может учитываться. Просмотрите папки и удалите окончательно только те элементы, которые точно не нужны. Удаление резервной копии снимка в Google Фото может затронуть устройства с включённым копированием. Если нужный файл ещё в корзине, восстановите его до очистки.'],
        ['Попросите отправить новое пробное письмо', 'Обновите страницу хранилища. Показатель квоты может меняться с задержкой, особенно после удаления большого объёма данных. Когда появится свободное место, попросите знакомого отправить письмо без вложения с уникальной темой. Проверьте входящие и спам в веб-версии Gmail. Если предыдущее письмо вернулось отправителю из-за переполнения, попросите прислать его повторно после успешного теста.'],
        ['Если письма по-прежнему не видны', 'Попросите отправителя сообщить точный текст ошибки доставки. Если письмо видно в браузере, но нет в приложении телефона, проверьте аккаунт и синхронизацию на телефоне. Если не проходит только письмо с большим вложением, сначала повторите тест с коротким сообщением. Когда квота обновилась, но почту не удаётся получить от разных отправителей, обратитесь в поддержку Google или к администратору рабочего ящика.']
      ]
    }
  },
  {
    id: 'printer-offline-windows-11',
    photoAsset: {
      url: 'https://commons.wikimedia.org/wiki/Special:Redirect/file/HP%20Deskjet%20D1560%20Open%20Cover.jpg?width=1200',
      source: 'https://commons.wikimedia.org/wiki/File:HP_Deskjet_D1560_Open_Cover.jpg',
      credit: 'MarcoTangerino / Wikimedia Commons — Public domain',
      licenseLabel: 'Public domain',
      license: 'https://commons.wikimedia.org/wiki/File:HP_Deskjet_D1560_Open_Cover.jpg#Licensing'
    },
    mediaAlt: {en: 'HP Deskjet inkjet printer with its cover open', ru: 'Струйный принтер HP Deskjet с открытой крышкой'},
    topic: 'tech',
    minutes: 6,
    published,
    updated: published,
    sources: [
      {label: 'Microsoft Support — Offline printer troubleshooting', url: 'https://support.microsoft.com/en-us/windows/hardware/printer/troubleshooting-offline-printer-problems-in-windows'},
      {label: 'Microsoft Support — Print jobs stuck in the queue', url: 'https://support.microsoft.com/en-us/windows/hardware/printer/fix-print-job-stuck-in-queue-errors-in-windows'},
      {label: 'Microsoft Support — Printer connection and printing problems', url: 'https://support.microsoft.com/en-us/windows/hardware/printer/fix-printer-connection-and-printing-problems-in-windows'}
    ],
    en: {
      title: 'Printer offline in Windows 11? Find what is blocking printing',
      seoTitle: 'Printer Offline in Windows 11: Connection and Queue Fixes',
      description: 'Find out why Windows 11 shows your printer as offline. Check the printer itself, Wi-Fi or USB, the selected device and stuck print jobs.',
      subtitle: 'Start at the printer, then use one test page to separate a connection problem from a stuck queue or an application setting.',
      sections: [
        ['Check the printer before changing Windows', 'Wake the printer and read the display or indicator lights. Clear an obvious paper jam or load paper following the model’s instructions. If it can print a status report directly from its menu, try that. A report that prints shows the device can handle at least that job; a report that fails points you toward the printer itself before you spend time reinstalling Windows drivers.'],
        ['Trace the one connection you actually use', 'For USB, connect directly to the PC with a working data cable and test another port if needed. For Wi-Fi, compare the network name shown on the printer with the one used by the computer. Guest networks may isolate devices even when both can reach the internet. If the router was replaced, reconnect the printer to the current network using its own controls or manufacturer instructions; avoid resetting a working router.'],
        ['Select the right installed printer and open its queue', 'Open Settings → Bluetooth & devices → Printers & scanners. Several printer entries can have nearly identical names after a router or connection change. Select the current printer and open its queue. Cancel your own stuck jobs, keeping any files you need to print again. On a shared printer, check with colleagues before clearing a queue. Print one test page so you can tell whether the job now reaches the device.'],
        ['Use Windows diagnostics if the queue still stalls', 'Run the printer troubleshooter in Windows 11 through Get Help. If jobs still remain stuck even after the device is reachable, restart Print Spooler from Services if your permissions allow it. This can interrupt other print jobs on the same computer, so avoid it during shared work without checking. Try a simple test job again before removing the printer or changing drivers.'],
        ['Re-add the device only after the basic tests', 'If the printer is reachable and Windows still holds an obsolete entry, note its model and connection details before removing and re-adding it through Printers & scanners. Use Windows or the manufacturer’s official driver for your model and system. If the Windows test page prints but one application still fails, check the selected printer, page size and settings in that application’s print dialog.']
      ]
    },
    ru: {
      title: 'Принтер «Не в сети» в Windows 11: как вернуть печать',
      seoTitle: 'Принтер не в сети в Windows 11: что проверить',
      description: 'Что делать, если Windows 11 показывает «Принтер не в сети»: проверяем Wi-Fi или USB, выбираем нужный принтер и разбираем очередь печати.',
      subtitle: 'Проверьте сам принтер и отправьте одну тестовую страницу, чтобы отделить сбой связи от проблемы с очередью или приложением.',
      sections: [
        ['Сначала проверьте сам принтер', 'Выведите принтер из спящего режима и посмотрите на дисплей или индикаторы. Если устройство сообщает о замятии или отсутствии бумаги, устраните проблему по инструкции к модели. Попробуйте распечатать отчёт из меню самого принтера, если такая функция есть. Успех покажет, что устройство справляется хотя бы с этой задачей. Если отчёт не выходит, начните с самого принтера.'],
        ['Проверьте своё подключение: Wi-Fi или USB', 'При USB-подключении попробуйте исправный кабель передачи данных и разъём непосредственно на компьютере. При Wi-Fi сверьте название сети в меню принтера и на компьютере. Гостевая сеть может разделять устройства даже при работающем интернете. Если недавно заменили роутер, подключите принтер к новой сети по инструкции производителя. Сбрасывать настройки работающего роутера для этого не требуется.'],
        ['Найдите правильный принтер и откройте очередь', 'Откройте «Параметры → Bluetooth и устройства → Принтеры и сканеры». После смены подключения могут остаться несколько записей с похожими названиями. Выберите текущий принтер и откройте его очередь. Отмените свои зависшие задания, сохранив исходные документы. На общем принтере согласуйте очистку с коллегами. Затем отправьте одну тестовую страницу и проверьте, дошла ли она.'],
        ['Запустите диагностику Windows', 'В Windows 11 откройте средство устранения неполадок печати через приложение Get Help («Получить помощь»). Если связь с принтером восстановилась, но задания всё равно зависают, при наличии прав можно перезапустить службу «Диспетчер печати» в окне «Службы». Это может прервать другие задания на компьютере. После перезапуска снова отправьте один простой документ.'],
        ['Переподключайте устройство после основных проверок', 'Если Windows хранит устаревшую запись о доступном принтере, запишите модель и параметры подключения, затем удалите и снова добавьте устройство через «Принтеры и сканеры». Для драйвера используйте Windows или официальный сайт производителя. Если тестовая страница Windows идёт, а отдельная программа не печатает, проверьте выбранный принтер, формат бумаги и настройки в окне печати этой программы.']
      ]
    }
  },
  {
    id: 'airdrop-not-working-iphone-mac',
    photoAsset: {
      url: 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Coffee-cup-apple-iphone.jpg?width=1200',
      source: 'https://commons.wikimedia.org/wiki/File:Coffee-cup-apple-iphone.jpg',
      credit: 'Pexels contributor / Wikimedia Commons — CC0 1.0',
      licenseLabel: 'CC0 1.0',
      license: 'https://creativecommons.org/publicdomain/zero/1.0/'
    },
    mediaAlt: {en: 'An iPhone beside a coffee cup', ru: 'iPhone рядом с чашкой кофе'},
    topic: 'digital',
    minutes: 5,
    published,
    updated: published,
    sources: [
      {label: 'Apple Support — Use AirDrop on iPhone or iPad', url: 'https://support.apple.com/en-il/119857'},
      {label: 'Apple iPhone User Guide — AirDrop discovery and codes', url: 'https://support.apple.com/en-by/guide/iphone/iphcd8b9f0af/27/ios/27'},
      {label: 'Apple Mac User Guide — Send and receive with AirDrop', url: 'https://support.apple.com/en-euro/guide/mac-help/mh35868/27/mac/27'}
    ],
    en: {
      title: 'AirDrop not working between iPhone and Mac? What to check',
      seoTitle: 'AirDrop Not Working on iPhone or Mac: Visibility and Fixes',
      description: 'Diagnose why your iPhone or Mac does not show in AirDrop, when an AirDrop code is required, and how to find a received file.',
      subtitle: 'Find out whether the recipient is invisible, the transfer awaits approval, or the file has already reached its destination.',
      sections: [
        ['Start with one small photo', 'Keep the iPhone and Mac close together, awake and unlocked during the test. Turn on Wi-Fi and Bluetooth on both. Apple also recommends disconnecting Personal Hotspot if either device is using it. From Photos on the sending iPhone, open Share → AirDrop and look for the receiver. A missing name and a visible name with a stuck transfer are two different symptoms.'],
        ['If you cannot see the recipient', 'On iPhone, open Control Centre, touch and hold the connectivity controls and check AirDrop reception. On Mac, check AirDrop in Control Centre or Finder and its discoverability setting. With Contacts Only, the recipient’s card for the sender needs the sender’s Apple Account email address or phone number. For a short test with someone you know, use the available Everyone setting and return to your previous setting afterwards.'],
        ['When AirDrop asks for a code', 'On supported recent software, starting with iOS, iPadOS and macOS 26.2, an AirDrop code may be required when someone outside your contacts sends an item. Follow the prompt on both devices: the recipient gets the code and gives it to the known sender to enter. It is an AirDrop code rather than an Apple Account password or sign-in verification code. Decline unexpected transfer requests.'],
        ['If the name appears but the file does not arrive', 'Look at the recipient’s screen for the Accept prompt. Between devices signed in to the same Apple Account, Apple says the transfer is accepted automatically. Try a single small image before sending a large video or a batch. If it succeeds, confirm available space and retry the larger file. On Mac, check Downloads. On iPhone, a photo may open in Photos and another file may go to the relevant app or Files.'],
        ['Check settings before resetting anything', 'If AirDrop controls are missing or disabled, check the device’s software and whether Screen Time or a school or employer policy limits AirDrop. Restart the two devices and repeat the one-photo test. If the transfer is urgent, choose an approved alternative such as a cable or a private sharing link. Confirm the destination copy opens before deleting the original.']
      ]
    },
    ru: {
      title: 'AirDrop не работает между iPhone и Mac: что проверить',
      seoTitle: 'AirDrop не работает на iPhone и Mac: как исправить',
      description: 'Почему AirDrop не видит iPhone или Mac, когда требуется код AirDrop и где искать полученный файл. Проверка на одном фото.',
      subtitle: 'Разберитесь, почему устройство не видно, как подтвердить передачу и где искать файл после получения.',
      sections: [
        ['Начните с одного небольшого фото', 'Положите iPhone и Mac рядом, разбудите и разблокируйте оба устройства. Включите Wi-Fi и Bluetooth на обоих. Apple также советует отключить «Режим модема», если он используется. На отправляющем iPhone откройте фото и выберите «Поделиться → AirDrop». Если получателя нет в списке, проверяйте видимость. Если он есть, но файл завис, проверяйте подтверждение и получение.'],
        ['Если получатель не виден', 'На iPhone откройте Пункт управления, удерживайте блок сетевых переключателей и проверьте настройки приёма AirDrop. На Mac проверьте доступность в Пункте управления или Finder. Для режима «Только для контактов» у получателя в карточке отправителя должен быть телефон или почта его аккаунта Apple. Для короткой проверки с человеком рядом можно включить доступный режим «Для всех», а затем вернуть прежнюю настройку.'],
        ['Если появился запрос кода AirDrop', 'На поддерживаемых версиях начиная с iOS, iPadOS и macOS 26.2 при отправке от человека вне контактов может потребоваться код AirDrop. Следуйте подсказкам на обоих устройствах. Получатель показывает код знакомому отправителю, а тот вводит его на своём устройстве. Для этого не нужен пароль аккаунта Apple или код входа. Неожиданный запрос на приём файла можно отклонить.'],
        ['Если устройство видно, но файл не появился', 'Проверьте, не ждёт ли экран получателя нажатия «Принять». Между своими устройствами с одним аккаунтом Apple передача принимается автоматически. Начните с одного фото вместо большого видео или пачки файлов. Если оно пришло, проверьте свободное место для большого файла. На Mac загляните в «Загрузки». На iPhone снимок может появиться в «Фото», а документ — в подходящем приложении или «Файлах».'],
        ['Проверьте ограничения и повторите тест', 'Если настройки AirDrop недоступны, проверьте версию системы и ограничения «Экранного времени» либо правила школы или работодателя. Перезагрузите оба устройства и повторите тест с одним фото. Для срочной передачи используйте разрешённую альтернативу, например кабель или приватную ссылку. Удаляйте оригинал только после того, как открыли полученную копию.']
      ]
    }
  }
];
