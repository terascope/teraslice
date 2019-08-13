import 'jest-extended';
import {
    withoutNil,
    includes,
} from '../src';

describe('Array Utils', () => {
    describe('withoutNil', () => {
        let input: any;
        let output: any;

        beforeEach(() => {
            input = {
                a: 1,
                b: null,
                c: 0,
                d: undefined,
                e: {
                    example: true,
                    other: null,
                }
            };

            output = withoutNil(input);
        });

        it('should copy the top level object', () => {
            expect(output).not.toBe(input);
        });

        it('should not copy a nested object', () => {
            expect(output.e).toBe(input.e);
        });

        it('should remove the nil values from the object', () => {
            expect(output).toHaveProperty('a', 1);
            expect(output).not.toHaveProperty('b');
            expect(output).toHaveProperty('c', 0);
            expect(output).not.toHaveProperty('d');
            expect(output).toHaveProperty('e', {
                example: true,
                other: null,
            });
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
        // @ts-ignore
        ])('should convert %j to be %j', (input: any, key: string, expected: boolean) => {
            expect(includes(input, key)).toEqual(expected);
        });
    });
});
