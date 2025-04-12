import { useUnit } from 'effector-react';
import {
  useItemApi,
  useEntityItem,
  useEditItemField,
} from '@effector/model-react';
import {
  Card,
  Flex,
  Group,
  Text,
  TextInput,
  Checkbox,
  SegmentedControl,
  CloseButton,
  Select,
} from '@mantine/core';
import { DateInput } from '@mantine/dates';

import { passengersList, removePassenger } from '../model/passengers.model';
import { errorsList } from '../model/errors.model';
import type { Passenger } from '../types';
import { documents } from '../model/data';
import { DocumentBlock } from './DocumentBlock';

export const PassengerCard = () => {
  const passenger = useEntityItem(passengersList);
  const { changeDocumentType } = useItemApi(passengersList);
  const editField = useEditItemField(passengersList);
  const { index } = passenger;
  const { errors } = useEntityItem(errorsList, index);
  const doRemovePassenger = useUnit(removePassenger);
  return (
    <Card shadow="sm" padding="md" radius="md" withBorder>
      <Group justify="space-between">
        <Text fw={500}>
          {index + 1}. {passenger.isChild ? 'Ребёнок' : 'Взрослый'}
        </Text>

        <CloseButton onClick={() => doRemovePassenger(index)} />
      </Group>

      <Flex direction="row" gap="xs" mt="md">
        <TextInput
          error={errors.firstname}
          value={passenger.firstname}
          onChange={(e) => editField.firstname(e.currentTarget.value)}
          placeholder="Имя"
        />
        <TextInput
          error={errors.lastname}
          onChange={(e) => editField.lastname(e.currentTarget.value)}
          value={passenger.lastname}
          placeholder="Фамилия"
        />
        <Flex direction="column" gap="xs">
          <TextInput
            error={errors.middlename}
            onChange={(e) => editField.middlename(e.currentTarget.value)}
            value={passenger.middlename ?? ''}
            disabled={!passenger.hasMiddlename}
            placeholder="Отчество"
          />
          <Checkbox
            onChange={(e) => editField.hasMiddlename(e.currentTarget.checked)}
            checked={!passenger.hasMiddlename}
            label="Нет отчества"
          />
        </Flex>
      </Flex>

      <Flex direction="row" gap="xs" align="flex-end">
        <Flex direction="column" gap={4}>
          <Text size="xs">Пол</Text>

          <SegmentedControl
            onChange={(gender) => editField.gender(gender as 'm' | 'f')}
            value={passenger.gender ?? ''}
            withItemsBorders={false}
            radius="md"
            data={[
              { value: 'm', label: 'М' },
              { value: 'f', label: 'Ж' },
            ]}
          />
        </Flex>

        <DateInput
          error={errors.birthday}
          onChange={(value) => editField.birthday(value)}
          value={passenger.birthday}
          placeholder="Дата рождения"
          maxDate={new Date()}
          clearable
        />
      </Flex>

      <Flex direction="column" gap="xs" mt="md">
        <Select
          value={passenger.document.type}
          onChange={(value) =>
            changeDocumentType(
              (value as Passenger['document']['type']) ?? 'national-id',
            )
          }
          w="fit-content"
          label="Документ"
          data={documents}
        />

        <Flex gap="xs" direction="row">
          <DocumentBlock errors={errors.document} />
        </Flex>
      </Flex>
    </Card>
  );
};
