import { array, object, string, date, boolean, number } from 'yup';

export const schema = array()
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

        notServed: boolean().when('type', {
          is: (value: string) =>
            value === 'military-ticker' || value === 'serviceman-ticket',
          then: () => boolean().required(),
        }),

        startDate: date().when(['type', 'notServed'], {
          is: (type: string, notServed: boolean) => {
            return (
              (type === 'military-ticket' || type === 'serviceman-ticket') &&
              !notServed
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
