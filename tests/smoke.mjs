import assert from 'node:assert/strict';
import {
  advanceTime, backpackCapacity, buyConsumable, camp, command, defaultState, derived, harvestResult,
  materialCount, perishableCount, perishableSummary, phaseInfo, restAtTown, sellMaterial, sleepDuration,
  startExpedition, startTimedProcess, collectTimedProcess, worldNodes
} from '../src/core/game.js';

const s=defaultState();
assert.equal(phaseInfo(s).name,'朝');
assert.equal(startExpedition(s).ok,true);
assert.equal(s.run.location,'town');
assert.ok(Object.keys(worldNodes).length>=25);
assert.equal(backpackCapacity(s),12);

// Fresh items have a step lifetime rather than disappearing at dawn / return.
s.run.location='herb_meadow';
const h=harvestResult(s,1);
assert.equal(h.ok,true);
assert.ok(perishableCount(s,'fresh_herb','bag')>=1);
const remaining=perishableSummary(s,'bag').find(x=>x.id==='fresh_herb').remaining;
assert.ok(remaining>0&&remaining<75);
advanceTime(s,remaining-1);
assert.ok(perishableCount(s,'fresh_herb','bag')>=1);
advanceTime(s,1);
assert.equal(perishableCount(s,'fresh_herb','bag'),0);

// Battle turns advance the same world clock by exactly one step.
s.battle={enemyId:'golem',enemyHp:125,enemyMaxHp:125,enemyAtk:20,enemyDef:9,expReward:82,over:false,won:false,guarding:false,turn:1,log:['test']};
const beforeBattleStep=s.calendar.totalSteps;
assert.equal(command(s,'defend').ok,true);
assert.equal(s.calendar.totalSteps,beforeBattleStep+1);
assert.equal(s.battle.turn,2);
s.battle=null;

// Timed jobs share the same step clock and can represent future maturation recipes.
const job=startTimedProcess(s,'test_tonic',5,{result:'mature_tonic'});
assert.equal(job.ready,false);
advanceTime(s,5);
assert.equal(s.timedProcesses.find(x=>x.id==='test_tonic').ready,true);
assert.equal(collectTimedProcess(s,'test_tonic').payload.result,'mature_tonic');

// Village sleep always lasts at least 20 steps and ends on a phase boundary.
s.run=null;
s.calendar.totalSteps=20;s.calendar.day=1;s.calendar.stepOfDay=20;
assert.equal(sleepDuration(s),40); // only 10 steps to noon, so sleep through to night.
s.player.hp=1;s.player.mp=0;
const rest=restAtTown(s);
assert.equal(rest.steps,40);
assert.equal(phaseInfo(s).name,'夜');
assert.equal(phaseInfo(s).stepInPhase,0);
assert.equal(s.player.hp,derived(s).maxHp);
assert.equal(s.player.mp,derived(s).maxMp);

// Two all-nighters trigger 10% fatigue, then each 30 awake steps adds another stack.
advanceTime(s,180);
assert.equal(s.condition.fatigueStacks,1);
const tired=derived(s);
assert.ok(tired.fatiguePenalty>.099&&tired.fatiguePenalty<.101);
advanceTime(s,30);
assert.equal(s.condition.fatigueStacks,2);
restAtTown(s);
assert.equal(s.condition.fatigueStacks,0);

// Safe camping needs a heavy camp set and restores only part of missing HP/MP.
s.gold=1000;
assert.equal(buyConsumable(s,'camp_set').ok,true);
assert.equal(s.consumables.camp_set,1);
assert.equal(startExpedition(s).ok,true);
s.run.location='forest_spring';
s.player.hp=1;s.player.mp=0;
const maxBefore=derived(s);
const c=camp(s);
assert.equal(c.ok,true);assert.equal(c.raided,false);
assert.ok(s.player.hp>1&&s.player.hp<maxBefore.maxHp);
assert.ok(s.player.mp>0&&s.player.mp<maxBefore.maxMp);

// Economy still comes from selling gathered/material stock.
s.run=null;
s.inventory.slime_gel=10;
const oldGold=s.gold;
assert.equal(sellMaterial(s,'slime_gel','all').ok,true);
assert.ok(s.gold>oldGold);
assert.equal(materialCount(s,'slime_gel'),0);

console.log('smoke ok');
