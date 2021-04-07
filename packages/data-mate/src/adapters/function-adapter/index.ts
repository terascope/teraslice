import {
    isObjectEntity,
    get,
    set,
    isNotNil,
    cloneDeep,
    isNil,
    unset
} from '@terascope/utils';
import { DataTypeFieldConfig } from '@terascope/types';
import {
    FunctionDefinitions,
    FieldValidateConfig,
    FieldTransformConfig,
    isFieldValidation,
    isFieldTransform,
    RecordValidationConfig,
    RecordTransformConfig,
    isRecordValidation,
    ProcessMode
} from '../../interfaces';
import { validateFunctionArgs } from '../argument-validator';

export interface FunctionAdapterOptions<T extends Record<string, any>> {
    field?: string,
    args?: T,
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
function wholeFieldValidationColumnExecution(
    fn: (input: unknown) => unknown,
) {
    return function _fieldValidationColumnExecution(input: unknown | unknown[]) {
        if (fn(input)) {
            return input;
        }

        return null;
    };
}

// TODO: see if we can fix the types here
function fieldValidationColumnExecution(fn: (input: unknown) => unknown, preserveNulls: boolean) {
    return function _fieldValidationColumnExecution(input: unknown[]) {
        if (!Array.isArray(input)) {
            throw new Error('Invalid input, expected an array of values');
        }
        const results: (boolean | null)[] = [];

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

function recordValidationExecution(
    fn: (input: Record<string, unknown>) => boolean,
    preserveNulls: boolean
) {
    return function _row(input: Record<string, unknown>[]) {
        if (!Array.isArray(input)) {
            throw new Error('Invalid input, expected an array of objects');
        }

        const results: (Record<string, unknown>|null)[] = [];

        for (const record of input) {
            if (!isObjectEntity(record)) {
                throw new Error(`Invalid record ${JSON.stringify(record)}, expected an array of simple objects or data-entities`);
            }

            const clone = cloneDeep(record);

            // TODO: how much error handling should be here vs the function
            if (fn(clone)) {
                results.push(clone);
            } else if (preserveNulls) {
                results.push(null);
            }
        }

        return results;
    };
}

// @TODO: fix any type
export function functionAdapter<T extends Record<string, any> = Record<string, unknown>>(
    fnDef: FieldValidateConfig<T>,
    options?: FunctionAdapterOptions<T>
): FieldFunctionAdapterOperation
export function functionAdapter<T extends Record<string, any> = Record<string, unknown>>(
    fnDef: FieldTransformConfig<T>,
    options?: FunctionAdapterOptions<T>
): FieldFunctionAdapterOperation
export function functionAdapter<T extends Record<string, any> = Record<string, unknown>>(
    fnDef: RecordValidationConfig<T>,
    options?: FunctionAdapterOptions<T>
): RecordFunctionAdapterOperation
export function functionAdapter<T extends Record<string, any> = Record<string, unknown>>(
    fnDef: RecordTransformConfig<T>,
    options?: FunctionAdapterOptions<T>
): RecordFunctionAdapterOperation
export function functionAdapter<T extends Record<string, any> = Record<string, unknown>>(
    /** The field validation or transform function definition */
    fnDef: FunctionDefinitions,
    options: FunctionAdapterOptions<T> = {}
): any {
    const {
        args,
        field,
        preserveNulls = true,
        preserveEmptyObjects = true,
    } = options;

    validateFunctionArgs(fnDef, args);

    if (isFieldValidation(fnDef)) {
        // creating fn here ensures better typing of what fn is
        const fn = fnDef.create(args ?? {});

        if (fnDef.process_mode === ProcessMode.FULL_VALUES) {
            return {
                rows: fieldValidationRowExecution(
                    fn, preserveNulls, preserveEmptyObjects, field
                ),
                column: wholeFieldValidationColumnExecution(fn)
            };
        }

        return {
            rows: fieldValidationRowExecution(
                fn, preserveNulls, preserveEmptyObjects, field
            ),
            column: fieldValidationColumnExecution(fn, preserveNulls)

        };
    }

    if (isFieldTransform(fnDef)) {
        const fn = fnDef.create(args ?? {});
        return {
            rows: fieldTransformRowExecution(
                fn as any, preserveNulls, preserveEmptyObjects, field
            ),
            column: transformColumnExecution(fn as any, preserveNulls)

        };
    }

    if (isRecordValidation(fnDef)) {
        const fn = fnDef.create(args ?? {});
        return {
            rows: recordValidationExecution(fn, preserveNulls)
        };
    }

    throw new Error(`Function definition ${JSON.stringify(fnDef, null, 4)} is not currently supported`);
}

// RecordValidation preserveNull true
// === [{ someField: true }, null]

// RecordValidation preserveNull false
// === [{ someField: true }]
