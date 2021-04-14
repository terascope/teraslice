import { toBoolean } from '@terascope/utils';
import { FieldType } from '@terascope/types';
import {
    FieldTransformConfig,
    ProcessMode,
    FunctionDefinitionType,
    DataTypeFieldAndChildren
} from '../interfaces';

export const extractConfig: FieldTransformConfig = {
    name: 'extract',
    type: FunctionDefinitionType.FIELD_TRANSFORM,
    process_mode: ProcessMode.INDIVIDUAL_VALUES,
    description: 'Extract values from strings and objects',
    create() {
        return toBoolean;
    },
    accepts: [
        FieldType.Boolean,
        FieldType.Number,
        FieldType.String,
    ],
    // TODO: fix this
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
