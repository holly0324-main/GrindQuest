import { items } from '../../data/index.js';
import { EQUIPMENT_AFFIXES } from '../shared/constants.js';
import { clamp } from '../shared/utils.js';

export function starterGear(){return[
  {gearId:'gear_1',baseId:'novice_sword',workmanship:0,affixes:[]},
  {gearId:'gear_2',baseId:'travel_clothes',workmanship:0,affixes:[]},
  {gearId:'gear_3',baseId:'travel_pants',workmanship:0,affixes:[]},
  {gearId:'gear_4',baseId:'travel_boots',workmanship:0,affixes:[]}
];}
export function newGearId(state){return`gear_${state.nextGearId++}`;}
export function gearById(state,gearId){return (state.gear||[]).find(g=>g.gearId===gearId)||null;}
export function gearBase(state,gearId){const g=gearById(state,gearId);return g?items[g.baseId]:null;}
export function gearDisplayName(state,gearOrId){const g=typeof gearOrId==='string'?gearById(state,gearOrId):gearOrId;if(!g)return'なし';const base=items[g.baseId];const aff=(g.affixes||[]).map(a=>EQUIPMENT_AFFIXES[a.id]?.name).filter(Boolean);return `${base?.name||g.baseId}${g.workmanship?` ☆${g.workmanship}`:''}${aff.length?` [${aff.join('・')}]`:''}`;}
function workmanshipMul(q){return [1,1.03,1.07,1.12][clamp(q||0,0,3)];}
export function gearStats(state,g){if(!g)return{};const b=items[g.baseId]||{},m=workmanshipMul(g.workmanship);const out={atk:Math.round((b.atk||0)*m),def:Math.round((b.def||0)*m),hp:Math.round((b.hp||0)*m),mp:Math.round((b.mp||0)*m),agility:0,wisdom:0,dexterity:0};for(const a of g.affixes||[])out[a.stat]=(out[a.stat]||0)+(a.value||0);return out;}
export function equipmentList(state,slot=null){return(state.gear||[]).filter(g=>!slot||items[g.baseId]?.slot===slot).sort((a,b)=>(items[b.baseId]?.rank||0)-(items[a.baseId]?.rank||0)||b.workmanship-a.workmanship);}
