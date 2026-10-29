/* 88 original monster designs (46 regular / 28 elite / 14 boss). Region roster: regions 1-4 have 4 regular, 5-14 have 3. Internal names only; public names = original content pack. */
(function(root){'use strict';
const L=[];
const D=(id,zh,tier,rg,arch,hues,p)=>L.push(Object.assign({id,zh,tier,rg,arch,hues},p||{}));
// ---- Region 1 晨風草原
D('dewslime','露滴史萊姆','reg',1,'blob',{a:'#7fdc82',b:'#3ca05a'},{sprout:1});
D('thickethare','草叢野兔','reg',1,'beast',{a:'#d8b98c',b:'#f6ead2'},{ear:'long',tail:'bush',s:.85});
D('cloverbee','三葉蜂','reg',1,'flyer',{a:'#f3c846',b:'#4a361c',c:'#c8ecff'},{kind:'bee',wing:'c',fl:2.6,s:.85});
D('mossbeetle','苔甲蟲','reg',1,'bug',{a:'#4e9560',b:'#9a7a3e'},{kind:'beetle',dots:1,s:.9});
D('thornboar','荊背野豬','elite',1,'beast',{a:'#8c5b3b',b:'#eadfc4',c:'#c2503c',d:'#4b3524'},{tusk:1,stripes:1,s:1.05,ear:'round'});
D('queenwasp','女王蜂','elite',1,'flyer',{a:'#f0b52c',b:'#3c2a16',c:'#c8ecff',d:'#d94b5a'},{kind:'bee',wing:'c',fl:2.6,s:1.2});
D('garlandking','花冠獸王','boss',1,'florabeast',{a:'#e6c890',b:'#ff8fb5',c:'#ffe070',d:'#b07a4a',e:'#7fdc82'},{s:.8});
// ---- Region 2 霧沼濕地
D('bogtoad','沼澤蟾蜍','reg',2,'toad',{a:'#6f9a52',b:'#c9d98a'},{warts:1,s:.85});
D('miredwisp','沼火精','reg',2,'flyer',{a:'#7ae0c0',b:'#2a7a78'},{kind:'orb',fl:1.2,s:.9});
D('reedling','蘆葦怪','reg',2,'plant',{a:'#8aa84e',b:'#4f7a36'},{kind:'thorn',s:.9});
D('leechworm','水蛭蟲','reg',2,'serpent',{a:'#8a5a6a',b:'#d8a0a8'},{seg:6,belly:1,maw:1,s:.8});
D('fenhag','泥沼蟾后','elite',2,'toad',{a:'#5c7f4a',b:'#d0e090',c:'#e8a838',d:'#3d4a38'},{warts:1,crown:1,s:1.2});
D('mistwraith','霧中幽影','elite',2,'ghost',{a:'#9ad0d8',b:'#e8fbff',c:'#4a7f98',d:'#2a4358'},{kind:'wraith',hood:1,s:1.1});
D('mirehydra','迷沼多頭蛇','boss',2,'hydra',{a:'#4f8a64',b:'#d8e8a0',c:'#c84a6a',d:'#2d4a3a',e:'#8fd0b0'},{s:.75});
// ---- Region 3 翠影森林
D('fernsprite','蕨葉精靈','reg',3,'plant',{a:'#e87aa8',b:'#58b060',c:'#fff0a8'},{kind:'flower',s:.9});
D('gloomwolf','幽影狼','reg',3,'beast',{a:'#5a5f78',b:'#a8b0d0'},{ear:'point',tail:'whip',s:1});
D('webweaver','結網蛛','reg',3,'bug',{a:'#3a3050',b:'#9a5ad0'},{kind:'spider',mark:1,s:.95});
D('barkimp','樹皮小鬼','reg',3,'biped',{a:'#7a5a3a',b:'#5c9a48'},{kind:'gob',weapon:'club',s:.85});
D('saplingtreant','老樹幼靈','elite',3,'plant',{a:'#8a6038',b:'#4fa04a',c:'#c8e070',d:'#5a3c28'},{kind:'treant',s:1});
D('shadowstag','影之牡鹿','elite',3,'beast',{a:'#3c4468',b:'#a0b8f0',c:'#6a78b8',d:'#e8e8ff'},{ear:'point',horn:1,tail:'whip',s:1.2,mane:1});
D('elderroot','古樹之王','boss',3,'treantlord',{a:'#7a5232',b:'#4a9c50',c:'#c8ff70',d:'#4a3020',e:'#ffb0d0'},{s:.75});
// ---- Region 4 霜牙雪隘
D('snowpuff','雪團團','reg',4,'blob',{a:'#e8f4ff',b:'#8ac0e8'},{spikes:5,h:13});
D('rimewolf','霜牙狼','reg',4,'beast',{a:'#c0d4e8',b:'#f4faff',c:'#5a88b8'},{ear:'point',tail:'bush',s:1});
D('iciclebat','冰錐蝠','reg',4,'flyer',{a:'#7ab0e0',b:'#d8f0ff'},{kind:'bat',fang:1,s:.9});
D('frostbones','凍骨戰士','reg',4,'biped',{a:'#dce8f0',b:'#6a94c0'},{kind:'skel',weapon:'sword',s:.9});
D('hoarbrute','霜毛巨漢','elite',4,'biped',{a:'#dce8f4',b:'#7aa8d0',c:'#e8a05a',d:'#4a6a90'},{kind:'gob',weapon:'club',armor:1,horns:1,s:1.25});
D('iceshade','寒冰幽魂','elite',4,'ghost',{a:'#a8d8f8',b:'#f0fbff',c:'#4a88c8',d:'#2c4c78'},{kind:'wraith',s:1.15});
D('glaciercolossus','冰川巨像','boss',4,'colossus',{a:'#7ab0e0',b:'#e8f8ff',c:'#4ad0ff',d:'#2c4c80',e:'#c8f0ff'},{th:'ice',s:.75});
// ---- Region 5 金沙荒漠
D('dunescorp','沙丘蠍','reg',5,'bug',{a:'#d8a45a',b:'#8a4a2a'},{kind:'scorpion',s:.9});
D('sandworm','流沙蟲','reg',5,'serpent',{a:'#d8b070',b:'#8a5a30'},{seg:7,maw:1,fangs:1,s:.85});
D('dustmummy','乾屍旅者','reg',5,'biped',{a:'#d8c8a0',b:'#8a7a58'},{kind:'mummy',weapon:'staff',s:.9});
D('scarablord','聖甲蟲領主','elite',5,'bug',{a:'#2a6a88',b:'#e8c040',c:'#f0e8d0',d:'#1a3a50'},{kind:'beetle',horn:1,dots:1,s:1.3});
D('sandwraith','沙塵幻影','elite',5,'ghost',{a:'#e0c088',b:'#fff0d0',c:'#a07838',d:'#5a3c20'},{kind:'wraith',hood:1,s:1.15});
D('dunewarden','沙海守衛','boss',5,'colossus',{a:'#d8b070',b:'#f0dca0',c:'#ff8a3c',d:'#8a5a30',e:'#2a8ab0'},{th:'sand',s:.75});
// ---- Region 6 幽森深林
D('toadstool','毒傘菇','reg',6,'plant',{a:'#b04a8a',b:'#f0e0a8'},{kind:'mush',s:1});
D('nightbat','夜行蝠','reg',6,'flyer',{a:'#4a3a70',b:'#a080d0'},{kind:'bat',fang:1,s:1});
D('thornling','荊棘妖','reg',6,'plant',{a:'#4a7a3a',b:'#8a3a58'},{kind:'thorn',s:1});
D('venomspider','劇毒蛛','elite',6,'bug',{a:'#2e5a3a',b:'#c8e84a',c:'#e8f0b0',d:'#1a3022'},{kind:'spider',mark:1,s:1.25});
D('hollowdryad','空洞樹妖','elite',6,'ghost',{a:'#6a9a58',b:'#d8f0a8',c:'#3a5a38',d:'#a8d070'},{kind:'wraith',hood:1,s:1.15});
D('hollowmatriarch','幽森蛛母','boss',6,'arachne',{a:'#3a2a58',b:'#b060e0',c:'#e8a0ff',d:'#1e1430',e:'#c8d0e0'},{s:.75});
// ---- Region 7 赤砂丘陵
D('claylizard','赤土蜥蜴','reg',7,'serpent',{a:'#c86a42',b:'#f0c070'},{seg:6,belly:1,crest:1,s:.9});
D('dustboar','塵土野豬','reg',7,'beast',{a:'#a8683c',b:'#e8c890'},{tusk:1,ear:'round',s:1});
D('hillvulture','丘陵禿鷲','reg',7,'flyer',{a:'#7a5a48',b:'#e8c060'},{kind:'bird',fl:1,s:1});
D('rockjackal','岩皮豺','elite',7,'beast',{a:'#b8784a',b:'#f0d8a0',c:'#6a4a38',d:'#e86a3c'},{ear:'point',armor:1,tail:'whip',s:1.25});
D('windgust','風蝕幽魂','elite',7,'ghost',{a:'#e8b890',b:'#fff0e0',c:'#b06838',d:'#6a3c20'},{kind:'orb',s:1.2});
D('redclaydrake','赤土飛龍','boss',7,'dragon',{a:'#c8603c',b:'#f0c070',c:'#ff9a3c',d:'#7a3a28',e:'#f0e0a0'},{s:.7});
// ---- Region 8 古神殿遺跡
D('stonesentinel','石像哨兵','reg',8,'golem',{a:'#9a9a98',b:'#d8d0b0'},{visor:1,cracks:1,s:.85});
D('cursedacolyte','詛咒侍僧','reg',8,'biped',{a:'#6a4a8a',b:'#d8b048'},{kind:'imp',hood:1,weapon:'staff',s:.9});
D('glyphwisp','符文靈','reg',8,'flyer',{a:'#68c8e8',b:'#2a5a98'},{kind:'orb',s:.9});
D('templelion','神殿石獅','elite',8,'beast',{a:'#b0a88a',b:'#e8d8a8',c:'#68c8e8',d:'#5a5240'},{ear:'round',mane:1,armor:1,s:1.3});
D('veilpriest','面紗祭司','elite',8,'ghost',{a:'#c8a8e8',b:'#fff0f8',c:'#7a4aa8',d:'#d8b048'},{kind:'wraith',hood:1,s:1.15});
D('gateguardian','神殿守門者','boss',8,'colossus',{a:'#a8a090',b:'#f0e0b0',c:'#68c8e8',d:'#4a4638',e:'#d8b048'},{th:'stone',s:.75});
// ---- Region 9 蒼冰冰原
D('icegel','冰晶凝膠','reg',9,'blob',{a:'#9ad8f0',b:'#e8fbff',c:'#4a98d0'},{core:'c',spikes:3,s:1});
D('snowowl','雪羽梟','reg',9,'flyer',{a:'#e8f0f8',b:'#8aa8c8'},{kind:'bird',fl:1,s:1});
D('frostcrab','霜殼蟹','reg',9,'bug',{a:'#7ab8e0',b:'#e8f4ff'},{kind:'crab',s:.95});
D('glaciermammoth','冰原長毛象','elite',9,'beast',{a:'#8a7a70',b:'#e8e0d0',c:'#b8e0f8',d:'#4a4038'},{tusk:1,mane:1,ear:'round',s:1.4});
D('auroraspirit','極光靈','elite',9,'ghost',{a:'#80f0c8',b:'#e8fff8',c:'#a080f0',d:'#2a6a88'},{kind:'orb',s:1.25});
D('aurorawyrm','極光巨蟒','boss',9,'hydra',{a:'#68d8c8',b:'#e8fff8',c:'#a078f0',d:'#2a5a80',e:'#f0a0e0'},{s:.75,spit:1});
// ---- Region 10 熾焰火山
D('magmaslime','熔岩凝膠','reg',10,'blob',{a:'#ff7a3c',b:'#ffd050',c:'#b02a1c'},{core:'b',drip:1,s:1});
D('emberimp','餘燼小惡魔','reg',10,'biped',{a:'#d8402c',b:'#ffb040'},{kind:'imp',wing:1,tail:1,weapon:'spear',s:.9});
D('lavagolem','熔岩傀儡','reg',10,'golem',{a:'#6a4a40',b:'#ff7a3c'},{core:'b',cracks:1,s:.9});
D('cindermane','灰燼獅','elite',10,'beast',{a:'#6a4038',b:'#ff8a3c',c:'#ffd050',d:'#2a1c18'},{mane:1,ear:'round',tail:'whip',s:1.3});
D('flamewraith','烈焰幽魂','elite',10,'ghost',{a:'#ff6a2c',b:'#fff0a0',c:'#a02818',d:'#ffc040'},{kind:'wraith',hood:1,s:1.2});
D('cindertyrant','餘燼暴君','boss',10,'colossus',{a:'#5a3a34',b:'#8a5a4a',c:'#ffb040',d:'#2a1814',e:'#c8402c'},{th:'magma',s:.75});
// ---- Region 11 灰燼荒原
D('ashwraith','灰燼遊魂','reg',11,'ghost',{a:'#8a8a98',b:'#d8d8e0'},{kind:'wraith',s:.95});
D('bonehound','白骨獵犬','reg',11,'beast',{a:'#e0d8c0',b:'#8a5a48'},{ear:'point',tail:'whip',horn:1,s:1});
D('cindermoth','灰燼蛾','reg',11,'flyer',{a:'#a89888',b:'#e8a050'},{kind:'moth',fl:1.3,s:1});
D('ashreaper','灰燼收割者','elite',11,'biped',{a:'#50505e',b:'#c8c8d8',c:'#ff6a3c',d:'#2a2a34'},{kind:'skel',hood:1,weapon:'spear',s:1.3});
D('smolderstag','悶燒巨鹿','elite',11,'beast',{a:'#5a4038',b:'#ff8a3c',c:'#d8d0c0',d:'#2a1c18'},{horn:1,ear:'point',mane:1,s:1.3});
D('ashendragon','灰燼龍','boss',11,'dragon',{a:'#5a5a68',b:'#c8c8d8',c:'#ff6a3c',d:'#2a2a34',e:'#ffc050'},{fire:1,ash:1,s:.7});
// ---- Region 12 星晶洞窟
D('crystalbeetle','晶殼蟲','reg',12,'bug',{a:'#6a8ae0',b:'#c8e8ff'},{kind:'beetle',horn:1,dots:1,s:1});
D('prismwisp','稜光靈','reg',12,'flyer',{a:'#e888e0',b:'#68e0f0'},{kind:'orb',s:1});
D('geodegolem','晶洞傀儡','reg',12,'golem',{a:'#7a68b8',b:'#e8a8f8'},{core:'b',spikes:1,s:.9});
D('amethystbat','紫晶巨蝠','elite',12,'flyer',{a:'#8a58c8',b:'#e8c8ff',c:'#4a2a88',d:'#68e0f0'},{kind:'bat',fang:1,s:1.5});
D('starshard','星晶魔像','elite',12,'golem',{a:'#68b0e8',b:'#fff0a8',c:'#e888e0',d:'#2a4c88'},{core:'b',spikes:1,visor:1,s:1.15});
D('prismcolossus','稜晶巨像','boss',12,'colossus',{a:'#8a78d8',b:'#f0c8ff',c:'#68e8f0',d:'#3a2c78',e:'#ffe888'},{th:'prism',s:.75});
// ---- Region 13 雷鳴峰
D('stormhawk','暴風鷹','reg',13,'flyer',{a:'#5a78a8',b:'#f0d848'},{kind:'bird',fl:1.2,s:1.05});
D('thunderram','雷角羊','reg',13,'beast',{a:'#d8d0c0',b:'#6a88c8'},{horn:1,ear:'round',tail:'bush',s:1.05});
D('sparkwisp','雷花靈','reg',13,'flyer',{a:'#f0e048',b:'#fff8c0'},{kind:'orb',s:.9});
D('voltstag','電光雄鹿','elite',13,'beast',{a:'#6a88c8',b:'#fff070',c:'#e8f0ff',d:'#34487a'},{horn:1,ear:'point',mane:1,s:1.3});
D('stormcaller','喚雷祭司','elite',13,'biped',{a:'#4a5a98',b:'#f0e048',c:'#e8f0ff',d:'#2a345a'},{kind:'imp',hood:1,weapon:'staff',s:1.3});
D('thundergriffin','雷霆獅鷲','boss',13,'griffin',{a:'#6a88c8',b:'#e0c898',c:'#f0e048',d:'#8a6a48',e:'#f8f4e8'},{storm:1,s:.75});
// ---- Region 14 永夜城塞
D('shadeknight','暗影騎士','reg',14,'biped',{a:'#3a3a58',b:'#8a68d0'},{kind:'knight',weapon:'sword',s:.95});
D('gargoyle','滴水獸','reg',14,'flyer',{a:'#6a6a7a',b:'#a85ad0'},{kind:'bat',fl:.8,fang:1,s:1.05});
D('nightrat','夜鼠群','reg',14,'beast',{a:'#3a3048',b:'#c85a88'},{ear:'round',tail:'whip',s:.85});
D('voidchampion','虛空勇者','elite',14,'biped',{a:'#2a2a48',b:'#a868e8',c:'#e8e0ff',d:'#14142a'},{kind:'knight',weapon:'spear',armor:1,s:1.3});
D('dusksorcerer','黃昏術師','elite',14,'ghost',{a:'#48386a',b:'#d8a8ff',c:'#a868e8',d:'#1e1a38'},{kind:'wraith',hood:1,s:1.25});
D('nightsovereign','永夜霜騎','boss',14,'rider',{a:'#3c4660',b:'#d8d0c0',c:'#58c8ff',d:'#1e1a34',e:'#a8b8d8'},{s:.62});
const byRegion={};for(const d of L){(byRegion[d.rg]=byRegion[d.rg]||{reg:[],elite:[],boss:[]})[d.tier].push(d)}
root.MobData={list:L,byRegion,get:id=>L.find(d=>d.id===id)};
})(window);
