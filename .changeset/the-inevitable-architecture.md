---
'@effector/model': major
'@effector-model/core-experimental': major
'@effector/model-react': major
---

# The Inevitable Architecture: Trait-Based Composition & Predictable Systems

This major update introduces a paradigm shift in how models are composed and consumed, moving from rigid structures to a flexible, trait-based system.

## Key Changes

- **Trait-Based Model Composition**: Introduced the `model()` API with support for Facets (traits) and Variants (conditional logic).
- **Deep Reactivity with Lenses**: New `Lens` concept and `select` API for type-safe, deep reactive access to model state.
- **Predictable System Architecture**:
  - Hardened development loop with Vitest console interceptors.
  - Strict ESLint rules to prevent common pitfalls (e.g., passing Lenses to `useUnit`).
  - Enhanced runtime validation and API guardrails in `useLens` and `select`.
- **New Experimental Package**: `@effector-model/core-experimental` houses the next-generation model system.
- **Advanced Features**:
  - Multi-restaurant support and item grouping in the cart.
  - Union API for handling heterogeneous product types.
  - `serialize` utility for model snapshots.
- **Refactorings**: Updated `@effector/model` and `@effector/model-react` to support the new Lens-based architecture and improved type safety.
