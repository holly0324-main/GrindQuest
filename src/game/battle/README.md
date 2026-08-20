# Battle

- Document Version: 3
- Architecture Baseline: v0.16
- Last Architecture Change: v0.18

## Responsibility

Up to four party members versus multiple independent enemies, command queueing, in-battle tactic changes, initiative, rewards, escape, defeat, encounter discovery and expedition battle/defeat observation.

## Public surface

`battle.js`; key APIs include `beginEncounter`, `command`, `setBattleTactic`, `finishBattle`, `defeatReturn`, `battleCurrentActor`, `livingEnemies`.

## Owned state / data

`state.battle`; explicit cross-domain effects record kills/rewards, discovery and expedition metrics.

## Dependencies

Characters, inventory, discovery, expedition observer, clock, monster/action data.

## Invariants

One resolved round advances exactly one world step. Initiative uses agility plus small randomness. Enemies remain independent entities. Changing tactic costs no turn and clears stale pending commands. Encounter count is recorded at battle start; defeated units are counted on victory. Defeat finalizes the current expedition before `state.run` is cleared.

## Extension points

Multi-target actions, statuses, enemy AI profiles, formations, revival, boss phases, additional tactics and boss-specific result metadata.

When responsibility, public API, or owned state changes, increment `Document Version`.
