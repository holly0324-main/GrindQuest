# Encyclopedia

- Document Version: 3
- Architecture Baseline: v0.16
- Last Architecture Change: v0.18

## Responsibility

Build full item/monster reference projections from canonical data plus runtime kill/discovery metadata.

## Public surface

`encyclopedia.js` returns display-ready item/monster entries. Discovery mutation/query APIs live in `game/discovery`.

## Owned state / data

Reads `state.encyclopedia.kills` and discovery state; does not own acquisition mutation.

## Dependencies

Canonical data, item catalog, discovery queries.

## Invariants

Do not copy drop rates/habitats into encyclopedia-specific data; derive them from canonical tables. **The encyclopedia is allowed to show the full canonical catalog regardless of discovery.** Discovery flags are metadata only. The discovered-only player-facing view belongs to `game/handbook`.

## Extension points

Additional reference filters, lore pages, regional indexes and developer/reference diagnostics.

When responsibility, public API, or owned state changes, increment `Document Version`.
