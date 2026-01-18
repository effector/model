import { describe, it, expect } from 'vitest';
import { render } from 'vitest-browser-react';
import React from 'react';
import { useLens } from '../hooks';
import { select } from '@effector-model/core-experimental';

describe.skip('Predictable System Stress Test', () => {
  it('should throw an error when console.error is called (Runtime Guardrail)', () => {
    expect(() => {
      console.error('Test error');
    }).toThrowError(/Console error\/warn detected: Test error/);
  });

  it('should throw an error when console.warn is called', () => {
    expect(() => {
      console.warn('Test warn');
    }).toThrowError(/Console error\/warn detected: Test warn/);
  });

  it('select() should throw when passed a non-Lens object', () => {
    expect(() => {
      select({} as any);
    }).toThrowError(/select\(\) source must be a Lens/);
  });

  it('useLens should log error (and thus throw) when passed a plain object', async () => {
    function BadComponent() {
      // @ts-ignore
      useLens({ invalid: true }, 0);
      return <div>Bad</div>;
    }

    // render is async in vitest-browser-react
    await expect(async () => {
      await render(<BadComponent />);
    }).rejects.toThrowError(
      /Console error\/warn detected: \[useLens\] Received an object/,
    );
  });
});
