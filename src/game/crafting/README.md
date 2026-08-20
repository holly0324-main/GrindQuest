# Crafting

- Document Version: 2
- Architecture Baseline: v0.16
- Last Architecture Change: v0.17

## Responsibility

Game-level forge and alchemy production actions, recipe visibility, NPC forge orders, and skill-gated manual forging.

## Public surface

`forge.js`, `alchemy-actions.js`; manual cauldron simulator is under `alchemy/`. Forge APIs include `visibleForgeRecipes`, `forgeRecipeVisible`, `forgeOrderFee`, `canOrderCraft`, and `hasForgeSkill`.

## Owned state / data

Consumes inventory/gold, creates gear/stacks, advances world time, and records timed forge orders.

## Dependencies

Inventory, discovery, equipment model, clock, recipe data, characters for dexterity-based simple alchemy.

## Invariants

Recipe data owns material costs. In v0.17, forge listings expose only R1+ products whose required materials are known. NPC orders pay a processing fee. Manual forge implementation remains present but cannot start until `state.skills.manualForge` is learned.

## Extension points

Smithing skill acquisition, smithing level/tree, manual ingredient selection, specialist blacksmiths, and per-location order quality.

When responsibility, public API, or owned state changes, increment `Document Version`.
