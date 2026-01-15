import { sample, createEvent, Event, Store, createEffect } from 'effector';
import { createItemProxy } from './keyval';

export type MatchConfig = {
  source: any;
  cases: Record<string, (scope: any, trigger: Event<string>) => void>;
};

export function match(config: MatchConfig) {
  const source = config.source;

  if (source && source._sourceEvent && source._instances) {
    const { _sourceEvent, _instances } = source;

    for (const [variantName, handler] of Object.entries(config.cases)) {
      // Trigger when source event fires AND variant matches
      const variantTrigger = createEvent<string>(); // Carries ID

      sample({
        clock: _sourceEvent as Event<string>,
        source: _instances as Store<Record<string, any>>,
        filter: (instances: any, id: any) => {
          const instance = instances[id];
          return (
            !!instance && instance.activeVariant.getState() === variantName
          );
        },
        fn: (instances: any, id: any) => id,
        target: variantTrigger,
      });

      // Call handler with a proxy that uses variantTrigger as ID source
      const proxy = createItemProxy(_instances, variantTrigger);
      handler(proxy, variantTrigger);
    }
  }
}
