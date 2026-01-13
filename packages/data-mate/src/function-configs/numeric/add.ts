import { isBigInt, toBigIntOrThrow } from '@terascope/core-utils';
import { FieldType } from '@terascope/types';
import {
    FieldTransformConfig,
    ProcessMode,
    FunctionDefinitionType,
    FunctionDefinitionCategory
} from '../interfaces.js';

export interface AddArgs {
    readonly value: number;
}

function isLargeNumberType(type: FieldType | undefined) {
    if (type == null) return false;
    return type === FieldType.Long;
}

export const addConfig: FieldTransformConfig<AddArgs> = {
    name: 'add',
    type: FunctionDefinitionType.FIELD_TRANSFORM,
    process_mode: ProcessMode.INDIVIDUAL_VALUES,
    category: FunctionDefinitionCategory.NUMERIC,
    description: 'Returns the sum of the input and the args value.',
    examples: [
        {
            args: { value: 1 },
            config: {
                version: 1,
                fields: { testField: { type: FieldType.Byte } }
            },
            field: 'testField',
            input: 10,
            output: 11
        },
        {
            args: { value: 5 },
            config: {
                version: 1,
                fields: { testField: { type: FieldType.Short } }
            },
            field: 'testField',
            input: 10,
            output: 15
        },
        {
            args: { value: -5 },
            config: {
                version: 1,
                fields: { testField: { type: FieldType.Number } }
            },
            field: 'testField',
            input: 10,
            output: 5
        },
        {
            args: { value: 12 },
            config: {
                version: 1,
                fields: { testField: { type: FieldType.Long } }
            },
            field: 'testField',
            input: 12,
            output: 24
        }
    ],
    create({ args: { value }, inputConfig }) {
        if (isLargeNumberType(inputConfig?.field_config.type as FieldType | undefined)) {
            return addFP(toBigIntOrThrow(value));
        }

        return addFP(value);
    },
    accepts: [
        FieldType.Number,
    ],
    argument_schema: {
        value: {
            type: FieldType.Number,
            array: false,
            description: 'Value to add to the input'
        }
    },
    required_arguments: ['value']
};

function addFP(value: bigint): (input: unknown) => bigint;
function addFP(value: number): (input: unknown) => number;
function addFP(value: number | bigint): (input: unknown) => number | bigint {
    const bigInt = isBigInt(value);
    return function _add(num) {
        if (bigInt && !isBigInt(num)) {
            return toBigIntOrThrow(num) + (value as bigint);
        }
        return (num as number) + (value as number);
    };
}
