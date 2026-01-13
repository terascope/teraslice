import 'jest-extended';
import { once, memoize } from '../src/functions.js';
import { times, random } from '../src/index.js';

describe('Function Utils', () => {
    describe('once', () => {
        it('should only be allowed to be called once', () => {
            const fn = once((a: number, b: number) => a + b);
            expect(fn(1, 2)).toEqual(3);
            expect(fn(10, 2)).toBeUndefined();
        });
    });

    describe('memoize', () => {
        it('should handle no args', () => {
            const fn = memoize((_arg?: undefined): number => random(0, 1000000000));

            const result = fn();
            expect(result).toBeNumber();
            expect(fn()).toBe(result);
            expect(fn(undefined)).toBe(result);
        });

        it('should handle one arg', () => {
            const fn = memoize((input: any, _arg?: undefined) => input);

            const a1 = { a: 1 };
            const a2 = { a: 2 };

            expect(fn(a1)).toBe(a1);
            expect(fn(a1)).toEqual(a1);

            expect(fn({ a: 1 })).toBe(a1);
            expect(fn({ a: 1 }, undefined)).toBe(a1);
            expect(fn(a1)).toBe(a1);
            expect(fn(a1, undefined)).toBe(a1);

            expect(fn(a2)).toBe(a2);
            expect(fn(a2)).toEqual(a2);
            expect(fn(a2, undefined)).toBe(a2);
        });

        it('should handle multiple args', () => {
            const fn = memoize((...args: (number | undefined)[]): number[] => times(
                args.reduce(
                    (c = 0, n = 0) => c + n,
                    0
                )!
            ));

            const result1 = fn(5, 5);
            const result2 = fn(5, 5, 5);
            expect(result1).toEqual(times(10));
            expect(result2).toEqual(times(15));

            expect(fn(5, 5)).toBe(result1);
            expect(fn(5, 5, undefined)).toBe(result1);
            expect(fn(5, 5, 5)).toBe(result2);
            expect(result2).not.toBe(result1);
        });
    });
});
