import {
    isObjectEntity,
    get,
    set,
    isNotNil,
    getTypeOf,
    isString
} from '@terascope/utils';
import { DataTypeFieldConfig } from '@terascope/types';
import { isNil, unset } from 'lodash';
import {
    FieldFunctionDefinitions,
    FieldValidateConfig,
    FieldTransformConfig,
    isFieldValidation
} from '../interfaces';

interface Options {
    field?: string,
    args?: Record<string, unknown>,
    inputConfig?: DataTypeFieldConfig
    preserveNulls?: boolean;
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
    field?: string
): (input: unknown[]) => unknown[] {
    if (!isString(field)) {
        throw new Error(`Invalid parameter field, it must be a string, received ${getTypeOf(field)}`);
    }

    return function _fieldValidationRowExecution(input: unknown[]): unknown[] {
        if (isNil(field)) throw new Error('Must provide a field option when running a row');
        if (!Array.isArray(input)) {
            throw new Error('Invalid input, expected an array of values');
        }

        const results = [];

        for (const record of input) {
            const value = get(record, field);
            const isValid = fn(value);

            if (!fn(value) && preserveNulls) {
                set(record, field, null);
                results.push(record);
            } else if (!isValid) {
                unset(record, field);
                results.push(record);
            } else {
                results.push(record);
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
                results.push(fn(value));
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
    fnDef: FieldFunctionDefinitions,
    options: Options = {}
): any {
    const { args, field, preserveNulls = true } = options;
    const fn = fnDef.create(args ?? {});
    // call validateArgs

    if (isFieldValidation(fnDef)) {
        return {
            rows: fieldValidationRowExecution(fn, preserveNulls, field),
            column: fieldValidationColumnExecution(fn, preserveNulls)

        };
    }

    throw new Error('not implemented yet');
}

// column
// isBoolean([ true, null,  false, 'blah']) === [true, null, false, null]

// column preserveNull false
// isBoolean([ true, null,  false, 'blah']) === [true, false]

// // row
// isBoolean([
//     { someField: true },
//     { otherField: true, someField: 'blah' }
//     ])

// === [{ someField: true }, { otherField: true, someField: null }]

// Field validation preserveNull false
// === [{ someField: true },  { otherField: true }]

// RecordValidation preserveNull true
// === [{ someField: true }, null]

// RecordValidation preserveNull false
// === [{ someField: true }]
