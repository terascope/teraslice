import { FieldType } from '@terascope/types';
import {
    FieldTransformConfig,
    ProcessMode,
    FunctionDefinitionType,
    DataTypeFieldAndChildren,
    FunctionDefinitionCategory
} from '../interfaces';

export const encodeURLConfig: FieldTransformConfig = {
    name: 'encodeURL',
    type: FunctionDefinitionType.FIELD_TRANSFORM,
    process_mode: ProcessMode.INDIVIDUAL_VALUES,
    category: FunctionDefinitionCategory.STRING,
    description: 'URL encodes a value',
    create() {
        return (input: unknown) => encodeURIComponent(input as string);
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
