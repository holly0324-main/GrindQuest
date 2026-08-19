import assert from 'node:assert/strict';
import {
  advanceTime, bossStatus, command, defaultState, enterLocalArea, localAreaEntry,
  localMove, normalize, resourceStatus, startExpedition, useAreaTransition, useFieldItem
} from '../src/core/game.js';

// World location can expose an enterable local area.
const s=normalize(defaultState());
startExpedition(s);s.run.location='quarry';
assert.equal(localAreaEntry(s).area.id,'iron_echo_quarry');
assert.equal(enterLocalArea(s).ok,true);
assert.equal(s.run.area.areaId,'iron_echo_quarry');

// Field movement can cost 0 step, and resource nodes can be harvested repeatedly.
let before=s.calendar.totalSteps;
assert.equal(localMove(s,'west_vein').ok,true);
assert.equal(s.calendar.totalSteps,before);
let rs=resourceStatus(s);assert.equal(rs.maxUses,3);assert.equal(rs.remainingUses,3);
const oldRandom=Math.random;Math.random=()=>.99;
for(let i=0;i<3;i++){const r=(await import('../src/core/game.js')).harvestResult(s,.7);assert.equal(r.ok,true);}
assert.equal(resourceStatus(s).used,true);
assert.equal((await import('../src/core/game.js')).harvestResult(s,.7).ok,false);
Math.random=oldRandom;

// Using an item on the map advances time and performs an encounter roll like patrol.
const itemState=normalize(defaultState());startExpedition(itemState);itemState.run.location='quarry';enterLocalArea(itemState);itemState.player.hp=1;
Math.random=()=>0;
const itemResult=useFieldItem(itemState,'potion');
assert.equal(itemResult.ok,true);assert.equal(itemResult.steps,2);assert.equal(!!itemState.battle,true);
Math.random=oldRandom;

// Dungeon transition switches maps and consumes a step.
const mine=normalize(defaultState());startExpedition(mine);mine.run.location='mine_entrance';enterLocalArea(mine);mine.run.area.nodeId='lower_lift';
Math.random=()=>.99;
before=mine.calendar.totalSteps;
const trans=useAreaTransition(mine);assert.equal(trans.ok,true);assert.equal(mine.run.area.areaId,'old_mine_lower');assert.equal(mine.calendar.totalSteps,before+1);
Math.random=oldRandom;

// Boss symbols are persistent and respawn after their timer.
const boss=normalize(defaultState());startExpedition(boss);boss.run.location='mine_entrance';enterLocalArea(boss);boss.run.area={areaId:'old_mine_lower',nodeId:'deep_rest',visited:['deep_rest']};boss.player.stats.strength=999;boss.player.stats.agility=999;
Math.random=()=>.5;
const stepBoss=localMove(boss,'boss_chamber');assert.equal(stepBoss.battle,true);assert.equal(boss.battle.enemyId,'ore_golem');
const hit=command(boss,'attack');assert.equal(hit.victory!=null,true);
let bs=bossStatus(boss,'old_mine_lower','boss_chamber');assert.equal(bs.ready,false);assert.ok(bs.remaining>0);
advanceTime(boss,400);bs=bossStatus(boss,'old_mine_lower','boss_chamber');assert.equal(bs.ready,true);
Math.random=oldRandom;

console.log('v0.9 ok');
