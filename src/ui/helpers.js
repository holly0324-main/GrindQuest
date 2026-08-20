import { materials } from '../data/index.js';
import { ITEM_TAGS } from '../game/shared/constants.js';
import { rarityOf } from '../game/items/catalog.js';
import { stackDefinition, stackQualityLabel, stackRemaining } from '../game/inventory/inventory.js';

export const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const pct=(a,b)=>Math.max(0,Math.min(100,b?100*a/b:0));
export const fmtCost=cost=>Object.entries(cost).map(([id,n])=>`${materials[id].icon}${materials[id].name} ${n}`).join(' / ');
export const lifeText=s=>s.remainingLife==null?'保存期限なし':`寿命 ${stackRemaining(s)}step`;
export const qText=s=>stackQualityLabel(s)||'品質0';
export const tagText=id=>ITEM_TAGS[stackDefinition(id)?.tag]||'その他';
export const rarityBadge=def=>`<span class="rank-badge rarity-rank">R${rarityOf(def)}</span>`;
export const productDef=p=>p?.def||null;
