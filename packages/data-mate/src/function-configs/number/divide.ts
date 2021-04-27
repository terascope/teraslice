import { toFloatOrThrow } from '@terascope/utils';
import { FieldType } from '@terascope/types';
import {
    FieldTransformConfig, FunctionDefinitionType,
    ProcessMode, DataTypeFieldAndChildren
} from '../interfaces';

function divideReducer(
    acc: number,
    curr: number|bigint
): number {
    if (acc == null) return toFloatOrThrow(curr);
    return acc / toFloatOrThrow(curr);
}

function divideFn(value: unknown): bigint|number|null {
    if (!Array.isArray(value)) return null;

    return value.reduce(divideReducer) ?? null;
}

export const divideConfig:FieldTransformConfig = {
    name: 'divide',
    type: FunctionDefinitionType.FIELD_TRANSFORM,
    process_mode: ProcessMode.FULL_VALUES,
    description: 'Divide one or more values in a vector',
    create() {
        return divideFn;
    },
    argument_schema: {},
    accepts: [FieldType.Number],
    output_type(inputConfig: DataTypeFieldAndChildren): DataTypeFieldAndChildren {
        const { field_config, child_config } = inputConfig;

        return {
            field_config: {
                ...field_config,
                type: FieldType.Number
            },
            child_config
        };
    }
};
