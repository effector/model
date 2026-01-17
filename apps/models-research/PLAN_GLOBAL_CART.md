# Global Cart Feature - Technical Implementation Plan

## 1. Overview

The "Global Cart" feature allows users to view and manage active orders from multiple restaurants simultaneously. It introduces a new "Global Cart" screen and a floating entry point on the main restaurant list.

## 2. Data Model (`src/food/models/cart.ts`)

We need derived stores to aggregate cart items by restaurant.

### 2.1. `$cartByRestaurant`

Groups all active (non-deleted) cart items by their `restaurantId`.

```typescript
export const $cartByRestaurant = cartModel.$instances.map((instances) => {
  const grouped: Record<string, { items: any[]; total: number; count: number }> = {};

  Object.values(instances).forEach((instance: any) => {
    const snapshot = serialize(instance);
    const state = snapshot.facets;

    // Skip deleted items
    if (state.product?.$isDeleted) return;

    // Get Restaurant ID (fallback to 'unknown' if missing, though it should be there)
    const rId = state.product?.$restaurantId;
    if (!rId) return;

    if (!grouped[rId]) grouped[rId] = { items: [], total: 0, count: 0 };

    const price = state.product?.$price || 0;
    const quantity = state.product?.$quantity || 0;
    const itemTotal = price * quantity;

    grouped[rId].items.push({
      ...snapshot,
      name: state.product?.$name || 'Unknown', // Helper for UI
    });
    grouped[rId].total += itemTotal;
    grouped[rId].count += quantity;
  });

  return grouped;
});
```

### 2.2. `$globalCartStats`

Aggregates the total count and price for the global floating button.

```typescript
export const $globalCartStats = $cartByRestaurant.map((grouped) => {
  const total = Object.values(grouped).reduce((acc, g) => acc + g.total, 0);
  const count = Object.values(grouped).reduce((acc, g) => acc + g.count, 0);
  return { total, count };
});
```

## 3. Application Logic (`src/food/models/app.ts`)

### 3.1. Types & Events

- **Update `ScreenName`**: Add `'globalCart'`.
- **Update `openCart`**: Change to `createEvent<{ restaurantId?: string } | void>()`.
- **New Events**:
  - `openGlobalCart = createEvent()`
  - `globalCartBack = createEvent()`

### 3.2. App Model Implementation

- **`restaurants` impl**:
  - Watch `openGlobalCart` -> set screen to `'globalCart'`.
- **`globalCart` impl** (New):
  - Watch `globalCartBack` -> set screen to `'restaurants'`.
  - Watch `openCart` -> set screen to `'cart'`, pass `returnToRestaurantId: payload.restaurantId`.
- **`menu` impl**:
  - Update `openCart` logic: If payload has ID, use it. If not, use `params.restaurantId`.

## 4. UI Components

### 4.1. `GlobalCartScreen.tsx` (New)

- **Header**: "Мои заказы" (My Orders) + Back Button (triggers `globalCartBack`).
- **Body**: Scrollable list.
- **Data Source**: `$cartByRestaurant`.
- **Rendering**:
  - Map through keys of `$cartByRestaurant`.
  - Find Restaurant Metadata in `RESTAURANTS` (import from `../data/restaurants`) using ID.
  - Render Card:
    - Image (Avatar) + Name.
    - Text list of items (e.g. "Pizza Pepperoni, Cola...").
    - Footer: Total Count + Price.
    - Button: "Перейти" -> `openCart({ restaurantId })`.

### 4.2. `RestaurantScreen.tsx` (Update)

- Subscribe to `$globalCartStats`.
- **Floating Action Button (FAB)**:
  - Position: Fixed `bottom-6 right-6`.
  - Content: Cart Icon + `$globalCartStats.total` ₽.
  - Condition: Render only if `$globalCartStats.count > 0`.
  - Action: `onClick={() => openGlobalCart()}`.

### 4.3. `AppView.tsx` (Update)

- Add conditional render:
  ```tsx
  {
    variant === 'globalCart' && <GlobalCartScreen />;
  }
  ```
- Import `GlobalCartScreen`.

## 5. Execution Steps

1.  **Modify `cart.ts`**: Add derived stores.
2.  **Modify `app.ts`**: Update types, events, and model implementation.
3.  **Create `GlobalCartScreen.tsx`**: Implement the new view.
4.  **Modify `RestaurantScreen.tsx`**: Add the FAB.
5.  **Modify `AppView.tsx`**: Wire up the new screen.
