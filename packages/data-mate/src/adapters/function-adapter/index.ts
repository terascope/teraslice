import {
    isObjectEntity,
    get,
    set,
    isNotNil,
    cloneDeep
} from '@terascope/utils';
import { DataTypeFieldConfig } from '@terascope/types';
import { isNil, unset } from 'lodash';
import {
    FunctionDefinitions,
    FieldValidateConfig,
    FieldTransformConfig,
    isFieldValidation,
    isFieldTransform
} from '../../interfaces';

interface Options {
    field?: string,
    args?: Record<string, unknown>,
    inputConfig?: DataTypeFieldConfig
    preserveNulls?: boolean;
    preserveEmptyObjects?: boolean;
}

interface RecordFunctionAdapterOperation {
    rows(records: Record<string, unknown>[]): Record<string, unknown>[];
}

interface FieldFunctionAdapterOperation extends RecordFunctionAdapterOperation {
    column(values: unknown[]): unknown[];
}

// TODO: see if we can fix the types here
function fieldValidationColumnExecution(fn: (input: unknown) => unknown, preserveNulls: boolean) {
    return function _fieldValidationColumnExecution(input: unknown[]) {
        if (!Array.isArray(input)) {
            throw new Error('Invalid input, expected an array of values');
        }
        const results = [];

        for (const value of input) {
            if (isNotNil(value) && fn(value)) {
                results.push(value);
            } else if (preserveNulls) {
                results.push(null);
            }
        }

        return results;
    };
}

function fieldValidationRowExecution(
    fn: (input: unknown) => unknown,
    preserveNulls: boolean,
    preserveEmptyObjects: boolean,
    field?: string
): (input: unknown[]) => unknown[] {
    return function _fieldValidationRowExecution(input: unknown[]): unknown[] {
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

function fieldTransformRowExecution(
    fn: (input: unknown) => unknown,
    preserveNulls: boolean,
    preserveEmptyObjects: boolean,
    field?: string
): (input: unknown[]) => unknown[] {
    return function _fieldValidationRowExecution(input: unknown[]): unknown[] {
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
                set(clone, field, data);
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

function transformColumnExecution(fn: (input: unknown) => unknown, preserveNulls: boolean) {
    return function _column(input: unknown[]) {
        if (!Array.isArray(input)) {
            throw new Error('Invalid input, expected an array of values');
        }
        const results = [];

        for (const value of input) {
            if (isNotNil(value)) {
                try {
                    results.push(fn(value));
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

export function functionAdapter(
    fnDef: FieldValidateConfig,
    options?: Options
): FieldFunctionAdapterOperation
export function functionAdapter(
    fnDef: FieldTransformConfig,
    options?: Options
): FieldFunctionAdapterOperation
export function functionAdapter(
    /** The field validation or transform function definition */
    fnDef: FunctionDefinitions,
    options: Options = {}
): any {
    const {
        args,
        field,
        preserveNulls = true,
        preserveEmptyObjects = true,
    } = options;
    const fn = fnDef.create(args ?? {});
    // call validateArgs

    if (isFieldValidation(fnDef)) {
        return {
            rows: fieldValidationRowExecution(
                fn, preserveNulls, preserveEmptyObjects, field
            ),
            column: fieldValidationColumnExecution(fn, preserveNulls)

        };
    }

    if (isFieldTransform(fnDef)) {
        return {
            rows: fieldTransformRowExecution(
                fn, preserveNulls, preserveEmptyObjects, field
            ),
            column: transformColumnExecution(fn, preserveNulls)

        };
    }

    throw new Error('not implemented yet');
}

// RecordValidation preserveNull true
// === [{ someField: true }, null]

// RecordValidation preserveNull false
// === [{ someField: true }]
