import {
  backpacks, battleSkills, battleSpells, consumables, enemies, items, materials,
  randomEvents, recipes, worldEdges, worldNodes, zones
} from '../data/gameData.js';

const rand=(min,max)=>Math.floor(Math.random()*(max-min+1))+min;
const pick=a=>a[rand(0,a.length-1)];
const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
const sum=(xs,fn)=>xs.reduce((a,x)=>a+fn(x),0);
const deep=x=>JSON.parse(JSON.stringify(x));

export const EQUIPMENT_SLOTS=[
  ['weapon','武器'],['shield','盾'],['head','頭'],['body','からだ上'],['arms','腕'],['legs','からだ下'],['feet','足'],['accessory','アクセ']
];
export const QUALITY_NAMES=['','☆1','☆2','☆3'];
export const QUALITY_MULT=[1,1.22,1.48,1.82];
export const QUALITY_LIFE=[1,1.25,1.6,2.0];
export const STORAGE_BASE_CAPACITY=100;
export const STORAGE_UPGRADES=[
  {capacity:100,price:0,name:'木箱倉庫'},
  {capacity:160,price:650,name:'棚付き倉庫'},
  {capacity:240,price:1800,name:'大型倉庫'},
  {capacity:360,price:4200,name:'商会式倉庫'},
  {capacity:520,price:9000,name:'大倉庫'}
];

const allDefs=id=>materials[id]||consumables[id];
const isStackItem=id=>!!allDefs(id)&&id!=='camp_set';
const qualityLabel=q=>QUALITY_NAMES[clamp(Number(q)||0,0,3)]||'';

export function defaultState(){
  return {
    version:6,
    player:{
      name:'冒険者',level:1,exp:0,baseMaxHp:46,baseMaxMp:16,baseAtk:8,baseDef:4,hp:46,mp:16,
      equipment:{weapon:'novice_sword',shield:null,head:null,body:'travel_clothes',arms:null,legs:null,feet:null,accessory:null}
    },
    gold:80,
    backpack:'cheap',
    consumables:{camp_set:0},
    ownedItems:{novice_sword:1,travel_clothes:1},
    inventory:{},
    itemStacks:[{stackId:'stk_1',id:'potion',count:1,quality:0,container:'bag',remainingLife:720,lastAgedStep:0}],
    nextStackId:2,
    warehouseLevel:0,
    lifeSkills:{
      gathering:{level:1,xp:0},mining:{level:1,xp:0},fishing:{level:1,xp:0},woodcut:{level:1,xp:0}
    },
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
  const bonus=key=>sum(equipped,x=>x[key]||0);
  const raw={maxHp:p.baseMaxHp+levelHp(p.level)+bonus('hp'),maxMp:p.baseMaxMp+levelMp(p.level)+bonus('mp'),atk:p.baseAtk+levelAtk(p.level)+bonus('atk'),def:p.baseDef+levelDef(p.level)+bonus('def')};
  return {maxHp:Math.max(1,Math.floor(raw.maxHp*mul)),maxMp:Math.max(0,Math.floor(raw.maxMp*mul)),atk:Math.max(1,Math.floor(raw.atk*mul)),def:Math.max(0,Math.floor(raw.def*mul)),fatiguePenalty:1-mul};
}

function newStackId(state){return `stk_${state.nextStackId++}`;}
function baseLife(id,quality=0){const def=allDefs(id);return def?.shelfLife?Math.round(def.shelfLife*QUALITY_LIFE[clamp(quality,0,3)]):null;}
function normalizeStack(state,raw){
  const id=raw.id;if(!isStackItem(id)||!(raw.count>0))return null;
  const q=clamp(Number(raw.quality)||0,0,3),life=raw.remainingLife==null?baseLife(id,q):Math.max(0,Number(raw.remainingLife));
  return {stackId:raw.stackId||newStackId(state),id,count:Math.max(1,Math.floor(raw.count)),quality:q,container:raw.container==='storage'?'storage':'bag',remainingLife:life,lastAgedStep:Number.isFinite(raw.lastAgedStep)?raw.lastAgedStep:state.calendar.totalSteps};
}
function migrateLegacyStacks(s,old){
  if(Array.isArray(old.itemStacks)&&old.itemStacks.length){
    for(const x of old.itemStacks){const n=normalizeStack(s,x);if(n)s.itemStacks.push(n);}return;
  }
  const now=s.calendar.totalSteps;
  const seen={};
  for(const [id,n0] of Object.entries(old.inventory||{})){
    const n=Math.max(0,Number(n0)||0);if(!n||!isStackItem(id))continue;
    s.itemStacks.push(normalizeStack(s,{id,count:n,quality:0,container:'storage',remainingLife:baseLife(id,0),lastAgedStep:now}));seen[id]=(seen[id]||0)+n;
  }
  for(const p of old.perishables||[]){
    if(!isStackItem(p.id)||!(p.count>0))continue;
    const remaining=Math.max(1,(Number(p.expiresAt)||now)-now);
    s.itemStacks.push(normalizeStack(s,{id:p.id,count:p.count,quality:p.quality||0,container:p.container==='storage'?'storage':'bag',remainingLife:remaining,lastAgedStep:now}));
  }
  for(const id of ['potion','rura_potion']){
    const n=Math.max(0,Number(old.consumables?.[id])||0);if(n)s.itemStacks.push(normalizeStack(s,{id,count:n,quality:0,container:'bag',remainingLife:baseLife(id,0),lastAgedStep:now}));
  }
  if(old.run?.cargo){for(const [id,n0] of Object.entries(old.run.cargo)){const n=Math.max(0,Number(n0)||0);if(!n||!isStackItem(id))continue;s.itemStacks.push(normalizeStack(s,{id,count:n,quality:0,container:'bag',remainingLife:baseLife(id,0),lastAgedStep:now}));}}
  const herbs=Math.max(0,Number(old.run?.freshHerbs)||0);if(herbs)s.itemStacks.push(normalizeStack(s,{id:'fresh_herb',count:herbs,quality:0,container:'bag',remainingLife:baseLife('fresh_herb',0),lastAgedStep:now}));
}

export function normalize(state){
  const base=defaultState(),old=state||{},s={...base,...old,version:6};
  s.player={...base.player,...(old.player||{})};
  const oldEq=old.player?.equipment||{};s.player.equipment={...base.player.equipment,...oldEq,body:oldEq.body||oldEq.armor||base.player.equipment.body};delete s.player.equipment.armor;
  s.gold=Number.isFinite(old.gold)?old.gold:(old.player?.gold||base.gold);
  s.backpack=backpacks[old.backpack]?old.backpack:'cheap';
  s.consumables={camp_set:Math.max(0,Number(old.consumables?.camp_set)||0)};
  s.ownedItems={...base.ownedItems,...(old.ownedItems||{})};
  s.calendar={...base.calendar,...(old.calendar||{})};
  if(!Number.isFinite(s.calendar.totalSteps))s.calendar.totalSteps=Math.max(0,(Math.max(1,s.calendar.day)-1)*90+(s.calendar.stepOfDay||0));
  s.calendar.day=Math.floor(s.calendar.totalSteps/90)+1;s.calendar.stepOfDay=s.calendar.totalSteps%90;
  s.condition={...base.condition,...(old.condition||{})};s.settings={...base.settings,...(old.settings||{})};
  s.timedProcesses=Array.isArray(old.timedProcesses)?old.timedProcesses.map(x=>({...x})):[];
  s.lifeSkills=deep(base.lifeSkills);for(const [k,v] of Object.entries(old.lifeSkills||{}))if(s.lifeSkills[k])s.lifeSkills[k]={...s.lifeSkills[k],...v};
  s.warehouseLevel=clamp(Number(old.warehouseLevel)||0,0,STORAGE_UPGRADES.length-1);
  s.nextStackId=Math.max(1,Number(old.nextStackId)||1);s.itemStacks=[];migrateLegacyStacks(s,old);
  s.perishables=[];s.inventory={};
  if(old.run){s.run={location:'town',harvested:[],visited:['town'],lastEvent:null,moves:0,effects:{encounterMod:0,moves:0},startedAtStep:s.calendar.totalSteps,...old.run};delete s.run.cargo;delete s.run.freshHerbs;delete s.run.pendingExp;}
  if(s.run&&(!s.run.location||!worldNodes[s.run.location])){s.run=null;s.battle=null;}
  if(s.battle)s.battle={menu:'root',...s.battle};
  ageStacks(s,s.calendar.totalSteps);matureProcesses(s);
  const d=derived(s);s.player.hp=clamp(Number.isFinite(s.player.hp)?s.player.hp:d.maxHp,0,d.maxHp);s.player.mp=clamp(Number.isFinite(s.player.mp)?s.player.mp:d.maxMp,0,d.maxMp);
  return s;
}

export function phaseInfo(state){const step=state.calendar.stepOfDay||0,idx=Math.floor(step/30)%3;return{index:idx,key:['morning','day','night'][idx],name:['朝','昼','夜'][idx],icon:['🌅','☀️','🌙'][idx],remaining:30-(step%30),stepInPhase:step%30};}
function matureProcesses(state){const now=state.calendar.totalSteps||0,m=[];for(const p of state.timedProcesses||[]){if(!p.ready&&p.readyAt<=now){p.ready=true;m.push(p.id);}}return m;}
function fatigueStacksForAwake(awake){return awake>=180?clamp(Math.floor((awake-180)/30)+1,1,7):0;}
function ageStacks(state,toStep){
  const expired=[];
  for(const s of state.itemStacks||[]){
    if(s.remainingLife==null){s.lastAgedStep=toStep;continue;}
    const from=Number.isFinite(s.lastAgedStep)?s.lastAgedStep:toStep,delta=Math.max(0,toStep-from),rate=s.container==='storage'?1/3:1;
    s.remainingLife=Math.max(0,s.remainingLife-delta*rate);s.lastAgedStep=toStep;
    if(s.remainingLife<=0)expired.push({...s});
  }
  if(expired.length)state.itemStacks=state.itemStacks.filter(x=>x.remainingLife==null||x.remainingLife>0);
  return expired;
}
function groupedExpired(xs){const out={};for(const x of xs){const key=`${x.id}:${x.quality}`;out[key]=(out[key]||0)+x.count;}return out;}
export function advanceTime(state,steps,opts={}){
  steps=Math.max(0,Math.floor(steps||0));const before=phaseInfo(state),beforeDay=state.calendar.day,oldFatigue=state.condition.fatigueStacks||0;
  const newTotal=(state.calendar.totalSteps||0)+steps,expired=ageStacks(state,newTotal);
  state.calendar.totalSteps=newTotal;state.calendar.day=Math.floor(newTotal/90)+1;state.calendar.stepOfDay=newTotal%90;
  if(opts.resting){state.condition.awakeSteps=0;state.condition.fatigueStacks=0;}else if(opts.awake!==false){state.condition.awakeSteps=(state.condition.awakeSteps||0)+steps;state.condition.fatigueStacks=fatigueStacksForAwake(state.condition.awakeSteps);}
  const matured=matureProcesses(state),after=phaseInfo(state),d=derived(state);state.player.hp=Math.min(state.player.hp,d.maxHp);state.player.mp=Math.min(state.player.mp,d.maxMp);
  return{before,after,changed:before.key!==after.key||beforeDay!==state.calendar.day,day:state.calendar.day,steps,expired:groupedExpired(expired),matured,fatigueBefore:oldFatigue,fatigueAfter:state.condition.fatigueStacks||0};
}
function timeMessages(t){
  const out=[];if(t.changed)out.push(`${t.after.icon} ${t.day}日目 ${t.after.name}になった。`);
  for(const [key,n] of Object.entries(t.expired||{})){const [id,q]=key.split(':');out.push(`${allDefs(id)?.name||id}${qualityLabel(Number(q))}×${n}が傷んだ。`);}
  if(t.fatigueAfter>t.fatigueBefore)out.push(`徹夜疲労が進行。全能力 -${t.fatigueAfter*10}%。`);if((t.matured||[]).length)out.push(`完成・熟成した作業が ${t.matured.length} 件ある。`);return out;
}

export function startTimedProcess(state,id,duration,payload={}){const job={id,startedAt:state.calendar.totalSteps,readyAt:state.calendar.totalSteps+Math.max(1,duration),ready:false,payload};state.timedProcesses.push(job);return job;}
export function collectTimedProcess(state,id){const i=state.timedProcesses.findIndex(x=>x.id===id&&x.ready);if(i<0)return null;return state.timedProcesses.splice(i,1)[0];}
export function addExp(state,amount,source='経験'){amount=Math.max(0,Math.floor(amount||0));if(!amount)return{amount:0,levels:0,msg:''};state.player.exp+=amount;let levels=0;while(state.player.exp>=expToNext(state.player.level)){state.player.exp-=expToNext(state.player.level);state.player.level++;levels++;state.log.unshift(`レベル ${state.player.level} になった！ HP/MPはそのまま。`);}return{amount,levels,msg:`${source} EXP +${amount}${levels?` / Lv.${state.player.level}！`:''}`};}

export function stackDefinition(id){return allDefs(id);}
export function stackQualityLabel(stackOrQ){const q=typeof stackOrQ==='object'?stackOrQ.quality:stackOrQ;return qualityLabel(q);}
export function stackRemaining(stack){return stack.remainingLife==null?null:Math.max(0,Math.ceil(stack.remainingLife));}
export function stackList(state,container=null,id=null){ageStacks(state,state.calendar.totalSteps);return (state.itemStacks||[]).filter(x=>(!container||x.container===container)&&(!id||x.id===id)).sort((a,b)=>(a.remainingLife??1e12)-(b.remainingLife??1e12)||b.quality-a.quality);}
export function stackCount(state,id,container=null){return sum(stackList(state,container,id),x=>x.count);}
export function perishableCount(state,id,container){return sum(stackList(state,container,id).filter(x=>x.remainingLife!=null),x=>x.count);}
export function perishableSummary(state,container){return stackList(state,container).filter(x=>x.remainingLife!=null).map(x=>({id:x.id,count:x.count,remaining:stackRemaining(x),quality:x.quality,stackId:x.stackId}));}
export function materialCount(state,id){return stackCount(state,id);}
export function backpackCapacity(state){return backpacks[state.backpack]?.capacity||12;}
export function warehouseCapacity(state){return STORAGE_UPGRADES[state.warehouseLevel]?.capacity||STORAGE_BASE_CAPACITY;}
export function usedStorageCapacity(state){return sum(stackList(state,'storage'),x=>(allDefs(x.id)?.bulk||1)*x.count);}
export function usedCapacity(state){let used=(consumables.camp_set?.bulk||0)*(state.consumables.camp_set||0);used+=sum(stackList(state,'bag'),x=>(allDefs(x.id)?.bulk||1)*x.count);return used;}
export function freeCapacity(state){return Math.max(0,backpackCapacity(state)-usedCapacity(state));}
export function freeStorageCapacity(state){return Math.max(0,warehouseCapacity(state)-usedStorageCapacity(state));}

function addStack(state,id,count=1,{quality=0,container='bag',remainingLife=null}={}){
  if(!isStackItem(id)||count<=0)return 0;const def=allDefs(id),bulk=def.bulk||1,space=container==='storage'?freeStorageCapacity(state):freeCapacity(state),added=Math.min(count,Math.floor(space/bulk));if(added<=0)return 0;
  quality=clamp(Math.floor(quality),0,3);const life=remainingLife==null?baseLife(id,quality):remainingLife;
  if(life==null){const existing=state.itemStacks.find(x=>x.id===id&&x.container===container&&x.quality===quality&&x.remainingLife==null);if(existing)existing.count+=added;else state.itemStacks.push({stackId:newStackId(state),id,count:added,quality,container,remainingLife:null,lastAgedStep:state.calendar.totalSteps});}
  else state.itemStacks.push({stackId:newStackId(state),id,count:added,quality,container,remainingLife:Math.max(1,life),lastAgedStep:state.calendar.totalSteps});
  return added;
}
function removeFromStack(state,stackId,count=1){const s=state.itemStacks.find(x=>x.stackId===stackId);if(!s)return null;const n=Math.min(Math.max(1,count),s.count),copy={...s,count:n};s.count-=n;if(s.count<=0)state.itemStacks=state.itemStacks.filter(x=>x.stackId!==stackId);return copy;}
function takeItems(state,id,count,{containers=['storage','bag'],preferLowQuality=true}={}){
  let need=count,taken=[];let list=stackList(state).filter(x=>x.id===id&&containers.includes(x.container));list.sort((a,b)=>{const life=(a.remainingLife??1e12)-(b.remainingLife??1e12);if(life)return life;return preferLowQuality?a.quality-b.quality:b.quality-a.quality;});
  for(const s of list){if(need<=0)break;const r=removeFromStack(state,s.stackId,Math.min(need,s.count));if(r){taken.push(r);need-=r.count;}}
  return{count:count-need,taken};
}
export function transferStack(state,stackId,to){
  ageStacks(state,state.calendar.totalSteps);
  if(state.run)return{ok:false,msg:'倉庫整理は村にいる時だけ。'};const s=state.itemStacks.find(x=>x.stackId===stackId);if(!s)return{ok:false,msg:'その品は見つからない。'};if(to!=='bag'&&to!=='storage')return{ok:false,msg:'移動先が不正。'};if(s.container===to)return{ok:false,msg:'すでにそこにある。'};const bulk=(allDefs(s.id)?.bulk||1)*s.count,free=to==='storage'?freeStorageCapacity(state):freeCapacity(state);if(bulk>free)return{ok:false,msg:to==='storage'?'倉庫に空きがない。':'バッグに入らない。'};s.container=to;s.lastAgedStep=state.calendar.totalSteps;return{ok:true,msg:`${allDefs(s.id).name}${qualityLabel(s.quality)}×${s.count}を${to==='storage'?'倉庫へ入れた':'バッグへ戻した'}。`};
}
export function upgradeWarehouse(state){if(state.run)return{ok:false,msg:'村にいる時だけ拡張できる。'};const next=STORAGE_UPGRADES[state.warehouseLevel+1];if(!next)return{ok:false,msg:'これ以上拡張できない。'};if(state.gold<next.price)return{ok:false,msg:'お金が足りない。'};state.gold-=next.price;state.warehouseLevel++;return{ok:true,msg:`倉庫を拡張した！ 容量 ${next.capacity}`};}

function edgeBetween(a,b){return worldEdges.find(e=>(e.a===a&&e.b===b)||(e.a===b&&e.b===a));}
export function adjacentNodes(id){return worldEdges.filter(e=>e.a===id||e.b===id).map(e=>({id:e.a===id?e.b:e.a,edge:e,node:worldNodes[e.a===id?e.b:e.a]}));}
export function startExpedition(state){if(state.run)return{ok:false,msg:'すでに探索中。'};if(state.player.hp<=0)return{ok:false,msg:'HPが0だ。村で休もう。'};state.run={location:'town',harvested:[],visited:['town'],lastEvent:null,moves:0,effects:{encounterMod:0,moves:0},startedAtStep:state.calendar.totalSteps,patrols:0};state.battle=null;return{ok:true,msg:'村を出発した。バッグの中身はそのまま持っていく。'};}

function weightedEvent(zone,phase){const pool=randomEvents.filter(e=>(!e.zones||e.zones.includes(zone))&&(!e.phases||e.phases.includes(phase)));const total=pool.reduce((a,e)=>a+(e.weight||1),0);let r=Math.random()*total;for(const e of pool){r-=e.weight||1;if(r<=0)return e;}return pool.at(-1);}
function eventQuality(state,id){const node=currentLocation(state),difficulty=node.resourceDifficulty||1,skill=state.lifeSkills.gathering.level;return clamp(Math.floor((skill-difficulty)+Math.random()*1.8),0,3);}
function applyEvent(state,event){const ef=event.effect||{};let suffix='';if(ef.herb){const q=eventQuality(state,'fresh_herb'),n=addStack(state,'fresh_herb',ef.herb,{quality:q,container:'bag'});suffix=n?` 薬草${qualityLabel(q)}+${n}`:' バッグがいっぱいで薬草は置いてきた。';}if(ef.cargo){const [id,n]=ef.cargo,q=clamp(Math.floor(Math.random()*2),0,3),a=addStack(state,id,n,{quality:q,container:'bag'});suffix+=a?` ${materials[id].name}${qualityLabel(q)}+${a}`:' バッグがいっぱいで持てない。';}if(ef.randomCargo){const id=pick(ef.randomCargo),q=clamp(Math.floor(Math.random()*2),0,3),a=addStack(state,id,1,{quality:q,container:'bag'});suffix+=a?` ${materials[id].name}${qualityLabel(q)}+1`:' バッグがいっぱいで持てない。';}if(ef.encounterMod!=null)state.run.effects={encounterMod:ef.encounterMod,moves:ef.moves||1};if(ef.steps){const t=advanceTime(state,ef.steps);suffix+=` ${ef.steps}step経過。 ${timeMessages(t).join(' ')}`;}const xp=ef.exp??(event.id==='nothing'?0:1);if(xp)suffix+=` ${addExp(state,xp,'探索').msg}`;return event.text+suffix;}
function resolveArrivalEvent(state,chance=.48){if(!state.run)return null;const node=currentLocation(state);if(node.zone==='village')return null;if(Math.random()>chance){state.run.lastEvent='特に目立った出来事はなかった。';return state.run.lastEvent;}const ev=weightedEvent(node.zone,phaseInfo(state).key);state.run.lastEvent=applyEvent(state,ev);return state.run.lastEvent;}
function beginEncounter(state,enemyId,reason='encounter'){const e=enemies[enemyId];state.battle={enemyId,enemyHp:e.hp,enemyMaxHp:e.hp,enemyAtk:e.atk,enemyDef:e.def,expReward:e.exp,over:false,won:false,guarding:false,turn:1,reason,log:[`${e.name}が あらわれた！`]};}
function maybeEncounter(state,edge=null,mult=1){const node=currentLocation(state),zone=zones[node.zone],phase=phaseInfo(state);if(!zone?.encounter)return false;let chance=zone.encounter*(edge?.risk||1)*mult;if(phase.key==='night')chance+=.08;if(state.run.effects?.moves>0){chance+=state.run.effects.encounterMod||0;state.run.effects.moves--;if(state.run.effects.moves<=0)state.run.effects={encounterMod:0,moves:0};}if(Math.random()>clamp(chance,0,.78))return false;const pool=zone.pools[phase.key]||zone.pools.day;if(!pool?.length)return false;beginEncounter(state,pick(pool));return true;}
export function travelTo(state,target){if(!state.run||state.battle)return{ok:false,msg:'今は移動できない。'};const from=state.run.location,edge=edgeBetween(from,target);if(!edge)return{ok:false,msg:'そこへ直接は行けない。'};let steps=edge.steps;if(state.run.effects?.nextDiscount){steps=Math.max(1,steps-state.run.effects.nextDiscount);delete state.run.effects.nextDiscount;}const firstVisit=!state.run.visited.includes(target),time=advanceTime(state,steps);state.run.location=target;state.run.moves++;if(firstVisit)state.run.visited.push(target);const notes=timeMessages(time);if(firstVisit&&target!=='town'){const z=worldNodes[target]?.zone,xp={outskirts:2,river:3,forest:4,mountain:5,ruins:6}[z]||2;notes.push(addExp(state,xp,'新しい場所').msg);}if(target==='town'){const report=returnToTown(state,'walk');return{ok:true,returned:true,report,msg:`歩いて村へ戻った。 ${notes.join(' ')}`};}if(maybeEncounter(state,edge)){state.run.lastEvent=notes.join(' ')||'移動中に魔物の気配！';return{ok:true,battle:true,msg:state.run.lastEvent};}const ev=resolveArrivalEvent(state);return{ok:true,msg:[notes.join(' '),ev||`${worldNodes[target].name}に着いた。`].filter(Boolean).join(' ')};}
export function patrol(state){if(!state.run||state.battle)return{ok:false,msg:'今は巡回できない。'};if(currentLocation(state).zone==='village')return{ok:false,msg:'村の中では足踏みする必要はない。'};const t=advanceTime(state,1);state.run.patrols=(state.run.patrols||0)+1;const notes=timeMessages(t);if(maybeEncounter(state,null,.92)){state.run.lastEvent='周辺を巡回していると魔物と遭遇した！';return{ok:true,battle:true,steps:1,msg:[state.run.lastEvent,...notes].join(' ')}};let ev=null;if(Math.random()<.12)ev=resolveArrivalEvent(state,1);state.run.lastEvent=ev||'周辺を1step巡回した。魔物の気配はない。';return{ok:true,battle:false,steps:1,msg:[state.run.lastEvent,...notes].join(' ')}};

const pushBattle=(b,m)=>{b.log.push(m);if(b.log.length>24)b.log.shift();};
function finishBattleTurn(state,b){const t=advanceTime(state,1);b.turn++;for(const m of timeMessages(t))pushBattle(b,m);}
export function battleItemStacks(state){return stackList(state,'bag').filter(s=>['fresh_herb','potion'].includes(s.id));}
export function battleSkillList(){return Object.values(battleSkills);}
export function battleSpellList(){return Object.values(battleSpells);}
function useHealingStack(state,b,stackId){const s=state.itemStacks.find(x=>x.stackId===stackId&&x.container==='bag');if(!s||!['fresh_herb','potion'].includes(s.id))return{valid:false};const def=allDefs(s.id),removed=removeFromStack(state,stackId,1);if(!removed)return{valid:false};const healBase=def.heal||0,healValue=Math.max(1,Math.round(healBase*QUALITY_MULT[removed.quality])),d=derived(state),before=state.player.hp;state.player.hp=Math.min(d.maxHp,state.player.hp+healValue);const heal=state.player.hp-before;pushBattle(b,`${def.name}${qualityLabel(removed.quality)}を使った。HPが ${heal} 回復した。`);return{valid:true,heal};}
export function command(state,type,payload={}){const b=state.battle;if(!b||b.over)return{ok:false};const e=enemies[b.enemyId],st=derived(state);b.guarding=false;let valid=true,enemyDamage=0,playerDamage=0,heal=0,action=type;
  if(type==='attack'){enemyDamage=Math.max(1,st.atk+rand(-2,3)-Math.floor(b.enemyDef*.55));b.enemyHp=Math.max(0,b.enemyHp-enemyDamage);pushBattle(b,`${state.player.name}の攻撃！ ${e.name}に ${enemyDamage} ダメージ！`);}
  else if(type==='skill'){const sk=battleSkills[payload.id||'flame_slash'];if(!sk){valid=false;}else if(state.player.mp<sk.mp){pushBattle(b,'MPが たりない！');valid=false;}else{state.player.mp-=sk.mp;enemyDamage=Math.max(2,Math.floor(st.atk*1.7)+rand(-2,4)-Math.floor(b.enemyDef*.35));b.enemyHp=Math.max(0,b.enemyHp-enemyDamage);pushBattle(b,`${sk.name}！ ${e.name}に ${enemyDamage} ダメージ！`);action='skill';}}
  else if(type==='spell'){const sp=battleSpells[payload.id||'heal'];if(!sp){valid=false;}else if(state.player.mp<sp.mp){pushBattle(b,'MPが たりない！');valid=false;}else{state.player.mp-=sp.mp;const before=state.player.hp;state.player.hp=Math.min(st.maxHp,state.player.hp+18+state.player.level*4+rand(0,5));heal=state.player.hp-before;pushBattle(b,`${sp.name}！ HPが ${heal} 回復した。`);action='spell';}}
  else if(type==='defend'){b.guarding=true;pushBattle(b,'身を守っている。');}
  else if(type==='item'){const r=useHealingStack(state,b,payload.stackId);valid=r.valid;heal=r.heal||0;action='item';if(!valid)pushBattle(b,'その道具は使えない。');}
  else valid=false;
  if(!valid)return{ok:false};let victoryInfo=null;if(b.enemyHp<=0)victoryInfo=victory(state);else playerDamage=enemyTurn(state);finishBattleTurn(state,b);return{ok:true,action,enemyDamage,playerDamage,heal,victory:victoryInfo};}
function enemyTurn(state){const b=state.battle,e=enemies[b.enemyId],st=derived(state);let dmg=Math.max(1,b.enemyAtk+rand(-2,3)-Math.floor(st.def*.45));if(b.guarding)dmg=Math.max(1,Math.floor(dmg*.45));state.player.hp=Math.max(0,state.player.hp-dmg);pushBattle(b,`${e.name}の攻撃！ ${state.player.name}は ${dmg} ダメージ。`);if(state.player.hp<=0){b.over=true;b.won=false;pushBattle(b,'ちからつきた……。バッグの探索品を失う。');}return dmg;}
function dropQuality(e){const base=e.exp>=70?1:(e.exp>=35?.55:.2),r=Math.random();return clamp((r<.06?2:r<base?1:0)+(Math.random()<.025?1:0),0,3);}
function victory(state){const b=state.battle,e=enemies[b.enemyId];b.over=true;b.won=true;const xp=addExp(state,b.expReward,'戦闘'),drops=[];for(const [id,chance] of e.drops||[]){if(Math.random()<chance){const q=dropQuality(e),a=addStack(state,id,1,{quality:q,container:'bag'});if(a)drops.push(`${materials[id].name}${qualityLabel(q)}`);}}if(Math.random()<(e.herbChance||0)){const q=clamp(dropQuality(e),0,3),a=addStack(state,'fresh_herb',1,{quality:q,container:'bag'});if(a)drops.push(`薬草${qualityLabel(q)}`);}pushBattle(b,`${e.name}を たおした！ ${xp.msg}`);if(drops.length)pushBattle(b,`戦利品: ${drops.join(' / ')}`);return{xp,drops};}
export function finishBattle(state){if(!state.battle?.over||!state.battle.won)return{ok:false};state.battle=null;return{ok:true,msg:'周囲へ戻った。'};}
function loseExplorationBag(state){const keep=[],lost=[];for(const s of state.itemStacks){if(s.container==='bag'&&materials[s.id])lost.push(s);else keep.push(s);}state.itemStacks=keep;return lost;}
export function defeatReturn(state){if(!state.run)return{ok:false};const lost=loseExplorationBag(state);state.run=null;state.battle=null;state.player.hp=1;state.log.unshift('力尽き、探索素材を失って村まで運ばれた。');return{ok:true,lost};}
function returnToTown(state,method){const report={items:stackList(state,'bag').map(x=>({...x})),method};state.run=null;state.battle=null;state.log.unshift(method==='rura'?'ルーラのポーションで村へ帰還した。':'歩いて村へ戻った。');return report;}
export function useRura(state,stackId=null){if(!state.run||state.battle)return{ok:false,msg:'今は使えない。'};const list=stackList(state,'bag','rura_potion');const s=stackId?list.find(x=>x.stackId===stackId):list[0];if(!s)return{ok:false,msg:'ルーラのポーションを持っていない。'};removeFromStack(state,s.stackId,1);const stepCost=[2,1,1,0][s.quality]??2,t=advanceTime(state,stepCost),report=returnToTown(state,'rura');return{ok:true,report,msg:`ルーラのポーション${qualityLabel(s.quality)}で村へ直行した。${stepCost}step経過。${timeMessages(t).join(' ')}`};}

export function currentLocation(state){return worldNodes[state.run?.location||'town'];}
export function resourceStatus(state){if(!state.run)return null;const node=currentLocation(state);if(!node.resource)return null;return{kind:node.resource,used:state.run.harvested.includes(node.id),node,difficulty:node.resourceDifficulty||1};}
function lifeSkillKey(kind){return kind==='herb'?'gathering':kind;}
export function lifeSkillInfo(state,kind){const key=lifeSkillKey(kind),s=state.lifeSkills[key]||{level:1,xp:0};return{key,...s,next:8+s.level*6};}
function gainLifeSkill(state,kind,amount=2){const key=lifeSkillKey(kind),s=state.lifeSkills[key];if(!s)return null;s.xp+=amount;const next=()=>8+s.level*6;let up=0;while(s.xp>=next()){s.xp-=next();s.level++;up++;}return{...s,up,key};}
function harvestQuality(state,kind,performance,difficulty){const lv=lifeSkillInfo(state,kind).level,score=performance*2.1+(lv-difficulty)*.72+(Math.random()-.5)*.65;if(score>=2.6)return 3;if(score>=1.75)return 2;if(score>=.9)return 1;return 0;}
export function harvestResult(state,performance=.5){const rs=resourceStatus(state);if(!rs||rs.used)return{ok:false,msg:'ここではもう採れない。'};state.run.harvested.push(rs.node.id);const q=harvestQuality(state,rs.kind,clamp(performance,0,1),rs.difficulty);let got={},msg='';if(rs.kind==='herb'){const n=performance>.82?3:performance>.42?2:1,a=addStack(state,'fresh_herb',n,{quality:q,container:'bag'});got.fresh_herb=a;msg=`薬草${qualityLabel(q)}を ${a} 本採った。${a<n?' バッグがいっぱいだ。':''}`;}else if(rs.kind==='mining'){const rare=performance>.86&&Math.random()<.5,id=rare?(rs.node.id==='hidden_cave'?'magic_crystal':'iron_ore'):'iron_ore',n=performance>.72?2:1,a=addStack(state,id,n,{quality:q,container:'bag'});got[id]=a;msg=`${materials[id].name}${qualityLabel(q)}を ${a} 個採掘した。${a<n?' バッグがいっぱいだ。':''}`;}else if(rs.kind==='fishing'){if(performance<.2)msg='魚に逃げられた。今日はこの場所ではもう釣れそうにない。';else{const rare=performance>.82&&Math.random()<.5,id=rare?'silver_fish':'river_fish',a=addStack(state,id,1,{quality:q,container:'bag'});got[id]=a;msg=a?`${materials[id].name}${qualityLabel(q)}を釣り上げた！`:'バッグがいっぱいで魚を持てない。';}}else if(rs.kind==='woodcut'){const rare=performance>.8&&Math.random()<.45,id=rare?'hardwood':'softwood',n=performance>.62?2:1,a=addStack(state,id,n,{quality:q,container:'bag'});got[id]=a;msg=`${materials[id].name}${qualityLabel(q)}を ${a} 個切り出した。${a<n?' バッグがいっぱいだ。':''}`;}else return{ok:false,msg:'何も起きない。'};const stepCost={herb:2,mining:5,fishing:4,woodcut:5}[rs.kind]||2,t=advanceTime(state,stepCost),xp=addExp(state,{herb:2,mining:4,fishing:3,woodcut:4}[rs.kind]||2,'採集'),life=gainLifeSkill(state,rs.kind,2),notes=timeMessages(t);return{ok:true,msg:`${msg} ${stepCost}step経過。 ${xp.msg}${life?.up?` / ${life.key} Lv.${life.level}！`:''}${notes.length?` ${notes.join(' ')}`:''}`,got,steps:stepCost,xp,quality:q,life};}

function healWithStack(state,stackId){const s=state.itemStacks.find(x=>x.stackId===stackId&&x.container==='bag');if(!s||!['fresh_herb','potion'].includes(s.id))return{ok:false,msg:'その道具は使えない。'};const def=allDefs(s.id),removed=removeFromStack(state,stackId,1),d=derived(state),before=state.player.hp,amount=Math.round((def.heal||0)*QUALITY_MULT[removed.quality]);state.player.hp=Math.min(d.maxHp,state.player.hp+amount);return{ok:true,heal:state.player.hp-before,stack:removed};}
export function useFieldItem(state,idOrStack){if(!state.run||state.battle)return{ok:false,msg:'探索中に使う道具ではない。'};let s=state.itemStacks.find(x=>x.stackId===idOrStack&&x.container==='bag');if(!s)s=stackList(state,'bag',idOrStack)[0];if(!s)return{ok:false,msg:'その道具を持っていない。'};if(s.id==='rura_potion')return useRura(state,s.stackId);const r=healWithStack(state,s.stackId);if(!r.ok)return r;const t=advanceTime(state,2),def=allDefs(r.stack.id);return{ok:true,steps:2,msg:`${def.name}${qualityLabel(r.stack.quality)}を使った。HP +${r.heal} / 2step経過。 ${timeMessages(t).join(' ')}`};}

export function sleepDuration(state){const r=phaseInfo(state).remaining;return r>=20?r:r+30;}
export function restAtTown(state){if(state.run)return{ok:false,msg:'探索中は村で休めない。'};const steps=sleepDuration(state),t=advanceTime(state,steps,{resting:true}),d=derived(state);state.player.hp=d.maxHp;state.player.mp=d.maxMp;state.log.unshift(`${steps}ステップ眠って${t.after.name}になった。`);return{ok:true,steps,msg:`${steps}step休息。HP/MP全回復。${t.after.icon} ${t.after.name}になった。`};}
export function campStatus(state){if(!state.run)return null;const node=currentLocation(state);return{allowed:!!node.campSafety,safety:node.campSafety||null,node,hasSet:(state.consumables.camp_set||0)>0};}
function recoverCamp(state,ratio){const d=derived(state),hp=Math.floor((d.maxHp-state.player.hp)*ratio),mp=Math.floor((d.maxMp-state.player.mp)*ratio);state.player.hp=Math.min(d.maxHp,state.player.hp+hp);state.player.mp=Math.min(d.maxMp,state.player.mp+mp);return{hp,mp};}
export function camp(state){if(!state.run||state.battle)return{ok:false,msg:'今はキャンプできない。'};const cs=campStatus(state);if(!cs.allowed)return{ok:false,msg:'ここは野営に向かない。'};if(!cs.hasSet)return{ok:false,msg:'キャンプセットを持っていない。'};const steps=sleepDuration(state);if(cs.safety==='semi'&&Math.random()<.35){const interrupted=Math.max(10,Math.ceil(steps/2)),t=advanceTime(state,interrupted,{awake:false}),rec=recoverCamp(state,.20),zone=zones[cs.node.zone],pool=zone?.pools?.[phaseInfo(state).key]||zone?.pools?.day||['slime'];beginEncounter(state,pick(pool),'camp_raid');state.run.lastEvent=`野営中に襲撃！ ${interrupted}step経過。`;return{ok:true,raided:true,battle:true,steps:interrupted,msg:`うとうとしたところを襲われた！ HP+${rec.hp} / MP+${rec.mp}。${timeMessages(t).join(' ')}`};}const t=advanceTime(state,steps,{resting:true}),rec=recoverCamp(state,.70);state.run.lastEvent=`キャンプで${steps}step休んだ。`;return{ok:true,raided:false,steps,msg:`キャンプ成功。HP+${rec.hp} / MP+${rec.mp}。疲労も解消。${timeMessages(t).join(' ')}`};}

export function buyConsumable(state,id){const x=consumables[id];if(!x)return{ok:false,msg:'商品がない。'};if(id==='camp_set'){if((state.consumables.camp_set||0)>=1)return{ok:false,msg:'キャンプセットはもう持っている。'};if(state.gold<x.price)return{ok:false,msg:'お金が足りない。'};if(freeCapacity(state)<x.bulk)return{ok:false,msg:'バッグに入らない。'};state.gold-=x.price;state.consumables.camp_set=1;return{ok:true,msg:'キャンプセットを買った。'};}if(state.gold<x.price)return{ok:false,msg:'お金が足りない。'};const a=addStack(state,id,1,{quality:0,container:'bag'});if(!a)return{ok:false,msg:'バッグに入らない。'};state.gold-=x.price;return{ok:true,msg:`${x.name}を買った。品質0。`};}
export function upgradeBackpack(state){const order=['cheap','canvas','explorer'],idx=order.indexOf(state.backpack),next=backpacks[order[idx+1]];if(!next)return{ok:false,msg:'これ以上大きなバッグはない。'};if(state.gold<next.price)return{ok:false,msg:'お金が足りない。'};state.gold-=next.price;state.backpack=next.id;return{ok:true,msg:`${next.name}に買い替えた！`};}
function sellValue(stack,n=1){const def=materials[stack.id];return Math.round((def?.value||0)*[1,1.25,1.6,2.15][stack.quality]*n);}
export function sellStack(state,stackId,count=1){if(state.run)return{ok:false,msg:'売却は村にいる時だけ。'};const s=state.itemStacks.find(x=>x.stackId===stackId);if(!s||!materials[s.id])return{ok:false,msg:'売れる素材がない。'};const n=Math.min(s.count,Math.max(1,count)),gain=sellValue(s,n),removed=removeFromStack(state,stackId,n);state.gold+=gain;return{ok:true,msg:`${materials[s.id].name}${qualityLabel(s.quality)}×${removed.count}を ${gain}G で売った。`,gain};}
export function sellMaterial(state,id,count=1){if(state.run)return{ok:false,msg:'売却は村にいる時だけ。'};const list=stackList(state).filter(x=>x.id===id&&materials[id]);if(!list.length)return{ok:false,msg:'売れる素材がない。'};let need=count==='all'?sum(list,x=>x.count):Math.max(1,count),gain=0,n=0;for(const s of [...list]){if(need<=0)break;const take=Math.min(need,s.count);gain+=sellValue(s,take);removeFromStack(state,s.stackId,take);n+=take;need-=take;}state.gold+=gain;return{ok:true,msg:`${materials[id].name}×${n}を ${gain}G で売った。`,gain};}
export function sellAll(state){if(state.run)return{ok:false,msg:'売却は村にいる時だけ。'};let gain=0,count=0;for(const s of [...stackList(state)])if(materials[s.id]){gain+=sellValue(s,s.count);count+=s.count;removeFromStack(state,s.stackId,s.count);}state.gold+=gain;return{ok:true,msg:`素材${count}個をまとめて ${gain}G で売った。`,gain};}

function consumeMaterial(state,id,count){return takeItems(state,id,count,{containers:['storage','bag'],preferLowQuality:true}).count;}
export function canCraft(state,r){return Object.entries(r.cost).every(([id,n])=>materialCount(state,id)>=n);}
function consumeRecipe(state,r){if(!r||!canCraft(state,r))return false;for(const [id,n] of Object.entries(r.cost))consumeMaterial(state,id,n);return true;}
export function orderCraft(state,recipeId){if(state.run)return{ok:false,msg:'鍛冶は村で。'};const r=recipes.find(x=>x.id===recipeId);if(!r||!consumeRecipe(state,r))return{ok:false,msg:'素材が足りない。'};const id=`forge_${state.calendar.totalSteps}_${Math.random().toString(36).slice(2,8)}`,job=startTimedProcess(state,id,60,{type:'forge',item:r.item,recipeId:r.id});return{ok:true,job,msg:`${items[r.item].name}を鍛冶屋に依頼した。60step後に完成。`};}
export function selfCraft(state,recipeId,quality=.5){if(state.run)return{ok:false,msg:'鍛冶は村で。'};const r=recipes.find(x=>x.id===recipeId);if(!r||!consumeRecipe(state,r))return{ok:false,msg:'素材が足りない。'};const steps=12,t=advanceTime(state,steps);state.ownedItems[r.item]=(state.ownedItems[r.item]||0)+1;const grade=quality>.82?'会心の出来':quality>.52?'上出来':'なんとか完成';return{ok:true,steps,quality,msg:`${items[r.item].name}が完成！ ${grade}。${steps}step経過。 ${timeMessages(t).join(' ')}`};}
export function forgeOrders(state){return (state.timedProcesses||[]).filter(x=>x.payload?.type==='forge');}
export function collectForgeOrder(state,id){const job=collectTimedProcess(state,id);if(!job||job.payload?.type!=='forge')return{ok:false,msg:'まだ受け取れない。'};const item=job.payload.item;state.ownedItems[item]=(state.ownedItems[item]||0)+1;return{ok:true,msg:`${items[item].name}を受け取った。`};}
export function canAlchemy(state){return !state.run&&materialCount(state,'fresh_herb')>=1&&materialCount(state,'mushroom')>=1&&state.gold>=20&&freeCapacity(state)>=1;}
export function brewPotion(state,quality=.5){if(state.run)return{ok:false,msg:'調合は村で。'};if(!canAlchemy(state))return{ok:false,msg:'薬草×1、森キノコ×1、瓶代20Gが必要。'};consumeMaterial(state,'fresh_herb',1);consumeMaterial(state,'mushroom',1);state.gold-=20;const q=clamp(Math.floor(quality*4),0,3),steps=8,t=advanceTime(state,steps);addStack(state,'potion',1,{quality:q,container:'bag'});return{ok:true,steps,msg:`ポーション${qualityLabel(q)}を調合した。瓶代20G / ${steps}step経過。 ${timeMessages(t).join(' ')}`};}

export function equip(state,itemId){const item=items[itemId];if(!item||!(state.ownedItems[itemId]>0))return false;state.player.equipment[item.slot]=itemId;const d=derived(state);state.player.hp=Math.min(state.player.hp,d.maxHp);state.player.mp=Math.min(state.player.mp,d.maxMp);return true;}

// 封印中の放置探索コード
export function startIdle(state,area='outskirts'){state.idle={area,startedAt:Date.now()};return{ok:true};}
export function idleStatus(state,now=Date.now()){if(!state.idle)return null;const elapsed=Math.min(now-state.idle.startedAt,8*60*60*1000);return{elapsed,cycles:Math.floor(elapsed/(10*60*1000))};}
export function claimIdle(state,now=Date.now()){const s=idleStatus(state,now);if(!s||s.cycles<1)return{ok:false};state.idle=null;return{ok:true,result:{cycles:s.cycles}};}

export { backpacks, battleSkills, battleSpells, consumables, enemies, items, materials, recipes, worldEdges, worldNodes, zones };
