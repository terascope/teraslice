import { DataTypeFieldConfig } from '@terascope/types';
import { isNil } from '@terascope/utils';
import { validateFunctionArgs } from '../argument-validator';
import {
    Column, validateAccepts,
    getFieldTypesFromFieldConfigAndChildConfig,
    ColumnOptions, mapVector,
} from '../../column';
import { DataFrame } from '../../data-frame';
import {
    FieldTransformConfig, isFieldTransform, isFieldValidation, ProcessMode,
    FieldValidateConfig, isFieldOperation,
    DataTypeFieldAndChildren, FunctionDefinitionConfig,
    BaseArgs, TransformArgs
} from '../../function-configs/interfaces';
import {
    TransformMode, ColumnTransformFn
} from '../../column/interfaces';

export interface DataFrameAdapterOptions<T extends Record<string, any>> {
    args?: T,
    inputConfig?: DataTypeFieldConfig,
    field?: string;
}

export interface ColumnAdapterFn {
    column: (input: Column<any>) => Column<any>;
}

export interface FrameAdapterFn extends ColumnAdapterFn {
    frame<T extends Record<string, unknown> = Record<string, any>> (
        input: DataFrame<T>
    ): DataFrame<Record<string, unknown>>
}

function getMode<T extends Record<string, any>>(
    fnDef: FunctionDefinitionConfig<T>
): TransformMode {
    if (isFieldOperation(fnDef)) {
        const mode = fnDef.process_mode;
        if (mode === ProcessMode.INDIVIDUAL_VALUES) {
            return TransformMode.EACH_VALUE;
        }
    }

    return TransformMode.EACH;
}

function transformColumnData<T extends Record<string, any>>(
    column: Column,
    transformConfig: FieldTransformConfig<T>,
    args: T
): Column {
    const err = validateAccepts(
        transformConfig.accepts,
        getFieldTypesFromFieldConfigAndChildConfig(
            column.vector.config,
            column.vector.childConfig,
        ),
    );

    if (err) throw err;

    const mode = getMode(transformConfig);

    const inputConfig: DataTypeFieldAndChildren = {
        field_config: column.config,
        child_config: column.vector.childConfig
    };
    let outputConfig: DataTypeFieldAndChildren;

    if (transformConfig.output_type) {
        outputConfig = transformConfig.output_type(
            inputConfig,
            args
        );
    } else {
        outputConfig = inputConfig;
    }

    const options: ColumnOptions = {
        name: column.name,
        version: column.version,
    };

    const config: TransformArgs<T> = {
        args: { ...args },
        ctx: column,
        inputConfig,
        outputConfig
    };

    const transformFn = transformConfig.create(config);

    // TODO: does output that only has DateFieldTypes enough, will it need more?
    const columnTransformConfig: ColumnTransformFn<unknown, unknown> = {
        mode,
        fn: transformFn
    };

    // TODO: consider if we should move mapVector logic here
    return new Column(
        mapVector(
            column.vector,
            columnTransformConfig,
            outputConfig,
        ),
        options
    );
}

function validateColumnData<T extends Record<string, any>>(
    column: Column,
    validationConfig: FieldValidateConfig<T>,
    args?: T
): Column {
    const err = validateAccepts(
        validationConfig.accepts,
        getFieldTypesFromFieldConfigAndChildConfig(column.vector.config, column.vector.childConfig),
    );

    if (err) {
        // if there is an error, there is a type mismatch
        // there is no need to execute, just return an empty column
        return column.clearAll();
    }

    const options: ColumnOptions = {
        name: column.name,
        version: column.version,
    };

    const mode = getMode(validationConfig);

    const inputConfig = {
        field_config: column.config,
        child_config: column.vector.childConfig,
    };

    const config: BaseArgs<T> = {
        args: { ...args } as T,
        ctx: column,
        ...inputConfig
    };

    const validatorFn = validationConfig.create(config);

    const columnValidationConfig: ColumnTransformFn<unknown, unknown> = {
        mode,
        fn: validatorFn
    };

    const transform = mode !== TransformMode.NONE ? ({
        ...columnValidationConfig,
        fn(value: any, index: number): any {
            if (validatorFn(value, index)) {
                return value;
            }
            return null;
        }
    }) : columnValidationConfig;

    // TODO: consider if we should move mapVector logic here
    return new Column(
        mapVector(
            column.vector,
            transform,
            inputConfig,
        ),
        options
    );
}

function validateColumn<T extends Record<string, any>>(
    config: FieldValidateConfig<T>, args?: T,
) {
    return function _validateColumn(column: Column<any>): Column<any> {
        return validateColumnData(column, config, args);
    };
}

function transformColumn<T extends Record<string, any>>(
    config: FieldTransformConfig<T>, args: T
) {
    return function _transformColumn(column: Column): Column {
        return transformColumnData(column, config, args);
    };
}

function validateFrame<T extends Record<string, any>>(
    fnDef: FieldValidateConfig<T>,
    args?: T,
    field?: string
) {
    return function _validateFrame(
        frame: DataFrame<Record<string, unknown>>
    ): DataFrame<Record<string, unknown>> {
        if (isNil(field)) throw new Error('Must provide a field option when running a DataFrame');
        const col = frame.getColumnOrThrow(field);
        const validCol = validateColumnData(col, fnDef, args);

        return frame.assign([validCol]);
    };
}

function transformFrame<T extends Record<string, any>>(
    fnDef: FieldTransformConfig<T>,
    args: T,
    field?: string
) {
    return function _transformFrame(
        frame: DataFrame<Record<string, unknown>>
    ): DataFrame<Record<string, unknown>> {
        if (isNil(field)) throw new Error('Must provide a field option when running a DataFrame');
        const col = frame.getColumnOrThrow(field);
        const newCol = transformColumnData(col, fnDef, args);

        return frame.assign([newCol]);
    };
}

export function dataFrameAdapter<T extends Record<string, any> = Record<string, unknown>>(
    fnDef: FunctionDefinitionConfig<T>,
    options: DataFrameAdapterOptions<T> = {}
): FrameAdapterFn {
    const { field } = options;
    const args = { ...options.args } as T;

    validateFunctionArgs(fnDef, args);

    if (isFieldValidation(fnDef)) {
        return {
            column: validateColumn(fnDef, args),
            frame: validateFrame(fnDef, args, field)
        } as FrameAdapterFn;
    }

    if (isFieldTransform(fnDef)) {
        return {
            column: transformColumn(fnDef, args),
            frame: transformFrame(fnDef, args, field)
        } as FrameAdapterFn;
    }

    throw new Error(`Function definition ${JSON.stringify(fnDef)} is not supported`);
}
