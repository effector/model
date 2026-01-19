# Product Requirements Document (PRD)

**Project Name:** Pizza Demo App (Core Experimental Research)
**Version:** 3.0 (Released)
**Status:** Implemented
**Last Updated:** 2026-01-17

---

## 1. Executive Summary & Technical Motivation

### 1.1. Goal

The primary goal is to re-implement the classic `food-order` demo using the new `@effector-model/core-experimental` API. This project serves as a research ground to demonstrate how the new **Model + Facets** architecture solves complex UI/UX challenges that were difficult or verbose in the previous version.

### 1.2. The Problem (Legacy `food-order`)

The original `food-order` app demonstrated basic list management but struggled with:

1.  **Polymorphism:** Handling different product types (Pizzas, Drinks, Cocktails, Sauces, Coffee) in a single cart required complex conditional logic or unified "mega-types".
2.  **Complex State Transitions:** Implementing "Soft Delete" (where a product stays in the list but changes state/controls) required managing auxiliary state flags and complex view logic.
3.  **Deep Updates:** Modifying a nested property (like an ingredient in a cart product) required traversing the entire store tree (`ordersList -> dishes -> additives`).

### 1.3. The Solution (New `models-research`)

The new architecture addresses these edge cases:

1.  **Union Models:** The Cart can hold a heterogeneous list of domain-specific models (`Pizza | Drink | Coffee | ...`), each exposing only the relevant capabilities.
2.  **Facets (Composition):** Shared behaviors like `ProductTrait` (Metadata, Cost, Quantity) are encapsulated in reusable Facets, decoupled from the specific domain entity.
3.  **State Machines:** The "Soft Delete" logic is internalized within the `Restore` facet, simplifying the View to just reacting to `$isDeleted`.

---

## 2. Architecture Overview

The app is built around the concept of **Composable Domain Models**.

We define a **Product Trait** (Facet) that includes the core business capabilities: `Metadata`, `Cost`, `Quantity`, and `Restore`. Specific domain entities (Pizza, Coffee, etc.) implement this trait and add their own specific facets.

```mermaid
classDiagram
    class Cart {
        +List~AnyProduct~ items
        +number total
        +checkout()
    }

    class ProductTrait {
        <<Facet>>
        +Metadata (Name, Desc, Image)
        +Cost (Price)
        +Quantity (Amount, Total)
        +Restore (Soft Delete)
    }

    class Pizza {
        +ProductTrait
        +Size
        +PizzaBase (Dough)
        +Ingredients (Add/Remove)
    }

    class Drink {
        +ProductTrait
        +Size (Volume)
    }

    class Cocktail {
        +ProductTrait
        +Ingredients (Decorations)
    }

    class Coffee {
        +ProductTrait
        +Size
        +Additions (Sugar, Syrup)
    }

    class Sauce {
        +ProductTrait
    }

    Cart --> Pizza
    Cart --> Drink
    Cart --> Cocktail
    Cart --> Coffee
    Cart --> Sauce

    Pizza ..|> ProductTrait
    Drink ..|> ProductTrait
    Cocktail ..|> ProductTrait
    Coffee ..|> ProductTrait
    Sauce ..|> ProductTrait
```

---

## 3. User Personas & Flow

**User:** A hungry customer wanting to customize and order food quickly via mobile.

**Core User Flow:**

1.  **Select Restaurant:** Choose a context (Restaurant A vs B).
2.  **Browse Menu:** Scroll through categories with sticky navigation.
3.  **Customize Product:** Select size, dough, and modify ingredients.
4.  **Add to Cart:** Confirm configuration.
5.  **Manage Cart:** Adjust quantities, soft-delete items, or restore them.
6.  **Checkout:** Submit order.

---

## 4. Screen Specifications

### 4.0. Screen: Restaurant Selection (Entry)

- **Header:** "Выберите ресторан" (Select Restaurant)
- **List:** Cards with Image, Name, Address, Rating, and Time.
- **Visuals:** High-quality imagery (via `picsum.photos`). Parallax-style hover effects.
- **Action:** Clicking a card navigates to the **Menu List**.
- **Data Note:** Each restaurant has its own isolated set of Products and Categories.

### 4.1. Screen: Menu List (Home)

- **Sticky Navigation:**
  - Unified header container combining the "Menu" title, Restaurant Name dropdown, and Category Tabs.
  - **Header Layout:**
    - Left: "Меню" title.
    - Center: Restaurant Name (Clickable Dropdown).
    - Right: **Cart Action Button** (Icon + Total Price).
  - **Scroll-spy:** Active tab updates automatically as user scrolls. Logic accounts for the combined sticky header height to prevent obscuring content.
- **Product List:**
  - Grouped by Category.
  - **Card:**
    - **Visual:** High-resolution square image.
    - **Info:** Name, static description (default ingredients).
    - **Price:** Left-aligned "от [Min Price] ₽" chip.
- **Global Cart Action:**
  - **Position:** Fixed at the top-right of the sticky header.
  - **Visual:** White SVG Cart Icon + Total Price on Orange background.
  - **Action:** Opens **Cart Screen**.

### 4.2. Screen: Product Detail (Configurator)

- **Navigation:** Translucent Close button (Top Left).
- **Visuals:**
  - Edge-to-edge Product Image (Top).
  - **"Состав" (Ingredients) FAB:** Secondary floating button over the image (Bottom Right).
- **Controls:**
  - **Selectors:** Dynamic based on Product Type.
    - _Pizza:_ Size ("25", "30", "35" cm), Dough ("Traditional", "Thin").
    - _Coffee:_ Size ("S", "M", "L"), Sugar.
    - _Generic:_ Just Size or None.
- **Primary Action (Sticky Footer):**
  - **Button:** "+ [Total Price] ₽".
  - **Logic:** Adds configured item to Cart -> Returns to Menu.

### 4.3. Screen: Ingredients Customization ("Состав")

- **Navigation:** Close button (Top Left).
- **Header:** Product Name + Current Config.
- **Section 1: "Добавить по вкусу" (Extras)**
  - **Layout:** Grid of **Liquid Glass Cards**.
  - **Visuals:** `backdrop-blur-md`, static border layout (no layout shift/wiggle), SVG Checkmark.
  - **Interaction:** Toggle (Select/Deselect). Adds to price.
- **Section 2: "Убрать ингредиенты" (Defaults)**
  - **Layout:** Wrapped list of chips.
  - **Item:** Name + "X" SVG icon.
  - **Interaction:** Toggle.
    - _Default:_ Normal text.
    - _Removed:_ Strikethrough text (Crossed out).
- **Section 3: Product Metadata**
  - **Content:** Nutritional info (Energy, Weight), Description.
- **Footer:** "Сохранить [Total Price]" button.

### 4.4. Screen: Cart ("Корзина")

- **Header:** Back Button (Left), Trash Icon (Right) for Clear All.
- **Empty State:** Centered vertically (1/3 height) with icon and text ("Ваша корзина пуста").
- **List:**
  - **Item Card:**
    - **Info:** Name, Config, Modifications.
    - **Price:** Total for this line item.
    - **Edit Button:** "Изменить" (Change) -> Opens **Product Detail**.
    - **Quantity Controls:** [ - ] [ Count ] [ + ]
- **Footer:** "Оформить за [Total] ₽" (Checkout) button.

### 4.5. Screen: Checkout / Success

- **Flow:**
  1.  User clicks "Checkout" in Cart.
  2.  **Processing:** Cart items are snapshotted to a separate **Receipt Model**.
  3.  **Success State:**
      - **Visuals:** Large Congrats Emoji/Illustration.
      - **Message:** "Заказ оформлен!" (Order placed!).
      - **Order Summary Card:**
        - **Visuals:** Modern card with gray background (`bg-gray-50`) and rounded corners.
        - **Content:** "Ваш заказ" (Your Order) header.
        - **List:** Scrollable list of items (using `CartItem` in read-only mode).
        - **Footer:** "Итого" (Total) row with distinct Orange price.
      - **Action:** Main button "Вернуться в меню" (Return to Menu).

---

## 5. Detailed Business Logic & Edge Cases

### 5.1. Price Calculation Algorithm

The price is dynamic and depends on the specific item type:
$$ \text{Price} = (\text{Base} + \text{SizeMod} + \text{DoughMod} + \sum \text{Extras}) \times \text{Quantity} $$

- **Constraint:** Removing default ingredients (Section 2) does _not_ decrease the price.
- **Constraint:** Changing Size/Dough updates the Base Price immediately.

### 5.2. Soft Delete & Restoration (The "Restore" Facet)

This is a critical UX pattern to prevent accidental data loss.

1.  **Trigger:** User clicks "Minus" when Quantity is 1.
2.  **State Transition:** Item enters `SoftDeleted` state.
3.  **UI Updates:**
    - Item Opacity: Reduced (Dimmed).
    - Secondary Button: Changes from "Edit" to **"Удалить"** (Hard Delete).
    - Quantity Controls: Replaced by single **"Вернуть"** (Restore) button.
4.  **Restoration:** Clicking "Restore" -> Item returns to `Active` state (Quantity 1, Normal Opacity).
5.  **Hard Delete:** Clicking "Delete" -> Item is removed from the list permanently.

### 5.3. Configuration Persistence

- **Editing:** When clicking "Edit" in Cart, the Product Detail screen must initialize with the _specific_ configuration of that cart item, not the default values.
- **Saving:** Clicking "Save" in Product Detail updates the _existing_ cart item (mutation), rather than adding a new one.

### 5.4. Navigation Logic

- **Scroll Spy:** Handles variable section heights. Active tab switches when the section header reaches the bottom of the sticky navigation bar.
- **Routing:**
  - Menu -> Product -> Cart -> Menu.
  - Cart -> Checkout -> Success -> Menu.

### 5.5. Receipt Snapshot Logic

To ensure the integrity of the order history, the checkout process involves a snapshot mechanism:

1.  **Trigger:** User confirms checkout.
2.  **Snapshot:** The current state of all active items in the `Cart` is serialized and copied to a separate `Receipt` model.
3.  **Isolation:** This decoupling ensures that subsequent changes to the Cart (or clearing it) do not affect the displayed Receipt on the Success screen.
4.  **Display:** The Receipt view consumes data solely from the `Receipt` model, not the active `Cart`.

---

## 6. Visual Guidelines

- **Frame:** Fixed `412px` x `915px` device simulation.
  - **Border:** Customizable color (Default: Beige `#f5f5dc`) and thickness.
  - **Shadow:** Realistic `shadow-xl`.
- **Primary Color:** Orange (`#ff6900`).
- **Background:** Unified White (`#ffffff`) across all screens.
- **Typography:** Clean, sans-serif (Inter/System), bold headers.
- **Icons:** High-quality SVGs (Heroicons style).
- **Images:** High-resolution, consistent seeding via `picsum.photos`.
