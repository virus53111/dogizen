# MURDILIMAX Recovery Crystal 0.10.2 — RU / EN

## Русский

**Экспериментальная программа для Windows 10/11 x64.** Установщик содержит Python и Qt — вручную устанавливать ничего не требуется. Выберите образ диска / папку / физический HDD/USB и выполните сканирование в режиме чтения. Сохраняйте восстановленные файлы на **другой физический диск**. Используйте только собственные носители или разрешённые данные.

### Что нового

- Новые кнопки **«Сохранить сессию»** и **«Открыть сессию»** в таблице результатов.
- Сессия содержит только сводку: имена, пути, размеры и состояния найденных файлов, исходный носитель и число результатов. **Никакие байты файлов, фрагменты разделов, приватные ключи или seed-фразы не сохраняются.** Имена и пути могут быть конфиденциальными.
- Импортированная сессия доступна **только для просмотра и поиска по списку**. Для восстановления или предпросмотра нужно заново выбрать исходный носитель и сканировать его. Это защита от устаревших или поддельных результатов.
- При выборе другого источника старые результаты и отметки сбрасываются. Сессия ограничена 12 000 видимыми результатами (общее число сохраняется). JSON проверяется по схеме и размеру; существующие файлы не перезаписываются.

**Сессия не является образом диска, контрольной точкой чтения или резервной копией.** Она не возобновляет сканирование и не гарантирует наличие файлов. Прямое чтение неисправных HDD, RAID и NAS не прошло независимых полевых испытаний. Не используйте эту экспериментальную программу как единственный способ спасти незаменимые данные; при признаках аппаратной неисправности обратитесь в лабораторию. Превосходство над R-Studio и DMDE не доказано.

## English

**Experimental Windows 10/11 x64 recovery tool.** Installer bundles Python and Qt. Read original sources only, and restore to a **different physical drive**. Use on authorized media only.

- **Save session** / **Open session** in the scan results. Saved sessions contain only local metadata (names, paths, sizes, states, source label and result count). No recovered bytes, file extents, wallet secrets or disk sectors are included.
- **Imported sessions are VIEW ONLY** — select and rescan the original source to preview or recover files. Switching source clears old results and selections.
- Imports validate JSON schema and size; saving never overwrites a file. Up to 12,000 visible entries are saved with full result count noted. Session files may disclose sensitive filenames and paths — keep them private.
- Sessions are **not** disk images, acquisition checkpoints, or evidence that deleted bytes remain intact.

Existing local recovery and RAID functions remain experimental; performance on real failing drives is not field-validated. This Windows installer is unsigned and SmartScreen may warn.
