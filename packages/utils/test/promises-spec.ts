import 'jest-extended';
import { waterfall, pRetry, TSError, PRetryConfig } from '../src';

describe('Utils', () => {
    describe('waterfall', () => {
        it('should call all methods and return the correct value', async () => {
            const queue = [
                jest.fn().mockResolvedValue('hello'),
                jest.fn().mockResolvedValue('hi'),
                jest.fn().mockResolvedValue('howdy'),
            ];

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
                retryable: false
            });

            const fn = jest.fn();
            fn.mockRejectedValueOnce(error);
            fn.mockResolvedValue('howdy');

            await expect(pRetry(fn, config)).rejects.toThrowError(error.message);

            expect(fn).toHaveBeenCalledTimes(1);
        });
    });
});
