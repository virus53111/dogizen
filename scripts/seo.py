import json
import re
from html import escape
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ORIGIN = 'https://murdilimax.com'
PAGES = {
    'ru': ('/', 'Русский', 'Знакомства в Европе для взрослых', 'Бесплатные знакомства 18+ в Европе. Выберите город и найдите анкеты для общения, свиданий или совместных событий. Публикации проходят модерацию.'),
    'en': ('/en/', 'English', 'Meet adults across Europe', 'Explore free personal ads for adults aged 18 and over. Search by city for conversation, dates or someone to join an event. Listings are reviewed before publication.'),
    'de': ('/de/', 'Deutsch', 'Neue Bekanntschaften in Europa', 'Kostenlose Kontaktanzeigen für Erwachsene ab 18. Finde in deiner Stadt Menschen für Gespräche, Dates oder gemeinsame Veranstaltungen. Anzeigen werden vor der Veröffentlichung geprüft.'),
    'lv': ('/lv/', 'Latviešu', 'Iepazīšanās Eiropā pieaugušajiem', 'Bezmaksas iepazīšanās sludinājumi cilvēkiem no 18 gadu vecuma. Izvēlies pilsētu un atrodi sarunu biedru, randiņu vai kompāniju pasākumam. Sludinājumus pirms publicēšanas pārbauda.'),
}

def public_assets():
    dictionaries = json.loads((ROOT/'scripts/locales.json').read_text())
    assets = {'/locales.js': ('text/javascript', 'window.MM_I18N='+json.dumps(dictionaries,ensure_ascii=False)+';')}
    template = (ROOT/'public/index.html').read_text()
    alternate = ''.join(f'<link rel="alternate" hreflang="{lang}" href="{ORIGIN}{page[0]}">' for lang,page in PAGES.items())
    alternate += f'<link rel="alternate" hreflang="x-default" href="{ORIGIN}/">'
    languages = ' '.join(f'<a lang="{lang}" hreflang="{lang}" href="{page[0]}">{page[1]}</a>' for lang,page in PAGES.items())
    for lang,(path,label,heading,description) in PAGES.items():
        words = {}
        for group in dictionaries.values():
            words.update(group[lang])
        title = heading+' · 18+ | MurdiliMax'
        canonical = ORIGIN+path
        schema = {'@context':'https://schema.org','@type':'WebPage','name':title,'url':canonical,'inLanguage':lang,'isFamilyFriendly':False,'isPartOf':{'@type':'WebSite','name':'MurdiliMax','url':ORIGIN+'/'}}
        meta = f'<link rel="canonical" href="{canonical}">{alternate}<meta name="rating" content="adult"><meta property="og:type" content="website"><meta property="og:title" content="{title}"><meta property="og:description" content="{description}"><meta property="og:url" content="{canonical}"><script type="application/ld+json">{json.dumps(schema,ensure_ascii=False)}</script>'
        html = template.replace('<html lang="ru">',f'<html lang="{lang}">').replace('<meta name="robots" content="noindex, nofollow, noarchive">',meta)
        html = re.sub(r'<title>.*?</title>',f'<title>{title}</title>',html)
        html = re.sub(r'<meta name="description" content="[^"]*">',f'<meta name="description" content="{description}">',html)
        html = re.sub(r'(data-t="([^"]+)">)([^<]*)(</)',lambda m:m[1]+escape(words.get(m[2],m[3]))+m[4],html)
        html = html.replace('{{heading}}',heading).replace('{{intro}}',description).replace('{{languages}}',languages)
        html = html.replace(f'<option value="{lang}">',f'<option value="{lang}" selected>',1)
        assets[path] = ('text/html',html)
    entries=''.join('<url><loc>'+ORIGIN+data[0]+'</loc></url>' for data in PAGES.values())
    assets['/sitemap-catalog.xml']=('application/xml','<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'+entries+'</urlset>')
    assets['/sitemap.xml']=('application/xml','<?xml version="1.0" encoding="UTF-8"?><sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><sitemap><loc>'+ORIGIN+'/sitemap-catalog.xml</loc></sitemap></sitemapindex>')
    return assets
