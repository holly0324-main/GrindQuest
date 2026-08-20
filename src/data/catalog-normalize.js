import { items } from './items/equipment.js';
import { materials } from './items/materials.js';
import { consumables } from './items/consumables.js';
import { enemies } from './monsters/enemies.js';

// レア度は装備Rankと同じ Rn に統合。nが大きいほど希少。
const legacyRarityRank={common:0,uncommon:1,rare:2,epic:3};
const rankByValue=v=>v>=140?3:v>=55?2:v>=18?1:0;
for(const x of Object.values(items)){ if(!Number.isFinite(x.rank))x.rank=legacyRarityRank[x.rarity]??0; delete x.rarity; }
for(const x of Object.values(materials)){ if(!Number.isFinite(x.rank))x.rank=legacyRarityRank[x.rarity]??rankByValue(x.value||0); delete x.rarity; }
for(const x of Object.values(consumables)){ if(!Number.isFinite(x.rank))x.rank=legacyRarityRank[x.rarity]??rankByValue(x.price||0); delete x.rarity; }

// 図鑑用フレーバー。戦闘・ドロップ等の数値情報は元データから動的に組み立てる。
const enemyFlavor={
  slime:'湿った草地を好む半透明の魔物。刺激しなければ鈍いが、餌を探して道端まで出てくる。',
  rabbit:'額の角を武器にする小型獣。見た目より脚が速く、驚くと一直線に突っ込んでくる。',
  bat:'日が落ちると活動を始める洞窟性の魔物。超音波のような鳴き声で獲物を探す。',
  goblin:'森の道具や布切れを拾い集めて暮らす小鬼。単独個体は人里近くまで降りてくる。',
  wolf:'森から山麓を巡回する灰毛の肉食獣。素早さを生かして傷ついた相手を狙う。',
  mushroom_beast:'魔力を吸った菌類が歩き出したもの。胞子を散らすため湿った森を徘徊する。',
  hornet:'花蜜の多い林に巣を作る大型蜂。縄張りへ入ったものへ執拗に襲いかかる。',
  boar:'山道を掘り返して餌を探す大型獣。正面からの突進は非常に重い。',
  rock_lizard:'岩肌と見分けにくい鱗を持つ山地のトカゲ。鉱物をかじって体表を硬くする。',
  cave_moth:'洞窟の燐光に集まる大蛾。夜の森にも飛び出し、鱗粉をまき散らす。',
  golem:'岩と魔力が結びついて生まれた鈍重な構造体。硬いが動きは遅い。',
  skeleton:'古跡をさまよう骨の魔物。生前の持ち物らしき古物を抱えていることがある。',
  imp:'夜間に魔力の濃い場所へ現れる小悪魔。小柄だが非常にすばしっこい。',
  ruin_guard:'遺跡を守る古い自動人形。壊れかけても侵入者を排除する命令だけは残っている。',
  ore_golem:'旧鉱山の鉱脈と融合した巨大ゴーレム。採掘が続く限り核がゆっくり再生する。',
  relic_warden:'灰冠遺跡の最奥を守る古代の守護者。失われた機構で定期的に再構成される。'
};
for(const e of Object.values(enemies))e.flavor=e.flavor||enemyFlavor[e.id]||`${e.name}についての詳しい生態はまだ調査中。`;
