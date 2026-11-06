# MURDILIMAX Recovery 0.7 — Stage 3: RAID / NAS experiments

> **ЭКСПЕРИМЕНТАЛЬНАЯ СБОРКА**. Не применяйте как единственное средство для спасения бесценных данных. Реконструкция массивов из тестовых образов не равна испытаниям реального повреждённого NAS. Продукт не доказал превосходство над R-Studio или DMDE.

## RU — установка и работа

Установщик `MURDILIMAX-Recovery-Setup-0.7.exe` запускается в Windows 10/11 x64. Python отдельно не требуется. Не устанавливайте на диск, с которого нужно восстановить удалённые файлы. Установщик пока **без цифровой подписи**.

В окне программы нажмите **RAID BUILDER…** и выберите **сохранённые заранее образы** физических участников массива. Укажите **правильный порядок** дисков, точный stripe size и layout. Для отсутствующего участника впишите `-`. Сохраните новый логический образ **на другой накопитель**. Исходные образы открываются только для чтения. Выход сначала пишется в новый файл `.mrd-part`; в случае ошибки он удаляется, законченный результат получает SHA-256. Прочитайте сообщение о проверке чётности: отсутствие ошибок не гарантирует, что параметры массива выбраны правильно.

### Реализовано в 0.7

- **RAID 0 и RAID 1:** чередование и зеркала, сравнение зеркал по запросу.
- **RAID 5:** шесть вариантов схем расположения чётности: `left-symmetric`, `left-asymmetric`, `right-symmetric`, `right-asymmetric`, `parity-first`, `parity-last`. Восстановление одного отсутствующего участника при корректной конфигурации. Опциональная XOR-проверка чётности для полного набора образов.
- **RAID 6 (ограничение):** только простая схема `fixed-pq-last`, где **два последних** участника содержат P и Q (GF(256), 0x11d). Восстановление до двух отсутствующих участников, включая два отсутствующих участника данных. **Это не универсальный Linux MD RAID6, не автоматически распознаваемый Synology/QNAP RAID и не DDF.** Отдельные варианты RAID6 Linux MD/вендоров будут поддержаны только после изучения реальных метаданных и сравнения с эталонами.
- **RAID 10 (ограничение):** `near-2` — смежные пары зеркал с ручным порядком. Может работать при потере нескольких участников, если в каждой паре осталось одно зеркало.
- **RAID 5 experimental hints:** кнопка предлагает **слабые** подсказки о расположении массива, только если узнаваемый загрузочный сектор NTFS/exFAT находится в самом начале логического образа. Подсказка **не доказывает** порядок остальных дисков и не собирает массив автоматически.
- **Linux MD v1.2 read-only metadata:** осмотр заголовков `md` в начале отдельного образа участника, проверка UUID/level/size/role и **экспорт только области данных** в новый образ. Распознаёт только MD superblock **v1.2 на смещении 4096 байт от начала файла**. Исходный образ не изменяется. Несовпадающие UUID/повторяющиеся роли отклоняются.
- Защита от перезаписи исходных файлов или существующего результата; атомарная публикация выходного образа после успешного завершения; отчёт SHA-256.

> **Важная граница:** эта версия ещё не извлекает массив автоматически из полного NAS-диска с GPT/LVM/SHR/Btrfs/ZFS, не понимает метаданные всех RAID-контроллеров и не обрабатывает деградирующие физические носители на уровне лабораторного оборудования. Пользователь несёт ответственность за правильность схемы, расположения и порядка дисков. Сначала делайте отдельные побитовые образы, а не сканируйте оригиналы.

### Командная строка (для специалистов)

```powershell
py -3 murdilimax_raid.py --level 5 --layout left-symmetric --chunk-kib 64 --verify-parity --output recovered-array.img member0.img member1.img member2.img
py -3 murdilimax_raid.py --level 6 --layout fixed-pq-last --chunk-kib 64 --verify-parity --output recovered-raid6.img member0.img member1.img - member3.img member4.img
py -3 murdilimax_raid.py --level 10 --layout near-2 --chunk-kib 64 --verify-parity --output recovered-raid10.img mirror0.img mirror1.img - mirror3.img
py -3 murdilimax_md.py md-member0.img md-member1.img
py -3 murdilimax_md.py md-member0.img --extract-to md-member0-data.img
```

Для команд `.py` понадобится исходный код и Python, но **обычная Windows-версия с установщиком** Python не требует.

### Безопасность

1. При щелчках, пропадании устройства или перегреве остановитесь и обратитесь в лабораторию: даже чтение может ухудшить состояние неисправного диска.
2. Работайте с образами участников, сохранёнными на исправном диске; не пишите на исходные накопители.
3. При сомнениях в RAID layout используйте осмотр метаданных и профессиональную помощь. Не считайте проверку XOR или P/Q полной гарантией целостности файлов.
4. Если зашифрованный, уже перезаписанный или обнулённый TRIM блок физически отсутствует, программа не способна вернуть его исходные байты.
5. Только для собственных или разрешённых носителей.

### Проверки

Локальные автоматические тесты создают искусственные массивы с известными байтами, переставляют parity layout, удаляют один/два участника, проверяют совпадение SHA-256 и обнаружение несогласованной чётности. Это **не** тест на реальных NAS. Запуск: `py -3 -m unittest discover -v` из папки `desktop`.

## EN — Setup and limitations

The `MURDILIMAX-Recovery-Setup-0.7.exe` installer runs on Windows 10/11 x64 without a separate Python installation. It is **unsigned** and not certified for forensic use. Only use a separately acquired **raw disk image for each array member**. The app never writes to member images; the result is built as a new logical image. Choose member order, RAID level, chunk size and layout manually. If member images contain Linux md v1.2 superblocks, inspect and extract data-only slices first.

**Supported experimental layouts:** RAID0, RAID1, RAID5 in left/right symmetric/asymmetric and fixed parity-first/last layouts; RAID6 **fixed P/Q on last two members only** using GF(256); RAID10 **near-2 mirrored pairs**. Missing-member recovery is limited to valid arrangements. Optional parity/mirror checks can flag mismatch, but do not prove correct layout or healthy files. The GUI has a weak RAID5 start-signature hint feature, **not** reliable automatic layout detection.

The MD metadata probe supports **only Linux md v1.2 at offset 4096 of the input member image**. It checks common array identity fields and can export a raw data-only member to a new file, without altering the original. It does not understand nested partitions, Synology Hybrid RAID, QNAP proprietary metadata, LVM volumes, md RAID6 vendor layout, RAID controllers or automatic NAS volume mounting. No AI engine or password bypass.

**Safety:** Do not experiment on physically failing drives. Stop for clicking or disconnecting media. Make full independent images and save outputs to a separate healthy drive. An image can contain unrecoverable holes; reconstructed parity does not guarantee file integrity. No cloud uploads. Use only on authorized media. Benchmark against other tools on comparable real-world cases before making any claims of superiority.
