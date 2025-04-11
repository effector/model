type NationalId = {
  type: 'national-id';
  documentNumber: string;
};

type BirthId = {
  type: 'birth-id';
  documentNumber: string;
};

export type ForeignId = {
  type: 'foreign-id';
  citizenship: 'ua' | 'bel' | 'kz' | 'uzb' | null;
  documentNumber: string;
};

type InternationalId = {
  type: 'international-id';
  documentNumber: string;
};

export type MilitaryTicket = {
  type: 'military-ticket';
  documentNumber: string;
  category: 'mobilized' | 'cadet' | 'contractor' | 'conscript' | null;
  startDate: Date | null;
  notServed: boolean;
};

type SeamanId = {
  type: 'seaman-id';
  documentNumber: string;
};

export type ServicemanId = {
  type: 'serviceman-ticket';
  documentNumber: string;
  category: 'mobilized' | 'cadet' | 'contractor' | 'conscript' | null;
  startDate: Date | null;
  notServed: boolean;
};

export type PassengerDocument =
  | NationalId
  | BirthId
  | ForeignId
  | InternationalId
  | MilitaryTicket
  | SeamanId
  | ServicemanId;

export type Passenger = {
  firstname: string;
  lastname: string;
  middlename: string | null;
  hasMiddlename: boolean;
  gender: 'm' | 'f' | null;
  birthday: Date | null;
  isChild: boolean;
  seat: number;

  document: PassengerDocument;
};

export type PersonError = {
  firstname: string | null;
  lastname: string | null;
  middlename: string | null;
  birthday: string | null;
  gender: string | null;
  document: {
    documentNumber: string | null;
    citizenship: string | null;
    category: string | null;
    startDate: string | null;
  };
};
