import { useUnit } from 'effector-react';
import { $route } from './model';
import { MenuView } from './MenuView';
import { DishView } from './DishView';
import { OrderView } from './OrderView';
import { RestaurantsView } from './RestaurantsView';

export function App() {
  const route = useUnit($route);
  switch (route.name) {
    case 'menu':
      return <MenuView />;
    case 'dish':
      return <DishView />;
    case 'order':
      return <OrderView />;
    case 'restaurants':
      return <RestaurantsView />;
    default:
      return null;
  }
}
