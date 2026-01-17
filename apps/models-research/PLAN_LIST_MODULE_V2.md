# Plan: List Module V2 (Research & Upgrade)

## 1. Objective

Transform `ListApi` from a simple view into a fully-featured **Reactive Collection** with support for Set Theory, CRUD, and Aggregation.

## 2. Interface Specification

We will extend `ListApi<M>` in `packages/core-experimental/src/list.ts`:

```typescript
export interface ListApi<M> {
  // --- Existing ---
  $items: Store<string[]>;
  filter: (fn: Predicate) => ListApi<M>;
  sort: (fn: Comparator) => ListApi<M>;
  remove: EventCallable<void>;
  map: <T>(fn: Mapper) => Store<T[]>;

  // --- NEW: Pagination ---
  slice: (start: number, end?: number) => ListApi<M>;
  take: (n: number) => ListApi<M>;
  skip: (n: number) => ListApi<M>;

  // --- NEW: Mutation ---
  // Updates all items in the current view with the provided payload
  update: EventCallable<{ input?: any; state?: any }>;

  // --- NEW: Processing ---
  // Returns an event that, when triggered, runs the function for each item
  forEach: (fn: (item: LensProxy<M>) => void) => EventCallable<void>;

  // --- NEW: Aggregation ---
  $size: Store<number>;
  $isEmpty: Store<boolean>;
  some: (fn: Predicate) => Store<boolean>;
  every: (fn: Predicate) => Store<boolean>;

  // --- NEW: Set Operations ---
  union: (other: ListApi<M>) => ListApi<M>;
  intersection: (other: ListApi<M>) => ListApi<M>;
}
```

## 3. Implementation Details

### Pagination (`slice`, `take`, `skip`)

- **Logic:** Derive a new store from `$items` using `.map(ids => ids.slice(...))`.
- **Recursion:** Return `createListApiImpl` with the new filtered store.

### Mutation (`update`)

- **Logic:**
  1.  Create internal event.
  2.  `sample` source `$items`.
  3.  Target effect that iterates IDs and calls `kv.update({ id, ...payload })`.

### Aggregation (`$size`, `some`, `every`)

- **$size:** `$items.map(i => i.length)`
- **some/every:** Use `combine($items, kv.$state, ...)` and iterate with `createSyncProxy` (reusing `filter` logic).

### Set Operations (`union`, `intersection`)

- **Logic:** `combine` two `$items` stores.
- **Union:** `[...new Set([...a, ...b])]`
- **Intersection:** `a.filter(x => b.includes(x))`

## 4. Execution Steps

1.  **Modify `packages/core-experimental/src/list.ts`**:
    - Update Interface.
    - Implement new methods in `createListApiImpl`.
    - Add helper for `some/every` to share logic with `filter`.
2.  **Verify**: Ensure it compiles. (No test requested, but implementation must be sound).
