# Expedition Result Domain

- Document Version: 1
- Architecture Baseline: v0.18
- Last Architecture Change: v0.18

## Responsibility
Track one outing from departure to return and freeze the run into an exploration-result snapshot.

## Owned state
- `state.run.summary` while exploring
- `state.expeditions.lastResult`
- `state.expeditions.history` (last 20)

## Public API
`startExpeditionSummary`, `recordBattleStart`, `recordEnemyDefeat`, `recordExpGain`, `recordItemGain`, `recordFirstGet`, `recordFirstMonster`, `recordDiscovery`, `recordReach`, `finalizeExpedition`.

## Invariants
Tracking must never award gameplay resources. It observes/records outcomes produced by other domains. A finalized result is a snapshot and must not depend on the bag still containing the acquired items.

## Extension points
Add result metrics (quests progressed, bosses, recipes, story flags) here rather than reconstructing them from UI text.
