# UI

- Document Version: 3
- Architecture Baseline: v0.16
- Last Architecture Change: v0.18

## Responsibility

Mobile-first HTML rendering/orchestration and event binding. `app.js` is the composition class; pure formatting helpers live separately.

## Public surface

`AppUI` in `app.js`, pure helpers in `helpers.js`.

## Owned state / data

Ephemeral UI state only: selected tabs/scenes/modals/minigame pointers. Game state mutations go through domain APIs.

## Dependencies

Imports domain APIs/projections directly plus canonical data needed for display.

## Invariants

Do not duplicate gameplay formulas in UI. UI actions call domain APIs, persist via `onChange`, then rerender. The settings Encyclopedia is the full-data reference. The village Adventure Handbook is discovered-only. Expedition result screens render immutable result snapshots rather than querying current inventory.

## Extension points

Extract screens/components when independently large. v0.18 adds result presentation, handbook tabs and quest-board cards; these are good candidates for future component extraction if they grow.

When responsibility, public API, or owned state changes, increment `Document Version`.
