import assert from 'node:assert/strict';
import {
  alchemyRecipes, brewAlchemy, canAlchemy, defaultState, forgeRecipeProduct, harvestResult,
  materialCount, normalize, rarityOf, recipeRequirements, resolveGatherEncounter, selfCraft,
  stackCount, startExpedition
} from '../src/core/game.js';

// Rarity exists on stack items and equipment.
assert.equal(rarityOf('slime_gel'),0);
assert.equal(rarityOf('flame_blade'),2);

// Gathering can defer the encounter until the UI has finished its result animation.
const g=defaultState();startExpedition(g);g.run.location='quarry';
const oldRandom=Math.random;Math.random=()=>0;
const hr=harvestResult(g,.8,{deferEncounter:true});
assert.equal(hr.ok,true);assert.equal(hr.encounterPending,true);assert.equal(g.battle,null);
assert.equal(resolveGatherEncounter(g,.92),true);assert.ok(g.battle);
Math.random=oldRandom;

// Intermediate forge products are real stack items and retain workmanship as quality.
const f=normalize({version:9,inventory:{iron_ore:12},calendar:{totalSteps:0}});
const req=recipeRequirements(f,(await import('../src/data/gameData.js')).recipes.find(x=>x.id==='m_iron_ingot'));
assert.equal(req[0].have>=req[0].need,true);
const fr=selfCraft(f,'m_iron_ingot',.95);assert.equal(fr.ok,true);assert.ok(stackCount(f,'iron_ingot')>=1);assert.equal(fr.quality,3);
assert.equal(forgeRecipeProduct((await import('../src/data/gameData.js')).recipes.find(x=>x.id==='m_iron_ingot')).slot,'material');

// Provisional alchemy: recipe requirements + quality result.
const a=normalize({version:9,gold:200,inventory:{fresh_herb:4,mushroom:3},calendar:{totalSteps:0}});
assert.equal(canAlchemy(a,'a_potion'),true);const before=a.calendar.totalSteps;const br=brewAlchemy(a,'a_potion',.8);assert.equal(br.ok,true);assert.equal(br.quality,3);assert.equal(a.calendar.totalSteps,before+8);assert.ok(stackCount(a,'potion','bag')>=1);
assert.ok(alchemyRecipes.some(x=>x.id==='a_herb_extract'));
console.log('v0.10 ok');
