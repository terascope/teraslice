import { isBigInt, toBigIntOrThrow } from '@terascope/core-utils';
import { FieldType } from '@terascope/types';
import {
    FieldTransformConfig,
    ProcessMode,
    FunctionDefinitionType,
    FunctionDefinitionCategory
} from '../interfaces.js';

export interface SubtractArgs {
    readonly value: number;
}

function isLargeNumberType(type: FieldType | undefined) {
    if (type == null) return false;
    return type === FieldType.Long;
}

export const subtractConfig: FieldTransformConfig<SubtractArgs> = {
    name: 'subtract',
    type: FunctionDefinitionType.FIELD_TRANSFORM,
    process_mode: ProcessMode.INDIVIDUAL_VALUES,
    category: FunctionDefinitionCategory.NUMERIC,
    description: 'Returns the result of subtracting the args value from the input value',
    examples: [
        {
            args: { value: 1 },
            config: {
                version: 1,
                fields: { testField: { type: FieldType.Byte } }
            },
            field: 'testField',
            input: 10,
            output: 9
        },
        {
            args: { value: 5 },
            config: {
                version: 1,
                fields: { testField: { type: FieldType.Short } }
            },
            field: 'testField',
            input: 10,
            output: 5
        },
        {
            args: { value: -5 },
            config: {
                version: 1,
                fields: { testField: { type: FieldType.Number } }
            },
            field: 'testField',
            input: 10,
            output: 15
        },
        {
            args: { value: 2 },
            config: {
                version: 1,
                fields: { testField: { type: FieldType.Long } }
            },
            field: 'testField',
            input: 10,
            output: 8
        }
    ],
    create({ args: { value }, inputConfig }) {
        if (isLargeNumberType(inputConfig?.field_config.type as FieldType | undefined)) {
            return subtractFP(toBigIntOrThrow(value));
        }

        return subtractFP(value);
    },
    accepts: [
        FieldType.Number,
    ],
    argument_schema: {
        value: {
            type: FieldType.Number,
            array: false,
            description: 'Value to subtract from the input'
        }
    },
};

function subtractFP(value: bigint): (input: unknown) => bigint;
function subtractFP(value: number): (input: unknown) => number;
function subtractFP(value: number | bigint): (input: unknown) => number | bigint {
    const bigInt = isBigInt(value);
    return function _subtract(num) {
        if (bigInt && !isBigInt(num)) {
            return toBigIntOrThrow(num) - (value as bigint);
        }
        return (num as number) - (value as number);
    };
}
