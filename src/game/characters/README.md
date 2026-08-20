# Characters and Party

- Document Version: 1
- Architecture Baseline: v0.16
- Last Architecture Change: v0.16

## Responsibility

Character records, derived stats, party membership, tactics, EXP/level growth, and APP allocation.

## Public surface

`characters.js`.

## Owned state / data

`state.characters`, `state.party`; reads gear/condition.

## Dependencies

Equipment model, condition, shared utilities.

## Invariants

Maximum active party size is four. Derived combat values must come through `derivedCharacter()`. Level-up grants APP and does not heal current HP/MP.

## Extension points

Character-specific growth trees should extend character definitions/growth functions here.

When responsibility, public API, or owned state changes, increment `Document Version`.
