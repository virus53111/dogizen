"""Build brand PNG/ICO/ICNS inputs and social preview from source SVG.

Generated files stay out of Git; Pages, Android and desktop CI build them.
Requires: Pillow and either a trusted pre-rendered PNG (preferred for packaging) or CairoSVG.
"""
from pathlib import Path
from io import BytesIO
from PIL import Image, ImageDraw, ImageFont
import os

ROOT = Path(__file__).resolve().parents[1]
SVG = ROOT / "assets/murdilimax-icon.svg"
OUT = ROOT / "assets/generated"
OUT.mkdir(parents=True, exist_ok=True)

external_png = os.environ.get("MURDILIMAX_BRAND_PNG")
if external_png:
    source = Image.open(external_png).convert("RGBA")
    if source.size != (1024, 1024):
        raise ValueError("MURDILIMAX_BRAND_PNG must be 1024x1024")
else:
    import cairosvg
    raw = cairosvg.svg2png(bytestring=SVG.read_bytes(), output_width=1024, output_height=1024)
    source = Image.open(BytesIO(raw)).convert("RGBA")

def icon(size, path):
    image = source.resize((size, size), Image.Resampling.LANCZOS)
    path.parent.mkdir(parents=True, exist_ok=True)
    image.save(path, optimize=True)
    return image

icon(32, ROOT / "favicon.png")
icon(180, ROOT / "apple-touch-icon.png")
for size in (180, 192, 512):
    icon(size, ROOT / f"mobile/icon-{size}.png")
icon(512, OUT / "app-icon-512.png")
source.save(OUT / "murdilimax.ico", format="ICO", sizes=[(16,16),(32,32),(48,48),(64,64),(128,128),(256,256)])
sizes = [(16,1),(16,2),(32,1),(32,2),(128,1),(128,2),(256,1),(256,2),(512,1),(512,2)]
iconset = OUT / "Murdilimax.iconset"
iconset.mkdir(exist_ok=True)
for size, scale in sizes:
    name = f"icon_{size}x{size}" + ("@2x" if scale==2 else "") + ".png"
    icon(size*scale, iconset/name)

# Open Graph / social sharing: 1200×630 readable raster, no external image source.
w,h = 1200,630
og = Image.new("RGB", (w,h))
px = og.load()
for y in range(h):
    for x in range(w):
        t=x/w
        v=y/h
        px[x,y] = (
            int(34+90*t+20*v),
            int(23+21*t+6*v),
            int(99+110*t+33*v)
        )
draw = ImageDraw.Draw(og)
draw.rounded_rectangle((60,55,1140,575), radius=45, outline=(208,179,255), width=2)
tile = source.resize((345,345),Image.Resampling.LANCZOS)
og.paste(tile,(774,135),tile)
fonts=[
 "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
 "/System/Library/Fonts/Supplemental/Arial Bold.ttf",
 "C:/Windows/Fonts/arialbd.ttf"
]
fontfile=next((p for p in fonts if Path(p).is_file()),None)
if fontfile:
    large=ImageFont.truetype(fontfile,67)
    mid=ImageFont.truetype(fontfile,36)
    tiny=ImageFont.truetype(fontfile,23)
else:
    large=mid=tiny=ImageFont.load_default()
draw.text((105,185),"MURDILIMAX",font=large,fill=(255,255,255))
draw.text((106,275),"BROWSER STUDIO",font=mid,fill=(229,198,255))
draw.text((109,360),"Profiles. Proxies. Workspaces.",font=tiny,fill=(239,229,255))
og.save(ROOT/"og-image.png",optimize=True)
print("Brand outputs generated:", [str(p.relative_to(ROOT)) for p in [ROOT/'favicon.png',ROOT/'apple-touch-icon.png',ROOT/'mobile/icon-192.png',OUT/'murdilimax.ico',ROOT/'og-image.png']])
