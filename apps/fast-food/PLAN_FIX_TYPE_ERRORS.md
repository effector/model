# Plan: Fix Application-Level Type Errors in Fast Food App

## Context

The build is failing with TypeScript errors in `apps/fast-food`.

1.  `apps/fast-food/src/view/ProductScreen.tsx`: `TS2769: No overload matches this call` on `useLens`.
    - **Cause:** `useLens` expects a `Lens` or `Store`, but receives a `select()` builder object. The `select` API requires calling `.fallback(value)` to convert the builder into a `Store`.
2.  `apps/fast-food/src/models/__tests__/app.test.ts`: Type mismatch in `app.events.openProduct` payload.
    - **Cause:** The test passes `{ data: productData, restaurantId: ... }` but the event expects `ProductData` (which is the data itself, not wrapped in `data` property).

## Steps

### 1. Fix `apps/fast-food/src/view/ProductScreen.tsx`

Update the `useLens` calls for optional facets to convert the `select` builder to a `Store` using `.fallback()`.

**Current Code:**

```typescript
const size = useLens(
  select(draftItem)
    .facet('size')
    .path((s) => s.$size),
  '',
);
```

**New Code:**

```typescript
const size = useLens(
  select(draftItem)
    .facet('size')
    .path((s) => s.$size)
    .fallback(''), // <--- Added fallback to get Store
  '',
);
```

Repeat for `dough`, `sizes` (fallback `[]`), and `doughs` (fallback `[]`).

### 2. Fix `apps/fast-food/src/models/__tests__/app.test.ts`

Correct the payload structure passed to `app.events.openProduct` in `allSettled` calls.

**Current Code:**

```typescript
await allSettled(app.events.openProduct, {
  scope,
  params: { data: productData, restaurantId: 'restaurant-1' },
});
```

**New Code:**

```typescript
await allSettled(app.events.openProduct, {
  scope,
  params: { ...productData, restaurantId: 'restaurant-1' },
});
```

This needs to be applied in multiple tests (`should open product...`, `should add product...`, `should handle checkout flow`, `should handle editing item...`).

## Verification

1.  Run the build (or type check) to ensure errors are resolved.
