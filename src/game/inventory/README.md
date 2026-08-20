# Inventory and Warehouses

- Document Version: 1
- Architecture Baseline: v0.16
- Last Architecture Change: v0.16

## Responsibility

Stack identity, perishability, capacity, sorting, transfers, normal/fresh warehouse behavior.

## Public surface

`inventory.js`.

## Owned state / data

`state.itemStacks`, stack IDs, backpack/warehouse levels.

## Dependencies

Item catalog, data backpacks/consumables, shared constants.

## Invariants

Permanent items stack by item+quality+container. Perishables retain individual lifetime internally. Fresh warehouse aging rate is 1/3.

## Extension points

Future crafting ingredient selectors should consume inventory through `takeItems()` or a higher-level selection API.

When responsibility, public API, or owned state changes, increment `Document Version`.
