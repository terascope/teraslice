import 'jest-extended';
import { TSError } from '../src/errors';
import {
    waterfall, pWhile, pRetry, PRetryConfig, getBackoffDelay, PWhileOptions, pMap, pDelay
} from '../src/promises';

describe('Utils', () => {
    describe('waterfall', () => {
        it('should call all methods and return the correct value', async () => {
            const queue = [jest.fn().mockResolvedValue('hello'), jest.fn().mockResolvedValue('hi'), jest.fn().mockResolvedValue('howdy')];

            const result = await waterfall('greetings', queue);
            expect(result).toEqual('howdy');

            expect(queue[0]).toHaveBeenCalledWith('greetings');
            expect(queue[1]).toHaveBeenCalledWith('hello');
            expect(queue[2]).toHaveBeenCalledWith('hi');
        });

        it('should handle errors correctly', async () => {
            const queue = [
                jest.fn().mockResolvedValue('hello'),
                jest.fn().mockRejectedValue(new Error('Uh oh!')),
                jest.fn().mockResolvedValue('howdy'),
            ];

            try {
                const results = await waterfall('greetings', queue);
                expect(results).fail('Should not get here');
            } catch (err) {
                expect(err).toBeInstanceOf(Error);
                expect(err.message).toEqual('Uh oh!');
            }

            expect(queue[0]).toHaveBeenCalledWith('greetings');
            expect(queue[1]).toHaveBeenCalledWith('hello');
            expect(queue[2]).not.toHaveBeenCalled();
        });
    });

    describe('pRetry', () => {
        const config: Partial<PRetryConfig> = {
            retries: 3,
            delay: 10,
        };

        it('should be able to resolve on the first try', async () => {
            const fn = jest.fn().mockResolvedValue('hello');

            expect(await pRetry(fn, config)).toEqual('hello');

            expect(fn).toHaveBeenCalledTimes(1);
        });

        it('should be able to resolve on the second try', async () => {
            const fn = jest.fn();
            fn.mockRejectedValueOnce(new Error('Uh oh'));
            fn.mockResolvedValue('hi');

            expect(await pRetry(fn, config)).toEqual('hi');

            expect(fn).toHaveBeenCalledTimes(2);
        });

        it('should be able to resolve on the third try', async () => {
            const fn = jest.fn();
            fn.mockRejectedValueOnce(new Error('Uh oh'));
            fn.mockRejectedValueOnce(new Error('Uh oh'));
            fn.mockResolvedValue('howdy');

            expect(await pRetry(fn, config)).toEqual('howdy');

            expect(fn).toHaveBeenCalledTimes(3);
        });

        it('should be able to reject on the fourth try', async () => {
            const fn = jest.fn();
            fn.mockRejectedValueOnce(new Error('Uh oh'));
            fn.mockRejectedValueOnce(new Error('Uh oh'));
            fn.mockRejectedValueOnce(new Error('Fail!'));
            fn.mockResolvedValue('howdy');

            await expect(pRetry(fn, config)).rejects.toThrowError('Fail!');

            expect(fn).toHaveBeenCalledTimes(3);
        });

        it('should end early with a FatalError', async () => {
            const error = new TSError('Fatal Error', {
                fatalError: true,
            });

            const fn = jest.fn();
            fn.mockRejectedValueOnce(error);
            fn.mockResolvedValue('howdy');

            await expect(pRetry(fn, config)).rejects.toThrowError(error.message);

            expect(fn).toHaveBeenCalledTimes(1);
        });

        it('should end early with a StopError', async () => {
            const error = new TSError('Stop Error', {
                retryable: false,
            });

            const fn = jest.fn();
            fn.mockRejectedValueOnce(error);
            fn.mockResolvedValue('howdy');

            await expect(pRetry(fn, config)).rejects.toThrowError(error.message);

            expect(fn).toHaveBeenCalledTimes(1);
        });
    });

    describe('getBackoffDelay', () => {
        const factor = 2;
        const max = 1000;
        const min = 50;

        it('should be able to work with the min delay', () => {
            const jitter = 50;

            const input = min;
            const result = getBackoffDelay(input, factor, max, min);

            expect(result).toBeWithin(input - jitter, input * factor + jitter);
            expect(result).toBeGreaterThanOrEqual(min);
            expect(result).toBeLessThanOrEqual(max);
        });

        it('should be able to work with a value below min', () => {
            const input = min - 100;
            const result = getBackoffDelay(input, factor, max, min);

            expect(result).toBeGreaterThanOrEqual(min);
            expect(result).toBeLessThanOrEqual(max);
        });

        it('should be able to work with a valid delay', () => {
            const jitter = 100;

            const input = 150;
            const result = getBackoffDelay(input, factor, max, min);

            expect(result).toBeWithin(input - jitter, input * factor + jitter);
            expect(result).toBeGreaterThanOrEqual(min);
            expect(result).toBeLessThanOrEqual(max);
        });

        it('should be able to work with the max delay', () => {
            const input = max;
            const result = getBackoffDelay(input, factor, max, min);

            expect(result).toEqual(max);
        });

        it('should be able to work with a value above max delay', () => {
            const input = max + 100;
            const result = getBackoffDelay(input, factor, max, min);

            expect(result).toEqual(max);
        });
    });

    describe('pWhile', () => {
        const defaultOptions: PWhileOptions = {
            timeoutMs: 100,
            enabledJitter: true,
        };

        it('should run until it returns true on first attempt', async () => {
            await pWhile(async () => true, defaultOptions);
        });

        it('should run until it returns true on second attempt', async () => {
            let i = 0;
            await pWhile(async () => (i++ > 0), defaultOptions);
        });

        it('should run until throws an error', async () => {
            const fn = async () => {
                throw new Error('Uh oh');
            };
            return expect(pWhile(fn, defaultOptions)).rejects.toThrow('Uh oh');
        });

        it('should run until it times out', async () => expect(pWhile(async () => false, defaultOptions)).rejects.toThrow(/Request timeout after \d+(ms|sec) while waiting/));
    });

    describe('pMap', () => {
        it('should be able to work without concurrency', () => {
            const items: { int: number }[] = [{ int: 1 }, { int: 3 }];
            return expect(pMap(items, (item) => {
                item.int++;
                return item;
            })).resolves.toEqual([
                { int: 2 }, { int: 4 }
            ]);
        });

        it('should be able to work with a concurrency of 1', async () => {
            const items: number[] = [1, 2, 3];
            const start = Date.now();
            const concurrency = 1;
            const wait = 300;

            const result = pMap(items, async (item, i) => {
                const diff = Date.now() - start;
                if (i % concurrency === 0) {
                    await pDelay(wait);
                }
                return Math.floor(diff / wait) * wait;
            }, {
                concurrency
            });
            return expect(result).resolves.toEqual([
                0, 300, 600
            ]);
        });

        it('should be able to work with a concurrency of 2', async () => {
            const items: number[] = [1, 2, 3, 4, 5];
            const start = Date.now();
            const concurrency = 2;
            const wait = 300;

            const result = pMap(items, async (item, i) => {
                const diff = Date.now() - start;
                if (i % concurrency === 0) {
                    await pDelay(wait);
                }
                return Math.floor(diff / wait) * wait;
            }, {
                concurrency
            });
            return expect(result).resolves.toEqual([
                0, 0, 300, 300, 600
            ]);
        });
    });
});
