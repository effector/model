# Pizza Demo App - Business Logic State Diagram

This diagram visualizes the reactive flows, state transitions, and underlying architectural blocks of the Pizza Demo App.

```mermaid
stateDiagram-v2
    direction LR

    %% --- Global App State (appModel) ---
    state "Restaurant Selection" as Restaurants
    state "Menu List" as Menu
    state "Product Configurator" as Product
    state "Shopping Cart" as Cart
    state "Order Success" as Congrats

    %% --- Transitions ---
    [*] --> Restaurants
    Restaurants --> Menu: selectRestaurant(id)
    Menu --> Restaurants: menuBack()

    %% --- Product Configuration Logic ---
    Menu --> Product: openProduct(data)
    note right of Menu
        Initialization:
        Raw Data -> draftModel
        (Temporary Edit State)
    end note

    state Product {
        direction TB

        state ViewLogic {
            state Preview
            state Ingredients

            [*] --> Preview
            Preview --> Ingredients: toggleProductMode()
            Ingredients --> Preview: toggleProductMode()
        }

        state Facets {
            state Configuration

            note right of Configuration
                sizeFacet / doughFacet
                setSize(id)
                setDough(id)
                --
                ingredientsFacet
                toggleExtra(id)
                toggleDefault(id)
            end note
        }
    }

    Product --> Menu: closeProduct()
    Product --> Cart: addToCart()
    note right of Product
        Commit:
        serialize(draftModel)
        -> cartModel.add()
    end note

    %% --- Cart Logic ---
    Menu --> Cart: openCart()
    Cart --> Menu: cartBack()

    state Cart {
        direction TB

        state ItemLifecycle {
            state Active
            state SoftDeleted

            [*] --> Active
            Active --> SoftDeleted: decrement() (qty=1)
            SoftDeleted --> Active: restore()
            Active --> Active: increment() / decrement() (qty>1)

            note right of Active
                cartModel
                Stores Union Types:
                (Pizza | Drink | Cocktail...)
            end note
        }
    }

    Cart --> Product: editItem(id)
    note bottom of Cart
        Edit:
        serialize(cartModel item)
        -> draftModel
    end note

    %% --- Checkout Logic ---
    Cart --> Congrats: checkout()
    note right of Cart
        Snapshot:
        copyCartToReceipt()
        cartModel -> receiptModel
        (Read-Only)
    end note

    state Congrats {
        [*] --> ReceiptView
        ReceiptView --> [*]
    }

    Congrats --> Menu: finishOrder()
```
