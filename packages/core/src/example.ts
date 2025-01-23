import { createStore, createEvent, createEffect, combine } from 'effector';

import { model } from './model';
import { spawn } from './spawn';
import { define } from './define';
import { keyval } from './keyval';
import { lens } from './lens';

const $email = createStore('');

const triggerValidation = createEvent<number>();
const validateDefaultFx = createEffect((age: number): boolean => true);

const profile = model({
  props: {
    age: 0,
    email: $email,
    triggerValidation,
    validateDefaultFx,
    validateFx: (email: string): boolean => true,
    click: define.event<void>(),
  },
  create({ age, email, triggerValidation, validateDefaultFx, validateFx }) {
    return {
      foo: createStore(0),
    };
  },
});

const aliceProfile = spawn(profile, {
  age: createStore(18),
  email: '',
  validateDefaultFx: (age) => age > 18,
  validateFx: createEffect((email: string) => email.length > 0),
  // triggerValidation: createEvent(),
  click: createEvent(),
});

const bobProfile = spawn(profile, {
  age: 20,
  email: createStore(''),
  validateDefaultFx: createEffect((age: number) => age > 18),
  validateFx: async (email) => email.length > 0,
  click: createEvent(),
});

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

lens(fieldList1, $email).isValid.store;

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
