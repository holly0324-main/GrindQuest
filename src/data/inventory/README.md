# Inventory Data

- Document Version: 1
- Architecture Baseline: v0.16
- Last Architecture Change: v0.16

## Responsibility

Backpack capacity/price definitions.

## Public surface

`backpacks.js`.

## Owned state / data

Static backpack definitions.

## Dependencies

None.

## Invariants

Capacity is declarative; occupancy calculations belong to game/inventory.

## Extension points

Add bag traits or specialist packs without changing inventory callers.

When responsibility, public API, or owned state changes, increment `Document Version`.
