# Theming Implementation Plan

## Goal

Implement dynamic restaurant-specific accent colors for Dodo (Orange) and KFC (Red).

## 1. Data Model Updates

**File:** `apps/models-research/src/food/data/restaurants.ts`

- Update `RestaurantData` interface:
  ```typescript
  export interface RestaurantData {
    // ...
    themeColor: string;
    themeColorBg: string;
  }
  ```
- Update `RESTAURANTS` data:
  - **Dodo**: `themeColor: '#ff6900'`, `themeColorBg: '#fff0e6'`
  - **KFC**: `themeColor: '#e4002b'`, `themeColorBg: '#fce5e8'`
- Add helper function:
  ```typescript
  export const getRestaurantTheme = (id?: string) => {
    const r = RESTAURANTS.find((x) => x.id === id) || RESTAURANTS[0];
    return {
      '--theme-color': r.themeColor,
      '--theme-color-bg': r.themeColorBg,
    } as React.CSSProperties;
  };
  ```

## 2. Component Refactoring

### Common Components

**File:** `apps/models-research/src/food/view/components/Common.tsx`

- **MainButton**:
  - Replace `bg-[#ff6900]` with `bg-[var(--theme-color)]`.
  - Replace `hover:bg-[#e05c00]` with `hover:brightness-90` (or opacity).
  - Update shadow to be generic or use dynamic color if possible.

### Views

**File:** `apps/models-research/src/food/view/Restaurant.tsx`

- **RestaurantMenu**:
  - Apply `style={getRestaurantTheme(restaurant.id)}` to the root `div`.
  - Replace `text-[#ff6900]` with `text-[var(--theme-color)]`.
  - Replace `bg-[#ff6900]` with `bg-[var(--theme-color)]`.
  - Replace `bg-[#fff0e6]` with `bg-[var(--theme-color-bg)]`.
- **RestaurantCard**:
  - Apply theme style locally.
  - Update hover states.

**File:** `apps/models-research/src/food/view/ProductScreen.tsx`

- Apply `style={getRestaurantTheme(params.restaurantId)}` to root.
- Replace `bg-[#fff0e6]` (image bg) with `bg-[var(--theme-color-bg)]`.

**File:** `apps/models-research/src/food/view/CartScreen.tsx`

- Apply `style={getRestaurantTheme(params.returnToRestaurantId)}` to root.

**File:** `apps/models-research/src/food/view/components/ProductView.tsx`

- Replace `text-[#ff6900]`, `border-[#ff6900]`, `bg-[#ff6900]` with `var(--theme-color)` equivalents.

**File:** `apps/models-research/src/food/view/components/CartItem.tsx`

- Replace `text-[#ff6900]` and `border-[#ff6900]`.

## 3. Verification

- Verify Dodo still looks orange.
- Verify KFC looks red (prices, buttons, highlights).
