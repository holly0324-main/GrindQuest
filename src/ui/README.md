# UI

- Document Version: 1
- Architecture Baseline: v0.16
- Last Architecture Change: v0.16

## Responsibility

Mobile-first HTML rendering/orchestration and event binding. `app.js` is the v0.16 composition class; pure formatting helpers live separately.

## Public surface

`AppUI` in `app.js`, pure helpers in `helpers.js`.

## Owned state / data

Ephemeral UI state only: selected tabs/scenes/modals/minigame pointers. Game state mutations go through domain APIs.

## Dependencies

Imports game domains directly plus data needed for display.

## Invariants

Do not duplicate gameplay formulas in UI. A UI action should call a domain API, persist via `onChange`, then rerender.

## Extension points

Extract screens/components when they become independently large; keep domain rules out of extracted views.

When responsibility, public API, or owned state changes, increment `Document Version`.
