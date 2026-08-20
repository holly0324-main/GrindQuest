# Shared Game Primitives

- Document Version: 1
- Architecture Baseline: v0.16
- Last Architecture Change: v0.16

## Responsibility

Small dependency-free utilities and constants used across domains.

## Public surface

`utils.js`, `constants.js`.

## Owned state / data

None.

## Dependencies

No gameplay domains.

## Invariants

Do not put stateful gameplay behavior here.

## Extension points

Generic RNG helpers/constants may be promoted here when used by multiple domains.

When responsibility, public API, or owned state changes, increment `Document Version`.
