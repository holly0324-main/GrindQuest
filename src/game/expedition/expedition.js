// One expedition = one result session. This module only mutates the ephemeral
// state.run.summary and the small persistent expedition archive.
const stepOf=state=>Math.max(0,Number(state?.calendar?.totalSteps)||0);
const uniquePush=(list,row,key=`${row.type||''}:${row.id||row.key||row.label||''}`)=>{if(!list.some(x=>(x._key||`${x.type||''}:${x.id||x.key||x.label||''}`)===key))list.push({...row,_key:key});};

export function blankExpeditionSummary(state){return{
  startedAtStep:stepOf(state),startedGold:Math.max(0,Number(state?.gold)||0),
  battles:0,defeated:0,exp:0,items:{},firstGets:[],firstMonsters:[],discoveries:[],
  reached:{label:'ミナト村',depth:0,score:0},areaDepths:{},
};}
export function ensureExpeditionArchive(state){
  state.expeditions=state.expeditions||{};
  state.expeditions.history=Array.isArray(state.expeditions.history)?state.expeditions.history:[];
  state.expeditions.lastResult=state.expeditions.lastResult||null;
  return state.expeditions;
}
export function ensureExpeditionSummary(state){if(!state?.run)return null;state.run.summary=state.run.summary||blankExpeditionSummary(state);return state.run.summary;}
export function startExpeditionSummary(state){if(!state?.run)return null;state.run.summary=blankExpeditionSummary(state);return state.run.summary;}
export function recordBattleStart(state){const s=ensureExpeditionSummary(state);if(s)s.battles++;}
export function recordEnemyDefeat(state,enemyId,count=1){const s=ensureExpeditionSummary(state);if(!s)return;s.defeated+=Math.max(0,Number(count)||0);}
export function recordExpGain(state,amount){const s=ensureExpeditionSummary(state);if(s)s.exp+=Math.max(0,Math.floor(Number(amount)||0));}
export function recordItemGain(state,id,count=1,quality=0){
  const s=ensureExpeditionSummary(state);count=Math.max(0,Math.floor(Number(count)||0));if(!s||!id||!count)return;
  const key=`${id}:q${Math.max(0,Math.floor(Number(quality)||0))}`;
  const row=s.items[key]||(s.items[key]={id,quality:Math.max(0,Math.floor(Number(quality)||0)),count:0});row.count+=count;
}
export function recordFirstGet(state,id){const s=ensureExpeditionSummary(state);if(s&&id)uniquePush(s.firstGets,{type:'item',id},`item:${id}`);}
export function recordFirstMonster(state,id){const s=ensureExpeditionSummary(state);if(s&&id)uniquePush(s.firstMonsters,{type:'monster',id},`monster:${id}`);}
export function recordDiscovery(state,type,id,extra={}){const s=ensureExpeditionSummary(state);if(s&&type&&id)uniquePush(s.discoveries,{type,id,...extra},`${type}:${id}`);}
export function expeditionAreaDepth(state,areaId,fallback=1){const s=ensureExpeditionSummary(state);if(!s)return fallback;return Number(s.areaDepths?.[areaId])||fallback;}
export function rememberAreaDepth(state,areaId,depth=1){const s=ensureExpeditionSummary(state);if(!s||!areaId)return depth;s.areaDepths=s.areaDepths||{};s.areaDepths[areaId]=Number(s.areaDepths[areaId])||Math.max(1,Math.floor(depth||1));return s.areaDepths[areaId];}
export function recordReach(state,{label,areaId=null,nodeId=null,depth=0,score=null,type='world'}={}){
  const s=ensureExpeditionSummary(state);if(!s||!label)return;
  depth=Math.max(0,Math.floor(Number(depth)||0));const computed=score==null?depth*100+(state.run?.moves||0):Number(score)||0;
  const row={label,areaId,nodeId,depth,score:computed,type};
  if(!s.reached||computed>=Number(s.reached.score||0))s.reached=row;
}
export function finalizeExpedition(state,{method='walk',auto=null,outcome='returned'}={}){
  const s=ensureExpeditionSummary(state)||blankExpeditionSummary(state),archive=ensureExpeditionArchive(state),ended=stepOf(state);
  const result={
    id:`exp_${ended}_${Math.random().toString(36).slice(2,7)}`,method,outcome,
    startedAtStep:s.startedAtStep,endedAtStep:ended,steps:Math.max(0,ended-s.startedAtStep),
    reached:{...(s.reached||{})},battles:s.battles||0,defeated:s.defeated||0,
    gold:Math.max(0,(Number(state.gold)||0)-(Number(s.startedGold)||0)),exp:s.exp||0,
    items:Object.values(s.items||{}).map(x=>({...x})),
    firstGets:(s.firstGets||[]).map(({_key,...x})=>x),firstMonsters:(s.firstMonsters||[]).map(({_key,...x})=>x),
    discoveries:(s.discoveries||[]).map(({_key,...x})=>x),auto:auto?{...auto}:null,
  };
  archive.lastResult=result;archive.history.unshift(result);archive.history=archive.history.slice(0,20);return result;
}
