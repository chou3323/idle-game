/* Aurevia horde prototype — game data (all fake / prototype values). Names are Aurevia-original, no official RO names.
 * Asset *files* are mapped in assets/manifest.json (see README "換成官方風格素材"); this file only has stats/behaviour/text. */
window.HD=window.HD||{};
HD.D=(function(){
const TIERS=[{id:1,name:'初級',lv:[10,30],hp:480,atk:1,exp:1,zeny:[3,8],clv:[30,60]},
             {id:2,name:'中級',lv:[38,62],hp:1500,atk:2.6,exp:2.2,zeny:[10,20],clv:[55,85]},
             {id:3,name:'高級',lv:[66,92],hp:3600,atk:5.5,exp:4,zeny:[25,45],clv:[80,110]}];
// body template → behaviour & stats multipliers. beh: chase|charger|flyer|ranged|static|tank
const TPL={
 bunny:{beh:'charger',hp:1,spd:1.05,scale:.85,tag:'衝撞'},
 blob: {beh:'tank',   hp:1.8,spd:.6, scale:1.0,tag:'黏液・厚血'},
 bee:  {beh:'flyer',  hp:.7,spd:1.5,scale:.8, tag:'飛行・迅捷'},
 beetle:{beh:'chase', hp:1.5,spd:.8,scale:.92,tag:'硬殼'},
 mush: {beh:'ranged', hp:1,spd:.7, scale:.92,tag:'遠程孢子'},
 ghost:{beh:'flyer',  hp:.9,spd:.8, scale:.95,tag:'飄浮'},
 bat:  {beh:'flyer',  hp:.6,spd:1.7,scale:.82,tag:'飛行・群居'},
 snake:{beh:'chase',  hp:.8,spd:1.3,scale:.88,tag:'迅捷'},
 crab: {beh:'charger',hp:1.3,spd:.9,scale:.95,tag:'橫衝・硬殼'},
 golem:{beh:'tank',   hp:3.2,spd:.45,scale:1.28,tag:'巨大・極厚血'},
 plant:{beh:'static', hp:1.6,spd:0, scale:1.02,tag:'固定・遠程'},
 fox:  {beh:'chase',  hp:.7,spd:1.6,scale:.9, tag:'群居・迅捷'}};
const MATS={bunny:['軟毛','霜絨','焰絨'],blob:['黏液','冰凝膠','熔岩膠'],bee:['蜂蜜','冰針','火針'],beetle:['甲殼片','岩甲片','赤焰甲片'],mush:['蘑菇傘','藍幽孢子','灼熱孢子'],
 ghost:['霧布','寒魂碎片','怨靈殘片'],bat:['蝠翼','洞蝠牙','暗影翼'],snake:['蛇皮','毒鱗','烈焰鱗'],crab:['蟹鉗','岩蟹殼','熔殼'],golem:['苔石','水晶塊','熔岩核'],
 plant:['花蜜','棘刺','灰燼花瓣'],fox:['狐尾','雪狐毛','煉獄尾']};
const NAMES={bunny:['花兔','霜兔','焰兔'],blob:['綠團','冰凝團','熔岩團'],bee:['蜜蜂','冰針蜂','火針蜂'],beetle:['甲蟲','岩甲蟲','赤焰甲'],mush:['紅傘菇','藍幽菇','灼熱菇'],
 ghost:['霧靈','寒魂','怨靈'],bat:['灰蝠','洞穴蝠','暗影蝠'],snake:['草蛇','毒鱗蛇','烈焰蛇'],crab:['沙蟹','岩蟹','熔殼蟹'],golem:['苔石怪','水晶石魔','熔岩巨像'],
 plant:['食人花','刺棘花','灰燼花'],fox:['小狐','雪狐','煉獄狐']};
const ORDER=['bunny','blob','bee','beetle','mush','ghost','bat','snake','crab','golem','plant','fox'];
const MOBS={};
TIERS.forEach((T,ti)=>ORDER.forEach((tpl,i)=>{const id='t'+T.id+'_'+(tpl==='blob'?'slime':tpl);const b=TPL[tpl];
  MOBS[id]={id,tier:T.id,tpl,n:NAMES[tpl][ti],beh:b.beh,hpMul:b.hp,spdMul:b.spd,scale:b.scale,tag:b.tag,mat:MATS[tpl][ti]}}));
// maps: weights per mob (12 per tier); boss: image + optional recolor
const W=a=>a;
const MAPS=[
 {id:'f1',n:'霧沼濕地 08',tier:1,theme:'field', lv:'10–30',w:W([3,3,2,2,2,1,1,2,1,1,1,2]),boss:{n:'風嘯獅鷲',img:'hills_boss'}},
 {id:'d1',n:'琥珀沙原 03',tier:1,theme:'desert',lv:'12–30',w:W([1,2,3,3,1,2,2,3,3,2,2,1]),boss:{n:'沙暴獅鷲',img:'hills_boss',hue:35}},
 {id:'c2',n:'幽影洞窟 B2',tier:2,theme:'cave',  lv:'38–62',w:W([1,3,2,3,3,2,3,2,2,3,1,1]),boss:{n:'石翼龍',img:'cave_boss'}},
 {id:'s2',n:'霜牙雪原 05',tier:2,theme:'snow',  lv:'40–62',w:W([3,2,2,1,1,3,1,1,2,2,2,3]),boss:{n:'霜翼龍',img:'cave_boss',hue:150}},
 {id:'l3',n:'熔岩深淵 01',tier:3,theme:'lava',  lv:'66–92',w:W([2,3,2,3,2,1,2,3,3,3,1,2]),boss:{n:'熔岩龍',img:'magma_boss'}},
 {id:'r3',n:'星墜廢墟 07',tier:3,theme:'ruins', lv:'68–92',w:W([1,1,2,2,2,3,3,2,1,2,3,3]),boss:{n:'星墜龍',img:'magma_boss',hue:250}}];
// jobs
const JOBS={kni:{n:'騎士',wk:'sword'},lnc:{n:'槍兵',wk:'spear'},mer:{n:'商人',wk:'axe'},mnk:{n:'武僧',wk:'fist'},acl:{n:'服事',wk:'staff'},arc:{n:'法師',wk:'staff'},
 rgr:{n:'遊俠',wk:'bow'},brd:{n:'吟遊',wk:'harp'},dnc:{n:'舞者',wk:'whip'},gun:{n:'槍手',wk:'gun'},hsn:{n:'刺客',wk:'dagger'}};
const EL={fire:{c1:'#ff8a2a',c2:'#ffe27a',num:'o',n:'火'},ice:{c1:'#6fcfff',c2:'#ffffff',num:'b',n:'水'},bolt:{c1:'#ffe14a',c2:'#ffffff',num:'c',n:'雷'},
 holy:{c1:'#fff0a0',c2:'#ffffff',num:'c',n:'聖'},wind:{c1:'#8af0b0',c2:'#eafff2',num:'g',n:'風'},earth:{c1:'#d2a35c',c2:'#f4e0b0',num:'o',n:'地'},
 poison:{c1:'#9ae04a',c2:'#e6ffb0',num:'g',n:'毒'},dark:{c1:'#a45ae8',c2:'#e4c8ff',num:'p',n:'闇'},phys:{c1:'#ffffff',c2:'#cfe2ff',num:'w',n:'無'},
 pink:{c1:'#ff9ad0',c2:'#ffe0f0',num:'k',n:'念'},gold:{c1:'#ffd84a',c2:'#fff5c0',num:'c',n:'無'},heal:{c1:'#7dffa8',c2:'#eafff2',num:'g',n:'治'}};
// skill: [name, kind, el, cd(s), sp, mult, radius, count]
const K={bolt:'射擊/彈道',nova:'範圍爆發',pillar:'落雷柱',meteor:'隕落',arrows:'箭雨',wave:'斬擊波',heal:'治療',buff:'增益'};
const SK={
 arc:[['火焰箭','bolt','fire',2.2,8,1.5,36,3],['冰霜新星','nova','ice',5,18,1.7,86,0],['雷神之怒','pillar','bolt',7,26,2.8,62,0],['隕石風暴','meteor','fire',12,40,2.4,52,4]],
 kni:[['旋風斬','nova','phys',4,10,1.6,70,0],['破甲斬','wave','phys',3,8,2.1,0,0],['戰吼','buff','gold',20,20,0,0,0],['聖光衝擊','pillar','holy',9,24,2.6,62,0]],
 lnc:[['貫穿突刺','wave','phys',3,8,2.2,0,0],['龍息','bolt','fire',5,16,2.0,40,2],['旋槍','nova','phys',5,12,1.5,76,0],['天槍降臨','pillar','holy',10,30,3.0,60,0]],
 mer:[['金幣風暴','arrows','gold',6,14,1.5,64,0],['重擊','wave','phys',3,8,2.0,0,0],['加速','buff','gold',20,16,0,0,0],['爆裂錢袋','meteor','gold',11,30,2.0,46,3]],
 mnk:[['氣彈','bolt','holy',2.4,8,1.4,30,3],['連環拳','wave','phys',2.5,8,2.0,0,0],['阿修羅','nova','holy',9,30,2.8,92,0],['金剛','buff','holy',20,18,0,0,0]],
 acl:[['治癒術','heal','heal',6,16,0,150,0],['聖光','pillar','holy',6,16,2.0,56,0],['神佑','buff','holy',25,26,0,0,0],['驅魔','nova','holy',8,22,1.8,92,0]],
 rgr:[['箭雨','arrows','wind',5,14,1.5,68,0],['連射','bolt','wind',2.2,8,1.3,28,3],['地雷陷阱','nova','earth',7,18,2.2,70,0],['鷹眼','buff','wind',20,16,0,0,0]],
 brd:[['戰歌','buff','pink',20,18,0,0,0],['音波','nova','dark',6,16,1.7,92,0],['治癒樂章','heal','heal',8,22,0,150,0],['彈奏','bolt','pink',2.4,8,1.4,30,3]],
 dnc:[['舞步','buff','pink',20,16,0,0,0],['花瓣風暴','nova','pink',6,18,1.8,90,0],['魅惑','bolt','pink',3,10,1.5,34,2],['劍舞','wave','pink',3,10,2.0,0,0]],
 gun:[['連射','bolt','phys',2.2,8,1.2,24,3],['榴彈','meteor','fire',9,24,2.0,44,2],['暴風射擊','nova','wind',6,18,1.7,80,0],['狙擊','bolt','phys',5,16,3.4,26,1]],
 hsn:[['影襲','wave','dark',3,8,2.1,0,0],['毒霧','nova','poison',6,16,1.6,84,0],['暗殺','wave','phys',5,14,3.2,0,0],['隱身','buff','dark',20,14,0,0,0]]};
const SKILLS={};for(const j in SK)SKILLS[j]=SK[j].map((a,i)=>({id:j+'_'+i,i,n:a[0],kind:a[1],el:a[2],cd:a[3],sp:a[4],mul:a[5],r:a[6],cnt:a[7]||1}));
// ---- equipment ----
const GRADES=[{n:'普通',c:'#ffffff',d:'#59607a'},{n:'優良',c:'#62e07a',d:'#1f9a3a'},{n:'稀有',c:'#6fc3ff',d:'#1f6fd0'},{n:'史詩',c:'#d49bff',d:'#8a3fcf'},{n:'傳說',c:'#ffb04a',d:'#d9760a'}];
const SLOTS=[{id:'head',n:'頭飾'},{id:'weapon',n:'武器'},{id:'armor',n:'鎧甲'},{id:'shoes',n:'鞋子'},{id:'cloak',n:'披肩'},{id:'shield',n:'副手'},{id:'acc1',n:'飾品'},{id:'acc2',n:'飾品'}];
const PFX=['訓練','鋼製','霜牙','熔鋒','星墜'];
const WK={sword:'長劍',dagger:'匕首',spear:'長槍',bow:'長弓',staff:'法杖',axe:'戰斧',fist:'拳套',harp:'豎琴',whip:'長鞭',gun:'火銃'};
const WATK=[12,26,48,82,130],WMATK=[8,20,40,70,112];
const ITEMS={};
function add(id,o){ITEMS[id]=Object.assign({id,s:{}},o);}
for(let t=0;t<5;t++){
  for(const wk in WK){const mg=(wk==='staff'||wk==='harp');add('wp_'+wk+'_'+t,{slot:'weapon',kind:wk,tier:t,n:PFX[t]+WK[wk],s:mg?{matk:WMATK[t],atk:Math.round(WATK[t]*.35)}:{atk:WATK[t],crit:t>=2?t:0}})}
  add('hd_'+t,{slot:'head',kind:'helm',tier:t,n:['訓練髮帶','鋼盔','霜牙頭冠','熔鋒角盔','星墜王冠'][t],s:{def:[2,5,9,15,24][t],hp:[20,60,140,260,450][t]}});
  add('sh_'+t,{slot:'shield',kind:'shield',tier:t,n:['木盾','鐵盾','霜紋盾','熔岩盾','星墜聖盾'][t],s:{def:[3,7,13,22,36][t],hp:[0,30,70,140,240][t]}});
  add('ar_'+t,{slot:'armor',kind:'armor',tier:t,n:['布衣','皮甲','霜紋鎧','熔鋼鎧','星墜戰甲'][t],s:{def:[4,10,18,30,48][t],hp:[30,90,200,380,640][t]}});
  add('ck_'+t,{slot:'cloak',kind:'cloak',tier:t,n:['舊披肩','旅行披風','霜絨披風','赤焰披風','星墜斗篷'][t],s:{def:[1,3,6,10,16][t],hp:[10,30,60,120,200][t]}});
  add('sw_'+t,{slot:'shoes',kind:'boots',tier:t,n:['草鞋','皮靴','霜行靴','熔鐵靴','星墜之靴'][t],s:{def:[1,3,6,10,16][t],aspd:[0,1,2,3,5][t]}});
  add('rg_'+t,{slot:'acc',kind:'ring',tier:t,n:['銅戒','銀戒','霜晶戒','熔岩戒指','星墜指環'][t],s:{crit:[1,2,4,6,9][t],atk:[0,3,8,14,22][t]}});
  add('am_'+t,{slot:'acc',kind:'amulet',tier:t,n:['木墜飾','銀墜飾','霜晶墜飾','熔岩項鍊','星墜項鍊'][t],s:{hp:[25,70,150,280,480][t],matk:[0,3,8,14,22][t]}});
}
const STAT_N={atk:'ATK',matk:'MATK',def:'DEF',hp:'HP',crit:'CRI',aspd:'ASPD'};
const BAGMAT_VALUE=4;
function sellValue(it){return 20+it.tier*it.tier*60+(it.ref||0)*15}
return {TIERS,TPL,MOBS,MAPS,JOBS,EL,SKILLS,K,GRADES,SLOTS,ITEMS,STAT_N,WK,ORDER,BAGMAT_VALUE,sellValue,
  mapById:id=>MAPS.find(m=>m.id===id),
  behName:{charger:'衝撞',tank:'重甲',flyer:'飛行',ranged:'遠程',static:'固定',chase:'追擊'}};
})();
