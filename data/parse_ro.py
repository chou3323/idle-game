#!/usr/bin/env python3
"""Parse saved ro.dvg.cn/monster.php list pages (raw/p*.html) into monsters_ro.json — facts only (numbers/names/rates), no images."""
import re, json, glob, html, os
HERE=os.path.dirname(os.path.abspath(__file__))
ELM={'无':'neutral','水':'water','地':'earth','火':'fire','风':'wind','毒':'poison','圣':'holy','暗':'dark','念':'ghost','不死':'undead'}
RACE={'无形':'formless','鱼贝':'fish','龙':'dragon','动物':'brute','天使':'angel','恶魔':'demon','昆虫':'insect','植物':'plant','不死':'undead','人形':'demihuman'}
SIZE={'小型':'small','中型':'medium','大型':'large'}
def num(s):
    s=re.sub(r'[,\s]','',s or ''); m=re.search(r'-?\d+(\.\d+)?',s); return float(m.group()) if m else None
def parse_block(b):
    m={}
    mm=re.search(r'怪物 ID #(\d+) \(([^)]*)\)',b); 
    if not mm: return None
    m['id']=int(mm.group(1)); m['aegis']=mm.group(2)
    m['name_zh']=html.unescape(re.search(r'font-16">([^<]*)<',b).group(1))
    stats={}
    for k,v in re.findall(r'<span class="">([^<]+)</span>\s*<span class="tw-bg-gray-200 px-2 rounded-pill">([^<]*)</span>',b):
        stats[k.strip()]=v.strip()
    def g(k): return num(stats.get(k))
    m['lv']=g('等级(LV)'); m['exp']=g('基础经验'); m['jexp']=g('职业经验')
    m['race']=RACE.get(stats.get('种族',''),stats.get('种族'))
    e=stats.get('属性','')
    em=re.match(r'(\S+)\s*(\d+)',e)
    m['element']=ELM.get(em.group(1),em.group(1)) if em else None; m['element_lv']=int(em.group(2)) if em else None
    m['size']=SIZE.get(stats.get('体型',''),stats.get('体型'))
    for a,k in (('str','Str'),('int','Int'),('agi','Agi'),('dex','Dex'),('vit','Vit'),('luk','Luk')): m[a]=g(k)
    m['hp']=g('HP'); m['def']=g('防御力'); m['mdef']=g('魔法防御')
    at=re.match(r'\s*([\d,]+)\s*~\s*([\d,]+)',stats.get('攻击力','')); m['atk']=[int(x.replace(',','')) for x in at.groups()] if at else None
    at=re.match(r'\s*([\d,]+)\s*~\s*([\d,]+)',stats.get('魔法攻击力','')); m['matk']=[int(x.replace(',','')) for x in at.groups()] if at else None
    m['range']=g('攻击距离'); m['hit100']=g('100%命中'); m['flee95']=g('95%回避')
    m['aspd_hits_s']=g('攻击速度'); m['move_tiles_s']=g('移动速度')
    drops=[]
    for it,nm,rt in re.findall(r"data-itemid='(\d+)'[^>]*>(?:<img[^>]*>)?\s*([^<(]+?)\s*\(([\d.]+)%\)",b):
        drops.append({'item_id':int(it),'name_zh':html.unescape(nm.strip()),'rate':float(rt)})
    m['drops']=drops
    em_={}
    for nm,pct in re.findall(r'class="bg-color-\w+[^"]*">([^<]+)<span class="tw-bg-gray-200 px-1 rounded-pill[^"]*">(-?\d+) %</span>',b):
        key=nm.replace('属性','').strip(); em_[ELM.get(key,key)]=int(pct)
    m['elem_table']=em_
    mp=re.search(r'出现地图(.*?)(?:</div>\s*</div>)',b,re.S)
    maps=[]
    if mp: maps=[html.unescape(x.strip()) for x in re.findall(r'>([^<>]+)</a>',mp.group(1)) if x.strip()]
    m['spawn_maps']=sorted(set(maps))
    return m
def main():
    out={};
    for f in sorted(glob.glob(os.path.join(HERE,'raw','p*.html'))):
        h=open(f,encoding='utf8').read()
        for b in h.split('tw-rounded-lg tw-border tw-border-blue-400')[1:]:
            m=parse_block(b)
            if m: out[m['id']]=m
    arr=[out[k] for k in sorted(out)]
    json.dump(arr,open(os.path.join(HERE,'monsters_ro.json'),'w',encoding='utf8'),ensure_ascii=False,indent=0,separators=(',',':'))
    print(len(arr),'monsters')
if __name__=='__main__': main()
