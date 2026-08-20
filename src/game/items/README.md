# Item Catalog Semantics

- Document Version: 1
- Architecture Baseline: v0.16
- Last Architecture Change: v0.16

## Responsibility

Resolve item definitions, tag/rank semantics, and quality labels shared by inventory/crafting/encyclopedia.

## Public surface

`catalog.js`.

## Owned state / data

None.

## Dependencies

Data item definitions and shared constants.

## Invariants

No inventory mutation. This module describes items; inventory owns instances/stacks.

## Extension points

Add generic item metadata interpretation here.

When responsibility, public API, or owned state changes, increment `Document Version`.
