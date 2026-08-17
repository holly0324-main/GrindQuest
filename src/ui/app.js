import {
  adjacentNodes, backpackCapacity, backpacks, buyConsumable, camp, campStatus, command, consumables, craft, currentLocation,
  defeatReturn, derived, enemies, equip, expToNext, fatiguePenalty, finishBattle, harvestResult, items,
  materialCount, materials, perishableCount, perishableSummary, phaseInfo, recipes, resourceStatus, restAtTown, sellAll,
  sellMaterial, sleepDuration, startExpedition, travelTo, upgradeBackpack, useRura, usedCapacity, worldEdges, worldNodes
} from '../core/game.js';

const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const pct=(a,b)=>Math.max(0,Math.min(100,b?100*a/b:0));
const fmtCost=cost=>Object.entries(cost).map(([id,n])=>`${materials[id].icon}${materials[id].name} ${n}`).join(' / ');
const freshnessLabel=n=>n<=15?`あと${n}step ⚠️`:n<=45?`あと${n}step`:`あと${n}step`;

export class AppUI{
  constructor(root,state,onChange){this.root=root;this.state=state;this.onChange=onChange;this.tab='home';this.modal=null;this.minigame=null;this.installPrompt=null;this.toastTimer=null;this.fishTimer=null;this.fishMissTimer=null;this.battleVisible=false;this.battleTransitionTimer=null;}
  setInstallPrompt(e){this.installPrompt=e;this.render();}
  async mutate(fn){const r=fn?.();await this.onChange();this.render();return r;}
  toast(msg){if(!msg)return;const t=document.querySelector('#toast');if(!t)return;t.textContent=msg;t.classList.add('show');clearTimeout(this.toastTimer);this.toastTimer=setTimeout(()=>t.classList.remove('show'),2400);if(this.state.settings.vibrate&&navigator.vibrate)navigator.vibrate(15);}

  render(){
    if(this.state.battle){if(!this.battleVisible){this.battleVisible=true;return this.renderBattleTransition();}return this.renderBattle();}
    this.battleVisible=false;clearTimeout(this.battleTransitionTimer);
    if(this.state.run)return this.renderRun();
    const content=this.tab==='home'?this.home():this.tab==='bag'?this.bag():this.tab==='forge'?this.forge():this.settings();
    this.root.innerHTML=`<div class="shell">${this.topbar()}<main>${content}</main>${this.nav()}</div>${this.overlayHtml()}`;
    this.bindCommon();
  }

  timeText(){const p=phaseInfo(this.state);return `${p.icon} ${this.state.calendar.day}日目 ${p.name} ${p.stepInPhase}/30`;}
  topbar(){return `<header class="topbar"><div class="brand">GRINDQUEST<small>field expedition RPG</small></div><div class="time-pill">${this.timeText()}</div></header>`;}
  nav(){const tabs=[['home','🏘️','村'],['bag','🎒','持ち物'],['forge','🔨','鍛冶'],['settings','⚙️','設定']];return `<nav class="bottom-nav">${tabs.map(([id,ic,l])=>`<button class="nav-btn ${this.tab===id?'active':''}" data-tab="${id}"><span>${ic}</span>${l}</button>`).join('')}</nav>`;}

  fatigueChip(){const stacks=this.state.condition?.fatigueStacks||0,awake=this.state.condition?.awakeSteps||0;if(stacks)return `<span class="fatigue-chip danger-chip">🥱 徹夜疲労 -${stacks*10}%</span>`;if(awake>=120)return `<span class="fatigue-chip warn-chip">🥱 連続覚醒 ${awake}step</span>`;return `<span class="fatigue-chip">覚醒 ${awake}step</span>`;}
  playerCard(){const p=this.state.player,d=derived(this.state),need=expToNext(p.level),phase=phaseInfo(this.state);return `<section class="hero-card">
    <div class="row"><div class="avatar">🧑‍⚔️</div><div class="grow"><h1>${esc(p.name)} <span class="tiny muted">Lv.${p.level}</span></h1><div class="tiny muted">${items[p.equipment.weapon].name} / ${items[p.equipment.armor].name}</div></div><b>${this.state.gold}G</b></div>
    <div class="section"><div class="tiny row between"><span>HP ${p.hp}/${d.maxHp}</span><span>MP ${p.mp}/${d.maxMp}</span></div><div class="bar"><i style="width:${pct(p.hp,d.maxHp)}%"></i></div><div class="bar mp"><i style="width:${pct(p.mp,d.maxMp)}%"></i></div><div class="tiny muted top-gap">EXP ${p.exp}/${need}</div><div class="bar exp"><i style="width:${pct(p.exp,need)}%"></i></div></div>
    <div class="stats"><div class="stat"><b>${d.atk}</b><span>こうげき</span></div><div class="stat"><b>${d.def}</b><span>しゅび</span></div><div class="stat"><b>${backpackCapacity(this.state)}</b><span>バッグ容量</span></div></div>
    <div class="calendar-strip"><div><b>${phase.icon} ${this.state.calendar.day}日目 ${phase.name}</b><span>あと${phase.remaining}stepで次フェーズ</span></div>${this.fatigueChip()}</div>
  </section>`;}

  home(){const nextPack=this.nextPack(),sleep=sleepDuration(this.state);return `${this.playerCard()}
    <section class="section"><div class="section-title"><h2>村から出る</h2><span class="tiny muted">場所は固定、出来事は不定</span></div><div class="card"><p class="tiny muted">村の周辺を歩き、同じ薬草地・採掘場・釣り場を巡る。戦闘の1ターンも1ステップとして世界時計が進む。</p><button class="btn primary big" data-action="start-expedition">🗺️ 周辺探索へ出発</button></div></section>
    <section class="section"><div class="section-title"><h2>家</h2></div><div class="card"><div class="row between"><div><b>しっかり眠る</b><div class="tiny muted">今なら${sleep}ステップ睡眠。最低20step眠り、次かその次の時間帯境界で起きる。HP/MP全回復・徹夜疲労解除。</div></div><button class="btn" data-action="town-rest">🛏️ 寝る</button></div></div></section>
    <section class="section"><div class="section-title"><h2>道具屋</h2><span class="tiny muted">保存性と重量にお金を払う</span></div><div class="cards">${Object.values(consumables).map(c=>`<div class="card shop-row"><div class="item-icon">${c.icon}</div><div class="grow"><b>${c.name}</b><div class="tiny muted">${c.desc}</div><div class="tiny">所持 ${this.state.consumables[c.id]||0} / 容量${c.bulk}${c.reusable?' / 再使用可':''}</div></div><button class="btn small" data-action="buy" data-id="${c.id}" ${(c.max&&(this.state.consumables[c.id]||0)>=c.max)?'disabled':''}>${c.price}G</button></div>`).join('')}
      <div class="card shop-row"><div class="item-icon">${backpacks[this.state.backpack].icon}</div><div class="grow"><b>${backpacks[this.state.backpack].name}</b><div class="tiny muted">現在容量 ${backpackCapacity(this.state)}</div>${nextPack?`<div class="tiny">次: ${nextPack.name} / 容量${nextPack.capacity}</div>`:'<div class="tiny">最大サイズ</div>'}</div>${nextPack?`<button class="btn small" data-action="upgrade-pack">${nextPack.price}G</button>`:'<span class="tag">MAX</span>'}</div>
    </div></section>
    <section class="section"><div class="section-title"><h2>最近の記録</h2></div><div class="card">${this.state.log.slice(0,5).map(x=>`<div class="line-item"><span class="tiny">${esc(x)}</span></div>`).join('')}</div></section>`;}

  nextPack(){const ids=['cheap','canvas','explorer'],i=ids.indexOf(this.state.backpack);return i>=0?backpacks[ids[i+1]]:null;}
  freshMap(container='storage'){return Object.fromEntries(perishableSummary(this.state,container).map(x=>[x.id,x]));}

  bag(){const fresh=this.freshMap('storage'),mats=Object.entries(materials).filter(([id])=>materialCount(this.state,id)>0),owned=Object.entries(this.state.ownedItems).filter(([,n])=>n>0);return `<div class="section-title"><h2>倉庫・売却</h2><span class="pill">${this.state.gold}G</span></div><div class="card"><div class="row between"><div><b>素材は主な収入源</b><div class="tiny muted">生鮮品は村に戻っても寿命が止まらない。売る・使う判断も時間との勝負。</div></div><button class="btn small" data-action="sell-all" ${mats.length?'':'disabled'}>全部売る</button></div></div>
    <section class="section"><div class="cards">${mats.length?mats.map(([id,m])=>{const f=fresh[id],n=materialCount(this.state,id);return `<div class="card shop-row ${f&&f.remaining<=15?'fresh-critical':''}"><div class="item-icon">${m.icon}</div><div class="grow"><b>${m.name} ×${n}</b><div class="tiny muted">売値 ${m.value}G / 容量${m.bulk}</div>${f?`<div class="freshness ${f.remaining<=15?'critical':''}">⏳ 最短 ${freshnessLabel(f.remaining)}</div>`:''}</div><button class="btn small" data-action="sell" data-id="${id}">1個売る</button></div>`}).join(''):'<div class="card empty">売れる素材はまだない。</div>'}</div></section>
    <section class="section"><div class="section-title"><h2>装備</h2></div><div class="cards">${owned.map(([id,n])=>{const it=items[id],eq=this.state.player.equipment[it.slot]===id;return `<div class="card shop-row"><div class="item-icon">${it.icon}</div><div class="grow"><b>${it.name}${n>1?` ×${n}`:''}</b><div class="tiny muted">${it.desc}</div></div>${eq?'<span class="tag">装備中</span>':`<button class="btn small" data-action="equip" data-id="${id}">装備</button>`}</div>`}).join('')}</div></section>`;}

  forge(){return `<div class="section-title"><h2>鍛冶屋</h2><span class="tiny muted">時間素材システムは調合にも流用予定</span></div><div class="cards">${recipes.map(r=>{const it=items[r.item];return `<div class="card recipe"><div class="item-icon">${it.icon}</div><div class="grow"><h3>${it.name}</h3><div class="tiny muted">${it.desc}</div><div class="tiny top-gap">${fmtCost(r.cost)}</div></div><button class="btn small" data-action="craft" data-id="${r.id}">作る</button></div>`}).join('')}</div>`;}

  settings(){return `<div class="section-title"><h2>設定・セーブ</h2></div><div class="cards">${this.installPrompt?`<div class="card"><h3>📲 ホーム画面に追加</h3><button class="btn primary top-gap" data-action="install">インストール</button></div>`:''}<div class="card"><h3>放置探索</h3><p class="tiny muted">v0.4でも封印中。コードとセーブ領域だけ残している。</p></div><div class="card"><h3>時間管理</h3><p class="tiny muted">移動・戦闘ターン・採集・睡眠を同じステップ時計で管理。生鮮品の腐敗と、将来の調合/熟成タイマーも同じ時計を参照する。</p></div><div class="card"><h3>セーブデータ</h3><div class="cards top-gap"><button class="btn" data-action="export">セーブを書き出す</button><label class="btn center">セーブを読み込む<input type="file" id="import-file" accept="application/json" hidden></label><button class="btn danger" data-action="reset">最初からやり直す</button></div></div></div>`;}

  renderRun(){const run=this.state.run,p=this.state.player,d=derived(this.state),loc=currentLocation(this.state),phase=phaseInfo(this.state),used=usedCapacity(this.state),cap=backpackCapacity(this.state),adj=new Set(adjacentNodes(loc.id).map(x=>x.id)),resource=resourceStatus(this.state),campInfo=campStatus(this.state),fresh=perishableSummary(this.state,'bag');
    const edges=worldEdges.map(e=>{const a=worldNodes[e.a],b=worldNodes[e.b];return `<line x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" class="field-edge"/>`;}).join('');
    const nodes=Object.values(worldNodes).map(n=>{const can=adj.has(n.id),current=n.id===loc.id,visited=run.visited.includes(n.id),camp=n.campSafety==='safe'?' ⛺':n.campSafety==='semi'?' ⚠️':'';return `<button class="field-node ${can?'reachable':''} ${current?'current-location':''} ${visited?'visited':''}" style="left:${n.x}%;top:${n.y}%" data-action="travel" data-id="${n.id}" ${can?'':'disabled'}><span>${n.icon}</span><small>${n.name}${camp}</small></button>`;}).join('');
    const cargo=Object.entries(run.cargo).filter(([,n])=>n>0).map(([id,n])=>`${materials[id].icon}${n}`).concat(fresh.map(x=>`${materials[x.id].icon}${x.count}(${x.remaining}step)`)).join(' ');
    this.root.innerHTML=`<div class="shell run-shell"><header class="topbar"><div class="brand">${loc.icon} ${loc.name}<small>${loc.desc}</small></div><div class="time-pill">${this.timeText()}</div></header><main>
      <section class="expedition-hud card"><div class="row between tiny"><b>HP ${p.hp}/${d.maxHp} / MP ${p.mp}/${d.maxMp}</b><b>🎒 ${used}/${cap}</b></div><div class="bar top-gap"><i style="width:${pct(p.hp,d.maxHp)}%"></i></div><div class="bar mp"><i style="width:${pct(p.mp,d.maxMp)}%"></i></div><div class="row between tiny top-gap"><span>🌿${perishableCount(this.state,'fresh_herb','bag')}　🧪${this.state.consumables.potion||0}　🌀${this.state.consumables.rura_potion||0}　⛺${this.state.consumables.camp_set||0}</span><span>未確定EXP +${run.pendingExp}</span></div><div class="tiny muted top-gap">荷物: ${cargo||'なし'}</div><div class="row between top-gap"><span class="tiny muted">1戦闘ターン = 1step</span>${this.fatigueChip()}</div></section>
      ${run.lastEvent?`<section class="event-card"><b>出来事</b><div>${esc(run.lastEvent)}</div></section>`:''}
      <section class="section"><div class="section-title"><h2>周辺地図</h2><span class="tiny muted">場所を簡略化した地図</span></div><div class="map-viewport" id="map-viewport"><div class="field-map"><svg viewBox="0 0 100 100" preserveAspectRatio="none">${edges}</svg>${nodes}</div></div></section>
      <section class="section card location-card"><div class="row between"><div><h3>${loc.icon} ${loc.name}</h3><div class="tiny muted">${loc.desc}</div></div><span class="tag">${loc.zone}</span></div>${this.locationActions(resource,campInfo)}</section>
      <section class="section card"><div class="row between"><div><b>帰るには</b><div class="tiny muted">村まで道を戻る。帰路でも時間が進み、戦闘が起こり得る。</div></div><button class="btn magic" data-action="rura" ${(this.state.consumables.rura_potion||0)>0?'':'disabled'}>🌀 ルーラ</button></div></section>
    </main></div>${this.overlayHtml()}`;
    this.bindCommon();setTimeout(()=>this.centerMap(),0);
  }

  locationActions(rs,cs){let out='';if(rs){if(rs.used)out+='<div class="tiny muted top-gap">この場所の採集ポイントは今回の探索ですでに利用した。</div>';else if(rs.kind==='herb')out+=`<button class="btn good top-gap" data-action="gather-herb">🌿 薬草を摘む</button>`;else{const labels={mining:'⛏️ 採掘する',fishing:'🎣 釣りをする',woodcut:'🪓 木を切る'};out+=`<button class="btn primary top-gap" data-action="start-mini" data-kind="${rs.kind}">${labels[rs.kind]}</button>`;}}
    if(cs?.allowed){const safe=cs.safety==='safe';out+=`<div class="camp-zone ${safe?'safe':'semi'}"><div><b>${safe?'🟢 セーフティエリア':'🟡 準セーフティエリア'}</b><div class="tiny muted">${safe?'安全に野営できる。':'野営中に魔物の襲撃を受けることがある。'}</div></div><button class="btn ${safe?'good':'warn-btn'} small" data-action="camp" ${cs.hasSet?'':'disabled'}>⛺ キャンプ</button></div>${cs.hasSet?'':'<div class="tiny muted">キャンプセットが必要（容量5）。</div>'}`;}
    if(!out)out='<div class="tiny muted top-gap">周囲を調べながら次の場所へ進める。</div>';return out;
  }

  centerMap(){const vp=document.querySelector('#map-viewport'),node=document.querySelector('.current-location');if(!vp||!node)return;vp.scrollTo({left:Math.max(0,node.offsetLeft-vp.clientWidth/2),top:Math.max(0,node.offsetTop-vp.clientHeight/2),behavior:'instant'});}

  renderBattleTransition(){clearTimeout(this.battleTransitionTimer);this.root.querySelector('.encounter-transition-overlay')?.remove();const overlay=document.createElement('div');overlay.className='encounter-transition-overlay';overlay.innerHTML='<div class="encounter-flash">魔物の気配……</div><div class="encounter-blackout"></div>';this.root.appendChild(overlay);this.battleTransitionTimer=setTimeout(()=>{if(this.state.battle)this.renderBattle();},620);}
  renderBattle(){const b=this.state.battle,e=enemies[b.enemyId],p=this.state.player,d=derived(this.state),phase=phaseInfo(this.state),herbs=perishableCount(this.state,'fresh_herb','bag');this.root.innerHTML=`<div class="battle-shell retro-battle">
    <div class="battle-topline"><span>${currentLocation(this.state).name}</span><span>${phase.icon} ${this.state.calendar.day}日目 ${phase.name} ${phase.stepInPhase}/30</span></div>
    <main class="battle-main"><section class="battle-scene"><div class="enemy-name-window rpg-window"><b>${e.name}</b><span>HP ${b.enemyHp}/${b.enemyMaxHp}</span><div class="retro-hp"><i style="width:${pct(b.enemyHp,b.enemyMaxHp)}%"></i></div></div><div class="enemy-sprite retro-enemy">${e.icon}</div><div class="battle-ground"></div></section>
      <section class="battle-status rpg-window"><div class="status-name"><b>${p.name}</b><small>Lv.${p.level}</small></div><div><span>HP</span><b>${p.hp}/${d.maxHp}</b><span>MP</span><b>${p.mp}/${d.maxMp}</b></div><div><span>TURN</span><b>${b.turn}</b><span>STEP</span><b>${this.state.calendar.totalSteps}</b></div></section>
      <section class="battle-message rpg-window">${b.log.slice(-4).map((x,i)=>`<div class="${i===b.log.slice(-4).length-1?'latest':''}">${esc(x)}</div>`).join('')}</section>
      ${b.over?this.battleEnd():`<section class="retro-command rpg-window"><div class="command-title">どうする？ <small>1ターン = 1step</small></div><div class="retro-command-grid"><button data-cmd="attack">▶ こうげき</button><button data-cmd="skill">　とくぎ <small>MP3</small></button><button data-cmd="heal">　じゅもん <small>MP4</small></button><button data-cmd="defend">　ぼうぎょ</button><button data-cmd="herb">　やくそう <small>×${herbs}</small></button><button data-cmd="potion">　ポーション <small>×${this.state.consumables.potion||0}</small></button></div></section>`}
    </main></div>${this.overlayHtml()}`;this.bindCommon();}
  battleEnd(){return this.state.battle.won?`<section class="retro-command rpg-window"><div class="command-title">戦闘終了</div><button class="retro-wide" data-action="finish-battle">▶ 周囲へ戻る</button></section>`:`<section class="retro-command rpg-window danger-window"><div class="command-title">ちからつきた……</div><button class="retro-wide" data-action="defeat-return">▶ 村へ運ばれる</button></section>`;}

  startMini(kind){clearTimeout(this.fishTimer);clearTimeout(this.fishMissTimer);if(kind==='mining'){this.minigame={kind,start:performance.now()};this.render();return;}if(kind==='fishing'){this.minigame={kind,stage:'waiting'};this.render();this.fishTimer=setTimeout(()=>{if(this.minigame?.kind==='fishing'&&this.minigame.stage==='waiting'){this.minigame.stage='bite';this.render();this.fishMissTimer=setTimeout(()=>{if(this.minigame?.kind==='fishing'&&this.minigame.stage==='bite'){this.resolveMini(.05,'魚に逃げられた。');}},850);}},800+Math.random()*1700);return;}if(kind==='woodcut'){this.minigame={kind,next:'left',hits:0,errors:0,start:performance.now()};this.render();}}
  miningHit(){if(this.minigame?.kind!=='mining')return;const t=(performance.now()-this.minigame.start)%1600,pos=t/1600,quality=1-Math.min(1,Math.abs(pos-.5)*2);this.resolveMini(quality);}
  fishingTap(){if(this.minigame?.kind!=='fishing')return;if(this.minigame.stage==='bite')this.resolveMini(.9);else this.resolveMini(.08,'早合わせで魚が逃げた。');}
  woodTap(side){const m=this.minigame;if(m?.kind!=='woodcut')return;if(side===m.next){m.hits++;m.next=side==='left'?'right':'left';}else m.errors++;if(m.hits>=8){const sec=(performance.now()-m.start)/1000,quality=Math.max(.15,1-(Math.max(0,sec-3)*.08)-m.errors*.14);this.resolveMini(quality);return;}this.render();}
  async resolveMini(quality,custom){clearTimeout(this.fishTimer);clearTimeout(this.fishMissTimer);const r=harvestResult(this.state,quality);this.minigame=null;await this.onChange();this.render();this.toast(custom||r.msg);}

  miniHtml(){const m=this.minigame;if(!m)return'';if(m.kind==='mining')return `<div class="modal-backdrop"><div class="modal"><h2>⛏️ 採掘</h2><p class="tiny muted">白い印の中央でつるはしを振る。採掘には5stepかかる。</p><div class="timing-bar"><div class="sweet"></div><div class="moving-marker"></div></div><button class="btn primary big" data-action="mine-hit">振り下ろす！</button></div></div>`;if(m.kind==='fishing')return `<div class="modal-backdrop"><div class="modal"><h2>🎣 釣り</h2><div class="fish-water">${m.stage==='bite'?'<div class="bite">！！！</div>':'<div class="float">●</div>'}</div><p class="tiny muted">浮きが沈んだ瞬間に合わせる。釣りには4stepかかる。</p><button class="btn ${m.stage==='bite'?'good':'primary'} big" data-action="fish-tap">${m.stage==='bite'?'今だ！':'合わせる'}</button></div></div>`;if(m.kind==='woodcut')return `<div class="modal-backdrop"><div class="modal"><h2>🪓 木こり</h2><p class="tiny muted">左右交互に8回。伐採には5stepかかる。</p><div class="wood-progress">${'▰'.repeat(m.hits)}${'▱'.repeat(8-m.hits)}</div><div class="commands"><button class="btn ${m.next==='left'?'primary':''}" data-action="wood-hit" data-side="left">← 左</button><button class="btn ${m.next==='right'?'primary':''}" data-action="wood-hit" data-side="right">右 →</button></div></div></div>`;return'';}

  overlayHtml(){return this.miniHtml()+this.modalHtml();}
  modalHtml(){if(!this.modal)return'';const m=this.modal;if(m.type==='return'){const cargo=Object.entries(m.data.cargo||{}).filter(([,n])=>n>0).map(([id,n])=>`<div class="line-item"><span>${materials[id].icon} ${materials[id].name}</span><b>×${n}</b></div>`).join(''),fresh=Object.entries(m.data.fresh||{}).filter(([,n])=>n>0).map(([id,n])=>`<div class="line-item"><span>${materials[id].icon} ${materials[id].name}</span><b>×${n}（寿命継続）</b></div>`).join('');return `<div class="modal-backdrop"><div class="modal"><h2>${m.data.method==='rura'?'🌀 帰還':'🏘️ 帰村'}</h2><div class="card"><div class="line-item"><span>確定EXP</span><b>+${m.data.exp||0}</b></div>${cargo}${fresh}${(!cargo&&!fresh)?'<div class="empty">持ち帰り素材なし</div>':''}</div><button class="btn primary top-gap" data-action="close-modal">閉じる</button></div></div>`;}if(m.type==='lost'){return `<div class="modal-backdrop"><div class="modal"><h2>💀 探索失敗</h2><p class="tiny muted">探索中の素材・バッグ内の生鮮品・未確定EXPを失った。HPは1のまま。</p><button class="btn top-gap" data-action="close-modal">村へ</button></div></div>`;}return'';}

  bindCommon(){
    this.root.querySelectorAll('[data-tab]').forEach(el=>el.addEventListener('click',()=>{this.tab=el.dataset.tab;this.render();}));
    this.root.querySelectorAll('[data-action="start-expedition"]').forEach(el=>el.addEventListener('click',()=>this.mutate(()=>{const r=startExpedition(this.state);this.toast(r.msg);}))); 
    this.root.querySelectorAll('[data-action="travel"]').forEach(el=>el.addEventListener('click',()=>this.mutate(()=>{const r=travelTo(this.state,el.dataset.id);if(r.returned){this.modal={type:'return',data:r.report};this.tab='home';}this.toast(r.msg);}))); 
    this.root.querySelectorAll('[data-action="rura"]').forEach(el=>el.addEventListener('click',()=>this.mutate(()=>{const r=useRura(this.state);if(r.ok){this.modal={type:'return',data:r.report};this.tab='home';}this.toast(r.msg);}))); 
    this.root.querySelectorAll('[data-action="camp"]').forEach(el=>el.addEventListener('click',()=>this.mutate(()=>{const r=camp(this.state);this.toast(r.msg);}))); 
    this.root.querySelectorAll('[data-action="gather-herb"]').forEach(el=>el.addEventListener('click',()=>this.mutate(()=>{const r=harvestResult(this.state,1);this.toast(r.msg);}))); 
    this.root.querySelectorAll('[data-action="start-mini"]').forEach(el=>el.addEventListener('click',()=>this.startMini(el.dataset.kind)));
    this.root.querySelectorAll('[data-action="mine-hit"]').forEach(el=>el.addEventListener('click',()=>this.miningHit()));
    this.root.querySelectorAll('[data-action="fish-tap"]').forEach(el=>el.addEventListener('click',()=>this.fishingTap()));
    this.root.querySelectorAll('[data-action="wood-hit"]').forEach(el=>el.addEventListener('click',()=>this.woodTap(el.dataset.side)));
    this.root.querySelectorAll('[data-cmd]').forEach(el=>el.addEventListener('click',()=>this.mutate(()=>command(this.state,el.dataset.cmd))));
    this.root.querySelectorAll('[data-action="finish-battle"]').forEach(el=>el.addEventListener('click',()=>this.mutate(()=>{const r=finishBattle(this.state);this.toast(r.msg);}))); 
    this.root.querySelectorAll('[data-action="defeat-return"]').forEach(el=>el.addEventListener('click',()=>this.mutate(()=>{const r=defeatReturn(this.state);if(r.ok){this.modal={type:'lost',data:r.lost};this.tab='home';}})));
    this.root.querySelectorAll('[data-action="town-rest"]').forEach(el=>el.addEventListener('click',()=>this.mutate(()=>{const r=restAtTown(this.state);this.toast(r.msg);}))); 
    this.root.querySelectorAll('[data-action="buy"]').forEach(el=>el.addEventListener('click',()=>this.mutate(()=>{const r=buyConsumable(this.state,el.dataset.id);this.toast(r.msg);}))); 
    this.root.querySelectorAll('[data-action="upgrade-pack"]').forEach(el=>el.addEventListener('click',()=>this.mutate(()=>{const r=upgradeBackpack(this.state);this.toast(r.msg);}))); 
    this.root.querySelectorAll('[data-action="sell"]').forEach(el=>el.addEventListener('click',()=>this.mutate(()=>{const r=sellMaterial(this.state,el.dataset.id,1);this.toast(r.msg);}))); 
    this.root.querySelectorAll('[data-action="sell-all"]').forEach(el=>el.addEventListener('click',()=>this.mutate(()=>{const r=sellAll(this.state);this.toast(r.msg);}))); 
    this.root.querySelectorAll('[data-action="craft"]').forEach(el=>el.addEventListener('click',()=>this.mutate(()=>{const r=craft(this.state,el.dataset.id);this.toast(r.msg);}))); 
    this.root.querySelectorAll('[data-action="equip"]').forEach(el=>el.addEventListener('click',()=>this.mutate(()=>{if(equip(this.state,el.dataset.id))this.toast('装備した。');}))); 
    this.root.querySelectorAll('[data-action="close-modal"]').forEach(el=>el.addEventListener('click',()=>{this.modal=null;this.render();}));
    this.root.querySelectorAll('[data-action="export"]').forEach(el=>el.addEventListener('click',()=>this.exportSave()));
    this.root.querySelectorAll('[data-action="install"]').forEach(el=>el.addEventListener('click',async()=>{if(!this.installPrompt)return;await this.installPrompt.prompt();this.installPrompt=null;this.render();}));
    const imp=this.root.querySelector('#import-file');if(imp)imp.addEventListener('change',e=>this.importSave(e.target.files?.[0]));
    this.root.querySelectorAll('[data-action="reset"]').forEach(el=>el.addEventListener('click',()=>{if(confirm('セーブデータを完全に消して最初から始めますか？'))window.dispatchEvent(new CustomEvent('gq-reset'));}));
  }

  exportSave(){const blob=new Blob([JSON.stringify(this.state,null,2)],{type:'application/json'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`grindquest-save-${new Date().toISOString().slice(0,10)}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);}
  async importSave(file){if(!file)return;try{const data=JSON.parse(await file.text());window.dispatchEvent(new CustomEvent('gq-import',{detail:data}));this.toast('セーブを読み込んだ。');}catch{this.toast('セーブファイルを読み込めなかった。');}}
}
