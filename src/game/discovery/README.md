# Discovery and Knowledge

- Document Version: 2
- Architecture Baseline: v0.16
- Last Architecture Change: v0.18

## Responsibility

Track what the player knows versus what they have actually obtained/seen. This is the canonical knowledge layer shared by inventory, battle, shops, crafting, story/event rewards, the Adventure Handbook and migration.

## Public surface

`discovery.js`:

- item: `learnItem`, `obtainItem`, discovery/acquisition queries
- monster: `learnMonster`, `seeMonster`, discovery/seen queries
- generic future knowledge: `learnRecord`, `recordKnowledge`, `knownRecords`
- first-get queue helpers
- migration/backfill initialization

## Owned state / data

- `state.encyclopedia.knowledge.items`
- `state.encyclopedia.knowledge.monsters`
- `state.encyclopedia.knowledge.records` (`recipes`, `people`, `places`, `rumors`, `events` reserved)
- `state.encyclopedia.firstGetQueue`
- `state.encyclopedia.discoveryInitialized`

## Dependencies

Static item/monster data, rarity helper and expedition observation hooks. Do not depend on inventory, battle, crafting, UI, encyclopedia or handbook presentation.

## Invariants

Knowledge and actual acquisition/encounter remain separate. Learning never consumes the future first-get event. First acquisition queues exactly one first-get notice. When an expedition is active, a newly learned/obtained/seen fact is also reported to the expedition observer.

## Extension points

Story/event knowledge sources, recipe/person/place/rumor/event handbook sections, discovery source descriptions, secret knowledge tiers.

When responsibility, public API, or owned state changes, increment `Document Version`.
