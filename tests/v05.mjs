import assert from 'node:assert/strict';
import { addExp, advanceTime, command, derived, expToNext, normalize, orderCraft, forgeOrders, collectForgeOrder, selfCraft, startExpedition } from '../src/core/game.js';

// v0.4/v0.5 equipment and inventory migrations still load.
const migrated=normalize({version:5,player:{equipment:{weapon:'novice_sword',armor:'travel_clothes'}},inventory:{iron_ore:10,slime_gel:10},consumables:{potion:2,camp_set:0},calendar:{totalSteps:0}});
assert.equal(migrated.player.equipment.body,'travel_clothes');
assert.ok(migrated.itemStacks.some(x=>x.id==='potion'&&x.count===2));

// Level-up does not heal.
const s=normalize({version:5,player:{hp:3,mp:1,level:1,exp:expToNext(1)-1,equipment:{weapon:'novice_sword',armor:'travel_clothes'}}});
const beforeMax=derived(s).maxHp;const lv=addExp(s,2,'test');assert.equal(lv.levels,1);assert.equal(s.player.hp,3);assert.equal(s.player.mp,1);assert.ok(derived(s).maxHp>beforeMax);

// Battle victory still gives EXP immediately.
const b=normalize({version:5,player:{baseAtk:200,equipment:{weapon:'novice_sword',armor:'travel_clothes'}}});startExpedition(b);b.battle={enemyId:'slime',enemyHp:1,enemyMaxHp:18,enemyAtk:6,enemyDef:1,expReward:8,over:false,won:false,guarding:false,turn:1,reason:'test',log:['test']};const oldExp=b.player.exp;assert.equal(command(b,'attack').ok,true);assert.ok(b.player.exp>oldExp);

// Forge paths survive stack inventory migration.
const q=normalize({version:5,gold:100,inventory:{iron_ore:20,slime_gel:20,beast_fang:20},calendar:{totalSteps:0}});const o=orderCraft(q,'r_iron_sword');assert.equal(o.ok,true);advanceTime(q,60);assert.equal(forgeOrders(q)[0].ready,true);assert.equal(collectForgeOrder(q,forgeOrders(q)[0].id).ok,true);const beforeSelf=q.calendar.totalSteps;assert.equal(selfCraft(q,'r_leather',.9).ok,true);assert.equal(q.calendar.totalSteps,beforeSelf+12);
console.log('v0.5 migration ok');
