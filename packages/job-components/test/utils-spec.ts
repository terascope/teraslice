import 'jest-extended';
import { waterfall } from '../src/utils';

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
});
