export const PHASE_STEPS=50;
export const DAY_STEPS=PHASE_STEPS*3;
export const EQUIPMENT_SLOTS=[['weapon','武器'],['shield','盾'],['head','頭'],['body','からだ上'],['arms','腕'],['legs','からだ下'],['feet','足'],['accessory','アクセ']];
export const QUALITY_NAMES=['','☆1','☆2','☆3'];
export const QUALITY_MULT=[1,1.22,1.48,1.82];
export const QUALITY_LIFE=[1,1.25,1.6,2.0];
export const STORAGE_BASE_CAPACITY=200;
export const STORAGE_UPGRADES=[
  {capacity:200,price:0,name:'木箱倉庫'},
  {capacity:320,price:900,name:'棚付き倉庫'},
  {capacity:500,price:2600,name:'大型倉庫'},
  {capacity:800,price:6500,name:'商会式倉庫'},
  {capacity:1200,price:14500,name:'大倉庫'}
];
export const FRESH_STORAGE_BASE_CAPACITY=36;
export const FRESH_STORAGE_UPGRADES=[
  {capacity:36,price:0,name:'小さな保存棚'},
  {capacity:60,price:700,name:'瓶詰め保存棚'},
  {capacity:90,price:2100,name:'地下保存棚'},
  {capacity:140,price:5200,name:'大型保存庫'},
  {capacity:220,price:12000,name:'商会式保存庫'}
];
export const WORKMANSHIP_NAMES=['並','良','上','極'];
export const ITEM_TAGS={adventure:'冒険用',material:'素材',valuable:'換金'};
export const EQUIPMENT_AFFIXES={
  sturdy:{id:'sturdy',name:'丈夫な',minWorkmanship:1,stat:'hp',min:2,max:6},
  keen:{id:'keen',name:'鋭い',minWorkmanship:1,stat:'atk',min:1,max:3},
  guarded:{id:'guarded',name:'堅牢な',minWorkmanship:1,stat:'def',min:1,max:3},
  swift:{id:'swift',name:'軽快な',minWorkmanship:2,stat:'agility',min:1,max:3},
  wise:{id:'wise',name:'知恵ある',minWorkmanship:2,stat:'wisdom',min:1,max:3},
  skillful:{id:'skillful',name:'精巧な',minWorkmanship:2,stat:'dexterity',min:1,max:3}
};
