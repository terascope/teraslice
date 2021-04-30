import { truncateFP } from '@terascope/utils';
import { FieldType } from '@terascope/types';
import {
    FieldTransformConfig,
    ProcessMode,
    FunctionDefinitionType,
    FunctionDefinitionCategory,
} from '../interfaces';

export interface TruncateConfig {
    size: number;
}

export const truncateConfig: FieldTransformConfig<TruncateConfig> = {
    name: 'truncate',
    type: FunctionDefinitionType.FIELD_TRANSFORM,
    process_mode: ProcessMode.INDIVIDUAL_VALUES,
    category: FunctionDefinitionCategory.STRING,
    description: 'Truncate a string value',
    create({ size }: TruncateConfig) {
        return truncateFP(size, false) as (value: unknown) => string;
    },
    examples: [
        {
            args: { size: 2 },
            config: { version: 1, fields: { example: { type: FieldType.String } } },
            field: 'example',
            input: 'example',
            output: 'ex'
        },
        {
            args: { size: 7 },
            config: { version: 1, fields: { example: { type: FieldType.String } } },
            field: 'example',
            input: 'example',
            output: 'example'
        },
        {
            args: { size: 100 },
            config: { version: 1, fields: { example: { type: FieldType.String } } },
            field: 'example',
            input: 'example',
            output: 'example'
        },
    ],
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
