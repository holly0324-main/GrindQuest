# Game Data

- Document Version: 2
- Architecture Baseline: v0.16
- Last Architecture Change: v0.17

## Responsibility

Declarative game content. Definitions are split by content family and re-exported by `index.js`.

## Public surface

`index.js` is the canonical aggregate. `gameData.js` is compatibility-only.

## Owned state / data

Static definitions only, including location-specific shop inventories under `shops/`.

## Dependencies

No gameplay modules. `catalog-normalize.js` may normalize legacy rank fields after importing raw definitions.

## Invariants

Data must not mutate runtime state. IDs are stable save/content keys. Shop lists reference canonical item IDs and do not duplicate item prices/stats.

## Extension points

Add new data families as new subdirectories and re-export them from `index.js`.

When responsibility, public API, or owned state changes, increment `Document Version`.
