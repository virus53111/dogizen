import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import path from 'node:path';

// Real editorial photography only. No generated artwork, SVG badges,
// artificial illustrations or remote photo hosts at page-view time.
// Existing photographs are licensed via Unsplash; the router photograph
// is CC0 from Wikimedia Commons (ResidentialGatewayCloseup, Raysonho).
const firstTopicPhotos={
 tech:'https://images.unsplash.com/photo-1518770660439-4636190af475',
 digital:'https://images.unsplash.com/photo-1498050108023-c5249f4df085',
 tools:'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40',
 sauna:'https://commons.wikimedia.org/wiki/Special:Redirect/file/Tamminiemi_sauna_interior.jpg?width=1200'
};
const newGuidePhotos={
 'wifi-router-placement':{
  url:'https://commons.wikimedia.org/wiki/Special:Redirect/file/ResidentialGatewayCloseup.jpg?width=1200',
  source:'https://commons.wikimedia.org/wiki/File:ResidentialGatewayCloseup.jpg',
  credit:'Raysonho / Wikimedia Commons — CC0'
 },
 'laptop-overheating-checklist':{
  url:'https://images.unsplash.com/photo-1755290726859-f8d02df5afbd',
  source:'https://unsplash.com/photos/close-up-of-a-computer-fan-and-circuitry-M7x8l9aSc7A',
  credit:'maks_d / Unsplash'
 },
 'freezer-food-storage':{
  url:'https://images.unsplash.com/photo-1547592180-85f173990554',
  source:'https://unsplash.com/',
  credit:'Unsplash'
 },
 'start-seeds-indoors':{
  url:'https://images.unsplash.com/photo-1523348837708-15d4a09cfac2',
  source:'https://unsplash.com/',
  credit:'Unsplash'
 },
 'rain-garden-at-home':{
  url:'https://images.unsplash.com/photo-1501004318641-b39e6451bec6',
  source:'https://unsplash.com/',
  credit:'Unsplash'
 },
 'cloud-types-field-guide':{
  url:'https://images.unsplash.com/photo-1534088568595-a066f410bcda',
  source:'https://unsplash.com/',
  credit:'Unsplash'
 },
 'thunderstorm-hiking-safety':{
  url:'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b',
  source:'https://unsplash.com/',
  credit:'Unsplash'
 },
 'beginner-stargazing-plan':{
  url:'https://images.unsplash.com/photo-1623945477998-ca7fe0a623fc',
  source:'https://unsplash.com/',
  credit:'Unsplash'
 },
 'bicycle-visibility-checklist':{
  url:'https://images.unsplash.com/photo-1485965120184-e220f721d03e',
  source:'https://unsplash.com/',
  credit:'Unsplash'
 },
 'find-water-leaks-home':{
  url:'https://images.unsplash.com/photo-1560673429-b9b9338a360a',
  source:'https://unsplash.com/',
  credit:'Unsplash'
 },
 'usb-c-cable-capabilities':{url:'https://images.unsplash.com/photo-1519389950473-47ba0277781c',source:'https://unsplash.com/',credit:'Unsplash'},
 'organize-family-photo-archive':{url:'https://images.unsplash.com/photo-1498050108023-c5249f4df085',source:'https://unsplash.com/',credit:'Unsplash'},
 'review-browser-permissions':{url:'https://images.unsplash.com/photo-1550751827-4bd374c3f58b',source:'https://unsplash.com/',credit:'Unsplash'},
 'mulch-garden-soil':{url:'https://images.unsplash.com/photo-1497250681960-ef046c08a56e',source:'https://unsplash.com/',credit:'Unsplash'},
 'lichens-miniature-ecosystems':{url:'https://images.unsplash.com/photo-1572652739268-a113eefe2a60',source:'https://unsplash.com/',credit:'Unsplash'},
 'animal-tracks-observation':{url:'https://images.unsplash.com/photo-1441974231531-c6227db76b6e',source:'https://unsplash.com/',credit:'Unsplash'},
 'window-condensation-explained':{url:'https://images.unsplash.com/photo-1504307651254-35680f356dfd',source:'https://unsplash.com/',credit:'Unsplash'},
 'why-earth-has-seasons':{url:'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa',source:'https://unsplash.com/',credit:'Unsplash'},
 'read-contour-lines':{url:'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b',source:'https://unsplash.com/',credit:'Unsplash'},
 'binoculars-focus-guide':{url:'https://images.unsplash.com/photo-1472396961693-142e6e269027',source:'https://unsplash.com/',credit:'Unsplash'},
 'fish-senses-lateral-line':{url:'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429',source:'https://unsplash.com/',credit:'Unsplash'},
 'kitchen-scale-tare-guide':{url:'https://images.unsplash.com/photo-1556911220-bff31c812dba',source:'https://unsplash.com/',credit:'Unsplash'}
};

// Individually selected photographs: identifiable subject, reviewed Commons file, photographer and licence.
// Keep each entry unique; generic category stock must not replace these images.
const reviewedArticlePhotos={
  "heat-exhaustion-signs": {
    "url": "https://commons.wikimedia.org/wiki/Special:Redirect/file/A%20man%20sweats%20while%20running%20during%20a%20sunny%20heatwave%20in%20Hong%20Kong.jpg?width=1200",
    "source": "https://commons.wikimedia.org/wiki/File:A_man_sweats_while_running_during_a_sunny_heatwave_in_Hong_Kong.jpg",
    "credit": "Hong Kong Free Press / Wikimedia Commons — CC BY 4.0 (image resized/cropped)"
  },
  "check-medical-information": {
    "url": "https://commons.wikimedia.org/wiki/Special:Redirect/file/Nurse%20taking%20notes%20while%20working%20on%20a%20laptop%20in%20a%20medical%20office.jpg?width=1200",
    "source": "https://commons.wikimedia.org/wiki/File:Nurse_taking_notes_while_working_on_a_laptop_in_a_medical_office.jpg",
    "credit": "Shixart1985 / Wikimedia Commons — CC BY 2.0 (image resized/cropped)"
  },
  "better-sleep-routine": {
    "url": "https://commons.wikimedia.org/wiki/Special:Redirect/file/Person%20Sleeping.JPG?width=1200",
    "source": "https://commons.wikimedia.org/wiki/File:Person_Sleeping.JPG",
    "credit": "Panduh562 / Wikimedia Commons — CC BY-SA 3.0 (image resized/cropped)"
  },
  "carbon-monoxide-home-safety": {
    "url": "https://commons.wikimedia.org/wiki/Special:Redirect/file/Carbon%20monoxide%20alarm.jpg?width=1200",
    "source": "https://commons.wikimedia.org/wiki/File:Carbon_monoxide_alarm.jpg",
    "credit": "Santeri Viinamäki / Wikimedia Commons — CC BY-SA 4.0 (image resized/cropped)"
  },
  "wood-stove-sauna-carbon-monoxide": {
    "url": "https://commons.wikimedia.org/wiki/Special:Redirect/file/Wood%20stove%20of%20smoke%20sauna%20of%20Kuusij%C3%A4rvi%2C%20Kuninkaanm%C3%A4ki%2C%20Vantaa%2C%20Finland%2C%202023%20April%20-%202.jpg?width=1200",
    "source": "https://commons.wikimedia.org/wiki/File:Wood_stove_of_smoke_sauna_of_Kuusij%C3%A4rvi%2C_Kuninkaanm%C3%A4ki%2C_Vantaa%2C_Finland%2C_2023_April_-_2.jpg",
    "credit": "Simo Räsänen / Wikimedia Commons — CC BY-SA 4.0 (image resized/cropped)"
  },
  "sauna-heat-vs-heatstroke": {
    "url": "https://commons.wikimedia.org/wiki/Special:Redirect/file/Interior%20of%20a%20sauna.jpg?width=1200",
    "source": "https://commons.wikimedia.org/wiki/File:Interior_of_a_sauna.jpg",
    "credit": "Konstantin / Wikimedia Commons — CC BY-SA 3.0 (image resized/cropped)"
  },
  "sauna-safety-guide": {
    "url": "https://commons.wikimedia.org/wiki/Special:Redirect/file/Sauna%20stove.jpg?width=1200",
    "source": "https://commons.wikimedia.org/wiki/File:Sauna_stove.jpg",
    "credit": "Tiia Monto / Wikimedia Commons — CC BY-SA 4.0 (image resized/cropped)"
  },
  "smoke-alarm-home-placement": {
    "url": "https://commons.wikimedia.org/wiki/Special:Redirect/file/Heimrauchmelder.jpg?width=1200",
    "source": "https://commons.wikimedia.org/wiki/File:Heimrauchmelder.jpg",
    "credit": "TDLacoste / Wikimedia Commons — CC BY-SA 3.0 (image resized/cropped)"
  },
  "tick-bite-first-steps": {
    "url": "https://commons.wikimedia.org/wiki/Special:Redirect/file/Ixodes%20ricinus%20PL.jpg?width=1200",
    "source": "https://commons.wikimedia.org/wiki/File:Ixodes_ricinus_PL.jpg",
    "credit": "Navaho / Wikimedia Commons — CC BY-SA 4.0 (image resized/cropped)"
  },
  "mushroom-poisoning-warning-signs": {
    "url": "https://commons.wikimedia.org/wiki/Special:Redirect/file/Mushroom%20Amanita%20phalloides.jpg?width=1200",
    "source": "https://commons.wikimedia.org/wiki/File:Mushroom_Amanita_phalloides.jpg",
    "credit": "Aleksey Gnilenkov / Wikimedia Commons — CC BY 2.0 (image resized/cropped)"
  },
  "international-travel-documents": {
    "url": "https://commons.wikimedia.org/wiki/Special:Redirect/file/Passport%20and%20Luggage%20(5778139343).jpg?width=1200",
    "source": "https://commons.wikimedia.org/wiki/File:Passport_and_Luggage_(5778139343).jpg",
    "credit": "Sean MacEntee / Wikimedia Commons — CC BY 2.0 (image resized/cropped)"
  }
};
Object.assign(reviewedArticlePhotos,{
  "windows-laptop-battery-care": {
    "url": "https://commons.wikimedia.org/wiki/Special:Redirect/file/Laptop%20PC%20Battery%20Removed.jpg?width=1200",
    "source": "https://commons.wikimedia.org/wiki/File:Laptop_PC_Battery_Removed.jpg",
    "credit": "Intel Free Press / Wikimedia Commons — CC BY-SA 2.0 (resized/cropped)"
  },
  "usb-c-cable-capabilities": {
    "url": "https://commons.wikimedia.org/wiki/Special:Redirect/file/USB%20Type-C.jpg?width=1200",
    "source": "https://commons.wikimedia.org/wiki/File:USB_Type-C.jpg",
    "credit": "Flanoz / Wikimedia Commons — CC0 (resized/cropped)"
  },
  "organize-family-photo-archive": {
    "url": "https://commons.wikimedia.org/wiki/Special:Redirect/file/Family-album.jpg?width=1200",
    "source": "https://commons.wikimedia.org/wiki/File:Family-album.jpg",
    "credit": "Anonymous photographer; derivative by Photolis / Wikimedia Commons — CC BY-SA 4.0 (resized/cropped)"
  },
  "password-manager-passkeys": {
    "url": "https://commons.wikimedia.org/wiki/Special:Redirect/file/YubiKey.jpg?width=1200",
    "source": "https://commons.wikimedia.org/wiki/File:YubiKey.jpg",
    "credit": "Warfieldian / Wikimedia Commons — CC BY-SA 3.0 (resized/cropped)"
  },
  "secure-our-world-four-habits": {
    "url": "https://commons.wikimedia.org/wiki/Special:Redirect/file/FIDO%20U2F%20Security%20Key%20by%20Plug-up%20International%2001.jpg?width=1200",
    "source": "https://commons.wikimedia.org/wiki/File:FIDO_U2F_Security_Key_by_Plug-up_International_01.jpg",
    "credit": "Simon Legner / Wikimedia Commons — CC BY-SA 4.0 (resized/cropped)"
  },
  "safe-public-wifi-travel": {
    "url": "https://commons.wikimedia.org/wiki/Special:Redirect/file/Computer%20Desk%20at%20Narita%20Airport%201%20(3545071396).jpg?width=1200",
    "source": "https://commons.wikimedia.org/wiki/File:Computer_Desk_at_Narita_Airport_1_(3545071396).jpg",
    "credit": "D Coetzee / Wikimedia Commons — CC0 (resized/cropped)"
  },
  "qr-code-scam-safety": {
    "url": "https://commons.wikimedia.org/wiki/Special:Redirect/file/QR%20code%20for%20more%20information.jpg?width=1200",
    "source": "https://commons.wikimedia.org/wiki/File:QR_code_for_more_information.jpg",
    "credit": "Brian Suda / Wikimedia Commons — CC BY 2.0 (resized/cropped)"
  },
  "review-browser-permissions": {
    "url": "https://commons.wikimedia.org/wiki/Special:Redirect/file/Tape%20over%20laptop%20webcam.jpg?width=1200",
    "source": "https://commons.wikimedia.org/wiki/File:Tape_over_laptop_webcam.jpg",
    "credit": "Santeri Viinamäki / Wikimedia Commons — CC BY-SA 4.0 (resized/cropped)"
  },
  "stop-cold-drafts-at-home": {
    "url": "https://commons.wikimedia.org/wiki/Special:Redirect/file/Front%20windows%20(4205567878).jpg?width=1200",
    "source": "https://commons.wikimedia.org/wiki/File:Front_windows_(4205567878).jpg",
    "credit": "mark6mauno / Wikimedia Commons — CC BY 2.0 (resized/cropped)"
  },
  "window-condensation-explained": {
    "url": "https://commons.wikimedia.org/wiki/Special:Redirect/file/Windowcondensation.jpg?width=1200",
    "source": "https://commons.wikimedia.org/wiki/File:Windowcondensation.jpg",
    "credit": "Doggo19292 / Wikimedia Commons — Public domain (resized/cropped)"
  },
  "leave-no-trace-forest": {
    "url": "https://commons.wikimedia.org/wiki/Special:Redirect/file/Plogging%20Hikers.jpg?width=1200",
    "source": "https://commons.wikimedia.org/wiki/File:Plogging_Hikers.jpg",
    "credit": "Ben Nelson / Wikimedia Commons — CC BY-SA 4.0 (resized/cropped)"
  },
  "fishing-gear-clean-drain-dry": {
    "url": "https://commons.wikimedia.org/wiki/Special:Redirect/file/Fisherman%20cleaning%20fishing%20net%20on%20fishing%20boat.jpg?width=1200",
    "source": "https://commons.wikimedia.org/wiki/File:Fisherman_cleaning_fishing_net_on_fishing_boat.jpg",
    "credit": "Kikku33 / Wikimedia Commons — CC BY-SA 4.0 (resized/cropped)"
  },
  "responsible-catch-and-release": {
    "url": "https://commons.wikimedia.org/wiki/Special:Redirect/file/Brown%20trout%20at%20Seedskadee%20National%20Wildlife%20Refuge%20(48841756381).jpg?width=1200",
    "source": "https://commons.wikimedia.org/wiki/File:Brown_trout_at_Seedskadee_National_Wildlife_Refuge_(48841756381).jpg",
    "credit": "Tom Koerner / USFWS / Wikimedia Commons — Public domain (resized/cropped)"
  },
  "warm-water-low-oxygen-fish": {
    "url": "https://commons.wikimedia.org/wiki/Special:Redirect/file/Dead%20fish%20by%20Lake%20Volta.jpg?width=1200",
    "source": "https://commons.wikimedia.org/wiki/File:Dead_fish_by_Lake_Volta.jpg",
    "credit": "Knowledge and philosophy / Wikimedia Commons — CC BY-SA 4.0 (resized/cropped)"
  },
  "fish-senses-lateral-line": {
    "url": "https://commons.wikimedia.org/wiki/Special:Redirect/file/Lateral%20line%2002.JPG?width=1200",
    "source": "https://commons.wikimedia.org/wiki/File:Lateral_line_02.JPG",
    "credit": "Art of Pogrebnoj-Alexandroff / Wikimedia Commons — CC BY-SA 3.0 (resized/cropped)"
  },
  "why-forests-need-fungi": {
    "url": "https://commons.wikimedia.org/wiki/Special:Redirect/file/The%20root-like%20Mycelium%20of%20a%20fungus.jpg?width=1200",
    "source": "https://commons.wikimedia.org/wiki/File:The_root-like_Mycelium_of_a_fungus.jpg",
    "credit": "FungiFriendly / Wikimedia Commons — CC BY-SA 4.0 (resized/cropped)"
  },
  "lichens-miniature-ecosystems": {
    "url": "https://commons.wikimedia.org/wiki/Special:Redirect/file/Lichen-Covered%20Tree%20Bark%20Close-Up.jpg?width=1200",
    "source": "https://commons.wikimedia.org/wiki/File:Lichen-Covered_Tree_Bark_Close-Up.jpg",
    "credit": "A S M Jobaer / Wikimedia Commons — CC BY-SA 4.0 (resized/cropped)"
  },
  "watering-houseplants-right": {
    "url": "https://commons.wikimedia.org/wiki/Special:Redirect/file/Woman%20cares%20for%20plants%20indoors%20in%20a%20plant%20shop.jpg?width=1200",
    "source": "https://commons.wikimedia.org/wiki/File:Woman_cares_for_plants_indoors_in_a_plant_shop.jpg",
    "credit": "Shixart1985 / Wikimedia Commons — CC BY 2.0 (resized/cropped)"
  },
  "home-garden-compost-basics": {
    "url": "https://commons.wikimedia.org/wiki/Special:Redirect/file/Garden%20compost%20bin.jpg?width=1200",
    "source": "https://commons.wikimedia.org/wiki/File:Garden_compost_bin.jpg",
    "credit": "FotoFree / Wikimedia Commons — CC BY-SA 4.0 (resized/cropped)"
  },
  "balcony-flowers-for-pollinators": {
    "url": "https://commons.wikimedia.org/wiki/Special:Redirect/file/Bee%20on%20Lavender%20Flower.jpg?width=1200",
    "source": "https://commons.wikimedia.org/wiki/File:Bee_on_Lavender_Flower.jpg",
    "credit": "QUEENBELLAAA / Wikimedia Commons — CC BY 4.0 (resized/cropped)"
  },
  "mulch-garden-soil": {
    "url": "https://commons.wikimedia.org/wiki/Special:Redirect/file/Wood%20chip%20pile.jpg?width=1200",
    "source": "https://commons.wikimedia.org/wiki/File:Wood_chip_pile.jpg",
    "credit": "Geo Lightspeed7 / Wikimedia Commons — CC BY-SA 4.0 (resized/cropped)"
  },
  "sun-protection-travel-uv": {
    "url": "https://commons.wikimedia.org/wiki/Special:Redirect/file/Beach%20sun%20protection.jpg?width=1200",
    "source": "https://commons.wikimedia.org/wiki/File:Beach_sun_protection.jpg",
    "credit": "Barbara-Ingeborg / Wikimedia Commons — CC BY-SA 4.0 (resized/cropped)"
  },
  "day-hike-ten-essentials": {
    "url": "https://commons.wikimedia.org/wiki/Special:Redirect/file/Day%201-%20Hiking%20Essentials%20(19444913913).jpg?width=1200",
    "source": "https://commons.wikimedia.org/wiki/File:Day_1-_Hiking_Essentials_(19444913913).jpg",
    "credit": "BLM Utah / Wikimedia Commons — Public domain (resized/cropped)"
  },
  "thunderstorm-hiking-safety": {
    "url": "https://commons.wikimedia.org/wiki/Special:Redirect/file/Nighttime%20Thunderstorm%20and%20Cloud-to-Cloud%20Lightning.jpg?width=1200",
    "source": "https://commons.wikimedia.org/wiki/File:Nighttime_Thunderstorm_and_Cloud-to-Cloud_Lightning.jpg",
    "credit": "Muhammadphoto / Wikimedia Commons — CC BY-SA 4.0 (resized/cropped)"
  },
  "read-contour-lines": {
    "url": "https://commons.wikimedia.org/wiki/Special:Redirect/file/Map%20Reading%20in%20prep%20for%20hike%20(51873860348).jpg?width=1200",
    "source": "https://commons.wikimedia.org/wiki/File:Map_Reading_in_prep_for_hike_(51873860348).jpg",
    "credit": "US Forest Service, Northern Region / Wikimedia Commons — Public domain (resized/cropped)"
  },
  "physical-activity-after-break": {
    "url": "https://commons.wikimedia.org/wiki/Special:Redirect/file/Walkingexercise.jpg?width=1200",
    "source": "https://commons.wikimedia.org/wiki/File:Walkingexercise.jpg",
    "credit": "Johnorchard / Wikimedia Commons — CC BY-SA 4.0 (resized/cropped)"
  },
  "everyday-movement-counts": {
    "url": "https://commons.wikimedia.org/wiki/Special:Redirect/file/Commuting%20by%20bicycle.jpg?width=1200",
    "source": "https://commons.wikimedia.org/wiki/File:Commuting_by_bicycle.jpg",
    "credit": "Petar Milošević / Wikimedia Commons — CC BY-SA 4.0 (resized/cropped)"
  },
  "beginner-strength-exercises": {
    "url": "https://commons.wikimedia.org/wiki/Special:Redirect/file/Strength%20training%20session%20with%20dumbbells.jpg?width=1200",
    "source": "https://commons.wikimedia.org/wiki/File:Strength_training_session_with_dumbbells.jpg",
    "credit": "Shixart1985 / Nenad Stojković / Wikimedia Commons — CC BY 2.0 (resized/cropped)"
  },
  "birdwatching-without-disturbance": {
    "url": "https://commons.wikimedia.org/wiki/Special:Redirect/file/Watching%20a%20nest%20(51358316290).jpg?width=1200",
    "source": "https://commons.wikimedia.org/wiki/File:Watching_a_nest_(51358316290).jpg",
    "credit": "Lisa Hupp / USFWS / Wikimedia Commons — Public domain (resized/cropped)"
  },
  "why-dead-trees-matter": {
    "url": "https://commons.wikimedia.org/wiki/Special:Redirect/file/DECAYING%20LOG.jpg?width=1200",
    "source": "https://commons.wikimedia.org/wiki/File:DECAYING_LOG.jpg",
    "credit": "Suglo20 / Wikimedia Commons — CC BY-SA 4.0 (resized/cropped)"
  },
  "prevent-bird-window-collisions": {
    "url": "https://commons.wikimedia.org/wiki/Special:Redirect/file/A%20bird%20crashed%20into%20my%20window.jpg?width=1200",
    "source": "https://commons.wikimedia.org/wiki/File:A_bird_crashed_into_my_window.jpg",
    "credit": "Leo Fung / Wikimedia Commons — CC BY 2.0 (resized/cropped)"
  },
  "animal-tracks-observation": {
    "url": "https://commons.wikimedia.org/wiki/Special:Redirect/file/Fox%20Tracks%20in%20the%20Snow%20(51861791568).jpg?width=1200",
    "source": "https://commons.wikimedia.org/wiki/File:Fox_Tracks_in_the_Snow_(51861791568).jpg",
    "credit": "NPS / Hannah Prokop / Wikimedia Commons — Public domain (resized/cropped)"
  },
  "solar-eclipse-eye-safety": {
    "url": "https://commons.wikimedia.org/wiki/Special:Redirect/file/2017%20Total%20Solar%20Eclipse%20(36739413175).jpg?width=1200",
    "source": "https://commons.wikimedia.org/wiki/File:2017_Total_Solar_Eclipse_(36739413175).jpg",
    "credit": "NASA / Aubrey Gemignani / Wikimedia Commons — Public domain (resized/cropped)"
  },
  "meteor-showers-observation": {
    "url": "https://commons.wikimedia.org/wiki/Special:Redirect/file/Meteor%20Shower%20(NHQ202508030001).jpg?width=1200",
    "source": "https://commons.wikimedia.org/wiki/File:Meteor_Shower_(NHQ202508030001).jpg",
    "credit": "NASA / Bill Ingalls / Wikimedia Commons — Public domain (resized/cropped)"
  },
  "what-is-a-light-year": {
    "url": "https://commons.wikimedia.org/wiki/Special:Redirect/file/Milky%20Way%20and%20starry%20night%20sky%20(26972689115).jpg?width=1200",
    "source": "https://commons.wikimedia.org/wiki/File:Milky_Way_and_starry_night_sky_(26972689115).jpg",
    "credit": "NPS / Jacob W. Frank / Wikimedia Commons — Public domain (resized/cropped)"
  },
  "why-earth-has-seasons": {
    "url": "https://commons.wikimedia.org/wiki/Special:Redirect/file/Globus%20mit%20Erdachse%2002.jpg?width=1200",
    "source": "https://commons.wikimedia.org/wiki/File:Globus_mit_Erdachse_02.jpg",
    "credit": "Beat Ruest / Wikimedia Commons — CC BY-SA 4.0 (resized/cropped)"
  },
  "raw-meat-cross-contamination": {
    "url": "https://commons.wikimedia.org/wiki/Special:Redirect/file/Photo%20to%20Illustrate%20the%20Need%20for%20Cutting%20Boards%20(FDA%20139)%20(8207031038).jpg?width=1200",
    "source": "https://commons.wikimedia.org/wiki/File:Photo_to_Illustrate_the_Need_for_Cutting_Boards_(FDA_139)_(8207031038).jpg",
    "credit": "US FDA / Wikimedia Commons — Public domain (resized/cropped)"
  },
  "best-before-vs-use-by-europe": {
    "url": "https://commons.wikimedia.org/wiki/Special:Redirect/file/Parasta%20ennen%202018.jpg?width=1200",
    "source": "https://commons.wikimedia.org/wiki/File:Parasta_ennen_2018.jpg",
    "credit": "Santeri Viinamäki / Wikimedia Commons — CC BY-SA 4.0 (resized/cropped)"
  },
  "freezer-food-storage": {
    "url": "https://commons.wikimedia.org/wiki/Special:Redirect/file/Bags%20of%20frozen%20fruit%20in%20the%20freezer.jpg?width=1200",
    "source": "https://commons.wikimedia.org/wiki/File:Bags_of_frozen_fruit_in_the_freezer.jpg",
    "credit": "Shixart1985 / Wikimedia Commons — CC BY 2.0 (resized/cropped)"
  },
  "ryzen-upgrade": {
    "url": "https://commons.wikimedia.org/wiki/Special:Redirect/file/Ryzen%205%201600%20CPU%20on%20a%20motherboard.jpg?width=1200",
    "source": "https://commons.wikimedia.org/wiki/File:Ryzen_5_1600_CPU_on_a_motherboard.jpg",
    "credit": "Ilya Plekhanov / Wikimedia Commons — CC BY-SA 4.0 (resized/cropped)"
  },
  "wifi-speed": {
    "url": "https://commons.wikimedia.org/wiki/Special:Redirect/file/Close-up%20of%20the%20internet%20router.jpg?width=1200",
    "source": "https://commons.wikimedia.org/wiki/File:Close-up_of_the_internet_router.jpg",
    "credit": "Shixart1985 / Wikimedia Commons — CC BY 2.0 (resized/cropped)"
  },
  "ddr4-ddr5": {
    "url": "https://commons.wikimedia.org/wiki/Special:Redirect/file/Memory%20modules.jpg?width=1200",
    "source": "https://commons.wikimedia.org/wiki/File:Memory_modules.jpg",
    "credit": "Peter Fiskerstrand / Wikimedia Commons — CC BY-SA 4.0 (resized/cropped)"
  },
  "backup-321": {
    "url": "https://commons.wikimedia.org/wiki/Special:Redirect/file/Typical%20External%20Hard%20Drive.JPG?width=1200",
    "source": "https://commons.wikimedia.org/wiki/File:Typical_External_Hard_Drive.JPG",
    "credit": "Armchair / Wikimedia Commons — CC BY-SA 4.0 (resized/cropped)"
  },
  "ssd-vs-hdd": {
    "url": "https://commons.wikimedia.org/wiki/Special:Redirect/file/Last%20and%20next-generation%20storage%20media.jpg?width=1200",
    "source": "https://commons.wikimedia.org/wiki/File:Last_and_next-generation_storage_media.jpg",
    "credit": "Daniel Aleksandersen / Wikimedia Commons — CC BY 2.0 (resized/cropped)"
  }
});
for(const [slug,record] of Object.entries(reviewedArticlePhotos)){
 // Editorially reviewed article photo intentionally overrides an older generic selection.
 newGuidePhotos[slug]=record;
}
const reviewedFiles=new Set(Object.values(reviewedArticlePhotos).map(p=>p.source));
if(reviewedFiles.size!==Object.keys(reviewedArticlePhotos).length)throw Error('Two reviewed articles reuse a photograph');
// Verified original documentary photographs (not AI artwork) for current-interest guides.
// Exact Wikimedia Commons file pages document photographer, terms, and reuse attribution.
const highIntentPhotos={
  "flu-cold-covid-differences": {
    "url": "https://commons.wikimedia.org/wiki/Special:Redirect/file/Influenza%20A%20and%20Influenza%20B%20Rapid%20Test-Negative%20Result.jpg?width=1200",
    "source": "https://commons.wikimedia.org/wiki/File:Influenza_A_and_Influenza_B_Rapid_Test-Negative_Result.jpg",
    "credit": "Ajay Kumar Chaurasiya / Wikimedia Commons — CC BY 4.0 (photograph resized for web)"
  },
  "black-friday-real-discounts": {
    "url": "https://commons.wikimedia.org/wiki/Special:Redirect/file/Black%20Friday%20Shopping.jpg?width=1200",
    "source": "https://commons.wikimedia.org/wiki/File:Black_Friday_Shopping.jpg",
    "credit": "Eric.Ray / Wikimedia Commons — CC BY-SA 2.0 (photograph resized for web)"
  },
  "latvia-property-tax-online": {
    "url": "https://commons.wikimedia.org/wiki/Special:Redirect/file/Andromedas%20Gatve%2C%205B%20Andromedas%20Gatve%2C%205B%20WMID2579272%20725.jpg?width=1200",
    "source": "https://commons.wikimedia.org/wiki/File:Andromedas_Gatve%2C_5B_Andromedas_Gatve%2C_5B_WMID2579272_725.jpg",
    "credit": "Imants / Wikimapia / Wikimedia Commons — CC BY-SA 3.0 (photograph resized for web)"
  },
  "ai-voice-scam-calls": {
    "url": "https://commons.wikimedia.org/wiki/Special:Redirect/file/Man%20responds%20to%20telephone%20call.jpg?width=1200",
    "source": "https://commons.wikimedia.org/wiki/File:Man_responds_to_telephone_call.jpg",
    "credit": "Diane A. Reid / US National Cancer Institute / Wikimedia Commons — Public domain (photograph resized for web)"
  }
};
for(const [slug,asset] of Object.entries(highIntentPhotos)){
 if(newGuidePhotos[slug])throw Error('New article photo overrides existing guide: '+slug);
 newGuidePhotos[slug]=asset;
}
// Six individually licensed, topic-matching genuine photographs for worldwide evergreen how-to guides.
const globalGuidePhotos={
  "change-flat-tire-safely": {
    "url": "https://commons.wikimedia.org/wiki/Special:Redirect/file/Changing%20car%20tire%2020170513%2001.jpg?width=1200",
    "source": "https://commons.wikimedia.org/wiki/File:Changing_car_tire_20170513_01.jpg",
    "credit": "Santeri Viinamäki / Wikimedia Commons — CC BY-SA 4.0 (photograph resized for web)"
  },
  "find-my-ip-address": {
    "url": "https://commons.wikimedia.org/wiki/Special:Redirect/file/Linksys-Wireless-G-Router.jpg?width=1200",
    "source": "https://commons.wikimedia.org/wiki/File:Linksys-Wireless-G-Router.jpg",
    "credit": "Evan-Amos / Wikimedia Commons — Public domain (photograph resized for web)"
  },
  "simple-monthly-budget-plan": {
    "url": "https://commons.wikimedia.org/wiki/Special:Redirect/file/Counting%20Money%2C%20Yemen%20(10850034204).jpg?width=1200",
    "source": "https://commons.wikimedia.org/wiki/File:Counting_Money%2C_Yemen_(10850034204).jpg",
    "credit": "Rod Waddington / Wikimedia Commons — CC BY-SA 2.0 (photograph resized for web)"
  },
  "create-professional-invoice": {
    "url": "https://commons.wikimedia.org/wiki/Special:Redirect/file/Paperilasku%2020180304.jpg?width=1200",
    "source": "https://commons.wikimedia.org/wiki/File:Paperilasku_20180304.jpg",
    "credit": "Santeri Viinamäki / Wikimedia Commons — CC BY-SA 4.0 (photograph resized for web)"
  },
  "lost-stolen-smartphone-first-steps": {
    "url": "https://commons.wikimedia.org/wiki/Special:Redirect/file/Coffee-cup-apple-iphone.jpg?width=1200",
    "source": "https://commons.wikimedia.org/wiki/File:Coffee-cup-apple-iphone.jpg",
    "credit": "Pexels contributor / Wikimedia Commons — CC0 (photograph resized for web)"
  },
  "fake-remote-job-offer-warning-signs": {
    "url": "https://commons.wikimedia.org/wiki/Special:Redirect/file/Job%20interview.jpg?width=1200",
    "source": "https://commons.wikimedia.org/wiki/File:Job_interview.jpg",
    "credit": "Alan Cleaver / Wikimedia Commons — CC BY 2.0 (photograph resized for web)"
  }
};
for(const [slug,asset] of Object.entries(globalGuidePhotos)){
 if(newGuidePhotos[slug])throw Error('Duplicate photo assignment '+slug);
 newGuidePhotos[slug]=asset;
}
// Source-verified, human-shot documentary photographs for clinical awareness and disaster preparedness.
const medicalSafetyGuidePhotos={
  "stroke-signs-be-fast": {
    "url": "https://commons.wikimedia.org/wiki/Special:Redirect/file/WMAS%20Ambulance.jpg?width=1200",
    "source": "https://commons.wikimedia.org/wiki/File:WMAS_Ambulance.jpg",
    "credit": "Jpdfive / Wikimedia Commons — CC BY-SA 4.0 (photograph resized/cropped for the web)"
  },
  "heart-attack-warning-signs-first-steps": {
    "url": "https://commons.wikimedia.org/wiki/Special:Redirect/file/ECG%20machine.jpg?width=1200",
    "source": "https://commons.wikimedia.org/wiki/File:ECG_machine.jpg",
    "credit": "Zeeshan2907 / Wikimedia Commons — CC BY-SA 4.0 (photograph resized/cropped for the web)"
  },
  "measure-blood-pressure-at-home": {
    "url": "https://commons.wikimedia.org/wiki/Special:Redirect/file/Close-up%20of%20a%20woman%20using%20a%20blood%20pressure%20monitor.jpg?width=1200",
    "source": "https://commons.wikimedia.org/wiki/File:Close-up_of_a_woman_using_a_blood_pressure_monitor.jpg",
    "credit": "Shixart1985 / Wikimedia Commons — CC BY 2.0 (photograph resized/cropped for the web)"
  },
  "anaphylaxis-severe-allergy-emergency": {
    "url": "https://commons.wikimedia.org/wiki/Special:Redirect/file/Epi-Pen%20(1).JPG?width=1200",
    "source": "https://commons.wikimedia.org/wiki/File:Epi-Pen_(1).JPG",
    "credit": "Intropin / Wikimedia Commons — CC BY 3.0 (photograph resized/cropped for the web)"
  },
  "power-outage-refrigerator-food-safety": {
    "url": "https://commons.wikimedia.org/wiki/Special:Redirect/file/Inside%20the%20refrigerator.jpg?width=1200",
    "source": "https://commons.wikimedia.org/wiki/File:Inside_the_refrigerator.jpg",
    "credit": "Satirdan kahraman / Wikimedia Commons — CC BY-SA 4.0 (photograph resized/cropped for the web)"
  },
  "earthquake-drop-cover-hold-on": {
    "url": "https://commons.wikimedia.org/wiki/Special:Redirect/file/Earthquake%20damage%20in%20Khunde%2C%20Nepal.jpg?width=1200",
    "source": "https://commons.wikimedia.org/wiki/File:Earthquake_damage_in_Khunde%2C_Nepal.jpg",
    "credit": "Niklassletteland / Wikimedia Commons — CC BY-SA 3.0 (photograph resized/cropped for the web)"
  }
};
for(const [slug,asset] of Object.entries(medicalSafetyGuidePhotos)){
 if(newGuidePhotos[slug])throw Error('Photo slug collision '+slug);
 newGuidePhotos[slug]=asset;
}
const signature=buffer=>buffer.length>12&&buffer[0]===255&&buffer[1]===216&&buffer[buffer.length-2]===255&&buffer[buffer.length-1]===217;
async function getJpeg(source){
 const url=new URL(source);
 if(url.hostname==='images.unsplash.com'){
  url.searchParams.set('w','1200');
  url.searchParams.set('q','77');
  url.searchParams.set('fm','jpg');
  url.searchParams.set('fit','crop');
  url.searchParams.delete('auto');
 }else if(url.hostname!=='commons.wikimedia.org')throw Error('Unexpected photographic host: '+url.hostname);
 let lastError;
 const commons=url.hostname==='commons.wikimedia.org';
 for(let attempt=0;attempt<6;attempt++){
  try{
   const response=await fetch(url,{signal:AbortSignal.timeout(25000),headers:{'Accept':'image/jpeg','User-Agent':'MURDILIMAX-photo-cache/1.0 (public educational site)'}});
   if(!response.ok)throw Error('HTTP '+response.status);
   if(!response.headers.get('content-type')?.includes('image/'))throw Error('Not an image: '+response.headers.get('content-type'));
   const bytes=Buffer.from(await response.arrayBuffer());
   if(bytes.length<10000||bytes.length>2600000||!signature(bytes))throw Error('Not a valid JPEG image ('+bytes.length+' bytes)');
   return bytes;
  }catch(e){
   lastError=e;
   console.warn('Photo fetch attempt '+(attempt+1)+' failed '+url.pathname+': '+e.message);
   // Commons rejects parallel thumbnail requests with HTTP 429. Retry after a real delay.
   if(attempt<5){
    const backoff=commons?Math.min(35000,5000*(attempt+1)):Math.min(10000,1500*(attempt+1));
    await new Promise(resolve=>setTimeout(resolve,backoff));
   }
  }
 }
 throw new Error('Cannot obtain real photograph '+url.pathname+': '+lastError?.message);
}
async function runPool(tasks,size=6){
 let cursor=0;
 await Promise.all(Array.from({length:Math.min(size,tasks.length)},async()=>{
  for(;;){
   const i=cursor++;
   if(i>=tasks.length)return;
   await tasks[i]();
  }
 }));
}
export async function bundlePhotographs({root,stories,topics}){
 const photoDir=path.join(root,'photos');
 await mkdir(photoDir,{recursive:true});
 const bySource=new Map();
 const usePhoto=(entry,remote)=>{
  if(!remote)throw Error('Missing real photograph for '+(entry.id||'entry'));
  const base=remote.split('?')[0];
  if(!/^https:\/\/(?:images\.unsplash\.com|commons\.wikimedia\.org)\//.test(base))
   throw Error('Unreviewed photo host for '+entry.id+': '+base);
  const id=createHash('sha256').update(base).digest('hex').slice(0,18);
  if(!bySource.has(base))bySource.set(base,{source:remote,file:id+'.jpg'});
  entry.image='/photos/'+id+'.jpg';
 };
 for(const t of topics)usePhoto(t,firstTopicPhotos[t.id]||t.image);
 // Owner-supplied, locally versioned photography: permission for this publication is
 // NOT a Creative Commons or public-reuse licence. Never try to fetch this photo remotely.
 const localPhotographs=[];
 for(const s of stories){
  const selected=s.photoAsset||newGuidePhotos[s.id];
  if(selected?.localFile){
   if(!/^assets\/owner-photos\/[a-z0-9-]+\.jpg$/.test(selected.localFile))
    throw Error('Unapproved owner-supplied photo path '+selected.localFile);
   if(!selected.credit||!selected.rights||selected.license)
    throw Error('Owner photo must credit permission without inventing a CC licence: '+s.id);
   const bytes=await readFile(path.resolve(selected.localFile));
   if(!signature(bytes)||bytes.length<12000||bytes.length>2600000)
    throw Error('Owner photo must be a valid local JPEG: '+s.id);
   const id=createHash('sha256').update(bytes).digest('hex').slice(0,18);
   const file=id+'.jpg';
   s.image='/photos/'+file;
   s.photoCredit=selected.credit;
   s.photoCreditUrl=s.image;
   if(localPhotographs.some(p=>p.file===file)||[...bySource.values()].some(p=>p.file===file))
    throw Error('Duplicate owner photograph '+file);
   localPhotographs.push({file,bytes});
   continue;
  }
  if(selected){
   s.photoCredit=selected.credit;
   s.photoCreditUrl=selected.source;
  }
  usePhoto(s,selected?.url||s.image||topics.find(t=>t.id===s.topic)?.photoOriginal);
 }
 const records=[...bySource.values()];
 const download=record=>async()=>{
  const bytes=await getJpeg(record.source);
  await writeFile(path.join(photoDir,record.file),bytes);
  record.bytes=bytes.length;
 };
 // High-throughput Unsplash requests can run in parallel; Commons limits automated clients.
 // Serialize Commons requests to avoid 429, while downloading Unsplash photos concurrently.
 const commonsRecords=records.filter(r=>new URL(r.source).hostname==='commons.wikimedia.org');
 const otherRecords=records.filter(r=>new URL(r.source).hostname!=='commons.wikimedia.org');
 await Promise.all([
  Promise.all(localPhotographs.map(p=>writeFile(path.join(photoDir,p.file),p.bytes))),
  runPool(otherRecords.map(download),6),
  (async()=>{for(const record of commonsRecords){
   await new Promise(resolve=>setTimeout(resolve,2500));
   await download(record)();
  }})()
 ]);
 const fallbackSource=firstTopicPhotos.tech.split('?')[0];
 const techPhoto=bySource.get(fallbackSource);
 if(!techPhoto)throw new Error('Missing guaranteed real-photo fallback');
 await writeFile(path.join(photoDir,'photo-fallback.jpg'),await readFile(path.join(photoDir,techPhoto.file)));
 const photoCount=records.length+localPhotographs.length;
 const photoBytes=records.reduce((n,x)=>n+x.bytes,0)+localPhotographs.reduce((n,x)=>n+x.bytes.length,0);
 console.log('PHOTO ASSET PASS: '+photoCount+' unique genuine JPEG photographs, '+stories.length+' article covers, '+topics.length+' topic covers, '+photoBytes+' total bytes; all stored locally.');
 return photoCount;
}
