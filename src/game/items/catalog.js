import { consumables, items, materials } from '../../data/index.js';
import { QUALITY_NAMES } from '../shared/constants.js';
import { clamp } from '../shared/utils.js';

export const allDefs=id=>materials[id]||consumables[id];
export const isStackItem=id=>!!allDefs(id)&&id!=='camp_set';
export const qualityLabel=q=>QUALITY_NAMES[clamp(Number(q)||0,0,3)]||'';
export const tagOf=id=>allDefs(id)?.tag||'material';
export function rarityOf(idOrDef){const d=typeof idOrDef==='string'?(items[idOrDef]||allDefs(idOrDef)):idOrDef;return Math.max(0,Number(d?.rank)||0);}
