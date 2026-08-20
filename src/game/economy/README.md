# Economy

- Document Version: 2
- Architecture Baseline: v0.16
- Last Architecture Change: v0.17

## Responsibility

Consumable purchasing, backpack upgrades, and material/valuable selling. Successful item purchases register actual acquisition through the discovery domain.

## Public surface

`economy.js`.

## Owned state / data

Mutates `state.gold`, backpack selection, consumable ownership, and inventory through inventory APIs.

## Dependencies

Inventory, discovery, item/backpack data, and item tag/quality helpers.

## Invariants

Selling is village-only. Inventory capacity is checked before charging for stack items. Equipment purchasing is intentionally owned by `game/equipment/shop.js`, not this module.

## Extension points

Town price modifiers, merchants, buyback, reputation, and economy-specific events.

When responsibility, public API, or owned state changes, increment `Document Version`.
