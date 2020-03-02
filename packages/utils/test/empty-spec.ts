import 'jest-extended';
import { isEmpty } from '../src/empty';

describe('Empty Utils', () => {
    describe('isEmpty', () => {
        const map = new Map();
        map.set('hello', 'hello');

        const set = new Set();
        set.add(1);

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
        ])('when given %p', (input, expected) => {
            it(`should return ${expected ? 'true' : 'false'}`, () => {
                expect(isEmpty(input)).toBe(expected);
            });
        });
    });
});
