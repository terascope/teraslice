import { truncateFP } from '@terascope/core-utils';
import { FieldType } from '@terascope/types';
import {
    FieldTransformConfig,
    ProcessMode,
    FunctionDefinitionType,
    FunctionDefinitionCategory
} from '../interfaces.js';

export interface TruncateConfig {
    size: number;
}

export const truncateConfig: FieldTransformConfig<TruncateConfig> = {
    name: 'truncate',
    type: FunctionDefinitionType.FIELD_TRANSFORM,
    process_mode: ProcessMode.INDIVIDUAL_VALUES,
    category: FunctionDefinitionCategory.STRING,
    description: 'Limits the size of the input string to a specific length, if the length is greater than the specified size, the excess is removed',
    examples: [
        {
            args: { size: 4 },
            config: { version: 1, fields: { testField: { type: FieldType.String } } },
            field: 'testField',
            input: 'thisisalongstring',
            output: 'this'
        },
        {
            args: { size: 8 },
            config: { version: 1, fields: { testField: { type: FieldType.String } } },
            field: 'testField',
            input: 'Hello world',
            output: 'Hello wo'
        },
    ],
    create({ args: { size } }) {
        return truncateFP(size, false) as (value: unknown) => string;
    },
    accepts: [FieldType.String],
    required_arguments: ['size'],
    argument_schema: {
        size: {
            type: FieldType.Number,
            array: false,
            description: 'How long the string should be'
        }
    },
    validate_arguments(args) {
        if (args.size <= 0) {
            throw new Error(`Invalid parameter size, expected a positive integer, got ${args.size}`);
        }
    }
};
