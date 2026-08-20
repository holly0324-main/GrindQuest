import assert from 'node:assert/strict';
import { buyConsumable, camp, characterById,defaultState, startExpedition } from '../src/core/game.js';
const s=defaultState();s.gold=1000;buyConsumable(s,'camp_set');startExpedition(s);s.run.location='forest_edge';characterById(s,'hero').hp=10;characterById(s,'hero').mp=2;
const oldRandom=Math.random;Math.random=()=>0; // force semi-safe raid and deterministic enemy pick
const r=camp(s);
Math.random=oldRandom;
assert.equal(r.ok,true);assert.equal(r.raided,true);assert.ok(s.battle);assert.equal(s.battle.reason,'camp_raid');
console.log('camp raid ok');
