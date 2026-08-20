# Equipment

- Document Version: 1
- Architecture Baseline: v0.16
- Last Architecture Change: v0.16

## Responsibility

Gear instance model/stat calculation and equip/sell actions.

## Public surface

`model.js` for pure gear lookup/stat helpers; `actions.js` for state mutations.

## Owned state / data

`state.gear` and character equipment references.

## Dependencies

Item data; character module only from actions, never from model.

## Invariants

Gear instances reference immutable base IDs. One gear instance may be equipped by only one character.

## Extension points

Add affix pools, durability, reforging, and workmanship rules without changing character base stats.

When responsibility, public API, or owned state changes, increment `Document Version`.
