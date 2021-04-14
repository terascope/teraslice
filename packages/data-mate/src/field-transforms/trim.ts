import { trimFP } from '@terascope/utils';
import { FieldType } from '@terascope/types';
import {
    FieldTransformConfig,
    ProcessMode,
    FunctionDefinitionType,
    DataTypeFieldAndChildren
} from '../interfaces';

export interface TrimArgs {
    char?: string;
}

export const trimConfig: FieldTransformConfig<TrimArgs> = {
    name: 'trim',
    type: FunctionDefinitionType.FIELD_TRANSFORM,
    process_mode: ProcessMode.INDIVIDUAL_VALUES,
    description: 'Trims white space, or removes chars if provided',
    create({ char } = {}) {
        return trimFP(char);
    },
    accepts: [FieldType.String],
    argument_schema: {
        char: {
            type: FieldType.String,
            array: false,
            description: 'optional, if provided it will remove the char or the sequence of chars provided if many are given, otherwise it will remove whitespace'
        }
    },
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
