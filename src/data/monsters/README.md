# Monster Data

- Document Version: 1
- Architecture Baseline: v0.16
- Last Architecture Change: v0.16

## Responsibility

Monster base stats, reward slots, and loot tables.

## Public surface

`enemies.js`.

## Owned state / data

Static enemy definitions.

## Dependencies

Item IDs referenced by loot are resolved at runtime.

## Invariants

Each enemy has independent HP/ATK/DEF/AGI/EXP. Loot definitions stay declarative.

## Extension points

Future AI patterns, skills, formations, and ecology metadata can be added to definitions.

When responsibility, public API, or owned state changes, increment `Document Version`.
