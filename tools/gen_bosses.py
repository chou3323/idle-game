#!/usr/bin/env python3
"""Original chibi pixel BOSSES (griffin + two drakes), procedurally drawn — no official / reference art used.
Output: assets/mobs/{hills,cave,magma}_boss.png  (single frame 192x160, baseline y=148).  Run: python3 tools/gen_bosses.py"""
import os
from PIL import Image, ImageDraw
OUT=os.path.join(os.path.dirname(__file__),'..','assets','mobs')
W,H,UP=96,80,2
def hx(s): s=s.lstrip('#'); return tuple(int(s[i:i+2],16) for i in (0,2,4))
def mix(a,b,t): return tuple(int(a[i]+(b[i]-a[i])*t) for i in range(3))
WHITE=(255,255,255)
BODY,BELLY,ACC,EYEW,PUP,BLUSH,DARK,WING,ACC2,TEETH=1,2,3,4,5,6,7,8,9,10
class Cv:
    def __init__(s): s.im=Image.new('L',(W,H),0); s.d=ImageDraw.Draw(s.im)
    def E(s,cx,cy,rx,ry,l): s.d.ellipse([cx-rx,cy-ry,cx+rx,cy+ry],fill=l)
    def R(s,x0,y0,x1,y1,l): s.d.rectangle([x0,y0,x1,y1],fill=l)
    def P(s,pts,l): s.d.polygon(pts,fill=l)
    def L(s,pts,l,w=1): s.d.line(pts,fill=l,width=w)
    def over(s,l_on,fn):
        tmp=s.im.copy(); fn(ImageDraw.Draw(tmp)); a=s.im.load(); b=tmp.load()
        for y in range(H):
            for x in range(W):
                if a[x,y]==l_on: a[x,y]=b[x,y]
def griffin(c,t):
    f=t*3
    # far wing + near wing (flap)
    c.P([(58,40),(66,10-f),(80,2-f),(90,12-f),(86,26),(76,38)],WING)
    c.P([(46,38),(48,12-f),(58,6-f),(66,16-f),(64,34)],WING)
    c.over(WING,lambda d:[d.line([(62+i*5,38),(70+i*5,14-f+i*2)],fill=BELLY,width=1) for i in range(4)])
    # tail + tuft
    c.L([(74,50),(84,46),(90,38)],BODY,3); c.E(91,34,4,5,ACC)
    # legs
    c.E(70,66,7,9,BODY); c.E(68,74,7,3,BELLY)
    c.E(40,66,6,9,BODY); c.E(38,74,7,3,BELLY)
    c.E(60,68,6,8,BODY); c.E(58,74,6,3,BELLY)
    # body
    c.E(54,52,23,14,BODY); c.E(48,60,14,7,BELLY)
    # mane + head
    c.E(36,42,17,15,ACC); c.E(26,35,15,14,BODY)
    c.over(ACC,lambda d:[d.polygon([(30+i*6,26),(33+i*6,18),(36+i*6,28)],fill=ACC) for i in range(4)])
    # leaf crown
    for x in (18,24,30): c.E(x,21,3,2,ACC2)
    c.E(24,22,2,1,ACC)
    # beak
    c.P([(13,34),(3,40),(14,45)],ACC2); c.L([(5,40),(13,40)],DARK)
    # eye (big, with dark pupil + highlight handled by shading) and cheek
    c.R(17,28,25,38,EYEW); c.R(18,30,24,38,PUP); c.R(19,29,20,30,EYEW)
    c.R(26,27,33,30,DARK)
    c.E(18,44,3,2,BLUSH)
def drake(c,t):
    b=t
    # tail
    c.P([(70,46),(86,50),(94,42),(92,58),(76,62)],BODY); c.P([(90,44),(96,38),(94,50)],ACC)
    # wings
    f=t*3
    c.P([(48,38),(52,8-f),(64,22-f),(74,10-f),(84,36)],WING)
    c.over(WING,lambda d:[d.line([(52,38),(52+i*8,10-f+(3 if i else 0))],fill=DARK,width=1) for i in (1,2,3)])
    # back legs / front legs
    c.E(66,66,8,9,BODY); c.E(64,74,8,3,BELLY)
    c.E(36,66,7,9,BODY); c.E(34,74,8,3,BELLY)
    c.E(48,68,6,8,BODY)
    # body
    c.E(52,50+b,22,16,BODY); c.E(46,58+b,13,8,BELLY)
    # back spikes
    for i,x in enumerate((38,46,54,62)): c.P([(x,38+b),(x+4,28+b-(i%2)*2),(x+8,38+b)],ACC2)
    # head
    c.E(24,38+b,16,13,BODY); c.E(11,44+b,9,6,BODY)
    c.R(6,46+b,18,47+b,DARK)
    for x in (8,12,16): c.P([(x,47+b),(x+1,50+b),(x+2,47+b)],TEETH)
    # horns
    c.P([(26,28+b),(20,12+b),(32,26+b)],ACC); c.P([(14,30+b),(6,18+b),(20,29+b)],ACC)
    # eye + brow + nostril
    c.R(18,33+b,26,43+b,EYEW); c.R(19,35+b,25,43+b,PUP); c.R(20,34+b,21,35+b,EYEW)
    c.R(16,30+b,27,32+b,DARK); c.R(6,42+b,7,43+b,DARK)
    c.E(16,48+b,3,2,BLUSH)
def deco(c,kind):
    if kind=='cracks':
        c.over(BODY,lambda d:[d.line([(40+i*6,40+(i%2)*6),(44+i*6,56)],fill=ACC2,width=1) for i in range(4)])
    if kind=='frost':
        pass
def render(fn,pal,deco_kind=None,t=0):
    c=Cv(); fn(c,t); deco(c,deco_kind); lab=c.im; L=lab.load()
    P={BODY:pal['body'],BELLY:pal['belly'],ACC:pal['acc'],EYEW:WHITE,PUP:pal.get('pup',(30,26,40)),BLUSH:pal.get('blush',(255,150,160)),DARK:pal['dark'],WING:pal['wing'],ACC2:pal['acc2'],TEETH:WHITE}
    sil=lambda x,y:0<=x<W and 0<=y<H and L[x,y]!=0
    out=Image.new('RGBA',(W,H),(0,0,0,0)); o=out.load(); ol=mix(pal['body'],(25,20,40),.62)
    for y in range(H):
        for x in range(W):
            l=L[x,y]
            if not l: continue
            col=P[l]
            if l in (BODY,BELLY,ACC,WING,ACC2):
                if not sil(x-1,y-1) or (not sil(x-1,y) and not sil(x,y-1)): col=mix(col,WHITE,.5)
                elif not sil(x-2,y-2) or not sil(x-1,y) or not sil(x,y-1): col=mix(col,WHITE,.2)
                elif not sil(x+1,y+1) or not sil(x+1,y) or not sil(x,y+1): col=mix(col,(40,30,70),.32)
                elif not sil(x+2,y+2) or not sil(x+2,y+1): col=mix(col,(40,30,70),.14)
            o[x,y]=col+((205 if l==WING else 255),)
    base=out.copy(); b=base.load()
    for y in range(H):
        for x in range(W):
            if b[x,y][3]: continue
            for dx,dy in ((1,0),(-1,0),(0,1),(0,-1)):
                xx,yy=x+dx,y+dy
                if 0<=xx<W and 0<=yy<H and b[xx,yy][3]: o[x,yy if False else y]=ol+(255,); break
    return out.resize((W*UP,H*UP),Image.NEAREST)
def P_(**k): return {a:(hx(b) if isinstance(b,str) else b) for a,b in k.items()}
BOSSES={
 'hills_boss':(griffin,P_(body='#fff1d8',belly='#fff9ee',acc='#e9ae52',acc2='#ffd84a',dark='#6a4a2a',wing='#eef6ff',pup='#2a3a6a'),None),
 'cave_boss':(drake,P_(body='#a4a2c0',belly='#dcd8f0',acc='#6c6a96',acc2='#c2b0ff',dark='#2a2840',wing='#7a6aa8',pup='#8a50ff'),None),
 'magma_boss':(drake,P_(body='#7a4040',belly='#ffb878',acc='#3a2020',acc2='#ffb030',dark='#1e0e0e',wing='#a04a30',pup='#ff7a1a',blush='#ff9a5a'),'cracks'),
}
def main():
    sheet=Image.new('RGBA',(W*UP*3,H*UP),(150,200,120,255))
    for i,(k,(fn,pal,dk)) in enumerate(BOSSES.items()):
        im=render(fn,pal,dk); im.save(os.path.join(OUT,k+'.png'),optimize=True); sheet.alpha_composite(im,(i*W*UP,0))
    sheet.save(os.path.join(OUT,'_boss_preview.png'))
if __name__=='__main__': main()
