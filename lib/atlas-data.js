import {atlasGuidesA} from './atlas-guides-additions-a.js';
import {atlasGuidesB} from './atlas-guides-additions-b.js';
import {atlasNativeGuides} from './atlas-native-guides.js';
import {expansionTopics} from './atlas-expansion-topics.js';
import {expansionArticlesA} from './expansion-articles-a.js';
import {expansionArticlesB} from './expansion-articles-b.js';
import {expansionArticlesC} from './expansion-articles-c.js';
import {expansionArticlesD} from './expansion-articles-d.js';
import {editorial2026} from './editorial-2026.js';
import {editorialUpgrades} from './article-enhancements.js';
import {editorialRound2} from './editorial-round2.js';
import {editorialRefresh2026} from './editorial-refresh-2026.js';
import {editorialRefreshNature2026} from './editorial-refresh-nature.js';
import {essentialGuidesDeEs} from './editorial-locales-de-es.js';
import {essentialGuidesFrLv} from './editorial-locales-fr-lv.js';
import {storageGuideFrLv} from './editorial-storage-fr-lv.js';
import {essentialSecurityItPtPl} from './editorial-security-it-pt-pl.js';
import {essentialBackupItPtPl} from './editorial-backup-it-pt-pl.js';
import {storageGuideItPtPl} from './editorial-storage-it-pt-pl.js';
import {accountSecurityLtEtNl} from './editorial-account-security-lt-et-nl.js';
import {safeBackupsLtEtNl} from './editorial-backups-lt-et-nl.js';
import {illustratedGuidesA} from './illustrated-guides-a.js';
import {illustratedGuidesB} from './illustrated-guides-b.js';
import {editorialArt2026} from './editorial-art-2026.js';
import {localizedWorldArticles} from './world-translations.js';
import {addedLanguages,addedNames,addedCopy} from './atlas-extra-locales.js';
import {balticAndDutchGuides} from './atlas-baltic-translations.js';
import {worldTopics} from './world-topics.js';
import {worldArticles} from './world-articles.js';
import {newLanguages,localeNames,localeCopy} from './atlas-locales.js';
import {originalTranslations,extraTopicLabels} from './atlas-original-translations.js';
import windows10 from './articles/windows-10-support-2026.js';
import ssdNotDetected from './articles/ssd-not-detected.js';
import windowsWontStart from './articles/windows-wont-start.js';
import spotPhishing from './articles/spot-phishing.js';
import freeStorage from './articles/free-up-windows-storage.js';
import bitlockerKey from './articles/bitlocker-recovery-key.js';
export const languages = ['en','ru','de','es','fr','lv'];
export const names = {en:'English',ru:'Русский',de:'Deutsch',es:'Español',fr:'Français',lv:'Latviešu'};
export const copy = {
 en:{tag:'THE CURIOUS WORLD, EXPLAINED',hero:'A little more clarity in a complicated world.',lead:'Beautifully simple guides, honest comparisons, and useful tools for the questions that matter in everyday life.',search:'What would you like to understand?',searchBtn:'Explore',browse:'Explore the library',latest:'THE EDIT',latestTitle:'Ideas worth understanding',latestSub:'Practical, researched-first answers. No endless scrolling.',categories:'EXPLORE BY INTEREST',categoriesTitle:'Follow your curiosity.',tools:'YOUR TOOLKIT',toolsTitle:'A little help, right when you need it.',toolsSub:'Simple tools that work instantly. No accounts. No noise.',featured:'FEATURED STORY',reading:'min read',read:'Read the guide',all:'All guides',about:'About',privacy:'Privacy',contact:'Contact',new:'NEW PERSPECTIVES',bottom:'Know more. Do more.',bottomText:'Answers worth keeping, tools worth sharing. Built for curious people everywhere.',rights:'Independent knowledge, made with care.',home:'Home',guides:'Guides',calculators:'Tools',faq:'Frequently asked questions',method:'Our promise',methodText:'We focus on practical accuracy, clear steps and useful context. We never generate thousands of duplicate articles just to rank.',results:'Search results',none:'No exact match. Try “computer”, “Wi-Fi”, or “password”.',back:'Back to all guides',next:'Keep exploring',topic:'Topic',toolPercent:'Percentage calculator',toolPercentDesc:'Quickly find any percentage of a number.',toolConvert:'Unit converter',toolConvertDesc:'Convert kilometers and miles in one click.',toolStorage:'Storage converter',toolStorageDesc:'Understand GB, MB and TB instantly.',calc:'Calculate',from:'From',to:'To',result:'Result',close:'Close',dark:'Toggle contrast',share:'Copy link',copied:'Link copied',disclaimer:'Information for general education. Check device specifications and manufacturer instructions before changing hardware.'},
 ru:{tag:'МИР СЛОЖНЫХ ВЕЩЕЙ — ПРОСТО',hero:'Сложный мир. Простые объяснения.',lead:'Красивые и понятные инструкции, честные сравнения и полезные инструменты для повседневных вопросов.',search:'Что хотите узнать?',searchBtn:'Найти',browse:'Открыть библиотеку',latest:'ГЛАВНОЕ',latestTitle:'То, в чём стоит разобраться',latestSub:'Практичные ответы по делу. Никакой воды.',categories:'ТЕМЫ',categoriesTitle:'Исследуйте то, что интересно.',tools:'ИНСТРУМЕНТЫ',toolsTitle:'Полезно именно тогда, когда нужно.',toolsSub:'Простые калькуляторы без регистрации.',featured:'ВЫБОР РЕДАКЦИИ',reading:'мин чтения',read:'Читать',all:'Все статьи',about:'О нас',privacy:'Конфиденциальность',contact:'Контакты',new:'НОВЫЙ ВЗГЛЯД',bottom:'Узнавайте больше. Делайте лучше.',bottomText:'Понятные ответы и полезные инструменты для людей по всему миру.',rights:'Независимый справочник, сделанный с вниманием.',home:'Главная',guides:'Статьи',calculators:'Инструменты',faq:'Частые вопросы',method:'Наш принцип',methodText:'Проверяем важные сведения, объясняем шаг за шагом и не штампуем тысячи одинаковых статей для поисковиков.',results:'Результаты поиска',none:'Ничего не найдено. Попробуйте «компьютер», «Wi-Fi» или «пароль».',back:'Все статьи',next:'Читайте также',topic:'Тема',toolPercent:'Калькулятор процентов',toolPercentDesc:'Найдите процент от любого числа.',toolConvert:'Конвертер расстояний',toolConvertDesc:'Километры и мили за секунду.',toolStorage:'Конвертер памяти',toolStorageDesc:'Быстрый пересчёт ГБ, МБ и ТБ.',calc:'Рассчитать',from:'Из',to:'В',result:'Результат',close:'Закрыть',dark:'Контраст',share:'Копировать ссылку',copied:'Ссылка скопирована',disclaimer:'Общая справочная информация. Перед изменением оборудования сверяйтесь с инструкцией производителя.'},
 de:{tag:'DIE WELT, EINFACH ERKLÄRT',hero:'Mehr Klarheit für eine komplexe Welt.',lead:'Verständliche Anleitungen, ehrliche Vergleiche und praktische Werkzeuge für Fragen des Alltags.',search:'Was möchtest du wissen?',searchBtn:'Entdecken',browse:'Bibliothek entdecken',latest:'DIE AUSWAHL',latestTitle:'Wissen, das sich lohnt',latestSub:'Praktische Antworten ohne Umwege.',categories:'THEMEN',categoriesTitle:'Folge deiner Neugier.',tools:'WERKZEUGE',toolsTitle:'Einfach hilfreich. Jederzeit.',toolsSub:'Nützliche Rechner ohne Anmeldung.',featured:'UNSER TIPP',reading:'Min. Lesezeit',read:'Artikel lesen',all:'Alle Artikel',about:'Über uns',privacy:'Datenschutz',contact:'Kontakt',new:'NEUE PERSPEKTIVEN',bottom:'Mehr wissen. Mehr bewegen.',bottomText:'Klare Antworten und praktische Werkzeuge für Neugierige weltweit.',rights:'Unabhängiges Wissen mit Sorgfalt erstellt.',home:'Start',guides:'Ratgeber',calculators:'Tools',faq:'Häufige Fragen',method:'Unser Anspruch',methodText:'Klare Schritte und hilfreicher Kontext statt massenhaft gleicher Suchmaschinenseiten.',results:'Suchergebnisse',none:'Keine Treffer. Suche nach „Computer“, „WLAN“ oder „Passwort“.',back:'Alle Ratgeber',next:'Weiterlesen',topic:'Thema',toolPercent:'Prozentrechner',toolPercentDesc:'Berechne einen Prozentsatz.',toolConvert:'Einheitenrechner',toolConvertDesc:'Kilometer und Meilen umrechnen.',toolStorage:'Speicherrechner',toolStorageDesc:'GB, MB und TB umrechnen.',calc:'Berechnen',from:'Von',to:'Nach',result:'Ergebnis',close:'Schließen',dark:'Kontrast',share:'Link kopieren',copied:'Link kopiert',disclaimer:'Allgemeine Information. Prüfe vor Hardwareänderungen die Herstellerangaben.'},
 es:{tag:'EL MUNDO, BIEN EXPLICADO',hero:'Más claridad para un mundo complejo.',lead:'Guías sencillas, comparaciones honestas y herramientas útiles para las preguntas de cada día.',search:'¿Qué quieres entender?',searchBtn:'Explorar',browse:'Explorar la biblioteca',latest:'LA SELECCIÓN',latestTitle:'Ideas que vale la pena entender',latestSub:'Respuestas prácticas, sin rodeos.',categories:'TEMAS',categoriesTitle:'Sigue tu curiosidad.',tools:'HERRAMIENTAS',toolsTitle:'Una pequeña ayuda, cuando la necesitas.',toolsSub:'Calculadoras rápidas sin registro.',featured:'DESTACADO',reading:'min de lectura',read:'Leer la guía',all:'Todas las guías',about:'Acerca de',privacy:'Privacidad',contact:'Contacto',new:'NUEVAS PERSPECTIVAS',bottom:'Comprende más. Haz más.',bottomText:'Respuestas claras y herramientas útiles para personas de todo el mundo.',rights:'Conocimiento independiente, hecho con cuidado.',home:'Inicio',guides:'Guías',calculators:'Herramientas',faq:'Preguntas frecuentes',method:'Nuestra promesa',methodText:'Priorizamos la precisión y los pasos claros, no miles de páginas repetidas.',results:'Resultados',none:'Sin resultados. Prueba “ordenador”, “Wi-Fi” o “contraseña”.',back:'Todas las guías',next:'Sigue explorando',topic:'Tema',toolPercent:'Calculadora de porcentajes',toolPercentDesc:'Calcula un porcentaje al instante.',toolConvert:'Conversor de distancia',toolConvertDesc:'Kilómetros y millas.',toolStorage:'Conversor de almacenamiento',toolStorageDesc:'GB, MB y TB al instante.',calc:'Calcular',from:'De',to:'A',result:'Resultado',close:'Cerrar',dark:'Contraste',share:'Copiar enlace',copied:'Enlace copiado',disclaimer:'Información general. Comprueba las especificaciones antes de modificar equipos.'},
 fr:{tag:'LE MONDE, PLUS CLAIR',hero:'Un peu de clarté dans un monde complexe.',lead:'Des guides simples, des comparaisons honnêtes et des outils pratiques pour les questions du quotidien.',search:'Que voulez-vous comprendre ?',searchBtn:'Explorer',browse:'Explorer la bibliothèque',latest:'LA SÉLECTION',latestTitle:'Des idées à comprendre',latestSub:'Des réponses pratiques, sans détour.',categories:'THÈMES',categoriesTitle:'Suivez votre curiosité.',tools:'OUTILS',toolsTitle:'Un petit coup de main au bon moment.',toolsSub:'Calculatrices utiles sans inscription.',featured:'À LA UNE',reading:'min de lecture',read:'Lire le guide',all:'Tous les guides',about:'À propos',privacy:'Confidentialité',contact:'Contact',new:'NOUVEAUX REGARDS',bottom:'Comprendre plus. Faire mieux.',bottomText:'Des réponses claires et des outils utiles pour tous.',rights:'Un savoir indépendant, fait avec soin.',home:'Accueil',guides:'Guides',calculators:'Outils',faq:'Questions fréquentes',method:'Notre engagement',methodText:'Nous privilégions des informations fiables et utiles, pas des milliers de pages répétitives.',results:'Résultats',none:'Aucun résultat. Essayez « ordinateur », « Wi-Fi » ou « mot de passe ».',back:'Tous les guides',next:'À découvrir',topic:'Sujet',toolPercent:'Calculateur de pourcentage',toolPercentDesc:'Calculez un pourcentage rapidement.',toolConvert:'Convertisseur de distance',toolConvertDesc:'Kilomètres et miles.',toolStorage:'Convertisseur de stockage',toolStorageDesc:'Go, Mo et To.',calc:'Calculer',from:'De',to:'À',result:'Résultat',close:'Fermer',dark:'Contraste',share:'Copier le lien',copied:'Lien copié',disclaimer:'Informations générales. Vérifiez les notices des fabricants avant toute modification.'},
 lv:{tag:'SAREŽĢĪTAS LIETAS — VIENKĀRŠI',hero:'Vairāk skaidrības sarežģītā pasaulē.',lead:'Vienkārši ceļveži, godīgi salīdzinājumi un noderīgi rīki ikdienas jautājumiem.',search:'Ko vēlies uzzināt?',searchBtn:'Meklēt',browse:'Atvērt ceļvežus',latest:'REDAKCIJAS IZLASE',latestTitle:'Idejas, kuras vērts izprast',latestSub:'Praktiskas atbildes bez liekvārdības.',categories:'TĒMAS',categoriesTitle:'Seko savai zinātkārei.',tools:'RĪKI',toolsTitle:'Maza palīdzība īstajā brīdī.',toolsSub:'Ērti kalkulatori bez reģistrācijas.',featured:'IZCELTAIS',reading:'min lasījums',read:'Lasīt ceļvedi',all:'Visi ceļveži',about:'Par mums',privacy:'Privātums',contact:'Kontakti',new:'JAUNS SKATĪJUMS',bottom:'Uzzini vairāk. Dari labāk.',bottomText:'Skaidras atbildes un noderīgi rīki zinātkārajiem visā pasaulē.',rights:'Neatkarīga zināšanu vietne, veidota ar rūpību.',home:'Sākums',guides:'Ceļveži',calculators:'Rīki',faq:'Biežākie jautājumi',method:'Mūsu pieeja',methodText:'Svarīga ir precizitāte, skaidri soļi un vērtīgs saturs, nevis tūkstošiem vienādu lapu.',results:'Meklēšanas rezultāti',none:'Nekas nav atrasts. Meklē “dators”, “Wi-Fi” vai “parole”.',back:'Visi ceļveži',next:'Lasīt tālāk',topic:'Tēma',toolPercent:'Procentu kalkulators',toolPercentDesc:'Aprēķini procentus ātri.',toolConvert:'Attāluma pārveidotājs',toolConvertDesc:'Kilometri un jūdzes.',toolStorage:'Atmiņas pārveidotājs',toolStorageDesc:'GB, MB un TB.',calc:'Aprēķināt',from:'No',to:'Uz',result:'Rezultāts',close:'Aizvērt',dark:'Kontrasts',share:'Kopēt saiti',copied:'Saite nokopēta',disclaimer:'Vispārīga informācija. Pirms ierīču pārveides pārbaudi ražotāja norādījumus.'}
};
export const topics=[
 {id:'tech',color:'mint',ico:'◈',en:'Technology',ru:'Технологии',de:'Technik',es:'Tecnología',fr:'Technologie',lv:'Tehnoloģijas'},
 {id:'digital',color:'peach',ico:'⌘',en:'Digital life',ru:'Цифровая жизнь',de:'Digitales Leben',es:'Vida digital',fr:'Vie numérique',lv:'Digitālā dzīve'},
 {id:'tools',color:'lavender',ico:'↗',en:'Useful tools',ru:'Инструменты',de:'Tools',es:'Herramientas',fr:'Outils',lv:'Rīki'}
];
export const stories=[
 {id:'ryzen-upgrade',topic:'tech',image:'https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200&q=85&auto=format&fit=crop',minutes:6,
 en:{title:'Upgrading an older Ryzen PC: what to check first',subtitle:'A smarter processor upgrade starts with the motherboard, not the shopping cart.',sections:[['Check the platform','Before ordering a processor, identify your motherboard model, socket and BIOS version. For example, many B450 boards can run Ryzen 5000 processors after a suitable firmware update, but support varies by exact board and firmware.'],['Plan the installation','Check CPU support on the manufacturer’s website, then confirm the cooler, thermal paste and power supply are suitable. Back up important files before changing firmware.'],['Spend where it matters','For a typical everyday PC, upgrading an older CPU and moving the operating system to an SSD often feels more useful than increasing already-sufficient RAM. Test temperatures after the change.']]},
 ru:{title:'Как обновить старый Ryzen: что проверить сначала',subtitle:'Хороший апгрейд начинается с материнской платы, а не с покупки процессора.',sections:[['Проверьте совместимость','Узнайте точную модель материнской платы, сокет и версию BIOS. Многие платы B450 поддерживают Ryzen 5000 после обновления прошивки, но всё зависит от модели.'],['Подготовьте замену','Проверьте список поддерживаемых процессоров на сайте производителя, подходящий кулер и блок питания. Перед обновлением BIOS сохраните важные данные.'],['Тратьте деньги с умом','Обновление старого процессора и переход на SSD обычно полезнее лишних гигабайт памяти, если её и так достаточно. После установки проверьте температуры.']]},
 de:{title:'Älteren Ryzen-PC aufrüsten: zuerst prüfen',subtitle:'Ein guter CPU-Wechsel beginnt beim Mainboard.',sections:[['Kompatibilität prüfen','Ermittle Mainboard-Modell, Sockel und BIOS-Version. Viele B450-Platinen unterstützen Ryzen 5000 erst mit passender Firmware.'],['Wechsel vorbereiten','Prüfe die CPU-Liste des Herstellers, Kühler und Netzteil. Sichere wichtige Daten vor einem BIOS-Update.'],['Sinnvoll investieren','Eine schnellere CPU oder SSD bringt oft mehr als zusätzlicher RAM, wenn der vorhandene Speicher genügt. Temperaturen danach testen.']]},
 es:{title:'Actualizar un Ryzen antiguo: qué revisar primero',subtitle:'Una buena mejora empieza por la placa base.',sections:[['Comprueba la compatibilidad','Identifica el modelo de placa base, el zócalo y la versión de BIOS. Muchas B450 admiten Ryzen 5000 con el firmware adecuado.'],['Prepara el cambio','Consulta la lista oficial de CPU, revisa refrigeración y fuente de alimentación. Haz una copia antes de actualizar BIOS.'],['Gasta donde importa','Una CPU mejor o un SSD suelen aportar más que añadir RAM innecesaria. Comprueba las temperaturas después.']]},
 fr:{title:'Améliorer un ancien Ryzen : les vérifications essentielles',subtitle:'Une bonne mise à niveau commence par la carte mère.',sections:[['Vérifier la compatibilité','Identifiez la carte mère, le socket et la version du BIOS. De nombreuses B450 acceptent Ryzen 5000 après une mise à jour adaptée.'],['Préparer le remplacement','Consultez la liste de compatibilité officielle, le refroidissement et l’alimentation. Sauvegardez vos données avant le BIOS.'],['Investir utilement','Un meilleur processeur ou un SSD est souvent plus bénéfique que de la RAM supplémentaire inutile. Testez les températures.']]},
 lv:{title:'Vecāka Ryzen datora uzlabošana: ko pārbaudīt',subtitle:'Labs procesora jauninājums sākas ar mātesplati.',sections:[['Saderība','Noskaidro mātesplates modeli, ligzdu un BIOS versiju. Daudzas B450 plates atbalsta Ryzen 5000 pēc atbilstoša atjauninājuma.'],['Sagatavošanās','Pārbaudi ražotāja CPU sarakstu, dzesētāju un barošanu. Pirms BIOS maiņas izveido datu kopiju.'],['Gudrs ieguldījums','Ja RAM pietiek, ātrāks procesors vai SSD nereti dod lielāku ieguvumu. Pārbaudi temperatūras.']]}
 },
 {id:'wifi-speed',topic:'digital',image:'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=1200&q=85&auto=format&fit=crop',minutes:4,
 en:{title:'Why is your Wi-Fi slow? A practical checklist',subtitle:'Small checks that can save you from buying the wrong router.',sections:[['Find the bottleneck','Compare a wired test with Wi-Fi from the same room. If Ethernet is fast and wireless is slow, investigate signal strength and interference first.'],['Improve the signal','Move the router to an open, central location. Keep it away from thick walls and crowded electronics. 5 GHz can be faster nearby; 2.4 GHz often reaches farther.'],['Check your devices','Restart the router, install trusted firmware updates and test a second phone or laptop. If only one device is slow, the issue may be local.']]},
 ru:{title:'Почему тормозит Wi-Fi: понятный чек-лист',subtitle:'Что проверить, прежде чем покупать новый роутер.',sections:[['Найдите причину','Сравните скорость по кабелю и Wi-Fi в одной комнате. Если кабель быстрый, проверьте качество сигнала и помехи.'],['Улучшите сигнал','Поставьте роутер ближе к центру квартиры. Диапазон 5 ГГц часто быстрее рядом с роутером, а 2,4 ГГц лучше проходит через стены.'],['Проверьте устройства','Перезагрузите роутер, установите официальные обновления и протестируйте второй телефон. Если проблема только на одном устройстве, дело может быть в нём.']]},
 de:{title:'Warum ist das WLAN langsam?',subtitle:'Erst messen, dann einen neuen Router kaufen.',sections:[['Engpass finden','Vergleiche LAN und WLAN im selben Raum. Ist LAN schnell, prüfe Funksignal und Störungen.'],['Signal verbessern','Stelle den Router zentral und frei auf. 5 GHz ist in der Nähe oft schneller, 2,4 GHz reicht weiter.'],['Geräte prüfen','Starte den Router neu, aktualisiere offizielle Firmware und teste ein zweites Gerät.']]},
 es:{title:'¿Por qué va lento el Wi-Fi?',subtitle:'Comprueba lo básico antes de comprar otro router.',sections:[['Localiza el problema','Compara una prueba por cable y otra por Wi-Fi en la misma habitación.'],['Mejora la señal','Coloca el router en un lugar central. 5 GHz suele ir más rápido cerca; 2,4 GHz llega más lejos.'],['Revisa los dispositivos','Reinicia el router, instala firmware oficial y prueba otro dispositivo.']]},
 fr:{title:'Pourquoi votre Wi-Fi est-il lent ?',subtitle:'Les bons réflexes avant de changer de routeur.',sections:[['Trouver la cause','Comparez une connexion Ethernet et le Wi-Fi dans la même pièce.'],['Améliorer le signal','Placez le routeur au centre, à découvert. Le 5 GHz est souvent plus rapide de près, le 2,4 GHz porte plus loin.'],['Tester les appareils','Redémarrez le routeur, vérifiez les mises à jour officielles et testez un second appareil.']]},
 lv:{title:'Kāpēc Wi-Fi ir lēns?',subtitle:'Pārbaudi vienkāršas lietas pirms jauna maršrutētāja iegādes.',sections:[['Atrodi iemeslu','Salīdzini interneta ātrumu ar kabeli un Wi-Fi vienā telpā.'],['Uzlabo signālu','Novieto maršrutētāju centrā. 5 GHz bieži ir ātrāks tuvumā, 2,4 GHz sniedzas tālāk.'],['Pārbaudi ierīces','Pārstartē maršrutētāju, atjaunini programmatūru un izmēģini citu ierīci.']]}
 },
 {id:'ddr4-ddr5',topic:'tech',image:'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=1200&q=85&auto=format&fit=crop',minutes:5,
 en:{title:'DDR4 vs DDR5: can you mix them?',subtitle:'Understand memory slots, compatibility and realistic upgrades.',sections:[['Different physical standards','DDR4 and DDR5 modules use different electrical specifications and notch positions. A motherboard designed for DDR4 cannot accept DDR5 memory.'],['Check the whole platform','A move to DDR5 usually means a compatible motherboard and processor, not just new RAM. Check whether your CPU generation supports the memory type.'],['Capacity versus speed','For everyday work, sufficient capacity matters more than the highest advertised speed. Mixing kits can reduce stability or frequency.']]},
 ru:{title:'DDR4 и DDR5: можно ли их смешивать?',subtitle:'Разбираемся в слотах, совместимости и реальной пользе.',sections:[['Разные стандарты','У DDR4 и DDR5 отличаются электрические характеристики и расположение выреза. DDR5 нельзя установить в плату только для DDR4.'],['Проверьте платформу','Переход на DDR5 обычно требует совместимых материнской платы и процессора. Одной замены памяти недостаточно.'],['Объём и скорость','Для обычных задач важно иметь достаточный объём. Смешивание разных комплектов может ухудшить стабильность или частоту.']]},
 de:{title:'DDR4 oder DDR5: kann man sie mischen?',subtitle:'Speicherstandards und sinnvolle Upgrades.',sections:[['Unterschiedliche Standards','DDR4 und DDR5 haben andere Kerben und elektrische Anforderungen. Sie sind nicht austauschbar.'],['Plattform prüfen','Für DDR5 braucht man meist ein kompatibles Mainboard und einen passenden Prozessor.'],['Kapazität vor Takt','Ausreichender RAM ist wichtiger als Rekordtakt. Gemischte Kits können instabil sein.']]},
 es:{title:'DDR4 frente a DDR5: ¿se pueden mezclar?',subtitle:'Compatibilidad de memoria explicada.',sections:[['Estándares diferentes','DDR4 y DDR5 tienen conexiones y requisitos eléctricos distintos. No se pueden intercambiar.'],['Revisa la plataforma','Para usar DDR5 normalmente necesitas placa base y procesador compatibles.'],['Capacidad y velocidad','Tener suficiente memoria suele importar más que la frecuencia máxima. Mezclar kits puede causar inestabilidad.']]},
 fr:{title:'DDR4 ou DDR5 : peut-on les mélanger ?',subtitle:'Comprendre la compatibilité de la mémoire.',sections:[['Normes différentes','DDR4 et DDR5 n’ont pas les mêmes caractéristiques ni l’encoche au même endroit.'],['Vérifier la plateforme','Passer à DDR5 nécessite généralement une carte mère et un processeur compatibles.'],['Capacité ou vitesse','Une quantité suffisante compte davantage qu’une fréquence extrême. Mélanger des kits peut nuire à la stabilité.']]},
 lv:{title:'DDR4 vai DDR5: vai var kombinēt?',subtitle:'Atmiņas saderība vienkāršiem vārdiem.',sections:[['Atšķirīgi standarti','DDR4 un DDR5 ir atšķirīgi kontakti un elektriskās prasības. Tos nevar savstarpēji aizvietot.'],['Pārbaudi platformu','DDR5 parasti vajag saderīgu mātesplati un procesoru.'],['Apjoms un ātrums','Pietiekams atmiņas apjoms bieži ir svarīgāks par maksimālo frekvenci. Dažādi komplekti var būt nestabili.']]}
 },
 {id:'backup-321',topic:'digital',image:'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=1200&q=85&auto=format&fit=crop',minutes:5,
 en:{title:'The 3-2-1 backup rule, explained simply',subtitle:'One small habit that protects your photos, projects and documents.',sections:[['Three copies','Keep the working file plus two backups. A single external drive is not a complete backup strategy.'],['Two types of storage','Use different storage media or systems, such as your computer and an external disk. That reduces single-point failures.'],['One copy elsewhere','Keep one backup away from the main device, such as encrypted cloud storage or an off-site drive. Test restoration occasionally.']]},
 ru:{title:'Правило резервных копий 3-2-1 — просто',subtitle:'Как не потерять фотографии, проекты и документы.',sections:[['Три копии','Сохраняйте рабочий файл и две резервные копии. Один внешний диск — недостаточная защита.'],['Два типа хранения','Используйте разные носители или системы, например компьютер и внешний накопитель.'],['Одна копия отдельно','Держите одну копию вне основного устройства: в защищённом облаке или другом месте. Иногда проверяйте восстановление.']]},
 de:{title:'Die 3-2-1-Backup-Regel einfach erklärt',subtitle:'Schütze Fotos und wichtige Dateien.',sections:[['Drei Kopien','Bewahre die Arbeitsdatei plus zwei Sicherungen auf.'],['Zwei Speichermedien','Nutze unterschiedliche Medien oder Systeme, etwa PC und externe Festplatte.'],['Eine Kopie extern','Lagere eine Sicherung an einem anderen Ort oder verschlüsselt in der Cloud. Teste die Wiederherstellung.']]},
 es:{title:'La regla 3-2-1 para copias de seguridad',subtitle:'Protege tus fotos y documentos.',sections:[['Tres copias','Guarda el archivo principal y dos copias de seguridad.'],['Dos tipos de soporte','Combina distintos medios, como ordenador y disco externo.'],['Una copia fuera','Mantén una copia en otro lugar o cifrada en la nube. Comprueba que puedes restaurarla.']]},
 fr:{title:'La règle de sauvegarde 3-2-1',subtitle:'Protéger simplement photos et documents.',sections:[['Trois copies','Gardez le fichier original et deux sauvegardes.'],['Deux supports','Utilisez des types de stockage différents : ordinateur et disque externe.'],['Une copie ailleurs','Stockez une sauvegarde hors site ou dans un cloud chiffré. Testez sa restauration.']]},
 lv:{title:'Datu rezerves kopiju 3-2-1 princips',subtitle:'Pasargā fotoattēlus un dokumentus.',sections:[['Trīs kopijas','Glabā darba failu un vēl divas kopijas.'],['Divi datu nesēji','Izmanto dažādas ierīces, piemēram, datoru un ārējo disku.'],['Viena kopija citur','Glabā kopiju citā vietā vai šifrētā mākonī. Pārbaudi atjaunošanu.']]}
 },
 {id:'secure-accounts',topic:'digital',image:'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=1200&q=85&auto=format&fit=crop',minutes:4,
 en:{title:'How to secure your online accounts in 15 minutes',subtitle:'Practical steps with the biggest security payoff.',sections:[['Start with your email','Your email account can reset many other passwords. Protect it with a unique passphrase and multifactor authentication.'],['Use a password manager','Give every service a different strong password. A trusted password manager reduces the temptation to reuse credentials.'],['Review access','Remove unknown sessions and old third-party app access. Save recovery codes in a safe place away from your phone.']]},
 ru:{title:'Как защитить аккаунты за 15 минут',subtitle:'Три шага, которые реально повышают безопасность.',sections:[['Начните с почты','Через почту можно восстановить доступ к другим сервисам. Используйте уникальный пароль и двухфакторную защиту.'],['Менеджер паролей','Для каждого сервиса нужен отдельный сложный пароль. Надёжный менеджер помогает их хранить.'],['Проверьте входы','Завершите незнакомые сеансы, удалите старые разрешения сторонним приложениям и сохраните резервные коды.']]},
 de:{title:'Online-Konten in 15 Minuten besser schützen',subtitle:'Drei Schritte mit großer Wirkung.',sections:[['E-Mail zuerst','Schütze dein E-Mail-Konto mit eigenem Passwort und Mehrfaktor-Authentifizierung.'],['Passwortmanager','Nutze für jeden Dienst ein starkes, einzigartiges Passwort.'],['Zugriffe prüfen','Melde unbekannte Sitzungen ab und widerrufe alte App-Berechtigungen.']]},
 es:{title:'Protege tus cuentas en 15 minutos',subtitle:'Tres pasos sencillos de gran impacto.',sections:[['Primero el correo','Protege tu email con contraseña única y autenticación multifactor.'],['Gestor de contraseñas','Usa una contraseña distinta y robusta en cada servicio.'],['Revisa accesos','Cierra sesiones desconocidas y elimina permisos antiguos.']]},
 fr:{title:'Sécuriser ses comptes en 15 minutes',subtitle:'Trois gestes vraiment utiles.',sections:[['Protéger l’e-mail','Utilisez un mot de passe unique et l’authentification multifacteur.'],['Gestionnaire de mots de passe','Choisissez un mot de passe différent pour chaque service.'],['Vérifier les accès','Fermez les sessions inconnues et révoquez les anciennes autorisations.']]},
 lv:{title:'Drošāki konti 15 minūtēs',subtitle:'Trīs vienkārši, svarīgi soļi.',sections:[['Sāc ar e-pastu','Aizsargā e-pastu ar unikālu paroli un daudzfaktoru autentifikāciju.'],['Paroļu pārvaldnieks','Katrā pakalpojumā izmanto atšķirīgu spēcīgu paroli.'],['Pārbaudi piekļuves','Izraksties no nepazīstamām sesijām un atcel vecas lietotņu atļaujas.']]}
 },
 {id:'ssd-vs-hdd',topic:'tech',image:'https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=1200&q=85&auto=format&fit=crop',minutes:5,
 en:{title:'SSD vs HDD: where does the speed difference matter?',subtitle:'A straightforward storage upgrade guide.',sections:[['Everyday responsiveness','An SSD typically makes booting the operating system, launching applications and loading files faster than a mechanical hard drive.'],['Choose the right connection','SATA SSDs and NVMe SSDs use different interfaces; check what your motherboard supports before buying.'],['Keep a backup','Storage upgrades do not replace backup. Move files carefully, verify the copy and keep important data in two places.']]},
 ru:{title:'SSD или HDD: в чём разница на практике?',subtitle:'Простой разбор апгрейда накопителя.',sections:[['Скорость каждый день','SSD обычно ускоряет загрузку Windows, запуск программ и открытие файлов по сравнению с HDD.'],['Правильный интерфейс','SATA и NVMe используют разные подключения. Перед покупкой проверьте поддержку материнской платы.'],['Не забудьте копии','Новый диск не заменяет резервное копирование. После переноса проверьте файлы и сохраните важные данные отдельно.']]},
 de:{title:'SSD oder HDD: wo merkt man den Unterschied?',subtitle:'Einfacher Ratgeber für schnellere Speicherung.',sections:[['Mehr Tempo im Alltag','Eine SSD beschleunigt üblicherweise Systemstart und Programmöffnungen.'],['Anschluss prüfen','SATA und NVMe nutzen unterschiedliche Schnittstellen. Prüfe das Mainboard.'],['Backup nicht vergessen','Nach dem Umzug Dateien prüfen und Daten an einem zweiten Ort sichern.']]},
 es:{title:'SSD o HDD: ¿dónde se nota la diferencia?',subtitle:'Guía sencilla para mejorar el almacenamiento.',sections:[['Rapidez diaria','Un SSD suele acelerar el arranque y la apertura de aplicaciones.'],['Comprueba la conexión','SATA y NVMe usan interfaces distintas. Revisa tu placa base.'],['No olvides la copia','Comprueba tus archivos tras migrarlos y guarda una copia independiente.']]},
 fr:{title:'SSD ou HDD : où voit-on la différence ?',subtitle:'Le guide simple pour accélérer le stockage.',sections:[['Au quotidien','Un SSD accélère généralement le démarrage et l’ouverture des logiciels.'],['Vérifier la connexion','SATA et NVMe utilisent des interfaces différentes. Vérifiez la carte mère.'],['Sauvegarder','Contrôlez les fichiers transférés et conservez une copie indépendante.']]},
 lv:{title:'SSD vai HDD: kur jūtama atšķirība?',subtitle:'Vienkāršs ceļvedis datu glabāšanai.',sections:[['Ikdienas ātrums','SSD parasti paātrina sistēmas un programmu palaišanu.'],['Pārbaudi savienojumu','SATA un NVMe ir atšķirīgas saskarnes. Pārbaudi mātesplati.'],['Rezerves kopijas','Pēc failu pārcelšanas pārbaudi tos un glabā svarīgo arī citur.']]}
 }
];
export const story = id => stories.find(s=>s.id===id);
export const tr = (item,lang)=> item[lang] || item.en;
// Locale coverage is explicit: untranslated articles are never generated as fake translations.
languages.push(...newLanguages);
Object.assign(names,localeNames);
Object.assign(copy,localeCopy);
for(const topic of topics){for(const lang of newLanguages){if(extraTopicLabels[lang]?.[topic.id]) topic[lang]=extraTopicLabels[lang][topic.id];}}
for(const s of stories)if(originalTranslations[s.id]) Object.assign(s,originalTranslations[s.id]);
stories.push(windows10,ssdNotDetected,windowsWontStart,spotPhishing,freeStorage,bitlockerKey);
export const availableIn=(s,lang)=>Boolean(s&&s[lang]&&s[lang].title&&Array.isArray(s[lang].sections)&&s[lang].sections.length>0);
export const storiesFor=(lang)=>stories.filter(s=>availableIn(s,lang));

// New locales and curated encyclopedia sections.
languages.push(...addedLanguages);
Object.assign(names,addedNames);
Object.assign(copy,addedCopy);
const oldTopicTranslations={tech:{lt:'Technologijos',et:'Tehnoloogia',nl:'Technologie'},digital:{lt:'Skaitmeninis gyvenimas',et:'Digielu',nl:'Digitaal leven'},tools:{lt:'Įrankiai',et:'Tööriistad',nl:'Hulpmiddelen'}};
for(const t of topics)Object.assign(t,oldTopicTranslations[t.id]||{});
for(const s of stories)if(balticAndDutchGuides[s.id])Object.assign(s,balticAndDutchGuides[s.id]);
for(const t of worldTopics)topics.push({id:t.id,ico:'✳',color:'mint',image:t.image,...t.names});
for(const a of worldArticles)if(localizedWorldArticles[a.id])Object.assign(a,localizedWorldArticles[a.id]);
for(const a of worldArticles)if(atlasNativeGuides[a.id])Object.assign(a,atlasNativeGuides[a.id]);
stories.push(...worldArticles,...editorial2026);
for(const t of expansionTopics)topics.push({id:t.id,ico:'✳',color:'mint',image:t.image,...t.names});
stories.push(...expansionArticlesA,...expansionArticlesB,...expansionArticlesC,...expansionArticlesD);
stories.push(...atlasGuidesA,...atlasGuidesB);
for(const [id,upgrade] of Object.entries(editorialUpgrades)){
 const existing=stories.find(s=>s.id===id);
 if(!existing)throw new Error('Editorial upgrade target missing: '+id);
 Object.assign(existing,upgrade);
}



for(const [id,upgrade] of Object.entries(editorialRound2)){
 const existing=stories.find(s=>s.id===id);
 if(!existing)throw new Error('Round two article missing: '+id);
 Object.assign(existing,upgrade);
}

for(const [id,upgrade] of Object.entries({...editorialRefresh2026,...editorialRefreshNature2026})){
 const existing=stories.find(s=>s.id===id);
 if(!existing)throw new Error('Editorial refresh target missing: '+id);
 // Keep prior supporting links when adding freshly checked official sources.
 const sources=[...(existing.sources||[]),...(upgrade.sources||[])];
 const {updated:localeRevision,...revisedContent}=upgrade;
 Object.assign(existing,revisedContent);
 existing.localeUpdated={...(existing.localeUpdated||{}),en:localeRevision,ru:localeRevision};
 existing.sources=[...new Map(sources.map(s=>[s.url,s])).values()];
}

for(const [id,translation] of Object.entries(essentialGuidesDeEs)){
 const s=stories.find(entry=>entry.id===id);
 if(!s)throw new Error('Missing localized guide target: '+id);
 for(const locale of ['de','es']){
  if(!availableIn(s,locale))throw new Error('This update must revise an existing translated page: '+id+'/'+locale);
  if(!translation[locale]||translation[locale].sections.length!==5)throw new Error('Incomplete translation: '+id+'/'+locale);
  s[locale]=translation[locale];
  s.localeUpdated={...(s.localeUpdated||{}),[locale]:'2026-11-09'};
 }
 if(translation.sources?.length){
  s.localeSources??={};
  // Only surface the language's own official reference, never its counterpart's.
  s.localeSources.de=[...(s.localeSources.de||[]),...translation.sources.filter(x=>x.label.includes('(DE)'))];
  s.localeSources.es=[...(s.localeSources.es||[]),...translation.sources.filter(x=>x.label.includes('(ES)'))];
 }
}

for(const [id,revision] of Object.entries({...essentialGuidesFrLv,...storageGuideFrLv})){
 const s=stories.find(story=>story.id===id);
 if(!s)throw new Error('Missing existing story for French/Latvian refresh: '+id);
 for(const lang of ['fr','lv']){
  if(!availableIn(s,lang))throw new Error('Cannot revise a missing '+lang+' edition of '+id);
  const body=revision[lang];
  if(!body||body.sections.length!==5)throw new Error('Incomplete '+lang+' translation for '+id);
  s[lang]=body;
  s.localeUpdated={...(s.localeUpdated||{}),[lang]:'2026-11-09'};
  const refs=revision.localeSources?.[lang]||[];
  if(refs.length){
   s.localeSources??={};
   s.localeSources[lang]=[...new Map([...(s.localeSources[lang]||[]),...refs].map(ref=>[ref.url,ref])).values()];
  }
 }
}

for(const [id,revision] of Object.entries({...essentialSecurityItPtPl,...essentialBackupItPtPl,...storageGuideItPtPl})){
 const article=stories.find(s=>s.id===id);
 if(!article)throw new Error('Missing existing article: '+id);
 for(const lang of ['it','pt','pl']){
  if(!availableIn(article,lang))throw new Error('Not an existing locale: '+id+'/'+lang);
  if(!revision[lang]||revision[lang].sections?.length!==5)throw new Error('Incomplete reviewed edition: '+id+'/'+lang);
  article[lang]=revision[lang];
  article.localeUpdated={...(article.localeUpdated||{}),[lang]:'2026-11-09'};
  const references=revision.localeSources?.[lang]||[];
  if(references.length){
   article.localeSources??={};
   article.localeSources[lang]=[...new Map([...(article.localeSources[lang]||[]),...references].map(source=>[source.url,source])).values()];
  }
 }
}

for(const [id,revision] of Object.entries({...accountSecurityLtEtNl,...safeBackupsLtEtNl})){
 const article=stories.find(s=>s.id===id);
 if(!article)throw new Error('Missing existing article: '+id);
 for(const lang of ['lt','et','nl']){
  if(!availableIn(article,lang))throw new Error('Not an existing locale: '+id+'/'+lang);
  if(!revision[lang]||revision[lang].sections?.length!==5)throw new Error('Incomplete reviewed edition: '+id+'/'+lang);
  article[lang]=revision[lang];
  article.localeUpdated={...(article.localeUpdated||{}),[lang]:'2026-11-09'};
  const references=revision.localeSources?.[lang]||[];
  if(references.length){
   article.localeSources??={};
   article.localeSources[lang]=[...new Map([...(article.localeSources[lang]||[]),...references].map(source=>[source.url,source])).values()];
  }
 }
}

for(const article of [...illustratedGuidesA,...illustratedGuidesB]){
 if(stories.some(s=>s.id===article.id))throw new Error('Duplicate illustrated guide: '+article.id);
 if(!topics.some(t=>t.id===article.topic))throw new Error('Unknown category: '+article.topic);
 if(!editorialArt2026[article.id])throw new Error('A new article cannot publish without original illustration: '+article.id);
 stories.push({...article,image:'/media/'+article.id+'.svg',mediaAlt:editorialArt2026[article.id].alt});
}
