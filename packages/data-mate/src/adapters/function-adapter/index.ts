import {
    fieldValidationRowExecution,
    fieldValidationColumnExecution,
    wholeFieldValidationRowExecution,
    wholeFieldValidationColumnExecution,
    recordValidationExecution
} from './validators';
import {
    fieldTransformColumnExecution,
    fieldTransformRowExecution,
    wholeFieldTransformColumnExecution,
    wholeFieldTransformRowExecution
} from './transformers';
import {
    FunctionAdapterOptions, RecordFunctionAdapterOperation, FieldFunctionAdapterOperation
} from './interfaces';
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
} from '../../function-configs/interfaces';
import { validateFunctionArgs } from '../argument-validator';

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
                rows: wholeFieldValidationRowExecution(
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

        if (fnDef.process_mode === ProcessMode.FULL_VALUES) {
            return {
                rows: wholeFieldTransformRowExecution(
                    fn, preserveNulls, preserveEmptyObjects, field
                ),
                column: wholeFieldTransformColumnExecution(fn, preserveNulls)
            };
        }

        return {
            rows: fieldTransformRowExecution(
                fn as any, preserveNulls, preserveEmptyObjects, field
            ),
            column: fieldTransformColumnExecution(fn as any, preserveNulls)

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
