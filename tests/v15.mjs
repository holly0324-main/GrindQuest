import assert from 'node:assert/strict';
import {
  defaultState, normalize, togglePartyMember, characterById, partyMembers,
  startExpedition, useFieldItem, stackList, derivedCharacter
} from '../src/core/game.js';

// Exploration healing item can target any living party member.
const s=defaultState();
assert.equal(togglePartyMember(s,'boris').ok,true);
const hero=characterById(s,'hero'),boris=characterById(s,'boris');
hero.hp=10;boris.hp=2;
startExpedition(s);
// avoid incidental encounter making the assertion dependent on RNG
s.run.location='town';
const potion=stackList(s,'bag','potion')[0];
const beforeHero=hero.hp,beforeBoris=boris.hp,beforeStep=s.calendar.totalSteps;
let r=useFieldItem(s,potion.stackId,'boris');
assert.equal(r.ok,true);assert.equal(r.targetId,'boris');assert.ok(boris.hp>beforeBoris);assert.equal(hero.hp,beforeHero);assert.equal(s.calendar.totalSteps,beforeStep+2);

// Invalid/non-party target does not consume an item.
const s2=defaultState();startExpedition(s2);const p2=stackList(s2,'bag','potion')[0],count=p2.count;
r=useFieldItem(s2,p2.stackId,'boris');assert.equal(r.ok,false);assert.equal(stackList(s2,'bag','potion')[0].count,count);

// v0.14 is the save compatibility baseline; party/character data survives normalization.
const old14=defaultState();old14.version=14;togglePartyMember(old14,'boris');characterById(old14,'hero').level=7;characterById(old14,'boris').level=5;old14.gold=432;
// v0.14 serialized saves may still contain the old player alias; it is ignored.
old14.player={name:'legacy alias should be ignored',level:99};
const m=normalize(old14);
assert.equal(m.version,19);assert.equal(m.characters.hero.level,7);assert.equal(m.characters.boris.level,5);assert.deepEqual(m.party,['hero','boris']);assert.equal(m.gold,432);assert.equal('player' in m,false);

// pre-v0.14 migration has intentionally ended after the v0.14 progress reset.
const ancient=normalize({version:13,gold:99999,player:{level:99},settings:{vibrate:false}});
assert.equal(ancient.version,19);assert.equal(ancient.characters.hero.level,1);assert.equal(ancient.gold,80);assert.equal(ancient.settings.vibrate,false);

// Party data is now canonical and derived stats work without state.player.
for(const c of partyMembers(m)){const d=derivedCharacter(m,c);assert.ok(d.maxHp>0);}
console.log('v0.15 ok');
