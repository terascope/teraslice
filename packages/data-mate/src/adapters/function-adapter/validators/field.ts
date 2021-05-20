import {
    isObjectEntity,
    get,
    set,
    isNotNil,
    cloneDeep,
    isNil,
    unset
} from '@terascope/utils';
import { callValue } from '../utils';

export function fieldValidationColumnExecution(
    fn: (input: unknown) => unknown,
    preserveNulls: boolean
) {
    return function _fieldValidationColumnExecution(
        input: unknown[]
    ): (unknown|null)[] {
        if (!Array.isArray(input)) {
            throw new Error('Invalid input, expected an array of values');
        }

        const results: (unknown | null)[] = [];

        for (const value of input) {
            if (Array.isArray(value)) {
                const fieldList = callValue(fn, value, preserveNulls, true);

                if (fieldList.length > 0) {
                    results.push(fieldList);
                } else if (preserveNulls) {
                    results.push(null);
                }
            } else if (isNotNil(value) && fn(value)) {
                results.push(...callValue(fn, value, preserveNulls, true));
            } else if (preserveNulls) {
                results.push(null);
            }
        }

        return results;
    };
}

export function wholeFieldValidationColumnExecution(
    fn: (input: unknown) => unknown,
) {
    return function _fieldValidationColumnExecution(
        input: unknown[]
    ): unknown[] {
        return input.map((value) => (fn(value) ? value : null));
    };
}

export function wholeFieldValidationRowExecution<T extends Record<string, any>>(
    fn: (input: unknown) => unknown,
    preserveNulls: boolean,
    preserveEmptyObjects: boolean,
    field?: string
): (input: T[]) => T[] {
    return function _wholeFieldValidationRowExecution(
        input: T[]
    ): T[] {
        if (isNil(field)) throw new Error('Must provide a field option when running a row');
        if (!Array.isArray(input)) {
            throw new Error('Invalid input, expected an array of objects');
        }

        const results = [];

        for (const record of input) {
            const clone = cloneDeep(record);

            if (!isObjectEntity(record)) {
                throw new Error(`Invalid record ${JSON.stringify(record)}, expected an array of simple objects or data-entities`);
            }

            const value = get(clone, field);
            const isValid = fn(value);
            // if it fails validation and we keep null
            if (!isValid && preserveNulls) {
                set(clone, field, null);
                results.push(clone);
            } else if (!isValid) {
                // remove key, check if empty record
                unset(clone, field);
                // if we preserve empty objects, we don't need to check anything
                if (preserveEmptyObjects) {
                    results.push(clone);
                } else {
                    const hasKeys = Object.keys(clone).length !== 0;
                    if (hasKeys) {
                        results.push(clone);
                    }
                }
            } else {
                results.push(clone);
            }
        }

        return results;
    };
}

export function fieldValidationRowExecution<T extends Record<string, any>>(
    fn: (input: unknown) => unknown,
    preserveNulls: boolean,
    preserveEmptyObjects: boolean,
    field?: string
): (input: T[]) => T[] {
    return function _wholeFieldValidationRowExecution(
        input: T[]
    ): T[] {
        if (isNil(field)) throw new Error('Must provide a field option when running a row');
        if (!Array.isArray(input)) {
            throw new Error('Invalid input, expected an array of objects');
        }

        const results: T[] = [];

        for (const record of input) {
            const clone = cloneDeep(record);

            if (!isObjectEntity(record)) {
                throw new Error(`Invalid record ${JSON.stringify(record)}, expected an array of simple objects or data-entities`);
            }

            const value: unknown = get(clone, field);

            if (Array.isArray(value)) {
                const fieldList = callValue(fn, value, preserveNulls, true);

                // we have results in list or we don't care if its an empty list here
                if (fieldList.length > 0) {
                    set(clone, field, fieldList);
                    results.push(clone);
                } else {
                    unset(clone, field);

                    if (preserveEmptyObjects) {
                        results.push(clone);
                    } else {
                        const hasKeys = Object.keys(clone).length !== 0;
                        if (hasKeys) {
                            results.push(clone);
                        }
                    }
                }
            } else {
                const isValid = fn(value as T);
                // if it fails validation and we keep null
                if (!isValid && preserveNulls) {
                    set(clone, field, null);
                    results.push(clone);
                } else if (!isValid) {
                    // remove key, check if empty record
                    unset(clone, field);
                    // if we preserve empty objects, we don't need to check anything
                    if (preserveEmptyObjects) {
                        results.push(clone);
                    } else {
                        const hasKeys = Object.keys(clone).length !== 0;
                        if (hasKeys) {
                            results.push(clone);
                        }
                    }
                } else {
                    results.push(clone);
                }
            }
        }

        return results;
    };
}
