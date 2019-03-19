import 'jest-extended';
import {
    withoutNil,
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
});
