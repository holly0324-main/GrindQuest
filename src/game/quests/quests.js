import { enemies, quests, recipes } from '../../data/index.js';
import { isItemDiscovered, isMonsterDiscovered, learnRecord, recordKnowledge } from '../discovery/discovery.js';
import { addStack, materialCount, storageContainerFor, takeItems } from '../inventory/inventory.js';
import { allDefs } from '../items/catalog.js';

const stepOf=state=>Math.max(0,Number(state?.calendar?.totalSteps)||0);
export function ensureQuestState(state){
  state.quests=state.quests||{};state.quests.accepted=state.quests.accepted||{};state.quests.claimed=state.quests.claimed||{};return state.quests;
}
export const questById=id=>quests.find(q=>q.id===id)||null;
function prerequisiteMet(state,p){
  if(p.type==='quest_claimed')return !!state?.quests?.claimed?.[p.questId];
  if(p.type==='discover_item')return isItemDiscovered(state,p.id);
  if(p.type==='discover_monster')return isMonsterDiscovered(state,p.id);
  if(p.type==='record')return !!recordKnowledge(state,p.category,p.id)?.known;
  if(p.type==='story')return !!state?.story?.flags?.[p.id];
  return true;
}
export function questAvailable(state,q){return !!q&&!(state?.quests?.claimed?.[q.id])&&(!q.prerequisites||q.prerequisites.every(p=>prerequisiteMet(state,p)));}
function objectiveProgress(state,q,o){
  const accepted=state?.quests?.accepted?.[q.id];
  if(o.type==='kill'){const now=Number(state?.encyclopedia?.kills?.[o.enemyId])||0,base=Number(accepted?.baseline?.kills?.[o.enemyId])||0;return{current:Math.max(0,now-base),target:o.count,done:now-base>=o.count};}
  if(o.type==='deliver'){const n=materialCount(state,o.itemId);return{current:n,target:o.count,done:n>=o.count};}
  if(o.type==='discover'){const done=o.target==='monster'?isMonsterDiscovered(state,o.id):o.target==='record'?!!recordKnowledge(state,o.category,o.id)?.known:isItemDiscovered(state,o.id);return{current:done?1:0,target:1,done};}
  if(o.type==='dungeon'){const at=Number(state?.worldState?.bossDefeatedAt?.[o.bossKey]);const done=Number.isFinite(at)&&at>=(accepted?.acceptedAtStep??0);return{current:done?1:0,target:1,done};}
  if(o.type==='story'){const done=!!state?.story?.flags?.[o.id];return{current:done?1:0,target:1,done};}
  return{current:0,target:1,done:false};
}
export function questProgress(state,qOrId){const q=typeof qOrId==='string'?questById(qOrId):qOrId;if(!q)return null;const rows=(q.objectives||[]).map(o=>({...o,...objectiveProgress(state,q,o)}));return{rows,done:rows.length>0&&rows.every(x=>x.done)};}
export function questStatus(state,qOrId){const q=typeof qOrId==='string'?questById(qOrId):qOrId;if(!q)return null;ensureQuestState(state);const claimed=!!state.quests.claimed[q.id],accepted=!!state.quests.accepted[q.id],progress=accepted?questProgress(state,q):null;return{q,claimed,accepted,available:questAvailable(state,q),complete:!!progress?.done,progress};}
export function questEntries(state){ensureQuestState(state);return quests.filter(q=>questAvailable(state,q)||state.quests.accepted[q.id]||state.quests.claimed[q.id]).map(q=>questStatus(state,q));}
export function acceptQuest(state,id){
  const q=questById(id);ensureQuestState(state);if(!q||!questAvailable(state,q))return{ok:false,msg:'今はその依頼を受けられない。'};if(state.quests.accepted[id])return{ok:false,msg:'すでに受注している。'};
  const kills={};for(const o of q.objectives||[])if(o.type==='kill')kills[o.enemyId]=Number(state?.encyclopedia?.kills?.[o.enemyId])||0;
  state.quests.accepted[id]={acceptedAtStep:stepOf(state),baseline:{kills}};return{ok:true,msg:`依頼「${q.title}」を受けた。`};
}
function consumeObjective(state,o){if(o.type==='deliver'&&o.consume!==false){const r=takeItems(state,o.itemId,o.count,{containers:['storage','fresh_storage','bag'],preferLowQuality:true});return r.count>=o.count;}return true;}
function recipeName(id){const r=recipes.find(x=>x.id===id);if(!r)return id;const pid=r.item||r.material;return allDefs(pid)?.name||pid||id;}
function applyReward(state,r){
  if(r.type==='gold'){state.gold+=(r.amount||0);return `${r.amount||0}G`;}
  if(r.type==='item'){const container=storageContainerFor(r.itemId),n=addStack(state,r.itemId,r.count||1,{quality:r.quality||0,container});return `${allDefs(r.itemId)?.name||r.itemId}×${n}`;}
  if(r.type==='recipe'){state.unlocks=state.unlocks||{};state.unlocks.recipes=state.unlocks.recipes||{};state.unlocks.recipes[r.recipeId]=true;const name=r.name||recipeName(r.recipeId);learnRecord(state,'recipes',r.recipeId,{source:'quest',name});return `レシピ「${name}」`;}
  if(r.type==='knowledge'){if(r.target==='record')learnRecord(state,r.category,r.id,{source:'quest',name:r.name});return r.name||'新しい知識';}
  if(r.type==='story'){state.story=state.story||{flags:{}};state.story.flags=state.story.flags||{};state.story.flags[r.id]=true;return r.label||'イベント解禁';}
  return null;
}
export function claimQuest(state,id){
  const st=questStatus(state,id);if(!st?.accepted)return{ok:false,msg:'その依頼は受けていない。'};if(st.claimed)return{ok:false,msg:'すでに報告済み。'};if(!st.complete)return{ok:false,msg:'依頼条件をまだ満たしていない。'};
  for(const o of st.q.objectives||[])if(!consumeObjective(state,o))return{ok:false,msg:'納品物が足りなくなった。'};
  const rewards=(st.q.rewards||[]).map(r=>applyReward(state,r)).filter(Boolean);ensureQuestState(state);state.quests.claimed[id]={claimedAtStep:stepOf(state)};delete state.quests.accepted[id];
  state.log?.unshift?.(`依頼「${st.q.title}」を達成した。${rewards.join(' / ')}`);return{ok:true,rewards,msg:`依頼達成！ ${rewards.join(' / ')}`};
}
export function objectiveLabel(o){
  if(o.type==='kill')return `${enemies[o.enemyId]?.name||o.enemyId}を${o.count}体倒す`;
  if(o.type==='deliver')return `${allDefs(o.itemId)?.name||o.itemId}を${o.count}個納品`;
  if(o.type==='discover')return `${o.target==='monster'?enemies[o.id]?.name:allDefs(o.id)?.name||o.id}を発見`;
  if(o.type==='dungeon')return `${o.label||o.bossKey}を攻略`;
  if(o.type==='story')return o.label||'イベントを進める';return'条件を達成する';
}
export function rewardLabel(r){if(r.type==='gold')return `${r.amount}G`;if(r.type==='item')return `${allDefs(r.itemId)?.name||r.itemId}×${r.count||1}`;if(r.type==='recipe')return `レシピ：${r.name||recipeName(r.recipeId)}`;return r.label||r.name||r.type;}
