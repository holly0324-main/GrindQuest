import { consumables, items, materials } from '../../data/index.js';
import { itemBookEntries, monsterBookEntries } from '../encyclopedia/encyclopedia.js';
import { knownRecords } from '../discovery/discovery.js';

const isEquipment=x=>!!x.slot;
const isMaterial=x=>!x.slot&&!!materials[x.id]&&x.tag!=='adventure';
const isItem=x=>!x.slot&&!isMaterial(x);

export const HANDBOOK_SECTIONS=[
  {id:'monsters',name:'モンスター',icon:'👾'},
  {id:'items',name:'アイテム',icon:'🎒'},
  {id:'equipment',name:'装備',icon:'🛡️'},
  {id:'materials',name:'素材',icon:'🧱'},
];

export function handbookEntries(state,section='monsters'){
  if(section==='monsters')return monsterBookEntries(state).filter(x=>x.discovered).map(x=>({...x,entryType:'monster'}));
  const rows=itemBookEntries(state).filter(x=>x.discovered);
  if(section==='equipment')return rows.filter(isEquipment).map(x=>({...x,entryType:'item'}));
  if(section==='materials')return rows.filter(isMaterial).map(x=>({...x,entryType:'item'}));
  return rows.filter(isItem).map(x=>({...x,entryType:'item'}));
}
export function handbookCounts(state){return Object.fromEntries(HANDBOOK_SECTIONS.map(s=>[s.id,handbookEntries(state,s.id).length]));}
export function futureHandbookRecords(state){return{
  recipes:knownRecords(state,'recipes'),people:knownRecords(state,'people'),places:knownRecords(state,'places'),rumors:knownRecords(state,'rumors'),events:knownRecords(state,'events')
};}
