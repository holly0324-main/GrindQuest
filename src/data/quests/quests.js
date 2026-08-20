// Quest definitions are intentionally declarative. Runtime progress/reward logic lives in game/quests.
export const quests=[
  {
    id:'slime_patrol',title:'街道のスライム掃討',issuer:'ミナト村・自警団',rank:0,
    summary:'村はずれで増えているスライムを少し減らしてほしい。',
    objectives:[{type:'kill',enemyId:'slime',count:3}],
    rewards:[{type:'gold',amount:50}],
  },
  {
    id:'slime_gel_delivery',title:'ゼリーを研究机へ',issuer:'村の雑貨研究会',rank:0,
    summary:'スライムゼリーをまとめて納品する簡単な依頼。',
    objectives:[{type:'deliver',itemId:'slime_gel',count:5,consume:true}],
    rewards:[{type:'gold',amount:70},{type:'item',itemId:'potion',count:1,quality:0}],
  },
  {
    id:'iron_vein_report',title:'鉄鉱石を見つけて',issuer:'ミナト村の鍛冶屋',rank:1,
    summary:'周辺で鉄鉱石が採れる場所を確認し、現物か確かな知識を持ち帰る。',
    objectives:[{type:'discover',target:'item',id:'iron_ore'}],
    rewards:[{type:'gold',amount:35},{type:'recipe',recipeId:'m_iron_ingot',name:'鉄のインゴット'}],
  },
  {
    id:'old_mine_depths',title:'旧鉱山・最奥の確認',issuer:'ミナト村・探索組合',rank:2,
    summary:'旧鉱山の深部へ入り、鉱脈心室の主を倒して最奥の安全を確認する。',
    prerequisites:[{type:'quest_claimed',questId:'iron_vein_report'}],
    objectives:[{type:'dungeon',bossKey:'old_mine_lower:boss_chamber',label:'旧鉱山・鉱脈心室'}],
    rewards:[{type:'gold',amount:180},{type:'item',itemId:'magic_crystal',count:2,quality:1}],
  },
];
