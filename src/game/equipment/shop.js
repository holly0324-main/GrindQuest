import { equipmentShops, items } from '../../data/index.js';
import { obtainItem, learnItem } from '../discovery/discovery.js';
import { newGearId } from './model.js';

export function equipmentShop(shopId='minato'){return equipmentShops[shopId]||null;}
export function equipmentShopStock(state,shopId='minato'){
  const shop=equipmentShop(shopId);if(!shop)return[];
  return shop.stock.map(id=>items[id]).filter(Boolean);
}
export function revealEquipmentShop(state,shopId='minato'){
  const stock=equipmentShopStock(state,shopId);for(const def of stock)learnItem(state,def.id,`shop:${shopId}`);return stock;
}
export function buyEquipment(state,itemId,shopId='minato'){
  if(state.run||state.battle)return{ok:false,msg:'武具の購入は村にいる時だけ。'};
  const shop=equipmentShop(shopId),def=items[itemId];if(!shop||!def||!shop.stock.includes(itemId))return{ok:false,msg:'その装備はこの店では扱っていない。'};
  if(state.gold<(def.price||0))return{ok:false,msg:'お金が足りない。'};
  state.gold-=def.price||0;
  const gear={gearId:newGearId(state),baseId:itemId,workmanship:0,affixes:[]};
  state.gear.push(gear);obtainItem(state,itemId,{source:`shop:${shopId}`,announce:true});
  return{ok:true,gear,msg:`${def.name}を ${def.price}G で買った。`};
}
