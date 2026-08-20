export function startIdle(state,area='outskirts'){state.idle={area,startedAt:Date.now()};return{ok:true};}
export function idleStatus(state,now=Date.now()){if(!state.idle)return null;const elapsed=Math.min(now-state.idle.startedAt,8*60*60*1000);return{elapsed,cycles:Math.floor(elapsed/(10*60*1000))};}
export function claimIdle(state,now=Date.now()){const s=idleStatus(state,now);if(!s||s.cycles<1)return{ok:false};state.idle=null;return{ok:true,result:{cycles:s.cycles}};}
