import {
    isNil,
    flatten
} from '@terascope/utils';

export function callValue(
    fn:(input: unknown) => unknown,
    input: unknown| unknown[],
    preserveNulls: boolean,
    isValidator = false
): unknown[] {
    const results: unknown[] = [];

    if (Array.isArray(input)) {
        const mappedInput = flatten(
            input.map((newValue) => callValue(fn, newValue, preserveNulls, isValidator))
        );

        if (mappedInput.length) {
            results.push(...mappedInput);
        }
    } else if (isValidator) {
        if (!isNil(input) && fn(input)) {
            results.push(input);
        } else if (preserveNulls) {
            results.push(null);
        }
    } else {
        const newValue = fn(input);

        if (!isNil(newValue)) {
            results.push(newValue);
        } else if (preserveNulls) {
            results.push(null);
        }
    }

    return results;
}
