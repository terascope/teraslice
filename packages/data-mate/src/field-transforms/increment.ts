import { toBigIntOrThrow } from '@terascope/utils';
import { FieldType } from '@terascope/types';
import {
    FieldTransformConfig,
    ProcessMode,
    FunctionDefinitionType,
} from '../interfaces';

export interface IncrementArgs {
    by?: number
}

function isLargeNumberType(type: FieldType|undefined) {
    if (type == null) return false;
    return type === FieldType.Long || type === FieldType.Double;
}

export const incrementConfig: FieldTransformConfig<IncrementArgs> = {
    name: 'increment',
    type: FunctionDefinitionType.FIELD_TRANSFORM,
    process_mode: ProcessMode.INDIVIDUAL_VALUES,
    description: 'Increment a numeric value',
    create({ by = 1 } = {}, inputConfig) {
        if (isLargeNumberType(inputConfig?.field_config.type as FieldType)) {
            const incrementVal = toBigIntOrThrow(by);
            return (input: unknown) => addBigInt(input as bigint, incrementVal);
        }

        const incrementVal = by;
        return (input: unknown) => add(input as number, incrementVal);
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
            description: 'How much to add, defaults to 1'
        }
    },
};

function add(num: number, by: number) {
    return num + by;
}

function addBigInt(num: bigint, by: bigint) {
    return num + by;
}
