import assert from 'node:assert/strict';
import {command,defaultState,itemBookEntries,itemBookEntry,monsterBookEntries,monsterBookEntry,normalize,rarityOf,startExpedition} from '../src/core/game.js';
import {AppUI} from '../src/ui/app.js';

const s=defaultState();
assert.equal(rarityOf('slime_gel'),0);
assert.equal(rarityOf('rura_potion'),2);
assert.equal(rarityOf('flame_blade'),2);
assert.ok(itemBookEntries(s).length>50);
const herb=itemBookEntry(s,'fresh_herb');
assert.equal(herb.name,'薬草');assert.match(herb.effect,/回復/);assert.equal(herb.rank,0);
const slime=monsterBookEntry(s,'slime');
assert.equal(slime.kills,0);assert.ok(slime.habitats.some(x=>x.place==='村はずれ'));assert.ok(slime.drops.some(x=>x.id==='slime_gel'&&x.weight===247));
assert.ok(monsterBookEntries(s).length>=16);

startExpedition(s);s.run.location='west_road';
s.battle={enemyId:'slime',enemyHp:1,enemyMaxHp:18,enemyAtk:1,enemyDef:0,enemyAgi:0,expReward:8,over:false,won:false,escaped:false,guarding:false,turn:1,escapeAttempts:0,reason:'test',log:['test']};
const oldRandom=Math.random;Math.random=()=>0.9;command(s,'attack');Math.random=oldRandom;
assert.equal(s.encyclopedia.kills.slime,1);assert.equal(monsterBookEntry(s,'slime').kills,1);
const migrated=normalize({version:12,player:s.player,calendar:s.calendar});assert.ok(migrated.encyclopedia);assert.ok(migrated.encyclopedia.kills);

const root={innerHTML:'',querySelectorAll(){return[]},querySelector(){return null},appendChild(){}};const ui=new AppUI(root,defaultState(),async()=>{});
ui.tab='settings';ui.render();assert.match(root.innerHTML,/アイテム図鑑/);assert.match(root.innerHTML,/モンスター図鑑/);
ui.settingsScene='items';ui.render();assert.match(root.innerHTML,/No\.001/);assert.match(root.innerHTML,/R0|R1|R2/);
ui.settingsScene='monsters';ui.render();assert.match(root.innerHTML,/討伐/);assert.match(root.innerHTML,/スライム/);
ui.bookPopup={type:'item',id:'potion'};ui.render();assert.match(root.innerHTML,/基本売値/);assert.match(root.innerHTML,/フレーバー/);
console.log('v0.13 ok');
