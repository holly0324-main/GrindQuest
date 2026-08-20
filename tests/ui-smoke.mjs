import assert from 'node:assert/strict';
import {defaultState,startExpedition,togglePartyMember} from '../src/core/game.js';
import {addStack} from '../src/game/inventory/inventory.js';
import {learnItem} from '../src/game/discovery/discovery.js';
import {AppUI} from '../src/ui/app.js';
const root={innerHTML:'',querySelectorAll(){return[]},querySelector(){return null},appendChild(){}};const s=defaultState();const ui=new AppUI(root,s,async()=>{});
ui.render();assert.match(root.innerHTML,/80G/);assert.match(root.innerHTML,/冒険者/);assert.match(root.innerHTML,/酒場/);assert.match(root.innerHTML,/HP 46\/46/);
ui.homeScene='tavern';ui.render();assert.match(root.innerHTML,/ガルド/);togglePartyMember(s,'boris');ui.homeScene='menu';ui.render();assert.match(root.innerHTML,/ガルド/);ui.statusCharacterId='hero';ui.render();assert.match(root.innerHTML,/APP/);assert.match(root.innerHTML,/きようさ/);ui.statusCharacterId=null;
ui.tab='items';ui.itemScene='warehouse';s.itemStacks.push({stackId:'wh_gel',id:'slime_gel',count:3,quality:1,container:'storage',remainingLife:null,lastAgedStep:s.calendar.totalSteps},{stackId:'wh_herb',id:'fresh_herb',count:2,quality:2,container:'fresh_storage',remainingLife:300,lastAgedStep:s.calendar.totalSteps});ui.render();assert.match(root.innerHTML,/換金品を全て売る/);assert.match(root.innerHTML,/スライムゼリー/);assert.match(root.innerHTML,/☆1/);ui.warehouseMode='fresh';ui.render();assert.match(root.innerHTML,/生鮮倉庫/);assert.match(root.innerHTML,/薬草/);assert.match(root.innerHTML,/☆2/);ui.warehouseMode='normal';
// v0.17: the regular shop also contains a flat equipment list.
ui.itemScene='shop';ui.render();assert.match(root.innerHTML,/武器・防具/);assert.match(root.innerHTML,/狩人のナイフ/);assert.match(root.innerHTML,/鉄の盾/);
// Encyclopedia masks content that has never been learned/obtained/seen.
ui.tab='settings';ui.settingsScene='items';ui.render();assert.match(root.innerHTML,/未発見/);assert.match(root.innerHTML,/発見 \d+\/\d+/);
// First actual acquisition creates a dismissible first-get overlay.
addStack(s,'iron_ore',1,{container:'bag'});ui.render();assert.match(root.innerHTML,/初ゲット/);assert.match(root.innerHTML,/鉄鉱石/);
s.encyclopedia.firstGetQueue=[];
ui.tab='production';ui.productionMode='menu';ui.render();assert.match(root.innerHTML,/鍛冶/);assert.match(root.innerHTML,/調合/);ui.productionMode='alchemy';ui.render();assert.match(root.innerHTML,/手動調合/);assert.match(root.innerHTML,/簡易調合/);assert.match(root.innerHTML,/一括調合/);
// Forge recipe visibility follows discovered ingredient knowledge and manual forge remains locked.
learnItem(s,'softwood','test');ui.productionMode='forge';ui.forgeCategory='weapon';ui.render();assert.match(root.innerHTML,/狩人のナイフ/);assert.match(root.innerHTML,/鍛冶技能 未習得/);assert.match(root.innerHTML,/頼む/);
ui.tab='equipment';ui.render();assert.match(root.innerHTML,/出来栄え/);
startExpedition(s);ui.render();assert.match(root.innerHTML,/村へ戻る/);s.run.location='west_road';ui.render();assert.match(root.innerHTML,/足踏み/);assert.match(root.innerHTML,/map-player-marker/);
ui.runBagOpen=true;ui.render();assert.match(root.innerHTML,/バックパック/);ui.fieldItemStackId='stk_1';ui.render();assert.match(root.innerHTML,/誰に使う/);assert.match(root.innerHTML,/冒険者/);assert.match(root.innerHTML,/ガルド/);ui.runBagOpen=false;ui.fieldItemStackId=null;
s.battle={enemies:[{instanceId:'enemy_1',enemyId:'slime',hp:18,maxHp:18,atk:6,def:1,agi:5,exp:8},{instanceId:'enemy_2',enemyId:'slime',hp:18,maxHp:18,atk:6,def:1,agi:5,exp:8}],over:false,won:false,escaped:false,turn:1,escapeAttempts:0,guards:{},pending:{},reason:'test',log:['スライムたちが あらわれた！']};ui.battleVisible=true;ui.battleMenu='root';ui.render();assert.match(root.innerHTML,/スライム A/);assert.match(root.innerHTML,/スライム B/);assert.match(root.innerHTML,/にげる/);assert.match(root.innerHTML,/33%/);assert.match(root.innerHTML,/さくせん/);
ui.battleMenu='tactics';ui.render();assert.match(root.innerHTML,/さくせん変更/);assert.match(root.innerHTML,/ガンガンいこうぜ/);assert.match(root.innerHTML,/いのちだいじに/);
console.log('ui smoke ok');
