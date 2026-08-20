# Game Domains

- Document Version: 1
- Architecture Baseline: v0.16
- Last Architecture Change: v0.16

## Responsibility

Gameplay implementation organized by responsibility.

## Public surface

Each child directory exposes its own module API. `core/game.js` aggregates them only for compatibility.

## Owned state / data

Runtime state is partitioned by child-domain ownership.

## Dependencies

Data and lower-level game domains only.

## Invariants

Avoid importing UI. Prefer one-way dependencies documented in root `ARCHITECTURE.md`.

## Extension points

New major systems should get a directory and README instead of expanding unrelated modules.

When responsibility, public API, or owned state changes, increment `Document Version`.
