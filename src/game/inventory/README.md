# Inventory and Warehouses

- Document Version: 3
- Architecture Baseline: v0.16
- Last Architecture Change: v0.18

## Responsibility

Stack identity, perishability, capacity, sorting, transfers, normal/fresh warehouse behavior, acquisition registration, and expedition gain observation for successfully added stack items.

## Public surface

`inventory.js`.

## Owned state / data

`state.itemStacks`, stack IDs, backpack/warehouse levels.

## Dependencies

Item catalog, discovery, expedition observer, data backpacks/consumables, shared constants.

## Invariants

Permanent items stack by item+quality+container. Perishables retain individual lifetime internally. Fresh warehouse aging rate is 1/3. `addStack()` records acquisition and expedition gain only after capacity permits the item to be added.

## Extension points

Future crafting/quest ingredient selectors should consume inventory through `takeItems()` or a higher-level selection API.

When responsibility, public API, or owned state changes, increment `Document Version`.
