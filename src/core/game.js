import { backpacks, consumables, enemies, items, materials, randomEvents, recipes, worldEdges, worldNodes, zones } from '../data/gameData.js';

const rand=(min,max)=>Math.floor(Math.random()*(max-min+1))+min;
const pick=a=>a[rand(0,a.length-1)];
const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));

export function defaultState(){
  return {
    version:3,
    player:{name:'冒険者',level:1,exp:0,baseMaxHp:46,baseMaxMp:16,baseAtk:8,baseDef:4,hp:46,mp:16,equipment:{weapon:'novice_sword',armor:'travel_clothes'}},
    gold:80,
    backpack:'cheap',
    consumables:{potion:1,rura_potion:0},
    ownedItems:{novice_sword:1,travel_clothes:1},
    inventory:{slime_gel:1,beast_fang:0,iron_ore:0,bone:0,magic_crystal:0,flame_crystal:0,softwood:0,hardwood:0,river_fish:0,silver_fish:0,mushroom:0,old_relic:0},
    calendar:{day:1,stepOfDay:0},
    run:null,battle:null,
    // 放置コードはv0.2から残すがUIから封印。
    idle:null,
    log:['ミナト村での暮らしがはじまった。'],
    settings:{vibrate:true}
  };
}

export function expToNext(level){return 28+level*level*14;}
const levelHp=l=>(l-1)*7, levelMp=l=>(l-1)*2, levelAtk=l=>(l-1)*3, levelDef=l=>(l-1)*2;
export function derived(state){const p=state.player,w=items[p.equipment.weapon],a=items[p.equipment.armor];return{maxHp:p.baseMaxHp+levelHp(p.level)+(w?.hp||0)+(a?.hp||0),maxMp:p.baseMaxMp+levelMp(p.level)+(w?.mp||0)+(a?.mp||0),atk:p.baseAtk+levelAtk(p.level)+(w?.atk||0)+(a?.atk||0),def:p.baseDef+levelDef(p.level)+(w?.def||0)+(a?.def||0)}};

export function normalize(state){
  const base=defaultState(),s={...base,...(state||{}),version:3};
  s.player={...base.player,...(state?.player||{})};s.player.equipment={...base.player.equipment,...(state?.player?.equipment||{})};
  s.gold=Number.isFinite(state?.gold)?state.gold:(state?.player?.gold||base.gold);
  s.inventory={...base.inventory,...(state?.inventory||{})};delete s.inventory.herb;
  s.consumables={...base.consumables,...(state?.consumables||{})};s.ownedItems={...base.ownedItems,...(state?.ownedItems||{})};
  s.calendar={...base.calendar,...(state?.calendar||{})};s.backpack=backpacks[state?.backpack]?state.backpack:'cheap';s.settings={...base.settings,...(state?.settings||{})};
  // v0.2の旧縦マップ探索は継続不能なので安全に村へ戻す。
  if(s.run && (!s.run.location || !worldNodes[s.run.location])){s.run=null;s.battle=null;}
  const d=derived(s);s.player.hp=clamp(Number.isFinite(s.player.hp)?s.player.hp:d.maxHp,0,d.maxHp);s.player.mp=clamp(Number.isFinite(s.player.mp)?s.player.mp:d.maxMp,0,d.maxMp);
  return s;
}

export function phaseInfo(state){const idx=Math.floor((state.calendar.stepOfDay||0)/30)%3;return{index:idx,key:['morning','day','night'][idx],name:['朝','昼','夜'][idx],icon:['🌅','☀️','🌙'][idx],remaining:30-((state.calendar.stepOfDay||0)%30)}};
export function advanceTime(state,steps){const before=phaseInfo(state);let total=(state.calendar.stepOfDay||0)+Math.max(0,steps);while(total>=90){total-=90;state.calendar.day++;}state.calendar.stepOfDay=total;const after=phaseInfo(state);return{before,after,changed:before.key!==after.key,day:state.calendar.day};}

function edgeBetween(a,b){return worldEdges.find(e=>(e.a===a&&e.b===b)||(e.a===b&&e.b===a));}
export function adjacentNodes(id){return worldEdges.filter(e=>e.a===id||e.b===id).map(e=>({id:e.a===id?e.b:e.a,edge:e,node:worldNodes[e.a===id?e.b:e.a]}));}
export function backpackCapacity(state){return backpacks[state.backpack]?.capacity||12;}
export function usedCapacity(state){
  let used=0;for(const [id,n] of Object.entries(state.consumables||{}))used+=(consumables[id]?.bulk||0)*n;
  if(state.run){used+=(state.run.freshHerbs||0);for(const [id,n] of Object.entries(state.run.cargo||{}))used+=(materials[id]?.bulk||1)*n;}
  return used;
}
export function freeCapacity(state){return Math.max(0,backpackCapacity(state)-usedCapacity(state));}

function addCargo(state,id,count=1){
  if(!state.run)return 0;const bulk=materials[id]?.bulk||1;let added=0;
  while(added<count&&freeCapacity(state)>=bulk){state.run.cargo[id]=(state.run.cargo[id]||0)+1;added++;}
  return added;
}
function addHerb(state,count=1){let added=0;while(added<count&&freeCapacity(state)>=1){state.run.freshHerbs++;added++;}return added;}

export function startExpedition(state){
  if(state.run)return{ok:false,msg:'すでに探索中。'};if(state.player.hp<=0)return{ok:false,msg:'HPが0だ。村で休もう。'};
  state.run={location:'town',cargo:{},freshHerbs:0,pendingExp:0,harvested:[],visited:['town'],lastEvent:null,moves:0,effects:{encounterMod:0,moves:0}};state.battle=null;
  return{ok:true,msg:'村を出発した。'};
}

function weightedEvent(zone,phase){const pool=randomEvents.filter(e=>(!e.zones||e.zones.includes(zone))&&(!e.phases||e.phases.includes(phase)));const total=pool.reduce((a,e)=>a+(e.weight||1),0);let r=Math.random()*total;for(const e of pool){r-=e.weight||1;if(r<=0)return e;}return pool.at(-1);}
function applyEvent(state,event){const ef=event.effect||{};let suffix='';if(ef.herb){const n=addHerb(state,ef.herb);suffix=n?` 薬草+${n}`:' バッグがいっぱいで薬草は置いてきた。';}
  if(ef.cargo){const [id,n]=ef.cargo,a=addCargo(state,id,n);suffix=a?` ${materials[id].name}+${a}`:' バッグがいっぱいで持てない。';}
  if(ef.randomCargo){const id=pick(ef.randomCargo),a=addCargo(state,id,1);suffix=a?` ${materials[id].name}+1`:' バッグがいっぱいで持てない。';}
  if(ef.hp){const d=derived(state),before=state.player.hp;state.player.hp=Math.min(d.maxHp,state.player.hp+ef.hp);suffix+=` HP+${state.player.hp-before}`;}
  if(ef.encounterMod!=null){state.run.effects={encounterMod:ef.encounterMod,moves:ef.moves||1};}
  if(ef.steps){advanceTime(state,ef.steps);suffix+=` ${ef.steps}ステップ経過。`;}
  return event.text+suffix;
}
function resolveArrivalEvent(state){if(!state.run)return null;const node=worldNodes[state.run.location];if(node.zone==='village')return null;if(Math.random()>.48){state.run.lastEvent='特に目立った出来事はなかった。';return state.run.lastEvent;}const ev=weightedEvent(node.zone,phaseInfo(state).key);state.run.lastEvent=applyEvent(state,ev);return state.run.lastEvent;}

function maybeEncounter(state,edge){const node=worldNodes[state.run.location],zone=zones[node.zone],phase=phaseInfo(state);if(!zone||!zone.encounter)return false;let chance=zone.encounter*(edge?.risk||1);if(phase.key==='night')chance+=.08;if(state.run.effects?.moves>0){chance+=state.run.effects.encounterMod||0;state.run.effects.moves--;if(state.run.effects.moves<=0)state.run.effects={encounterMod:0,moves:0};}if(Math.random()>clamp(chance,0,.75))return false;const pool=zone.pools[phase.key]||zone.pools.day;if(!pool?.length)return false;beginEncounter(state,pick(pool));return true;}

export function travelTo(state,target){
  if(!state.run||state.battle)return{ok:false,msg:'今は移動できない。'};const from=state.run.location,edge=edgeBetween(from,target);if(!edge)return{ok:false,msg:'そこへ直接は行けない。'};
  let steps=edge.steps;if(state.run.effects?.nextDiscount){steps=Math.max(1,steps-state.run.effects.nextDiscount);delete state.run.effects.nextDiscount;}
  const time=advanceTime(state,steps);state.run.location=target;state.run.moves++;if(!state.run.visited.includes(target))state.run.visited.push(target);
  if(target==='town'){const report=returnToTown(state,'walk');return{ok:true,returned:true,report,msg:'歩いて村へ戻った。'};}
  const encounter=maybeEncounter(state,edge);if(encounter){state.run.lastEvent=time.changed?`${time.after.icon} ${time.after.name}になった。`:'移動中に魔物の気配！';return{ok:true,battle:true,msg:state.run.lastEvent};}
  const ev=resolveArrivalEvent(state);const prefix=time.changed?`${time.after.icon} ${time.after.name}になった。 `:'';return{ok:true,msg:prefix+(ev||`${worldNodes[target].name}に着いた。`)};
}

function beginEncounter(state,enemyId){const e=enemies[enemyId];state.battle={enemyId,enemyHp:e.hp,enemyMaxHp:e.hp,enemyAtk:e.atk,enemyDef:e.def,expReward:e.exp,over:false,won:false,guarding:false,log:[`${e.name}が あらわれた！`]};}
const pushBattle=(b,m)=>{b.log.push(m);if(b.log.length>18)b.log.shift();};
export function command(state,type){const b=state.battle;if(!b||b.over)return;const e=enemies[b.enemyId],st=derived(state);b.guarding=false;
  if(type==='attack'){const dmg=Math.max(1,st.atk+rand(-2,3)-Math.floor(b.enemyDef*.55));b.enemyHp=Math.max(0,b.enemyHp-dmg);pushBattle(b,`${e.name}に ${dmg} ダメージ！`);}
  else if(type==='skill'){if(state.player.mp<3)return pushBattle(b,'MPが たりない！');state.player.mp-=3;const dmg=Math.max(2,Math.floor(st.atk*1.7)+rand(-2,4)-Math.floor(b.enemyDef*.35));b.enemyHp=Math.max(0,b.enemyHp-dmg);pushBattle(b,`火炎斬り！ ${dmg} ダメージ！`);}
  else if(type==='heal'){if(state.player.mp<4)return pushBattle(b,'MPが たりない！');state.player.mp-=4;const before=state.player.hp;state.player.hp=Math.min(st.maxHp,state.player.hp+18+state.player.level*4+rand(0,5));pushBattle(b,`ホイミ！ HPが ${state.player.hp-before} 回復した。`);}
  else if(type==='defend'){b.guarding=true;pushBattle(b,'身を守っている。');}
  else if(type==='herb'){if(!state.run||(state.run.freshHerbs||0)<=0)return pushBattle(b,'新鮮な薬草を持っていない。');state.run.freshHerbs--;const before=state.player.hp;state.player.hp=Math.min(st.maxHp,state.player.hp+24);pushBattle(b,`薬草を使った。HPが ${state.player.hp-before} 回復した。`);}
  else if(type==='potion'){if((state.consumables.potion||0)<=0)return pushBattle(b,'ポーションを持っていない。');state.consumables.potion--;const before=state.player.hp;state.player.hp=Math.min(st.maxHp,state.player.hp+45);pushBattle(b,`ポーションを使った。HPが ${state.player.hp-before} 回復した。`);}
  if(b.enemyHp<=0)return victory(state);enemyTurn(state);
}
function enemyTurn(state){const b=state.battle,e=enemies[b.enemyId],st=derived(state);let dmg=Math.max(1,b.enemyAtk+rand(-2,3)-Math.floor(st.def*.45));if(b.guarding)dmg=Math.max(1,Math.floor(dmg*.45));state.player.hp=Math.max(0,state.player.hp-dmg);pushBattle(b,`${e.name}の攻撃！ ${dmg} ダメージ。`);if(state.player.hp<=0){b.over=true;b.won=false;pushBattle(b,'ちからつきた……。探索中の荷物を失う。');}}
function victory(state){const b=state.battle,e=enemies[b.enemyId];b.over=true;b.won=true;state.run.pendingExp+=b.expReward;for(const [id,chance] of e.drops){if(Math.random()<=chance){const a=addCargo(state,id,1);pushBattle(b,a?`${materials[id].name}を拾った。`:`${materials[id].name}はバッグに入らない。`);}}if(Math.random()<(e.herbChance||0)){const a=addHerb(state,1);pushBattle(b,a?'薬草を見つけた。':'薬草はバッグに入らない。');}pushBattle(b,`EXP +${b.expReward} は帰村時に確定。`);}
export function finishBattle(state){if(!state.battle?.over||!state.battle.won)return{ok:false};state.battle=null;const ev=resolveArrivalEvent(state);return{ok:true,msg:ev||'周囲を見渡した。'};}
export function defeatReturn(state){if(!state.run)return{ok:false};const lost={cargo:{...state.run.cargo},herbs:state.run.freshHerbs,exp:state.run.pendingExp};state.run=null;state.battle=null;state.player.hp=1;state.log.unshift('力尽き、荷物を失って村まで運ばれた。');return{ok:true,lost};}

function addExp(state,amount){state.player.exp+=amount;while(state.player.exp>=expToNext(state.player.level)){state.player.exp-=expToNext(state.player.level);state.player.level++;state.log.unshift(`レベル ${state.player.level} になった！`);}}
function returnToTown(state,method){const report={cargo:{...state.run.cargo},herbsExpired:state.run.freshHerbs,exp:state.run.pendingExp,method};for(const [id,n] of Object.entries(state.run.cargo))state.inventory[id]=(state.inventory[id]||0)+n;addExp(state,state.run.pendingExp);state.run=null;state.battle=null;state.log.unshift(method==='rura'?'ルーラのポーションで村へ帰還した。':'歩いて村へ戻った。');return report;}
export function useRura(state){if(!state.run||state.battle)return{ok:false,msg:'今は使えない。'};if((state.consumables.rura_potion||0)<=0)return{ok:false,msg:'ルーラのポーションを持っていない。'};state.consumables.rura_potion--;const report=returnToTown(state,'rura');return{ok:true,report,msg:'一瞬で村へ帰還した。'};}

export function currentLocation(state){return worldNodes[state.run?.location||'town'];}
export function resourceStatus(state){if(!state.run)return null;const node=currentLocation(state);if(!node.resource)return null;return{kind:node.resource,used:state.run.harvested.includes(node.id),node};}
export function harvestResult(state,quality=0.5){
  const rs=resourceStatus(state);if(!rs||rs.used)return{ok:false,msg:'ここではもう採れない。'};state.run.harvested.push(rs.node.id);const q=clamp(quality,0,1);let got={};
  if(rs.kind==='herb'){const n=q>.8?3:q>.45?2:1,a=addHerb(state,n);got.herb=a;return{ok:true,msg:`薬草を ${a} 本採った。${a<n?' バッグがいっぱいだ。':''}`,got};}
  if(rs.kind==='mining'){const rare=q>.88&&Math.random()<.55;const id=rare?(rs.node.id==='hidden_cave'?'magic_crystal':'iron_ore'):'iron_ore',n=q>.72?2:1,a=addCargo(state,id,n);got[id]=a;return{ok:true,msg:`${materials[id].name}を ${a} 個採掘した。${a<n?' バッグがいっぱいだ。':''}`,got};}
  if(rs.kind==='fishing'){if(q<.2)return{ok:true,msg:'魚に逃げられた。今日はこの場所ではもう釣れそうにない。',got:{}};const rare=q>.82&&Math.random()<.5,id=rare?'silver_fish':'river_fish',a=addCargo(state,id,1);got[id]=a;return{ok:true,msg:a?`${materials[id].name}を釣り上げた！`:'バッグがいっぱいで魚を持てない。',got};}
  if(rs.kind==='woodcut'){const rare=q>.8&&Math.random()<.45,id=rare?'hardwood':'softwood',n=q>.62?2:1,a=addCargo(state,id,n);got[id]=a;return{ok:true,msg:`${materials[id].name}を ${a} 個切り出した。${a<n?' バッグがいっぱいだ。':''}`,got};}
  return{ok:false,msg:'何も起きない。'};
}

export function restAtTown(state){if(state.run)return{ok:false,msg:'探索中は村で休めない。'};const d=derived(state);state.player.hp=d.maxHp;state.player.mp=d.maxMp;const p=phaseInfo(state);let add=(90-state.calendar.stepOfDay)%90;if(add===0)add=90;advanceTime(state,add);state.log.unshift('休息して翌朝になった。');return{ok:true,msg:'しっかり休んだ。翌朝になった。'};}
export function buyConsumable(state,id){const x=consumables[id];if(!x)return{ok:false,msg:'商品がない。'};if(state.gold<x.price)return{ok:false,msg:'お金が足りない。'};if(usedCapacity(state)+x.bulk>backpackCapacity(state))return{ok:false,msg:'バッグに入らない。'};state.gold-=x.price;state.consumables[id]=(state.consumables[id]||0)+1;return{ok:true,msg:`${x.name}を買った。`};}
export function upgradeBackpack(state){const order=['cheap','canvas','explorer'],idx=order.indexOf(state.backpack),next=backpacks[order[idx+1]];if(!next)return{ok:false,msg:'これ以上大きなバッグはない。'};if(state.gold<next.price)return{ok:false,msg:'お金が足りない。'};state.gold-=next.price;state.backpack=next.id;return{ok:true,msg:`${next.name}に買い替えた！`};}
export function sellMaterial(state,id,count=1){if(state.run)return{ok:false,msg:'売却は村にいる時だけ。'};const m=materials[id],have=state.inventory[id]||0,n=count==='all'?have:Math.min(have,Math.max(1,count));if(!m||n<=0)return{ok:false,msg:'売れる素材がない。'};state.inventory[id]-=n;const gain=m.value*n;state.gold+=gain;return{ok:true,msg:`${m.name}×${n}を ${gain}G で売った。`,gain};}
export function sellAll(state){if(state.run)return{ok:false,msg:'売却は村にいる時だけ。'};let gain=0;for(const [id,n] of Object.entries(state.inventory)){if(n>0&&materials[id]){gain+=materials[id].value*n;state.inventory[id]=0;}}state.gold+=gain;return{ok:true,msg:`素材をまとめて ${gain}G で売った。`,gain};}

export function canCraft(state,r){return Object.entries(r.cost).every(([id,n])=>(state.inventory[id]||0)>=n);}
export function craft(state,recipeId){if(state.run)return{ok:false,msg:'鍛冶は村で。'};const r=recipes.find(x=>x.id===recipeId);if(!r||!canCraft(state,r))return{ok:false,msg:'素材が足りない。'};for(const [id,n] of Object.entries(r.cost))state.inventory[id]-=n;state.ownedItems[r.item]=(state.ownedItems[r.item]||0)+1;return{ok:true,msg:`${items[r.item].name} 完成！`};}
export function equip(state,itemId){const item=items[itemId];if(!item||!(state.ownedItems[itemId]>0))return false;state.player.equipment[item.slot]=itemId;const d=derived(state);state.player.hp=Math.min(state.player.hp,d.maxHp);state.player.mp=Math.min(state.player.mp,d.maxMp);return true;}

// --- 封印中の放置探索コード ---
// UIからは呼ばない。将来別モードとして復活できるよう、セーブフィールドと関数だけ残している。
export function startIdle(state,area='outskirts'){state.idle={area,startedAt:Date.now()};return{ok:true};}
export function idleStatus(state,now=Date.now()){if(!state.idle)return null;const elapsed=Math.min(now-state.idle.startedAt,8*60*60*1000);return{elapsed,cycles:Math.floor(elapsed/(10*60*1000))};}
export function claimIdle(state,now=Date.now()){const s=idleStatus(state,now);if(!s||s.cycles<1)return{ok:false};state.idle=null;return{ok:true,result:{cycles:s.cycles}};}

export { backpacks, consumables, enemies, items, materials, recipes, worldEdges, worldNodes, zones };
