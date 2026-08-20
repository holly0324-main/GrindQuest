import { defaultState, normalize } from './game/state/state.js';
import { clearState, loadState, saveState } from './game/save/storage.js';
import { AppUI } from './ui/app.js';

const root=document.querySelector('#app');
let state=normalize(await loadState() ?? defaultState());
const ui=new AppUI(root,state,async()=>saveState(state));
ui.render();

window.addEventListener('beforeinstallprompt',e=>{ e.preventDefault(); ui.setInstallPrompt(e); });
window.addEventListener('gq-reset',async()=>{ await clearState(); state=defaultState(); ui.state=state; await saveState(state); ui.tab='home'; ui.render(); });
window.addEventListener('gq-import',async e=>{ state=normalize(e.detail); ui.state=state; await saveState(state); ui.tab='home'; ui.render(); });

if ('serviceWorker' in navigator) {
  window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(console.error));
}

document.addEventListener('visibilitychange',()=>{ if(document.visibilityState==='hidden') saveState(state); else ui.render(); });
