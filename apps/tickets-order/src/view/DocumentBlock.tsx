import { useItemApi } from '@effector/model-react';
import { Flex, TextInput, Checkbox, Select } from '@mantine/core';
import { DateInput } from '@mantine/dates';

import { passengersList } from '../model/passengers.model';
import type { Passenger, PersonError } from '../types';
import { categories, citizenships } from '../model/data';

export const DocumentBlock = ({
  passenger,
  index,
  errors,
}: {
  passenger: Passenger;
  index: number;
  errors: PersonError['document'];
}) => {
  const {
    changeDocumentNumber,
    editCitizenship,
    editCategory,
    editStartDate,
    editIsNotServed,
  } = useItemApi(passengersList, index);

  const docNumberTextInput = (
    <TextInput
      error={errors.documentNumber}
      value={passenger.document.documentNumber}
      onChange={(e) => changeDocumentNumber(e.currentTarget.value)}
      placeholder="Номер документа"
    />
  );

  switch (passenger.document.type) {
    case 'national-id':
    case 'birth-id':
    case 'international-id':
    case 'seaman-id': {
      return docNumberTextInput;
    }
    case 'foreign-id': {
      return (
        <>
          <Select
            error={errors.citizenship}
            value={passenger.document.citizenship}
            onChange={(v) => editCitizenship(v as any)}
            placeholder="Гражданство"
            data={citizenships}
          />

          {docNumberTextInput}
        </>
      );
    }
    case 'military-ticket':
    case 'serviceman-ticket': {
      return (
        <Flex direction="column" gap="xs">
          <Flex gap="xs">
            {docNumberTextInput}

            <Select
              error={errors.category}
              value={passenger.document.category}
              onChange={(v) => editCategory(v as any)}
              placeholder="Категория военнослужащего"
              data={categories}
            />
          </Flex>

          <Flex direction="column" gap="xs">
            <DateInput
              error={errors.startDate}
              value={passenger.document.startDate}
              clearable
              onChange={(value) => editStartDate(value)}
              disabled={passenger.document.notServed}
              placeholder="Дата начала военной службы"
            />

            <Checkbox
              onChange={(e) => editIsNotServed(e.currentTarget.checked)}
              checked={passenger.document.notServed}
              label="Нет отметки о прохождении службы"
            />
          </Flex>
        </Flex>
      );
    }
  }
};
