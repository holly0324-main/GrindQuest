# Battle

- Document Version: 1
- Architecture Baseline: v0.16
- Last Architecture Change: v0.16

## Responsibility

Up to four party members versus multiple independent enemies, command queueing, tactics, initiative, rewards, escape, defeat.

## Public surface

`battle.js`; key APIs include `beginEncounter`, `command`, `finishBattle`, `battleCurrentActor`, `livingEnemies`.

## Owned state / data

`state.battle`; records kills/rewards as explicit cross-domain effects.

## Dependencies

Characters, inventory, clock, monster/action data.

## Invariants

One resolved round advances exactly one world step. Initiative uses agility plus small randomness. Enemies remain independent entities.

## Extension points

Add multi-target actions, statuses, enemy AI profiles, formations, revival, and boss phases here.

When responsibility, public API, or owned state changes, increment `Document Version`.
