import { DataTypeConfig, DataTypeFields, FieldType } from '@terascope/types';
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
    FieldValidateConfig,
    FieldTransformConfig,
    isFieldValidation,
    isFieldTransform,
    RecordValidationConfig,
    RecordTransformConfig,
    isRecordValidation,
    ProcessMode,
    FunctionDefinitionConfig,
    DataTypeFieldAndChildren
} from '../../function-configs/interfaces';
import { validateFunctionArgs } from '../argument-validator';
import { getChildDataTypeConfig } from '../../core';

export function functionAdapter<T extends Record<string, any> = Record<string, unknown>>(
    fnDef: FieldValidateConfig<T>|FieldTransformConfig<T>,
    options?: FunctionAdapterOptions<T>
): FieldFunctionAdapterOperation
export function functionAdapter<T extends Record<string, any> = Record<string, unknown>>(
    fnDef: RecordValidationConfig<T>|RecordTransformConfig<T>|FunctionDefinitionConfig<T>,
    options?: FunctionAdapterOptions<T>
): RecordFunctionAdapterOperation
export function functionAdapter<T extends Record<string, any> = Record<string, unknown>>(
    /** The field validation or transform function definition */
    fnDef: FunctionDefinitionConfig<T>,
    options: FunctionAdapterOptions<T> = {}
): RecordFunctionAdapterOperation|FieldFunctionAdapterOperation {
    const {
        field,
        config,
        preserveNulls = true,
        preserveEmptyObjects = true,
    } = options;

    const args = { ...options.args } as T;
    validateFunctionArgs(fnDef, args);

    if (isFieldValidation(fnDef)) {
        // creating fn here ensures better typing of what fn is
        const fn = fnDef.create(args, getDataTypeFieldAndChildren(config, field));

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
        const fn = fnDef.create(args, getDataTypeFieldAndChildren(config, field));

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
        const fn = fnDef.create(args, config?.fields);
        return {
            rows: recordValidationExecution(fn)
        };
    }

    throw new Error(`Function definition ${JSON.stringify(fnDef, null, 4)} is not currently supported`);
}

export function getDataTypeFieldAndChildren(
    config: DataTypeConfig|undefined, field: string|undefined
): DataTypeFieldAndChildren|undefined {
    if (!field || !config) return;
    const fieldConfig = config.fields[field];
    if (!fieldConfig) return;
    const childConfig: DataTypeFields|undefined = getChildDataTypeConfig(
        config.fields, field, fieldConfig.type as FieldType
    );
    return { field_config: fieldConfig, child_config: childConfig };
}

// RecordValidation preserveNull true
// === [{ someField: true }, null]

// RecordValidation preserveNull false
// === [{ someField: true }]
