# Requirements Document: Recursive File System Demo

## 1. Overview

This demo aims to validate and showcase advanced features of the Effector Models API: **Recursion** (`ref.self`) and **Internal Reference Resolution** (`ref.tag`). We built a functional **File Explorer** UI to demonstrate these concepts in a real-world scenario.

## 2. Core Concepts Demonstrated

### 2.1. Recursion (`ref.self`)

- **Requirement**: Support infinite nesting of content.
- **Implementation**: `FolderModel` defines its children as an array of model definitions using `ref.self`.
- **Verification**: The UI renders a nested structure correctly, with each node maintaining its own state (e.g., expansion state).

### 2.2. Internal References (`ref.tag`)

- **Requirement**: Declarative data sharing between decoupled facets within a single model instance.
- **Implementation**: `visualFacet` declares a dependency on `$isSelected` via `ref.tag('$isSelected')`.
- **Verification**: Background colors update reactively based on selection state without manual wiring in the factory function.

## 3. Functional Requirements

### 3.1. File Entities

- **File**: Represents a leaf node with a `name`.
- **Folder**: Represents a container node with a `name` and `children`.

### 3.2. User Interaction

- **Selection**:
  - One node is **always** selected (defaults to the root node).
  - Clicking any node moves the selection to that node.
  - Selection cannot be "untoggled" by clicking the same node; it only moves to a different one.
  - The selected node is highlighted with a light blue background.
- **Expansion**:
  - Folders can be expanded or collapsed.
  - **Crucial**: Toggling expansion only occurs when clicking the arrow emoji (▶/▼). Clicking the folder name only selects it.
- **Breadcrumbs**:
  - A reactive path (e.g., `project-root > src > app.tsx`) is displayed above the tree.
  - The path updates immediately if any node in the selection trace is renamed.
- **Details View**:
  - Displays the name and type (File/Folder) of the selected node below the tree.
- **Renaming**:
  - Double-clicking a node name enters "Edit Mode".
  - Double-clicking also selects the node.
  - Submitting (Enter) or clicking outside (Blur) saves the new name.
  - The name in the details view remains stable (shows the old name) until the edit is committed.

## 4. Technical Implementation

- Used `combine` for reactive selection state to ensure initial visibility of the default selection.
- Implemented recursive trace calculation (`getTrace`) to provide reactive breadcrumbs via a chain of `useUnit` calls.
- Handled React hook lifecycle by encapsulating node-specific hooks in a separate `NodeDetails` component to prevent "Rendered more hooks" errors.
