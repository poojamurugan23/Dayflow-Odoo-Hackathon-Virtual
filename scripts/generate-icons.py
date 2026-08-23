from PIL import Image, ImageDraw, ImageFont, ImageFilter
PLUM=(0x50,0x2D,0x55); MAUVE=(0x93,0x50,0x73); CREAM=(0xF6,0xDB,0xC0); PAPER=(0xF8,0xF4,0xE9)
def lerp(a,b,t): return tuple(int(a[i]+(b[i]-a[i])*t) for i in range(3))
def stop(t): return lerp(PLUM,MAUVE,t/0.42) if t<=0.42 else lerp(MAUVE,CREAM,(t-0.42)/0.58)
def find_font(s):
    for p in ["/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
              "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf"]:
        try: return ImageFont.truetype(p,s)
        except OSError: continue
    return ImageFont.load_default()
def icon(px, maskable=False):
    g=Image.new("RGB",(64,64)); gd=g.load()
    for y in range(64):
        for x in range(64): gd[x,y]=stop(min(1.0,max(0.0,(x+y)/126)))
    im=g.resize((px,px),Image.BICUBIC).filter(ImageFilter.GaussianBlur(px/160))
    glyph = 0.52 if maskable else 0.62   # leaves a safe margin when cropped round
    f=find_font(int(px*glyph))
    sh=Image.new("RGBA",(px,px),(0,0,0,0))
    ImageDraw.Draw(sh).text((px/2,px*0.455),"D",font=f,fill=(0x24,0x18,0x26,100),anchor="mm")
    im=Image.alpha_composite(im.convert("RGBA"), sh.filter(ImageFilter.GaussianBlur(px/40))).convert("RGB")
    d=ImageDraw.Draw(im)
    d.text((px/2,px*0.455),"D",font=f,fill=PAPER,anchor="mm")
    bw,bh=px*0.26,max(2,px*0.048)
    d.rounded_rectangle([px/2-bw/2,px*0.775-bh/2,px/2+bw/2,px*0.775+bh/2],radius=bh/2,fill=CREAM)
    return im
for s in (192,512): icon(s).save(f"public/icons/icon-{s}.png")
icon(512,maskable=True).save("public/icons/icon-maskable-512.png")
icon(180).save("public/icons/apple-touch-icon.png")
icon(96).resize((32,32),Image.LANCZOS).save("public/icons/favicon-32.png")
print("done")
