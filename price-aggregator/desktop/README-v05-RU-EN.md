# MURDILIMAX Recovery 0.5 — Этап 1: безопасность чтения / Stage 1: imaging safety

Это бесплатная экспериментальная программа, а не доказанная замена R-Studio, DMDE или GNU ddrescue.

## Новое в 0.5

- Запрещено напрямую сканировать или создавать образ живого системного диска Windows. Используйте заранее подготовленный образ либо профессиональную среду восстановления.
- Возобновление создания образа физического HDD/USB требует совпадения аппаратного отпечатка: серийного номера, модели, типа шины, размера диска и сектора. Если устойчивый серийный номер не предоставляется USB-адаптером, продолжение запрещено. Первое копирование возможно.
- До копирования проверяется свободное место на диске назначения.
- Сохранены журнал ошибок чтения, SHA-256 и защита от записи на источник; нечитаемые участки образа заполняются нулями и документируются.

## Установка

Скачайте MURDILIMAX-Recovery-Setup-0.5.exe из GitHub Releases, установите в Windows 10/11 x64, запустите через меню Пуск. Python не требуется. Это неподписанная тестовая программа: предупреждение Windows SmartScreen возможно.

## Важно

Испытаний на реальных повреждённых дисках пока не было. Физически нестабильный диск может ухудшиться даже от чтения: остановитесь и обратитесь к специалисту. Сохраняйте данные на другой накопитель. Никакая программа не вернёт достоверно перезаписанные или TRIM-очищенные данные. Не обрабатывайте чужие носители без согласия владельца.

## English

MURDILIMAX Recovery 0.5 is a free experimental Windows 10/11 x64 data recovery alpha. Stage 1 blocks direct access to the running Windows system disk; checks hardware serial/model/bus/geometry when resuming a raw physical-disk image; refuses an unsafe resume without a stable hardware serial; and checks free space before imaging. The source is read-only, but operating-system background writes may still occur. Unreadable sectors are zero-filled and logged. This has not been validated with actual failing hardware and does not replace professional tools or GNU ddrescue. Only scan media you own or are authorized to access.
