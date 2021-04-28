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
    return type === FieldType.Long || type === FieldType.Double;
}

export const subtractConfig: FieldTransformConfig<SubtractArgs> = {
    name: 'subtract',
    type: FunctionDefinitionType.FIELD_TRANSFORM,
    process_mode: ProcessMode.INDIVIDUAL_VALUES,
    category: FunctionDefinitionCategory.NUMERIC,
    description: 'subtract a numeric value',
    create({ by = 1 } = {}, inputConfig) {
        if (isLargeNumberType(inputConfig?.field_config.type as FieldType)) {
            const decrementVal = toBigIntOrThrow(by);
            return (input: unknown) => subtractBigInt(input as bigint, decrementVal);
        }

        const decrementVal = by;
        return (input: unknown) => subtract(input as number, decrementVal);
    },
    accepts: [
        FieldType.Number,
        FieldType.Byte,
        FieldType.Short,
        FieldType.Integer,
        FieldType.Float,
        FieldType.Long,
        FieldType.Double
    ],
    argument_schema: {
        by: {
            type: FieldType.Number,
            array: false,
            description: 'How much to subtract, defaults to 1'
        }
    },
};

function subtract(num: number, by: number) {
    return num - by;
}

function subtractBigInt(num: bigint, by: bigint) {
    return num - by;
}
