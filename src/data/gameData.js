export const items = {
  novice_sword: { id:'novice_sword', name:'旅立ちの剣', slot:'weapon', icon:'🗡️', atk:3, def:0, hp:0, mp:0, desc:'まだ頼りないが、手になじむ剣。' },
  iron_sword: { id:'iron_sword', name:'鉄の剣', slot:'weapon', icon:'⚔️', atk:8, def:0, hp:0, mp:0, desc:'鉄鉱石を鍛えて作った堅実な剣。' },
  fang_blade: { id:'fang_blade', name:'獣牙の剣', slot:'weapon', icon:'🦷', atk:13, def:0, hp:4, mp:0, desc:'魔獣の牙を芯材にした荒々しい剣。' },
  flame_blade: { id:'flame_blade', name:'炎晶剣', slot:'weapon', icon:'🔥', atk:18, def:0, hp:0, mp:4, desc:'炎晶石を封じた上位武器。' },
  travel_clothes: { id:'travel_clothes', name:'旅人の服', slot:'armor', icon:'🥋', atk:0, def:2, hp:0, mp:0, desc:'動きやすさ重視の普段着。' },
  leather_armor: { id:'leather_armor', name:'皮のよろい', slot:'armor', icon:'🛡️', atk:0, def:5, hp:6, mp:0, desc:'魔獣素材で補強した軽鎧。' },
  chain_mail: { id:'chain_mail', name:'鎖かたびら', slot:'armor', icon:'⛓️', atk:0, def:9, hp:10, mp:0, desc:'山道にも耐える本格防具。' },
  mystic_robe: { id:'mystic_robe', name:'魔力のローブ', slot:'armor', icon:'🪄', atk:0, def:7, hp:0, mp:10, desc:'魔結晶の力でMPを増幅する。' }
};

export const materials = {
  fresh_herb: { id:'fresh_herb', name:'薬草', icon:'🌿', value:5, bulk:1, shelfLife:75, desc:'採ってから75ステップで傷む生鮮品。' },
  slime_gel: { id:'slime_gel', name:'スライムゼリー', icon:'🫧', value:4, bulk:1 },
  beast_fang: { id:'beast_fang', name:'魔獣の牙', icon:'🦷', value:9, bulk:1 },
  iron_ore: { id:'iron_ore', name:'鉄鉱石', icon:'🪨', value:15, bulk:2 },
  bone: { id:'bone', name:'古びた骨', icon:'🦴', value:6, bulk:1 },
  magic_crystal: { id:'magic_crystal', name:'魔結晶', icon:'💎', value:45, bulk:1 },
  flame_crystal: { id:'flame_crystal', name:'炎晶石', icon:'🔶', value:95, bulk:1 },
  softwood: { id:'softwood', name:'やわらかい木材', icon:'🪵', value:5, bulk:2 },
  hardwood: { id:'hardwood', name:'堅木', icon:'🌳', value:18, bulk:2 },
  river_fish: { id:'river_fish', name:'川魚', icon:'🐟', value:11, bulk:2, shelfLife:105, desc:'生魚。105ステップで傷む。' },
  silver_fish: { id:'silver_fish', name:'銀うろこの魚', icon:'🐠', value:34, bulk:1, shelfLife:135, desc:'比較的日持ちする魚。135ステップで傷む。' },
  mushroom: { id:'mushroom', name:'森キノコ', icon:'🍄', value:8, bulk:1, shelfLife:60, desc:'採取後60ステップで傷む。' },
  old_relic: { id:'old_relic', name:'古代の欠片', icon:'🏺', value:70, bulk:2 }
};

export const consumables = {
  potion: { id:'potion', name:'ポーション', icon:'🧪', price:60, bulk:1, desc:'保存が利く回復薬。HPを45回復。' },
  rura_potion: { id:'rura_potion', name:'ルーラのポーション', icon:'🌀', price:180, bulk:1, desc:'探索中どこからでも村へ直帰する。' },
  camp_set: { id:'camp_set', name:'キャンプセット', icon:'⛺', price:260, bulk:5, max:1, reusable:true, desc:'重い野営道具。安全な場所で休める。準安全地帯では襲撃の危険あり。' }
};

export const backpacks = {
  cheap: { id:'cheap', name:'安物のバッグ', capacity:12, price:0, icon:'🎒' },
  canvas: { id:'canvas', name:'帆布のバックパック', capacity:20, price:260, icon:'🎒' },
  explorer: { id:'explorer', name:'冒険者の大型バッグ', capacity:32, price:850, icon:'🧳' }
};

export const enemies = {
  slime: { id:'slime', name:'スライム', icon:'🟦', hp:18, atk:6, def:1, exp:8, drops:[['slime_gel',.72]], herbChance:.16 },
  rabbit: { id:'rabbit', name:'ツノウサギ', icon:'🐇', hp:25, atk:8, def:2, exp:11, drops:[['beast_fang',.35]], herbChance:.10 },
  bat: { id:'bat', name:'夜コウモリ', icon:'🦇', hp:33, atk:11, def:2, exp:16, drops:[['beast_fang',.28]], herbChance:.04 },
  goblin: { id:'goblin', name:'森ゴブリン', icon:'👺', hp:44, atk:13, def:4, exp:22, drops:[['softwood',.28],['iron_ore',.12]], herbChance:.08 },
  wolf: { id:'wolf', name:'灰色オオカミ', icon:'🐺', hp:54, atk:15, def:3, exp:28, drops:[['beast_fang',.64]], herbChance:.03 },
  mushroom_beast: { id:'mushroom_beast', name:'マタンゴ', icon:'🍄', hp:48, atk:14, def:4, exp:25, drops:[['mushroom',.68]], herbChance:.06 },
  rock_lizard: { id:'rock_lizard', name:'岩トカゲ', icon:'🦎', hp:68, atk:18, def:7, exp:34, drops:[['iron_ore',.48]], herbChance:.02 },
  golem: { id:'golem', name:'岩窟ゴーレム', icon:'🗿', hp:125, atk:20, def:9, exp:82, drops:[['iron_ore',1],['magic_crystal',.28]], herbChance:0 },
  skeleton: { id:'skeleton', name:'さまよう骸骨', icon:'💀', hp:74, atk:20, def:5, exp:39, drops:[['bone',.75],['old_relic',.08]], herbChance:0 },
  imp: { id:'imp', name:'夜魔インプ', icon:'👿', hp:66, atk:22, def:4, exp:43, drops:[['magic_crystal',.45],['flame_crystal',.06]], herbChance:0 },
  ruin_guard: { id:'ruin_guard', name:'遺跡の番人', icon:'🤖', hp:96, atk:22, def:9, exp:54, drops:[['old_relic',.35],['magic_crystal',.25]], herbChance:0 }
};

export const zones = {
  village: { name:'ミナト村', encounter:0, pools:{ morning:[], day:[], night:[] } },
  outskirts: { name:'村はずれ', encounter:.18, pools:{ morning:['slime','rabbit'], day:['slime','rabbit'], night:['slime','bat'] } },
  river: { name:'川辺', encounter:.17, pools:{ morning:['slime','rabbit'], day:['slime','goblin'], night:['bat','goblin'] } },
  forest: { name:'森', encounter:.28, pools:{ morning:['rabbit','mushroom_beast'], day:['goblin','wolf','mushroom_beast'], night:['bat','wolf','imp'] } },
  mountain: { name:'山', encounter:.31, pools:{ morning:['rock_lizard','rabbit'], day:['rock_lizard','wolf'], night:['rock_lizard','bat','imp'] } },
  ruins: { name:'古跡', encounter:.35, pools:{ morning:['skeleton','ruin_guard'], day:['skeleton','ruin_guard'], night:['skeleton','imp','ruin_guard'] } }
};

// ノードは「イベント」ではなく「場所」。同じ採掘場・薬草地・川が毎回同じ位置にある。
export const worldNodes = {
  town:{id:'town',name:'ミナト村',icon:'🏘️',zone:'village',x:51,y:84,desc:'探索の拠点。素材の売却、買い物、休息ができる。'},
  west_road:{id:'west_road',name:'西の街道',icon:'🛤️',zone:'outskirts',x:38,y:78,desc:'村を一周する外周路の西側。'},
  east_road:{id:'east_road',name:'東の街道',icon:'🛤️',zone:'outskirts',x:66,y:78,desc:'荷車の轍が残る村東側の道。'},
  north_gate:{id:'north_gate',name:'北門跡',icon:'⛩️',zone:'outskirts',x:52,y:68,desc:'森と山へ向かう分岐点。'},
  herb_meadow:{id:'herb_meadow',name:'薬草の原',icon:'🌿',zone:'outskirts',x:24,y:70,desc:'いつもの場所に薬草が群生している。',resource:'herb'},
  old_well:{id:'old_well',name:'古井戸',icon:'🪣',zone:'outskirts',x:14,y:59,desc:'使われなくなった井戸。何か起きることもある。'},
  riverbank:{id:'riverbank',name:'浅瀬',icon:'🌊',zone:'river',x:14,y:46,desc:'川を渡れる浅瀬。'},
  fishing_bend:{id:'fishing_bend',name:'魚影の濃い淵',icon:'🎣',zone:'river',x:28,y:49,desc:'魚が集まる曲がり角。',resource:'fishing'},
  waterfall:{id:'waterfall',name:'小さな滝',icon:'💧',zone:'river',x:22,y:35,desc:'冷たい水が流れ落ちる。',campSafety:'semi'},
  forest_edge:{id:'forest_edge',name:'森の入口',icon:'🌲',zone:'forest',x:40,y:57,desc:'木々が密になり始める。',campSafety:'semi'},
  wood_grove:{id:'wood_grove',name:'伐採林',icon:'🪓',zone:'forest',x:72,y:62,desc:'切り頃の木が多い林。',resource:'woodcut'},
  charcoal_hut:{id:'charcoal_hut',name:'炭焼き小屋跡',icon:'🛖',zone:'forest',x:82,y:52,desc:'誰もいない古い小屋。',campSafety:'safe'},
  deep_forest:{id:'deep_forest',name:'深緑の森',icon:'🌳',zone:'forest',x:49,y:44,desc:'昼でも薄暗い森の中心部。'},
  forest_spring:{id:'forest_spring',name:'森の泉',icon:'⛲',zone:'forest',x:37,y:36,desc:'澄んだ泉。周辺は比較的野営しやすい。',campSafety:'safe'},
  mushroom_ring:{id:'mushroom_ring',name:'キノコの輪',icon:'🍄',zone:'forest',x:60,y:34,desc:'妙に整ったキノコの群生地。'},
  shrine_path:{id:'shrine_path',name:'石祠への道',icon:'🪨',zone:'forest',x:29,y:26,desc:'苔むした石標が続く。'},
  old_shrine:{id:'old_shrine',name:'森の石祠',icon:'🗿',zone:'forest',x:17,y:19,desc:'古い祠。時間帯で空気が変わる。',campSafety:'semi'},
  mountain_foot:{id:'mountain_foot',name:'山麓',icon:'⛰️',zone:'mountain',x:69,y:43,desc:'ここから勾配が急になる。'},
  quarry_road:{id:'quarry_road',name:'採石道',icon:'🥾',zone:'mountain',x:80,y:38,desc:'採石場へ続く荒れた道。'},
  quarry:{id:'quarry',name:'露天採掘場',icon:'⛏️',zone:'mountain',x:89,y:27,desc:'鉄鉱石が露出した採掘場。',resource:'mining'},
  mine_entrance:{id:'mine_entrance',name:'旧鉱山入口',icon:'🕳️',zone:'mountain',x:75,y:22,desc:'奥から冷たい風が吹く。',campSafety:'semi'},
  high_pass:{id:'high_pass',name:'風切り峠',icon:'🌬️',zone:'mountain',x:63,y:15,desc:'村周辺を見渡せる高所。風よけになる岩陰がある。',campSafety:'safe'},
  hidden_cave:{id:'hidden_cave',name:'崩れかけの洞穴',icon:'🪨',zone:'mountain',x:91,y:12,desc:'危険だが珍しい鉱物が見つかることも。',resource:'mining'},
  ruin_path:{id:'ruin_path',name:'旧参道',icon:'🛣️',zone:'ruins',x:51,y:24,desc:'森から古跡へ続く石畳。',campSafety:'semi'},
  old_ruins:{id:'old_ruins',name:'風化した遺跡',icon:'🏛️',zone:'ruins',x:46,y:10,desc:'古代の欠片が眠る危険地帯。'},
  lakeside:{id:'lakeside',name:'森湖',icon:'🏞️',zone:'river',x:8,y:31,desc:'森の西端にある静かな湖。',resource:'fishing'},
  fallen_bridge:{id:'fallen_bridge',name:'崩れた橋',icon:'🌉',zone:'river',x:8,y:71,desc:'川沿いを回って村へ戻る近道の跡。'}
};

const E=(a,b,steps,risk=1)=>({a,b,steps,risk});
export const worldEdges = [
  E('town','west_road',4,.8),E('town','east_road',4,.8),E('town','north_gate',5,.8),
  E('west_road','herb_meadow',4,.9),E('herb_meadow','old_well',5,1),E('old_well','fallen_bridge',5,1.05),E('fallen_bridge','riverbank',5,1.05),E('riverbank','fishing_bend',4,1),E('fishing_bend','west_road',6,1.1),
  E('north_gate','forest_edge',5,1),E('forest_edge','fishing_bend',6,1.05),E('riverbank','waterfall',6,1.1),E('waterfall','lakeside',5,1),E('lakeside','old_shrine',8,1.2),
  E('forest_edge','deep_forest',6,1.1),E('forest_edge','wood_grove',6,1),E('wood_grove','east_road',6,1),E('wood_grove','charcoal_hut',5,1.1),E('charcoal_hut','mountain_foot',6,1.15),
  E('deep_forest','forest_spring',5,1),E('deep_forest','mushroom_ring',4,1),E('forest_spring','shrine_path',5,1),E('shrine_path','old_shrine',5,1.1),E('shrine_path','ruin_path',6,1.15),E('mushroom_ring','ruin_path',5,1.15),
  E('deep_forest','mountain_foot',7,1.2),E('mountain_foot','quarry_road',5,1.1),E('quarry_road','quarry',5,1.1),E('quarry_road','east_road',7,1.15),E('quarry','mine_entrance',5,1.2),E('mine_entrance','high_pass',7,1.3),E('mine_entrance','hidden_cave',6,1.35),
  E('ruin_path','old_ruins',6,1.35),E('ruin_path','high_pass',7,1.3)
];

export const recipes = [
  { id:'r_iron_sword', item:'iron_sword', cost:{ iron_ore:4, slime_gel:2 } },
  { id:'r_leather', item:'leather_armor', cost:{ beast_fang:3, slime_gel:3 } },
  { id:'r_fang', item:'fang_blade', cost:{ iron_ore:5, beast_fang:5 } },
  { id:'r_chain', item:'chain_mail', cost:{ iron_ore:9, beast_fang:2 } },
  { id:'r_robe', item:'mystic_robe', cost:{ magic_crystal:4, bone:3 } },
  { id:'r_flame', item:'flame_blade', cost:{ flame_crystal:3, magic_crystal:5, iron_ore:8 } }
];

// ノード到着時に抽選される小イベント。場所自体は固定、出来事は固定しない。
export const randomEvents = [
  {id:'dew_herb',zones:['outskirts','forest'],phases:['morning'],weight:5,text:'朝露の残る葉陰に薬草を見つけた。',effect:{herb:1}},
  {id:'fallen_branch',zones:['forest'],weight:4,text:'折れた枝の中に使えそうな木材があった。',effect:{cargo:['softwood',1]}},
  {id:'mushrooms',zones:['forest'],weight:4,text:'木の根元に森キノコがまとまって生えている。',effect:{cargo:['mushroom',1]}},
  {id:'ore_chip',zones:['mountain'],weight:4,text:'道端の岩肌に鉱脈の欠片が見えた。',effect:{cargo:['iron_ore',1]}},
  {id:'fish_jump',zones:['river'],weight:3,text:'水面で大きな魚が跳ねた。近くに魚群がいるようだ。',effect:{note:'fish'}},
  {id:'clear_water',zones:['river','forest'],phases:['morning','day'],weight:2,text:'冷たい清水で顔を洗い、少し元気が戻った。',effect:{hp:7}},
  {id:'quiet_breeze',zones:['outskirts','mountain'],weight:3,text:'風が抜け、しばらく周囲が静まり返った。',effect:{encounterMod:-.08,moves:2}},
  {id:'thick_fog',zones:['forest','mountain'],phases:['night'],weight:3,text:'急に霧が濃くなった。しばらく魔物に遭いやすそうだ。',effect:{encounterMod:.12,moves:2}},
  {id:'tracks',zones:['forest','mountain'],weight:3,text:'新しい獣の足跡が続いている。少し遠回りした。',effect:{steps:3}},
  {id:'old_pack',zones:['ruins','mountain'],weight:2,text:'破れた古い荷袋から素材を拾い上げた。',effect:{randomCargo:['bone','iron_ore','old_relic']}},
  {id:'moon_crystal',zones:['ruins'],phases:['night'],weight:2,text:'月明かりに反応して小さな魔結晶が光っている。',effect:{cargo:['magic_crystal',1]}},
  {id:'wild_herb',zones:['outskirts','river','forest'],weight:4,text:'道脇に薬草を一本見つけた。',effect:{herb:1}},
  {id:'ripped_map',zones:['ruins','forest'],weight:2,text:'古い地図の切れ端を見つけた。何も持ち帰れないが、この辺りの道筋が少し分かった気がする。',effect:{note:'map'}},
  {id:'owl',zones:['forest'],phases:['night'],weight:3,text:'フクロウの声だけが響く。何も起きなかった。',effect:{}},
  {id:'stones',zones:['mountain'],weight:3,text:'足元が崩れ、慎重に歩いたため少し時間を使った。',effect:{steps:2}},
  {id:'old_fire',zones:['forest','ruins'],weight:2,text:'まだ温かい焚き火跡がある。誰かが近くにいるのかもしれない。',effect:{note:'camp'}},
  {id:'rare_fang',zones:['forest'],phases:['night'],weight:1,text:'獣が落とした大きな牙を見つけた。',effect:{cargo:['beast_fang',1]}},
  {id:'nothing',zones:['outskirts','river','forest','mountain','ruins'],weight:7,text:'特に何事もなく道を進んだ。',effect:{}}
];
