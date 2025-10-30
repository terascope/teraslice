import { toFloatOrThrow } from '@terascope/core-utils';

export function runMathFn<T extends(num: number, ...args: number[]) => number>(
    fn: T,
    ...extra: number[]): (input: unknown) => number | null {
    return function _mathFn(input) {
        const num = toFloatOrThrow(input);

        const value = fn(num, ...extra);
        if (value === Number.NEGATIVE_INFINITY
            || value === Number.POSITIVE_INFINITY
            || Number.isNaN(value)) {
            return null;
        }
        return value;
    };
}
