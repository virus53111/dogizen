// Three original demand-led global evergreen guides, each with six full independent chapters per language, primary sources, and an authentic uniquely licensed Commons photograph.
export const globalEvergreenDemandGuides = [
  {
    "id": "jpg-vs-png-vs-webp-best-image-format",
    "topic": "digital",
    "minutes": 9,
    "published": "2026-11-12",
    "updated": "2026-11-12",
    "photoAsset": {
      "url": "https://commons.wikimedia.org/wiki/Special:Redirect/file/Photographer-camera.jpg?width=1200",
      "source": "https://commons.wikimedia.org/wiki/File:Photographer-camera.jpg",
      "credit": "CCØ BAY / Wikimedia Commons — CC0 1.0 (photographer using a camera; resized/cropped for display)",
      "licenseLabel": "CC0 1.0",
      "license": "https://creativecommons.org/publicdomain/zero/1.0/"
    },
    "mediaAlt": {
      "en": "Authentic documentary photograph of a photographer working with a camera",
      "ru": "Настоящая фотография человека с фотокамерой — иллюстрация к выбору форматов цифровых изображений"
    },
    "sources": [
      {
        "label": "MDN — Image file type and format guide",
        "url": "https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Formats/Image_types"
      },
      {
        "label": "Google for Developers — An image format for the Web",
        "url": "https://developers.google.com/speed/webp/"
      },
      {
        "label": "MDN — Responsive images and the picture element",
        "url": "https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/picture"
      },
      {
        "label": "MDN — Understanding image compression and encoding",
        "url": "https://developer.mozilla.org/en-US/blog/image-formats-pixels-graphics/"
      }
    ],
    "en": {
      "title": "JPG vs PNG vs WebP: Which Image Format Should You Use?",
      "seoTitle": "JPG vs PNG vs WebP: Differences and Best Uses",
      "description": "JPG, PNG or WebP? Compare image quality, file size, transparency, screenshots, photographs and browser support, with practical advice for websites and sharing.",
      "subtitle": "The best format depends on the picture: photographs, logos, screenshots and website images benefit from different kinds of compression.",
      "factTable": {
        "title": "Image formats at a glance",
        "headers": [
          "Format",
          "How it works",
          "Best starting use"
        ],
        "rows": [
          [
            "JPG / JPEG",
            "Lossy; no transparency",
            "Photos and broad compatibility"
          ],
          [
            "PNG",
            "Lossless; transparency",
            "Screenshots, graphics and originals"
          ],
          [
            "WebP",
            "Lossy or lossless; transparency",
            "Optimized website images"
          ]
        ]
      },
      "sections": [
        [
          "The quick answer: choose the format for the content",
          "For most ordinary photographs, JPG remains a practical choice because virtually every device and editing application can open it. For screenshots, diagrams, pixel-perfect graphics and transparent backgrounds, PNG is usually more appropriate. For images published on a modern website, WebP can offer smaller files at comparable visible quality and also supports transparency. These are starting points, not unbreakable rules: a detailed photographic source image might be best preserved in its original high-quality format, while a small transparent graphic can be efficiently encoded as WebP. The MDN image-format guide separates formats by compression, transparency, visual detail and compatibility. It is a mistake to decide only by a three-letter extension or to assume that a format makes any picture look sharper by itself. What matters is the source quality, encoder settings and how the picture will actually be used."
        ],
        [
          "JPG: great for photos, less suitable for sharp text",
          "JPG, also written JPEG, uses lossy compression. The encoder removes some visual information to produce a smaller file, often without an obvious difference in a natural photograph at sensible quality settings. That makes it useful for family photos, travel pictures and sharing images across older devices. The trade-off is visible around small lettering, thin lines and sharp borders: repeated saving at low quality can produce blockiness, ringing and blur. Standard JPEG also has no alpha channel, so it cannot make the background transparent. A JPG of a screenshot may look worse than a PNG even when the file is larger. If your goal is archiving an original photo, keep the original file and create a separate exported JPG for sending or posting. Merely changing .png to .jpg in a filename does not convert the underlying image data."
        ],
        [
          "PNG: preserve exact pixels, text and transparency",
          "PNG employs lossless compression, so saving a PNG can reproduce the encoded pixel values without the detail losses typical of lossy JPEG. This makes it a good choice for screenshots containing text, software interfaces, charts, line drawings and graphics with a transparent background. PNG can store full-color images, but a complex photographic PNG may be substantially larger than a visually similar JPG or lossy WebP. Lossless does not mean magical: converting a previously damaged JPEG to PNG cannot restore detail already discarded. Nor does PNG guarantee that the original screenshot is legible if it was captured at low resolution. The practical rule is to use PNG when maintaining crisp boundaries or transparency matters more than minimizing bytes. For a simple vector logo, SVG may be more suitable than any of these raster formats if the trusted original vector source is available."
        ],
        [
          "WebP: smaller web images without giving up flexibility",
          "WebP supports both lossy and lossless encoding, transparent backgrounds and animation. Google describes typical compression improvements against JPEG and PNG under controlled comparisons, but the exact saving depends on the particular image, resolution and encoder quality. A high-detail photo may shrink considerably; a tiny icon may barely change. WebP works in current mainstream browsers, yet older software, some upload forms or printing workflows may still expect JPG or PNG. If you run a website, export a suitable WebP version, keep the source original and measure whether the new picture looks acceptable at its displayed dimensions. Make sure important metadata, colour profiles and orientation survive the conversion when required. Avoid repeatedly converting a lossy JPG back and forth between formats, because no new original detail is recovered. The right comparison uses images at similar perceived quality rather than merely comparing files created with arbitrary settings."
        ],
        [
          "How to pick a format for five everyday situations",
          "For a holiday photo going into a message or an email, start with JPG and use a reasonable export quality. For a screenshot of error text, a spreadsheet or a diagram, choose PNG so letters and straight lines stay crisp. For a website hero photograph, compare WebP or AVIF against a high-quality JPG fallback, assessing both appearance and bytes. For a transparent logo, prefer SVG when the graphic was created as a safe vector; otherwise use PNG or a transparent WebP if the target app accepts it. For evidence you may need to edit again later, preserve the untouched original separately rather than replacing it with a compressed export. Consider resolution as well: uploading a gigantic image that will only display a few hundred pixels wide wastes bandwidth. File format, dimensions and encoder settings all influence the final download size and sharpness."
        ],
        [
          "Can you convert between JPG, PNG and WebP safely?",
          "Use a trustworthy on-device image editor, built-in export function or reputable conversion tool and select the actual destination format rather than renaming the extension. Preview the output at full size, especially text edges, transparent corners and subtle gradients. If transparency is converted to JPG, the background must be filled with a solid colour; it cannot remain transparent. If you convert JPG to PNG, the file might grow while retaining all the old JPEG artifacts. For a public site, the HTML picture element can offer WebP first and a JPEG or PNG fallback when appropriate, as explained by MDN. If the image contains private documents, faces or location information, an offline converter reduces unnecessary exposure to third-party uploads, and metadata handling should be checked. For more useful digital guidance, explore /topics/digital/ or see /guides/remove-photo-location-metadata/ before sharing sensitive photos."
        ]
      ],
      "photoCaption": "Documentary photograph of a photographer with a camera by CCØ BAY, Wikimedia Commons, CC0 1.0; resized and cropped. This photo illustrates digital photography, not a direct visual comparison between compression formats."
    },
    "ru": {
      "title": "JPG, PNG или WebP: какой формат изображения лучше?",
      "seoTitle": "JPG vs PNG vs WebP: что лучше для фото и сайта?",
      "description": "JPG, PNG или WebP: сравнение качества, размера файла, прозрачности и совместимости. Какой формат выбрать для фотографий, скриншотов и сайта.",
      "subtitle": "Для обычной фотографии, скриншота и картинки на сайте часто нужны разные форматы. Разбираем различия без мифов о «лучшем расширении».",
      "factTable": {
        "title": "Форматы изображений: краткое сравнение",
        "headers": [
          "Формат",
          "Особенности",
          "Когда выбирать"
        ],
        "rows": [
          [
            "JPG / JPEG",
            "Сжатие с потерями; без прозрачности",
            "Фотографии и совместимость"
          ],
          [
            "PNG",
            "Без потерь; с прозрачностью",
            "Скриншоты, схемы и исходники"
          ],
          [
            "WebP",
            "С потерями или без; с прозрачностью",
            "Оптимизация изображений для сайта"
          ]
        ]
      },
      "sections": [
        [
          "Короткий ответ: выбор зависит от самой картинки",
          "Для обычных фотографий JPG остаётся удобным универсальным форматом: его открывают почти любые устройства и редакторы. Для скриншотов, схем с тонкими линиями, графиков и прозрачного фона чаще подходит PNG. Для изображений на современном сайте стоит попробовать WebP: он умеет эффективно сжимать картинки, поддерживает прозрачность и помогает уменьшать размер загрузки. Но эти правила не абсолютны. Исходный качественный снимок лучше сохранять отдельно в первоначальном виде, а экспортировать более лёгкую копию для публикации. Руководство MDN сравнивает форматы по способу сжатия, поддержке прозрачности и точности деталей. Расширение само по себе не улучшает качество фотографии: гораздо важнее разрешение исходника и параметры экспорта. Нельзя также сделать настоящий PNG простым переименованием файла .jpg."
        ],
        [
          "JPG: хороший выбор для фото, но не для мелкого текста",
          "JPG, или JPEG, использует сжатие с потерями: часть визуальной информации удаляется, чтобы файл занимал меньше места. На пейзажах, портретах и обычных фотографиях при разумных настройках разница часто малозаметна. Это делает JPG удобным для семейных снимков, путешествий и отправки изображений знакомым. Проблемы возникают вокруг мелких букв, тонких контрастных линий и резких границ: на них могут появляться размытость и характерные артефакты. При многократном экспорте с потерями качество может ухудшаться. Обычный JPG не поддерживает прозрачный фон, поэтому изображение с вырезанным объектом при таком сохранении должно получить фон определённого цвета. Скриншот приложения часто выглядит чётче в PNG. Если снимок важен для архива, оставьте оригинал и создавайте отдельные JPG-копии для публикации."
        ],
        [
          "PNG: точные пиксели, текст и прозрачный фон",
          "PNG применяет сжатие без потерь, позволяя сохранить значения пикселей без тех искажений, которые обычно возникают при экспорте в JPG. Поэтому формат особенно подходит для скриншотов с текстом, интерфейсов программ, графиков, схем и изображений с прозрачным фоном. Он умеет хранить полноцветные картинки, но сложная фотография в PNG нередко занимает гораздо больше места, чем визуально похожий JPG или WebP с потерями. Важное уточнение: сохранение повреждённого JPEG в PNG не восстановит детали, которые были удалены при предыдущем сжатии. И большой PNG не обязательно качественный, если исходная картинка маленькая или неразборчивая. Используйте PNG там, где важны точные границы, мелкие элементы и прозрачность. А для логотипа, созданного из векторных линий, может быть разумнее сохранить оригинальный SVG, если он подходит для нужного сервиса."
        ],
        [
          "WebP: удобный современный формат для сайтов",
          "WebP поддерживает и сжатие с потерями, и без потерь, прозрачность и даже анимацию. По данным разработчиков Google, при сопоставимом визуальном качестве файлы WebP во многих тестовых условиях оказываются меньше JPEG или PNG; однако точный результат зависит от картинки, разрешения и настроек кодирования. Фотография с множеством деталей может уменьшиться существенно, а маленькая простая иконка — совсем немного. Все актуальные крупные браузеры умеют показывать WebP, но некоторые старые программы, сервисы печати и формы загрузки могут требовать JPG или PNG. Для сайта стоит сравнить WebP с исходной картинкой в реальном размере на экране, не забывая про цветовой профиль, ориентацию и метаданные. Не нужно многократно конвертировать один и тот же файл с потерями: это не возвращает уже утраченную информацию. Сравнивайте размер при похожем качестве, а не при случайных настройках."
        ],
        [
          "Пять практических ситуаций: что выбрать прямо сейчас",
          "Если отправляете снимок из путешествия по электронной почте или в мессенджере, обычно достаточно JPG с нормальным качеством экспорта. Если показываете ошибку Windows, интерфейс сайта или таблицу, лучше PNG: буквы и границы останутся чёткими. Для большой фотографии на сайте сравните WebP либо AVIF с качественным JPG и проверьте размер загрузки. Для прозрачного логотипа используйте исходный SVG, если он есть и безопасен, либо PNG или WebP с альфа-каналом. Для изображения, которое предстоит редактировать ещё много раз, сохраните нетронутый оригинал отдельно. И не забывайте о разрешении: огромная фотография, которая показывается на экране шириной в несколько сотен пикселей, зря тратит трафик. В результате на скорость и резкость влияют одновременно формат, реальные размеры, качество экспорта и способ показа в браузере."
        ],
        [
          "Как безопасно перевести JPG в PNG или WebP",
          "Откройте изображение в надёжном редакторе и используйте функцию экспорта или «Сохранить как», указав действительный формат. Не пытайтесь конвертировать файл простой заменой букв после точки. Проверьте результат на полном масштабе: мелкий текст, прозрачные углы, плавные переходы цвета и правильную ориентацию. При переводе прозрачного изображения в JPG фон станет непрозрачным — его цвет нужно выбрать. Конвертация JPG в PNG может увеличить размер файла, но не устранит старые артефакты JPEG. Для сайта элемент HTML picture позволяет отдавать WebP и показывать запасной JPG или PNG там, где это необходимо; такой подход описан на MDN. Если исходная фотография содержит личные документы, лица или геометки, лучше использовать локальную программу, а не загружать файл на случайный конвертер. Как убрать данные о местоположении из фотографии, описано в /ru/guides/remove-photo-location-metadata/. Другие инструкции собраны в /ru/topics/digital/."
        ]
      ],
      "photoCaption": "Настоящий снимок человека с фотокамерой от CCØ BAY, Wikimedia Commons, CC0 1.0; уменьшен и кадрирован. Фото иллюстрирует цифровую фотографию, а не показывает разницу качества JPG, PNG и WebP."
    },
    "image": "https://commons.wikimedia.org/wiki/Special:Redirect/file/Photographer-camera.jpg?width=1200"
  },
  {
    "id": "how-to-check-car-tire-pressure",
    "topic": "travel",
    "minutes": 9,
    "published": "2026-11-12",
    "updated": "2026-11-12",
    "photoAsset": {
      "url": "https://commons.wikimedia.org/wiki/Special:Redirect/file/ReifendruckPruefen.jpg?width=1200",
      "source": "https://commons.wikimedia.org/wiki/File:ReifendruckPruefen.jpg",
      "credit": "JEG14 / Wikimedia Commons — public domain (photograph showing a tire-pressure measurement; resized/cropped for display)",
      "licenseLabel": "Public domain",
      "license": "https://commons.wikimedia.org/wiki/File:ReifendruckPruefen.jpg"
    },
    "mediaAlt": {
      "en": "Real photograph showing a tire pressure measurement on a vehicle",
      "ru": "Настоящая фотография проверки давления в автомобильной шине"
    },
    "sources": [
      {
        "label": "NHTSA — TireWise: tire pressure, cold checks and vehicle placard",
        "url": "https://www.nhtsa.gov/vehicle-safety/tires"
      },
      {
        "label": "NHTSA — Summer driving tips, cold tire pressure and label",
        "url": "https://www.nhtsa.gov/summer-driving-tips"
      },
      {
        "label": "Michelin — How to check and maintain tire pressure",
        "url": "https://www.michelinman.com/auto/auto-tips-and-advice/tire-maintenance/tire-pressure"
      },
      {
        "label": "Michelin — How to inflate tires and recheck",
        "url": "https://www.michelinman.com/auto/auto-tips-and-advice/tire-pressure/how-to-inflate-tires"
      }
    ],
    "en": {
      "title": "How to Check Tire Pressure Correctly: PSI, Bar and kPa",
      "seoTitle": "How to Check Car Tire Pressure: Cold PSI Guide",
      "description": "Learn how to check car tire pressure with a gauge, find the correct PSI on the door label, convert bar and kPa, and avoid mistakes with warm tires or TPMS.",
      "subtitle": "A five-minute check can prevent avoidable tyre wear and handling problems. The right target comes from your vehicle, not the number on the tire sidewall.",
      "factTable": {
        "title": "Pressure units: quick conversion, not recommended tire settings",
        "headers": [
          "PSI",
          "Bar (approx.)",
          "kPa (approx.)"
        ],
        "rows": [
          [
            "30 psi",
            "2.07 bar",
            "207 kPa"
          ],
          [
            "32 psi",
            "2.21 bar",
            "221 kPa"
          ],
          [
            "35 psi",
            "2.41 bar",
            "241 kPa"
          ],
          [
            "36 psi",
            "2.48 bar",
            "248 kPa"
          ]
        ]
      },
      "sections": [
        [
          "Find the recommended pressure before touching the valve",
          "Every car has a recommended cold tire pressure determined by its manufacturer. Look for a tire and loading information sticker on the driver's door pillar or inside the door, or consult the vehicle owner's manual. Some cars specify different pressures for the front and rear axles or for different loads; use the figure applicable to your current setup. The number printed on the tire sidewall is commonly a maximum-load or maximum-inflation reference, not the normal pressure you should put in that tire. NHTSA explicitly warns against treating that sidewall value as your everyday target. The correct pressure is often shown in PSI, kPa or bar, depending on where the car was sold. If the door sticker is missing, use the manufacturer's documentation for your exact model, wheel size and load configuration rather than guessing a universal value such as 32 PSI."
        ],
        [
          "Check the tires cold, preferably before your first drive",
          "NHTSA recommends measuring tire pressure at least once a month, including the spare if your car has one, and before long trips. For an accurate comparison with the manufacturer's sticker, the tires should be cold: the vehicle generally has not been driven for at least three hours. Driving warms the tires and the air inside them, which can raise the reading without adding any air. If you measure a warm tire and immediately release air until the gauge matches the cold-pressure label, you may leave the tire underinflated after it cools. When a tire is obviously low during a trip, do not ignore a safety concern merely because it is warm: use suitable professional assistance or add enough air to reach a safe temporary condition, then recheck cold. Inspect tread and sidewalls for visible cuts, bulges, nails or unusual wear while you are nearby."
        ],
        [
          "Measure pressure with a gauge in four simple steps",
          "Park on a level, safe surface away from moving traffic and switch off the vehicle. Unscrew a valve cap, press a reliable tire-pressure gauge firmly and straight onto the valve stem, then read its display or mechanical scale. A brief hiss while attaching the gauge is normal, but a long leak means the gauge may not be seated. Compare the measured value to your vehicle's cold-pressure label for that wheel. If it is low, connect an air compressor, add air in short bursts and remeasure; if it is high while the tire is truly cold, gently release a little air and recheck. Repeat for all road wheels, remembering that front and rear targets may differ, then replace every valve cap. A gauge gives a more useful actual reading than simply looking at the shape of the tire. Many underinflated tires do not look obviously flat."
        ],
        [
          "PSI, bar and kPa: understand the numbers, not just the units",
          "Tire gauges can show pounds per square inch (PSI), bar or kilopascals (kPa). These are different units for the same physical pressure: one bar equals exactly 100 kPa and about 14.5 PSI; one PSI is approximately 6.895 kPa. For instance, 32 PSI corresponds to roughly 2.21 bar or 221 kPa, but that does not mean 32 PSI is the correct setting for every car. If the vehicle sticker is printed in kPa and the compressor shows bar, divide the sticker number by 100. If a gauge shows PSI, multiply bar by approximately 14.5. It is normal for values to be rounded to one decimal place on different gauges. Make adjustments based on the manufacturer's guidance, using the same units on both the label and the gauge when possible. Never confuse a conversion table with a vehicle-specific tire-pressure recommendation."
        ],
        [
          "What does the TPMS warning light actually tell you?",
          "Many vehicles display a tire-pressure warning light or the individual wheel values through a tire pressure monitoring system, often called TPMS. It is a useful warning but not a replacement for checking pressure with a reliable gauge. NHTSA explains that the system may not alert until a tire is significantly underinflated, and readings on the dashboard can change as the tires warm. After setting correct cold pressures, follow your owner's manual for any reset or relearn procedure; it differs between vehicles. If the warning flashes for a period and then remains on, it may indicate a monitoring-system fault rather than just low air. A tire that repeatedly loses pressure needs inspection for punctures, valve leaks or wheel damage. Never keep inflating a visibly damaged tire and driving as usual simply to extinguish a dashboard indicator."
        ],
        [
          "A monthly routine and the mistakes worth avoiding",
          "The simplest routine is to keep a gauge in the car and check all the tires when cold once a month and before major journeys. Record any wheel that regularly drops faster than the others, because a slow leak can be missed by casual visual inspection. Do not use a random pressure from an online chart, do not inflate to the tire's sidewall maximum and do not deflate a warm tire merely to match a cold specification. Check the spare if fitted and remember that tire sealant or run-flat designs may have different manufacturer instructions. If you see a bulge, exposed cords, a large cut or unexplained rapid loss of pressure, seek tire-service assistance instead of treating it as an air-only issue. Correct inflation helps road handling, tire wear and efficiency, but it cannot repair damaged rubber. For additional driving preparation, visit /guides/change-flat-tire-safely/ and /topics/travel/."
        ]
      ],
      "photoCaption": "Authentic photograph showing a tire-pressure check, by JEG14 / Wikimedia Commons, released into the public domain; resized and cropped. The vehicle shown is illustrative: always use your own manufacturer's recommended pressure."
    },
    "ru": {
      "title": "Как правильно проверить давление в шинах: PSI, bar и kPa",
      "seoTitle": "Как проверить давление в шинах: инструкция и PSI",
      "description": "Как измерить давление в шинах автомобиля: холодные колёса, табличка на двери, манометр, PSI, bar и kPa, ошибки и предупреждение TPMS.",
      "subtitle": "Правильное давление указано производителем автомобиля, а не на боковине покрышки. Пошаговая инструкция для любой страны и времени года.",
      "factTable": {
        "title": "Перевод единиц давления — не рекомендованные значения для автомобиля",
        "headers": [
          "PSI",
          "Бар (примерно)",
          "кПа (примерно)"
        ],
        "rows": [
          [
            "30 psi",
            "2,07 бар",
            "207 кПа"
          ],
          [
            "32 psi",
            "2,21 бар",
            "221 кПа"
          ],
          [
            "35 psi",
            "2,41 бар",
            "241 кПа"
          ],
          [
            "36 psi",
            "2,48 бар",
            "248 кПа"
          ]
        ]
      },
      "sections": [
        [
          "Сначала найдите правильное давление для своего автомобиля",
          "У каждой модели автомобиля есть рекомендованное давление в холодных шинах, которое определяет производитель. Чаще всего нужная табличка находится на стойке дверного проёма со стороны водителя или на внутренней стороне двери; сведения также есть в руководстве. В зависимости от нагрузки и конструкции передние и задние колёса иногда требуют разных значений. Число на боковине самой покрышки обычно относится к предельным условиям нагрузки или давлению и не заменяет автомобильную рекомендацию. Американское ведомство NHTSA отдельно предупреждает об этой распространённой ошибке. Давление может обозначаться PSI, кПа или барами — выбор зависит от рынка и прибора. Если наклейка отсутствует, ищите официальную инструкцию именно к своей модели, размерности колёс и загрузке, а не универсальное число из интернета. Нельзя просто выставить одинаковые 2,2 бара на любой машине."
        ],
        [
          "Измеряйте на холодных колёсах — до поездки",
          "В рекомендациях NHTSA давление советуют проверять не реже одного раза в месяц, включая запаску, если она есть, а также перед дальней дорогой. Для корректного сравнения с табличкой шины должны быть холодными: обычно автомобиль не должен ехать минимум три часа. Во время движения резина и воздух внутри нагреваются, отчего показания растут даже без подкачки. Если сразу после поездки стравить воздух до значения для холодного колеса, после остывания можно получить недокачанную шину. Если в дороге давление явно очень низкое, игнорировать проблему тоже нельзя: следует остановиться в безопасном месте, при необходимости обратиться за помощью или временно подкачать колесо, а окончательную проверку выполнить после остывания. Одновременно осмотрите боковину и протектор: порезы, вздутия, гвозди и неравномерный износ важнее идеальной цифры на манометре."
        ],
        [
          "Проверка манометром: четыре понятных шага",
          "Остановитесь на безопасной ровной площадке вдали от движущихся машин и заглушите двигатель. Снимите колпачок ниппеля и плотно установите манометр на вентиль под прямым углом. Короткое шипение при подключении нормально, но постоянный свист говорит о плохом прилегании и может искажать показания. Считайте результат и сравните его с рекомендованным холодным давлением именно для этого колеса. Если воздуха мало, подключите компрессор, подкачайте небольшими порциями и повторно измерьте. Если давление превышено на действительно холодной шине, немного выпустите воздух и снова проверьте. Выполните процедуру для всех колёс, не забывая о возможной разнице между передней и задней осью, затем закрутите колпачки. Нельзя судить о достаточном давлении только по форме колеса: даже заметно недокачанная шина порой не выглядит спущенной."
        ],
        [
          "Что такое PSI, bar и kPa: простой перевод",
          "PSI означает фунты на квадратный дюйм, bar — бары, а kPa — килопаскали. Это единицы одной физической величины — давления. Один бар равен ровно 100 кПа и приблизительно 14,5 PSI. Соответственно, 32 PSI — это примерно 2,21 бара или 221 кПа. Но это пример перевода, а не совет качать каждое автомобильное колесо до 32 PSI. Если на наклейке стоит 230 кПа, компрессор с барами должен показывать примерно 2,3 бара. Для перевода баров в PSI умножьте число на 14,5. Не пугайтесь небольших различий округления между двумя манометрами; важно, чтобы показания сравнивались в одинаковых единицах. Если на табличке производитель указал разные значения для обычной и полной загрузки, используйте подходящую строку. Главный ориентир — документация автомобиля, а не случайная интернет-таблица перевода единиц."
        ],
        [
          "Можно ли верить датчику TPMS на приборной панели",
          "Современные автомобили часто показывают давление по колёсам или включают значок предупреждения TPMS. Такая система полезна, но не отменяет обычную проверку манометром. Как объясняет NHTSA, предупреждение может включаться лишь при существенной потере давления, а показания отдельных колёс меняются в процессе нагрева на дороге. После установки верных значений на холодных шинах иногда требуется сбросить или откалибровать систему — процедура зависит от марки, поэтому следуйте руководству. Если индикатор сначала мигает, а затем горит постоянно, причина может быть в неисправности самого контроля давления. Шина, которая регулярно теряет воздух быстрее остальных, требует осмотра на проколы, дефекты вентиля и повреждения диска. Не стоит бесконечно подкачивать колесо с явным дефектом, лишь бы потушить лампу на панели."
        ],
        [
          "Что делать раз в месяц и каких ошибок избегать",
          "Возьмите за привычку держать манометр в машине и проверять холодные колёса раз в месяц и перед длительными поездками. Отмечайте шину, которая заметно быстрее теряет воздух: медленную утечку сложно обнаружить визуально. Не используйте универсальные настройки из случайного видео и не ориентируйтесь на максимальное число с боковины покрышки. Не выпускайте воздух из тёплого колеса только потому, что цифра превышает холодную норму. Если есть запаска, проверяйте и её, учитывая особые указания производителя. При вздутии, крупном порезе, видимых нитях корда или быстро падающем давлении обратитесь в шинный сервис: простая подкачка не устранит повреждение. Верное давление помогает управляемости, равномерному износу и расходу топлива, но не заменяет ремонт шины. О безопасной замене колеса рассказываем в /ru/guides/change-flat-tire-safely/, а другие вопросы о поездках собраны в /ru/topics/travel/."
        ]
      ],
      "photoCaption": "Настоящая фотография проверки давления в шине, автор JEG14 / Wikimedia Commons, опубликована в общественном достоянии; уменьшена и кадрирована. Правильное давление зависит от вашего автомобиля, а не от машины на снимке."
    },
    "image": "https://commons.wikimedia.org/wiki/Special:Redirect/file/ReifendruckPruefen.jpg?width=1200"
  },
  {
    "id": "vpn-vs-proxy-privacy-security-differences",
    "topic": "digital",
    "minutes": 9,
    "published": "2026-11-12",
    "updated": "2026-11-12",
    "photoAsset": {
      "url": "https://commons.wikimedia.org/wiki/Special:Redirect/file/Laptop%20on%20a%20desk.jpg?width=1200",
      "source": "https://commons.wikimedia.org/wiki/File:Laptop_on_a_desk.jpg",
      "credit": "Radek Grzybowski / Wikimedia Commons — CC0 1.0 (real laptop on a desk; resized/cropped for web)",
      "licenseLabel": "CC0 1.0",
      "license": "https://creativecommons.org/publicdomain/zero/1.0/"
    },
    "mediaAlt": {
      "en": "Real photograph of a laptop on a desk, illustrating everyday online privacy decisions",
      "ru": "Настоящий снимок ноутбука на письменном столе — иллюстрация темы безопасности соединения"
    },
    "sources": [
      {
        "label": "Mozilla — The difference between a VPN and a web proxy",
        "url": "https://www.mozilla.org/en-US/products/vpn/resource-center/the-difference-between-a-vpn-and-a-web-proxy/"
      },
      {
        "label": "Cloudflare — What is a virtual private network (VPN)?",
        "url": "https://www.cloudflare.com/learning/security/what-is-a-vpn/"
      },
      {
        "label": "Cloudflare — How privacy proxies work, including encrypted tunnels",
        "url": "https://developers.cloudflare.com/privacy-proxy/concepts/how-it-works/"
      },
      {
        "label": "FTC — Public Wi-Fi networks and HTTPS safety guidance",
        "url": "https://consumer.ftc.gov/media/79888"
      }
    ],
    "en": {
      "title": "VPN vs Proxy: What's the Difference and Which Is Safer?",
      "seoTitle": "VPN vs Proxy: Security, Privacy and Key Differences",
      "description": "VPN vs proxy explained without myths: encryption, device versus browser coverage, HTTPS, IP masking, provider trust and how to choose for your needs.",
      "subtitle": "Both can route traffic through another server, but the protection you get depends on how they are configured. Neither makes you invisible online.",
      "factTable": {
        "title": "Typical differences: check the specific service before relying on it",
        "headers": [
          "Question",
          "VPN app",
          "Basic web proxy"
        ],
        "rows": [
          [
            "Traffic protected",
            "Often device-wide; settings vary",
            "Often one browser or app"
          ],
          [
            "Encrypted to intermediary",
            "Yes for a correctly configured VPN tunnel",
            "Not guaranteed; secure proxies differ"
          ],
          [
            "IP shown to sites",
            "Usually VPN exit IP",
            "Usually proxy exit IP"
          ],
          [
            "Does it stop tracking?",
            "No, not by itself",
            "No, not by itself"
          ]
        ]
      },
      "sections": [
        [
          "The short answer: an encrypted tunnel versus an intermediary",
          "A VPN, short for virtual private network, typically creates an encrypted tunnel between your device and a VPN server. A proxy is an intermediary server that forwards requests for a browser, app or configured network connection. Both may replace the IP address that a destination website sees, but they differ in how much traffic they handle and whether the first connection is protected by a dedicated encrypted tunnel. Mozilla explains the usual distinction as device-level versus browser-level coverage, although real products vary. A basic HTTP or SOCKS proxy does not automatically encrypt every byte sent between you and that proxy. Secure HTTPS and MASQUE-style proxies can use encryption, so the statement 'all proxies are unencrypted' is incorrect. The sensible comparison is between specific implementations, not marketing labels. Neither tool removes browser cookies, account logins, tracking scripts or malicious downloads, and neither guarantees total anonymity."
        ],
        [
          "How a VPN usually works, and what it actually hides",
          "A personal VPN application establishes a protected link from a device to a remote VPN gateway, which forwards traffic to the wider internet. Someone operating the local Wi-Fi or your ordinary internet connection generally sees a connection to the VPN server rather than the individual destinations carried inside its tunnel, although traffic patterns and other metadata can remain visible. Websites usually see the VPN gateway's public IP address rather than your home IP address. A crucial limitation: traffic beyond the VPN gateway is not necessarily protected by the VPN tunnel itself; for websites, HTTPS supplies its own end-to-end encryption between browser and site. VPN applications may also use split tunnelling, exclusions or browser-only modes, so you must check which apps are routed. Cloudflare documents the mechanics of VPN tunnels and the trade-offs. A VPN does not prevent a logged-in service from knowing who you are when you sign into your own account."
        ],
        [
          "What a proxy changes—and why some proxies are encrypted",
          "A conventional web proxy receives requests and forwards them on your behalf. It can be configured within a browser or software application, and it may be useful for workplace access control, testing or connecting through a particular network. A SOCKS5 proxy can relay traffic for several protocols, but its name alone does not mean the path to the proxy is encrypted. An HTTPS proxy can connect through TLS, while newer privacy proxy systems can use HTTP CONNECT and encrypted QUIC-based mechanisms. Cloudflare documents encrypted MASQUE proxy models where the intermediary may know the destination but not the encrypted page contents. Because of these differences, it is risky to trust a random free proxy on the assumption that the word 'proxy' implies security. The operator can potentially observe or log information that passes through it, subject to how the browser, application and destination encrypt the connection. Never enter passwords into an unknown web-proxy site."
        ],
        [
          "Does a VPN replace HTTPS or make browsing anonymous?",
          "No. HTTPS already encrypts the content of a secure website connection, even when you are using public Wi-Fi without a VPN; the U.S. Federal Trade Commission stresses the importance of secure web connections. A VPN adds a separate encrypted hop between your device and its server and can reduce the amount of destination information your local network provider observes. That changes who you have to trust: the VPN operator may now see connection metadata that would otherwise be available to your internet provider. Websites can still recognize you through accounts, cookies, browser fingerprinting and information you provide voluntarily. An advertiser may track your activity even when you change IP addresses. VPN software also cannot reliably protect you from phishing links, malicious files or weak reused passwords. For practical security, combine updated devices, HTTPS, strong unique passwords and multifactor authentication with any privacy tool you choose."
        ],
        [
          "Which is better for travel, public Wi-Fi or a single browser?",
          "If your main goal is protecting several applications on a laptop or phone while using unfamiliar networks, a reputable VPN with a properly configured device-wide tunnel is often a simpler fit. If you need one particular browser or app to use a certain exit address or a corporate intermediary, a correctly configured proxy may be sufficient. A secure browser proxy can encrypt the browser-to-proxy connection; a simple plaintext intermediary cannot. For remote access to an employer's network, use the solution supplied by the employer rather than an arbitrary consumer VPN. Check the applicable network policy and laws, because routing traffic through different countries can conflict with services' terms. A privacy tool is not a substitute for testing the real IP address used by each relevant app, checking for DNS leaks where applicable and confirming that sensitive sites use HTTPS. Public Wi-Fi users should avoid suspicious captive portal pages requesting unrelated credentials."
        ],
        [
          "How to choose a provider and avoid privacy traps",
          "Before installing a VPN or entering traffic through a proxy, research who operates it, how it is funded, what is logged, what independent audits actually cover and whether the privacy policy clearly describes limitations. Prefer software from an identifiable provider with a transparent security history and routine updates. Free products are not automatically bad, but an anonymous operator offering unlimited bandwidth in exchange for no visible revenue deserves extra scrutiny. Review permissions, app-store identity, support for modern protocols, available kill-switch behavior and whether DNS requests follow the intended route. If a provider claims that no one can ever track you, treat the promise skeptically; your accounts and browser can still reveal your identity. For a stronger everyday baseline, protect account credentials and use HTTPS whether or not a VPN is active. Our related guides cover /guides/password-manager-passkeys/ and /guides/safe-public-wifi-travel/; more digital safety topics are in /topics/digital/."
        ]
      ],
      "photoCaption": "Authentic photograph of a laptop on a desk by Radek Grzybowski / Wikimedia Commons, CC0 1.0. Cropped/resized; illustrative of internet use, not a picture of a functioning VPN tunnel."
    },
    "ru": {
      "title": "VPN или Proxy: в чём разница и что безопаснее?",
      "seoTitle": "VPN vs Proxy: разница, шифрование и безопасность",
      "description": "В чём разница между VPN и прокси: шифрование, защита всего устройства, IP-адрес, HTTPS, анонимность и выбор надёжного сервиса.",
      "subtitle": "Оба инструмента могут менять видимый сайту IP-адрес, но объём защиты и способ передачи данных различаются. Полную анонимность не гарантирует ни один.",
      "factTable": {
        "title": "VPN и Proxy: что обычно отличается",
        "headers": [
          "Параметр",
          "VPN-приложение",
          "Обычный веб-прокси"
        ],
        "rows": [
          [
            "Охват",
            "Часто всё устройство; зависит от настроек",
            "Обычно браузер или программа"
          ],
          [
            "Шифрование до сервера",
            "Да, в корректном VPN-туннеле",
            "Не обязательно; защищённые варианты отличаются"
          ],
          [
            "Какой IP видит сайт",
            "Обычно адрес VPN-сервера",
            "Обычно адрес прокси"
          ],
          [
            "Защищает от всех трекеров?",
            "Нет",
            "Нет"
          ]
        ]
      },
      "sections": [
        [
          "Короткий ответ: VPN создаёт туннель, прокси пересылает запросы",
          "VPN — виртуальная частная сеть, которая в типичном варианте устанавливает зашифрованный туннель между устройством и VPN-сервером. Прокси — промежуточный сервер, через который браузер или отдельная программа отправляет запросы. Оба инструмента могут менять IP-адрес, видимый посещаемому сайту, но они не обязательно одинаково защищают передачу данных. Mozilla объясняет распространённую разницу так: VPN чаще работает на уровне устройства, а обычный веб-прокси — на уровне браузера. Однако конкретные настройки и реализации отличаются. Простой HTTP- или SOCKS-прокси не гарантирует шифрование соединения до посредника, но современные защищённые HTTPS- и MASQUE-прокси умеют передавать данные по зашифрованному каналу. Поэтому фраза «все прокси небезопасны и никогда не шифруют» неверна. Ни VPN, ни прокси сами по себе не убирают отслеживание через аккаунты, cookie и браузер и не делают человека полностью анонимным."
        ],
        [
          "Как работает VPN и какую информацию он действительно скрывает",
          "VPN-клиент обычно создаёт защищённое соединение от компьютера или телефона к удалённому серверу, который уже обращается к сайтам. Оператор местного Wi-Fi или интернет-провайдер в обычной конфигурации видит соединение с VPN-сервером, а не отдельные адреса назначения внутри туннеля. Но часть метаданных и характер трафика всё равно могут быть заметны. Посещаемые сайты чаще всего видят внешний IP сервера VPN вместо домашнего IP пользователя. При этом защита между VPN-сервером и сайтом обеспечивается отдельно: при HTTPS содержимое шифруется ещё и на участке между браузером и сайтом. Некоторые VPN-приложения исключают определённые программы из туннеля или поддерживают выборочную маршрутизацию, поэтому важно проверять настройки. Cloudflare описывает работу туннеля и ограничения такой модели. Если войти под своей учётной записью в социальную сеть, она будет понимать, кто вы, даже при новом IP-адресе."
        ],
        [
          "Что делает прокси и почему не все прокси одинаковые",
          "Обычный прокси получает запрос от браузера или приложения и передаёт его дальше от своего имени. Его применяют для сетевого контроля, тестирования, рабочих задач и маршрутизации отдельных программ. SOCKS5 способен пересылать трафик разных типов, но сам по себе не означает шифрование от вашего устройства до сервера. HTTPS-прокси может использовать TLS, а современные конфиденциальные прокси применяют протоколы CONNECT или MASQUE, где передача через посредника защищена. В документации Cloudflare описана модель, при которой прокси может знать адрес назначения, но не читать защищённое содержимое страницы. Следовательно, нельзя считать любой прокси безопасным только по названию, особенно если его предлагает неизвестный бесплатный сайт. Оператор промежуточного сервера потенциально может наблюдать или хранить часть передаваемых сведений в зависимости от настройки соединения и защиты конечного ресурса. Не вводите пароли в сомнительные прокси-сайты."
        ],
        [
          "Делает ли VPN человека невидимым и заменяет ли HTTPS",
          "Нет. Соединение HTTPS уже шифрует содержимое обмена с защищённым сайтом, в том числе в публичной сети Wi-Fi, на что обращает внимание Федеральная торговая комиссия США. VPN добавляет собственный защищённый участок от устройства до VPN-сервера и может уменьшить объём информации о посещаемых адресах, видимый вашему интернет-провайдеру. Но при этом появляется другой доверенный посредник: сам оператор VPN может получать сведения о соединениях. Сайты по-прежнему распознают пользователя по входу в аккаунт, cookie, параметрам браузера и предоставленной личной информации. Рекламные системы могут сопоставлять действия, даже если IP-адрес поменялся. VPN также не отменяет опасность поддельных страниц, заражённых файлов и повторного использования паролей. Для надёжной защиты нужны обновления, HTTPS, уникальные пароли и многофакторная аутентификация. Обещания «100 % анонимности» нельзя воспринимать как техническую гарантию."
        ],
        [
          "Когда стоит выбрать VPN, а когда достаточно прокси",
          "Если на телефоне или ноутбуке нужно защищать сразу несколько приложений в незнакомой сети, обычно удобнее надёжный VPN, настроенный на туннель для всего устройства. Если требуется отправлять через отдельный адрес только трафик одного браузера или конкретной программы, правильно настроенного прокси может оказаться достаточно. Защищённый браузерный прокси способен шифровать канал до посредника; обычный незашифрованный вариант такой гарантии не даёт. Для доступа к рабочим ресурсам лучше использовать решение, которое предоставляет сама организация, а не случайный публичный сервис. Учитывайте ограничения конкретной сети и условия используемых сайтов. Полезно проверить, какой IP действительно видят необходимые программы, как разрешаются DNS-запросы и включено ли HTTPS на важных ресурсах. В общественном Wi-Fi не вводите пароли в подозрительные формы и не доверяйте всплывающим страницам, которые требуют лишних личных данных."
        ],
        [
          "Как выбрать надёжного провайдера и не попасться на рекламу",
          "Перед установкой VPN или использованием прокси выясните, какая компания предоставляет услугу, на чём она зарабатывает, какие журналы соединений ведёт и какие проверки безопасности действительно проходила. Предпочтительны известный оператор, ясная политика конфиденциальности, регулярные обновления и отсутствие необоснованных обещаний. Бесплатный сервис не обязательно вредный, но анонимный проект с неограниченным трафиком без понятного источника финансирования заслуживает осторожности. Проверьте разрешения приложения, поддержку современных протоколов, поведение при обрыве туннеля и правильность маршрута DNS, если это важно для вашей модели угроз. Не воспринимайте изменение IP как исчезновение цифрового следа: ваши собственные аккаунты и браузер могут раскрывать личность. Даже с VPN используйте HTTPS и защищайте учётные записи. Дополнительные советы доступны в /ru/guides/password-manager-passkeys/ и /ru/guides/safe-public-wifi-travel/; общий раздел — /ru/topics/digital/."
        ]
      ],
      "photoCaption": "Настоящая фотография ноутбука на столе, автор Radek Grzybowski / Wikimedia Commons, CC0 1.0; снимок уменьшен и кадрирован. Это иллюстрация использования интернета, а не изображение работающего VPN-туннеля."
    },
    "image": "https://commons.wikimedia.org/wiki/Special:Redirect/file/Laptop%20on%20a%20desk.jpg?width=1200"
  }
];
