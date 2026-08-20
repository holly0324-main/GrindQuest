import assert from 'node:assert/strict';
import { defaultState } from '../src/game/state/state.js';
import { addStack } from '../src/game/inventory/inventory.js';
import { beginEncounter, setBattleTactic } from '../src/game/battle/battle.js';
import { togglePartyMember } from '../src/game/characters/characters.js';
import {
  isItemDiscovered, isItemObtained, isMonsterDiscovered, isMonsterSeen,
  learnItem, nextFirstGet
} from '../src/game/discovery/discovery.js';
import { forgeRecipeVisible, hasForgeSkill, orderCraft, selfCraft } from '../src/game/crafting/forge.js';
import { recipes } from '../src/data/index.js';
import { buyEquipment, revealEquipmentShop } from '../src/game/equipment/shop.js';

const s=defaultState();
assert.equal(s.version,18);
assert.equal(isItemObtained(s,'novice_sword'),true);
assert.equal(isItemObtained(s,'potion'),true);
assert.equal(nextFirstGet(s),null);

// Item knowledge and first acquisition are separate.
assert.equal(isItemDiscovered(s,'hard_stone'),false);
learnItem(s,'hard_stone','story');
assert.equal(isItemDiscovered(s,'hard_stone'),true);
assert.equal(isItemObtained(s,'hard_stone'),false);
assert.equal(nextFirstGet(s),null);
addStack(s,'iron_ore',1,{container:'bag'});
assert.equal(isItemDiscovered(s,'iron_ore'),true);
assert.equal(isItemObtained(s,'iron_ore'),true);
assert.equal(nextFirstGet(s)?.id,'iron_ore');
const q=s.encyclopedia.firstGetQueue.length;
addStack(s,'iron_ore',1,{container:'bag'});
assert.equal(s.encyclopedia.firstGetQueue.length,q);

// Seeing a monster marks it as discovered/seen.
beginEncounter(s,'slime','test',{count:1});
assert.equal(isMonsterDiscovered(s,'slime'),true);
assert.equal(isMonsterSeen(s,'slime'),true);

// Battle tactics can change without consuming a turn and stale pending action is cleared.
togglePartyMember(s,'boris');
s.battle.pending.boris={type:'attack',payload:{}};
const turn=s.battle.turn;
let r=setBattleTactic(s,'boris','manual');
assert.equal(r.ok,true);assert.equal(s.characters.boris.tactic,'manual');assert.equal('boris' in s.battle.pending,false);assert.equal(s.battle.turn,turn);

// Forge visibility is gated by discovery and R1+; manual forging remains skill-locked.
const fresh=defaultState(),ingot=recipes.find(x=>x.id==='m_iron_ingot');
assert.equal(forgeRecipeVisible(fresh,ingot),false);
learnItem(fresh,'iron_ore','story');
assert.equal(forgeRecipeVisible(fresh,ingot),false);
fresh.unlocks.recipes.m_iron_ingot=true;
assert.equal(forgeRecipeVisible(fresh,ingot),true);
assert.equal(hasForgeSkill(fresh),false);
assert.equal(selfCraft(fresh,'m_iron_ingot',1).ok,false);
addStack(fresh,'iron_ore',3,{container:'storage'});fresh.gold=100;
const beforeGold=fresh.gold;r=orderCraft(fresh,'m_iron_ingot');assert.equal(r.ok,true);assert.ok(r.fee>0);assert.equal(fresh.gold,beforeGold-r.fee);

// Shop display reveals knowledge; acquisition remains a distinct first-get event.
const shopState=defaultState();shopState.gold=500;
revealEquipmentShop(shopState,'minato');
assert.equal(isItemDiscovered(shopState,'hunting_knife'),true);assert.equal(isItemObtained(shopState,'hunting_knife'),false);
r=buyEquipment(shopState,'hunting_knife','minato');assert.equal(r.ok,true);assert.equal(isItemObtained(shopState,'hunting_knife'),true);assert.equal(nextFirstGet(shopState)?.id,'hunting_knife');

console.log('v0.17 ok');
