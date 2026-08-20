import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { defaultState, normalize } from '../src/game/state/state.js';
import { partyMembers, derivedCharacter } from '../src/game/characters/characters.js';
import { stackList } from '../src/game/inventory/inventory.js';
import { startExpedition } from '../src/game/exploration/exploration.js';
import { command } from '../src/game/battle/battle.js';
import * as facade from '../src/core/game.js';
import * as data from '../src/data/index.js';
import * as legacyDataFacade from '../src/data/gameData.js';

const s=defaultState();
assert.equal(s.version,18);
assert.equal(partyMembers(s).length,1);
assert.ok(derivedCharacter(s,'hero').maxHp>0);
assert.equal(stackList(s,'bag','potion').length,1);
assert.equal(startExpedition(s).ok,true);

// v0.15 saves remain the supported v0.14+ compatibility line.
const old=defaultState();old.version=15;old.gold=777;old.characters.hero.level=4;
const migrated=normalize(old);
assert.equal(migrated.version,18);assert.equal(migrated.gold,777);assert.equal(migrated.characters.hero.level,4);

// Compatibility facade exposes the same public entry points used by older tests/callers.
for(const key of ['defaultState','normalize','command','startExpedition','stackList','alchemyRecipes','worldNodes'])assert.ok(key in facade,key);
assert.strictEqual(data.items,legacyDataFacade.items);
assert.strictEqual(data.enemies,legacyDataFacade.enemies);

// Facades stay thin; runtime code should use domains directly.
const coreGame=await readFile(new URL('../src/core/game.js',import.meta.url),'utf8');
assert.ok(coreGame.split('\n').length<40);
assert.ok(!coreGame.includes('function defaultState'));
const ui=await readFile(new URL('../src/ui/app.js',import.meta.url),'utf8');
assert.ok(!ui.includes("from '../core/game.js'"));
const main=await readFile(new URL('../src/main.js',import.meta.url),'utf8');
assert.ok(main.includes("from './game/state/state.js'"));

console.log('v0.16 architecture ok');
