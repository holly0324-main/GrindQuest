import assert from 'node:assert/strict';
import { defaultState, normalize } from '../src/game/state/state.js';
import { addStack } from '../src/game/inventory/inventory.js';
import { dismissFirstGets, pendingFirstGets } from '../src/game/discovery/discovery.js';
import { battleExpForCharacter, battleExpMultiplier, battleExpRewards, beginEncounter, command, makeBattleEnemy } from '../src/game/battle/battle.js';
import { zones } from '../src/data/index.js';

// v0.18 -> v0.19 keeps supported progress and adopts the new runtime version.
const old=defaultState();old.version=18;old.gold=321;
const migrated=normalize(old);assert.equal(migrated.version,19);assert.equal(migrated.gold,321);

// Multiple first acquisitions are presented as one pending batch rather than repeated full-screen cards.
const discoveries=defaultState();
addStack(discoveries,'iron_ore',1,{container:'bag'});
addStack(discoveries,'softwood',1,{container:'bag'});
assert.equal(pendingFirstGets(discoveries).length,2);
assert.equal(dismissFirstGets(discoveries).length,2);
assert.equal(pendingFirstGets(discoveries).length,0);

// Same monster species can be instantiated at different levels with different battle parameters.
const slime1=makeBattleEnemy('slime',0,1),slime3=makeBattleEnemy('slime',0,3);
assert.equal(slime1.level,1);assert.equal(slime3.level,3);
assert.ok(slime3.maxHp>slime1.maxHp);assert.ok(slime3.atk>slime1.atk);assert.ok(slime3.def>=slime1.def);assert.ok(slime3.agi>=slime1.agi);
// Species base EXP does not increase just because the rolled enemy level is higher.
assert.equal(slime3.exp,slime1.exp);

// Region profiles: village outskirts stop at Lv3; deeper zones can reach 4 and rarely 5.
assert.deepEqual(zones.outskirts.enemyLevels,{min:1,max:3});
assert.equal(zones.forest.enemyLevels.max,4);assert.equal(zones.forest.enemyLevels.rareMax,5);

// Explicit/profile encounter levels are attached per enemy instance.
const prof=defaultState();
beginEncounter(prof,'slime','test',{count:2,levelProfile:{min:4,max:4}});
assert.deepEqual(prof.battle.enemies.map(x=>x.level),[4,4]);

// EXP penalty = 10% per level that the character exceeds the enemy, clamped at zero.
assert.equal(battleExpMultiplier(2,2),1);
assert.equal(battleExpMultiplier(3,2),.9);
assert.equal(battleExpMultiplier(5,2),.7);
assert.equal(battleExpMultiplier(12,2),0);
assert.equal(battleExpForCharacter(makeBattleEnemy('slime',0,2),4),6); // 8 * 80% = 6.4 -> floor

// Party members are evaluated independently against the same enemy level.
const party=defaultState();party.characters.hero.level=4;party.characters.boris.recruited=true;party.characters.boris.level=1;party.party=['hero','boris'];
const enemy=makeBattleEnemy('slime',0,2),rewards=battleExpRewards(party,[enemy]);
assert.equal(rewards.hero,6);assert.equal(rewards.boris,8);

// The real victory path applies the reduced EXP.
const fight=defaultState();fight.characters.hero.level=4;fight.characters.hero.stats.strength=100;
beginEncounter(fight,'slime','test',{count:1,enemyLevel:2});fight.battle.enemies[0].hp=1;
const result=command(fight,'attack',{targetId:fight.battle.enemies[0].instanceId});
assert.equal(result.ok,true);assert.equal(fight.battle.won,true);assert.equal(fight.characters.hero.exp,6);

console.log('v0.19 ok');
