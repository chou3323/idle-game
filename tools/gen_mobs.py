#!/usr/bin/env python3
"""Original (non-RO) cute pixel monsters, procedurally drawn. 12 body templates x palette/decoration variants.
Output: assets/mobs/<id>.png  (horizontal strip, FR frames, each 80x80, baseline y=72) + assets/mobs/_sheet.png (preview)
Run:  python3 tools/gen_mobs.py"""
import os, json
from PIL import Image, ImageDraw
OUT=os.path.join(os.path.dirname(__file__),'..','assets','mobs')
N=40; UP=2; FR=2
def hx(s): s=s.lstrip('#'); return tuple(int(s[i:i+2],16) for i in (0,2,4))
def mix(a,b,t): return tuple(int(a[i]+(b[i]-a[i])*t) for i in range(3))
WHITE=(255,255,255)
# ---- label ids ----
BODY,BELLY,ACC,EYEW,PUP,BLUSH,DARK,WING,ACC2,TEETH=1,2,3,4,5,6,7,8,9,10

class Cv:
    def __init__(s):
        s.im=Image.new('L',(N,N),0); s.d=ImageDraw.Draw(s.im); s.anchor={'top':(20,6)}
    def E(s,cx,cy,rx,ry,l): s.d.ellipse([cx-rx,cy-ry,cx+rx,cy+ry],fill=l)
    def R(s,x0,y0,x1,y1,l): s.d.rectangle([x0,y0,x1,y1],fill=l)
    def P(s,pts,l): s.d.polygon(pts,fill=l)
    def L(s,pts,l,w=1): s.d.line(pts,fill=l,width=w)
    def px(s,x,y,l): s.d.point((x,y),fill=l)
    def over(s,l_on,fn):
        """run fn on a scratch canvas and only keep pixels where current label == l_on"""
        tmp=s.im.copy(); d2=ImageDraw.Draw(tmp); fn(d2)
        a=s.im.load(); b=tmp.load()
        for y in range(N):
            for x in range(N):
                if a[x,y]==l_on or (isinstance(l_on,tuple) and a[x,y] in l_on): a[x,y]=b[x,y]
    def eyes(s,pts,big=1):
        for (x,y) in pts:
            s.R(x,y,x+big,y+big+1,EYEW); s.R(x+(0 if big>1 else 0),y+1,x+big-(1 if big>1 else 0)+0,y+big+1,PUP)

# ---------------- body templates (face LEFT). t = frame 0/1 ----------------
def b_blob(c,t):
    y=16+t; c.E(20,26+t*.5,14+t,10-t,BODY); c.R(5,28,35,35,BODY); c.R(0,36,39,39,0)
    c.E(20,31,9,4,BELLY); c.anchor['top']=(20,y)
    for x in (14,26): c.R(x-1,22+t,x+1,26+t,EYEW); c.R(x-1,24+t,x+1,26+t,PUP)
    c.E(10,29,2,1,BLUSH); c.E(30,29,2,1,BLUSH); c.R(19,28,21,28,DARK)
    c.R(11,19+t,14,20+t,TEETH)
def b_bunny(c,t):
    c.E(20,29,11,8,BODY); c.E(20,20,9,8,BODY)
    for ex,sh in ((14,-1),(26,1)):
        c.E(ex+sh*t,9+t,3,8,BODY); c.E(ex+sh*t,9+t,1,5,BLUSH)
    c.E(20,31,6,5,BELLY); c.E(33,31,3,3,TEETH)
    for x in (12,28): c.E(x,35,4,2,BELLY)
    for x in (15,24): c.R(x,18,x+1,21,EYEW); c.R(x,19,x+1,21,PUP)
    c.R(19,22,21,23,BLUSH); c.E(12,23,2,1,BLUSH); c.E(28,23,2,1,BLUSH); c.anchor['top']=(20,12)
def b_bee(c,t):
    c.E(21,23,10,8,BODY)
    c.over(BODY,lambda d:[d.rectangle([x,10,x+2,40],fill=DARK) for x in (17,23)])
    c.E(9,22,6,6,BELLY)
    c.P([(30,22),(36,23),(30,25)],DARK)
    wy=9+t*3
    c.E(15,wy,5,4,WING); c.E(25,wy-1,6,4,WING)
    c.R(8,19,10,22,EYEW); c.R(8,20,10,22,PUP)
    c.L([(8,16),(6,11)],DARK); c.L([(11,16),(11,10)],DARK); c.E(6,10,1,1,DARK); c.E(11,9,1,1,DARK)
    c.E(14,28,2,1,BELLY); c.E(5,25,2,1,BLUSH); c.anchor['top']=(20,8)
def b_beetle(c,t):
    c.E(21,25,13,10,ACC); c.R(0,35,39,39,0)
    c.over(ACC,lambda d:d.line([(21,14),(21,34)],fill=DARK,width=1))
    c.over(ACC,lambda d:[d.ellipse([x-2,y-2,x+2,y+2],fill=ACC2) for x,y in ((15,22),(27,22),(14,29),(28,29))])
    c.E(8,27,6,5,BODY); c.P([(6,23),(1,15),(9,21)],DARK)
    c.R(6,25,8,27,EYEW); c.R(6,26,8,27,PUP)
    for i,x in enumerate((13,19,25)): c.R(x,34,x+1,36+((i+t)%2),DARK)
    c.anchor['top']=(20,14)
def b_mush(c,t):
    c.R(14,19,26,34-t,BELLY); c.E(20,34-t,6,1,BELLY)
    c.over(0,lambda d:None)
    c.E(20,19,16,12,ACC); c.R(0,20,39,39,0); c.R(14,19,26,34-t,BELLY); c.R(13,19,27,20,ACC)
    c.over(ACC,lambda d:[d.ellipse([x-2,y-2,x+2,y+2],fill=ACC2) for x,y in ((11,15),(20,10),(29,14),(24,17))])
    for x in (16,23): c.R(x,24,x+1,28,EYEW); c.R(x,26,x+1,28,PUP)
    c.E(14,29,2,1,BLUSH); c.E(26,29,2,1,BLUSH); c.R(19,29,21,29,DARK)
    c.E(14,35,3,1,BELLY); c.E(26,35,3,1,BELLY); c.anchor['top']=(20,9)
def b_ghost(c,t):
    c.E(20,17,11,11,BODY); c.R(9,17,31,31,BODY)
    for i,x in enumerate((9,15,21,27)):
        c.P([(x,30),(x+3,35+((i+t)%2)),(x+6,30)],BODY)
    c.E(7+t,24,3,3,BODY); c.E(33-t,24,3,3,BODY)
    c.E(20,25,6,4,BELLY)
    for x in (14,23): c.E(x+1,18,2,3,DARK); c.px(x+1,17,TEETH)
    c.E(20,25,2,2,DARK); c.anchor['top']=(20,6)
def b_bat(c,t):
    wy=3*t
    c.P([(14,18),(1,9+wy),(3,21),(7,19),(9,26),(14,24)],ACC); c.P([(26,18),(39,9+wy),(37,21),(33,19),(31,26),(26,24)],ACC)
    c.over(ACC,lambda d:[d.line([(14,18),(3,15+wy)],fill=DARK),d.line([(26,18),(37,15+wy)],fill=DARK)])
    c.E(20,22,7,8,BODY); c.P([(15,15),(14,7),(19,14)],BODY); c.P([(25,15),(26,7),(21,14)],BODY)
    c.E(20,25,4,4,BELLY)
    for x in (16,22): c.R(x,19,x+1,21,EYEW); c.R(x,20,x+1,21,PUP)
    c.px(18,26,TEETH); c.px(18,27,TEETH); c.px(22,26,TEETH); c.px(22,27,TEETH); c.anchor['top']=(20,8)
def b_snake(c,t):
    c.E(20,30,14,5,BODY); c.E(22,25,10,5,BODY); c.R(0,36,39,39,0)
    c.over(BODY,lambda d:[d.polygon([(x,24),(x+3,28),(x,32),(x-3,28)],fill=ACC) for x in (12,20,28)])
    c.E(24,31,6,2,BELLY)
    c.R(11,12,17,26,BODY); c.E(13-t,13,7,6,BODY); c.E(11-t,16,4,3,BELLY)
    c.R(10-t,11,12-t,13,EYEW); c.R(10-t,12,11-t,13,PUP)
    c.L([(6-t,16),(3-t,16)],BLUSH); c.L([(3-t,16),(1-t,14)],BLUSH); c.L([(3-t,16),(1-t,18)],BLUSH)
    c.P([(34,32),(39,34),(33,34)],BODY); c.anchor['top']=(13,7)
def b_crab(c,t):
    c.E(20,27,12,7,ACC); c.E(20,29,8,3,BELLY)
    c.L([(15,21),(15,16)],DARK); c.L([(25,21),(25,16)],DARK)
    for x in (15,25): c.E(x,15,2,2,EYEW); c.px(x,15,PUP); c.px(x,16,PUP)
    cy=22-2*t
    for sx in (-1,1):
        cx=20+sx*16
        c.E(cx,cy,5,4,BODY); c.P([(cx-sx*4,cy-1),(cx+sx*2,cy-8),(cx+sx*5,cy-6),(cx+sx*2,cy-1)],BODY)
        c.L([(20+sx*10,26),(cx-sx*2,cy+2)],DARK)
    for i in range(3):
        for sx in (-1,1):
            c.L([(20+sx*(8+i*2),32),(20+sx*(11+i*3),35+((i+t)%2))],DARK)
    c.E(20,25,3,1,BLUSH); c.anchor['top']=(20,12)
def b_golem(c,t):
    c.R(10,14,30,31,BODY); c.R(14,5,26,15,BODY); c.R(3,15+t,9,29+t,BODY); c.R(31,15-t+1,37,29-t+1,BODY)
    c.R(2,28+t,10,33+t,BODY); c.R(30,28-t+1,38,33-t+1,BODY); c.R(11,31,17,36,BODY); c.R(23,31,29,36,BODY)
    c.over(BODY,lambda d:[d.rectangle([x,y,x+3,y+1],fill=ACC) for x,y in ((11,15),(26,22),(15,28),(5,17),(32,24))])
    c.over(BODY,lambda d:[d.line([(20,16),(18,22),(21,26)],fill=DARK),d.line([(24,6),(23,10)],fill=DARK)])
    c.R(16,9,18,10,ACC2); c.R(22,9,24,10,ACC2); c.R(14,16,26,17,DARK); c.anchor['top']=(20,4)
def b_plant(c,t):
    c.R(18,24,22,35,BELLY); c.E(12,31,5,2,BELLY); c.E(28,28,5,2,BELLY)
    for i in range(6):
        import math
        a=i*math.pi/3+.3; c.E(20+math.cos(a)*10,14+math.sin(a)*8,5,4,ACC2)
    c.E(20,14,10,9,ACC)
    mo=3+2*t
    c.E(20,16,7,mo,DARK); c.R(14,13,26,14,ACC)
    for x in (15,19,23): c.P([(x,14),(x+2,14),(x+1,17)],TEETH)
    for x in (15,24): c.R(x,8,x+1,11,EYEW); c.R(x,9,x+1,11,PUP)
    c.anchor['top']=(20,4)
def b_fox(c,t):
    c.E(23,27,11,7,BODY); c.P([(31,22),(39,16),(38,28),(32,27)],BODY); c.P([(38,17),(39,16),(38,24),(36,21)],TEETH)
    c.E(11,21,7,6,BODY); c.E(5,24,3,2,BELLY); c.E(10,26,5,3,BELLY)
    c.P([(7,17),(8,8),(13,16)],BODY); c.P([(13,16),(16,9),(18,18)],BODY); c.P([(8,16),(9,11),(11,16)],BLUSH)
    c.R(9,20,10,22,EYEW); c.R(9,21,10,22,PUP); c.px(3,23,DARK); c.px(2,23,DARK)
    for i,x in enumerate((15,19,27,31)): c.R(x,31,x+2,35+((i+t)%2),BODY if i%2==0 else BELLY)
    c.anchor['top']=(12,7)
TEMPL={'blob':b_blob,'bunny':b_bunny,'bee':b_bee,'beetle':b_beetle,'mush':b_mush,'ghost':b_ghost,'bat':b_bat,'snake':b_snake,'crab':b_crab,'golem':b_golem,'plant':b_plant,'fox':b_fox}

# ---------------- decorations (use anchor top) ----------------
def deco(c,kind,pal):
    if not kind: return
    x,y=c.anchor['top']
    if kind=='horns':
        c.P([(x-7,y+4),(x-9,y-4),(x-4,y+2)],DARK); c.P([(x+7,y+4),(x+9,y-4),(x+4,y+2)],DARK)
    elif kind=='crown':
        c.P([(x-6,y+1),(x-6,y-4),(x-3,y-1),(x,y-5),(x+3,y-1),(x+6,y-4),(x+6,y+1)],TEETH if False else ACC2); 
    elif kind=='flame':
        c.P([(x-4,y+2),(x-3,y-4),(x-1,y-1),(x,y-7),(x+2,y-2),(x+4,y-5),(x+5,y+2)],ACC2)
    elif kind=='frost':
        for dx in (-6,-2,2,6): c.P([(x+dx-1,y+3),(x+dx,y-3),(x+dx+1,y+3)],TEETH)
    elif kind=='spikes':
        for dx in (-7,-3,1,5): c.P([(x+dx,y+4),(x+dx+2,y-2),(x+dx+4,y+4)],DARK)
    elif kind=='leaf':
        c.E(x,y-1,3,2,ACC2); c.L([(x,y),(x,y+3)],DARK)
    elif kind=='gem':
        c.P([(x,y-4),(x+3,y),(x,y+4),(x-3,y)],ACC2)
# ---------------- render ----------------
def render_frame(tpl,t,pal,dec):
    c=Cv(); TEMPL[tpl](c,t); deco(c,dec,pal)
    lab=c.im; W=lab.load()
    P={BODY:pal['body'],BELLY:pal['belly'],ACC:pal['acc'],EYEW:WHITE,PUP:(30,26,40),BLUSH:pal.get('blush',(255,150,160)),DARK:pal['dark'],
       WING:pal.get('wing',(235,245,255)),ACC2:pal['acc2'],TEETH:(255,255,255)}
    sil=lambda x,y:0<=x<N and 0<=y<N and W[x,y]!=0
    out=Image.new('RGBA',(N,N),(0,0,0,0)); o=out.load(); ol=mix(pal['body'],(25,20,40),.62)
    shade_labels=(BODY,BELLY,ACC,WING,ACC2)
    for y in range(N):
        for x in range(N):
            l=W[x,y]
            if l==0: continue
            col=P[l]
            if l in shade_labels:
                # rim light (top-left) / shade (bottom-right), by distance to silhouette edge along the diagonal
                if not sil(x-1,y-1) or (not sil(x-1,y) and not sil(x,y-1)): col=mix(col,WHITE,.55)
                elif not sil(x-2,y-2) or not sil(x-1,y) or not sil(x,y-1): col=mix(col,WHITE,.22)
                elif not sil(x+1,y+1) or not sil(x+1,y) or not sil(x,y+1): col=mix(col,(40,30,70),.34)
                elif not sil(x+2,y+2) or not sil(x+2,y+1): col=mix(col,(40,30,70),.14)
            a=255
            if l==WING: a=200
            o[x,y]=col+(a,)
    # outline
    base=out.copy(); b=base.load()
    for y in range(N):
        for x in range(N):
            if b[x,y][3]: continue
            for dx,dy in ((1,0),(-1,0),(0,1),(0,-1)):
                xx,yy=x+dx,y+dy
                if 0<=xx<N and 0<=yy<N and b[xx,yy][3]: o[x,y]=ol+(255,); break
    # ground shadow-ish ground contact not baked (engine draws shadow)
    return out.resize((N*UP,N*UP),Image.NEAREST)

def P_(body,belly,acc,acc2,dark,**k): 
    d=dict(body=hx(body),belly=hx(belly),acc=hx(acc),acc2=hx(acc2),dark=hx(dark)); d.update({a:hx(b) for a,b in k.items()}); return d
# id, tpl, name, palette, deco
TIERS={
 1:[('t1_bunny','bunny','花兔',P_('#fbe3ee','#fffaf5','#ffb3c8','#ffd1e0','#6a4a5a'),None),
    ('t1_slime','blob','綠團',P_('#9fe3a0','#d6f7c9','#6ccf7d','#ffffff','#2f6a4d',blush='#ffb0b0'),'leaf'),
    ('t1_bee','bee','蜜蜂',P_('#ffd84a','#fff1b0','#ffd84a','#ffffff','#5a3a1a',wing='#e6f4ff'),None),
    ('t1_beetle','beetle','甲蟲',P_('#7a6a5a','#e8d8c0','#4fae6a','#bff0c8','#2b3a2e'),None),
    ('t1_mush','mush','紅傘菇',P_('#ffe9d2','#fff4e6','#ee5a4f','#ffffff','#7a3a3a'),None),
    ('t1_ghost','ghost','霧靈',P_('#eaf4ff','#ffffff','#cfe0ff','#ffffff','#44507a',blush='#ffc0d8'),None),
    ('t1_bat','bat','灰蝠',P_('#9a94b8','#d8d4ec','#b8b0d8','#ffffff','#3c3858'),None),
    ('t1_snake','snake','草蛇',P_('#8fd46a','#f2f7c4','#5eb04a','#ffffff','#2a5a2e',blush='#ff7a8a'),None),
    ('t1_crab','crab','沙蟹',P_('#ffb98a','#ffe4c8','#f58b5a','#ffffff','#6a3a2a'),None),
    ('t1_golem','golem','苔石怪',P_('#b9b6b0','#cfe8b0','#7fbf6a','#ffe27a','#4a4a52'),None),
    ('t1_plant','plant','食人花',P_('#e8c8f0','#a8e08a','#ff7aa8','#ffe27a','#5a2f52'),None),
    ('t1_fox','fox','小狐',P_('#ffb25a','#fff3e0','#ffb25a','#ffffff','#6a3a1a'),None)],
 2:[('t2_bunny','bunny','霜兔',P_('#dff0ff','#ffffff','#a8d4ff','#ffffff','#44608a'),'frost'),
    ('t2_slime','blob','冰凝團',P_('#8fd4ff','#d0f0ff','#5ab4ee','#ffffff','#2a4f8a'),'frost'),
    ('t2_bee','bee','冰針蜂',P_('#b0e0ff','#e8f6ff','#b0e0ff','#ffffff','#2a4a7a',wing='#f4faff'),None),
    ('t2_beetle','beetle','岩甲蟲',P_('#8a8f9a','#d8dce6','#7a82a0','#c8d0f0','#2f3444'),'spikes'),
    ('t2_mush','mush','藍幽菇',P_('#e0e8ff','#f0f4ff','#7a7aee','#d0d8ff','#3a3a7a'),None),
    ('t2_ghost','ghost','寒魂',P_('#c8e8f8','#ffffff','#a0d0ee','#ffffff','#2f5a7a',blush='#a8e0ff'),'frost'),
    ('t2_bat','bat','洞穴蝠',P_('#7a86c8','#c4cdf0','#5a64a8','#ffffff','#262c5a'),'horns'),
    ('t2_snake','snake','毒鱗蛇',P_('#a46ad4','#efd8ff','#7a46b4','#e6ff8a','#3a1f5a',blush='#9aff7a'),None),
    ('t2_crab','crab','岩蟹',P_('#b8a8c8','#e8e0f0','#8a7aa8','#ffffff','#44385a'),'spikes'),
    ('t2_golem','golem','水晶石魔',P_('#a8c8e8','#d0f0ff','#7ab0e8','#7affea','#34506a'),'gem'),
    ('t2_plant','plant','刺棘花',P_('#d0e8c0','#78c868','#5ab0ee','#e8fbff','#2a5a3a'),'spikes'),
    ('t2_fox','fox','雪狐',P_('#f4f8ff','#ffffff','#c8e0ff','#ffffff','#5a6a8a'),None)],
 3:[('t3_bunny','bunny','焰兔',P_('#ffb59a','#ffe3d0','#ff6a4a','#ffd04a','#6a2a22'),'flame'),
    ('t3_slime','blob','熔岩團',P_('#ff9a4a','#ffd88a','#e8502a','#ffe27a','#5a1f12'),'flame'),
    ('t3_bee','bee','火針蜂',P_('#ff8a4a','#ffd0a0','#ff8a4a','#ffe27a','#4a1a10',wing='#ffe8c0'),None),
    ('t3_beetle','beetle','赤焰甲',P_('#6a3a3a','#e8b8a0','#d83a2a','#ffb04a','#2a1414'),'horns'),
    ('t3_mush','mush','灼熱菇',P_('#ffe0b8','#fff0d8','#e8402a','#ffd04a','#6a2a1a'),'flame'),
    ('t3_ghost','ghost','怨靈',P_('#c8b0f0','#eee0ff','#9a7ad8','#ffffff','#3a2a6a',blush='#ff8ad0'),'horns'),
    ('t3_bat','bat','暗影蝠',P_('#4a3a6a','#9a88c8','#6a3a8a','#ff5a8a','#1a1030'),'horns'),
    ('t3_snake','snake','烈焰蛇',P_('#ff6a4a','#ffe0a0','#c8301a','#ffd04a','#4a1410',blush='#ffe040'),'flame'),
    ('t3_crab','crab','熔殼蟹',P_('#e87a5a','#ffd0b0','#6a3a3a','#ffb04a','#2a1414'),'spikes'),
    ('t3_golem','golem','熔岩巨像',P_('#6a5a5a','#8a7a7a','#ff7a2a','#ffe04a','#241818'),'flame'),
    ('t3_plant','plant','灰燼花',P_('#6a5a6a','#7a9a5a','#ff5a3a','#ffd04a','#2a1a2a'),'flame'),
    ('t3_fox','fox','煉獄狐',P_('#7a4a6a','#ffd0e0','#ff5a8a','#ffe27a','#2a1030'),'crown')],
}
def main():
    os.makedirs(OUT,exist_ok=True); info={}
    sheet=Image.new('RGBA',(80*12,80*3),(150,200,120,255))
    for tier,lst in TIERS.items():
        for i,(mid,tpl,name,pal,dec) in enumerate(lst):
            strip=Image.new('RGBA',(N*UP*FR,N*UP),(0,0,0,0))
            for t in range(FR): strip.paste(render_frame(tpl,t,pal,dec),(t*N*UP,0))
            strip.save(os.path.join(OUT,mid+'.png'),optimize=True)
            sheet.alpha_composite(strip.crop((0,0,80,80)),(i*80,(tier-1)*80))
            info[mid]={'tpl':tpl,'name':name}
    sheet.save(os.path.join(OUT,'_preview.png'))
    json.dump(info,open(os.path.join(OUT,'_gen.json'),'w'),ensure_ascii=False,indent=1)
    print(len(info),'sprites')
if __name__=='__main__': main()
