import { dungeons, enemies, items, materials, recipes } from '../data/gameData.js';

export function defaultState() {
  return {
    version: 2,
    player: { name:'冒険者', level:1, exp:0, baseMaxHp:44, baseMaxMp:16, baseAtk:8, baseDef:4, hp:44, mp:16, equipment:{weapon:'novice_sword', armor:'travel_clothes'} },
    ownedItems: { novice_sword:1, travel_clothes:1 },
    inventory: { herb:3, slime_gel:1, beast_fang:0, iron_ore:0, bone:0, magic_crystal:0, flame_crystal:0 },
    clears: {}, run: null, battle: null, idle: null,
    log: ['冒険がはじまった。'], settings: { vibrate: true }
  };
}

export function expToNext(level) { return 28 + level * level * 14; }
const levelHp = l => (l-1)*7;
const levelMp = l => (l-1)*2;
const levelAtk = l => (l-1)*3;
const levelDef = l => (l-1)*2;
const rand = (min,max) => Math.floor(Math.random()*(max-min+1))+min;
const pick = a => a[rand(0,a.length-1)];
const pushBattle = (battle, message) => { battle.log.push(message); if (battle.log.length > 16) battle.log.shift(); };

export function derived(state) {
  const p = state.player;
  const w = items[p.equipment.weapon];
  const a = items[p.equipment.armor];
  return {
    maxHp: p.baseMaxHp + levelHp(p.level) + (w?.hp||0) + (a?.hp||0),
    maxMp: p.baseMaxMp + levelMp(p.level) + (w?.mp||0) + (a?.mp||0),
    atk: p.baseAtk + levelAtk(p.level) + (w?.atk||0) + (a?.atk||0),
    def: p.baseDef + levelDef(p.level) + (w?.def||0) + (a?.def||0)
  };
}

export function normalize(state) {
  const base=defaultState();
  const s = {...base, ...state, version:2};
  s.player = {...base.player, ...(state?.player||{})};
  delete s.player.gold;
  s.player.equipment = {...base.player.equipment, ...(state?.player?.equipment||{})};
  s.inventory = {...base.inventory, ...(state?.inventory||{})};
  s.ownedItems = {...base.ownedItems, ...(state?.ownedItems||{})};
  s.clears = {...(state?.clears||{})};
  s.settings = {...base.settings, ...(state?.settings||{})};
  if (s.run && !Array.isArray(s.run.map)) { s.run=null; s.battle=null; }
  const d = derived(s);
  s.player.hp = Math.min(Math.max(0,Number.isFinite(s.player.hp)?s.player.hp:d.maxHp),d.maxHp);
  s.player.mp = Math.min(Math.max(0,Number.isFinite(s.player.mp)?s.player.mp:d.maxMp),d.maxMp);
  return s;
}

const MAP_DEF = [
  ['start','入口',50,4,['r1a','r1b','r1c']],
  ['r1a','',20,19,['r2a','r2b']], ['r1b','',50,19,['r2b','r2c']], ['r1c','',80,19,['r2c','r2d']],
  ['r2a','',12,35,['r3a']], ['r2b','',38,35,['r3a','r3b']], ['r2c','',62,35,['r3b','r3c']], ['r2d','',88,35,['r3c']],
  ['r3a','',20,51,['r4a','r4b']], ['r3b','',50,51,['r4b','r4c']], ['r3c','',80,51,['r4c','r4d']],
  ['r4a','',12,67,['r5a']], ['r4b','',38,67,['r5a','r5b']], ['r4c','',62,67,['r5a','r5b']], ['r4d','',88,67,['r5b']],
  ['r5a','',30,82,['boss']], ['r5b','',70,82,['boss']],
  ['boss','',50,96,[]]
];

function shuffled(a){ const x=[...a]; for(let i=x.length-1;i>0;i--){const j=rand(0,i);[x[i],x[j]]=[x[j],x[i]];} return x; }
function createMap(){
  const types={
    r1a:'battle',r1b:'battle',r1c:'battle',
    r2a:'battle',r2b:'forage',r2c:'camp',r2d:'battle',
    r3a:'battle',r3b:'elite',r3c:'battle',
    r4a:'battle',r4b:'forage',r4c:'camp',r4d:'battle',
    r5a:'elite',r5b:'camp', boss:'boss'
  };
  const row2=shuffled(['battle','forage','camp','battle']); ['r2a','r2b','r2c','r2d'].forEach((id,i)=>types[id]=row2[i]);
  const row4=shuffled(['battle','forage','camp','battle']); ['r4a','r4b','r4c','r4d'].forEach((id,i)=>types[id]=row4[i]);
  if(Math.random()<.5){ types.r5a='camp'; types.r5b='elite'; }
  return MAP_DEF.map(([id,label,x,y,next])=>({id,label,x,y,next,type:id==='start'?'start':types[id],visited:id==='start',resolved:id==='start'}));
}

export function startDungeon(state, dungeonId) {
  const d = dungeons[dungeonId];
  if (!d || state.player.level < d.unlockLevel) return {ok:false,msg:'まだこのダンジョンには挑めない。'};
  if (state.player.hp<=0) return {ok:false,msg:'HPが0だ。町で休んでから出発しよう。'};
  state.run = { dungeonId, currentNode:'start', map:createMap(), rewards:{exp:0,drops:{}}, startedAt:Date.now() };
  state.battle=null;
  return {ok:true};
}

export function availableNodeIds(state){
  if(!state.run) return [];
  const current=state.run.map.find(n=>n.id===state.run.currentNode);
  if(!current?.resolved) return [];
  return current.next;
}

export function enterNode(state,nodeId){
  if(!state.run || !availableNodeIds(state).includes(nodeId)) return {ok:false,msg:'そのマスへは進めない。'};
  const node=state.run.map.find(n=>n.id===nodeId); if(!node) return {ok:false,msg:'マスが見つからない。'};
  state.run.currentNode=nodeId; node.visited=true; node.resolved=false;
  if(['battle','elite','boss'].includes(node.type)) { beginNodeEncounter(state,node); return {ok:true,type:node.type}; }
  if(node.type==='forage') {
    const d=dungeons[state.run.dungeonId]; const count=rand(1,3); const got={};
    for(let i=0;i<count;i++){ const id=pick(d.forage); got[id]=(got[id]||0)+1; state.run.rewards.drops[id]=(state.run.rewards.drops[id]||0)+1; }
    node.resolved=true;
    return {ok:true,type:'forage',msg:`採取した：${Object.entries(got).map(([id,n])=>`${materials[id].name}×${n}`).join(' / ')}`};
  }
  if(node.type==='camp') return {ok:true,type:'camp',msg:'休憩方法を選べる。'};
  return {ok:true};
}

function beginNodeEncounter(state,node){
  const d=dungeons[state.run.dungeonId];
  const enemyId=node.type==='boss'?d.boss:pick(d.enemyPool);
  const base=enemies[enemyId]; const elite=node.type==='elite';
  const hpScale=elite?1.55:1, atkScale=elite?1.22:1, defScale=elite?1.15:1, expScale=elite?1.7:1;
  const maxHp=Math.ceil(base.hp*hpScale);
  state.battle={
    nodeId:node.id, nodeType:node.type, enemyId, enemyHp:maxHp, enemyMaxHp:maxHp,
    enemyAtk:Math.ceil(base.atk*atkScale), enemyDef:Math.ceil(base.def*defScale), expReward:Math.ceil(base.exp*expScale),
    guarding:false, over:false, won:false, log:[`${elite?'強敵 ':''}${base.name}が あらわれた！`]
  };
}

export function command(state, type) {
  const b = state.battle; if (!b || b.over) return;
  const e = enemies[b.enemyId], st = derived(state); b.guarding = false;
  if (type === 'attack') {
    const dmg = Math.max(1, st.atk + rand(-2,3) - Math.floor(b.enemyDef*.55)); b.enemyHp=Math.max(0,b.enemyHp-dmg); pushBattle(b,`${e.name}に ${dmg} ダメージ！`);
  } else if (type === 'skill') {
    if (state.player.mp < 3) return pushBattle(b,'MPが たりない！');
    state.player.mp -= 3; const dmg=Math.max(2,Math.floor(st.atk*1.7)+rand(-2,4)-Math.floor(b.enemyDef*.35)); b.enemyHp=Math.max(0,b.enemyHp-dmg); pushBattle(b,`火炎斬り！ ${dmg} ダメージ！`);
  } else if (type === 'heal') {
    if (state.player.mp < 4) return pushBattle(b,'MPが たりない！');
    state.player.mp -= 4; const before=state.player.hp; state.player.hp=Math.min(st.maxHp,state.player.hp+18+state.player.level*4+rand(0,5)); pushBattle(b,`ホイミ！ HPが ${state.player.hp-before} 回復した。`);
  } else if (type === 'defend') { b.guarding=true; pushBattle(b,'身を守っている。');
  } else if (type === 'herb') {
    if ((state.inventory.herb||0)<=0) return pushBattle(b,'薬草を持っていない。');
    state.inventory.herb--; const before=state.player.hp; state.player.hp=Math.min(st.maxHp,state.player.hp+24); pushBattle(b,`薬草を使った。HPが ${state.player.hp-before} 回復した。`);
  }
  if (b.enemyHp<=0) return victory(state);
  enemyTurn(state);
}

function enemyTurn(state){
  const b=state.battle,e=enemies[b.enemyId],st=derived(state); let dmg=Math.max(1,b.enemyAtk+rand(-2,3)-Math.floor(st.def*.45));
  if(b.guarding)dmg=Math.max(1,Math.floor(dmg*.45)); state.player.hp=Math.max(0,state.player.hp-dmg); pushBattle(b,`${e.name}の攻撃！ ${dmg} ダメージ。`);
  if(state.player.hp<=0){ b.over=true;b.won=false;pushBattle(b,'ちからつきた……。未確定の戦果を失う。'); }
}

function victory(state){
  const b=state.battle,e=enemies[b.enemyId]; b.over=true;b.won=true; state.run.rewards.exp+=b.expReward;
  for(const [mat,chance] of e.drops){ const c=b.nodeType==='elite'?Math.min(1,chance*1.35):chance; if(Math.random()<=c){state.run.rewards.drops[mat]=(state.run.rewards.drops[mat]||0)+1;} }
  pushBattle(b,`${e.name}を倒した！ EXP +${b.expReward} は持ち帰るまで未確定。`);
}

export function finishBattleNode(state){
  if(!state.battle?.over || !state.battle?.won || !state.run) return {ok:false};
  const node=state.run.map.find(n=>n.id===state.battle.nodeId); if(node)node.resolved=true;
  const boss=state.battle.nodeType==='boss'; state.battle=null;
  if(boss){ const d=dungeons[state.run.dungeonId]; state.clears[d.id]=(state.clears[d.id]||0)+1; const rewards=bankRunRewards(state); state.log.unshift(`${d.name}を踏破した！`); state.run=null; return {ok:true,done:true,rewards,dungeon:d}; }
  return {ok:true,done:false};
}

export function campChoice(state,kind){
  if(!state.run) return {ok:false,msg:'探索中ではない。'};
  const node=state.run.map.find(n=>n.id===state.run.currentNode);
  if(!node || node.type!=='camp' || node.resolved) return {ok:false,msg:'ここでは休憩できない。'};
  const d=derived(state);
  if(kind==='hp'){ const before=state.player.hp; state.player.hp=Math.min(d.maxHp,state.player.hp+Math.ceil(d.maxHp*.38)); node.resolved=true; return {ok:true,msg:`HPを ${state.player.hp-before} 回復した。`}; }
  if(kind==='mp'){ const before=state.player.mp; state.player.mp=Math.min(d.maxMp,state.player.mp+Math.ceil(d.maxMp*.42)); node.resolved=true; return {ok:true,msg:`MPを ${state.player.mp-before} 回復した。`}; }
  return {ok:false,msg:'休憩方法が不正。'};
}

function addExp(state, amount){
  state.player.exp+=amount;
  while(state.player.exp>=expToNext(state.player.level)){
    state.player.exp-=expToNext(state.player.level); state.player.level++; state.log.unshift(`レベル ${state.player.level} になった！`);
  }
}

function bankRunRewards(state){
  const rewards=structuredClone(state.run?.rewards||{exp:0,drops:{}}); addExp(state,rewards.exp||0);
  for(const [id,n] of Object.entries(rewards.drops||{})) state.inventory[id]=(state.inventory[id]||0)+n;
  return rewards;
}

export function retreat(state){
  if(!state.run) return {ok:false,rewards:{exp:0,drops:{}}};
  const d=dungeons[state.run.dungeonId], rewards=bankRunRewards(state); state.log.unshift(`${d.name}から撤退。戦果を持ち帰った。`); state.run=null;state.battle=null; return {ok:true,rewards};
}

export function defeatReturn(state){
  if(!state.run) return {ok:false};
  const lost=structuredClone(state.run.rewards); const d=dungeons[state.run.dungeonId]; state.log.unshift(`${d.name}で力尽き、未確定の戦果を失った。`); state.run=null;state.battle=null; return {ok:true,lost};
}

export function restAtTown(state){ const d=derived(state); const changed=state.player.hp<d.maxHp||state.player.mp<d.maxMp; state.player.hp=d.maxHp;state.player.mp=d.maxMp; if(changed)state.log.unshift('町で休んでHP/MPを回復した。'); return {ok:true,changed}; }

export function canCraft(state, recipe){ return Object.entries(recipe.cost).every(([id,n])=>(state.inventory[id]||0)>=n); }
export function craft(state, recipeId){ const r=recipes.find(x=>x.id===recipeId); if(!r||!canCraft(state,r))return {ok:false,msg:'素材が足りない。'}; for(const [id,n] of Object.entries(r.cost))state.inventory[id]-=n; state.ownedItems[r.item]=(state.ownedItems[r.item]||0)+1; state.log.unshift(`${items[r.item].name}を作った！`); return {ok:true,msg:`${items[r.item].name} 完成！`}; }
export function equip(state,itemId){ const item=items[itemId];if(!item||!(state.ownedItems[itemId]>0))return false;state.player.equipment[item.slot]=itemId;const d=derived(state);state.player.hp=Math.min(state.player.hp,d.maxHp);state.player.mp=Math.min(state.player.mp,d.maxMp);return true; }

export function startIdle(state,dungeonId){ const d=dungeons[dungeonId];if(!d||state.player.level<d.unlockLevel)return {ok:false,msg:'まだ放置探索できない。'};state.idle={dungeonId,startedAt:Date.now()};return {ok:true}; }
export function idleStatus(state,now=Date.now()){ if(!state.idle)return null;const d=dungeons[state.idle.dungeonId],elapsedMs=Math.max(0,now-state.idle.startedAt),cappedMs=Math.min(elapsedMs,8*60*60*1000),cycleMs=d.cycleMinutes*60*1000,cycles=Math.floor(cappedMs/cycleMs);return {d,elapsedMs,cappedMs,cycles,cycleMs,nextMs:cycleMs-(cappedMs%cycleMs)}; }
export function claimIdle(state,now=Date.now()){
  const status=idleStatus(state,now);if(!status||status.cycles<1)return {ok:false,msg:'まだ1周分の探索が終わっていない。'};
  const {d,cycles}=status,variance=.88+Math.random()*.24,exp=Math.floor(d.idle.exp*cycles*variance),drops={};addExp(state,exp);
  for(const [id,avg] of Object.entries(d.idle.drops)){const n=Math.max(0,Math.floor(avg*cycles*(.75+Math.random()*.5)));if(n){state.inventory[id]=(state.inventory[id]||0)+n;drops[id]=n;}}
  state.idle=null;state.log.unshift(`${d.name}の放置探索から帰還した。`);return {ok:true,result:{cycles,exp,drops,dungeon:d}};
}

export { dungeons, enemies, items, materials, recipes };
