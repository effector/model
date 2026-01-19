import { create } from '@effector-model/core-experimental';
import { createStore, createEvent, sample } from 'effector';
import { useUnit } from 'effector-react';
import { fileModel, folderModel } from '../tree/model';
import { RecursiveTreeView } from '../tree/view';

// Global state for selection
const $selectedId = createStore<string | null>('root-node');
const selectInstance = createEvent<string>();

// Actually, in the model we pass $selectedId as input.
// We need to generate unique IDs for each node.

let idCounter = 0;
const nextId = () => `node-${++idCounter}`;

const createInput = (name: string) => ({
  name: createStore(name),
  id: createStore(nextId()),
  $selectedId,
});

const createRecursiveInput = (name: string, children: any[]) => ({
  name: createStore(name),
  id: createStore(nextId()),
  $selectedId,
  children,
});

/**
 * Tree Demo Component
 */
export function TreeDemo() {
  // 1. Create leaf files
  const file1 = create(fileModel, { input: createInput('app.tsx') });
  const file2 = create(fileModel, { input: createInput('utils.ts') });
  const file3 = create(fileModel, { input: createInput('package.json') });
  const file4 = create(fileModel, { input: createInput('README.md') });

  // 2. Create sub-folder
  const srcFolder = create(folderModel, {
    input: createRecursiveInput('src', [file1, file2]),
  });

  // 3. Create root folder
  const rootFolder = create(folderModel, {
    input: {
      name: createStore('project-root'),
      id: createStore('root-node'),
      $selectedId,
      children: [srcFolder, file3, file4],
    },
  });

  return (
    <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100 max-w-2xl">
      <h2 className="text-xl font-semibold mb-6 text-gray-800">
        Recursive Tree Demo
      </h2>

      <div className="mb-8 bg-gray-50 rounded-lg border border-gray-200 overflow-hidden">
        <div className="p-2 bg-gray-100 border-b border-gray-200 text-xs text-gray-500 font-mono">
          <Breadcrumbs selectedId={$selectedId} root={rootFolder} />
        </div>
        <div className="p-4">
          <RecursiveTreeView instance={rootFolder} />
        </div>
        <div className="p-2 bg-gray-100 border-t border-gray-200 text-xs text-gray-600">
          <DetailsView selectedId={$selectedId} root={rootFolder} />
        </div>
      </div>

      <div className="text-sm text-gray-500 space-y-2">
        <p>
          <strong>Features demonstrated:</strong>
        </p>
        <ul className="list-disc ml-5 space-y-1">
          <li>
            <strong>Recursion (`ref.self`):</strong> Folders contain an array of
            other node instances.
          </li>
          <li>
            <strong>State Isolation:</strong> Each folder has its own `$isOpen`
            store.
          </li>
          <li>
            <strong>Internal Dependencies (`ref.tag`):</strong> Visual
            background changes based on selection.
          </li>
          <li>
            <strong>Advanced Interaction:</strong> Double-click to rename.
            Single selection logic.
          </li>
        </ul>
      </div>
    </div>
  );
}

// Helper to find node by ID in the tree (DFS)
const findNode = (root: any, id: string): any => {
  const rootId = root.input.id.getState();
  if (rootId === id) return root;

  if (root.facets.folder) {
    const children = root.input.children; // Assuming static array for this demo
    // In real app, children might be a store, so .getState()
    const childrenArray = Array.isArray(children)
      ? children
      : children.getState
        ? children.getState()
        : [];

    for (const child of childrenArray) {
      const found = findNode(child, id);
      if (found) return found;
    }
  }
  return null;
};

// Helper to calculate trace (array of instances from root to target)
const getTrace = (root: any, id: string, acc: any[] = []): any[] | null => {
  const rootId = root.input.id.getState();
  const currentTrace = [...acc, root];

  if (rootId === id) return currentTrace;

  if (root.facets.folder) {
    const children = root.input.children;
    const childrenArray = Array.isArray(children)
      ? children
      : children.getState
        ? children.getState()
        : [];

    for (const child of childrenArray) {
      const result = getTrace(child, id, currentTrace);
      if (result) return result;
    }
  }
  return null;
};

function Breadcrumbs({ selectedId, root }: { selectedId: any; root: any }) {
  const id = useUnit(selectedId);
  if (!id) return <span>/</span>;

  const trace = getTrace(root, id as unknown as string);
  if (!trace) return <span>/</span>;

  return (
    <div className="flex items-center gap-1">
      {trace.map((node, i) => (
        <span key={i} className="flex items-center gap-1">
          {i > 0 && <span> {'>'} </span>}
          <BreadcrumbItem node={node} />
        </span>
      ))}
    </div>
  );
}

function BreadcrumbItem({ node }: { node: any }) {
  const name = useUnit(node.facets.node.$name);
  return <span>{name as any}</span>;
}

function DetailsView({ selectedId, root }: { selectedId: any; root: any }) {
  const id = useUnit(selectedId);
  if (!id) return <span>No selection</span>;

  const node = findNode(root, id as unknown as string);
  if (!node) return <span>Unknown</span>;

  return <NodeDetails node={node} />;
}

function NodeDetails({ node }: { node: any }) {
  const name = useUnit(node.facets.node.$name);
  const type = node.facets.folder ? 'Folder' : 'File';

  return (
    <span>
      Selected: <strong>{name as any}</strong> ({type})
    </span>
  );
}
