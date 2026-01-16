# Effector Models Research Playground

This project implements the experimental **Effector Models API** (Traits, Models, Variants) as described in the "Effector Models" article. It serves as a proof-of-concept to validate the API ergonomics and explore internal implementation challenges.

## 🚀 Getting Started

1.  **Install dependencies**:
    ```bash
    pnpm install
    ```
2.  **Run the Playground**:
    ```bash
    npx nx serve models-research
    ```
3.  **Open Browser**:
    Navigate to `http://localhost:4200` (or the port shown in the terminal).

---

## 📂 Project Structure

- **`packages/core-experimental`**: The implementation of the experimental API (`model`, `trait`, `define`, `keyval`, `select`, `match`).
- **`apps/models-research`**: The playground application containing the examples.

### Examples

#### 1. Game Model (Variants & Lifecycle)

_Location: `apps/models-research/src/game/`_

Demonstrates how a model can change its internal structure and behavior based on state.

- **`gameModel`**: Has 3 variants (`winning`, `losing`, `draw`).
  - When `losing`, it dynamically creates an `$intensity` store.
  - Uses `facets.visual` to expose a `$color` that changes based on the variant.
- **`statsModel`**: A separate model that "watches" the `gameModel`.
  - Demonstrates **Lifecycle Events**: Listens to `game.variant.losing.enter` and `leave` to start/stop a timer.
  - The timer _only_ runs when the game is in the "losing" state.

**🎮 Demo Action**:

- Go to the "Game Model" tab.
- Move the score slider below 0.
- Observe the box turn red (intensity increases with negative score).
- Observe the timer starting.
- Move the slider back to > 0. The timer stops.

#### 2. Chat User (Polymorphism & Unions)

_Location: `apps/models-research/src/user/`_

Demonstrates handling lists of heterogeneous models (Polymorphism).

- **`guestModel`**: Simple user with just a nickname.
- **`memberModel`**: User with a nickname AND a role (`admin` | `user`).
- **`userUnion`**: Combines them into a single type.
- **`usersList`**: A `keyval` list that holds `userUnion` instances.

**Features**:

- **Polymorphic Actions**:
  - `kick` (Common facet): Works on any user.
  - `promote` (Specific facet): Only works on members.
  - **`match()`**: Used to safely route the `promote` action only to `member` variants.
- **Lenses (`select()`)**:
  - Demonstrates safely extracting data (Role) from a specific variant, with a fallback if the variant doesn't match.

**🎮 Demo Action**:

- Go to the "Chat User" tab.
- Add a "Guest" and a "Member".
- Select a user to see details (Role).
- Try to "Promote" a Guest (Check console for error).
- "Kick" works for everyone.

---

## 🛠️ Internal Implementation Notes

### The "Runtime" (`packages/core-experimental`)

This prototype uses a dynamic runtime approach to emulate the proposed static graph behavior.

- **`create()`**: The factory that instantiates models. It handles the "Multiplexing" of facets, ensuring that `model.facets.visual.$color` is a valid store that switches its source based on the active variant.
- **`match()`**: Implemented using a Proxy trap. Accessing a property inside the `match` callback automatically creates a reactive link between the trigger event and the target method.
- **`select()`**: Implements a "Lens" pattern. It returns a Store that dynamically looks up values in the instance map.
- **Reactivity**: Now uses a robust **Subscription Manager** pattern (via `watch` and dynamic re-subscription) to ensure deep reactivity. Updates to nested stores propagate instantly, even if the list structure remains static.

## 🔮 Next Steps

1.  **Higher-Kinded Types (HKT)**: Implement the TypeScript HKT emulation to improve type inference for generics (as mentioned in the article).
2.  **Linearized Runtime**: Replace the dynamic `combine` multiplexers with a compiled static graph for performance.
3.  **Beta Release**: Prepare documentation and examples for a wider public release.
