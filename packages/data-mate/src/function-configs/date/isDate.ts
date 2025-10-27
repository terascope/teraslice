import { isMatch } from 'date-fns';
import { FieldType, DateFormat } from '@terascope/types';
import { primitiveToString, isValidDate } from '@terascope/core-utils';
import {
    FieldValidateConfig, ProcessMode, FunctionDefinitionType,
    FunctionDefinitionCategory
} from '../interfaces.js';

export interface IsDateArgs {
    format?: string | DateFormat;
}

export const isDateConfig: FieldValidateConfig<IsDateArgs> = {
    name: 'isDate',
    type: FunctionDefinitionType.FIELD_VALIDATION,
    process_mode: ProcessMode.INDIVIDUAL_VALUES,
    category: FunctionDefinitionCategory.DATE,
    description: 'Returns the input if it is a valid date, if format is provided the format will be applied to the validation.',
    examples: [{
        args: { format: 'yyyy-MM-dd' },
        config: {
            version: 1,
            fields: { testField: { type: FieldType.String } }
        },
        field: 'testField',
        input: '2019-10-22',
        output: '2019-10-22'
    },
    {
        args: { format: 'yyyy-MM-dd' },
        config: {
            version: 1,
            fields: { testField: { type: FieldType.String } }
        },
        field: 'testField',
        input: '10-22-2019',
        output: null
    },
    {
        args: { format: DateFormat.epoch },
        config: {
            version: 1,
            fields: { testField: { type: FieldType.Number } }
        },
        field: 'testField',
        input: 102390933,
        output: 102390933
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
    }],
    argument_schema: {
        format: {
            type: FieldType.String,
            description: `When the value is a string, this indicates the date string format.
See https://date-fns.org/v2.16.1/docs/parse for more info.
Default: iso_8601 for strings and epoch_millis for number`
        }
    },
    create({ args: { format } }) {
        if (!format || format in DateFormat) {
            return isValidDate;
        }

        return function isDate(input: unknown): boolean {
            return isMatch(primitiveToString(input), format);
        };
    },
    accepts: [FieldType.Date, FieldType.String, FieldType.Number]
};
