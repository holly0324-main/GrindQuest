# Encyclopedia

- Document Version: 2
- Architecture Baseline: v0.16
- Last Architecture Change: v0.17

## Responsibility

Build item and monster encyclopedia views from canonical data plus discovery records and runtime kill counts.

## Public surface

`encyclopedia.js` returns display-ready item/monster entries. Discovery mutation/query APIs live in the separate low-level `game/discovery` domain.

## Owned state / data

Reads `state.encyclopedia.kills` and discovery state; does not own acquisition mutation.

## Dependencies

Data, item catalog, and discovery queries.

## Invariants

Do not copy drop rates/habitats into encyclopedia-specific data; derive them from canonical tables. Undiscovered content is masked by UI rather than removed from canonical definitions.

## Extension points

Completion rates, lore pages, regional indexes, hidden entries, and knowledge-source descriptions.

When responsibility, public API, or owned state changes, increment `Document Version`.
