import { sample, createEvent, is, createEffect, Store } from 'effector';
import { createItemProxy } from './keyval';

export type MatchConfig = {
  source: any;
  cases: Record<string, (scope: any, trigger: any) => void>;
};

export function match(config: MatchConfig) {
  const source = config.source;

  // Case 1: Control Flow (Event-based proxy)
  if (
    source &&
    source._sourceEvent &&
    source._instances &&
    source._activeVariants &&
    source._state
  ) {
    const { _sourceEvent, _instances, _activeVariants, _state } = source;

    for (const [variantName, handler] of Object.entries(config.cases)) {
      const variantTrigger = createEvent<any>();

      sample({
        clock: _sourceEvent as any,
        source: {
          instances: _instances,
          activeVariants: _activeVariants as Store<any>,
        },
        filter: ({ instances, activeVariants }: any, payload: any) => {
          let id = payload;
          if (
            typeof payload === 'object' &&
            payload !== null &&
            'id' in payload
          ) {
            id = payload.id;
          }
          const instance = instances[id];
          if (!instance) return false;

          const activeVariant = activeVariants[id];

          return (
            activeVariant === variantName || instance._variant === variantName
          );
        },
        fn: ({ instances }: any, payload: any) => {
          let id = payload;
          if (
            typeof payload === 'object' &&
            payload !== null &&
            'id' in payload
          ) {
            id = payload.id;
          }
          return id;
        },
        target: variantTrigger,
      } as any);

      const proxy = createItemProxy(
        _instances,
        _state,
        variantTrigger,
        _activeVariants,
      );
      handler(proxy, variantTrigger);
    }
  }
  // Case 2: Reactive Matching (Store or Lens)
  else if (is.store(source) || (source && source.__type === 'lens')) {
    // Handled via lenses mostly
  }
}
