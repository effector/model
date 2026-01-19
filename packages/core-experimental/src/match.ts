import { sample, createEvent, is, Store, Event } from 'effector';
import { createItemProxy, LensProxy, Union } from './keyval';
import { Model } from './model';

export type MatchConfig = {
  source: unknown;
  cases: Record<
    string,
    (scope: LensProxy<unknown>, trigger: Event<unknown>) => void
  >;
};

interface InternalSource {
  _sourceEvent: Event<unknown>;
  _instances: Store<Record<string, unknown>>;
  _activeVariants: Store<Record<string, string | null>>;
  _state: Store<Record<string, unknown>>;
  _modelDef: // eslint-disable-next-line @typescript-eslint/no-explicit-any
    | Model<Record<string, unknown>, Record<string, unknown>, any>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    | Union<any>;
}

function isInternalSource(source: unknown): source is InternalSource {
  return (
    !!source &&
    typeof source === 'object' &&
    '_sourceEvent' in source &&
    '_instances' in source &&
    '_activeVariants' in source &&
    '_state' in source &&
    '_modelDef' in source
  );
}

export function match(config: MatchConfig) {
  const source = config.source;

  // Case 1: Control Flow (Event-based proxy)
  if (isInternalSource(source)) {
    const { _sourceEvent, _instances, _activeVariants, _state, _modelDef } =
      source;

    for (const [variantName, handler] of Object.entries(config.cases)) {
      const variantTrigger = createEvent<unknown>();

      sample({
        clock: _sourceEvent,
        source: {
          instances: _instances,
          activeVariants: _activeVariants,
        },
        filter: (
          {
            instances,
            activeVariants,
          }: {
            instances: Record<string, unknown>;
            activeVariants: Record<string, string | null>;
          },
          payload: unknown,
        ) => {
          let id = payload;
          if (
            typeof payload === 'object' &&
            payload !== null &&
            'id' in payload
          ) {
            id = (payload as { id: unknown }).id;
          }
          const instance = instances[id as string];
          if (!instance) return false;

          const activeVariant = activeVariants[id as string];
          const currentVariant =
            activeVariant !== undefined
              ? activeVariant
              : (instance as { _variant: string })._variant;

          return currentVariant === variantName;
        },
        fn: (
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          { instances }: { instances: Record<string, unknown> },
          payload: unknown,
        ) => {
          let id = payload;
          if (
            typeof payload === 'object' &&
            payload !== null &&
            'id' in payload
          ) {
            id = (payload as { id: unknown }).id;
          }
          return id;
        },
        target: variantTrigger,
      });

      const proxy = createItemProxy(
        _instances,
        _state,
        variantTrigger,
        _modelDef,
        _activeVariants,
      );
      handler(proxy as LensProxy<unknown>, variantTrigger);
    }
  }
  // Case 2: Reactive Matching (Store or Lens)
  else if (
    is.store(source) ||
    (source &&
      typeof source === 'object' &&
      '__type' in source &&
      (source as { __type: unknown }).__type === 'lens')
  ) {
    // Handled via lenses mostly
  }
}
