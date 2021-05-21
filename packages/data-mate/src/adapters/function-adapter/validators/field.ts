import {
    isObjectEntity,
    get,
    set,
    isNotNil,
    cloneDeep,
    isNil,
    unset
} from '@terascope/utils';
import { FieldValidateConfig } from '../../../function-configs/interfaces';
import { callValue } from '../utils';
import { PartialArgs } from '../interfaces';

export function fieldValidationColumnExecution<T extends Record<string, any>>(
    fnDef: FieldValidateConfig<T>,
    configs: PartialArgs<T>,
    preserveNulls: boolean
) {
    return function _fieldValidationColumnExecution(
        input: unknown[],
    ): (unknown|null)[] {
        if (!Array.isArray(input)) {
            throw new Error('Invalid input, expected an array of values');
        }

        const results: (unknown | null)[] = [];

        const fn = fnDef.create({
            ...configs,
            ctx: input
        });

        for (let i = 0; i < input.length; i++) {
            const value = input[i];

            if (Array.isArray(value)) {
                const fieldList = callValue(fn, value, preserveNulls, true, i);

                if (fieldList.length > 0) {
                    results.push(fieldList);
                } else if (preserveNulls) {
                    results.push(null);
                }
            } else if (isNotNil(value) && fn(value, i)) {
                results.push(...callValue(fn, value, preserveNulls, true, i));
            } else if (preserveNulls) {
                results.push(null);
            }
        }

        return results;
    };
}

export function wholeFieldValidationColumnExecution<T extends Record<string, any>>(
    fnDef: FieldValidateConfig<T>,
    configs: PartialArgs<T>,
) {
    return function _fieldValidationColumnExecution(
        input: unknown[],
    ): unknown[] {
        const fn = fnDef.create({
            ...configs,
            ctx: input
        });

        return input.map((value, i) => (fn(value, i) ? value : null));
    };
}

export function wholeFieldValidationRowExecution<T extends Record<string, any>>(
    fnDef: FieldValidateConfig<T>,
    configs: PartialArgs<T>,
    preserveNulls: boolean,
    preserveEmptyObjects: boolean,
    field?: string
): (input: Record<string, unknown>[]) => Record<string, unknown>[] {
    return function _wholeFieldValidationRowExecution(
        input: Record<string, unknown>[],
    ): Record<string, unknown>[] {
        if (isNil(field)) throw new Error('Must provide a field option when running a row');
        if (!Array.isArray(input)) {
            throw new Error('Invalid input, expected an array of objects');
        }

        const results = [];

        const fn = fnDef.create({
            ...configs,
            ctx: input
        });

        for (let i = 0; i < input.length; i++) {
            const clone = cloneDeep(input[i]);

            if (!isObjectEntity(clone)) {
                throw new Error(`Invalid record ${JSON.stringify(clone)}, expected an array of simple objects or data-entities`);
            }

            const value = get(clone, field);
            const isValid = fn(value, i);
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
    fnDef: FieldValidateConfig<T>,
    configs: PartialArgs<T>,
    preserveNulls: boolean,
    preserveEmptyObjects: boolean,
    field?: string
): (input: Record<string, unknown>[]) => Record<string, unknown>[] {
    return function _wholeFieldValidationRowExecution(
        input: Record<string, unknown>[],
    ): Record<string, unknown>[] {
        if (isNil(field)) throw new Error('Must provide a field option when running a row');
        if (!Array.isArray(input)) {
            throw new Error('Invalid input, expected an array of objects');
        }

        const results: Record<string, unknown>[] = [];
        const fn = fnDef.create({
            ...configs,
            ctx: input
        });

        for (let i = 0; i < input.length; i++) {
            const clone = cloneDeep(input[i]) as Record<string, unknown>;

            if (!isObjectEntity(clone)) {
                throw new Error(`Invalid record ${JSON.stringify(clone)}, expected an array of simple objects or data-entities`);
            }

            const value: unknown = get(clone, field);

            if (Array.isArray(value)) {
                const fieldList = callValue(fn, value, preserveNulls, true, i);

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
                const isValid = fn(value as T, i);
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
