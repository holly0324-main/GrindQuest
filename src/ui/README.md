# UI

- Document Version: 2
- Architecture Baseline: v0.16
- Last Architecture Change: v0.17

## Responsibility

Mobile-first HTML rendering/orchestration and event binding. `app.js` is the composition class; pure formatting helpers live separately.

## Public surface

`AppUI` in `app.js`, pure helpers in `helpers.js`.

## Owned state / data

Ephemeral UI state only: selected tabs/scenes/modals/minigame pointers. Game state mutations go through domain APIs.

## Dependencies

Imports game domains directly plus data needed for display.

## Invariants

Do not duplicate gameplay formulas in UI. A UI action should call a domain API, persist via `onChange`, then rerender. First-get notices are dismissed by backdrop tap and encyclopedia unknown entries remain masked until knowledge is granted.

## Extension points

Extract screens/components when independently large. v0.17 UI supports in-battle tactic changes, discovery/first-get overlays, discovery-gated forge listings, and the village equipment shop.

When responsibility, public API, or owned state changes, increment `Document Version`.
