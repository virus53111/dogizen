# MURDILIMAX Recovery 0.10.4 — выбор диска целиком / whole-drive selection

## Русский

1. Нажмите **«Весь диск (C:, D:)»**.
2. Выберите диск по букве, названию и объёму. Нажмите ОК — переходить в папки не нужно.
3. Нажмите **«Начать сканирование»** и подтвердите чтение выбранного тома.
4. Восстанавливайте файлы на другой физический накопитель. Другая буква того же накопителя не подходит.

Установщик: MURDILIMAX-Recovery-Setup-0.10.4.exe. Запуск программы запрашивает права администратора Windows, необходимые для чтения диска. Python устанавливать отдельно не требуется.

«Папка» проверяет существующие файлы в папке. «Образ диска» открывает заранее снятый образ. «HDD / USB» остаётся отдельным расширенным выбором физического устройства.

NTFS/exFAT поддерживаются для поиска удалённых файлов на томе. Программа не записывает в исходный диск и не отключает/не блокирует том. При сканировании работающего C: Windows может продолжать писать на диск; это не неизменный снимок и не гарантия восстановления. Для ценных данных используйте автономный образ. Создание образа активного системного физического диска по-прежнему заблокировано.

Сайт и исходники: https://murdilimax.com/ — https://github.com/virus53111/dogizen

## English

Choose **Whole drive (C:, D:)**, select a drive by letter/label/size, press OK, then Start scanning. This opens the entire logical volume read-only, not a folder browser. The app requests Windows administrator permission at startup for raw disk access.

Recover only to another physical disk; a different letter on the same disk is blocked. NTFS/exFAT volume recovery remains experimental. Windows can still write to a mounted volume, so a live scan is not a consistent offline snapshot. Physical system-disk imaging safeguards remain enabled. No source writes, dismounts, telemetry or uploads are added.
