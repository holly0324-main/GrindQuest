# Inventory and Warehouses

- Document Version: 2
- Architecture Baseline: v0.16
- Last Architecture Change: v0.17

## Responsibility

Stack identity, perishability, capacity, sorting, transfers, normal/fresh warehouse behavior, and acquisition registration for successfully added stack items.

## Public surface

`inventory.js`.

## Owned state / data

`state.itemStacks`, stack IDs, backpack/warehouse levels.

## Dependencies

Item catalog, discovery, data backpacks/consumables, shared constants.

## Invariants

Permanent items stack by item+quality+container. Perishables retain individual lifetime internally. Fresh warehouse aging rate is 1/3. `addStack()` records actual acquisition only after capacity permits the item to be added.

## Extension points

Future crafting ingredient selectors should consume inventory through `takeItems()` or a higher-level selection API.

When responsibility, public API, or owned state changes, increment `Document Version`.
