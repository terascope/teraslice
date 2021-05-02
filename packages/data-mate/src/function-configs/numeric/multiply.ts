import { toBigIntOrThrow } from '@terascope/utils';
import { FieldType } from '@terascope/types';
import {
    FieldTransformConfig,
    ProcessMode,
    FunctionDefinitionType,
    FunctionDefinitionCategory,
} from '../interfaces';

export interface MultiplyArgs {
    readonly by?: number
}

function isLargeNumberType(type: FieldType|undefined) {
    if (type == null) return false;
    return type === FieldType.Long;
}

export const multiplyConfig: FieldTransformConfig<MultiplyArgs> = {
    name: 'multiply',
    type: FunctionDefinitionType.FIELD_TRANSFORM,
    process_mode: ProcessMode.INDIVIDUAL_VALUES,
    category: FunctionDefinitionCategory.NUMERIC,
    description: 'multiply a numeric value',
    examples: [{
        args: { by: 5 },
        config: {
            version: 1,
            fields: { testField: { type: FieldType.Short } }
        },
        field: 'testField',
        input: 10,
        output: 50
    },
    {
        args: { by: -2 },
        config: {
            version: 1,
            fields: { testField: { type: FieldType.Number } }
        },
        field: 'testField',
        input: 10,
        output: -20
    }],
    create({ by = 1 } = {}, inputConfig) {
        if (isLargeNumberType(inputConfig?.field_config.type as FieldType|undefined)) {
            return multiplyFP(toBigIntOrThrow(by));
        }

        return multiplyFP(by);
    },
    accepts: [
        FieldType.Number,
    ],
    argument_schema: {
        by: {
            type: FieldType.Number,
            array: false,
            description: 'How much to multiply'
        }
    },
    required_arguments: ['by']
};

function multiplyFP(by: bigint): (input: unknown) => bigint;
function multiplyFP(by: number): (input: unknown) => number;
function multiplyFP(by: number|bigint): (input: unknown) => number|bigint {
    return function _multiply(num) {
        return (num as number) * (by as number);
    };
}
