import { random } from '@terascope/core-utils';
import { FieldType } from '@terascope/types';
import {
    FieldTransformConfig,
    ProcessMode,
    FunctionDefinitionType,
    FunctionDefinitionCategory,
    DataTypeFieldAndChildren
} from '../interfaces.js';

export interface RandomArgs {
    readonly min: number;
    readonly max: number;
}

export const randomConfig: FieldTransformConfig<RandomArgs> = {
    name: 'random',
    type: FunctionDefinitionType.FIELD_TRANSFORM,
    process_mode: ProcessMode.INDIVIDUAL_VALUES,
    category: FunctionDefinitionCategory.NUMERIC,
    description: 'Returns a random number between the args min and max values.',
    examples: [{
        args: { min: 1, max: 1 },
        config: {
            version: 1,
            fields: { testField: { type: FieldType.Byte } }
        },
        field: 'testField',
        input: 1,
        output: 1
    }],
    create({ args: { min, max } }) {
        return function _random() {
            return random(min, max);
        };
    },
    accepts: [],
    argument_schema: {
        min: {
            type: FieldType.Number,
            array: false,
            description: 'The minimum value in the range'
        },
        max: {
            type: FieldType.Number,
            array: false,
            description: 'The maximum value in the range'
        }
    },
    required_arguments: ['min', 'max'],
    output_type(inputConfig: DataTypeFieldAndChildren): DataTypeFieldAndChildren {
        const { field_config } = inputConfig;

        return {
            field_config: {
                ...field_config,
                array: false,
                type: FieldType.Number
            },
            child_config: undefined
        };
    }
};
