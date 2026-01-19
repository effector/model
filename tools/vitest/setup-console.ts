import { beforeAll, vi } from 'vitest';

beforeAll(() => {
  const failTest = (msg: string | Error, ...args: unknown[]) => {
    // Filter out internal React/Vitest noise if needed
    // For now, we want to be strict.
    const message = typeof msg === 'string' ? msg : msg.message;

    // Example ignore:
    // if (message.includes('React Router Future Flag')) return;

    const error = new Error(
      `Console error/warn detected: ${message} ${args.map((a) => JSON.stringify(a)).join(' ')}`,
    );
    throw error;
  };

  vi.spyOn(console, 'error').mockImplementation(failTest);
  vi.spyOn(console, 'warn').mockImplementation(failTest);
});
