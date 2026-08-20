import {
  alchemyRecipes, backpacks, battleSkills, battleSpells, consumables, enemies, items, materials,
  localAreas, randomEvents, recipes, worldEdges, worldNodes, zones
} from '../data/gameData.js';

const rand=(min,max)=>Math.floor(Math.random()*(max-min+1))+min;
const pick=a=>a[rand(0,a.length-1)];
const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
const sum=(xs,fn)=>xs.reduce((a,x)=>a+fn(x),0);
const deep=x=>JSON.parse(JSON.stringify(x));
const PHASE_STEPS=50,DAY_STEPS=PHASE_STEPS*3;

export const EQUIPMENT_SLOTS=[['weapon','武器'],['shield','盾'],['head','頭'],['body','からだ上'],['arms','腕'],['legs','からだ下'],['feet','足'],['accessory','アクセ']];
export const QUALITY_NAMES=['','☆1','☆2','☆3'];
export const QUALITY_MULT=[1,1.22,1.48,1.82];
export const QUALITY_LIFE=[1,1.25,1.6,2.0];
export const STORAGE_BASE_CAPACITY=200;
export const STORAGE_UPGRADES=[
  {capacity:200,price:0,name:'木箱倉庫'},
  {capacity:320,price:900,name:'棚付き倉庫'},
  {capacity:500,price:2600,name:'大型倉庫'},
  {capacity:800,price:6500,name:'商会式倉庫'},
  {capacity:1200,price:14500,name:'大倉庫'}
];
export const FRESH_STORAGE_BASE_CAPACITY=36;
export const FRESH_STORAGE_UPGRADES=[
  {capacity:36,price:0,name:'小さな保存棚'},
  {capacity:60,price:700,name:'瓶詰め保存棚'},
  {capacity:90,price:2100,name:'地下保存棚'},
  {capacity:140,price:5200,name:'大型保存庫'},
  {capacity:220,price:12000,name:'商会式保存庫'}
];
export const WORKMANSHIP_NAMES=['並','良','上','極'];
export const ITEM_TAGS={adventure:'冒険用',material:'素材',valuable:'換金'};
export const EQUIPMENT_AFFIXES={
  sturdy:{id:'sturdy',name:'丈夫な',minWorkmanship:1,stat:'hp',min:2,max:6},
  keen:{id:'keen',name:'鋭い',minWorkmanship:1,stat:'atk',min:1,max:3},
  guarded:{id:'guarded',name:'堅牢な',minWorkmanship:1,stat:'def',min:1,max:3},
  swift:{id:'swift',name:'軽快な',minWorkmanship:2,stat:'agility',min:1,max:3},
  wise:{id:'wise',name:'知恵ある',minWorkmanship:2,stat:'wisdom',min:1,max:3},
  skillful:{id:'skillful',name:'精巧な',minWorkmanship:2,stat:'dexterity',min:1,max:3}
};

const allDefs=id=>materials[id]||consumables[id];
const isStackItem=id=>!!allDefs(id)&&id!=='camp_set';
const qualityLabel=q=>QUALITY_NAMES[clamp(Number(q)||0,0,3)]||'';
const tagOf=id=>allDefs(id)?.tag||'material';
export function rarityOf(idOrDef){const d=typeof idOrDef==='string'?(items[idOrDef]||allDefs(idOrDef)):idOrDef;return Math.max(0,Number(d?.rank)||0);}
const BOOK_ITEM_IDS=[...Object.keys(items),...Object.keys(consumables),...Object.keys(materials)];
const BOOK_ENEMY_IDS=Object.keys(enemies);
const bookNo=(ids,id)=>String(Math.max(0,ids.indexOf(id))+1).padStart(3,'0');
const itemKind=d=>d?.slot?'装備':d?.tag==='adventure'?'冒険用アイテム':d?.tag==='valuable'?'換金アイテム':'素材アイテム';
const itemEffect=d=>{if(!d)return'―';if(d.slot){const parts=[];if(d.atk)parts.push(`攻撃+${d.atk}`);if(d.def)parts.push(`守備+${d.def}`);if(d.hp)parts.push(`HP+${d.hp}`);if(d.mp)parts.push(`MP+${d.mp}`);return parts.join(' / ')||'装備品';}if(d.heal)return`HPを基本${d.heal}回復。品質が高いほど効果が上がる。`;if(d.id==='rura_potion')return'探索中、現在地から村へ直帰する。';if(d.id==='camp_set')return'セーフティエリア等でキャンプできる。';if(d.shelfLife)return`寿命 ${d.shelfLife}step（品質で延長）`;return d.tag==='valuable'?'主に売却して資金へ換える。':d.tag==='material'?'鍛冶・調合などの材料として使う。':'特別な効果はまだない。';};
const itemFlavor=d=>d?.desc||(d?.tag==='valuable'?'商人が価値を見出す品。持ち帰ればまとまった資金になる。':d?.tag==='material'?'加工や生産に利用できる素材。地域によって採れ方が異なる。':'冒険者が携帯する道具。');
export function itemBookEntry(state,id){const d=items[id]||allDefs(id);if(!d)return null;const sell=d.slot?Math.max(1,Math.round((d.price||50)*.45)):materials[id]?(d.value||0):null;return{id,number:bookNo(BOOK_ITEM_IDS,id),icon:d.icon||'📦',name:d.name||id,rank:rarityOf(d),kind:itemKind(d),effect:itemEffect(d),flavor:itemFlavor(d),sell,shelfLife:d.shelfLife??null,slot:d.slot||null};}
export function itemBookEntries(state){return BOOK_ITEM_IDS.map(id=>itemBookEntry(state,id)).filter(Boolean);}
function enemyHabitats(id){const rows=[];const labels={morning:'朝',day:'昼',night:'夜'};for(const [zid,z] of Object.entries(zones)){const phases=[];for(const [ph,pool] of Object.entries(z.pools||{}))if((pool||[]).includes(id))phases.push(labels[ph]||ph);if(phases.length)rows.push({place:z.name||zid,time:phases.join('・')});}for(const area of Object.values(localAreas)){for(const node of Object.values(area.nodes||{})){if(node.symbolEnemy===id||node.bossEnemy===id)rows.push({place:`${area.name}・${node.name}`,time:'常駐'});}}const seen=new Set();return rows.filter(r=>{const k=`${r.place}|${r.time}`;if(seen.has(k))return false;seen.add(k);return true;});}
export function monsterBookEntry(state,id){const e=enemies[id];if(!e)return null;return{id,number:bookNo(BOOK_ENEMY_IDS,id),icon:e.icon,name:e.name,kills:Math.max(0,Number(state?.encyclopedia?.kills?.[id])||0),flavor:e.flavor||'',habitats:enemyHabitats(id),slots:(e.slots||[]).map(([count,p])=>({count,p})),drops:(e.loot||[]).map(x=>({id:x.id,name:allDefs(x.id)?.name||x.id,icon:allDefs(x.id)?.icon||'📦',weight:x.w,min:x.min||1,max:x.max||x.min||1,rank:rarityOf(x.id)})),stats:{hp:e.hp,atk:e.atk,def:e.def,agi:e.agi,exp:e.exp}};}
export function monsterBookEntries(state){return BOOK_ENEMY_IDS.map(id=>monsterBookEntry(state,id)).filter(Boolean);}
const tagPriority={adventure:0,material:1,valuable:2};

function starterGear(){return[
  {gearId:'gear_1',baseId:'novice_sword',workmanship:0,affixes:[]},
  {gearId:'gear_2',baseId:'travel_clothes',workmanship:0,affixes:[]},
  {gearId:'gear_3',baseId:'travel_pants',workmanship:0,affixes:[]},
  {gearId:'gear_4',baseId:'travel_boots',workmanship:0,affixes:[]}
];}
const emptyEquipment=()=>({weapon:null,shield:null,head:null,body:null,arms:null,legs:null,feet:null,accessory:null});
function makeCharacter(id,name,job,stats,equipment={},extra={}){return{
  id,name,job,growthTreeId:extra.growthTreeId||`${job}_base`,level:1,exp:0,appPoints:0,tactic:id==='hero'?'manual':'gungun',
  stats:{vitality:46,strength:8,agility:8,magic:8,wisdom:8,knowledge:6,dexterity:7,...stats},
  hp:stats?.vitality||46,mp:(stats?.magic||8)+(stats?.wisdom||8),
  equipment:{...emptyEquipment(),...equipment},recruited:id==='hero',available:true,...extra
};}
export const TACTICS={
  manual:{id:'manual',name:'めいれいさせろ',desc:'毎ターン自分でコマンドを選ぶ。'},
  gungun:{id:'gungun',name:'ガンガンいこうぜ',desc:'攻撃と特技を優先して戦う。'},
  daiji:{id:'daiji',name:'いのちだいじに',desc:'HPが減った仲間の回復を優先する。'}
};
export const PARAMETER_LABELS={vitality:'たいりょく',strength:'ちから',agility:'すばやさ',magic:'まりょく',wisdom:'かしこさ',knowledge:'ちしき',dexterity:'きようさ'};
export function defaultState(){
  const hero=makeCharacter('hero','冒険者','冒険者',{},{weapon:'gear_1',body:'gear_2',legs:'gear_3',feet:'gear_4'},{recruited:true,growthTreeId:'hero_adventurer'});
  const boris=makeCharacter('boris','ガルド','戦士',{vitality:52,strength:10,agility:6,magic:4,wisdom:5,knowledge:5,dexterity:6},{},{recruited:false,growthTreeId:'warrior_gald'});
  return{
  version:15,characters:{hero,boris},party:['hero'],
  gold:80,backpack:'cheap',consumables:{camp_set:0},
  gear:starterGear(),nextGearId:5,ownedItems:{},inventory:{},
  itemStacks:[{stackId:'stk_1',id:'potion',count:1,quality:0,container:'bag',remainingLife:1200,lastAgedStep:0}],nextStackId:2,
  warehouseLevel:0,freshWarehouseLevel:0,
  lifeSkills:{gathering:{level:1,xp:0},mining:{level:1,xp:0},fishing:{level:1,xp:0},woodcut:{level:1,xp:0}},
  calendar:{day:1,stepOfDay:0,totalSteps:0},condition:{awakeSteps:0,fatigueStacks:0},
  timedProcesses:[],worldState:{bossDefeatedAt:{}},encyclopedia:{kills:{}},run:null,battle:null,idle:null,
  log:['ミナト村での暮らしがはじまった。'],settings:{vibrate:true}
};}

export function expToNext(level){return 28+level*level*14;}
export function fatiguePenalty(state){return clamp((state.condition?.fatigueStacks||0)*.10,0,.7);}
export function gearById(state,gearId){return (state.gear||[]).find(g=>g.gearId===gearId)||null;}
export function gearBase(state,gearId){const g=gearById(state,gearId);return g?items[g.baseId]:null;}
export function gearDisplayName(state,gearOrId){const g=typeof gearOrId==='string'?gearById(state,gearOrId):gearOrId;if(!g)return'なし';const base=items[g.baseId];const aff=(g.affixes||[]).map(a=>EQUIPMENT_AFFIXES[a.id]?.name).filter(Boolean);return `${base?.name||g.baseId}${g.workmanship?` ☆${g.workmanship}`:''}${aff.length?` [${aff.join('・')}]`:''}`;}
function workmanshipMul(q){return [1,1.03,1.07,1.12][clamp(q||0,0,3)];}
export function gearStats(state,g){if(!g)return{};const b=items[g.baseId]||{},m=workmanshipMul(g.workmanship);const out={atk:Math.round((b.atk||0)*m),def:Math.round((b.def||0)*m),hp:Math.round((b.hp||0)*m),mp:Math.round((b.mp||0)*m),agility:0,wisdom:0,dexterity:0};for(const a of g.affixes||[])out[a.stat]=(out[a.stat]||0)+(a.value||0);return out;}
export function characterById(state,id='hero'){return state.characters?.[id]||null;}
export function partyMembers(state,{living=false}={}){const ids=Array.isArray(state.party)&&state.party.length?state.party:['hero'];return ids.map(id=>characterById(state,id)).filter(c=>c&&(!living||c.hp>0));}
export function derivedCharacter(state,charOrId='hero'){
  const p=typeof charOrId==='string'?characterById(state,charOrId):charOrId;if(!p)return derived(state);
  const mul=1-fatiguePenalty(state),base=p.stats||{},primary={};
  for(const k of ['vitality','strength','agility','magic','wisdom','knowledge','dexterity'])primary[k]=Math.max(1,Math.floor((base[k]||1)*mul));
  const eq=Object.values(p.equipment||{}).map(id=>gearById(state,id)).filter(Boolean),bonus=k=>sum(eq,g=>gearStats(state,g)[k]||0);
  primary.agility+=bonus('agility');primary.wisdom+=bonus('wisdom');primary.dexterity+=bonus('dexterity');
  const maxHp=Math.max(1,primary.vitality+bonus('hp'));
  const maxMp=Math.max(0,primary.magic+primary.wisdom+bonus('mp'));
  const atk=Math.max(1,primary.strength+bonus('atk'));
  const def=Math.max(0,Math.floor(primary.vitality/11)+bonus('def'));
  return{...primary,maxHp,maxMp,atk,def,fatiguePenalty:1-mul};
}
export function derived(state){return derivedCharacter(state,'hero');}
export function recruitableCharacters(state){return Object.values(state.characters||{}).filter(c=>c.id!=='hero'&&c.available);}
export function setTactic(state,charId,tactic){const c=characterById(state,charId);if(!c||!TACTICS[tactic])return{ok:false,msg:'作戦を変更できない。'};c.tactic=tactic;return{ok:true,msg:`${c.name}の作戦を「${TACTICS[tactic].name}」にした。`};}
export function togglePartyMember(state,charId){if(state.run||state.battle)return{ok:false,msg:'仲間の入れ替えは村で。'};const c=characterById(state,charId);if(!c||charId==='hero')return{ok:false,msg:'その仲間は入れ替えできない。'};const inParty=state.party.includes(charId);if(inParty){state.party=state.party.filter(id=>id!==charId);return{ok:true,joined:false,msg:`${c.name}をパーティから外した。酒場で待機する。`};}if(state.party.length>=4)return{ok:false,msg:'パーティは4人まで。'};c.recruited=true;state.party.push(charId);return{ok:true,joined:true,msg:`${c.name}が仲間に加わった！`};}
export function allocateParameterPoint(state,charId,key){const c=characterById(state,charId);if(!c||!PARAMETER_LABELS[key])return{ok:false,msg:'その能力には振れない。'};if((c.appPoints||0)<=0)return{ok:false,msg:'APPがない。'};c.appPoints--;c.stats[key]=(c.stats[key]||0)+1;const d=derivedCharacter(state,c);c.hp=Math.min(c.hp,d.maxHp);c.mp=Math.min(c.mp,d.maxMp);return{ok:true,msg:`${c.name}の${PARAMETER_LABELS[key]}が1上がった。`};}

function newStackId(state){return`stk_${state.nextStackId++}`;}
function newGearId(state){return`gear_${state.nextGearId++}`;}
function baseLife(id,quality=0){const def=allDefs(id);return def?.shelfLife?Math.round(def.shelfLife*QUALITY_LIFE[clamp(quality,0,3)]):null;}
export function isPerishable(id){return baseLife(id,0)!=null;}
export function storageContainerFor(id){return isPerishable(id)?'fresh_storage':'storage';}
function normalizeContainer(id,container){if(container==='bag')return'bag';if(container==='fresh_storage')return isPerishable(id)?'fresh_storage':'storage';if(container==='storage')return storageContainerFor(id);return'bag';}
function normalizeStack(state,raw){const id=raw.id;if(!isStackItem(id)||!(raw.count>0))return null;const q=clamp(Number(raw.quality)||0,0,3),life=raw.remainingLife==null?baseLife(id,q):Math.max(0,Number(raw.remainingLife));return{stackId:raw.stackId||newStackId(state),id,count:Math.max(1,Math.floor(raw.count)),quality:q,container:normalizeContainer(id,raw.container),remainingLife:life,lastAgedStep:Number.isFinite(raw.lastAgedStep)?raw.lastAgedStep:state.calendar.totalSteps};}
function consolidatePermanentStacks(state){const keep=[],map=new Map();for(const s of state.itemStacks||[]){if(s.remainingLife!=null){keep.push(s);continue;}const key=`${s.container}:${s.id}:${s.quality}`;const ex=map.get(key);if(ex)ex.count+=s.count;else{map.set(key,s);keep.push(s);}}state.itemStacks=keep;}

export function normalize(state){
  const base=defaultState(),old=state||{};
  // v0.14で進行データをリセットしたため、v0.13以前の複雑な互換移行は終了。
  // 古いセーブは新規状態へ戻し、表示設定だけ引き継ぐ。
  if((Number(old.version)||0)<14){
    base.settings={...base.settings,...(old.settings||{})};
    return base;
  }
  const s={...base,...old,version:15};
  s.calendar={...base.calendar,...(old.calendar||{})};
  if(!Number.isFinite(s.calendar.totalSteps))s.calendar.totalSteps=Math.max(0,(Math.max(1,s.calendar.day||1)-1)*DAY_STEPS+(s.calendar.stepOfDay||0));
  s.calendar.day=Math.floor(s.calendar.totalSteps/DAY_STEPS)+1;s.calendar.stepOfDay=s.calendar.totalSteps%DAY_STEPS;

  // v0.14以降は characters / party が正本。player互換フィールドは読み捨てる。
  s.characters={};
  for(const [id,baseChar] of Object.entries(base.characters)){
    const src=old.characters?.[id]||{};
    s.characters[id]={...baseChar,...src,stats:{...baseChar.stats,...(src.stats||{})},equipment:{...baseChar.equipment,...(src.equipment||{})},appPoints:Math.max(0,Number(src.appPoints)||0),tactic:TACTICS[src.tactic]?src.tactic:baseChar.tactic};
  }
  // 将来追加されたキャラもセーブに存在すれば保持する。
  for(const [id,src] of Object.entries(old.characters||{}))if(!s.characters[id]&&src?.id){
    s.characters[id]={...src,stats:{...(src.stats||{})},equipment:{...emptyEquipment(),...(src.equipment||{})},appPoints:Math.max(0,Number(src.appPoints)||0),tactic:TACTICS[src.tactic]?src.tactic:'gungun'};
  }
  s.characters.hero.recruited=true;
  s.party=(Array.isArray(old.party)?old.party:['hero']).filter(id=>s.characters[id]&&s.characters[id].recruited!==false);
  if(!s.party.includes('hero'))s.party.unshift('hero');s.party=[...new Set(s.party)].slice(0,4);

  s.gold=Number.isFinite(old.gold)?old.gold:base.gold;s.backpack=backpacks[old.backpack]?old.backpack:'cheap';s.consumables={camp_set:Math.max(0,Number(old.consumables?.camp_set)||0)};
  s.nextGearId=Math.max(1,Number(old.nextGearId)||1);
  s.gear=Array.isArray(old.gear)?old.gear.map(g=>({gearId:g.gearId||newGearId(s),baseId:g.baseId,workmanship:clamp(g.workmanship||0,0,3),affixes:Array.isArray(g.affixes)?g.affixes:[]})).filter(g=>items[g.baseId]):starterGear();
  if(!s.gear.length){s.gear=starterGear();s.nextGearId=5;}
  s.condition={...base.condition,...(old.condition||{})};s.settings={...base.settings,...(old.settings||{})};s.timedProcesses=Array.isArray(old.timedProcesses)?old.timedProcesses.map(x=>({...x})) : [];s.worldState={bossDefeatedAt:{...(old.worldState?.bossDefeatedAt||{})}};s.encyclopedia={kills:{...(old.encyclopedia?.kills||{})}};
  s.lifeSkills=deep(base.lifeSkills);for(const [k,v] of Object.entries(old.lifeSkills||{}))if(s.lifeSkills[k])s.lifeSkills[k]={...s.lifeSkills[k],...v};
  s.warehouseLevel=clamp(Number(old.warehouseLevel)||0,0,STORAGE_UPGRADES.length-1);s.freshWarehouseLevel=clamp(Number(old.freshWarehouseLevel)||0,0,FRESH_STORAGE_UPGRADES.length-1);s.nextStackId=Math.max(1,Number(old.nextStackId)||1);
  s.itemStacks=(Array.isArray(old.itemStacks)?old.itemStacks:base.itemStacks).map(x=>normalizeStack(s,x)).filter(Boolean);consolidatePermanentStacks(s);

  if(old.run){s.run={location:'town',harvested:[],visited:['town'],lastEvent:null,moves:0,effects:{encounterMod:0,moves:0},startedAtStep:s.calendar.totalSteps,patrols:0,area:null,resourceUses:{},defeatedSymbols:[],...old.run};s.run.resourceUses={...(old.run.resourceUses||{})};s.run.defeatedSymbols=Array.isArray(old.run.defeatedSymbols)?[...old.run.defeatedSymbols]:[];if(old.run.area?.areaId&&localAreas[old.run.area.areaId]){const ar=localAreas[old.run.area.areaId],nodeId=ar.nodes[old.run.area.nodeId]?old.run.area.nodeId:ar.entry;s.run.area={areaId:ar.id,nodeId,visited:Array.isArray(old.run.area.visited)?old.run.area.visited:[nodeId]};}else s.run.area=null;}else s.run=null;
  if(s.run&&(!s.run.location||!worldNodes[s.run.location])){s.run=null;s.battle=null;}
  if(old.battle){
    const ob=old.battle,elist=Array.isArray(ob.enemies)&&ob.enemies.length?ob.enemies.map((x,i)=>({...makeBattleEnemy(x.enemyId||ob.enemyId,i),...x,instanceId:x.instanceId||`enemy_${i+1}`})):(ob.enemyId&&enemies[ob.enemyId]?[{...makeBattleEnemy(ob.enemyId,0),hp:Number.isFinite(ob.enemyHp)?ob.enemyHp:enemies[ob.enemyId].hp,maxHp:Number.isFinite(ob.enemyMaxHp)?ob.enemyMaxHp:enemies[ob.enemyId].hp}]:[]);
    s.battle={menu:'root',escapeAttempts:0,guards:{},pending:{},...ob,enemies:elist,guards:{...(ob.guards||{})},pending:{...(ob.pending||{})}};syncLegacyBattle(s.battle);
  }else s.battle=null;
  s.log=Array.isArray(old.log)?old.log:base.log;s.idle=old.idle||null;
  delete s.player;delete s.ownedItems;delete s.inventory;delete s.perishables;
  ageStacks(s,s.calendar.totalSteps);matureProcesses(s);
  for(const c of Object.values(s.characters)){const d=derivedCharacter(s,c);c.hp=clamp(Number.isFinite(c.hp)?c.hp:d.maxHp,0,d.maxHp);c.mp=clamp(Number.isFinite(c.mp)?c.mp:d.maxMp,0,d.maxMp);}
  return s;
}

export function phaseInfo(state){const step=state.calendar.stepOfDay||0,idx=Math.floor(step/PHASE_STEPS)%3;return{index:idx,key:['morning','day','night'][idx],name:['朝','昼','夜'][idx],icon:['🌅','☀️','🌙'][idx],remaining:PHASE_STEPS-(step%PHASE_STEPS),stepInPhase:step%PHASE_STEPS,phaseSteps:PHASE_STEPS};}
function matureProcesses(state){const now=state.calendar.totalSteps||0,m=[];for(const p of state.timedProcesses||[]){if(!p.ready&&p.readyAt<=now){p.ready=true;m.push(p.id);}}return m;}
function fatigueStacksForAwake(awake){return awake>=DAY_STEPS*2?clamp(Math.floor((awake-DAY_STEPS*2)/PHASE_STEPS)+1,1,7):0;}
function ageStacks(state,toStep){const expired=[];for(const s of state.itemStacks||[]){if(s.remainingLife==null){s.lastAgedStep=toStep;continue;}const from=Number.isFinite(s.lastAgedStep)?s.lastAgedStep:toStep,delta=Math.max(0,toStep-from),rate=s.container==='fresh_storage'?1/3:1;s.remainingLife=Math.max(0,s.remainingLife-delta*rate);s.lastAgedStep=toStep;if(s.remainingLife<=0)expired.push({...s});}if(expired.length)state.itemStacks=state.itemStacks.filter(x=>x.remainingLife==null||x.remainingLife>0);return expired;}
function groupedExpired(xs){const out={};for(const x of xs){const key=`${x.id}:${x.quality}`;out[key]=(out[key]||0)+x.count;}return out;}
export function advanceTime(state,steps,opts={}){steps=Math.max(0,Math.floor(steps||0));const before=phaseInfo(state),beforeDay=state.calendar.day,oldFatigue=state.condition.fatigueStacks||0,newTotal=(state.calendar.totalSteps||0)+steps,expired=ageStacks(state,newTotal);state.calendar.totalSteps=newTotal;state.calendar.day=Math.floor(newTotal/DAY_STEPS)+1;state.calendar.stepOfDay=newTotal%DAY_STEPS;if(opts.resting){state.condition.awakeSteps=0;state.condition.fatigueStacks=0;}else if(opts.awake!==false){state.condition.awakeSteps=(state.condition.awakeSteps||0)+steps;state.condition.fatigueStacks=fatigueStacksForAwake(state.condition.awakeSteps);}const matured=matureProcesses(state),after=phaseInfo(state);for(const c of Object.values(state.characters||{})){const d=derivedCharacter(state,c);c.hp=Math.min(c.hp,d.maxHp);c.mp=Math.min(c.mp,d.maxMp);}return{before,after,changed:before.key!==after.key||beforeDay!==state.calendar.day,day:state.calendar.day,steps,expired:groupedExpired(expired),matured,fatigueBefore:oldFatigue,fatigueAfter:state.condition.fatigueStacks||0};}
function timeMessages(t){const out=[];if(t.changed)out.push(`${t.after.icon} ${t.day}日目 ${t.after.name}になった。`);for(const [key,n] of Object.entries(t.expired||{})){const [id,q]=key.split(':');out.push(`${allDefs(id)?.name||id}${qualityLabel(Number(q))}×${n}が傷んだ。`);}if(t.fatigueAfter>t.fatigueBefore)out.push(`徹夜疲労が進行。全能力 -${t.fatigueAfter*10}%。`);if((t.matured||[]).length)out.push(`完成した作業が ${t.matured.length} 件ある。`);return out;}
export function startTimedProcess(state,id,duration,payload={}){const job={id,startedAt:state.calendar.totalSteps,readyAt:state.calendar.totalSteps+Math.max(1,duration),ready:false,payload};state.timedProcesses.push(job);return job;}
export function collectTimedProcess(state,id){const i=state.timedProcesses.findIndex(x=>x.id===id&&x.ready);if(i<0)return null;return state.timedProcesses.splice(i,1)[0];}
function growMainLevel(state,c){const st=c.stats;st.vitality+=5;st.strength+=2;st.agility+=c.level%2?1:2;st.magic+=1;st.wisdom+=1;st.knowledge+=c.level%2?0:1;st.dexterity+=1;c.appPoints=(c.appPoints||0)+1;}
function addCharacterExp(state,c,amount){c.exp+=amount;let levels=0;while(c.exp>=expToNext(c.level)){c.exp-=expToNext(c.level);c.level++;growMainLevel(state,c);levels++;state.log.unshift(`${c.name}は レベル ${c.level} になった！ APP+1 / HP・MPはそのまま。`);}const d=derivedCharacter(state,c);c.hp=Math.min(c.hp,d.maxHp);c.mp=Math.min(c.mp,d.maxMp);return levels;}
export function addExp(state,amount,source='経験'){amount=Math.max(0,Math.floor(amount||0));if(!amount)return{amount:0,levels:0,msg:''};const members=partyMembers(state),ups=[];let leadLevels=0;for(const c of members){const lv=addCharacterExp(state,c,amount);if(c.id==='hero')leadLevels=lv;if(lv)ups.push(`${c.name} Lv.${c.level}`);}return{amount,levels:leadLevels,msg:`${source} EXP +${amount}${ups.length?` / ${ups.join('・')}！`:''}`};}

export function stackDefinition(id){return allDefs(id);}export function stackQualityLabel(x){return qualityLabel(typeof x==='object'?x.quality:x);}export function stackRemaining(s){return s.remainingLife==null?null:Math.max(0,Math.ceil(s.remainingLife));}
export function stackList(state,container=null,id=null){
  ageStacks(state,state.calendar.totalSteps);
  return(state.itemStacks||[]).filter(x=>(!container||x.container===container)&&(!id||x.id===id)).sort((a,b)=>{
    const ta=tagPriority[tagOf(a.id)]??9,tb=tagPriority[tagOf(b.id)]??9;if(ta!==tb)return ta-tb;
    const na=allDefs(a.id)?.name||a.id,nb=allDefs(b.id)?.name||b.id,nn=na.localeCompare(nb,'ja');if(nn)return nn;
    if((container==='bag'||(!container&&a.container==='bag'&&b.container==='bag'))){const la=a.remainingLife??1e12,lb=b.remainingLife??1e12;if(la!==lb)return la-lb;if(a.quality!==b.quality)return b.quality-a.quality;}
    else{if(a.quality!==b.quality)return b.quality-a.quality;const la=a.remainingLife??1e12,lb=b.remainingLife??1e12;if(la!==lb)return la-lb;}
    return String(a.stackId).localeCompare(String(b.stackId));
  });
}
export function stackCount(state,id,container=null){return sum(stackList(state,container,id),x=>x.count);}export function perishableCount(state,id,container){return sum(stackList(state,container,id).filter(x=>x.remainingLife!=null),x=>x.count);}export function perishableSummary(state,container){return stackList(state,container).filter(x=>x.remainingLife!=null).map(x=>({id:x.id,count:x.count,remaining:stackRemaining(x),quality:x.quality,stackId:x.stackId}));}export function materialCount(state,id){return stackCount(state,id);}
export function backpackCapacity(state){return backpacks[state.backpack]?.capacity||40;}
export function warehouseCapacity(state){return STORAGE_UPGRADES[state.warehouseLevel]?.capacity||STORAGE_BASE_CAPACITY;}
export function freshWarehouseCapacity(state){return FRESH_STORAGE_UPGRADES[state.freshWarehouseLevel]?.capacity||FRESH_STORAGE_BASE_CAPACITY;}
export function usedStorageCapacity(state){return sum(stackList(state,'storage'),x=>(allDefs(x.id)?.bulk||1)*x.count);}
export function usedFreshStorageCapacity(state){return sum(stackList(state,'fresh_storage'),x=>(allDefs(x.id)?.bulk||1)*x.count);}
export function usedCapacity(state){let used=(consumables.camp_set?.bulk||0)*(state.consumables.camp_set||0);used+=sum(stackList(state,'bag'),x=>(allDefs(x.id)?.bulk||1)*x.count);return used;}
export function freeCapacity(state){return Math.max(0,backpackCapacity(state)-usedCapacity(state));}
export function freeStorageCapacity(state){return Math.max(0,warehouseCapacity(state)-usedStorageCapacity(state));}
export function freeFreshStorageCapacity(state){return Math.max(0,freshWarehouseCapacity(state)-usedFreshStorageCapacity(state));}
function containerFree(state,container){return container==='storage'?freeStorageCapacity(state):container==='fresh_storage'?freeFreshStorageCapacity(state):freeCapacity(state);}
function addStack(state,id,count=1,{quality=0,container='bag',remainingLife=null}={}){if(!isStackItem(id)||count<=0)return 0;container=normalizeContainer(id,container);const def=allDefs(id),bulk=def.bulk||1,space=containerFree(state,container),added=Math.min(count,Math.floor(space/bulk));if(added<=0)return 0;quality=clamp(Math.floor(quality),0,3);const life=remainingLife==null?baseLife(id,quality):remainingLife;if(life==null){const existing=state.itemStacks.find(x=>x.id===id&&x.container===container&&x.quality===quality&&x.remainingLife==null);if(existing)existing.count+=added;else state.itemStacks.push({stackId:newStackId(state),id,count:added,quality,container,remainingLife:null,lastAgedStep:state.calendar.totalSteps});}else{state.itemStacks.push({stackId:newStackId(state),id,count:added,quality,container,remainingLife:Math.max(1,life),lastAgedStep:state.calendar.totalSteps});}return added;}
function removeFromStack(state,stackId,count=1){const s=state.itemStacks.find(x=>x.stackId===stackId);if(!s)return null;const n=Math.min(Math.max(1,count),s.count),copy={...s,count:n};s.count-=n;if(s.count<=0)state.itemStacks=state.itemStacks.filter(x=>x.stackId!==stackId);return copy;}
function takeItems(state,id,count,{containers=['storage','fresh_storage','bag'],preferLowQuality=true}={}){let need=count,taken=[];let list=stackList(state).filter(x=>x.id===id&&containers.includes(x.container));list.sort((a,b)=>{const life=(a.remainingLife??1e12)-(b.remainingLife??1e12);if(life)return life;return preferLowQuality?a.quality-b.quality:b.quality-a.quality;});for(const s of list){if(need<=0)break;const r=removeFromStack(state,s.stackId,Math.min(need,s.count));if(r){taken.push(r);need-=r.count;}}return{count:count-need,taken};}
function moveStackInternal(state,stackId,to,count='all'){ageStacks(state,state.calendar.totalSteps);const s=state.itemStacks.find(x=>x.stackId===stackId);if(!s)return{ok:false,msg:'その品は見つからない。'};const target=to==='bag'?'bag':storageContainerFor(s.id);if(s.container===target)return{ok:false,msg:'すでにそこにある。'};const n=count==='all'?s.count:Math.min(s.count,Math.max(1,Math.floor(count||1))),whole=n===s.count,bulk=(allDefs(s.id)?.bulk||1)*n,free=containerFree(state,target);if(bulk>free)return{ok:false,msg:target==='bag'?'バッグに入らない。':target==='fresh_storage'?'生鮮倉庫に空きがない。':'通常倉庫に空きがない。'};const moved=removeFromStack(state,stackId,n);if(!moved)return{ok:false,msg:'その品は見つからない。'};if(moved.remainingLife==null){const ex=state.itemStacks.find(x=>x.id===moved.id&&x.container===target&&x.quality===moved.quality&&x.remainingLife==null);if(ex)ex.count+=moved.count;else state.itemStacks.push({...moved,stackId:whole?moved.stackId:newStackId(state),container:target,lastAgedStep:state.calendar.totalSteps});}else state.itemStacks.push({...moved,stackId:whole?moved.stackId:newStackId(state),container:target,lastAgedStep:state.calendar.totalSteps});const where=target==='bag'?'バッグ':target==='fresh_storage'?'生鮮倉庫':'通常倉庫';return{ok:true,count:n,msg:`${allDefs(moved.id).name}${qualityLabel(moved.quality)}×${n}を${where}へ移した。`};}
export function transferStack(state,stackId,to,count='all'){if(state.run)return{ok:false,msg:'倉庫整理は村にいる時だけ。'};return moveStackInternal(state,stackId,to,count);}
export function upgradeWarehouse(state){if(state.run)return{ok:false,msg:'村にいる時だけ拡張できる。'};const next=STORAGE_UPGRADES[state.warehouseLevel+1];if(!next)return{ok:false,msg:'これ以上拡張できない。'};if(state.gold<next.price)return{ok:false,msg:'お金が足りない。'};state.gold-=next.price;state.warehouseLevel++;return{ok:true,msg:`通常倉庫を拡張した！ 容量 ${next.capacity}`};}
export function upgradeFreshWarehouse(state){if(state.run)return{ok:false,msg:'村にいる時だけ拡張できる。'};const next=FRESH_STORAGE_UPGRADES[state.freshWarehouseLevel+1];if(!next)return{ok:false,msg:'これ以上拡張できない。'};if(state.gold<next.price)return{ok:false,msg:'お金が足りない。'};state.gold-=next.price;state.freshWarehouseLevel++;return{ok:true,msg:`生鮮倉庫を拡張した！ 容量 ${next.capacity}`};}
export function warehouseGroups(state,kind='normal'){const container=kind==='fresh'?'fresh_storage':'storage',list=stackList(state,container),by=new Map();for(const s of list){let g=by.get(s.id);if(!g){g={id:s.id,def:allDefs(s.id),count:0,qualities:new Map()};by.set(s.id,g);}g.count+=s.count;let q=g.qualities.get(s.quality);if(!q){q={quality:s.quality,count:0,stacks:[]};g.qualities.set(s.quality,q);}q.count+=s.count;q.stacks.push({...s,remaining:stackRemaining(s)});}const warehousePriority={material:0,valuable:1,adventure:2};return[...by.values()].sort((a,b)=>(warehousePriority[tagOf(a.id)]??9)-(warehousePriority[tagOf(b.id)]??9)||(a.def?.name||a.id).localeCompare(b.def?.name||b.id,'ja')).map(g=>({...g,qualities:[...g.qualities.values()].sort((a,b)=>a.quality-b.quality).map(q=>({...q,stacks:q.stacks.sort((a,b)=>(a.remaining??1e12)-(b.remaining??1e12))}))}));}

function edgeBetween(a,b){return worldEdges.find(e=>(e.a===a&&e.b===b)||(e.a===b&&e.b===a));}export function adjacentNodes(id){return worldEdges.filter(e=>e.a===id||e.b===id).map(e=>({id:e.a===id?e.b:e.a,edge:e,node:worldNodes[e.a===id?e.b:e.a]}));}
export function currentLocalArea(state){return state.run?.area?localAreas[state.run.area.areaId]||null:null;}
export function currentPlace(state){const area=currentLocalArea(state);return area?.nodes?.[state.run.area.nodeId]||worldNodes[state.run?.location||'town'];}
export function localAdjacentNodes(state){const area=currentLocalArea(state);if(!area)return[];const id=state.run.area.nodeId;return area.edges.filter(e=>e.a===id||e.b===id).map(e=>{const next=e.a===id?e.b:e.a;return{id:next,edge:e,node:area.nodes[next]};});}
export function localAreaEntry(state){if(!state.run||state.run.area)return null;const world=worldNodes[state.run.location],area=world?.interior?localAreas[world.interior]:null;return area?{area,world}:null;}
export function localAreaType(state){const a=currentLocalArea(state);return a?{id:a.type,name:a.typeName||a.type}:null;}
export function startExpedition(state){if(state.run)return{ok:false,msg:'すでに探索中。'};if(!partyMembers(state,{living:true}).length)return{ok:false,msg:'戦える仲間がいない。村で休もう。'};state.run={location:'town',harvested:[],visited:['town'],lastEvent:null,moves:0,effects:{encounterMod:0,moves:0},startedAtStep:state.calendar.totalSteps,patrols:0,area:null,resourceUses:{},defeatedSymbols:[]};state.battle=null;return{ok:true,msg:'村の周辺へ出た。村アイコンをもう一度押せば町へ戻れる。'};}
function weightedEvent(zone,phase){const pool=randomEvents.filter(e=>(!e.zones||e.zones.includes(zone))&&(!e.phases||e.phases.includes(phase)));const total=pool.reduce((a,e)=>a+(e.weight||1),0);let r=Math.random()*total;for(const e of pool){r-=e.weight||1;if(r<=0)return e;}return pool.at(-1);}
function gatheringQuality(state,difficulty=1,performance=.5,kind='herb'){const skill=lifeSkillInfo(state,kind).level,dex=derived(state).dexterity;const score=performance*1.8+(skill-difficulty)*.62+(dex-7)*.055+(Math.random()-.5)*.7;if(score>=2.75)return 3;if(score>=1.85)return 2;if(score>=.9)return 1;return 0;}
function applyEvent(state,event){const ef=event.effect||{};let suffix='';if(ef.herb){const q=gatheringQuality(state,currentLocation(state).resourceDifficulty||1,.55,'herb'),n=addStack(state,'fresh_herb',ef.herb,{quality:q,container:'bag'});suffix=n?` 薬草${qualityLabel(q)}+${n}`:' バッグがいっぱいで薬草は置いてきた。';}if(ef.cargo){const[id,n]=ef.cargo,q=materials[id]?.consumable?gatheringQuality(state,1,.5,'herb'):clamp(Math.floor(Math.random()*2),0,3),a=addStack(state,id,n,{quality:q,container:'bag'});suffix+=a?` ${materials[id].name}${qualityLabel(q)}+${a}`:' バッグがいっぱいで持てない。';}if(ef.randomCargo){const id=pick(ef.randomCargo),q=clamp(Math.floor(Math.random()*2),0,3),a=addStack(state,id,1,{quality:q,container:'bag'});suffix+=a?` ${materials[id].name}${qualityLabel(q)}+1`:' バッグがいっぱいで持てない。';}if(ef.encounterMod!=null)state.run.effects={encounterMod:ef.encounterMod,moves:ef.moves||1};if(ef.steps){const t=advanceTime(state,ef.steps);suffix+=` ${ef.steps}step経過。 ${timeMessages(t).join(' ')}`;}const xp=ef.exp??(event.id==='nothing'?0:1);if(xp)suffix+=` ${addExp(state,xp,'探索').msg}`;return event.text+suffix;}
function resolveArrivalEvent(state,chance=.48){if(!state.run||state.run.area)return null;const node=currentLocation(state);if(node.zone==='village')return null;if(Math.random()>chance){state.run.lastEvent='特に目立った出来事はなかった。';return state.run.lastEvent;}const ev=weightedEvent(node.zone,phaseInfo(state).key);state.run.lastEvent=applyEvent(state,ev);return state.run.lastEvent;}
function encounterCountFor(e,reason){
  if(['boss_symbol','symbol','camp_raid'].includes(reason))return 1;
  if((e.exp||0)<=12)return rand(1,3);
  if((e.exp||0)<=28)return rand(1,2);
  return 1;
}
function makeBattleEnemy(enemyId,index){const e=enemies[enemyId];return{instanceId:`enemy_${index+1}`,enemyId,hp:e.hp,maxHp:e.hp,atk:e.atk,def:e.def,agi:e.agi||8,exp:e.exp};}
function syncLegacyBattle(b){const x=(b.enemies||[]).find(e=>e.hp>0)||b.enemies?.[0];if(!x)return;b.enemyId=x.enemyId;b.enemyHp=x.hp;b.enemyMaxHp=x.maxHp;b.enemyAtk=x.atk;b.enemyDef=x.def;b.enemyAgi=x.agi;b.expReward=(b.enemies||[]).reduce((a,e)=>a+(e.exp||0),0);}
function beginEncounter(state,enemyId,reason='encounter',meta={}){
  const e=enemies[enemyId];if(!e)return false;
  const count=meta.count||encounterCountFor(e,reason),pool=Array.isArray(meta.groupPool)&&meta.groupPool.length?meta.groupPool:[enemyId],group=Array.from({length:count},(_,i)=>makeBattleEnemy(i===0?enemyId:pick(pool),i));
  state.battle={enemies:group,over:false,won:false,escaped:false,turn:1,escapeAttempts:0,reason,guards:{},pending:{},...meta,log:[`${e.name}${count>1?`たち ×${count}`:''}が あらわれた！`]};
  syncLegacyBattle(state.battle);return true;
}
function areaSymbolKey(areaId,nodeId){return`${areaId}:${nodeId}`;}
export function bossStatus(state,areaId,nodeId){const a=localAreas[areaId],n=a?.nodes?.[nodeId];if(!n?.bossEnemy)return null;const key=areaSymbolKey(areaId,nodeId),last=state.worldState?.bossDefeatedAt?.[key],respawn=n.bossRespawn||300,remaining=last==null?0:Math.max(0,respawn-(state.calendar.totalSteps-last));return{key,ready:last==null||remaining<=0,remaining,last,enemyId:n.bossEnemy};}
function localSymbolEncounter(state,node){const area=currentLocalArea(state);if(!area||!node)return false;const key=areaSymbolKey(area.id,node.id);if(node.bossEnemy){const bs=bossStatus(state,area.id,node.id);if(bs?.ready)return beginEncounter(state,node.bossEnemy,'boss_symbol',{symbolKey:key,bossSymbol:true});return false;}if(node.symbolEnemy&&!state.run.defeatedSymbols.includes(key))return beginEncounter(state,node.symbolEnemy,'symbol',{symbolKey:key});return false;}
function maybeWorldEncounter(state,edge=null,mult=1){const node=currentLocation(state),zone=zones[node.zone],phase=phaseInfo(state);if(!zone?.encounter)return false;let chance=zone.encounter*(edge?.risk||1)*mult;if(phase.key==='night')chance+=.08;if(state.run.effects?.moves>0){chance+=state.run.effects.encounterMod||0;state.run.effects.moves--;if(state.run.effects.moves<=0)state.run.effects={encounterMod:0,moves:0};}if(Math.random()>clamp(chance,0,.82))return false;const pool=zone.pools[phase.key]||zone.pools.day;if(!pool?.length)return false;const first=pick(pool);return beginEncounter(state,first,'encounter',{groupPool:pool});}
function maybeLocalEncounter(state,mult=1){const area=currentLocalArea(state);if(!area)return false;const phase=phaseInfo(state),zone=zones[area.zone];let chance=(area.encounter??zone?.encounter??0)*mult;if(phase.key==='night')chance+=.05;if(Math.random()>clamp(chance,0,.8))return false;const pool=zone?.pools?.[phase.key]||zone?.pools?.day;if(!pool?.length)return false;const first=pick(pool);return beginEncounter(state,first,'local_encounter',{groupPool:pool});}

function maybeContextEncounter(state,mult=1){if(state.run?.area&&localSymbolEncounter(state,currentPlace(state)))return true;return state.run?.area?maybeLocalEncounter(state,mult):maybeWorldEncounter(state,null,mult);}
export function travelTo(state,target){if(!state.run||state.battle||state.run.area)return{ok:false,msg:'今は周辺地図を移動できない。'};const from=state.run.location,edge=edgeBetween(from,target);if(!edge)return{ok:false,msg:'そこへ直接は行けない。'};let steps=edge.steps;if(state.run.effects?.nextDiscount){steps=Math.max(1,steps-state.run.effects.nextDiscount);delete state.run.effects.nextDiscount;}const firstVisit=!state.run.visited.includes(target),time=advanceTime(state,steps);state.run.location=target;state.run.moves++;if(firstVisit)state.run.visited.push(target);const notes=timeMessages(time);if(firstVisit&&target!=='town'){const z=worldNodes[target]?.zone,xp={outskirts:2,river:3,forest:4,mountain:5,ruins:6}[z]||2;notes.push(addExp(state,xp,'新しい場所').msg);}if(target==='town'){state.run.lastEvent='ミナト村の入口まで戻ってきた。村アイコンをタップすると探索を終える。';return{ok:true,atTown:true,msg:[state.run.lastEvent,...notes].join(' ')}}if(maybeWorldEncounter(state,edge)){state.run.lastEvent=notes.join(' ')||'移動中に魔物の気配！';return{ok:true,battle:true,msg:state.run.lastEvent};}const ev=resolveArrivalEvent(state);return{ok:true,msg:[notes.join(' '),ev||`${worldNodes[target].name}に着いた。`].filter(Boolean).join(' ')};}
export function enterLocalArea(state){if(!state.run||state.battle||state.run.area)return{ok:false,msg:'今は入れない。'};const entry=localAreaEntry(state);if(!entry)return{ok:false,msg:'ここには入れる場所がない。'};const a=entry.area;state.run.area={areaId:a.id,nodeId:a.entry,visited:[a.entry]};state.run.lastEvent=`${a.name}へ入った。`;return{ok:true,area:a,msg:`${a.typeName}「${a.name}」へ入った。`};}
export function leaveLocalArea(state){if(!state.run?.area||state.battle)return{ok:false,msg:'今は外へ戻れない。'};const a=currentLocalArea(state);if(!a.entryWorld)return{ok:false,msg:'ここから外へは出られない。移動ポイントから前の区画へ戻ろう。'};const entry=a.nodes[a.entry];if(state.run.area.nodeId!==a.entry)return{ok:false,msg:`${entry?.name||'入口'}まで戻ろう。`};state.run.location=a.entryWorld;if(!state.run.visited.includes(a.entryWorld))state.run.visited.push(a.entryWorld);state.run.area=null;state.run.lastEvent=`${worldNodes[state.run.location].name}へ戻った。`;return{ok:true,msg:state.run.lastEvent};}
export function localMove(state,target){if(!state.run?.area||state.battle)return{ok:false,msg:'今は移動できない。'};const area=currentLocalArea(state),from=state.run.area.nodeId;if(target===from)return localPatrol(state);const edge=area.edges.find(e=>(e.a===from&&e.b===target)||(e.a===target&&e.b===from));if(!edge)return{ok:false,msg:'そこへ直接は行けない。'};const steps=edge.steps==null?area.moveSteps||0:edge.steps,t=advanceTime(state,steps);state.run.area.nodeId=target;if(!state.run.area.visited.includes(target))state.run.area.visited.push(target);state.run.moves++;const node=area.nodes[target],notes=timeMessages(t);if(localSymbolEncounter(state,node)){state.run.lastEvent=`${node.name}で魔物が道を塞いだ！`;return{ok:true,battle:true,steps,msg:[state.run.lastEvent,...notes].join(' ')}}if(steps>0&&area.encounterOnMove&&maybeLocalEncounter(state)){state.run.lastEvent=`${area.name}を移動中、魔物と遭遇した！`;return{ok:true,battle:true,steps,msg:[state.run.lastEvent,...notes].join(' ')}}state.run.lastEvent=`${node.name}へ移動した。${steps?` ${steps}step。`:''}`;return{ok:true,steps,msg:[state.run.lastEvent,...notes].join(' ')};}
export function localPatrol(state){if(!state.run?.area||state.battle)return{ok:false,msg:'今は巡回できない。'};const node=currentPlace(state);if(localSymbolEncounter(state,node)){state.run.lastEvent='目の前のシンボルと接触した！';return{ok:true,battle:true,steps:0,msg:state.run.lastEvent};}const t=advanceTime(state,1),notes=timeMessages(t);if(maybeLocalEncounter(state,.92)){state.run.lastEvent='その場を探っていると魔物と遭遇した！';return{ok:true,battle:true,steps:1,msg:[state.run.lastEvent,...notes].join(' ')}}state.run.lastEvent='周辺を1step見て回った。';return{ok:true,steps:1,msg:[state.run.lastEvent,...notes].join(' ')};}
export function areaTransitionStatus(state){const a=currentLocalArea(state),node=currentPlace(state),tr=node?.transition;if(!a||!tr)return null;const dest=localAreas[tr.areaId];return dest?{from:a,node,transition:tr,destination:dest}:null;}
export function useAreaTransition(state){const st=areaTransitionStatus(state);if(!st||state.battle)return{ok:false,msg:'ここから移動できない。'};const dest=st.destination,target=dest.nodes[st.transition.nodeId]?st.transition.nodeId:dest.entry,steps=st.transition.steps??1,t=advanceTime(state,steps);state.run.area={areaId:dest.id,nodeId:target,visited:[target]};const notes=timeMessages(t);if(steps>0&&dest.encounterOnMove&&maybeLocalEncounter(state)){state.run.lastEvent=`${dest.name}へ移動した直後、魔物と遭遇した！`;return{ok:true,battle:true,steps,msg:[state.run.lastEvent,...notes].join(' ')}}state.run.lastEvent=`${dest.name}へ移動した。`;return{ok:true,steps,msg:[`${st.transition.label||'移動'}：${dest.name} / ${steps}step`,...notes].join(' ')}};
function autoStoreNonAdventure(state){ageStacks(state,state.calendar.totalSteps);let moved=0,left=0,freshMoved=0,normalMoved=0;for(const s of [...stackList(state,'bag')]){if(tagOf(s.id)==='adventure')continue;const r=moveStackInternal(state,s.stackId,'storage','all');if(r.ok){moved+=r.count;if(isPerishable(s.id))freshMoved+=r.count;else normalMoved+=r.count;}else left+=s.count;}return{moved,left,freshMoved,normalMoved};}
function returnToTown(state,method){const auto=autoStoreNonAdventure(state),report={items:stackList(state,'bag').map(x=>({...x})),method,auto};state.run=null;state.battle=null;state.log.unshift(method==='rura'?'ルーラのポーションで村へ帰還した。':`歩いて村へ戻った。素材${auto.moved}個を倉庫へ送った。`);return report;}
export function patrol(state){if(!state.run||state.battle||state.run.area)return{ok:false,msg:'今は巡回できない。'};if(currentLocation(state).zone==='village'){const report=returnToTown(state,'walk');return{ok:true,returned:true,report,steps:0,msg:`村へ戻った。冒険用以外を倉庫へ自動収納した（${report.auto.moved}個${report.auto.left?` / 入らず${report.auto.left}個残留`:''}）。`};}const t=advanceTime(state,1);state.run.patrols=(state.run.patrols||0)+1;const notes=timeMessages(t);if(maybeWorldEncounter(state,null,.92)){state.run.lastEvent='周辺を巡回していると魔物と遭遇した！';return{ok:true,battle:true,steps:1,msg:[state.run.lastEvent,...notes].join(' ')}}let ev=null;if(Math.random()<.12)ev=resolveArrivalEvent(state,1);state.run.lastEvent=ev||'周辺を1step巡回した。魔物の気配はない。';return{ok:true,battle:false,steps:1,msg:[state.run.lastEvent,...notes].join(' ')};}

const pushBattle=(b,m)=>{b.log.push(m);if(b.log.length>36)b.log.shift();};
function finishBattleTurn(state,b){const t=advanceTime(state,1);b.turn++;b.pending={};b.guards={};for(const m of timeMessages(t))pushBattle(b,m);syncLegacyBattle(b);}
export function battleItemStacks(state){return stackList(state,'bag').filter(s=>allDefs(s.id)?.consumable&&['fresh_herb','potion','honey_drop'].includes(s.id));}
export function battleSkillList(){return Object.values(battleSkills);}
export function battleSpellList(){return Object.values(battleSpells);}
export function livingEnemies(state){const b=ensureBattleShape(state);return(b?.enemies||[]).filter(e=>e.hp>0);}
export function battleCurrentActor(state){if(!state.battle||state.battle.over)return null;return partyMembers(state,{living:true}).find(c=>(c.tactic||'manual')==='manual'&&!state.battle.pending?.[c.id])||null;}
function enemyLabel(b,target){const same=(b.enemies||[]).filter(x=>x.enemyId===target.enemyId);if(same.length<=1)return enemies[target.enemyId]?.name||'魔物';const idx=same.indexOf(target);return`${enemies[target.enemyId]?.name||'魔物'} ${String.fromCharCode(65+idx)}`;}
function chooseEnemyTarget(state,payload={}){const alive=livingEnemies(state);return alive.find(x=>x.instanceId===payload.targetId)||alive[0]||null;}
function choosePartyTarget(state,payload={},fallback=null){const alive=partyMembers(state,{living:true});return alive.find(c=>c.id===payload.targetId)||fallback||alive[0]||null;}
function useHealingStack(state,b,stackId,target){const s=state.itemStacks.find(x=>x.stackId===stackId&&x.container==='bag');if(!s||!allDefs(s.id)?.consumable||!target)return{valid:false};const def=allDefs(s.id),removed=removeFromStack(state,stackId,1);if(!removed)return{valid:false};const amount=Math.max(1,Math.round((def.heal||0)*QUALITY_MULT[removed.quality])),d=derivedCharacter(state,target),before=target.hp;target.hp=Math.min(d.maxHp,target.hp+amount);const heal=target.hp-before;pushBattle(b,`${target.name}に${def.name}${qualityLabel(removed.quality)}を使った。HPが ${heal} 回復した。`);return{valid:true,heal,targetId:target.id};}
function playerAction(state,b,actor,cmd){
  const st=derivedCharacter(state,actor),type=cmd.type,payload=cmd.payload||{};let target=chooseEnemyTarget(state,payload),ally=choosePartyTarget(state,payload,actor),valid=true,enemyDamage=0,heal=0,action=type;
  if(type==='attack'){if(!target)return{valid:false};enemyDamage=Math.max(1,st.atk+rand(-2,3)-Math.floor(target.def*.55));target.hp=Math.max(0,target.hp-enemyDamage);pushBattle(b,`${actor.name}の攻撃！ ${enemyLabel(b,target)}に ${enemyDamage} ダメージ！`);}
  else if(type==='skill'){const sk=battleSkills[payload.id||'flame_slash'];if(!sk)valid=false;else if(actor.mp<sk.mp){pushBattle(b,`${actor.name}はMPが たりない！`);valid=false;}else if(!target)valid=false;else{actor.mp-=sk.mp;const rate=sk.id==='heavy_slash'?1.45:1.7;enemyDamage=Math.max(2,Math.floor(st.atk*rate)+rand(-2,4)-Math.floor(target.def*.35));target.hp=Math.max(0,target.hp-enemyDamage);pushBattle(b,`${actor.name}の${sk.name}！ ${enemyLabel(b,target)}に ${enemyDamage} ダメージ！`);action='skill';}}
  else if(type==='spell'){const sp=battleSpells[payload.id||'heal'];if(!sp)valid=false;else if(actor.mp<sp.mp){pushBattle(b,`${actor.name}はMPが たりない！`);valid=false;}else{actor.mp-=sp.mp;const d=derivedCharacter(state,ally),before=ally.hp;ally.hp=Math.min(d.maxHp,ally.hp+18+actor.level*4+Math.floor(st.wisdom*.35)+rand(0,5));heal=ally.hp-before;pushBattle(b,`${actor.name}の${sp.name}！ ${ally.name}のHPが ${heal} 回復した。`);action='spell';}}
  else if(type==='defend'){b.guards[actor.id]=true;pushBattle(b,`${actor.name}は身を守っている。`);}
  else if(type==='item'){const r=useHealingStack(state,b,payload.stackId,ally);valid=r.valid;heal=r.heal||0;action='item';if(!valid)pushBattle(b,'その道具は使えない。');}
  else valid=false;
  syncLegacyBattle(b);return{valid,enemyDamage,heal,action,targetId:target?.instanceId,allyId:ally?.id};
}
function enemyAction(state,b,enemy){
  const targets=partyMembers(state,{living:true});if(!targets.length)return{damage:0};
  const target=pick(targets),st=derivedCharacter(state,target);let dmg=Math.max(1,enemy.atk+rand(-2,3)-Math.floor(st.def*.45));if(b.guards[target.id])dmg=Math.max(1,Math.floor(dmg*.45));target.hp=Math.max(0,target.hp-dmg);pushBattle(b,`${enemyLabel(b,enemy)}の攻撃！ ${target.name}は ${dmg} ダメージ。`);return{damage:dmg,targetId:target.id,enemyId:enemy.instanceId};
}
function rollSlots(e){let r=Math.random(),acc=0;for(const[n,p]of e.slots||[[1,1]]){acc+=p;if(r<=acc)return n;}return(e.slots||[[1,1]]).at(-1)[0];}
function rollLoot(e){const total=(e.loot||[]).reduce((a,x)=>a+x.w,0);let r=Math.random()*total;for(const x of e.loot||[]){r-=x.w;if(r<=0)return{id:x.id,count:rand(x.min||1,x.max||x.min||1)};}return null;}
function dropQuality(e,id){const def=allDefs(id),base=e.exp>=70?.65:e.exp>=35?.36:.16;let q=Math.random()<base?1:0;if(Math.random()<.07)q++;if(Math.random()<.018)q++;if(def?.tag==='valuable')q=Math.min(q,2);return clamp(q,0,3);}
function victory(state){
  const b=state.battle; b.over=true;b.won=true;
  state.encyclopedia=state.encyclopedia||{kills:{}};state.encyclopedia.kills=state.encyclopedia.kills||{};
  let totalExp=0;const drops=[],lost=[];
  for(const be of b.enemies||[]){const e=enemies[be.enemyId];if(!e)continue;state.encyclopedia.kills[e.id]=(state.encyclopedia.kills[e.id]||0)+1;totalExp+=e.exp||0;for(let i=0;i<rollSlots(e);i++){const d=rollLoot(e);if(!d)continue;const q=dropQuality(e,d.id),a=addStack(state,d.id,d.count,{quality:q,container:'bag'});if(a)drops.push(`${allDefs(d.id).name}${qualityLabel(q)}×${a}`);if(a<d.count)lost.push(`${allDefs(d.id).name}×${d.count-a}`);}}
  if(b.symbolKey){if(b.bossSymbol){state.worldState=state.worldState||{bossDefeatedAt:{}};state.worldState.bossDefeatedAt=state.worldState.bossDefeatedAt||{};state.worldState.bossDefeatedAt[b.symbolKey]=state.calendar.totalSteps;}else if(state.run&&!state.run.defeatedSymbols.includes(b.symbolKey))state.run.defeatedSymbols.push(b.symbolKey);}
  const xp=addExp(state,totalExp,'戦闘');pushBattle(b,`魔物の群れを たおした！ ${xp.msg}`);if(drops.length)pushBattle(b,`戦利品: ${drops.join(' / ')}`);if(lost.length)pushBattle(b,`バッグに入らず置いてきた: ${lost.join(' / ')}`);return{xp,drops,lost};
}
function ensureBattleShape(state){const b=state.battle;if(!b)return null;b.pending=b.pending||{};b.guards=b.guards||{};if(!Array.isArray(b.enemies)||!b.enemies.length){if(b.enemyId&&enemies[b.enemyId])b.enemies=[{...makeBattleEnemy(b.enemyId,0),hp:Number.isFinite(b.enemyHp)?b.enemyHp:enemies[b.enemyId].hp,maxHp:Number.isFinite(b.enemyMaxHp)?b.enemyMaxHp:enemies[b.enemyId].hp,atk:Number.isFinite(b.enemyAtk)?b.enemyAtk:enemies[b.enemyId].atk,def:Number.isFinite(b.enemyDef)?b.enemyDef:enemies[b.enemyId].def,agi:Number.isFinite(b.enemyAgi)?b.enemyAgi:(enemies[b.enemyId].agi||8)}];else b.enemies=[];}syncLegacyBattle(b);return b;}
function allPartyDown(state){return partyMembers(state).every(c=>c.hp<=0);}
function autoCommandFor(state,c){
  const aliveEnemies=livingEnemies(state),target=aliveEnemies[0];if(!target)return{type:'defend',payload:{}};
  if(c.tactic==='daiji'){const low=partyMembers(state,{living:true}).sort((a,b)=>a.hp/derivedCharacter(state,a).maxHp-b.hp/derivedCharacter(state,b).maxHp)[0];if(low&&low.hp/derivedCharacter(state,low).maxHp<.55&&c.mp>=4&&(c.stats.magic||0)>=6)return{type:'spell',payload:{id:'heal',targetId:low.id}};}
  if(c.tactic==='gungun'&&c.mp>=3&&Math.random()<.42)return{type:'skill',payload:{id:'heavy_slash',targetId:target.instanceId}};
  return{type:'attack',payload:{targetId:target.instanceId}};
}
function fillAutoCommands(state,b){for(const c of partyMembers(state,{living:true}))if((c.tactic||'manual')!=='manual'&&!b.pending[c.id])b.pending[c.id]=autoCommandFor(state,c);}
function resolveRound(state,b){
  fillAutoCommands(state,b);const events=[],entries=[];
  for(const c of partyMembers(state,{living:true})){const cmd=b.pending[c.id];if(cmd)entries.push({kind:'party',id:c.id,initiative:derivedCharacter(state,c).agility+rand(-3,3),cmd});}
  for(const e of livingEnemies(state))entries.push({kind:'enemy',id:e.instanceId,initiative:e.agi+rand(-3,3)});
  entries.sort((a,b)=>b.initiative-a.initiative||Math.random()-.5);
  for(const x of entries){
    if(allPartyDown(state)||livingEnemies(state).length===0)break;
    if(x.kind==='party'){const c=characterById(state,x.id);if(!c||c.hp<=0)continue;const r=playerAction(state,b,c,x.cmd);if(r.valid)events.push({kind:'party',actorId:c.id,...r});}
    else{const e=(b.enemies||[]).find(z=>z.instanceId===x.id);if(!e||e.hp<=0)continue;const r=enemyAction(state,b,e);events.push({kind:'enemy',...r});}
  }
  let victoryInfo=null;if(livingEnemies(state).length===0)victoryInfo=victory(state);else if(allPartyDown(state)){b.over=true;b.won=false;pushBattle(b,'パーティは ちからつきた……。冒険用品以外のバッグ内容を失う。');}
  finishBattleTurn(state,b);return{ok:true,resolved:true,events,victory:victoryInfo};
}
export function command(state,type,payload={}){
  const b=ensureBattleShape(state);if(!b||b.over)return{ok:false};
  if(type==='auto'){fillAutoCommands(state,b);if(battleCurrentActor(state))return{ok:false};return resolveRound(state,b);}
  if(type==='escape'){
    b.escapeAttempts=(b.escapeAttempts||0)+1;const chance=Math.min(1,b.escapeAttempts/3),success=Math.random()<chance;pushBattle(b,`逃げ道を探した！ 成功率 ${Math.round(chance*100)}%。`);
    const events=[];if(success){b.over=true;b.escaped=true;pushBattle(b,'パーティはうまく逃げ切った！');}else{pushBattle(b,'しかし回り込まれた！');for(const e of livingEnemies(state)){const r=enemyAction(state,b,e);events.push({kind:'enemy',...r});if(allPartyDown(state))break;}if(allPartyDown(state)){b.over=true;b.won=false;pushBattle(b,'パーティは ちからつきた……。');}}
    finishBattleTurn(state,b);return{ok:true,resolved:true,action:'escape',escaped:success,escapeChance:chance,events};
  }
  const actor=payload.actorId?characterById(state,payload.actorId):battleCurrentActor(state);if(!actor||actor.hp<=0)return{ok:false};
  const probe={type,payload}; // 基本的な入力妥当性を先に確認
  if(type==='skill'){const sk=battleSkills[payload.id||'flame_slash'];if(!sk||actor.mp<sk.mp)return{ok:false};}
  if(type==='spell'){const sp=battleSpells[payload.id||'heal'];if(!sp||actor.mp<sp.mp)return{ok:false};}
  if(type==='item'&&!state.itemStacks.find(x=>x.stackId===payload.stackId&&x.container==='bag'))return{ok:false};
  b.pending[actor.id]=probe;fillAutoCommands(state,b);
  const next=battleCurrentActor(state);if(next)return{ok:true,awaiting:true,nextActorId:next.id};
  return resolveRound(state,b);
}
export function finishBattle(state){if(!state.battle?.over||(!state.battle.won&&!state.battle.escaped))return{ok:false};const msg=state.battle.escaped?'逃走して周囲へ戻った。':'周囲へ戻った。';state.battle=null;return{ok:true,msg};}
function loseExplorationBag(state){const keep=[],lost=[];for(const s of state.itemStacks){if(s.container==='bag'&&tagOf(s.id)!=='adventure')lost.push(s);else keep.push(s);}state.itemStacks=keep;return lost;}
export function defeatReturn(state){if(!state.run)return{ok:false};const lost=loseExplorationBag(state);state.run=null;state.battle=null;for(const c of partyMembers(state)){c.hp=Math.max(1,c.hp);}state.log.unshift('パーティは力尽き、探索品を失って村まで運ばれた。');return{ok:true,lost};}
export function useRura(state,stackId=null){if(!state.run||state.battle)return{ok:false,msg:'今は使えない。'};const list=stackList(state,'bag','rura_potion'),s=stackId?list.find(x=>x.stackId===stackId):list[0];if(!s)return{ok:false,msg:'ルーラのポーションを持っていない。'};removeFromStack(state,s.stackId,1);const stepCost=[2,1,1,0][s.quality]??2,t=advanceTime(state,stepCost),report=returnToTown(state,'rura');return{ok:true,report,msg:`ルーラのポーション${qualityLabel(s.quality)}で村へ直行した。${stepCost}step経過。冒険用以外は倉庫へ。${timeMessages(t).join(' ')}`};}

export function currentLocation(state){return worldNodes[state.run?.location||'town'];}export function resourceStatus(state){if(!state.run)return null;const node=currentPlace(state);if(!node?.resource)return null;const area=currentLocalArea(state),key=area?`${area.id}:${node.id}`:node.id,maxUses=area?(node.resourceUses||1):1,usedCount=area?(state.run.resourceUses?.[key]||0):(state.run.harvested.includes(node.id)?1:0);return{kind:node.resource,used:usedCount>=maxUses,usedCount,maxUses,remainingUses:Math.max(0,maxUses-usedCount),key,node,difficulty:node.resourceDifficulty||1,area};}function lifeSkillKey(kind){return kind==='herb'?'gathering':kind;}export function lifeSkillInfo(state,kind){const key=lifeSkillKey(kind),s=state.lifeSkills[key]||{level:1,xp:0};return{key,...s,next:8+s.level*6};}
function gainLifeSkill(state,kind,amount=2){const key=lifeSkillKey(kind),s=state.lifeSkills[key];if(!s)return null;s.xp+=amount;const next=()=>8+s.level*6;let up=0;while(s.xp>=next()){s.xp-=next();s.level++;up++;const leader=characterById(state,state.party?.[0]||'hero')||characterById(state,'hero');if(leader){leader.stats.dexterity+=1;if(key==='gathering')leader.stats.knowledge+=1;else if(key==='mining'&&s.level%2===0)leader.stats.vitality+=1;else if(key==='fishing'&&s.level%2===0)leader.stats.agility+=1;else if(key==='woodcut'&&s.level%2===0)leader.stats.strength+=1;}}return{...s,up,key};}
function harvestQuality(state,kind,performance,difficulty){return gatheringQuality(state,difficulty,performance,kind);}
export function resolveGatherEncounter(state,rate=.92){
  if(!state.run||state.battle)return false;
  const encounter=maybeContextEncounter(state,rate);
  if(encounter&&state.run)state.run.lastEvent='作業音に気づいた魔物が近づいてきた！';
  return encounter;
}
export function harvestResult(state,performance=.5,{deferEncounter=false}={}){
  const rs=resourceStatus(state);if(!rs||rs.used)return{ok:false,msg:'ここではもう採れない。'};
  if(rs.area){state.run.resourceUses=state.run.resourceUses||{};state.run.resourceUses[rs.key]=(state.run.resourceUses[rs.key]||0)+1;}
  else if(!state.run.harvested.includes(rs.node.id))state.run.harvested.push(rs.node.id);
  const q=harvestQuality(state,rs.kind,clamp(performance,0,1),rs.difficulty);let got={},msg='';
  if(rs.kind==='herb'){
    const id=rs.node.id==='mushroom_ring'?'mushroom':'fresh_herb',n=performance>.82?3:performance>.42?2:1,a=addStack(state,id,n,{quality:q,container:'bag'});got[id]=a;msg=`${materials[id].name}${qualityLabel(q)}を ${a} 個採った。${a<n?' バッグがいっぱいだ。':''}`;
  }else if(rs.kind==='mining'){
    let id='iron_ore';if(['crystal_ledge','blue_wall','crystal_pocket'].includes(rs.node.id)&&performance>.72)id=Math.random()<.28?'flame_crystal':'magic_crystal';else if(performance>.86&&Math.random()<.5)id=['hidden_cave','shard_floor'].includes(rs.node.id)?'magic_crystal':'iron_ore';const n=performance>.72&&id==='iron_ore'?2:1,a=addStack(state,id,n,{quality:q,container:'bag'});got[id]=a;msg=`${materials[id].name}${qualityLabel(q)}を ${a} 個採掘した。${a<n?' バッグがいっぱいだ。':''}`;
  }else if(rs.kind==='fishing'){
    if(performance<.2)msg='魚に逃げられた。';else{const id=performance>.82&&Math.random()<.5?'silver_fish':'river_fish',a=addStack(state,id,1,{quality:q,container:'bag'});got[id]=a;msg=a?`${materials[id].name}${qualityLabel(q)}を釣り上げた！`:'バッグがいっぱいで魚を持てない。';}
  }else if(rs.kind==='woodcut'){
    const id=performance>.8&&Math.random()<.45?'hardwood':'softwood',n=performance>.62?2:1,a=addStack(state,id,n,{quality:q,container:'bag'});got[id]=a;msg=`${materials[id].name}${qualityLabel(q)}を ${a} 個切り出した。${a<n?' バッグがいっぱいだ。':''}`;
  }else return{ok:false,msg:'何も起きない。'};
  const stepCost={herb:2,mining:5,fishing:4,woodcut:5}[rs.kind]||2,t=advanceTime(state,stepCost),xp=addExp(state,{herb:2,mining:4,fishing:3,woodcut:4}[rs.kind]||2,'採集'),life=gainLifeSkill(state,rs.kind,2),notes=timeMessages(t);const remaining=rs.area?Math.max(0,rs.maxUses-(state.run.resourceUses[rs.key]||0)):0;
  let encounter=false;if(!deferEncounter){encounter=resolveGatherEncounter(state,.92);if(encounter)notes.push('作業音に気づいた魔物が近づいてきた！');}
  return{ok:true,battle:encounter,encounterPending:deferEncounter,msg:`${msg} ${stepCost}step経過。 ${xp.msg}${life?.up?` / ${life.key} Lv.${life.level}！ きようさ+${life.up}`:''}${rs.area?` / この地点あと${remaining}回`:''}${notes.length?` ${notes.join(' ')}`:''}`,got,steps:stepCost,xp,quality:q,life,remainingUses:remaining};
}

function healWithStack(state,stackId,targetId){const s=state.itemStacks.find(x=>x.stackId===stackId&&x.container==='bag');if(!s||!allDefs(s.id)?.consumable)return{ok:false,msg:'その道具は使えない。'};const target=characterById(state,targetId);if(!target||!state.party?.includes(target.id))return{ok:false,msg:'その仲間には使えない。'};if(target.hp<=0)return{ok:false,msg:'戦闘不能の仲間には使えない。'};const def=allDefs(s.id),removed=removeFromStack(state,stackId,1),d=derivedCharacter(state,target),before=target.hp,amount=Math.round((def.heal||0)*QUALITY_MULT[removed.quality]);target.hp=Math.min(d.maxHp,target.hp+amount);return{ok:true,heal:target.hp-before,stack:removed,target};}
export function useFieldItem(state,idOrStack,targetId=null){if(!state.run||state.battle)return{ok:false,msg:'探索中に使う道具ではない。'};let s=state.itemStacks.find(x=>x.stackId===idOrStack&&x.container==='bag');if(!s)s=stackList(state,'bag',idOrStack)[0];if(!s)return{ok:false,msg:'その道具を持っていない。'};if(s.id==='rura_potion')return useRura(state,s.stackId);const target=targetId?characterById(state,targetId):partyMembers(state,{living:true})[0];const r=healWithStack(state,s.stackId,target?.id);if(!r.ok)return r;const t=advanceTime(state,2),def=allDefs(r.stack.id),encounter=maybeContextEncounter(state,.92),notes=timeMessages(t);if(encounter)notes.push('道具を使っている間に魔物が近づいてきた！');return{ok:true,battle:encounter,steps:2,targetId:r.target.id,msg:`${r.target.name}に${def.name}${qualityLabel(r.stack.quality)}を使った。HP +${r.heal} / 2step経過。 ${notes.join(' ')}`};}
export function sleepDuration(state){const r=phaseInfo(state).remaining;return r>=20?r:r+PHASE_STEPS;}export function restAtTown(state){if(state.run)return{ok:false,msg:'探索中は村で休めない。'};const steps=sleepDuration(state),t=advanceTime(state,steps,{resting:true});for(const c of partyMembers(state)){const d=derivedCharacter(state,c);c.hp=d.maxHp;c.mp=d.maxMp;}state.log.unshift(`${steps}ステップ眠って${t.after.name}になった。`);return{ok:true,steps,msg:`${steps}step休息。パーティ全員のHP/MP全回復。${t.after.icon} ${t.after.name}になった。`};}
export function campStatus(state){if(!state.run)return null;const node=currentPlace(state);return{allowed:!!node.campSafety,safety:node.campSafety||null,node,hasSet:(state.consumables.camp_set||0)>0};}function recoverCamp(state,ratio){let hp=0,mp=0;for(const c of partyMembers(state)){const d=derivedCharacter(state,c),h=Math.floor((d.maxHp-c.hp)*ratio),m=Math.floor((d.maxMp-c.mp)*ratio);c.hp=Math.min(d.maxHp,c.hp+h);c.mp=Math.min(d.maxMp,c.mp+m);hp+=h;mp+=m;}return{hp,mp};}
export function camp(state){if(!state.run||state.battle)return{ok:false,msg:'今はキャンプできない。'};const cs=campStatus(state);if(!cs.allowed)return{ok:false,msg:'ここは野営に向かない。'};if(!cs.hasSet)return{ok:false,msg:'キャンプセットを持っていない。'};const steps=sleepDuration(state);if(cs.safety==='semi'&&Math.random()<.35){const interrupted=Math.max(10,Math.ceil(steps/2)),t=advanceTime(state,interrupted,{awake:false}),rec=recoverCamp(state,.20),zone=zones[cs.node.zone||currentLocalArea(state)?.zone||currentLocation(state).zone],pool=zone?.pools?.[phaseInfo(state).key]||zone?.pools?.day||['slime'];beginEncounter(state,pick(pool),'camp_raid');state.run.lastEvent=`野営中に襲撃！ ${interrupted}step経過。`;return{ok:true,raided:true,battle:true,steps:interrupted,msg:`うとうとしたところを襲われた！ HP+${rec.hp} / MP+${rec.mp}。${timeMessages(t).join(' ')}`};}const t=advanceTime(state,steps,{resting:true}),rec=recoverCamp(state,.70);state.run.lastEvent=`キャンプで${steps}step休んだ。`;return{ok:true,raided:false,steps,msg:`キャンプ成功。HP+${rec.hp} / MP+${rec.mp}。疲労も解消。${timeMessages(t).join(' ')}`};}

export function buyConsumable(state,id){const x=consumables[id];if(!x)return{ok:false,msg:'商品がない。'};if(id==='camp_set'){if((state.consumables.camp_set||0)>=1)return{ok:false,msg:'キャンプセットはもう持っている。'};if(state.gold<x.price)return{ok:false,msg:'お金が足りない。'};if(freeCapacity(state)<x.bulk)return{ok:false,msg:'バッグに入らない。'};state.gold-=x.price;state.consumables.camp_set=1;return{ok:true,msg:'キャンプセットを買った。'};}if(state.gold<x.price)return{ok:false,msg:'お金が足りない。'};const a=addStack(state,id,1,{quality:0,container:'bag'});if(!a)return{ok:false,msg:'バッグに入らない。'};state.gold-=x.price;return{ok:true,msg:`${x.name}を買った。品質0。`};}
export function upgradeBackpack(state){const order=['cheap','canvas','explorer'],idx=order.indexOf(state.backpack),next=backpacks[order[idx+1]];if(!next)return{ok:false,msg:'これ以上大きなバッグはない。'};if(state.gold<next.price)return{ok:false,msg:'お金が足りない。'};state.gold-=next.price;state.backpack=next.id;return{ok:true,msg:`${next.name}に買い替えた！`};}
function sellValue(stack,n=1){const def=materials[stack.id];return Math.round((def?.value||0)*[1,1.25,1.6,2.15][stack.quality]*n);}export function sellStack(state,stackId,count=1){if(state.run)return{ok:false,msg:'売却は村にいる時だけ。'};const s=state.itemStacks.find(x=>x.stackId===stackId);if(!s||!materials[s.id])return{ok:false,msg:'売れる品がない。'};const n=Math.min(s.count,Math.max(1,count)),gain=sellValue(s,n),removed=removeFromStack(state,stackId,n);state.gold+=gain;return{ok:true,msg:`${materials[s.id].name}${qualityLabel(s.quality)}×${removed.count}を ${gain}G で売った。`,gain};}
export function sellMaterial(state,id,count=1){if(state.run)return{ok:false,msg:'売却は村にいる時だけ。'};const list=stackList(state).filter(x=>x.id===id&&materials[id]);if(!list.length)return{ok:false,msg:'売れる品がない。'};let need=count==='all'?sum(list,x=>x.count):Math.max(1,count),gain=0,n=0;for(const s of [...list]){if(need<=0)break;const take=Math.min(need,s.count);gain+=sellValue(s,take);removeFromStack(state,s.stackId,take);n+=take;need-=take;}state.gold+=gain;return{ok:true,msg:`${materials[id].name}×${n}を ${gain}G で売った。`,gain};}
export function sellAll(state){if(state.run)return{ok:false,msg:'売却は村にいる時だけ。'};let gain=0,count=0;for(const s of [...stackList(state)])if(materials[s.id]){gain+=sellValue(s,s.count);count+=s.count;removeFromStack(state,s.stackId,s.count);}state.gold+=gain;return{ok:true,msg:`品物${count}個をまとめて ${gain}G で売った。`,gain};}
export function sellAllValuables(state){if(state.run)return{ok:false,msg:'売却は村にいる時だけ。'};let gain=0,count=0;for(const s of [...stackList(state).filter(x=>x.container==='storage'||x.container==='fresh_storage')])if(tagOf(s.id)==='valuable'){gain+=sellValue(s,s.count);count+=s.count;removeFromStack(state,s.stackId,s.count);}state.gold+=gain;return{ok:true,msg:count?`換金アイテム${count}個を ${gain}G で売った。`:'換金アイテムはない。',gain,count};}

function consumeMaterial(state,id,count){return takeItems(state,id,count,{containers:['storage','fresh_storage','bag'],preferLowQuality:true}).count;}
export function recipeRequirements(state,r){return Object.entries(r?.cost||{}).map(([id,need])=>({id,need,have:materialCount(state,id),enough:materialCount(state,id)>=need,def:materials[id]}));}
export function canCraft(state,r){return recipeRequirements(state,r).every(x=>x.enough);}
function consumeRecipe(state,r){if(!r||!canCraft(state,r))return false;for(const[id,n]of Object.entries(r.cost))consumeMaterial(state,id,n);return true;}
function rollAffixes(workmanship){const eligible=Object.values(EQUIPMENT_AFFIXES).filter(a=>workmanship>=a.minWorkmanship),count=workmanship>=3?(Math.random()<.55?2:1):workmanship>=2?(Math.random()<.45?1:0):workmanship>=1?(Math.random()<.15?1:0):0,out=[];for(let i=0;i<count&&eligible.length;i++){const idx=rand(0,eligible.length-1),a=eligible.splice(idx,1)[0];out.push({id:a.id,stat:a.stat,value:rand(a.min,a.max)});}return out;}
function createGear(state,baseId,workmanship=0){const g={gearId:newGearId(state),baseId,workmanship:clamp(Math.floor(workmanship),0,3),affixes:[]};g.affixes=rollAffixes(g.workmanship);state.gear.push(g);return g;}
export function forgeRecipeProduct(r){if(r?.item){const def=items[r.item];return{kind:'gear',id:r.item,count:1,def,name:def?.name||r.item,icon:def?.icon||'⚒️',slot:def?.slot||'other',rank:def?.rank||0};}if(r?.material){const def=materials[r.material];return{kind:'material',id:r.material,count:r.count||1,def,name:def?.name||r.material,icon:def?.icon||'📦',slot:'material',rank:null};}return null;}
function makeForgeProduct(state,p,workmanship){if(!p)return null;if(p.kind==='gear')return{gear:createGear(state,p.id,workmanship),count:1};const container=storageContainerFor(p.id),added=addStack(state,p.id,p.count||1,{quality:workmanship,container});return{material:p.id,count:added,quality:workmanship};}
export function orderCraft(state,recipeId){if(state.run)return{ok:false,msg:'鍛冶は村で。'};const r=recipes.find(x=>x.id===recipeId),p=forgeRecipeProduct(r);if(!r||!p||!consumeRecipe(state,r))return{ok:false,msg:'素材が足りない。'};const id=`forge_${state.calendar.totalSteps}_${Math.random().toString(36).slice(2,8)}`,job=startTimedProcess(state,id,60,{type:'forge',product:p,recipeId:r.id,workmanship:1});return{ok:true,job,msg:`${p.name}を鍛冶屋に依頼した。60step後に完成。`};}
export function selfCraft(state,recipeId,performance=.5){if(state.run)return{ok:false,msg:'鍛冶は村で。'};const r=recipes.find(x=>x.id===recipeId),p=forgeRecipeProduct(r);if(!r||!p||!canCraft(state,r))return{ok:false,msg:'素材が足りない。'};if(p.kind==='material'){const c=storageContainerFor(p.id),need=(p.def?.bulk||1)*(p.count||1);if(containerFree(state,c)<need)return{ok:false,msg:'完成品を置く倉庫に空きがない。'};}if(!consumeRecipe(state,r))return{ok:false,msg:'素材が足りない。'};const steps=12,t=advanceTime(state,steps),q=performance>.9?3:performance>.7?2:performance>.42?1:0,result=makeForgeProduct(state,p,q);if(p.kind==='material'&&!result?.count)return{ok:false,msg:'完成したが保管場所に空きがない。'};const display=p.kind==='gear'?gearDisplayName(state,result.gear):`${p.name}${qualityLabel(q)}×${result.count}`;return{ok:true,steps,quality:q,...result,msg:`${display}が完成！ 出来栄え${WORKMANSHIP_NAMES[q]}。${steps}step経過。 ${timeMessages(t).join(' ')}`};}
export function forgeOrders(state){return(state.timedProcesses||[]).filter(x=>x.payload?.type==='forge');}
export function collectForgeOrder(state,id){const i=(state.timedProcesses||[]).findIndex(x=>x.id===id&&x.ready&&x.payload?.type==='forge');if(i<0)return{ok:false,msg:'まだ受け取れない。'};const job=state.timedProcesses[i],p=job.payload.product||{kind:'gear',id:job.payload.item,name:items[job.payload.item]?.name};if(p.kind==='material'){const result=makeForgeProduct(state,p,job.payload.workmanship||1);if(!result?.count)return{ok:false,msg:'倉庫に空きがないため受け取れない。'};state.timedProcesses.splice(i,1);return{ok:true,...result,msg:`${p.name}${qualityLabel(result.quality)}×${result.count}を受け取った。`};}state.timedProcesses.splice(i,1);const result=makeForgeProduct(state,p,job.payload.workmanship||1);return{ok:true,...result,msg:`${gearDisplayName(state,result.gear)}を受け取った。`};}

export function alchemyRecipeProduct(r){if(r?.consumable){const def=consumables[r.consumable];return{kind:'consumable',id:r.consumable,count:r.count||1,def,name:r.name||def?.name||r.consumable,icon:r.icon||def?.icon||'🧪'};}if(r?.material){const def=materials[r.material];return{kind:'material',id:r.material,count:r.count||1,def,name:r.name||def?.name||r.material,icon:r.icon||def?.icon||'🧴'};}return null;}
function alchemyRecipe(recipeId){return typeof recipeId==='string'?alchemyRecipes.find(x=>x.id===recipeId):recipeId;}
export function alchemyMaxBatch(state,recipeId,cap=99){const r=alchemyRecipe(recipeId),p=alchemyRecipeProduct(r);if(state.run||!r||!p)return 0;let max=Math.max(0,Math.floor(cap));for(const[id,n]of Object.entries(r.cost||{}))max=Math.min(max,Math.floor(materialCount(state,id)/Math.max(1,n)));if(r.gold)max=Math.min(max,Math.floor(state.gold/r.gold));const container=p.kind==='consumable'?'bag':storageContainerFor(p.id),bulk=(p.def?.bulk||1)*(p.count||1);if(bulk>0)max=Math.min(max,Math.floor(containerFree(state,container)/bulk));return Math.max(0,max);}
export function canAlchemy(state,recipeId='a_potion'){return alchemyMaxBatch(state,recipeId,1)>=1;}
function reserveAlchemy(state,r,count=1){if(!r||count<1||alchemyMaxBatch(state,r,count)<count)return null;const taken=[],qualityWeight={sum:0,count:0};for(const[id,n]of Object.entries(r.cost||{})){const got=takeItems(state,id,n*count,{containers:['storage','fresh_storage','bag'],preferLowQuality:true});if(got.count<n*count)return null;for(const x of got.taken){taken.push(x);qualityWeight.sum+=(x.quality||0)*x.count;qualityWeight.count+=x.count;}}state.gold-=(r.gold||0)*count;return{recipeId:r.id,count,taken,materialQuality:qualityWeight.count?qualityWeight.sum/qualityWeight.count:0,gold:(r.gold||0)*count};}
function alchemyOutput(state,r,count,quality,steps){const p=alchemyRecipeProduct(r),container=p.kind==='consumable'?'bag':storageContainerFor(p.id),total=(p.count||1)*count,added=addStack(state,p.id,total,{quality,container}),t=advanceTime(state,steps);return{ok:added===total,product:p,count:added,quality,steps,msg:`${p.name}${qualityLabel(quality)}×${added}を調合した。 ${steps}step経過。 ${timeMessages(t).join(' ')}`};}
export function beginManualAlchemy(state,recipeId){if(state.run)return{ok:false,msg:'調合は村で。'};const r=alchemyRecipe(recipeId);if(!r||alchemyMaxBatch(state,r,1)<1)return{ok:false,msg:'材料・瓶代・保管容量のどれかが足りない。'};const reservation=reserveAlchemy(state,r,1);if(!reservation)return{ok:false,msg:'材料を用意できなかった。'};return{ok:true,recipe:r,reservation,msg:`${r.name}の材料を釜へ用意した。`};}
export function completeManualAlchemy(state,reservation,score=.5,elapsedMs=0){if(!reservation?.recipeId)return{ok:false,msg:'調合情報がない。'};const r=alchemyRecipe(reservation.recipeId);if(!r)return{ok:false,msg:'レシピが見つからない。'};const elapsedSteps=Math.max(r.steps||8,Math.ceil(Math.max(0,elapsedMs)/3000));if(score<.30){const id=r.consumable?'failed_potion':'alchemy_sludge',def=allDefs(id),container=r.consumable?'bag':storageContainerFor(id),added=addStack(state,id,1,{quality:0,container}),t=advanceTime(state,elapsedSteps);return{ok:added===1,failed:true,product:{kind:r.consumable?'consumable':'material',id,def,name:def?.name||id,icon:def?.icon||'🧫'},count:added,quality:null,steps:elapsedSteps,score,materialQuality:reservation.materialQuality,msg:`${def?.name||'失敗作'}×${added}ができた。 ${elapsedSteps}step経過。 ${timeMessages(t).join(' ')}`};}const q=score>=.87?3:score>=.70?2:score>=.50?1:0,out=alchemyOutput(state,r,1,q,elapsedSteps);out.score=score;out.materialQuality=reservation.materialQuality;return out;}
function simpleAlchemyQuality(state){const dex=derived(state).dexterity;return dex>=85?3:dex>=42?2:dex>=18?1:0;}
export function simpleAlchemy(state,recipeId,count=1){if(state.run)return{ok:false,msg:'調合は村で。'};const r=alchemyRecipe(recipeId),max=alchemyMaxBatch(state,r,99);count=Math.max(1,Math.min(Math.floor(count||1),max));if(!r||max<1)return{ok:false,msg:'材料・瓶代・保管容量のどれかが足りない。'};const reservation=reserveAlchemy(state,r,count);if(!reservation)return{ok:false,msg:'材料を用意できなかった。'};const q=simpleAlchemyQuality(state),base=r.steps||8,steps=count===1?base:Math.ceil(base*(1+(count-1)*.45)),out=alchemyOutput(state,r,count,q,steps);out.mode=count===1?'simple':'batch';return out;}
// 旧API互換。既存テストや呼び出しは手動性能値を品質へ変換する。
export function brewAlchemy(state,recipeId,performance=.5){const start=beginManualAlchemy(state,recipeId);if(!start.ok)return start;const q=clamp(Math.floor(clamp(performance,0,1)*4),0,3);return alchemyOutput(state,start.recipe,1,q,start.recipe.steps||8);}
export function brewPotion(state,quality=.5){return brewAlchemy(state,'a_potion',quality);}

export function equipmentList(state,slot=null){return(state.gear||[]).filter(g=>!slot||items[g.baseId]?.slot===slot).sort((a,b)=>(items[b.baseId]?.rank||0)-(items[a.baseId]?.rank||0)||b.workmanship-a.workmanship);}
export function equip(state,gearId,charId='hero'){let g=gearById(state,gearId);if(!g&&items[gearId])g=equipmentList(state,items[gearId].slot).find(x=>x.baseId===gearId);if(!g)return false;const slot=items[g.baseId]?.slot,c=characterById(state,charId);if(!slot||!c)return false;for(const other of Object.values(state.characters||{}))for(const [k,v] of Object.entries(other.equipment||{}))if(v===g.gearId)other.equipment[k]=null;c.equipment[slot]=g.gearId;const d=derivedCharacter(state,c);c.hp=Math.min(c.hp,d.maxHp);c.mp=Math.min(c.mp,d.maxMp);return true;}
export function sellEquipment(state,gearId){if(state.run)return{ok:false,msg:'装備売却は村で。'};const g=gearById(state,gearId);if(!g)return{ok:false,msg:'装備がない。'};if(Object.values(state.characters||{}).some(c=>Object.values(c.equipment||{}).includes(g.gearId)))return{ok:false,msg:'誰かが装備中の品は売れない。'};const b=items[g.baseId],affixBonus=(g.affixes||[]).length*.08,gain=Math.max(1,Math.round((b.price||50)*(.45+g.workmanship*.08+affixBonus)));state.gear=state.gear.filter(x=>x.gearId!==g.gearId);state.gold+=gain;return{ok:true,gain,msg:`${gearDisplayName(state,g)}を ${gain}G で売った。`};}

export function startIdle(state,area='outskirts'){state.idle={area,startedAt:Date.now()};return{ok:true};}export function idleStatus(state,now=Date.now()){if(!state.idle)return null;const elapsed=Math.min(now-state.idle.startedAt,8*60*60*1000);return{elapsed,cycles:Math.floor(elapsed/(10*60*1000))};}export function claimIdle(state,now=Date.now()){const s=idleStatus(state,now);if(!s||s.cycles<1)return{ok:false};state.idle=null;return{ok:true,result:{cycles:s.cycles}};}

export {alchemyRecipes,backpacks,battleSkills,battleSpells,consumables,enemies,items,localAreas,materials,recipes,worldEdges,worldNodes,zones};
