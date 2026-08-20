# Exploration

- Document Version: 1
- Architecture Baseline: v0.16
- Last Architecture Change: v0.16

## Responsibility

Overworld/local-area navigation, encounter checks, gathering, field item use, camping, return-to-town storage flow.

## Public surface

`exploration.js`.

## Owned state / data

`state.run`, `state.lifeSkills`; reads/mutates party health during field actions.

## Dependencies

World data, battle encounter entry, inventory, characters, world clock.

## Invariants

Movement/resource actions advance time only through clock APIs. Gathering may defer encounter resolution until the minigame animation finishes.

## Extension points

Split gathering, local-area traversal, and camping into submodules if this file grows materially.

When responsibility, public API, or owned state changes, increment `Document Version`.
