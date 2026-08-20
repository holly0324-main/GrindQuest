# State Composition and Normalization

- Document Version: 3
- Architecture Baseline: v0.16
- Last Architecture Change: v0.18

## Responsibility

Create the complete runtime state and normalize supported historical saves into the current shape.

## Public surface

`defaultState`, `normalize` in `state.js`.

## Owned state / data

Composition of the complete save shape. Nested domains remain owned by their domain modules.

## Dependencies

Low-level domains needed to construct/normalize state, including discovery, expedition archive and quest initialization.

## Invariants

v0.14 remains the progress compatibility baseline. Current version is 18. Existing possessions/kills are silently backfilled into discovery without generating first-get spam. v0.18 safely initializes:

- `state.expeditions`
- `state.quests`
- generic discovery records
- `state.unlocks.recipes`
- `state.story.flags`
- mid-run `state.run.summary` when needed

## Extension points

Add migration logic only for persisted shape changes. Prefer domain normalization helpers over duplicating rules here.

When responsibility, public API, or owned state changes, increment `Document Version`.
