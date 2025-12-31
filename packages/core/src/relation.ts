import { sample, Unit } from "effector";

let isKeyvalCtx = false;

function createReplacer() {
    type Subscriber = (unit: Unit<any>) => Unit<any> | null;

    let subscriptions: Subscriber[] = [];

    return {
        subscribe(subscriber: Subscriber) {
            subscriptions.push(subscriber);

            return {
                unsubscribe() {
                    subscriptions = subscriptions.filter(s => s !== subscriber);
                }
            }
        },

        tryReplace(unit: Unit<any>) {
            const lastSubscriber = subscriptions.at(-1);

            if (lastSubscriber) {
                return lastSubscriber(unit) ?? unit;
            }

            return unit;
        }
    }
}

export const unitReplacer = createReplacer();

export const withKeyvalCtx = <T extends (...args: any[]) => any>(handler: T): ReturnType<T> => {
    isKeyvalCtx = true;

    const result = handler();

    isKeyvalCtx = false;

    return result;
}

// @ts-expect-error
export const relation: typeof sample = (config) => {
    const sampleConfig = { ...config };

    if (isKeyvalCtx) {
        if ('clock' in sampleConfig) {
            // @ts-expect-error
            sampleConfig.clock = unitReplacer.tryReplace(sampleConfig.clock);
        }

        if ('source' in sampleConfig) {
            // @ts-expect-error
            sampleConfig.source = unitReplacer.tryReplace(sampleConfig.source);
        }

        if ('target' in sampleConfig) {
            // @ts-expect-error
            sampleConfig.target = unitReplacer.tryReplace(sampleConfig.target);
        }
    }

    // @ts-expect-error
    return sample(sampleConfig);
}