"""Fail deployment on malformed sitemap, missing canonical or broken local routes."""
import json, re, sys
from pathlib import Path
from html.parser import HTMLParser
import xml.etree.ElementTree as ET
from urllib.parse import urlparse
ROOT=Path(__file__).resolve().parents[1]
FILES=["index.html","download.html","updates.html","mobile-app.html","guides/index.html","guides/browser-profiles.html","guides/proxies.html","guides/cookies.html","guides/extensions.html","privacy/index.html","account.html","mobile/index.html"]
PUBLIC=["/","/download.html","/updates.html","/mobile-app.html","/guides/","/guides/browser-profiles.html","/guides/proxies.html","/guides/cookies.html","/guides/extensions.html","/privacy/"]
class Audit(HTMLParser):
 def __init__(self):
  super().__init__(); self.ids=set();self.links=[];self.titles=[];self.canonical=[];self.jsonld=[];self.noindex=False;self._title=False;self._json=False;self._jsontext=""
 def handle_starttag(self,tag,attrs):
  a=dict(attrs)
  if tag=="a" and "href" in a:self.links.append(a["href"])
  if tag in ("link","script","img") and a.get("href","").startswith("/"):self.links.append(a["href"])
  if tag=="link" and a.get("rel")=="canonical":self.canonical.append(a.get("href"))
  if tag=="meta" and a.get("name")=="robots" and "noindex" in a.get("content",""):self.noindex=True
  if tag=="title":self._title=True
  if tag=="script" and a.get("type")=="application/ld+json":self._json=True;self._jsontext=""
  if "id" in a:self.ids.add(a["id"])
 def handle_data(self,data):
  if self._title:self.titles.append(data)
  if self._json:self._jsontext+=data
 def handle_endtag(self,tag):
  if tag=="title":self._title=False
  if tag=="script" and self._json:self.jsonld.append(json.loads(self._jsontext));self._json=False
ns={"s":"http://www.sitemaps.org/schemas/sitemap/0.9"}
root=ET.parse(ROOT/"sitemap.xml").getroot()
urls=[u.text for u in root.findall("s:url/s:loc",ns)]
assert len(urls)==len(PUBLIC),"Sitemap count drift"
assert set(urls)==set("https://murdilimax.com"+p for p in PUBLIC),"Sitemap mismatch"
assert "Sitemap: https://murdilimax.com/sitemap.xml" in (ROOT/"robots.txt").read_text()
manifest=json.loads((ROOT/"mobile/manifest.webmanifest").read_text())
assert manifest["scope"]=="/mobile/"
for f in FILES:
 text=(ROOT/f).read_text();a=Audit();a.feed(text)
 assert a.titles,f"Missing title {f}"
 path="/"+f.replace("index.html","").replace("privacy/","privacy/") if f.endswith("index.html") else "/"+f
 path=path.replace("//","/")
 if f in ("account.html","mobile/index.html"):assert a.noindex,f"Private page indexable: {f}"
 else: assert a.canonical==["https://murdilimax.com"+path],f"Bad canonical {f}: {a.canonical}"
 for link in a.links:
  if link.startswith("/"):
   target=link.split("#",1)[0].split("?",1)[0]
   if target.endswith("/"):target+="index.html"
   assert (ROOT/target.lstrip("/")).exists() or target in ["/mobile/icon-192.png","/mobile/icon-512.png","/mobile/icon-180.png","/apple-touch-icon.png","/favicon.png","/og-image.png"],f"Missing link {link} in {f}"
for p in PUBLIC:
 fp=ROOT/(p.lstrip("/")+"index.html" if p.endswith("/") else p.lstrip("/"))
 assert fp.exists(),f"Missing sitemap target {p}"
print(f"SEO/site audit passed: {len(FILES)} pages; {len(urls)} indexable sitemap entries")
