// Original bilingual, free browser-only utilities with page-specific editorial explanations.
import {homeCalculators,homeCalculatorBody} from './home-calculators.js';
import {insulationCalculator,insulationCalculatorBody} from './insulation-calculator.js';
export const freeTools = [
 ...homeCalculators,
 insulationCalculator,
  {
    "id": "qr-code-generator",
    "icon": "▦",
    "en": {
      "name": "Free QR Code Generator",
      "title": "Free QR Code Generator — PNG & SVG, No Signup",
      "description": "Create a free QR code for a URL, text, contact or Wi-Fi password. Customize colors and download PNG or SVG instantly. No registration, files stay in your browser.",
      "lead": "Create crisp, scannable QR codes for your website, menu, event or Wi-Fi network. Download high-resolution PNG or vector SVG in seconds.",
      "sections": [
        [
          "How to make a QR code for a website",
          "Choose Website or text, paste the full address including https://, and select Generate. A QR code stores the address itself; it does not create or shorten a link. Test the code with two phones before printing it on posters or product labels. Longer text produces denser patterns and can be harder to scan at small sizes."
        ],
        [
          "Make a QR code for Wi-Fi",
          "Choose Wi-Fi network and enter your network name (SSID), password and security type. We create a standard Wi-Fi QR format that many modern phones understand. Double-check the network name and password, and remember that anyone who scans a printed Wi-Fi code can obtain access to that network. Use a dedicated guest network instead of sharing your primary household Wi-Fi."
        ],
        [
          "PNG or SVG: which should I download?",
          "PNG is convenient for documents, social posts and on-screen sharing. SVG contains vector squares, so it stays sharp when resized for signs and printed materials. Both formats contain a fixed QR code, not a paid redirect service. Use strong contrast, leave the white quiet zone around the pattern and avoid stretching it out of proportion."
        ],
        [
          "Is this QR generator really free and private?",
          "Generating, previewing and downloading QR codes happens on your device. The page loads a QR JavaScript library from a public CDN, but your entered text and Wi-Fi password are not submitted to a MURDILIMAX server. We do not offer dynamic QR analytics, destination editing after print or tracking. Internet access is needed to load the tool library."
        ]
      ],
      "faq": [
        [
          "Do QR codes expire?",
          "The code itself does not expire. If the linked website changes or closes, the destination may stop working."
        ],
        [
          "Can I change the URL after printing?",
          "No. This tool makes static QR codes. Replacing the destination requires making and printing a new code."
        ]
      ]
    },
    "ru": {
      "name": "Генератор QR-кодов бесплатно",
      "title": "Генератор QR-кодов онлайн — PNG и SVG бесплатно",
      "description": "Создайте QR-код для ссылки, текста, контакта или Wi-Fi без регистрации. Выберите цвета и скачайте PNG или SVG бесплатно прямо в браузере.",
      "lead": "Сделайте QR-код для сайта, меню, афиши или гостевой Wi-Fi-сети. Скачайте PNG или векторный SVG, не загружая введённые данные на сервер.",
      "sections": [
        [
          "Как сделать QR-код для сайта",
          "Выберите режим ссылки, вставьте полный адрес с https:// и нажмите «Создать». QR-код хранит сам адрес, а не платную короткую ссылку. Перед печатью проверьте результат двумя разными телефонами. Чем длиннее текст, тем больше мелких элементов в коде и тем сложнее считывание с маленькой наклейки."
        ],
        [
          "QR-код для подключения к Wi-Fi",
          "Выберите Wi-Fi, введите точное имя сети (SSID), пароль и тип защиты. Генератор создаёт стандартную запись, которую распознают многие современные телефоны. Проверьте пароль и имя сети перед печатью. Помните, что человек, получивший QR-код, может подключиться к этой сети. Для гостей разумнее создать отдельную гостевую сеть."
        ],
        [
          "В чём разница между PNG и SVG",
          "PNG подходит для публикаций, презентаций и документов. SVG состоит из векторных квадратов и остаётся чётким на большой вывеске или листовке. Оба формата создают обычный постоянный QR-код без платной переадресации. Для успешного сканирования сохраняйте контраст и свободную светлую рамку вокруг изображения."
        ],
        [
          "Нужна ли регистрация и куда передаются данные",
          "Создание и скачивание QR происходит в браузере. Для работы подгружается библиотека JavaScript из публичного CDN, но введённые ссылки, текст и пароль Wi-Fi не отправляются на сервер MURDILIMAX. Мы не предоставляем динамические QR-коды, статистику сканирования и удалённое редактирование после печати."
        ]
      ],
      "faq": [
        [
          "У QR-кода есть срок действия?",
          "Сам QR-код не имеет срока действия. Но ссылка перестанет работать, если сайт удалят или изменят адрес."
        ],
        [
          "Можно ли изменить адрес после печати?",
          "Нет. Это статический QR-код. Для другого адреса нужно создать и распечатать новый."
        ]
      ]
    }
  },
  {
    "id": "compress-images",
    "icon": "◫",
    "en": {
      "name": "Compress Images",
      "title": "Compress JPG & WebP Images Online — Free & Private",
      "description": "Compress JPG, PNG and WebP pictures in your browser. Choose quality and image width, compare file sizes and download smaller photos without signup.",
      "lead": "Shrink large photos for a website, email or upload form. Pick output format, width and quality; see the size of each compressed file before downloading.",
      "sections": [
        [
          "How image compression works",
          "Most photo size comes from pixel dimensions and image encoding. Reducing very large photos to a sensible width often saves more space than aggressively lowering quality. This tool decodes your image in your own browser and exports a new JPEG or WebP file. Transparent PNG images will receive a white background when converted to JPEG, so choose WebP if transparency matters."
        ],
        [
          "Choose the right balance between size and quality",
          "Start at 80% quality and a maximum width of 1920 pixels for photos used on web pages. If small details or text look blurry, increase the quality or keep more pixels. WebP can be smaller than JPEG in many cases, but browser support and photo content affect results. Compare both the visible result and saved byte count: compression does not guarantee every output is smaller."
        ],
        [
          "What happens to my photographs?",
          "Photo files are decoded and processed locally using the browser Canvas API. No photo is uploaded to MURDILIMAX. A browser may have memory limits for very large pictures, and embedded EXIF details such as GPS location are generally not retained by Canvas exports. Keep the originals until you verify the copies. This tool is not an image backup."
        ],
        [
          "Best practices for website images",
          "For an article hero image, a well-compressed photo with an appropriate width can improve load time without losing useful details. Use descriptive alternative text and meaningful filenames. Avoid resizing tiny images upward since it increases dimensions without restoring detail. For a site that serves multiple screen sizes, prepare more than one width when practical."
        ]
      ],
      "faq": [
        [
          "Is this a lossless compressor?",
          "No. JPEG and WebP quality settings use lossy compression, and resizing discards pixels."
        ],
        [
          "Can compression increase file size?",
          "Yes. Depending on the input and output format, a new file may be larger. Compare before using it."
        ]
      ]
    },
    "ru": {
      "name": "Сжатие изображений",
      "title": "Сжать фото онлайн бесплатно — JPG и WebP",
      "description": "Уменьшите размер фотографий JPG, PNG и WebP без регистрации. Настройте качество и размер, сравните файлы и скачайте результат.",
      "lead": "Уменьшайте вес фотографий для сайтов, писем и анкет. Выбирайте ширину, качество и формат; смотрите размер готового файла до скачивания.",
      "sections": [
        [
          "Как работает сжатие изображений",
          "Большую часть размера фотографии определяют разрешение и способ кодирования. Часто достаточно уменьшить ширину огромного снимка, а не резко снижать качество. Инструмент обрабатывает изображение через Canvas прямо на устройстве и сохраняет новый JPEG или WebP. При переводе прозрачного PNG в JPEG прозрачность заменяется белым фоном, поэтому для таких картинок лучше использовать WebP."
        ],
        [
          "Как выбрать качество",
          "Начните с 80% качества и ширины до 1920 пикселей для фотографий на сайте. Если мелкие детали становятся размытыми, увеличьте качество или размер. WebP часто занимает меньше места, чем JPEG, но результат зависит от содержания снимка. Сравнивайте и изображение, и количество байтов: не всякая повторная компрессия делает файл меньше."
        ],
        [
          "Что происходит с вашими фотографиями",
          "Файлы читаются и обрабатываются локально в браузере, не отправляясь на MURDILIMAX. У браузера есть ограничения памяти для очень больших изображений. При экспорте через Canvas служебные EXIF-данные, включая GPS, обычно не сохраняются. Не удаляйте оригиналы, пока не проверите результат. Этот сервис не заменяет резервное копирование."
        ],
        [
          "Как подготовить фото для сайта",
          "Для обложки статьи лучше подобрать подходящую ширину и умеренную степень сжатия, чтобы страница быстро загружалась. Не забывайте понятный alt-текст и имя файла. Увеличение маленькой картинки не возвращает утраченные детали. Для качественного сайта полезно готовить несколько разрешений изображения для экранов разной ширины."
        ]
      ],
      "faq": [
        [
          "Это сжатие без потерь?",
          "Нет. JPEG и WebP используют сжатие с потерями; уменьшение размера в пикселях также удаляет детали."
        ],
        [
          "Может ли итоговый файл стать больше?",
          "Да. Такое возможно при смене формата. Сравните размер исходного и готового файла."
        ]
      ]
    }
  },
  {
    "id": "image-converter",
    "icon": "↔",
    "en": {
      "name": "JPG PNG WebP Converter",
      "title": "Free JPG, PNG & WebP Converter — No Upload",
      "description": "Convert images between JPG, PNG and WebP for free. Keep transparency where supported, resize if needed and download files without uploading them.",
      "lead": "Quickly change a photo or graphic between JPEG, PNG and WebP formats. Convert images on your device with no account or server upload.",
      "sections": [
        [
          "JPG, PNG and WebP: what changes?",
          "JPEG is a common format for photos but does not support transparent backgrounds. PNG is generally useful for graphics, transparency and crisp diagrams, though some files are large. WebP supports lossy or lossless encoding and may be smaller. Re-encoding does not restore information that was already lost; converting an old JPEG into PNG will not recover missing detail."
        ],
        [
          "How to convert an image",
          "Select up to six JPG, PNG or WebP files, choose the output format and optional maximum dimension, then click Convert. The browser decodes each image and writes it back in the selected format. Filenames are updated to match the extension. When exporting JPEG, transparent pixels are filled white; PNG and WebP may preserve transparency depending on the source and browser."
        ],
        [
          "What about animated GIF or HEIC?",
          "This first version is designed for still JPG, PNG and WebP images. It does not support HEIC directly or preserve animation from GIF or animated WebP; a decoded frame may be all you get. For those formats, use a tool designed to handle their special metadata. Some browsers do not offer WebP export, so a format option may fail with a clear message."
        ],
        [
          "Privacy and quality",
          "Your pictures remain in the browser: we do not upload them or keep copies. Canvas exports usually omit original metadata, including camera settings and location. JPEG quality can be adjusted; PNG output is usually larger because it preserves pixel detail without JPEG-style loss. Check the converted file before sharing it or deleting the original."
        ]
      ],
      "faq": [
        [
          "Will converting JPG to PNG improve quality?",
          "No. PNG may preserve the current pixels, but it cannot recreate details lost during previous JPG compression."
        ],
        [
          "Can I convert a transparent PNG to JPG?",
          "Yes, but JPEG does not support transparency. Transparent areas are filled white."
        ]
      ]
    },
    "ru": {
      "name": "Конвертер JPG PNG WebP",
      "title": "Конвертер JPG, PNG и WebP онлайн бесплатно",
      "description": "Переведите изображения JPG, PNG и WebP в другой формат без загрузки на сервер. Настройте размер, скачайте результат без регистрации.",
      "lead": "Меняйте формат фотографий и графики между JPG, PNG и WebP прямо на устройстве. Поддерживается изменение размеров и пакетная обработка.",
      "sections": [
        [
          "Какой формат лучше выбрать",
          "JPEG подходит для фотографий, но не поддерживает прозрачный фон. PNG удобен для схем, логотипов и прозрачных изображений, хотя файлы иногда большие. WebP может дать меньший размер при хорошем качестве. Конвертация не восстанавливает ранее потерянные детали: сохранение старого JPEG в PNG не сделает изображение чётче."
        ],
        [
          "Как выполнить конвертацию",
          "Выберите до шести JPG, PNG или WebP файлов, формат результата и ограничение по размеру. Нажмите «Конвертировать»: браузер откроет картинки и сохранит их в новом формате. Расширение имени изменится автоматически. При переводе в JPEG прозрачные участки станут белыми. PNG и WebP могут сохранить прозрачность, если исходник и браузер её поддерживают."
        ],
        [
          "Поддерживаются ли GIF и HEIC",
          "Первая версия работает со статичными JPG, PNG и WebP. HEIC не поддерживается напрямую, а анимация GIF или WebP не переносится в итоговые файлы. Для таких форматов лучше пользоваться специализированными программами. Некоторые старые браузеры не умеют экспортировать WebP: в этом случае появится понятная ошибка."
        ],
        [
          "Приватность и качество",
          "Изображения обрабатываются локально, мы не загружаем и не сохраняем их на сервере. Экспорт через Canvas обычно удаляет исходные метаданные, в том числе сведения о камере и местоположении. Для JPEG можно задать качество, а PNG часто получается больше по размеру. Проверяйте итоговый файл перед отправкой или удалением оригинала."
        ]
      ],
      "faq": [
        [
          "Конвертация JPG в PNG улучшит качество?",
          "Нет. PNG не восстановит детали, которые уже потеряны при сжатии JPEG."
        ],
        [
          "Можно ли преобразовать прозрачный PNG в JPG?",
          "Да, но прозрачность исчезнет: она будет заменена белым фоном."
        ]
      ]
    }
  },
  {
    "id": "merge-pdf",
    "icon": "▤",
    "en": {
      "name": "Merge PDF Files",
      "title": "Merge PDF Files Online Free — Private PDF Merger",
      "description": "Combine PDF files into one document in your browser. Change the order, merge pages and download the result free, with no signup or file upload.",
      "lead": "Join multiple PDF documents in the order you choose. Your PDFs are handled in browser memory and never uploaded to a MURDILIMAX server.",
      "sections": [
        [
          "How to merge PDF documents",
          "Choose two or more PDF files, arrange them using the up and down buttons and click Merge PDF. The tool copies pages from the selected files into a new PDF in the specified order. Your original documents are not changed. Download the result, then open it to verify the page count and sequence, particularly before sharing a contract or application."
        ],
        [
          "Which PDFs can be combined?",
          "Normal unencrypted PDF documents are supported. Password-protected or damaged PDFs may fail and should not be uploaded to random unlocking services. Interactive forms, digital signatures, embedded scripts and document permissions can change when pages are copied, so do not treat a merged file as legally equivalent to its signed originals. Keep signed documents separately and check official requirements."
        ],
        [
          "Privacy and file-size limits",
          "PDF content is processed locally in your web browser using a widely used JavaScript library. The code library loads from a CDN, but PDF contents are not sent to us. Browser memory has practical limits, so the first version allows up to ten PDFs and a combined input size of 80 MB. On a low-memory phone, process smaller groups. Download and check the resulting file before closing the tab."
        ],
        [
          "When should you avoid merging PDFs?",
          "Do not merge PDFs if an organization requires a specific signed original, certified file or unmodified attachments. The resulting PDF is a new file; page order and appearance should be checked. For scanning photos into a document, use our separate Images to PDF tool instead of adding photos as individual documents."
        ]
      ],
      "faq": [
        [
          "Can I merge password-protected PDFs?",
          "No. Remove encryption with an authorized PDF application if you know the password, then merge the unlocked copies."
        ],
        [
          "Are the PDFs uploaded to a server?",
          "No. The PDF contents are processed in your browser. The JavaScript library itself loads from a public CDN."
        ]
      ]
    },
    "ru": {
      "name": "Объединить PDF",
      "title": "Объединить PDF онлайн бесплатно — без загрузки файлов",
      "description": "Соедините несколько PDF в один документ бесплатно. Поменяйте порядок, объедините страницы и скачайте результат без регистрации.",
      "lead": "Соединяйте PDF-документы в нужном порядке прямо в браузере. Содержимое файлов не отправляется на сервер MURDILIMAX.",
      "sections": [
        [
          "Как объединить несколько PDF",
          "Выберите два или более PDF-файла, расставьте их кнопками вверх и вниз и нажмите «Объединить». Инструмент скопирует страницы в новый PDF в выбранном порядке. Исходные документы останутся без изменений. Скачайте результат и проверьте порядок и количество страниц, особенно если отправляете заявление, договор или другие важные бумаги."
        ],
        [
          "Какие документы поддерживаются",
          "Обычные незашифрованные PDF поддерживаются. Файлы с паролем или повреждениями могут не открыться. Интерактивные формы, цифровые подписи и другие сложные элементы при объединении могут измениться или перестать работать. Не считайте новую сборку юридически равной подписанным оригиналам. Сохраняйте исходные файлы и проверяйте требования организации, куда отправляете документы."
        ],
        [
          "Приватность и ограничения",
          "PDF обрабатывается локально в памяти браузера через JavaScript-библиотеку. Сама библиотека загружается из CDN, но содержимое документов не отправляется нам. Первая версия поддерживает до десяти PDF суммарным размером до 80 МБ. На слабом смартфоне большие документы могут потребовать слишком много памяти. Обязательно скачайте и откройте готовый файл до закрытия вкладки."
        ],
        [
          "Когда не стоит объединять файлы",
          "Не объединяйте документы, если требуют именно неизменённый подписанный оригинал, сертификат или отдельные вложения. Итоговый PDF — новый документ, поэтому проверьте количество страниц и читаемость. Если нужно создать PDF из снимков, используйте соседний инструмент «Фото в PDF»."
        ]
      ],
      "faq": [
        [
          "Можно ли соединить PDF с паролем?",
          "Нет. Если у вас есть законный доступ, сначала снимите защиту в подходящей программе, затем объединяйте копии."
        ],
        [
          "PDF загружается на сервер?",
          "Нет. Содержимое PDF остаётся в браузере, отдельно загружается только библиотека JavaScript из CDN."
        ]
      ]
    }
  },
  {
    "id": "images-to-pdf",
    "icon": "▣",
    "en": {
      "name": "Images to PDF",
      "title": "JPG, PNG & WebP to PDF — Free Image to PDF",
      "description": "Convert JPG, PNG or WebP pictures into a PDF document online for free. Choose page size and image order, with no account or upload required.",
      "lead": "Turn scanned photos, receipts or pictures into a tidy multipage PDF. Choose A4 or Letter and keep the process local to your device.",
      "sections": [
        [
          "Create a PDF from pictures",
          "Choose one or more JPG, PNG or WebP images in your preferred sequence, then select A4 or US Letter paper. Click Create PDF and download the generated document. Each photograph is centered on its own page with margins and kept in its original proportions. The tool does not perform OCR, so text in the resulting PDF remains part of the image rather than searchable text."
        ],
        [
          "Prepare clear scans of receipts and documents",
          "Place a page flat in good light, avoid shadows and photograph it from directly above. Crooked or blurry pictures are difficult to read even when saved as PDF. For official applications, check whether screenshots or photographs are accepted; some authorities require an original PDF or certified scan. Do not alter the contents of important documents. Keep original images until you confirm the finished PDF is legible."
        ],
        [
          "How big will my PDF be?",
          "The size depends on the input images, their resolution and chosen file format. JPEG photographs are typically compact; a large PNG may make the resulting PDF much bigger. The first version supports up to twenty photos and a combined limit of 80 MB, although some phones may run out of memory sooner. To reduce the size first, try our free Compress Images tool, then use the converted copies in your PDF."
        ],
        [
          "Do my photos leave the computer?",
          "No. The browser reads your chosen photos, the PDF library writes pages and you download the result locally. MURDILIMAX does not receive or store these images. The PDF library code comes from a public CDN, so an initial network connection is required. Verify the document and page order after downloading it, especially before sending private identification or financial papers."
        ]
      ],
      "faq": [
        [
          "Does this tool recognize text (OCR)?",
          "No. It creates a visual PDF with your images, not a searchable text transcript."
        ],
        [
          "Can I include multiple photos in one PDF?",
          "Yes. Each selected image becomes a separate page in the same PDF."
        ]
      ]
    },
    "ru": {
      "name": "Фото в PDF",
      "title": "Фото в PDF онлайн бесплатно — JPG, PNG и WebP",
      "description": "Сделайте один PDF из фотографий JPG, PNG и WebP бесплатно. Выберите размер страницы и сохраните документ без регистрации и загрузки файлов.",
      "lead": "Превращайте фото документов, чеков и изображений в многостраничный PDF. Выбирайте А4 или Letter; данные остаются на устройстве.",
      "sections": [
        [
          "Как создать PDF из фотографий",
          "Выберите один или несколько снимков JPG, PNG или WebP в нужном порядке, затем формат страницы А4 или US Letter. Нажмите «Создать PDF» и скачайте документ. Каждое изображение будет помещено на отдельную страницу с полями, сохраняя пропорции. Инструмент не распознаёт текст, поэтому надписи останутся частью картинки и не будут доступны для полноценного поиска."
        ],
        [
          "Как подготовить фотографии документов",
          "Положите лист на ровную поверхность, обеспечьте хорошее освещение, уберите тени и снимайте прямо сверху. Размытые или перекошенные страницы останутся неудобными для чтения и после сохранения в PDF. Перед отправкой официальных бумаг проверьте требования: некоторые организации принимают только исходный электронный документ или заверенный скан. Не меняйте содержание важных документов и храните исходные снимки до проверки результата."
        ],
        [
          "Почему PDF иногда получается большим",
          "Размер документа зависит от числа фотографий, их разрешения и формата. JPEG обычно хорошо сжимает обычные фото, а большие PNG могут заметно увеличить PDF. Первая версия рассчитана на 20 фотографий суммарно до 80 МБ; браузер слабого телефона может столкнуться с ограничениями раньше. Чтобы уменьшить документ, сначала обработайте снимки в нашем бесплатном инструменте сжатия, затем соберите PDF из полученных файлов."
        ],
        [
          "Остаются ли фотографии на устройстве",
          "Да. Браузер читает файлы, библиотека формирует PDF, и результат скачивается локально. MURDILIMAX не получает и не хранит снимки. Для запуска требуется интернет, так как код PDF-библиотеки загружается с публичного CDN. Перед отправкой документов проверьте страницы и их порядок, особенно если они содержат личные или финансовые сведения."
        ]
      ],
      "faq": [
        [
          "Распознаёт ли сервис текст (OCR)?",
          "Нет. Он создаёт PDF с картинками, а не текстовый документ с распознанными словами."
        ],
        [
          "Можно ли соединить много фотографий?",
          "Да. Каждый выбранный снимок становится отдельной страницей общего PDF."
        ]
      ]
    }
  },
  {
    "id": "word-counter",
    "icon": "≡",
    "en": {
      "name": "Word and Character Counter",
      "title": "Word Counter Online — Characters, Sentences & Reading Time",
      "description": "Count words, characters with or without spaces, sentences and paragraphs instantly. Estimate reading time for English or Russian text, free and privately in your browser.",
      "lead": "Type or paste a draft for live word, character, sentence, paragraph and reading-time statistics. No signup and no uploads.",
      "sections": [
        [
          "Count words in English or Russian text",
          "Paste your draft or start typing in the box. All totals update automatically, with no Calculate button or registration. The counter uses a language-aware browser segmenter to recognize groups of letters and digits. Numbers can count as words, while punctuation does not. Hyphenated compounds and abbreviations can be split differently by other editing applications. For strict school, publishing or application limits, check the exact counting rules of the destination platform."
        ],
        [
          "Characters with and without spaces",
          "Characters include punctuation, spaces, line breaks and visible symbols. The without-spaces total excludes whitespace such as tabs and newlines while preserving punctuation. Modern browsers count visible Unicode grapheme clusters, so an emoji sequence or letter with a combining accent can count as one displayed character. Some form fields instead count Unicode code points or UTF-16 units, which can produce slightly different numbers. Always use the form's own limit as the final authority."
        ],
        [
          "Sentences, paragraphs and reading time",
          "Sentence totals use the browser's language-aware sentence boundaries when available. Abbreviations, quotations, lists and unusual punctuation make any automatic sentence count approximate. A paragraph means a block separated from the next by an empty line; a single line break alone does not start a new paragraph. Reading time assumes approximately 200 words per minute and rounds upwards. Actual reading speed changes with language, complexity, audience and accessibility needs."
        ],
        [
          "Private text processing and limitations",
          "Your writing stays on your device: the JavaScript counter does not upload drafts to MURDILIMAX or send their contents to a third-party service. The tool does not save drafts, check grammar, test originality or identify AI-generated text. The editor supports up to 50,000 characters. If a very large document slows down your phone, work in shorter sections. Before submitting a text to a university, journal, marketplace or social platform, check how that service treats whitespace and special characters."
        ]
      ],
      "faq": [
        [
          "Can I count Russian words and emojis?",
          "Yes. The counter supports Cyrillic and Latin text and uses Unicode grapheme counting in modern browsers. Some other services may use different rules."
        ],
        [
          "Do you save or upload my writing?",
          "No. All text is processed in your browser, without being sent to or saved by MURDILIMAX."
        ]
      ]
    },
    "ru": {
      "name": "Счётчик слов и символов",
      "title": "Счётчик слов и символов онлайн — бесплатно",
      "description": "Посчитайте слова, символы с пробелами и без, предложения и абзацы в тексте онлайн. Оцените время чтения бесплатно, без регистрации и отправки текста на сервер.",
      "lead": "Введите или вставьте текст: количество слов, символов, предложений, абзацев и время чтения обновляются автоматически.",
      "sections": [
        [
          "Как считать слова в русском и английском тексте",
          "Вставьте готовый текст в поле или начните печатать. Результаты обновляются автоматически: дополнительная кнопка подсчёта не требуется. Для поиска слов используются языковые правила браузера, учитывающие буквы и цифры, а знаки препинания не становятся отдельными словами. Сокращения, записи с дефисами и числовые обозначения разные редакторы могут считать по-разному. Если нужен строгий лимит для учёбы или публикации, проверьте требования выбранной площадки."
        ],
        [
          "Символы с пробелами и без: какая разница",
          "Показатель «Символы» учитывает знаки препинания, пробелы, переводы строк и видимые значки. Значение «Без пробелов» исключает пробельные символы, в том числе табуляции и переносы строк, но сохраняет пунктуацию. Современные браузеры считают сочетания Unicode как видимые символы, поэтому некоторые сложные эмодзи и буквы с составными ударениями учитываются по одному. Другие программы могут использовать кодовые точки или единицы UTF-16, поэтому значения иногда различаются."
        ],
        [
          "Подсчёт предложений, абзацев и времени чтения",
          "Для предложений используются языковые границы, которые определяет браузер. Аббревиатуры, цитаты, списки и необычная пунктуация делают любой автоматический результат приблизительным. Абзацы — это блоки, разделённые хотя бы одной пустой строкой; обычный перенос строки сам по себе не создаёт новый абзац. Время чтения рассчитывается из ориентировочных 200 слов в минуту с округлением вверх. Реальная скорость зависит от языка, сложности текста и привычек читателя."
        ],
        [
          "Приватность текста и ограничения сервиса",
          "Ваш текст обрабатывается локально с помощью JavaScript и не отправляется на сервер MURDILIMAX или внешние сервисы. Инструмент не сохраняет черновики, не исправляет грамматику, не проверяет уникальность и не распознаёт нейросетевое происхождение. Поле принимает до 50 000 символов. Если большой документ замедляет телефон, считайте его отдельными частями. Перед подачей заявления или публикацией уточняйте, что именно считает символом или словом выбранная площадка."
        ]
      ],
      "faq": [
        [
          "Работает ли счётчик с кириллицей и эмодзи?",
          "Да. Поддерживаются русский и английский тексты, а современные браузеры считают многие сложные эмодзи одним видимым символом."
        ],
        [
          "Отправляется ли текст на сервер?",
          "Нет. Подсчёт идёт в вашем браузере, а MURDILIMAX не получает и не сохраняет написанное."
        ]
      ]
    }
  }
];
export const freeToolBody = function freeToolBody(lang,id,esc,url){
 if(homeCalculators.some(x=>x.id===id))return homeCalculatorBody(lang,id,esc,url);
 if(id===insulationCalculator.id)return insulationCalculatorBody(lang,id,esc,url);
 const g=freeTools.find(x=>x.id===id);if(!g)return null;
 const d=g[lang],isRu=lang==='ru';
 const labels=isRu?{home:"Главная",tools:"Инструменты",free:"Бесплатно · Без регистрации",process:"Обработка на вашем устройстве",steps:"Как пользоваться",faq:"Частые вопросы",others:"Другие бесплатные инструменты",browser:"Нужен современный браузер; для QR и PDF — интернет для загрузки библиотек.",notice:"Выбранные файлы не отправляются на сервер."}:{home:"Home",tools:"Tools",free:"Free · No signup",process:"Processed on your device",steps:"How to use this tool",faq:"Frequently asked questions",others:"More free tools",browser:"A modern browser is required; QR and PDF tools need internet to load libraries.",notice:"Selected files are never uploaded to our server."};
 const form=(()=>{
  if(id==='qr-code-generator')return `<div class="ft-fields"><label for="ft-qr-mode">${isRu?'Тип QR-кода':'QR code type'}</label><select id="ft-qr-mode"><option value="url">${isRu?'Ссылка или текст':'Link or text'}</option><option value="wifi">Wi-Fi</option><option value="contact">${isRu?'Контакт (vCard)':'Contact (vCard)'}</option></select><div id="ft-qr-text"><label for="ft-qr-content">${isRu?'Ссылка или текст':'Link or text'}</label><textarea id="ft-qr-content" rows="3" maxlength="1800" placeholder="https://example.com"></textarea></div><div id="ft-qr-wifi" hidden><label for="ft-qr-ssid">${isRu?'Название сети (SSID)':'Network name (SSID)'}</label><input id="ft-qr-ssid" maxlength="80" autocomplete="off"><label for="ft-qr-password">${isRu?'Пароль сети':'Wi-Fi password'}</label><input id="ft-qr-password" type="text" maxlength="100" autocomplete="off"><label for="ft-qr-security">${isRu?'Защита':'Security'}</label><select id="ft-qr-security"><option value="WPA">WPA/WPA2/WPA3</option><option value="WEP">WEP</option><option value="nopass">${isRu?'Без пароля':'No password'}</option></select></div><div id="ft-qr-contact" hidden><label for="ft-qr-name">${isRu?'Имя и фамилия':'Full name'}</label><input id="ft-qr-name" maxlength="120" autocomplete="off"><label for="ft-qr-phone">${isRu?'Телефон':'Phone'}</label><input id="ft-qr-phone" type="tel" maxlength="50" autocomplete="off"><label for="ft-qr-email">Email</label><input id="ft-qr-email" type="email" maxlength="120" autocomplete="off"><label for="ft-qr-org">${isRu?'Организация (необязательно)':'Organization (optional)'}</label><input id="ft-qr-org" maxlength="120" autocomplete="off"></div><div class="ft-inline"><label for="ft-qr-dark">${isRu?'Цвет кода':'Code color'}</label><input type="color" id="ft-qr-dark" value="#143f33"><label for="ft-qr-size">${isRu?'Размер':'Size'}</label><select id="ft-qr-size"><option value="384">384 px</option><option value="768">768 px</option><option value="1024">1024 px</option></select></div><button type="button" class="ft-button" id="ft-qr-generate">${isRu?'Создать QR-код':'Generate QR code'}</button><div class="ft-qr-preview" id="ft-qr-preview" aria-label="${isRu?'Предпросмотр QR-кода':'QR code preview'}"></div><div class="ft-inline"><button type="button" class="ft-secondary" id="ft-qr-png" disabled>${isRu?'Скачать PNG':'Download PNG'}</button><button type="button" class="ft-secondary" id="ft-qr-svg" disabled>${isRu?'Скачать SVG':'Download SVG'}</button></div></div>`;
  if(id==='compress-images')return `<div class="ft-fields"><label for="ft-files">${isRu?'Выберите JPG, PNG или WebP (до 6 файлов)':'Choose JPG, PNG or WebP (up to 6 files)'}</label><input type="file" id="ft-files" accept="image/jpeg,image/png,image/webp" multiple><label for="ft-output">${isRu?'Выходной формат':'Output format'}</label><select id="ft-output"><option value="image/webp">WebP</option><option value="image/jpeg">JPG</option></select><label for="ft-max-size">${isRu?'Максимальная сторона':'Maximum dimension'}</label><select id="ft-max-size"><option value="1920">1920 px</option><option value="2560">2560 px</option><option value="1280">1280 px</option><option value="4096">4096 px</option></select><label for="ft-quality">${isRu?'Качество (от 40 до 95%)':'Quality (40–95%)'}: <output id="ft-quality-label">80%</output></label><input id="ft-quality" type="range" min="40" max="95" value="80"><button type="button" class="ft-button" id="ft-run">${isRu?'Сжать фотографии':'Compress images'}</button></div>`;
  if(id==='image-converter')return `<div class="ft-fields"><label for="ft-files">${isRu?'Выберите до 6 изображений JPG, PNG или WebP':'Choose up to 6 JPG, PNG or WebP images'}</label><input type="file" id="ft-files" accept="image/jpeg,image/png,image/webp" multiple><label for="ft-output">${isRu?'Сохранить как':'Convert to'}</label><select id="ft-output"><option value="image/png">PNG</option><option value="image/jpeg">JPG</option><option value="image/webp">WebP</option></select><label for="ft-max-size">${isRu?'Максимальная сторона':'Maximum dimension'}</label><select id="ft-max-size"><option value="4096">${isRu?'Исходный размер (до 4096 px)':'Original size (up to 4096 px)'}</option><option value="1920">1920 px</option><option value="1280">1280 px</option></select><label for="ft-quality">${isRu?'Качество JPG/WebP':'JPG/WebP quality'}: <output id="ft-quality-label">90%</output></label><input id="ft-quality" type="range" min="40" max="100" value="90"><button type="button" class="ft-button" id="ft-run">${isRu?'Конвертировать':'Convert images'}</button></div>`;
  if(id==='merge-pdf')return `<div class="ft-fields"><label for="ft-files">${isRu?'Выберите от 2 до 10 PDF':'Choose 2–10 PDF documents'}</label><input type="file" id="ft-files" accept=".pdf,application/pdf" multiple><p class="ft-help">${isRu?'Порядок можно изменить кнопками ↑ и ↓ ниже. Максимум 80 МБ в сумме.':'Reorder the files using ↑ and ↓ below. Maximum 80 MB combined.'}</p><div id="ft-order" class="ft-order"></div><button type="button" class="ft-button" id="ft-run">${isRu?'Объединить PDF':'Merge PDF'}</button></div>`;
  if(id==='images-to-pdf')return `<div class="ft-fields"><label for="ft-files">${isRu?'Выберите фотографии JPG, PNG или WebP (до 20)':'Choose JPG, PNG or WebP images (up to 20)'}</label><input type="file" id="ft-files" accept="image/jpeg,image/png,image/webp" multiple><p class="ft-help">${isRu?'Порядок страниц можно изменить кнопками ↑ и ↓. Максимум 80 МБ.':'Reorder pages using ↑ and ↓. Maximum 80 MB.'}</p><div id="ft-order" class="ft-order"></div><label for="ft-paper">${isRu?'Формат бумаги':'Paper size'}</label><select id="ft-paper"><option value="a4">A4</option><option value="letter">US Letter</option></select><button type="button" class="ft-button" id="ft-run">${isRu?'Создать PDF':'Create PDF'}</button></div>`;
  if(id==='word-counter'){
   const t=isRu?{input:'Введите или вставьте текст',placeholder:'Вставьте текст сюда…',stats:'Статистика текста',words:'Слова',chars:'Символы',nospace:'Без пробелов',sentences:'Предложения',paragraphs:'Абзацы',reading:'Время чтения',clear:'Очистить текст',limit:'Результат обновляется автоматически. До 50 000 символов. Текст не отправляется на сервер.'}:{input:'Type or paste text',placeholder:'Paste your text here…',stats:'Text statistics',words:'Words',chars:'Characters',nospace:'Without spaces',sentences:'Sentences',paragraphs:'Paragraphs',reading:'Reading time',clear:'Clear text',limit:'Updates automatically. Up to 50,000 characters. Your draft is not uploaded.'};
   const cells=[['words',t.words],['chars',t.chars],['no-spaces',t.nospace],['sentences',t.sentences],['paragraphs',t.paragraphs],['reading',t.reading]].map(([key,label])=>`<output class='ft-stat' aria-label='${esc(label)}'><span>${esc(label)}</span><strong id='ft-word-${key}'>0</strong></output>`).join('');
   return `<div class='ft-fields'><label for='ft-word-input'>${esc(t.input)}</label><textarea id='ft-word-input' rows='11' maxlength='50000' spellcheck='false' placeholder='${esc(t.placeholder)}'></textarea><div class='ft-stats' role='group' aria-label='${esc(t.stats)}'>${cells}</div><div class='ft-inline'><button type='button' class='ft-secondary' id='ft-word-clear'>${esc(t.clear)}</button></div><p class='ft-help'>${esc(t.limit)}</p></div>`;
  }
  return '';
 })();
 const currentPath=url(lang,'tools/'+id);
 return `<section class="shell ft-page" data-free-tool="${esc(id)}" data-ft-lang="${lang}"><nav class="breadcrumbs"><a href="${url(lang)}">${esc(labels.home)}</a><span>/</span><a href="${url(lang,'topics/tools')}">${esc(labels.tools)}</a><span>/</span><span>${esc(d.name)}</span></nav><header class="ft-heading"><span class="eyebrow thin">${esc(labels.free)}</span><h1>${esc(d.name)}</h1><p>${esc(d.lead)}</p><div class="ft-trust"><span>✳ ${esc(labels.process)}</span><span>✓ ${esc(labels.free)}</span></div></header><div class="ft-workspace"><div class="ft-form"><h2>${esc(d.name)}</h2>${form}<p class="ft-help">${esc(labels.browser)}</p><p class="ft-help">${esc(labels.notice)}</p><div id="ft-status" role="status" aria-live="polite" class="ft-status"></div><div id="ft-results" class="ft-results"></div></div><aside class="ft-info"><div class="ft-icon" aria-hidden="true">${esc(g.icon)}</div><h2>${isRu?'Сделано для удобства':'Made for everyday use'}</h2><p>${esc(d.description)}</p><div class="ft-mini-links"><strong>${esc(labels.others)}</strong>${freeTools.filter(x=>x.id!==id).map(x=>`<a href="${url(lang,'tools/'+x.id)}">${esc(x[lang].name)} ↗</a>`).join('')}</div></aside></div><section class="ft-editorial"><h2>${esc(labels.steps)}</h2>${d.sections.map(([h,t])=>`<section class="ft-text-section"><h3>${esc(h)}</h3><p>${esc(t)}</p></section>`).join('')}<h2>${esc(labels.faq)}</h2>${d.faq.map(([q,a])=>`<details class="ft-faq"><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join('')}</section><nav class="ft-end"><a href="${url(lang,'topics/tools')}">${isRu?'← Все инструменты':'← All tools'}</a><a href="${url(lang)}">${isRu?'К статьям':'Browse guides'} ↗</a></nav></section>`;
};
