import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { render } from 'vitest-browser-react';
import { invoke } from '@withease/factories';
import { AppView } from '../AppView';
import { createApp } from '../../models/app';
import { AppProvider } from '../AppContext';
import { fork } from 'effector';
import { Provider } from 'effector-react';

// Mock crypto
const globalObject =
  typeof globalThis !== 'undefined'
    ? globalThis
    : typeof global !== 'undefined'
      ? global
      : window;
if (!globalObject.crypto) {
  Object.defineProperty(globalObject, 'crypto', {
    value: { randomUUID: () => 'test-uuid' },
  });
}

describe('AppView Integration', () => {
  let app: ReturnType<typeof createApp>;
  let scope: any;

  beforeEach(() => {
    scope = fork();
    app = invoke(createApp);
  });

  it('should render restaurants screen initially', async () => {
    await render(
      <Provider value={scope}>
        <AppProvider app={app}>
          <AppView />
        </AppProvider>
      </Provider>,
    );

    expect(document.body.textContent).toContain('Рестораны');
  });

  it('should navigate to menu when restaurant is clicked', async () => {
    await render(
      <Provider value={scope}>
        <AppProvider app={app}>
          <AppView />
        </AppProvider>
      </Provider>,
    );

    const dodoCard = Array.from(document.querySelectorAll('h2')).find((el) =>
      el.textContent?.includes('Dodo Pizza'),
    );
    if (!dodoCard) throw new Error('Dodo Pizza card not found');

    // Click the parent div which has the onClick
    dodoCard
      .closest('div[onClick]')
      ?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    // Or just click the h2 and let it bubble
    dodoCard.click();

    await new Promise((r) => setTimeout(r, 100));

    expect(document.body.textContent).toContain('Меню');
  });
});
