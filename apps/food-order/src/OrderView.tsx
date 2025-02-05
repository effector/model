import { useUnit, useList } from 'effector-react';
import {
  $totalOrderPrice,
  $orderWithPrices,
  openDishList,
  submitOrder,
  $submitInProgress,
} from './model';
import { AddToOrder, Title } from './common';

export const OrderView = () => {
  const [totalPrice, goBack, submit, inProgress] = useUnit([
    $totalOrderPrice,
    openDishList,
    submitOrder,
    $submitInProgress,
  ]);
  return (
    <>
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-md overflow-hidden">
        <Title goBack={goBack} text="Оформление заказа" />
        <div className="p-4">
          <h2 className="text-xl font-bold mb-4">Ваш заказ:</h2>

          {useList($orderWithPrices, ({ dish, totalPrice, additives }) => (
            <div className="mb-4">
              <div className="flex justify-between items-center">
                <p className="text-lg font-bold">{dish}</p>
                <p className="text-lg text-teal-500">{totalPrice}₸</p>
              </div>
              <div className="ml-4">
                {additives.map(({ choice, amount, totalPrice, showAmount }) => (
                  <div className="flex justify-between items-center">
                    <p className="text-md">
                      {choice} {showAmount && <>x {amount}</>}
                    </p>
                    <p className="text-md text-gray-500">{totalPrice}₸</p>
                  </div>
                ))}
              </div>
            </div>
          ))}

          <div className="flex justify-between items-center border-t border-gray-200 pt-4">
            <p className="text-lg font-bold">Итоговая стоимость:</p>
            <p className="text-lg text-teal-500">{totalPrice}₸</p>
          </div>
        </div>
      </div>

      <AddToOrder onClick={submit} disabled={inProgress}>
        {inProgress ? <>Заказ оформляется</> : <>Оформить заказ</>}
      </AddToOrder>
    </>
  );
};
