# MURDILIMAX Recovery Crystal 0.10.1 — Windows interface

## RU

**Новый интерфейс построен на PySide6 / Qt 6**, а не на старом Tkinter. Windows-установщик включает Python и Qt — вручную ставить их не нужно.

* Откройте MURDILIMAX Recovery. По умолчанию интерфейс на русском. Переключить язык можно кнопкой `RU / EN` или в настройках.
* Нажмите «Образ диска» для ранее снятого raw `.img/.dd/.bin`, «Папка» для обычных доступных файлов или «HDD / USB» для физического устройства Windows. Для физического чтения могут требоваться права администратора; исходный носитель может быть нестабилен.
* Выберите категории и режим: метаданные NTFS/exFAT/ext4 либо сигнатурное сканирование JPG/PNG/PDF/ZIP. Результаты и прогресс отображаются только при РЕАЛЬНОЙ операции, фальшивого демо в программе нет.
* Отметьте файлы галочками в таблице. Для одного фото, найденного по метаданным, нажмите «Предпросмотр» (максимум 12 МиБ). Для сохранения нажмите «Восстановить отмеченное» и выберите **другой физический диск**.
* «Создать образ» делает безопасное чтение с журналом, ошибочными участками и SHA-256. «Собрать RAID» поддерживает ограниченные конфигурации массива по ранее созданным образам. Найденные результаты можно проверить локальным отчётом.
* «Кошельки» ищет **только имена** существующих резервных файлов в выбранной папке, не открывая ключи или seed-фразы.

**Ограничения:** программа остаётся экспериментальной и не подтверждена на повреждённых физических HDD/NAS. Не доказано превосходство над профессиональными продуктами. Не используйте на единственном экземпляре критичных данных. При щелчках/отключениях HDD немедленно остановитесь и обратитесь к специалисту. Прямое чтение физических устройств даже без записи может усугубить поломку. Исходные файлы не загружаются в облако.

Для разработчиков: `pip install PySide6-Essentials pillow`; запуск `python murdilimax_crystal.py`. Автотесты: `python -m unittest discover -v`. Qt smoke-тест запускается через offscreen при наличии Qt.

## EN

**Crystal 0.10.1 is a real PySide6/Qt 6 desktop shell** for the existing read-only recovery engine. The Windows EXE bundles Qt/Python. RU/EN switch is available. Select a disk image, a visible folder or an explicit Windows physical disk (caution), choose metadata or limited signature scan, review real candidates, and recover selected results to a different physical device. Photo preview, local wallet filename finder, read-only disk imaging, experimental RAID image builder and local reports remain available. No fabricated scan data. Physical-drive safety and reliability on genuine failing media have not been field validated. Do not risk irreplaceable originals. No cloud upload or credential collection.


## Crystal 0.10.1 / Дополнения
- Preview existing photos in Folder mode (12 MiB bounded read, size and symlink checks). No secret-wallet file contents are read in this feature.
- RAID window includes read-only Linux MD 1.2 superblock inspection and optional safe extraction of data-only member slices to a NEW image. This is not automatic NAS assembly.
- Windows CI additionally checks installed Qt tests, a packaged EXE startup and a genuine empty-window screenshot, plus synthetic filesystem recovery tests.
- Experimental only; hardware-failing disks and vendor RAID performance are not field validated.
