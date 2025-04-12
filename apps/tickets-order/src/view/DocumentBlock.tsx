import { useItemApi, useEntityItem } from '@effector/model-react';
import { Flex, TextInput, Checkbox, Select } from '@mantine/core';
import { DateInput } from '@mantine/dates';

import { passengersList } from '../model/passengers.model';
import type { PersonError } from '../types';
import { categories, citizenships } from '../model/data';

export const DocumentBlock = ({
  errors,
}: {
  errors: PersonError['document'];
}) => {
  const { document } = useEntityItem(passengersList);
  const {
    changeDocumentNumber,
    editCitizenship,
    editCategory,
    editStartDate,
    editIsNotServed,
  } = useItemApi(passengersList);

  const docNumberTextInput = (
    <TextInput
      error={errors.documentNumber}
      value={document.documentNumber}
      onChange={(e) => changeDocumentNumber(e.currentTarget.value)}
      placeholder="Номер документа"
    />
  );

  switch (document.type) {
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
            value={document.citizenship}
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
              value={document.category}
              onChange={(v) => editCategory(v as any)}
              placeholder="Категория военнослужащего"
              data={categories}
            />
          </Flex>

          <Flex direction="column" gap="xs">
            <DateInput
              error={errors.startDate}
              value={document.startDate}
              clearable
              onChange={(value) => editStartDate(value)}
              disabled={document.notServed}
              placeholder="Дата начала военной службы"
            />

            <Checkbox
              onChange={(e) => editIsNotServed(e.currentTarget.checked)}
              checked={document.notServed}
              label="Нет отметки о прохождении службы"
            />
          </Flex>
        </Flex>
      );
    }
  }
};
