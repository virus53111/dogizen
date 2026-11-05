# MURDILIMAX Recovery 0.4 — EXPERIMENTAL / ЭКСПЕРИМЕНТАЛЬНАЯ ВЕРСИЯ

## РУССКИЙ

**Это бесплатная тестовая программа для восстановления данных на Windows, а не доказанная замена R-Studio или DMDE.** По сравнению с версией 0.3 добавлены безопасное создание образа, продолжение прерванного копирования, карта нечитаемых блоков, проверка SHA-256 и отчёты о результатах.

### Установка и запуск

1. Установите **Python 3.11 или новее** с официального сайта https://www.python.org/downloads/windows/ (обычный установщик уже включает Tkinter). Если на GitHub Actions появится протестированный файл `.exe`, Python для него не потребуется, но успешность сборки нужно проверить.
2. Распакуйте ВСЕ файлы архива в одну папку на исправном диске. Не устанавливайте на диск, с которого хотите восстановить удалённые файлы.
3. Дважды нажмите `START-MURDILIMAX-WINDOWS.bat`. В графическом интерфейсе выберите источник через **Browse source**.
4. Чтобы сохранить копию, выберите исходный `.img/.dd/.bin` или режим **Physical HDD/USB** (Windows, только с разрешением чтения, администратор может потребоваться), затем нажмите **SAFE DISK IMAGE…**. Сохраните `.img` на другом физическом диске.
5. **CANCEL / PAUSE** сохраняет файл `.part` и `.mrd-state.json`, если прерывание произошло после контрольной точки. Для продолжения укажите те же источник и путь выходного `.img`. При возобновлении с физического диска **обязательно** повторно проверьте его идентичность.
6. После завершения появятся `.img` и `.img.mrd-report.json` — отчёт со списком нечитаемых диапазонов, количеством ошибок и SHA-256 образа. Если сектора не читаются, программа **заполняет их нулями**, а не восстанавливает содержимое. Хеш подтверждает только полученный образ.
7. В режиме **Deleted files** программа анализирует NTFS/exFAT из образа, в **Signature scan** ищет признаки JPG/PNG/PDF/ZIP, в режиме **Folder** — обычные файлы и названия резервных копий кошельков. Отметьте нужные файлы и нажмите **RECOVER SELECTED**. Выберите отдельный накопитель для результата.
8. В итоговом локальном отчёте о восстановлении будут сохранены SHA-256, пути, ошибки и **консервативная** проверка форматов JPEG, PNG, PDF, ZIP, DOCX/XLSX/PPTX, SQLite и MP4/MOV. Отметка «plausible» не гарантирует целостность каждого байта.

### Что нового в 0.4

- `murdilimax_imager.py`: создание образов с контролем ошибок чтения, секторным разбиением повреждённых блоков, автоматической остановкой при слишком большом числе ошибок, промежуточным журналом и безопасным продолжением. **Не заменяет GNU ddrescue или оборудование профессиональных лабораторий**.
- `murdilimax_validate.py`: локальная проверка сигнатур и некоторых структурных признаков восстановленных файлов, включая CRC блоков PNG; не отправляет файлы в интернет.
- `murdilimax_recovery_v04.py`: новый GUI, операция SAFE DISK IMAGE, копирование в фоновом потоке, Cancel/Pause, отчёты и статусы.
- `murdilimax_benchmark.py`: воспроизводимые измерения на заранее известных образах. Создайте JSON вида `{"cases":[{"name":"case-1","image":"test.img","expected_sha256":["64 hex символа"]}]}`, затем выполните `py -3 murdilimax_benchmark.py groundtruth.json --out result.json`. Показатели precision/recall требуют **полного и достоверного** набора эталонных файлов и не сравнивают напрямую с конкурентами.
- Расширенный набор автоматических тестов: `py -3 -m unittest discover -v`.

### Что было в 0.3 и остаётся

- Анализ NTFS и exFAT по сохранившимся метаданным; поддержка части фрагментированных NTFS-файлов, части удалённых папок, проверки кластерной карты.
- Поиск потерянных NTFS/exFAT разделов, резервной GPT и некоторых резервных boot-секторов.
- Экспериментальный поиск удалённых записей MFT даже при повреждённом основном `$MFT`.
- Виртуальная реконструкция RAID 0/1/5 из файлов-образов, **RAID5: только Linux MD left-symmetric**, ручной порядок и stripe size.
- Режим чтения физических HDD/USB через Windows API с доступом **только для чтения**. Он ещё **не проверен на реальном Windows-компьютере с повреждённым накопителем**.
- Поиск файлов резервных копий криптокошельков по именам. **Не извлекает приватные ключи, seed-фразы, не взламывает пароли и не отправляет секреты в сеть.**

### Ограничения и безопасность

- **Никогда не используйте эту альфу как единственный способ спасения незаменимых данных**. Для щёлкающего, отключающегося или физически нестабильного диска прекратите операции и обращайтесь в лабораторию. Даже чтение способно усугубить аппаратный отказ. Windows также может изменять смонтированный диск независимо от программы.
- Прямое чтение физических устройств, режим RAID и проверки восстановленных больших файлов требуют полевых испытаний. Автотесты используют искусственные образы и не подтверждают точность на реальных повреждённых дисках.
- Никакая программа не гарантирует возврат перезаписанных данных или содержимого SSD после TRIM; также отсутствует полноценная поддержка RAID6, BitLocker, ZFS, APFS, Btrfs и аппаратных повреждений.
- Заполнение неисправных секторов нулями сохраняет геометрию образа, но не восстанавливает повреждённые байты. Всегда читайте `.mrd-report.json`.
- Программа не передаёт данные на сервер. Используйте только диски, которые принадлежат вам или доступны на законных основаниях.

## ENGLISH

**This is an experimental, free data recovery program — NOT a proven replacement for R-Studio or DMDE.** Version 0.4 adds resumable image acquisition, error maps, SHA-256 verification, a responsive non-blocking recovery workflow, conservative file checks, and local audit reports.

**Launch:** Install Python 3.11+, unzip the entire archive onto a healthy disk, run `START-MURDILIMAX-WINDOWS.bat`. Choose a raw image or explicit Windows physical device. Click **SAFE DISK IMAGE…** to copy to a **different physical disk**. Interrupted acquisitions retain `.part` and `.mrd-state.json`; resume by selecting the same device and destination. **Verify the physical device identity manually before resuming.** Completed images include an `.mrd-report.json` with SHA-256 and unreadable ranges (zero-filled; not recovered).

**Scan and recover:** NTFS/exFAT deleted metadata, limited JPG/PNG/PDF/ZIP carving, and filename-based wallet backup discovery. Select candidates, recover to another disk and inspect JSON reports. Format checks are conservative heuristics, not integrity guarantees.

**Benchmark:** supply an authorized known-ground-truth image corpus with SHA-256 for expected files, then run `py -3 murdilimax_benchmark.py manifest.json --out report.json`. To claim superiority over any competitor, independent tests of all products must use identical evidence, scenarios, hardware and scoring methods.

**Warning:** Physical-device support is not yet field-validated. Damaged disks can deteriorate under read load. This tool does not recover overwritten/TRIM-cleared data, extract secrets, unlock BitLocker, or repair hardware. Stop if an unstable drive clicks or disconnects. For irreplaceable data use professional specialists. There is no cloud upload, payment requirement, or telemetry. All operations are to be performed only on media you own or are authorized to examine.
