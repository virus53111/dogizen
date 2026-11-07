# MURDILIMAX Recovery 0.3 — экспериментальная версия / Experimental edition

## РУССКИЙ

Это программа с настоящим анализом данных, но **пока НЕ доказано, что она мощнее R-Studio, DMDE или PhotoRec**. Поддержка прямого физического HDD/USB в Windows реализована в коде, **но НЕ проверена на реальном Windows-диске**. Пока не доверяйте ей единственные экземпляры важных данных.

### Реализовано

- Чтение HDD/USB по `\\.\PhysicalDriveN` на Windows с системными вызовами `CreateFileW` и `GENERIC_READ` **без прав записи**, выравниванием чтения по логическим секторам и проверкой объёма диска.
- GUI позволяет выбирать доступный физический диск Windows с подтверждением, либо открывать несжатые образы `.img`, `.dd`, `.bin`, `.raw`.
- Анализ удалённых записей NTFS и exFAT: выбор файлов, восстановление известных разрывных NTFS data runs, некоторые удалённые папки (если сохранились родительские записи).
- Проверка занятых кластеров NTFS/exFAT; восстановление данных с известным повторным занятием блокируется. Если статус неизвестен, перед восстановлением требуется подтверждение.
- Поиск потерянных разделов NTFS/exFAT по сохранившимся VBR: 4 KiB выравнивание на первых 16 MiB и 1 MiB выравнивание по всему диску; также проверяются резервные GPT (CRC) и отдельные резервные загрузочные секторы NTFS и exFAT.
- Экспериментальное извлечение сохранившихся удалённых MFT-записей, если основная `$MFT` повреждена. Без полной реконструкции `$Bitmap` статус кластера остаётся «неизвестен».
- Сигнатурное сканирование JPEG, PNG, PDF, ZIP на образах и устройствах. **Фрагментированные файлы могут восстановиться лишь частично или некорректно**.
- Реконструкция RAID0/RAID1/RAID5 на основе **готовых образов участников массива**. RAID5: только схема Linux MD left-symmetric, размер stripe и порядок дисков задаются вручную, один отсутствующий диск можно восстановить математически (XOR); нельзя гарантировать правильность без проверки.
- Поиск **названий** резервных копий криптокошельков в каталогах/NTFS/exFAT; программа не извлекает seed-фразы или приватные ключи и ничего не отправляет в сеть.

### Ограничения

- Windows `.exe` в этом архиве нет. Программа запускается через Python 3.11+ и Tkinter (обычно поставляется с Python для Windows). Не удалось протестировать настоящий драйвер устройства Windows в этой среде.
- Нет поддержки RAID6, ZFS, Btrfs, BitLocker, LVM, APFS, ext4, повреждённых контроллеров или физической неисправности накопителя; их нельзя обещать.
- Потерянный раздел без целого/резервного загрузочного сектора не всегда обнаруживается.
- Работает **только локально**. Ни один файл не загружается в интернет. Режим восстановления данных **бесплатный**, без лицензии.

### Как запустить

1. Установите Python 3.11+ с официального сайта `https://www.python.org/downloads/windows/` (в установке Windows включите Add Python to PATH).
2. Распакуйте ZIP целиком в папку на другом, исправном накопителе.
3. Запустите `START-MURDILIMAX-WINDOWS.bat`. Дополнительные библиотеки для GUI не требуются.
4. Для просмотра физических HDD/USB запустите от администратора, выберите режим **Physical HDD/USB**, нажмите **Browse Source**, проверьте номер и ёмкость диска, подтвердите сканирование. Если Windows запретит доступ, не пытайтесь менять разрешения на неисправном диске.
5. Для повреждённого или нестабильного диска **не используйте прямое сканирование**: сначала сделайте безопасный побитовый образ средствами GNU ddrescue или обратитесь в лабораторию, затем анализируйте образ.
6. Отмечайте результаты в таблице, нажмите **RECOVER SELECTED**, обязательно выберите **ДРУГОЙ физический диск** для сохранения.
7. Для RAID используйте **RAID BUILDER**, укажите точный порядок образов дисков и размер stripe, сохраните виртуальный образ на отдельный исправный носитель и просканируйте его.

### Тестирование

Запуск из терминала в распакованной папке: `py -3 -m unittest -v test_engine test_advanced`. Есть **18 синтетических автоматических тестов** на анализ NTFS/exFAT, уничтоженную основную таблицу GPT, потерянный VBR, резервные boot-сектора, повреждение `$MFT`, RAID0/1/5 и блокировки опасных операций. Это **не подтверждает** надёжность на настоящих дисках. Для экспертного релиза нужны независимые эталонные образы, проверки на Windows 10/11 и сравнительные тесты с R-Studio/DMDE с метриками точности.

### Важно

**Никогда не устанавливайте программу и не записывайте восстановленные файлы на исходный накопитель.** При физических неисправностях ограничивайте число обращений к нему; чтение тоже может усугубить состояние. Если данные незаменимы, сначала профессиональный съём образа. Используйте программу только для своих носителей или с разрешения владельца. Windows может держать диск смонтированным и обновлять данные другим ПО, даже если MURDILIMAX открывает устройство только для чтения.

---

## ENGLISH

MURDILIMAX 0.3 is a working experimental recovery toolkit, **not proven to outperform R-Studio, DMDE or PhotoRec**. It includes code for read-only Windows physical drive access, lost NTFS/exFAT boot sector discovery, backup GPT validation, damaged MFT salvage, and explicitly configured RAID0/1/5 image reconstruction. Actual physical-drive behavior **has not yet been verified on a Windows test machine**.

**Start:** Install Python 3.11+ and run `START-MURDILIMAX-WINDOWS.bat`. Scan existing raw images first. Use administrator privileges only if absolutely required to read a physical source. The UI opens disks with read permissions only; it does not write to the source. Save recovered files on a different physical drive. For unstable devices, first clone with GNU ddrescue or use a professional data recovery lab.

**Limitations:** No RAID6, encrypted filesystem recovery, fragmented carving reconstruction, BitLocker unlocking, or hardware repair. RAID5 supports only Linux MD left-symmetric layout with user-specified member order and stripe size. Cryptocurrency backup detection is filename-based; no private-key or seed extraction is performed. No data is uploaded. This version remains fully free.

**Tests:** `py -3 -m unittest -v test_engine test_advanced` — 18 synthetic tests, not field validation. For production use, perform Windows physical-device testing and compare results against R-Studio/DMDE on ground-truth recovery datasets.
