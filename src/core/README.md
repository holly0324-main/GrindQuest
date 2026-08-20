# Core Compatibility Facades

- Document Version: 1
- Architecture Baseline: v0.16
- Last Architecture Change: v0.16

## Responsibility

Preserve historical import paths while implementation lives in domain modules. New gameplay code should not be added here.

## Public surface

`game.js`, `alchemy.js`, `storage.js` only re-export current implementations.

## Owned state / data

None.

## Dependencies

Domain modules under `src/game` and `src/data`.

## Invariants

Keep exports backwards compatible for tests and older code. Do not reintroduce implementation into facade files.

## Extension points

Retire a facade only as an explicit breaking architecture change.

When responsibility, public API, or owned state changes, increment `Document Version`.
