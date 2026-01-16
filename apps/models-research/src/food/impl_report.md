I have successfully implemented the "Food Order" demo following the Thermodynamic Architecture specifications.

### Key Implementation Details:

1.  **Architecture (Disjoint Graphs):**

    - Created `apps/models-research/src/food/models/traits.ts` defining reusable `productTrait`, `ingredientsFacet`, etc.
    - Implemented `pizzaModel` and `drinkModel` in `apps/models-research/src/food/models/products/` which compose these traits.
    - `pizzaModel` includes the `Ingredients` topology, while `drinkModel` does not, adhering to the "Conservation of Requirements" principle.

2.  **Polymorphism (Union Models):**

    - Implemented `apps/models-research/src/food/models/cart.ts` using `keyval` with a `union` of `{ pizza, drink }`.
    - This proves the capability of `core-experimental` to handle heterogeneous collections.

3.  **State Machines (Soft Deletes):**

    - Encapsulated the "Soft Delete" logic (Quantity 1 -> Decrement -> IsDeleted) within `setupProductTrait` in `traits.ts`, ensuring consistent behavior across all product types.

4.  **Deep Updates (O(1) Access):**

    - Implemented `useLens` hook to bind directly to nested properties (e.g., `item.facets.ingredients.$selected`).
    - Added an interactive "Deep Update Demo" section in the Pizza UI (in `CartItem.tsx`) allowing users to toggle ingredients directly from the cart list without tree traversal.

5.  **View Layer:**
    - Created `FoodDemo` (`AppView.tsx`) and integrated it into the main `App.tsx` as a new tab.
    - Implemented `CartScreen` and `CartItem` with pattern matching to render specific details (Pizza vs Drink) while sharing common controls.

The demo is now fully functional and integrated into the `models-research` app.

---

I have successfully implemented the "Food Order" demo in `apps/models-research` following the Thermodynamic Architecture.

### Implementation Summary:

1.  **Models & Traits:**

    - **`models/traits.ts`**: Defined `productTrait` (handling Soft Delete FSM logic), `ingredientsFacet` (O(1) toggles), `sizeFacet`, and `doughFacet`.
    - **`models/products/*.ts`**: Implemented `pizzaModel` (composing all facets + price logic) and `drinkModel` (simpler topology).
    - **`models/cart.ts`**: Implemented the Cart using `keyval` with a `union` of Pizza and Drink models. Added a derived `$totalPrice` store.

2.  **Architecture Verification:**

    - **Polymorphism:** The Cart handles mixed types via `keyval(union({...}))`. The View uses `item.activeVariant` to switch rendering logic.
    - **Deep Updates:** The `CartItem` component binds directly to specific ingredient lenses (`item.facets.ingredients.$selected`) using a custom `useLens` hook, proving O(1) access without tree traversal.
    - **Soft Deletes:** The logic is centralized in `setupProductTrait`, ensuring `decrement` at quantity 1 triggers the "Deleted" state instead of removal.

3.  **UI Implementation:**
    - **`view/components/CartItem.tsx`**: Renders common controls (Qty, Price, Restore) and variant-specific details (Dough selector vs Volume). Includes a "Deep Update Demo" section for toggling ingredients.
    - **`view/AppView.tsx`**: Provides "Add Pizza" / "Add Drink" buttons to simulate the ordering flow.
    - **Integration**: Added a "Food Order (New)" tab to the main `App.tsx`.

You can now run the `models-research` app to see the demo in action. The "Deep Update Demo" inside the Pizza cart item specifically demonstrates the architectural advantage of Facets.
