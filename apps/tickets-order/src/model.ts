import { createStore, createEvent, sample, createEffect } from 'effector';
import { spread } from 'patronum';

import {
  array,
  object,
  string,
  date,
  boolean,
  number,
  ValidationError,
} from 'yup';

interface NationalId {
  type: 'national-id';
  documentNumber: string;
}

interface BirthId {
  type: 'birth-id';
  documentNumber: string;
}

interface ForeignId {
  type: 'foreign-id';
  citizenship: 'ua' | 'bel' | 'kz' | 'uzb' | null;
  documentNumber: string;
}

interface InternationalId {
  type: 'international-id';
  documentNumber: string;
}

interface MilitaryTicket {
  type: 'military-ticket';
  documentNumber: string;
  category: 'mobilized' | 'cadet' | 'contractor' | 'conscript' | null;
  startDate: Date | null;
  hasStartDate: boolean;
}

interface SeamanId {
  type: 'seaman-id';
  documentNumber: string;
}

interface ServicemanId {
  type: 'serviceman-ticket';
  documentNumber: string;
  category: 'mobilized' | 'cadet' | 'contractor' | 'conscript' | null;
  startDate: Date | null;
  hasStartDate: boolean;
}

export const citizenships = [
  { value: 'ua', label: 'Украина' },
  { value: 'bel', label: 'Беларусь' },
  { value: 'kz', label: 'Казахстан' },
  { value: 'uzb', label: 'Узбекистан' },
];

export const categories = [
  { value: 'mobilized', label: 'Мобилизованный' },
  { value: 'cadet', label: 'Курсант' },
  { value: 'contractor', label: 'Контрактник' },
  { value: 'conscript', label: 'Призывник' },
];

export const documents = [
  { label: 'Паспорт РФ', value: 'national-id' },
  { label: 'Св-во о рождении', value: 'birth-id' },
  { label: 'Иностранный документ', value: 'foreign-id' },
  { label: 'Загранпаспорт РФ', value: 'international-id' },
  { label: 'Военный билет', value: 'military-ticket' },
  { label: 'Паспорт моряка', value: 'seaman-id' },
  { label: 'Удостоверение военнослужащего', value: 'serviceman-ticket' },
];

function getDefaultDocument(
  documentId: Passenger['document']['type'],
): Passenger['document'] {
  switch (documentId) {
    case 'national-id': {
      return {
        type: 'national-id',
        documentNumber: '',
      };
    }
    case 'birth-id': {
      return {
        type: 'birth-id',
        documentNumber: '',
      };
    }
    case 'foreign-id': {
      return {
        type: 'foreign-id',
        documentNumber: '',
        citizenship: null,
      };
    }
    case 'international-id': {
      return {
        type: 'international-id',
        documentNumber: '',
      };
    }
    case 'military-ticket': {
      return {
        type: 'military-ticket',
        documentNumber: '',
        hasStartDate: true,
        startDate: null,
        category: null,
      };
    }
    case 'seaman-id': {
      return {
        type: 'seaman-id',
        documentNumber: '',
      };
    }
    case 'serviceman-ticket': {
      return {
        type: 'serviceman-ticket',
        documentNumber: '',
        hasStartDate: true,
        startDate: null,
        category: null,
      };
    }
  }
}

export interface Passenger {
  firstname: string;
  lastname: string;
  middlename: string | null;
  hasMiddlename: boolean;
  gender: 'm' | 'f' | null;
  birthday: Date | null;
  isChild: boolean;
  seat: number;

  document:
    | NationalId
    | BirthId
    | ForeignId
    | InternationalId
    | MilitaryTicket
    | SeamanId
    | ServicemanId;
}

function createPassenger(): Passenger {
  return {
    firstname: '',
    lastname: '',
    middlename: null,
    hasMiddlename: true,
    gender: null,
    birthday: null,
    isChild: false,
    seat: 50,

    document: getDefaultDocument('national-id'),
  };
}

export const $passengers = createStore<Passenger[]>([createPassenger()]);

const schema = array()
  .of(
    object({
      firstname: string().required(),
      lastname: string().required(),
      middlename: string().when('hasMiddlename', {
        is: (v: boolean) => v === true,
        then: () => string().required(),
        otherwise: () => string().notRequired(),
      }),
      hasMiddlename: boolean().required(),
      gender: string().oneOf(['m', 'f']).required(),
      birthday: date().required(),
      isChild: boolean().required(),
      seat: number().required(),

      document: object({
        type: string()
          .oneOf([
            'national-id',
            'birth-id',
            'seaman-id',
            'international-id',
            'foreign-id',
            'military-ticket',
            'serviceman-ticket',
          ])
          .required(),
        documentNumber: string().required(),
        citizenship: string().when('type', {
          is: 'foreign-id',
          then: () => string().oneOf(['ua', 'bel', 'kz', 'uzb']).required(),
        }),

        hasStartDate: boolean().when('type', {
          is: (value: string) =>
            value === 'military-ticker' || value === 'serviceman-ticket',
          then: () => boolean().required(),
        }),

        startDate: date().when(['type', 'hasStartDate'], {
          is: (type: string, hasStartDate: boolean) => {
            return (
              (type === 'military-ticket' || type === 'serviceman-ticket') &&
              hasStartDate
            );
          },
          then: () => date().required(),
          otherwise: () => date().notRequired(),
        }),
        category: string().when('type', {
          is: (value: string) =>
            value === 'military-ticker' || value === 'serviceman-ticket',
          then: () =>
            string()
              .oneOf(['mobilized', 'cadet', 'contractor', 'conscript'])
              .required(),
        }),
      }),
    }).required(),
  )
  .min(1);

export const $errors = createStore<Record<string, string>>({});

export const $passengersCount = createStore(1);

export const passengersCountChanged = createEvent<number>();

sample({
  clock: passengersCountChanged,
  target: $passengersCount,
});

sample({
  clock: $passengersCount,
  source: $passengers,
  filter: (passengers, count) => count < passengers.length,
  fn: (passengers, count) => passengers.slice(count),
  target: $passengers,
});

sample({
  clock: $passengersCount,
  source: $passengers,
  filter: (passengers, count) => count > passengers.length,
  fn: (passengers, count) => [
    ...passengers,
    ...Array(count - passengers.length)
      .fill(0)
      .map(() => createPassenger()),
  ],
  target: $passengers,
});

sample({
  clock: $passengersCount,
  filter: (count) => count === 0,
  fn: () => [],
  target: $passengers,
});

export const removed = createEvent<{ index: number }>();
export const firstnameEdited = createEvent<{ index: number; value: string }>();
export const lastnameEdited = createEvent<{ index: number; value: string }>();
export const middlenameEdited = createEvent<{ index: number; value: string }>();
export const hasMiddlenameEdited = createEvent<{
  index: number;
  value: boolean;
}>();

export const genderEdited = createEvent<{ index: number; value: 'm' | 'f' }>();
export const birthdateEdited = createEvent<{
  index: number;
  value: Date | null;
}>();

export const documentTypeEdited = createEvent<{
  index: number;
  value: Passenger['document']['type'];
}>();

export const documentNumberEdited = createEvent<{
  index: number;
  value: string;
}>();

export const documentCitizenshipEdited = createEvent<{
  index: number;
  value: ForeignId['citizenship'];
}>();

export const documentCategoryEdited = createEvent<{
  index: number;
  value: MilitaryTicket['category'] | ServicemanId['category'];
}>();

export const documentHasStartDateEdited = createEvent<{
  index: number;
  value: boolean;
}>();

export const documentStartDateEdited = createEvent<{
  index: number;
  value: Date | null;
}>();

sample({
  clock: removed,
  source: $passengers,
  fn: (passengers, { index }) => {
    const copy = [...passengers];

    copy.splice(index, 1);

    return { passangers: copy, count: copy.length };
  },
  target: spread({
    targets: {
      passangers: $passengers,
      count: $passengersCount,
    },
  }),
});

sample({
  clock: firstnameEdited,
  source: $passengers,
  fn: (passangers, { index, value }) => {
    const copy = [...passangers];

    copy[index].firstname = value;

    return copy;
  },
  target: $passengers,
});

sample({
  clock: lastnameEdited,
  source: $passengers,
  fn: (passangers, { index, value }) => {
    const copy = [...passangers];

    copy[index].lastname = value;

    return copy;
  },
  target: $passengers,
});

sample({
  clock: middlenameEdited,
  source: $passengers,
  fn: (passangers, { index, value }) => {
    const copy = [...passangers];

    copy[index].middlename = value;

    return copy;
  },
  target: $passengers,
});

sample({
  clock: hasMiddlenameEdited,
  source: $passengers,
  fn: (passangers, { index, value }) => {
    const copy = [...passangers];

    copy[index].hasMiddlename = !value;

    if (value) {
      copy[index].middlename = null;
    }

    return copy;
  },
  target: $passengers,
});

sample({
  clock: genderEdited,
  source: $passengers,
  fn: (passangers, { index, value }) => {
    const copy = [...passangers];

    copy[index].gender = value;

    return copy;
  },
  target: $passengers,
});

function getAge(birthDate: Date) {
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

sample({
  clock: birthdateEdited,
  source: $passengers,
  fn: (passangers, { index, value }) => {
    const copy = [...passangers];

    copy[index].birthday = value;

    if (value) {
      copy[index].isChild = getAge(value) < 18;
    }

    return copy;
  },
  target: $passengers,
});

sample({
  clock: documentTypeEdited,
  source: $passengers,
  fn: (passangers, { index, value }) => {
    const copy = [...passangers];

    copy[index].document = getDefaultDocument(value);

    return copy;
  },
  target: $passengers,
});

sample({
  clock: documentNumberEdited,
  source: $passengers,
  fn: (passangers, { index, value }) => {
    const copy = [...passangers];

    copy[index].document.documentNumber = value;

    return copy;
  },
  target: $passengers,
});

sample({
  clock: documentCitizenshipEdited,
  source: $passengers,
  fn: (passangers, { index, value }) => {
    const copy = [...passangers];

    if (copy[index].document.type === 'foreign-id') {
      copy[index].document.citizenship = value;
    }

    return copy;
  },
  target: $passengers,
});

sample({
  clock: documentCategoryEdited,
  source: $passengers,
  fn: (passangers, { index, value }) => {
    const copy = [...passangers];

    if (
      copy[index].document.type === 'military-ticket' ||
      copy[index].document.type === 'serviceman-ticket'
    ) {
      copy[index].document.category = value;
    }

    return copy;
  },
  target: $passengers,
});

sample({
  clock: documentHasStartDateEdited,
  source: $passengers,
  fn: (passangers, { index, value }) => {
    const copy = [...passangers];

    if (
      copy[index].document.type === 'military-ticket' ||
      copy[index].document.type === 'serviceman-ticket'
    ) {
      copy[index].document.hasStartDate = !value;

      if (value) {
        copy[index].document.startDate = null;
      }
    }

    return copy;
  },
  target: $passengers,
});

sample({
  clock: documentStartDateEdited,
  source: $passengers,
  fn: (passangers, { index, value }) => {
    const copy = [...passangers];

    if (
      copy[index].document.type === 'military-ticket' ||
      copy[index].document.type === 'serviceman-ticket'
    ) {
      copy[index].document.startDate = value;
    }

    return copy;
  },
  target: $passengers,
});

const validateFx = createEffect(async (passengers: Passenger[]) => {
  try {
    await schema.validate(passengers, { abortEarly: false });

    return {};
  } catch (e) {
    const { errors } = e as ValidationError;

    return errors.reduce<Record<string, string>>((acc, error) => {
      const splitted = error.split(' ');

      acc[splitted[0].replace(/\[/g, '').replace(/\]/g, '')] = splitted
        .slice(1)
        .join(' ');

      return acc;
    }, {});
  }
});

sample({
  clock: $passengers,
  target: validateFx,
});

sample({
  clock: validateFx.doneData,
  target: $errors,
});
