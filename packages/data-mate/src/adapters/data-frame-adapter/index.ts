import { isNil } from '@terascope/utils';
import { validateFunctionArgs } from '../argument-validator';
import {
    Column, validateAccepts,
    getFieldTypesFromFieldConfigAndChildConfig,
    ColumnOptions, mapVectorEach, mapVectorEachValue,
} from '../../column';
import { DataFrame } from '../../data-frame';
import {
    FieldTransformConfig, isFieldTransform, isFieldValidation, ProcessMode,
    FieldValidateConfig, DataTypeFieldAndChildren, FunctionDefinitionConfig,
    FunctionContext, TransformContext
} from '../../function-configs/interfaces';
import { Builder } from '../../builder';
import { WritableData } from '../../core';

export interface DataFrameAdapterOptions<T extends Record<string, any>> {
    args?: T,
    field?: string;
}

export interface FrameAdapterFn {
    column(input: Column<any>): Column<any>;
    frame(input: DataFrame<Record<string, any>>): DataFrame<Record<string, unknown>>;
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

    const builder = Builder.make(
        new WritableData(column.vector.size),
        {
            childConfig: outputConfig.child_config,
            config: outputConfig.field_config,
            name: column.vector.name,
        },
    );

    const context: TransformContext<T> = {
        args,
        parent: column,
        inputConfig,
        outputConfig
    };

    const transformFn = transformConfig.create(context);

    if (transformConfig.process_mode === ProcessMode.FULL_VALUES) {
        return new Column(
            mapVectorEach(
                column.vector,
                builder,
                transformFn,
            ),
            options
        );
    }

    return new Column(
        mapVectorEachValue(
            column.vector,
            builder,
            transformFn,
        ),
        options
    );
}

function validateColumnData<T extends Record<string, any>>(
    column: Column,
    validationConfig: FieldValidateConfig<T>,
    args: T
): Column {
    const err = validateAccepts(
        validationConfig.accepts,
        getFieldTypesFromFieldConfigAndChildConfig(
            column.vector.config, column.vector.childConfig
        ),
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

    const inputConfig = {
        field_config: column.config,
        child_config: column.vector.childConfig,
    };

    const context: FunctionContext<T> = {
        args,
        parent: column,
        inputConfig
    };

    const validatorFn = validationConfig.create(context);

    const builder = Builder.make(
        new WritableData(column.vector.size),
        {
            childConfig: column.vector.childConfig,
            config: column.vector.config,
            name: column.vector.name,
        },
    );

    function validatorTransform(value: unknown, index: number): unknown {
        if (validatorFn(value, index)) return value;
        return null;
    }

    if (validationConfig.process_mode === ProcessMode.FULL_VALUES) {
        return new Column(
            mapVectorEach(
                column.vector,
                builder,
                validatorTransform,
            ),
            options
        );
    }

    return new Column(
        mapVectorEachValue(
            column.vector,
            builder,
            validatorTransform,
        ),
        options
    );
}

function validateColumn<T extends Record<string, any>>(
    config: FieldValidateConfig<T>, args: T,
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
    args: T,
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
        };
    }

    if (isFieldTransform(fnDef)) {
        return {
            column: transformColumn(fnDef, args),
            frame: transformFrame(fnDef, args, field)
        };
    }

    throw new Error(`Function definition "${fnDef.name}" (type: ${fnDef.type}) is not supported`);
}
