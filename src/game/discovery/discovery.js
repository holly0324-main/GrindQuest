import { consumables, enemies, items, materials } from '../../data/index.js';
import { rarityOf } from '../items/catalog.js';
import { recordDiscovery, recordFirstGet, recordFirstMonster } from '../expedition/expedition.js';

const itemDef=id=>items[id]||materials[id]||consumables[id]||null;
const stepOf=state=>Math.max(0,Number(state?.calendar?.totalSteps)||0);

export function ensureDiscoveryState(state){
  state.encyclopedia=state.encyclopedia||{};
  state.encyclopedia.kills=state.encyclopedia.kills||{};
  state.encyclopedia.knowledge=state.encyclopedia.knowledge||{};
  state.encyclopedia.knowledge.items=state.encyclopedia.knowledge.items||{};
  state.encyclopedia.knowledge.monsters=state.encyclopedia.knowledge.monsters||{};
  state.encyclopedia.knowledge.records=state.encyclopedia.knowledge.records||{};
  for(const k of ['recipes','people','places','rumors','events'])state.encyclopedia.knowledge.records[k]=state.encyclopedia.knowledge.records[k]||{};
  state.encyclopedia.firstGetQueue=Array.isArray(state.encyclopedia.firstGetQueue)?state.encyclopedia.firstGetQueue:[];
  return state.encyclopedia;
}
function itemRecord(state,id){const e=ensureDiscoveryState(state);return e.knowledge.items[id]||(e.knowledge.items[id]={known:false,obtained:false});}
function monsterRecord(state,id){const e=ensureDiscoveryState(state);return e.knowledge.monsters[id]||(e.knowledge.monsters[id]={known:false,seen:false});}

export function learnItem(state,id,source='knowledge'){
  if(!itemDef(id))return false;const r=itemRecord(state,id),fresh=!r.known;r.known=true;r.knownAt??=stepOf(state);r.knownBy??=source;if(fresh)recordDiscovery(state,'item',id,{source});return fresh;
}
export function obtainItem(state,id,{source='obtained',announce=true}={}){
  const def=itemDef(id);if(!def)return false;const r=itemRecord(state,id),first=!r.obtained;learnItem(state,id,source);r.obtained=true;r.obtainedAt??=stepOf(state);r.obtainedBy??=source;
  if(first){recordFirstGet(state,id);if(announce){const q=ensureDiscoveryState(state).firstGetQueue;if(!q.some(x=>x.id===id))q.push({id,icon:def.icon||'📦',name:def.name||id,rank:rarityOf(def),at:stepOf(state)});}}
  return first;
}
export function learnMonster(state,id,source='knowledge'){
  if(!enemies[id])return false;const r=monsterRecord(state,id),fresh=!r.known;r.known=true;r.knownAt??=stepOf(state);r.knownBy??=source;if(fresh)recordDiscovery(state,'monster',id,{source});return fresh;
}
export function seeMonster(state,id,source='encounter'){
  if(!enemies[id])return false;const r=monsterRecord(state,id),first=!r.seen;learnMonster(state,id,source);r.seen=true;r.seenAt??=stepOf(state);if(first)recordFirstMonster(state,id);return first;
}
export const isItemDiscovered=(state,id)=>!!state?.encyclopedia?.knowledge?.items?.[id]?.known;
export const isItemObtained=(state,id)=>!!state?.encyclopedia?.knowledge?.items?.[id]?.obtained;
export const isMonsterDiscovered=(state,id)=>!!state?.encyclopedia?.knowledge?.monsters?.[id]?.known;
export const isMonsterSeen=(state,id)=>!!state?.encyclopedia?.knowledge?.monsters?.[id]?.seen;
export const itemKnowledge=(state,id)=>state?.encyclopedia?.knowledge?.items?.[id]||null;
export const monsterKnowledge=(state,id)=>state?.encyclopedia?.knowledge?.monsters?.[id]||null;

export function learnRecord(state,category,id,{source='knowledge',name=null,meta={}}={}){
  const e=ensureDiscoveryState(state),bucket=e.knowledge.records[category]||(e.knowledge.records[category]={}),r=bucket[id]||(bucket[id]={known:false}),fresh=!r.known;
  r.known=true;r.knownAt??=stepOf(state);r.knownBy??=source;if(name&&!r.name)r.name=name;r.meta={...(r.meta||{}),...(meta||{})};
  if(fresh)recordDiscovery(state,category,id,{source,name:name||r.name||id});return fresh;
}
export const recordKnowledge=(state,category,id)=>state?.encyclopedia?.knowledge?.records?.[category]?.[id]||null;
export const knownRecords=(state,category)=>Object.entries(state?.encyclopedia?.knowledge?.records?.[category]||{}).filter(([,x])=>x?.known).map(([id,x])=>({id,...x}));

export const nextFirstGet=(state)=>ensureDiscoveryState(state).firstGetQueue[0]||null;
export function dismissFirstGet(state){return ensureDiscoveryState(state).firstGetQueue.shift()||null;}

export function backfillDiscoveryFromPossessions(state){
  ensureDiscoveryState(state);
  for(const s of state.itemStacks||[])obtainItem(state,s.id,{source:'migration',announce:false});
  if((state.consumables?.camp_set||0)>0)obtainItem(state,'camp_set',{source:'migration',announce:false});
  for(const g of state.gear||[])obtainItem(state,g.baseId,{source:'migration',announce:false});
  for(const [id,n] of Object.entries(state.encyclopedia.kills||{}))if(n>0)seeMonster(state,id,'migration');
  state.encyclopedia.discoveryInitialized=true;
}
export function initializeDiscoveryState(state){ensureDiscoveryState(state);if(!state.encyclopedia.discoveryInitialized)backfillDiscoveryFromPossessions(state);for(const foe of state.battle?.enemies||[])seeMonster(state,foe.enemyId,'save');return state;}

// イベント/物語側はこの2つを呼べば、所持や遭遇なしでも図鑑知識を解禁できる。
export const grantItemKnowledge=(state,id,source='story')=>learnItem(state,id,source);
export const grantMonsterKnowledge=(state,id,source='story')=>learnMonster(state,id,source);
