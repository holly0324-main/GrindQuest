# Equipment

- Document Version: 2
- Architecture Baseline: v0.16
- Last Architecture Change: v0.17

## Responsibility

Gear instance model/stat calculation, equip/sell actions, and location-specific equipment shop purchasing.

## Public surface

`model.js` for pure gear lookup/stat helpers; `actions.js` for equip/sell mutations; `shop.js` for shop stock/reveal/purchase.

## Owned state / data

`state.gear` and character equipment references. Shop stock itself is static under `src/data/shops`.

## Dependencies

Item/shop data and discovery; character module only from actions, never from model.

## Invariants

Gear instances reference immutable base IDs. One gear instance may be equipped by only one character. Shop purchases create workmanship-0 gear and record first acquisition.

## Extension points

Additional town stock, affix pools, durability, reforging, workmanship rules, reputation, and shop conditions.

When responsibility, public API, or owned state changes, increment `Document Version`.
