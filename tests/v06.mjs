import assert from 'node:assert/strict';
import {
  advanceTime, battleItemStacks, command, defaultState, harvestResult, normalize, patrol, stackCount,
  stackList, stackRemaining, startExpedition, transferStack, usedStorageCapacity, warehouseCapacity,
  upgradeWarehouse, useFieldItem
} from '../src/core/game.js';

// Footstep/patrol uses one step and repeats the current area's encounter roll.
const p=defaultState();startExpedition(p);p.run.location='mountain_foot';const p0=p.calendar.totalSteps;const oldRandom=Math.random;Math.random=()=>0;const pr=patrol(p);Math.random=oldRandom;assert.equal(pr.ok,true);assert.equal(p.calendar.totalSteps,p0+1);assert.ok(p.battle,'forced patrol encounter');

// Resource quality is persistent and high skill can produce higher grades.
const h=defaultState();h.lifeSkills.gathering.level=6;startExpedition(h);h.run.location='herb_meadow';Math.random=()=>0.99;const hr=harvestResult(h,1);Math.random=oldRandom;assert.equal(hr.ok,true);assert.ok(hr.quality>=2);const herb=stackList(h,'bag','fresh_herb')[0];assert.equal(herb.quality,hr.quality);assert.ok(stackRemaining(herb)>270);

// Different quality/life batches remain separate stacks.
const q=normalize({version:6,calendar:{totalSteps:0},itemStacks:[
  {stackId:'a',id:'fresh_herb',count:2,quality:0,container:'bag',remainingLife:100,lastAgedStep:0},
  {stackId:'b',id:'fresh_herb',count:1,quality:2,container:'bag',remainingLife:300,lastAgedStep:0}
],nextStackId:3});assert.equal(stackList(q,'bag','fresh_herb').length,2);

// Storage life decays 3x slower than backpack life.
assert.equal(transferStack(q,'b','storage').ok,true);advanceTime(q,30);const bag=stackList(q,'bag','fresh_herb')[0],stored=stackList(q,'storage','fresh_herb')[0];assert.ok(stackRemaining(bag)<=70);assert.ok(stackRemaining(stored)>=289&&stackRemaining(stored)<=291);
assert.equal(warehouseCapacity(q),100);assert.ok(usedStorageCapacity(q)>0);q.gold=1000;assert.equal(upgradeWarehouse(q).ok,true);assert.equal(warehouseCapacity(q),160);

// Battle item choice consumes the selected quality stack and quality changes healing.
const b=normalize({version:6,player:{hp:1,level:1,equipment:{weapon:'novice_sword',body:'travel_clothes'}},calendar:{totalSteps:0},itemStacks:[
  {stackId:'low',id:'fresh_herb',count:1,quality:0,container:'bag',remainingLife:200,lastAgedStep:0},
  {stackId:'high',id:'fresh_herb',count:1,quality:3,container:'bag',remainingLife:500,lastAgedStep:0}
],nextStackId:3,run:{location:'mountain_foot',harvested:[],visited:['town','mountain_foot'],effects:{encounterMod:0,moves:0}}});b.battle={enemyId:'golem',enemyHp:125,enemyMaxHp:125,enemyAtk:1,enemyDef:9,expReward:82,over:false,won:false,guarding:false,turn:1,log:['test']};const beforeHp=b.player.hp;assert.equal(command(b,'item',{stackId:'high'}).ok,true);assert.ok(b.player.hp-beforeHp>=40);assert.equal(stackCount(b,'fresh_herb','bag'),1);assert.equal(battleItemStacks(b)[0].quality,0);

// Field item use also targets a concrete stack.
const f=normalize({version:6,player:{hp:1,level:1,equipment:{weapon:'novice_sword',body:'travel_clothes'}},calendar:{totalSteps:0},itemStacks:[{stackId:'p',id:'potion',count:1,quality:1,container:'bag',remainingLife:700,lastAgedStep:0}],nextStackId:2,run:{location:'west_road',harvested:[],visited:['town','west_road'],effects:{encounterMod:0,moves:0}}});const f0=f.calendar.totalSteps;assert.equal(useFieldItem(f,'p').ok,true);assert.equal(f.calendar.totalSteps,f0+2);assert.equal(stackCount(f,'potion','bag'),0);
console.log('v0.6 ok');
