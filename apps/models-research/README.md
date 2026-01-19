# Effector Models

Our research has led to the discovery that **Business Logic is a Directed Graph of Requirement Transformations**. A Model is not just a container for state; it is a topological node that transforms a set of **Capabilities** into a set of **Behaviors**.

---

## 2. Scientific Foundations: The Frontier of Reactive Science

### 2.1. The Harvard Architecture of State

Just as the Harvard Architecture in computer engineering separates instruction memory from data memory, Effector Models enforces a strict separation between **Control Flow** (Units: Events, Effects) and **Data Storage** (Stores).

- **Data** is inert. It does not "do" anything.
- **Control Flow** is active. It directs the transformation of data.

This separation allows us to treat the application's logic as a static graph that can be analyzed, optimized, and verified _ahead of time_ (AOT), independent of the runtime data it processes.

### 2.2. The Tensor of Capabilities

We observed that the interaction between models can be described using tensor-like structures. A model's interface is not a flat object, but a multidimensional descriptor of its capabilities.

If we represent the capabilities of a model as a vector space, operations on models (composition, nesting, variant switching) become vector operations.

- **Input Vector (`Need`)**: The set of traits a model _requires_ to function (e.g., `id`, `mount`).
- **Output Vector (`Provide`)**: The set of traits a model _exposes_ to the system.

A Model, therefore, is a transformation matrix $M$ that maps the Input Vector to the Output Vector:
$$ \vec{Output} = M \times \vec{Input} $$

This mathematical rigor ensures that "Business Logic" is no longer an abstract concept but a quantifiable, deterministic graph of transformations.

### 2.3. Thermodynamics of Abstraction

In our "efficiency of abstractions" analysis, we apply a principle similar to the conservation of energy. The sum of "Needs" (Inputs) and "Provides" (Outputs) across the entire application graph must balance.

- **$\sum Models > 0$**: The application produces more value (capabilities) than it consumes (boilerplate).
- **$\sum Models < 0$**: The application is "leaking" logic; requirements are unmet.

This insight allows us to measure the _quality_ of our abstractions. A well-designed model minimizes the "friction" (boilerplate) required to convert inputs into useful outputs.

---

## 3. Core Concepts & API: The Implementation

The theoretical framework above is reified in the `packages/core-experimental` runtime through a specific set of primitives.

### 3.1. Models (`model`)

The `model` is the fundamental unit of logic. It is a factory that produces **Instances**. Unlike a class, a model definition is purely declarative.

```typescript
import { model, define } from '@effector/model';

const userModel = model({
  // The "Input Vector" - what we need
  input: {
    id: define.store<string>(),
  },
  // The "Transformation" - internal logic
  factory: ({ input }) => {
    const $name = createStore('Guest');
    // ... logic ...
    return { $name };
  },
});
```

### 3.2. Facets (`facet`): The Reification of Traits

In our research, we identified **Traits** as the contracts that define interaction. In the current implementation, this concept is realized as **Facets**.

A **Facet** is a shape definition — a "Protocol" that a model must adhere to. It decouples the _interface_ from the _implementation_.

```typescript
// Define the "Visual" Trait/Facet
const visualFacet = facet({
  $color: define.store<string>(),
  isVisible: define.store<boolean>(),
});

// A model implementing this facet
const buttonModel = model({
  facets: {
    visual: visualFacet,
  },
  impl: {
    visual: {
      $color: define.store('blue'),
      isVisible: define.store(true),
    },
  },
});
```

This allows for polymorphism: any model implementing `visualFacet` can be treated uniformly by the UI or other logic, regardless of its internal complexity.

### 3.3. Recursion (`ref.self`)

To support infinite nesting (e.g., File Systems, Comment Threads), we solved the "Self-Reference Paradox" in TypeScript using `ref.self`.

- **Problem**: A model cannot reference itself during its own definition (circular dependency).
- **Solution**: We introduce a symbolic reference `ref.self` that the runtime resolves lazily during instantiation.

```typescript
const folderModel = model({
  facets: {
    // A folder contains a list of... itself.
    children: define.array(ref.self),
  },
});
```

### 3.4. Internal Resolution (`ref.tag`)

Complex models often require decoupled facets to share data without explicit wiring. `ref.tag` implements a form of **Declarative Dependency Injection**.

A facet can declare a dependency on a "tag" (e.g., `'isSelected'`). The model factory resolves this tag to a concrete store at runtime, binding orthogonal logic pieces together without tight coupling.

---

## 4. Advanced Patterns: Variants & Polymorphism

### 4.1. Variants: Orthogonal State Spaces

Real-world entities often exist in mutually exclusive states (e.g., A Game is either `Winning`, `Losing`, or `Draw`). Standard state managers treat this as a single flat store.

We implement **Variants** to model this topologically. When a model switches variants, its _structure_ changes.

```typescript
const gameModel = model({
  variant: {
    source: $score,
    cases: {
      winning: (s) => s > 0,
      losing: (s) => s < 0, // Only in 'losing' state do we need '$intensity'
    },
  },
  impl: {
    losing: () => ({
      // This store creates/exists ONLY when score < 0
      $intensity: createStore(0),
    }),
  },
});
```

This is a breakthrough in resource efficiency: we do not allocate memory for logic that is not currently active.

### 4.2. Polymorphism (`match` & `keyval`)

Handling lists of heterogeneous items (e.g., a Chat containing `Guest` and `Admin` users) is traditionally painful.

We solved this via **Union Models** and the `match` operator.

- **`keyval`**: Manages a collection of model instances.
- **`match`**: A topological switch that routes events to the correct specific handler based on the instance type.

---

## 5. Architectural Implementation Details

### 5.1. Runtime Compilation & Linearized Memory

To achieve high performance, the `packages/core-experimental` runtime uses a technique we call **Runtime Compilation**.

Although the user defines models dynamically, the runtime analyzes the definition once and generates a **Static Graph**. Model instances are then allocated as **Fixed-Size Vectors** (linear arrays) in memory, rather than hash maps.

- **O(1)** Access time for any field in an instance.
- **Cache Locality**: Linear memory layout improves CPU cache utilization.

### 5.2. Reactive Lenses (`select`)

We implemented a `select` operator that acts as a "Reactive Lens". It allows looking deep into a model's structure (even traversing variants and lists) to extract a reactive stream of updates.

```typescript
// Selects '$intensity' only if the game is in 'losing' variant
// Falls back to 0 otherwise.
const $currentIntensity = select(gameModel)
  .path((m) => m.losing.$intensity)
  .fallback(0);
```

This eliminates the need for manual subscription management or complex selector logic in components.

---

## 6. Conclusion

The `@effector/model` implementation is not just a library; it is the application of rigorous systems theory to frontend business logic. By treating logic as a graph of capability transformations, implementing strict traits, and optimizing memory layout via linearization, we provide a foundation for building applications that are:

1.  **Mathematically Sound**: Verifiable data flows.
2.  **Architecturally Robust**: Strict separation of concerns via Facets/Traits.
3.  **Performant**: Linearized memory and static graph compilation.

This represents the state-of-the-art in our research into the physics of application state.
