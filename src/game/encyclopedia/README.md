# Encyclopedia

- Document Version: 4
- Architecture Baseline: v0.16
- Last Architecture Change: v0.19

## Responsibility

Build full item/monster reference projections from canonical data plus runtime kill/discovery metadata.

## Public surface

`encyclopedia.js` returns display-ready item/monster entries. Discovery mutation/query APIs live in `game/discovery`.

## Owned state / data

Reads `state.encyclopedia.kills` and discovery state; does not own acquisition mutation.

## Dependencies

Canonical data, item catalog, discovery queries.

## Invariants

Full-reference monster projections include Lv.1 base stats and habitat-specific encounter level ranges. Runtime battle instances remain owned by battle.

## Extension points

Additional reference filters, lore pages, regional indexes and developer/reference diagnostics.

When responsibility, public API, or owned state changes, increment `Document Version`.
