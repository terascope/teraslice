import {
    isNil,
    flatten
} from '@terascope/utils';

/** This function is used to call a function on a value or recursively on a list/sub-list of values
 * This is more equivalent to ProcessMode.INDIVIDUAL_VALUES for the function adapter
*/

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
        // validating a nil value is useless, no reason to execute function
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
