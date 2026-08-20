# State Composition and Normalization

- Document Version: 4
- Architecture Baseline: v0.16
- Last Architecture Change: v0.19

## Responsibility

Create the complete runtime state and normalize supported historical saves into the current shape.

## Public surface

`defaultState`, `normalize` in `state.js`.

## Owned state / data

Composition of the complete save shape. Nested domains remain owned by their domain modules.

## Dependencies

Low-level domains needed to construct/normalize state, including discovery, expedition archive and quest initialization.

## Invariants

v0.14 remains the progress compatibility baseline. Current version is 19. Existing possessions/kills are silently backfilled into discovery without generating first-get spam. v0.18+ state remains compatible; v0.19 additionally normalizes active battle enemies without a stored level to Lv.1. Existing v0.18 fields include:

- `state.expeditions`
- `state.quests`
- generic discovery records
- `state.unlocks.recipes`
- `state.story.flags`
- mid-run `state.run.summary` when needed

## Extension points

Add migration logic only for persisted shape changes. Prefer domain normalization helpers over duplicating rules here.

When responsibility, public API, or owned state changes, increment `Document Version`.
