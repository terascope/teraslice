import 'jest-extended';
import {
    uniqBy,
    includes,
} from '../src';

describe('Array Utils', () => {
    describe('uniqBy', () => {
        it('should be able to remove the uniq values by path', () => {
            const input = [{ a: 1 }, { a: 2 }, { a: 1 }];
            expect(uniqBy(input, 'a')).toStrictEqual([
                { a: 1, },
                { a: 2, },
            ]);
        });

        it('should be able to remove the uniq values by function', () => {
            const input = [{ a: 2 }, { a: 2 }, { a: 1 }];
            expect(uniqBy(input, (obj) => obj.a + 1)).toStrictEqual([
                { a: 2, },
                { a: 1, },
            ]);
        });
    });

    describe('includes', () => {
        test.each([
            [['hello'], 'hello', true],
            [['foo'], 'bar', false],
            [new Set<string>().add('hello'), 'hello', true],
            [new Set<string>().add('foo'), 'bar', false],
            [{ hello: true }, 'hello', true],
            [{ foo: true }, 'bar', false],
            [new Map<string, boolean>().set('hello', true), 'hello', true],
            [new Map<string, boolean>().set('foo', true), 'bar', false],
            [null, 'uhoh', false],
            ['hello', 'hello', true],
            ['foo', 'bar', false],
        ])('should convert %j to be %j', (input: any, key: string, expected: boolean) => {
            expect(includes(input, key)).toStrictEqual(expected);
        });
    });
});
