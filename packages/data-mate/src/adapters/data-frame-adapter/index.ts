import { isNil, isFunction, isString } from '@terascope/core-utils';
import { validateFunctionArgs } from '../argument-validator/index.js';
import {
    Column, validateAccepts,
    getFieldTypesFromFieldConfigAndChildConfig,
    ColumnOptions, mapVectorEach, mapVectorEachValue,
    dynamicMapVectorEach, dynamicMapVectorEachValue
} from '../../column/index.js';
import { DataFrame } from '../../data-frame/index.js';
import {
    FieldTransformConfig, isFieldTransform, isFieldValidation, ProcessMode,
    FieldValidateConfig, DataTypeFieldAndChildren, FunctionDefinitionConfig,
    FunctionContext, DynamicFrameFunctionContext
} from '../../function-configs/interfaces.js';
import { Builder, copyVectorToBuilder } from '../../builder/index.js';
import { WritableData } from '../../core/index.js';

export interface DataFrameAdapterOptions<T extends Record<string, any>> {
    args?: T | ((index: number) => T);
    field?: string;
}

export interface FrameAdapterFn {
    column(input: Column<any>): Column<any>;
    frame(input: DataFrame<Record<string, any>>): DataFrame<Record<string, unknown>>;
}

function transformColumnData<T extends Record<string, any>>(
    column: Column,
    fnDef: FieldTransformConfig<T>,
    options: DataFrameAdapterOptions<T>
): Column {
    const err = validateAccepts(
        fnDef.accepts,
        getFieldTypesFromFieldConfigAndChildConfig(
            column.vector.config,
            column.vector.childConfig,
        ),
    );

    if (err) throw err;

    const columnOptions: ColumnOptions = {
        name: column.name,
        version: column.version,
    };

    const inputConfig: DataTypeFieldAndChildren = {
        field_config: column.config,
        child_config: column.vector.childConfig
    };

    let outputConfig: DataTypeFieldAndChildren;

    const args = isFunction(options.args) ? options.args(0) : options.args as T;

    if (fnDef.output_type) {
        outputConfig = fnDef.output_type(
            inputConfig,
            args
        );
    } else {
        outputConfig = inputConfig;
    }

    const builder = Builder.make(
        new WritableData(column.vector.size),
        {
            childConfig: outputConfig.child_config,
            config: outputConfig.field_config,
            name: column.vector.name,
        },
    );

    if (isFunction(options.args)) {
        const context: DynamicFrameFunctionContext<T> = {
            args: options.args,
            parent: column,
            inputConfig,
        };

        if (fnDef.process_mode === ProcessMode.NONE) {
            return new Column(
                copyVectorToBuilder(column.vector, builder),
                columnOptions
            );
        }

        if (fnDef.process_mode === ProcessMode.FULL_VALUES) {
            return new Column(
                dynamicMapVectorEach(
                    column.vector,
                    builder,
                    dynamicTransformerFN(fnDef, context),
                ),
                columnOptions
            );
        }

        return new Column(
            dynamicMapVectorEach(
                column.vector,
                builder,
                dynamicTransformerFN(fnDef, context),
            ),
            columnOptions
        );
    }

    const context: FunctionContext<T> = {
        args,
        parent: column,
        inputConfig,
        outputConfig
    };

    const transformFn = fnDef.create(context);

    if (fnDef.process_mode === ProcessMode.NONE) {
        return new Column(
            copyVectorToBuilder(column.vector, builder),
            columnOptions
        );
    }

    if (fnDef.process_mode === ProcessMode.FULL_VALUES) {
        return new Column(
            mapVectorEach(
                column.vector,
                builder,
                transformFn,
            ),
            columnOptions
        );
    }

    return new Column(
        mapVectorEachValue(
            column.vector,
            builder,
            transformFn,
        ),
        columnOptions
    );
}

function validatorTransformFN(validatorFn: (value: unknown, index: number) => unknown) {
    return function _validatorTransform(value: unknown, index: number): unknown {
        if (validatorFn(value, index)) return value;
        return null;
    };
}

function dynamicValidatorFN<T extends Record<string, unknown>>(
    fnDef: FieldValidateConfig<T>,
    context: DynamicFrameFunctionContext<T>
) {
    return function _dynamicValidatorFN(index: number) {
        const newArgs = context.args(index);
        const args = validateFunctionArgs(fnDef, newArgs);

        const fullContext = {
            ...context,
            args
        };

        const validatorFn = fnDef.create(fullContext);
        return validatorTransformFN(validatorFn);
    };
}

function dynamicTransformerFN<T extends Record<string, unknown>>(
    fnDef: FieldTransformConfig<T>,
    context: DynamicFrameFunctionContext<T>
) {
    return function _dynamicTransformerFN(index: number) {
        const newArgs = context.args(index);
        const args = validateFunctionArgs(fnDef, newArgs);

        const fullContext = {
            ...context,
            args
        };

        return fnDef.create(fullContext);
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
                    dynamicValidatorFN(fnDef, context),
                ),
                columnOptions
            );
        }

        return new Column(
            dynamicMapVectorEachValue(
                column.vector,
                builder,
                dynamicValidatorFN(fnDef, context),
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
    fnDef: FieldTransformConfig<T>, options: DataFrameAdapterOptions<T>
) {
    return function _transformColumn(column: Column): Column {
        return transformColumnData(column, fnDef, options);
    };
}

function validateFrame<T extends Record<string, any>>(
    fnDef: FieldValidateConfig<T>,
    options: DataFrameAdapterOptions<T>
) {
    return function _validateFrame(
        frame: DataFrame<Record<string, unknown>>
    ): DataFrame<Record<string, unknown>> {
        const { field } = options;
        if (isNil(options.field) || !isString(field)) throw new Error('Must provide a field option when running a DataFrame');

        const col = frame.getColumnOrThrow(field);
        // TODO: should we pass along the parent dataFrame as well?
        const validCol = validateColumnData(col, fnDef, options);
        return frame.assign([validCol]);
    };
}

function transformFrame<T extends Record<string, any>>(
    fnDef: FieldTransformConfig<T>,
    options: DataFrameAdapterOptions<T>
) {
    return function _transformFrame(
        frame: DataFrame<Record<string, unknown>>
    ): DataFrame<Record<string, unknown>> {
        const { field } = options;

        if (isNil(field) || !isString(field)) throw new Error('Must provide a field option when running a DataFrame');
        const col = frame.getColumnOrThrow(field);
        const newCol = transformColumnData(col, fnDef, options);

        return frame.assign([newCol]);
    };
}

export function dataFrameAdapter<T extends Record<string, any> = Record<string, unknown>>(
    fnDef: FunctionDefinitionConfig<T>,
    options: DataFrameAdapterOptions<T> = {}
): FrameAdapterFn {
    if (isNil(options.args)) options.args = {} as T;
    // we will validate on each call later
    if (!isFunction(options.args)) {
        options.args = validateFunctionArgs(fnDef, options.args);
    }

    if (isFieldValidation(fnDef)) {
        return {
            column: validateColumn(fnDef, options),
            frame: validateFrame(fnDef, options)
        };
    }

    if (isFieldTransform(fnDef)) {
        return {
            column: transformColumn(fnDef, options),
            frame: transformFrame(fnDef, options)
        };
    }

    throw new Error(`Function definition "${fnDef.name}" (type: ${fnDef.type}) is not supported`);
}
