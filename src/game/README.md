# Game Domains

- Document Version: 2
- Architecture Baseline: v0.16
- Last Architecture Change: v0.17

## Responsibility

Gameplay implementation organized by responsibility. v0.17 adds `discovery/` as the low-level domain for item/monster knowledge and first-acquisition tracking.

## Public surface

Each child directory exposes its own module API. `core/game.js` aggregates them only for compatibility.

## Owned state / data

Runtime state is partitioned by child-domain ownership. `discovery/` owns knowledge/acquisition metadata while `encyclopedia/` owns presentation assembly and kill-count display.

## Dependencies

Data and lower-level game domains only. See root `ARCHITECTURE.md` for the dependency direction.

## Invariants

Avoid importing UI. Prefer one-way dependencies documented in root `ARCHITECTURE.md`. Cross-cutting discovery changes go through `game/discovery` rather than being duplicated in battle/inventory/shop code.

## Extension points

New major systems should get a directory and README instead of expanding unrelated modules.

When responsibility, public API, or owned state changes, increment `Document Version`.
