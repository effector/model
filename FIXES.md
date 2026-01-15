# Fixes & Refinements Plan

This document outlines the critical fixes and architectural refinements needed for the `core-experimental` package to transition from a prototype to a stable implementation.

## ✅ Completed Fixes

### 1. `keyval` Trigger Conflicts (Double Execution)

**Severity**: High
**Location**: `packages/core-experimental/src/keyval.ts`
**Issue**:
When `getItem(event)` is used, two conflicting `sample`s are often created:

1.  **Auto-wiring**: Inside `createItemProxy`, a `sample` is automatically created connecting the source `event` (ID) to the facet method's effect (`fx`), passing `undefined` as payload.
2.  **Manual wiring**: The user often manually samples the source event to the returned unit (`sample({ clock: event, target: item.method })`).

This results in the method being executed **twice**: once with `undefined` payload (auto) and once with the correct ID (manual).

**Proposed Fix**:

- **Remove Auto-wiring**: `createItemProxy` should **not** automatically `sample` the source event to `fx` upon property access.
- **Explicit Wiring**: The returned unit (from property access) should be a "detached" event that, when triggered, executes the effect.
- **Refactor `match()`**: Since `match` currently relies on this auto-wiring side-effect (by just accessing the property), it must be updated to explicitly call or sample the method.

### 2. Action Routing Payload Support

**Severity**: High
**Location**: `packages/core-experimental/src/keyval.ts`
**Issue**:
Currently, `getItem(event)` assumes the event payload is _just_ the ID string (`Event<string>`). This makes it impossible to route actions that require data (e.g., `updateName({ id, newName })`).

**Proposed Fix**:

- **Support Complex Payloads**: Update `getItem` to accept `Event<{ id: string } & P>`.
- **Payload Extraction**: In `createItemProxy`, extract the payload (excluding `id`) and pass it to the facet method's effect.
- **Type Inference**: Improve TS types to infer the payload type from the event.

### 3. `select()` Reactivity (The `getState()` Hack)

**Severity**: Medium
**Location**: `packages/core-experimental/src/lens.ts`
**Issue**:
The current implementation of `select()` uses `combine` but relies on `store.getState()` to read values from nested stores. This breaks fine-grained reactivity: the derived store only updates if the _list of instances_ changes, not when the _inner store_ of an instance updates.

**Proposed Fix**:

- **Higher-Order Stores**: Implement a custom Effector store (or usage of `flatten` pattern) that correctly subscribes to the nested store when the ID/Path resolves to one.
- **Workaround**: For the prototype, force updates by ensuring the parent object reference changes (immutable updates) even for inner store changes, or use `watch` to trigger manual updates.

### 4. Memory Leaks in Proxies

**Severity**: Medium
**Location**: `packages/core-experimental/src/keyval.ts`
**Issue**:
Every call to `getItem` (and every property access on the returned proxy) creates new `Event`, `Effect`, and `sample` instances. In React components, this can lead to a massive explosion of units if not memoized.

**Proposed Fix**:

- **Cache Proxies**: Implement a `WeakMap` cache in `keyval` to return the same Proxy instance for the same ID/Store.
- **Stable Units**: Ensure that accessing `item.facets.user.kick` multiple times returns the _same_ Event reference.

---

## 🛠 Refinements

### 5. Type Safety & HKT

- **Goal**: Remove `as any` casting in `create()` and `keyval()`.
- **Plan**: Implement the "Higher-Kinded Types" emulation (as described in the article) to allow `keyval<UserTrait>` to correctly infer the shape of the union.

### 6. Lifecycle Management (✅ Completed)

- **Goal**: Proper cleanup of models.
- **Plan**: Ensure that removing an item from `keyval` triggers `clearNode` on the associated instance and its scope, preventing memory leaks of Effector units.

### 7. Performance Optimization

- **Goal**: O(1) complexity.
- **Plan**: Replace the dynamic `combine` multiplexers in `create()` with a static analysis approach (or linearized graph) where possible, to avoid re-evaluating the entire list for every update.
