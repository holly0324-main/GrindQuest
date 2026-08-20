import { clamp } from '../shared/utils.js';
export function fatiguePenalty(state){return clamp((state.condition?.fatigueStacks||0)*.10,0,.7);}
