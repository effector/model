import { expect, test, describe } from 'vitest';
import { model, keyval, define } from '@effector/model';

test.skip('support nested keyval', () => {
  const entities = keyval({
    key: 'id',
    props: {
      id: define.store<string>(),
    },
    create() {
      const childs = keyval({
        key: 'id',
        props: {
          id: define.store<string>(),
          count: define.store<number>(),
        },
        create() {
          return {};
        },
      });
      return { childs };
    },
  });
  const data = [
    {
      id: 'foo',
      childs: [
        { id: 'foo1', count: 0 },
        { id: 'foo2', count: 0 },
      ],
    },
    {
      id: 'bar',
      childs: [
        { id: 'bar1', count: 0 },
        { id: 'bar2', count: 0 },
      ],
    },
  ];
  entities.edit.add(data);
});
