import assert from 'node:assert/strict';
import {defaultState,startExpedition,travelTo,patrol} from '../src/core/game.js';
const old=Math.random;Math.random=()=>0.99;
const s=defaultState();startExpedition(s);
for(const id of ['west_road','herb_meadow','old_well','fallen_bridge','riverbank','fishing_bend','west_road','town']) assert.equal(travelTo(s,id).ok,true,id);
assert.ok(s.run);assert.equal(s.run.location,'town');const r=patrol(s);assert.equal(r.returned,true);assert.equal(s.run,null);Math.random=old;
console.log('route ok');
