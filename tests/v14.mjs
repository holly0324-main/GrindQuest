import assert from 'node:assert/strict';
import {
  defaultState, normalize, togglePartyMember, partyMembers, characterById, setTactic, TACTICS,
  addExp, expToNext, allocateParameterPoint, derivedCharacter, command, battleCurrentActor
} from '../src/core/game.js';

const s=defaultState();
assert.deepEqual(s.party,['hero']);
assert.equal(characterById(s,'boris').recruited,false);
let r=togglePartyMember(s,'boris');
assert.equal(r.ok,true);assert.equal(r.joined,true);assert.equal(s.party.length,2);assert.equal(characterById(s,'boris').recruited,true);
assert.equal(partyMembers(s).map(x=>x.id).join(','),'hero,boris');
assert.equal(setTactic(s,'boris','gungun').ok,true);assert.equal(characterById(s,'boris').tactic,'gungun');

// Party EXP is awarded independently and level-up grants APP without healing to max.
const hero=characterById(s,'hero'),boris=characterById(s,'boris');
hero.hp=10;boris.hp=11;const need=expToNext(1);addExp(s,need+1,'test');
assert.equal(hero.level,2);assert.equal(boris.level,2);assert.equal(hero.appPoints,1);assert.equal(boris.appPoints,1);assert.equal(hero.hp,10);assert.equal(boris.hp,11);
const before=hero.stats.strength;assert.equal(allocateParameterPoint(s,'hero','strength').ok,true);assert.equal(hero.stats.strength,before+1);assert.equal(hero.appPoints,0);

// Two manual party members queue commands, then one complete round resolves in speed order.
setTactic(s,'hero','manual');setTactic(s,'boris','manual');
s.battle={enemies:[{instanceId:'enemy_1',enemyId:'slime',hp:99,maxHp:99,atk:1,def:0,agi:1,exp:8}],over:false,won:false,escaped:false,turn:1,escapeAttempts:0,guards:{},pending:{},log:['test']};
assert.equal(battleCurrentActor(s).id,'hero');
let q=command(s,'attack',{actorId:'hero',targetId:'enemy_1'});assert.equal(q.awaiting,true);assert.equal(q.nextActorId,'boris');
q=command(s,'attack',{actorId:'boris',targetId:'enemy_1'});assert.equal(q.resolved,true);assert.equal(s.battle.turn,2);assert.equal(Object.keys(s.battle.pending).length,0);assert.ok(q.events.filter(x=>x.kind==='party').length>=2);

// Multiple enemies remain independent battle entities.
setTactic(s,'boris','gungun');
s.battle={enemies:[
 {instanceId:'enemy_1',enemyId:'slime',hp:18,maxHp:18,atk:1,def:0,agi:1,exp:8},
 {instanceId:'enemy_2',enemyId:'slime',hp:18,maxHp:18,atk:1,def:0,agi:2,exp:8},
 {instanceId:'enemy_3',enemyId:'slime',hp:18,maxHp:18,atk:1,def:0,agi:3,exp:8}
],over:false,won:false,escaped:false,turn:1,escapeAttempts:0,guards:{},pending:{},log:['test']};
q=command(s,'attack',{actorId:'hero',targetId:'enemy_2'});assert.equal(q.resolved,true);assert.equal(s.battle.enemies.length,3);assert.ok(q.events.some(x=>x.kind==='party'));assert.ok(q.events.some(x=>x.kind==='enemy'));

// v0.13 save migrates to party structure with hero preserved.
const m=normalize({version:13,player:{name:'旧主人公',level:4,exp:3,hp:20,mp:5,stats:{vitality:60,strength:15,agility:10,magic:9,wisdom:9,knowledge:8,dexterity:8},equipment:{}},calendar:{totalSteps:0}});
assert.equal(m.characters.hero.name,'旧主人公');assert.equal(m.player,m.characters.hero);assert.deepEqual(m.party,['hero']);assert.ok(m.characters.boris);
console.log('v0.14 ok');
