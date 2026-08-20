const clamp=(v,min=0,max=1)=>Math.max(min,Math.min(max,v));
const nowMs=()=>typeof performance!=='undefined'&&performance.now?performance.now():Date.now();

const DEFAULT_PROFILE={
  idealTemp:68,tolerance:10,tempRateCPerSec:-1,tempRateDurationMs:3000,
  idealRps:.72,stirTolerance:.34,direction:'cw',extractRate:.10,stability:0
};
const FAILURE_THRESHOLD=.30;

export const ALCHEMY_EFFECT_TYPES={
  HEAT_HOLD:'heat_hold',
  CHILL:'chill',
  EXTRACT_BOOST:'extract_boost',
  STABILIZE:'stabilize'
};

function recipeProfiles(recipe){
  const out={};
  for(const id of Object.keys(recipe?.cost||{}))out[id]={...DEFAULT_PROFILE,...(recipe?.process?.ingredients?.[id]||{})};
  return out;
}

function dexterityWidth(dexterity){
  // 器用さは最終スコアを直接上げず、操作許容幅だけを広げる。
  return clamp(1+Math.max(0,dexterity-5)*.012,1,2.15);
}

export function createAlchemySession(recipe,dexterity=0,reservation=null,startedAt=nowMs()){
  const profiles=recipeProfiles(recipe),pending={};
  for(const [id,count] of Object.entries(recipe?.cost||{}))pending[id]=count;
  return{
    recipeId:recipe.id,
    startedAt,lastUpdate:startedAt,lastStirAt:startedAt,
    elapsedMs:0,
    temperature:recipe?.process?.startTemp??38,
    ambientTemp:22,
    heat:recipe?.process?.startHeat??.52,
    extraction:0,
    stability:1,
    degradation:0,
    dexterity,
    toleranceMul:dexterityWidth(dexterity),
    pending,
    added:[],profiles,
    thermalEffects:[],
    stir:{rps:0,direction:'none',totalTurns:0,pathScore:1,speedScore:0,directionScore:0,samples:0},
    metrics:{tempIntegral:0,tempWeight:0,stirIntegral:0,stirWeight:0,idleMs:0,maxTemp:0},
    effects:[],
    reservation,
    ready:false,ruined:false,allAdded:false
  };
}

export function alchemyIngredientInfo(session,id){
  const p=session?.profiles?.[id]||DEFAULT_PROFILE;
  const tol=p.tolerance*(session?.toleranceMul||1);
  return{...p,minTemp:Math.round(p.idealTemp-tol),maxTemp:Math.round(p.idealTemp+tol)};
}

export function addAlchemyIngredient(session,id,at=nowMs()){
  if(!session?.pending?.[id])return{ok:false,msg:'その素材はもう投入済み。'};
  advanceAlchemySession(session,at);
  const p=session.profiles[id]||DEFAULT_PROFILE;
  session.pending[id]--;
  session.stability=clamp(session.stability+(p.stability||0),0,1);
  session.added.push({id,at:session.elapsedMs,profile:p,extraction:0});
  const rate=Number.isFinite(p.tempRateCPerSec)?p.tempRateCPerSec:(Number.isFinite(p.tempDelta)?p.tempDelta/3:0);
  const durationMs=Math.max(0,p.tempRateDurationMs??3000);
  if(rate&&durationMs)session.thermalEffects.push({source:id,rateCPerSec:rate,remainingMs:durationMs});
  session.allAdded=Object.values(session.pending).every(n=>n<=0);
  session.ready=session.allAdded;
  return{ok:true,msg:`${id}を投入した。`};
}

export function setAlchemyHeat(session,value){if(session)session.heat=clamp(Number(value)||0,0,1);}

export function applyAlchemyStir(session,{deltaAngle=0,dtMs=16,radiusError=0}={}){
  if(!session||!Number.isFinite(deltaAngle)||dtMs<=0)return;
  const turns=Math.abs(deltaAngle)/(Math.PI*2),rps=turns/(dtMs/1000),dir=deltaAngle>=0?'cw':'ccw';
  if(turns>.28)return; // pointer jump を無視
  session.stir.rps=session.stir.rps*.58+rps*.42;
  session.stir.direction=dir;
  session.stir.totalTurns+=turns;
  const path=clamp(1-Math.abs(radiusError)*2.1,0,1);
  session.stir.pathScore=(session.stir.pathScore*session.stir.samples+path)/(session.stir.samples+1);
  session.stir.samples++;
  session.lastStirAt=nowMs();
}

function effectMul(session,type,defaultValue=1){
  let out=defaultValue;
  for(const e of session.effects||[])if(e.type===type&&e.remainingMs>0)out*=e.multiplier??1;
  return out;
}

function tickEffects(session,dtMs){
  for(const e of session.effects||[])e.remainingMs=Math.max(0,(e.remainingMs||0)-dtMs);
  session.effects=(session.effects||[]).filter(e=>e.remainingMs>0);
}

function tickThermalEffects(session,dtSec,dtMs){
  let deltaRate=0;
  for(const e of session.thermalEffects||[])if(e.remainingMs>0)deltaRate+=e.rateCPerSec||0;
  session.temperature+=deltaRate*dtSec;
  for(const e of session.thermalEffects||[])e.remainingMs=Math.max(0,e.remainingMs-dtMs);
  session.thermalEffects=(session.thermalEffects||[]).filter(e=>e.remainingMs>0);
}

export function applyAlchemyEffect(session,effect){
  if(!session||!effect?.type)return false;
  const e={...effect,remainingMs:effect.durationMs??3000};
  if(e.type===ALCHEMY_EFFECT_TYPES.CHILL)session.temperature=Math.max(session.ambientTemp,session.temperature-(e.amount??16));
  if(e.type===ALCHEMY_EFFECT_TYPES.STABILIZE)session.stability=clamp(session.stability+(e.amount??.12),0,1);
  session.effects.push(e);return true;
}

function scoreIngredient(session,item){
  const p=item.profile||DEFAULT_PROFILE,tol=p.tolerance*session.toleranceMul;
  const tempScore=clamp(1-Math.abs(session.temperature-p.idealTemp)/Math.max(1,tol),0,1);
  const stirTol=p.stirTolerance*session.toleranceMul;
  const speedScore=clamp(1-Math.abs(session.stir.rps-p.idealRps)/Math.max(.08,stirTol),0,1);
  const directionScore=session.stir.direction==='none'?.22:(session.stir.direction===p.direction?1:.22);
  const pathScore=.25+.75*session.stir.pathScore;
  return{tempScore,speedScore,directionScore,pathScore,stirScore:speedScore*directionScore*pathScore};
}

function stepSession(session,dtSec,dtMs){
  tickEffects(session,dtMs);
  const hold=effectMul(session,ALCHEMY_EFFECT_TYPES.HEAT_HOLD,1);
  const heating=session.heat*13.5*hold;
  const cooling=Math.max(0,session.temperature-session.ambientTemp)*.033;
  session.temperature+=((heating-cooling)*dtSec);
  tickThermalEffects(session,dtSec,dtMs);
  session.temperature=Math.max(session.ambientTemp-8,session.temperature);
  session.metrics.maxTemp=Math.max(session.metrics.maxTemp,session.temperature);

  if(nowMs()-session.lastStirAt>240){session.stir.rps*=Math.pow(.34,dtSec);if(session.stir.rps<.035)session.stir.direction='none';}

  let tempAvg=0,stirAvg=0,weight=0;
  for(const item of session.added){
    const s=scoreIngredient(session,item),boost=effectMul(session,ALCHEMY_EFFECT_TYPES.EXTRACT_BOOST,1);
    const efficiency=s.tempScore*(.20+.80*s.stirScore);
    // v0.12: 少ない回転でも抽出が進むよう基礎抽出量を約2.4倍に。
    const gain=(item.profile.extractRate||.1)*2.4*(.28+.72*efficiency)*boost*dtSec;
    item.extraction+=gain;
    session.extraction+=gain;
    tempAvg+=s.tempScore;stirAvg+=s.stirScore;weight++;

    const tol=item.profile.tolerance*session.toleranceMul;
    const overHeat=Math.max(0,session.temperature-(item.profile.idealTemp+tol*1.15));
    if(overHeat>0){const d=overHeat/55*dtSec;session.degradation+=d;session.stability-=d*.7;}
    if(item.extraction>1.16){const d=(item.extraction-1.16)*.045*dtSec;session.degradation+=d;session.stability-=d*.45;}
  }
  if(weight){tempAvg/=weight;stirAvg/=weight;session.metrics.tempIntegral+=tempAvg*dtSec;session.metrics.tempWeight+=dtSec;session.metrics.stirIntegral+=stirAvg*dtSec;session.metrics.stirWeight+=dtSec;}

  const sinceStir=nowMs()-session.lastStirAt;
  if(session.added.length&&sinceStir>1700){const idle=(sinceStir-1700)/5000*.018*dtSec;session.stability-=idle;session.degradation+=idle*.35;session.metrics.idleMs+=dtMs;}
  if(session.temperature>106){const burn=(session.temperature-106)/40*.055*dtSec;session.stability-=burn;session.degradation+=burn;}
  session.stability=clamp(session.stability,0,1);
  session.degradation=clamp(session.degradation,0,1.5);

  session.allAdded=Object.values(session.pending).every(n=>n<=0);
  // 完成可否は内部抽出値ではなく「全素材投入済み」のみで決める。
  session.ready=session.allAdded;
  session.ruined=session.stability<=.03||session.degradation>=1.15;
}

export function advanceAlchemySession(session,at=nowMs()){
  if(!session)return session;
  let dt=Math.max(0,at-session.lastUpdate);session.lastUpdate=at;session.elapsedMs+=dt;
  // 大きなdtもFPS非依存で処理するが、数値積分は100ms刻みに分割。
  while(dt>0){const slice=Math.min(100,dt);stepSession(session,slice/1000,slice);dt-=slice;}
  return session;
}

export function alchemyStatus(session){
  if(!session)return null;
  const temp=session.metrics.tempWeight?session.metrics.tempIntegral/session.metrics.tempWeight:0;
  const stir=session.metrics.stirWeight?session.metrics.stirIntegral/session.metrics.stirWeight:0;
  const extraction=session.added.length?session.extraction/session.added.length:0;
  return{
    temperature:session.temperature,
    extraction,
    stability:session.stability,
    degradation:session.degradation,
    heat:session.heat,
    rps:session.stir.rps,
    direction:session.stir.direction,
    turns:session.stir.totalTurns,
    pathScore:session.stir.pathScore,
    tempScore:temp,
    stirScore:stir,
    elapsedMs:session.elapsedMs,
    ready:session.ready,
    ruined:session.ruined,
    allAdded:session.allAdded,
    thermalEffects:(session.thermalEffects||[]).map(x=>({...x})),
    pending:{...session.pending}
  };
}

export function evaluateAlchemy(session){
  const s=alchemyStatus(session),extractScore=clamp(1-Math.abs(s.extraction-.92)/.62,0,1);
  const stabilityScore=clamp(s.stability,0,1),tempScore=clamp(s.tempScore,0,1),stirScore=clamp(s.stirScore,0,1),path=clamp(s.pathScore,0,1);
  const score=clamp(extractScore*.34+stabilityScore*.26+tempScore*.17+stirScore*.15+path*.08-s.degradation*.34,0,1);
  const processReady=s.extraction>=.16&&s.stability>.08&&s.degradation<1.12;
  const viable=s.allAdded&&processReady&&score>=FAILURE_THRESHOLD&&!s.ruined;
  const quality=!viable?null:score>=.87?3:score>=.70?2:score>=.50?1:0;
  const visualState=!s.allAdded?'incomplete':!viable?'bad':quality>=3?'excellent':quality>=2?'great':quality>=1?'good':'viable';
  return{...s,score,quality,viable,processReady,visualState,extractScore,stabilityScore};
}

export const ALCHEMY_FAILURE_THRESHOLD=FAILURE_THRESHOLD;
