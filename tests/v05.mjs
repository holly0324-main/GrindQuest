import assert from 'node:assert/strict';
import {
  addExp, advanceTime, brewPotion, canAlchemy, collectForgeOrder, command, defaultState, derived,
  expToNext, forgeOrders, normalize, orderCraft, selfCraft, startExpedition, useFieldItem
} from '../src/core/game.js';

// v0.4 save equipment migrates from armor -> body.
const migrated=normalize({version:4,player:{equipment:{weapon:'novice_sword',armor:'travel_clothes'}}});
assert.equal(migrated.player.equipment.body,'travel_clothes');
assert.equal('armor' in migrated.player.equipment,false);

// EXP is applied immediately and level-up does not heal current HP/MP.
const s=defaultState();
s.player.hp=3;s.player.mp=1;s.player.exp=expToNext(1)-1;
const beforeMax=derived(s).maxHp;
const lv=addExp(s,2,'test');
assert.equal(lv.levels,1);
assert.equal(s.player.level,2);
assert.equal(s.player.hp,3);
assert.equal(s.player.mp,1);
assert.ok(derived(s).maxHp>beforeMax);

// Battle victory grants EXP immediately rather than pending return EXP.
const b=defaultState();
startExpedition(b);b.player.baseAtk=200;
b.battle={enemyId:'slime',enemyHp:1,enemyMaxHp:18,enemyAtk:6,enemyDef:1,expReward:8,over:false,won:false,guarding:false,turn:1,reason:'test',log:['test']};
const oldExp=b.player.exp;
const br=command(b,'attack');
assert.equal(br.ok,true);assert.equal(b.battle.won,true);assert.ok(b.player.exp>oldExp);assert.equal('pendingExp' in b.run,false);

// Field items cost world steps.
const f=defaultState();startExpedition(f);f.perishables.push({id:'fresh_herb',count:1,container:'bag',expiresAt:75});f.player.hp=1;
const step0=f.calendar.totalSteps;const ur=useFieldItem(f,'fresh_herb');
assert.equal(ur.ok,true);assert.equal(f.calendar.totalSteps,step0+2);assert.ok(f.player.hp>1);

// Blacksmith order reserves ingredients and completes after 60 shared steps.
const q=defaultState();q.inventory.iron_ore=10;q.inventory.slime_gel=10;
const order=orderCraft(q,'r_iron_sword');assert.equal(order.ok,true);assert.equal(forgeOrders(q).length,1);assert.equal(forgeOrders(q)[0].ready,false);
advanceTime(q,59);assert.equal(forgeOrders(q)[0].ready,false);advanceTime(q,1);assert.equal(forgeOrders(q)[0].ready,true);
const got=collectForgeOrder(q,forgeOrders(q)[0].id);assert.equal(got.ok,true);assert.ok(q.ownedItems.iron_sword>=1);

// Self forging consumes 12 steps and finishes immediately after the minigame result.
q.inventory.beast_fang=10;q.inventory.slime_gel=10;
const beforeSelf=q.calendar.totalSteps;const self=selfCraft(q,'r_leather',.9);assert.equal(self.ok,true);assert.equal(q.calendar.totalSteps,beforeSelf+12);assert.ok(q.ownedItems.leather_armor>=1);

// Alchemy: herb + mushroom + 20G -> potion, 8 steps.
const a=defaultState();a.inventory.fresh_herb=1;a.inventory.mushroom=1;a.gold=100;
assert.equal(canAlchemy(a),true);const pot0=a.consumables.potion;const a0=a.calendar.totalSteps;const brew=brewPotion(a,.6);
assert.equal(brew.ok,true);assert.equal(a.gold,80);assert.equal(a.consumables.potion,pot0+1);assert.equal(a.calendar.totalSteps,a0+8);

console.log('v0.5 ok');
