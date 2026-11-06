# MURDILIMAX Recovery 0.8 — Этап 4 / Stage 4

**Бесплатная экспериментальная программа для Windows 10/11 x64.** Установщик `.exe` работает без отдельного Python. Исходный носитель читается без записи, результаты сохраняются отдельно. Программа не прошла испытания на неисправных физических дисках и не доказала превосходство над R-Studio/DMDE.

## RU — что нового в 0.8

### ext4 — чтение существующих файлов из образов (НО НЕ undelete)

- Обнаружение ext4-томов в сырых образах `.img` / `.dd` / `.bin`: напрямую, через MBR и GPT, а также по эвристическому поиску загрузочного тома.
- Локальное чтение **существующих** файлов, каталогов и вложенных папок с именами из записей ext4. Поддерживаются файлы с extents и деревьями extents небольшой глубины, а также разрежённые файлы.
- Результат сохраняется на другой накопитель через `RECOVER SELECTED`, по возможности с исходным путём. Источник открывается только для чтения. Содержимое может быть неполным или повреждённым — проверяйте копии.
- **Не поддерживаются:** поиск уже удалённых inode через журнал ext4, fscrypt-зашифрованные файлы, inline-data, bigalloc, legacy block pointers, разбор всех вариантов ext4 и восстановление оригинальных байтов из перезаписанных блоков. Проверка контрольных сумм всех метаданных ext4 пока не реализована. Это не готовый универсальный ext4-undelete.

### Зашифрованные тома — распознавание, без расшифровки

- Программа обнаруживает узнаваемые заголовки LUKS1, LUKS2 и BitLocker в прямых образах и некоторых разделах MBR/GPT.
- При блокировке показывает инструкцию, как **законному владельцу** разблокировать диск штатными средствами ОС (Windows BitLocker, Linux `cryptsetup`) и создать отдельный уже расшифрованный образ или использовать разрешённую папку.
- **Ключи, seed-фразы и пароли не запрашиваются и не отправляются на сайт; обойти шифрование программа не умеет.** Если пароль или recovery key утерян, это не восстановит доступ само по себе.

### Установка и использование

1. Скачайте `MURDILIMAX-Recovery-Setup-0.8.exe` на **исправный** диск и установите. Установщик пока не имеет цифровой подписи.
2. В окне выберите режим **NTFS/exFAT deleted files + ext4 existing files (image)**, затем `Browse source…`.
3. Откройте сырой образ ext4, NTFS или exFAT. При повреждённом оборудовании сперва создайте безопасный образ профессиональным инструментом и не продолжайте читать физически неисправный накопитель.
4. Выберите категорию файлов, нажмите `SCAN SOURCE`, отметьте нужные результаты и `RECOVER SELECTED →`.
5. Сохраняйте результат на **другой физический диск**. Программа не подтверждает целостность каждого файла; дополнительно открывайте и проверяйте результат.

### Ранее реализовано

NTFS/exFAT удалённые записи, базовый file carving JPG/PNG/PDF/ZIP, предварительный просмотр фотографий, сохранение образов с картой ошибок и SHA-256, экспериментальная сборка RAID 0/1/5/6/10 и чтение метаданных Linux MD 1.2 — с ограничениями из документации версии 0.7.

### Тесты

`python -m unittest discover -v` из `price-aggregator/desktop`. Тесты используют искусственно созданные образы, включая sparse ext4, 1-уровневое дерево extents и испорченные указатели. **Независимых тестов на реальных damaged SSD/HDD/RAID не было.**

## EN — Stage 4

MURDILIMAX Recovery 0.8 is a **free experimental** Windows application. Windows installer includes its runtime and does not require separate Python. Source is read-only; extraction writes new files to a separately selected output. This product is NOT proven superior to professional recovery tools.

**ext4:** read-only discovery and selective export of *existing* extent-backed regular files from raw images, with directories, extent trees and sparse-file holes in supported cases. Supports direct, MBR/GPT and heuristic volume detection. **It does NOT undelete ext4 inodes**, parse journals, decrypt fscrypt, support all ext4 features, or guarantee file integrity. Directory and file metadata checksums are not fully validated.

**Encrypted images:** recognizable LUKS1/LUKS2 and BitLocker headers are identified. The program does NOT decrypt volumes, request recovery keys, brute-force passwords or upload secrets. The owner must use authorized operating-system tools to unlock and make a separately accessible decrypted image or select an authorized unlocked folder.

**Safety:** do not use this alpha as your sole tool for irreplaceable data; stop on clicking/disconnecting drives and consult a specialist. Save outputs to a different physical device. The installer is unsigned, and full field validation is still pending. Legacy NTFS/exFAT, RAID, carving, imaging and checks from previous releases remain experimental.
