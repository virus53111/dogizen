// Editorial examples have no member account, contact details or listing URL.
const exampleLanguage = document.documentElement.lang;
const exampleRows = [
  ['mara','Māra',36,'LV','Рига','Центр','women-serious','LV · EN',true,
    'В субботу беру кофе на рынке и иду пешком вдоль Даугавы. Люблю прогулки без расписания.','On Saturdays I pick up coffee at the market and walk along the Daugava. I like leaving the route open.','Samstags hole ich Kaffee auf dem Markt und spaziere an der Daugava entlang. Am liebsten ohne festen Plan.','Sestdienās tirgū paņemu kafiju un dodos pastaigā gar Daugavu. Maršrutu izvēlos pa ceļam.'],
  ['jonas','Jonas',41,'DE','Берлин','Кройцберг','men-women','DE · EN',true,
    'На блошиных рынках ищу старые пластинки. Могу целый вечер спорить о лучшей стороне альбома.','I hunt for vinyl at flea markets and can spend an evening debating the best side of an album.','Auf Flohmärkten suche ich nach Schallplatten. Über die beste Seite eines Albums kann ich einen ganzen Abend reden.','Krāmu tirgos meklēju vinila plates. Par albuma labāko pusi varu diskutēt visu vakaru.'],
  ['elina','Elīna',32,'LV','Юрмала','Майори','women-men','LV · RU',false,
    'Хожу к морю даже в дождь. После прогулки пеку яблочный пирог с корицей.','I go to the sea even in the rain. Afterwards I bake apple cake with cinnamon.','Auch bei Regen gehe ich ans Meer. Danach backe ich Apfelkuchen mit Zimt.','Pie jūras eju arī lietū. Pēc pastaigas cepu ābolu kūku ar kanēli.'],
  ['noah','Noah',38,'DE','Гамбург','Альтона','men-serious','DE · EN',false,
    'Рисую порт в маленьком блокноте. Ищу компанию на воскресный завтрак.','I sketch the harbour in a pocket notebook. Sunday breakfast tastes better with company.','Den Hafen skizziere ich in einem kleinen Notizbuch. Zum Sonntagsfrühstück hätte ich gern Gesellschaft.','Mazā piezīmju grāmatā skicēju ostu. Svētdienu brokastis labprāt baudītu kompānijā.'],
  ['ines','Inés',39,'DE','Берлин','Митте','women-women','DE · ES',true,
    'Выбираю выставки по афишам и люблю обсуждать их потом на лавочке в парке.','I pick exhibitions by their posters and like talking them over on a park bench afterwards.','Ich suche Ausstellungen nach ihren Plakaten aus und rede danach gern auf einer Parkbank darüber.','Izstādes izvēlos pēc afišām. Pēc tam patīk tās apspriest uz soliņa parkā.'],
  ['leo','Leo',34,'LV','Рига','Старый город','men-men','LV · EN',true,
    'Собираю подержанные детективы и записываю на полях свои версии развязки.','I collect second-hand mysteries and jot my guesses in the margins.','Ich sammle gebrauchte Krimis und notiere meine Vermutungen am Seitenrand.','Krāju lietotus detektīvromānus un lappušu malās pierakstu savas versijas par atrisinājumu.'],
  ['anna','Anna',44,'EE','Таллин','Кесклинн','women-serious','ET · EN',false,
    'Люблю камерные концерты. Сохраняю билеты и подписываю, какая песня запомнилась.','I love small gigs. I keep the tickets and write down the song I remember best.','Ich mag kleine Konzerte. Auf die Eintrittskarte schreibe ich danach mein Lieblingslied.','Man patīk nelieli koncerti. Uz biļetes pierakstu dziesmu, kas visvairāk palikusi atmiņā.'],
  ['niklas','Niklas',46,'NO','Осло','Фрогнер','men-women','NO · EN',false,
    'Для коротких походов всегда беру термос и запасную кружку. Предпочитаю тропы у воды.','On short hikes I pack a flask and a spare mug. Paths by the water are my favourite.','Auf kurzen Wanderungen habe ich eine Thermoskanne und einen zweiten Becher dabei. Am liebsten gehe ich am Wasser entlang.','Īsos pārgājienos līdzi ņemu termosu un rezerves krūzīti. Vislabāk patīk takas gar ūdeni.']
];
const DEMO = exampleRows.map(([slug,display_name,age,country,city,district,category,languages,photo,ru,en,de,lv]) => ({
  id:'demo-'+slug, demo:true, display_name, age, country, city, district, category, languages,
  description:({ru,en,de,lv})[exampleLanguage] || ru,
  avatar_url:photo ? '/examples/'+slug+'.webp' : '', symbol:display_name[0],
  color1:'#c5c3e0', color2:'#f1dfd0'
}));
