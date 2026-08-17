import assert from 'node:assert/strict';
import {
  defaultState, startExpedition, travelTo, adjacentNodes, backpackCapacity, usedCapacity,
  harvestResult, sellMaterial, buyConsumable, restAtTown, phaseInfo, worldNodes, useRura
} from '../src/core/game.js';

const s=defaultState();
assert.equal(phaseInfo(s).name,'朝');
assert.equal(startExpedition(s).ok,true);
assert.equal(s.run.location,'town');
assert.ok(adjacentNodes('town').length>=3);
assert.ok(Object.keys(worldNodes).length>=25);
assert.equal(backpackCapacity(s),12);

// Force a resource interaction without relying on random travel combat.
s.run.location='herb_meadow';
const h=harvestResult(s,1);
assert.equal(h.ok,true);
assert.ok(s.run.freshHerbs>=1);
assert.ok(usedCapacity(s)>=2); // potion + at least one herb

// Second harvest in the same expedition must be blocked.
assert.equal(harvestResult(s,1).ok,false);

// Rura returns and fresh herbs expire.
s.consumables.rura_potion=1;
const rr=useRura(s);
assert.equal(rr.ok,true);
assert.equal(s.run,null);
assert.equal(rr.report.method,'rura');
assert.ok(rr.report.herbsExpired>=1);

// Economy: money comes from material sales, then can buy durable medicine.
s.inventory.slime_gel=10;
const beforeGold=s.gold;
const sold=sellMaterial(s,'slime_gel','all');
assert.equal(sold.ok,true);
assert.ok(s.gold>beforeGold);
const buy=buyConsumable(s,'potion');
assert.equal(buy.ok,true);

// Rest advances to a following morning and heals.
s.player.hp=1;s.player.mp=0;
const oldDay=s.calendar.day;
restAtTown(s);
assert.equal(phaseInfo(s).name,'朝');
assert.ok(s.calendar.day>oldDay);
console.log('smoke ok');
