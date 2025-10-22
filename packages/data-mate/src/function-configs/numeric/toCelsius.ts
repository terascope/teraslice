import {
    toCelsius
} from '@terascope/core-utils';
import { FieldType } from '@terascope/types';
import {
    FieldTransformConfig,
    ProcessMode,
    FunctionDefinitionType,
    FunctionDefinitionCategory,
} from '../interfaces.js';

export const toCelsiusConfig: FieldTransformConfig = {
    name: 'toCelsius',
    type: FunctionDefinitionType.FIELD_TRANSFORM,
    process_mode: ProcessMode.INDIVIDUAL_VALUES,
    category: FunctionDefinitionCategory.NUMERIC,
    description: 'Returns the equivalent celsius value from the fahrenheit input.',
    examples: [
        {
            args: { },
            config: {
                version: 1,
                fields: { testField: { type: FieldType.Float } }
            },
            field: 'testField',
            input: 32,
            output: 0
        },
        {
            args: { },
            config: {
                version: 1,
                fields: { testField: { type: FieldType.Float } }
            },
            field: 'testField',
            input: 69.8,
            output: 21
        }
    ],
    create() {
        return toCelsius;
    },
    accepts: [
        FieldType.Number,
    ],
    argument_schema: {},
};
