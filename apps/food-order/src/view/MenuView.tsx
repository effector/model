import { useUnit } from 'effector-react';
import { useReadItem } from '@effector/model-react';

import {
  restaurantsList,
  ordersList,
  openOrder,
  openDish,
  openRestList,
} from '../model';
import { AddToOrder, Title } from './components';

const MenuItem = ({ name, price }: { name: string; price: number }) => {
  const onClick = useUnit(openDish);
  return (
    <div
      className="cursor-pointer flex justify-between items-center mb-4 p-2 hover:bg-gray-100"
      onClick={() => onClick(name)}
    >
      <p className="text-lg font-bold">{name}</p>
      <p className="text-lg text-teal-500">{price}₸</p>
    </div>
  );
};

export const MenuView = ({ restaurant }: { restaurant: string }) => {
  const [goToOrder, goBack] = useUnit([openOrder, openRestList]);
  const { totalPrice } = useReadItem(ordersList, restaurant);
  const { dishes } = useReadItem(restaurantsList, restaurant);
  return (
    <>
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-4">
          <Title goBack={goBack} text={restaurant} />
          <h2 className="text-2xl font-bold mb-4">Выберите блюдо</h2>
          {dishes.map(({ name, price }) => (
            <MenuItem name={name} key={name} price={price} />
          ))}
        </div>
      </div>
      <AddToOrder disabled={totalPrice === 0} onClick={goToOrder}>
        {totalPrice === 0 ? (
          <>Добавьте блюдо для оформления заказа</>
        ) : (
          <>Перейти к заказу ({totalPrice}₸)</>
        )}
      </AddToOrder>
    </>
  );
};
