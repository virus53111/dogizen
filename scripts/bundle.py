import json
from pathlib import Path
from seo import public_assets
root=Path(__file__).resolve().parents[1]
types={'.html':'text/html','.css':'text/css','.js':'text/javascript','.txt':'text/plain'}
assets=[['/'+p.name,dict(content=p.read_text(),type=types[p.suffix])] for p in sorted((root/'public').iterdir()) if p.name not in ('login.html','index.html')]
pages=public_assets()
assets.extend([path,dict(type=kind,content=body)] for path,(kind,body) in pages.items())
parts=['const retiredPaths=new Set('+(root/'scripts/retired.json').read_text()+');','const catalogPaths=new Set('+json.dumps([path for path,(kind,_) in pages.items() if kind=='text/html'])+');','const assets=new Map('+json.dumps(assets,ensure_ascii=False)+');','const routes = new Map();']
for p in sorted((root/'handlers').rglob('*.js')):
 route='/api/'+str(p.relative_to(root/'handlers').with_suffix(''))
 src=p.read_text().replace('export const ','const ').replace('export default async function(','async function handle(')
 parts.extend(['{',src,'routes.set('+json.dumps(route)+',{access,methods,handle});','}'])
parts.append((root/'worker/admin.js').read_text())
parts.append((root/'worker/index.js').read_text())
(root/'dist/server/index.js').write_text('\n'.join(parts))
