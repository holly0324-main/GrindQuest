import assert from 'node:assert/strict';
import {
  advanceTime, backpackCapacity, buyConsumable, camp, command, defaultState, derived, harvestResult,
  phaseInfo, restAtTown, sleepDuration, stackCount, stackList, startExpedition, startTimedProcess,
  collectTimedProcess, worldNodes
} from '../src/core/game.js';

const s=defaultState();
assert.equal(phaseInfo(s).name,'朝');
assert.equal(startExpedition(s).ok,true);
assert.equal(s.run.location,'town');
assert.ok(Object.keys(worldNodes).length>=25);
assert.equal(backpackCapacity(s),12);

// Fresh items now live much longer than v0.5.
s.run.location='herb_meadow';
const h=harvestResult(s,1);
assert.equal(h.ok,true);
assert.ok(stackCount(s,'fresh_herb','bag')>=1);
const herb=stackList(s,'bag','fresh_herb')[0];
assert.ok(herb.remainingLife>200);
const rem=Math.ceil(herb.remainingLife);
advanceTime(s,rem-1);
assert.ok(stackCount(s,'fresh_herb','bag')>=1);
advanceTime(s,2);
assert.equal(stackCount(s,'fresh_herb','bag'),0);

// Battle turns use exactly one world step.
s.battle={enemyId:'golem',enemyHp:125,enemyMaxHp:125,enemyAtk:20,enemyDef:9,expReward:82,over:false,won:false,guarding:false,turn:1,log:['test']};
const before=s.calendar.totalSteps;
assert.equal(command(s,'defend').ok,true);
assert.equal(s.calendar.totalSteps,before+1);
s.battle=null;

// Shared timed process clock.
const job=startTimedProcess(s,'test_job',5,{result:'done'});
advanceTime(s,5);assert.equal(job.ready,true);assert.equal(collectTimedProcess(s,'test_job').payload.result,'done');

// Sleep and fatigue still work.
s.run=null;s.calendar.totalSteps=20;s.calendar.day=1;s.calendar.stepOfDay=20;s.player.hp=1;s.player.mp=0;
assert.equal(sleepDuration(s),40);restAtTown(s);assert.equal(phaseInfo(s).name,'夜');assert.equal(s.player.hp,derived(s).maxHp);
advanceTime(s,180);assert.equal(s.condition.fatigueStacks,1);restAtTown(s);assert.equal(s.condition.fatigueStacks,0);

// Camp set remains reusable tool.
s.gold=1000;assert.equal(buyConsumable(s,'camp_set').ok,true);startExpedition(s);s.run.location='forest_spring';s.player.hp=1;s.player.mp=0;const max=derived(s);const c=camp(s);assert.equal(c.ok,true);assert.ok(s.player.hp>1&&s.player.hp<max.maxHp);
console.log('smoke ok');
