import {
    isObjectEntity,
    get,
    set,
    isNotNil,
    cloneDeep,
    isNil,
    unset,
    isDateTuple
} from '@terascope/utils';
import { FieldTransformConfig, InitialFunctionContext } from '../../../function-configs/interfaces';
import { callValue } from '../utils';

export function fieldTransformRowExecution<
    T extends Record<string, any>,
    K extends Record<string, any> = Record<string, unknown>
>(
    fnDef: FieldTransformConfig<K>,
    configs: InitialFunctionContext<K>,
    preserveNulls: boolean,
    preserveEmptyObjects: boolean,
    field?: keyof T,
): (input: T[]) => T[] {
    return function _fieldTransformRowExecution(input: T[]): T[] {
        if (isNil(field)) throw new Error('Must provide a field option when running a row');
        if (!Array.isArray(input)) {
            throw new Error('Invalid input, expected an array of objects');
        }

        const results = [];

        const fn = fnDef.create({
            ...configs,
            parent: input
        });

        for (let i = 0; i < input.length; i++) {
            const clone = cloneDeep(input[i]);

            if (!isObjectEntity(clone)) {
                throw new Error(`Invalid record ${JSON.stringify(clone)}, expected an array of simple objects or data-entities`);
            }

            const value: unknown = get(clone, field);

            if (Array.isArray(value)) {
                const fieldList = callValue(fn, input, preserveNulls, false, i);

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
                let data: unknown = null;

                if (!isNil(value)) {
                    data = fn(value, i);
                }

                if (isNil(data)) {
                    if (preserveNulls) {
                        set(clone, field, null);
                    } else {
                        unset(clone, field);
                    }

                    if (preserveEmptyObjects) {
                        results.push(clone);
                    } else {
                        const hasKeys = Object.keys(clone).length !== 0;

                        if (hasKeys) {
                            results.push(clone);
                        }
                    }
                } else {
                    set(clone, field, data);
                    results.push(clone);
                }
            }
        }

        return results;
    };
}

export function wholeFieldTransformRowExecution<
    T extends Record<string, any>,
    K extends Record<string, any> = Record<string, unknown>
>(
    fnDef: FieldTransformConfig<K>,
    configs: InitialFunctionContext<K>,
    preserveNulls: boolean,
    preserveEmptyObjects: boolean,
    field?: keyof T
): (input: T[]) => T[] {
    return function _wholeFieldTransformRowExecution(input: T[]): T[] {
        if (isNil(field)) throw new Error('Must provide a field option when running a row');
        if (!Array.isArray(input)) {
            throw new Error('Invalid input, expected an array of objects');
        }

        const results = [];

        const fn = fnDef.create({
            ...configs,
            parent: input
        });

        for (let i = 0; i < input.length; i++) {
            const clone = cloneDeep(input[i]);

            if (!isObjectEntity(clone)) {
                throw new Error(`Invalid record ${JSON.stringify(clone)}, expected an array of simple objects or data-entities`);
            }

            const value = get(clone, field);

            const data = fn(value, i);

            if (isNil(data)) {
                if (preserveNulls) {
                    set(clone, field, null);
                } else {
                    unset(clone, field);
                }
            } else {
                set(clone, field, data);
            }

            if (preserveEmptyObjects) {
                results.push(clone);
            } else {
                const hasKeys = Object.keys(clone).length !== 0;

                if (hasKeys) {
                    results.push(clone);
                }
            }
        }

        return results;
    };
}

export function wholeFieldTransformColumnExecution<
    T extends Record<string, any>,
    K extends Record<string, any> = Record<string, unknown>
>(
    fnDef: FieldTransformConfig<K>,
    configs: InitialFunctionContext<K>,
    preserveNulls: boolean
) {
    return function _wholeFieldTransformColumnExecution(
        input: T[],
    ): unknown[] {
        if (!Array.isArray(input)) {
            throw new Error('Invalid input, expected an array of values');
        }

        const results: unknown[] = [];

        const fn = fnDef.create({
            ...configs,
            parent: input
        });

        for (let i = 0; i < input.length; i++) {
            const newValue = fn(input[i], i);

            if (!isNil(newValue)) {
                results.push(newValue);
            } else if (preserveNulls) {
                results.push(null);
            }
        }

        return results;
    };
}

export function fieldTransformColumnExecution<
    T extends Record<string, any>,
    K extends Record<string, any> = Record<string, unknown>
>(
    fnDef: FieldTransformConfig<K>,
    configs: InitialFunctionContext<K>,
    preserveNulls: boolean,
) {
    return function _fieldTransformColumnExecution(
        input: T[],
    ): (unknown|null)[] {
        if (!Array.isArray(input)) {
            throw new Error('Invalid input, expected an array of values');
        }

        const results = [];

        const fn = fnDef.create({
            ...configs,
            parent: input
        });

        for (let i = 0; i < input.length; i++) {
            const value = input[i];

            if (isNotNil(value)) {
                if (!isDateTuple(value) && Array.isArray(value)) {
                    const fieldList = callValue(fn, input, preserveNulls, false, i);

                    if (fieldList.length > 0) {
                        results.push(fieldList);
                    } else if (preserveNulls) {
                        results.push(null);
                    }
                } else {
                    const newValue = callValue(fn, value, preserveNulls, false, i);
                    results.push(...newValue);
                }
            } else if (preserveNulls) {
                results.push(null);
            }
        }

        return results;
    };
}
