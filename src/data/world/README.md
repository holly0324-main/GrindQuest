# World Data

- Document Version: 2
- Architecture Baseline: v0.16
- Last Architecture Change: v0.19

## Responsibility

Overworld nodes/edges, zones/time encounter pools, local areas, and random exploration events.

## Public surface

`world-map.js`, `zones.js`, `local-areas.js`, `random-events.js`.

## Owned state / data

Static map and encounter definitions.

## Dependencies

Monster/item IDs only.

## Invariants

Zone/local-area data may declare `enemyLevels:{min,max,rareMax,rareChance}` and nodes may override with fixed `enemyLevel`. Encounter strength distribution stays data-driven.

## Extension points

Add towns, dungeons, transitions, resources, and event packs as data.

When responsibility, public API, or owned state changes, increment `Document Version`.
