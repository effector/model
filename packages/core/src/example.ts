import { createStore, createEvent, combine } from 'effector';

import { keyval } from './keyval';
import { lens } from './lens';

const $email = createStore('');

const fieldList1 = keyval(() => {
  const $name = createStore('');
  const $value = createStore('');
  const submit = createEvent();
  const $isValid = combine($value, (value) => value.length > 0);
  return {
    key: 'name',
    state: {
      name: $name,
      value: $value,
      isValid: $isValid,
    },
    api: {
      submit,
    },
  };
});

lens(fieldList1, $email).isValid.store();
