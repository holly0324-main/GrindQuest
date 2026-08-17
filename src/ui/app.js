import {
  availableNodeIds, campChoice, claimIdle, command, craft, defeatReturn, derived,
  dungeons, enemies, enterNode, equip, expToNext, finishBattleNode, idleStatus,
  items, materials, recipes, restAtTown, retreat, startDungeon, startIdle
} from '../core/game.js';

const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const pct=(a,b)=>Math.max(0,Math.min(100,b?100*a/b:0));
const fmtTime=ms=>{const s=Math.max(0,Math.floor(ms/1000)),h=String(Math.floor(s/3600)).padStart(2,'0'),m=String(Math.floor((s%3600)/60)).padStart(2,'0'),x=String(s%60).padStart(2,'0');return `${h}:${m}:${x}`;};
const nodeMeta={start:['🚪','入口'],battle:['⚔️','戦闘'],elite:['☠️','強敵'],forage:['⛏️','採取'],camp:['⛺','休憩'],boss:['👑','ボス']};

export class AppUI {
  constructor(root,state,onChange){this.root=root;this.state=state;this.onChange=onChange;this.tab='home';this.modal=null;this.installPrompt=null;this.tick=null;}
  setInstallPrompt(e){this.installPrompt=e;this.render();}
  async mutate(fn){const r=fn?.();await this.onChange();this.render();return r;}
  toast(msg){if(!msg)return;const t=document.querySelector('#toast');if(!t)return;t.textContent=msg;t.classList.add('show');clearTimeout(this.toastTimer);this.toastTimer=setTimeout(()=>t.classList.remove('show'),1800);if(this.state.settings.vibrate&&navigator.vibrate)navigator.vibrate(15);}

  render(){
    clearInterval(this.tick);
    if(this.state.battle)return this.renderBattle();
    if(this.state.run)return this.renderRun();
    const content=this.tab==='home'?this.home():this.tab==='dungeon'?this.dungeon():this.tab==='forge'?this.forge():this.tab==='bag'?this.bag():this.settings();
    this.root.innerHTML=`<div class="shell">${this.topbar()}<main>${content}</main>${this.nav()}</div>${this.modalHtml()}`;
    this.bindCommon();
    if(this.state.idle){this.tick=setInterval(()=>this.refreshIdleClock(),1000);this.refreshIdleClock();}
  }

  topbar(){return `<header class="topbar"><div class="brand">GRINDQUEST<small>mobile dungeon grind RPG</small></div><div class="pill">Lv.${this.state.player.level}</div></header>`;}
  nav(){const tabs=[['home','🏠','ホーム'],['dungeon','🗺️','冒険'],['forge','🔨','鍛冶'],['bag','🎒','装備'],['settings','⚙️','設定']];return `<nav class="bottom-nav">${tabs.map(([id,ic,l])=>`<button class="nav-btn ${this.tab===id?'active':''}" data-tab="${id}"><span>${ic}</span>${l}</button>`).join('')}</nav>`;}

  playerCard(){
    const p=this.state.player,d=derived(this.state),need=expToNext(p.level);
    return `<section class="hero-card"><div class="row"><div class="avatar">🧑‍⚔️</div><div style="flex:1"><h1>${esc(p.name)} <span class="tiny muted">Lv.${p.level}</span></h1><div class="tiny muted">${items[p.equipment.weapon].name} / ${items[p.equipment.armor].name}</div></div></div>
      <div class="section"><div class="tiny row between"><span>HP ${p.hp}/${d.maxHp}</span><span>MP ${p.mp}/${d.maxMp}</span></div><div class="bar"><i style="width:${pct(p.hp,d.maxHp)}%"></i></div><div class="bar mp" style="margin-top:5px"><i style="width:${pct(p.mp,d.maxMp)}%"></i></div><div class="tiny muted" style="margin-top:8px">EXP ${p.exp}/${need}</div><div class="bar exp"><i style="width:${pct(p.exp,need)}%"></i></div></div>
      <div class="stats"><div class="stat"><b>${d.atk}</b><span>こうげき</span></div><div class="stat"><b>${d.def}</b><span>しゅび</span></div><div class="stat"><b>${Object.values(this.state.clears).reduce((a,b)=>a+b,0)}</b><span>踏破回数</span></div></div>
      <button class="btn" data-action="town-rest" style="margin-top:12px">🛏️ 町で休む（HP/MP全回復）</button>
      <div class="tiny muted" style="margin-top:7px">※ 自動回復はしません。探索前後も現在HP/MPを維持します。</div>
    </section>`;
  }

  home(){
    const idle=this.state.idle?this.idleCard():`<div class="card"><div class="row between"><div><h3>放置探索</h3><div class="muted tiny">経過時間から素材とEXPを計算。HP/MPは変化しません。</div></div><div class="item-icon">⏳</div></div><button class="btn primary" data-tab="dungeon" style="margin-top:12px">探索先を選ぶ</button></div>`;
    const recent=this.state.log.slice(0,5).map(x=>`<div class="line-item"><span class="tiny">${esc(x)}</span></div>`).join('');
    return `${this.playerCard()}<section class="section"><div class="section-title"><h2>探索隊</h2><span class="tiny muted">最大8時間</span></div>${idle}</section><section class="section"><div class="section-title"><h2>冒険記録</h2></div><div class="card">${recent||'<div class="empty">まだ記録がない。</div>'}</div></section>`;
  }

  idleCard(){const s=idleStatus(this.state);return `<div class="card"><div class="row between"><div><h3>${s.d.icon} ${s.d.name}</h3><div class="muted tiny">${s.cycles} 周完了 / 1周 ${s.d.cycleMinutes}分</div></div><span class="tag">探索中</span></div><div class="idle-clock" id="idle-clock">00:00:00</div><div class="tiny muted" id="idle-next"></div><button class="btn good" data-action="claim-idle" ${s.cycles<1?'disabled':''} style="margin-top:12px">成果を受け取る</button></div>`;}

  dungeon(){
    return `<div class="section-title"><h2>ダンジョン</h2><span class="tiny muted">手動は分岐マップ制</span></div><div class="card map-rule"><b>🧭 手動探索のルール</b><div class="tiny muted" style="margin-top:6px">戦果は探索中は未確定。好きな地点で撤退すれば持ち帰れるが、全滅すると未確定分を失う。HP/MPは戦闘後に回復しない。</div></div><div class="cards" style="margin-top:10px">${Object.values(dungeons).map(d=>{const locked=this.state.player.level<d.unlockLevel,clear=this.state.clears[d.id]||0;return `<div class="card ${locked?'locked':''}"><div class="row between"><div class="row"><div class="item-icon">${d.icon}</div><div><h3>${d.name}</h3><div class="tiny muted">推奨Lv.${d.recommended} ・ 放置${d.cycleMinutes}分/周</div></div></div><span class="tag">踏破 ${clear}</span></div><p class="muted tiny" style="margin:10px 0">${d.desc}</p>${locked?`<div class="tiny muted">🔒 Lv.${d.unlockLevel}で解放</div>`:`<div class="card-grid"><button class="btn primary" data-action="start-dungeon" data-id="${d.id}">マップへ潜る</button><button class="btn" data-action="start-idle" data-id="${d.id}" ${this.state.idle?'disabled':''}>放置探索</button></div>`}</div>`}).join('')}</div>`;
  }

  forge(){return `<div class="section-title"><h2>鍛冶屋</h2><span class="tiny muted">素材だけで作成</span></div><div class="cards">${recipes.map(r=>{const it=items[r.item],cost=Object.entries(r.cost).map(([id,n])=>`${materials[id].icon}${materials[id].name} ${this.state.inventory[id]||0}/${n}`).join('　');return `<div class="card recipe"><div class="item-icon">${it.icon}</div><div><h3>${it.name}</h3><div class="tiny muted">ATK +${it.atk||0} / DEF +${it.def||0}${it.hp?` / HP +${it.hp}`:''}${it.mp?` / MP +${it.mp}`:''}</div><div class="tiny" style="margin-top:6px">${cost}</div></div><div class="recipe-actions"><button class="btn primary" data-action="craft" data-id="${r.id}">作る</button></div></div>`}).join('')}</div>`;}

  bag(){const owned=Object.entries(this.state.ownedItems).filter(([,n])=>n>0),mats=Object.entries(materials).map(([id,m])=>`<div class="line-item"><div class="row"><div class="item-icon">${m.icon}</div><span>${m.name}</span></div><b>${this.state.inventory[id]||0}</b></div>`).join('');return `<div class="section-title"><h2>装備</h2></div><div class="cards">${owned.map(([id,n])=>{const it=items[id],eq=this.state.player.equipment[it.slot]===id;return `<div class="card"><div class="row"><div class="item-icon">${it.icon}</div><div style="flex:1"><h3>${it.name} ${n>1?`×${n}`:''}</h3><div class="tiny muted">${it.desc}</div></div>${eq?'<span class="tag">装備中</span>':`<button class="btn small" data-action="equip" data-id="${id}">装備</button>`}</div></div>`}).join('')}</div><section class="section"><div class="section-title"><h2>素材</h2></div><div class="card">${mats}</div></section>`;}

  settings(){return `<div class="section-title"><h2>設定・セーブ</h2></div><div class="cards">${this.installPrompt?`<div class="card install-tip"><h3>📲 ホーム画面に追加</h3><p class="tiny muted">インストールすると全画面で起動できます。</p><button class="btn primary" data-action="install">インストール</button></div>`:''}<div class="card"><h3>セーブデータ</h3><p class="tiny muted">端末内に自動保存。機種変更用にJSONを書き出せます。</p><div class="cards"><button class="btn" data-action="export">セーブを書き出す</button><label class="btn" style="display:grid;place-items:center">セーブを読み込む<input type="file" id="import-file" accept="application/json" hidden></label><button class="btn danger" data-action="reset">最初からやり直す</button></div></div></div>`;}

  renderRun(){
    const run=this.state.run,d=dungeons[run.dungeonId],p=this.state.player,st=derived(this.state),available=new Set(availableNodeIds(this.state));
    const nodeById=Object.fromEntries(run.map.map(n=>[n.id,n]));
    const edges=run.map.flatMap(n=>n.next.map(to=>{const t=nodeById[to],active=n.id===run.currentNode&&available.has(to),used=n.visited&&t?.visited;return `<line x1="${n.x}" y1="${n.y}" x2="${t.x}" y2="${t.y}" class="map-edge ${active?'active':''} ${used?'used':''}"/>`;})).join('');
    const nodes=run.map.map(n=>{const [icon,label]=nodeMeta[n.type]||['?','?'],can=available.has(n.id),current=n.id===run.currentNode,done=n.resolved&&n.visited;return `<button class="map-node type-${n.type} ${can?'available':''} ${current?'current':''} ${done?'done':''}" style="left:${n.x}%;top:${n.y}%" data-action="map-node" data-id="${n.id}" ${can?'':'disabled'} aria-label="${label}" title="${label}"><span>${icon}</span><small>${label}</small></button>`;}).join('');
    const current=nodeById[run.currentNode],camp=current?.type==='camp'&&!current.resolved;
    const cargoCount=Object.values(run.rewards.drops).reduce((a,b)=>a+b,0);
    this.root.innerHTML=`<div class="shell run-shell"><header class="topbar"><button class="btn small" data-action="retreat">← 撤退</button><div class="brand">${d.icon} ${d.name}<small>戦果を確定して帰還できる</small></div><div class="pill">HP ${p.hp}/${st.maxHp}</div></header><main>
      <div class="run-status card"><div class="row between"><div><b>未確定の戦果</b><div class="tiny muted">全滅すると失う</div></div><div class="row"><span class="tag">EXP +${run.rewards.exp}</span><span class="tag">素材 ${cargoCount}</span></div></div><div class="tiny" style="margin-top:8px">MP ${p.mp}/${st.maxMp}</div></div>
      ${camp?`<section class="section card camp-choice"><h3>⛺ 休憩地点</h3><div class="tiny muted">ここでは自分で回復先を選ぶ。両方は回復できない。</div><div class="card-grid" style="margin-top:10px"><button class="btn good" data-action="camp" data-kind="hp">HPを38%回復</button><button class="btn magic" data-action="camp" data-kind="mp">MPを42%回復</button></div></section>`:''}
      <section class="section"><div class="section-title"><h2>探索マップ</h2><span class="tiny muted">光っているマスへ進める</span></div><div class="run-map"><svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">${edges}</svg>${nodes}</div></section>
      <section class="section card"><div class="tiny"><b>⚔️</b> 戦闘　 <b>☠️</b> 強敵　 <b>⛏️</b> 採取　 <b>⛺</b> 休憩　 <b>👑</b> ボス</div><div class="tiny muted" style="margin-top:6px">撤退はいつでも可能。撤退時点までのEXP・素材だけを確定する。</div></section>
    </main></div>${this.modalHtml()}`;
    this.bindCommon();
  }

  renderBattle(){
    const b=this.state.battle,e=enemies[b.enemyId],p=this.state.player,d=derived(this.state),dn=dungeons[this.state.run.dungeonId];
    this.root.innerHTML=`<div class="shell"><header class="topbar">${b.over?'<button class="btn small" disabled>← 撤退</button>':'<button class="btn small" data-action="retreat">← 撤退</button>'}<div class="brand">${dn.name}<small>${nodeMeta[b.nodeType]?.[1]||'戦闘'}マス</small></div><div class="pill">Lv.${p.level}</div></header><main><div class="enemy-stage"><div class="tiny muted">${b.nodeType==='boss'?'BOSS':b.nodeType==='elite'?'ELITE':'ENCOUNTER'}</div><div class="enemy-sprite">${e.icon}</div><h2>${e.name}</h2><div class="tiny">HP ${b.enemyHp}/${b.enemyMaxHp}</div><div class="bar" style="width:min(320px,90%);margin-top:6px"><i style="width:${pct(b.enemyHp,b.enemyMaxHp)}%"></i></div></div><section class="section card"><div class="row between tiny"><b>🧑‍⚔️ ${p.name}</b><span>HP ${p.hp}/${d.maxHp}　MP ${p.mp}/${d.maxMp}</span></div><div class="bar" style="margin-top:8px"><i style="width:${pct(p.hp,d.maxHp)}%"></i></div><div class="bar mp" style="margin-top:5px"><i style="width:${pct(p.mp,d.maxMp)}%"></i></div></section><section class="section"><div class="battle-log">${b.log.slice(-6).map(x=>`<div>${esc(x)}</div>`).join('')}</div>${b.over?this.battleOverButtons():`<div class="commands"><button class="btn primary" data-cmd="attack">⚔️ こうげき</button><button class="btn magic" data-cmd="skill">🔥 火炎斬り <span class="tiny">MP3</span></button><button class="btn" data-cmd="heal">✨ ホイミ <span class="tiny">MP4</span></button><button class="btn" data-cmd="defend">🛡️ ぼうぎょ</button><button class="btn" data-cmd="herb" style="grid-column:1/-1">🌿 薬草 ×${this.state.inventory.herb||0}</button></div>`}</section></main></div>${this.modalHtml()}`;
    this.bindCommon();
  }

  battleOverButtons(){const b=this.state.battle;if(!b.won)return `<div class="commands"><button class="btn danger" data-action="defeat-return" style="grid-column:1/-1">戦果を失って町へ戻る</button></div>`;return `<div class="commands"><button class="btn good" data-action="finish-battle" style="grid-column:1/-1">${b.nodeType==='boss'?'踏破して戦果を確定':'マップへ戻る'} →</button></div>`;}

  modalHtml(){if(!this.modal)return '';const m=this.modal,drops=Object.entries(m.data?.drops||{}).map(([id,n])=>`<div class="line-item"><span>${materials[id]?.icon||'•'} ${materials[id]?.name||id}</span><b>×${n}</b></div>`).join('');if(m.type==='reward')return `<div class="modal-backdrop"><div class="modal"><h2>${m.title||'🎒 持ち帰った戦果'}</h2><div class="card"><div class="line-item"><span>EXP</span><b>+${m.data.exp||0}</b></div>${drops||'<div class="empty">素材なし</div>'}</div><button class="btn primary" data-action="close-modal" style="margin-top:12px">閉じる</button></div></div>`;if(m.type==='lost')return `<div class="modal-backdrop"><div class="modal"><h2>💀 探索失敗</h2><p class="muted tiny">未確定だった戦果は失われた。HP/MPは自動では戻らない。</p><div class="card"><div class="line-item"><span>失ったEXP</span><b>${m.data.exp||0}</b></div>${drops||'<div class="empty">失った素材なし</div>'}</div><button class="btn" data-action="close-modal" style="margin-top:12px">閉じる</button></div></div>`;return '';}

  refreshIdleClock(){const s=idleStatus(this.state);if(!s)return;const c=document.querySelector('#idle-clock'),n=document.querySelector('#idle-next');if(c)c.textContent=fmtTime(s.cappedMs);if(n)n.textContent=`完了 ${s.cycles}周 ・ 次の周回まで ${fmtTime(s.nextMs)}`;const btn=document.querySelector('[data-action="claim-idle"]');if(btn)btn.disabled=s.cycles<1;}

  bindCommon(){
    this.root.querySelectorAll('[data-tab]').forEach(el=>el.addEventListener('click',()=>{this.tab=el.dataset.tab;this.render();}));
    this.root.querySelectorAll('[data-action="town-rest"]').forEach(el=>el.addEventListener('click',()=>this.mutate(()=>{const r=restAtTown(this.state);this.toast(r.changed?'しっかり休んだ。':'もう全快している。');})));
    this.root.querySelectorAll('[data-action="start-dungeon"]').forEach(el=>el.addEventListener('click',()=>this.mutate(()=>{const r=startDungeon(this.state,el.dataset.id);if(!r.ok)this.toast(r.msg);}))); 
    this.root.querySelectorAll('[data-action="map-node"]').forEach(el=>el.addEventListener('click',()=>this.mutate(()=>{const r=enterNode(this.state,el.dataset.id);this.toast(r.msg);}))); 
    this.root.querySelectorAll('[data-action="camp"]').forEach(el=>el.addEventListener('click',()=>this.mutate(()=>{const r=campChoice(this.state,el.dataset.kind);this.toast(r.msg);}))); 
    this.root.querySelectorAll('[data-action="start-idle"]').forEach(el=>el.addEventListener('click',()=>this.mutate(()=>{const r=startIdle(this.state,el.dataset.id);if(r.ok){this.tab='home';this.toast('放置探索を開始！');}else this.toast(r.msg);}))); 
    this.root.querySelectorAll('[data-action="claim-idle"]').forEach(el=>el.addEventListener('click',()=>this.mutate(()=>{const r=claimIdle(this.state);if(r.ok)this.modal={type:'reward',title:'⏳ 放置探索の成果',data:r.result};else this.toast(r.msg);}))); 
    this.root.querySelectorAll('[data-action="craft"]').forEach(el=>el.addEventListener('click',()=>this.mutate(()=>{const r=craft(this.state,el.dataset.id);this.toast(r.msg);}))); 
    this.root.querySelectorAll('[data-action="equip"]').forEach(el=>el.addEventListener('click',()=>this.mutate(()=>{if(equip(this.state,el.dataset.id))this.toast('装備した。');}))); 
    this.root.querySelectorAll('[data-cmd]').forEach(el=>el.addEventListener('click',()=>this.mutate(()=>command(this.state,el.dataset.cmd))));
    this.root.querySelectorAll('[data-action="finish-battle"]').forEach(el=>el.addEventListener('click',()=>this.mutate(()=>{const r=finishBattleNode(this.state);if(r.done){this.modal={type:'reward',title:'🎉 ダンジョン踏破',data:r.rewards};this.tab='home';}})));
    this.root.querySelectorAll('[data-action="retreat"]').forEach(el=>el.addEventListener('click',()=>this.mutate(()=>{const r=retreat(this.state);if(r.ok){this.modal={type:'reward',title:'🏃 撤退成功',data:r.rewards};this.tab='home';}})));
    this.root.querySelectorAll('[data-action="defeat-return"]').forEach(el=>el.addEventListener('click',()=>this.mutate(()=>{const r=defeatReturn(this.state);if(r.ok){this.modal={type:'lost',data:r.lost};this.tab='home';}})));
    this.root.querySelectorAll('[data-action="close-modal"]').forEach(el=>el.addEventListener('click',()=>{this.modal=null;this.render();}));
    this.root.querySelectorAll('[data-action="export"]').forEach(el=>el.addEventListener('click',()=>this.exportSave()));
    this.root.querySelectorAll('[data-action="install"]').forEach(el=>el.addEventListener('click',async()=>{if(!this.installPrompt)return;await this.installPrompt.prompt();this.installPrompt=null;this.render();}));
    const imp=this.root.querySelector('#import-file');if(imp)imp.addEventListener('change',e=>this.importSave(e.target.files?.[0]));
    this.root.querySelectorAll('[data-action="reset"]').forEach(el=>el.addEventListener('click',()=>{if(confirm('セーブデータを完全に消して最初から始めますか？'))window.dispatchEvent(new CustomEvent('gq-reset'));}));
  }

  exportSave(){const blob=new Blob([JSON.stringify(this.state,null,2)],{type:'application/json'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`grindquest-save-${new Date().toISOString().slice(0,10)}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);}
  async importSave(file){if(!file)return;try{const data=JSON.parse(await file.text());window.dispatchEvent(new CustomEvent('gq-import',{detail:data}));this.toast('セーブを読み込んだ。');}catch{this.toast('セーブファイルを読み込めなかった。');}}
}
