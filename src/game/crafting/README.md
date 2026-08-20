# Crafting

- Document Version: 1
- Architecture Baseline: v0.16
- Last Architecture Change: v0.16

## Responsibility

Game-level forge and alchemy production actions.

## Public surface

`forge.js`, `alchemy-actions.js`; manual cauldron simulator is under `alchemy/`.

## Owned state / data

Consumes inventory/gold, creates gear/stacks, advances world time.

## Dependencies

Inventory, equipment model, clock, recipe data, characters for dexterity-based simple alchemy.

## Invariants

Recipe data owns costs; runtime owns reservation, quality outcome, and state mutation.

## Extension points

Future smithing minigame and ingredient-selection UI should plug into these APIs instead of duplicating consumption logic.

When responsibility, public API, or owned state changes, increment `Document Version`.
