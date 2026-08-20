# Exploration

- Document Version: 3
- Architecture Baseline: v0.16
- Last Architecture Change: v0.19

## Responsibility

Overworld/local-area navigation, encounter checks, gathering, field item use, camping, return-to-town storage flow, and lifecycle calls into the expedition-result observer.

## Public surface

`exploration.js`.

## Owned state / data

Navigation/life-skill portion of `state.run`, `state.lifeSkills`; reads/mutates party health during field actions. `state.run.summary` is owned by `game/expedition`, not exploration.

## Dependencies

World data, battle encounter entry, inventory, characters, discovery generic place knowledge, expedition observer, world clock.

## Invariants

Movement/resource actions advance time only through clock APIs. Encounter calls pass the zone/local/node enemy-level profile into battle rather than choosing level rules inside battle from map IDs. Gathering may defer encounter resolution until the minigame animation finishes.

## Extension points

Split gathering/local traversal/camping if this file grows materially. New exploration metrics should call expedition recorder APIs rather than adding UI-derived counters.

When responsibility, public API, or owned state changes, increment `Document Version`.
