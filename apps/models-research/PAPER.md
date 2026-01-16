# The Architecture of Inevitability: A Unified Theory of Reactive Business Logic and State Management

**Authors:** The Effector Core Team
**Date:** January 15, 2026
**Subject:** Theoretical Foundations of `@effector/model`

---

## **Abstract**

The contemporary landscape of frontend engineering has reached an inflection point where traditional state management paradigms—focused primarily on data synchronization and propagation—are no longer sufficient for modeling complex, high-entropy business domains. As application scale increases, the primary challenge shifts from the storage of values to the orchestration of capabilities, the enforcement of topological constraints, and the management of polymorphic behavior.

This paper presents a comprehensive analysis of **Effector Models**, a novel architectural pattern that redefines business logic not as a side effect of state mutation, but as a first-class mathematical entity. We propose that business logic is isomorphic to a **Directed Graph of Requirement Transformations**. By applying principles from **Harvard Architecture**, **Linear Logic**, and **Thermodynamics**, we introduce a rigorous formalism for defining, composing, and optimizing reactive systems. We demonstrate how the separation of _Control Flow_ (Traits) from _Data Storage_ (State) allows for Ahead-of-Time (AOT) graph linearization, yielding performance characteristics that approach theoretical hardware limits.

## **Contents**

## **1. Introduction: The Crisis of Complexity in Frontend Systems**

- **1.1. The Evolution of State Management**
  - 1.1.1. The MVC Era (Bidirectional Chaos)
  - 1.1.2. The Flux Era (Unidirectional Flow)
  - 1.1.3. The Atom-Based Era and the Limitation of "Flat" Reactivity
- **1.2. The Definition of Business Logic**
  - 1.2.1. The Economic Definition
  - 1.2.2. The Physical Definition (Thermodynamics)
  - 1.2.3. The Computational Definition (The Discovery)
- **1.3. The Harvard Architecture of Reactive Systems**
  - 1.3.1. The Control Plane (Instruction Memory)
  - 1.3.2. The Data Plane (Data Memory)

## **2. Theoretical Framework: The Physics and Math of Reactive Systems**

- **2.1. Thermodynamics and Linear Logic**
  - 2.1.1. The Law of Conservation of Requirements
  - 2.1.2. Traits as Linear Resources
- **2.2. Dual Graph Theory and Duality**
  - 2.2.1. The Graph of State (Data Flow)
  - 2.2.2. The Graph of Requirements (Intent Flow)
  - 2.2.3. The Curry-Howard Isomorphism (Programs as Proofs)
- **2.3. Computer Architecture Analogies**
  - 2.3.1. The Harvard Architecture of Reactivity
  - 2.3.2. Linearization and The End of the Skew Heap

## **3. Structural Design: Algebraic Effects and Traits**

- **3.1. The Trait Concept**
  - 3.1.1. Algebraic Effects in Reactivity
  - 3.1.2. Nominal vs. Structural Typing
  - 3.1.3. Traits as Bidirectional Channels
- **3.2. Compositional Algebra and Tensor Calculus**
  - 3.2.1. The Interaction Tensor
  - 3.2.2. Symbolic Computation (Vector Addition/Subtraction)
  - 3.2.3. The Model as a Transformer

## **4. Polymorphism and Automata Theory**

- **4.1. The "Union Hell" and Sum Types**
  - 4.1.1. The Limitation of Intersection Types
  - 4.1.2. Tagged Unions (Sum Types)
- **4.2. Internal Variants as State Machines**
  - 4.2.1. The Reactive Switch
  - 4.2.2. Orthogonal Regions (Statecharts)
- **4.3. Entity Component System (ECS) Parallels**
  - 4.3.1. Data-Oriented Design
  - 4.3.2. Composition over Inheritance

## **5. Advanced Type Theory Implementation**

- **5.1. Recursive Types and Fixpoints**
  - 5.1.1. The TypeScript Limitation
  - 5.1.2. Type-Level Fixpoints (`ref.self`)
- **5.2. Higher-Kinded Types (HKT) Simulation**
  - 5.2.1. The Problem of Generic Factories
  - 5.2.2. The `this`-Deferral Technique
  - 5.2.3. Boxed Types & Functors
- **5.3. Nominal Typing via Symbols**

## **6. Runtime Architecture: Compilation and Memory**

- **6.1. Region-Based Memory Management**
  - 6.1.1. Micro-Scopes and Deterministic Destruction
  - 6.1.2. RAII in Reactivity
- **6.2. Graph Linearization and Compilation**
  - 6.2.1. From Dynamic Priority Queues to Linear Stacks
  - 6.2.2. Instruction Pipelining and Cache Locality
  - 6.2.3. Fixed-Size Vectors (Data-Oriented Memory Layout)

## **7. The Consumption Layer: Functional Optics**

- **7.1. Lenses and Prisms**
  - 7.1.1. The Reactive Lens (`select`)
  - 7.1.2. Topological Safety
- **7.2. Pattern Matching**
  - 7.2.1. The `match` Operator (Refutable Patterns)
  - 7.2.2. Destructuring Algebraic Data Types

## **8. Implementation and Syntax**

- **8.1. The Definition Layer (`define`, `facet`)**
  - 8.1.1. Atomic Declarations (`define`)
  - 8.1.2. Contract Aggregation (`facet`)
- **8.2. The Model Factory (`model`, `implement`)**
  - 8.2.1. The Model Structure (Input/Output Vectors)
  - 8.2.2. Orthogonal Variants via `impl`
- **8.3. The Collection Layer (`keyval`, `union`)**
  - 8.3.1. Polymorphic Definitions (`union`)
  - 8.3.2. Vector Management (`keyval`)

## **9. Case Studies and Patterns**

- **9.1. The Game Development Pattern: Orthogonal Variants and Dynamic Topology**
  - 9.1.1. The Challenge: Combinatorial Explosion
  - 9.1.2. The Solution: Orthogonal Variants
  - 9.1.3. Thermodynamic Analysis
- **9.2. Role-Based Access Control (RBAC): Polymorphic Composition**
  - 9.2.1. The Challenge: The Union Hell
  - 9.2.2. The Solution: Facet-Based Polymorphism
  - 9.2.3. Architectural Impact (Liskov Substitution)

## **10. Conclusion**

- **10.1. The Convergence of Disciplines**
- **10.2. The Architecture of Inevitability**
- **10.3. Final Remarks**

---

# 1. Introduction: The Crisis of Complexity in Frontend Systems

The fundamental problem of modern interface development is not the volume of data, but the complexity of the _topology_ required to manage that data. As user interfaces have evolved from static document viewers to distributed, event-driven operating environments, the "Cybernetic Loop"—the feedback cycle between the user (sensor), the state (controller), and the DOM (actuator)—has become exponentially intricate.

### 1.1. The Evolution of State Management

The history of state management can be viewed as a struggle to impose order on the chaos of asynchronous mutations.

1.  **The MVC Era (Bidirectional Chaos):** Early paradigms like Model-View-Controller relied on bidirectional data binding. While intuitive for simple forms, this approach led to non-deterministic states where a single change could trigger cascading, unpredictable updates across the view layer.
2.  **The Flux Era (Unidirectional Flow):** The introduction of Flux and Redux imposed a strict unidirectional data flow ($Action \rightarrow Dispatcher \rightarrow Store \rightarrow View$). This solved the determinism problem but treated the entire application state as a single, monolithic, "flat" tree.
3.  **The Atom-Based Era:** Libraries like Effector and Recoil decentralized state into atomic units. While this improved modularity, it treated state primarily as _data containers_.

**The Limitation of "Flat" Reactivity:**
Current state managers operate on a "flat" plane of reactivity. They excel at updating a variable `$count` when an event `increment` occurs. However, they lack the primitives to model **hierarchical**, **recursive**, or **polymorphic** domain models effectively.

Consider a seemingly simple requirement: a list of documents in a travel application, where a document can be a _Passport_, a _Visa_, or a _Military ID_. Each type has unique fields, unique validation logic, and unique interaction capabilities. In a "flat" reactive system, this results in:

- **Combinatorial Explosion:** Stores becoming unions of all possible fields (e.g., `field | null`), forcing developers to write excessive type guards.
- **Implicit Dependencies:** Logic for _Passport_ validation living alongside logic for _Visa_ validation, separated only by runtime `if` statements rather than architectural boundaries.
- **The "Boilerplate Entropy":** The amount of code required to "wire" these entities together grows super-linearly relative to the business value they provide.

We postulate that the "State Management" paradigm has reached a local maximum. To advance, we must shift our focus from _Data Synchronization_ to **Business Logic Modelling**.

### 1.2. The Definition of Business Logic

To engineer a better solution, we must first rigorously define the problem. What is "Business Logic"? In most codebases, it is treated as an ephemeral byproduct—code that exists inside thunks, sagas, or `useEffect` hooks.

We propose three distinct definitions that guide our architectural decisions:

#### 1.2.1. The Economic Definition

Business is the process of extracting value from local market inefficiencies. If a neighborhood lacks a grocery store (inefficiency), opening one creates value.

- **Analogy:** In software, business logic is the bridge between a user's _need_ (the inefficiency) and the system's _capability_ to satisfy it.

#### 1.2.2. The Physical Definition (Thermodynamics)

We draw a direct analogy to thermodynamics. An engine is a device that converts input energy (fuel) into useful work.

- **Input ($E_{in}$):** Raw data, user events, API responses.
- **Work ($W$):** The realization of a business requirement (e.g., placing an order).
- **Entropy ($S$):** Boilerplate code, memory overhead, runtime friction.

The efficiency of a software architecture can be expressed as:

$$ \eta = \frac{W}{E*{in}} = 1 - \frac{T \cdot S}{E*{in}} $$

Where $T$ is the "temperature" (complexity) of the system. Our goal with Effector Models is to minimize $S$ (boilerplate/entropy), thereby maximizing the conversion of developer intent into runtime behavior.

#### 1.2.3. The Computational Definition (The Discovery)

This is the foundational discovery of our research. Business Logic is not a set of imperative instructions; it is a **Directed Graph of Requirement Transformations**.

A **Model** is a topological node that acts as a transformer. It accepts a set of **Capabilities** (Inputs/Traits) and transforms them into a set of **Guarantees** (Outputs/Behaviors).

$$ M: \{Req*{in}\} \rightarrow \{Prov*{out}\} $$

**Example:**
Consider a `ShoppingCart` model.

- **Input Requirements ($Req_{in}$):** It requires a capability to `fetch` data and a capability to `persist` local state.
- **Transformation ($M$):** It orchestrates these low-level capabilities, applying rules (e.g., "cannot checkout if empty").
- **Provided Guarantees ($Prov_{out}$):** It exposes a high-level capability `submitOrder`.

In this paradigm, the data flow (Data flowing _down_ from server to client) is dual to the **Intent Flow** (Requirements flowing _up_ from the UI to the kernel).

### 1.3. The Harvard Architecture of Reactive Systems

To implement this definition of Business Logic, we adopted the principles of the **Harvard Architecture** used in computer engineering.

In the Harvard Architecture, instruction memory (code) and data memory (state) are physically separated. This allows the CPU to fetch instructions and data simultaneously.

**Effector Models** enforces a strict separation between:

1.  **The Control Plane (Traits/Definitions):** The static graph describing _how_ the system behaves. This corresponds to the "Instruction Memory." It is immutable and exists ahead-of-time (AOT).
2.  **The Data Plane (State/Instances):** The runtime values flowing through the graph. This corresponds to the "Data Memory."

Existing state managers mix these planes (e.g., a Class in MobX contains both the method definitions and the instance data). By separating them, we achieve:

- **Static Analysis:** We can validate the logic graph without running it.
- **Linearized Execution:** Since the graph is static, we can compile the reactive chain into a flat list of function calls (Instruction Pipelining), eliminating the overhead of dynamic priority queues at runtime.

This separation is the cornerstone of the `@effector/model` runtime and sets the stage for the theoretical framework discussed in the subsequent chapters.

# 2. Theoretical Framework: The Physics and Math of Reactive Systems

To elevate frontend architecture from an ad-hoc craft to a rigorous engineering discipline, we must ground our understanding of Business Logic in established mathematical and physical principles. Our research indicates that the behavior of reactive systems is not arbitrary; it follows conservation laws analogous to thermodynamics and structural laws analogous to constructive logic.

This chapter outlines the theoretical framework that underpins Effector Models, establishing the mathematical validity of the **Graph of Requirements**.

## 2.1. Thermodynamics and Linear Logic

In standard imperative programming, variables are abundant and disposable. A variable can be read zero times, once, or infinite times without structural consequences. However, in the domain of **Business Logic Modelling**, we treat capabilities (Traits) as finite resources. This aligns with **Linear Logic** (Girard, 1987), a substructural logic where formulas represent resources that must be consumed exactly once.

### 2.1.1. The Law of Conservation of Requirements

We propose that a Model functions as a thermodynamic system. It consumes "energy" in the form of required capabilities (Inputs/Needs) and dissipates "work" in the form of provided features (Outputs/Provides).

Let <b>T</b><sub>in</sub> be the vector of required Traits (dependencies).
Let <b>T</b><sub>out</sub> be the vector of provided Traits (public API).
Let $S$ be the internal entropy (boilerplate, internal glue code, intermediate stores).

The efficiency of a model can be described by the inequality:

$$ \sum \mathbf{T}_{in} - \sum \mathbf{T}_{out} \ge 0 $$

This equation implies a fundamental truth about software architecture: **Applications always expend more effort to realize a feature than the feature itself represents.**

- **Ideal State ($\Delta = 0$):** A perfect pass-through abstraction. The model adds no friction; inputs are directly mapped to outputs.
- **High Entropy ($\Delta \gg 0$):** The model requires massive inputs to produce minimal outputs. This indicates "architectural heat loss"—inefficient abstractions or excessive boilerplate.
- **Impossible State ($\Delta < 0$):** The model provides capabilities that are not supported by its inputs. In our system, this results in a static analysis failure (Type Error).

By formalizing this, the `@effector/model` runtime can theoretically measure the "quality" of an application's architecture by calculating the tensor sum of all models. If the sum is strictly positive, the system is sound. If the sum implies creation of energy from nothing, the system is unsound.

### 2.1.2. Traits as Linear Resources

In Effector Models, a **Trait** is not merely an interface definition; it is a resource contract.
If a Model declares `need: [AuthTrait]`, it _must_ consume that trait to produce its output. Unlike a global singleton (which is available everywhere), a Trait must be explicitly threaded through the graph. This linearity ensures:

1.  **No Implicit Dependencies:** Every capability used by the model is accounted for in its input vector.
2.  **Dead Code Elimination:** If a Trait is provided but never consumed by a downstream model, the graph pruner can eliminate the entire subgraph associated with that Trait.

## 2.2. Dual Graph Theory and Duality

A core discovery of our research is that a reactive application consists of two distinct, opposing Directed Acyclic Graphs (DAGs). Understanding the duality between them is essential for correct modeling.

### 2.2.1. The Graph of State (Data Flow)

This is the traditional view of reactivity (e.g., Redux, standard Effector).

- **Direction:** Downstream ($Event \rightarrow Store \rightarrow View$).
- **Nature:** Dynamic, value-propagating.
- **Operation:** Push-based. An event pushes a value into a store.

### 2.2.2. The Graph of Requirements (Intent Flow)

This is the newly identified graph managed by Effector Models.

- **Direction:** Upstream ($View \rightarrow Model \rightarrow Kernel$).
- **Nature:** Static, capability-resolving.
- **Operation:** Pull-based (conceptually). The View _requires_ a capability (e.g., `submitForm`), which pulls that requirement from the Model, which pulls `apiClient` from the Kernel.

These two graphs are **Duals**.

- In the **Data Graph**, nodes are values. Edges are functions ($f(x) = y$).
- In the **Requirement Graph**, nodes are Transformers. Edges are Traits.

### 2.2.3. The Curry-Howard Isomorphism

We apply the **Curry-Howard correspondence** to business logic.

- **Types** corresponds to **Propositions** (Requirements/Traits).
- **Programs** corresponds to **Proofs** (Models).

Constructing a `Model` is equivalent to writing a constructive proof that:
$$ \text{Given inputs } \{A, B\}, \text{ one can derive behavior } \{C\}. $$

$$ A \land B \vdash C $$

If the model compiles, the proof is valid. This shifts the burden of correctness from runtime testing to build-time verification. We are not just writing code; we are proving that our business requirements are satisfiable given the available system resources.

## 2.3. Computer Architecture Analogies

To implement this theoretical framework efficiently in JavaScript, we looked to hardware architecture design.

### 2.3.1. The Harvard Architecture of Reactivity

Standard JavaScript frameworks (React, MobX, Vue) operate on a **Von Neumann Architecture** model: code (logic) and data (state) are stored in the same memory space (objects/classes).

- _Consequence:_ To execute logic, the runtime must look up methods on objects dynamically. This incurs the "Von Neumann Bottleneck"—the latency of fetching instructions and data across the same bus (or in JS terms, the cost of property lookups and prototype chain traversal).

Effector Models implements a **Harvard Architecture**:

1.  **Instruction Memory (The Control Plane):** The `model()` definition. This is a static, immutable graph of relations. It is analyzed once at startup.
2.  **Data Memory (The Data Plane):** The `keyval` instances. These are pure data vectors.

### 2.3.2. Linearization and The End of the Skew Heap

Current reactive libraries (including Effector v23) often use dynamic priority queues (e.g., Skew Heaps) to manage update order and prevent "glitches" (diamond dependency problems). While robust, these are computationally expensive ($O(\log n)$ insertion/deletion).

By enforcing the Harvard Architecture separation, the **Requirement Graph** becomes fully known Ahead-of-Time (AOT).

- Since the graph is static, the topological sort can be pre-calculated.
- The dynamic priority queue can be replaced by a **Linear Stack** (or flat array) of callbacks.

**The Result:** The runtime complexity of a state update drops from $O(W \cdot \log N)$ (where $W$ is graph width) to $O(N)$ (linear iteration), which is the theoretical physical limit for causal propagation. We call this **Instruction Pipelining** for reactivity.

This architectural breakthrough means that Effector Models is not just an abstraction layer; it is a mechanism for compiling high-level business rules into bare-metal optimized execution paths.

# 3. Structural Design: Algebraic Effects and Traits

Having established the physical laws governing reactive systems, we must now define the structural atoms that compose them. In traditional Object-Oriented Programming (OOP), the fundamental unit is the Class, which conflates state, behavior, and identity. In Functional Programming (FP), the unit is the Function, which often struggles to encapsulate complex, stateful lifecycles.

To resolve the paradox of modeling stateful logic declaratively, Effector Models introduces the **Trait** (reified in the runtime as **Facet**). This chapter explores the derivation of Traits from the theory of **Algebraic Effects** and formally defines the **Compositional Algebra** used to aggregate them.

## 3.1. The Trait Concept

A **Trait** is a formal specification of a reactive interface. It is the architectural boundary that separates the _declaration_ of a requirement from its _fulfillment_.

### 3.1.1. Algebraic Effects in Reactivity

The theory of Algebraic Effects separates computational effects (like I/O, state mutation, or exceptions) from the code that handles them. An effect is _raised_ (declared) by a program and _handled_ by an enclosing scope.

In Effector Models, we apply this to business capabilities:

1.  **The Effect (Trait Definition):** A Trait declares a set of reactive primitives (Stores, Events) that represent a capability (e.g., `AuthTrait` declares `$user` and `login`). This is a pure signature; it contains no logic.
2.  **The Handler (Model Implementation):** The Model acts as the effect handler. It "catches" the Trait requirements and provides a concrete implementation (the `impl` block).

This separation allows for **Dependency Injection** at the type level. A Model can declare a dependency on `AuthTrait` without knowing whether that trait is fulfilled by a local mock, a REST API adapter, or a WebSocket stream.

### 3.1.2. Nominal vs. Structural Typing

One of the most significant challenges in modeling business logic within TypeScript is the language's reliance on **Structural Typing**. In a structural type system, if Entity A and Entity B have the same shape (e.g., both have a `Store<string>`), they are considered interchangeable.

However, in business domains, semantics matter more than shape.

- **Case Study:** Consider a `PassportID` (a string) and a `DatabaseID` (a string). Structurally, `Store<PassportID>` and `Store<DatabaseID>` are identical (`Store<string>`).
- **The Conflict:** A function expecting a database ID should not accept a passport ID, even if they are both strings.

Effector Models enforces **Nominal Typing** for Traits. Each Trait is identified by a `unique symbol` (branding).
$$ \text{typeof } Trait_A \neq \text{typeof } Trait_B \iff Symbol_A \neq Symbol_B $$

This ensures that Traits function as strict contracts. A model requiring a `ThaiPowerSocket` trait will not accept a `EuropeanPowerSocket` trait, even if their pin layout (structure) happens to coincide physically. This prevents the "implicit coupling" that plagues large-scale applications where interfaces are matched loosely by shape.

### 3.1.3. Traits as Bidirectional Channels

Unlike standard interfaces which are typically methods on an object (Call $\rightarrow$ Return), a Trait describes a **Bidirectional Reactive Channel**.

A Trait definition contains:

- **Sources (Upstream):** Stores that emit values (Data flowing out).
- **Sinks (Downstream):** Callable Events that accept values (Intent flowing in).

```typescript
// A bidirectional contract
const FormFieldTrait = trait({
  // Source: The current value flowing OUT
  $value: define.store<string>(),

  // Sink: The intent to change value flowing IN
  change: define.event<string>(),
});
```

This duality allows a parent model to not only read the state of a child model but also drive its behavior through a standardized protocol, without direct reference to the child's internal logic.

## 3.2. Compositional Algebra and Tensor Calculus

When Models and Traits are composed, they do not merely merge properties; they undergo algebraic operations. We observed that these interactions can be modeled using **Tensor Calculus**.

### 3.2.1. The Interaction Tensor

Every Model can be represented as a transformation tensor describing its interaction with the environment. We define a 4-dimensional vector space for any given logical unit:

$$ V*{model} = \begin{bmatrix} R*{in} \\ W*{in} \\ R*{out} \\ W\_{out} \end{bmatrix} $$

Where:

- $R_{in}$ (Read In): Data requirements (e.g., `need: [$userId]`).
- $W_{in}$ (Write In): Control requirements (e.g., `need: [submitEvent]`).
- $R_{out}$ (Read Out): Data exposed (e.g., `provide: [$status]`).
- $W_{out}$ (Write Out): Control exposed (e.g., `provide: [reset]`).

This tensor representation allows us to statically analyze the "flow" of the application.

- A **pure sink** (e.g., a logger) has a vector form like $[1, 0, 0, 0]^T$.
- A **pure source** (e.g., a timer) has $[0, 0, 1, 0]^T$.
- A **transformer** (business logic) has non-zero values in both Input and Output dimensions.

### 3.2.2. Symbolic Computation

Composition of models is defined as **Vector Addition** of their Traits.

If Model $A$ implements Trait $T_1$ and Model $B$ implements Trait $T_2$, the composite Model $C = Union(A, B)$ possesses a capability vector equal to the sum of its parts:

$$ \vec{C} = \vec{A} + \vec{B} $$

However, when a Model _consumes_ a Trait (internalizes it), it performs **Vector Subtraction**.
If Model $M$ requires `AuthTrait` ($V_{req}$) and implements logic that satisfies it internally, the external requirement vanishes:

$$ V*{external} = V*{internal} - V\_{satisfied} $$

This algebraic approach provides the theoretical basis for the **"Zero-Sum" Quality Metric** discussed in Chapter 2. By summing the tensors of all models in the application graph, the compiler can detect:

1.  **Unsatisfied Requirements:** $\sum V < 0$ (Compile Error).
2.  **Unused Capabilities:** $\sum V > 0$ (Dead Code / Entropy).

### 3.2.3. The Model as a Transformer

Finally, we formalize the Model as a function $M$ that maps an Input Tensor Space to an Output Tensor Space.

$$ M: \mathbb{T}_{in} \rightarrow \mathbb{T}_{out} $$

This mapping is deterministic and immutable. Unlike a Class instance which is a bundle of mutable state, an Effector Model definition is a **Static Transformation Matrix**. It describes _how_ inputs are converted to outputs, but it does not hold the data itself.

This distinction is crucial for the **Runtime Optimization** (Chapter 6), as it allows the runtime to pre-calculate the exact topology of the reactive graph (the matrix multiplication) before a single byte of data flows through the system.

# 4. Polymorphism and Automata Theory

While the previous chapters established the static structure of reactive systems, real-world business domains are rarely static. They are inherently polymorphic: a user can be a _Guest_ or an _Admin_; a document can be a _Passport_ or a _Visa_; a payment method can be _Credit Card_ or _PayPal_.

In traditional state management, polymorphism is often handled via "God Objects"—monolithic structures containing nullable fields for every possible variation. This leads to sparse matrices of data and fragile runtime checks.

Effector Models introduces a rigorous approach to polymorphism based on **Sum Types** and **Automata Theory**, allowing the reactive graph to dynamically reconfigure its topology based on the data it processes.

## 4.1. The "Union Hell" and Sum Types

The challenge of modeling heterogeneous collections in a reactive environment is what we term **"The Union Hell."**

### 4.1.1. The Limitation of Intersection Types

In a structural type system (like TypeScript), developers often attempt to model polymorphism using Intersection Types ($A \land B$).

- _Attempt:_ Create a single object capable of handling both _Passport_ logic and _Visa_ logic.
- _Result:_ The object grows indefinitely. Every new document type adds fields that are `undefined` for 90% of instances.

From a reactive perspective, this is disastrous. If a `Store` holds a union type `A | B`, downstream subscribers must perform type narrowing inside every `sample` or `map`. This breaks the **Linearity of the Intent Flow**—the requirement graph becomes obscured by imperative runtime guards.

### 4.1.2. Tagged Unions (Sum Types)

We resolve this by adopting **Sum Types** (Disjoint Unions). A Sum Type expresses that a value is one of several distinct possibilities, but never both simultaneously.

$$ T = A + B $$

In Effector Models, this is reified through the **Union Model**. A Union Model does not merge the fields of its variants. Instead, it acts as a topological multiplexer.

- **Input:** A stream of polymorphic data.
- **Mechanism:** A discriminator function (the "Tag").
- **Output:** Routing of data to the specific sub-graph (Variant) responsible for that type.

This ensures that the logic for _Passport_ validation exists _only_ within the _Passport_ variant's memory region and is never evaluated—or even allocated—for a _Visa_.

## 4.2. Internal Variants as State Machines

The most powerful application of Sum Types in our architecture is the concept of **Internal Variants**. We propose that a Model is not a static container, but a **Finite State Automaton (FSM)**.

### 4.2.1. The Reactive Switch

Standard FSMs in frontend development are often implemented as a simple `status` string field (`idle`, `loading`, `success`). While this tracks the _label_ of the state, it does not manage the _structure_ associated with that state.

Effector Models implements the **Reactive Switch**. When a model transitions from Variant A to Variant B, the topological structure of the model changes.

- **Variant A (Losing):** Contains stores for `$intensity` and logic for `calculateRedness`.
- **Variant B (Winning):** Contains none of the above.

This is a dynamic topology change. The memory for `$intensity` is allocated _only_ upon entry into the `Losing` state and deallocated upon exit. This aligns with the principle of **Resource Acquisition Is Initialization (RAII)** applied to reactive logic.

### 4.2.2. Orthogonal Regions (Statecharts)

Complex entities often suffer from "State Explosion"—the combinatorial growth of states (e.g., a Game can be `Winning` vs. `Losing`, AND simultaneously `Online` vs. `Offline`). A naive FSM would require $2 \times 2 = 4$ distinct states. Adding a third dimension creates 8, then 16, etc.

To solve this, we implement **Orthogonal Regions**, a concept from Harel Statecharts.
A Model can define multiple, independent axes of variation:

$$ M*{state} = V*{game} \times V\_{network} $$

- **Axis 1 (`game`):** `Winning | Losing`
- **Axis 2 (`network`):** `Online | Offline`

The runtime treats these axes as independent sub-graphs. A transition in the `network` axis does not disrupt the memory or logic of the `game` axis. This reduces the complexity space from $O(N \times M)$ to $O(N + M)$, effectively defusing the combinatorial explosion.

## 4.3. Entity Component System (ECS) Parallels

Our research revealed a striking isomorphism between Effector Models and the **Entity Component System (ECS)** architecture prevalent in high-performance game development.

The traditional Object-Oriented approach couples Data and Behavior (Methods on Class).
The Effector Model approach decouples them, mirroring ECS:

| Concept in ECS | Concept in Effector Models       | Description                                                                                          |
| :------------- | :------------------------------- | :--------------------------------------------------------------------------------------------------- |
| **Entity**     | **Instance (`keyval` item)**     | An ID or address in memory. It has no logic, only an identity.                                       |
| **Component**  | **Trait / Facet**                | A pure data container or interface definition. It describes a capability (e.g., `Position`, `Auth`). |
| **System**     | **Implementation (`impl`/`fn`)** | The logic that operates on entities possessing specific Components.                                  |

### 4.3.1. Data-Oriented Design

By aligning with ECS principles, Effector Models moves towards **Data-Oriented Design**.

- **Entities** (Instances) are stored in contiguous memory blocks (arrays) within the `keyval` collection.
- **Systems** (Logic) iterate over these arrays linearly.

This structure is crucial for the performance optimizations discussed in Chapter 6. It allows the runtime to process updates in batches, maximizing CPU cache locality and minimizing pointer chasing, which is the primary bottleneck in graph-based reactivity.

### 4.3.2. Composition over Inheritance

Just as ECS allows an entity to be composed of arbitrary components (e.g., an enemy has `Position` + `Health` + `AI`), an Effector Model is composed of arbitrary Traits.

- `User = IdTrait + AuthTrait`
- `Guest = IdTrait`

This compositional approach allows for extreme flexibility. A "System" (Model Logic) that requires `IdTrait` can operate on both `User` and `Guest` indistinguishably, fulfilling the promise of polymorphism without the rigidity of class inheritance hierarchies.

# 5. Advanced Type Theory Implementation

The theoretical elegance of Effector Models—Traits, Variants, and Composition—would remain an academic curiosity if it could not be implemented in TypeScript, the industry standard for frontend development. TypeScript is a powerful but structurally-typed language, which presents significant challenges when attempting to model the nominal, recursive, and higher-order concepts we have defined.

This chapter details the "Type Engineering" breakthroughs required to reify our theoretical framework into a type-safe, developer-friendly API.

## 5.1. Recursive Types and Fixpoints

Modeling hierarchical data structures (trees, file systems, comment threads) requires recursion. A Model must be able to reference _itself_ in its own definition.

### 5.1.1. The TypeScript Limitation

In TypeScript, a variable cannot reference itself in its own initializer due to the "circular reference" error.

```typescript
// ❌ Error: 'Category' is referenced directly or indirectly in its own initializer.
const Category = model({
  children: define.array(Category),
});
```

Standard solutions involve deferring the definition via `interface`, but this breaks the "single source of truth" principle of our declarative API.

### 5.1.2. Type-Level Fixpoints (`ref.self`)

To solve this, we implemented a type-level **Fixpoint Combinator**. We introduced a symbolic token `ref.self` that acts as a placeholder for the "current model type."

The type inference engine treats `ref.self` as a generic type variable $T$. The `model` function then performs a higher-order type transformation, essentially "tying the knot" by substituting $T$ with the inferred type of the model itself.

$$ \text{Model} = \mu T . F(T) $$

Where $\mu$ is the fixpoint operator. In the API:

```typescript
const Category = model({
  facets: {
    // ✅ Valid. Resolves to 'Category' at the type level.
    subcategories: define.array(ref.self),
  },
});
```

This allows for infinite nesting depth while maintaining full type safety and auto-completion at every level of the hierarchy.

## 5.2. Higher-Kinded Types (HKT) Simulation

One of the most ambitious goals of Effector Models is to support **Generic Models**. We want to define a `List<T>` model that can accept _any_ user-defined model $T$ and wrap it in list logic.

TypeScript, unlike Haskell or Scala, does not support Higher-Kinded Types (HKTs) natively. You cannot pass a generic type constructor (like `Array`) as an argument to another type; you can only pass a concrete type (like `Array<number>`).

### 5.2.1. The Problem of Generic Factories

We need to define a factory function (the Model definition) that returns a type dependent on an unknown input type.
$$ F: (_ \rightarrow _) \rightarrow \* $$
Without HKTs, writing a `List` model that is generic over its item type $T$ forces users to cast types manually (`as any`), destroying type safety.

### 5.2.2. The `this`-Deferral Technique

We discovered a novel technique to emulate HKTs by exploiting TypeScript's handling of the `this` context in interfaces.

TypeScript delays the resolution of `this` until the type is actually instantiated. We can define a "Box" interface that carries a generic payload in `this`.

```typescript
interface HKT<Param> {
  // 'this' carries the future type
  readonly _URI: unique symbol;
  new (param: Param): any;
}
```

By encoding the generic constraint into a structure that references `this`, we can pass "unapplied" generics through the `model` function. When the user finally instantiates the model:
`const UsersList = List(UserModel)`,
the compiler "applies" the `UserModel` type to the `List` HKT, correctly inferring the resulting type structure.

### 5.2.3. Boxed Types & Functors

This technique allows us to implement **Functors** over Models. A Model can be "mapped" over another Model definition.

- **Boxed Type:** A container that holds a type definition but hasn't been instantiated (e.g., the concept of a "List of X").
- **Unboxing:** The process of applying a concrete type (e.g., "User") to the Box to get a concrete Model ("List of Users").

This breakthrough allows library authors to create highly reusable, generic logic blocks (Lists, Tables, Trees, Forms) that are fully type-safe for the end-user, regardless of the complexity of the domain entities passed into them.

## 5.3. Nominal Typing via Symbols

As discussed in Chapter 3, structural typing is insufficient for distinguishing Traits. To enforce strict contracts, we utilize **Unique Symbols**.

In TypeScript, `unique symbol` is a nominal type. Two unique symbols are never equal, even if they have the same description.

```typescript
declare const Brand: unique symbol;
type Branded<T, Label extends symbol> = T & { [Brand]: Label };
```

We "brand" every Trait and Model definition with a unique symbol. This prevents accidental structural compatibility.

- `Trait A { x: int }` $\neq$ `Trait B { x: int }`.

This ensures that the "wiring" of the application is intentional. The compiler will reject an attempt to plug a `VoltageSource` into a `WaterPipe`, even if both are represented by a `number` (volts vs. liters/min). This level of strictness is critical for the correctness of large-scale business logic graphs.

# 6. Runtime Architecture: Compilation and Memory

The theoretical elegance of a software architecture is inconsequential if it cannot be executed efficiently. The defining characteristic of the `@effector/model` runtime is its departure from the traditional "interpretive" approach of JavaScript libraries. Instead of walking a dynamic object graph at runtime to determine dependencies, the runtime employs a form of **Just-In-Time (JIT) Compilation** (conceptually closer to AOT within the startup phase) to linearize execution paths.

This chapter details the memory management strategy and the algorithmic breakthroughs that allow Effector Models to approach the theoretical physical limits of reactivity performance.

## 6.1. Region-Based Memory Management

Dynamic reactivity typically suffers from the "Subscription Lifecycle Problem." When components or logic branches are created and destroyed dynamically, ensuring that all subscriptions are explicitly teardown is error-prone, leading to memory leaks.

Effector Models solves this by adopting **Region-Based Memory Management**, a technique often found in systems programming languages (e.g., Rust, Cyclone).

### 6.1.1. Micro-Scopes

Every instance of a Model is treated as a distinct **Memory Region** (or "Micro-Scope").

- **Allocation:** When a Model is instantiated (e.g., adding an item to a list or entering a Variant), a new Region is allocated. All stores, events, and effects created within the model's `impl` function are intrinsically bound to this Region.
- **Deallocation:** When the Model is destroyed (removed from the list or switching Variants), the entire Region is discarded.

Because the topological links are contained within the Region, the runtime does not need to track individual subscriptions for garbage collection. It simply drops the reference to the Region. This provides **Deterministic Destruction**—a guarantee that no "zombie" logic remains active after its parent model has ceased to exist.

### 6.1.2. RAII in Reactivity

We apply the C++ principle of **Resource Acquisition Is Initialization (RAII)** to reactive logic.

- **Initialization:** The logic for a specific state (e.g., the `$intensity` store in the `Losing` variant) is allocated _only_ when the transition to that state occurs.
- **Acquisition:** The capability to react to "losing" events is acquired simultaneously with the memory allocation.
- **Release:** The logic is automatically disposed of when the state invariant no longer holds.

This eliminates the class of bugs where logic executes in an invalid context (e.g., trying to calculate "game over" score when the game has already restarted), as the memory for that logic literally does not exist outside its valid context.

## 6.2. Graph Linearization and Compilation

The most significant performance breakthrough in Effector Models is the transition from dynamic graph traversal to linear execution.

### 6.2.1. From Dynamic Priority Queues to Linear Stacks

Current state-of-the-art reactive libraries (including Effector v23) rely on **Dynamic Priority Queues** (often implemented as Skew Heaps) to schedule updates.

- **Purpose:** To prevent "glitches" (inconsistent intermediate states in diamond dependencies) by ensuring topological order during propagation.
- **Cost:** Insertion and deletion in a heap is $O(\log N)$. While fast, it is not instant. Furthermore, heap operations involve pointer chasing, which causes CPU cache misses.

Effector Models leverages the **Harvard Architecture** (Chapter 1). Because the Model definition (Instruction Memory) is static and immutable, the dependency graph is known **Ahead-of-Time**.

1.  **Static Analysis:** Upon application startup, the runtime analyzes the `model()` definitions.
2.  **Topological Sort:** It calculates the correct execution order for all possible data flows.
3.  **Linearization:** The graph is flattened into a **Linear Stack** of function calls.

**The Result:** The runtime complexity of a state update drops from $O(W \cdot \log N)$ to **$O(N)$** (linear iteration). The runtime simply iterates over a flat array of callbacks.

### 6.2.2. Instruction Pipelining and Cache Locality

This linearization aligns with modern CPU architecture.

- **Pointer Chasing:** Traversing a graph object-by-object ($A \rightarrow B \rightarrow C$) scatters memory access, causing frequent CPU cache misses.
- **Data Locality:** By flattening the execution graph into a contiguous array of instructions, we maximize **Cache Locality**. The CPU can pre-fetch instructions efficiently.

We term this **"Reactive Instruction Pipelining."** The runtime behaves less like a graph walker and more like a compiled bytecode interpreter.

### 6.2.3. Fixed-Size Vectors

Furthermore, the data for model instances is stored in **Fixed-Size Vectors** (Arrays) rather than Hash Maps (Objects).
Since the shape of a Model is defined by its Traits, and Traits are static, the runtime knows exactly how many "slots" an instance needs.

- **Access:** Accessing a field becomes an array index lookup `data[3]` ($O(1)$) rather than a hash map lookup `data["intensity"]` ($O(1)$ amortized, but with higher constant factors and collision overhead).

This combination of **Algorithmic Linearization** and **Data-Oriented Memory Layout** ensures that Effector Models can scale to handle millions of active entities with negligible overhead, performance previously attainable only in low-level game engines (ECS).

# 7. The Consumption Layer: Functional Optics

While the previous chapters focused on the internal structure and memory management of Models, this chapter addresses the **Consumption Problem**. Given a highly dynamic, polymorphic, and potentially recursive graph of logic, how can external consumers (such as UI components or other Models) safely interact with it?

Direct access to state (e.g., `model.variant.losing.$intensity.getState()`) is inherently unsafe in a system where memory regions are transient. Attempting to read a value from a variant that is not currently active would result in a runtime error or undefined behavior (accessing unallocated memory).

To solve this, Effector Models implements a consumption layer based on **Functional Optics**—specifically **Lenses** and **Prisms**. These primitives allow us to define "Reactive Projections" that are guaranteed to be safe by construction.

## 7.1. Lenses and Prisms

In functional programming, a **Lens** is a composable pair of functions used to focus on a sub-part of a data structure. A **Prism** is a variation of a Lens used for Sum Types—it focuses on a part of the structure that _may not exist_.

### 7.1.1. The Reactive Lens (`select`)

The `select` operator in Effector Models acts as a **Reactive Lens**. It defines a path through the model's graph to a specific atom of state.

Consider the `GameModel` defined in Chapter 3, which has a `losing` variant containing an `$intensity` store.

- **The Problem:** The `$intensity` store physically exists only when `$score < 0`.
- **The Prism:** Accessing `$intensity` is a Prism operation. It yields `Option<Store<number>>`.
- **The Projection:** To use this in a UI (which expects a concrete number, not an Option), we must convert the Prism into a Lens by providing a fallback.

```typescript
import { select } from '@effector/model';

// Define the Optical Path
const $currentIntensity = select(gameModel)
  .variant('losing') // Focus on the 'losing' variant (Prism)
  .path((scope) => scope.$intensity) // Focus on the store within (Lens)
  .fallback(0); // Collapse Option to Value (Total Lens)
```

### 7.1.2. Topological Safety

This mechanism provides **Topological Safety**.

1.  **Active State:** When the game is in the `losing` state, `$currentIntensity` mirrors the internal `$intensity` store via a direct reactive link.
2.  **Inactive State:** When the game switches to `winning`, the `losing` memory region is deallocated. The `$currentIntensity` store automatically switches to the `fallback` value (`0`).

Crucially, this switch happens synchronously and atomically during the transaction. The consumer never observes an "undefined" or "stale" state. The lens acts as a bridge over the topological gap created by the variant switch.

## 7.2. Pattern Matching

While Lenses allow us to _read_ data from polymorphic structures, we also need a way to _route_ control flow based on the active variant. This is achieved through **Structural Pattern Matching**.

### 7.2.1. The `match` Operator

Standard JavaScript `switch` statements are imperative and run only once. In a reactive system, we need a "Persistent Switch" that maintains the correct active branch as the underlying data changes.

The `match` operator applies the concept of **Refutable Patterns** to the reactive graph.

```typescript
import { match } from '@effector/model';

match({
  // The Discriminator: A polymorphic model instance
  source: userModel.activeVariant,

  cases: {
    // Pattern: Variant is 'Admin'
    admin: (adminScope) => {
      // This function executes ONLY when the user is an Admin.
      // 'adminScope' is typed specifically as the Admin implementation.

      sample({
        clock: promoteButtonClicked,
        target: adminScope.banUser, // Valid: Admins have 'banUser'
      });
    },

    // Pattern: Variant is 'Guest'
    guest: (guestScope) => {
      // 'banUser' does not exist here. TS prevents access.
      sample({
        clock: promoteButtonClicked,
        target: showLoginModal,
      });
    },
  },
});
```

### 7.2.2. Destructuring Algebraic Data Types

The `match` operator performs **Algebraic Destructuring**. It does not merely check a tag; it unpacks the context (the memory region) associated with that tag.

- **Input:** A Sum Type (Union Model).
- **Branches:** Each branch receives a narrowed type (the specific Variant Implementation).
- **Lifecycle:** The logic inside a `case` branch follows the lifecycle of the variant. When the user transitions from `Guest` to `Admin`, the `guest` branch is torn down (subscriptions removed), and the `admin` branch is initialized.

This ensures that the "Control Plane" of the application dynamically reconfigures itself to match the "Data Plane," maintaining the 1:1 correspondence required by our theoretical framework.

# 8. Implementation and Syntax

The theoretical constructs of Effector Models—Harvard Architecture, Linear Logic, and Automata Theory—are reified into a concrete Domain-Specific Language (DSL) within the `@effector/model` package. This syntax is designed not merely for brevity, but to enforce the architectural constraints discovered during our research. It compels the developer to explicitly define the **Input Vector** (Requirements) and **Output Vector** (Capabilities) of every logical unit.

This chapter details the three layers of the API: Definition, Implementation, and Collection.

## 8.1. The Definition Layer (`define`, `facet`)

The Definition Layer corresponds to the **Instruction Memory** in our Harvard Architecture analogy. It allows developers to declare the _shape_ and _intent_ of a reactive interface without allocating any runtime memory or defining any behavior.

### 8.1.1. Atomic Declarations (`define`)

The `define` namespace provides primitives to declare reactive atoms. These are **Type Constructors** that exist primarily for static analysis and runtime reflection.

- `define.store<T>(defaultState?)`: Declares a requirement for a stateful value of type `T`.
- `define.event<T>()`: Declares a requirement for a command or signal of type `T`.

```typescript
import { define } from '@effector/model';

// A declaration of a store, not an instance.
// No memory is allocated here.
const $id = define.store<string>();
```

### 8.1.2. Contract Aggregation (`facet`)

A **Facet** (the runtime implementation of the theoretical **Trait**) is a named collection of atomic declarations. It represents a cohesive capability or protocol.

Facets enforce **Nominal Typing** via unique symbols (as discussed in Chapter 5.3), ensuring that contracts are matched by intent, not just structure.

```typescript
import { facet } from '@effector/model';

// The "Visual" capability contract
export const VisualFacet = facet({
  $color: define.store<string>(),
  isVisible: define.store<boolean>(true), // Default value
});

// The "Identity" capability contract
export const IdentityFacet = facet({
  id: define.store<string>(),
  rename: define.event<string>(),
});
```

This layer establishes the **Graph of Requirements**. By defining Facets, the developer creates the "sockets" into which business logic will later be plugged.

## 8.2. The Model Factory (`model`, `implement`)

The `model` function is the compiler that transforms the static definitions into a simplified executable graph. It binds the **Requirements** (Inputs/Facets) to **Realizations** (Implementation).

### 8.2.1. The Model Structure

The configuration object passed to `model` maps directly to the Interaction Tensor defined in Chapter 3.

```typescript
import { model } from '@effector/model';

const UserCard = model({
  // 1. Input Vector (Requirements)
  // Dependencies required for this model to exist.
  input: {
    userId: define.store<string>(),
  },

  // 2. Output Vector (Capabilities)
  // The Facets this model realizes and exposes to the world.
  facets: {
    visual: VisualFacet,
    identity: IdentityFacet,
  },

  // 3. Transformation Matrix (Implementation)
  // The logic that maps Input -> Output.
  fn: ({ input }) => {
    // Internal logic (The "Engine")
    const $name = createStore('Guest');

    // Binding logic to the Output Vector
    return {
      visual: {
        $color: define.store('blue'), // Concrete implementation
        isVisible: define.store(true),
      },
      identity: {
        id: input.userId, // Passthrough from Input
        rename: createEvent(),
      },
    };
  },
});
```

### 8.2.2. Orthogonal Variants via `impl`

For models acting as State Machines, the `fn` property is replaced or augmented by `variant` and `impl`. This defines the **Topology Switching** logic.

```typescript
const GameModel = model({
  input: { $score: define.store(0) },

  // The Discriminator Function
  variant: {
    source: (i) => i.$score,
    cases: {
      winning: (s) => s > 0,
      losing: (s) => s < 0,
    },
  },

  // Topology Definitions per Variant
  impl: {
    winning: () => ({
      /* ... topology A ... */
    }),

    // This topology exists ONLY when score < 0
    losing: ({ $score }) => {
      const $intensity = $score.map(Math.abs);
      return {
        $intensity, // Unique field export
        /* ... topology B ... */
      };
    },
  },
});
```

This syntax ensures that the **Data Plane** (the runtime instances) remains perfectly synchronized with the **Control Plane** (the active variant logic).

## 8.3. The Collection Layer (`keyval`, `union`)

The final layer addresses the management of dynamic collections and polymorphism.

### 8.3.1. Polymorphic Definitions (`union`)

The `union` function defines a **Sum Type** over Models. It creates a closed set of possible model types that can inhabit a collection.

```typescript
import { union } from '@effector/model';

export const ChatItem = union({
  message: MessageModel,
  systemNotice: NoticeModel,
  dateSeparator: DateModel,
});
```

### 8.3.2. Vector Management (`keyval`)

The `keyval` factory creates a managed collection (a reactive array/map). It is optimized for **Linear Memory Layout** (Chapter 6.2.3).

```typescript
import { keyval } from '@effector/model';

const ChatHistory = keyval({
  model: ChatItem, // Enforces polymorphism constraint
});

// Adding an item requires specifying the variant and its specific input
ChatHistory.add({
  variant: 'message',
  input: { text: 'Hello World' },
});
```

This API surface is minimal but strictly typed. It forces the developer to acknowledge the polymorphic nature of the data at the point of insertion, preventing "Union Hell" by ensuring that every item in the collection is a valid instance of one of the `union` variants.

By standardizing these three layers—Definition, Factory, and Collection—Effector Models provides a complete DSL for describing the "Physics" of an application, turning business logic from a chaotic set of instructions into a structured, verifiable architecture.

# 9. Case Studies and Patterns

The theoretical framework of Effector Models is best understood through its application to complex, real-world domains. This chapter presents two canonical case studies that demonstrate the architectural breakthroughs of **Topological Switching** and **Polymorphic Composition**. These examples illustrate how the "Harvard Architecture" of reactivity solves problems that are intractable or inefficient in traditional state management paradigms.

## 9.1. The Game Development Pattern: Orthogonal Variants and Dynamic Topology

Game logic represents the pinnacle of state management complexity due to the combinatorial explosion of states and the need for extreme resource efficiency. A game entity often exists in multiple independent states simultaneously (e.g., _Moving_ vs. _Idle_ AND _Vulnerable_ vs. _Invincible_).

### 9.1.1. The Challenge: Combinatorial Explosion

In a traditional "flat store" approach, a game character's state is modeled as a monolithic object:

```typescript
type GameState = {
  score: number;
  status: 'winning' | 'losing';
  network: 'online' | 'offline';
  // Fields below are nullable, creating a "Sparse Matrix"
  losingIntensity?: number; // Only relevant if status === 'losing'
  reconnectAttempt?: number; // Only relevant if network === 'offline'
};
```

This leads to **Sparse Data Structures** and fragile runtime checks (`if (state.losingIntensity != null)`).

### 9.1.2. The Solution: Orthogonal Variants

Effector Models solves this via **Orthogonal Variants**. We define independent axes of variation. The runtime creates a Cartesian product of logic graphs, allocating memory _only_ for the active branches.

```typescript
const GameModel = model({
  input: {
    $score: define.store(0),
    $ping: define.store(-1),
  },

  // Axis 1: Gameplay Status
  variants: {
    gameplay: {
      source: (i) => i.$score,
      cases: {
        winning: (s) => s > 0,
        losing: (s) => s < 0,
      },
    },
    // Axis 2: Network Status
    network: {
      source: (i) => i.$ping,
      cases: {
        online: (p) => p >= 0,
        offline: (p) => p === -1,
      },
    },
  },

  impl: {
    gameplay: {
      // Logic allocated ONLY when score < 0
      losing: ({ $score }) => {
        const $intensity = $score.map(Math.abs);
        // We export a field that does not exist in the 'winning' state
        return { $intensity };
      },
    },
    network: {
      // Logic allocated ONLY when ping === -1
      offline: () => {
        const $reconnectTimer = interval({ timeout: 5000 });
        return { $reconnectTimer };
      },
    },
  },
});
```

### 9.1.3. Thermodynamic Analysis

By applying the **Thermodynamics of Abstraction** (Chapter 2.1), we observe optimal efficiency:

1.  **Memory Conservation:** When the player is winning and online, the memory footprint for `$intensity` and `$reconnectTimer` is strictly zero. The graph nodes do not exist.
2.  **Topological Safety:** It is impossible to access `$intensity` in the winning state, preventing a class of bugs where stale logic reacts to invalid state.

## 9.2. Role-Based Access Control (RBAC): Polymorphic Composition

Enterprise applications frequently deal with heterogeneous collections where items share some behaviors but differ in others. A classic example is a User List containing `Guests` and `Admins`.

### 9.2.1. The Challenge: The Union Hell

Standard approaches force a trade-off between type safety and developer ergonomics.

- **Intersection Types:** `User & Admin`. Leads to unsafe access of Admin methods on Guest objects.
- **Discriminated Unions:** Requires imperative `switch` statements or `if (user.type === 'admin')` guards scattered throughout the UI and logic.

### 9.2.2. The Solution: Facet-Based Polymorphism

Effector Models utilizes **Facets** (Traits) to define capabilities.

1.  **Define Capabilities (Facets):**

    ```typescript
    const BaseUserFacet = facet({ kick: define.event() });
    const AdminFacet = facet({ ban: define.event(), promote: define.event() });
    ```

2.  **Define Models:**

    - `GuestModel` implements `BaseUserFacet`.
    - `AdminModel` implements `BaseUserFacet` AND `AdminFacet`.

3.  **Define the Union:**

    ```typescript
    const ChatUser = union({
      guest: GuestModel,
      admin: AdminModel,
    });
    ```

4.  **Consumption via Pattern Matching:**
    To interact with this polymorphic list, we use the `match` operator (Chapter 7.2).

    ```typescript
    // 'user' is an instance from the ChatUser list
    match({
      source: user.activeVariant,
      cases: {
        // The 'admin' branch receives a scope guaranteed to have AdminFacet
        admin: (adminScope) => {
          sample({
            clock: banButtonClicked,
            target: adminScope.facets.AdminFacet.ban, // Type-safe access
          });
        },
        // The 'guest' branch has no access to 'ban'
        guest: () => console.log('Cannot ban a guest'),
      },
    });
    ```

### 9.2.3. Architectural Impact

This pattern enforces **Liskov Substitution Principle** at the architectural level.

- **Common Logic:** Any logic relying solely on `BaseUserFacet` can operate on the entire `ChatUser` union without knowing the concrete type.
- **Specific Logic:** Logic requiring `AdminFacet` must explicitly branch via `match`, ensuring that capabilities are only accessed when they physically exist in the runtime graph.

This eliminates "Union Hell" by replacing runtime checks with topological routing. The application structure mirrors the business domain perfectly: distinct roles are distinct graphs, not just different flags in a database row.

# 10. Conclusion

The research and development of the `@effector/model` runtime represents a definitive departure from the heuristic era of frontend state management and the inauguration of a rigorous, scientifically grounded discipline: **Business Logic Modelling**.

Throughout this paper, we have demonstrated that the complexity inherent in modern applications is not a failure of tooling, but a failure of ontology. By treating business logic as ephemeral code rather than a structural entity, the industry has hit a "Cybernetic Ceiling"—a point where the cost of coordinating state exceeds the value of the features produced.

## 10.1. The Convergence of Disciplines

Our findings confirm that the solution to this crisis lies not in inventing new JavaScript patterns, but in the synthesis of established principles from distinct scientific domains:

1.  **Computer Architecture:** The adoption of the **Harvard Architecture** separates the _Control Plane_ (Traits/Definitions) from the _Data Plane_ (Instances). This separation is the prerequisite for all subsequent optimizations, enabling Ahead-of-Time analysis and preventing the runtime overhead that plagues dynamic reactive systems.
2.  **Thermodynamics and Linear Logic:** By viewing Traits as finite resources and Models as thermodynamic engines, we established the **Law of Conservation of Requirements**. This provides a metric for architectural quality: a sound architecture is one where the topological sum of requirements and capabilities is strictly positive ($\Delta \ge 0$).
3.  **Automata Theory:** The reification of **Orthogonal Variants** transforms the Model from a static container into a dynamic Finite State Machine. This solves the "Sparse Matrix" problem of state management, ensuring that memory and compute resources are allocated strictly according to the active topological configuration (RAII).

## 10.2. The Architecture of Inevitability

We term this paradigm the **Architecture of Inevitability**.

It is "inevitable" because it is the mathematical attractor towards which all large-scale reactive systems must evolve to survive complexity.

- Just as database engines evolved from flat files to relational algebra to optimize data retrieval, frontend logic must evolve from flat stores to **Directed Graphs of Requirement Transformations** to optimize behavior.
- Just as CPU design evolved towards instruction pipelining and cache locality, reactive runtimes must evolve towards **Graph Linearization** and **Data-Oriented Memory Layouts** to respect the physical limits of hardware.

The `@effector/model` runtime is the first concrete implementation of this theory. It proves that it is possible to combine the developer ergonomics of high-level declarative DSLs with the raw performance of linearized, static execution paths.

## 10.3. Final Remarks

We stand at the frontier of a new era in software engineering. The days of manual subscription management, implicit dependencies, and "Union Hell" are numbered. By embracing the rigor of **Traits**, **Facets**, and **Models**, we empower engineers to stop managing state and start modeling the physics of their business domain.

Effector Models is not merely a tool; it is a proof of concept for the future of application architecture—a future where business logic is statically verifiable, topologically sound, and thermodynamically efficient.

---

**End of Paper.**
