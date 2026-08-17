import assert from 'node:assert/strict';
import {
  availableNodeIds, campChoice, claimIdle, command, craft, defaultState, derived,
  enterNode, equip, finishBattleNode, normalize, restAtTown, retreat, startDungeon, startIdle
} from '../src/core/game.js';

const originalRandom=Math.random;
Math.random=()=>0.5;
try {
  const s=normalize(defaultState());
  const hp0=s.player.hp,mp0=s.player.mp;
  assert.equal(startDungeon(s,'green_hill').ok,true);
  assert.equal(s.player.hp,hp0,'dungeon start must not auto-heal HP');
  assert.equal(s.player.mp,mp0,'dungeon start must not auto-heal MP');
  assert.ok(availableNodeIds(s).length>=2,'map should branch at entrance');

  // Enter one battle node and win it.
  const first=availableNodeIds(s)[0];
  assert.equal(enterNode(s,first).ok,true);
  let guard=0;
  while(s.battle&&!s.battle.over&&guard++<100){
    const stats=derived(s);
    if(s.player.hp<stats.maxHp*.35&&s.player.mp>=4)command(s,'heal');
    else if(s.player.mp>=3)command(s,'skill');
    else command(s,'attack');
  }
  assert.equal(s.battle?.won,true);
  const hpAfterBattle=s.player.hp,mpAfterBattle=s.player.mp;
  assert.equal(finishBattleNode(s).done,false);
  assert.equal(s.player.hp,hpAfterBattle,'battle completion must not auto-heal HP');
  assert.equal(s.player.mp,mpAfterBattle,'battle completion must not auto-heal MP');
  assert.ok(s.run.rewards.exp>0,'battle EXP should be unbanked cargo');

  // Retreat banks cargo, without healing.
  const cargoExp=s.run.rewards.exp;
  const playerExpBefore=s.player.exp;
  const ret=retreat(s);
  assert.equal(ret.ok,true);
  assert.equal(s.run,null);
  assert.ok(s.player.exp>=playerExpBefore,'retreat should bank EXP');
  assert.equal(ret.rewards.exp,cargoExp);
  assert.equal(s.player.hp,hpAfterBattle,'retreat must not auto-heal HP');
  assert.equal(s.player.mp,mpAfterBattle,'retreat must not auto-heal MP');

  restAtTown(s);
  assert.equal(s.player.hp,derived(s).maxHp);
  assert.equal(s.player.mp,derived(s).maxMp);

  s.inventory.iron_ore=10;s.inventory.slime_gel=10;
  assert.equal(craft(s,'r_iron_sword').ok,true);
  assert.equal(equip(s,'iron_sword'),true);

  assert.equal(startIdle(s,'green_hill').ok,true);
  s.idle.startedAt-=60*60*1000;
  const idle=claimIdle(s);
  assert.equal(idle.ok,true);
  assert.equal(idle.result.cycles,10);
  assert.equal('gold' in idle.result,false,'idle rewards should not contain gold');

  console.log('Smoke test passed: branching map -> battle -> no auto-heal -> retreat bank -> craft -> idle');
} finally { Math.random=originalRandom; }
