# GrindQuest Architecture

- Document Version: 2
- Architecture Baseline: v0.16
- Last Architecture Change: v0.18

## Goal

GrindQuest is a static ES-module PWA organized by gameplay responsibility. A feature change should normally require one domain README plus its directly related data/UI files rather than reading the entire game.

## Dependency direction

```text
src/data/*
   ↓
shared + items + condition + expedition
   ↓
discovery
   ↓
equipment/model + characters + inventory
   ↓
time
   ↓
battle / exploration / economy / crafting / encyclopedia
   ↓
handbook / quests
   ↓
state (save-shape normalization / composition)
   ↓
ui + main
```

`src/core/game.js`, `src/core/alchemy.js`, and `src/core/storage.js` are compatibility facades. New runtime code should import the owning domain directly.

## State ownership

- `state.characters`, `state.party` → `game/characters`
- `state.gear` and character equipment references → `game/equipment`
- `state.itemStacks`, warehouse levels, backpack capacity rules → `game/inventory`
- `state.calendar`, `state.condition`, `state.timedProcesses` → `game/time` / `game/condition`
- `state.battle` → `game/battle`
- navigation/life-skill portion of `state.run` → `game/exploration`
- `state.run.summary`, `state.expeditions` → `game/expedition`
- `state.encyclopedia.knowledge`, first-get queue → `game/discovery`
- `state.encyclopedia.kills` + full-reference projection → `game/encyclopedia`
- discovered-only handbook projection → `game/handbook` (read-only)
- `state.quests` and quest reward unlock flags → `game/quests`
- complete state creation / migration → `game/state`

## v0.18 loop boundary

The first explicit meta-loop is:

```text
quest board
   ↓
expedition starts → state.run.summary
   ↓
normal domains perform battles / gathering / discovery
   ↓                    ↘ discovery knowledge
expedition observers record outcomes
   ↓
return → immutable expedition result snapshot
   ↓
Adventure Handbook + quest progress/rewards
   ↓
next expedition
```

The expedition module is an observer/recorder. It must not award resources. Quest progress should prefer evaluating canonical state (kills, inventory, discovery, boss flags) rather than adding quest-ID-specific branches to battle/exploration.

## Encyclopedia vs Adventure Handbook

- **Encyclopedia**: developer/player reference that may show the complete canonical catalog from the beginning.
- **Adventure Handbook**: diegetic player record; only entries learned through `game/discovery` appear.

Do not merge these responsibilities. Future recipes, people, places, rumors and events should be learned through generic discovery records and projected into the Handbook when UI sections are added.

## Rules for future changes

1. Prefer data under `src/data` over item/monster/quest-specific UI branches.
2. A domain mutates only state it owns except explicitly documented cross-domain effects.
3. Time advances only through `advanceTime()`.
4. Inventory creation/removal goes through inventory APIs.
5. Character combat stats come from `derivedCharacter()`.
6. `src/core/*` compatibility facades remain stable until intentionally retired.
7. If responsibility/public API/persisted state shape changes, increment the owning README `Document Version` and update `Last Architecture Change`.
8. Add/update a focused test before changing a cross-domain contract.
9. Acquisition/encounter/story knowledge is recorded through `game/discovery`.
10. Expedition result metrics are recorded at the event source; never reconstruct them from UI strings or final bag contents.
11. New quest content should normally be data-only. Add engine handlers only for genuinely new objective/reward types.

## UI policy

`src/ui/app.js` remains the screen orchestration class. It may compose domain projections but must not duplicate gameplay formulas. Extract a screen/component when it becomes independently large.

## Save compatibility

v0.14 remains the intentional progress compatibility baseline. v0.18 normalizes supported v0.14+ saves and adds expedition archive, quest state, generic knowledge records, recipe unlocks and story flags with safe defaults. Pre-v0.14 progress is intentionally reset while preserving settings.
