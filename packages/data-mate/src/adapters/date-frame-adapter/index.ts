import { FieldType, DataTypeFieldConfig } from '@terascope/types';
import { isNil } from 'lodash';
import { Column, ColumnTransformConfig } from '../../column';
import { DataFrame } from '../../data-frame';
import {
    FieldTransformConfig, isFieldTransform, isFieldValidation, ProcessMode,
    FieldValidateConfig, FunctionDefinitions, isFieldOperation
} from '../../interfaces';

import {
    ColumnValidateConfig, TransformType, TransformMode,
} from '../../column/interfaces';

import {
    VectorType,
} from '../../vector/interfaces';

// @TODO: fix this

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
    [FieldType.Long]: VectorType.Boolean,
    [FieldType.Double]: VectorType.Boolean,
    [FieldType.GeoJSON]: VectorType.GeoJSON,
    [FieldType.GeoPoint]: VectorType.GeoPoint,
    [FieldType.Boundary]: VectorType.GeoPoint,
    [FieldType.Geo]: VectorType.GeoPoint,
    [FieldType.Object]: VectorType.Object,
    [FieldType.Any]: VectorType.Any,
    /** FieldType tuple is not the same a VectorType Tuple */
    [FieldType.Tuple]: VectorType.Any,
};

function getVectorType(input: FieldType[]): VectorType[] {
    return input.map((fType) => FieldTypeToVectorDict[fType]);
}

export interface DateFrameAdapterOptions<T extends Record<string, any>> {
    args?: T,
    inputConfig?: DataTypeFieldConfig,
    field?: string;
}

export interface ColumnAdapterFn {
    column: (input: Column<any>) => Column<any>;
}

export interface FrameAdapterFn extends ColumnAdapterFn {
    frame: (input: DataFrame) => DataFrame
}

function getMode(fnDef: FunctionDefinitions): TransformMode {
    if (isFieldOperation(fnDef)) {
        const mode = fnDef.process_mode;
        if (mode === ProcessMode.INDIVIDUAL_VALUES) {
            return TransformMode.EACH_VALUE;
        }
    }

    return TransformMode.EACH;
}

function makeValidationOperation<T>(
    fnDef: FieldValidateConfig,
    options: DateFrameAdapterOptions<T>
): ColumnValidateConfig<any, T> {
    const { args } = options;
    const fn = fnDef.create(args ?? {});
    const { description, accepts: _accepts, argument_schema = {} } = fnDef;
    const accepts = getVectorType(_accepts);

    const mode = getMode(fnDef);
    const type = TransformType.VALIDATE;

    return {
        type,
        create() {
            return {
                mode,
                fn
            };
        },
        description,
        accepts,
        argument_schema,
    };
}

function makeTransformOperation<T>(
    fnDef: FieldTransformConfig,
    options: DateFrameAdapterOptions<T>
): ColumnTransformConfig<any, T> {
    const { args } = options;
    const fn = fnDef.create(args ?? {});
    const { description, accepts: _accepts, argument_schema = {} } = fnDef;
    const accepts = getVectorType(_accepts);

    const mode = getMode(fnDef);
    const type = TransformType.TRANSFORM;

    // @ts-expect-error
    const { field_config: output } = fnDef.output_type(
        { field_config: { type: FieldType.String } }
    );

    return {
        type,
        // @ts-expect-error
        create() {
            return {
                mode,
                fn
            };
        },
        description,
        accepts,
        argument_schema,
        output
    };
}

function validateColumn<T>(config: ColumnValidateConfig<any, T>) {
    return function _validateColumn(column: Column<any>): Column<any> {
        return column.validate<T>(config);
    };
}

function transformColumn<T>(config: ColumnTransformConfig<any, T>) {
    return function _transformColumn(column: Column): Column {
        // @ts-expect-error
        return column.transform<any, T>(config);
    };
}

function validateFrame<T>(config: ColumnValidateConfig<any, T>, field?: string) {
    return function _validateFrame(frame: DataFrame): DataFrame {
        if (isNil(field)) throw new Error('Must provide a field option when running a DataFrame');
        const col = frame.getColumnOrThrow(field);
        const validCol = col.validate(config);

        return frame.assign([validCol]);
    };
}

function transformFrame<T>(config: ColumnTransformConfig<any, T>, field?: string) {
    return function _transformFrame(frame: DataFrame): DataFrame {
        if (isNil(field)) throw new Error('Must provide a field option when running a DataFrame');
        const col = frame.getColumnOrThrow(field);
        const validCol = col.transform(config);

        return frame.assign([validCol]);
    };
}

export function dateFrameAdapter<T extends Record<string, any> = Record<string, unknown>>(
    fnDef: FieldValidateConfig<T>,
    options?: DateFrameAdapterOptions<T>
): FrameAdapterFn
export function dateFrameAdapter<T extends Record<string, any> = Record<string, unknown>>(
    fnDef: FieldTransformConfig<T>,
    options?: DateFrameAdapterOptions<T>
): FrameAdapterFn
export function dateFrameAdapter<T extends Record<string, any> = Record<string, unknown>>(
    fnDef: FunctionDefinitions,
    options: DateFrameAdapterOptions<T> = {}
): FrameAdapterFn {
    const { field } = options;

    if (isFieldValidation(fnDef)) {
        const operation = makeValidationOperation(fnDef, options);
        return {
            column: validateColumn<T>(operation),
            frame: validateFrame<T>(operation, field)
        };
    }

    if (isFieldTransform(fnDef)) {
        const operation = makeTransformOperation(fnDef, options);
        return {
            column: transformColumn<T>(operation),
            frame: transformFrame<T>(operation, field)
        };
    }

    throw new Error('Function definition is not supported');
}
