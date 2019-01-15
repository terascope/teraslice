import 'jest-extended';
import { waterfall, pRetry, TSError } from '../src';

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
        it('should be able to resolve on the first try', async () => {
            const fn = jest.fn().mockResolvedValue('hello');

            expect(await pRetry(fn, 3, 10)).toEqual('hello');

            expect(fn).toHaveBeenCalledTimes(1);
        });

        it('should be able to resolve on the second try', async () => {
            const fn = jest.fn()
                .mockRejectedValueOnce(new Error('Uh oh'))
                .mockResolvedValue('hi');

            expect(await pRetry(fn, 3, 10)).toEqual('hi');

            expect(fn).toHaveBeenCalledTimes(2);
        });

        it('should be able to resolve on the third try', async () => {
            const fn = jest.fn()
                .mockRejectedValueOnce(new Error('Uh oh'))
                .mockRejectedValueOnce(new Error('Uh oh'))
                .mockResolvedValue('howdy');

            expect(await pRetry(fn, 3, 10)).toEqual('howdy');

            expect(fn).toHaveBeenCalledTimes(3);
        });

        it('should be able to reject on the fourth try', async () => {
            const fn = jest.fn()
                .mockRejectedValueOnce(new Error('Uh oh'))
                .mockRejectedValueOnce(new Error('Uh oh'))
                .mockRejectedValueOnce(new Error('Fail!'))
                .mockResolvedValue('howdy');

            await expect(pRetry(fn, 3, 10)).rejects.toThrowError('Fail!');

            expect(fn).toHaveBeenCalledTimes(3);
        });

        it('should end early with a FatalError', async () => {
            const error = new TSError('Fatal Error', {
                fatalError: true,
            });

            const fn = jest.fn()
                .mockRejectedValueOnce(error)
                .mockResolvedValue('howdy');

            await expect(pRetry(fn, 3, 10)).rejects.toThrowError(error.message);

            expect(fn).toHaveBeenCalledTimes(1);
        });

        it('should end early with a StopError', async () => {
            const error = new Error('Stop Error');
            // @ts-ignore
            error.stop = true;

            const fn = jest.fn()
                .mockRejectedValueOnce(error)
                .mockResolvedValue('howdy');

            await expect(pRetry(fn, 3, 10)).rejects.toThrowError(error.message);

            expect(fn).toHaveBeenCalledTimes(1);
        });
    });
});
