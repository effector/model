import { useUnit } from 'effector-react';
import { $route } from './model';
import { MenuView } from './view/MenuView';
import { DishView } from './view/DishView';
import { OrderView } from './view/OrderView';
import { RestaurantsView } from './view/RestaurantsView';

export function App() {
  const route = useUnit($route);
  switch (route.name) {
    case 'menu':
      return <MenuView restaurant={route.restaurant} />;
    case 'dish':
      return <DishView restaurant={route.restaurant} dish={route.dish} />;
    case 'order':
      return <OrderView restaurant={route.restaurant} />;
    case 'restaurants':
      return <RestaurantsView />;
    default:
      return null;
  }
}
