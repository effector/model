import type {
  Additive,
  AdditiveSimple,
  AdditiveOrder,
  Dish,
  DishOrder,
  Restaurant,
  Order,
} from '../types';

export function isAdditiveSimple(
  additive: Additive
): additive is AdditiveSimple {
  return !('required' in additive);
}

export function getAmountPerItemType(additiveEntity: Additive, choice: string) {
  if (isAdditiveSimple(additiveEntity)) {
    return additiveEntity.amountPerItem;
  } else {
    const choiceEntity = additiveEntity.options.find((e) => e.name === choice)!;
    return choiceEntity.amountPerItem;
  }
}

export function getOrderedPerItemType(
  dish: Dish,
  additiveOrder: AdditiveOrder
) {
  const additive = dish.additives.find(
    (e) => e.name === additiveOrder.additive
  )!;
  return getAmountPerItemType(additive, additiveOrder.choice);
}

export function calculateAdditiveOrderPriceFromEntity(
  additiveEntity: Additive,
  choice: string,
  amount: number
) {
  if (isAdditiveSimple(additiveEntity)) {
    return additiveEntity.price * amount;
  } else {
    const choiceEntity = additiveEntity.options.find((e) => e.name === choice)!;
    return choiceEntity.price * amount;
  }
}

export function calculateAdditiveOrderPrice(
  dish: Dish,
  additiveOrder: AdditiveOrder
) {
  const additive = dish.additives.find(
    (e) => e.name === additiveOrder.additive
  )!;
  return calculateAdditiveOrderPriceFromEntity(
    additive,
    additiveOrder.choice,
    additiveOrder.amount
  );
}

export function calculateDishOrderPrice(dish: Dish, order: DishOrder) {
  let totalPrice = dish.price;
  for (const additiveOrder of order.additives) {
    totalPrice += calculateAdditiveOrderPrice(dish, additiveOrder);
  }
  return totalPrice;
}

export function calculateTotalOrderPrice(restaurant: Restaurant, order: Order) {
  if (restaurant.name !== order.restaurant) return 0;
  let totalPrice = 0;
  for (const dishOrder of order.dishes) {
    const dish = restaurant.dishes.find((e) => e.name === dishOrder.dish)!;
    totalPrice += calculateDishOrderPrice(dish, dishOrder);
  }
  return totalPrice;
}
