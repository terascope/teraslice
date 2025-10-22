import {
    toFahrenheit
} from '@terascope/core-utils';
import { FieldType } from '@terascope/types';
import {
    FieldTransformConfig,
    ProcessMode,
    FunctionDefinitionType,
    FunctionDefinitionCategory,
} from '../interfaces.js';

export const toFahrenheitConfig: FieldTransformConfig = {
    name: 'toFahrenheit',
    type: FunctionDefinitionType.FIELD_TRANSFORM,
    process_mode: ProcessMode.INDIVIDUAL_VALUES,
    category: FunctionDefinitionCategory.NUMERIC,
    description: 'Returns the equivalent fahrenheit value from the celsius input.',
    examples: [
        {
            args: { },
            config: {
                version: 1,
                fields: { testField: { type: FieldType.Float } }
            },
            field: 'testField',
            input: 0,
            output: 32
        },
        {
            args: { },
            config: {
                version: 1,
                fields: { testField: { type: FieldType.Float } }
            },
            field: 'testField',
            input: 22,
            output: 71.6
        }
    ],
    create() {
        return toFahrenheit;
    },
    accepts: [
        FieldType.Number,
    ],
    argument_schema: {},
};
