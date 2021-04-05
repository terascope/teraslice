import { FieldType, DataTypeFieldConfig } from '@terascope/types';
import { ColumnTransformConfig } from '../../column';
import {
    FieldValidateConfig, ColumnValidateConfig, TransformType, TransformMode,
    VectorType, FunctionDefinitions, isFieldOperation
} from '../../index';
import { FieldTransformConfig, isFieldValidation, ProcessMode } from '../../interfaces';

// @TODO: fix this
function getVectorType(input: FieldType[]): VectorType[] {
    return input as unknown as VectorType[];
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
    const mode = getMode(fnDef);
    const type = isFieldValidation(fnDef) ? TransformType.VALIDATE : TransformType.TRANSFORM;

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
        argument_schema
    };
}
