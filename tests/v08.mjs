import assert from 'node:assert/strict';
import {
  advanceTime, defaultState, freshWarehouseCapacity, normalize, stackList, stackRemaining,
  transferStack, upgradeFreshWarehouse, usedFreshStorageCapacity, usedStorageCapacity,
  warehouseCapacity, warehouseGroups
} from '../src/core/game.js';

// v0.7 save migration: perishables that lived in storage move into fresh_storage.
const migrated=normalize({version:7,calendar:{totalSteps:100},itemStacks:[
  {stackId:'gel1',id:'slime_gel',count:2,quality:1,container:'storage',remainingLife:null,lastAgedStep:90},
  {stackId:'herb1',id:'fresh_herb',count:1,quality:2,container:'storage',remainingLife:500,lastAgedStep:90}
],nextStackId:3});
assert.equal(stackList(migrated,'storage','slime_gel').length,1);
assert.equal(stackList(migrated,'fresh_storage','fresh_herb').length,1);

// Permanent items stack across acquisition time. Same item+quality collapses to one real stack.
const permanent=normalize({version:8,itemStacks:[
  {stackId:'a',id:'slime_gel',count:2,quality:1,container:'bag',remainingLife:null,lastAgedStep:0},
  {stackId:'b',id:'slime_gel',count:3,quality:1,container:'bag',remainingLife:null,lastAgedStep:80},
  {stackId:'c',id:'slime_gel',count:1,quality:2,container:'bag',remainingLife:null,lastAgedStep:80}
],nextStackId:4});
assert.equal(stackList(permanent,'bag','slime_gel').length,2);
assert.equal(stackList(permanent,'bag','slime_gel').find(x=>x.quality===1).count,5);

// Bag sort: for the same perishable, shorter lifetime beats quality.
const sorted=normalize({version:8,itemStacks:[
  {stackId:'old',id:'fresh_herb',count:1,quality:0,container:'bag',remainingLife:80,lastAgedStep:0},
  {stackId:'new',id:'fresh_herb',count:1,quality:3,container:'bag',remainingLife:500,lastAgedStep:0}
],nextStackId:3});
assert.equal(stackList(sorted,'bag','fresh_herb')[0].stackId,'old');

// Fresh storage has its own smaller capacity and 1/3 aging rate; retrieval does not multiply life.
const fresh=normalize({version:8,gold:1000,calendar:{totalSteps:0},itemStacks:[
  {stackId:'h',id:'fresh_herb',count:2,quality:1,container:'bag',remainingLife:300,lastAgedStep:0}
],nextStackId:2});
assert.equal(warehouseCapacity(fresh),200);assert.equal(freshWarehouseCapacity(fresh),36);
assert.equal(transferStack(fresh,'h','storage').ok,true);
assert.equal(usedStorageCapacity(fresh),0);assert.equal(usedFreshStorageCapacity(fresh),2);
advanceTime(fresh,30);let h=stackList(fresh,'fresh_storage','fresh_herb')[0];assert.ok(stackRemaining(h)>=289&&stackRemaining(h)<=291);
assert.equal(transferStack(fresh,h.stackId,'bag',1).ok,true);
const retrieved=stackList(fresh,'bag','fresh_herb')[0];assert.ok(stackRemaining(retrieved)>=289&&stackRemaining(retrieved)<=291);
assert.equal(upgradeFreshWarehouse(fresh).ok,true);assert.equal(freshWarehouseCapacity(fresh),60);

// Warehouse presentation groups: normal item->quality, fresh item->quality->lifetimes.
const groupState=normalize({version:8,itemStacks:[
  {stackId:'g0',id:'slime_gel',count:2,quality:0,container:'storage',remainingLife:null,lastAgedStep:0},
  {stackId:'g2',id:'slime_gel',count:4,quality:2,container:'storage',remainingLife:null,lastAgedStep:0},
  {stackId:'f1',id:'fresh_herb',count:1,quality:1,container:'fresh_storage',remainingLife:120,lastAgedStep:0},
  {stackId:'f2',id:'fresh_herb',count:2,quality:1,container:'fresh_storage',remainingLife:240,lastAgedStep:0}
],nextStackId:5});
const ng=warehouseGroups(groupState,'normal')[0];assert.equal(ng.id,'slime_gel');assert.deepEqual(ng.qualities.map(q=>q.count),[2,4]);
const fg=warehouseGroups(groupState,'fresh')[0];assert.equal(fg.id,'fresh_herb');assert.equal(fg.qualities[0].count,3);assert.equal(fg.qualities[0].stacks.length,2);
console.log('v0.8 ok');
