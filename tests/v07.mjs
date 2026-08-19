import assert from 'node:assert/strict';
import {
  advanceTime,battleItemStacks,command,defaultState,derived,equipmentList,gearBase,harvestResult,normalize,
  patrol,selfCraft,sellAllValuables,sellEquipment,stackCount,stackList,stackRemaining,startExpedition,
  transferStack,warehouseCapacity
} from '../src/core/game.js';

// v0.6 migration: gear IDs + legacy stats survive.
const m=normalize({version:6,player:{level:3,hp:10,mp:4,equipment:{weapon:'novice_sword',body:'travel_clothes'}},ownedItems:{novice_sword:1,travel_clothes:1},calendar:{totalSteps:0}});
assert.ok(m.player.equipment.weapon.startsWith('gear_'));assert.equal(gearBase(m,m.player.equipment.weapon).id,'novice_sword');assert.ok(derived(m).strength>=8);

// Patrol = 1 step and forces encounter in a monster zone.
const p=defaultState();startExpedition(p);p.run.location='mountain_foot';const p0=p.calendar.totalSteps;const old=Math.random;Math.random=()=>0;const pr=patrol(p);Math.random=old;assert.equal(pr.ok,true);assert.equal(p.calendar.totalSteps,p0+1);assert.ok(p.battle);

// Escape n/3: first two can fail, third is guaranteed.
const e=defaultState();startExpedition(e);e.run.location='forest_edge';e.battle={enemyId:'slime',enemyHp:18,enemyMaxHp:18,enemyAtk:0,enemyDef:1,enemyAgi:5,expReward:8,over:false,won:false,escaped:false,guarding:false,turn:1,escapeAttempts:0,log:['test']};Math.random=()=>0.9999;assert.equal(command(e,'escape').escaped,false);assert.equal(command(e,'escape').escaped,false);assert.equal(command(e,'escape').escaped,true);Math.random=old;

// Slime with random=.99 produces 2 reward slots and weighted core results.
const d=defaultState();startExpedition(d);d.run.location='west_road';d.battle={enemyId:'slime',enemyHp:1,enemyMaxHp:18,enemyAtk:0,enemyDef:0,enemyAgi:1,expReward:8,over:false,won:false,escaped:false,guarding:false,turn:1,escapeAttempts:0,log:['test']};Math.random=()=>0.9999;const win=command(d,'attack');Math.random=old;assert.equal(win.ok,true);assert.equal(d.battle.won,true);assert.ok(stackCount(d,'slime_core','bag')>=2);

// High gathering + dexterity can create high-quality herbs.
const h=defaultState();h.lifeSkills.gathering.level=6;h.player.stats.dexterity=20;startExpedition(h);h.run.location='herb_meadow';Math.random=()=>0.99;const hr=harvestResult(h,1);Math.random=old;assert.ok(hr.quality>=2);

// Warehouse life uses a 1/3 aging rate and does not multiply on retrieval.
const q=normalize({version:7,calendar:{totalSteps:0},itemStacks:[{stackId:'x',id:'fresh_herb',count:1,quality:0,container:'bag',remainingLife:300,lastAgedStep:0}],nextStackId:2});
assert.equal(warehouseCapacity(q),200);assert.equal(transferStack(q,'x','storage').ok,true);advanceTime(q,30);let st=stackList(q,'fresh_storage','fresh_herb')[0];assert.ok(stackRemaining(st)>=289&&stackRemaining(st)<=291);assert.equal(transferStack(q,'x','bag').ok,true);st=stackList(q,'bag','fresh_herb')[0];assert.ok(stackRemaining(st)>=289&&stackRemaining(st)<=291);advanceTime(q,30);assert.ok(stackRemaining(stackList(q,'bag','fresh_herb')[0])<=261);

// Return auto-stores non-adventure; adventure stays in the bag.
const a=normalize({version:7,itemStacks:[
 {stackId:'gel',id:'slime_gel',count:3,quality:0,container:'bag',remainingLife:null,lastAgedStep:0},
 {stackId:'herb',id:'fresh_herb',count:2,quality:1,container:'bag',remainingLife:500,lastAgedStep:0}
],nextStackId:3,run:{location:'town',harvested:[],visited:['town'],effects:{encounterMod:0,moves:0}}});const ar=patrol(a);assert.equal(ar.returned,true);assert.equal(stackCount(a,'slime_gel','storage'),3);assert.equal(stackCount(a,'fresh_herb','bag'),2);

// Valuable quick-sell and equipment workmanship/sale.
const v=normalize({version:7,gold:0,itemStacks:[{stackId:'coin',id:'goblin_coin',count:3,quality:0,container:'storage',remainingLife:null,lastAgedStep:0}],nextStackId:2});const sv=sellAllValuables(v);assert.equal(sv.count,3);assert.ok(v.gold>0);
const c=normalize({version:6,inventory:{iron_ore:20,slime_gel:20},calendar:{totalSteps:0}});const cr=selfCraft(c,'r_iron_sword',.95);assert.equal(cr.ok,true);assert.equal(cr.gear.workmanship,3);const g=equipmentList(c,'weapon').find(x=>x.gearId===cr.gear.gearId);assert.ok(g);const before=c.gold;assert.equal(sellEquipment(c,g.gearId).ok,true);assert.ok(c.gold>before);

// Battle item list includes consumable quality stacks.
const bi=normalize({version:7,itemStacks:[{stackId:'p',id:'potion',count:1,quality:2,container:'bag',remainingLife:1000,lastAgedStep:0}],nextStackId:2});assert.ok(battleItemStacks(bi).some(x=>x.id==='potion'));
console.log('v0.7 ok');
