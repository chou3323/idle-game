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
 ghost:['霧布','寒魂碎片','怨靈殘片'],bat:['蝠翼','洞蝠牙','暗影翼'],snake:['蛇皮','毒鱗','烈焰鱗'],crab:['蠍鉗','岩蠍殼','熔殼'],golem:['苔石','水晶塊','熔岩核'],
 plant:['花蜜','棘刺','灰燼花瓣'],fox:['狼尾','雪狼毛','煉獄尾']};
const NAMES={bunny:['花兔','霜兔','焰兔'],blob:['綠團','冰凝團','熔岩團'],bee:['蜜蜂','冰針蜂','火針蜂'],beetle:['甲蟲','岩甲蟲','赤焰甲'],mush:['紅傘菇','藍幽菇','灼熱菇'],
 ghost:['霧靈','寒魂','怨靈'],bat:['灰蝠','洞穴蝠','暗影蝠'],snake:['草蛇','毒鱗蛇','烈焰蛇'],crab:['沙蠍','岩蠍','熔殼蠍'],golem:['苔石怪','水晶石魔','熔岩巨像'],
 plant:['食人花','刺棘花','灰燼花'],fox:['小狼','雪狼','煉獄狼']};
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
const JOBS={kni:{n:'曙光衛士',wk:'sword',role:'坦克／近戰',d:'站在最前線的重甲劍士，旋刃與審判之光掃清近身怪群。'},
 lnc:{n:'穿雲槍騎',wk:'spear',role:'貫穿／爆發',d:'長槍一線貫穿整排敵人，龍炎吐息補足中距離。'},
 mer:{n:'熔金匠師',wk:'axe',role:'範圍／經濟',d:'把金幣當彈藥的匠師，傷害高、掉寶加成。'},
 mnk:{n:'破軍拳師',wk:'fist',role:'連擊／近戰',d:'拳拳連發的氣功師，連擊越高越強。'},
 acl:{n:'晨曦祭司',wk:'staff',role:'治療／聖光',d:'用聖輝與癒光撐住全隊，聖屬性剋制不死與暗系怪。'},
 arc:{n:'星砌術士',wk:'staff',role:'範圍／連鎖',d:'連鎖雷霆與墜星雨製造螢幕級的連殺，血量脆弱。'},
 rgr:{n:'風行獵手',wk:'bow',role:'遠程／風屬',d:'遠距箭雨壓制，陷阱把怪群聚在一起。'},
 brd:{n:'迴響詩人',wk:'harp',role:'輔助／連鎖',d:'音波與弦刃造成範圍傷害，戰歌強化自己。'},
 dnc:{n:'花影舞者',wk:'whip',role:'機動／範圍',d:'花瓣風暴與魅影步，念屬性對暗系與無形怪有效。'},
 gun:{n:'火鳴槍士',wk:'gun',role:'遠程／高傷',d:'榴彈與狙擊的火力派，攻速快。'},
 hsn:{n:'夜隱刺客',wk:'dagger',role:'爆擊／單體',d:'影襲與暗殺的暴擊型，毒霧處理雜兵。'}};
const EL={fire:{c1:'#ff8a2a',c2:'#ffe27a',num:'o',n:'火'},ice:{c1:'#6fcfff',c2:'#ffffff',num:'b',n:'水'},bolt:{c1:'#ffe14a',c2:'#ffffff',num:'c',n:'雷'},
 holy:{c1:'#fff0a0',c2:'#ffffff',num:'c',n:'聖'},wind:{c1:'#8af0b0',c2:'#eafff2',num:'g',n:'風'},earth:{c1:'#d2a35c',c2:'#f4e0b0',num:'o',n:'地'},
 poison:{c1:'#9ae04a',c2:'#e6ffb0',num:'g',n:'毒'},dark:{c1:'#a45ae8',c2:'#e4c8ff',num:'p',n:'闇'},phys:{c1:'#ffffff',c2:'#cfe2ff',num:'w',n:'無'},
 pink:{c1:'#ff9ad0',c2:'#ffe0f0',num:'k',n:'念'},gold:{c1:'#ffd84a',c2:'#fff5c0',num:'c',n:'無'},heal:{c1:'#7dffa8',c2:'#eafff2',num:'g',n:'治'}};
// skill: [name, kind, el, cd(s), sp, mult, radius, count]
const K={chain:'連鎖',bolt:'射擊/彈道',nova:'範圍爆發',pillar:'落雷柱',meteor:'隕落',arrows:'箭雨',wave:'斬擊波',heal:'治療',buff:'增益'};
const SK={
 arc:[['星火箭','bolt','fire',2.2,8,1.5,36,3],['凜冬環','nova','ice',5,18,1.7,86,0],['連鎖雷霆','chain','bolt',6,22,1.9,90,7],['墜星雨','meteor','fire',12,40,2.4,52,4]],
 kni:[['旋刃陣','nova','phys',4,10,1.6,70,0],['破陣斬','wave','phys',3,8,2.1,0,0],['戰旗','buff','gold',20,20,0,0,0],['曙光審判','pillar','holy',9,24,2.6,62,0]],
 lnc:[['穿雲突','wave','phys',3,8,2.2,0,0],['龍炎吐息','bolt','fire',5,16,2.0,40,2],['迴旋槍舞','nova','phys',5,12,1.5,76,0],['天槍降臨','pillar','holy',10,30,3.0,60,0]],
 mer:[['金幣風暴','arrows','gold',6,14,1.5,64,0],['熔鐵重錘','wave','phys',3,8,2.0,0,0],['鍍金加速','buff','gold',20,16,0,0,0],['爆裂錢袋','meteor','gold',11,30,2.0,46,3]],
 mnk:[['氣功彈','bolt','holy',2.4,8,1.4,30,3],['百裂拳','wave','phys',2.5,8,2.0,0,0],['震天掌','nova','holy',9,30,2.8,92,0],['不動心法','buff','holy',20,18,0,0,0]],
 acl:[['癒光','heal','heal',6,16,0,150,0],['聖輝','pillar','holy',6,16,2.0,56,0],['祝福','buff','holy',25,26,0,0,0],['淨罪之環','nova','holy',8,22,1.8,92,0]],
 rgr:[['風暴箭雨','arrows','wind',5,14,1.5,68,0],['疾風連射','bolt','wind',2.2,8,1.3,28,3],['震地陷阱','nova','earth',7,18,2.2,70,0],['獵鷹之眼','buff','wind',20,16,0,0,0]],
 brd:[['戰歌','buff','pink',20,18,0,0,0],['迴響音波','nova','dark',6,16,1.7,92,0],['療癒樂章','heal','heal',8,22,0,150,0],['弦刃連鎖','chain','pink',3.2,10,1.5,80,5]],
 dnc:[['舞動','buff','pink',20,16,0,0,0],['花瓣風暴','nova','pink',6,18,1.8,90,0],['魅影步','chain','pink',3,10,1.5,84,4],['劍舞','wave','pink',3,10,2.0,0,0]],
 gun:[['速射','bolt','phys',2.2,8,1.2,24,3],['榴彈','meteor','fire',9,24,2.0,44,2],['颶風彈幕','nova','wind',6,18,1.7,80,0],['狙擊','bolt','phys',5,16,3.4,26,1]],
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
// ---- stage / difficulty / perks (our own roguelite layer) ----
const EL2RO={fire:'fire',ice:'water',bolt:'wind',holy:'holy',wind:'wind',earth:'earth',poison:'poison',dark:'dark',phys:'neutral',pink:'ghost',gold:'neutral',heal:null};
const RO_EL_N={neutral:'無',water:'水',earth:'地',fire:'火',wind:'風',poison:'毒',holy:'聖',dark:'闇',ghost:'念',undead:'不死'};
const DIFFS=[{id:0,n:'普通',c:'#7bd66a',hp:1,atk:1,exp:1,drop:1,zeny:1,elite:.04,rec:1},
 {id:1,n:'困難',c:'#ffd24a',hp:2.4,atk:2.1,exp:1.6,drop:1.35,zeny:2.2,elite:.07,rec:2},
 {id:2,n:'惡夢',c:'#ff8a3a',hp:5.5,atk:4,exp:2.4,drop:1.8,zeny:4.5,elite:.1,rec:3},
 {id:3,n:'地獄',c:'#ff4a5a',hp:12,atk:7,exp:3.6,drop:2.4,zeny:9,elite:.14,rec:4}];
const WAVES=6;   // wave 6 = boss wave
const PERKS=[
 {id:'boom',n:'連環爆裂',ic:'💥',d:'擊殺有 {a}% 機率引爆，連鎖波及周圍怪物。',v:[14,22,30]},
 {id:'vamp',n:'嗜血',ic:'🩸',d:'造成傷害的 {a}% 轉為生命。',v:[1.2,2.2,3.2]},
 {id:'gold',n:'貪婪',ic:'💰',d:'Zeny 與掉落率 +{a}%。',v:[30,55,80]},
 {id:'haste',n:'疾風',ic:'⚡',d:'技能冷卻縮短 {a}%。',v:[18,30,40]},
 {id:'power',n:'巨力',ic:'🔥',d:'技能傷害 +{a}%。',v:[22,42,60]},
 {id:'wall',n:'鐵壁',ic:'🛡',d:'受到傷害 -{a}%。',v:[16,28,38]},
 {id:'mind',n:'靈泉',ic:'💧',d:'SP 回復速度 +{a}%。',v:[60,120,180]},
 {id:'splash',n:'貫穿',ic:'🌀',d:'普攻附帶 {a}% 範圍傷害，波及周圍。',v:[35,60,85]},
 {id:'combo',n:'連擊大師',ic:'🔗',d:'連擊保持時間 +{a} 秒，連擊加成加倍。',v:[1.5,2.5,3.5]},
 {id:'rage',n:'狂熱',ic:'😈',d:'擊殺後 3 秒內傷害 +{a}%（可疊）。',v:[10,16,22]},
 {id:'regen',n:'復甦',ic:'💚',d:'每清一波回復 {a}% 最大生命並提升上限。',v:[30,50,70]},
 {id:'crit',n:'致命',ic:'🎯',d:'暴擊率 +{a}%，暴擊傷害 ×{b}。',v:[12,22,32],v2:[2.2,2.4,2.6]}];
function sellValue(it){return 20+it.tier*it.tier*60+(it.ref||0)*15}
const CAL=Array.from({length:24},(_,i)=>{const k=.8+.035*i;return [+k.toFixed(3),+Math.pow(k,.8).toFixed(3)]});   // per-stage hp/atk calibration (headless ladder sim)
return {CAL,EL2RO,RO_EL_N,DIFFS,WAVES,PERKS,TIERS,TPL,MOBS,MAPS,JOBS,EL,SKILLS,K,GRADES,SLOTS,ITEMS,STAT_N,WK,ORDER,BAGMAT_VALUE,sellValue,
  mapById:id=>MAPS.find(m=>m.id===id),
  behName:{charger:'衝撞',tank:'重甲',flyer:'飛行',ranged:'遠程',static:'固定',chase:'追擊'}};
})();
