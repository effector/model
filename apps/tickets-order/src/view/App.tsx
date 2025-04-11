import { useUnit } from 'effector-react';
import { useEntityList } from '@effector/model-react';
import { NumberInput, Stack, Title, Text } from '@mantine/core';

import { CodeBlock } from './CodeBlock';
import { PassengerCard } from './PassengerCard';

import {
  $passengersCount,
  passengersList,
  setPassengersAmount,
} from '../model/passengers.model';

export const App = () => {
  const { passengersCount, changePassengersAmount } = useUnit({
    passengersCount: $passengersCount,
    changePassengersAmount: setPassengersAmount,
  });

  return (
    <Stack mx={12} mt={24}>
      <NumberInput
        min={0}
        value={passengersCount}
        onChange={(v) => changePassengersAmount(+v)}
        label="Укажите количество пассажиров"
      />

      <Title order={3}>Пассажиры</Title>

      {passengersCount === 0 && <Text>Бро добавь пассажиров пж</Text>}

      {useEntityList(passengersList, () => (
        <PassengerCard />
      ))}

      <CodeBlock />
    </Stack>
  );
};
