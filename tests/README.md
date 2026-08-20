# Tests

- Document Version: 1
- Architecture Baseline: v0.16
- Last Architecture Change: v0.16

## Active npm test path

- `smoke.mjs` — basic game loop
- `route.mjs` — world route integrity
- `camp-raid.mjs` — camping encounter behavior
- `v14.mjs` — party/multi-enemy baseline behavior
- `v15.mjs` — field healing targets and v0.14+ save baseline
- `v16.mjs` — architecture boundaries/facades/direct domain imports
- `ui-smoke.mjs` — render/binding smoke test

Older `v05`–`v13` files are historical regression references and are not all part of the current npm script because v0.14 intentionally reset progress compatibility.

When a cross-domain contract or save schema changes, add/update the focused version test and keep the smoke suite green.
