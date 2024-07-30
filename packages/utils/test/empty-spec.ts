import 'jest-extended';
import { timesIter } from '../src/index.js';
import { isEmpty } from '../src/empty.js';

describe('Empty Utils', () => {
    describe('isEmpty', () => {
        const map = new Map();
        map.set('hello', 'hello');

        const set = new Set();
        set.add(1);

        async function* asyncIterator(num: number): AsyncIterable<number> {
            yield num;
        }

        describe.each([
            [null, true],
            [undefined, true],
            [{}, true],
            [false, true],
            [true, true],
            [-1, true],
            [0, true],
            [1, true],
            [[], true],
            ['', true],
            [new Map(), true],
            [new Set(), true],
            [{ hi: true }, false],
            [map, false],
            [set, false],
            [[1, 2], false],
            [[null], false],
            ['howdy', false],
            [timesIter(1), false],
            [asyncIterator(1), false]
        ])('when given %p', (input, expected) => {
            it(`should return ${expected ? 'true' : 'false'}`, () => {
                expect(isEmpty(input)).toBe(expected);
            });
        });
    });
});
