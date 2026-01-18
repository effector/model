import { describe, it, expect } from 'vitest';
import { createStore } from 'effector';
import { create } from '@effector-model/core-experimental';
import { fileModel, folderModel } from '../model';

// Helper to find node by ID in the tree (DFS)
const findNode = (root: any, id: string): any => {
  const rootId = root.input.id.getState();
  if (rootId === id) return root;

  if (root.facets.folder) {
    const children = root.facets.folder.children.getState();
    for (const child of children) {
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
    const children = root.facets.folder.children.getState();
    for (const child of children) {
      const result = getTrace(child, id, currentTrace);
      if (result) return result;
    }
  }
  return null;
};

describe('Tree Models Logic', () => {
  describe('fileModel', () => {
    it('should initialize with provided name and handle renaming', () => {
      const name = createStore('initial.txt');
      const id = createStore('file-1');
      const $selectedId = createStore<string | null>(null);

      const instance = create(fileModel, {
        input: { name, id, $selectedId },
      });

      expect(instance.facets.node.$name.getState()).toBe('initial.txt');

      instance.facets.node.rename('renamed.txt');
      expect(instance.facets.node.$name.getState()).toBe('renamed.txt');
    });

    it('should handle selection', () => {
      const name = createStore('test.txt');
      const id = createStore('file-1');
      const $selectedId = createStore<string | null>(null);

      const instance = create(fileModel, {
        input: { name, id, $selectedId },
      });

      expect(instance.facets.node.$isSelected.getState()).toBe(false);
      expect(instance.facets.visual.$backgroundColor.getState()).toBe(
        'transparent',
      );

      instance.facets.node.select();
      expect($selectedId.getState()).toBe('file-1');
      expect(instance.facets.node.$isSelected.getState()).toBe(true);
      expect(instance.facets.visual.$backgroundColor.getState()).toBe(
        '#e0e7ff',
      );
    });
  });

  describe('folderModel', () => {
    it('should initialize with provided name and handle toggling', () => {
      const name = createStore('src');
      const id = createStore('folder-1');
      const $selectedId = createStore<string | null>(null);
      const children: any[] = [];

      const instance = create(folderModel, {
        input: { name, id, $selectedId, children },
      });

      expect(instance.facets.node.$name.getState()).toBe('src');
      expect(instance.facets.folder.$isOpen.getState()).toBe(true);

      instance.facets.folder.toggle();
      expect(instance.facets.folder.$isOpen.getState()).toBe(false);

      instance.facets.folder.toggle();
      expect(instance.facets.folder.$isOpen.getState()).toBe(true);
    });

    it('should handle recursive children', () => {
      const $selectedId = createStore<string | null>(null);

      const file = create(fileModel, {
        input: {
          name: createStore('child.txt'),
          id: createStore('file-child'),
          $selectedId,
        },
      });

      const folder = create(folderModel, {
        input: {
          name: createStore('parent'),
          id: createStore('folder-parent'),
          $selectedId,
          children: [file],
        },
      });

      const children = folder.facets.folder.children.getState();
      expect(children).toHaveLength(1);
      expect(children[0]).toBe(file);
      expect((children[0] as any).facets.node.$name.getState()).toBe(
        'child.txt',
      );
    });
  });

  describe('Tree Utilities (Business Logic)', () => {
    const $selectedId = createStore<string | null>('root');
    const file1 = create(fileModel, {
      input: {
        name: createStore('app.tsx'),
        id: createStore('node-1'),
        $selectedId,
      },
    });
    const file2 = create(fileModel, {
      input: {
        name: createStore('utils.ts'),
        id: createStore('node-2'),
        $selectedId,
      },
    });
    const srcFolder = create(folderModel, {
      input: {
        name: createStore('src'),
        id: createStore('node-3'),
        $selectedId,
        children: [file1, file2],
      },
    });
    const rootFolder = create(folderModel, {
      input: {
        name: createStore('project'),
        id: createStore('root'),
        $selectedId,
        children: [srcFolder],
      },
    });

    it('findNode should find nodes by ID', () => {
      expect(findNode(rootFolder, 'root')).toBe(rootFolder);
      expect(findNode(rootFolder, 'node-3')).toBe(srcFolder);
      expect(findNode(rootFolder, 'node-1')).toBe(file1);
      expect(findNode(rootFolder, 'non-existent')).toBe(null);
    });

    it('getTrace should calculate path to node', () => {
      const trace = getTrace(rootFolder, 'node-1');
      expect(trace).toHaveLength(3);
      expect(trace![0]).toBe(rootFolder);
      expect(trace![1]).toBe(srcFolder);
      expect(trace![2]).toBe(file1);

      expect(getTrace(rootFolder, 'non-existent')).toBe(null);
    });
  });
});
