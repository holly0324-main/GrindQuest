# Monster Data

- Document Version: 2
- Architecture Baseline: v0.16
- Last Architecture Change: v0.19

## Responsibility

Monster base stats, base level, reward slots, and loot tables.

## Public surface

`enemies.js`.

## Owned state / data

Static enemy definitions.

## Dependencies

Item IDs referenced by loot are resolved at runtime.

## Invariants

Each enemy definition exposes a Lv.1 base reference (`baseLevel`) plus HP/ATK/DEF/AGI/EXP. Runtime level scaling is owned by battle; static monster data must not depend on map location.

## Extension points

Future AI patterns, skills, formations, and ecology metadata can be added to definitions.

When responsibility, public API, or owned state changes, increment `Document Version`.
