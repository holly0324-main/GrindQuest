# Game State Composition

- Document Version: 1
- Architecture Baseline: v0.16
- Last Architecture Change: v0.16

## Responsibility

Create a new state and normalize supported saves into the current schema.

## Public surface

`defaultState()`, `normalize()`.

## Owned state / data

Whole-state schema composition/migration only.

## Dependencies

All domains necessary to validate/normalize their owned portions.

## Invariants

v0.14 is the progress compatibility baseline. This module orchestrates migration but must not become general gameplay logic.

## Extension points

When state schema changes, add a focused version test and document the migration.

When responsibility, public API, or owned state changes, increment `Document Version`.
