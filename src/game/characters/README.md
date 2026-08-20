# Characters and Party

- Document Version: 2
- Architecture Baseline: v0.16
- Last Architecture Change: v0.18

## Responsibility

Character records, derived stats, party membership, tactics, EXP/level growth, APP allocation, and expedition EXP observation.

## Public surface

`characters.js`.

## Owned state / data

`state.characters`, `state.party`; reads gear/condition.

## Dependencies

Equipment model, condition, expedition observer, shared utilities.

## Invariants

Maximum active party size is four. Derived combat values must come through `derivedCharacter()`. Level-up grants APP and does not heal current HP/MP. One EXP reward event is recorded once in the expedition summary, not once per party member.

## Extension points

Character-specific growth trees should extend character definitions/growth functions here.

When responsibility, public API, or owned state changes, increment `Document Version`.
