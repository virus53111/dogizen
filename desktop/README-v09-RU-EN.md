# MURDILIMAX Recovery 0.9 — Stage 5 / Этап 5

## Русский

**Экспериментальная Windows 10/11 x64 версия.** Скачайте MURDILIMAX-Recovery-Setup-0.9.exe из GitHub Releases. Python отдельно не требуется. Установщик пока **не имеет цифровой подписи**; сверяйте SHA-256 с SHA256SUMS.txt на странице релиза.

### Что нового

1. **WALLET BACKUP FINDER…** — локальный поиск *имён существующих файлов* по шаблонам Bitcoin Core (wallet.dat), Electrum и Ethereum keystore. Показываются путь, тип и размер; содержимое файлов не читается. **Seed-фразы, приватные ключи и пароли не ищутся, не извлекаются и никуда не отправляются.** Совпадение имени не означает, что файл содержит действующий кошелёк или средства. Этот отдельный режим не ищет удалённые файлы; общий анализ NTFS/exFAT имеет свои ограничения.
2. **RECOVERY ADVISOR** — для выбранного результата даёт объяснение риска повреждений, неизвестной занятости кластеров, ограничений ext4 и приватности крипторезервных копий. Это **детерминированные локальные правила, не ИИ, не аппаратная диагностика и не гарантия восстановления**.
3. **Расширенная проверка после восстановления** — SQLite: read-only quick_check с ограничениями; JPEG: декодирование Pillow с лимитами; MP4/MOV: границы верхнеуровневых атомов; ранее существующие PNG/ZIP CRC. Вывод сохраняется в локальный JSON-отчёт. Даже статус validated_structure не доказывает целостность каждого байта. Отчёты могут содержать личные имена файлов — берегите их.

### Безопасность

Устанавливайте программу и сохраняйте результаты на *отдельный исправный диск*, не на источник. Если HDD щёлкает, перегревается или отключается, прекратите чтение и обратитесь к специалистам. Реальное восстановление на неисправных HDD/RAID ещё не подтверждено достаточными полевыми испытаниями. Перезаписанные блоки и SSD TRIM не восстанавливаются. Полное ext4 undelete и автоматическая реконструкция произвольного NAS пока не реализованы. Нельзя утверждать, что приложение доказанно лучше R-Studio или DMDE.

Только для собственных или разрешённых носителей. Автоматические тесты запускаются из исходного каталога desktop командой python -m unittest discover -v; они основаны на искусственных образах и данных.

## English

Experimental **Windows 10/11 x64** program with an unsigned standalone installer (no separate Python installation required). Verify downloads using SHA256SUMS.txt.

**Wallet Backup Finder** locally scans *visible filenames only* for recognized wallet backup names. It never opens wallets, reads seed phrases/private keys, bypasses passwords, uploads files, or recovers deleted files itself. Matches do not prove wallet validity or access to funds.

**Recovery Advisor** provides deterministic offline caution messages for selected scan results — not generative AI or a recovery guarantee.

**Deeper checks** add read-only SQLite quick_check, bounded JPEG Pillow decode, and MP4/MOV top-level atom inspection to existing PNG and ZIP structure checks. All reports remain local but may contain sensitive filenames. A validated structure is not a guarantee that every byte is correct.

Use only owned/authorized media. Do not install or recover to the source. Stop for physically failing or clicking disks and contact professionals. Physical-device and RAID reliability remain unproven in field testing. No independent superiority benchmark.
