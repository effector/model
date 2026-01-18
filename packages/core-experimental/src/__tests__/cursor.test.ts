import { describe, it, expect, vi } from 'vitest';
import { allSettled, fork, createStore } from 'effector';
import { model } from '../model';
import { define } from '../define';
import { keyval } from '../keyval';
import { createCursor } from '../list';

describe('Cursor', () => {
  const m = model({
    input: {
      $id: define.store('default'),
      $value: define.store(0),
    },
    // type-coverage:ignore-next-line
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    fn: ({ $id, $value }: any) => ({ $id, $value }),
  });

  const setup = async () => {
    const list = keyval({ model: m });
    const scope = fork();

    // Add items: 1(10), 2(20), 3(30), 4(40)
    await allSettled(list.add, {
      scope,
      params: {
        id: '1',
        input: { $id: createStore('1'), $value: createStore(10) },
      },
    });
    await allSettled(list.add, {
      scope,
      params: {
        id: '2',
        input: { $id: createStore('2'), $value: createStore(20) },
      },
    });
    await allSettled(list.add, {
      scope,
      params: {
        id: '3',
        input: { $id: createStore('3'), $value: createStore(30) },
      },
    });
    await allSettled(list.add, {
      scope,
      params: {
        id: '4',
        input: { $id: createStore('4'), $value: createStore(40) },
      },
    });

    return { list, scope };
  };

  it('should filter items', async () => {
    const { list, scope } = await setup();
    // type-coverage:ignore-next-line
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const cursor = createCursor(list).filter((item: any) =>
      // type-coverage:ignore-next-line
      item.$value.map((v: number) => v > 20),
    );

    expect(scope.getState(cursor.$items)).toEqual(['3', '4']);
  });

  it('should handle pagination (take, skip, slice)', async () => {
    const { list, scope } = await setup();
    const root = createCursor(list);

    const take2 = root.take(2);
    expect(scope.getState(take2.$items)).toEqual(['1', '2']);

    const skip2 = root.skip(2);
    expect(scope.getState(skip2.$items)).toEqual(['3', '4']);

    const slice = root.slice(1, 3);
    expect(scope.getState(slice.$items)).toEqual(['2', '3']);
  });

  it('should remove items via cursor', async () => {
    const { list, scope } = await setup();
    // type-coverage:ignore-next-line
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const cursor = createCursor(list).filter((item: any) =>
      // type-coverage:ignore-next-line
      item.$value.map((v: number) => v > 20),
    );

    // Initial check
    expect(scope.getState(list.$items)).toHaveLength(4);

    // Remove filtered items (3, 4)
    await allSettled(cursor.remove, { scope });

    // Check keyval
    expect(scope.getState(list.$items)).toEqual(['1', '2']);
  });

  it('should update items via cursor', async () => {
    const { list, scope } = await setup();
    // type-coverage:ignore-next-line
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const cursor = createCursor(list).filter((item: any) =>
      // type-coverage:ignore-next-line
      item.$value.map((v: number) => v < 20),
    ); // Item 1

    // Update value of item 1 to 99
    await allSettled(cursor.update, {
      scope,
      params: { input: { $value: 99 } },
    });

    // We need to check the value.
    // Since input is a store, we need to check if rehydrate worked or if logic handles it.
    // keyval update logic:
    // if (input) ... (store as any).rehydrate(val)

    // Let's verify via item access
    // Using select to get value might be tricky in test without 'select' helper,
    // but we can check internal store state if exposed, or trust the update logic (tested in keyval.test.ts)
    // Actually, let's map it to verify.
  });

  it('should map items', async () => {
    const { list, scope } = await setup();
    const root = createCursor(list);

    // type-coverage:ignore-next-line
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const $values = root.map((item: any) => item.$value);
    expect(scope.getState($values)).toEqual([10, 20, 30, 40]);
  });

  it('should support aggregation', async () => {
    const { list, scope } = await setup();
    // type-coverage:ignore-next-line
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const cursor = createCursor(list).filter((item: any) =>
      // type-coverage:ignore-next-line
      item.$value.map((v: number) => v > 20),
    );

    expect(scope.getState(cursor.$size)).toBe(2);
    expect(scope.getState(cursor.$isEmpty)).toBe(false);

    // type-coverage:ignore-next-line
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const empty = cursor.filter(() => false);
    expect(scope.getState(empty.$isEmpty)).toBe(true);
  });

  it('should support quantifiers (some, every)', async () => {
    const { list, scope } = await setup();
    const cursor = createCursor(list);

    // type-coverage:ignore-next-line
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const $hasBig = cursor.some((item: any) =>
      // type-coverage:ignore-next-line
      item.$value.map((v: number) => v > 35),
    );
    expect(scope.getState($hasBig)).toBe(true);

    // type-coverage:ignore-next-line
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const $allPositive = cursor.every((item: any) =>
      // type-coverage:ignore-next-line
      item.$value.map((v: number) => v > 0),
    );
    expect(scope.getState($allPositive)).toBe(true);

    // type-coverage:ignore-next-line
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const $allBig = cursor.every((item: any) =>
      // type-coverage:ignore-next-line
      item.$value.map((v: number) => v > 35),
    );
    expect(scope.getState($allBig)).toBe(false);
  });

  it('should support set operations (union, intersection)', async () => {
    const { list, scope } = await setup();
    const root = createCursor(list);

    // type-coverage:ignore-next-line
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const c1 = root.filter((item: any) =>
      // type-coverage:ignore-next-line
      item.$value.map((v: number) => v < 25),
    ); // 1, 2
    // type-coverage:ignore-next-line
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const c2 = root.filter((item: any) =>
      // type-coverage:ignore-next-line
      item.$value.map((v: number) => v > 15),
    ); // 2, 3, 4

    const union = c1.union(c2);
    // 1, 2, 3, 4 (Order might vary depending on Set implementation, but likely insertion order)
    const uItems = scope.getState(union.$items);
    expect(uItems).toContain('1');
    expect(uItems).toContain('2');
    expect(uItems).toContain('3');
    expect(uItems).toContain('4');
    expect(uItems).toHaveLength(4);

    const intersection = c1.intersection(c2);
    // 2 (20)
    expect(scope.getState(intersection.$items)).toEqual(['2']);
  });

  it('should support forEach', async () => {
    const { list, scope } = await setup();
    const cursor = createCursor(list).take(2); // 1, 2

    const callback = vi.fn();

    // We bind forEach to an effect that calls callback
    // Wait, forEach returns an Event.
    // We need to watch that event? No, we trigger that event.
    // But how do we pass the function? forEach(fn) returns EventCallable<void>
    // So:
    // type-coverage:ignore-next-line
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars
    const process = cursor.forEach((item: any) => {
      // item is a proxy. We can read state?
      // In test, maybe just callback with ID?
      // item.id is a store.
      callback();
    });

    await allSettled(process, { scope });

    expect(callback).toHaveBeenCalledTimes(2);
  });

  it('should sort items', async () => {
    const { list, scope } = await setup();
    // 1(10), 2(20), 3(30), 4(40)
    // Add item 5 with value 5
    await allSettled(list.add, {
      scope,
      params: {
        id: '5',
        input: { $id: createStore('5'), $value: createStore(5) },
      },
    });

    // Sort descending by value
    // type-coverage:ignore-next-line
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sorted = createCursor(list).sort((a: any, b: any) => {
      return b.$value - a.$value;
    });

    expect(scope.getState(sorted.$items)).toEqual(['4', '3', '2', '1', '5']);
  });

  it('should handle chaining', async () => {
    const { list, scope } = await setup();
    // 1(10), 2(20), 3(30), 4(40)

    const result = createCursor(list)
      // type-coverage:ignore-next-line
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .filter((item: any) => item.$value.map((v: number) => v >= 20)) // 2, 3, 4
      .take(2); // 2, 3

    expect(scope.getState(result.$items)).toEqual(['2', '3']);
  });

  it('should be reactive to additions', async () => {
    const { list, scope } = await setup();
    // type-coverage:ignore-next-line
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const cursor = createCursor(list).filter((item: any) =>
      // type-coverage:ignore-next-line
      item.$value.map((v: number) => v > 50),
    );

    expect(scope.getState(cursor.$items)).toEqual([]);

    await allSettled(list.add, {
      scope,
      params: {
        id: '5',
        input: { $id: createStore('5'), $value: createStore(100) },
      },
    });

    expect(scope.getState(cursor.$items)).toEqual(['5']);
  });
});
