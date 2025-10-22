import { isBigInt, toBigIntOrThrow } from '@terascope/core-utils';
import { FieldType } from '@terascope/types';
import {
    FieldTransformConfig,
    ProcessMode,
    FunctionDefinitionType,
    FunctionDefinitionCategory,
} from '../interfaces.js';

export interface MultiplyArgs {
    readonly value: number;
}

function isLargeNumberType(type: FieldType | undefined) {
    if (type == null) return false;
    return type === FieldType.Long;
}

export const multiplyConfig: FieldTransformConfig<MultiplyArgs> = {
    name: 'multiply',
    type: FunctionDefinitionType.FIELD_TRANSFORM,
    process_mode: ProcessMode.INDIVIDUAL_VALUES,
    category: FunctionDefinitionCategory.NUMERIC,
    description: 'Returns the product of the input multiplied by the args value',
    examples: [{
        args: { value: 5 },
        config: {
            version: 1,
            fields: { testField: { type: FieldType.Short } }
        },
        field: 'testField',
        input: 10,
        output: 50
    },
    {
        args: { value: -2 },
        config: {
            version: 1,
            fields: { testField: { type: FieldType.Number } }
        },
        field: 'testField',
        input: 10,
        output: -20
    },
    {
        args: { value: 2 },
        config: {
            version: 1,
            fields: { testField: { type: FieldType.Long } }
        },
        field: 'testField',
        input: 10,
        output: 20
    }],
    create({ args: { value }, inputConfig }) {
        if (isLargeNumberType(inputConfig?.field_config.type as FieldType | undefined)) {
            return multiplyFP(toBigIntOrThrow(value));
        }

        return multiplyFP(value);
    },
    accepts: [
        FieldType.Number,
    ],
    argument_schema: {
        value: {
            type: FieldType.Number,
            array: false,
            description: 'Value to multiply the input by'
        }
    },
    required_arguments: ['value']
};

function multiplyFP(value: bigint): (input: unknown) => bigint;
function multiplyFP(value: number): (input: unknown) => number;
function multiplyFP(value: number | bigint): (input: unknown) => number | bigint {
    const bigInt = isBigInt(value);
    return function _multiply(num) {
        if (bigInt && !isBigInt(num)) {
            return toBigIntOrThrow(num) * (value as bigint);
        }
        return (num as number) * (value as number);
    };
}
