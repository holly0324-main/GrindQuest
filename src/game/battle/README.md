# Battle

- Document Version: 4
- Architecture Baseline: v0.16
- Last Architecture Change: v0.19

## Responsibility

Up to four party members versus multiple independent enemies, command queueing, in-battle tactic changes, initiative, rewards, escape, defeat, encounter discovery and expedition battle/defeat observation.

## Public surface

`battle.js`; key APIs include `beginEncounter`, `makeBattleEnemy`, `rollEnemyLevel`, `enemyStatsAtLevel`, `battleExpMultiplier`, `battleExpRewards`, `command`, `setBattleTactic`, `finishBattle`, `defeatReturn`, `battleCurrentActor`, `livingEnemies`.

## Owned state / data

`state.battle`; explicit cross-domain effects record kills/rewards, discovery and expedition metrics.

## Dependencies

Characters, inventory, discovery, expedition observer, clock, monster/action data.

## Invariants

One resolved round advances exactly one world step. Initiative uses agility plus small randomness. Each enemy instance owns a rolled `level` and scaled combat stats. Battle EXP is calculated per character: when character Lv > enemy Lv, reward is reduced by 10% per level difference, clamped at zero. Changing tactic costs no turn and clears stale pending commands.

## Extension points

Multi-target actions, statuses, enemy AI profiles, formations, revival, boss phases, additional tactics and boss-specific result metadata.

When responsibility, public API, or owned state changes, increment `Document Version`.
