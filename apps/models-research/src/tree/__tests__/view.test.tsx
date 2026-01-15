import { describe, it, expect } from 'vitest';
import { render } from 'vitest-browser-react';
import { page, userEvent } from 'vitest/browser';
import { createStore } from 'effector';
import { create } from '@effector-model/core-experimental';
import { fileModel, folderModel } from '../model';
import { RecursiveTreeView } from '../view';
import { TreeDemo } from '../../app/TreeDemo';

describe('Tree View Components (Browser Mode)', () => {
  const createBaseInput = (
    nameVal: string,
    idVal: string,
    $selectedId: any,
  ) => ({
    name: createStore(nameVal),
    id: createStore(idVal),
    $selectedId,
  });

  it('FileView: should render name and handle selection', async () => {
    const $selectedId = createStore<string | null>(null);
    const file = create(fileModel, {
      input: createBaseInput('test.txt', 'file-1', $selectedId),
    });

    await render(<RecursiveTreeView instance={file} />);

    const node = page.getByText('test.txt');
    await expect.element(node).toBeInTheDocument();

    await node.click();
    expect($selectedId.getState()).toBe('file-1');
  });

  it('FileView: should handle renaming workflow (Enter)', async () => {
    const $selectedId = createStore<string | null>(null);
    const file = create(fileModel, {
      input: createBaseInput('old.txt', 'file-1', $selectedId),
    });

    await render(<RecursiveTreeView instance={file} />);

    const node = page.getByText('old.txt');
    await node.dblClick();

    const input = page.getByRole('textbox');
    await expect.element(input).toHaveValue('old.txt');

    await input.fill('new.txt');
    await userEvent.keyboard('{Enter}');

    await expect.element(page.getByText('new.txt')).toBeInTheDocument();
    expect(file.facets.node.$name.getState()).toBe('new.txt');
  });

  it('FileView: should handle renaming cancellation (Escape)', async () => {
    const $selectedId = createStore<string | null>(null);
    const file = create(fileModel, {
      input: createBaseInput('keep.txt', 'file-1', $selectedId),
    });

    await render(<RecursiveTreeView instance={file} />);

    await page.getByText('keep.txt').dblClick();
    const input = page.getByRole('textbox');
    await input.fill('change.txt');
    await userEvent.keyboard('{Escape}');

    await expect.element(page.getByText('keep.txt')).toBeInTheDocument();
    expect(file.facets.node.$name.getState()).toBe('keep.txt');
  });

  it('FileView: should save on blur and stop propagation', async () => {
    const $selectedId = createStore<string | null>(null);
    const file = create(fileModel, {
      input: createBaseInput('blur.txt', 'file-1', $selectedId),
    });

    await render(<RecursiveTreeView instance={file} />);

    await page.getByText('blur.txt').dblClick();
    const input = page.getByRole('textbox');
    await input.fill('saved.txt');

    // Click input itself - should NOT trigger selection or anything else because of stopPropagation
    await input.click();
    expect($selectedId.getState()).toBe('file-1'); // Still 'file-1' from dblClick, hasn't changed

    // To trigger blur, we can click somewhere else
    await page.getByRole('document').click();

    await expect.element(page.getByText('saved.txt')).toBeInTheDocument();
  });

  it('FolderView: should toggle expansion on arrow click', async () => {
    const $selectedId = createStore<string | null>(null);
    const childFile = create(fileModel, {
      input: createBaseInput('child.txt', 'file-c', $selectedId),
    });
    const folder = create(folderModel, {
      input: {
        ...createBaseInput('folder', 'folder-1', $selectedId),
        children: [childFile],
      },
    });

    await render(<RecursiveTreeView instance={folder} />);

    await expect.element(page.getByText('child.txt')).toBeInTheDocument();

    const arrow = page.getByText('▶');
    await arrow.click();

    await expect.element(page.getByText('child.txt')).not.toBeInTheDocument();
    expect(folder.facets.folder.$isOpen.getState()).toBe(false);
  });

  it('FolderView: should select on name click without toggling', async () => {
    const $selectedId = createStore<string | null>(null);
    const folder = create(folderModel, {
      input: {
        ...createBaseInput('folder', 'folder-1', $selectedId),
        children: [],
      },
    });

    await render(<RecursiveTreeView instance={folder} />);

    const nameNode = page.getByText('folder');
    await nameNode.click();

    expect($selectedId.getState()).toBe('folder-1');
    expect(folder.facets.folder.$isOpen.getState()).toBe(true); // Remained open
  });

  it('FolderView: should handle renaming workflow (Enter/Escape/Blur)', async () => {
    const $selectedId = createStore<string | null>(null);
    const folder = create(folderModel, {
      input: {
        ...createBaseInput('old-folder', 'folder-1', $selectedId),
        children: [],
      },
    });

    await render(<RecursiveTreeView instance={folder} />);

    const node = page.getByText('old-folder');
    await node.dblClick();

    let input = page.getByRole('textbox');
    await expect.element(input).toHaveValue('old-folder');

    // Test stopPropagation on input click
    await input.click();
    expect($selectedId.getState()).toBe('folder-1');

    // Test Escape
    await input.fill('cancel-folder');
    await userEvent.keyboard('{Escape}');
    await expect.element(page.getByText('old-folder')).toBeInTheDocument();

    // Test Enter
    await node.dblClick();
    input = page.getByRole('textbox');
    await input.fill('new-folder');
    await userEvent.keyboard('{Enter}');
    await expect.element(page.getByText('new-folder')).toBeInTheDocument();

    // Test Blur
    await page.getByText('new-folder').dblClick();
    input = page.getByRole('textbox');
    await input.fill('blur-folder');
    await page.getByRole('document').click();
    await expect.element(page.getByText('blur-folder')).toBeInTheDocument();
  });

  it('TreeDemo: should render full tree and update breadcrumbs/details', async () => {
    await render(<TreeDemo />);

    // Initial state
    await expect
      .element(page.getByText('project-root').first())
      .toBeInTheDocument();
    await expect
      .element(page.getByText(/Selected:.*project-root.*Folder/))
      .toBeInTheDocument();

    // Select a file
    const appNodes = page.getByText('app.tsx');
    const appNode = appNodes.first();
    await appNode.click();

    await expect
      .element(page.getByText(/Selected:.*app.tsx.*File/))
      .toBeInTheDocument();
  });
});
