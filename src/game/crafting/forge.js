import { items, materials, recipes } from '../../data/index.js';
import { obtainItem, isItemDiscovered } from '../discovery/discovery.js';
import { gearDisplayName, newGearId } from '../equipment/model.js';
import { addStack, containerFree, materialCount, storageContainerFor, takeItems } from '../inventory/inventory.js';
import { qualityLabel, rarityOf } from '../items/catalog.js';
import { EQUIPMENT_AFFIXES, WORKMANSHIP_NAMES } from '../shared/constants.js';
import { clamp, rand } from '../shared/utils.js';
import { advanceTime, startTimedProcess, timeMessages } from '../time/clock.js';

function consumeMaterial(state,id,count){return takeItems(state,id,count,{containers:['storage','fresh_storage','bag'],preferLowQuality:true}).count;}
export function recipeRequirements(state,r){return Object.entries(r?.cost||{}).map(([id,need])=>({id,need,have:materialCount(state,id),enough:materialCount(state,id)>=need,def:materials[id],discovered:isItemDiscovered(state,id)}));}
export function canCraft(state,r){return recipeRequirements(state,r).every(x=>x.enough);}
function consumeRecipe(state,r){if(!r||!canCraft(state,r))return false;for(const[id,n]of Object.entries(r.cost))consumeMaterial(state,id,n);return true;}
function rollAffixes(workmanship){const eligible=Object.values(EQUIPMENT_AFFIXES).filter(a=>workmanship>=a.minWorkmanship),count=workmanship>=3?(Math.random()<.55?2:1):workmanship>=2?(Math.random()<.45?1:0):workmanship>=1?(Math.random()<.15?1:0):0,out=[];for(let i=0;i<count&&eligible.length;i++){const idx=rand(0,eligible.length-1),a=eligible.splice(idx,1)[0];out.push({id:a.id,stat:a.stat,value:rand(a.min,a.max)});}return out;}
function createGear(state,baseId,workmanship=0){const g={gearId:newGearId(state),baseId,workmanship:clamp(Math.floor(workmanship),0,3),affixes:[]};g.affixes=rollAffixes(g.workmanship);state.gear.push(g);obtainItem(state,baseId,{source:'forge',announce:true});return g;}
export function forgeRecipeProduct(r){if(r?.item){const def=items[r.item];return{kind:'gear',id:r.item,count:1,def,name:def?.name||r.item,icon:def?.icon||'⚒️',slot:def?.slot||'other',rank:rarityOf(def)};}if(r?.material){const def=materials[r.material];return{kind:'material',id:r.material,count:r.count||1,def,name:def?.name||r.material,icon:def?.icon||'📦',slot:'material',rank:rarityOf(def)};}return null;}
export function forgeRecipeVisible(state,r){const p=forgeRecipeProduct(r);if(!p||p.rank<1)return false;return Object.keys(r?.cost||{}).every(id=>isItemDiscovered(state,id));}
export function visibleForgeRecipes(state,slot=null){return recipes.filter(r=>forgeRecipeVisible(state,r)&&(!slot||forgeRecipeProduct(r)?.slot===slot));}
export function forgeOrderFee(r){const p=forgeRecipeProduct(r);if(!p)return 0;if(p.kind==='gear')return Math.max(12,Math.round((p.def?.price||50)*.18));return Math.max(8,Math.round((p.def?.value||20)*(p.count||1)*.25));}
export function canOrderCraft(state,r){return forgeRecipeVisible(state,r)&&canCraft(state,r)&&state.gold>=forgeOrderFee(r);}
export function hasForgeSkill(state){return !!state.skills?.manualForge;}
function makeForgeProduct(state,p,workmanship){if(!p)return null;if(p.kind==='gear')return{gear:createGear(state,p.id,workmanship),count:1};const container=storageContainerFor(p.id),added=addStack(state,p.id,p.count||1,{quality:workmanship,container});return{material:p.id,count:added,quality:workmanship};}
export function orderCraft(state,recipeId){
  if(state.run)return{ok:false,msg:'鍛冶は村で。'};
  const r=recipes.find(x=>x.id===recipeId),p=forgeRecipeProduct(r);if(!r||!p)return{ok:false,msg:'その品は依頼できない。'};
  if(!forgeRecipeVisible(state,r))return{ok:false,msg:'まだそのレシピの材料知識が足りない。'};
  const fee=forgeOrderFee(r);if(state.gold<fee)return{ok:false,msg:`鍛冶代 ${fee}G が足りない。`};
  if(!consumeRecipe(state,r))return{ok:false,msg:'素材が足りない。'};
  state.gold-=fee;
  const id=`forge_${state.calendar.totalSteps}_${Math.random().toString(36).slice(2,8)}`,job=startTimedProcess(state,id,60,{type:'forge',product:p,recipeId:r.id,workmanship:1,fee});
  return{ok:true,job,fee,msg:`${p.name}を鍛冶屋に依頼した。${fee}G。60step後に完成。`};
}
export function selfCraft(state,recipeId,performance=.5){
  if(state.run)return{ok:false,msg:'鍛冶は村で。'};if(!hasForgeSkill(state))return{ok:false,msg:'自分で鍛える技能をまだ習得していない。'};
  const r=recipes.find(x=>x.id===recipeId),p=forgeRecipeProduct(r);if(!r||!p||!forgeRecipeVisible(state,r)||!canCraft(state,r))return{ok:false,msg:'素材が足りない。'};
  if(p.kind==='material'){const c=storageContainerFor(p.id),need=(p.def?.bulk||1)*(p.count||1);if(containerFree(state,c)<need)return{ok:false,msg:'完成品を置く倉庫に空きがない。'};}
  if(!consumeRecipe(state,r))return{ok:false,msg:'素材が足りない。'};
  const steps=12,t=advanceTime(state,steps),q=performance>.9?3:performance>.7?2:performance>.42?1:0,result=makeForgeProduct(state,p,q);if(p.kind==='material'&&!result?.count)return{ok:false,msg:'完成したが保管場所に空きがない。'};const display=p.kind==='gear'?gearDisplayName(state,result.gear):`${p.name}${qualityLabel(q)}×${result.count}`;return{ok:true,steps,quality:q,...result,msg:`${display}が完成！ 出来栄え${WORKMANSHIP_NAMES[q]}。${steps}step経過。 ${timeMessages(t).join(' ')}`};
}
export function forgeOrders(state){return(state.timedProcesses||[]).filter(x=>x.payload?.type==='forge');}
export function collectForgeOrder(state,id){const i=(state.timedProcesses||[]).findIndex(x=>x.id===id&&x.ready&&x.payload?.type==='forge');if(i<0)return{ok:false,msg:'まだ受け取れない。'};const job=state.timedProcesses[i],p=job.payload.product||{kind:'gear',id:job.payload.item,name:items[job.payload.item]?.name};if(p.kind==='material'){const result=makeForgeProduct(state,p,job.payload.workmanship||1);if(!result?.count)return{ok:false,msg:'倉庫に空きがないため受け取れない。'};state.timedProcesses.splice(i,1);return{ok:true,...result,msg:`${p.name}${qualityLabel(result.quality)}×${result.count}を受け取った。`};}state.timedProcesses.splice(i,1);const result=makeForgeProduct(state,p,job.payload.workmanship||1);return{ok:true,...result,msg:`${gearDisplayName(state,result.gear)}を受け取った。`};}
