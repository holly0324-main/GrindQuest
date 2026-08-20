import { battleSkills, battleSpells, enemies } from '../../data/index.js';
import { addExpByCharacter, characterById, derivedCharacter, partyMembers, setTactic, TACTICS } from '../characters/characters.js';
import { addStack, removeFromStack, stackList } from '../inventory/inventory.js';
import { seeMonster } from '../discovery/discovery.js';
import { finalizeExpedition, recordBattleStart, recordEnemyDefeat } from '../expedition/expedition.js';
import { allDefs, qualityLabel, tagOf } from '../items/catalog.js';
import { QUALITY_MULT } from '../shared/constants.js';
import { clamp, pick, rand } from '../shared/utils.js';
import { advanceTime, timeMessages } from '../time/clock.js';

const ENEMY_LEVEL_GROWTH={hp:.16,atk:.10,def:.08,agi:.04};
const enemyLevelInt=v=>Math.max(1,Math.floor(Number(v)||1));
function encounterCountFor(e,reason){
  if(['boss_symbol','symbol','camp_raid'].includes(reason))return 1;
  if((e.exp||0)<=12)return rand(1,3);
  if((e.exp||0)<=28)return rand(1,2);
  return 1;
}
export function rollEnemyLevel(profile={},fixed=null){
  if(fixed!=null&&Number.isFinite(Number(fixed)))return enemyLevelInt(fixed);
  const min=enemyLevelInt(profile?.min||1),max=Math.max(min,enemyLevelInt(profile?.max||min)),rareMax=Math.max(max,enemyLevelInt(profile?.rareMax||max)),rareChance=clamp(Number(profile?.rareChance)||0,0,1);
  if(rareMax>max&&Math.random()<rareChance)return rand(max+1,rareMax);
  return rand(min,max);
}
export function enemyStatsAtLevel(enemyId,level=null){
  const e=enemies[enemyId];if(!e)return null;const baseLevel=enemyLevelInt(e.baseLevel||1),lv=enemyLevelInt(level??baseLevel),delta=Math.max(0,lv-baseLevel);
  const hp=Math.max(1,Math.round(e.hp*(1+ENEMY_LEVEL_GROWTH.hp*delta)));
  const atk=Math.max(1,e.atk+delta,Math.round(e.atk*(1+ENEMY_LEVEL_GROWTH.atk*delta)));
  const def=Math.max(0,e.def+Math.floor((delta+1)/2),Math.round(e.def*(1+ENEMY_LEVEL_GROWTH.def*delta)));
  const agi=Math.max(1,(e.agi||8)+Math.floor(delta/2),Math.round((e.agi||8)*(1+ENEMY_LEVEL_GROWTH.agi*delta)));
  const exp=Math.max(1,Math.floor(e.exp||1));
  return{level:lv,baseLevel,hp,atk,def,agi,exp};
}
export function makeBattleEnemy(enemyId,index,level=null){const e=enemies[enemyId],st=enemyStatsAtLevel(enemyId,level);if(!e||!st)return null;return{instanceId:`enemy_${index+1}`,enemyId,level:st.level,hp:st.hp,maxHp:st.hp,atk:st.atk,def:st.def,agi:st.agi,exp:st.exp};}
export function battleExpMultiplier(characterLevel,enemyLevel){const diff=Math.max(0,enemyLevelInt(characterLevel)-enemyLevelInt(enemyLevel));return Math.max(0,1-diff*.10);}
export function battleExpForCharacter(enemyInstance,characterLevel){if(!enemyInstance)return 0;return Math.max(0,Math.floor((Number(enemyInstance.exp)||0)*battleExpMultiplier(characterLevel,enemyInstance.level||1)));}
export function battleExpRewards(state,battleEnemies=[]){const out={};for(const c of partyMembers(state)){out[c.id]=(battleEnemies||[]).reduce((sum,e)=>sum+battleExpForCharacter(e,c.level),0);}return out;}
export function syncLegacyBattle(b){const x=(b.enemies||[]).find(e=>e.hp>0)||b.enemies?.[0];if(!x)return;b.enemyId=x.enemyId;b.enemyLevel=x.level||1;b.enemyHp=x.hp;b.enemyMaxHp=x.maxHp;b.enemyAtk=x.atk;b.enemyDef=x.def;b.enemyAgi=x.agi;b.expReward=(b.enemies||[]).reduce((a,e)=>a+(e.exp||0),0);}
export function beginEncounter(state,enemyId,reason='encounter',meta={}){
  const e=enemies[enemyId];if(!e)return false;
  const count=meta.count||encounterCountFor(e,reason),pool=Array.isArray(meta.groupPool)&&meta.groupPool.length?meta.groupPool:[enemyId],group=Array.from({length:count},(_,i)=>{const id=i===0?enemyId:pick(pool),level=rollEnemyLevel(meta.levelProfile||{},meta.enemyLevel);return makeBattleEnemy(id,i,level);}).filter(Boolean);
  state.battle={enemies:group,over:false,won:false,escaped:false,turn:1,escapeAttempts:0,reason,guards:{},pending:{},...meta,log:[`${e.name}${count>1?`たち ×${count}`:` Lv.${group[0]?.level||1}`}が あらわれた！`]};
  recordBattleStart(state);for(const foe of group)seeMonster(state,foe.enemyId,'encounter');
  syncLegacyBattle(state.battle);return true;
}
const pushBattle=(b,m)=>{b.log.push(m);if(b.log.length>36)b.log.shift();};
function finishBattleTurn(state,b){const t=advanceTime(state,1);b.turn++;b.pending={};b.guards={};for(const m of timeMessages(t))pushBattle(b,m);syncLegacyBattle(b);}
export function battleItemStacks(state){return stackList(state,'bag').filter(s=>allDefs(s.id)?.consumable&&['fresh_herb','potion','honey_drop'].includes(s.id));}
export function battleSkillList(){return Object.values(battleSkills);}
export function battleSpellList(){return Object.values(battleSpells);}
export function ensureBattleShape(state){const b=state.battle;if(!b)return null;b.pending=b.pending||{};b.guards=b.guards||{};if(Array.isArray(b.enemies)&&b.enemies.length)b.enemies=b.enemies.map((x,i)=>Number.isFinite(Number(x.level))?x:{...makeBattleEnemy(x.enemyId,i,1),...x,level:1});else if(b.enemyId&&enemies[b.enemyId])b.enemies=[{...makeBattleEnemy(b.enemyId,0,b.enemyLevel||1),hp:Number.isFinite(b.enemyHp)?b.enemyHp:enemies[b.enemyId].hp,maxHp:Number.isFinite(b.enemyMaxHp)?b.enemyMaxHp:enemies[b.enemyId].hp,atk:Number.isFinite(b.enemyAtk)?b.enemyAtk:enemies[b.enemyId].atk,def:Number.isFinite(b.enemyDef)?b.enemyDef:enemies[b.enemyId].def,agi:Number.isFinite(b.enemyAgi)?b.enemyAgi:(enemies[b.enemyId].agi||8)}];else b.enemies=[];syncLegacyBattle(b);return b;}
export function livingEnemies(state){const b=ensureBattleShape(state);return(b?.enemies||[]).filter(e=>e.hp>0);}
export function battleCurrentActor(state){if(!state.battle||state.battle.over)return null;return partyMembers(state,{living:true}).find(c=>(c.tactic||'manual')==='manual'&&!state.battle.pending?.[c.id])||null;}
function enemyLabel(b,target){const same=(b.enemies||[]).filter(x=>x.enemyId===target.enemyId),name=enemies[target.enemyId]?.name||'魔物',suffix=same.length<=1?'':` ${String.fromCharCode(65+same.indexOf(target))}`;return`${name}${suffix} Lv.${target.level||1}`;}
function chooseEnemyTarget(state,payload={}){const alive=livingEnemies(state);return alive.find(x=>x.instanceId===payload.targetId)||alive[0]||null;}
function choosePartyTarget(state,payload={},fallback=null){const alive=partyMembers(state,{living:true});return alive.find(c=>c.id===payload.targetId)||fallback||alive[0]||null;}
function markEnemyDefeated(state,target){if(!target||target.hp>0||target.defeatRecorded)return false;const e=enemies[target.enemyId];if(!e)return false;target.defeatRecorded=true;state.encyclopedia=state.encyclopedia||{kills:{}};state.encyclopedia.kills=state.encyclopedia.kills||{};state.encyclopedia.kills[e.id]=(state.encyclopedia.kills[e.id]||0)+1;recordEnemyDefeat(state,e.id,1);return true;}
function useHealingStack(state,b,stackId,target){const s=state.itemStacks.find(x=>x.stackId===stackId&&x.container==='bag');if(!s||!allDefs(s.id)?.consumable||!target)return{valid:false};const def=allDefs(s.id),removed=removeFromStack(state,stackId,1);if(!removed)return{valid:false};const amount=Math.max(1,Math.round((def.heal||0)*QUALITY_MULT[removed.quality])),d=derivedCharacter(state,target),before=target.hp;target.hp=Math.min(d.maxHp,target.hp+amount);const heal=target.hp-before;pushBattle(b,`${target.name}に${def.name}${qualityLabel(removed.quality)}を使った。HPが ${heal} 回復した。`);return{valid:true,heal,targetId:target.id};}
function playerAction(state,b,actor,cmd){
  const st=derivedCharacter(state,actor),type=cmd.type,payload=cmd.payload||{};let target=chooseEnemyTarget(state,payload),ally=choosePartyTarget(state,payload,actor),valid=true,enemyDamage=0,heal=0,action=type;
  if(type==='attack'){if(!target)return{valid:false};enemyDamage=Math.max(1,st.atk+rand(-2,3)-Math.floor(target.def*.55));target.hp=Math.max(0,target.hp-enemyDamage);markEnemyDefeated(state,target);pushBattle(b,`${actor.name}の攻撃！ ${enemyLabel(b,target)}に ${enemyDamage} ダメージ！`);}
  else if(type==='skill'){const sk=battleSkills[payload.id||'flame_slash'];if(!sk)valid=false;else if(actor.mp<sk.mp){pushBattle(b,`${actor.name}はMPが たりない！`);valid=false;}else if(!target)valid=false;else{actor.mp-=sk.mp;const rate=sk.id==='heavy_slash'?1.45:1.7;enemyDamage=Math.max(2,Math.floor(st.atk*rate)+rand(-2,4)-Math.floor(target.def*.35));target.hp=Math.max(0,target.hp-enemyDamage);markEnemyDefeated(state,target);pushBattle(b,`${actor.name}の${sk.name}！ ${enemyLabel(b,target)}に ${enemyDamage} ダメージ！`);action='skill';}}
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
  const drops=[],lost=[];
  for(const be of b.enemies||[]){const e=enemies[be.enemyId];if(!e)continue;markEnemyDefeated(state,be);for(let i=0;i<rollSlots(e);i++){const d=rollLoot(e);if(!d)continue;const q=dropQuality(e,d.id),a=addStack(state,d.id,d.count,{quality:q,container:'bag'});if(a)drops.push(`${allDefs(d.id).name}${qualityLabel(q)}×${a}`);if(a<d.count)lost.push(`${allDefs(d.id).name}×${d.count-a}`);}}
  if(b.symbolKey){if(b.bossSymbol){state.worldState=state.worldState||{bossDefeatedAt:{}};state.worldState.bossDefeatedAt=state.worldState.bossDefeatedAt||{};state.worldState.bossDefeatedAt[b.symbolKey]=state.calendar.totalSteps;}else if(state.run&&!state.run.defeatedSymbols.includes(b.symbolKey))state.run.defeatedSymbols.push(b.symbolKey);}
  const rewards=battleExpRewards(state,b.enemies||[]),xp=addExpByCharacter(state,rewards,'戦闘');pushBattle(b,`魔物の群れを たおした！ ${xp.msg}`);if(drops.length)pushBattle(b,`戦利品: ${drops.join(' / ')}`);if(lost.length)pushBattle(b,`バッグに入らず置いてきた: ${lost.join(' / ')}`);return{xp,drops,lost};
}
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
  const probe={type,payload};
  if(type==='skill'){const sk=battleSkills[payload.id||'flame_slash'];if(!sk||actor.mp<sk.mp)return{ok:false};}
  if(type==='spell'){const sp=battleSpells[payload.id||'heal'];if(!sp||actor.mp<sp.mp)return{ok:false};}
  if(type==='item'&&!state.itemStacks.find(x=>x.stackId===payload.stackId&&x.container==='bag'))return{ok:false};
  b.pending[actor.id]=probe;fillAutoCommands(state,b);
  const next=battleCurrentActor(state);if(next)return{ok:true,awaiting:true,nextActorId:next.id};
  return resolveRound(state,b);
}

export function setBattleTactic(state,charId,tactic){
  const b=ensureBattleShape(state);if(!b||b.over)return{ok:false,msg:'戦闘中ではない。'};
  if(!TACTICS[tactic])return{ok:false,msg:'その作戦は選べない。'};
  const r=setTactic(state,charId,tactic);if(!r.ok)return r;
  delete b.pending?.[charId];
  pushBattle(b,`${characterById(state,charId)?.name||'仲間'}の作戦を「${TACTICS[tactic].name}」に変更した。`);
  return r;
}
export function finishBattle(state){if(!state.battle?.over||(!state.battle.won&&!state.battle.escaped))return{ok:false};const msg=state.battle.escaped?'逃走して周囲へ戻った。':'周囲へ戻った。';state.battle=null;return{ok:true,msg};}
function loseExplorationBag(state){const keep=[],lost=[];for(const s of state.itemStacks){if(s.container==='bag'&&tagOf(s.id)!=='adventure')lost.push(s);else keep.push(s);}state.itemStacks=keep;return lost;}
export function defeatReturn(state){if(!state.run)return{ok:false};const lost=loseExplorationBag(state),report=finalizeExpedition(state,{method:'defeat',outcome:'defeated'});report.lost=Array.isArray(lost)?lost:[];state.run=null;state.battle=null;for(const c of partyMembers(state)){c.hp=Math.max(1,c.hp);}state.log.unshift('パーティは力尽き、探索品を失って村まで運ばれた。');return{ok:true,lost,report};}
