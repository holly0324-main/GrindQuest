# Quest Domain

- Document Version: 1
- Architecture Baseline: v0.18
- Last Architecture Change: v0.18

## Responsibility
Evaluate data-driven request-board objectives and grant rewards on report/claim.

## Owned state
- `state.quests.accepted`
- `state.quests.claimed`
- reward unlock flags created by reward handlers (`state.unlocks`, `state.story`)

## Objective handlers
`kill`, `deliver`, `discover`, `dungeon`, `story`.

## Reward handlers
`gold`, `item`, `recipe`, `knowledge`, `story`.

## Invariants
Quest data belongs under `src/data/quests`. Battle/exploration should not contain quest-ID-specific branches. Kill progress uses the encyclopedia kill counter baseline; delivery/discovery/dungeon progress is evaluated from existing game state.

## Extension points
Add a new objective/reward handler once, then create many quests by data only.
