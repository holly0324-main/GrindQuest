# Battle

- Document Version: 2
- Architecture Baseline: v0.16
- Last Architecture Change: v0.17

## Responsibility

Up to four party members versus multiple independent enemies, command queueing, in-battle tactic changes, initiative, rewards, escape, defeat, and encounter discovery.

## Public surface

`battle.js`; key APIs include `beginEncounter`, `command`, `setBattleTactic`, `finishBattle`, `battleCurrentActor`, and `livingEnemies`.

## Owned state / data

`state.battle`; records kills/rewards and enemy sightings as explicit cross-domain effects.

## Dependencies

Characters, inventory, discovery, clock, monster/action data.

## Invariants

One resolved round advances exactly one world step. Initiative uses agility plus small randomness. Enemies remain independent entities. Changing a tactic costs no turn and clears that character's stale pending command.

## Extension points

Add multi-target actions, statuses, enemy AI profiles, formations, revival, boss phases, and additional tactics here.

When responsibility, public API, or owned state changes, increment `Document Version`.
