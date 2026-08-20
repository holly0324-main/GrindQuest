# Shop Data

- Document Version: 1
- Architecture Baseline: v0.16
- Last Architecture Change: v0.17

## Responsibility

Declare location-specific shop inventories without embedding purchasing rules in data.

## Public surface

`equipment-shops.js` currently exports `equipmentShops`.

## Owned state / data

Static shop IDs, names, tiers, and item IDs only.

## Dependencies

None. Referenced item IDs must exist in item data.

## Invariants

Shop data does not mutate runtime state or calculate prices. Equipment base definitions remain the canonical source of price/stats/rank.

## Extension points

Additional towns, rotating stock, shop reputation, conditional stock, and specialist stores.

When responsibility, public API, or owned state changes, increment `Document Version`.
