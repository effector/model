import {
  Card,
  Flex,
  Group,
  NumberInput,
  Stack,
  Title,
  Text,
  TextInput,
  Checkbox,
  SegmentedControl,
  CloseButton,
  Select,
} from '@mantine/core';
import { useUnit } from 'effector-react';
import {
  $errors,
  $passengers,
  $passengersCount,
  birthdateEdited,
  categories,
  citizenships,
  documentCategoryEdited,
  documentCitizenshipEdited,
  documentHasStartDateEdited,
  documentNumberEdited,
  documents,
  documentStartDateEdited,
  documentTypeEdited,
  firstnameEdited,
  genderEdited,
  hasMiddlenameEdited,
  lastnameEdited,
  middlenameEdited,
  Passenger,
  passengersCountChanged,
  removed,
} from './model';

import { DateInput } from '@mantine/dates';
import { CodeHighlight } from '@mantine/code-highlight';

interface DocumentProps {
  passenger: Passenger;
  index: number;
  errors: Record<string, string>;
}

function Document(props: DocumentProps) {
  const { passenger, index, errors } = props;
  const {
    onDocumentCategoryEdited,
    onDocumentCitizenshipEdited,
    onDocumentHasStartDateEdited,
    onDocumentNumberEdited,
    onDocumentStartDateEdited,
  } = useUnit({
    onDocumentNumberEdited: documentNumberEdited,
    onDocumentCitizenshipEdited: documentCitizenshipEdited,
    onDocumentCategoryEdited: documentCategoryEdited,
    onDocumentHasStartDateEdited: documentHasStartDateEdited,
    onDocumentStartDateEdited: documentStartDateEdited,
  });

  const docNumberTextInput = (
    <TextInput
      error={errors[`${index}.document.documentNumber`]}
      value={passenger.document.documentNumber}
      onChange={(e) =>
        onDocumentNumberEdited({ index, value: e.currentTarget.value })
      }
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
            error={errors[`${index}.document.citizenship`]}
            value={passenger.document.citizenship}
            onChange={(v) =>
              onDocumentCitizenshipEdited({ index, value: v as any })
            }
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
              error={errors[`${index}.document.category`]}
              value={passenger.document.category}
              onChange={(v) =>
                onDocumentCategoryEdited({ index, value: v as any })
              }
              placeholder="Категория военнослужащего"
              data={categories}
            />
          </Flex>

          <Flex direction="column" gap="xs">
            <DateInput
              error={errors[`${index}.document.startDate`]}
              value={passenger.document.startDate}
              clearable
              onChange={(value) => onDocumentStartDateEdited({ index, value })}
              disabled={!passenger.document.hasStartDate}
              placeholder="Дата начала военной службы"
            />

            <Checkbox
              onChange={(e) =>
                onDocumentHasStartDateEdited({
                  index,
                  value: e.currentTarget.checked,
                })
              }
              checked={!passenger.document.hasStartDate}
              label="Нет отметки о прохождении службы"
            />
          </Flex>
        </Flex>
      );
    }
  }
}

function App() {
  const { passengersCount, onPassengersCountChanged } = useUnit({
    passengersCount: $passengersCount,
    onPassengersCountChanged: passengersCountChanged,
  });

  const {
    passengers,
    errors,
    onFirstnameEdited,
    onGenderEdited,
    onHasMiddlenameEdited,
    onLastnameEdited,
    onMiddlenameEdited,
    onRemoved,
    onDocumentTypeEdited,
    onBirthdayEdited,
  } = useUnit({
    passengers: $passengers,
    errors: $errors,
    onRemoved: removed,
    onFirstnameEdited: firstnameEdited,
    onLastnameEdited: lastnameEdited,
    onMiddlenameEdited: middlenameEdited,
    onHasMiddlenameEdited: hasMiddlenameEdited,
    onGenderEdited: genderEdited,
    onBirthdayEdited: birthdateEdited,
    onDocumentTypeEdited: documentTypeEdited,
  });

  return (
    <Stack mx={12} mt={24}>
      <NumberInput
        min={0}
        value={passengersCount}
        onChange={(v) => onPassengersCountChanged(+v)}
        label="Укажите количество пассажиров"
      />

      <Title order={3}>Пассажиры</Title>

      {passengers.length === 0 && <Text>Бро добавь пассажиров пж</Text>}

      {passengers.map((passenger, index) => (
        <Card shadow="sm" padding="md" radius="md" withBorder>
          <Group justify="space-between">
            <Text fw={500}>
              {index + 1}. {passenger.isChild ? 'Ребёнок' : 'Взрослый'}
            </Text>

            <CloseButton onClick={() => onRemoved({ index })} />
          </Group>

          <Flex direction="row" gap="xs" mt="md">
            <TextInput
              error={errors[`${index}.firstname`]}
              value={passenger.firstname}
              onChange={(e) =>
                onFirstnameEdited({ index, value: e.currentTarget.value })
              }
              placeholder="Имя"
            />
            <TextInput
              error={errors[`${index}.lastname`]}
              onChange={(e) =>
                onLastnameEdited({ index, value: e.currentTarget.value })
              }
              value={passenger.lastname}
              placeholder="Фамилия"
            />
            <Flex direction="column" gap="xs">
              <TextInput
                error={errors[`${index}.middlename`]}
                onChange={(e) =>
                  onMiddlenameEdited({ index, value: e.currentTarget.value })
                }
                value={passenger.middlename ?? ''}
                disabled={!passenger.hasMiddlename}
                placeholder="Отчество"
              />
              <Checkbox
                onChange={(e) =>
                  onHasMiddlenameEdited({
                    index,
                    value: e.currentTarget.checked,
                  })
                }
                checked={!passenger.hasMiddlename}
                label="Нет отчества"
              />
            </Flex>
          </Flex>

          <Flex direction="row" gap="xs" align="flex-end">
            <Flex direction="column" gap={4}>
              <Text size="xs">Пол</Text>

              <SegmentedControl
                onChange={(gender) => {
                  onGenderEdited({ index, value: gender as 'm' | 'f' });
                }}
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
              error={errors[`${index}.birthday`]}
              onChange={(value) => onBirthdayEdited({ index, value })}
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
                onDocumentTypeEdited({
                  index,
                  value:
                    (value as Passenger['document']['type']) ?? 'national-id',
                })
              }
              w="fit-content"
              label="Документ"
              data={documents}
            />

            <Flex gap="xs" direction="row">
              <Document errors={errors} passenger={passenger} index={index} />
            </Flex>
          </Flex>
        </Card>
      ))}

      <Flex direction="row">
        <CodeHighlight
          flex="1"
          code={JSON.stringify(passengers, null, 2)}
          language="json"
        />
        <CodeHighlight
          flex="1"
          code={JSON.stringify(errors, null, 2)}
          language="json"
        />
      </Flex>
    </Stack>
  );
}

export default App;
