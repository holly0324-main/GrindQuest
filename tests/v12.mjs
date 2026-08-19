import assert from 'node:assert/strict';
import {beginManualAlchemy,completeManualAlchemy,defaultState,stackCount} from '../src/core/game.js';
import {addAlchemyIngredient,advanceAlchemySession,createAlchemySession,evaluateAlchemy,setAlchemyHeat} from '../src/core/alchemy.js';
import {alchemyRecipes} from '../src/data/gameData.js';

const add=(s,id,count,container='fresh_storage',quality=0,life=800)=>s.itemStacks.push({stackId:`v12_${id}_${Math.random()}`,id,count,quality,container,remainingLife:life,lastAgedStep:s.calendar.totalSteps});
const recipe=alchemyRecipes.find(x=>x.id==='a_potion');

// 全素材投入で、抽出量にかかわらず「調合完了」は可能になる。
const t0=performance.now();
const session=createAlchemySession(recipe,20,null,t0);
addAlchemyIngredient(session,'fresh_herb',t0);
assert.equal(evaluateAlchemy(session).allAdded,false);
addAlchemyIngredient(session,'mushroom',t0);
const immediate=evaluateAlchemy(session);
assert.equal(immediate.allAdded,true);
assert.equal(immediate.ready,true);
assert.equal(immediate.viable,false); // まだほぼ混ぜていないので失敗域。

// 素材投入は温度を即変化させず、温度変化レートを一定時間加算する。
const thermal=createAlchemySession(recipe,20,null,t0);setAlchemyHeat(thermal,0);const before=thermal.temperature;addAlchemyIngredient(thermal,'fresh_herb',t0);assert.equal(thermal.temperature,before);assert.equal(thermal.thermalEffects.length,1);advanceAlchemySession(thermal,t0+1000);assert.ok(thermal.temperature<before);assert.ok(thermal.thermalEffects[0].remainingMs<=2000);

// 少ない攪拌でも数秒で抽出が進み、最低品質域へ到達できる。
const quick=createAlchemySession(recipe,45,null,t0);setAlchemyHeat(quick,.55);addAlchemyIngredient(quick,'fresh_herb',t0);addAlchemyIngredient(quick,'mushroom',t0);for(let i=1;i<=35;i++){quick.stir.rps=.7;quick.stir.direction=i<18?'cw':'ccw';quick.stir.pathScore=.94;advanceAlchemySession(quick,t0+i*100);}const qev=evaluateAlchemy(quick);assert.ok(qev.extraction>.16);assert.equal(qev.allAdded,true);

// 失敗域で瓶詰めすると失敗ポーションになる。
const a=defaultState();a.gold=999;add(a,'fresh_herb',1);add(a,'mushroom',1);const started=beginManualAlchemy(a,'a_potion');assert.equal(started.ok,true);const failed=completeManualAlchemy(a,started.reservation,.08,1000);assert.equal(failed.failed,true);assert.equal(failed.product.id,'failed_potion');assert.equal(stackCount(a,'failed_potion','bag'),1);

// ☆0以上なら通常ポーションとして完成する。
const b=defaultState();b.gold=999;add(b,'fresh_herb',1);add(b,'mushroom',1);const started2=beginManualAlchemy(b,'a_potion');const ok=completeManualAlchemy(b,started2.reservation,.42,5000);assert.equal(ok.failed,undefined);assert.equal(ok.quality,0);assert.ok(stackCount(b,'potion','bag')>=2);
console.log('v0.12 ok');
