import { DateFormat, FieldType } from '@terascope/types';
import { isISO8601 } from '@terascope/date-utils';
import {
    FieldValidateConfig, ProcessMode, FunctionDefinitionType,
    FunctionDefinitionCategory,
} from '../interfaces.js';
import { isIS8601FieldConfig } from './utils.js';

export const isISO8601Config: FieldValidateConfig = {
    name: 'isISO8601',
    type: FunctionDefinitionType.FIELD_VALIDATION,
    process_mode: ProcessMode.INDIVIDUAL_VALUES,
    category: FunctionDefinitionCategory.DATE,
    description: 'Returns the input if it is a valid ISO-8601 date, otherwise returns null',
    examples: [{
        args: {},
        config: {
            version: 1,
            fields: { testField: { type: FieldType.Number } }
        },
        field: 'testField',
        input: 102390933,
        output: null
    },
    {
        args: {},
        config: {
            version: 1,
            fields: { testField: { type: FieldType.String } }
        },
        field: 'testField',
        input: '2001-01-01T01:00:00.000Z',
        output: '2001-01-01T01:00:00.000Z'
    },
    {
        args: {},
        config: {
            version: 1,
            fields: {
                testField: {
                    type: FieldType.Date,
                    format: DateFormat.milliseconds
                }
            }
        },
        field: 'testField',
        input: 102390933,
        output: null
    }],
    argument_schema: {},
    create({ inputConfig }) {
        if (isIS8601FieldConfig(inputConfig)) {
            return alwaysTrue;
        }
        return isISO8601;
    },
    accepts: [FieldType.Date, FieldType.String, FieldType.Number],
};

function alwaysTrue(): boolean {
    return true;
}
