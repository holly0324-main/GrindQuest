export const items = {
  novice_sword: { id:'novice_sword', name:'旅立ちの剣', slot:'weapon', icon:'🗡️', atk:3, def:0, hp:0, mp:0, desc:'まだ頼りないが、手になじむ剣。' },
  iron_sword: { id:'iron_sword', name:'鉄の剣', slot:'weapon', icon:'⚔️', atk:8, def:0, hp:0, mp:0, desc:'鉄鉱石を鍛えて作った堅実な剣。' },
  fang_blade: { id:'fang_blade', name:'獣牙の剣', slot:'weapon', icon:'🦷', atk:13, def:0, hp:4, mp:0, desc:'魔獣の牙を芯材にした荒々しい剣。' },
  flame_blade: { id:'flame_blade', name:'炎晶剣', slot:'weapon', icon:'🔥', atk:18, def:0, hp:0, mp:4, desc:'炎晶石を封じた上位武器。' },
  travel_clothes: { id:'travel_clothes', name:'旅人の服', slot:'armor', icon:'🥋', atk:0, def:2, hp:0, mp:0, desc:'動きやすさ重視の普段着。' },
  leather_armor: { id:'leather_armor', name:'皮のよろい', slot:'armor', icon:'🛡️', atk:0, def:5, hp:6, mp:0, desc:'魔獣の皮で補強した軽鎧。' },
  chain_mail: { id:'chain_mail', name:'鎖かたびら', slot:'armor', icon:'⛓️', atk:0, def:9, hp:10, mp:0, desc:'洞窟探索にも耐える本格防具。' },
  mystic_robe: { id:'mystic_robe', name:'魔力のローブ', slot:'armor', icon:'🪄', atk:0, def:7, hp:0, mp:10, desc:'魔結晶の力でMPを増幅する。' }
};

export const materials = {
  herb: { id:'herb', name:'薬草', icon:'🌿' },
  slime_gel: { id:'slime_gel', name:'スライムゼリー', icon:'🫧' },
  beast_fang: { id:'beast_fang', name:'魔獣の牙', icon:'🦷' },
  iron_ore: { id:'iron_ore', name:'鉄鉱石', icon:'🪨' },
  bone: { id:'bone', name:'古びた骨', icon:'🦴' },
  magic_crystal: { id:'magic_crystal', name:'魔結晶', icon:'💎' },
  flame_crystal: { id:'flame_crystal', name:'炎晶石', icon:'🔶' }
};

export const enemies = {
  slime: { id:'slime', name:'スライム', icon:'🟦', hp:18, atk:6, def:1, exp:9, gold:6, drops:[['slime_gel',.72],['herb',.18]] },
  rabbit: { id:'rabbit', name:'ツノウサギ', icon:'🐇', hp:24, atk:8, def:2, exp:12, gold:8, drops:[['beast_fang',.35],['herb',.20]] },
  big_slime: { id:'big_slime', name:'キングゼリー', icon:'🔵', hp:72, atk:11, def:3, exp:42, gold:32, boss:true, drops:[['slime_gel',1],['iron_ore',.55]] },
  bat: { id:'bat', name:'洞窟コウモリ', icon:'🦇', hp:36, atk:11, def:2, exp:18, gold:10, drops:[['beast_fang',.35],['iron_ore',.25]] },
  goblin: { id:'goblin', name:'ゴブリン', icon:'👺', hp:46, atk:13, def:4, exp:24, gold:16, drops:[['iron_ore',.55],['herb',.22]] },
  cave_wolf: { id:'cave_wolf', name:'ケイブウルフ', icon:'🐺', hp:54, atk:15, def:3, exp:28, gold:14, drops:[['beast_fang',.62],['iron_ore',.20]] },
  golem: { id:'golem', name:'岩窟ゴーレム', icon:'🗿', hp:130, atk:19, def:7, exp:95, gold:64, boss:true, drops:[['iron_ore',1],['magic_crystal',.45]] },
  skeleton: { id:'skeleton', name:'さまよう骸骨', icon:'💀', hp:78, atk:19, def:5, exp:40, gold:20, drops:[['bone',.7],['magic_crystal',.18]] },
  imp: { id:'imp', name:'魔導インプ', icon:'👿', hp:68, atk:22, def:4, exp:44, gold:26, drops:[['magic_crystal',.52],['flame_crystal',.08]] },
  armor: { id:'armor', name:'からくり甲冑', icon:'🤖', hp:92, atk:21, def:9, exp:52, gold:31, drops:[['iron_ore',.62],['magic_crystal',.28]] },
  ruin_knight: { id:'ruin_knight', name:'遺跡の黒騎士', icon:'♞', hp:220, atk:27, def:10, exp:180, gold:110, boss:true, drops:[['magic_crystal',1],['flame_crystal',.55]] }
};

export const dungeons = {
  green_hill: {
    id:'green_hill', name:'はじまりの丘', icon:'🌱', recommended:1, unlockLevel:1, cycleMinutes:6,
    desc:'旅立ちの冒険者向け。薬草や簡単な素材が集まる。', normal:['slime','rabbit','slime','rabbit'], boss:'big_slime',
    idle:{ exp:28, gold:18, drops:{slime_gel:2.2, herb:.7, beast_fang:.45} }
  },
  echo_cave: {
    id:'echo_cave', name:'こだまの洞窟', icon:'🕳️', recommended:3, unlockLevel:3, cycleMinutes:10,
    desc:'鉄鉱石と魔獣素材が狙える中級ダンジョン。', normal:['bat','goblin','cave_wolf','goblin'], boss:'golem',
    idle:{ exp:76, gold:46, drops:{iron_ore:1.7, beast_fang:1.1, herb:.35, magic_crystal:.12} }
  },
  ancient_ruins: {
    id:'ancient_ruins', name:'忘れられた遺跡', icon:'🏛️', recommended:6, unlockLevel:6, cycleMinutes:15,
    desc:'危険だが、魔結晶と炎晶石を狙える高難度エリア。', normal:['skeleton','imp','armor','skeleton'], boss:'ruin_knight',
    idle:{ exp:155, gold:88, drops:{bone:1.8, magic_crystal:1.25, iron_ore:.7, flame_crystal:.16} }
  }
};

export const recipes = [
  { id:'r_iron_sword', item:'iron_sword', cost:{ iron_ore:4, slime_gel:2 }, gold:45 },
  { id:'r_leather', item:'leather_armor', cost:{ beast_fang:3, slime_gel:3 }, gold:50 },
  { id:'r_fang', item:'fang_blade', cost:{ iron_ore:5, beast_fang:5 }, gold:110 },
  { id:'r_chain', item:'chain_mail', cost:{ iron_ore:9, beast_fang:2 }, gold:140 },
  { id:'r_robe', item:'mystic_robe', cost:{ magic_crystal:4, bone:3 }, gold:210 },
  { id:'r_flame', item:'flame_blade', cost:{ flame_crystal:3, magic_crystal:5, iron_ore:8 }, gold:420 }
];
