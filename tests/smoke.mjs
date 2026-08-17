import assert from 'node:assert/strict';
import {
  defaultState, normalize, startDungeon, command, nextEncounter, derived,
  startIdle, claimIdle, craft, equip
} from '../src/core/game.js';

const originalRandom = Math.random;
Math.random = () => 0.5;

try {
  const s = normalize(defaultState());
  assert.equal(startDungeon(s, 'green_hill').ok, true);

  let guard = 0;
  while (s.run && guard++ < 200) {
    while (s.battle && !s.battle.over && guard++ < 200) {
      const stats = derived(s);
      if (s.player.hp < stats.maxHp * 0.4 && s.player.mp >= 4) command(s, 'heal');
      else if (s.player.mp >= 3) command(s, 'skill');
      else command(s, 'attack');
    }
    assert.equal(s.battle?.won, true, 'first dungeon should be clearable with starter gear');
    const result = nextEncounter(s);
    if (result.done) break;
  }
  assert.equal(s.run, null);
  assert.ok((s.clears.green_hill ?? 0) >= 1);

  s.inventory.iron_ore = 10;
  s.inventory.slime_gel = 10;
  s.player.gold = 1000;
  assert.equal(craft(s, 'r_iron_sword').ok, true);
  assert.equal(equip(s, 'iron_sword'), true);
  assert.equal(s.player.equipment.weapon, 'iron_sword');

  assert.equal(startIdle(s, 'green_hill').ok, true);
  s.idle.startedAt -= 60 * 60 * 1000;
  const idle = claimIdle(s);
  assert.equal(idle.ok, true);
  assert.equal(idle.result.cycles, 10);

  console.log('Smoke test passed: battle -> clear -> craft -> equip -> idle claim');
} finally {
  Math.random = originalRandom;
}
