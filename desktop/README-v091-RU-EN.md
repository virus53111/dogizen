# MURDILIMAX Recovery 0.9.1 — Stage 6 / Этап 6

Экспериментальный инструмент Windows 10/11 x64. Не сертифицирован для восстановления реальных повреждённых носителей и не доказал превосходство над R-Studio/DMDE. Это НЕ версия 1.0.

## Что сделано
- Quality Gate: 12 воспроизводимых синтетических образов NTFS/exFAT/ext4, побайтовые SHA-256 проверки извлечённых файлов, сохранение путей и защита от восстановления повторно занятых кластеров. ext4 сценарии касаются существующих файлов, не удалённых.
- Независимая проверка: murdilimax_benchmark.py повторно открывает восстановленные файлы и вычисляет SHA-256, а не доверяет только значению, возвращённому движком.
- murdilimax_compare.py сравнивает файлы, восстановленные разными программами, с известным эталоном. Он не запускает конкурентов и не выдаёт синтетические результаты за настоящие.
- GitHub Actions требует успешной проверки до сборки Windows EXE и сохраняет QUALITY-REPORT.json в релизе.

### Установка
Скачать MURDILIMAX-Recovery-Setup-0.9.1.exe с официального GitHub Releases, установить на исправный накопитель. Python для EXE не нужен. Установщик не подписан цифровой подписью.

### Для разработчиков
Запустите python -m unittest discover -v и python murdilimax_qualitygate.py --out QUALITY-REPORT.json.
Для независимого сравнения создайте файл JSON с cases: id, expected_sha256 (список реальных 64-значных хешей), runs: [{tool, output_dir}] для одной и той же тестовой среды. Затем выполните python murdilimax_compare.py manifest.json --out comparison.json.

### Ограничения и безопасность
Проверки выполнены на искусственных образах, НЕ на физических неисправных HDD/SSD/RAID. Для щёлкающих, перегревающихся, пропадающих дисков обращаться к специалистам — даже чтение может ухудшить состояние. Не писать на исходный носитель; сохранять восстановленное на другой диск. TRIM и перезапись данных не гарантируют восстановление. Использовать только свои носители или с разрешения владельца. Wallet Finder не читает seed-фразы и приватные ключи.

## EN
Stage 6 introduces a SYNTHETIC 12-case NTFS/exFAT/ext4 recovery gate. Results are re-read and verified byte for byte against known SHA-256 hashes; reused-cluster recovery is blocked. GitHub Actions fails before publishing when the gate fails. QUALITY-REPORT.json ships with the release. A separate local comparison tool can score independently supplied competitor output folders against complete truth hashes; no competitor output or hardware field trials are supplied. The unsigned installer bundles Python for Windows 10/11 x64. Never use this experimental software as the only rescue option for irreplaceable data.
