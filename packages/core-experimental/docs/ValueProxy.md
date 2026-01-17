# The Value Proxy Pattern

## 1. Introduction

The **Value Proxy Pattern** is a structural design pattern used in `@effector-model/core-experimental` to provide a seamless, developer-friendly API for accessing deeply nested state within a reactive context, specifically inside `Cursor` operations like `map`, `sort`, and `forEach`.

## 2. The Problem

In Effector, state is held in `Store` units. To read a store's value, one typically uses:

1.  **Combinators:** `combine($a, $b, (a, b) => ...)` (Reactive, Pure)
2.  **Hooks:** `useUnit($store)` (React View)
3.  **Imperative:** `$store.getState()` (Imperative, discouraged in pure logic)

### The Challenge with Dynamic Lists

When dealing with a `Keyval` store (a dynamic list of models), we cannot statically `combine` all items because the list changes at runtime. Instead, we `combine` the _entire_ state snapshot of the collection.

However, the **Model Definition** defines fields as `Store` types:

```typescript
const myModel = model({
  input: { $price: define.store(0) }, // Type is Store<number>
});
```

But the **State Snapshot** holds plain values:

```typescript
state = {
  item_1: { $price: 100 }, // Type is number
};
```

If we exposed the state directly in `map((item) => ...)`:

1.  The types would mismatch (User expects `Store`, gets `number`).
2.  If we exposed `Store` objects (via `createSyncProxy`), the user is forced to call `.getState()` inside the map function:
    ```typescript
    // Old approach (Store Proxy)
    cursor.map((item) => item.$price.getState() * 2);
    ```
    This is verbose and conceptually "illegal" in strict Effector contexts where `.getState()` is viewed as a side-effect or escape hatch.

## 3. The Solution: Value Proxy

The **Value Proxy** wraps the state snapshot and intercepts property access. It acts as a bridge that allows you to traverse the object graph using the Model's structure (which implies Stores/Lenses) but yields **direct values** at the leaves.

```typescript
function createValueProxy(target: any): any {
  return new Proxy(target, {
    get: (obj, prop) => {
      const value = Reflect.get(obj, prop);

      // If the value is an object (nested state), return another Proxy
      // to allow continued traversal (e.g., item.facets.product...)
      if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
        return createValueProxy(value);
      }

      // If it's a primitive (the leaf value), return it directly!
      return value;
    },
  });
}
```

### Benefits

1.  **Clean Syntax:** No `.getState()`.
    ```typescript
    cursor.map((item) => item.$price * 2);
    ```
2.  **Safety:** Since `map` runs inside a `combine`, it is automatically reactive. When the underlying state updates, `combine` re-runs, creating new Proxies and re-calculating the result.
3.  **Type Compatibility:** It allows us to treat the "Store-like" keys in the state object as simple values for calculation purposes.

## 4. Usage in Effector Units

This pattern is specifically designed for **Synchronous Computations** within the Effector reactivity graph.

### `Cursor.map`

Returns a derived `Store`.

```typescript
// Define a derived store for total price
const $total = cursor.map((item) => item.price * item.quantity);
// Result: Store<number[]>
```

### `Cursor.sort`

Requires direct value comparison.

```typescript
// Sort by price descending
cursor.sort((a, b) => b.price - a.price);
```

### `Cursor.forEach`

Iterates over the current snapshot.

```typescript
cursor.forEach((item) => {
  console.log('Processing item with price:', item.price);
});
```

## 5. Contrast with Store Proxy (Lenses)

We still use **Store Proxy (`createSyncProxy`)** for operations that require **Reactive Predicates**, like `filter`.

- **`filter(item => item.$price.map(p => p > 10))`**: Requires `item.$price` to be an object with `.map()`.
- **`map(item => item.$price * 2)`**: Requires `item.$price` to be a number.

The `Cursor` implementation intelligently chooses the right proxy type for the operation.
