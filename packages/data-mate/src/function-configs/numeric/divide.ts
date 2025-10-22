import { isBigInt, toBigIntOrThrow } from '@terascope/core-utils';
import { FieldType } from '@terascope/types';
import {
    FieldTransformConfig,
    ProcessMode,
    FunctionDefinitionType,
    FunctionDefinitionCategory
} from '../interfaces.js';

export interface DivideArgs {
    readonly value: number;
}

function isLargeNumberType(type: FieldType | undefined) {
    if (type == null) return false;
    return type === FieldType.Long;
}

export const divideConfig: FieldTransformConfig<DivideArgs> = {
    name: 'divide',
    type: FunctionDefinitionType.FIELD_TRANSFORM,
    process_mode: ProcessMode.INDIVIDUAL_VALUES,
    category: FunctionDefinitionCategory.NUMERIC,
    description: 'Returns the quotient from the input divided by the args value.',
    examples: [
        {
            args: { value: 5 },
            config: {
                version: 1,
                fields: { testField: { type: FieldType.Short } }
            },
            field: 'testField',
            input: 10,
            output: 2
        },
        {
            args: { value: 1 },
            config: {
                version: 1,
                fields: { testField: { type: FieldType.Number } }
            },
            field: 'testField',
            input: 10,
            output: 10
        },
        {
            args: { value: 2 },
            config: {
                version: 1,
                fields: { testField: { type: FieldType.Long } }
            },
            field: 'testField',
            input: 10,
            output: 5
        }
    ],
    create({ args: { value }, inputConfig }) {
        if (isLargeNumberType(inputConfig?.field_config.type as FieldType | undefined)) {
            return divideFP(toBigIntOrThrow(value));
        }

        return divideFP(value);
    },
    accepts: [
        FieldType.Number,
    ],
    argument_schema: {
        value: {
            type: FieldType.Number,
            array: false,
            description: 'Value to divide into the input'
        }
    },
    required_arguments: ['value']
};

function divideFP(value: bigint): (input: unknown) => bigint;
function divideFP(value: number): (input: unknown) => number;
function divideFP(value: number | bigint): (input: unknown) => number | bigint {
    const bigInt = isBigInt(value);
    return function _divide(num) {
        if (bigInt && !isBigInt(num)) {
            return toBigIntOrThrow(num) / (value as bigint);
        }
        return (num as number) / (value as number);
    };
}
