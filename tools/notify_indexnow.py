"""Notify IndexNow engines of updated public pages after Pages is live.

IndexNow verifies a domain via the public key file. Acceptance does not
guarantee crawling or inclusion in search results.
"""
import json, os, time, urllib.request, urllib.error
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
KEY="59c169e2ed3c90d899f1483a87b0bbde"
assert (ROOT/(KEY+".txt")).read_text().strip()==KEY
pages=["/","/download.html","/mobile-app.html","/guides/","/guides/browser-profiles.html","/guides/proxies.html","/privacy/"]
base="https://murdilimax.com"
payload={"host":"murdilimax.com","key":KEY,"keyLocation":base+"/"+KEY+".txt","urlList":[base+path for path in pages]}
data=json.dumps(payload).encode()
req=urllib.request.Request("https://api.indexnow.org/indexnow",data=data,headers={"Content-Type":"application/json","User-Agent":"Murdilimax-SEO-Notifier/1.0"},method="POST")
try:
 with urllib.request.urlopen(req,timeout=20) as response:
  print("IndexNow HTTP",response.status,"- submission accepted for processing, no ranking guarantee")
except urllib.error.HTTPError as error:
 print("IndexNow replied",error.code,"(key propagation/verification may lag); retry next deployment")
except Exception as error:
 print("IndexNow notification unavailable:",type(error).__name__)
