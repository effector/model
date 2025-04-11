import type { Passenger } from '../types';

export function getDefaultDocument(
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
        notServed: false,
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
        notServed: false,
        startDate: null,
        category: null,
      };
    }
  }
}

export function createPassenger(): Passenger {
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
