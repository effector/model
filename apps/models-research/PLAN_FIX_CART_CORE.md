# Plan: Core List API Upgrade & Cart Fix

## 1. Motivation

The user wants to perform scoped operations (like clearing a specific restaurant's cart) without:

1.  Leaking `restaurantId` into the View logic repeatedly.
2.  Relying on React Hooks for logic that belongs in the Model.
3.  Affecting other items in the global store (Isolation).

## 2. Core Upgrade: `ListApi` (`packages/core-experimental`)

We will extend the `ListApi` interface in `src/list.ts` to support **scoped mutations** and **transformations**.

### New Features

#### `remove: EventCallable<void>`

- **Behavior:** When triggered, it iterates over the _currently visible_ items in the list (filtered) and removes them from the underlying `Keyval` store.
- **Isolation:** Since the list is already filtered (e.g., by restaurant), calling `.remove()` only deletes those specific items.

#### `map<T>(fn: (item: LensProxy<M>) => T): Store<T[]>`

- **Behavior:** Projects each item in the filtered list to a value, returning a reactive Store of the results.
- **Use Case:** Calculating totals (e.g., mapping to price \* quantity) directly in the model.

### Implementation Sketch

```typescript
// packages/core-experimental/src/list.ts

export interface ListApi<M> {
  $items: Store<string[]>;
  filter: (...) => ListApi<M>;
  sort: (...) => ListApi<M>;

  // NEW
  remove: EventCallable<void>;
  map: <T>(fn: (item: LensProxy<M>) => T) => Store<T[]>;
}

// Inside createListApiImpl
const remove = createEvent();

sample({
  clock: remove,
  source: $sourceIds,
  target: createEffect((ids) => ids.forEach(id => kv.remove(id)))
});

// map implementation using createSyncProxy (similar to filter)
```

## 3. App Refactor: `CartScreen` (`apps/models-research`)

We will replace the manual hook/event logic with the new Core capabilities.

### Current (Problematic)

```tsx
const [clear] = useUnit([cartModel.reset]); // Clears everything!
```

### New (Scoped)

```tsx
const cartApi = useMemo(() => {
  return createListApi(cartModel).filter((item) => item.facets.product.$restaurantId.map((id) => id === currentRestaurantId));
}, [currentRestaurantId]);

const [clear] = useUnit([cartApi.remove]); // Clears ONLY filtered items
```

## 4. Execution Steps

1.  **Modify `packages/core-experimental/src/list.ts`**: Implement `remove` and `map`.
2.  **Build Core**: Ensure changes propagate (if needed, though this is a monorepo).
3.  **Update `CartScreen.tsx`**: Refactor to use `cartApi.remove`.
4.  **Verify**: Check if clearing "Dodo" preserves "KFC".
