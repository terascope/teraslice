import { toBigIntOrThrow } from '@terascope/utils';
import { FieldType } from '@terascope/types';
import {
    FieldTransformConfig,
    ProcessMode,
    FunctionDefinitionType,
    FunctionDefinitionCategory,
} from '../interfaces';

export interface DivideArgs {
    readonly by?: number
}

function isLargeNumberType(type: FieldType|undefined) {
    if (type == null) return false;
    return type === FieldType.Long;
}

export const divideConfig: FieldTransformConfig<DivideArgs> = {
    name: 'divide',
    type: FunctionDefinitionType.FIELD_TRANSFORM,
    process_mode: ProcessMode.INDIVIDUAL_VALUES,
    category: FunctionDefinitionCategory.NUMERIC,
    description: 'divide a numeric value',
    examples: [
        {
            args: { by: 5 },
            config: {
                version: 1,
                fields: { testField: { type: FieldType.Short } }
            },
            field: 'testField',
            input: 10,
            output: 2
        },
        {
            args: { by: 1 },
            config: {
                version: 1,
                fields: { testField: { type: FieldType.Number } }
            },
            field: 'testField',
            input: 10,
            output: 10
        }
    ],
    create({ by = 1 } = {}, inputConfig) {
        if (isLargeNumberType(inputConfig?.field_config.type as FieldType|undefined)) {
            return divideFP(toBigIntOrThrow(by));
        }

        return divideFP(by);
    },
    accepts: [
        FieldType.Number,
    ],
    argument_schema: {
        by: {
            type: FieldType.Number,
            array: false,
            description: 'How much to divide'
        }
    },
    required_arguments: ['by']
};

function divideFP(by: bigint): (input: unknown) => bigint;
function divideFP(by: number): (input: unknown) => number;
function divideFP(by: number|bigint): (input: unknown) => number|bigint {
    return function _divide(num) {
        return (num as number) / (by as number);
    };
}
