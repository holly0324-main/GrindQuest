# Core Compatibility Facades

- Document Version: 2
- Architecture Baseline: v0.16
- Last Architecture Change: v0.17

## Responsibility

Preserve historical import paths while implementation lives in domain modules. New gameplay code should not be added here.

## Public surface

`game.js`, `alchemy.js`, `storage.js` only re-export current implementations. v0.17 adds additive facade exports for discovery and equipment-shop APIs.

## Owned state / data

None.

## Dependencies

Domain modules under `src/game` and `src/data`.

## Invariants

Keep exports backwards compatible for tests and older code. Do not reintroduce implementation into facade files.

## Extension points

Retire a facade only as an explicit breaking architecture change.

When responsibility, public API, or owned state changes, increment `Document Version`.
