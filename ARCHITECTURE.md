# GrindQuest Architecture

- Document Version: 1
- Architecture Baseline: v0.16
- Last Architecture Change: v0.16

## Goal

GrindQuest is a static ES-module PWA. The architecture is organized by gameplay responsibility so a change can usually be implemented by reading one domain, its README, and the directly related UI/data files instead of the whole project.

## Dependency direction

```text
src/data/*
   ↓
src/game/shared + items + condition
   ↓
equipment/model + characters + inventory
   ↓
time
   ↓
battle / exploration / economy / crafting / encyclopedia
   ↓
state (save-shape normalization / composition)
   ↓
ui + main
```

`src/core/game.js`, `src/core/alchemy.js`, and `src/core/storage.js` are compatibility facades. New runtime code should import the domain module directly.

## State ownership

- `state.characters`, `state.party` → `game/characters`
- `state.gear` and character equipment references → `game/equipment`
- `state.itemStacks`, warehouse levels, backpack capacity rules → `game/inventory`
- `state.calendar`, `state.condition`, `state.timedProcesses` → `game/time` / `game/condition`
- `state.battle` → `game/battle`
- `state.run`, `state.lifeSkills`, local-area traversal → `game/exploration`
- `state.encyclopedia` → `game/encyclopedia`
- complete state creation / migration → `game/state`

## Rules for future changes

1. Prefer adding data under `src/data` rather than branching logic for individual items/monsters in UI.
2. A domain may mutate only the state it owns, except for explicitly documented cross-domain operations such as battle rewards or exploration time advancement.
3. Time advances only through `advanceTime()`.
4. Inventory item creation/removal goes through inventory APIs; do not hand-edit `itemStacks` in new code unless implementing inventory internals.
5. Character combat stats come from `derivedCharacter()`; do not duplicate the formula in UI or battle data.
6. `src/core/*` compatibility facades must remain stable until intentionally retired.
7. When a module responsibility/public API/state shape changes, increment that directory README's `Document Version` and update `Last Architecture Change`.
8. Add or update a focused test before changing a cross-domain contract.

## UI policy

`src/ui/app.js` remains the screen orchestration class in v0.16, but it now imports domain APIs directly. Extract a screen/component when a feature becomes large enough to be changed independently. Pure formatting helpers belong in `src/ui/helpers.js`.

## Save compatibility

v0.14 is the intentional progress compatibility baseline. v0.16 reads v0.14/v0.15 state and normalizes it to the current state version. Pre-v0.14 progress is intentionally reset while preserving settings.
