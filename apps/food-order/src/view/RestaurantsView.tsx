import { useUnit } from 'effector-react';
import { useEntityList, useEntityItem } from '@effector/model-react';

import { restaurantsList, openRestaurant } from '../model';

export const RestaurantsView = () => {
  return (
    <div className="max-w-md mx-auto bg-white rounded-lg shadow-md overflow-hidden">
      <div className="p-4">
        <h1 className="text-2xl font-bold">Выберите ресторан</h1>
      </div>
      <div className="p-4">
        {useEntityList(restaurantsList, () => {
          const goToRest = useUnit(openRestaurant);
          const { name, description, category } =
            useEntityItem(restaurantsList);
          return (
            <div
              className="cursor-pointer mb-4 p-2 hover:bg-gray-100"
              onClick={() => goToRest(name)}
            >
              <p className="text-lg font-bold">{name}</p>
              <p className="flex gap-x-1 text-sm text-gray-500">
                {category.map((item) => (
                  <span className="categories capitalize" key={item}>
                    {item}
                  </span>
                ))}
              </p>
              <p className="text-sm text-gray-400 mt-1">{description}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
};
