# Crafting Data

- Document Version: 2
- Architecture Baseline: v0.16
- Last Architecture Change: v0.18

## Responsibility

Declarative forge and alchemy recipe definitions.

## Public surface

`forge-recipes.js`, `alchemy-recipes.js`, re-exported by `src/data/index.js`.

## Invariants

Recipe IDs are stable keys and may be persisted as unlock/reward identifiers. Material costs belong here. `requiresUnlock:true` means the forge engine must also find `state.unlocks.recipes[recipe.id]` before displaying the recipe; absence keeps legacy discovery-driven behavior.

## Extension points

Quest/story recipe rewards, location/skill requirements and future recipe metadata should be expressed declaratively when possible.

When responsibility, public API, or owned state changes, increment `Document Version`.
