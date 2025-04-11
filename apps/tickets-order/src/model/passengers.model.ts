import { keyval } from '@effector/model';
import {
  createStore,
  createEvent,
  combine,
  sample,
  EventCallable,
  StoreWritable,
} from 'effector';

import type {
  Passenger,
  PassengerDocument,
  ForeignId,
  MilitaryTicket,
  ServicemanId,
} from '../types';
import { createPassenger, getDefaultDocument } from './calculateUtils';

function subtypeOperation<
  T,
  TypeKey extends keyof T,
  const Cases extends ReadonlyArray<T[TypeKey]>,
  Upd,
>({
  store,
  typeKey,
  on,
  fn,
}: {
  store: StoreWritable<T>;
  typeKey: TypeKey;
  on: Cases;
  fn: (
    upd: Upd,
    value: Extract<T, Record<TypeKey, Cases[keyof Cases]>>,
  ) => Partial<T>;
}) {
  const trigger = createEvent<Upd>();
  sample({
    clock: trigger,
    source: store,
    fn(value, upd) {
      const caseName = value[typeKey];
      if (on.includes(caseName)) {
        const partialResult = fn(upd, value as any);
        return {
          ...value,
          ...partialResult,
        };
      }
      return value;
    },
    target: store,
  });
  return trigger;
}

function createSubtypeOp<T, TypeKey extends keyof T>(
  store: StoreWritable<T>,
  typeKey: TypeKey,
) {
  return function op<const Cases extends ReadonlyArray<T[TypeKey]>, Upd>(
    on: Cases,
    fn: (
      upd: Upd,
      value: Extract<T, Record<TypeKey, Cases[keyof Cases]>>,
    ) => Partial<T>,
  ) {
    return subtypeOperation({
      store,
      typeKey,
      on,
      fn,
    });
  };
}

export const passengersList = keyval(() => {
  const $index = createStore(-1);
  const $firstname = createStore('');
  const $lastname = createStore('');
  const $middlename = createStore<string | null>(null);
  const $hasMiddlename = createStore(false);
  const $gender = createStore<'m' | 'f' | null>(null);
  const $birthday = createStore<Date | null>(null);
  const $isChild = createStore(false);
  const $seat = createStore(-1);
  const $document = createStore<PassengerDocument>(
    null as any as PassengerDocument,
  );

  const changeDocumentType = createEvent<Passenger['document']['type']>();

  sample({
    clock: changeDocumentType,
    fn: (value) => getDefaultDocument(value),
    target: $document,
  });

  const changeDocumentNumber = createEvent<string>();

  sample({
    clock: changeDocumentNumber,
    source: $document,
    fn: (doc, value) => ({ ...doc, documentNumber: value }),
    target: $document,
  });

  const documentOp = createSubtypeOp($document, 'type');

  const editCitizenship = documentOp(
    ['foreign-id'],
    (value: ForeignId['citizenship']) => ({ citizenship: value }),
  );

  const editCategory = documentOp(
    ['military-ticket', 'serviceman-ticket'],
    (value: MilitaryTicket['category'] | ServicemanId['category']) => ({
      category: value,
    }),
  );

  const editStartDate = documentOp(
    ['military-ticket', 'serviceman-ticket'],
    (value: Date | null) => ({
      startDate: value,
    }),
  );

  const editIsNotServed = documentOp(
    ['military-ticket', 'serviceman-ticket'],
    (value: boolean, { startDate }) => ({
      startDate: value ? null : startDate,
      notServed: value,
    }),
  );

  return {
    key: 'index',
    state: {
      index: $index,
      firstname: $firstname,
      lastname: $lastname,
      middlename: $middlename,
      hasMiddlename: $hasMiddlename,
      gender: $gender,
      birthday: $birthday,
      isChild: $isChild,
      seat: $seat,
      document: $document,
    },
    api: {
      changeDocumentType,
      changeDocumentNumber,
      editCitizenship,
      editCategory,
      editStartDate,
      editIsNotServed,
    },
  };
});

export const $passengersCount = combine(
  passengersList.$items,
  (items) => items.length,
);

export const setPassengersAmount = passengersList.edit.add.prepend(
  (amount: number) => {
    return Array.from({ length: amount }, (_, index) => ({
      index,
      ...createPassenger(),
    }));
  },
);

export const removePassenger = passengersList.edit
  .remove as EventCallable<number>;
export const editPassenger = passengersList.edit.update;

export const {
  changeDocumentType,
  changeDocumentNumber,
  editCitizenship,
  editCategory,
  editStartDate,
} = passengersList.api;
