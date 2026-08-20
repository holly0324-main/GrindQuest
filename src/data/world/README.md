# World Data

- Document Version: 1
- Architecture Baseline: v0.16
- Last Architecture Change: v0.16

## Responsibility

Overworld nodes/edges, zones/time encounter pools, local areas, and random exploration events.

## Public surface

`world-map.js`, `zones.js`, `local-areas.js`, `random-events.js`.

## Owned state / data

Static map and encounter definitions.

## Dependencies

Monster/item IDs only.

## Invariants

World node IDs and local area node IDs are stable content keys. `field` and `dungeon` remain distinct local-area types.

## Extension points

Add towns, dungeons, transitions, resources, and event packs as data.

When responsibility, public API, or owned state changes, increment `Document Version`.
