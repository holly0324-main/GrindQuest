# Economy

- Document Version: 1
- Architecture Baseline: v0.16
- Last Architecture Change: v0.16

## Responsibility

Village purchasing, backpack upgrades, material/valuable selling.

## Public surface

`economy.js`.

## Owned state / data

`state.gold`; invokes inventory mutation.

## Dependencies

Inventory and item/backpack data.

## Invariants

Enemies do not award money directly; money primarily comes from selling items.

## Extension points

Add shops, regional prices, merchants, and buyback policies here.

When responsibility, public API, or owned state changes, increment `Document Version`.
