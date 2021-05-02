import { toBigIntOrThrow } from '@terascope/utils';
import { FieldType } from '@terascope/types';
import {
    FieldTransformConfig,
    ProcessMode,
    FunctionDefinitionType,
    FunctionDefinitionCategory,
} from '../interfaces';

export interface AddArgs {
    readonly by?: number
}

function isLargeNumberType(type: FieldType|undefined) {
    if (type == null) return false;
    return type === FieldType.Long;
}

export const addConfig: FieldTransformConfig<AddArgs> = {
    name: 'add',
    type: FunctionDefinitionType.FIELD_TRANSFORM,
    process_mode: ProcessMode.INDIVIDUAL_VALUES,
    category: FunctionDefinitionCategory.NUMERIC,
    description: 'Add a numeric value to another',
    examples: [
        {
            args: { },
            config: {
                version: 1,
                fields: { testField: { type: FieldType.Byte } }
            },
            field: 'testField',
            input: 10,
            output: 11
        },
        {
            args: { by: 5 },
            config: {
                version: 1,
                fields: { testField: { type: FieldType.Short } }
            },
            field: 'testField',
            input: 10,
            output: 15
        },
        {
            args: { by: -5 },
            config: {
                version: 1,
                fields: { testField: { type: FieldType.Number } }
            },
            field: 'testField',
            input: 10,
            output: 5
        }
    ],
    create({ by = 1 } = {}, inputConfig) {
        if (isLargeNumberType(inputConfig?.field_config.type as FieldType|undefined)) {
            return addFP(toBigIntOrThrow(by));
        }

        return addFP(by);
    },
    accepts: [
        FieldType.Number,
    ],
    argument_schema: {
        by: {
            type: FieldType.Number,
            array: false,
            description: 'How much to add, defaults to 1'
        }
    },
};

function addFP(by: bigint): (input: unknown) => bigint;
function addFP(by: number): (input: unknown) => number;
function addFP(by: number|bigint): (input: unknown) => number|bigint {
    return function _add(num) {
        return (num as number) + (by as number);
    };
}
