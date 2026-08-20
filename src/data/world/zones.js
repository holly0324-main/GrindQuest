export const zones = {
  village:{name:'ミナト村',encounter:0,pools:{morning:[],day:[],night:[]}},
  outskirts:{name:'村はずれ',encounter:.18,pools:{morning:['slime','rabbit'],day:['slime','rabbit'],night:['slime','bat']}},
  river:{name:'川辺',encounter:.17,pools:{morning:['slime','rabbit'],day:['slime','goblin','hornet'],night:['bat','goblin']}},
  forest:{name:'森',encounter:.28,pools:{morning:['rabbit','mushroom_beast','hornet'],day:['goblin','wolf','mushroom_beast','hornet'],night:['bat','wolf','imp','cave_moth']}},
  mountain:{name:'山',encounter:.31,pools:{morning:['rock_lizard','rabbit','boar'],day:['rock_lizard','wolf','boar'],night:['rock_lizard','bat','imp','cave_moth']}},
  ruins:{name:'古跡',encounter:.35,pools:{morning:['skeleton','ruin_guard'],day:['skeleton','ruin_guard'],night:['skeleton','imp','ruin_guard','cave_moth']}}
};
