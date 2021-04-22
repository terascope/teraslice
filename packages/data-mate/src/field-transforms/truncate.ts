import { truncate } from '@terascope/utils';
import { FieldType } from '@terascope/types';
import {
    FieldTransformConfig,
    ProcessMode,
    FunctionDefinitionType,
    DataTypeFieldAndChildren
} from '../interfaces';

export interface TruncateConfig {
    len: number;
    ellipsis?: boolean;
}

export const truncateConfig: FieldTransformConfig<TruncateConfig> = {
    name: 'truncate',
    type: FunctionDefinitionType.FIELD_TRANSFORM,
    process_mode: ProcessMode.INDIVIDUAL_VALUES,
    description: 'Truncate a string value, by default it will add an ellipsis (...) if truncated.',
    create({ len, ellipsis }: TruncateConfig) {
        return (input: unknown) => truncate(input as string, len, ellipsis);
    },
    accepts: [FieldType.String],
    required_arguments: ['len'],
    output_type(inputConfig: DataTypeFieldAndChildren): DataTypeFieldAndChildren {
        const { field_config } = inputConfig;

        return {
            field_config: {
                ...field_config,
                type: FieldType.String
            },
        };
    }
};
