import { FieldType, DataTypeFieldConfig } from '@terascope/types';
import { ColumnTransformConfig } from '../../column';
import {
    FieldValidateConfig, ColumnValidateConfig, TransformType, TransformMode,
    VectorType, FunctionDefinitions, isFieldOperation, isTransformOperation
} from '../../index';
import { FieldTransformConfig, isFieldValidation, ProcessMode } from '../../interfaces';

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
    inputConfig?: DataTypeFieldConfig
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

export function dateFrameAdapter<T extends Record<string, any> = Record<string, unknown>>(
    fnDef: FieldValidateConfig<T>,
    options?: DateFrameAdapterOptions<T>
): ColumnValidateConfig<any, T>
export function dateFrameAdapter<T extends Record<string, any> = Record<string, unknown>>(
    fnDef: FieldTransformConfig<T>,
    options?: DateFrameAdapterOptions<T>
): ColumnTransformConfig<any, T>
export function dateFrameAdapter<T extends Record<string, any> = Record<string, unknown>>(
    fnDef: FunctionDefinitions,
    options: DateFrameAdapterOptions<T> = {}
):any {
    const { args } = options;
    const fn = fnDef.create(args ?? {});
    const { description, accepts: _accepts, argument_schema = {} } = fnDef;
    const accepts = getVectorType(_accepts);
    accepts.push(VectorType.List);
    const mode = getMode(fnDef);
    const type = isFieldValidation(fnDef) ? TransformType.VALIDATE : TransformType.TRANSFORM;

    const operation = {
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

    if (isTransformOperation(fnDef)) {
        // @ts-expect-error
        const { field_config } = fnDef.output_type({ field_config: { type: FieldType.String } });
        // @ts-expect-error
        operation.output = field_config;
    }

    return operation;
}
