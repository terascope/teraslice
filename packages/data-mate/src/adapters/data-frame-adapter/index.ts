import { FieldType, DataTypeFieldConfig } from '@terascope/types';
import { isNil } from '@terascope/utils';
import { validateFunctionArgs } from '../argument-validator';
import {
    Column, validateFieldTransformType, ColumnOptions, mapVector
} from '../../column';
import { DataFrame } from '../../data-frame';
import {
    FieldTransformConfig, isFieldTransform, isFieldValidation, ProcessMode,
    FieldValidateConfig, isFieldOperation,
    DataTypeFieldAndChildren, FunctionDefinitionConfig
} from '../../function-configs/interfaces';

import {
    TransformMode, ColumnTransformFn
} from '../../column/interfaces';

import {
    VectorType,
} from '../../vector/interfaces';

const FieldTypeToVectorDict: Record<FieldType, VectorType> = {
    [FieldType.String]: VectorType.String,
    [FieldType.Text]: VectorType.String,
    [FieldType.Keyword]: VectorType.String,
    [FieldType.KeywordCaseInsensitive]: VectorType.String,
    [FieldType.KeywordTokens]: VectorType.String,
    [FieldType.KeywordTokensCaseInsensitive]: VectorType.String,
    [FieldType.KeywordPathAnalyzer]: VectorType.String,
    [FieldType.Domain]: VectorType.String,
    [FieldType.Hostname]: VectorType.String,
    [FieldType.NgramTokens]: VectorType.String,
    [FieldType.IP]: VectorType.IP,
    [FieldType.IPRange]: VectorType.IPRange,
    [FieldType.Date]: VectorType.Date,
    [FieldType.Boolean]: VectorType.Boolean,
    [FieldType.Float]: VectorType.Float,
    [FieldType.Number]: VectorType.Int,
    [FieldType.Byte]: VectorType.Int,
    [FieldType.Short]: VectorType.Int,
    [FieldType.Integer]: VectorType.Int,
    [FieldType.Long]: VectorType.BigInt,
    [FieldType.Double]: VectorType.BigInt,
    [FieldType.GeoJSON]: VectorType.GeoJSON,
    [FieldType.GeoPoint]: VectorType.GeoPoint,
    [FieldType.Boundary]: VectorType.GeoPoint,
    [FieldType.Geo]: VectorType.GeoPoint,
    [FieldType.Object]: VectorType.Object,
    [FieldType.Any]: VectorType.Any,
    /** FieldType tuple is not the same a VectorType Tuple */
    [FieldType.Tuple]: VectorType.Any,
};

function getVectorType(input: readonly FieldType[]): VectorType[] {
    return input.map((fType) => {
        const type = FieldTypeToVectorDict[fType];
        if (isNil(type)) {
            throw new Error(`FieldType ${fType} is not supported with DataFrames`);
        }
        return type;
    });
}

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
    args?: T
): Column {
    validateFieldTransformType(
        getVectorType(transformConfig.accepts),
        column.vector
    );

    const mode = getMode(transformConfig);

    let inputConfig: DataTypeFieldAndChildren;

    if (transformConfig.output_type) {
        inputConfig = transformConfig.output_type(
            {
                field_config: column.config,
                child_config: column.vector.childConfig
            },
            args
        );
    } else {
        inputConfig = {
            field_config: column.config,
            child_config: column.vector.childConfig
        };
    }

    const options: ColumnOptions = {
        name: column.name,
        version: column.version,
    };

    const transformFn = transformConfig.create(
        { ...args } as T,
        inputConfig
    );

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
            inputConfig,
        ),
        options
    );
}

function validateColumnData<T extends Record<string, any>>(
    column: Column,
    validationConfig: FieldValidateConfig<T>,
    args?: T
): Column {
    validateFieldTransformType(
        getVectorType(validationConfig.accepts),
        column.vector
    );
    const mode = getMode(validationConfig);

    const options: ColumnOptions = {
        name: column.name,
        version: column.version,
    };

    const inputConfig = {
        field_config: column.config,
        child_config: column.vector.childConfig
    };

    const validatorFn = validationConfig.create(
        { ...args } as T,
        inputConfig
    );

    const columnValidationConfig: ColumnTransformFn<unknown, unknown> = {
        mode,
        fn: validatorFn
    };

    const transform = mode !== TransformMode.NONE ? ({
        ...columnValidationConfig,
        fn(value: any): any {
            if (validatorFn(value)) {
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
    config: FieldTransformConfig<T>, args?: T
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
    args?: T,
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
    const { field, args } = options;

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