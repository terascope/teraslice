import 'jest-extended';
import { EventLoop } from '../src/index.js';

describe('EventLoop', () => {
    describe('#wait', () => {
        it('should be a function', async () => {
            expect(await EventLoop.wait()).toBeNil();
        });
    });
});
