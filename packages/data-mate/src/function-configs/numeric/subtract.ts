import { toBigIntOrThrow } from '@terascope/utils';
import { FieldType } from '@terascope/types';
import {
    FieldTransformConfig,
    ProcessMode,
    FunctionDefinitionType,
    FunctionDefinitionCategory,
} from '../interfaces';

export interface SubtractArgs {
    readonly by?: number
}

function isLargeNumberType(type: FieldType|undefined) {
    if (type == null) return false;
    return type === FieldType.Long;
}

export const subtractConfig: FieldTransformConfig<SubtractArgs> = {
    name: 'subtract',
    type: FunctionDefinitionType.FIELD_TRANSFORM,
    process_mode: ProcessMode.INDIVIDUAL_VALUES,
    category: FunctionDefinitionCategory.NUMERIC,
    description: 'Subtract a numeric value',
    examples: [
        {
            args: { },
            config: {
                version: 1,
                fields: { testField: { type: FieldType.Byte } }
            },
            field: 'testField',
            input: 10,
            output: 9
        },
        {
            args: { by: 5 },
            config: {
                version: 1,
                fields: { testField: { type: FieldType.Short } }
            },
            field: 'testField',
            input: 10,
            output: 5
        },
        {
            args: { by: -5 },
            config: {
                version: 1,
                fields: { testField: { type: FieldType.Number } }
            },
            field: 'testField',
            input: 10,
            output: 15
        }
    ],
    create({ by = 1 } = {}, inputConfig) {
        if (isLargeNumberType(inputConfig?.field_config.type as FieldType|undefined)) {
            return subtractFP(toBigIntOrThrow(by));
        }

        return subtractFP(by);
    },
    accepts: [
        FieldType.Number,
    ],
    argument_schema: {
        by: {
            type: FieldType.Number,
            array: false,
            description: 'How much to subtract, defaults to 1'
        }
    },
};

function subtractFP(by: bigint): (input: unknown) => bigint;
function subtractFP(by: number): (input: unknown) => number;
function subtractFP(by: number|bigint): (input: unknown) => number|bigint {
    return function _subtract(num) {
        return (num as number) - (by as number);
    };
}
