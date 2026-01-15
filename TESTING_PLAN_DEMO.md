# Comprehensive Testing Plan for Recursive File System Demo

This plan outlines the strategy to achieve 100% test coverage for the features described in [`DEMO_RD.md`](DEMO_RD.md) and implemented as per [`DEMO_IMPL.md`](DEMO_IMPL.md).

## 1. Overview of Testable Components

The testing will be split into two main layers:

1.  **Logic Layer (Unit Tests)**: Verifying Effector models, facets, and their interactions.
2.  **View Layer (Integration Tests)**: Verifying React components, user interactions, and reactive UI updates.

## 2. Logic Layer: `apps/models-research/src/tree/__tests__/model.test.ts`

Goal: 100% coverage of [`model.ts`](apps/models-research/src/tree/model.ts) and [`facets.ts`](apps/models-research/src/tree/facets.ts).

| Feature           | Test Case                                                              | Target                     |
| :---------------- | :--------------------------------------------------------------------- | :------------------------- |
| **Selection**     | Verify `$isSelected` becomes true when `select` is called.             | `fileModel`, `folderModel` |
| **Selection**     | Verify `$selectedId` updates correctly in the shared scope.            | Global state / Input       |
| **Renaming**      | Verify `$name` updates when `rename` event is triggered.               | `nodeFacet`                |
| **Recursion**     | Verify `folderModel` correctly holds and renders `children` instances. | `folderFacet`              |
| **Internal Refs** | Verify `visualFacet.$backgroundColor` reacts to `$isSelected`.         | `visualFacet`              |
| **Initial State** | Verify default selection (root node) and initial expansion state.      | Models                     |

## 3. View Layer: `apps/models-research/src/tree/__tests__/view.test.tsx`

Goal: 100% coverage of [`view.tsx`](apps/models-research/src/tree/view.tsx) and integration logic in [`TreeDemo.tsx`](apps/models-research/src/app/TreeDemo.tsx).

| Interaction             | Expected Behavior                                            | Component                |
| :---------------------- | :----------------------------------------------------------- | :----------------------- |
| **Single Click**        | Selects the node (highlights background).                    | `FileView`, `FolderView` |
| **Arrow Click**         | Toggles folder expansion WITHOUT changing selection.         | `FolderView`             |
| **Folder Name Click**   | Selects folder WITHOUT toggling expansion.                   | `FolderView`             |
| **Double Click**        | Enters edit mode, sets local state, and selects node.        | `FileView`, `FolderView` |
| **Rename (Enter/Blur)** | Commits name change to model, exits edit mode.               | `FileView`, `FolderView` |
| **Rename (Escape)**     | Cancels name change, restores old name, exits edit mode.     | `FileView`, `FolderView` |
| **Breadcrumbs**         | Updates path reactively when a node in the trace is renamed. | `Breadcrumbs`            |
| **Details View**        | Displays correct name and type for the selected node.        | `DetailsView`            |

## 4. Coverage Verification

We will use Vitest's built-in coverage tool to verify 100% coverage.
Command: `pnpm vitest run --coverage --project models-research`
