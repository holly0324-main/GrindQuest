# Manual Alchemy Simulator

- Document Version: 1
- Architecture Baseline: v0.16
- Last Architecture Change: v0.16

## Responsibility

Realtime cauldron simulation independent from world-state mutation: temperature, ingredient thermal rates, stirring, extraction/stability/degradation, future effects.

## Public surface

`simulator.js`.

## Owned state / data

Session-local simulation object only.

## Dependencies

No game state or UI dependency. Uses `performance.now()` when available.

## Invariants

Simulation time is real elapsed time, not FPS. High-frequency pointer input is separate from 5–10Hz state updates and rAF rendering.

## Extension points

Alchemy magic should be added as session effects/actions here.

When responsibility, public API, or owned state changes, increment `Document Version`.
