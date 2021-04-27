import {
    isObjectEntity,
    get,
    set,
    isNotNil,
    cloneDeep,
    isNil,
    unset
} from '@terascope/utils';

export function fieldTransformRowExecution<T extends Record<string, any>>(
    fn: (input: unknown) => unknown,
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

        for (const record of input) {
            const clone = cloneDeep(record);

            if (!isObjectEntity(record)) {
                throw new Error(`Invalid record ${JSON.stringify(record)}, expected an array of simple objects or data-entities`);
            }

            const value: unknown = get(clone, field);

            try {
                if (Array.isArray(value)) {
                    const fieldList: unknown[] = [];

                    for (const item of value) {
                        const newValue = fn(item);

                        if (!isNil(newValue)) {
                            fieldList.push(newValue);
                        } else if (preserveNulls) {
                            fieldList.push(null);
                        }
                    }
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
                    const data = fn(value);

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
            } catch (_err) {
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
            }
        }

        return results;
    };
}

export function wholeFieldTransformRowExecution<T extends Record<string, any>>(
    fn: (input: unknown) => unknown,
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

        for (const record of input) {
            const clone = cloneDeep(record);

            if (!isObjectEntity(record)) {
                throw new Error(`Invalid record ${JSON.stringify(record)}, expected an array of simple objects or data-entities`);
            }

            const value = get(clone, field);

            try {
                const data = fn(value);

                if (isNil(data)) {
                    if (preserveNulls) {
                        set(clone, field, null);
                    } else {
                        unset(clone, field);
                    }
                } else {
                    set(clone, field, data);
                }
            } catch (_err) {
                if (preserveNulls) {
                    set(clone, field, null);
                } else {
                    unset(clone, field);
                }
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

export function wholeFieldTransformColumnExecution(
    fn: (input: unknown) => unknown,
    preserveNulls: boolean
) {
    return function _wholeFieldTransformColumnExecution(
        input: unknown[]
    ): unknown[] {
        if (!Array.isArray(input)) {
            throw new Error('Invalid input, expected an array of values');
        }
        const results: unknown[] = [];

        for (const value of input) {
            if (isNotNil(value)) {
                try {
                    const newValue = fn(value);

                    if (!isNil(newValue)) {
                        results.push(newValue);
                    } else if (preserveNulls) {
                        results.push(null);
                    }
                } catch (_err) {
                    if (preserveNulls) results.push(null);
                }
            } else if (preserveNulls) {
                results.push(null);
            }
        }

        return results;
    };
}

export function fieldTransformColumnExecution(
    fn: (input: unknown) => unknown, preserveNulls: boolean
) {
    return function _fieldTransformColumnExecution(
        input: unknown[]
    ): (unknown|null)[] {
        if (!Array.isArray(input)) {
            throw new Error('Invalid input, expected an array of values');
        }
        const results = [];

        for (const value of input) {
            if (isNotNil(value)) {
                // @TODO: handle deeper array of arrays?
                if (Array.isArray(value)) {
                    const fieldList: unknown[] = [];

                    for (const item of value) {
                        if (isNotNil(item)) {
                            try {
                                const newValue = fn(value);

                                if (!isNil(newValue)) {
                                    fieldList.push(newValue);
                                } else if (preserveNulls) {
                                    fieldList.push(null);
                                }
                            } catch (_err) {
                                if (preserveNulls) fieldList.push(null);
                            }
                        } else if (preserveNulls) {
                            fieldList.push(null);
                        }
                    }

                    if (fieldList.length > 0) {
                        results.push(fieldList);
                    } else if (preserveNulls) {
                        results.push(null);
                    }
                } else {
                    try {
                        const newValue = fn(value);

                        if (!isNil(newValue)) {
                            results.push(newValue);
                        } else if (preserveNulls) {
                            results.push(null);
                        }
                    } catch (_err) {
                        if (preserveNulls) results.push(null);
                    }
                }
            } else if (preserveNulls) {
                results.push(null);
            }
        }

        return results;
    };
}
