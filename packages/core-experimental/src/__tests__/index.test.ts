import { describe, it, expect } from 'vitest';
import * as core from '../index';

describe('core-experimental exports', () => {
  it('should export all public primitives', () => {
    expect(core.model).toBeDefined();
    expect(core.define).toBeDefined();
    expect(core.keyval).toBeDefined();
    expect(core.union).toBeDefined();
    expect(core.facet).toBeDefined();
    expect(core.select).toBeDefined();
    expect(core.match).toBeDefined();
    expect(core.create).toBeDefined();
    expect(core.isLens).toBeDefined();
  });
});
