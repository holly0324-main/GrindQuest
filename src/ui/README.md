# UI

- Document Version: 4
- Architecture Baseline: v0.16
- Last Architecture Change: v0.19

## Responsibility

Mobile-first HTML rendering/orchestration and event binding. `app.js` is the composition class; pure formatting helpers live separately.

## Public surface

`AppUI` in `app.js`, pure helpers in `helpers.js`.

## Owned state / data

Ephemeral UI state only: selected tabs/scenes/modals/minigame pointers. Game state mutations go through domain APIs.

## Dependencies

Imports domain APIs/projections directly plus canonical data needed for display.

## Invariants

Battle presentation shows each enemy instance Lv. First-get UI consumes the complete pending queue in one overlay when multiple items are acquired together; single-item acquisition keeps the large-card presentation.

## Extension points

Extract screens/components when independently large. v0.18 adds result presentation, handbook tabs and quest-board cards; these are good candidates for future component extraction if they grow.

When responsibility, public API, or owned state changes, increment `Document Version`.
