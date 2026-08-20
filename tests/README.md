# Tests

- Document Version: 3
- Architecture Baseline: v0.16
- Last Architecture Change: v0.19

## Active npm test path

- `smoke.mjs` — basic game loop
- `route.mjs` — world route integrity
- `camp-raid.mjs` — camping encounter behavior
- `v14.mjs` — party/multi-enemy baseline
- `v15.mjs` — field healing targets/save baseline
- `v16.mjs` — architecture boundaries/facades
- `v17.mjs` — discovery, battle tactics, forge gating, equipment shop
- `v18.mjs` — expedition result tracking, Adventure Handbook, quest objectives/rewards and recipe unlock
- `v19.mjs` — grouped first-get queue, enemy level scaling/profiles and per-character level-difference EXP reduction
- `ui-smoke.mjs` — screen/render smoke including result/handbook/quest board

Older `v05`–`v13` files are historical references and are not all active because v0.14 intentionally reset progress compatibility.

When a cross-domain contract or save schema changes, add/update the focused version test and keep the active suite green.
