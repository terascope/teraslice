import 'jest-extended';
import { jest } from '@jest/globals';
import { TSError } from '../src/errors.js';
import {
    waterfall, pWhile, pRetry, PRetryConfig,
    getBackoffDelay, PWhileOptions
} from '../src/promises.js';

describe('Utils', () => {
    describe('waterfall', () => {
        it('should call all methods and return the correct value', async () => {
            // @ts-expect-error
            const queue = [jest.fn().mockResolvedValue('hello'), jest.fn().mockResolvedValue('hi'), jest.fn().mockResolvedValue('howdy')] as any[];

            const result = await waterfall('greetings', queue);
            expect(result).toEqual('howdy');

            expect(queue[0]).toHaveBeenCalledWith('greetings');
            expect(queue[1]).toHaveBeenCalledWith('hello');
            expect(queue[2]).toHaveBeenCalledWith('hi');
        });

        it('should handle errors correctly', async () => {
            const queue = [
                jest.fn<() => Promise<string>>().mockResolvedValue('hello'),
                jest.fn<() => Promise<Error>>().mockRejectedValue(new Error('Uh oh!')),
                jest.fn<() => Promise<string>>().mockResolvedValue('howdy'),
            ] as any[];

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
            const fn = jest.fn<() => Promise<string>>().mockResolvedValue('hello');
            expect(await pRetry(fn, config)).toEqual('hello');

            expect(fn).toHaveBeenCalledTimes(1);
        });

        it('should be able to resolve on the second try', async () => {
            const fn = jest.fn<() => Promise<any>>();
            fn.mockRejectedValueOnce(new Error('Uh oh'));
            fn.mockResolvedValue('hi');

            expect(await pRetry(fn, config)).toEqual('hi');

            expect(fn).toHaveBeenCalledTimes(2);
        });

        it('should be able to resolve on the third try', async () => {
            const fn = jest.fn<() => Promise<any>>();
            fn.mockRejectedValueOnce(new Error('Uh oh'));
            fn.mockRejectedValueOnce(new Error('Uh oh'));
            fn.mockResolvedValue('howdy');

            expect(await pRetry(fn, config)).toEqual('howdy');

            expect(fn).toHaveBeenCalledTimes(3);
        });

        it('should be able to reject on the fourth try', async () => {
            const fn = jest.fn<() => Promise<any>>();
            fn.mockRejectedValueOnce(new Error('Uh oh'));
            fn.mockRejectedValueOnce(new Error('Uh oh'));
            fn.mockRejectedValueOnce(new Error('Fail!'));
            fn.mockResolvedValue('howdy');

            await expect(pRetry(fn, config)).rejects.toThrow('Fail!');

            expect(fn).toHaveBeenCalledTimes(3);
        });

        it('should end early with a FatalError', async () => {
            const error = new TSError('Fatal Error', {
                fatalError: true,
            });

            const fn = jest.fn<() => Promise<any>>();
            fn.mockRejectedValueOnce(error);
            fn.mockResolvedValue('howdy');

            await expect(pRetry(fn, config)).rejects.toThrow(error.message);

            expect(fn).toHaveBeenCalledTimes(1);
        });

        it('should end early with a StopError', async () => {
            const error = new TSError('Stop Error', {
                retryable: false,
            });

            const fn = jest.fn<() => Promise<any>>();
            fn.mockRejectedValueOnce(error);
            fn.mockResolvedValue('howdy');

            await expect(pRetry(fn, config)).rejects.toThrow(error.message);

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
            timeoutMs: 200,
            enabledJitter: true,
            minJitter: 50
        };

        it('should run until it returns true on first attempt', async () => {
            await pWhile(async () => true, defaultOptions);

            // testing that it does not hand
            expect(true).toBeTrue();
        });

        it('should run until it returns true on second attempt', async () => {
            let i = 0;
            await pWhile(async () => (i++ > 0), defaultOptions);

            // testing that it does not hand
            expect(true).toBeTrue();
        });

        it('should run until throws an error', async () => {
            const fn = async () => {
                throw new Error('Uh oh');
            };
            await expect(pWhile(fn, defaultOptions)).rejects.toThrow('Uh oh');
        });

        it('should run until it times out', async () => {
            await expect(pWhile(async () => false, defaultOptions)).rejects.toThrow(/Request timeout after/);
        });
    });
});
