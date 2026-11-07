# MURDILIMAX Recovery 0.6 — Stage 2 / Этап 2

## Русский

**Бесплатная экспериментальная программа**, а не проверенная замена R-Studio, DMDE или профессиональной лаборатории. Проверена автоматическими тестами на искусственных образах; **полноценные испытания на неисправных HDD/SSD и RAID ещё не проводились**.

### Установка

Скачайте **MURDILIMAX-Recovery-Setup-0.6.exe** с официальной страницы релиза GitHub. Запустите установщик на Windows 10/11 x64. Приложение появится в меню «Пуск». Отдельно устанавливать Python не требуется. Файл пока **без цифровой подписи**; предупреждение SmartScreen возможно. Программа не отправляет файлы в облако.

### Новое в 0.6: NTFS и exFAT, предпросмотр и оценка качества

1. **NTFS:** путь удалённого файла теперь проверяет *sequence number* родительской записи MFT. При повторном использовании записи программа не присваивает файлу неверное имя папки. Поиск удалённых файлов и часть фрагментированных NTFS-потоков уже были в предыдущих версиях.
2. **exFAT:** частичное восстановление вложенных файлов из удалённых папок. Удалённая папка анализируется только когда карта кластеров подтверждает, что её начальный кластер свободен. Если исходная FAT-цепочка не сохранилась, программа пока проверяет только первый кластер папки; другие вложенные файлы могут остаться ненайденными. Занятые другими данными кластеры не восстанавливаются автоматически.
3. **exFAT Bitmap:** обработка FAT-цепочки карты занятости, содержащей несколько кластеров, включая фрагментированное размещение. Непроверенную или неполную карту программа отмечает как неизвестное состояние.
4. **Предпросмотр фото:** выберите один найденный JPG/PNG/GIF/WEBP/BMP/TIFF в таблице и нажмите **PREVIEW PHOTO**. Данные читаются ограниченно (максимум 12 МиБ) в память. Файл не записывается на диск, а изображение декодируется локально через Pillow. Результаты с пометкой *reallocated* или неподдерживаемым сжатием блокируются. Предпросмотр не доказывает полную целостность.
5. **ZIP/DOCX/XLSX/PPTX/EPUB:** для контейнеров до 64 МиБ на отдельный файл и 256 МиБ суммарно проверяются CRC всех частей при распаковке в память ограниченными порциями, без записи на диск. Архивы, превышающие лимит или требующие пароля, помечаются *inconclusive*, а не как полностью восстановленные.

### Ограничения и безопасность

- Предпросмотр доступен только для результатов, полученных через NTFS/exFAT metadata scan. Фото, превышающее лимит 12 МиБ, пока нужно восстановить в копию и проверить отдельно.
- Расширенный поиск из удалённых папок exFAT — частичный, не реконструирует все разрушенные каталоги. Фрагментированные данные могут быть невосстановимы.
- Встроенное чтение физических Windows-устройств остаётся экспериментальным. Никогда не работайте с единственным экземпляром бесценных данных. При щелчках/перегреве/отключении диска остановитесь и обратитесь в лабораторию.
- Новые функции не восстанавливают физически уничтоженные, перезаписанные или TRIM-очищенные данные. Работа с шифрованием, RAID6, APFS, ZFS, Btrfs пока ограничена или отсутствует.
- Сначала создавайте образ исправно читаемого диска и работайте с ним. Сохраняйте восстановленные файлы на *другой физический носитель*.
- Только собственные или разрешённые носители. Кошельки и приватные ключи не передаются на сервер, пароли не взламываются.

### Сборка разработчиком

Python 3.11+, Pillow 11/12. Запустите тесты: `python -m unittest discover -v`. Сборка на Windows выполняется GitHub Actions: `PyInstaller` создаёт один `.exe` со встроенным Python и Pillow, `Inno Setup` создаёт установщик с меню «Пуск». Оба артефакта публикуются вместе с SHA-256 на странице релиза.

## English

**Free experimental recovery software**, not yet a validated replacement for R-Studio, DMDE or expert labs. Tested on synthetic disk images; realistic field testing with failing HDDs, SSDs and RAID is outstanding.

**Install**: Download `MURDILIMAX-Recovery-Setup-0.6.exe` from the GitHub v0.6.0 release; run on Windows 10/11 x64. Python is bundled. The installer is currently unsigned and may trigger SmartScreen.

**Stage 2 improvements**: (1) NTFS parent MFT sequence-number guard against attaching recovered files to reused directories; (2) cautious discovery of deleted exFAT subdirectories, only when their first cluster is provably free; (3) multi-cluster FAT-chained exFAT allocation bitmap lookups; (4) local in-memory photo previews of selected NTFS/exFAT metadata candidates, bounded to 12 MiB with Pillow decoding; (5) bounded CRC checks of ZIP/Office-container members, marking oversized or encrypted archives inconclusive rather than pretending the data is intact.

**Safety:** No cloud upload or payments. Source is opened read-only. Save recovered files to a distinct physical disk. Real-disk access and damaged RAID recovery are not field-validated. Lost fragments, reallocated sectors, overwritten/TRIM-cleared data and unstable devices may be beyond software recovery. Stop reading failing drives, seek a lab, and only examine devices you own or are authorized to access.