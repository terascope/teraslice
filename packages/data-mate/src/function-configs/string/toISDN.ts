import { parsePhoneNumber } from '@terascope/utils';
import { FieldType } from '@terascope/types';
import {
    FieldTransformConfig,
    ProcessMode,
    FunctionDefinitionType,
    DataTypeFieldAndChildren,
    FunctionDefinitionCategory
} from '../interfaces';

export const toISDNConfig: FieldTransformConfig = {
    name: 'toISDN',
    type: FunctionDefinitionType.FIELD_TRANSFORM,
    process_mode: ProcessMode.INDIVIDUAL_VALUES,
    category: FunctionDefinitionCategory.STRING,
    description: 'Parses a string or number to a fully validated phone number',
    create() {
        return (input: unknown) => parsePhoneNumber(input as string);
    },
    accepts: [
        FieldType.String,
        FieldType.Number,
        FieldType.Byte,
        FieldType.Short,
        FieldType.Integer,
        FieldType.Float,
        FieldType.Long,
        FieldType.Double
    ],
    output_type(inputConfig: DataTypeFieldAndChildren): DataTypeFieldAndChildren {
        const { field_config } = inputConfig;

        return {
            field_config: {
                ...field_config,
                type: FieldType.String
            }
        };
    }
};