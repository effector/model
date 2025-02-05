import { useList, useStoreMap, useUnit } from 'effector-react';
import { AdditiveSelect } from './types';
import { Radio, Title, AddToOrder } from './common';
import {
  $currentDishOrder,
  $dish,
  $dishAdditives,
  addAdditive,
  removeAdditive,
  addToOrder,
  openDishList,
  isAdditiveSimple,
  $currentDishTotalPrice,
  $isInOrder,
} from './model';

const DishHead = () => {
  const [{ name, description, price }, goBack] = useUnit([
    $dish,
    openDishList,
  ]);
  return (
    <>
      <Title goBack={goBack} text={name} />
      <div className="p-4">
        <p className="text-lg text-gray-500 mt-2">{price}₸</p>
        <p className="text-sm text-gray-400 mt-2">{description}</p>
      </div>
    </>
  );
};

const AdditiveWithPrice = ({
  text,
  price,
}: {
  text: string;
  price: number;
}) => (
  <div className="flex items-center gap-x-3">
    <p className="text-md">{text}</p>
    <p className="text-teal-500 mr-2">+{price}₸</p>
  </div>
);

const AdditiveSimpleItem = ({
  additive,
  choice,
  price,
  amountPerItem,
}: {
  additive: string;
  choice: string;
  amountPerItem: 'single' | 'many';
  price: number;
}) => {
  const orderedAmount = useStoreMap({
    store: $currentDishOrder,
    keys: [additive],
    fn: ({ additives }) =>
      additives.find((e) => e.additive === additive && e.choice === choice)
        ?.amount ?? 0,
  });
  const [add, remove] = useUnit([addAdditive, removeAdditive]);
  const selected = orderedAmount !== 0;
  return (
    <div className="flex justify-between items-center mb-2">
      <AdditiveWithPrice text={choice} price={price} />
      <div className="flex items-center">
        {amountPerItem === 'single' ? (
          <Radio
            name={choice}
            checked={selected}
            onClick={() => {
              if (selected) {
                remove(additive);
              } else {
                add({ additive, choice });
              }
            }}
          />
        ) : orderedAmount === 0 ? (
          <button
            onClick={() => add({ additive, choice })}
            className="text-teal-500 rounded-full px-0.5"
          >
            +
          </button>
        ) : (
          <>
            <button
              onClick={() => remove(additive)}
              className="bg-teal-500 text-white rounded-full w-6 h-6 flex items-center justify-center"
            >
              -
            </button>
            <span className="mx-2">{orderedAmount}</span>
            <button
              onClick={() => add({ additive, choice })}
              className="bg-teal-500 text-white rounded-full w-6 h-6 flex items-center justify-center"
            >
              +
            </button>
          </>
        )}
      </div>
    </div>
  );
};

const AdditiveSelectItem = ({ name, options }: AdditiveSelect) => {
  return (
    <div className="mt-4">
      <h2 className="text-xl font-bold mb-2">{name}:</h2>
      {options.map(({ name: choice, price, amountPerItem }) => (
        <AdditiveSimpleItem
          additive={name}
          choice={choice}
          price={price}
          amountPerItem={amountPerItem}
          key={choice}
        />
      ))}
    </div>
  );
};

const DishAdditives = () => (
  <div className="p-4">
    <h2 className="text-xl font-bold mb-2">Добавки:</h2>
    {useList($dishAdditives, (additive) => {
      return isAdditiveSimple(additive) ? (
        <AdditiveSimpleItem
          additive={additive.name}
          choice={additive.name}
          price={additive.price}
          amountPerItem={additive.amountPerItem}
        />
      ) : (
        <AdditiveSelectItem
          name={additive.name}
          options={additive.options}
          required={additive.required}
        />
      );
    })}
  </div>
);

export const DishView = () => {
  const [currentPrice, isInOrder, submit] = useUnit([
    $currentDishTotalPrice,
    $isInOrder,
    addToOrder,
  ]);
  const showAdditives = useStoreMap($dishAdditives, (list) => list.length > 0);
  return (
    <>
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-md overflow-hidden">
        <DishHead />
        {showAdditives && <DishAdditives />}
      </div>

      <AddToOrder onClick={submit}>
        {isInOrder ? (
          <>Обновить заказ ({currentPrice}₸)</>
        ) : (
          <>Добавить в заказ за {currentPrice}₸</>
        )}
      </AddToOrder>
    </>
  );
};
