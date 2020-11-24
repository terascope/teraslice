/**
 * Verify that two values are the same (uses a reference check)
*/
export function isEqual<T>(value: T, input: unknown): input is T {
    return value === input || Object.is(value, input);
}

/**
 * A functional version of isEqual
*/
export function isEqualFP<T>(value: T): (input: unknown) => input is T {
    return isEqual.bind(isEqual, value) as (input: unknown) => input is T;
}
