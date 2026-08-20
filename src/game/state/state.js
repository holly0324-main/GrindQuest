import { backpacks, enemies, items, localAreas, worldNodes } from '../../data/index.js';
import { makeBattleEnemy, syncLegacyBattle } from '../battle/battle.js';
import { derivedCharacter, emptyEquipment, makeCharacter, TACTICS } from '../characters/characters.js';
import { starterGear, newGearId } from '../equipment/model.js';
import { ageStacks, consolidatePermanentStacks, normalizeStack } from '../inventory/inventory.js';
import { FRESH_STORAGE_UPGRADES, STORAGE_UPGRADES, DAY_STEPS } from '../shared/constants.js';
import { clamp, deep } from '../shared/utils.js';
import { matureProcesses } from '../time/clock.js';

export function defaultState(){
  const hero=makeCharacter('hero','冒険者','冒険者',{},{weapon:'gear_1',body:'gear_2',legs:'gear_3',feet:'gear_4'},{recruited:true,growthTreeId:'hero_adventurer'});
  const boris=makeCharacter('boris','ガルド','戦士',{vitality:52,strength:10,agility:6,magic:4,wisdom:5,knowledge:5,dexterity:6},{},{recruited:false,growthTreeId:'warrior_gald'});
  return{
  version:16,characters:{hero,boris},party:['hero'],
  gold:80,backpack:'cheap',consumables:{camp_set:0},
  gear:starterGear(),nextGearId:5,ownedItems:{},inventory:{},
  itemStacks:[{stackId:'stk_1',id:'potion',count:1,quality:0,container:'bag',remainingLife:1200,lastAgedStep:0}],nextStackId:2,
  warehouseLevel:0,freshWarehouseLevel:0,
  lifeSkills:{gathering:{level:1,xp:0},mining:{level:1,xp:0},fishing:{level:1,xp:0},woodcut:{level:1,xp:0}},
  calendar:{day:1,stepOfDay:0,totalSteps:0},condition:{awakeSteps:0,fatigueStacks:0},
  timedProcesses:[],worldState:{bossDefeatedAt:{}},encyclopedia:{kills:{}},run:null,battle:null,idle:null,
  log:['ミナト村での暮らしがはじまった。'],settings:{vibrate:true}
};}

export function normalize(state){
  const base=defaultState(),old=state||{};
  // v0.14で進行データをリセットしたため、v0.13以前の複雑な互換移行は終了。
  // 古いセーブは新規状態へ戻し、表示設定だけ引き継ぐ。
  if((Number(old.version)||0)<14){
    base.settings={...base.settings,...(old.settings||{})};
    return base;
  }
  const s={...base,...old,version:16};
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
