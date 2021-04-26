import { isNil, truncate } from '@terascope/utils';
import { FieldType } from '@terascope/types';
import {
    FieldTransformConfig,
    ProcessMode,
    FunctionDefinitionType,
} from '../interfaces';

export interface TruncateConfig {
    size: number;
}

export const truncateConfig: FieldTransformConfig<TruncateConfig> = {
    name: 'truncate',
    type: FunctionDefinitionType.FIELD_TRANSFORM,
    process_mode: ProcessMode.INDIVIDUAL_VALUES,
    description: 'Truncate a string value',
    create({ size }: TruncateConfig) {
        return (input: unknown) => truncate(input as string, size, false);
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
            throw new Error(`Invalid parameter size, expected a positive integer, got ${args.size}`)
        }
    }
};
