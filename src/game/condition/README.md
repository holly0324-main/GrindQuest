# Character Conditions

- Document Version: 1
- Architecture Baseline: v0.16
- Last Architecture Change: v0.16

## Responsibility

Cross-character condition modifiers such as fatigue penalties.

## Public surface

`condition.js`.

## Owned state / data

Reads `state.condition`.

## Dependencies

Shared utilities only.

## Invariants

Conditions return modifiers and should not duplicate character stat formulas.

## Extension points

Future hunger, wounds, weather debuffs, or buffs may become separate condition modules.

When responsibility, public API, or owned state changes, increment `Document Version`.
