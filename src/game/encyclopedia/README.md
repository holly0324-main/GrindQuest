# Encyclopedia

- Document Version: 1
- Architecture Baseline: v0.16
- Last Architecture Change: v0.16

## Responsibility

Build item and monster encyclopedia views from canonical data plus runtime kill counts.

## Public surface

`encyclopedia.js`.

## Owned state / data

Reads `state.encyclopedia.kills`.

## Dependencies

Data and item catalog.

## Invariants

Do not copy drop rates/habitats into encyclopedia-specific data; derive them from canonical tables.

## Extension points

Discovery flags, unknown silhouettes, completion rates, and lore unlocks can be added here.

When responsibility, public API, or owned state changes, increment `Document Version`.
