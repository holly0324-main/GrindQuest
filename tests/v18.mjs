import assert from 'node:assert/strict';
import { defaultState, normalize } from '../src/game/state/state.js';
import { startExpedition, patrol } from '../src/game/exploration/exploration.js';
import { addExp } from '../src/game/characters/characters.js';
import { addStack, materialCount } from '../src/game/inventory/inventory.js';
import { beginEncounter, command } from '../src/game/battle/battle.js';
import { learnItem, learnRecord, isItemDiscovered, recordKnowledge } from '../src/game/discovery/discovery.js';
import { recordEnemyDefeat, recordReach } from '../src/game/expedition/expedition.js';
import { handbookEntries, futureHandbookRecords } from '../src/game/handbook/handbook.js';
import { acceptQuest, claimQuest, questStatus } from '../src/game/quests/quests.js';
import { forgeRecipeVisible } from '../src/game/crafting/forge.js';
import { recipes } from '../src/data/index.js';

// v0.17 -> v0.18 keeps progress and installs the new session/quest state.
const old=defaultState();
old.version=17;
old.encyclopedia.knowledge.items.iron_ore={known:true,obtained:false};
const migrated=normalize(old);
assert.equal(migrated.version,18);
assert.equal(isItemDiscovered(migrated,'iron_ore'),true);
assert.ok(migrated.quests?.accepted);
assert.ok(migrated.expeditions?.history);
assert.ok(migrated.encyclopedia?.knowledge?.records?.recipes);

// One exploration records gains independently from current bag/storage contents.
const s=defaultState();
assert.equal(startExpedition(s).ok,true);
addStack(s,'iron_ore',2,{quality:1,container:'bag'});
addExp(s,12,'探索');
beginEncounter(s,'slime','test',{count:1});
recordEnemyDefeat(s,'slime',1);
recordReach(s,{label:'試験坑道・深部',areaId:'test_depth',nodeId:'end',depth:3,score:300});
s.battle=null;
s.run.location='town';
const ret=patrol(s);
assert.equal(ret.returned,true);
assert.equal(ret.report.battles,1);
assert.equal(ret.report.defeated,1);
assert.equal(ret.report.exp,12);
assert.ok(ret.report.items.some(x=>x.id==='iron_ore'&&x.count===2&&x.quality===1));
assert.ok(ret.report.firstGets.some(x=>x.id==='iron_ore'));
assert.ok(ret.report.firstMonsters.some(x=>x.id==='slime'));
assert.equal(ret.report.reached.depth,3);
assert.equal(s.expeditions.lastResult.id,ret.report.id);
assert.equal(s.run,null);
// Auto-storage doesn't erase what the result screen recorded.
assert.equal(materialCount(s,'iron_ore'),2);

// Handbook = discovered-only projection; generic future chapters already have storage.
const h=defaultState();
assert.equal(handbookEntries(h,'materials').some(x=>x.id==='iron_ore'),false);
learnItem(h,'iron_ore','test');
assert.equal(handbookEntries(h,'materials').some(x=>x.id==='iron_ore'),true);
learnRecord(h,'rumors','mine_voice',{name:'坑道の声',source:'test'});
assert.equal(futureHandbookRecords(h).rumors[0].id,'mine_voice');

// A defeated enemy is counted immediately even if the group battle continues.
const partial=defaultState();startExpedition(partial);partial.characters.hero.stats.strength=100;beginEncounter(partial,'slime','test',{count:2});const target=partial.battle.enemies[0].instanceId;command(partial,'attack',{targetId:target});assert.equal(partial.encyclopedia.kills.slime,1);assert.equal(partial.run.summary.defeated,1);

// Data-driven quest flow: kill, delivery, discovery->recipe, dungeon clear.
const q=defaultState();
let r=acceptQuest(q,'slime_patrol');assert.equal(r.ok,true);
q.encyclopedia.kills.slime=(q.encyclopedia.kills.slime||0)+3;
assert.equal(questStatus(q,'slime_patrol').complete,true);
const g0=q.gold;r=claimQuest(q,'slime_patrol');assert.equal(r.ok,true);assert.equal(q.gold,g0+50);

r=acceptQuest(q,'slime_gel_delivery');assert.equal(r.ok,true);
addStack(q,'slime_gel',5,{container:'storage'});
assert.equal(questStatus(q,'slime_gel_delivery').complete,true);
r=claimQuest(q,'slime_gel_delivery');assert.equal(r.ok,true);assert.equal(materialCount(q,'slime_gel'),0);assert.ok(materialCount(q,'potion')>=1);

const ingot=recipes.find(x=>x.id==='m_iron_ingot');
assert.equal(forgeRecipeVisible(q,ingot),false);
r=acceptQuest(q,'iron_vein_report');assert.equal(r.ok,true);
learnItem(q,'iron_ore','quest_test');
assert.equal(questStatus(q,'iron_vein_report').complete,true);
// Merely finding iron is not enough: the recipe is the actual quest reward.
assert.equal(forgeRecipeVisible(q,ingot),false);
r=claimQuest(q,'iron_vein_report');assert.equal(r.ok,true);
assert.equal(q.unlocks.recipes.m_iron_ingot,true);
assert.equal(recordKnowledge(q,'recipes','m_iron_ingot').known,true);
assert.equal(forgeRecipeVisible(q,ingot),true);

r=acceptQuest(q,'old_mine_depths');assert.equal(r.ok,true);
q.worldState.bossDefeatedAt['old_mine_lower:boss_chamber']=q.calendar.totalSteps;
assert.equal(questStatus(q,'old_mine_depths').complete,true);
r=claimQuest(q,'old_mine_depths');assert.equal(r.ok,true);
assert.equal(q.quests.claimed.old_mine_depths!=null,true);

console.log('v0.18 ok');
