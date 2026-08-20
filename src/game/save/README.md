# Save Persistence

- Document Version: 1
- Architecture Baseline: v0.16
- Last Architecture Change: v0.16

## Responsibility

IndexedDB load/save/clear implementation.

## Public surface

`storage.js`.

## Owned state / data

Persistent serialized state only.

## Dependencies

Browser IndexedDB API. State schema validation occurs in game/state, not here.

## Invariants

Persistence does not own migration logic.

## Extension points

Add save slots/cloud adapters behind the same persistence boundary.

When responsibility, public API, or owned state changes, increment `Document Version`.
