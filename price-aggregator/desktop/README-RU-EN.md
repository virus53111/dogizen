# MURDILIMAX Recovery — Alpha 0.1 / Альфа 0.1

## RU

Это **настоящий локальный прототип**, но пока **не конкурент R-Studio или DMDE**. Программа бесплатно сканирует имеющиеся файлы в выбранной папке, либо анализирует **несжатые образы дисков** .img, .dd, .bin и пытается извлечь JPG, PNG, PDF и ZIP по сигнатурам (file carving). Можно выбрать категории и восстановить отмеченные файлы в другую папку.

**Крипторежим:** в режиме папки фильтрует видимые имена файлов с признаками резервных копий кошельков. Не извлекает приватные ключи, не собирает seed-фразы, не взламывает пароли. Режим сырых образов пока не восстанавливает wallet.dat и не разбирает NTFS. Все операции выполняются локально без передачи данных в сеть.

**Запуск на Windows 10/11:** установите Python 3.11+ с python.org, скачайте murdilimax_recovery_alpha.py, откройте терминал в его папке и выполните: py murdilimax_recovery_alpha.py. Tkinter входит в стандартную установку Python для Windows. Программа не требует сторонних библиотек.

**Безопасность:** не устанавливайте программу на диск, с которого пытаетесь вернуть удалённые файлы; создайте битовый образ исходного диска профессиональным инструментом, не пишите на источник, восстанавливайте на другой физический диск. Не сканируйте физически повреждённые диски повторно; сначала обратитесь к специалистам. Файлы после восстановления могут быть повреждены или неполны, особенно фрагментированные. Данные после TRIM/перезаписи обычно невосстановимы. Доступ к носителям — только с разрешения владельца.

## EN

This is a **real local alpha**, **not yet a replacement for R-Studio or DMDE**. Scan visible files in a folder or carve JPG, PNG, PDF and ZIP candidates from **uncompressed raw drive images** (.img, .dd, .bin). Choose categories and save selected candidates to a different destination.

**Crypto category:** filters visible filenames that resemble wallet backups in folder mode only. Does not extract private keys, seed phrases or bypass passwords. Raw-image mode does not parse NTFS or recover wallet.dat in this alpha. No cloud upload or telemetry.

**Windows 10/11:** install Python 3.11+ from python.org, save murdilimax_recovery_alpha.py, open Terminal and run py murdilimax_recovery_alpha.py. Standard Python Tkinter is sufficient.

**Safety:** never write to a device you are trying to recover, make a forensic sector image with a dedicated tool before deep scanning, recover to a different physical drive. Fragmented and overwritten files may not be reconstructable. Device ownership/authorization required.
