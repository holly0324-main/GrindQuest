import { dungeons, enemies, items, materials, recipes } from '../data/gameData.js';

export function defaultState() {
  return {
    version: 1,
    player: { name:'冒険者', level:1, exp:0, gold:100, baseMaxHp:44, baseMaxMp:16, baseAtk:8, baseDef:4, hp:49, mp:16, equipment:{weapon:'novice_sword', armor:'travel_clothes'} },
    ownedItems: { novice_sword:1, travel_clothes:1 },
    inventory: { herb:3, slime_gel:1, beast_fang:0, iron_ore:0, bone:0, magic_crystal:0, flame_crystal:0 },
    clears: {},
    run: null,
    battle: null,
    idle: null,
    selectedIdleDungeon: 'green_hill',
    log: ['冒険がはじまった。'],
    settings: { vibrate: true }
  };
}

export function expToNext(level) { return 28 + level * level * 14; }

export function derived(state) {
  const p = state.player;
  const w = items[p.equipment.weapon];
  const a = items[p.equipment.armor];
  return {
    maxHp: p.baseMaxHp + levelHp(p.level) + (w?.hp||0) + (a?.hp||0),
    maxMp: p.baseMaxMp + levelMp(p.level) + (w?.mp||0) + (a?.mp||0),
    atk: p.baseAtk + levelAtk(p.level) + (w?.atk||0) + (a?.atk||0),
    def: p.baseDef + levelDef(p.level) + (w?.def||0) + (a?.def||0)
  };
}
const levelHp = l => (l-1)*7;
const levelMp = l => (l-1)*2;
const levelAtk = l => (l-1)*3;
const levelDef = l => (l-1)*2;
const rand = (min,max) => Math.floor(Math.random()*(max-min+1))+min;
const pushBattle = (battle, message) => { battle.log.push(message); if (battle.log.length > 16) battle.log.shift(); };

export function normalize(state) {
  const s = {...defaultState(), ...state};
  s.player = {...defaultState().player, ...(state?.player||{})};
  s.player.equipment = {...defaultState().player.equipment, ...(state?.player?.equipment||{})};
  s.inventory = {...defaultState().inventory, ...(state?.inventory||{})};
  s.ownedItems = {...defaultState().ownedItems, ...(state?.ownedItems||{})};
  s.clears = {...(state?.clears||{})};
  s.settings = {...defaultState().settings, ...(state?.settings||{})};
  const d = derived(s);
  s.player.hp = Math.min(Number.isFinite(s.player.hp)?s.player.hp:d.maxHp,d.maxHp);
  s.player.mp = Math.min(Number.isFinite(s.player.mp)?s.player.mp:d.maxMp,d.maxMp);
  return s;
}

export function startDungeon(state, dungeonId) {
  const d = dungeons[dungeonId];
  if (!d || state.player.level < d.unlockLevel) return {ok:false,msg:'まだこのダンジョンには挑めない。'};
  state.run = { dungeonId, step:0, total:d.normal.length+1, rewards:{exp:0,gold:0,drops:{}}, startedAt:Date.now() };
  healFull(state);
  beginEncounter(state);
  return {ok:true};
}

function beginEncounter(state) {
  const run = state.run;
  const d = dungeons[run.dungeonId];
  const enemyId = run.step < d.normal.length ? d.normal[run.step] : d.boss;
  const base = enemies[enemyId];
  state.battle = {
    enemyId,
    enemyHp:base.hp,
    enemyMaxHp:base.hp,
    guarding:false,
    over:false,
    won:false,
    log:[`${base.name}が あらわれた！`]
  };
}

export function command(state, type) {
  const b = state.battle;
  if (!b || b.over) return;
  const e = enemies[b.enemyId];
  const st = derived(state);
  b.guarding = false;

  if (type === 'attack') {
    const dmg = Math.max(1, st.atk + rand(-2,3) - Math.floor(e.def*.55));
    b.enemyHp = Math.max(0,b.enemyHp-dmg);
    pushBattle(b, `${e.name}に ${dmg} ダメージ！`);
  } else if (type === 'skill') {
    if (state.player.mp < 3) return pushBattle(b,'MPが たりない！');
    state.player.mp -= 3;
    const dmg = Math.max(2, Math.floor(st.atk*1.7) + rand(-2,4) - Math.floor(e.def*.35));
    b.enemyHp = Math.max(0,b.enemyHp-dmg);
    pushBattle(b, `火炎斬り！ ${dmg} ダメージ！`);
  } else if (type === 'heal') {
    if (state.player.mp < 4) return pushBattle(b,'MPが たりない！');
    state.player.mp -= 4;
    const before = state.player.hp;
    state.player.hp = Math.min(st.maxHp, state.player.hp + 18 + state.player.level*4 + rand(0,5));
    pushBattle(b, `ホイミ！ HPが ${state.player.hp-before} 回復した。`);
  } else if (type === 'defend') {
    b.guarding = true;
    pushBattle(b,'身を守っている。');
  } else if (type === 'herb') {
    if ((state.inventory.herb||0) <= 0) return pushBattle(b,'薬草を持っていない。');
    state.inventory.herb--;
    const before = state.player.hp;
    state.player.hp = Math.min(st.maxHp, state.player.hp + 24);
    pushBattle(b, `薬草を使った。HPが ${state.player.hp-before} 回復した。`);
  }

  if (b.enemyHp <= 0) return victory(state);
  enemyTurn(state);
}

function enemyTurn(state) {
  const b = state.battle;
  const e = enemies[b.enemyId];
  const st = derived(state);
  let dmg = Math.max(1, e.atk + rand(-2,3) - Math.floor(st.def*.45));
  if (b.guarding) dmg = Math.max(1, Math.floor(dmg*.45));
  state.player.hp = Math.max(0,state.player.hp-dmg);
  pushBattle(b, `${e.name}の攻撃！ ${dmg} ダメージ。`);
  if (state.player.hp <= 0) {
    b.over = true;
    b.won = false;
    pushBattle(b,'ちからつきた……。');
  }
}

function victory(state) {
  const b = state.battle;
  const e = enemies[b.enemyId];
  b.over = true; b.won = true;
  addExp(state,e.exp); state.player.gold += e.gold;
  state.run.rewards.exp += e.exp; state.run.rewards.gold += e.gold;
  for (const [mat,chance] of e.drops) {
    if (Math.random() <= chance) {
      state.inventory[mat]=(state.inventory[mat]||0)+1;
      state.run.rewards.drops[mat]=(state.run.rewards.drops[mat]||0)+1;
    }
  }
  pushBattle(b, `${e.name}を倒した！ +${e.exp}EXP / +${e.gold}G`);
}

export function nextEncounter(state) {
  if (!state.battle?.over || !state.battle?.won || !state.run) return {done:false};
  state.run.step++;
  const d = dungeons[state.run.dungeonId];
  if (state.run.step >= state.run.total) {
    state.clears[state.run.dungeonId]=(state.clears[state.run.dungeonId]||0)+1;
    state.inventory.herb=(state.inventory.herb||0)+1;
    state.run.rewards.drops.herb=(state.run.rewards.drops.herb||0)+1;
    healFull(state);
    const result = structuredClone(state.run.rewards);
    state.log.unshift(`${d.name}を踏破した！`);
    state.battle=null; state.run=null;
    return {done:true,rewards:result,dungeon:d};
  }
  state.player.hp = Math.min(derived(state).maxHp, state.player.hp + Math.ceil(derived(state).maxHp*.12));
  state.player.mp = Math.min(derived(state).maxMp, state.player.mp + 2);
  beginEncounter(state);
  return {done:false};
}

export function retreat(state) {
  state.run=null; state.battle=null;
  const d=derived(state);
  state.player.hp=Math.max(1,Math.ceil(d.maxHp*.6));
  state.player.mp=Math.ceil(d.maxMp*.5);
}

function addExp(state, amount) {
  state.player.exp += amount;
  while (state.player.exp >= expToNext(state.player.level)) {
    state.player.exp -= expToNext(state.player.level);
    state.player.level++;
    state.log.unshift(`レベル ${state.player.level} になった！`);
    healFull(state);
  }
}

export function healFull(state) {
  const d=derived(state); state.player.hp=d.maxHp; state.player.mp=d.maxMp;
}

export function canCraft(state, recipe) {
  if (state.player.gold < recipe.gold) return false;
  return Object.entries(recipe.cost).every(([id,n]) => (state.inventory[id]||0)>=n);
}

export function craft(state, recipeId) {
  const r=recipes.find(x=>x.id===recipeId);
  if (!r || !canCraft(state,r)) return {ok:false,msg:'素材かゴールドが足りない。'};
  for (const [id,n] of Object.entries(r.cost)) state.inventory[id]-=n;
  state.player.gold-=r.gold;
  state.ownedItems[r.item]=(state.ownedItems[r.item]||0)+1;
  state.log.unshift(`${items[r.item].name}を作った！`);
  return {ok:true,msg:`${items[r.item].name} 完成！`};
}

export function equip(state,itemId) {
  const item=items[itemId];
  if (!item || !(state.ownedItems[itemId]>0)) return false;
  state.player.equipment[item.slot]=itemId;
  const d=derived(state);
  state.player.hp=Math.min(state.player.hp,d.maxHp);
  state.player.mp=Math.min(state.player.mp,d.maxMp);
  return true;
}

export function startIdle(state,dungeonId) {
  const d=dungeons[dungeonId];
  if (!d || state.player.level<d.unlockLevel) return {ok:false,msg:'まだ放置探索できない。'};
  state.idle={dungeonId,startedAt:Date.now()};
  return {ok:true};
}

export function idleStatus(state, now=Date.now()) {
  if (!state.idle) return null;
  const d=dungeons[state.idle.dungeonId];
  const elapsedMs=Math.max(0,now-state.idle.startedAt);
  const cappedMs=Math.min(elapsedMs,8*60*60*1000);
  const cycleMs=d.cycleMinutes*60*1000;
  const cycles=Math.floor(cappedMs/cycleMs);
  return {d,elapsedMs,cappedMs,cycles,cycleMs,nextMs:cycleMs-(cappedMs%cycleMs)};
}

export function claimIdle(state, now=Date.now()) {
  const status=idleStatus(state,now);
  if (!status || status.cycles<1) return {ok:false,msg:'まだ1周分の探索が終わっていない。'};
  const {d,cycles}=status;
  const variance=.88+Math.random()*.24;
  const exp=Math.floor(d.idle.exp*cycles*variance);
  const gold=Math.floor(d.idle.gold*cycles*(.9+Math.random()*.2));
  addExp(state,exp); state.player.gold+=gold;
  const drops={};
  for (const [id,avg] of Object.entries(d.idle.drops)) {
    const n=Math.max(0,Math.floor(avg*cycles*(.75+Math.random()*.5)));
    if (n) { state.inventory[id]=(state.inventory[id]||0)+n; drops[id]=n; }
  }
  state.idle=null;
  state.log.unshift(`${d.name}の放置探索から帰還した。`);
  return {ok:true,result:{cycles,exp,gold,drops,dungeon:d}};
}

export { dungeons, enemies, items, materials, recipes };
