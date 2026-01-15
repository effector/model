# Implementation Plan: Effector Models Research & Optimization

This document outlines the strategy for implementing the finalized Effector Models API, refining the research examples, and optimizing the build stack for maximum performance.

## 1. Core API Completion (`packages/core-experimental`)

### Operator Implementation

- **`implement(trait, implementation)`**: Create a formal helper to link abstract traits with concrete reactive logic.
- **`ref.self`**: Support recursive model definitions (e.g., categories with subcategories).
- **`ref.tag(name)`**: Support internal cross-references within traits for units that depend on each other.
- **Improved Lenses**: Enhance Proxy-based path resolution in `select().path()` for cleaner deep state access.

### Lifecycle & Multiplexing

- **Variant Lifecycle**: Ensure `enter` and `leave` events are reliably triggered during variant transitions.
- **Reactive Multiplexing**: Optimize how stores and events are swapped when variants change to ensure zero glitches.

## 2. Research Examples Refinement (`apps/models-research`)

### Game Model Demo

- Update `gameModel` to use the finalized `implement` and `variant` APIs.
- Refine `statsModel` to demonstrate robust lifecycle event consumption.

### User Union Demo

- Finalize the polymorphic `usersList` implementation.
- Demonstrate advanced `match` usage for variant-specific business logic.

## 3. Performance & Build Stack Upgrade

### Tooling

- **Vite 6/8 Beta**: Upgrade the dev server and bundler.
- **OXC**: Integrate `@vitejs/plugin-react` with OXC for ultra-fast transpilation.
- **Rolldown**: Switch to Rolldown for production builds to achieve the target 2x speedup.
- **Dev Mode Optimization**: Enable optimized bundling in dev to prevent excessive file requests.

## 4. Testing & Quality Assurance

### Coverage Goal: 100%

- **Unit Tests**: Full coverage of all core operators in `core-experimental`.
- **Integration Tests**: End-to-end business logic verification for Game and User examples.
- **React Integration**: Verify UI synchronization using `effector-react` with `fork` scopes.
- **Tooling**: Use `vitest` with `v8` coverage reporting.

## 5. Implementation Roadmap

1.  **Phase 1: API Core**: Implement `implement`, `ref.self`, and `ref.tag`.
2.  **Phase 2: Build Upgrade**: Update Vite, OXC, and Rolldown configuration.
3.  **Phase 3: Example Refinement**: Update Game and User demos to use the new API.
4.  **Phase 4: Test Suite Expansion**: Write exhaustive tests to reach 100% coverage.
5.  **Phase 5: Final Verification**: Run full build and test suite to ensure "green" status.
