# Crafting

- Document Version: 3
- Architecture Baseline: v0.16
- Last Architecture Change: v0.18

## Responsibility

Game-level forge/alchemy production actions, recipe visibility, NPC forge orders, recipe-unlock gates, and skill-gated manual forging.

## Public surface

`forge.js`, `alchemy-actions.js`; manual cauldron simulator is under `alchemy/`. Forge APIs include `visibleForgeRecipes`, `forgeRecipeVisible`, `forgeOrderFee`, `canOrderCraft`, `hasForgeSkill`.

## Owned state / data

Consumes inventory/gold, creates gear/stacks, advances world time and records timed forge orders. Reads `state.unlocks.recipes` for recipes explicitly marked `requiresUnlock`.

## Dependencies

Inventory, discovery, equipment model, clock, recipe data, characters for dexterity-based alchemy.

## Invariants

Recipe data owns material costs. Forge listings expose only R1+ products whose required materials are known. A recipe with `requiresUnlock:true` is additionally hidden until its ID exists in `state.unlocks.recipes`. This lets quests/story reward recipes without globally locking legacy recipes. NPC orders pay a processing fee. Manual forging remains present but cannot start until `state.skills.manualForge` is learned.

## Extension points

Smithing skill/tree, more quest/story recipe unlocks, manual ingredient selection, specialist blacksmiths, location-specific order quality.

When responsibility, public API, or owned state changes, increment `Document Version`.
