# Discovery and Knowledge

- Document Version: 1
- Architecture Baseline: v0.16
- Last Architecture Change: v0.17

## Responsibility

Track whether an item/monster is known, actually obtained/seen, and queue first-acquisition notices. This is a low-level cross-cutting domain used by inventory, battle, shops, crafting, state migration, and encyclopedia presentation.

## Public surface

`discovery.js`; key APIs include `learnItem`, `obtainItem`, `learnMonster`, `seeMonster`, discovery queries, first-get queue helpers, and migration initialization.

## Owned state / data

`state.encyclopedia.knowledge`, `state.encyclopedia.firstGetQueue`, and `state.encyclopedia.discoveryInitialized`.

## Dependencies

Static item/monster data and the item rarity helper only. Do not depend on inventory, battle, crafting, UI, or encyclopedia presentation.

## Invariants

Knowledge and acquisition/encounter are separate. Learning an entry never consumes the future first-get event. A first-get notification is queued only on the first actual acquisition and only when `announce` is enabled.

## Extension points

Story/event knowledge sources, discovery timestamps/places, hidden encyclopedia tiers, notifications for first encounters, and achievement/completion tracking.

When responsibility, public API, or owned state changes, increment `Document Version`.
