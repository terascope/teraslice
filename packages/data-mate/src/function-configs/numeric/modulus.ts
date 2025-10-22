import { isBigInt, toBigIntOrThrow } from '@terascope/core-utils';
import { FieldType } from '@terascope/types';
import {
    FieldTransformConfig,
    ProcessMode,
    FunctionDefinitionType,
    FunctionDefinitionCategory
} from '../interfaces.js';

export interface ModulusArgs {
    readonly value: number;
}

function isLargeNumberType(type: FieldType | undefined) {
    if (type == null) return false;
    return type === FieldType.Long;
}

export const modulusConfig: FieldTransformConfig<ModulusArgs> = {
    name: 'modulus',
    aliases: ['mod'],
    type: FunctionDefinitionType.FIELD_TRANSFORM,
    process_mode: ProcessMode.INDIVIDUAL_VALUES,
    category: FunctionDefinitionCategory.NUMERIC,
    description: 'Returns the modulus from the input divided by the args value.',
    examples: [
        {
            args: { value: 2 },
            config: {
                version: 1,
                fields: { testField: { type: FieldType.Byte } }
            },
            field: 'testField',
            input: 10,
            output: 0
        },
        {
            args: { value: 2 },
            config: {
                version: 1,
                fields: { testField: { type: FieldType.Short } }
            },
            field: 'testField',
            input: 9,
            output: 1
        },
        {
            args: { value: -5 },
            config: {
                version: 1,
                fields: { testField: { type: FieldType.Number } }
            },
            field: 'testField',
            input: 10,
            output: 0
        },
        {
            args: { value: 10 },
            config: {
                version: 1,
                fields: { testField: { type: FieldType.Long } }
            },
            field: 'testField',
            input: 101,
            output: 1
        }
    ],
    create({ args: { value }, inputConfig }) {
        if (isLargeNumberType(inputConfig?.field_config.type as FieldType | undefined)) {
            return modulusFP(toBigIntOrThrow(value));
        }

        return modulusFP(value);
    },
    accepts: [
        FieldType.Number,
    ],
    argument_schema: {
        value: {
            type: FieldType.Number,
            array: false,
            description: 'Value to divide into the input.'
        }
    },
    required_arguments: ['value']
};

function modulusFP(value: bigint): (input: unknown) => bigint;
function modulusFP(value: number): (input: unknown) => number;
function modulusFP(value: number | bigint): (input: unknown) => number | bigint {
    const bigInt = isBigInt(value);
    return function _modulus(num) {
        if (bigInt && !isBigInt(num)) {
            return toBigIntOrThrow(num) % (value as bigint);
        }
        return (num as number) % (value as number);
    };
}
