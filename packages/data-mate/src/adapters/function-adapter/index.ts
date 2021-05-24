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
    FunctionAdapterOptions, RecordFunctionAdapterOperation,
    FieldFunctionAdapterOperation, PartialArgs
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
    DataTypeFieldAndChildren,
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
        const fnConfig: PartialArgs<T> = {
            args,
            inputConfig: getDataTypeFieldAndChildren(config, field)
        };

        if (fnDef.process_mode === ProcessMode.FULL_VALUES) {
            return {
                rows: wholeFieldValidationRowExecution<T>(
                    fnDef, fnConfig, preserveNulls, preserveEmptyObjects, field
                ),
                column: wholeFieldValidationColumnExecution<T>(fnDef, fnConfig)
            };
        }

        return {
            rows: fieldValidationRowExecution(
                fnDef, fnConfig, preserveNulls, preserveEmptyObjects, field
            ),
            column: fieldValidationColumnExecution(fnDef, fnConfig, preserveNulls)
        };
    }

    if (isFieldTransform(fnDef)) {
        const fnConfig: PartialArgs<T> = {
            args,
            inputConfig: getDataTypeFieldAndChildren(config, field)
        };

        if (fnDef.process_mode === ProcessMode.FULL_VALUES) {
            return {
                rows: wholeFieldTransformRowExecution(
                    fnDef, fnConfig, preserveNulls, preserveEmptyObjects, field
                ),
                column: wholeFieldTransformColumnExecution(fnDef, fnConfig, preserveNulls)
            };
        }

        return {
            rows: fieldTransformRowExecution(
                fnDef, fnConfig, preserveNulls, preserveEmptyObjects, field
            ),
            column: fieldTransformColumnExecution(fnDef, fnConfig, preserveNulls)
        };
    }

    if (isRecordValidation(fnDef)) {
        const fnConfig: PartialArgs<T> = {
            args,
            inputConfig: getDataTypeFieldAndChildren(config, field)
        };

        return {
            rows: recordValidationExecution(fnDef, fnConfig)
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
