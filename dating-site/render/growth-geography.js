// Curated canonical geography from the existing catalogue's GEOS keys.
// New cities use a dedicated namespace; existing landing URLs remain unchanged.
const data=[
 ['LV','Даугавпилс','lv','daugavpils','Daugavpilī'],['LV','Юрмала','lv','jurmala','Jūrmalā'],
 ['LV','Резекне','lv','rezekne','Rēzeknē'],['LV','Вентспилс','lv','ventspils','Ventspilī'],
 ['LV','Валмиера','lv','valmiera','Valmierā'],['LV','Огре','lv','ogre','Ogrē'],
 ['LV','Екабпилс','lv','jekabpils','Jēkabpilī'],['LV','Цесис','lv','cesis','Cēsīs'],
 ['LV','Сигулда','lv','sigulda','Siguldā'],['LV','Саласпилс','lv','salaspils','Salaspilī'],
 ['LV','Тукумс','lv','tukums','Tukumā'],['LV','Кулдига','lv','kuldiga','Kuldīgā'],['LV','Бауска','lv','bauska','Bauskā'],
 ['DE','Гамбург','de','hamburg','in Hamburg'],['DE','Мюнхен','de','munich','in München'],
 ['DE','Франкфурт','de','frankfurt','in Frankfurt'],['DE','Кёльн','de','cologne','in Köln'],
 ['NO','Осло','en','oslo','in Oslo'],['NO','Берген','en','bergen','in Bergen'],
 ['NO','Ставангер','en','stavanger','in Stavanger'],['NO','Тронхейм','en','trondheim','in Trondheim'],
 ['SE','Стокгольм','en','stockholm','in Stockholm'],['SE','Гётеборг','en','gothenburg','in Gothenburg'],['SE','Мальмё','en','malmo','in Malmö'],
 ['FI','Хельсинки','en','helsinki','in Helsinki'],['FI','Эспоо','en','espoo','in Espoo'],['FI','Тампере','en','tampere','in Tampere'],['FI','Турку','en','turku','in Turku'],
 ['PL','Краков','en','krakow','in Kraków'],['PL','Гданьск','en','gdansk','in Gdańsk'],['PL','Вроцлав','en','wroclaw','in Wrocław'],
 ['NL','Амстердам','en','amsterdam','in Amsterdam'],['NL','Роттердам','en','rotterdam','in Rotterdam'],['NL','Гаага','en','the-hague','in The Hague'],
 ['FR','Париж','en','paris','in Paris'],['FR','Лион','en','lyon','in Lyon'],['FR','Марсель','en','marseille','in Marseille'],['FR','Ницца','en','nice','in Nice'],
 ['ES','Мадрид','en','madrid','in Madrid'],['ES','Барселона','en','barcelona','in Barcelona'],['ES','Валенсия','en','valencia','in Valencia'],['ES','Малага','en','malaga','in Málaga'],
 ['IT','Рим','en','rome','in Rome'],['IT','Милан','en','milan','in Milan'],['IT','Флоренция','en','florence','in Florence'],['IT','Неаполь','en','naples','in Naples'],
 ['AT','Вена','de','vienna','in Wien'],['AT','Зальцбург','de','salzburg','in Salzburg'],['AT','Грац','de','graz','in Graz'],
 ['CZ','Прага','en','prague','in Prague'],['CZ','Брно','en','brno','in Brno'],['CZ','Острава','en','ostrava','in Ostrava'],
 ['GB','Лондон','en','london','in London'],['GB','Манчестер','en','manchester','in Manchester'],['GB','Бирмингем','en','birmingham','in Birmingham'],
 ['CH','Цюрих','de','zurich','in Zürich'],['CH','Женева','en','geneva','in Geneva'],['CH','Базель','de','basel','in Basel'],
 ['DK','Копенгаген','en','copenhagen','in Copenhagen'],['DK','Орхус','en','aarhus','in Aarhus'],['DK','Оденсе','en','odense','in Odense'],
 ['BE','Брюссель','en','brussels','in Brussels'],['BE','Антверпен','en','antwerp','in Antwerp'],['BE','Гент','en','ghent','in Ghent'],
 ['PT','Лиссабон','en','lisbon','in Lisbon'],['PT','Порту','en','porto','in Porto'],['PT','Фару','en','faro','in Faro'],
 ['IE','Дублин','en','dublin','in Dublin'],['IE','Корк','en','cork','in Cork']
];
export const newCities=data.map(([country,city,lang,slug,phrase])=>[country,city,lang,'/'+lang+'/cities/'+country.toLowerCase()+'/'+slug+'/',phrase]);
export const directoryWords={
 ru:['Знакомства по городам','Опубликованные анкеты','Выберите город с опубликованными анкетами. Каталог обновляется автоматически.','Пока нет достаточно наполненных подборок.','Знакомства','Смотреть анкеты','Все города','Бесплатное общение после входа, если владелец подключил сообщения.'],
 en:['Dating by city','Published profiles','Choose a city with published profiles. The directory updates automatically.','There are not enough published profiles for city collections yet.','Dating','Browse profiles','All cities','Messaging is free after sign-in when the profile owner has enabled it.'],
 de:['Dating nach Städten','Veröffentlichte Profile','Wähle eine Stadt mit veröffentlichten Profilen. Das Verzeichnis wird automatisch aktualisiert.','Noch nicht genügend veröffentlichte Profile für Stadtübersichten.','Dating','Profile ansehen','Alle Städte','Nachrichten sind nach der Anmeldung kostenlos, sofern der Profilinhaber sie aktiviert hat.'],
 lv:['Iepazīšanās pilsētās','Publicētie profili','Izvēlies pilsētu ar publicētiem profiliem. Katalogs tiek automātiski atjaunināts.','Pagaidām nav pietiekami daudz publicētu profilu pilsētu izlasēm.','Iepazīšanās','Skatīt profilus','Visas pilsētas','Ziņas pēc pieslēgšanās ir bez maksas, ja profila īpašnieks tās ir iespējojis.'],
 lt:['Pažintys pagal miestą','Paskelbtos anketos','Pasirinkite miestą su paskelbtomis anketomis. Katalogas atnaujinamas automatiškai.','Kol kas nepakanka paskelbtų anketų miestų rinkiniams.','Pažintys','Peržiūrėti anketas','Visi miestai','Prisijungus žinutės nemokamos, jei anketos savininkas jas įjungė.'],
 et:['Tutvused linnade kaupa','Avaldatud profiilid','Vali avaldatud profiilidega linn. Kataloog uueneb automaatselt.','Linnade kogumike jaoks pole veel piisavalt avaldatud profiile.','Tutvused','Vaata profiile','Kõik linnad','Sõnumid on pärast sisselogimist tasuta, kui profiili omanik on need lubanud.']
};
export const directoryPath=lang=>lang==='ru'?'/cities/':'/'+lang+'/cities/';
export const directoryLanguages=Object.keys(directoryWords);
// Lithuanian and Estonian home pages are currently marked beta; keep directory variants
// accessible, but do not add them to the indexed set until the existing locale policy changes.
export const indexedDirectoryLanguages=['ru','en','de','lv'];
