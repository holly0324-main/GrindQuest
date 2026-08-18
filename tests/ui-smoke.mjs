import assert from 'node:assert/strict';
import { defaultState, startExpedition } from '../src/core/game.js';
import { AppUI } from '../src/ui/app.js';

const root={innerHTML:'',querySelectorAll(){return[]},querySelector(){return null},appendChild(){}};
const s=defaultState();
const ui=new AppUI(root,s,async()=>{});
ui.render();assert.match(root.innerHTML,/周辺探索へ出発/);assert.match(root.innerHTML,/アイテム/);
ui.tab='items';ui.itemScene='shop';ui.render();assert.match(root.innerHTML,/道具屋/);
ui.tab='production';ui.productionMode='forge';ui.render();assert.match(root.innerHTML,/60step/);assert.match(root.innerHTML,/自分で打つ/);
ui.productionMode='alchemy';ui.render();assert.match(root.innerHTML,/瓶代/);
ui.tab='equipment';ui.render();assert.match(root.innerHTML,/からだ上/);assert.match(root.innerHTML,/そうび/);
startExpedition(s);ui.render();assert.match(root.innerHTML,/run-hud-compact/);assert.match(root.innerHTML,/map-player-marker/);ui.runBagOpen=true;ui.render();assert.match(root.innerHTML,/バックパック/);ui.runBagOpen=false;
s.battle={enemyId:'slime',enemyHp:18,enemyMaxHp:18,enemyAtk:6,enemyDef:1,expReward:8,over:false,won:false,guarding:false,turn:1,reason:'test',log:['スライムが あらわれた！']};ui.battleVisible=true;ui.render();assert.match(root.innerHTML,/battle-button-grid/);assert.match(root.innerHTML,/battle-player-bar/);
console.log('ui smoke ok');
