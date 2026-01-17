# Refactoring Plan: Unified Restaurant Component

**Status:** Planned  
**Objective:** Refactor the routing and component logic to treat views as variants of a unified "Restaurant" entity.

## 1. Data Layer Refactoring

### 1.1 Extract Restaurant Data

- **Source:** `apps/models-research/src/food/view/RestaurantScreen.tsx` (currently hardcoded `RESTAURANTS` array).
- **Destination:** `apps/models-research/src/food/data/restaurants.ts`.
- **Action:** Move the constant array to a dedicated data file and export it. Define a proper TypeScript interface `RestaurantData` if not already present.

## 2. Component Architecture

### 2.1 Create Unified `Restaurant` Component

- **File:** `apps/models-research/src/food/view/Restaurant.tsx`
- **Props:**
  ```typescript
  interface RestaurantProps {
    id: string;
    variant: 'list' | 'full';
  }
  ```
- **Logic:**
  - **Data Loading:** Retrieve restaurant data by `id`.
  - **Variant 'list'**:
    - Render the card UI (image, rating, tags, etc.).
    - Click handler: Trigger `selectRestaurant(id)`.
  - **Variant 'full'**:
    - Render the full menu UI (Header, Categories, Product List).
    - Logic: Incorporate `MenuScreen` logic (scroll spy, category switching based on ID).
    - Back Handler: Trigger `menuBack()`.
    - Cart Handler: Trigger `openCart()`.

## 3. View Layer Updates

### 3.1 Update `RestaurantScreen` (The List)

- **Role:** Container for the list of restaurants.
- **Changes:**
  - Import `Restaurant` component.
  - Import `RESTAURANTS` data.
  - Map data to `<Restaurant id={r.id} variant="list" />`.
  - Retain the global "Open Cart" sticky button if applicable.

### 3.2 Update `AppView` (The Router)

- **Changes:**
  - Replace `MenuScreen` usage with `Restaurant`.
  - Pass props: `<Restaurant id={params.restaurantId} variant="full" />`.

## 4. Cleanup

- **Delete:** `apps/models-research/src/food/view/MenuScreen.tsx` (once functionality is verified in `Restaurant.tsx`).

## 5. Verification

- [ ] **List View:** Restaurants render correctly as cards.
- [ ] **Navigation:** Clicking a card opens the full view.
- [ ] **Full View:** Correct menu (Dodo vs KFC) loads based on ID.
- [ ] **Back Navigation:** Back button returns to the list.
- [ ] **Cart Integration:** Adding items and opening cart works from the new component.
