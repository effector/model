# Architectural Plan: The Unified Reactive List

**Status:** Draft
**Date:** January 17, 2026
**Context:** Merging the "Smart List" capabilities of legacy `createListApi` with the "Thermodynamic Model" architecture of `core-experimental`.

---

## 1. Executive Summary

Our research has identified a gap in the current `core-experimental` architecture. While `keyval` excels at managing the lifecycle and topology of polymorphic **Models** (Entities), it lacks the sophisticated list management capabilities (Filtering, Mapping, Path-based Updates) found in our legacy `createListApi` implementation.

This plan proposes a unified architecture that layers a **Query Engine** (ListApi) on top of the **Storage Engine** (Keyval), providing the best of both worlds: highly efficient entity management with ergonomic list operations.

## 2. The Architecture: Storage vs. View

We propose strictly separating the **Data Plane** (Storage) from the **Presentation Plane** (View).

### 2.1. Layer 1: The Storage Engine (`keyval`)

_Responsibility: Lifecycle, Persistence, Topology._

The current `keyval` implementation remains the foundation. It manages:

- **`$instances`**: A Record of active Model instances (Scopes).
- **`$state`**: A serialized snapshot of the data.
- **`lifecycle`**: Creating and destroying scopes based on ID presence.

**Improvements needed:**

- **`sync(Store<T[]>)`**: Ability to synchronize the order and existence of items from an external source (e.g., Server Response), replacing the manual `add/remove` logic.
- **`update(id, path, value)`**: A generic update method that uses path string/array to modify deep state, reducing boilerplate.

### 2.2. Layer 2: The Query Engine (`ListApi`)

_Responsibility: Sorting, Filtering, Projection._

This is the new layer inspired by `createListApi`. It consumes a `keyval` and produces a derived **View**.

```typescript
// Definition
const allUsers = keyval({ model: UserModel });

// Derived View (Reactive)
const admins = allUsers.view()
  .filter((user) => user.input.role === 'admin')
  .sort((a, b) => a.input.name.localeCompare(b.input.name));

// Consumption
useList(admins, (user) => <UserCard model={user} />);
```

**Key Features:**

1.  **`$visibleKeys`**: A store containing only the IDs that match the filter.
2.  **Virtualization Support**: The View only tracks IDs, preventing render churn for items that are filtered out.
3.  **Chainable API**: `filter().sort().map()` creates a pipeline of derived stores.

## 3. Proposed API Specification

### 3.1. Enhanced `Keyval`

```typescript
type Keyval<M> = {
  // ... existing fields ...

  // New: Path-based update (inspired by legacy set)
  set: (id: string, path: string, value: any) => void;

  // New: Create a derived View
  view: () => ListApi<M>;

  // New: Synchronization (inspired by createStoreMap)
  sync: (source: Store<any[]>, getKey: (item: any) => string) => void;
};
```

### 3.2. `ListApi` (The View)

```typescript
type ListApi<M> = {
  $items: Store<string[]>; // Filtered & Sorted IDs

  // Refines the view
  filter: (fn: (instance: LensProxy<M>) => boolean | Store<boolean>) => ListApi<M>;
  sort: (fn: (a: LensProxy<M>, b: LensProxy<M>) => number) => ListApi<M>;

  // Returns the subset of instances
  use: () => LensProxy<M>[];
};
```

## 4. Implementation Strategy

### Phase 1: Storage Improvements

1.  **Implement `keyval.set`**: modify `updateInstanceFx` to accept a path array (e.g., `['facets', 'product', '$price']`) and traverse the instance to find the store to `rehydrate`.
2.  **Implement `keyval.sync`**: Create logic that watches an external array store.
    - **Diffing**: Calculate added/removed IDs.
    - **Reordering**: Update `$items` order to match source.
    - **Garbage Collection**: Call `destroy()` on removed IDs.

### Phase 2: Query Engine

1.  **Implement `createListView(keyval)`**:
    - Create `$filter` store.
    - Derive `$filteredIds` from `keyval.$items` + `$filter` + `keyval.$instances`.
    - **Optimization**: Use `shouldNotify` logic (from legacy code) to avoid re-calculating filter if only unrelated data changed.

### Phase 3: Developer Experience

1.  **Typed Paths**: Use TypeScript Template Literal Types to auto-complete paths in `.set()`.
    - `cart.set('id', 'facets.product.$quantity', 5)`

## 5. Comparison with Legacy Code

| Feature             | Legacy `createStoreMap` | Legacy `createListApi`   | New `keyval` + `ListApi`    |
| :------------------ | :---------------------- | :----------------------- | :-------------------------- |
| **Source of Truth** | Map (Derived)           | List + Map (Stand-alone) | Keyval (Storage)            |
| **Order**           | Manual Sync             | Managed Array            | Managed Array               |
| **Updates**         | `setState` (Manual)     | `set(path)` (Smart)      | `set(path)` (Smart)         |
| **Filtering**       | N/A                     | Native `$filter`         | Native `.view().filter()`   |
| **Typing**          | Manual                  | Manual                   | **Fully Inferred (Models)** |

## 6. Conclusion

By integrating the "Smart List" features into the "Thermodynamic" architecture, we create a system that is not only performant (memory efficient) but also ergonomic for complex UI requirements (filtering/sorting). The distinction between **Storage** (Backend state) and **View** (UI state) is the critical architectural leap.
