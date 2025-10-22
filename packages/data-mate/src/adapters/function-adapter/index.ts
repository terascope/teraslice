import { isFunction } from '@terascope/core-utils';
import {
    fieldValidationRowExecution, fieldValidationColumnExecution,
    wholeFieldValidationRowExecution, wholeFieldValidationColumnExecution,
    recordValidationExecution
} from './validators/index.js';
import {
    fieldTransformColumnExecution, fieldTransformRowExecution,
    wholeFieldTransformColumnExecution, wholeFieldTransformRowExecution
} from './transformers/index.js';
import {
    FunctionAdapterOptions, RecordFunctionAdapterOperation,
    FieldFunctionAdapterOperation
} from './interfaces.js';
import {
    FieldValidateConfig, FieldTransformConfig, isFieldValidation,
    isFieldTransform, RecordValidationConfig, RecordTransformConfig,
    isRecordValidation, ProcessMode, FunctionDefinitionConfig,
    InitialFunctionContext
} from '../../function-configs/interfaces.js';
import { validateFunctionArgs } from '../argument-validator/index.js';
import { getDataTypeFieldAndChildren } from '../utils.js';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function functionAdapter<T extends Record<string, any> = Record<string, unknown>>(
    fnDef: FieldValidateConfig<T> | FieldTransformConfig<T>,
    options?: FunctionAdapterOptions<T>
): FieldFunctionAdapterOperation;
function functionAdapter<T extends Record<string, any> = Record<string, unknown>>(
    fnDef: RecordValidationConfig<T> | RecordTransformConfig<T> | FunctionDefinitionConfig<T>,
    options?: FunctionAdapterOptions<T>
): RecordFunctionAdapterOperation;
function functionAdapter<T extends Record<string, any> = Record<string, unknown>>(
    /** The field validation or transform function definition */
    fnDef: FunctionDefinitionConfig<T>,
    options: FunctionAdapterOptions<T> = {}
): RecordFunctionAdapterOperation | FieldFunctionAdapterOperation {
    const {
        field,
        config,
        preserveNulls = true,
        preserveEmptyObjects = true,
        // we add default here as we destructure args from it
        args = {} as T
    } = options;

    if (!isFunction(args)) {
        validateFunctionArgs(fnDef, args);
    }

    const fnConfig: InitialFunctionContext<T> = {
        args,
        inputConfig: getDataTypeFieldAndChildren(config, field),
        preserveNulls,
        preserveEmptyObjects,
        field
    };

    if (isFieldValidation(fnDef)) {
        // creating fn here ensures better typing of what fn is
        if (fnDef.process_mode === ProcessMode.FULL_VALUES) {
            return {
                rows: wholeFieldValidationRowExecution<T>(fnDef, fnConfig),
                column: wholeFieldValidationColumnExecution<T>(fnDef, fnConfig)
            };
        }

        return {
            rows: fieldValidationRowExecution(fnDef, fnConfig),
            column: fieldValidationColumnExecution(fnDef, fnConfig)
        };
    }

    if (isFieldTransform(fnDef)) {
        if (fnDef.process_mode === ProcessMode.FULL_VALUES) {
            return {
                rows: wholeFieldTransformRowExecution(fnDef, fnConfig),
                column: wholeFieldTransformColumnExecution(fnDef, fnConfig)
            };
        }

        return {
            rows: fieldTransformRowExecution(fnDef, fnConfig),
            column: fieldTransformColumnExecution(fnDef, fnConfig)
        };
    }

    if (isRecordValidation(fnDef)) {
        return {
            rows: recordValidationExecution(fnDef, fnConfig)
        };
    }

    throw new Error(`Function definition ${JSON.stringify(fnDef, null, 4)} is not currently supported`);
}
