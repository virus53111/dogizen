export default {
  "id": "ssd-not-detected",
  "topic": "tech",
  "image": "https://images.unsplash.com/photo-1531492746076-161ca9bcad58?w=1200&q=85&auto=format&fit=crop",
  "minutes": 5,
  "updated": "2026-11-09",
  "sources": [
    {
      "label": "Microsoft Support — Disk Management in Windows",
      "url": "https://support.microsoft.com/en-us/windows/experience/storage-filemanagement/disk-management-in-windows"
    }
  ],
  "en": {
    "title": "New SSD not showing up in Windows? Check these first",
    "subtitle": "A careful troubleshooting order that avoids accidentally erasing an existing drive.",
    "sections": [
      [
        "Check the connection and firmware",
        "Power down before checking a SATA cable, power connector or M.2 installation. In BIOS/UEFI, confirm whether the drive is detected. For M.2 slots, verify the motherboard supports the drive's NVMe or SATA protocol; the same physical size does not guarantee compatibility."
      ],
      [
        "Look in Disk Management",
        "In Windows, press Win+R and run diskmgmt.msc. A brand-new drive may appear without a volume or drive letter. Existing drives may be Offline. Compare capacity and identification carefully before taking action; multiple drives can look similar."
      ],
      [
        "Only initialize a truly new, empty SSD",
        "If the drive is new and contains no files, initialization and creating a volume may make it available. Microsoft describes Disk Management and GPT for modern UEFI systems. Never initialize, delete a volume, or format a disk containing files you need: these actions can prevent normal access to the data."
      ],
      [
        "When to stop and seek help",
        "If the drive vanished after an error, makes repeated disconnect sounds, or previously held important files, stop writing to it. Try an alternative known-good cable or port if safe, and consider specialist recovery. A missing disk in UEFI is not fixed by simply assigning a drive letter in Windows."
      ]
    ]
  },
  "ru": {
    "title": "Windows не видит новый SSD: что проверить и что не нажимать",
    "subtitle": "Безопасная последовательность действий без риска случайно стереть важный диск.",
    "sections": [
      [
        "Подключение и BIOS",
        "Выключите компьютер перед проверкой кабелей SATA, питания или установки M.2. Посмотрите, определяется ли накопитель в BIOS/UEFI. Для M.2 обязательно проверьте, поддерживает ли слот именно NVMe или SATA: одинаковый разъём не гарантирует совместимость."
      ],
      [
        "Проверьте «Управление дисками»",
        "Нажмите Win+R, введите diskmgmt.msc. Совершенно новый SSD может отображаться без раздела или буквы; некоторые диски бывают переведены в Offline. Сверьте объём и модель: два накопителя легко перепутать."
      ],
      [
        "Инициализируйте только пустой новый диск",
        "Если накопитель действительно новый и на нём нет нужных файлов, инициализация и создание тома сделают его доступным. Для современных UEFI-систем обычно используется GPT. Никогда не форматируйте и не удаляйте разделы с важными данными просто потому, что Windows предлагает это сделать."
      ],
      [
        "Когда лучше остановиться",
        "Если SSD раньше работал, хранил важные данные или внезапно пропал, не записывайте на него ничего. Проверьте исправный кабель и порт; при необходимости обращайтесь за восстановлением данных. Присвоение буквы не поможет, если диск даже не определяется в UEFI."
      ]
    ]
  },
  "de": {
    "title": "Neue SSD wird in Windows nicht erkannt: sichere Prüfung",
    "subtitle": "So prüfst du Anschluss und Datenträgerverwaltung ohne Daten zu löschen.",
    "sections": [
      [
        "Verbindung und UEFI prüfen",
        "Schalte den PC aus, bevor du SATA-Kabel, Stromanschluss oder M.2-Sitz kontrollierst. Prüfe im UEFI, ob das Laufwerk erkannt wird. Nicht jeder M.2-Steckplatz unterstützt NVMe und SATA gleichermaßen."
      ],
      [
        "Datenträgerverwaltung öffnen",
        "Mit Win+R und diskmgmt.msc sieht man Laufwerke ohne Partition oder Buchstaben. Vergleiche Kapazität und Modell sorgfältig, bevor du eine Aktion ausführst."
      ],
      [
        "Nur leere neue Laufwerke initialisieren",
        "Ist die SSD wirklich neu und leer, können Initialisierung und ein neues Volume nötig sein. Formatiere niemals ein Laufwerk mit wichtigen Dateien."
      ],
      [
        "Bei Datenverlustgefahr stoppen",
        "War die SSD bereits in Benutzung und verschwand plötzlich, schreibe nichts mehr darauf. Ein anderes Kabel oder ein Fachbetrieb ist sicherer als blindes Formatieren."
      ]
    ]
  },
  "es": {
    "title": "Windows no detecta un SSD nuevo: guía segura",
    "subtitle": "Revisa conexiones y administración de discos sin borrar datos.",
    "sections": [
      [
        "Comprueba la conexión",
        "Apaga el equipo antes de revisar cables o la instalación M.2. Comprueba en UEFI si aparece la unidad; un conector M.2 no siempre acepta SATA y NVMe indistintamente."
      ],
      [
        "Abre Administración de discos",
        "Pulsa Win+R y ejecuta diskmgmt.msc. Un SSD nuevo puede aparecer sin volumen ni letra. Identifica bien el disco antes de hacer cambios."
      ],
      [
        "Inicializa solo un disco vacío",
        "Si es totalmente nuevo y no tiene datos, puedes inicializarlo y crear un volumen. Nunca formatees un disco que contenga archivos importantes."
      ],
      [
        "Cuándo detenerte",
        "Si la unidad funcionaba antes y ha desaparecido, evita escribir en ella. Comprueba puertos y cables; considera recuperación profesional si los archivos importan."
      ]
    ]
  },
  "fr": {
    "title": "SSD neuf invisible dans Windows : quoi vérifier ?",
    "subtitle": "Procédure prudente pour éviter d'effacer un disque existant.",
    "sections": [
      [
        "Contrôler le matériel",
        "Éteignez le PC avant de toucher aux câbles SATA ou au module M.2. Vérifiez la détection dans l’UEFI et la compatibilité SATA/NVMe du port."
      ],
      [
        "Ouvrir Gestion des disques",
        "Appuyez sur Win+R puis tapez diskmgmt.msc. Un disque neuf peut être sans volume ni lettre. Identifiez sa capacité avant toute action."
      ],
      [
        "Initialiser uniquement un disque vide",
        "Sur un SSD vraiment neuf, initialiser et créer un volume peut être nécessaire. Ne formatez jamais un disque contenant des fichiers importants."
      ],
      [
        "S’arrêter si les données comptent",
        "Si le disque fonctionnait auparavant puis a disparu, n’y écrivez plus. Vérifiez câble et port, puis envisagez une récupération spécialisée."
      ]
    ]
  },
  "lv": {
    "title": "Windows neredz jaunu SSD: droša pārbaude",
    "subtitle": "Noskaidro iemeslu, nejauši neizdzēšot svarīgu disku.",
    "sections": [
      [
        "Pārbaudi savienojumu",
        "Izslēdz datoru pirms SATA vadu vai M.2 moduļa pārbaudes. UEFI pārbaudi, vai disks tiek atrasts, un pārliecinies par NVMe vai SATA saderību."
      ],
      [
        "Atver disku pārvaldību",
        "Nospied Win+R un ievadi diskmgmt.msc. Jaunam diskam var nebūt nodalījuma vai burta. Pirms izmaiņām rūpīgi pārbaudi ietilpību."
      ],
      [
        "Inicializē tikai tukšu disku",
        "Pilnīgi jaunam un tukšam SSD var izveidot sējumu. Nekad neformatē disku ar vajadzīgiem failiem."
      ],
      [
        "Ja dati ir svarīgi",
        "Ja disks iepriekš darbojās un pēkšņi pazuda, neko tajā neraksti. Pārbaudi kabeli un portu, vajadzības gadījumā meklē profesionālu palīdzību."
      ]
    ]
  }
};
