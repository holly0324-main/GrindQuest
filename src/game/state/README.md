# State Composition and Normalization

- Document Version: 2
- Architecture Baseline: v0.16
- Last Architecture Change: v0.17

## Responsibility

Create the complete runtime state and normalize supported historical saves into the current shape.

## Public surface

`defaultState`, `normalize` in `state.js`.

## Owned state / data

Composition of the complete save shape. Individual nested domains remain owned by their domain modules.

## Dependencies

All low-level domains needed to construct/normalize state, including discovery initialization.

## Invariants

v0.14 remains the progress compatibility baseline. Current version is 17. Existing possessions and kills from v0.16 are silently backfilled into discovery knowledge without generating first-get popups.

## Extension points

Add migration steps only when a persisted state shape changes. Prefer domain-normalization helpers over duplicating domain rules here.

When responsibility, public API, or owned state changes, increment `Document Version`.
