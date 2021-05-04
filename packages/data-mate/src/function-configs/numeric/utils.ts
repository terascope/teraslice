import { toFloatOrThrow } from '@terascope/utils';

export function runMathFn(
    fn: (num: number) => number,
): (input: unknown) => number|null {
    return function _mathFn(input) {
        const num = toFloatOrThrow(input);

        const value = fn(num);
        if (value === Number.NEGATIVE_INFINITY
            || value === Number.POSITIVE_INFINITY
            || Number.isNaN(value)) {
            return null;
        }
        return value;
    };
}
