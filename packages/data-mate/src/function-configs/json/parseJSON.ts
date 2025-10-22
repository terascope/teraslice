import { parseJSON, isNil } from '@terascope/core-utils';
import { FieldType } from '@terascope/types';
import {
    FieldTransformConfig,
    ProcessMode,
    FunctionDefinitionType,
    DataTypeFieldAndChildren,
    FunctionDefinitionCategory
} from '../interfaces.js';

export const parseJSONConfig: FieldTransformConfig = {
    name: 'parseJSON',
    type: FunctionDefinitionType.FIELD_TRANSFORM,
    process_mode: ProcessMode.FULL_VALUES,
    category: FunctionDefinitionCategory.JSON,
    description: 'Parses a JSON string and returns the value or object according to the arg options.',
    create() {
        return (input: unknown) => {
            if (isNil(input)) return null;
            return parseJSON(input as string);
        };
    },
    accepts: [FieldType.String],
    argument_schema: {},
    output_type(inputConfig: DataTypeFieldAndChildren): DataTypeFieldAndChildren {
        const { field_config } = inputConfig;
        return {
            field_config: {
                ...field_config,
                type: FieldType.Any
            },
        };
    }
};
