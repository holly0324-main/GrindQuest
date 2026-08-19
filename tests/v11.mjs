import assert from 'node:assert/strict';
import {alchemyMaxBatch,beginManualAlchemy,completeManualAlchemy,defaultState,simpleAlchemy,stackCount} from '../src/core/game.js';
import {addAlchemyIngredient,alchemyIngredientInfo,applyAlchemyEffect,applyAlchemyStir,createAlchemySession,evaluateAlchemy,setAlchemyHeat,ALCHEMY_EFFECT_TYPES} from '../src/core/alchemy.js';
import {alchemyRecipes} from '../src/data/gameData.js';

const add=(s,id,count,container='storage',quality=0,life=null)=>s.itemStacks.push({stackId:`v11_${id}_${Math.random()}`,id,count,quality,container,remainingLife:life,lastAgedStep:s.calendar.totalSteps});

// 簡易 / 一括調合: きようさで最低保証品質、まとめて材料消費。
const a=defaultState();a.gold=999;add(a,'fresh_herb',12,'fresh_storage',0,500);add(a,'mushroom',12,'fresh_storage',0,500);
assert.ok(alchemyMaxBatch(a,'a_potion',20)>=10);
const before=a.calendar.totalSteps;const batch=simpleAlchemy(a,'a_potion',5);assert.equal(batch.ok,true);assert.equal(batch.count,5);assert.equal(batch.quality,0);assert.ok(a.calendar.totalSteps>before);assert.ok(stackCount(a,'potion','bag')>=6);

// 高いきようさは簡易品質を上げる。
const b=defaultState();b.gold=999;b.player.stats.dexterity=50;add(b,'fresh_herb',2,'fresh_storage',2,500);add(b,'mushroom',2,'fresh_storage',2,500);const quick=simpleAlchemy(b,'a_potion',1);assert.equal(quick.quality,2);

// 手動調合は材料を予約して、スコアで品質決定。
const c=defaultState();c.gold=999;add(c,'fresh_herb',1,'fresh_storage',1,500);add(c,'mushroom',1,'fresh_storage',1,500);const started=beginManualAlchemy(c,'a_potion');assert.equal(started.ok,true);const manual=completeManualAlchemy(c,started.reservation,.91,9000);assert.equal(manual.ok,true);assert.equal(manual.quality,3);

// 釜シミュレータ: 器用さは許容幅、素材投入・火力・攪拌・Effect拡張を持つ。
const recipe=alchemyRecipes.find(x=>x.id==='a_potion');const low=createAlchemySession(recipe,5,null,performance.now()),high=createAlchemySession(recipe,60,null,performance.now());assert.ok(alchemyIngredientInfo(high,'fresh_herb').maxTemp-alchemyIngredientInfo(high,'fresh_herb').minTemp > alchemyIngredientInfo(low,'fresh_herb').maxTemp-alchemyIngredientInfo(low,'fresh_herb').minTemp);
const s=createAlchemySession(recipe,20,null,performance.now());setAlchemyHeat(s,.7);const temp=s.temperature;addAlchemyIngredient(s,'fresh_herb',performance.now());assert.ok(s.temperature<temp);applyAlchemyStir(s,{deltaAngle:.45,dtMs:50,radiusError:.03});assert.equal(s.stir.direction,'cw');assert.ok(s.stir.rps>0);assert.equal(applyAlchemyEffect(s,{type:ALCHEMY_EFFECT_TYPES.STABILIZE,amount:.05}),true);assert.ok(evaluateAlchemy(s).score>=0);
console.log('v0.11 ok');
