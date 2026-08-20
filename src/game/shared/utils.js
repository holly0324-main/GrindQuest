export const rand=(min,max)=>Math.floor(Math.random()*(max-min+1))+min;
export const pick=a=>a[rand(0,a.length-1)];
export const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
export const sum=(xs,fn)=>xs.reduce((a,x)=>a+fn(x),0);
export const deep=x=>JSON.parse(JSON.stringify(x));
