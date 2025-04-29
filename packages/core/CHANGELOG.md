# @effector/model

## 0.0.7

### Patch Changes

- ffe46f8: - Add `InputType` and `KeyvalWithState` type helpers
  - Add `isKeyval` method
  - Add recursive keyval support
  - Implement lazy initialization for keyval body
  - Add support for filling nested keyvals on `.edit.add`
  - Fix `onMount` types

## 0.0.6

### Patch Changes

- 1150b9c: Implement type safe lenses

## 0.0.5

### Patch Changes

- ce455af:
  - Add `keyval.editField` api for easier store updates
  - Fix sync bug in keyval

## 0.0.4

### Patch Changes

- d91bdab: Improve api based on food-order app feedback

## 0.0.3

### Patch Changes

- 37ff401: Implement callback api for keyval: `keyval(() => ({state, api, key}))`

## 0.0.2

### Patch Changes

- 4caf432: Improve `kv.edit` types
- 87de17c: First public release
