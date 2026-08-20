# Adventure Handbook

- Document Version: 1
- Architecture Baseline: v0.18
- Last Architecture Change: v0.18

## Responsibility
Present only knowledge the player has actually learned during play. This is intentionally separate from the all-data encyclopedia/reference book.

## Current sections
Monsters, items, equipment and materials.

## Dependencies
Reads `game/discovery` and encyclopedia projections. It does not mutate discovery state.

## Extension points
`discovery.knowledge.records` already reserves recipes, people, places, rumors and events. Add a section here when one of those becomes player-facing.
