# Source Tree

- Document Version: 1
- Architecture Baseline: v0.16
- Last Architecture Change: v0.16

`src/data` owns declarative content, `src/game` owns gameplay rules/state mutation, `src/ui` owns presentation/orchestration, and `src/core` contains compatibility facades only. `main.js` wires persistence, normalized state, and `AppUI` together.

See the repository-root `ARCHITECTURE.md` before cross-domain changes.
