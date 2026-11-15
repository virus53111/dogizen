// One source-led, genuinely illustrated EN/RU troubleshooting feature.
// No scraped third-party prose, fake screenshots, paid API, or automatic publishing bot.
export const phoneNotificationsGuide2026 = {
 id:'phone-notifications-not-working',
 topic:'digital',
 minutes:11,
 published:'2026-11-15',
 updated:'2026-11-15',
 photoAsset:{
  url:'https://commons.wikimedia.org/wiki/Special:Redirect/file/A%20person%20is%20focused%20on%20their%20smartphone.jpg?width=1200',
  source:'https://commons.wikimedia.org/wiki/File:A_person_is_focused_on_their_smartphone.jpg',
  credit:'Shixart1985 / Wikimedia Commons — CC BY 2.0',
  licenseLabel:'CC BY 2.0',
  license:'https://creativecommons.org/licenses/by/2.0/'
 },
 mediaAlt:{
  en:'Person holding a smartphone at a wooden desk',
  ru:'Человек держит смартфон за деревянным столом'
 },
 sources:[
  {label:'Apple Support — Change notification settings on iPhone',url:'https://support.apple.com/guide/iphone/change-notification-settings-iph7c3d96bab/ios'},
  {label:'Apple Support — Notifications on your Apple Watch',url:'https://support.apple.com/en-gb/108369'},
  {label:'Google Android Help — Control notifications on Android',url:'https://support.google.com/android/answer/9079661?hl=en'},
  {label:'Google Android Help — Limit interruptions with Modes and Do Not Disturb',url:'https://support.google.com/android/answer/9069335?hl=en'},
  {label:'Google Pixel Phone Help — Keep Adaptive Battery and battery optimization on',url:'https://support.google.com/pixelphone/answer/7015477?hl=en'},
  {label:'Samsung Support — Notifications not showing or no sound (updated May 2026)',url:'https://www.samsung.com/uk/support/mobile-devices/what-to-do-if-notifications-are-not-showing-or-there-is-no-sound-on-your-samsung-galaxy-device/'},
  {label:'Samsung Support — Apps are not sending notifications',url:'https://www.samsung.com/us/support/troubleshoot/TSG10001486/'}
 ],
 en:{
  title:'Phone Notifications Not Working? Fix Alerts on Android and iPhone',
  seoTitle:'Phone Notifications Not Working? iPhone & Android Fixes',
  description:'Not getting notifications on iPhone or Android? Diagnose missing, silent or delayed alerts with precise Focus, app settings, battery and Samsung checks.',
  subtitle:'A practical diagnosis for missing, silent or late messages: test one app, trace what is blocking the alert and avoid risky resets.',
  factTable:{
   title:'Match the symptom to the most useful first check',
   headers:['What happens','Common explanation','Start here'],
   rows:[
    ['Only one app is affected','App permission, notification category or the app’s own mute setting','Settings → Notifications → the app'],
    ['Alerts arrive without sound','Silent delivery, volume, Focus or Do Not Disturb','Alert style and current mode'],
    ['Messages appear only after opening the app','Background restrictions, connectivity or app account sync','Background/battery status and app connection'],
    ['iPhone is quiet while Apple Watch is worn','The watch may receive alerts when the iPhone is locked','Apple Watch notification routing'],
    ['Every app stopped after a device change','Global mode, network issue or an OS/app fault','Test on another network and restart safely']
   ]
  },
  stepGuide:{
   title:'A six-step notification check that preserves your data',
   intro:'Use a test notification from someone you trust. Change only one setting at a time and retest; menu labels depend on model and software version.',
   steps:[
    ['Choose one failing app','Check whether its message is actually received when you open it. Note whether the alert is missing, delayed or simply silent.'],
    ['Inspect the app permission','Open the phone’s notification settings for that specific app. Enable the relevant alert category and desired sound/banner.'],
    ['Look for a silencing mode','Temporarily inspect Focus, Sleep, Do Not Disturb or a scheduled routine; do not disable important safeguards blindly.'],
    ['Check app-level mute and account','Open the app and confirm the correct account, chat mute settings and its own push-notification preferences.'],
    ['Test background delivery','Check power-saving restrictions for the affected app, its network access and whether alerts arrive with the screen locked.'],
    ['Restart and update carefully','Restart once, install trusted OS/app updates, and retest. Back up chats or local data before considering reinstalling.']
   ]
  },
  sections:[
   ['First identify whether alerts are missing, silent or merely delayed',
    'A phone that seems to have stopped receiving notifications can actually have three different problems. The app may receive the message but show no banner; it may display an alert silently in Notification Center; or the message may not reach the app until you open it. Those symptoms point to different settings, so avoid resetting the whole phone before making one controlled test. Ask a trusted contact to send a non-sensitive message, keep the screen locked, note the time and compare what happens on the lock screen, inside the notification shade and inside the app. Then repeat the same test while the app is open. If calls and texts work but only one messenger fails, focus on that app. If every app is silent at the same hour each day, check a scheduled quiet mode first. Check whether the notification was dismissed or grouped rather than never delivered. This small diagnosis can save a factory reset and preserve important data.'],
   ['On iPhone, check permissions, Focus and Scheduled Summary',
    'Open Settings → Notifications, select the affected app and check Allow Notifications, Lock Screen, Notification Center, Banners, Sounds and any app-specific options that are available. A disabled banner or hidden lock-screen preview is not the same as an undelivered notification. Next, open Settings → Focus: Sleep, Work and Do Not Disturb can silence apps and can switch on by schedule or automation. Check which apps are allowed or silenced rather than turning off every Focus indefinitely. Under Settings → Notifications → Scheduled Summary, confirm whether the app is included in a batch delivered later instead of immediately. If you pair an Apple Watch, remember that Apple routes alerts to either the watch or iPhone in ordinary circumstances: when the phone is locked, an unlocked watch may display them instead. Check the watch before assuming the phone lost notifications. Menu names vary between iOS releases, so use the search field in Settings if necessary.'],
   ['On Android, inspect each notification category rather than just one switch',
    'Android can control notifications for the entire app and separately for message types within it. Open Settings → Notifications → App notifications, choose the affected app and check whether notifications are enabled. If the app supports categories, make sure the relevant message or call category is permitted. A category set to Silent may still show in the shade but will not vibrate or play a sound; an Alerting category behaves differently. Verify lock-screen display and whether sensitive previews are hidden for privacy. Some manufacturers place these controls under Settings → Apps → the app → Notifications. Also inspect the app itself: many messengers can mute a specific conversation, group, server or channel even while Android permissions are correct. For a controlled test, restore only the relevant category and send a fresh message. Do not grant unnecessary access to unrelated applications or switch off system security features just to make a badge appear.'],
   ['Samsung and Pixel: do not overlook battery restrictions and quiet modes',
    'Samsung documents two easy-to-miss causes: notification categories and apps placed into Sleeping or Deep sleeping lists. An app restricted in the background may not receive ordinary alerts in the way you expect until it becomes active. Check Settings → Battery (or Device care) → Background usage limits on supported Galaxy phones, and remove only the affected app from a sleep list when necessary. Samsung also recommends checking Do Not Disturb and accessibility options if alerts exist but make no sound. On supported Pixel phones, Adaptive Battery and app optimization can change background activity and delay some alerts. Google advises keeping optimization on by default; investigate a specific affected app instead of granting unrestricted battery use to everything. Test under ordinary Wi-Fi and cellular conditions. If notifications work only while the screen stays on or only after launching the app, compare the app’s background permissions, network access and battery restrictions. Exact menus vary by manufacturer and Android version.'],
   ['When messages appear only after opening the app, test the connection and account',
    'A notification is not simply a sound file: the app and its remote service need a working path to the device, and delivery can depend on background access and account settings. Confirm the phone has usable internet access by loading a page, then repeat the test on cellular data and trusted Wi-Fi. This helps distinguish a network-specific issue from an app-specific one without exposing login details. In the app, check that you are signed into the correct account, have not muted a particular conversation and have enabled its own push alerts. Check whether mobile-data restrictions or a VPN or firewall configuration apply to the app; do not remove an employer’s security controls without permission. If the problem began after an update, check the developer’s official status or help page and try the current app version. Delayed alerts can also reflect a provider-side outage, so a phone setting cannot fix every case. Keep a simple record of which network, app and test time reproduces the issue.'],
   ['What to try next—and what not to erase just to make a ping',
    'After confirming the settings, restart the phone once and install any available official operating-system and app updates. Test again before changing another variable. If one app remains broken, check the vendor’s support documentation and the app’s notification options. Avoid clearing all app data, uninstalling a messenger or resetting the device until you know how its local chats, authenticator codes or unsynced files are backed up. Some apps cannot restore content that was stored only on the phone. Factory reset is a last resort for broader device problems, not a first-line notification fix. Likewise, do not disable all battery protection or important privacy controls merely to receive more badges. For related phone power issues, see /guides/why-phone-battery-drains-fast-fix/; for preserving important files before advanced troubleshooting, see /guides/backup-321/. If a time-critical alert is essential, maintain a reliable alternative contact method instead of assuming push notifications are guaranteed.']
  ]
 },
 ru:{
  title:'Не приходят уведомления на Android и iPhone: 12 проверок',
  seoTitle:'Не приходят уведомления на телефон? Android и iPhone',
  description:'Не приходят уведомления на Android или iPhone? Проверьте режим «Не беспокоить», разрешения приложений, «Фокусирование», экономию батареи и сеть.',
  subtitle:'Если сообщения приходят без звука, с задержкой или только после открытия приложения, разберитесь в причине без сброса телефона и потери данных.',
  factTable:{
   title:'Симптомы и первые действия: где искать причину',
   headers:['Что происходит','Возможная причина','С чего начать'],
   rows:[
    ['Не работает одно приложение','Разрешения, категории уведомлений или отключённые оповещения в самом приложении','Настройки → Уведомления → Приложение'],
    ['Уведомления есть, но нет звука','Беззвучная категория, громкость, «Фокусирование» или «Не беспокоить»','Режимы и тип оповещений'],
    ['Сообщение появляется только после открытия','Ограниченная фоновая работа, сеть или синхронизация учётной записи','Батарея и фоновая активность'],
    ['На iPhone тихо, но подключены Apple Watch','Когда iPhone заблокирован, уведомление может уходить на часы','Настройки уведомлений Apple Watch'],
    ['Перестали приходить уведомления отовсюду','Общий режим, неполадка сети или системы','Проверка сети и безопасная перезагрузка']
   ]
  },
  stepGuide:{
   title:'Проверка за шесть шагов — без потери сообщений',
   intro:'Попросите знакомого отправить тестовое несекретное сообщение. Меняйте по одному параметру и повторяйте тест: пункты меню отличаются по модели телефона.',
   steps:[
    ['Выберите одно приложение','Уточните, уведомление отсутствует, приходит поздно или появляется в шторке без звука.'],
    ['Проверьте разрешение','Откройте системные уведомления нужного приложения, затем тип сообщения, звук и всплывающий баннер.'],
    ['Проверьте тихие режимы','Посмотрите «Фокусирование», «Сон», «Не беспокоить» и автоматическое расписание их включения.'],
    ['Откройте настройки приложения','Убедитесь, что выбран нужный аккаунт, чат не заглушён и push-уведомления включены.'],
    ['Проверьте работу в фоне','Сравните доставку с выключенным экраном, настройки батареи, Wi-Fi и мобильный интернет.'],
    ['Обновите и повторите тест','Перезагрузите телефон один раз и обновите приложение. Перед удалением проверьте резервную копию переписок.']
   ]
  },
  sections:[
   ['Сначала выясните: уведомлений нет, они беззвучные или приходят поздно',
    '«Не приходят уведомления» — не всегда одна и та же неисправность. Иногда сообщение уже доставлено, но баннер скрыт; иногда оно лежит в шторке без звука; а иногда появляется только после того, как вы откроете приложение. У этих симптомов разные причины. Поэтому не начинайте со сброса настроек. Попросите знакомого прислать обычное тестовое сообщение, заблокируйте экран и запомните время. Посмотрите, появилась ли запись на экране блокировки, в центре уведомлений или только внутри приложения. Затем повторите отправку при открытом мессенджере. Если всё остальное работает, а один чат молчит, проверьте именно его настройки. Если сразу все приложения становятся тихими в определённое время, ищите расписание режима «Не беспокоить». Иногда уведомление просто сгруппировано, скрыто на экране блокировки или случайно смахнуто. Один такой тест поможет понять причину без удаления переписок и файлов.'],
   ['iPhone: разрешения приложения, «Фокусирование» и сводка уведомлений',
    'На iPhone откройте «Настройки» → «Уведомления» и выберите нужное приложение. Проверьте разрешение на уведомления, экран блокировки, центр уведомлений, баннеры и звуки. Если уведомление видно только в центре, причина может быть в выключенных баннерах, а не в ошибке доставки. Затем зайдите в «Настройки» → «Фокусирование»: режимы «Сон», «Работа» и «Не беспокоить» могут ограничивать оповещения, в том числе включаться автоматически по времени. Посмотрите, какие приложения разрешены в активном режиме, вместо того чтобы навсегда отключать все ограничения. В разделе «Уведомления» проверьте «Сводку по расписанию»: для некоторых приложений она откладывает показ до выбранного времени. Есть важная особенность Apple Watch: если iPhone заблокирован, уведомление обычно может отправляться на разблокированные часы, а не на телефон. Сначала посмотрите их настройки. Названия меню немного различаются в зависимости от версии iOS.'],
   ['Android: одно разрешение ещё не означает, что все оповещения включены',
    'На Android откройте «Настройки» → «Уведомления» → «Уведомления приложений» и выберите нужную программу. На некоторых телефонах этот раздел находится через «Приложения» → название программы → «Уведомления». Проверьте общий переключатель, а затем категории сообщений: у мессенджера могут быть отдельно отключены звонки, личные сообщения, группы или другие события. Категория «Без звука» может по-прежнему показывать запись в шторке, но не вибрировать и не издавать сигнал. Проверьте также показ на экране блокировки и скрытие текста по настройкам конфиденциальности. Откройте сам мессенджер: отдельный чат, группа или канал могли быть заглушены внутри приложения, даже когда Android всё разрешает. Включайте только действительно нужный тип уведомлений, затем попросите отправить новое сообщение. Не устанавливайте случайные «ускорители» и не выдавайте сторонним приложениям доступ к уведомлениям ради такой проверки.'],
   ['Samsung и Pixel: проверьте сон приложений и экономию энергии',
    'На смартфонах Samsung Galaxy важная причина задержек — списки «Спящие» и «Глубоко спящие приложения». Если нужный мессенджер ограничен в фоне, оповещения могут появляться не так, как вы ожидаете. Проверьте «Настройки» → «Батарея» или «Обслуживание устройства» → «Ограничения фонового использования» — путь зависит от модели One UI. При необходимости исключите из списка сна только проблемное приложение. Samsung также советует проверять категории уведомлений, «Не беспокоить» и доступные настройки громкости, если оповещения видны, но молчат. На Google Pixel адаптивная батарея и оптимизация активности могут задерживать некоторые уведомления; при этом Google не рекомендует бездумно отключать оптимизацию для всех программ. Проверьте настройки конкретного приложения и сравните поведение с заблокированным и разблокированным экраном. После изменения одной настройки повторите тест на обычном Wi-Fi и мобильном интернете.'],
   ['Сообщения появляются только при открытии приложения: сеть или аккаунт?',
    'Если сообщения «просыпаются» только после запуска мессенджера, проверьте не только системные переключатели. Приложению и его серверу необходимо действующее соединение, а фоновые ограничения способны задерживать обмен данными. Откройте обычную страницу в браузере, затем сравните тестовые уведомления через домашний Wi-Fi и мобильный интернет. Так можно обнаружить проблему, проявляющуюся лишь в одной сети. В приложении проверьте, что вы вошли в правильную учётную запись и не отключили push-уведомления или отдельную переписку. Посмотрите, нет ли ограничений мобильных данных, VPN или корпоративной сети; не отключайте служебную защиту без разрешения администратора. Если сбой начался сразу после обновления, проверьте официальную страницу поддержки приложения и наличие исправлений. Иногда причина находится на сервере сервиса, и никакой переключатель на смартфоне не восстановит доставку до устранения сбоя. Запишите, когда и при каких условиях он повторяется.'],
   ['Что делать дальше и почему не стоит сразу удалять приложение',
    'Если разрешения и режимы проверены, один раз перезагрузите смартфон и установите официальные обновления приложения и системы. Потом снова отправьте тестовое сообщение. Меняйте настройки последовательно, иначе невозможно понять, какое действие помогло. Не очищайте данные мессенджера и не удаляйте его, пока не знаете, где хранятся переписки, коды аутентификатора и файлы, не попавшие в облако. Некоторые данные после удаления не восстанавливаются. Полный сброс телефона — крайний вариант для широкой системной проблемы, а не первая мера при пропущенном уведомлении. Не отключайте все ограничения батареи, защиту данных и приватность экрана блокировки ради одного всплывающего значка. Если телефон одновременно быстро разряжается, посмотрите /guides/why-phone-battery-drains-fast-fix/. Чтобы не потерять фотографии и важные файлы перед сложной диагностикой, пригодится /guides/backup-321/. И помните: для действительно срочной связи лучше иметь запасной способ контакта — push-уведомления никогда не гарантируют мгновенную доставку.']
  ]
 }
};
