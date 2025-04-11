import { createStore, sample, createEffect } from 'effector';
import { keyval } from '@effector/model';
import type { ValidationError } from 'yup';

import { schema } from './schema';
import type { Passenger, PersonError } from '../types';
import { passengersList } from './passengers.model';

export const errorsList = keyval(() => {
  const $index = createStore(-1);
  const $errors = createStore<PersonError>({
    firstname: null,
    lastname: null,
    middlename: null,
    birthday: null,
    gender: null,
    document: {
      documentNumber: null,
      citizenship: null,
      category: null,
      startDate: null,
    },
  });
  return {
    key: 'index',
    state: {
      index: $index,
      errors: $errors,
    },
  };
});

function parseErrors(errors: string[], count: number): PersonError[] {
  const result: PersonError[] = Array.from(
    { length: count },
    (): PersonError => ({
      firstname: null,
      lastname: null,
      middlename: null,
      birthday: null,
      gender: null,
      document: {
        documentNumber: null,
        citizenship: null,
        category: null,
        startDate: null,
      },
    }),
  );

  for (const error of errors) {
    const match = error.match(/^\[(\d+)]\.(.+?) is a required field$/);
    if (!match) continue;

    const index = parseInt(match[1], 10);
    const fieldPath = match[2];

    if (index >= count) continue;

    const shortMessage = `${fieldPath.split('.').pop()} is a required field`;

    if (fieldPath.startsWith('document.')) {
      const docField = fieldPath.split('.')[1] as keyof PersonError['document'];
      if (docField in result[index].document) {
        result[index].document[docField] = shortMessage;
      }
    } else {
      const field = fieldPath as keyof PersonError;
      if (field in result[index]) {
        result[index][field as Exclude<keyof PersonError, 'document'>] =
          shortMessage;
      }
    }
  }

  return result;
}

const validateErrorsFx = createEffect(async (passengers: Passenger[]) => {
  try {
    await schema.validate(passengers, { abortEarly: false });

    return parseErrors([], passengers.length);
  } catch (e) {
    const { errors } = e as ValidationError;
    return parseErrors(errors, passengers.length);
  }
});

sample({
  clock: passengersList.$items,
  target: validateErrorsFx,
});

sample({
  clock: validateErrorsFx.doneData,
  fn: (items) => items.map((errors, index) => ({ index, errors })),
  target: errorsList.edit.replaceAll,
});
