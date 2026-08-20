const L=(id,w,min=1,max=min)=>({id,w,min,max});
const S=(...entries)=>entries;
export const enemies = {
  slime:{id:'slime',name:'スライム',icon:'🟦',hp:18,atk:6,def:1,agi:5,exp:8,slots:[[1,.5],[2,.5]],loot:S(L('fresh_herb',8),L('slime_gel',247),L('slime_core',1))},
  rabbit:{id:'rabbit',name:'ツノウサギ',icon:'🐇',hp:25,atk:8,def:2,agi:12,exp:11,slots:[[1,.55],[2,.4],[3,.05]],loot:S(L('rabbit_fur',150),L('beast_fang',75),L('fresh_herb',20),L('rabbit_horn',11))},
  bat:{id:'bat',name:'夜コウモリ',icon:'🦇',hp:33,atk:11,def:2,agi:18,exp:16,slots:[[1,.5],[2,.42],[3,.08]],loot:S(L('bat_wing',175),L('beast_fang',45),L('night_dust',28),L('fresh_herb',8))},
  goblin:{id:'goblin',name:'森ゴブリン',icon:'👺',hp:44,atk:13,def:4,agi:9,exp:22,slots:[[1,.35],[2,.5],[3,.15]],loot:S(L('goblin_cloth',120),L('softwood',62),L('iron_ore',34),L('goblin_coin',32),L('fresh_herb',8))},
  wolf:{id:'wolf',name:'灰色オオカミ',icon:'🐺',hp:54,atk:15,def:3,agi:16,exp:28,slots:[[1,.3],[2,.5],[3,.2]],loot:S(L('wolf_pelt',105),L('wolf_claw',90),L('beast_fang',48),L('fresh_herb',10),L('rabbit_fur',3))},
  mushroom_beast:{id:'mushroom_beast',name:'マタンゴ',icon:'🍄',hp:48,atk:14,def:4,agi:7,exp:25,slots:[[1,.35],[2,.5],[3,.15]],loot:S(L('mushroom',142),L('spore_sac',90),L('fresh_herb',18),L('magic_crystal',6))},
  hornet:{id:'hornet',name:'森の大蜂',icon:'🐝',hp:41,atk:15,def:3,agi:22,exp:27,slots:[[1,.45],[2,.45],[3,.1]],loot:S(L('hornet_shell',145),L('honey_drop',70),L('night_dust',25),L('beast_fang',16))},
  boar:{id:'boar',name:'山猪',icon:'🐗',hp:76,atk:20,def:6,agi:10,exp:38,slots:[[2,.55],[3,.4],[4,.05]],loot:S(L('boar_hide',118),L('boar_tusk',40),L('beast_fang',64),L('hard_stone',34))},
  rock_lizard:{id:'rock_lizard',name:'岩トカゲ',icon:'🦎',hp:68,atk:18,def:7,agi:8,exp:34,slots:[[1,.25],[2,.55],[3,.2]],loot:S(L('lizard_scale',105),L('iron_ore',82),L('hard_stone',55),L('magic_crystal',13),L('flame_crystal',1))},
  cave_moth:{id:'cave_moth',name:'洞窟オオガ',icon:'🦋',hp:58,atk:17,def:4,agi:17,exp:36,slots:[[1,.3],[2,.5],[3,.2]],loot:S(L('moth_powder',120),L('night_dust',72),L('mushroom',45),L('moon_scale',19))},
  golem:{id:'golem',name:'岩窟ゴーレム',icon:'🗿',hp:125,atk:20,def:9,agi:3,exp:82,slots:[[2,.3],[3,.5],[4,.2]],loot:S(L('iron_ore',110,1,2),L('hard_stone',75,1,2),L('magic_crystal',48),L('golem_core',20),L('flame_crystal',3))},
  skeleton:{id:'skeleton',name:'さまよう骸骨',icon:'💀',hp:74,atk:20,def:5,agi:11,exp:39,slots:[[1,.25],[2,.55],[3,.2]],loot:S(L('bone',118),L('cursed_cloth',65),L('old_relic',38),L('ancient_gear',30),L('magic_crystal',5))},
  imp:{id:'imp',name:'夜魔インプ',icon:'👿',hp:66,atk:22,def:4,agi:19,exp:43,slots:[[1,.2],[2,.55],[3,.25]],loot:S(L('imp_horn',100),L('magic_crystal',82),L('night_dust',48),L('imp_tear',22),L('flame_crystal',4))},
  ruin_guard:{id:'ruin_guard',name:'遺跡の番人',icon:'🤖',hp:96,atk:22,def:9,agi:6,exp:54,slots:[[2,.45],[3,.45],[4,.1]],loot:S(L('ancient_gear',100),L('old_relic',70),L('iron_ore',48),L('magic_crystal',34),L('golem_core',4))},
  ore_golem:{id:'ore_golem',name:'鉱脈ゴーレム',icon:'🗿',hp:168,atk:27,def:13,agi:4,exp:118,slots:[[3,.45],[4,.45],[5,.1]],loot:S(L('iron_ore',100,2,4),L('hard_stone',72,2,3),L('magic_crystal',52,1,2),L('golem_core',28),L('flame_crystal',4))},
  relic_warden:{id:'relic_warden',name:'灰冠の守護者',icon:'🛡️',hp:184,atk:29,def:12,agi:9,exp:132,slots:[[3,.35],[4,.5],[5,.15]],loot:S(L('ancient_gear',104,1,2),L('old_relic',82,1,2),L('magic_crystal',48),L('golem_core',18),L('flame_crystal',4))}
};
