# Crafting Data

- Document Version: 1
- Architecture Baseline: v0.16
- Last Architecture Change: v0.16

## Responsibility

Forge and alchemy recipes.

## Public surface

`forge-recipes.js`, `alchemy-recipes.js`.

## Owned state / data

Static recipes and alchemy process parameters.

## Dependencies

References item/material IDs.

## Invariants

Recipes describe costs/products; runtime consumption and quality are handled by crafting modules.

## Extension points

Add recipe unlock metadata, tools, magic modifiers, and additional intermediate products here.

When responsibility, public API, or owned state changes, increment `Document Version`.
