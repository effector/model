# Implementation Plan: Recursive File System Demo

## 1. Data Model (`apps/models-research/src/tree/model.ts`)

### 1.1. Facets (`facets.ts`)

- **`nodeFacet`**:
  - `$name`: `Store<string>`
  - `$isSelected`: `Store<boolean>`
  - `select`: `Event<void>`
  - `rename`: `Event<string>`
- **`folderFacet`**:
  - `$isOpen`: `Store<boolean>`
  - `toggle`: `Event<void>`
  - `children`: `Array<FileModel | FolderModel>` (Recursive)
- **`visualFacet`**:
  - `$backgroundColor`: `Store<string>`
  - `_selectionSource`: `ref.tag('$isSelected')`

### 1.2. Models

- **Selection Logic**: Use `combine($selectedId, id, ...)` to ensure reactive selection state that works on initial load.
- **Rename Logic**: `rename` event samples the new value directly into the `name` input store.
- **Recursion**: `folderModel` children defined via `define.array(ref.self)`.

## 2. Global State (`apps/models-research/src/app/TreeDemo.tsx`)

- **`$selectedId`**: Initialized to `'root-node'` to ensure a default selection.
- **ID Generation**: Unique IDs (`node-1`, `node-2`, etc.) generated during manual instantiation to facilitate single-selection logic.

## 3. View Layer (`apps/models-research/src/tree/view.tsx`)

- **Separation of Concerns**:
  - `RecursiveTreeView`: Dispatches between File and Folder.
  - `FileView` / `FolderView`: Handle double-click for editing and selection logic.
- **Interaction**:
  - `toggle()` moved to the arrow icon (`<span>`) to allow selection of folders without collapsing them.
  - Local React state (`isEditing`, `editName`) used for the renaming workflow to ensure stability of the global name store until commit.

## 4. Details & Breadcrumbs (`apps/models-research/src/app/TreeDemo.tsx`)

- **Breadcrumbs**:
  - `getTrace(root, id)`: DFS traversal returning an array of model instances from root to target.
  - `BreadcrumbItem`: A component per trace node that uses `useUnit(node.facets.node.$name)` to achieve full path reactivity on rename.
- **Details**:
  - `NodeDetails`: Encapsulates hooks for the selected node, preventing React hook order violations when selection changes or is missing.

## 5. Core API Enhancements

- Updated `packages/core-experimental/src/instance.ts` to support `array` type facets, allowing recursive children lists to be used directly with `useUnit`.
- Ensured `ref.tag` resolution handles nested logic objects within model `fn` results.
