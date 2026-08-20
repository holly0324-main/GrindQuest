# Item Data

- Document Version: 1
- Architecture Baseline: v0.16
- Last Architecture Change: v0.16

## Responsibility

Definitions for equipment bases, materials, and consumables.

## Public surface

`equipment.js`, `materials.js`, `consumables.js`.

## Owned state / data

Static item definition objects.

## Dependencies

None outside data normalization.

## Invariants

Item IDs are stable. `rank` is Rn rarity; quality is runtime stack/gear state and must not be encoded into base definitions.

## Extension points

Add tags/effects here when they are inherent to the item type.

When responsibility, public API, or owned state changes, increment `Document Version`.
