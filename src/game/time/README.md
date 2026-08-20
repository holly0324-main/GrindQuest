# World Clock

- Document Version: 1
- Architecture Baseline: v0.16
- Last Architecture Change: v0.16

## Responsibility

50-step phases, day progression, perishables aging, fatigue accumulation, and timed-process readiness.

## Public surface

`clock.js`.

## Owned state / data

`state.calendar`, `state.condition` time counters, `state.timedProcesses`; advances item age.

## Dependencies

Inventory aging and character derived limits.

## Invariants

All gameplay time must advance via `advanceTime()`. 50 steps per phase, 150 per day.

## Extension points

Add scheduled NPC routines, fermentation, weather, or quest deadlines through timed/world-clock APIs.

When responsibility, public API, or owned state changes, increment `Document Version`.
