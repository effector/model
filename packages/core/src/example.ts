import { createStore, createEvent, createEffect, combine } from 'effector';

import { model } from './model';
import { spawn } from './spawn';
import { define } from './define';
import { keyval } from './keyval';
import { lens } from './lens';

const $email = createStore('');

const triggerValidation = createEvent<number>();
const validateDefaultFx = createEffect((age: number): boolean => true);

type Field = {
  name: string;
  value: string;
};

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

fieldList1.api.submit;

lens(fieldList1, $email).isValid.store();

const fieldList2 = keyval(() => {
  const $name = createStore('');
  const $value = createStore('');
  const $isValid = combine($value, (value) => value.length > 0);
  return {
    key: 'name',
    state: {
      name: $name,
      value: $value,
      isValid: $isValid,
    },
  };
});
