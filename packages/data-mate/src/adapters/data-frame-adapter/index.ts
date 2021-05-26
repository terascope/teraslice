import { isNil, isFunction } from '@terascope/utils';
import { validateFunctionArgs } from '../argument-validator';
import {
    Column, validateAccepts,
    getFieldTypesFromFieldConfigAndChildConfig,
    ColumnOptions, mapVectorEach, mapVectorEachValue,
    dynamicMapVectorEach, dynamicMapVectorEachValue
} from '../../column';
import { DataFrame } from '../../data-frame';
import {
    FieldTransformConfig, isFieldTransform, isFieldValidation, ProcessMode,
    FieldValidateConfig, DataTypeFieldAndChildren, FunctionDefinitionConfig,
    FunctionContext, DynamicFrameFunctionContext
} from '../../function-configs/interfaces';
import { Builder } from '../../builder';
import { WritableData } from '../../core';

export interface DataFrameAdapterOptions<T extends Record<string, any>> {
    args?: T | ((index: number, column: Column<unknown>) => T),
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

    const context: FunctionContext<T> = {
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

function validatorTransformFN(validatorFn: (value: unknown, index: number) => unknown) {
    return function _validatorTransform(value: unknown, index: number): unknown {
        if (validatorFn(value, index)) return value;
        return null;
    };
}

function dynamicValidatorTransformFN<T>(
    fnDef: FieldValidateConfig<T>,
    context: DynamicFrameFunctionContext<T>
) {
    return function _validatorTransformArgs(index: number) {
        const args = context.args(index, context.parent);

        validateFunctionArgs(fnDef, args);

        const fullContext = {
            ...context,
            args
        };

        const validatorFn = fnDef.create(fullContext);
        return validatorTransformFN(validatorFn);
    };
}

function validateColumnData<T extends Record<string, any>>(
    column: Column,
    fnDef: FieldValidateConfig<T>,
    options: DataFrameAdapterOptions<T>
): Column {
    const err = validateAccepts(
        fnDef.accepts,
        getFieldTypesFromFieldConfigAndChildConfig(
            column.vector.config, column.vector.childConfig
        ),
    );

    if (err) {
        // if there is an error, there is a type mismatch
        // there is no need to execute, just return an empty column
        return column.clearAll();
    }

    const columnOptions: ColumnOptions = {
        name: column.name,
        version: column.version,
    };

    const inputConfig = {
        field_config: column.config,
        child_config: column.vector.childConfig,
    };

    const builder = Builder.make(
        new WritableData(column.vector.size),
        {
            childConfig: column.vector.childConfig,
            config: column.vector.config,
            name: column.vector.name,
        },
    );

    // since this is a function, it will return dynamic args
    // need to use separate logic for that feature
    if (isFunction(options.args)) {
        const context: DynamicFrameFunctionContext<T> = {
            args: options.args,
            parent: column,
            inputConfig,
        };

        if (fnDef.process_mode === ProcessMode.FULL_VALUES) {
            return new Column(
                dynamicMapVectorEach(
                    column.vector,
                    builder,
                    dynamicValidatorTransformFN(fnDef, context),
                ),
                columnOptions
            );
        }

        return new Column(
            dynamicMapVectorEachValue(
                column.vector,
                builder,
                dynamicValidatorTransformFN(fnDef, context),
            ),
            columnOptions
        );
    }

    const context: FunctionContext<T> = {
        args: options.args as T,
        parent: column,
        inputConfig
    };

    const validatorFn = fnDef.create(context);
    const validatorTransform = validatorTransformFN(validatorFn);

    if (fnDef.process_mode === ProcessMode.FULL_VALUES) {
        return new Column(
            mapVectorEach(
                column.vector,
                builder,
                validatorTransform,
            ),
            columnOptions
        );
    }

    return new Column(
        mapVectorEachValue(
            column.vector,
            builder,
            validatorTransform,
        ),
        columnOptions
    );
}

function validateColumn<T extends Record<string, any>>(
    fnDef: FieldValidateConfig<T>, options: DataFrameAdapterOptions<T>
) {
    return function _validateColumn(column: Column<any>): Column<any> {
        return validateColumnData(column, fnDef, options);
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
    const { field, } = options;
    const args = { ...options.args } as T;

    // we will validate on each call later
    if (!isFunction(options.args)) {
        validateFunctionArgs(fnDef, options.args);
    }

    if (isFieldValidation(fnDef)) {
        return {
            column: validateColumn(fnDef, options),
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
