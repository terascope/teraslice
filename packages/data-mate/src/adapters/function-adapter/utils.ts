import { isNil, flatten } from '@terascope/core-utils';

/** This function is used to call a function on a value or recursively on a list/sub-list of values
 * This is more equivalent to ProcessMode.INDIVIDUAL_VALUES for the function adapter
*/

export function callValue<T>(
    fn: (input: unknown, index: number) => unknown,
    input: unknown | unknown[],
    preserveNulls: boolean,
    isValidator: boolean,
    index: number
): (T | null)[] {
    const results: (T | null)[] = [];

    if (Array.isArray(input)) {
        const mappedInput = flatten(
            input.map((newValue) => callValue(fn, newValue, preserveNulls, isValidator, index))
        );

        if (mappedInput.length) {
            results.push(...mappedInput as T[]);
        }
    } else if (isValidator) {
        // validating a nil value is useless, no reason to execute function
        if (!isNil(input) && fn(input, index)) {
            results.push(input as T);
        } else if (preserveNulls) {
            results.push(null);
        }
    } else {
        const newValue = fn(input, index);

        if (!isNil(newValue)) {
            results.push(newValue as T);
        } else if (preserveNulls) {
            results.push(null);
        }
    }

    return results;
}
