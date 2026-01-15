import { sample, createEvent } from 'effector';
import { createItemProxy } from './keyval';

export type MatchConfig = {
  source: any;
  cases: Record<string, (scope: any) => void>;
};

export function match(config: MatchConfig) {
  const source = config.source;

  if (source && source._sourceEvent && source._instances) {
    const { _sourceEvent, _instances } = source;

    for (const [variantName, handler] of Object.entries(config.cases)) {
      // Trigger when source event fires AND variant matches
      const variantTrigger = createEvent<string>(); // Carries ID

      sample({
        clock: _sourceEvent as any,
        source: _instances,
        filter: (instances: any, id: string) => {
          const instance = instances[id];
          // Check active variant
          // instance.activeVariant is a Store.
          return instance?.activeVariant?.getState() === variantName;
        },
        fn: (instances: any, id: string) => id,
        target: variantTrigger,
      });

      // Call handler with a proxy that uses variantTrigger as ID source
      const proxy = createItemProxy(_instances, variantTrigger);
      handler(proxy);
    }
  }
}
