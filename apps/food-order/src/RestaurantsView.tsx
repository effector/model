import { useList, useUnit } from 'effector-react';
import { $restaurants, openRestaurant } from './model';

export const RestaurantsView = () => {
  const goToRest = useUnit(openRestaurant);
  return (
    <div className="max-w-md mx-auto bg-white rounded-lg shadow-md overflow-hidden">
      <div className="p-4">
        <h1 className="text-2xl font-bold">Выберите ресторан</h1>
      </div>
      <div className="p-4">
        {useList($restaurants, ({ name, description, category }) => (
          <div
            className="cursor-pointer mb-4 p-2 hover:bg-gray-100"
            onClick={() => goToRest(name)}
          >
            <p className="text-lg font-bold">{name}</p>
            <p className="flex gap-x-1 text-sm text-gray-500">
              {category.map((item) => (
                <div className="categories capitalize" key={item}>
                  {item}
                </div>
              ))}
            </p>
            <p className="text-sm text-gray-400 mt-1">{description}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
