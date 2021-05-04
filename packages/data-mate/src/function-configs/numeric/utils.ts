import { toFloatOrThrow } from '@terascope/utils';

export function runMathFn(
    fn: (num: number) => number,
    validate?: (num: number) => void
): (input: unknown) => number|null {
    return function _mathFn(input) {
        const num = toFloatOrThrow(input);
        validate && validate(num);

        const value = fn(num);
        if (value === Number.NEGATIVE_INFINITY || value === Number.POSITIVE_INFINITY) {
            return null;
        }
        return value;
    };
}
