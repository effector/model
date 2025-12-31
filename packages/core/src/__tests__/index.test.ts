import { describe, test } from 'vitest';
import { model } from '../model';
import { define } from '../define';
import { keyval } from '../keyval';
import { relation } from '../relation';

describe('index', () => {
    test('first', async () => {
        const dialogModel = model({
            $visible: define.store(false),
            $params: define.store<object | null>(null),

            open: define.event<object>(),
            opened: define.event<object>(),

            close: define.event(),
            closed: define.event(),
        });

        const dialogs = keyval({
            model: dialogModel,
            fn: ({ $visible, $params, open, opened, close, closed }) => {
                relation({
                    clock: open,
                    target: [opened, $params],
                });
                relation({
                    clock: close,
                    fn: () => null,
                    target: [closed, $params],
                });

                relation({
                    clock: opened,
                    fn: () => true,
                    target: $visible,
                });

                relation({
                    clock: closed,
                    fn: () => false,
                    target: $visible,
                });
            }
        });

        dialogs.__.factory?.();
    });
});