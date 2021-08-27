import 'jest-extended';
import { EventLoop } from '../src';

describe('EventLoop', () => {
    describe('#getDelay', () => {
        const testCases: [checkedInDiff: number, expected: number][] = [
            [-19, 0],
            [0, 0],
            [100, 0],
            [500, 0],
            [EventLoop.DEFAULT_HEARTBEAT, 0],
            [EventLoop.DEFAULT_HEARTBEAT + 200, 200],
            [EventLoop.DEFAULT_HEARTBEAT + 500, 500],
            [EventLoop.DEFAULT_HEARTBEAT + 3500, 500],
            [60_000 * 55, 500],
        ];
        test.each(testCases)('when given a checked in diff of %p', (checkedInDiff, expected) => {
            expect(EventLoop.getDelay(checkedInDiff)).toEqual(expected);
        });
    });
});
