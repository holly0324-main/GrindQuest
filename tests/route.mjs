import assert from 'node:assert/strict';
import { defaultState, startExpedition, travelTo, phaseInfo } from '../src/core/game.js';
const oldRandom=Math.random;
Math.random=()=>0.99; // suppress encounters/events for route test
const s=defaultState();startExpedition(s);
for(const id of ['west_road','herb_meadow','old_well','fallen_bridge','riverbank','fishing_bend','west_road','town']){
  const r=travelTo(s,id);assert.equal(r.ok,true,id);
}
assert.equal(s.run,null);
assert.equal(phaseInfo(s).name,'昼');
Math.random=oldRandom;
console.log('route ok');
