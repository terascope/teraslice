import { FieldType } from '@terascope/types';
import {
    FieldTransformConfig,
    ProcessMode,
    FunctionDefinitionType,
    DataTypeFieldAndChildren
} from '../interfaces';

export const decodeBase64Config: FieldTransformConfig = {
    name: 'decodeBase64',
    type: FunctionDefinitionType.FIELD_TRANSFORM,
    process_mode: ProcessMode.INDIVIDUAL_VALUES,
    description: 'Converts a base64 hash back to its value',
    create() {
        return (input: unknown) => Buffer.from(input as string, 'base64').toString('utf8');
    },
    accepts: [FieldType.String],
    output_type(inputConfig: DataTypeFieldAndChildren): DataTypeFieldAndChildren {
        const { field_config, child_config } = inputConfig;

        return {
            field_config: {
                ...field_config,
                type: FieldType.String
            },
            child_config
        };
    }
};
