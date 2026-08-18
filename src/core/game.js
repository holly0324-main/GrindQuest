import { backpacks, consumables, enemies, items, materials, randomEvents, recipes, worldEdges, worldNodes, zones } from '../data/gameData.js';

const rand=(min,max)=>Math.floor(Math.random()*(max-min+1))+min;
const pick=a=>a[rand(0,a.length-1)];
const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
const sum=(xs,fn)=>xs.reduce((a,x)=>a+fn(x),0);

export const EQUIPMENT_SLOTS=[
  ['weapon','武器'],['shield','盾'],['head','頭'],['body','からだ上'],['arms','腕'],['legs','からだ下'],['feet','足'],['accessory','アクセ']
];

export function defaultState(){
  return {
    version:5,
    player:{
      name:'冒険者',level:1,exp:0,baseMaxHp:46,baseMaxMp:16,baseAtk:8,baseDef:4,hp:46,mp:16,
      equipment:{weapon:'novice_sword',shield:null,head:null,body:'travel_clothes',arms:null,legs:null,feet:null,accessory:null}
    },
    gold:80,
    backpack:'cheap',
    consumables:{potion:1,rura_potion:0,camp_set:0},
    ownedItems:{novice_sword:1,travel_clothes:1},
    inventory:{slime_gel:1,beast_fang:0,iron_ore:0,bone:0,magic_crystal:0,flame_crystal:0,softwood:0,hardwood:0,river_fish:0,silver_fish:0,mushroom:0,old_relic:0,fresh_herb:0},
    calendar:{day:1,stepOfDay:0,totalSteps:0},
    condition:{awakeSteps:0,fatigueStacks:0},
    perishables:[],
    timedProcesses:[],
    run:null,battle:null,idle:null,
    log:['ミナト村での暮らしがはじまった。'],
    settings:{vibrate:true}
  };
}

export function expToNext(level){return 28+level*level*14;}
const levelHp=l=>(l-1)*7, levelMp=l=>(l-1)*2, levelAtk=l=>(l-1)*3, levelDef=l=>(l-1)*2;
export function fatiguePenalty(state){return clamp((state.condition?.fatigueStacks||0)*.10,0,.7);}
export function derived(state){
  const p=state.player,mul=1-fatiguePenalty(state);
  const equipped=Object.values(p.equipment||{}).map(id=>items[id]).filter(Boolean);
  const bonus=(key)=>sum(equipped,x=>x[key]||0);
  const raw={maxHp:p.baseMaxHp+levelHp(p.level)+bonus('hp'),maxMp:p.baseMaxMp+levelMp(p.level)+bonus('mp'),atk:p.baseAtk+levelAtk(p.level)+bonus('atk'),def:p.baseDef+levelDef(p.level)+bonus('def')};
  return {maxHp:Math.max(1,Math.floor(raw.maxHp*mul)),maxMp:Math.max(0,Math.floor(raw.maxMp*mul)),atk:Math.max(1,Math.floor(raw.atk*mul)),def:Math.max(0,Math.floor(raw.def*mul)),fatiguePenalty:1-mul};
}

function addPerishableBatchRaw(state,id,count,container,expiresAt){
  if(count<=0)return 0;
  const existing=state.perishables.find(x=>x.id===id&&x.container===container&&x.expiresAt===expiresAt);
  if(existing)existing.count+=count; else state.perishables.push({id,count,container,expiresAt});
  return count;
}
function migratePerishables(s,old){
  s.perishables=Array.isArray(old?.perishables)?old.perishables.filter(x=>materials[x.id]?.shelfLife&&x.count>0).map(x=>({...x})) : [];
  const now=s.calendar.totalSteps;
  for(const [id,m] of Object.entries(materials)){
    if(!m.shelfLife)continue;
    const n=Number(old?.inventory?.[id]||0);
    if(n>0)addPerishableBatchRaw(s,id,n,'storage',now+m.shelfLife);
    s.inventory[id]=0;
  }
  const oldHerbs=Number(old?.run?.freshHerbs||0);
  if(oldHerbs>0)addPerishableBatchRaw(s,'fresh_herb',oldHerbs,'bag',now+materials.fresh_herb.shelfLife);
}
export function normalize(state){
  const base=defaultState(),old=state||{},s={...base,...old,version:5};
  s.player={...base.player,...(old.player||{})};
  const oldEq=old.player?.equipment||{};
  s.player.equipment={...base.player.equipment,...oldEq,body:oldEq.body||oldEq.armor||base.player.equipment.body};
  delete s.player.equipment.armor;
  s.gold=Number.isFinite(old.gold)?old.gold:(old.player?.gold||base.gold);
  s.inventory={...base.inventory,...(old.inventory||{})};
  s.consumables={...base.consumables,...(old.consumables||{})};
  s.ownedItems={...base.ownedItems,...(old.ownedItems||{})};
  s.calendar={...base.calendar,...(old.calendar||{})};
  if(!Number.isFinite(s.calendar.totalSteps))s.calendar.totalSteps=Math.max(0,(Math.max(1,s.calendar.day)-1)*90+(s.calendar.stepOfDay||0));
  s.calendar.day=Math.floor(s.calendar.totalSteps/90)+1;s.calendar.stepOfDay=s.calendar.totalSteps%90;
  s.condition={...base.condition,...(old.condition||{})};
  s.backpack=backpacks[old.backpack]?old.backpack:'cheap';
  s.settings={...base.settings,...(old.settings||{})};
  s.timedProcesses=Array.isArray(old.timedProcesses)?old.timedProcesses.map(x=>({...x})) : [];
  migratePerishables(s,old);
  if(s.run){
    s.run={cargo:{},harvested:[],visited:['town'],lastEvent:null,moves:0,effects:{encounterMod:0,moves:0},...s.run};
    delete s.run.freshHerbs;delete s.run.pendingExp;
    for(const [id,m] of Object.entries(materials)){
      const n=Number(s.run.cargo?.[id]||0);
      if(m.shelfLife&&n>0){addPerishableBatchRaw(s,id,n,'bag',s.calendar.totalSteps+m.shelfLife);delete s.run.cargo[id];}
    }
  }
  if(s.run&&(!s.run.location||!worldNodes[s.run.location])){s.run=null;s.battle=null;}
  expirePerishables(s);matureProcesses(s);
  const d=derived(s);s.player.hp=clamp(Number.isFinite(s.player.hp)?s.player.hp:d.maxHp,0,d.maxHp);s.player.mp=clamp(Number.isFinite(s.player.mp)?s.player.mp:d.maxMp,0,d.maxMp);
  return s;
}

export function phaseInfo(state){const step=state.calendar.stepOfDay||0,idx=Math.floor(step/30)%3;return{index:idx,key:['morning','day','night'][idx],name:['朝','昼','夜'][idx],icon:['🌅','☀️','🌙'][idx],remaining:30-(step%30),stepInPhase:step%30};}
function groupedCounts(list){const out={};for(const x of list)out[x.id]=(out[x.id]||0)+x.count;return out;}
function expirePerishables(state){
  const now=state.calendar.totalSteps||0,expired=[],keep=[];
  for(const b of state.perishables||[]){if(b.expiresAt<=now)expired.push(b);else keep.push(b);}state.perishables=keep;return groupedCounts(expired);
}
function matureProcesses(state){
  const now=state.calendar.totalSteps||0,matured=[];
  for(const p of state.timedProcesses||[]){if(!p.ready&&p.readyAt<=now){p.ready=true;matured.push(p.id);}}
  return matured;
}
function fatigueStacksForAwake(awake){return awake>=180?clamp(Math.floor((awake-180)/30)+1,1,7):0;}
export function advanceTime(state,steps,opts={}){
  steps=Math.max(0,Math.floor(steps||0));const before=phaseInfo(state),beforeDay=state.calendar.day,oldFatigue=state.condition.fatigueStacks||0;
  state.calendar.totalSteps=(state.calendar.totalSteps||0)+steps;state.calendar.day=Math.floor(state.calendar.totalSteps/90)+1;state.calendar.stepOfDay=state.calendar.totalSteps%90;
  if(opts.resting){state.condition.awakeSteps=0;state.condition.fatigueStacks=0;}else if(opts.awake!==false){state.condition.awakeSteps=(state.condition.awakeSteps||0)+steps;state.condition.fatigueStacks=fatigueStacksForAwake(state.condition.awakeSteps);}
  const expired=expirePerishables(state),matured=matureProcesses(state),after=phaseInfo(state),d=derived(state);
  state.player.hp=Math.min(state.player.hp,d.maxHp);state.player.mp=Math.min(state.player.mp,d.maxMp);
  return{before,after,changed:before.key!==after.key||beforeDay!==state.calendar.day,day:state.calendar.day,steps,expired,matured,fatigueBefore:oldFatigue,fatigueAfter:state.condition.fatigueStacks||0};
}
function timeMessages(t){
  const out=[];if(t.changed)out.push(`${t.after.icon} ${t.day}日目 ${t.after.name}になった。`);
  for(const [id,n] of Object.entries(t.expired||{}))out.push(`${materials[id]?.name||id}×${n}が傷んだ。`);
  if(t.fatigueAfter>t.fatigueBefore)out.push(`徹夜疲労が進行。全能力 -${t.fatigueAfter*10}%。`);
  if((t.matured||[]).length)out.push(`完成・熟成した作業が ${t.matured.length} 件ある。`);
  return out;
}

export function startTimedProcess(state,id,duration,payload={}){const job={id,startedAt:state.calendar.totalSteps,readyAt:state.calendar.totalSteps+Math.max(1,duration),ready:false,payload};state.timedProcesses.push(job);return job;}
export function collectTimedProcess(state,id){const i=state.timedProcesses.findIndex(x=>x.id===id&&x.ready);if(i<0)return null;return state.timedProcesses.splice(i,1)[0];}

export function addExp(state,amount,source='経験'){
  amount=Math.max(0,Math.floor(amount||0));if(!amount)return{amount:0,levels:0,msg:''};
  state.player.exp+=amount;let levels=0;
  while(state.player.exp>=expToNext(state.player.level)){
    state.player.exp-=expToNext(state.player.level);state.player.level++;levels++;
    state.log.unshift(`レベル ${state.player.level} になった！ HP/MPはそのまま。`);
  }
  const msg=`${source} EXP +${amount}${levels?` / Lv.${state.player.level}！`:''}`;
  return{amount,levels,msg};
}

function edgeBetween(a,b){return worldEdges.find(e=>(e.a===a&&e.b===b)||(e.a===b&&e.b===a));}
export function adjacentNodes(id){return worldEdges.filter(e=>e.a===id||e.b===id).map(e=>({id:e.a===id?e.b:e.a,edge:e,node:worldNodes[e.a===id?e.b:e.a]}));}
export function backpackCapacity(state){return backpacks[state.backpack]?.capacity||12;}
export function perishableCount(state,id,container){return sum((state.perishables||[]).filter(x=>(!id||x.id===id)&&(!container||x.container===container)),x=>x.count);}
export function perishableSummary(state,container){const now=state.calendar.totalSteps||0,map={};for(const b of state.perishables||[]){if(container&&b.container!==container)continue;const row=map[b.id]||(map[b.id]={id:b.id,count:0,remaining:Infinity});row.count+=b.count;row.remaining=Math.min(row.remaining,Math.max(0,b.expiresAt-now));}return Object.values(map);}
export function materialCount(state,id){return (state.inventory[id]||0)+perishableCount(state,id,'storage');}
export function usedCapacity(state){
  let used=0;for(const [id,n] of Object.entries(state.consumables||{}))used+=(consumables[id]?.bulk||0)*n;
  if(state.run){for(const [id,n] of Object.entries(state.run.cargo||{}))used+=(materials[id]?.bulk||1)*n;used+=sum((state.perishables||[]).filter(x=>x.container==='bag'),x=>(materials[x.id]?.bulk||1)*x.count);}return used;
}
export function freeCapacity(state){return Math.max(0,backpackCapacity(state)-usedCapacity(state));}
function addPerishable(state,id,count=1,container='bag'){
  const m=materials[id];if(!m?.shelfLife)return 0;const bulk=m.bulk||1,added=container==='bag'?Math.min(count,Math.floor(freeCapacity(state)/bulk)):count;
  if(added>0)addPerishableBatchRaw(state,id,added,container,(state.calendar.totalSteps||0)+m.shelfLife);return added;
}
function removePerishable(state,id,count=1,container='bag'){
  let need=count,removed=0;const batches=(state.perishables||[]).filter(x=>x.id===id&&x.container===container).sort((a,b)=>a.expiresAt-b.expiresAt);
  for(const b of batches){if(need<=0)break;const n=Math.min(need,b.count);b.count-=n;need-=n;removed+=n;}state.perishables=state.perishables.filter(x=>x.count>0);return removed;
}
function addCargo(state,id,count=1){if(!state.run)return 0;if(materials[id]?.shelfLife)return addPerishable(state,id,count,'bag');const bulk=materials[id]?.bulk||1;let added=0;while(added<count&&freeCapacity(state)>=bulk){state.run.cargo[id]=(state.run.cargo[id]||0)+1;added++;}return added;}
function addHerb(state,count=1){return addPerishable(state,'fresh_herb',count,'bag');}
function moveBagPerishables(state,to='storage'){for(const b of state.perishables||[]){if(b.container==='bag')b.container=to;}}
function clearBagPerishables(state){const lost=groupedCounts((state.perishables||[]).filter(x=>x.container==='bag'));state.perishables=(state.perishables||[]).filter(x=>x.container!=='bag');return lost;}
function loadFreshHerbs(state){let loaded=0;const batches=(state.perishables||[]).filter(x=>x.id==='fresh_herb'&&x.container==='storage').sort((a,b)=>a.expiresAt-b.expiresAt);for(const b of batches){while(b.count>0&&freeCapacity(state)>=materials.fresh_herb.bulk){b.count--;addPerishableBatchRaw(state,'fresh_herb',1,'bag',b.expiresAt);loaded++;}}state.perishables=state.perishables.filter(x=>x.count>0);return loaded;}

export function startExpedition(state){
  if(state.run)return{ok:false,msg:'すでに探索中。'};if(state.player.hp<=0)return{ok:false,msg:'HPが0だ。村で休もう。'};
  state.run={location:'town',cargo:{},harvested:[],visited:['town'],lastEvent:null,moves:0,effects:{encounterMod:0,moves:0},startedAtStep:state.calendar.totalSteps};state.battle=null;
  const herbs=loadFreshHerbs(state);return{ok:true,msg:`村を出発した。${herbs?` 保存中の薬草を${herbs}本持った。`:''}`};
}

function weightedEvent(zone,phase){const pool=randomEvents.filter(e=>(!e.zones||e.zones.includes(zone))&&(!e.phases||e.phases.includes(phase)));const total=pool.reduce((a,e)=>a+(e.weight||1),0);let r=Math.random()*total;for(const e of pool){r-=e.weight||1;if(r<=0)return e;}return pool.at(-1);}
function applyEvent(state,event){
  const ef=event.effect||{};let suffix='';
  if(ef.herb){const n=addHerb(state,ef.herb);suffix=n?` 薬草+${n}`:' バッグがいっぱいで薬草は置いてきた。';}
  if(ef.cargo){const [id,n]=ef.cargo,a=addCargo(state,id,n);suffix+=a?` ${materials[id].name}+${a}`:' バッグがいっぱいで持てない。';}
  if(ef.randomCargo){const id=pick(ef.randomCargo),a=addCargo(state,id,1);suffix+=a?` ${materials[id].name}+1`:' バッグがいっぱいで持てない。';}
  if(ef.encounterMod!=null)state.run.effects={encounterMod:ef.encounterMod,moves:ef.moves||1};
  if(ef.steps){const t=advanceTime(state,ef.steps);suffix+=` ${ef.steps}step経過。`;const msgs=timeMessages(t);if(msgs.length)suffix+=` ${msgs.join(' ')}`;}
  const xp=ef.exp??(event.id==='nothing'?0:1);if(xp){const x=addExp(state,xp,'探索');suffix+=` ${x.msg}`;}
  return event.text+suffix;
}
function resolveArrivalEvent(state){if(!state.run)return null;const node=worldNodes[state.run.location];if(node.zone==='village')return null;if(Math.random()>.48){state.run.lastEvent='特に目立った出来事はなかった。';return state.run.lastEvent;}const ev=weightedEvent(node.zone,phaseInfo(state).key);state.run.lastEvent=applyEvent(state,ev);return state.run.lastEvent;}

function beginEncounter(state,enemyId,reason='encounter'){const e=enemies[enemyId];state.battle={enemyId,enemyHp:e.hp,enemyMaxHp:e.hp,enemyAtk:e.atk,enemyDef:e.def,expReward:e.exp,over:false,won:false,guarding:false,turn:1,reason,log:[`${e.name}が あらわれた！`]};}
function maybeEncounter(state,edge){const node=worldNodes[state.run.location],zone=zones[node.zone],phase=phaseInfo(state);if(!zone||!zone.encounter)return false;let chance=zone.encounter*(edge?.risk||1);if(phase.key==='night')chance+=.08;if(state.run.effects?.moves>0){chance+=state.run.effects.encounterMod||0;state.run.effects.moves--;if(state.run.effects.moves<=0)state.run.effects={encounterMod:0,moves:0};}if(Math.random()>clamp(chance,0,.75))return false;const pool=zone.pools[phase.key]||zone.pools.day;if(!pool?.length)return false;beginEncounter(state,pick(pool));return true;}

export function travelTo(state,target){
  if(!state.run||state.battle)return{ok:false,msg:'今は移動できない。'};const from=state.run.location,edge=edgeBetween(from,target);if(!edge)return{ok:false,msg:'そこへ直接は行けない。'};
  let steps=edge.steps;if(state.run.effects?.nextDiscount){steps=Math.max(1,steps-state.run.effects.nextDiscount);delete state.run.effects.nextDiscount;}
  const firstVisit=!state.run.visited.includes(target);const time=advanceTime(state,steps);state.run.location=target;state.run.moves++;if(firstVisit)state.run.visited.push(target);
  const notes=timeMessages(time);if(firstVisit&&target!=='town'){const z=worldNodes[target]?.zone,xp={outskirts:2,river:3,forest:4,mountain:5,ruins:6}[z]||2;notes.push(addExp(state,xp,'新しい場所').msg);}
  const timeNote=notes.join(' ');
  if(target==='town'){const report=returnToTown(state,'walk');return{ok:true,returned:true,report,msg:`歩いて村へ戻った。${timeNote?` ${timeNote}`:''}`};}
  const encounter=maybeEncounter(state,edge);if(encounter){state.run.lastEvent=timeNote||'移動中に魔物の気配！';return{ok:true,battle:true,msg:state.run.lastEvent};}
  const ev=resolveArrivalEvent(state);return{ok:true,msg:[timeNote,ev||`${worldNodes[target].name}に着いた。`].filter(Boolean).join(' ')};
}

const pushBattle=(b,m)=>{b.log.push(m);if(b.log.length>22)b.log.shift();};
function finishBattleTurn(state,b){const t=advanceTime(state,1);b.turn++;for(const msg of timeMessages(t))pushBattle(b,msg);}
export function command(state,type){
  const b=state.battle;if(!b||b.over)return{ok:false};const e=enemies[b.enemyId],st=derived(state);b.guarding=false;let valid=true,enemyDamage=0,playerDamage=0,heal=0;
  if(type==='attack'){enemyDamage=Math.max(1,st.atk+rand(-2,3)-Math.floor(b.enemyDef*.55));b.enemyHp=Math.max(0,b.enemyHp-enemyDamage);pushBattle(b,`${state.player.name}の攻撃！ ${e.name}に ${enemyDamage} ダメージ！`);}
  else if(type==='skill'){if(state.player.mp<3){pushBattle(b,'MPが たりない！');valid=false;}else{state.player.mp-=3;enemyDamage=Math.max(2,Math.floor(st.atk*1.7)+rand(-2,4)-Math.floor(b.enemyDef*.35));b.enemyHp=Math.max(0,b.enemyHp-enemyDamage);pushBattle(b,`火炎斬り！ ${e.name}に ${enemyDamage} ダメージ！`);}}
  else if(type==='heal'){if(state.player.mp<4){pushBattle(b,'MPが たりない！');valid=false;}else{state.player.mp-=4;const before=state.player.hp;state.player.hp=Math.min(st.maxHp,state.player.hp+18+state.player.level*4+rand(0,5));heal=state.player.hp-before;pushBattle(b,`ホイミ！ HPが ${heal} 回復した。`);}}
  else if(type==='defend'){b.guarding=true;pushBattle(b,'身を守っている。');}
  else if(type==='herb'){if(perishableCount(state,'fresh_herb','bag')<=0){pushBattle(b,'新鮮な薬草を持っていない。');valid=false;}else{removePerishable(state,'fresh_herb',1,'bag');const before=state.player.hp;state.player.hp=Math.min(st.maxHp,state.player.hp+24);heal=state.player.hp-before;pushBattle(b,`薬草を使った。HPが ${heal} 回復した。`);}}
  else if(type==='potion'){if((state.consumables.potion||0)<=0){pushBattle(b,'ポーションを持っていない。');valid=false;}else{state.consumables.potion--;const before=state.player.hp;state.player.hp=Math.min(st.maxHp,state.player.hp+45);heal=state.player.hp-before;pushBattle(b,`ポーションを使った。HPが ${heal} 回復した。`);}}
  else valid=false;
  if(!valid)return{ok:false};
  let victoryInfo=null;if(b.enemyHp<=0)victoryInfo=victory(state);else playerDamage=enemyTurn(state);
  finishBattleTurn(state,b);return{ok:true,action:type,enemyDamage,playerDamage,heal,victory:victoryInfo};
}
function enemyTurn(state){const b=state.battle,e=enemies[b.enemyId],st=derived(state);let dmg=Math.max(1,b.enemyAtk+rand(-2,3)-Math.floor(st.def*.45));if(b.guarding)dmg=Math.max(1,Math.floor(dmg*.45));state.player.hp=Math.max(0,state.player.hp-dmg);pushBattle(b,`${e.name}の攻撃！ ${state.player.name}は ${dmg} ダメージ。`);if(state.player.hp<=0){b.over=true;b.won=false;pushBattle(b,'ちからつきた……。探索中の荷物を失う。');}return dmg;}
function victory(state){
  const b=state.battle,e=enemies[b.enemyId];b.over=true;b.won=true;const xp=addExp(state,b.expReward,'戦闘');
  for(const [id,chance] of e.drops){if(Math.random()<=chance){const a=addCargo(state,id,1);pushBattle(b,a?`${materials[id].name}を拾った。`:`${materials[id].name}はバッグに入らない。`);}}
  if(Math.random()<(e.herbChance||0)){const a=addHerb(state,1);pushBattle(b,a?'薬草を見つけた。':'薬草はバッグに入らない。');}
  pushBattle(b,xp.msg);return xp;
}
export function finishBattle(state){if(!state.battle?.over||!state.battle.won)return{ok:false};state.battle=null;const ev=resolveArrivalEvent(state);return{ok:true,msg:ev||'周囲を見渡した。'};}
export function defeatReturn(state){if(!state.run)return{ok:false};const lost={cargo:{...state.run.cargo},perishables:clearBagPerishables(state)};state.run=null;state.battle=null;state.player.hp=1;state.log.unshift('力尽き、荷物を失って村まで運ばれた。');return{ok:true,lost};}

function returnToTown(state,method){const fresh=groupedCounts((state.perishables||[]).filter(x=>x.container==='bag'));const report={cargo:{...state.run.cargo},fresh,method};for(const [id,n] of Object.entries(state.run.cargo))state.inventory[id]=(state.inventory[id]||0)+n;moveBagPerishables(state,'storage');state.run=null;state.battle=null;state.log.unshift(method==='rura'?'ルーラのポーションで村へ帰還した。':'歩いて村へ戻った。');return report;}
export function useRura(state){if(!state.run||state.battle)return{ok:false,msg:'今は使えない。'};if((state.consumables.rura_potion||0)<=0)return{ok:false,msg:'ルーラのポーションを持っていない。'};state.consumables.rura_potion--;const t=advanceTime(state,1),report=returnToTown(state,'rura');return{ok:true,report,msg:`ルーラで村へ直行した。1step経過。${timeMessages(t).join(' ')}`};}

export function currentLocation(state){return worldNodes[state.run?.location||'town'];}
export function resourceStatus(state){if(!state.run)return null;const node=currentLocation(state);if(!node.resource)return null;return{kind:node.resource,used:state.run.harvested.includes(node.id),node};}
export function harvestResult(state,quality=0.5){
  const rs=resourceStatus(state);if(!rs||rs.used)return{ok:false,msg:'ここではもう採れない。'};state.run.harvested.push(rs.node.id);const q=clamp(quality,0,1);let got={},msg='';
  if(rs.kind==='herb'){const n=q>.8?3:q>.45?2:1,a=addHerb(state,n);got.fresh_herb=a;msg=`薬草を ${a} 本採った。${a<n?' バッグがいっぱいだ。':''}`;}
  else if(rs.kind==='mining'){const rare=q>.88&&Math.random()<.55,id=rare?(rs.node.id==='hidden_cave'?'magic_crystal':'iron_ore'):'iron_ore',n=q>.72?2:1,a=addCargo(state,id,n);got[id]=a;msg=`${materials[id].name}を ${a} 個採掘した。${a<n?' バッグがいっぱいだ。':''}`;}
  else if(rs.kind==='fishing'){if(q<.2)msg='魚に逃げられた。今日はこの場所ではもう釣れそうにない。';else{const rare=q>.82&&Math.random()<.5,id=rare?'silver_fish':'river_fish',a=addCargo(state,id,1);got[id]=a;msg=a?`${materials[id].name}を釣り上げた！`:'バッグがいっぱいで魚を持てない。';}}
  else if(rs.kind==='woodcut'){const rare=q>.8&&Math.random()<.45,id=rare?'hardwood':'softwood',n=q>.62?2:1,a=addCargo(state,id,n);got[id]=a;msg=`${materials[id].name}を ${a} 個切り出した。${a<n?' バッグがいっぱいだ。':''}`;}
  else return{ok:false,msg:'何も起きない。'};
  const stepCost={herb:2,mining:5,fishing:4,woodcut:5}[rs.kind]||2,t=advanceTime(state,stepCost),xp=addExp(state,{herb:2,mining:4,fishing:3,woodcut:4}[rs.kind]||2,'採集'),notes=timeMessages(t);
  return{ok:true,msg:`${msg} ${stepCost}step経過。 ${xp.msg}${notes.length?` ${notes.join(' ')}`:''}`,got,steps:stepCost,xp};
}

export function useFieldItem(state,id){
  if(!state.run||state.battle)return{ok:false,msg:'探索中に使う道具ではない。'};const d=derived(state);let msg='',steps=2;
  if(id==='fresh_herb'){
    if(perishableCount(state,'fresh_herb','bag')<=0)return{ok:false,msg:'薬草を持っていない。'};removePerishable(state,'fresh_herb',1,'bag');const before=state.player.hp;state.player.hp=Math.min(d.maxHp,state.player.hp+24);msg=`薬草を使った。HP +${state.player.hp-before}`;
  }else if(id==='potion'){
    if((state.consumables.potion||0)<=0)return{ok:false,msg:'ポーションを持っていない。'};state.consumables.potion--;const before=state.player.hp;state.player.hp=Math.min(d.maxHp,state.player.hp+45);msg=`ポーションを使った。HP +${state.player.hp-before}`;
  }else return{ok:false,msg:'ここでは使えない。'};
  const t=advanceTime(state,steps);return{ok:true,steps,msg:`${msg} / ${steps}step経過。 ${timeMessages(t).join(' ')}`};
}

export function sleepDuration(state){const r=phaseInfo(state).remaining;return r>=20?r:r+30;}
export function restAtTown(state){if(state.run)return{ok:false,msg:'探索中は村で休めない。'};const steps=sleepDuration(state),t=advanceTime(state,steps,{resting:true}),d=derived(state);state.player.hp=d.maxHp;state.player.mp=d.maxMp;state.log.unshift(`${steps}ステップ眠って${t.after.name}になった。`);return{ok:true,steps,msg:`${steps}step休息。HP/MP全回復。${t.after.icon} ${t.after.name}になった。`};}
export function campStatus(state){if(!state.run)return null;const node=currentLocation(state);return{allowed:!!node.campSafety,safety:node.campSafety||null,node,hasSet:(state.consumables.camp_set||0)>0};}
function recoverCamp(state,ratio){const d=derived(state);const hpGain=Math.floor((d.maxHp-state.player.hp)*ratio),mpGain=Math.floor((d.maxMp-state.player.mp)*ratio);state.player.hp=Math.min(d.maxHp,state.player.hp+hpGain);state.player.mp=Math.min(d.maxMp,state.player.mp+mpGain);return{hp:hpGain,mp:mpGain};}
export function camp(state){
  if(!state.run||state.battle)return{ok:false,msg:'今はキャンプできない。'};const cs=campStatus(state);if(!cs.allowed)return{ok:false,msg:'ここは野営に向かない。'};if(!cs.hasSet)return{ok:false,msg:'キャンプセットを持っていない。'};
  const steps=sleepDuration(state);
  if(cs.safety==='semi'&&Math.random()<.35){const interrupted=Math.max(10,Math.ceil(steps/2)),t=advanceTime(state,interrupted,{awake:false}),rec=recoverCamp(state,.20),zone=zones[cs.node.zone],pool=zone?.pools?.[phaseInfo(state).key]||zone?.pools?.day||['slime'];beginEncounter(state,pick(pool),'camp_raid');state.run.lastEvent=`野営中に襲撃！ ${interrupted}step経過。`;return{ok:true,raided:true,battle:true,steps:interrupted,msg:`うとうとしたところを襲われた！ HP+${rec.hp} / MP+${rec.mp}。${timeMessages(t).join(' ')}`};}
  const t=advanceTime(state,steps,{resting:true}),rec=recoverCamp(state,.70);state.run.lastEvent=`キャンプで${steps}step休んだ。`;return{ok:true,raided:false,steps,msg:`キャンプ成功。HP+${rec.hp} / MP+${rec.mp}。疲労も解消。${timeMessages(t).join(' ')}`};
}

export function buyConsumable(state,id){const x=consumables[id];if(!x)return{ok:false,msg:'商品がない。'};if(x.max&&(state.consumables[id]||0)>=x.max)return{ok:false,msg:`${x.name}はもう持っている。`};if(state.gold<x.price)return{ok:false,msg:'お金が足りない。'};if(usedCapacity(state)+x.bulk>backpackCapacity(state))return{ok:false,msg:'バッグに入らない。'};state.gold-=x.price;state.consumables[id]=(state.consumables[id]||0)+1;return{ok:true,msg:`${x.name}を買った。`};}
export function upgradeBackpack(state){const order=['cheap','canvas','explorer'],idx=order.indexOf(state.backpack),next=backpacks[order[idx+1]];if(!next)return{ok:false,msg:'これ以上大きなバッグはない。'};if(state.gold<next.price)return{ok:false,msg:'お金が足りない。'};state.gold-=next.price;state.backpack=next.id;return{ok:true,msg:`${next.name}に買い替えた！`};}
export function sellMaterial(state,id,count=1){if(state.run)return{ok:false,msg:'売却は村にいる時だけ。'};const m=materials[id],have=materialCount(state,id),n=count==='all'?have:Math.min(have,Math.max(1,count));if(!m||n<=0)return{ok:false,msg:'売れる素材がない。'};consumeMaterial(state,id,n);const gain=m.value*n;state.gold+=gain;return{ok:true,msg:`${m.name}×${n}を ${gain}G で売った。`,gain};}
export function sellAll(state){if(state.run)return{ok:false,msg:'売却は村にいる時だけ。'};let gain=0;for(const id of Object.keys(materials)){const n=materialCount(state,id);if(n>0){gain+=materials[id].value*n;consumeMaterial(state,id,n);}}state.gold+=gain;return{ok:true,msg:`素材をまとめて ${gain}G で売った。`,gain};}

function consumeMaterial(state,id,count){let left=count,per=Math.min(left,perishableCount(state,id,'storage'));if(per){removePerishable(state,id,per,'storage');left-=per;}if(left>0){const n=Math.min(left,state.inventory[id]||0);state.inventory[id]=Math.max(0,(state.inventory[id]||0)-n);left-=n;}return count-left;}
export function canCraft(state,r){return Object.entries(r.cost).every(([id,n])=>materialCount(state,id)>=n);}
function consumeRecipe(state,r){if(!r||!canCraft(state,r))return false;for(const [id,n] of Object.entries(r.cost))consumeMaterial(state,id,n);return true;}
export function orderCraft(state,recipeId){
  if(state.run)return{ok:false,msg:'鍛冶は村で。'};const r=recipes.find(x=>x.id===recipeId);if(!r||!consumeRecipe(state,r))return{ok:false,msg:'素材が足りない。'};
  const id=`forge_${state.calendar.totalSteps}_${Math.random().toString(36).slice(2,8)}`,job=startTimedProcess(state,id,60,{type:'forge',item:r.item,recipeId:r.id});
  return{ok:true,job,msg:`${items[r.item].name}を鍛冶屋に依頼した。60step後に完成。`};
}
export function selfCraft(state,recipeId,quality=.5){
  if(state.run)return{ok:false,msg:'鍛冶は村で。'};const r=recipes.find(x=>x.id===recipeId);if(!r||!consumeRecipe(state,r))return{ok:false,msg:'素材が足りない。'};
  const steps=12,t=advanceTime(state,steps);state.ownedItems[r.item]=(state.ownedItems[r.item]||0)+1;const grade=quality>.82?'会心の出来':quality>.52?'上出来':'なんとか完成';return{ok:true,steps,quality,msg:`${items[r.item].name}が完成！ ${grade}。${steps}step経過。 ${timeMessages(t).join(' ')}`};
}
export function forgeOrders(state){return (state.timedProcesses||[]).filter(x=>x.payload?.type==='forge');}
export function collectForgeOrder(state,id){const job=collectTimedProcess(state,id);if(!job||job.payload?.type!=='forge')return{ok:false,msg:'まだ受け取れない。'};const item=job.payload.item;state.ownedItems[item]=(state.ownedItems[item]||0)+1;return{ok:true,msg:`${items[item].name}を受け取った。`};}
export function canAlchemy(state){return !state.run&&materialCount(state,'fresh_herb')>=1&&materialCount(state,'mushroom')>=1&&state.gold>=20&&usedCapacity(state)+(consumables.potion.bulk||1)<=backpackCapacity(state);}
export function brewPotion(state,quality=.5){
  if(state.run)return{ok:false,msg:'調合は村で。'};if(!canAlchemy(state))return{ok:false,msg:'薬草×1、森キノコ×1、瓶代20Gが必要。'};
  consumeMaterial(state,'fresh_herb',1);consumeMaterial(state,'mushroom',1);state.gold-=20;const steps=8,t=advanceTime(state,steps);state.consumables.potion=(state.consumables.potion||0)+1;const q=quality>.8?'香りの良い':'普通の';return{ok:true,steps,msg:`${q}ポーションを調合した。瓶代20G / ${steps}step経過。 ${timeMessages(t).join(' ')}`};
}

export function equip(state,itemId){const item=items[itemId];if(!item||!(state.ownedItems[itemId]>0))return false;state.player.equipment[item.slot]=itemId;const d=derived(state);state.player.hp=Math.min(state.player.hp,d.maxHp);state.player.mp=Math.min(state.player.mp,d.maxMp);return true;}

// 封印中の放置探索コード
export function startIdle(state,area='outskirts'){state.idle={area,startedAt:Date.now()};return{ok:true};}
export function idleStatus(state,now=Date.now()){if(!state.idle)return null;const elapsed=Math.min(now-state.idle.startedAt,8*60*60*1000);return{elapsed,cycles:Math.floor(elapsed/(10*60*1000))};}
export function claimIdle(state,now=Date.now()){const s=idleStatus(state,now);if(!s||s.cycles<1)return{ok:false};state.idle=null;return{ok:true,result:{cycles:s.cycles}};}

export { backpacks, consumables, enemies, items, materials, recipes, worldEdges, worldNodes, zones };
