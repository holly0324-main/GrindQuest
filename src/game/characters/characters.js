import { fatiguePenalty } from '../condition/condition.js';
import { gearById, gearStats } from '../equipment/model.js';
import { sum } from '../shared/utils.js';

export const TACTICS={
  manual:{id:'manual',name:'めいれいさせろ',desc:'毎ターン自分でコマンドを選ぶ。'},
  gungun:{id:'gungun',name:'ガンガンいこうぜ',desc:'攻撃と特技を優先して戦う。'},
  daiji:{id:'daiji',name:'いのちだいじに',desc:'HPが減った仲間の回復を優先する。'}
};
export const PARAMETER_LABELS={vitality:'たいりょく',strength:'ちから',agility:'すばやさ',magic:'まりょく',wisdom:'かしこさ',knowledge:'ちしき',dexterity:'きようさ'};
export const emptyEquipment=()=>({weapon:null,shield:null,head:null,body:null,arms:null,legs:null,feet:null,accessory:null});
export function makeCharacter(id,name,job,stats,equipment={},extra={}){return{
  id,name,job,growthTreeId:extra.growthTreeId||`${job}_base`,level:1,exp:0,appPoints:0,tactic:id==='hero'?'manual':'gungun',
  stats:{vitality:46,strength:8,agility:8,magic:8,wisdom:8,knowledge:6,dexterity:7,...stats},
  hp:stats?.vitality||46,mp:(stats?.magic||8)+(stats?.wisdom||8),
  equipment:{...emptyEquipment(),...equipment},recruited:id==='hero',available:true,...extra
};}
export function expToNext(level){return 28+level*level*14;}
export function characterById(state,id='hero'){return state.characters?.[id]||null;}
export function partyMembers(state,{living=false}={}){const ids=Array.isArray(state.party)&&state.party.length?state.party:['hero'];return ids.map(id=>characterById(state,id)).filter(c=>c&&(!living||c.hp>0));}
export function derivedCharacter(state,charOrId='hero'){
  const p=typeof charOrId==='string'?characterById(state,charOrId):charOrId;if(!p)return derived(state);
  const mul=1-fatiguePenalty(state),base=p.stats||{},primary={};
  for(const k of ['vitality','strength','agility','magic','wisdom','knowledge','dexterity'])primary[k]=Math.max(1,Math.floor((base[k]||1)*mul));
  const eq=Object.values(p.equipment||{}).map(id=>gearById(state,id)).filter(Boolean),bonus=k=>sum(eq,g=>gearStats(state,g)[k]||0);
  primary.agility+=bonus('agility');primary.wisdom+=bonus('wisdom');primary.dexterity+=bonus('dexterity');
  const maxHp=Math.max(1,primary.vitality+bonus('hp'));
  const maxMp=Math.max(0,primary.magic+primary.wisdom+bonus('mp'));
  const atk=Math.max(1,primary.strength+bonus('atk'));
  const def=Math.max(0,Math.floor(primary.vitality/11)+bonus('def'));
  return{...primary,maxHp,maxMp,atk,def,fatiguePenalty:1-mul};
}
export function derived(state){return derivedCharacter(state,'hero');}
export function recruitableCharacters(state){return Object.values(state.characters||{}).filter(c=>c.id!=='hero'&&c.available);}
export function setTactic(state,charId,tactic){const c=characterById(state,charId);if(!c||!TACTICS[tactic])return{ok:false,msg:'作戦を変更できない。'};c.tactic=tactic;return{ok:true,msg:`${c.name}の作戦を「${TACTICS[tactic].name}」にした。`};}
export function togglePartyMember(state,charId){if(state.run||state.battle)return{ok:false,msg:'仲間の入れ替えは村で。'};const c=characterById(state,charId);if(!c||charId==='hero')return{ok:false,msg:'その仲間は入れ替えできない。'};const inParty=state.party.includes(charId);if(inParty){state.party=state.party.filter(id=>id!==charId);return{ok:true,joined:false,msg:`${c.name}をパーティから外した。酒場で待機する。`};}if(state.party.length>=4)return{ok:false,msg:'パーティは4人まで。'};c.recruited=true;state.party.push(charId);return{ok:true,joined:true,msg:`${c.name}が仲間に加わった！`};}
export function allocateParameterPoint(state,charId,key){const c=characterById(state,charId);if(!c||!PARAMETER_LABELS[key])return{ok:false,msg:'その能力には振れない。'};if((c.appPoints||0)<=0)return{ok:false,msg:'APPがない。'};c.appPoints--;c.stats[key]=(c.stats[key]||0)+1;const d=derivedCharacter(state,c);c.hp=Math.min(c.hp,d.maxHp);c.mp=Math.min(c.mp,d.maxMp);return{ok:true,msg:`${c.name}の${PARAMETER_LABELS[key]}が1上がった。`};}
function growMainLevel(state,c){const st=c.stats;st.vitality+=5;st.strength+=2;st.agility+=c.level%2?1:2;st.magic+=1;st.wisdom+=1;st.knowledge+=c.level%2?0:1;st.dexterity+=1;c.appPoints=(c.appPoints||0)+1;}
function addCharacterExp(state,c,amount){c.exp+=amount;let levels=0;while(c.exp>=expToNext(c.level)){c.exp-=expToNext(c.level);c.level++;growMainLevel(state,c);levels++;state.log.unshift(`${c.name}は レベル ${c.level} になった！ APP+1 / HP・MPはそのまま。`);}const d=derivedCharacter(state,c);c.hp=Math.min(c.hp,d.maxHp);c.mp=Math.min(c.mp,d.maxMp);return levels;}
export function addExp(state,amount,source='経験'){amount=Math.max(0,Math.floor(amount||0));if(!amount)return{amount:0,levels:0,msg:''};const members=partyMembers(state),ups=[];let leadLevels=0;for(const c of members){const lv=addCharacterExp(state,c,amount);if(c.id==='hero')leadLevels=lv;if(lv)ups.push(`${c.name} Lv.${c.level}`);}return{amount,levels:leadLevels,msg:`${source} EXP +${amount}${ups.length?` / ${ups.join('・')}！`:''}`};}
