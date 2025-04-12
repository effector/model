import { keyval } from '@effector/model';
import {
  createStore,
  createEvent,
  combine,
  sample,
  EventCallable,
} from 'effector';

import type {
  Passenger,
  PassengerDocument,
  ForeignId,
  MilitaryTicket,
  ServicemanId,
} from '../types';
import { createPassenger, getDefaultDocument } from './calculateUtils';
import { createSubtypeOperation } from './createSubtypeOperation';

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

  const createDocumentEditor = createSubtypeOperation($document, 'type');

  const editCitizenship = createDocumentEditor(
    ['foreign-id'],
    (value: ForeignId['citizenship']) => ({ citizenship: value }),
  );

  const editCategory = createDocumentEditor(
    ['military-ticket', 'serviceman-ticket'],
    (value: MilitaryTicket['category'] | ServicemanId['category']) => ({
      category: value,
    }),
  );

  const editStartDate = createDocumentEditor(
    ['military-ticket', 'serviceman-ticket'],
    (value: Date | null) => ({
      startDate: value,
    }),
  );

  const editIsNotServed = createDocumentEditor(
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
