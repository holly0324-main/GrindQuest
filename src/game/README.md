# Game Domains

- Document Version: 4
- Architecture Baseline: v0.16
- Last Architecture Change: v0.19

## Responsibility

Gameplay implementation organized by responsibility.

v0.19 adds data-driven encounter levels and per-character battle EXP level-difference handling without creating a new gameplay domain.

v0.18 adds:

- `expedition/` — one-outing result tracking
- `handbook/` — discovered-only player record projection
- `quests/` — data-driven objectives/rewards

`discovery/` remains the canonical knowledge layer.

## Public surface

Each child directory exposes its own API. `core/game.js` aggregates historical APIs only for compatibility.

## Owned state / data

Runtime state is partitioned by child-domain ownership. See root `ARCHITECTURE.md`.

## Dependencies

Data and lower-level game domains only. UI must never be imported by gameplay domains.

## Invariants

Avoid feature-specific cross-domain branches. Discovery goes through `game/discovery`; one-adventure metrics through `game/expedition`; request-board content belongs in `data/quests` and is interpreted by `game/quests`.

## Extension points

New major systems should get a directory and README instead of expanding unrelated modules.

When responsibility, public API, or owned state changes, increment `Document Version`.
