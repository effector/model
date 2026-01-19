# Testing Strategy

This document outlines the testing strategy for `effector-model` (specifically `core-experimental` and `react` packages) to ensure 100% code coverage and robust behavior.

## 1. Core Experimental (`packages/core-experimental`)

The core package contains the primitives for the new Model API. Tests must cover both the internal mechanisms (unit tests) and the public API usage (integration/example tests).

### 1.1 Primitives (Unit Tests)

- **`index.ts`**:
  - [x] **Gap**: Verify all public primitives are exported (`model`, `define`, `keyval`, `union`, `facet`, `select`, `match`, `create`, `isLens`).

- **`define.ts`**:
  - [x] `store`: Verify creation of store definitions.
  - [x] `event`: Verify creation of event definitions.
  - [x] `array`: Verify creation of array definitions.
  - [x] `ref`: Verify `self` and `tag` references.
  - [ ] **Gap**: Verify type inference for definitions (compile-time check).

- **`facet.ts`**:
  - [x] `facet`: Verify facet definition structure.
  - [x] **Gap**: Test empty facet definition.
  - [x] **Gap**: Test nested facets.

- **`model.ts`**:
  - [x] `model`: Verify configuration object creation.
  - [x] **Gap**: Test invalid/empty model configurations.

- **`instance.ts`**:
  - [x] `create`: Verify instance creation from model.
  - [x] `input`: Verify input processing and reactivity.
  - [x] `variant`: Verify variant switching logic.
  - [x] `lifecycle`: Verify `enter`/`leave` events for variants.
  - [x] `multiplexing`: Verify facet multiplexing across variants.
  - [x] **Gap/Fix**: Fix `destroy` test and ensure strict cleanup of subscriptions.
  - [x] **Gap**: Test `destroy` behavior on nested models.
  - [x] **Gap**: Test `create` with extra input fields (ignored).

- **`keyval.ts`**:
  - [x] `add`/`remove`: Verify basic list operations.
  - [x] `getItem`: Verify proxy creation (Store vs Event).
  - [x] `union`: Verify handling of union models (polymorphism).
  - [x] **Gap**: Test removing an item that has active Lenses attached.
  - [x] **Gap**: Test `getItem` with dynamic ID (Store).
  - [x] **Gap**: Test duplicate `add` with same ID (idempotency).
  - [x] **Gap**: Test `add` with missing required input fields.

- **`lens.ts`**:
  - [x] `select`: Verify builder API.
  - [x] `path`: Verify path resolution (static, nested).
  - [x] `fallback`: Verify fallback values when path is missing or ID is null.
  - [x] **Gap**: Verify `isLens` helper.
  - [x] **Gap**: Test Chained Lenses (`select(item).facet().path()`).
  - [x] **Gap**: Test Deep Reactivity (updates in nested properties).
  - [x] **Gap**: Test `variant()` and `facet()` filters in Lens.
  - [x] **Gap**: Test Builder Immutability.

- **`match.ts`**:
  - [x] `match`: Verify event routing based on active variant.
  - [x] **Gap**: Test Dynamic Variant Switching.
  - [x] **Gap**: Test `match` with empty cases.

### 1.2 Examples (Business Logic Tests)

- **Game Model (`examples/game.test.ts`)**:
  - [x] `winning`/`losing`/`draw` states.
  - [x] Facet implementation per state.
  - [x] **Fix**: `StatsModel` timing test (timeout issue).
  - [x] **Gap**: Test edge cases (score = 0, rapid switching).

- **User Model (`examples/user.test.ts`)**:
  - [x] Union types (`Guest` vs `Member`).
  - [x] Polymorphic `keyval`.
  - [x] `match` usage for specific logic.
  - [x] **Fix**: `select` fallback test failure.

## 2. React Integration (`packages/react`)

Tests ensure that the models works correctly within React components using `effector-react`.

### 2.1 Examples

- **`GameDemo.test.tsx`**:
  - [x] Rendering model state (`useUnit`).
  - [x] Triggering events.
  - [x] Reacting to variant changes.

- **`UserDemo.test.tsx`**:
  - [x] Rendering lists (`keyval.$items`).
  - [x] Selection logic.
  - [x] Polymorphic rendering.

## 3. Execution Plan

1.  **Fix Core Primitives**: Address failures in `lens.ts`, `match.ts`, and `instance.ts`.
2.  **Verify Core Tests**: Run `core-experimental` tests until all pass.
3.  **Expand Coverage**: Add missing test cases identified in "Gaps".
4.  **Fix Example Tests**: Address timeout and logic errors in `game.test.ts` and `user.test.ts`.
5.  **Run All Tests**: Execute `nx test` for all packages to ensure green suite.
