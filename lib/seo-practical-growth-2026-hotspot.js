// Sourced bilingual troubleshooting guide with licensed photograph.
export const seoHotspotGuide = {
  "id": "phone-hotspot-not-working-laptop",
  "topic": "digital",
  "minutes": 7,
  "published": "2026-11-11",
  "updated": "2026-11-11",
  "image": "https://commons.wikimedia.org/wiki/Special:Redirect/file/Person%20works%20on%20laptop%20while%20holding%20smartphone%20in%20living%20room.jpg?width=1200",
  "photoAsset": {
    "url": "https://commons.wikimedia.org/wiki/Special:Redirect/file/Person%20works%20on%20laptop%20while%20holding%20smartphone%20in%20living%20room.jpg?width=1200",
    "source": "https://commons.wikimedia.org/wiki/File:Person_works_on_laptop_while_holding_smartphone_in_living_room.jpg",
    "credit": "Shixart1985 / Wikimedia Commons — CC BY 2.0",
    "licenseLabel": "CC BY 2.0",
    "license": "https://creativecommons.org/licenses/by/2.0/"
  },
  "mediaAlt": {
    "en": "Person holding a smartphone beside an open laptop",
    "ru": "Человек со смартфоном рядом с открытым ноутбуком"
  },
  "sources": [
    {
      "label": "Google Android Help — Share mobile connection by hotspot or tethering",
      "url": "https://support.google.com/android/answer/9059108?hl=en"
    },
    {
      "label": "Apple Support — Troubleshoot Personal Hotspot connections",
      "url": "https://support.apple.com/en-us/119837"
    },
    {
      "label": "Microsoft Support — Fix Wi-Fi connections in Windows",
      "url": "https://support.microsoft.com/en-us/windows/experience/connectivity-networking/fix-wi-fi-connection-issues-in-windows"
    }
  ],
  "en": {
    "title": "Laptop won't connect to phone hotspot: what to check first",
    "seoTitle": "Laptop Won't Connect to Phone Hotspot? 6 Fixes",
    "description": "Laptop cannot connect to an Android or iPhone hotspot? Check mobile data, hotspot password, Wi-Fi band and Windows networking safely.",
    "subtitle": "Diagnose a missing or disconnected phone hotspot without changing unrelated router settings or switching off Wi-Fi security.",
    "photoCaption": "A person uses a phone beside a laptop. The photograph does not show an actual hotspot error.",
    "sections": [
      [
        "First check cellular data on the phone",
        "Switch Wi-Fi off on the phone, leaving mobile data on, and open two websites. If the phone itself has no mobile internet, it cannot share that connection with the laptop. Check signal strength, a data limit and any carrier outage. Some plans restrict tethering, so read your provider's current terms. A hotspot that is invisible to the laptop is a different problem from a hotspot that appears and connects but has no internet; knowing which symptom occurs avoids unnecessary changes."
      ],
      [
        "Check hotspot name, password and permissions",
        "On Android use Settings or Quick Settings to enable Wi-Fi hotspot under Hotspot and tethering; names vary by manufacturer. On iPhone open Settings → Personal Hotspot → Allow Others to Join, if your carrier supports the feature. Look at the exact network name and case-sensitive password, then connect to that network on the laptop. If Windows saved an old password, forget the saved network and enter it again. Keep the devices nearby during testing and make sure the phone has enough battery."
      ],
      [
        "Try the compatibility band when the network is invisible",
        "A laptop may not support every wireless frequency or hotspot security mode. Many Android phones let you choose a 2.4 GHz band instead of 5 GHz. On supported iPhones, Maximize Compatibility can help some older devices, but Apple warns it can reduce security or performance. Change only the relevant setting and test again. Keep a strong password with a supported protected security mode; do not remove hotspot security to force a connection. Note which band successfully works for future travel."
      ],
      [
        "Test Windows without removing drivers immediately",
        "Toggle Wi-Fi off and back on in Windows, restart the laptop and phone, and verify you have chosen the right hotspot. If the laptop joins ordinary home Wi-Fi but cannot find the phone's network, prioritize band and phone hotspot settings. If no Wi-Fi networks appear at all, run the Windows network troubleshooter and look at the adapter. Windows 11 offers Get Help diagnostics. Avoid factory-resetting your home router, because it does not control the phone hotspot and resetting it could disconnect everyone."
      ],
      [
        "Connected to hotspot but still offline?",
        "Try opening a website through cellular data on the phone with its own Wi-Fi disabled. Check for an exhausted tethering allowance, a roaming restriction, VPN configuration or battery saver that may interfere on that specific device. Some hotspots automatically shut down when idle or limit the number of clients. Test a second laptop or tablet if available. If every connected device is offline while mobile internet works on the phone, consult the mobile operator and the phone manufacturer's guidance rather than reinstalling laptop software."
      ],
      [
        "Consider USB tethering and protect your data plan",
        "Most Android phones can share mobile data with a Windows computer through USB tethering if you use a data-capable cable and your plan permits it. An iPhone may have additional platform-specific requirements. Hotspot use can drain the battery and use large quantities of data during Windows updates or cloud synchronization. Turn the hotspot off when no longer needed and avoid sharing its password with strangers. Related guides: /guides/wifi-connected-no-internet-windows/ and /guides/wifi-router-placement/."
      ]
    ]
  },
  "ru": {
    "title": "Ноутбук не подключается к точке доступа телефона: что проверить",
    "seoTitle": "Ноутбук не видит точку доступа телефона: 6 решений",
    "description": "Ноутбук не подключается к раздаче интернета Android или iPhone? Проверьте мобильные данные, пароль, диапазон Wi-Fi и Windows.",
    "subtitle": "Почему ноутбук не видит Wi-Fi телефона, не принимает пароль или подключается без интернета, и что с этим делать.",
    "photoCaption": "Смартфон рядом с ноутбуком. На фотографии не показана конкретная ошибка подключения.",
    "sections": [
      [
        "Проверьте мобильные данные на телефоне",
        "Отключите Wi-Fi на телефоне, оставив мобильный интернет, и откройте два сайта. Если на смартфоне нет связи через оператора, раздать её ноутбуку не получится. Проверьте сигнал, лимит трафика и возможную аварию у оператора. Некоторые тарифы ограничивают режим модема, поэтому сверьтесь с условиями своего плана. Важно различать две ситуации: ноутбук не видит точку доступа вообще и ноутбук подключается, но сайты не открываются. Эти случаи требуют разных действий."
      ],
      [
        "Проверьте имя сети и пароль",
        "На Android включите «Точку доступа» в настройках или быстрых переключателях: названия меню зависят от производителя. На iPhone найдите «Настройки» → «Режим модема» → «Разрешать другим», если функция доступна у оператора. Запомните точное имя сети и пароль с учётом регистра букв, затем найдите сеть на ноутбуке. Если Windows сохранила старый пароль, удалите сеть из известных и подключитесь заново. Во время проверки держите телефон рядом и убедитесь, что его аккумулятор заряжен."
      ],
      [
        "Если сеть не видна, проверьте диапазон Wi-Fi",
        "Не каждый ноутбук поддерживает все диапазоны и режимы защиты точки доступа. В некоторых Android-смартфонах можно переключиться с 5 ГГц на 2,4 ГГц. У поддерживаемых моделей iPhone есть «Максимальная совместимость»; Apple предупреждает о возможном снижении скорости и защиты. Меняйте по одной настройке, затем снова ищите сеть. Не делайте точку доступа открытой без пароля ради подключения: посторонние могут потратить ваш мобильный трафик. Оставьте надёжный пароль и защищённый режим сети."
      ],
      [
        "Проверьте Windows без переустановки драйверов",
        "Выключите и включите Wi-Fi на ноутбуке, перезагрузите оба устройства и убедитесь, что выбираете правильное имя сети. Если ноутбук нормально подключается к домашнему роутеру, а к телефону нет, в первую очередь проверьте параметры раздачи на смартфоне. Если вообще не видит сети, запустите стандартную диагностику Windows и проверьте адаптер. В Windows 11 предусмотрена помощь Get Help. Не сбрасывайте настройки домашнего роутера: он не управляет точкой доступа телефона, а сброс отключит остальных пользователей."
      ],
      [
        "Если сеть подключена, но интернета нет",
        "Проверьте мобильный интернет на телефоне с выключенным Wi-Fi. У оператора может закончиться отдельный лимит раздачи, даже если обычные сайты продолжают работать. На некоторых моделях раздаче мешают экономия энергии, ограничения количества устройств или настройки VPN. Проверьте, не отключается ли точка доступа автоматически при простое. При возможности подключите к ней другое устройство. Если все устройства без интернета, а сам телефон работает, обратитесь к инструкции производителя и оператору."
      ],
      [
        "USB-модем и расход трафика",
        "Большинство Android-телефонов могут раздавать мобильный интернет компьютеру Windows через USB-кабель с передачей данных при поддержке тарифа. Для iPhone могут действовать дополнительные требования. Режим модема быстрее разряжает батарею и иногда расходует много трафика во время обновлений Windows или синхронизации файлов. После использования отключайте раздачу и не передавайте пароль незнакомым людям. Связанные статьи: /ru/guides/wifi-connected-no-internet-windows/ и /ru/guides/wifi-router-placement/."
      ]
    ]
  }
};
