import { Restaurant } from './types';

export const restaurants: Restaurant[] = [
  {
    name: 'Кафе у дома',
    description: 'Уютное кафе с европейской кухней',
    category: ['european'],
    dishes: [
      {
        name: 'Латте',
        price: 900,
        description:
          'Кофе эспрессо с добавлением вспененного молока и плотной молочной пеной',
        additives: [
          {
            name: 'Сахар',
            price: 50,
            amountPerItem: 'many',
          },
          {
            name: 'Зёрна',
            required: true,
            options: [
              {
                name: 'Бразильский кофе',
                price: 0,
                amountPerItem: 'single',
              },
              {
                name: 'Кенийский кофе',
                price: 0,
                amountPerItem: 'single',
              },
              {
                name: 'Индонезийский кофе',
                price: 150,
                amountPerItem: 'single',
              },
            ],
          },
          {
            name: 'Сироп',
            required: false,
            options: [
              {
                name: 'Ванильный сироп',
                price: 150,
                amountPerItem: 'single',
              },
              {
                name: 'Карамельный сироп',
                price: 150,
                amountPerItem: 'single',
              },
              {
                name: 'Ореховый сироп',
                price: 150,
                amountPerItem: 'single',
              },
            ],
          },
        ],
      },
      {
        name: 'Тост с авокадо и яйцом пашот',
        price: 2500,
        description: 'Злаковый хлеб с авокадо, яйцом пашот и зеленью',
        additives: [
          {
            name: 'Лосось',
            price: 300,
            amountPerItem: 'single',
          },
          {
            name: 'Сыр фета',
            price: 200,
            amountPerItem: 'single',
          },
        ],
      },
      {
        name: 'Лимонный сорбет',
        price: 1800,
        description: 'Освежающий десерт из лимонного сока и сахара',
        additives: [],
      },
      {
        name: 'Утиная грудка',
        price: 4500,
        description: 'Утиная грудка с соусом из красного вина и ягод',
        additives: [
          {
            name: 'На выбор',
            required: false,
            options: [
              {
                name: 'Красное вино',
                price: 300,
                amountPerItem: 'single',
              },
              {
                name: 'Черная смородина',
                price: 200,
                amountPerItem: 'many',
              },
              {
                name: 'Голубика',
                price: 200,
                amountPerItem: 'many',
              },
            ],
          },
        ],
      },
    ],
  },
  {
    name: 'La Bella Vita',
    description: 'Аутентичный итальянский ресторан',
    category: ['italian'],
    dishes: [
      {
        name: 'Пицца Пепперони',
        price: 3500,
        description: 'Пицца с томатным соусом, моцареллой и колбасой пепперони',
        additives: [
          {
            name: 'Маслины',
            price: 200,
            amountPerItem: 'many',
          },
          {
            name: 'Грибы',
            price: 200,
            amountPerItem: 'many',
          },
          {
            name: 'Перец чили',
            price: 150,
            amountPerItem: 'many',
          },
        ],
      },
      {
        name: 'Паста Карбонара',
        price: 3200,
        description: 'Спагетти с беконом, сливками и пармезаном',
        additives: [
          {
            name: 'Яйцо',
            price: 100,
            amountPerItem: 'single',
          },
          {
            name: 'Грибы',
            price: 150,
            amountPerItem: 'single',
          },
        ],
      },
      {
        name: 'Салат Цезарь',
        price: 2800,
        description: 'Салат с курицей, пармезаном, крутонами и соусом Цезарь',
        additives: [
          {
            name: 'Анчоусы',
            price: 150,
            amountPerItem: 'single',
          },
        ],
      },
      {
        name: 'Панна Котта',
        price: 2100,
        description: 'Итальянский десерт из сливок с ягодным соусом',
        additives: [],
      },
      {
        name: 'Брускетта с томатами',
        price: 2300,
        description:
          'Поджаренный хлеб с томатами, базиликом и оливковым маслом',
        additives: [],
      },
    ],
  },
  {
    name: 'Green & Fit',
    description: 'Ресторан здорового питания с вегетарианскими блюдами',
    category: ['healthy', 'vegetarian'],
    dishes: [
      {
        name: 'Смузи боул с манго',
        price: 2400,
        description: 'Смузи боул с манго, гранолой и семенами чиа',
        additives: [
          {
            name: 'Миндаль',
            price: 100,
            amountPerItem: 'single',
          },
          {
            name: 'Кокосовые хлопья',
            price: 150,
            amountPerItem: 'single',
          },
        ],
      },
      {
        name: 'Салат с киноа и авокадо',
        price: 2700,
        description: 'Салат с киноа, авокадо, томатами и лимонной заправкой',
        additives: [],
      },
      {
        name: 'Зеленый детокс сок',
        price: 1800,
        description: 'Сок из яблока, шпината, огурца и сельдерея',
        additives: [],
      },
      {
        name: 'Овсяная каша с бананом',
        price: 2100,
        description: 'Овсяная каша с бананом, ягодами и медом',
        additives: [
          {
            name: 'Орехи',
            price: 150,
            amountPerItem: 'many',
          },
          {
            name: 'Корица',
            price: 50,
            amountPerItem: 'single',
          },
        ],
      },
      {
        name: 'Тост с авокадо и помидорами',
        price: 2500,
        description: 'Злаковый хлеб с авокадо, томатами и зеленью',
        additives: [
          {
            name: 'Лосось',
            price: 300,
            amountPerItem: 'single',
          },
          {
            name: 'Сыр фета',
            price: 200,
            amountPerItem: 'single',
          },
        ],
      },
    ],
  },
];
