# Battle Action Data

- Document Version: 1
- Architecture Baseline: v0.16
- Last Architecture Change: v0.16

## Responsibility

Definitions for player skills and spells.

## Public surface

`actions.js`.

## Owned state / data

Static action definitions.

## Dependencies

None.

## Invariants

Action IDs are stable. Resolution formulas belong in battle logic, not data UI.

## Extension points

Add target type, elemental tags, status effects, and animation keys later.

When responsibility, public API, or owned state changes, increment `Document Version`.
